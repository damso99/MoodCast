import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useGroupChatSocket } from "../../../hooks/useGroupChatSocket";
import {
  deleteGroupChatMessage,
  fetchGroupChatMessages,
  leaveGroupChatRoom,
  updateGroupChatRoomRead,
} from "../../../shared/api/groupChatApi";
import { formatKoreanTime } from "../../../shared/lib/dateTime";
import { parseChatContent, serializeChatContent } from "../../../shared/lib/chatContent";
import { GroupChatRoomDetail } from "../../GroupChat/components/GroupChatRoomDetail";

const API_BASE = import.meta.env.VITE_BACKSERVER || "http://localhost:8080";
function normalizeGroupMessage(message, timeCache) {
  const messageKey = message?.messageId ?? message?.id;
  const parsedContent = parseChatContent(message?.content ?? "");
  const cachedTime = timeCache?.get?.(messageKey);
  const computedTime = message?.time || (message?.createdAt ? formatKoreanTime(message.createdAt) : "");
  const time = cachedTime || computedTime;

  if (timeCache && time && !cachedTime) {
    timeCache.set(messageKey, time);
  }

  return {
    messageId: message?.messageId ?? message?.id,
    roomId: message?.roomId,
    senderId: Number(message?.senderId),
    senderName: message?.senderName || "Member",
    profileImageUrl: message?.profileImageUrl || "",
    content: parsedContent.text || "",
    imageUrls: parsedContent.imageUrls,
    rawContent: message?.content || "",
    time,
    createdAt: message?.createdAt || "",
    readCount: Number(message?.readCount || 0),
    unreadCount: Number(message?.unreadCount || 0),
    eventType: message?.eventType || "",
    isPending: Boolean(message?.isPending),
  };
}

function getLatestConfirmedMessageId(messages) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const messageId = Number(messages[index]?.messageId);
    if (Number.isFinite(messageId) && messageId > 0) {
      return messageId;
    }
  }

  return null;
}

