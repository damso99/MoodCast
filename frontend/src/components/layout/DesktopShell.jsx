import { useCallback, useEffect, useState } from 'react';
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

let cachedPosts = null;
let cachedPostsPromise = null;

async function fetchPosts(backserver) {
  if (cachedPosts) {
    return cachedPosts;
  }

  if (!cachedPostsPromise) {
    cachedPostsPromise = axios
      .get(`${backserver}/posts`)
      .then((response) => {
        const nextPosts = response.data?.results || [];
        cachedPosts = nextPosts;
        return nextPosts;
      })
      .finally(() => {
        cachedPostsPromise = null;
      });
  }

  return cachedPostsPromise;
}

function DesktopShell({ children }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [posts, setPosts] = useState(() => cachedPosts || []);
  const [loadingPosts, setLoadingPosts] = useState(() => !cachedPosts);
  const BACKSERVER = import.meta.env.VITE_BACKSERVER || 'http://localhost:8080';

  const handleSearchOpen = useCallback(() => {
    setSearchOpen(true);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadPosts = async () => {
      if (!cachedPosts) {
        setLoadingPosts(true);
      }

      try {
        const nextPosts = await fetchPosts(BACKSERVER);

        if (!isMounted) return;

        setPosts(nextPosts);
      } catch (error) {
        console.error('게시물 목록을 불러오지 못했습니다.', error);
        if (!isMounted) return;
        setPosts(cachedPosts || []);
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
      <section className={styles.center}>
        <div className={styles.centerInner}>{children}</div>
      </section>
      <aside className={styles.rightSlot}>
        <div className={styles.right}>
          <TopUtilityIcons onSearch={handleSearchOpen} />
          <div className={styles.rightScrollArea}>
            <RightRail posts={posts} trendingTags={TRENDING_TAGS} isLoading={loadingPosts && !posts.length} />
          </div>
        </div>
      </aside>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </main>
  );
}

export { DesktopShell };
