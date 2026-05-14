import CloseIcon from '@mui/icons-material/Close';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
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
    body.classList.add('comment-modal-open');

    return () => {
      body.style.overflow = prevBody;
      documentElement.style.overflow = prevHtml;
      body.classList.remove('comment-modal-open');
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

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
        <header className={styles.header}>
          <div className={styles.headerMeta}>
            <div className={styles.avatar}>{post.avatar}</div>
            <div>
              <strong>{post.author}</strong>
              <p>{post.time}</p>
            </div>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="닫기">
            <CloseIcon />
          </button>
        </header>

        <div className={styles.body}>
          <section className={styles.postSection}>
            <p className={styles.postText}>{post.text}</p>
            {post.imageSrc ? (
              <div className={styles.postImageArea}>
                <img className={styles.detailPostImage} src={post.imageSrc} alt={post.imageAlt ?? post.author} />
              </div>
            ) : null}
            <div className={styles.actionRow} aria-label="게시글 반응 영역">
              <button type="button" className={styles.actionButton}>
                <FavoriteIcon />
                <span>{post.likes}</span>
              </button>
              <button type="button" className={styles.actionButton}>
                <ChatBubbleOutlineIcon />
                <span>{comments.length}</span>
              </button>
              <button type="button" className={styles.actionButton}>
                <ShareOutlinedIcon />
                <span>공유</span>
              </button>
            </div>
          </section>

          <section className={styles.commentsSection}>
            <div className={styles.sectionTitle}>
              <strong>댓글</strong>
              <span>{comments.length}개</span>
            </div>
            <div className={styles.list}>
              {comments.length ? (
                comments.map((item) => (
                  <article key={item.id} className={styles.item}>
                    <div className={styles.meta}>
                      <div className={styles.commentAvatar}>{item.author[0]}</div>
                      <div>
                        <strong>{item.author}</strong>
                        <p>{item.time}</p>
                      </div>
                    </div>
                    <p>{item.text}</p>
                  </article>
                ))
              ) : (
                <div className={styles.emptyState}>아직 댓글이 없습니다. 가장 먼저 댓글을 남겨보세요.</div>
              )}
            </div>
          </section>
        </div>

        <form className={styles.composer} onSubmit={handleSubmit}>
          <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="댓글을 입력해 주세요." />
          <div className={styles.footer}>
            <span>{comment.length}/200</span>
            <button type="submit" className={styles.send}>
              <SendOutlinedIcon />
              등록
            </button>
          </div>
        </form>
      </section>
    </div>,
    document.body,
  );
}
