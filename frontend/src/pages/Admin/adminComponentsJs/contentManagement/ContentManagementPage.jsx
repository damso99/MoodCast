import { useState } from 'react';
import { AdminLayout } from '../common/AdminLayout';
import { SearchBar } from '../common/SearchBar';
import { SegmentedControl } from '../common/SegmentedControl';
import styles from '../../adminComponentsCss/contentManagement/ContentManagementPage.module.css';

const contentTabs = ['게시글', '댓글', '이미지', '해시태그'];
const statusFilters = ['전체', '공개', '숨김', '삭제'];

const contentDummyData = {
  게시글: [
    {
      id: '#P-1001',
      author: '김하루',
      handle: '@haru_21',
      time: '2시간 전',
      text: '오늘 하루, 마음이 따뜻했던 순간. 좋은 사람들과 함께해서 더 행복했어요.',
      tag: '#일상기록',
      status: '공개',
      reports: 2,
      images: [
        { id: 'P1001-1', src: '/admin-content-demo.png', alt: '웃는 캐릭터 이미지' },
      ],
      stats: { likes: 234, comments: 12, empathy: 18, saves: 7 },
    },
    {
      id: '#P-1002',
      author: '이서연',
      handle: '@seo_123',
      time: '5시간 전',
      text: '새로운 프로젝트 시작. 열심히 해보자.',
      tag: '#프로젝트',
      status: '공개',
      reports: 0,
      images: [
        { id: 'P1002-1', src: '/admin-post-demo-1.jpg', alt: '캐릭터 여러 표정 이미지' },
        { id: 'P1002-2', src: '/admin-post-demo-2.jpg', alt: '둥근 캐릭터 이미지' },
        { id: 'P1002-3', src: '/admin-post-demo-3.jpg', alt: '울먹이는 캐릭터 이미지' },
      ],
      stats: { likes: 156, comments: 8, empathy: 12, saves: 3 },
    },
    {
      id: '#P-1003',
      author: '박지은',
      handle: '@jieun_97',
      time: '1일 전',
      text: '오늘의 하늘은 정말 예뻤다. 사진으로 남겨두고 싶은 순간.',
      tag: '#하늘 #감성',
      status: '숨김',
      reports: 1,
      images: [
        { id: 'P1003-1', src: '/admin-content-demo.png', alt: '웃는 캐릭터 이미지' },
        { id: 'P1003-2', src: '/admin-post-demo-1.jpg', alt: '캐릭터 여러 표정 이미지' },
        { id: 'P1003-3', src: '/admin-post-demo-2.jpg', alt: '둥근 캐릭터 이미지' },
        { id: 'P1003-4', src: '/admin-post-demo-3.jpg', alt: '울먹이는 캐릭터 이미지' },
        { id: 'P1003-5', src: '/admin-content-demo.png', alt: '추가 캐릭터 이미지' },
      ],
      stats: { likes: 312, comments: 24, empathy: 28, saves: 15 },
    },
  ],
  댓글: [
    {
      id: '#C-2041',
      author: '문지호',
      handle: '@jiho_m',
      time: '18분 전',
      text: '사진 분위기가 정말 좋아요.',
      target: '오늘의 감정 기록',
      status: '공개',
      reports: 0,
    },
    {
      id: '#C-2042',
      author: '박민준',
      handle: '@minjun',
      time: '42분 전',
      text: '운영 정책 확인이 필요한 댓글입니다.',
      target: '긴 하루 끝에 남긴 글',
      status: '숨김',
      reports: 3,
    },
  ],
  이미지: [
    {
      id: '#IMG-3010',
      author: '김하루',
      handle: '@haru_21',
      time: '2시간 전',
      fileName: 'admin-post-demo-1.jpg',
      target: '오늘의 감정 기록',
      status: '공개',
      reports: 0,
      imageSrc: '/admin-post-demo-1.jpg',
      size: '112KB',
    },
    {
      id: '#IMG-3011',
      author: '이서연',
      handle: '@seo_123',
      time: '5시간 전',
      fileName: 'admin-post-demo-2.jpg',
      target: '새로운 프로젝트 시작',
      status: '공개',
      reports: 0,
      imageSrc: '/admin-post-demo-2.jpg',
      size: '24KB',
    },
    {
      id: '#IMG-3012',
      author: '박지은',
      handle: '@jieun_97',
      time: '1일 전',
      fileName: 'admin-post-demo-3.jpg',
      target: '오늘의 하늘 기록',
      status: '숨김',
      reports: 1,
      imageSrc: '/admin-post-demo-3.jpg',
      size: '86KB',
    },
  ],
  해시태그: [
    {
      id: '#TAG-88',
      tagName: '#기분좋음',
      postCount: 24,
      status: '공개',
      reports: 0,
      createdAt: '2026. 05. 21.',
    },
    {
      id: '#TAG-89',
      tagName: '#점검필요',
      postCount: 3,
      status: '숨김',
      reports: 1,
      createdAt: '2026. 05. 21.',
    },
  ],
};

