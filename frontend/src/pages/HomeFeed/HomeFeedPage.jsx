import axios from 'axios';
import { DesktopShell } from '../../components/layout/DesktopShell';
import { ComposerCard } from '../../components/common/ComposerCard';
import { FeedCard } from '../../components/common/FeedCard';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { normalizePostDataArray } from '../../shared/lib/postHelpers';
import styles from './HomeFeedPage.module.css';

export function HomeFeedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <DesktopShell>
      <section className={styles.column}>
        <ComposerCard />

        {loading ? (
          <div>게시물을 불러오는 중입니다...</div>
        ) : (
          posts.map((post) => <FeedCard key={post.id} post={post} />)
        )}
      </section>
    </DesktopShell>
  );
}
