import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { DesktopShell } from "../../components/layout/DesktopShell";
import { MobileShell } from "../../components/layout/MobileShell";
import { useIsDesktop } from "../../hooks/useViewportWidth";
import styles from "./MoodChatPage.module.css";

const API_BASE = import.meta.env.VITE_BACKSERVER || "http://localhost:8080";
const DEFAULT_CURRENT_USER_ID = null;
const MEMBER_STORAGE_KEY = "moodcast-member";

function formatMessageTime(createdAt) {
  if (!createdAt) {
    return "";
  }

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function normalizeIncomingMessage(message, currentUserId) {
  const senderId = Number(message?.senderId);

  return {
    id:
      message?.chatId ??
      message?.id ??
      `${senderId}-${message?.createdAt ?? Date.now()}`,
    sender: senderId === currentUserId ? "me" : "them",
    text: message?.content ?? message?.text ?? "",
    time: formatMessageTime(message?.createdAt) || message?.time || "",
    senderId,
    receiverId: Number(message?.receiverId),
    createdAt: message?.createdAt ?? new Date().toISOString(),
    isRead: message?.isRead ?? 0,
  };
}

function readStoredMember() {
  if (typeof window === "undefined") {
    return null;
  }

  const memberText = window.sessionStorage.getItem(MEMBER_STORAGE_KEY);
  if (!memberText) {
    return null;
  }

  try {
    return JSON.parse(memberText);
  } catch {
    return null;
  }
}

function readCurrentMemberId() {
  const member = readStoredMember();
  const memberId = Number(member?.memberId);

  return Number.isFinite(memberId) && memberId > 0 ? memberId : DEFAULT_CURRENT_USER_ID;
}

function ChatBody({ desktop }) {
  const currentMemberId = useMemo(() => readCurrentMemberId(), []);
  const messageListRef = useRef(null);
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [isRoomOpen, setIsRoomOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const loadThreads = async () => {
    if (!currentMemberId) {
      setThreads([]);
      return;
    }

    setIsLoadingThreads(true);
    setError("");

    try {
      const response = await axios.get(`${API_BASE}/chat/threads`, {
        params: { memberId: currentMemberId },
      });
      setThreads(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      console.error("채팅 리스트 조회 실패", requestError);
      setThreads([]);
      setError("채팅 리스트를 불러오지 못했습니다.");
    } finally {
      setIsLoadingThreads(false);
    }
  };

  const loadMessages = async (partnerThread) => {
    if (!currentMemberId || !partnerThread?.partnerMemberId) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    setError("");

    try {
      const response = await axios.get(`${API_BASE}/chat/messages`, {
        params: {
          memberId: currentMemberId,
          partnerId: partnerThread.partnerMemberId,
        },
      });
      const list = Array.isArray(response.data) ? response.data : [];
      setMessages(list.map((item) => normalizeIncomingMessage(item, currentMemberId)));
    } catch (requestError) {
      console.error("메시지 조회 실패", requestError);
      setMessages([]);
      setError("메시지를 불러오지 못했습니다.");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMemberId]);

  useEffect(() => {
    const messageListElement = messageListRef.current;

    if (!messageListElement) {
      return;
    }

    messageListElement.scrollTop = messageListElement.scrollHeight;
  }, [messages, isRoomOpen, activeThread]);

  const openThread = (thread) => {
    setActiveThread(thread);
    setIsRoomOpen(true);
    setMessage("");
    loadMessages(thread);
  };

  const handleExitRoom = () => {
    setIsRoomOpen(false);
    setActiveThread(null);
    setMessages([]);
    setMessage("");
    setError("");
  };

  const handleSend = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || !activeThread || !currentMemberId) {
      return;
    }

    setIsSending(true);
    setError("");

    const createdAt = new Date().toISOString();
    const draftMessage = {
      id: `draft-${Date.now()}`,
      sender: "me",
      text: trimmedMessage,
      time: formatMessageTime(createdAt),
      senderId: currentMemberId,
      receiverId: activeThread.partnerMemberId,
      createdAt,
      isRead: 0,
    };

    try {
      await axios.post(`${API_BASE}/chat/send`, {
        content: trimmedMessage,
        senderId: currentMemberId,
        receiverId: activeThread.partnerMemberId,
        createdAt,
        isRead: 0,
      });

      setMessages((prevMessages) => [...prevMessages, draftMessage]);
      setMessage("");
      await loadMessages(activeThread);
      await loadThreads();
    } catch (requestError) {
      console.error("메시지 전송 실패", requestError);
      setError("메시지 전송에 실패했습니다.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await handleSend();
  };

  const threadList = (
    <div className={styles.threadList}>
      {isLoadingThreads ? <p className={styles.statusText}>채팅 리스트를 불러오는 중입니다.</p> : null}
      {!isLoadingThreads && threads.length === 0 ? (
        <p className={styles.emptyState}>대화 중인 채팅방이 없습니다.</p>
      ) : null}
      {threads.map((thread) => (
        <button
          key={thread.partnerMemberId}
          type="button"
          className={`${styles.threadItem} ${activeThread?.partnerMemberId === thread.partnerMemberId ? styles.active : ""}`}
          onClick={() => openThread(thread)}
        >
          <div className={styles.threadContent}>
            <strong>{thread.partnerNickname || thread.partnerName || `회원 ${thread.partnerMemberId}`}</strong>
            <p className={styles.threadPreview}>{thread.lastMessage || "메시지가 없습니다."}</p>
          </div>
          <div className={styles.threadMeta}>
            <span>{thread.lastMessageAt ? formatMessageTime(thread.lastMessageAt) : ""}</span>
            {thread.unreadCount > 0 ? <b className={styles.unreadBadge}>{thread.unreadCount}</b> : null}
          </div>
        </button>
      ))}
    </div>
  );

  const messageList = (
    <div ref={messageListRef} className={styles.messages} aria-live="polite">
      {isLoadingMessages ? <p className={styles.statusText}>메시지를 불러오는 중입니다.</p> : null}
      {error ? <p className={styles.errorText}>{error}</p> : null}
      {!isLoadingMessages && messages.length === 0 ? (
        <p className={styles.emptyState}>아직 메시지가 없습니다. 대화를 시작해보세요.</p>
      ) : null}
      {messages.map((item) => (
        <div
          key={item.id}
          className={`${styles.messageItem} ${item.sender === "me" ? styles.me : styles.them}`}
        >
          <div className={styles.bubble}>
            <p>{item.text}</p>
          </div>
          <span className={styles.messageTime}>{item.time}</span>
        </div>
      ))}
    </div>
  );

  const composer = (
    <form className={styles.composer} onSubmit={handleSubmit}>
      <input
        placeholder="메시지를 입력하세요"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        disabled={isSending || !activeThread}
      />
      <button
        type="submit"
        aria-label="메시지 보내기"
        title="메시지 보내기"
        disabled={isSending || !activeThread}
      >
        <SendRoundedIcon fontSize="small" />
      </button>
    </form>
  );

  const chatRoom = (
    <div className={styles.room}>
      <div className={styles.roomHeader}>
        <div className={styles.roomTitle}>
          <strong>{activeThread?.partnerNickname || activeThread?.partnerName || "Conversation"}</strong>
          <span>{activeThread?.lastMessageAt ? formatMessageTime(activeThread.lastMessageAt) : ""}</span>
        </div>
        <button type="button" className={styles.backButton} onClick={handleExitRoom}>
          나가기
        </button>
      </div>
      {messageList}
      {composer}
    </div>
  );

  if (!desktop) {
    return (
      <section className={styles.mobileChat}>
        {!isRoomOpen ? (
          <>
            <div className={styles.threadHeader}>
              <strong>채팅 리스트</strong>
            </div>
            {threadList}
          </>
        ) : (
          chatRoom
        )}
      </section>
    );
  }

  return (
    <section className={styles.desktopChat}>
      <div className={styles.hero}>
        <strong>Mood Chat</strong>
        <p>세션에 저장된 회원 정보 기준으로 채팅 리스트를 불러옵니다.</p>
      </div>
      {!isRoomOpen ? (
        <div className={styles.listView}>
          <div className={styles.threadHeader}>
            <strong>채팅 리스트</strong>
          </div>
          {threadList}
        </div>
      ) : (
        <div className={styles.roomView}>{chatRoom}</div>
      )}
    </section>
  );
}

export function MoodChatPage() {
  const desktop = useIsDesktop();

  if (!desktop) {
    return (
      <MobileShell title="Mood Chat" hideSearch>
        <ChatBody desktop={false} />
      </MobileShell>
    );
  }

  return (
    <DesktopShell>
      <ChatBody desktop />
    </DesktopShell>
  );
}
