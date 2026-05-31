import styles from "../../adminComponentsCss/contentManagement/ContentCommentGrid.module.css";

/* ==========================================================================
 * 콘텐츠 관리 댓글 목록 컴포넌트
 * --------------------------------------------------------------------------
 * 댓글 탭에서 조회된 댓글을 카드 형태로 보여주고 페이지네이션을 담당합니다.
 *
 * 초보자 설명:
 * - commentsLoading/commentsError는 API 상태를 화면에 보여주기 위한 값입니다.
 * - paginatedComments는 전체 댓글 중 현재 페이지에 보여줄 12개만 담긴 배열입니다.
 * - pageNumbers는 화면에 보여줄 페이지 번호 목록입니다.
 * ========================================================================== */
export function ContentCommentGrid({
  commentsLoading,
  commentsError,
  paginatedComments,
  filteredCommentCount,
  currentPage,
  totalPageCount,
  pageNumbers,
  onPageChange,
}) {
  const getAuthorName = (comment) => {
    return comment.authorNickname || comment.authorName || "작성자 없음";
  };

  return (
    <>
      <section className={styles.simpleList}>
        {commentsLoading ? (
          <div className={styles.emptyFeed}>
            <strong>댓글을 불러오는 중입니다.</strong>
            <span>잠시만 기다려주세요.</span>
          </div>
        ) : commentsError ? (
          <div className={styles.emptyFeed}>
            <strong>댓글 조회 실패</strong>
            <span>백엔드 API 응답을 확인해주세요.</span>
          </div>
        ) : paginatedComments.length === 0 ? (
          <div className={styles.emptyFeed}>
            <strong>댓글 데이터 없음</strong>
            <span>검색어를 바꾸거나 다른 탭을 확인해주세요.</span>
          </div>
        ) : (
          paginatedComments.map((comment) => (
            <article className={styles.simpleCard} key={comment.commentId}>
              <div className={styles.simpleCardHeader}>
                <strong>댓글 #{comment.commentId}</strong>
                <span
                  className={`${styles.statusBadge} ${
                    comment.deletedYn === "Y"
                      ? styles.statusDeleted
                      : styles.statusPublic
                  }`}
                >
                  {comment.deletedYn === "Y" ? "삭제" : "표시"}
                </span>
              </div>

              <p className={styles.simpleContent}>{comment.content || "댓글 내용 없음"}</p>

              <dl className={styles.simpleMetaList}>
                <div>
                  <dt>작성자</dt>
                  <dd>{getAuthorName(comment)}</dd>
                </div>
                <div>
                  <dt>게시글</dt>
                  <dd>{comment.postTitle || "제목 없음"}</dd>
                </div>
                <div>
                  <dt>작성일</dt>
                  <dd>{comment.createdAt || "-"}</dd>
                </div>
                <div>
                  <dt>댓글 유형</dt>
                  <dd>{comment.parentId ? "답글" : "원댓글"}</dd>
                </div>
              </dl>
            </article>
          ))
        )}
      </section>

      {filteredCommentCount > 0 && (
        <nav className={styles.pagination} aria-label="댓글 페이지 이동">
          <div className={styles.paginationButtons}>
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            >
              이전
            </button>
            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                className={pageNumber === currentPage ? styles.activePage : ""}
                aria-current={pageNumber === currentPage ? "page" : undefined}
                onClick={() => onPageChange(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage === totalPageCount}
              onClick={() =>
                onPageChange(Math.min(totalPageCount, currentPage + 1))
              }
            >
              다음
            </button>
          </div>
        </nav>
      )}
    </>
  );
}
