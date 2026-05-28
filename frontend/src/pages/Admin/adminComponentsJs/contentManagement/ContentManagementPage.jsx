import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { AdminLayout } from "../common/AdminLayout";
import { SearchBar } from "../common/SearchBar";
import { SegmentedControl } from "../common/SegmentedControl";
import { useAuthStore } from "../../../../stores/useAuthStore";
import styles from "../../adminComponentsCss/contentManagement/ContentManagementPage.module.css";

const contentTabs = ["게시글", "댓글", "이미지", "해시태그"];
const statusFilters = ["전체", "공개", "숨김", "삭제"];
const POSTS_PER_PAGE = 12; // 가로 3개 x 세로 4개로 한 페이지에 총 12개 게시글을 보여줍니다.
const PAGE_BUTTON_COUNT = 10; // 사용자 관리 페이지와 같이 페이지 번호는 최대 10개씩 보여줍니다.

const emotionFilters = [
  { id: "all", label: "전체 감정" },
  { id: 1, label: "행복" },
  { id: 2, label: "슬픔" },
  { id: 3, label: "차분함" },
  { id: 4, label: "화남" },
  { id: 5, label: "신나감" },
  { id: 6, label: "무감정" },
];

const contentDescriptions = {
  게시글: "게시글 제목 또는 작성자로 검색하고 감정별로 분류해 확인할 수 있습니다.",
  댓글: "댓글 내용을 원본 게시글 기준으로 확인하고 숨김/삭제 처리할 수 있습니다.",
  이미지: "첨부 이미지를 썸네일로 확인하고 연결된 게시글 기준으로 관리할 수 있습니다.",
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

const getPostStatus = (post) => {
  if (post.deletedYn === "Y") {
    return "삭제";
  }

  if (post.visibility && post.visibility !== "PUBLIC") {
    return "숨김";
  }

  return "공개";
};

const getAuthorName = (post) => {
  return post.authorNickname || post.authorName || "작성자 없음";
};

const getEmotionLabel = (emotionId) => {
  return (
    emotionFilters.find((emotionItem) => emotionItem.id === Number(emotionId))
      ?.label || "기타"
  );
};

const isInSelectedDateRange = (post, dateRange) => {
  if (dateRange === "all") {
    return true;
  }

  if (!post.createdAt) {
    return false;
  }

  const createdDate = new Date(post.createdAt.replace(" ", "T"));

  if (Number.isNaN(createdDate.getTime())) {
    return true;
  }

  const now = new Date();
  const diffMs = now.getTime() - createdDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (dateRange === "today") {
    return createdDate.toDateString() === now.toDateString();
  }

  return diffDays <= 7;
};

/* ==========================================================================
 * 콘텐츠 관리 페이지
 * --------------------------------------------------------------------------
 * 게시글, 댓글, 이미지, 해시태그를 관리하는 관리자 화면입니다.
 *
 * 이번 게시글 탭 처리 흐름:
 * 1. 관리자 API로 게시글 목록을 불러옵니다.
 * 2. 제목 또는 작성자 기준으로 검색합니다.
 * 3. 상태, 작성 시간, 감정 필터를 적용합니다.
 * 4. 한 페이지에 12개씩, 가로 3개 x 세로 4개 카드로 출력합니다.
 * 5. 페이지 번호는 사용자 관리와 같은 방식으로 최대 10개씩 보여줍니다.
 * ========================================================================== */
export function ContentManagementPage() {
  const [selectedContentType, setSelectedContentType] = useState("게시글"); // 현재 선택된 콘텐츠 탭입니다.
  const [selectedStatus, setSelectedStatus] = useState("전체"); // 공개/숨김/삭제 상태 필터입니다.
  const [searchField, setSearchField] = useState("title"); // 제목 또는 작성자 중 어떤 기준으로 검색할지 저장합니다.
  const [searchKeyword, setSearchKeyword] = useState(""); // 검색창에 입력된 실제 검색어입니다.
  const [selectedEmotionId, setSelectedEmotionId] = useState("all"); // 감정 필터 선택값입니다.
  const [dateRange, setDateRange] = useState("all"); // 작성 시간 필터 선택값입니다.
  const [currentPage, setCurrentPage] = useState(1); // 현재 보고 있는 페이지 번호입니다.
  const [posts, setPosts] = useState([]); // 백엔드에서 조회한 게시글 목록입니다.
  const [postsLoading, setPostsLoading] = useState(false); // 게시글 목록 로딩 상태입니다.
  const [postsError, setPostsError] = useState(false); // 게시글 목록 조회 실패 여부입니다.
  const { accessToken } = useAuthStore(); // 관리자 API 호출에 사용할 로그인 토큰입니다.

  const BACKSERVER = (
    import.meta.env.VITE_BACKSERVER || "http://localhost:8080"
  ).replace(/\/$/, "");

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    setPostsLoading(true);
    setPostsError(false);

    axios
      .get(`${BACKSERVER}/admin/api/content/posts`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((res) => {
        const nextPosts = Array.isArray(res.data?.posts) ? res.data.posts : [];

        setPosts(nextPosts);
      })
      .catch((error) => {
        console.log(error);
        setPosts([]);
        setPostsError(true);
      })
      .finally(() => {
        setPostsLoading(false);
      });
  }, [BACKSERVER, accessToken]);

  const filteredPosts = useMemo(() => {
    const trimmedKeyword = searchKeyword.trim().toLowerCase();

    return posts.filter((post) => {
      const statusMatched =
        selectedStatus === "전체" || getPostStatus(post) === selectedStatus;
      const emotionMatched =
        selectedEmotionId === "all" ||
        Number(post.emotionId) === Number(selectedEmotionId);
      const dateMatched = isInSelectedDateRange(post, dateRange);

      if (!statusMatched || !emotionMatched || !dateMatched) {
        return false;
      }

      if (!trimmedKeyword) {
        return true;
      }

      const title = String(post.title || "").toLowerCase();
      const author = String(getAuthorName(post)).toLowerCase();
      const targetText = searchField === "author" ? author : title;

      return targetText.includes(trimmedKeyword);
    });
  }, [dateRange, posts, searchField, searchKeyword, selectedEmotionId, selectedStatus]);

  const totalPageCount = Math.max(
    1,
    Math.ceil(filteredPosts.length / POSTS_PER_PAGE),
  );
  const pageStartIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const paginatedPosts = filteredPosts.slice(
    pageStartIndex,
    pageStartIndex + POSTS_PER_PAGE,
  );
  const pageGroupStart =
    Math.floor((currentPage - 1) / PAGE_BUTTON_COUNT) * PAGE_BUTTON_COUNT + 1;
  const pageGroupEnd = Math.min(
    pageGroupStart + PAGE_BUTTON_COUNT - 1,
    totalPageCount,
  );
  const pageNumbers = Array.from(
    { length: pageGroupEnd - pageGroupStart + 1 },
    (_, index) => pageGroupStart + index,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [dateRange, searchField, searchKeyword, selectedContentType, selectedEmotionId, selectedStatus]);

  useEffect(() => {
    if (currentPage > totalPageCount) {
      setCurrentPage(totalPageCount);
    }
  }, [currentPage, totalPageCount]);

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

  const renderPostCard = (post) => {
    const status = getPostStatus(post);

    return (
      <article className={styles.contentCard} key={post.postId}>
        <div className={styles.cardTopRow}>
          <span className={styles.postId}>#{post.postId}</span>
          <b className={`${styles.statusBadge} ${getStatusClassName(status)}`}>
            {status}
          </b>
        </div>

        <div className={styles.emotionPreview}>
          <span>{getEmotionLabel(post.emotionId)}</span>
        </div>

        <div className={styles.feedBody}>
          <div className={styles.authorRow}>
            <div className={styles.avatar}>{getAuthorName(post)[0]}</div>
            <div>
              <strong>{getAuthorName(post)}</strong>
              <span>{post.createdAt || "작성일 없음"}</span>
            </div>
          </div>

          <h3>{post.title || "제목 없음"}</h3>
          <p>{post.content || "본문 없음"}</p>
        </div>

        <div className={styles.statRow}>
          <span>댓글 {post.commentCount ?? 0}</span>
          <span>해시태그 {post.hashtagCount ?? 0}</span>
          <span>감정 {getEmotionLabel(post.emotionId)}</span>
        </div>

        {renderActionButtons(status)}
      </article>
    );
  };

  const renderContentCards = () => {
    if (selectedContentType !== "게시글") {
      return (
        <div className={styles.emptyFeed}>
          <strong>{selectedContentType} 데이터 없음</strong>
          <span>현재 작업은 게시글 조회 기능을 먼저 연결했습니다.</span>
        </div>
      );
    }

    if (postsLoading) {
      return (
        <div className={styles.emptyFeed}>
          <strong>게시글 조회 중</strong>
          <span>백엔드에서 게시글 목록을 불러오고 있습니다.</span>
        </div>
      );
    }

    if (postsError) {
      return (
        <div className={styles.emptyFeed}>
          <strong>게시글 조회 실패</strong>
          <span>백엔드 API 응답을 확인해주세요.</span>
        </div>
      );
    }

    if (filteredPosts.length === 0) {
      return (
        <div className={styles.emptyFeed}>
          <strong>검색된 게시글 없음</strong>
          <span>검색어 또는 필터 조건을 조정해주세요.</span>
        </div>
      );
    }

    return paginatedPosts.map(renderPostCard);
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
        <div className={styles.searchControls}>
          <select
            value={searchField}
            onChange={(event) => setSearchField(event.target.value)}
            aria-label="게시글 검색 기준"
          >
            <option value="title">제목</option>
            <option value="author">작성자</option>
          </select>
          <SearchBar
            placeholder={
              searchField === "title" ? "제목으로 검색" : "작성자로 검색"
            }
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
          />
        </div>
      </section>

      <section className={styles.contentShell}>
        <main className={styles.contentMain}>
          <div className={styles.statusToolbar}>
            <div className={styles.statusPills}>
              {statusFilters.map((label) => (
                <button
                  key={label}
                  type="button"
                  className={label === selectedStatus ? styles.activeStatus : ""}
                  onClick={() => setSelectedStatus(label)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className={styles.viewTools}>
              <span>
                총 {filteredPosts.length.toLocaleString()}개 / {currentPage}쪽
              </span>
            </div>
          </div>

          <section className={styles.summaryPanel}>
            <h2>{selectedContentType} 관리</h2>
            <p>{contentDescriptions[selectedContentType]}</p>
          </section>

          <section className={styles.feedList}>{renderContentCards()}</section>

          {selectedContentType === "게시글" && filteredPosts.length > 0 ? (
            <nav className={styles.pagination} aria-label="게시글 목록 페이지 이동">
              <div className={styles.paginationButtons}>
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                >
                  이전
                </button>
                {pageNumbers.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    className={
                      pageNumber === currentPage ? styles.activePage : ""
                    }
                    aria-current={
                      pageNumber === currentPage ? "page" : undefined
                    }
                    onClick={() => setCurrentPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage === totalPageCount}
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPageCount, page + 1))
                  }
                >
                  다음
                </button>
              </div>
            </nav>
          ) : null}
        </main>

        <aside className={styles.sideRail}>
          <section className={styles.filterPanel}>
            <h2>필터</h2>
            <label>
              작성 시간
              <select
                value={dateRange}
                onChange={(event) => setDateRange(event.target.value)}
              >
                <option value="all">전체 기간</option>
                <option value="today">오늘</option>
                <option value="week">최근 7일</option>
              </select>
            </label>
            <label>
              감정
              <select
                value={selectedEmotionId}
                onChange={(event) => setSelectedEmotionId(event.target.value)}
              >
                {emotionFilters.map((emotionItem) => (
                  <option key={emotionItem.id} value={emotionItem.id}>
                    {emotionItem.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => {
                setDateRange("all");
                setSelectedEmotionId("all");
                setSelectedStatus("전체");
                setSearchField("title");
                setSearchKeyword("");
              }}
            >
              필터 초기화
            </button>
          </section>

          <section className={styles.bulkPanel}>
            <div className={styles.panelTitleRow}>
              <h2>게시글 관리 정보</h2>
              <span>{posts.length.toLocaleString()}개 조회</span>
            </div>
            <p>
              게시글은 12개씩 카드 형태로 표시됩니다. 검색과 감정 필터는 현재
              조회된 게시글 목록 기준으로 즉시 적용됩니다.
            </p>
          </section>
        </aside>
      </section>
    </AdminLayout>
  );
}
