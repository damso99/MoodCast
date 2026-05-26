import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import SentimentSatisfiedAltRoundedIcon from "@mui/icons-material/SentimentSatisfiedAltRounded";
import { DesktopShell } from "../../components/layout/DesktopShell";
import { MobileShell } from "../../components/layout/MobileShell";
import { useAuthStore } from "../../hooks/useAuthStore";
import { useRealtimeChat } from "../../hooks/useRealtimeChat";
import { notifyChatUnreadChanged } from "../../hooks/useUnreadChatCount";
import { useIsDesktop } from "../../hooks/useViewportWidth";
import { useSearchParams } from "react-router-dom";
import styles from "./MoodChatPage.module.css";

const API_BASE = import.meta.env.VITE_BACKSERVER || "http://localhost:8080";
const DEFAULT_CURRENT_USER_ID = null;

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
    eventType: message?.eventType ?? "CHAT_MESSAGE",
  };
}

function ChatBody({ desktop, onRoomOpenChange }) {
  const { member } = useAuthStore();
  const [searchParams] = useSearchParams();
  const currentMemberId = useMemo(() => {
    const memberId = Number(member?.memberId);
    return Number.isFinite(memberId) && memberId > 0
      ? memberId
      : DEFAULT_CURRENT_USER_ID;
  }, [member?.memberId]);
  const initialPartnerId = useMemo(() => {
    const partnerId = Number(searchParams.get("partnerId"));
    return Number.isFinite(partnerId) && partnerId > 0 ? partnerId : null;
  }, [searchParams]);
  const initialPartnerName = searchParams.get("partnerName") || "";
  const messageListRef = useRef(null);
  const messageInputRef = useRef(null);
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [isRoomOpen, setIsRoomOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showScrollBottomButton, setShowScrollBottomButton] = useState(false);
  const [error, setError] = useState("");
  const handleIncomingMessage = (incomingMessage) => {
    if (incomingMessage?.eventType === "READ_RECEIPT") {
      const readerId = Number(incomingMessage.receiverId);

      setMessages((previousMessages) =>
        previousMessages.map((item) =>
          item.senderId === currentMemberId && item.receiverId === readerId
            ? { ...item, isRead: 1 }
            : item,
        ),
      );
      return;
    }

    const normalizedMessage = normalizeIncomingMessage(
      incomingMessage,
      currentMemberId,
    );
    const incomingPartnerId =
      normalizedMessage.senderId === currentMemberId
        ? normalizedMessage.receiverId
        : normalizedMessage.senderId;
    const isActiveThreadMessage =
      activeThread &&
      Number(activeThread.partnerMemberId) === Number(incomingPartnerId) &&
      (normalizedMessage.senderId === currentMemberId ||
        normalizedMessage.receiverId === currentMemberId);

    setMessages((previousMessages) => {
      if (previousMessages.some((item) => item.id === normalizedMessage.id)) {
        return previousMessages;
      }

      if (!isActiveThreadMessage) {
        return previousMessages;
      }

      return [...previousMessages, normalizedMessage];
    });

    if (
      isActiveThreadMessage &&
      normalizedMessage.receiverId === currentMemberId
    ) {
      markMessagesAsRead(incomingPartnerId).then(loadThreads);
      return;
    }

    loadThreads();
  };

  const { connected: isChatConnected, sendMessage } = useRealtimeChat(
    currentMemberId,
    handleIncomingMessage,
  );

  const markMessagesAsRead = async (partnerId) => {
    if (!currentMemberId || !partnerId) {
      return;
    }

    try {
      await axios.post(`${API_BASE}/chat/read`, null, {
        params: {
          memberId: currentMemberId,
          partnerId,
        },
      });

      setThreads((previousThreads) =>
        previousThreads.map((thread) =>
          Number(thread.partnerMemberId) === Number(partnerId)
            ? { ...thread, unreadCount: 0 }
            : thread,
        ),
      );
      notifyChatUnreadChanged();
    } catch (requestError) {
      console.error("메시지 읽음 처리 실패", requestError);
    }
  };

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
      await markMessagesAsRead(partnerThread.partnerMemberId);

      const response = await axios.get(`${API_BASE}/chat/messages`, {
        params: {
          memberId: currentMemberId,
          partnerId: partnerThread.partnerMemberId,
        },
      });
      const list = Array.isArray(response.data) ? response.data : [];
      setMessages(
        list.map((item) => normalizeIncomingMessage(item, currentMemberId)),
      );
      await loadThreads();
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
    if (!initialPartnerId) {
      setActiveThread(null);
      setIsRoomOpen(false);
      setMessages([]);
      setMessage("");
      setError("");
      setShowScrollBottomButton(false);
      return;
    }

    if (!currentMemberId) {
      return;
    }

    const partnerThread = {
      partnerMemberId: initialPartnerId,
      partnerName: initialPartnerName || `회원 ${initialPartnerId}`,
      partnerNickname: initialPartnerName || `회원 ${initialPartnerId}`,
      partnerProfileImageUrl: "",
      lastMessage: "",
      lastMessageAt: "",
      unreadCount: 0,
    };

    setActiveThread(partnerThread);
    setIsRoomOpen(true);
    setMessage("");
    setShowScrollBottomButton(false);
    loadMessages(partnerThread);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMemberId, initialPartnerId, initialPartnerName]);

  const updateScrollBottomButton = () => {
    const messageListElement = messageListRef.current;

    if (!messageListElement) {
      return;
    }

    const bottomGap =
      messageListElement.scrollHeight -
      messageListElement.scrollTop -
      messageListElement.clientHeight;
    setShowScrollBottomButton(bottomGap > 24);
  };

  const scrollToMessageBottom = (behavior = "smooth") => {
    const messageListElement = messageListRef.current;

    if (!messageListElement) {
      return;
    }

    messageListElement.scrollTo({
      top: messageListElement.scrollHeight,
      behavior,
    });
    setShowScrollBottomButton(false);
  };

  useEffect(() => {
    if (!isRoomOpen) {
      setShowScrollBottomButton(false);
      return;
    }

    if (!showScrollBottomButton) {
      requestAnimationFrame(() => scrollToMessageBottom("auto"));
      return;
    }

    requestAnimationFrame(updateScrollBottomButton);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isRoomOpen, activeThread]);

  const openThread = (thread) => {
    setActiveThread(thread);
    setIsRoomOpen(true);
    setMessage("");
    setShowScrollBottomButton(false);
    loadMessages(thread);
  };

  const handleExitRoom = () => {
    setIsRoomOpen(false);
    setActiveThread(null);
    setMessages([]);
    setMessage("");
    setError("");
    setShowScrollBottomButton(false);
  };

  const handleSend = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || !activeThread || !currentMemberId || isSending) {
      return;
    }

    setIsSending(true);
    setError("");
    setMessage("");
    requestAnimationFrame(() => {
      messageInputRef.current?.focus();
    });

    try {
      const isPublished = sendMessage({
        content: trimmedMessage,
        senderId: currentMemberId,
        receiverId: activeThread.partnerMemberId,
        isRead: 0,
      });

      if (!isPublished) {
        await axios.post(`${API_BASE}/chat/send`, {
          content: trimmedMessage,
          senderId: currentMemberId,
          receiverId: activeThread.partnerMemberId,
          isRead: 0,
        });
        await loadMessages(activeThread);
      }

      await loadThreads();
    } catch (requestError) {
      console.error("메시지 전송 실패", requestError);
      setError("메시지 전송에 실패했습니다.");
    } finally {
      setIsSending(false);
      requestAnimationFrame(() => {
        messageInputRef.current?.focus();
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await handleSend();
  };

  useEffect(() => {
    onRoomOpenChange?.(isRoomOpen);
  }, [isRoomOpen, onRoomOpenChange]);
  const partnerName =
    activeThread?.partnerNickname || activeThread?.partnerName || "상대방";
  const partnerInitial = partnerName.charAt(0).toUpperCase();

  const threadList = (
    <div className={styles.threadList}>
      {isLoadingThreads ? (
        <p className={styles.statusText}>채팅 리스트를 불러오는 중입니다.</p>
      ) : null}
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
            <strong>
              {thread.partnerNickname ||
                thread.partnerName ||
                `회원 ${thread.partnerMemberId}`}
            </strong>
            <p className={styles.threadPreview}>
              {thread.lastMessage || "메시지가 없습니다."}
            </p>
          </div>
          <div className={styles.threadMeta}>
            <span>
              {thread.lastMessageAt
                ? formatMessageTime(thread.lastMessageAt)
                : ""}
            </span>
            {thread.unreadCount > 0 ? (
              <b className={styles.unreadBadge}>{thread.unreadCount}</b>
            ) : null}
          </div>
        </button>
      ))}
    </div>
  );

  const messageList = (
    <div
      ref={messageListRef}
      className={styles.messages}
      aria-live="polite"
      onScroll={updateScrollBottomButton}
    >
      {isLoadingMessages ? (
        <p className={styles.statusText}>메시지를 불러오는 중입니다.</p>
      ) : null}
      {error ? <p className={styles.errorText}>{error}</p> : null}
      {!isLoadingMessages && messages.length === 0 ? (
        <p className={styles.emptyState}>
          아직 메시지가 없습니다. 대화를 시작해보세요.
        </p>
      ) : null}
      {messages.map((item) => {
        const isUnreadByReceiver =
          item.sender === "me" && Number(item.isRead) !== 1;

        return (
          <div
            key={item.id}
            className={`${styles.messageRow} ${item.sender === "me" ? styles.me : styles.them}`}
          >
            {item.sender === "them" ? (
              <div className={styles.messageAvatar}>{partnerInitial}</div>
            ) : null}
            <div
              className={`${styles.messageItem} ${item.sender === "me" ? styles.me : styles.them}`}
            >
              {item.sender === "them" ? (
                <span className={styles.senderLabel}>{partnerName}</span>
              ) : null}
              <div className={styles.bubbleWrap}>
                <div className={styles.bubbleLine}>
                  {isUnreadByReceiver ? (
                    <span className={styles.unreadMarker}>1</span>
                  ) : null}
                  <div className={styles.bubble}>
                    <p>{item.text}</p>
                  </div>
                </div>
                <span className={styles.messageTime}>{item.time}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const composer = (
    <form className={styles.composer} onSubmit={handleSubmit}>
      <label
        className={styles.addButton}
        aria-label="이미지 추가"
        title="이미지 추가"
      >
        <AddRoundedIcon />
        <input type="file" accept="image/*" />
      </label>
      <div className={styles.inputShell}>
        <input
          ref={messageInputRef}
          placeholder="메시지를 입력하세요..."
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          disabled={!activeThread}
        />
        <button
          type="button"
          className={styles.emojiButton}
          aria-label="이모티콘"
          title="이모티콘"
          disabled={!activeThread}
        >
          <SentimentSatisfiedAltRoundedIcon />
        </button>
      </div>
      <button
        type="submit"
        className={styles.sendButton}
        aria-label="메시지 보내기"
        title="메시지 보내기"
        disabled={isSending || !activeThread}
      >
        <SendRoundedIcon />
      </button>
    </form>
  );

  const chatRoom = (
    <div className={styles.room}>
      <div className={styles.roomHeader}>
        <button
          type="button"
          className={styles.backButton}
          onClick={handleExitRoom}
          aria-label="채팅방 나가기"
        >
          <ArrowBackRoundedIcon />
        </button>
        <div className={styles.headerAvatar}>{partnerInitial}</div>
        <div className={styles.roomTitle}>
          <strong>{partnerName}</strong>
          <span>{isChatConnected ? "활동중일걸?" : "아닌가?"}</span>
        </div>
        <div className={styles.headerActions}>
          <button type="button" aria-label="전화">
            <PhoneRoundedIcon />
          </button>
          <button type="button" aria-label="더보기">
            <MoreVertRoundedIcon />
          </button>
        </div>
      </div>
      {messageList}
      {showScrollBottomButton ? (
        <button
          type="button"
          className={styles.scrollBottomButton}
          aria-label="최신 메시지로 이동"
          title="최신 메시지로 이동"
          onClick={() => scrollToMessageBottom()}
        >
          <KeyboardArrowDownRoundedIcon />
        </button>
      ) : null}
      {composer}
    </div>
  );

  if (!desktop) {
    return (
      <section className={styles.mobileChat}>
        {!isRoomOpen ? (
          <div className={styles.mobileListView}>
            <div className={styles.threadHeader}>
              <strong>채팅 리스트</strong>
            </div>
            {threadList}
          </div>
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
        <p>{isChatConnected ? "실시간 연결됨" : "연결을 시도하는 중입니다."}</p>
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
  const [mobileRoomOpen, setMobileRoomOpen] = useState(false);

  if (!desktop) {
    return (
      <MobileShell
        title="Mood Chat"
        hideSearch
        fixedContent
        hideBottomNav={mobileRoomOpen}
      >
        <ChatBody desktop={false} onRoomOpenChange={setMobileRoomOpen} />
      </MobileShell>
    );
  }

  return (
    <DesktopShell>
      <ChatBody desktop />
    </DesktopShell>
  );
}
