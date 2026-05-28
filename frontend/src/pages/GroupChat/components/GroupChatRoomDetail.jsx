import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded';
import { defaultAvatarSrc } from '../../../shared/lib/defaultAvatar';
import { GroupChatMessageComposer } from './GroupChatMessageComposer';

function getRoomInitial(roomName) {
  return (roomName || 'G').charAt(0).toUpperCase();
}

export function GroupChatRoomDetail({
  activeRoom,
  messages,
  connected,
  currentMemberId,
  currentMemberName,
  currentMemberProfileImageUrl,
  messageInputRef,
  messageValue,
  onMessageChange,
  onSubmitMessage,
  onLeaveRoom,
  onInviteMembers,
  onProfileClick,
  onBack,
}) {
  if (!activeRoom) {
    return (
      <section className="group-chat-room-card group-chat-room-placeholder">
        <strong>채팅방을 선택해 주세요</strong>
        <p>왼쪽 목록에서 그룹 채팅방을 고르면 대화 내용을 볼 수 있습니다.</p>
      </section>
    );
  }

  const roomInitial = getRoomInitial(activeRoom.roomName);

  return (
    <section className="group-chat-room-card">
      <div className="group-chat-room-header">
        <button type="button" className="group-chat-backButton" onClick={onBack} aria-label="목록으로 돌아가기">
          <ArrowBackRoundedIcon />
        </button>
        <div className="group-chat-headerAvatar">{roomInitial}</div>
        <div className="group-chat-room-title">
          <strong>{activeRoom.roomName}</strong>
          <span>{connected ? '실시간 연결됨' : '연결을 시도하는 중입니다.'}</span>
        </div>
        <div className="group-chat-room-actions">
          <button type="button" className="group-chat-headerActionButton" onClick={onInviteMembers} aria-label="멤버 초대">
            <PersonAddAltRoundedIcon />
          </button>
          <button type="button" className="group-chat-headerActionButton danger" onClick={onLeaveRoom} aria-label="나가기">
            <LogoutRoundedIcon />
          </button>
        </div>
      </div>

      <div className="group-chat-message-list" aria-live="polite">
        {messages.length === 0 ? (
          <p className="group-chat-empty">아직 메시지가 없습니다. 대화를 시작해보세요.</p>
        ) : null}

        {messages.map((message) => {
          const isMine = Number(message.senderId) === Number(currentMemberId);
          const profileImageSrc = message.profileImageUrl || defaultAvatarSrc;
          const senderInitial = (message.senderName || 'M').charAt(0).toUpperCase();

          return (
            <article key={message.messageId} className={`group-chat-message-row ${isMine ? 'mine' : 'theirs'}`}>
              {!isMine ? (
                <button
                  type="button"
                  className="group-chat-message-avatarButton"
                  onClick={() => onProfileClick?.(message.senderId)}
                  aria-label={`${message.senderName || '회원'} 프로필 보기`}
                >
                  <img
                    className="group-chat-message-avatarImage"
                    src={profileImageSrc}
                    alt={message.senderName || '회원'}
                    onError={(event) => {
                      event.currentTarget.src = defaultAvatarSrc;
                    }}
                  />
                  <span className="group-chat-message-avatarFallback">{senderInitial}</span>
                </button>
              ) : null}

              <div className={`group-chat-message-bubble ${isMine ? 'mine' : 'theirs'}`}>
                {!isMine ? <strong>{message.senderName || '회원'}</strong> : null}
                <p>{message.content}</p>
                <span>{message.createdAt}</span>
              </div>
            </article>
          );
        })}
      </div>

      <GroupChatMessageComposer
        inputRef={messageInputRef}
        value={messageValue}
        onChange={onMessageChange}
        onSubmit={onSubmitMessage}
        disabled={!activeRoom}
      />

      <p className="group-chat-room-footnote">현재 참여자: {currentMemberName || '회원'}</p>
    </section>
  );
}
