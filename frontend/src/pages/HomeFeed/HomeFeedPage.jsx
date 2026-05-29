import axios from 'axios';
import { DesktopShell } from '../../components/layout/DesktopShell';
import { ComposerCard } from '../../components/common/ComposerCard';
import { FeedCard } from '../../components/common/FeedCard';
import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { normalizePostDataArray } from '../../shared/lib/postHelpers';
import styles from './HomeFeedPage.module.css';

const EMOTION_CONFIG = {
  1: { label: '행복해요', className: 'happy' },
  2: { label: '슬퍼요', className: 'sad' },
  3: { label: '차분해요', className: 'calm' },
  4: { label: '화가 나요', className: 'angry' },
  5: { label: '신나요', className: 'excited' },
  6: { label: '무덤덤해요', className: 'neutral' },
};

export function HomeFeedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMoodFilter, setSelectedMoodFilter] = useState(null);
  const { accessToken } = useAuthStore();
  const BACKSERVER = import.meta.env.VITE_BACKSERVER || 'http://localhost:8080';

  useEffect(() => {
    setLoading(true);
    axios.get(`${BACKSERVER}/posts`, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    })
      .then((response) => {
        const items = response.data?.results || [];
        setPosts(normalizePostDataArray(items));
      })
      .catch((err) => {
        console.error('게시물 조회 실패', err);
        setPosts([]);
      })
      .finally(() => setLoading(false));
  }, [BACKSERVER, accessToken]);

  const filteredPosts = useMemo(() => {
    if (!selectedMoodFilter) return posts;
    return posts.filter((post) => String(post.emotionId) === String(selectedMoodFilter));
  }, [posts, selectedMoodFilter]);

  return (
    <DesktopShell>
      <section className={styles.column}>
        <ComposerCard />

        <div className={styles.moodFilterBar}>
          <button
            type="button"
            className={`${styles.moodFilterChip} ${selectedMoodFilter === null ? styles.activeMoodFilter : ''}`}
            onClick={() => setSelectedMoodFilter(null)}
          >
            전체
          </button>
          {Object.entries(EMOTION_CONFIG).map(([emotionId, emotion]) => (
            <button
              key={emotionId}
              type="button"
              className={`${styles.moodFilterChip} ${styles[emotion.className]} ${String(selectedMoodFilter) === String(emotionId) ? styles.activeMoodFilter : ''}`}
              onClick={() => setSelectedMoodFilter(Number(emotionId))}
            >
              {emotion.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div>게시물을 불러오는 중입니다...</div>
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map((post) => <FeedCard key={post.id} post={post} />)
        ) : posts.length > 0 ? (
          <div>선택한 무드의 게시물이 없습니다.</div>
        ) : (
          <div>게시물이 없습니다.</div>
        )}
      </section>
    </DesktopShell>
  );
}
