import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ShareIcon from '@mui/icons-material/Share';
import FlagIcon from '@mui/icons-material/Flag';
import { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../hooks/useAuthStore';
import { CommentModal } from './CommentModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import styles from './FeedCard.module.css';

const EMOTIONS = {
  1: { 
    name: '행복', 
    emoji: '🥰',
    color: '#FFD700', 
    quote: '오늘의 이 행복한 순간을 박제해 볼까요?' 
  },
  2: { 
    name: '슬픔', 
    emoji: '🥺',
    color: '#4A90E2', 
    quote: '무슨 일이 있었나요? 마음속 이야기를 털어놓아도 좋아요.' 
  },
  3: { 
    name: '차분함', 
    emoji: '😌', 
    color: '#F4A460', 
    quote: '잔잔하고 평온한 지금 이 느낌을 그대로 적어보세요.' 
  },
  4: { 
    name: '화남', 
    emoji: '😤',
    color: '#E74C3C', 
    quote: '답답하고 화나는 마음, 여기에 다 쏟아내고 털어버려요!' 
  },
  5: { 
    name: '신남',
    emoji: '🤪', 
    color: '#FF69B4', 
    quote: '텐션 업! 얼마나 짜릿하고 신나는 일인가요?' 
  },
  6: { 
    name: '무감정', 
    emoji: '🫥', 
    color: '#95A5A6', 
    quote: '아무 생각 없는 날도 있죠. 멍하니 흘러간 하루를 기록해요.' 
  }
};
function MoodVisual({ emotionId }) {
  const emotion = EMOTIONS[emotionId] || EMOTIONS[3]; // 기본값: Calm
  return (
    <div className={styles.moodCard} style={{ borderColor: emotion.color, backgroundColor: emotion.color + '15' }}>
      <span className={styles.moodEmoji}>{emotion.emoji}</span>
      <span className={styles.moodLabel}>{emotion.name}</span>
    </div>
  );
}

export function FeedCard({ post, compact = false }) {
  const navigate = useNavigate();
  const { member, accessToken } = useAuthStore();
  const BACKSERVER = import.meta.env.VITE_BACKSERVER || 'http://localhost:8080';
  
  // member.nickname으로 비교 (post.author는 nickname 값)
  const currentUser = member?.nickname || '';
  const isOwner = post.author === currentUser;
  
  const [selectedPost, setSelectedPost] = useState(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [comments, setComments] = useState(post.commentsList ?? []);
  const [commentCount, setCommentCount] = useState(post.comments ?? post.commentsCount ?? post.commentsList?.length ?? 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes ?? 0);
  const [liked, setLiked] = useState(post.likedByMe ?? false);
  const [saved, setSaved] = useState(post.savedByMe ?? false);
  const moreButtonRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      const clickedMoreButton = moreButtonRef.current && moreButtonRef.current.contains(e.target);
      const clickedMenu = menuRef.current && menuRef.current.contains(e.target);
      if (!clickedMoreButton && !clickedMenu) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    setComments(post.commentsList ?? []);
    setCommentCount(post.comments ?? post.commentsCount ?? post.commentsList?.length ?? 0);
    setLikesCount(post.likes ?? 0);
    setLiked(Boolean(post.likedByMe));
    setSaved(Boolean(post.savedByMe));
  }, [post]);

  const imageSrc = post.imageSrc ?? post.image ?? post.cover ?? post.thumbnail;
  const cardText = post.text ?? post.content ?? post.body ?? '';
  const timeLabel = post.time ?? post.createdAt ?? post.created_at ?? '';

  const fetchComments = async (postId) => {
    try {
      const response = await axios.get(`${BACKSERVER}/posts/${postId}/comments`);
      setComments(response.data?.results || []);
    } catch (error) {
      console.error('댓글을 불러오는 중 오류가 발생했습니다.', error);
    }
  };

  const openCommentModal = async (event) => {
    event?.stopPropagation();
    setSelectedPost(post);
    await fetchComments(postId);
    setIsCommentModalOpen(true);
  };

  const closeCommentModal = () => {
    setSelectedPost(null);
    setIsCommentModalOpen(false);
  };

  const toggleMenu = (event) => {
    event?.stopPropagation();
    if (!menuOpen && moreButtonRef.current) {
      const rect = moreButtonRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + window.scrollY + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setMenuOpen(!menuOpen);
  };

  const postId = post.id ?? post.postId;

  const handleCardClick = () => {
    const postId = post.id ?? post.postId;
    navigate(`/app/post/${postId}`);
  };

  const handleEdit = (event) => {
    event.stopPropagation();
    console.log('수정 버튼 클릭됨. postId:', postId);
    setMenuOpen(false);
    navigate(`/app/post/edit/${postId}`);
  };

  const handleDelete = (event) => {
    event.stopPropagation();
    setMenuOpen(false);
    setDeleteModalOpen(true);
  };

  const handleShare = (event) => {
    event.stopPropagation();
    setMenuOpen(false);
    if (navigator.share) {
      navigator.share({
        title: post.title || '게시물',
        text: post.text,
      });
    } else {
      console.log('공유 기능이 지원되지 않습니다');
    }
  };

  const handleSave = async (event) => {
    event.stopPropagation();
    setMenuOpen(false);
    if (!accessToken) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const response = await axios.post(
        `${BACKSERVER}/posts/${postId}/saves`,
        null,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setSaved(response.data.saved);
      console.log('✅ 게시물 저장 상태 변경:', response.data);
      alert(response.data.saved ? '게시물을 저장했습니다.' : '저장한 게시물을 취소했습니다.');
    } catch (err) {
      console.error('❌ 게시물 저장 실패:', err);
      alert('게시물 저장에 실패했습니다.');
    }
  };

  const handleReport = (event) => {
    event.stopPropagation();
    setMenuOpen(false);
    console.log('Report post', postId);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
  };

  const confirmDelete = async () => {
    try {
      setDeleteModalOpen(false);
      const response = await axios.delete(
        `${BACKSERVER}/posts/${postId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      console.log('✅ 게시물 삭제 성공:', response.data);
      window.location.reload();
    } catch (err) {
      console.error('❌ 게시물 삭제 실패:', err);
      alert('게시물 삭제에 실패했습니다.');
    }
  };

  const handleLike = async (event) => {
    event.stopPropagation();
    if (!accessToken) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const response = await axios.post(
        `${BACKSERVER}/posts/${postId}/likes`,
        null,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setLiked(response.data.liked);
      if (typeof response.data.likes === 'number') {
        setLikesCount(response.data.likes);
      }
    } catch (err) {
      console.error('좋아요 요청 실패:', err);
      alert('좋아요 처리에 실패했습니다.');
    }
  };

  const handleCommentSubmit = async (content) => {
    if (!accessToken) {
      alert('로그인이 필요합니다.');
      return null;
    }

    try {
      const response = await axios.post(
        `${BACKSERVER}/posts/${postId}/comments`,
        { content },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const nextComment = response.data.comment;
      setComments((prev) => [...prev, nextComment]);
      setCommentCount((prev) => prev + 1);
      return nextComment;
    } catch (err) {
      console.error('댓글 등록 실패:', err);
      alert('댓글 등록에 실패했습니다.');
      return null;
    }
  };

  return (
    <>
      <article className={`${styles.card} ${compact ? styles.compact : ''}`} onClick={handleCardClick} style={{ cursor: 'pointer' }}>
        <div className={styles.head} onClick={(e) => e.stopPropagation()}>
          <div className={styles.avatar}>{post.avatar}</div>
          <div className={styles.meta}>
            <strong>{post.author}</strong>
            <div className={styles.metaRow}>
              <span>{timeLabel}</span>
              {post.emotionId && (
                <span className={styles.emotion}>
                  <span className={styles.emotionEmoji}>{EMOTIONS[post.emotionId]?.emoji || EMOTIONS[3].emoji}</span>
                  <span className={styles.emotionText}>{EMOTIONS[post.emotionId]?.name || EMOTIONS[3].name}</span>
                </span>
              )}
            </div>
          </div>
          {/* 메뉴 버튼 - 모든 사용자 표시 */}
          <div className={styles.moreWrapper}>
            <button 
              ref={moreButtonRef}
              type="button" 
              className={styles.more} 
              onClick={toggleMenu} 
              aria-label="더보기"
              onMouseDown={(e) => e.preventDefault()}
            >
              <MoreHorizIcon />
            </button>
            {/* SNS처럼 자연스럽게 떠오르는 메뉴 */}
            {menuOpen && (
              <div 
                ref={menuRef}
                className={styles.moreMenu} 
                style={{ top: menuPos.top, right: menuPos.right }}
              >
                {/* 작성자만 수정/삭제 가능 */}
                {isOwner && (
                  <>
                    <button type="button" className={styles.menuItem} onClick={(e) => { console.log('수정 클릭'); handleEdit(); }}>
                      <EditIcon className={styles.menuIcon} />
                      수정
                    </button>
                    <button type="button" className={`${styles.menuItem} ${styles.menuItemDanger}`} onClick={(e) => { console.log('삭제 클릭'); handleDelete(); }}>
                      <DeleteOutlineIcon className={styles.menuIcon} />
                      삭제
                    </button>
                  </>
                )}
                {/* 작성자 아닐 때만 저장/신고 가능 */}
                {!isOwner && (
                  <>
                    <button type="button" className={styles.menuItem} onClick={(e) => { console.log('저장 클릭'); handleSave(); }}>
                      <BookmarkBorderIcon className={styles.menuIcon} />
                      저장
                    </button>
                    <button type="button" className={`${styles.menuItem} ${styles.menuItemDanger}`} onClick={(e) => { console.log('신고 클릭'); handleReport(); }}>
                      <FlagIcon className={styles.menuIcon} />
                      신고
                    </button>
                  </>
                )}
                {/* 모든 사용자가 사용 가능 */}
                <button type="button" className={styles.menuItem} onClick={(e) => { console.log('공유 클릭'); handleShare(); }}>
                  <ShareIcon className={styles.menuIcon} />
                  공유
                </button>
              </div>
            )}
          </div>
        </div>

        {post.title && <p className={styles.title}>{post.title}</p>}
        <p className={styles.text}>{cardText}</p>
        {imageSrc && (
          <div className={styles.postImageWrap}>
            <img className={styles.postImage} src={imageSrc} alt={post.imageAlt ?? post.author} />
          </div>
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
          <button
            type="button"
            className={`${styles.reaction} ${liked ? styles.activeReaction : ''}`}
            onClick={handleLike}
            aria-pressed={liked}
            aria-label={liked ? '좋아요 취소' : '좋아요'}
          >
            {liked ? (
              <FavoriteIcon className={styles.heart} />
            ) : (
              <FavoriteBorderIcon className={styles.heart} />
            )}
            {likesCount}
          </button>
          <button type="button" className={styles.reactionButton} onClick={openCommentModal}>
            <ChatBubbleOutlineIcon />
            {commentCount}
          </button>
          <span className={styles.reaction}>
            <AutoAwesomeOutlinedIcon />
            {post.vibes}
          </span>
          <button
            type="button"
            className={`${styles.bookmark} ${saved ? styles.activeBookmark : ''}`}
            aria-pressed={saved}
            aria-label={saved ? '저장 취소' : '저장'}
            onClick={handleSave}
          >
            {saved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
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
        onSubmit={handleCommentSubmit}
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
