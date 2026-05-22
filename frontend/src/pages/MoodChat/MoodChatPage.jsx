import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { DesktopShell } from "../../components/layout/DesktopShell";
import { MobileShell } from "../../components/layout/MobileShell";
import { chatMessages, chatThreads } from "../../data/moodcastData";
import { useIsDesktop } from "../../hooks/useViewportWidth";
import styles from "./MoodChatPage.module.css";

const API_BASE = import.meta.env.VITE_BACKSERVER || "http://localhost:8080";
const DEFAULT_CURRENT_USER_ID = 1;

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

function getStoredCurrentUserId() {
  if (typeof window === "undefined") {
    return DEFAULT_CURRENT_USER_ID;
  }

  const storedUserId = Number(window.localStorage.getItem("moodcast-user-id"));
  return Number.isFinite(storedUserId) && storedUserId > 0
    ? storedUserId
    : DEFAULT_CURRENT_USER_ID;
}

function getSeedMessages(threadId, currentUserId) {
  return (chatMessages[threadId] ?? []).map((message) => ({
    id: message.id,
    sender: message.sender === "me" ? "me" : "them",
    text: message.text,
    time: message.time,
    senderId: message.sender === "me" ? currentUserId : threadId,
    receiverId: message.sender === "me" ? threadId : currentUserId,
    createdAt: new Date().toISOString(),
    isRead: message.sender === "me" ? 1 : 0,
  }));
}

function ChatBody({ desktop }) {
  const currentUserId = useMemo(() => getStoredCurrentUserId(), []);
  const messageListRef = useRef(null);
  const [activeThreadId, setActiveThreadId] = useState(chatThreads[0]?.id ?? 1);
  const [isRoomOpen, setIsRoomOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(() =>
    getSeedMessages(chatThreads[0]?.id ?? 1, currentUserId),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const activeThread = useMemo(
    () => chatThreads.find((thread) => thread.id === activeThreadId) ?? chatThreads[0],
    [activeThreadId],
  );

  const syncMessages = async (threadId) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await axios.get(`${API_BASE}/chat/messages`);
      const list = Array.isArray(response.data) ? response.data : [];

      const filteredMessages = list
        .filter((item) => {
          const senderId = Number(item?.senderId);
          const receiverId = Number(item?.receiverId);

          return (
            (senderId === currentUserId && receiverId === threadId) ||
            (senderId === threadId && receiverId === currentUserId)
          );
        })
        .map((item) => normalizeIncomingMessage(item, currentUserId));

      setMessages(
        filteredMessages.length > 0
          ? filteredMessages
          : getSeedMessages(threadId, currentUserId),
      );
    } catch (requestError) {
      console.error("Message fetch failed", requestError);
      setError("메시지를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      setMessages(getSeedMessages(threadId, currentUserId));
    } finally {
      setIsLoading(false);
    }
  };

  const openThread = (threadId) => {
    setActiveThreadId(threadId);
    setIsRoomOpen(true);
  };

  const handleExitRoom = () => {
    setIsRoomOpen(false);
    setMessage("");
    setError("");
  };

  useEffect(() => {
    if (activeThreadId && isRoomOpen) {
      syncMessages(activeThreadId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThreadId, isRoomOpen]);

  useEffect(() => {
    const messageListElement = messageListRef.current;

    if (!messageListElement) {
      return;
    }

    messageListElement.scrollTop = messageListElement.scrollHeight;
  }, [messages, activeThreadId, isLoading, isRoomOpen]);

  const handleSend = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || !activeThread) {
      return;
    }

    setIsSending(true);
    setError("");

    const draftMessage = {
      id: `draft-${Date.now()}`,
      sender: "me",
      text: trimmedMessage,
      time: new Intl.DateTimeFormat("ko-KR", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(new Date()),
      senderId: currentUserId,
      receiverId: activeThread.id,
      createdAt: new Date().toISOString(),
      isRead: 0,
    };

    try {
      await axios.post(`${API_BASE}/chat/send`, {
        content: trimmedMessage,
        senderId: currentUserId,
        receiverId: activeThread.id,
        createdAt: draftMessage.createdAt,
        isRead: 0,
      });

      setMessages((prevMessages) => [...prevMessages, draftMessage]);
      setMessage("");
      await syncMessages(activeThread.id);
    } catch (requestError) {
      console.error("Message send failed", requestError);
      setError("메시지 전송에 실패했습니다. 네트워크 또는 서버 상태를 확인해주세요.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await handleSend();
  };

  const renderedMessages =
    messages.length > 0
      ? messages
      : getSeedMessages(activeThreadId, currentUserId);

  const threadList = (
    <div className={styles.threadList}>
      {chatThreads.map((thread) => (
        <button
          key={thread.id}
          type="button"
          className={`${styles.threadItem} ${thread.id === activeThreadId ? styles.active : ""}`}
          onClick={() => openThread(thread.id)}
        >
          <div>
            <strong>{thread.name}</strong>
            <p>{thread.preview}</p>
          </div>
          <span>{thread.time}</span>
        </button>
      ))}
    </div>
  );

  const messageList = (
    <div ref={messageListRef} className={styles.messages} aria-live="polite">
      {isLoading ? <p className={styles.statusText}>메시지를 불러오는 중입니다.</p> : null}
      {error ? <p className={styles.errorText}>{error}</p> : null}
      {!isLoading && renderedMessages.length === 0 ? (
        <p className={styles.emptyState}>아직 메시지가 없습니다. 대화를 시작해보세요.</p>
      ) : null}
      {renderedMessages.map((item) => (
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
        disabled={isSending}
      />
      <button
        type="submit"
        aria-label="메시지 보내기"
        title="메시지 보내기"
        disabled={isSending}
      >
        <SendRoundedIcon fontSize="small" />
      </button>
    </form>
  );

  const chatRoom = (
    <div className={styles.room}>
      <div className={styles.roomHeader}>
        <div className={styles.roomTitle}>
          <strong>{activeThread?.name ?? "Conversation"}</strong>
          <span>{activeThread?.time ?? ""}</span>
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
        <p>원하는 채팅방을 눌러 대화를 시작하고, 나가기 버튼으로 목록으로 돌아갑니다.</p>
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
