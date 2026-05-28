import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { AdminLayout } from "../common/AdminLayout";
import { SearchBar } from "../common/SearchBar";
import { SegmentedControl } from "../common/SegmentedControl";
import { useAuthStore } from "../../../../stores/useAuthStore";
import styles from "../../adminComponentsCss/contentManagement/ContentManagementPage.module.css";

const contentTabs = ["게시글", "댓글", "이미지", "해시태그"];
const statusFilters = ["전체", "공개", "숨김", "삭제"];
const POSTS_PER_PAGE = 12; // 가로 3개 x 세로 4개로 한 페이지에 게시글 12개를 보여줍니다.
const PAGE_BUTTON_COUNT = 10; // 페이지 번호는 사용자 관리와 같이 최대 10개씩 보여줍니다.
const NO_IMAGE_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
      <rect width="640" height="360" rx="28" fill="#f3f4f6"/>
      <rect x="190" y="92" width="260" height="176" rx="24" fill="#ffffff" stroke="#d9d6ff" stroke-width="4"/>
      <circle cx="262" cy="150" r="28" fill="#d9d6ff"/>
      <path d="M218 235l78-74 52 48 34-32 40 58H218z" fill="#b8b2ff"/>
      <text x="320" y="304" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#667085">이미지 없음</text>
    </svg>
  `);

const emotionFilters = [
  { id: "all", label: "전체 감정" },
  { id: 1, label: "행복", color: "#FFD700" },
  { id: 2, label: "슬픔", color: "#4A90E2" },
  { id: 3, label: "차분함", color: "#F4A460" },
  { id: 4, label: "화남", color: "#E74C3C" },
  { id: 5, label: "신나감", color: "#FF69B4" },
  { id: 6, label: "무감정", color: "#95A5A6" },
];

const contentDescriptions = {
  게시글: "게시글 제목 또는 작성자로 검색하고 감정별로 분류 상태를 확인할 수 있습니다.",
  댓글: "댓글 내용은 원본 게시글 기준으로 확인하고 숨김/삭제 처리할 수 있습니다.",
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

const getEmotionMeta = (emotionId) => {
  return (
    emotionFilters.find((emotionItem) => emotionItem.id === Number(emotionId)) ||
    { label: "기타", color: "#667085" }
  );
};

/* ==========================================================================
 * 게시글 본문에서 첫 번째 이미지 주소를 찾는 함수
 * --------------------------------------------------------------------------
 * 일반 피드의 FeedCard도 게시글 content HTML 안에 들어 있는 <img> 태그를 찾아
 * 대표 이미지처럼 보여줍니다. 관리자 콘텐츠 관리에서도 같은 방식으로 첫 이미지를
 * 추출해서 카드 상단 이미지 영역에 보여줍니다.
 * ========================================================================== */
const extractImageUrl = (html) => {
  if (!html) {
    return null;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const img = doc.querySelector("img");

    return img?.getAttribute("src") || null;
  } catch (error) {
    const match = html.match(/<img[^>]+src=["']?([^"' >]+)["']?/i);

    return match ? match[1] : null;
  }
};

const buildImageUrl = (imageUrl, backserver) => {
  if (!imageUrl) {
    return NO_IMAGE_PLACEHOLDER;
  }

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  if (imageUrl.startsWith("/")) {
    return `${backserver}${imageUrl}`;
  }

  return imageUrl;
};

/* ==========================================================================
 * 게시글 본문 HTML에서 화면에 보여줄 텍스트만 남기는 함수
 * --------------------------------------------------------------------------
 * content에는 이미지 태그와 HTML 태그가 섞여 있을 수 있습니다.
 * 카드 본문에는 이미지 태그를 제외한 순수 텍스트만 보여주기 위해 태그를 제거합니다.
 * ========================================================================== */
const stripHtml = (html) => {
  if (!html) {
    return "";
  }

  const text = html
    .replace(/<img[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .trim();
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;

  return textarea.value;
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
 * 현재 구현 범위:
 * - 게시글 목록 API 조회
 * - 제목/작성자 검색
 * - 공개/숨김/삭제 상태 필터
 * - 행복, 슬픔, 차분함, 화남, 신나감, 무감정 감정 필터
 * - 가로 3개 x 세로 4개, 한 페이지 12개 출력
 * - 페이지 번호 10개 단위 표시
 *
 * 초보자 설명:
 * - API 호출로 받은 원본 배열은 posts 상태에 저장합니다.
 * - 검색/필터 결과는 posts를 직접 바꾸지 않고 filteredPosts로 계산합니다.
 * - 이렇게 하면 필터를 초기화했을 때 다시 API를 호출하지 않아도 원본 목록으로 돌아갈 수 있습니다.
 * ========================================================================== */
export function ContentManagementPage() {
  const [selectedContentType, setSelectedContentType] = useState("게시글");
  const [selectedStatus, setSelectedStatus] = useState("전체");
  const [searchField, setSearchField] = useState("title");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedEmotionId, setSelectedEmotionId] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState(false);
  const [actionLoadingPostId, setActionLoadingPostId] = useState(null); // 숨김/삭제/복구처럼 카드 버튼 작업 중인 게시글 번호입니다.
  const { accessToken } = useAuthStore();

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
        console.error("[ADMIN_CONTENT_POSTS_ERROR]", {
          endpoint: `${BACKSERVER}/admin/api/content/posts`,
          status: error.response?.status,
          response: error.response?.data,
          message: error.message,
        });
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
  }, [
    dateRange,
    posts,
    searchField,
    searchKeyword,
    selectedEmotionId,
    selectedStatus,
  ]);

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
  }, [
    dateRange,
    searchField,
    searchKeyword,
    selectedContentType,
    selectedEmotionId,
    selectedStatus,
  ]);

  useEffect(() => {
    if (currentPage > totalPageCount) {
      setCurrentPage(totalPageCount);
    }
  }, [currentPage, totalPageCount]);

  /*
   * 게시글 한 건을 화면 목록에서 교체하는 함수입니다.
   * --------------------------------------------------------------------------
   * 초보자 설명:
   * - 숨김/삭제/복구 API는 변경된 게시글 한 건을 다시 내려줍니다.
   * - 전체 목록을 다시 불러오지 않고 posts 배열에서 같은 postId를 가진 항목만 바꾸면
   *   화면이 빠르게 갱신됩니다.
   */
  const replacePostInList = (updatedPost) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.postId === updatedPost.postId ? updatedPost : post,
      ),
    );
  };

  /*
   * 게시글 상태 변경 API 공통 처리 함수입니다.
   * --------------------------------------------------------------------------
   * actionType 값에 따라 서로 다른 관리자 API를 호출합니다.
   * - hide: 공개 게시글을 숨김 처리합니다.
   * - restoreHidden: 숨김 게시글을 공개 상태로 복구합니다.
   * - softDelete: 게시글을 삭제 탭으로 이동시킵니다.
   * - restoreDeleted: 삭제 탭의 게시글을 복구합니다.
   * - hardDelete: 삭제 탭의 게시글을 DB에서 완전히 삭제합니다.
   */
  const handlePostAction = (post, actionType) => {
    if (!accessToken) {
      alert("로그인 정보가 없어 게시글을 처리할 수 없습니다.");
      return;
    }

    const actionConfig = {
      hide: {
        method: "put",
        url: `${BACKSERVER}/admin/api/content/posts/${post.postId}/hide`,
        confirmMessage: "해당 게시글을 숨김 처리하시겠습니까?",
      },
      restoreHidden: {
        method: "put",
        url: `${BACKSERVER}/admin/api/content/posts/${post.postId}/visibility/restore`,
        confirmMessage: "숨김 처리된 게시글을 공개 상태로 복구하시겠습니까?",
      },
      softDelete: {
        method: "put",
        url: `${BACKSERVER}/admin/api/content/posts/${post.postId}/delete`,
        confirmMessage: "해당 게시글을 삭제 탭으로 이동시키겠습니까?",
      },
      restoreDeleted: {
        method: "put",
        url: `${BACKSERVER}/admin/api/content/posts/${post.postId}/delete/restore`,
        confirmMessage: "삭제된 게시글을 복구하시겠습니까?",
      },
      hardDelete: {
        method: "delete",
        url: `${BACKSERVER}/admin/api/content/posts/${post.postId}/delete/permanent`,
        confirmMessage:
          "해당 게시글을 완전히 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
      },
    };
    const config = actionConfig[actionType];

    if (!config || !window.confirm(config.confirmMessage)) {
      return;
    }

    setActionLoadingPostId(post.postId);

    axios({
      method: config.method,
      url: config.url,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((res) => {
        if (actionType === "hardDelete") {
          setPosts((prevPosts) =>
            prevPosts.filter((postItem) => postItem.postId !== post.postId),
          );
          return;
        }

        if (res.data?.post) {
          replacePostInList(res.data.post);
        }
      })
      .catch((error) => {
        console.error("[ADMIN_CONTENT_POST_ACTION_ERROR]", {
          actionType,
          postId: post.postId,
          status: error.response?.status,
          response: error.response?.data,
          message: error.message,
        });
        alert("게시글 처리 중 문제가 발생했습니다.");
      })
      .finally(() => {
        setActionLoadingPostId(null);
      });
  };

  const renderActionButtons = (post, status) => {
    const isActionLoading = actionLoadingPostId === post.postId;

    if (status === "삭제") {
      return (
        <div className={styles.cardActions}>
          <button
            type="button"
            disabled={isActionLoading}
            onClick={() => handlePostAction(post, "restoreDeleted")}
          >
            복구
          </button>
          <button
            type="button"
            disabled={isActionLoading}
            onClick={() => handlePostAction(post, "hardDelete")}
          >
            완전 삭제
          </button>
          <button type="button" disabled={isActionLoading}>
            상세보기
          </button>
        </div>
      );
    }

    return (
      <div className={styles.cardActions}>
        {status === "숨김" ? (
          <button
            type="button"
            disabled={isActionLoading}
            onClick={() => handlePostAction(post, "restoreHidden")}
          >
            복구
          </button>
        ) : (
          <button
            type="button"
            disabled={isActionLoading}
            onClick={() => handlePostAction(post, "hide")}
          >
            숨김
          </button>
        )}
        <button
          type="button"
          disabled={isActionLoading}
          onClick={() => handlePostAction(post, "softDelete")}
        >
          삭제
        </button>
        <button type="button" disabled={isActionLoading}>
          상세보기
        </button>
      </div>
    );
  };

  const renderPostCard = (post) => {
    const status = getPostStatus(post);
    const rawImageSrc =
      post.imageSrc ||
      post.image ||
      post.cover ||
      post.thumbnail ||
      extractImageUrl(post.content);
    const imageSrc = buildImageUrl(rawImageSrc, BACKSERVER);
    const hasImage = Boolean(rawImageSrc);
    const cardText = stripHtml(post.content) || "본문 없음";
    const emotionMeta = getEmotionMeta(post.emotionId);

    return (
      <article className={styles.contentCard} key={post.postId}>
        <div className={styles.cardTopRow}>
          <span className={styles.postId}>#{post.postId}</span>
          <b className={`${styles.statusBadge} ${getStatusClassName(status)}`}>
            {status}
          </b>
        </div>

        <div
          className={`${styles.adminPostImageWrap} ${
            hasImage ? "" : styles.noImageWrap
          }`}
        >
          <img
            className={styles.adminPostImage}
            src={imageSrc}
            alt={hasImage ? post.title || getAuthorName(post) : "이미지 없음"}
          />
        </div>

        <div className={styles.feedBody}>
          <div className={styles.authorRow}>
            <div className={styles.avatar}>{getAuthorName(post)[0]}</div>
            <div>
              <strong>{getAuthorName(post)}</strong>
              <span>{post.createdAt || "작성일 없음"}</span>
            </div>
          </div>

          <div className={styles.titleWithEmotion}>
            <h3>{post.title || "제목 없음"}</h3>
            <span
              className={styles.emotionTag}
              style={{
                borderColor: emotionMeta.color,
                color: emotionMeta.color,
                backgroundColor: `${emotionMeta.color}18`,
              }}
            >
              {emotionMeta.label}
            </span>
          </div>
          <p>{cardText}</p>
        </div>

        <div className={styles.statRow}>
          <span>댓글 {post.commentCount ?? 0}</span>
          <span>해시태그 {post.hashtagCount ?? 0}</span>
        </div>

        {renderActionButtons(post, status)}
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
            <nav
              className={styles.pagination}
              aria-label="게시글 목록 페이지 이동"
            >
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
              게시글은 12개씩 카드 형태로 표시합니다. 검색과 감정 필터는 현재
              조회된 게시글 목록 기준으로 즉시 적용됩니다.
            </p>
          </section>
        </aside>
      </section>
    </AdminLayout>
  );
}
