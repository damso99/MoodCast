import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DesktopShell } from '../../components/layout/DesktopShell';
import { MobileShell } from '../../components/layout/MobileShell';
import { useIsDesktop } from '../../hooks/useViewportWidth';
import styles from './SearchPage.module.css';

// SearchPage는 검색 페이지 화면 전체를 담당합니다.
// 입력한 검색어를 백엔드 검색 API로 전달하고 결과를 보여줍니다.
export function SearchPage() {
  const desktop = useIsDesktop();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('posts');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const BACKSERVER = import.meta.env.VITE_BACKSERVER || 'http://localhost:8080';

  // 검색어 또는 탭이 바뀌면 백엔드에 검색 요청을 다시 보냅니다.
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
                <article 
                  key={item.memberId} 
                  className={styles.item}
                  onClick={() => navigate(`/app/user/${item.memberId}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      backgroundColor: '#e0e0e0', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#666',
                      overflow: 'hidden'
                    }}>
                      {item.profileImageUrl ? (
                        <img src={item.profileImageUrl} alt={item.nickname} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        (item.nickname || item.name || '?').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <strong style={{ display: 'block' }}>{item.nickname || item.name}</strong>
                      <span style={{ fontSize: '13px', color: '#888' }}>
                        @{item.email ? item.email.split('@')[0] : item.memberId}
                      </span>
                    </div>
                  </div>
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
