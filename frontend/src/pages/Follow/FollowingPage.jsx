import { DesktopShell } from '../../components/layout/DesktopShell';
import { MobileShell } from '../../components/layout/MobileShell';
import { useEffect, useMemo, useState } from 'react';
import { useIsDesktop } from '../../hooks/useViewportWidth';
import { useNavigate } from 'react-router-dom';
import { following } from '../../data/moodcastData';
import styles from './FollowPage.module.css';

export function FollowingPage() {
  const desktop = useIsDesktop();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('name');
  const [items, setItems] = useState(following);

  useEffect(() => {
    setItems(following);
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const result = items.filter((user) => `${user.name} ${user.handle}`.toLowerCase().includes(normalized));

    if (sort === 'name') {
      return [...result].sort((a, b) => a.name.localeCompare(b.name));
    }
    return [...result];
  }, [items, query, sort]);

  const toggleFollow = (id) => {
    setItems((prev) => prev.map((user) => (user.id === id ? { ...user, isFollowing: !user.isFollowing } : user)));
  };

  const content = (
    <section className={styles.wrap}>
      <div className={styles.hero}>
        <strong>팔로잉</strong>
        <p>내가 팔로우하고 있는 사람들의 목록입니다.</p>
        <div className={styles.tabs}>
          <button type="button" className={styles.tab} onClick={() => navigate('/app/followers')}>
            팔로워
          </button>
          <button type="button" className={styles.activeTab} onClick={() => navigate('/app/following')}>
            팔로잉
          </button>
        </div>
      </div>
      <div className={styles.controls}>
        <input
          className={styles.search}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="이름 또는 아이디 검색"
          aria-label="팔로잉 검색"
        />
        <div className={styles.sortGroup}>
          <button type="button" className={sort === 'name' ? styles.activeSort : ''} onClick={() => setSort('name')}>
            이름순
          </button>
          <button type="button" className={sort === 'recent' ? styles.activeSort : ''} onClick={() => setSort('recent')}>
            최근순
          </button>
        </div>
      </div>
      <div className={styles.list}>
        {filtered.map((user) => (
          <article key={user.id} className={styles.item} onClick={() => navigate(`/app/user/${user.handle.slice(1)}`)}>
            <div className={styles.avatar}>{user.avatar}</div>
            <div className={styles.userInfo}>
              <strong>{user.name}</strong>
              <span>{user.handle}</span>
            </div>
            <button
              type="button"
              className={styles.unfollowButton}
              onClick={(event) => {
                event.stopPropagation();
                toggleFollow(user.id);
              }}
            >
              언팔로우
            </button>
          </article>
        ))}
      </div>
    </section>
  );

  if (!desktop) return <MobileShell title="팔로잉" hideSearch>{content}</MobileShell>;
  return <DesktopShell>{content}</DesktopShell>;
}