const contentDescriptions = {
  게시글: '사용자 피드와 동일한 형태로 게시글을 확인하고 상태를 변경하거나 삭제할 수 있습니다.',
  댓글: '댓글 내용을 원본 게시글 기준으로 확인하고 숨김/삭제 처리할 수 있습니다.',
  이미지: '첨부 이미지를 썸네일로 확인하고 연결된 게시글 기준으로 관리할 수 있습니다.',
  해시태그: '해시태그 사용량과 상태를 확인하고 노출 여부를 관리할 수 있습니다.',
};

const getStatusClassName = (status) => {
  if (status === '공개') {
    return styles.statusPublic;
  }

  if (status === '숨김') {
    return styles.statusHidden;
  }

  return styles.statusDeleted;
};

/* ==========================================================================
 * 콘텐츠 관리 페이지
 * --------------------------------------------------------------------------
 * 게시글, 댓글, 이미지, 해시태그를 피드형 카드 레이아웃으로 관리하는 화면입니다.
 *
 * selectedContentType 상태 설명:
 * - 상단 탭에서 어떤 콘텐츠 유형을 선택했는지 저장합니다.
 * - 선택값에 따라 카드 목록과 안내 문구가 바뀝니다.
 *
 * 현재 더미데이터:
 * - 백엔드 연결 전 화면 형태 확인용입니다.
 * - 게시글 더미데이터는 images 배열을 사용합니다.
 * - 이미지가 1개인 게시글, 3개인 게시글, 4개 이상인 게시글을 각각 확인할 수 있습니다.
 * - 4개 이상인 경우 카드에는 4개까지만 보이고, 마지막 이미지에 +N 오버레이가 표시됩니다.
 * - 이미지 영역을 누르면 게시글 이미지 전체 보기 팝업이 열립니다.
 * ========================================================================== */
