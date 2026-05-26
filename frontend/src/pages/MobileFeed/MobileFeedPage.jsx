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

  useEffect(() => {
    setLoading(true);
    axios.get(`${BACKSERVER}/posts`)
      .then((response) => {
        const items = response.data?.results || [];
        setPosts(items.map((item) => ({
          id: item.postId,
          title: item.title, // 제목 추가
          author: item.author,
          avatar: item.author ? item.author.charAt(0).toUpperCase() : '?',
          time: item.createdAt,
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
