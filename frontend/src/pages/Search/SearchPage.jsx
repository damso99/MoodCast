import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DesktopShell } from '../../components/layout/DesktopShell';
import { MobileShell } from '../../components/layout/MobileShell';
import { useIsDesktop } from '../../hooks/useViewportWidth';
import { useAuthStore } from '../../hooks/useAuthStore';
import { FeedCard } from '../../components/common/FeedCard';
import styles from './SearchPage.module.css';

// SearchPage는 검색 페이지 화면 전체를 담당합니다.
// 입력한 검색어를 백엔드 검색 API로 전달하고 결과를 보여줍니다.
export function SearchPage() {
  const desktop = useIsDesktop();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab] = useState('posts');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { member: currentMember, accessToken: token, isLoggedIn } = useAuthStore();
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

    const effectiveToken = token || window.sessionStorage.getItem('moodcast-access-token');
    const config = effectiveToken ? {
      headers: { Authorization: `Bearer ${effectiveToken}` }
    } : {};

    axios
      .get(`${BACKSERVER}/search/${activeTab}`, {
        params: {
          q: normalized,
        },
        ...config,
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
  }, [activeTab, query, BACKSERVER, token]);

  const toggleFollow = (memberId) => {
    const effectiveToken = token || window.sessionStorage.getItem('moodcast-access-token');
    if (!effectiveToken) {
      alert('로그인이 필요합니다.');
      return;
    }

    axios.post(`${BACKSERVER}/auth/follow/${memberId}`, {}, {
      headers: { Authorization: `Bearer ${effectiveToken}` }
    })
      .then((res) => {
        const newStatus = res.data.following;
        setResults((prev) => prev.map((item) =>
          item.memberId === memberId ? { ...item, following: newStatus } : item
        ));
      })
      .catch(() => {
        alert('팔로우 변경에 실패했습니다. 다시 시도해주세요.');
      });
  };

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

  const transformPostData = (item) => {
    const authorName = item.author || item.authorName || item.authorNickname || item.nickname || '익명';
    return {
      id: item.postId,
      title: item.title,
      author: authorName,
      avatar: authorName ? authorName.charAt(0).toUpperCase() : '?',
      time: formatTime(item.createdAt),
      text: normalizeContent(item.content),
      emotionId: item.emotionId,
      commentsList: [],
      likes: 0,
      vibes: 0,
      previewComment: null,
      postId: item.postId,
    };
  };

  const content = (
    <section className={styles.wrap}>
      <label className={styles.searchField}>
        <input 
          value={query} 
          onChange={(event) => {
            const newQuery = event.target.value;
            setQuery(newQuery);
            navigate(`/app/search?q=${encodeURIComponent(newQuery)}`);
          }} 
          placeholder="게시글, 사용자, 해시태그 검색" 
        />
      </label>
      <div className={styles.tabs}>
        {['posts', 'users', 'hashtags'].map((tab) => (
          <button key={tab} type="button" className={activeTab === tab ? styles.active : ''} onClick={() => setActiveTab(tab)}>
            {tab === 'posts' ? '게시글' : tab === 'users' ? '사용자' : '해시태그'}
          </button>
        ))}
      </div>
      
      {query.trim() !== '' && activeTab === 'posts' && (
        <div className={styles.searchCondition}>
          <span>🔍 검색 조건: <strong>{decodeURIComponent(query)}</strong></span>
          {query.startsWith('%23') && <span className={styles.badge}>해시태그 검색</span>}
        </div>
      )}
      
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
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/app/user/${item.memberId}`)}
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
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: 'block' }}>{item.nickname || item.name}</strong>
                      <span style={{ fontSize: '13px', color: '#888' }}>
                        @{item.email ? item.email.split('@')[0] : item.memberId}
                      </span>
                    </div>
                    {isLoggedIn && currentMember?.memberId !== item.memberId && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleFollow(item.memberId);
                        }}
                        className={item.following ? styles.unfollowButton : styles.followButton}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {item.following ? '언팔로우' : '팔로우'}
                      </button>
                    )}
                  </div>
                </article>
              );
            }
            if (activeTab === 'hashtags') {
              return (
                <article
                  key={item.hashtagId}
                  className={styles.item}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setActiveTab('posts');
                    setQuery(`#${item.hashtag}`);
                  }}
                >
                  <strong>#{item.hashtag}</strong>
                  <p>{item.postCount ?? 0}개의 게시물</p>
                </article>
              );
            }
            if (activeTab === 'posts') {
              return (
                <FeedCard 
                  key={item.postId} 
                  post={transformPostData(item)}
                />
              );
            }
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
