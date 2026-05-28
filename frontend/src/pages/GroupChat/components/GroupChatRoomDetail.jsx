import { useEffect, useRef, useState } from "react";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import SentimentSatisfiedAltRoundedIcon from "@mui/icons-material/SentimentSatisfiedAltRounded";
import styles from "../../MoodChat/MoodChatPage.module.css";
import { defaultAvatarSrc } from "../../../shared/lib/defaultAvatar";

function getRoomTitle(activeRoom) {
  return activeRoom?.roomName || "그룹 채팅방";
}

function getRoomSubtitle(activeRoom, connected) {
  const memberCount = Number(activeRoom?.memberCount || 0);
  const countText = memberCount > 0 ? `참여 인원 ${memberCount}명` : "참여 인원 정보 없음";
  const connectionText = connected ? "실시간 연결됨" : "연결 끊김";
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
  onDeleteMessage,
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
          aria-label="뒤로 가기"
        >
          <ArrowBackRoundedIcon />
        </button>
        <div className={styles.headerAvatar}>{roomInitial}</div>
        <div className={styles.roomTitle}>
          <strong>{roomTitle}</strong>
          <span>{roomSubtitle}</span>
        </div>
        <div className={styles.headerActions}>
          <div style={{ position: "relative" }}>
            <button
              type="button"
              aria-label="더보기"
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
                  minWidth: "160px",
                  padding: "10px",
                  borderRadius: "16px",
                  background: "rgba(255, 255, 255, 0.98)",
                  boxShadow: "0 18px 40px rgba(17, 24, 39, 0.14)",
                  zIndex: 20,
                  justifyItems: "stretch",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    onInviteMembers?.();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    minHeight: "42px",
                    padding: "0 14px",
                    border: 0,
                    borderRadius: "12px",
                    background: "rgba(124, 77, 255, 0.1)",
                    color: "#7c4dff",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    wordBreak: "keep-all",
                    fontWeight: 600,
                  }}
                >
                  참여자 초대
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    onLeaveRoom?.();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    minHeight: "42px",
                    padding: "0 14px",
                    border: 0,
                    borderRadius: "12px",
                    background: "rgba(255, 106, 119, 0.1)",
                    color: "#d92d20",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    wordBreak: "keep-all",
                    fontWeight: 600,
                  }}
                >
                  채팅방 나가기
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div ref={messagesRef} className={styles.messages} aria-live="polite">
        {messages.length === 0 ? <p className={styles.emptyState}>아직 메시지가 없습니다.</p> : null}

        {messages.map((item) => {
          const isMine = Number(item.senderId) === Number(currentMemberId);
          const senderName = item.senderName || "참여자";
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
                  aria-label={`${senderName} 프로필 보기`}
                  title={`${senderName} 프로필 보기`}
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
                  {isMine ? (
                    <button
                      type="button"
                      className={styles.deleteButton}
                      aria-label="메시지 삭제"
                      title="메시지 삭제"
                      onClick={() => onDeleteMessage?.(item)}
                    >
                      <DeleteOutlineRoundedIcon />
                    </button>
                  ) : null}
                  <div className={styles.bubbleLine}>
                    <div className={`${styles.bubble} ${isMine ? styles.me : styles.them}`}>
                      <p>{item.content}</p>
                    </div>
                    {isMine && Number(item.readCount || 0) > 0 ? (
                      <span className={styles.unreadMarker}>읽음 {item.readCount}</span>
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
        <label className={styles.addButton} aria-label="이미지 추가" title="이미지 추가">
          <AddRoundedIcon />
          <input type="file" accept="image/*" />
        </label>
        <div className={styles.inputShell}>
          <input
            ref={messageInputRef}
            placeholder="메시지를 입력하세요..."
            value={messageValue}
            onChange={onMessageChange}
            disabled={!activeRoom}
          />
          <button
            type="button"
            className={styles.emojiButton}
            aria-label="이모지"
            title="이모지"
            disabled={!activeRoom}
          >
            <SentimentSatisfiedAltRoundedIcon />
          </button>
        </div>
        <button
          type="submit"
          className={styles.sendButton}
          aria-label="메시지 보내기"
          title="메시지 보내기"
          disabled={!activeRoom}
        >
          <SendRoundedIcon />
        </button>
      </form>
    </div>
  );
}
