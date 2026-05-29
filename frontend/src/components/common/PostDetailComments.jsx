import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ReplyIcon from '@mui/icons-material/Reply';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { defaultAvatarSrc } from '../../shared/lib/defaultAvatar';
import styles from './PostDetailComments.module.css';

function normalizeCommentAuthor(item, member) {
  const author = item?.author || item?.nickname || member?.nickname || '사용자';
  return author;
}

function normalizeCommentItem(item, member) {
  const memberId = item?.memberId ?? item?.member_id ?? null;
  return {
    ...item,
    memberId,
    profileLink: memberId ? `/app/user/${memberId}` : null,
    profileImageUrl: item?.profileImageUrl ?? item?.profile_image_url ?? null,
    author: normalizeCommentAuthor(item, member),
    content: item?.content ?? item?.text ?? '',
    time: item?.time ?? item?.createdAt ?? item?.created_at ?? '',
    replies: (item?.replies ?? []).map((reply) => normalizeCommentItem(reply, member)),
  };
}

export function PostDetailComments({ post, onCommentCountChange, targetCommentId = null }) {
  const navigate = useNavigate();
  const { member, accessToken } = useAuthStore();
  const BACKSERVER = import.meta.env.VITE_BACKSERVER || 'http://localhost:8080';
  const [comment, setComment] = useState('');
  const [localComments, setLocalComments] = useState([]);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState({});
  const menuRef = useRef(null);
  const submittingRef = useRef(false);

  const postId = post?.postId ?? post?.id;
  const countComments = (comments) => comments.reduce((acc, current) => acc + 1 + countComments(current.replies ?? []), 0);
  const totalCount = useMemo(
    () => countComments(localComments),
    [localComments],
  );

  useEffect(() => {
    if (!postId) return;

    let active = true;
    const loadComments = async () => {
      try {
        const response = await axios.get(`${BACKSERVER}/posts/${postId}/comments`);
        const items = response.data?.results || [];
        if (!active) return;
        setLocalComments(items.map((item) => normalizeCommentItem(item, member)));
      } catch (error) {
        if (!active) return;
        console.error('댓글을 불러오는 중 오류가 발생했습니다.', error);
        setLocalComments([]);
      }
    };

    loadComments();
    return () => {
      active = false;
    };
  }, [BACKSERVER, member, postId]);

  useEffect(() => {
    if (!menuOpenId) return undefined;
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpenId]);

  useEffect(() => {
    if (onCommentCountChange) {
      onCommentCountChange(totalCount);
    }
  }, [onCommentCountChange, totalCount]);

  useEffect(() => {
    if (!targetCommentId || !localComments.length) {
      return undefined;
    }

    const targetId = String(targetCommentId);
    const expandPath = [];

    const findPath = (items, parents = []) => {
      for (const item of items) {
        const itemId = String(item.commentId ?? item.id);
        const nextParents = [...parents, itemId];

        if (itemId === targetId) {
          return nextParents;
        }

        if (item.replies?.length) {
          const found = findPath(item.replies, nextParents);
          if (found) {
            return found;
          }
        }
      }

      return null;
    };

    const path = findPath(localComments);
    if (!path) {
      return undefined;
    }

    path.slice(0, -1).forEach((id) => {
      expandPath.push(id);
    });

    if (expandPath.length > 0) {
      setExpandedReplies((prev) => {
        const next = { ...prev };
        expandPath.forEach((id) => {
          next[id] = true;
        });
        return next;
      });
    }

    const timerId = window.setTimeout(() => {
      const element = document.getElementById(`comment-item-${targetId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);

    return () => window.clearTimeout(timerId);
  }, [localComments, targetCommentId]);

  const handleAuthorNavigation = (event, link) => {
    event.stopPropagation();
    if (link) navigate(link);
  };

  const handleEditSave = async (commentId) => {
    if (!editText.trim()) return;

    try {
      await axios.put(
        `${BACKSERVER}/posts/comments/${commentId}`,
        { content: editText.trim() },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      setLocalComments((prev) => prev.map((item) => {
        if (item.commentId === commentId) {
          return { ...item, content: editText.trim() };
        }
        return {
          ...item,
          replies: (item.replies ?? []).map((reply) =>
            reply.commentId === commentId ? { ...reply, content: editText.trim() } : reply
          ),
        };
      }));
      setEditingId(null);
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

      if (parentCommentId) {
        setLocalComments((prev) => prev.map((item) =>
          item.commentId === parentCommentId
            ? { ...item, replies: (item.replies ?? []).filter((reply) => reply.commentId !== commentId) }
            : item
        ));
      } else {
        setLocalComments((prev) => prev.filter((item) => item.commentId !== commentId));
      }

      setMenuOpenId(null);
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
      const response = await axios.post(
        `${BACKSERVER}/posts/comments/${parentCommentId}/replies`,
        { content: replyText.trim() },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const newReply = normalizeCommentItem(response.data.comment, member);

      setLocalComments((prev) => appendReplyToComments(prev, parentCommentId, newReply));
      setExpandedReplies((prev) => ({ ...prev, [parentCommentId]: true }));
      setReplyingToId(null);
      setReplyText('');
    } catch {
      alert('답글 작성에 실패했습니다.');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submittingRef.current) return;

    const value = comment.trim();
    if (!value) return;

    submittingRef.current = true;
    try {
      const response = await axios.post(
        `${BACKSERVER}/posts/${postId}/comments`,
        { content: value },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      const nextComment = normalizeCommentItem(response.data.comment, member);
      setLocalComments((prev) => [...prev, nextComment]);
      setComment('');
      setExpandedReplies((prev) => ({ ...prev, [nextComment.commentId]: true }));
    } catch (error) {
      console.error('댓글 등록에 실패했습니다.', error);
      alert('댓글 등록에 실패했습니다.');
    } finally {
      submittingRef.current = false;
    }
  };

  const renderCommentItem = (item, parentCommentId = null) => {
    const id = item.commentId ?? item.id;
    const commentProfileLink = item.profileLink ?? (item.memberId ? `/app/user/${item.memberId}` : null);
    const isMyComment = member && item.memberId && String(item.memberId) === String(member.memberId);
    const isReply = parentCommentId !== null;

    return (
      <article id={`comment-item-${id}`} key={id} className={isReply ? styles.replyItem : styles.item}>
        <div className={styles.itemHead}>
          <div className={styles.meta}>
            <div
              className={isReply ? styles.replyAvatar : styles.commentAvatar}
              onClick={(event) => handleAuthorNavigation(event, commentProfileLink)}
              style={commentProfileLink ? { cursor: 'pointer' } : {}}
            >
              {item.profileImageUrl ? (
                <img src={item.profileImageUrl} alt={item.author || '프로필'} />
              ) : (
                item.author?.[0] ?? '?'
              )}
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
              <button
                type="button"
                className={styles.commentMenuBtn}
                onClick={() => setMenuOpenId(menuOpenId === id ? null : id)}
              >
                <MoreHorizIcon fontSize="small" />
              </button>
              {menuOpenId === id && (
                <div className={styles.commentMenu}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(id);
                      setEditText(item.content ?? item.text ?? '');
                      setMenuOpenId(null);
                    }}
                  >
                    <EditIcon fontSize="small" />
                    수정
                  </button>
                  <button
                    type="button"
                    className={styles.danger}
                    onClick={() => handleDeleteComment(id, parentCommentId)}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                    삭제
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
              onChange={(event) => setEditText(event.target.value)}
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
              {expandedReplies[id] ? '답글 숨기기' : `답글 ${item.replies.length}개 보기`}
            </button>
          )}
        </div>

        {replyingToId === id && (
          <div className={styles.replyComposer}>
            <textarea
              className={styles.replyInput}
              value={replyText}
              onChange={(event) => setReplyText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleReplySubmit(id);
                }
              }}
              placeholder={`@${item.author}에게 답글`}
              rows={2}
              autoFocus
            />
            <div className={styles.replyComposerActions}>
              <button type="button" className={styles.editCancel} onClick={() => setReplyingToId(null)}>취소</button>
              <button type="button" className={styles.editSave} onClick={() => handleReplySubmit(id)}>
                <SendOutlinedIcon fontSize="small" />
                등록
              </button>
            </div>
          </div>
        )}

        {expandedReplies[id] && item.replies?.length > 0 && (
          <div className={styles.repliesList}>
            {item.replies.map((reply) => renderCommentItem(reply, id))}
          </div>
        )}
      </article>
    );
  };

  return (
    <section className={styles.wrap}>
      <header className={styles.header}>
        <strong>댓글</strong>
        <span>{totalCount}개</span>
      </header>

      <div className={styles.list}>
        {localComments.length ? (
          localComments.map((item) => renderCommentItem(item))
        ) : (
          <div className={styles.emptyState}>아직 댓글이 없습니다. 가장 먼저 댓글을 남겨보세요.</div>
        )}
      </div>

      <form className={styles.composer} onSubmit={handleSubmit}>
        <div className={styles.footer}>
          <span>{comment.length}/200</span>
        </div>
        <div className={styles.composerRow}>
          <textarea
            rows={1}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                event.stopPropagation();
                handleSubmit(event);
              }
            }}
            placeholder="댓글을 입력해 주세요"
          />
          <button type="submit" className={styles.send}>
            <SendOutlinedIcon />
            등록
          </button>
        </div>
      </form>
    </section>
  );
}
