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
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import SpaIcon from '@mui/icons-material/Spa';
import MoodBadIcon from '@mui/icons-material/MoodBad';
import CelebrationIcon from '@mui/icons-material/Celebration';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
import { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../stores/useAuthStore';
import { defaultAvatarSrc } from '../../shared/lib/defaultAvatar';
import { CommentModal } from './CommentModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { HashtagRow } from './HashtagRow';
import styles from './FeedCard.module.css';

const EMOTIONS = {
  1: { 
    name: '행복', 
    icon: EmojiEmotionsIcon,
    color: '#FFD700', 
    quote: '오늘의 이 행복한 순간을 박제해 볼까요?' 
  },
  2: { 
    name: '슬픔', 
    icon: SentimentDissatisfiedIcon,
    color: '#4A90E2', 
    quote: '무슨 일이 있었나요? 마음속 이야기를 털어놓아도 좋아요.' 
  },
  3: { 
    name: '차분함', 
    icon: SpaIcon, 
    color: '#F4A460', 
    quote: '잔잔하고 평온한 지금 이 느낌을 그대로 적어보세요.' 
  },
  4: { 
    name: '화남', 
    icon: MoodBadIcon,
    color: '#E74C3C', 
    quote: '답답하고 화나는 마음, 여기에 다 쏟아내고 털어버려요!' 
  },
  5: { 
    name: '신남',
    icon: CelebrationIcon, 
    color: '#FF69B4', 
    quote: '텐션 업! 얼마나 짜릿하고 신나는 일인가요?' 
  },
  6: { 
    name: '무감정', 
    icon: SentimentNeutralIcon, 
    color: '#95A5A6', 
    quote: '아무 생각 없는 날도 있죠. 멍하니 흘러간 하루를 기록해요.' 
  }
};
function MoodVisual({ emotionId }) {
  const emotion = EMOTIONS[emotionId] || EMOTIONS[3]; // 기본값: Calm
  const IconComponent = emotion.icon;
  return (
    <div className={styles.moodCard} style={{ borderColor: emotion.color, backgroundColor: emotion.color + '18' }}>
      <IconComponent sx={{ fontSize: '1rem', color: emotion.color }} />
      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: emotion.color }}>{emotion.name}</span>
    </div>
  );
}

function SparkleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.5L13.8 9.4L19.5 11.2L13.8 13L12 18.9L10.2 13L4.5 11.2L10.2 9.4L12 3.5Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M18 4.8L18.7 7.1L21 7.8L18.7 8.5L18 10.8L17.3 8.5L15 7.8L17.3 7.1L18 4.8Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path
        d="M6 13.2L6.7 15.5L9 16.2L6.7 16.9L6 19.2L5.3 16.9L3 16.2L5.3 15.5L6 13.2Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function extractImageUrl(html) {
  if (!html) return null;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const img = doc.querySelector('img');
    return img?.src ?? null;
  } catch (error) {
    const match = html.match(/<img[^>]+src=["']?([^"' >]+)["']?/i);
    return match ? match[1] : null;
  }
}