export function GroupRoomOverlay({
  room,
  currentMember,
  onClose,
  onProfileClick,
  onRequestInvite,
  onRoomUpdated,
}) {
  const messageInputRef = useRef(null);
  const groupMessageTimeCacheRef = useRef(new Map());
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const lastSentReadMessageIdRef = useRef(0);
  const currentMemberId = Number(currentMember?.memberId) || null;
  const notifyRoomUpdated = () => {
    window.setTimeout(() => {
      onRoomUpdated?.();
    }, 150);
  };

  const syncRoomReadState = async (roomId, lastReadMessageId) => {
    const numericLastReadMessageId = Number(lastReadMessageId);
    if (
      !roomId ||
      !currentMemberId ||
      !Number.isFinite(numericLastReadMessageId) ||
      numericLastReadMessageId <= 0
    ) {
      return;
    }

    if (lastSentReadMessageIdRef.current >= numericLastReadMessageId) {
      return;
    }

    lastSentReadMessageIdRef.current = numericLastReadMessageId;
    const payload = {
      memberId: currentMemberId,
      lastReadMessageId: numericLastReadMessageId,
    };

    if (sendReadEvent(roomId, payload)) {
      notifyRoomUpdated();
      return;
    }

    try {
      await updateGroupChatRoomRead(roomId, payload);
      notifyRoomUpdated();
    } catch (error) {
      console.error("Group read sync failed", error);
    }
  };

  const loadMessages = async (roomId, shouldMarkRead = true) => {
    if (!roomId) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);

    try {
      const response = await fetchGroupChatMessages(roomId, currentMemberId);
      const normalizedMessages = Array.isArray(response.data)
        ? response.data.map((item) => normalizeGroupMessage(item, groupMessageTimeCacheRef.current))
        : [];

      setMessages(normalizedMessages);

      if (shouldMarkRead) {
        const lastMessageId = getLatestConfirmedMessageId(normalizedMessages);
        if (lastMessageId) {
          await syncRoomReadState(roomId, lastMessageId);
        }
      }
    } catch (error) {
      console.error("Group messages load failed", error);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
      onRoomUpdated?.();
    }
  };

  useEffect(() => {
    lastSentReadMessageIdRef.current = 0;
    loadMessages(room?.roomId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.roomId, currentMemberId]);

  useEffect(() => {
    if (!room?.roomId || !messages.length) {
      return;
    }

    const lastMessageId = getLatestConfirmedMessageId(messages);
    if (!lastMessageId) {
      return;
    }

    syncRoomReadState(room.roomId, lastMessageId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, room?.roomId]);

  const handleIncomingMessage = (incomingMessage) => {
    if (incomingMessage?.eventType === "CHAT_DELETE") {
      const deletedMessageId = Number(incomingMessage?.messageId ?? incomingMessage?.id);

      setMessages((previousMessages) =>
        previousMessages.filter((item) => Number(item.messageId) !== deletedMessageId),
      );
      onRoomUpdated?.();
      return;
    }

    const normalized = normalizeGroupMessage(incomingMessage, groupMessageTimeCacheRef.current);

    setMessages((previousMessages) => {
      const pendingIndex = previousMessages.findIndex(
        (item) =>
          item.isPending &&
          Number(item.senderId) === Number(normalized.senderId) &&
          item.content === normalized.content,
      );

      if (pendingIndex >= 0) {
        const nextMessages = [...previousMessages];
        nextMessages[pendingIndex] = normalized;
        return nextMessages;
      }

      if (
        previousMessages.some(
          (item) => Number(item.messageId) === Number(normalized.messageId),
        )
      ) {
        return previousMessages;
      }

      return [...previousMessages, normalized];
    });

    if (currentMemberId && Number(normalized.senderId) !== currentMemberId) {
      syncRoomReadState(room?.roomId, normalized.messageId).catch(() => {});
    }

    onRoomUpdated?.();
  };

  const { connected, sendMessage, sendReadEvent } = useGroupChatSocket(
    currentMemberId,
    room?.roomId,
    handleIncomingMessage,
    async (payload) => {
      if (!payload || Number(payload.memberId) === Number(currentMemberId)) {
        return;
      }

      await loadMessages(room?.roomId, false);
    },
  );

  const handleSend = async (eventOrPayload = {}) => {
    if (typeof eventOrPayload?.preventDefault === "function") {
      eventOrPayload.preventDefault();
    }

    const payload =
      eventOrPayload && typeof eventOrPayload === "object" && typeof eventOrPayload.preventDefault !== "function"
        ? eventOrPayload
        : {};
    const trimmedMessage =
      typeof payload.text === "string" ? payload.text.trim() : message.trim();
    const imageUrls = Array.isArray(payload.imageUrls) ? payload.imageUrls : [];

    if ((!trimmedMessage && imageUrls.length === 0) || !room?.roomId || !currentMemberId || isSending) {
      return;
    }

    setIsSending(true);

    try {
      const content = serializeChatContent({
        text: trimmedMessage,
        imageUrls,
      });

      if (!content) {
        return;
      }

      const pendingMessage = normalizeGroupMessage({
        messageId: `pending-${Date.now()}`,
        roomId: room.roomId,
        senderId: currentMemberId,
        senderName: currentMember?.memberName || currentMember?.nickname || "나",
        profileImageUrl: currentMember?.profileImageUrl || "",
        content,
        createdAt: new Date().toISOString(),
        readCount: 0,
        unreadCount: 0,
        eventType: "",
        isPending: true,
      }, groupMessageTimeCacheRef.current);

      setMessages((previousMessages) => [...previousMessages, pendingMessage]);

      const published = sendMessage(room.roomId, {
        senderId: currentMemberId,
        content,
      });

      if (!published) {
        const response = await axios.post(`${API_BASE}/chat/rooms/${room.roomId}/messages`, {
          senderId: currentMemberId,
          content,
        });

        const savedMessage = normalizeGroupMessage(response.data, groupMessageTimeCacheRef.current);
        setMessages((previousMessages) => {
            const pendingIndex = previousMessages.findIndex(
              (item) =>
                item.isPending &&
                Number(item.senderId) === Number(savedMessage.senderId) &&
                item.rawContent === savedMessage.rawContent,
            );

          if (pendingIndex >= 0) {
            const nextMessages = [...previousMessages];
            nextMessages[pendingIndex] = savedMessage;
            return nextMessages;
          }

          return [...previousMessages, savedMessage];
        });
      }

      const lastMessageId = getLatestConfirmedMessageId(messages);
      if (lastMessageId) {
        await syncRoomReadState(room.roomId, lastMessageId);
      }

      onRoomUpdated?.();
      setMessage("");
    } catch (error) {
      console.error("Group message send failed", error);
    } finally {
      setIsSending(false);
      requestAnimationFrame(() => {
        messageInputRef.current?.focus();
      });
    }
  };

  const handleDeleteMessage = async (item) => {
    if (!room?.roomId || !currentMemberId || !item?.messageId) {
      return;
    }

    try {
      await deleteGroupChatMessage(room.roomId, item.messageId, currentMemberId);
      setMessages((previousMessages) =>
        previousMessages.filter(
          (messageItem) => Number(messageItem.messageId) !== Number(item.messageId),
        ),
      );
    } catch (error) {
      console.error("Group message delete failed", error);
    }
  };

  const handleLeave = async () => {
    if (!room?.roomId || !currentMemberId) {
      return;
    }

    try {
      await leaveGroupChatRoom(room.roomId, currentMemberId);
      onRoomUpdated?.();
      onClose?.();
    } catch (error) {
      console.error("Group room leave failed", error);
    }
  };

  const activeRoom = useMemo(
    () => ({
      roomId: room?.roomId,
      roomName: room?.roomName || "Group Chat",
      roomDescription: room?.roomDescription || "",
      memberCount: room?.memberCount || 0,
      currentMemberId,
    }),
    [room, currentMemberId],
  );

  if (!room) {
    return null;
  }

  return (
    <>
      <GroupChatRoomDetail
        activeRoom={activeRoom}
        messages={messages}
        connected={connected}
        currentMemberId={currentMemberId}
        messageInputRef={messageInputRef}
        messageValue={message}
        onMessageChange={(event) => setMessage(event.target.value)}
        onSubmitMessage={handleSend}
        onDeleteMessage={handleDeleteMessage}
        onLeaveRoom={handleLeave}
        onInviteMembers={() => onRequestInvite?.(room)}
        onProfileClick={onProfileClick}
        onBack={onClose}
      />
      {isLoadingMessages ? <p className="moodchat-overlayStatus">메시지를 불러오는 중...</p> : null}
    </>
  );
}
