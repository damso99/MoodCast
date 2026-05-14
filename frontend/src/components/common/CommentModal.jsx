import CloseIcon from '@mui/icons-material/Close';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './CommentModal.module.css';

export function CommentModal({ open, post, comments, onClose, onSubmit }) {
  const [comment, setComment] = useState('');

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
    if (open) setComment('');
  }, [open]);

  if (!open || !post) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    const value = comment.trim();
    if (!value) return;
    onSubmit({
      id: Date.now(),
      author: 'Me',
      time: '방금',
      text: value,
    });
    setComment('');
  };

  return createPortal(
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <section className={styles.modal} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <strong>댓글</strong>
            <p>{post.author}님의 게시물에 달린 반응을 확인해보세요.</p>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="닫기">
            <CloseIcon />
          </button>
        </div>

        <form className={styles.composer} onSubmit={handleSubmit}>
          <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="댓글을 남겨보세요" />
          <div className={styles.footer}>
            <span>{comment.length}/200</span>
            <button type="submit" className={styles.send}>
              <SendOutlinedIcon />
              등록
            </button>
          </div>
        </form>

        <div className={styles.list}>
          {comments.map((item) => (
            <article key={item.id} className={styles.item}>
              <div className={styles.meta}>
                <div className={styles.avatar}>{item.author[0]}</div>
                <div>
                  <strong>{item.author}</strong>
                  <p>{item.time}</p>
                </div>
              </div>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>
    </div>,
    document.body,
  );
}
