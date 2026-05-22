import axios from 'axios';
import { useEffect, useState } from 'react';
import { DesktopShell } from '../../components/layout/DesktopShell';
import { MobileShell } from '../../components/layout/MobileShell';
import { useIsDesktop } from '../../hooks/useViewportWidth';
import styles from './SearchPage.module.css';

export function SearchPage() {
  const desktop = useIsDesktop();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('posts');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const BACKSERVER = import.meta.env.VITE_BACKSERVER || 'http://localhost:8080';

  useEffect(() => {
    const normalized = query.trim();
    if (normalized === '') {
      setResults([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    axios
      .get(`${BACKSERVER}/search/${activeTab}`, {
        params: {
          q: normalized,
        },
      })
      .then((response) => {
        setResults(response.data?.results || []);
      })
      .catch(() => {
        setError('검색 중 오류가 발생했습니다. 다시 시도해주세요.');
        setResults([]);
      })
      .finally(() => {
        setLoading(false);
      });
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
        {query.trim() === '' ? (
          <article className={styles.item}>
            <strong>검색어를 입력하세요</strong>
            <p>게시글, 사용자, 해시태그를 찾아볼 수 있습니다.</p>
          </article>
        ) : loading ? (
          <article className={styles.item}>
            <strong>검색 중입니다...</strong>
            <p>잠시만 기다려주세요.</p>
          </article>
        ) : error ? (
          <article className={styles.item}>
            <strong>검색 중 오류가 발생했습니다.</strong>
            <p>{error}</p>
          </article>
        ) : results.length ? (
          results.map((item) => {
            if (activeTab === 'users') {
              return (
                <article key={item.memberId} className={styles.item}>
                  <strong>{item.nickname || item.name}</strong>
                  <p>{item.name}</p>
                </article>
              );
            }
            if (activeTab === 'hashtags') {
              return (
                <article key={item.hashtagId} className={styles.item}>
                  <strong>#{item.hashtag}</strong>
                  <p>{item.postCount ?? 0}개의 게시물</p>
                </article>
              );
            }
            return (
              <article key={item.postId} className={styles.item}>
                <strong>{item.authorName || item.authorNickname}</strong>
                <p>{item.text}</p>
              </article>
            );
          })
        ) : (
          <article className={styles.item}>
            <strong>검색 결과가 없어요</strong>
            <p>다른 검색어로 다시 시도해보세요.</p>
          </article>
        )}
      </div>
    </section>
  );

  if (!desktop) return <MobileShell title="검색" hideSearch>{content}</MobileShell>;
  return <DesktopShell>{content}</DesktopShell>;
}
