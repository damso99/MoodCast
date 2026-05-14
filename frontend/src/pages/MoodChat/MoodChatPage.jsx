import { DesktopShell } from '../../components/layout/DesktopShell';
import { MobileShell } from '../../components/layout/MobileShell';
import { chatMessages, chatThreads } from '../../data/moodcastData';
import { useIsDesktop } from '../../hooks/useViewportWidth';
import { useState } from 'react';
import styles from './MoodChatPage.module.css';

function ChatBody({ desktop }) {
  const [activeThreadId, setActiveThreadId] = useState(chatThreads[0].id);
  const messages = chatMessages[activeThreadId];
  const activeThread = chatThreads.find((thread) => thread.id === activeThreadId);

  if (!desktop) {
    return (
      <section className={styles.mobileChat}>
        <div className={styles.threadHeader}>
          <strong>채팅 리스트</strong>
        </div>
        <div className={styles.threadList}>
          {chatThreads.map((thread) => (
            <button key={thread.id} type="button" className={`${styles.threadItem} ${thread.id === activeThreadId ? styles.active : ''}`} onClick={() => setActiveThreadId(thread.id)}>
              <div>
                <strong>{thread.name}</strong>
                <p>{thread.preview}</p>
              </div>
              <span>{thread.time}</span>
            </button>
          ))}
        </div>
        <div className={styles.messages}>
          {messages.map((message) => (
            <div key={message.id} className={`${styles.bubble} ${message.sender === 'me' ? styles.me : styles.them}`}>
              <p>{message.text}</p>
              <span>{message.time}</span>
            </div>
          ))}
        </div>
        <div className={styles.composer}>
          <input placeholder="메시지를 입력하세요" />
          <button type="button">보내기</button>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.desktopChat}>
      <div className={styles.hero}>
        <strong>Mood Chat</strong>
        <p>감정을 주제로 대화를 이어갈 수 있는 채팅 공간입니다.</p>
      </div>
      <div className={styles.grid}>
        <aside className={styles.threadList}>
          {chatThreads.map((thread) => (
            <button key={thread.id} type="button" className={`${styles.threadItem} ${thread.id === activeThreadId ? styles.active : ''}`} onClick={() => setActiveThreadId(thread.id)}>
              <div>
                <strong>{thread.name}</strong>
                <p>{thread.preview}</p>
              </div>
              <span>{thread.time}</span>
            </button>
          ))}
        </aside>
        <div className={styles.room}>
          <div className={styles.roomHeader}>
            <strong>{activeThread?.name}</strong>
            <span>온라인</span>
          </div>
          <div className={styles.messages}>
            {messages.map((message) => (
              <div key={message.id} className={`${styles.bubble} ${message.sender === 'me' ? styles.me : styles.them}`}>
                <p>{message.text}</p>
                <span>{message.time}</span>
              </div>
            ))}
          </div>
          <div className={styles.composer}>
            <input placeholder="메시지를 입력하세요" />
            <button type="button">보내기</button>
          </div>
        </div>
      </div>
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
