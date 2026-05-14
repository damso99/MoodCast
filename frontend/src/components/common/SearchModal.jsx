import CloseIcon from '@mui/icons-material/Close';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { feedPosts, searchUsers, trendingTags } from '../../data/moodcastData';
import styles from './SearchModal.module.css';

export function SearchModal({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('posts');

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
          {results.length ? (
            results.map((item) => {
              if ('handle' in item) {
                return (
                  <article key={item.handle} className={styles.item}>
                    <strong>{item.name}</strong>
                    <p>{item.handle}</p>
                  </article>
                );
              }
              if ('count' in item) {
                return (
                  <article key={item.name} className={styles.item}>
                    <strong>{item.name}</strong>
                    <p>{item.count}</p>
                  </article>
                );
              }
              return (
                <article key={item.id} className={styles.item}>
                  <strong>{item.author}</strong>
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
