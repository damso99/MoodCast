import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import styles from './DesktopShell.module.css';
import { Sidebar } from './Sidebar';
import { TopUtilityIcons } from './TopUtilityIcons';
import { RightRail } from './RightRail';
import { SearchModal } from '../common/SearchModal';

// 데스크톱 레이아웃에서는 우측 사이드바에 피드 관련 추천 게시물을 띄웁니다.
// 이 데이터를 캐시해서 같은 세션 동안 중복 요청을 줄입니다.
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

function DesktopShell({ children, periodFilter, emotionFilter, onPeriodFilterChange, onEmotionFilterChange }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [posts, setPosts] = useState(() => cachedPosts || []);
  const [loadingPosts, setLoadingPosts] = useState(() => !cachedPosts);
  const BACKSERVER = import.meta.env.VITE_BACKSERVER || 'http://localhost:8080';

  // 검색 모달을 열기 위한 함수입니다.
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
        {/* 왼쪽 사이드바: 로고, 메뉴, 주요 내비게이션 */}
        <Sidebar />
      </aside>
      <section className={styles.center}>
        <div className={styles.centerInner}>{children}</div>
      </section>
      <aside className={styles.rightSlot}>
        <div className={styles.right}>
          <TopUtilityIcons onSearch={handleSearchOpen} />
          <div className={styles.rightScrollArea}>
            <RightRail
              posts={posts}
              isLoading={loadingPosts && !posts.length}
              periodFilter={periodFilter}
              emotionFilter={emotionFilter}
              onPeriodFilterChange={onPeriodFilterChange}
              onEmotionFilterChange={onEmotionFilterChange}
            />
          </div>
        </div>
      </aside>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </main>
  );
}

export { DesktopShell };
