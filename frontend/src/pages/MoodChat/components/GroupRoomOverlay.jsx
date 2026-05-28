import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useGroupChatSocket } from "../../../hooks/useGroupChatSocket";
import { fetchGroupChatMessages, leaveGroupChatRoom } from "../../../shared/api/groupChatApi";
import { defaultAvatarSrc } from "../../../shared/lib/defaultAvatar";
import { GroupChatRoomDetail } from "../../GroupChat/components/GroupChatRoomDetail";
import "../../GroupChat/groupChatStyles.css";

const API_BASE = import.meta.env.VITE_BACKSERVER || "http://localhost:8080";

function normalizeGroupMessage(message) {
  return {
    messageId: message?.messageId ?? message?.id,
    roomId: message?.roomId,
    senderId: Number(message?.senderId),
    senderName: message?.senderName || "회원",
    profileImageUrl: message?.profileImageUrl || "",
    content: message?.content || "",
    createdAt: message?.createdAt || "",
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

  const loadMessages = async (roomId) => {
    if (!roomId) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);

    try {
      const response = await fetchGroupChatMessages(roomId);
      const nextMessages = Array.isArray(response.data) ? response.data : [];
      setMessages(nextMessages.map(normalizeGroupMessage));
    } catch (error) {
      console.error("그룹 채팅 메시지 조회 실패", error);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
      onRoomUpdated?.();
    }
  };

  useEffect(() => {
    loadMessages(room?.roomId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.roomId]);

  const handleIncomingMessage = (incomingMessage) => {
    const normalized = normalizeGroupMessage(incomingMessage);

    setMessages((previousMessages) => {
      if (previousMessages.some((item) => Number(item.messageId) === Number(normalized.messageId))) {
        return previousMessages;
      }

      return [...previousMessages, normalized];
    });

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
        const response = await axios.post(`${API_BASE}/chat/rooms/${room.roomId}/messages`, {
          senderId: currentMemberId,
          content: trimmedMessage,
        });
        setMessages((previousMessages) => [
          ...previousMessages,
          normalizeGroupMessage(response.data),
        ]);
      }

      onRoomUpdated?.();
    } catch (error) {
      console.error("그룹 채팅 메시지 전송 실패", error);
    } finally {
      setIsSending(false);
      requestAnimationFrame(() => {
        messageInputRef.current?.focus();
      });
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
      console.error("그룹 채팅방 나가기 실패", error);
    }
  };

  const activeRoom = useMemo(
    () => ({
      roomId: room?.roomId,
      roomName: room?.roomName || "그룹 채팅방",
      roomDescription: room?.roomDescription || "",
      currentMemberId,
    }),
    [room, currentMemberId],
  );

  if (!room) {
    return null;
  }

  return (
    <div className="moodchat-groupOverlay" role="presentation" onClick={onClose}>
      <div className="moodchat-groupSheet" role="presentation" onClick={(event) => event.stopPropagation()}>
        <GroupChatRoomDetail
          activeRoom={activeRoom}
          messages={messages}
          connected={connected}
          currentMemberId={currentMemberId}
          currentMemberName={currentMember?.nickname || currentMember?.name || "회원"}
          currentMemberProfileImageUrl={currentMember?.profileImageUrl || defaultAvatarSrc}
          messageInputRef={messageInputRef}
          messageValue={message}
          onMessageChange={(event) => setMessage(event.target.value)}
          onSubmitMessage={handleSend}
          onLeaveRoom={handleLeave}
          onInviteMembers={() => onRequestInvite?.(room)}
          onProfileClick={onProfileClick}
          onBack={onClose}
        />
        {isLoadingMessages ? <p className="moodchat-overlayStatus">메시지를 불러오는 중입니다.</p> : null}
      </div>
    </div>
  );
}