function stripHtml(html) {
  if (!html) return '';
  const text = html.replace(/<img[^>]*>/gi, ' ').replace(/<[^>]+>/g, ' ').trim();
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

export function FeedCard({ post, compact = false }) {
  const navigate = useNavigate();
  const { member, accessToken: storeToken } = useAuthStore();
  const BACKSERVER = import.meta.env.VITE_BACKSERVER || 'http://localhost:8080';
  // Zustand store가 초기화 전일 경우 sessionStorage에서 직접 읽음
  const accessToken = storeToken || window.sessionStorage.getItem('moodcast-access-token');

  // member.nickname으로 비교 (post.author는 nickname 값)
  const currentUser = member?.nickname || '';
  const isOwner = post.author === currentUser;
  
  const [selectedPost, setSelectedPost] = useState(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [comments, setComments] = useState(post.commentsList ?? []);
  const [commentCount, setCommentCount] = useState(post.comments ?? post.commentsCount ?? post.commentsList?.length ?? 0);
  const [menuOpen, setMenuOpen] = useState(false);
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

  const rawContent = post.content ?? post.body ?? post.text ?? '';
  const imageSrc = post.imageSrc ?? post.image ?? post.cover ?? post.thumbnail ?? extractImageUrl(post.content ?? post.body ?? '');
  const cardText = post.text ?? stripHtml(rawContent);
  const timeLabel = post.time ?? post.createdAt ?? post.created_at ?? '';
  const profileLink = post.profileLink ?? (post.memberId ? `/app/user/${post.memberId}` : null);
  const profileImageUrl = post.profileImageUrl ?? post.avatarUrl ?? null;
  const profileInitial = post.author ? post.author.charAt(0).toUpperCase() : '?';

  const fetchComments = async (postId) => {
    try {
      const response = await axios.get(`${BACKSERVER}/posts/${postId}/comments`);
      const items = response.data?.results || [];
      setComments(items.map((item) => ({
        ...item,
        memberId: item.memberId,
        profileLink: item.memberId ? `/app/user/${item.memberId}` : null,
        profileImageUrl: item.profileImageUrl ?? item.profile_image_url ?? null,
        author: item.author || item.nickname || '익명',
      })));
    } catch (error) {
      console.error('댓글을 불러오는 중 오류가 발생했습니다.', error);
    }
  };

  const openCommentModal = async (event) => {
    event?.stopPropagation();
    setSelectedPost({
      ...post,
      imageSrc: imageSrc,
      text: cardText,
    });
    await fetchComments(postId);
    setIsCommentModalOpen(true);
  };

  const closeCommentModal = () => {
    setSelectedPost(null);
    setIsCommentModalOpen(false);
  };

  const toggleMenu = (event) => {
    event?.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  const postId = post.id ?? post.postId;

  const handleCardClick = () => {
    const postId = post.id ?? post.postId;
    navigate(`/app/post/${postId}`);
  };

  const handleAuthorClick = (event) => {
    event.stopPropagation();
    if (profileLink) {
      navigate(profileLink);
    }
  };

  const handleEdit = (event) => {
    event?.stopPropagation();
    setMenuOpen(false);
    navigate(`/app/post/edit/${postId}`);
  };

  const handleDelete = (event) => {
    event?.stopPropagation();
    setMenuOpen(false);
    setDeleteModalOpen(true);
  };

  const handleShare = (event) => {
    event?.stopPropagation();
    setMenuOpen(false);
    if (navigator.share) {
      navigator.share({
        title: post.title || '게시물',
        text: post.text,
      });
    }
  };

  const handleSave = async (event) => {
    event?.stopPropagation();
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
    } catch (err) {
      console.error('❌ 게시물 저장 실패:', err);
      alert('게시물 저장에 실패했습니다.');
    }
  };

  const handleReport = (event) => {
    event?.stopPropagation();
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
      return { liked: response.data.liked, likes: response.data.likes };
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
      const mappedComment = {
        ...nextComment,
        memberId: nextComment?.memberId,
        profileLink: nextComment?.memberId ? `/app/user/${nextComment.memberId}` : null,
        profileImageUrl: nextComment?.profileImageUrl ?? nextComment?.profile_image_url ?? null,
        author: nextComment?.author || nextComment?.nickname || '익명',
      };
      setComments((prev) => [...prev, mappedComment]);
      setCommentCount((prev) => prev + 1);
      return mappedComment;
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
          <div className={styles.avatar} onClick={handleAuthorClick} style={profileLink ? { cursor: 'pointer' } : {}}>
            <img src={profileImageUrl || defaultAvatarSrc} alt={post.author || '프로필'} />
          </div>
          <div className={styles.meta}>
            <strong onClick={handleAuthorClick} style={profileLink ? { cursor: 'pointer' } : {}}>
              {post.author}
            </strong>
            <div className={styles.metaRow}>
              <span>{timeLabel}</span>
              {post.emotionId && <MoodVisual emotionId={post.emotionId} />}
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
              >
                {/* 작성자만 수정/삭제 가능 */}
                {isOwner && (
                  <>
                    <button type="button" className={styles.menuItem} onClick={(e) => handleEdit(e)}>
                      <EditIcon className={styles.menuIcon} />
                      수정
                    </button>
                  </>
                )}
                <>
                  <button
                    type="button"
                    className={`${styles.menuItem} ${saved ? styles.menuItemSaved : ''}`}
                    onClick={(e) => handleSave(e)}
                  >
                    {saved
                      ? <BookmarkIcon className={styles.menuIcon} />
                      : <BookmarkBorderIcon className={styles.menuIcon} />
                    }
                    {saved ? '저장됨' : '저장'}
                  </button>
                  <button type="button" className={styles.menuItem} onClick={(e) => handleShare(e)}>
                    <ShareIcon className={styles.menuIcon} />
                    공유
                  </button>
                  {!isOwner && (
                    <button type="button" className={`${styles.menuItem} ${styles.menuItemDanger}`} onClick={(e) => handleReport(e)}>
                      <FlagIcon className={styles.menuIcon} />
                      신고
                    </button>
                  )}
                </>
                {isOwner && (
                  <button type="button" className={`${styles.menuItem} ${styles.menuItemDanger}`} onClick={(e) => handleDelete(e)}>
                    <DeleteOutlineIcon className={styles.menuIcon} />
                    삭제
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {post.title && <p className={styles.title}>{post.title}</p>}
        <p className={styles.text}>{cardText}</p>
        {imageSrc && (
          <div className={styles.postImageWrap} onClick={(e) => { e.stopPropagation(); handleCardClick(); }} style={{ cursor: 'pointer' }}>
            <img className={styles.postImage} src={imageSrc} alt={post.imageAlt ?? post.author} />
          </div>
        )}
        <HashtagRow tags={post.tags} variant="feed" />

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
          <div className={styles.actionGroup}>
            <button
              type="button"
              className={`${styles.reaction} ${liked ? styles.activeReaction : ''}`}
              onClick={handleLike}
              aria-pressed={liked}
              aria-label={liked ? '좋아요 취소' : '좋아요'}
            >
              {liked ? (
                <FavoriteIcon className={styles.actionIcon} />
              ) : (
                <FavoriteBorderIcon className={styles.actionIcon} />
              )}
              {likesCount}
            </button>
            <button type="button" className={styles.reactionButton} onClick={openCommentModal}>
              <ChatBubbleOutlineIcon className={styles.actionIcon} />
              {commentCount}
            </button>
            <span className={styles.reaction}>
              <SparkleIcon className={styles.actionIcon} />
              {post.vibes}
            </span>
            <button
              type="button"
              className={`${styles.bookmark} ${saved ? styles.activeBookmark : ''}`}
              aria-pressed={saved}
              aria-label={saved ? '저장 취소' : '저장'}
              onClick={handleSave}
            >
              {saved ? <BookmarkIcon className={styles.actionIcon} /> : <BookmarkBorderIcon className={styles.actionIcon} />}
            </button>
          </div>
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
        onLike={handleLike}
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