export function ContentManagementPage() {
  const [selectedContentType, setSelectedContentType] = useState('게시글');
  const [openedImagePost, setOpenedImagePost] = useState(null);
  const selectedRows = contentDummyData[selectedContentType];

  const renderActionButtons = (status) => (
    <div className={styles.cardActions}>
      {status === '숨김' ? <button type="button">복구</button> : <button type="button">숨김</button>}
      <button type="button">삭제</button>
      <button type="button">더보기</button>
    </div>
  );

  const renderPostImages = (post) => {
    const visibleImages = post.images.slice(0, 4);
    const hiddenImageCount = Math.max(post.images.length - visibleImages.length, 0);
    const imageGridClassName =
      post.images.length === 1 ? styles.singleImageGrid : styles.multiImageGrid;

    return (
      <button
        className={`${styles.postImageGrid} ${imageGridClassName}`}
        type="button"
        onClick={() => setOpenedImagePost(post)}
      >
        {visibleImages.map((image, index) => {
          const shouldShowMoreCount = index === 3 && hiddenImageCount > 0;

          return (
            <span className={styles.postImageThumb} key={image.id}>
              <img src={image.src} alt={image.alt} />
              {shouldShowMoreCount ? <b>+{hiddenImageCount}</b> : null}
            </span>
          );
        })}
      </button>
    );
  };

  const renderPostCard = (post) => (
    <article className={styles.contentCard} key={post.id}>
      <label className={styles.checkCell} aria-label={`${post.id} 선택`}>
        <input type="checkbox" />
      </label>

      <div className={styles.feedBody}>
        <div className={styles.authorRow}>
          <div className={styles.avatar}>{post.author[0]}</div>
          <div>
            <strong>{post.author}</strong>
            <span>{post.handle} · {post.time}</span>
          </div>
        </div>
        <p>{post.text}</p>
        <strong className={styles.tagText}>{post.tag}</strong>
        <div className={styles.statRow}>
          <span>좋아요 {post.stats.likes}</span>
          <span>댓글 {post.stats.comments}</span>
          <span>공감 {post.stats.empathy}</span>
          <span>저장 {post.stats.saves}</span>
        </div>
      </div>

      {renderPostImages(post)}

      <aside className={styles.cardMeta}>
        <strong>{post.id}</strong>
        <span>상태 <b className={`${styles.statusBadge} ${getStatusClassName(post.status)}`}>{post.status}</b></span>
        <span>신고 {post.reports}건</span>
        {renderActionButtons(post.status)}
      </aside>
    </article>
  );

  const renderSimpleCard = (item) => (
    <article className={styles.contentCard} key={item.id}>
      <label className={styles.checkCell} aria-label={`${item.id} 선택`}>
        <input type="checkbox" />
      </label>

      <div className={styles.feedBody}>
        <div className={styles.authorRow}>
          <div className={styles.avatar}>{(item.author ?? item.tagName)[0]}</div>
          <div>
            <strong>{item.author ?? item.tagName}</strong>
            <span>{item.handle ?? item.createdAt}</span>
          </div>
        </div>
        <p>{item.text ?? `${item.tagName} 태그가 사용된 게시글 ${item.postCount}개`}</p>
        <strong className={styles.tagText}>{item.fileName ?? item.target ?? item.tagName}</strong>
        {item.fileName ? <span className={styles.subText}>연결 게시글: {item.target}</span> : null}
      </div>

      {item.imageSrc ? <img className={styles.postImage} src={item.imageSrc} alt="관리 이미지 썸네일" /> : null}

      <aside className={styles.cardMeta}>
        <strong>{item.id}</strong>
        {item.size ? <span>용량 {item.size}</span> : null}
        <span>상태 <b className={`${styles.statusBadge} ${getStatusClassName(item.status)}`}>{item.status}</b></span>
        <span>신고 {item.reports}건</span>
        {renderActionButtons(item.status)}
      </aside>
    </article>
  );

  const renderContentCards = () => {
    if (selectedContentType === '게시글') {
      return selectedRows.map(renderPostCard);
    }

    return selectedRows.map(renderSimpleCard);
  };

  return (
    <AdminLayout title="콘텐츠 관리" description="사용자 콘텐츠를 피드 형태로 확인하고 관리할 수 있습니다.">
      <section className={styles.topBar}>
        <SegmentedControl
          labels={contentTabs}
          selectedLabel={selectedContentType}
          onSelect={setSelectedContentType}
        />
        <SearchBar placeholder="제목, 내용, 작성자 검색" />
      </section>

      <section className={styles.contentShell}>
        <main className={styles.contentMain}>
          <div className={styles.statusToolbar}>
            <div className={styles.statusPills}>
              {statusFilters.map((label) => (
                <button key={label} type="button">
                  {label}
                </button>
              ))}
            </div>
            <div className={styles.viewTools}>
              <select aria-label="정렬 방식" defaultValue="latest">
                <option value="latest">최신순</option>
                <option value="reports">신고 많은 순</option>
              </select>
              <button type="button">정렬</button>
              <button type="button">보기</button>
            </div>
          </div>

          <section className={styles.summaryPanel}>
            <h2>{selectedContentType} 관리</h2>
            <p>{contentDescriptions[selectedContentType]}</p>
          </section>

          <section className={styles.feedList}>{renderContentCards()}</section>
        </main>

        <aside className={styles.sideRail}>
          <section className={styles.filterPanel}>
            <h2>필터</h2>
            <label>
              작성 시간
              <select defaultValue="all">
                <option value="all">전체 기간</option>
                <option value="today">오늘</option>
                <option value="week">최근 7일</option>
              </select>
            </label>
            <label>
              신고 수
              <select defaultValue="all">
                <option value="all">전체</option>
                <option value="reported">신고 있음</option>
                <option value="high">신고 3건 이상</option>
              </select>
            </label>
            <label>
              작성자
              <input type="text" placeholder="작성자 검색" />
            </label>
            <div className={styles.checkGroup}>
              <strong>상태</strong>
              <label>
                <input type="checkbox" defaultChecked />
                <span className={styles.checkVisual} aria-hidden="true" />
                <b className={`${styles.filterStatusBadge} ${styles.filterPublic}`}>공개</b>
              </label>
              <label>
                <input type="checkbox" defaultChecked />
                <span className={styles.checkVisual} aria-hidden="true" />
                <b className={`${styles.filterStatusBadge} ${styles.filterHidden}`}>숨김</b>
              </label>
              <label>
                <input type="checkbox" defaultChecked />
                <span className={styles.checkVisual} aria-hidden="true" />
                <b className={`${styles.filterStatusBadge} ${styles.filterDeleted}`}>삭제</b>
              </label>
            </div>
            <button type="button">필터 초기화</button>
          </section>

          <section className={styles.bulkPanel}>
            <div className={styles.panelTitleRow}>
              <h2>일괄 작업</h2>
              <span>0개 선택됨</span>
            </div>
            <p>선택된 콘텐츠가 없습니다. 목록에서 콘텐츠를 선택해주세요.</p>
            <div className={styles.bulkActions}>
              <button type="button">숨김 처리</button>
              <button type="button">삭제 처리</button>
              <button type="button">복구</button>
            </div>
            <strong>일괄 작업은 최대 50개까지 선택하여 처리할 수 있습니다.</strong>
          </section>
        </aside>
      </section>

      {openedImagePost ? (
        <div className={styles.imageModalBackdrop} role="presentation" onClick={() => setOpenedImagePost(null)}>
          <section
            className={styles.imageModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="content-image-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.imageModalHead}>
              <div>
                <h2 id="content-image-modal-title">게시글 이미지 전체 보기</h2>
                <span>{openedImagePost.id} · 이미지 {openedImagePost.images.length}장</span>
              </div>
              <button type="button" onClick={() => setOpenedImagePost(null)}>
                닫기
              </button>
            </div>

            <div className={styles.imageModalGrid}>
              {openedImagePost.images.map((image, index) => (
                <figure key={image.id}>
                  <img src={image.src} alt={image.alt} />
                  <figcaption>{index + 1}</figcaption>
                </figure>
              ))}
            </div>

            <div className={styles.imageModalActions}>
              <span>선택된 이미지 (0)</span>
              <button type="button">숨김 처리</button>
              <button type="button">삭제 처리</button>
            </div>
          </section>
        </div>
      ) : null}
    </AdminLayout>
  );
}
