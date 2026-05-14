import { useMemo, useState } from 'react';
import { DesktopShell } from '../../components/layout/DesktopShell';
import { MobileShell } from '../../components/layout/MobileShell';
import { feedPosts, searchUsers, trendingTags } from '../../data/moodcastData';
import { useIsDesktop } from '../../hooks/useViewportWidth';
import styles from './SearchPage.module.css';

export function SearchPage() {
  const desktop = useIsDesktop();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('posts');

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (activeTab === 'users') {
      return searchUsers.filter((item) => `${item.name} ${item.handle}`.toLowerCase().includes(normalized));
    }
    if (activeTab === 'hashtags') {
      return trendingTags.filter((item) => item.name.toLowerCase().includes(normalized));
    }
    return feedPosts.filter((post) => `${post.author} ${post.text}`.toLowerCase().includes(normalized));
  }, [activeTab, query]);

  const content = (
    <section className={styles.wrap}>
      <label className={styles.searchField}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="게시글, 사용자, 해시태그 검색" />
      </label>
      <div className={styles.tabs}>
        {['posts', 'users', 'hashtags'].map((tab) => (
          <button key={tab} type="button" className={activeTab === tab ? styles.active : ''} onClick={() => setActiveTab(tab)}>
            {tab === 'posts' ? '게시글' : tab === 'users' ? '사용자' : '해시태그'}
          </button>
        ))}
      </div>
      <div className={styles.list}>
        {results.map((item) => (
          <article key={item.id ?? item.name} className={styles.item}>
            <strong>{item.name ?? item.author}</strong>
            <p>{item.count ?? item.handle ?? item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );

  if (!desktop) return <MobileShell title="검색" hideSearch>{content}</MobileShell>;
  return <DesktopShell>{content}</DesktopShell>;
}
