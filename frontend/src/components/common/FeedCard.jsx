import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { useState } from 'react';
import { CommentModal } from './CommentModal';
import styles from './FeedCard.module.css';

function MoodVisual({ tone }) {
  const toneClass = tone === 'sunset' ? 'toneSunset' : 'toneCoffee';
  return (
    <div className={`${styles.visual} ${styles[toneClass]}`}>
      {tone === 'sunset' ? (
        <>
          <span className={styles.sun} />
          <span className={styles.mountains} />
          <span className={styles.water} />
        </>
      ) : (
        <>
          <span className={styles.cup} />
          <span className={styles.glow} />
        </>
      )}
      <span className={styles.visualLabel}>{tone === 'sunset' ? 'Happy' : 'Calm'}</span>
    </div>
  );
}

export function FeedCard({ post, compact = false }) {
  const [selectedPost, setSelectedPost] = useState(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [comments, setComments] = useState(post.commentsList);
  const imageSrc = post.imageSrc ?? post.image ?? post.cover ?? post.thumbnail;

  const openCommentModal = () => {
    setSelectedPost(post);
    setIsCommentModalOpen(true);
  };

  const closeCommentModal = () => {
    setSelectedPost(null);
    setIsCommentModalOpen(false);
  };

  return (
    <>
      <article className={`${styles.card} ${compact ? styles.compact : ''}`}>
        <div className={styles.head}>
          <div className={styles.avatar}>{post.avatar}</div>
          <div className={styles.meta}>
            <strong>{post.author}</strong>
            <span>{post.time}</span>
          </div>
          <button type="button" className={styles.more}>
            <MoreHorizIcon />
          </button>
        </div>

        <p className={styles.text}>{post.text}</p>
        {imageSrc ? (
          <div className={styles.postImageWrap}>
            <img className={styles.postImage} src={imageSrc} alt={post.imageAlt ?? post.author} />
          </div>
        ) : (
          <MoodVisual tone={post.tone} />
        )}

        <div className={styles.actions}>
          <span className={styles.reaction}>
            <FavoriteIcon className={styles.heart} />
            {post.likes}
          </span>
          <button type="button" className={styles.reactionButton} onClick={openCommentModal}>
            <ChatBubbleOutlineIcon />
            {comments.length}
          </button>
          <span className={styles.reaction}>
            <AutoAwesomeOutlinedIcon />
            {post.vibes}
          </span>
          <button type="button" className={styles.bookmark} aria-label="저장">
            <BookmarkBorderIcon />
          </button>
        </div>

        {post.previewComment ? (
          <div className={styles.preview}>
            <strong>{post.previewComment.author}</strong>
            <span>{post.previewComment.time}</span>
            <p>{post.previewComment.text}</p>
          </div>
        ) : null}
      </article>

      <CommentModal
        open={isCommentModalOpen}
        post={selectedPost}
        comments={comments}
        onClose={closeCommentModal}
        onSubmit={(nextComment) => setComments((prev) => [...prev, nextComment])}
      />
    </>
  );
}
