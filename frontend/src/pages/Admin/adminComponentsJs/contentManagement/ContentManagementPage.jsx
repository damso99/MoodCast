import { useState } from "react";
import { AdminLayout } from "../common/AdminLayout";
import { SearchBar } from "../common/SearchBar";
import { SegmentedControl } from "../common/SegmentedControl";
import styles from "../../adminComponentsCss/contentManagement/ContentManagementPage.module.css";

const contentTabs = ["게시글", "댓글", "이미지", "해시태그"];
const statusFilters = ["전체", "공개", "숨김", "삭제"];

const contentData = {
  게시글: [],
  댓글: [],
  이미지: [],
  해시태그: [],
};

const contentDescriptions = {
  게시글:
    "사용자 피드와 동일한 형태로 게시글을 확인하고 상태를 변경하거나 삭제할 수 있습니다.",
  댓글: "댓글 내용을 원본 게시글 기준으로 확인하고 숨김/삭제 처리할 수 있습니다.",
  이미지:
    "첨부 이미지를 썸네일로 확인하고 연결된 게시글 기준으로 관리할 수 있습니다.",
  해시태그: "해시태그 사용량과 상태를 확인하고 노출 여부를 관리할 수 있습니다.",
};

const getStatusClassName = (status) => {
  if (status === "공개") {
    return styles.statusPublic;
  }

  if (status === "숨김") {
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
 * 현재 데이터 상태:
 * - 더미데이터는 제거했습니다.
 * - 백엔드 API가 연결되기 전까지 각 탭은 빈 목록 상태로 표시됩니다.
 * - 실제 데이터가 들어오면 contentData 대신 API 응답값을 연결하면 됩니다.
 * ========================================================================== */
export function ContentManagementPage() {
  const [selectedContentType, setSelectedContentType] = useState("게시글");
  const [openedImagePost, setOpenedImagePost] = useState(null);
  const selectedRows = contentData[selectedContentType];

  const renderActionButtons = (status) => (
    <div className={styles.cardActions}>
      {status === "숨김" ? (
        <button type="button">복구</button>
      ) : (
        <button type="button">숨김</button>
      )}
      <button type="button">삭제</button>
      <button type="button">더보기</button>
    </div>
  );

  const renderPostImages = (post) => {
    const visibleImages = post.images.slice(0, 4);
    const hiddenImageCount = Math.max(
      post.images.length - visibleImages.length,
      0,
    );
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
            <span>
              {post.handle} · {post.time}
            </span>
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
        <span>
          상태{" "}
          <b
            className={`${styles.statusBadge} ${getStatusClassName(post.status)}`}
          >
            {post.status}
          </b>
        </span>
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
          <div className={styles.avatar}>
            {(item.author ?? item.tagName)[0]}
          </div>
          <div>
            <strong>{item.author ?? item.tagName}</strong>
            <span>{item.handle ?? item.createdAt}</span>
          </div>
        </div>
        <p>
          {item.text ??
            `${item.tagName} 태그가 사용된 게시글 ${item.postCount}개`}
        </p>
        <strong className={styles.tagText}>
          {item.fileName ?? item.target ?? item.tagName}
        </strong>
        {item.fileName ? (
          <span className={styles.subText}>연결 게시글: {item.target}</span>
        ) : null}
      </div>

      {item.imageSrc ? (
        <img
          className={styles.postImage}
          src={item.imageSrc}
          alt="관리 이미지 썸네일"
        />
      ) : null}

      <aside className={styles.cardMeta}>
        <strong>{item.id}</strong>
        {item.size ? <span>용량 {item.size}</span> : null}
        <span>
          상태{" "}
          <b
            className={`${styles.statusBadge} ${getStatusClassName(item.status)}`}
          >
            {item.status}
          </b>
        </span>
        <span>신고 {item.reports}건</span>
        {renderActionButtons(item.status)}
      </aside>
    </article>
  );

  const renderContentCards = () => {
    if (selectedRows.length === 0) {
      return (
        <div className={styles.emptyFeed}>
          <strong>{selectedContentType} 데이터 없음</strong>
          <span>백엔드에서 데이터를 받아오면 이 영역에 목록이 표시됩니다.</span>
        </div>
      );
    }

    if (selectedContentType === "게시글") {
      return selectedRows.map(renderPostCard);
    }

    return selectedRows.map(renderSimpleCard);
  };

  return (
    <AdminLayout
      title="콘텐츠 관리"
      description="사용자 콘텐츠를 피드 형태로 확인하고 관리할 수 있습니다."
    >
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
                <b
                  className={`${styles.filterStatusBadge} ${styles.filterPublic}`}
                >
                  공개
                </b>
              </label>
              <label>
                <input type="checkbox" defaultChecked />
                <span className={styles.checkVisual} aria-hidden="true" />
                <b
                  className={`${styles.filterStatusBadge} ${styles.filterHidden}`}
                >
                  숨김
                </b>
              </label>
              <label>
                <input type="checkbox" defaultChecked />
                <span className={styles.checkVisual} aria-hidden="true" />
                <b
                  className={`${styles.filterStatusBadge} ${styles.filterDeleted}`}
                >
                  삭제
                </b>
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
            <strong>
              일괄 작업은 최대 50개까지 선택하여 처리할 수 있습니다.
            </strong>
          </section>
        </aside>
      </section>

      {openedImagePost ? (
        <div
          className={styles.imageModalBackdrop}
          role="presentation"
          onClick={() => setOpenedImagePost(null)}
        >
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
                <span>
                  {openedImagePost.id} · 이미지 {openedImagePost.images.length}
                  장
                </span>
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
