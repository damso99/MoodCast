import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CommentModal } from './CommentModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
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
  const navigate = useNavigate();
  const currentUser = 'Sarah Kim';
  const isOwner = post.author === currentUser;
  const [selectedPost, setSelectedPost] = useState(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [comments, setComments] = useState(post.commentsList);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const imageSrc = post.imageSrc ?? post.image ?? post.cover ?? post.thumbnail;

  const openCommentModal = () => {
    setSelectedPost(post);
    setIsCommentModalOpen(true);
  };

  const closeCommentModal = () => {
    setSelectedPost(null);
    setIsCommentModalOpen(false);
  };

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleEdit = () => {
    setMenuOpen(false);
    navigate(`/app/post/edit/${post.id}`);
  };

  const handleDelete = () => {
    setMenuOpen(false);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
  };

  const confirmDelete = () => {
    console.log('Delete post', post.id);
    setDeleteModalOpen(false);
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
          {isOwner ? (
            <div className={styles.moreWrapper}>
              <button type="button" className={styles.more} onClick={toggleMenu} aria-label="더보기">
                <MoreHorizIcon />
              </button>
              {menuOpen ? (
                <div className={styles.moreMenu}>
                  <button type="button" className={styles.menuItem} onClick={handleEdit}>
                    수정
                  </button>
                  <button type="button" className={styles.menuItem} onClick={handleDelete}>
                    삭제
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <p className={styles.text}>{post.text}</p>
        {imageSrc ? (
          <div className={styles.postImageWrap}>
            <img className={styles.postImage} src={imageSrc} alt={post.imageAlt ?? post.author} />
          </div>
        ) : (
          <MoodVisual tone={post.tone} />
        )}

        {post.attachments?.length ? (
          <div className={styles.attachmentArea}>
            <strong>첨부파일</strong>
            <ul className={styles.fileList}>
              {post.attachments.map((file) => (
                <li key={file.id} className={styles.attachmentItem}>
                  <span>{file.name}</span>
                  <span>{file.type}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

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
      <DeleteConfirmModal
        open={deleteModalOpen}
        title="게시물을 삭제하시겠습니까?"
        description="삭제한 게시물은 복구할 수 없습니다. 계속 진행하시겠습니까?"
        onCancel={closeDeleteModal}
        onConfirm={confirmDelete}
      />
    </>
  );
}
