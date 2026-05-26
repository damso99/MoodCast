import { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './DesktopShell.module.css';
import { Sidebar } from './Sidebar';
import { TopUtilityIcons } from './TopUtilityIcons';
import { RightRail } from './RightRail';
import { SearchModal } from '../common/SearchModal';

const TRENDING_TAGS = [
  { name: '#감정기록', count: '12.5K 게시물' },
  { name: '#일상', count: '8.2K 게시물' },
  { name: '#공감', count: '5.7K 게시물' },
  { name: '#사진', count: '4.3K 게시물' },
  { name: '#마음챙김', count: '3.1K 게시물' },
];

export function DesktopShell({ children }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const BACKSERVER = import.meta.env.VITE_BACKSERVER || 'http://localhost:8080';

  useEffect(() => {
    let isMounted = true;

    const loadPosts = async () => {
      setLoadingPosts(true);

      try {
        const response = await axios.get(`${BACKSERVER}/posts`);
        const nextPosts = response.data?.results || [];

        if (!isMounted) return;

        setPosts(nextPosts);
      } catch (error) {
        console.error('게시물 목록을 불러오지 못했습니다.', error);
        if (!isMounted) return;
        setPosts([]);
      } finally {
        if (isMounted) {
          setLoadingPosts(false);
        }
      }
    };

    loadPosts();

    return () => {
      isMounted = false;
    };
  }, [BACKSERVER]);

  return (
    <main className={styles.layout}>
      <aside className={styles.leftSlot}>
        <Sidebar />
      </aside>
      <section className={styles.center}>{children}</section>
      <aside className={styles.rightSlot}>
        <div className={styles.right}>
          <TopUtilityIcons onSearch={() => setSearchOpen(true)} />
          <RightRail posts={posts} trendingTags={TRENDING_TAGS} isLoading={loadingPosts} />
        </div>
      </aside>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </main>
  );
}
