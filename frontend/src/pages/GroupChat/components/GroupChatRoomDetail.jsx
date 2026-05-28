import { useEffect, useRef, useState } from "react";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import SentimentSatisfiedAltRoundedIcon from "@mui/icons-material/SentimentSatisfiedAltRounded";
import styles from "../../MoodChat/MoodChatPage.module.css";
import { defaultAvatarSrc } from "../../../shared/lib/defaultAvatar";

function getRoomTitle(activeRoom) {
  return activeRoom?.roomName || "Group Chat";
}

function getRoomSubtitle(activeRoom, connected) {
  const memberCount = Number(activeRoom?.memberCount || 0);
  const countText = memberCount > 0 ? `Members ${memberCount}` : "No member info";
  const connectionText = connected ? "Connected" : "Disconnected";
  return `${countText} · ${connectionText}`;
}

export function GroupChatRoomDetail({
  activeRoom,
  messages,
  connected,
  currentMemberId,
  messageInputRef,
  messageValue,
  onMessageChange,
  onSubmitMessage,
  onLeaveRoom,
  onInviteMembers,
  onProfileClick,
  onBack,
}) {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const messagesRef = useRef(null);

  useEffect(() => {
    const element = messagesRef.current;
    if (!element) {
      return;
    }

    element.scrollTop = element.scrollHeight;
  }, [messages, activeRoom?.roomId]);

  if (!activeRoom) {
    return null;
  }

  const roomTitle = getRoomTitle(activeRoom);
  const roomInitial = roomTitle.charAt(0).toUpperCase();
  const roomSubtitle = getRoomSubtitle(activeRoom, connected);

  return (
    <div className={styles.room}>
      <div className={styles.roomHeader}>
        <button
          type="button"
          className={styles.backButton}
          onClick={onBack}
          aria-label="Back"
        >
          <ArrowBackRoundedIcon />
        </button>
        <div className={styles.headerAvatar}>{roomInitial}</div>
        <div className={styles.roomTitle}>
          <strong>{roomTitle}</strong>
          <span>{roomSubtitle}</span>
        </div>
        <div className={styles.headerActions}>
          <button type="button" aria-label="Call">
            <PhoneRoundedIcon />
          </button>
          <div style={{ position: "relative" }}>
            <button
              type="button"
              aria-label="More"
              onClick={() => setIsMoreMenuOpen((value) => !value)}
            >
              <MoreVertRoundedIcon />
            </button>
            {isMoreMenuOpen ? (
              <div
                style={{
                  position: "absolute",
                  top: "46px",
                  right: 0,
                  display: "grid",
                  gap: "8px",
                  minWidth: "140px",
                  padding: "10px",
                  borderRadius: "16px",
                  background: "rgba(255, 255, 255, 0.98)",
                  boxShadow: "0 18px 40px rgba(17, 24, 39, 0.14)",
                  zIndex: 20,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    onInviteMembers?.();
                  }}
                  style={{
                    minHeight: "40px",
                    border: 0,
                    borderRadius: "12px",
                    background: "rgba(124, 77, 255, 0.1)",
                    color: "#7c4dff",
                    cursor: "pointer",
                  }}
                >
                  Invite
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    onLeaveRoom?.();
                  }}
                  style={{
                    minHeight: "40px",
                    border: 0,
                    borderRadius: "12px",
                    background: "rgba(255, 106, 119, 0.1)",
                    color: "#d92d20",
                    cursor: "pointer",
                  }}
                >
                  Leave
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div ref={messagesRef} className={styles.messages} aria-live="polite">
        {messages.length === 0 ? <p className={styles.emptyState}>No messages yet.</p> : null}

        {messages.map((item) => {
          const isMine = Number(item.senderId) === Number(currentMemberId);
          const senderName = item.senderName || "Member";
          const senderInitial = senderName.charAt(0).toUpperCase();
          const profileImageUrl = item.profileImageUrl || defaultAvatarSrc;

          return (
            <div
              key={item.messageId}
              className={`${styles.messageRow} ${isMine ? styles.me : styles.them}`}
            >
              {!isMine ? (
                <button
                  type="button"
                  className={styles.messageAvatar}
                  onClick={() => onProfileClick?.(item.senderId)}
                  aria-label={`${senderName} profile`}
                  title={`${senderName} profile`}
                >
                  {profileImageUrl ? (
                    <img
                      src={profileImageUrl}
                      alt={senderName}
                      className={styles.messageAvatarImage}
                      onError={(event) => {
                        event.currentTarget.src = defaultAvatarSrc;
                      }}
                    />
                  ) : (
                    <span>{senderInitial}</span>
                  )}
                </button>
              ) : null}

              <div className={`${styles.messageItem} ${isMine ? styles.me : styles.them}`}>
                {!isMine ? <span className={styles.senderLabel}>{senderName}</span> : null}
                <div className={styles.bubbleWrap}>
                  <div className={styles.bubbleLine}>
                    <div className={`${styles.bubble} ${isMine ? styles.me : styles.them}`}>
                      <p>{item.content}</p>
                    </div>
                    {isMine && Number(item.readCount || 0) > 0 ? (
                      <span className={styles.unreadMarker}>Read {item.readCount}</span>
                    ) : null}
                  </div>
                  <span className={styles.messageTime}>{item.createdAt}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form className={styles.composer} onSubmit={onSubmitMessage}>
        <label className={styles.addButton} aria-label="Add image" title="Add image">
          <AddRoundedIcon />
          <input type="file" accept="image/*" />
        </label>
        <div className={styles.inputShell}>
          <input
            ref={messageInputRef}
            placeholder="Type a message..."
            value={messageValue}
            onChange={onMessageChange}
            disabled={!activeRoom}
          />
          <button
            type="button"
            className={styles.emojiButton}
            aria-label="Emoji"
            title="Emoji"
            disabled={!activeRoom}
          >
            <SentimentSatisfiedAltRoundedIcon />
          </button>
        </div>
        <button
          type="submit"
          className={styles.sendButton}
          aria-label="Send message"
          title="Send message"
          disabled={!activeRoom}
        >
          <SendRoundedIcon />
        </button>
      </form>
    </div>
  );
}
