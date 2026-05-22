import CloseIcon from '@mui/icons-material/Close';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
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
  }, [activeTab, query, open]);

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
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="검색어를 입력하세요" />
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
                      <div>
                        <strong style={{ display: 'block' }}>{item.nickname || item.name}</strong>
                        <span style={{ fontSize: '12px', color: '#888' }}>
                          @{item.email ? item.email.split('@')[0] : item.memberId}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              }
              // 해시태그 검색 탭일 때의 리스트 아이템 렌더링
              if (activeTab === 'hashtags') {
                return (
                  <article key={item.hashtagId} className={styles.item}>
                    <strong>#{item.hashtag}</strong>
                    <p>{item.postCount ?? 0}개의 게시물</p>
                  </article>
                );
              }
              // 게시글 검색 결과 (기본값)
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
    </div>,
    document.body,
  );
}
