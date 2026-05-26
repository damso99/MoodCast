import CloseIcon from '@mui/icons-material/Close';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../hooks/useAuthStore';
import { FeedCard } from './FeedCard';
import styles from './SearchModal.module.css';

// SearchModal은 화면에 떠서 사용자가 검색어를 입력하면
// 게시글/사용자/해시태그 검색 결과를 보여주는 UI 컴포넌트입니다.
// 검색 요청은 실제로 백엔드 서버의 검색 API를 호출합니다.
export function SearchModal({ open, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('posts');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { member: currentMember, accessToken: token, isLoggedIn } = useAuthStore();
  // 백엔드 서버 주소를 여기에서 설정합니다.
  // 개발 환경에서는 VITE_BACKSERVER 환경 변수를 사용하고,
  // 없으면 로컬 백엔드 주소를 기본값으로 사용합니다.
  const BACKSERVER = import.meta.env.VITE_BACKSERVER || 'http://localhost:8080';

  useEffect(() => {
    if (!open) return undefined;
    const { body, documentElement } = document;
    const prevBody = body.style.overflow;
    const prevHtml = documentElement.style.overflow;
    body.style.overflow = 'hidden';
    documentElement.style.overflow = 'hidden';
    return () => {
      body.style.overflow = prevBody;
      documentElement.style.overflow = prevHtml;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveTab('posts');
  }, [open]);

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
    // HTML 태그 제거
    let text = content.replace(/<[^>]+>/g, '').trim();
    // HTML 엔티티 디코딩
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  const formatTime = (dateString) => {
    // 시간 정보가 없으면 '방금'이라고 표시함
    if (!dateString) return '방금';
    
    // 서버에서 받은 시간 문자열을 JavaScript Date 객체로 변환함
    const date = new Date(dateString);
    // 현재 시간을 Date 객체로 가져옴
    const now = new Date();
    
    // 현재 시간과 게시글 작성 시간의 차이를 계산함
    // getTime()은 1970년 1월 1일 00:00:00부터 지난 밀리초를 반환함
    const diffMs = now.getTime() - date.getTime();
    
    // 밀리초 차이를 분으로 변환함 (1분 = 60000밀리초)
    const diffMins = Math.floor(diffMs / 60000);
    // 밀리초 차이를 시간으로 변환함 (1시간 = 3600000밀리초)
    const diffHours = Math.floor(diffMs / 3600000);
    // 밀리초 차이를 일로 변환함 (1일 = 86400000밀리초)
    const diffDays = Math.floor(diffMs / 86400000);

    // 1분 이내면 '방금'으로 표시함
    if (diffMins < 1) return '방금';
    // 1분 이상 60분 미만이면 '~분 전'으로 표시함
    if (diffMins < 60) return `${diffMins}분 전`;
    // 1시간 이상 24시간 미만이면 '~시간 전'으로 표시함
    if (diffHours < 24) return `${diffHours}시간 전`;
    // 1일 이상 7일 미만이면 '~일 전'으로 표시함
    if (diffDays < 7) return `${diffDays}일 전`;
    
    // 7일 이상 지나면 정확한 날짜와 시간을 표시함
    // Intl.DateTimeFormat은 다양한 언어와 지역에 맞게 날짜를 포맷팅함
    // timeZone: 'Asia/Seoul'로 설정하여 한국 시간대로 표시함
    // (예: 2026.05.26 13:45)
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',           // 연도를 숫자로 표시함 (예: 2026)
      month: '2-digit',          // 월을 2자리 숫자로 표시함 (예: 05)
      day: '2-digit',            // 일을 2자리 숫자로 표시함 (예: 26)
      hour: '2-digit',           // 시간을 2자리 숫자로 표시함 (예: 13)
      minute: '2-digit',         // 분을 2자리 숫자로 표시함 (예: 45)
      timeZone: 'Asia/Seoul'     // 한국 시간대(UTC+9)로 설정함
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

  // 검색어가 변경될 때마다 백엔드 API를 호출하여 검색 결과를 가져옵니다.
  useEffect(() => {
    if (!open) return;

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
  }, [activeTab, query, open, token]);

  if (!open) return null;

  return createPortal(
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <section className={styles.modal} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <strong>검색</strong>
            <p>게시글, 사용자, 해시태그를 빠르게 찾아볼 수 있어요.</p>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="닫기">
            <CloseIcon />
          </button>
        </div>

        <label className={styles.searchField}>
          <SearchOutlinedIcon />
          <input 
            value={query} 
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && query.trim() !== '') {
                onClose();
                navigate(`/app/search?q=${encodeURIComponent(query)}`);
              }
            }}
            placeholder="검색어를 입력하세요" 
          />
        </label>

        <div className={styles.tabs}>
          <button type="button" className={activeTab === 'posts' ? styles.active : ''} onClick={() => setActiveTab('posts')}>
            게시글
          </button>
          <button type="button" className={activeTab === 'users' ? styles.active : ''} onClick={() => setActiveTab('users')}>
            사용자
          </button>
          <button type="button" className={activeTab === 'hashtags' ? styles.active : ''} onClick={() => setActiveTab('hashtags')}>
            해시태그
          </button>
        </div>

        <div className={styles.list}>
          {query.trim() === '' ? (
            <article className={styles.item}>
              <strong>검색어를 입력하세요</strong>
              <p>게시글, 사용자, 해시태그를 검색할 수 있습니다.</p>
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
              // 사용자 검색 탭일 때의 리스트 아이템 렌더링
              if (activeTab === 'users') {
                return (
                  <article
                    key={item.memberId}
                    className={styles.item}
                    style={{ cursor: 'pointer' }}
                    // 사용자를 클릭하면 해당 사용자의 프로필 페이지로 이동합니다.
                    onClick={() => {
                      onClose(); // 검색창(모달)을 닫습니다.
                      navigate(`/app/user/${item.memberId}`); // 사용자의 고유 ID를 경로로 사용해 이동합니다.
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        backgroundColor: '#eee', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#999',
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
                        <span style={{ fontSize: '12px', color: '#888' }}>
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
              // 해시태그 검색 탭일 때의 리스트 아이템 렌더링
              if (activeTab === 'hashtags') {
                return (
                  <article
                    key={item.hashtagId}
                    className={styles.item}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      onClose(); // 모달 닫기
                      navigate(`/app/search?q=%23${item.hashtag}`); // 해시태그 검색 페이지로 이동
                    }}
                  >
                    <strong>#{item.hashtag}</strong>
                    <p>{item.postCount ?? 0}개의 게시물</p>
                  </article>
                );
              }
              // 게시글 검색 결과 (기본값)
              return (
                <div 
                  key={item.postId} 
                  onClick={() => {
                    onClose();
                    navigate(`/app/search?q=${encodeURIComponent(query)}`);
                  }}
                >
                  <FeedCard 
                    post={transformPostData(item)}
                  />
                </div>
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
    </div>,
    document.body,
  );
}
