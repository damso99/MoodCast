/**
 * 게시물 관련 공통 유틸리티 함수들
 * 모든 페이지와 컴포넌트에서 일관되게 사용
 */

/**
 * HTML 태그 제거하여 순수 텍스트만 반환
 * @param {string} html - HTML 문자열
 * @returns {string} 순수 텍스트
 */
export function stripHtml(html) {
  if (!html) return '';
  const text = html.replace(/<img[^>]*>/gi, ' ').replace(/<[^>]+>/g, ' ').trim();
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

/**
 * HTML에서 첫 번째 이미지 URL 추출
 * @param {string} html - HTML 문자열
 * @returns {string|null} 이미지 URL 또는 null
 */
export function extractImageUrl(html) {
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

/**
 * HTML에서 모든 이미지 URL을 추출
 * @param {string} html - HTML 문자열
 * @returns {string[]} 이미지 URL 배열
 */
export function extractImageUrls(html) {
  if (!html) return [];
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return Array.from(doc.querySelectorAll('img'))
      .map((img) => img.src)
      .filter(Boolean);
  } catch (error) {
    const matches = html.matchAll(/<img[^>]+src=["']?([^"' >]+)["']?/gi);
    return Array.from(matches, (match) => match[1]).filter(Boolean);
  }
}

/**
 * 상대 시간 포맷팅 (예: "5분 전", "2시간 전")
 * @param {string|Date} dateString - 날짜 문자열 또는 Date 객체
 * @returns {string} 포맷된 시간 문자열
 */
export function formatRelativeTime(dateString) {
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
    timeZone: 'Asia/Seoul'
  }).format(date);
}

/**
 * 게시물 데이터 표준화
 * 모든 페이지에서 동일한 구조의 데이터를 FeedCard에 전달
 * @param {object} item - API에서 받은 게시물 데이터
 * @returns {object} 표준화된 게시물 데이터
 */
export function normalizePostData(item) {
  const authorName = item.author || item.authorName || item.authorNickname || item.nickname || '익명';
  const rawContent = item.content ?? item.body ?? item.text ?? '';
  
  return {
    // 기본 ID 필드
    id: item.postId,
    postId: item.postId,
    
    // 작성자 정보
    memberId: item.memberId ?? item.member_id,
    author: authorName,
    avatar: authorName ? authorName.charAt(0).toUpperCase() : '?',
    profileLink: (item.memberId ?? item.member_id) ? `/app/user/${item.memberId ?? item.member_id}` : null,
    profileImageUrl: item.profileImageUrl ?? item.profile_image_url ?? null,
    
    // 게시물 내용
    title: item.title,
    content: rawContent,
    text: stripHtml(rawContent),
    tags: item.tags ?? '',
    
    // 이미지 정보
    imageSrc: item.imageSrc ?? extractImageUrl(rawContent),
    imageSrcs: Array.from(new Set([
      ...(item.imageSrc ? [item.imageSrc] : []),
      ...(item.imageSrcs ?? []),
      ...extractImageUrls(rawContent),
    ])).filter(Boolean),
    imageAlt: item.imageAlt ?? authorName,
    
    // 시간 정보
    time: formatRelativeTime(item.createdAt),
    createdAt: item.createdAt,
    
    // 감정 정보
    emotionId: item.emotionId,
    
    // 상호작용 정보
    comments: item.comments ?? item.commentsCount ?? item.commentCount ?? 0,
    commentsList: item.commentsList ?? [],
    likes: item.likes ?? item.likeCount ?? 0,
    likedByMe: item.likedByMe,
    vibes: item.vibes ?? item.vibesCount ?? 0,
    saved: item.savedByMe,
    savedByMe: item.savedByMe,
    
    // 기타
    attachments: item.attachments ?? [],
    previewComment: null,
  };
}

/**
 * 여러 게시물 배열을 표준화
 * @param {array} items - API에서 받은 게시물 배열
 * @returns {array} 표준화된 게시물 배열
 */
export function normalizePostDataArray(items) {
  return (items ?? []).map(normalizePostData);
}
