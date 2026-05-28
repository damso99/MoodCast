import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { DesktopShell } from "../../components/layout/DesktopShell";
import { MobileShell } from "../../components/layout/MobileShell";
import { useAuthStore } from "../../stores/useAuthStore";
import { useIsDesktop } from "../../hooks/useViewportWidth";
import { formatKoreanTime } from "../../shared/lib/dateTime";
import {
  createGroupChatRoom,
  deleteGroupChatMessage,
  fetchGroupChatMessages,
  fetchGroupChatRooms,
  inviteGroupChatMembers,
  leaveGroupChatRoom,
  markGroupChatRoomAsRead,
} from "../../shared/api/groupChatApi";
import { useGroupChatSocket } from "../../hooks/useGroupChatSocket";
import { GroupChatRoomDetail } from "./components/GroupChatRoomDetail";
import { GroupChatRoomList } from "./components/GroupChatRoomList";
import "./groupChatStyles.css";

const API_BASE = import.meta.env.VITE_BACKSERVER || "http://localhost:8080";

function normalizeRoom(room) {
  return {
    roomId: room?.roomId,
    roomName: room?.roomName || "Group Chat",
    roomDescription: room?.roomDescription || "",
    createdBy: room?.createdBy,
    createdAt: room?.createdAt,
    memberCount: Number(room?.memberCount || 0),
    lastMessage: room?.lastMessage || "",
    lastMessageAt: room?.lastMessageAt ? formatKoreanTime(room.lastMessageAt) : "",
    unreadCount: Number(room?.unreadCount || 0),
  };
}

function normalizeMessage(message) {
  return {
    messageId: message?.messageId ?? message?.id,
    roomId: message?.roomId,
    senderId: Number(message?.senderId),
    senderName: message?.senderName || "Member",
    profileImageUrl: message?.profileImageUrl || "",
    content: message?.content || "",
    createdAt: message?.createdAt ? formatKoreanTime(message.createdAt) : "",
    readCount: Number(message?.readCount || 0),
    unreadCount: Number(message?.unreadCount || 0),
    eventType: message?.eventType || "",
  };
}

