import CloseIcon from '@mui/icons-material/Close';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './SearchModal.module.css';

export function SearchModal({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('posts');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
    </div>,
    document.body,
  );
}
