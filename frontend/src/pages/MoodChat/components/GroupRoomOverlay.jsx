import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useGroupChatSocket } from "../../../hooks/useGroupChatSocket";
import {
  fetchGroupChatMessages,
  deleteGroupChatMessage,
  leaveGroupChatRoom,
  markGroupChatRoomAsRead,
} from "../../../shared/api/groupChatApi";
import { formatKoreanTime } from "../../../shared/lib/dateTime";
import { GroupChatRoomDetail } from "../../GroupChat/components/GroupChatRoomDetail";

const API_BASE = import.meta.env.VITE_BACKSERVER || "http://localhost:8080";

function normalizeGroupMessage(message) {
  return {
    messageId: message?.messageId ?? message?.id,
    roomId: message?.roomId,
    senderId: Number(message?.senderId),
    senderName: message?.senderName || "Member",
    profileImageUrl: message?.profileImageUrl || "",
    content: message?.content || "",
    createdAt: formatKoreanTime(message?.createdAt) || message?.createdAt || "",
    readCount: Number(message?.readCount || 0),
    unreadCount: Number(message?.unreadCount || 0),
    eventType: message?.eventType || "",
  };
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
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const currentMemberId = Number(currentMember?.memberId) || null;

  const syncRoomReadState = async (roomId) => {
    if (!roomId || !currentMemberId) {
      return;
    }

    try {
      await markGroupChatRoomAsRead(roomId, currentMemberId);
    } catch (error) {
      console.error("Group read sync failed", error);
    }
  };

  const loadMessages = async (roomId) => {
    if (!roomId) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);

    try {
      const response = await fetchGroupChatMessages(roomId, currentMemberId);
      const nextMessages = Array.isArray(response.data) ? response.data : [];
      setMessages(nextMessages.map(normalizeGroupMessage));
      await syncRoomReadState(roomId);
    } catch (error) {
      console.error("Group messages load failed", error);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
      onRoomUpdated?.();
    }
  };

  useEffect(() => {
    loadMessages(room?.roomId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.roomId, currentMemberId]);

  const handleIncomingMessage = (incomingMessage) => {
    if (incomingMessage?.eventType === "CHAT_DELETE") {
      const deletedMessageId = Number(incomingMessage?.messageId ?? incomingMessage?.id);

      setMessages((previousMessages) =>
        previousMessages.filter(
          (item) => Number(item.messageId) !== deletedMessageId,
        ),
      );
      onRoomUpdated?.();
      return;
    }

    const normalized = normalizeGroupMessage(incomingMessage);

    setMessages((previousMessages) => {
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
      syncRoomReadState(room?.roomId);
    }

    onRoomUpdated?.();
  };

  const { connected, sendMessage } = useGroupChatSocket(
    currentMemberId,
    room?.roomId,
    handleIncomingMessage,
  );

  const handleSend = async (event) => {
    event.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage || !room?.roomId || !currentMemberId || isSending) {
      return;
    }

    setIsSending(true);
    setMessage("");

    try {
      const published = sendMessage(room.roomId, {
        senderId: currentMemberId,
        content: trimmedMessage,
      });

      if (!published) {
        const response = await axios.post(
          `${API_BASE}/chat/rooms/${room.roomId}/messages`,
          {
            senderId: currentMemberId,
            content: trimmedMessage,
          },
        );

        setMessages((previousMessages) => [
          ...previousMessages,
          normalizeGroupMessage(response.data),
        ]);
      }

      await syncRoomReadState(room.roomId);
      onRoomUpdated?.();
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
          (message) => Number(message.messageId) !== Number(item.messageId),
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
      {isLoadingMessages ? <p className="moodchat-overlayStatus">Loading messages...</p> : null}
    </>
  );
}