function GroupChatBody({ desktop, onRoomOpenChange }) {
  const { member } = useAuthStore();
  const navigate = useNavigate();
  const currentMemberId = useMemo(() => Number(member?.memberId) || null, [member?.memberId]);
  const messageInputRef = useRef(null);
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [roomDescription, setRoomDescription] = useState("");
  const [invitedMemberIds, setInvitedMemberIds] = useState("");
  const [messageValue, setMessageValue] = useState("");
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [mobileRoomOpen, setMobileRoomOpen] = useState(false);
  const [error, setError] = useState("");

  const refreshRooms = async () => {
    if (!currentMemberId) {
      setRooms([]);
      return;
    }

    setIsLoadingRooms(true);

    try {
      const response = await fetchGroupChatRooms(currentMemberId);
      const nextRooms = Array.isArray(response.data) ? response.data : [];
      setRooms(nextRooms.map(normalizeRoom));
    } catch (requestError) {
      console.error("Group room list load failed", requestError);
      setRooms([]);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const refreshMessages = async (roomId) => {
    if (!roomId) {
      setMessages([]);
      return;
    }

    try {
      const response = await fetchGroupChatMessages(roomId, currentMemberId);
      const nextMessages = Array.isArray(response.data) ? response.data : [];
      setMessages(nextMessages.map(normalizeMessage));
      await markGroupChatRoomAsRead(roomId, currentMemberId);
    } catch (requestError) {
      console.error("Group messages load failed", requestError);
      setMessages([]);
    }
  };

  useEffect(() => {
    refreshRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMemberId]);

  const handleIncomingMessage = (payload) => {
    if (!payload) {
      return;
    }

    if (payload?.eventType === "CHAT_DELETE") {
      const deletedMessageId = Number(payload?.messageId ?? payload?.id);

      setMessages((previousMessages) =>
        previousMessages.filter((message) => Number(message.messageId) !== deletedMessageId),
      );
      refreshRooms();
      return;
    }

    const normalized = normalizeMessage(payload);

    setRooms((previousRooms) =>
      previousRooms.map((room) =>
        Number(room.roomId) === Number(normalized.roomId)
          ? {
              ...room,
              lastMessage: normalized.content,
              lastMessageAt: normalized.createdAt,
            }
          : room,
      ),
    );

    if (Number(activeRoom?.roomId) !== Number(normalized.roomId)) {
      refreshRooms();
      return;
    }

    setMessages((previousMessages) => {
      if (
        previousMessages.some(
          (message) => Number(message.messageId) === Number(normalized.messageId),
        )
      ) {
        return previousMessages;
      }

      return [...previousMessages, normalized];
    });

    if (currentMemberId && Number(normalized.senderId) !== currentMemberId) {
      markGroupChatRoomAsRead(normalized.roomId, currentMemberId).catch(() => {});
    }
  };

  const { connected, sendMessage } = useGroupChatSocket(
    currentMemberId,
    activeRoom?.roomId,
    handleIncomingMessage,
  );

  const openRoom = async (room) => {
    if (!room?.roomId) {
      return;
    }

    setActiveRoom(room);
    setMessages([]);
    setError("");
    setMobileRoomOpen(true);
    await refreshMessages(room.roomId);
  };

  const createRoom = async (event) => {
    event.preventDefault();
    if (!currentMemberId) {
      return;
    }

    const invitedIds = invitedMemberIds
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value) && value > 0);

    try {
      await createGroupChatRoom({
        roomName,
        roomDescription,
        creatorId: currentMemberId,
        memberIds: invitedIds,
      });

      setRoomName("");
      setRoomDescription("");
      setInvitedMemberIds("");
      await refreshRooms();
    } catch (requestError) {
      console.error("Group room creation failed", requestError);
      setError(requestError.response?.data?.message || "Unable to create room.");
    }
  };

  const inviteMembers = async () => {
    if (!activeRoom?.roomId) {
      return;
    }

    const invitedIds = window.prompt("Enter memberId values separated by commas.");
    if (!invitedIds) {
      return;
    }

    const memberIds = invitedIds
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value) && value > 0);

    try {
      await inviteGroupChatMembers(activeRoom.roomId, { memberIds });
      await refreshRooms();
    } catch (requestError) {
      console.error("Group invite failed", requestError);
      setError(requestError.response?.data?.message || "Unable to invite members.");
    }
  };

  const leaveRoomHandler = async () => {
    if (!activeRoom?.roomId || !currentMemberId) {
      return;
    }

    try {
      await leaveGroupChatRoom(activeRoom.roomId, currentMemberId);
      setActiveRoom(null);
      setMessages([]);
      setMobileRoomOpen(false);
      await refreshRooms();
    } catch (requestError) {
      console.error("Group room leave failed", requestError);
      setError(requestError.response?.data?.message || "Unable to leave room.");
    }
  };

  const handleSubmitMessage = async (event) => {
    event.preventDefault();

    const trimmedValue = messageValue.trim();
    if (!trimmedValue || !activeRoom?.roomId || !currentMemberId || isSending) {
      return;
    }

    setIsSending(true);
    setMessageValue("");

    try {
      const published = sendMessage(activeRoom.roomId, {
        senderId: currentMemberId,
        content: trimmedValue,
      });

      if (!published) {
        const response = await axios.post(`${API_BASE}/chat/rooms/${activeRoom.roomId}/messages`, {
          senderId: currentMemberId,
          content: trimmedValue,
        });

        setMessages((previousMessages) => [
          ...previousMessages,
          normalizeMessage(response.data),
        ]);
      }

      await markGroupChatRoomAsRead(activeRoom.roomId, currentMemberId).catch(() => {});
      await refreshRooms();
    } catch (requestError) {
      console.error("Group message send failed", requestError);
      setError(requestError.response?.data?.message || "Unable to send message.");
    } finally {
      setIsSending(false);
      requestAnimationFrame(() => {
        messageInputRef.current?.focus();
      });
    }
  };

  const handleDeleteMessage = async (item) => {
    if (!activeRoom?.roomId || !currentMemberId || !item?.messageId) {
      return;
    }

    try {
      await deleteGroupChatMessage(activeRoom.roomId, item.messageId, currentMemberId);
    } catch (requestError) {
      console.error("Group message delete failed", requestError);
      setError(requestError.response?.data?.message || "메시지를 삭제하지 못했습니다.");
    }
  };

  useEffect(() => {
    onRoomOpenChange?.(mobileRoomOpen);
  }, [mobileRoomOpen, onRoomOpenChange]);

  const roomList = (
    <GroupChatRoomList
      rooms={rooms}
      activeRoomId={activeRoom?.roomId}
      isLoading={isLoadingRooms}
      roomName={roomName}
      roomDescription={roomDescription}
      invitedMemberIds={invitedMemberIds}
      onRoomNameChange={(event) => setRoomName(event.target.value)}
      onRoomDescriptionChange={(event) => setRoomDescription(event.target.value)}
      onInvitedMemberIdsChange={(event) => setInvitedMemberIds(event.target.value)}
      onCreateRoom={createRoom}
      onSelectRoom={openRoom}
    />
  );

  const roomDetail = (
    <GroupChatRoomDetail
      activeRoom={activeRoom}
      messages={messages}
      connected={connected}
      currentMemberId={currentMemberId}
      messageInputRef={messageInputRef}
      messageValue={messageValue}
      onMessageChange={(event) => setMessageValue(event.target.value)}
      onSubmitMessage={handleSubmitMessage}
      onDeleteMessage={handleDeleteMessage}
      onLeaveRoom={leaveRoomHandler}
      onInviteMembers={inviteMembers}
      onProfileClick={(memberId) => {
        if (memberId) {
          navigate(`/app/user/${memberId}`);
        }
      }}
      onBack={() => {
        setActiveRoom(null);
        setMobileRoomOpen(false);
      }}
    />
  );

  if (!desktop) {
    return (
      <section className="group-chat-mobile-shell">
        {!mobileRoomOpen ? roomList : roomDetail}
        {error ? <p className="group-chat-error">{error}</p> : null}
      </section>
    );
  }

  return (
    <section className="group-chat-desktop-shell">
      <div className="group-chat-hero">
        <strong>Group Chat</strong>
        <p>{connected ? "Connected" : "Connecting..."}</p>
      </div>
      <div className="group-chat-grid">
        {roomList}
        {roomDetail}
      </div>
      {error ? <p className="group-chat-error">{error}</p> : null}
    </section>
  );
}

export function GroupChatPage() {
  const desktop = useIsDesktop();

  if (!desktop) {
    return (
      <MobileShell title="Group Chat" hideSearch fixedContent hideBottomNav={false}>
        <GroupChatBody desktop={false} />
      </MobileShell>
    );
  }

  return (
    <DesktopShell>
      <GroupChatBody desktop />
    </DesktopShell>
  );
}
