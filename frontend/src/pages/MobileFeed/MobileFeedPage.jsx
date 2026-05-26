import axios from 'axios';
import { MobileShell } from '../../components/layout/MobileShell';
import { ComposerCard } from '../../components/common/ComposerCard';
import { FeedCard } from '../../components/common/FeedCard';
import { useEffect, useState } from 'react';
import styles from './MobileFeedPage.module.css';

export function MobileFeedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const BACKSERVER = import.meta.env.VITE_BACKSERVER || 'http://localhost:8080';

  const normalizeContent = (content) => {
    if (!content) return '';
    return content.replace(/<[^>]+>/g, '').trim();
  };

  const formatTime = (dateString) => {
    if (!dateString) return '방금';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    
    // 한국 시간대(Asia/Seoul)로 포맷팅
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Seoul'
    }).format(date);
  };

  useEffect(() => {
    setLoading(true);
    axios.get(`${BACKSERVER}/posts`)
      .then((response) => {
        const items = response.data?.results || [];
        setPosts(items.map((item) => ({
          id: item.postId,
          title: item.title,
          author: item.author,
          avatar: item.author ? item.author.charAt(0).toUpperCase() : '?',
          time: formatTime(item.createdAt),
          text: normalizeContent(item.content),
          emotionId: item.emotionId,
          commentsList: [],
          likes: 0,
          vibes: 0,
          previewComment: null,
        })));
      })
      .catch((err) => {
        console.error('게시물 조회 실패', err);
        setPosts([]);
      })
      .finally(() => setLoading(false));
  }, [BACKSERVER]);

  return (
    <MobileShell title="MoodCast">
      <section className={styles.column}>
        <ComposerCard />
        {loading ? (
          <div>게시물을 불러오는 중입니다...</div>
        ) : (
          posts.map((post) => <FeedCard key={post.id} post={post} compact />)
        )}
      </section>
    </MobileShell>
  );
}
