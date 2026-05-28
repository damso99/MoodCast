import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { useIsDesktop } from '../../hooks/useViewportWidth';
import { DesktopShell } from '../../components/layout/DesktopShell';
import { MobileShell } from '../../components/layout/MobileShell';
import { FeedCard } from '../../components/common/FeedCard';
import { normalizePostData } from '../../shared/lib/postHelpers';
import styles from './PostDetailPage.module.css';

function normalizeContent(content) {
  if (!content) return '';
  const text = content.replace(/<[^>]+>/g, '').trim();
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

function extractImageUrls(html) {
  if (!html) return [];
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return Array.from(doc.querySelectorAll('img')).map((img) => img.src).filter(Boolean);
  } catch (error) {
    const matches = html.matchAll(/<img[^>]+src=["']?([^"' >]+)["']?/gi);
    return Array.from(matches, (match) => match[1]).filter(Boolean);
  }
}

function formatTime(dateString) {
  if (!dateString) return '방금';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return '방금';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Seoul',
  }).format(date);
}

export function PostDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const desktop = useIsDesktop();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const BACKSERVER = import.meta.env.VITE_BACKSERVER || 'http://localhost:8080';

  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    axios.get(`${BACKSERVER}/posts/${postId}`, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    })
      .then((res) => {
        const item = res.data;
        if (item.success === false) {
          setPost(null);
          return;
        }
        const normalized = normalizePostData(item);
        setPost(normalized);
      })
      .catch((err) => {
        console.error('게시물 상세 조회 실패:', err);
        setPost(null);
      })
      .finally(() => setLoading(false));
  }, [BACKSERVER, accessToken, postId]);

  const content = (
    <section className={styles.wrap}>
      {loading ? (
        <div className={styles.loader}>게시물 정보를 불러오는 중입니다...</div>
      ) : post ? (
        <div className={styles.detailCard}>
          <FeedCard post={post} />
        </div>
      ) : (
        <div className={styles.empty}>게시물을 찾을 수 없습니다.</div>
      )}
    </section>
  );

  if (!desktop) return <MobileShell title="게시물" hideSearch>{content}</MobileShell>;
  return <DesktopShell>{content}</DesktopShell>;
}
