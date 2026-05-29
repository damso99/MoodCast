import CloseIcon from '@mui/icons-material/Close';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ReplyIcon from '@mui/icons-material/Reply';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../stores/useAuthStore';
import { defaultAvatarSrc } from '../../shared/lib/defaultAvatar';
import { HashtagRow } from './HashtagRow';
import styles from './CommentModal.module.css';

export function CommentModal({ open, post, comments, onClose, onSubmit, onLike, onCommentUpdate }) {
  const navigate = useNavigate();
  const { member, accessToken } = useAuthStore();
  const BACKSERVER = import.meta.env.VITE_BACKSERVER || 'http://localhost:8080';
  const [comment, setComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [localComments, setLocalComments] = useState([]);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  // 대댓글 관련 state
  const [replyingToId, setReplyingToId] = useState(null);  // 어느 댓글에 답글 쓰는지
  const [replyText, setReplyText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState({});  // 답글 펼침 여부
  const menuRef = useRef(null);
  const submittingRef = useRef(false);
  const ignoreOverlayClickRef = useRef(false);

  useEffect(() => {
    if (open && post) {
      setLiked(Boolean(post.likedByMe));
      setLikesCount(post.likes ?? 0);
    }
  }, [open, post]);

  useEffect(() => {
    const normalizeComment = (item) => ({
      ...item,
      profileImageUrl: item.profileImageUrl ?? 
                       item.profile_image_url ?? 
                       item.avatarUrl ?? 
                       item.avatar_url ?? 
                       item.imageUrl ?? 
                       item.image_url ??
                       item.photoUrl ??
                       item.photo ?? null,
      replies: (item.replies ?? []).map(reply => normalizeComment(reply)),
    });
    
    setLocalComments((comments ?? []).map(item => normalizeComment(item)));
  }, [comments]);

  useEffect(() => {
    if (!menuOpenId) return undefined;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpenId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpenId]);

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

  useEffect(() => {
    if (!open) {
      ignoreOverlayClickRef.current = false;
      return undefined;
    }

    ignoreOverlayClickRef.current = true;
    const timerId = window.setTimeout(() => {
      ignoreOverlayClickRef.current = false;
    }, 250);

    return () => window.clearTimeout(timerId);
  }, [open]);

  if (!open || !post) return null;

  const postProfileLink = post.profileLink ?? (post.memberId ? `/app/user/${post.memberId}` : null);

  const handleEditSave = async (commentId) => {
    if (!editText.trim()) return;
    try {
      await axios.put(`${BACKSERVER}/posts/comments/${commentId}`, { content: editText.trim() }, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setLocalComments((prev) => prev.map((c) => {
        if (c.commentId === commentId) return { ...c, content: editText.trim() };
        return {
          ...c,
          replies: (c.replies ?? []).map((r) => r.commentId === commentId ? { ...r, content: editText.trim() } : r),
        };
      }));
      setEditingId(null);
      if (onCommentUpdate) onCommentUpdate();
    } catch {
      alert('댓글 수정에 실패했습니다.');
    }
  };

  const handleDeleteComment = async (commentId, parentCommentId = null) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      await axios.delete(`${BACKSERVER}/posts/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const removeReplyFromComments = (comments) => comments.map((c) => ({
        ...c,
        replies: (c.replies ?? []).filter((r) => r.commentId !== commentId).map((r) => ({
          ...r,
          replies: r.replies ? removeReplyFromComments(r.replies) : [],
        })),
      }));

      if (parentCommentId) {
        setLocalComments((prev) => prev.map((c) =>
          c.commentId === parentCommentId
            ? { ...c, replies: (c.replies ?? []).filter((r) => r.commentId !== commentId) }
            : { ...c, replies: removeReplyFromComments(c.replies ?? []) }
        ));
      } else {
        setLocalComments((prev) => prev.filter((c) => c.commentId !== commentId));
      }
      setMenuOpenId(null);
      if (onCommentUpdate) onCommentUpdate();
    } catch {
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  const appendReplyToComments = (comments, parentCommentId, newReply) => comments.map((comment) => {
    if (comment.commentId === parentCommentId) {
      return {
        ...comment,
        replies: [...(comment.replies ?? []), newReply],
      };
    }
    return {
      ...comment,
      replies: appendReplyToComments(comment.replies ?? [], parentCommentId, newReply),
    };
  });

  const handleReplySubmit = async (parentCommentId) => {
    if (!replyText.trim()) return;
    try {
      const res = await axios.post(
        `${BACKSERVER}/posts/comments/${parentCommentId}/replies`,
        { content: replyText.trim() },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const newReply = res.data.comment;
      newReply.profileImageUrl = newReply.profileImageUrl ?? 
                                 newReply.profile_image_url ?? 
                                 newReply.avatarUrl ?? 
                                 newReply.avatar_url ?? 
                                 newReply.imageUrl ?? 
                                 newReply.image_url ??
                                 newReply.photoUrl ??
                                 newReply.photo ?? null;
      newReply.author = newReply.author ?? member?.nickname;
      setLocalComments((prev) => appendReplyToComments(prev, parentCommentId, newReply));
      setExpandedReplies((prev) => ({ ...prev, [parentCommentId]: true }));
      setReplyingToId(null);
      setReplyText('');
      if (onCommentUpdate) onCommentUpdate();
    } catch {
      alert('답글 작성에 실패했습니다.');
    }
  };

  const handleAuthorNavigation = (event, link) => {
    event.stopPropagation();
    if (link) {
      navigate(link);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submittingRef.current) return;

    const value = comment.trim();
    if (!value) return;

    submittingRef.current = true;
    try {
      const nextComment = await onSubmit(value);
      if (nextComment) {
        setComment('');
      }
    } finally {
      submittingRef.current = false;
    }
  };

  const countComments = (commentsList) => commentsList.reduce((acc, c) => acc + 1 + countComments(c.replies ?? []), 0);
  const totalCount = countComments(localComments);

  const renderCommentItem = (item, parentCommentId = null) => {
    const id = item.commentId ?? item.id;
    const commentProfileLink = item.profileLink ?? (item.memberId ? `/app/user/${item.memberId}` : null);
    const isMyComment = member && item.memberId && String(item.memberId) === String(member.memberId);
    const isReply = parentCommentId !== null;

    return (
      <article key={id} className={isReply ? styles.replyItem : styles.item}>
        <div className={styles.itemHead}>
          <div className={styles.meta}>
            <div
              className={isReply ? styles.replyAvatar : styles.commentAvatar}
              onClick={(event) => handleAuthorNavigation(event, commentProfileLink)}
              style={commentProfileLink ? { cursor: 'pointer' } : {}}
            >
              <img 
                src={item.profileImageUrl || defaultAvatarSrc} 
                alt={item.author || '프로필'}
                onError={(e) => { 
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = defaultAvatarSrc;
                }}
              />
            </div>
            <div>
              <strong
                onClick={(event) => handleAuthorNavigation(event, commentProfileLink)}
                style={commentProfileLink ? { cursor: 'pointer' } : {}}
              >
                {item.author}
              </strong>
              <p>{item.time ?? item.createdAt}</p>
            </div>
          </div>
          {isMyComment && (
            <div className={styles.commentMenuWrap} ref={menuOpenId === id ? menuRef : null}>
              <button type="button" className={styles.commentMenuBtn} onClick={() => setMenuOpenId(menuOpenId === id ? null : id)}>
                <MoreHorizIcon fontSize="small" />
              </button>
              {menuOpenId === id && (
                <div className={styles.commentMenu}>
                  <button type="button" onClick={() => { setEditingId(id); setEditText(item.content ?? item.text ?? ''); setMenuOpenId(null); }}>
                    <EditIcon fontSize="small" /> 수정
                  </button>
                  <button type="button" className={styles.danger} onClick={() => handleDeleteComment(id, parentCommentId)}>
                    <DeleteOutlineIcon fontSize="small" /> 삭제
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {editingId === id ? (
          <div className={styles.editArea}>
            <textarea
              className={styles.editInput}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={2}
              autoFocus
            />
            <div className={styles.editActions}>
              <button type="button" className={styles.editCancel} onClick={() => setEditingId(null)}>취소</button>
              <button type="button" className={styles.editSave} onClick={() => handleEditSave(id)}>저장</button>
            </div>
          </div>
        ) : (
          <p className={styles.commentText}>{item.content ?? item.text}</p>
        )}

        <div className={styles.replyActions}>
          <button
            type="button"
            className={styles.replyBtn}
            onClick={() => {
              setReplyingToId(replyingToId === id ? null : id);
              setReplyText('');
            }}
          >
            <ReplyIcon fontSize="small" />
            답글 달기
          </button>
          {(item.replies?.length > 0) && (
            <button
              type="button"
              className={styles.toggleRepliesBtn}
              onClick={() => setExpandedReplies((prev) => ({ ...prev, [id]: !prev[id] }))}
            >
              {expandedReplies[id] ? '▲ 답글 숨기기' : `▼ 답글 ${item.replies.length}개 보기`}
            </button>
          )}
        </div>

        {replyingToId === id && (
          <div className={styles.replyComposer}>
            <textarea
              className={styles.replyInput}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  event.stopPropagation();
                  handleReplySubmit(id);
                }
              }}
              placeholder={`@${item.author}에게 답글 달기`}
              rows={2}
              autoFocus
            />
            <div className={styles.replyComposerActions}>
              <button type="button" className={styles.editCancel} onClick={() => setReplyingToId(null)}>취소</button>
              <button type="button" className={styles.editSave} onClick={() => handleReplySubmit(id)}>
                <SendOutlinedIcon fontSize="small" /> 등록
              </button>
            </div>
          </div>
        )}

        {/* 대댓글 목록 */}
        {expandedReplies[id] && item.replies?.length > 0 && (
          <div className={styles.repliesList}>
            {item.replies.map((reply) => renderCommentItem(reply, id))}
          </div>
        )}
      </article>
    );
  };

  return createPortal(
    <div
      className={styles.overlay}
      onClick={() => {
        if (ignoreOverlayClickRef.current) {
          return;
        }
        onClose();
      }}
      role="presentation"
    >
      <section className={styles.modal} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <header className={styles.header}>
          <div className={styles.headerMeta}>
            <div
              className={styles.avatar}
              onClick={(event) => handleAuthorNavigation(event, postProfileLink)}
              style={postProfileLink ? { cursor: 'pointer' } : {}}
            >
              <img src={post.profileImageUrl || defaultAvatarSrc} alt={post.author || '프로필'} />
            </div>
            <div>
              <strong
                onClick={(event) => handleAuthorNavigation(event, postProfileLink)}
                style={postProfileLink ? { cursor: 'pointer' } : {}}
              >
                {post.author}
              </strong>
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
              <div
                className={styles.postImageArea}
                onClick={() => post.postId && navigate(`/app/post/${post.postId}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') post.postId && navigate(`/app/post/${post.postId}`); }}
                style={{ cursor: 'pointer' }}
              >
                <img className={styles.detailPostImage} src={post.imageSrc} alt={post.imageAlt ?? post.author} />
              </div>
            ) : null}
            <HashtagRow tags={post.tags} variant="modal" />
            <div className={styles.actionRow} aria-label="게시글 반응 영역">
              <button
                type="button"
                className={styles.actionButton}
                onClick={async (e) => {
                  e.stopPropagation();
                  if (onLike) {
                    const result = await onLike(e);
                    if (result !== undefined) {
                      setLiked(result.liked);
                      setLikesCount(result.likes);
                    }
                  }
                }}
              >
                {liked
                  ? <FavoriteIcon style={{ color: '#e74c3c' }} />
                  : <FavoriteBorderIcon style={{ color: '#e74c3c' }} />
                }
                <span>{likesCount}</span>
              </button>
              <button type="button" className={styles.actionButton}>
                <ChatBubbleOutlineIcon />
                <span>{totalCount}</span>
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
              <span>{totalCount}개</span>
            </div>
            <div className={styles.list}>
              {localComments.length ? (
                localComments.map((item) => renderCommentItem(item))
              ) : (
                <div className={styles.emptyState}>아직 댓글이 없습니다. 가장 먼저 댓글을 남겨보세요.</div>
              )}
            </div>
          </section>
        </div>

        <form className={styles.composer} onSubmit={handleSubmit}>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                event.stopPropagation();
                handleSubmit(event);
              }
            }}
            placeholder="댓글을 입력해 주세요."
          />
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

