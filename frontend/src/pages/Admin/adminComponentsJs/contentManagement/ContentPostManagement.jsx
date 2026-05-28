import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuthStore } from "../../../../stores/useAuthStore";
import { ContentBulkActions } from "./ContentBulkActions";
import { ContentManagementControls } from "./ContentManagementControls";
import { ContentManagementToolbar } from "./ContentManagementToolbar";
import { ContentPostGrid } from "./ContentPostGrid";
import { ContentSidePanel } from "./ContentSidePanel";
import styles from "../../adminComponentsCss/contentManagement/ContentManagementPage.module.css";

const contentTabs = ["게시글", "댓글", "이미지", "해시태그"];
const statusFilters = ["전체", "공개", "숨김", "삭제"];
const POSTS_PER_PAGE = 12; // 가로 3개, 세로 4개로 보여주기 위해 한 페이지에 12개를 사용합니다.
const PAGE_BUTTON_COUNT = 10; // 페이지 번호는 사용자 관리와 동일하게 최대 10개까지 보여줍니다.

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
  { id: 1, label: "행복", color: "#f5a623" },
  { id: 2, label: "슬픔", color: "#4a90e2" },
  { id: 3, label: "차분함", color: "#36b37e" },
  { id: 4, label: "화남", color: "#e74c3c" },
  { id: 5, label: "신나감", color: "#9b5cff" },
  { id: 6, label: "무감정", color: "#7a869a" },
];

const contentDescriptions = {
  게시글:
    "게시글 제목 또는 작성자로 검색하고 감정별, 상태별로 분류할 수 있습니다.",
  댓글: "댓글 관리는 게시글 관리 API가 안정화된 뒤 연결할 예정입니다.",
  이미지:
    "이미지 관리는 게시글에 첨부된 이미지 기준으로 확장할 예정입니다.",
  해시태그:
    "해시태그 사용량과 노출 여부 관리는 추후 연결할 예정입니다.",
};

const getStatusClassName = (status) => {
  if (status === "공개") return styles.statusPublic;
  if (status === "숨김") return styles.statusHidden;
  return styles.statusDeleted;
};

const getPostStatus = (post) => {
  if (post.deletedYn === "Y") return "삭제";
  if (post.visibility && post.visibility !== "PUBLIC") return "숨김";
  return "공개";
};

const getAuthorName = (post) =>
  post.authorNickname || post.authorName || "작성자 없음";

const getEmotionMeta = (emotionId) =>
  emotionFilters.find((emotionItem) => emotionItem.id === Number(emotionId)) ||
  { label: "기타", color: "#667085" };

const extractImageUrl = (html) => {
  if (!html) return null;

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
  if (!imageUrl) return NO_IMAGE_PLACEHOLDER;
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  if (imageUrl.startsWith("/")) return `${backserver}${imageUrl}`;

  // DB에 파일명만 저장된 기존 게시글은 백엔드 uploads 경로를 붙여 이미지 요청 경로를 맞춥니다.
  return `${backserver}/uploads/${imageUrl}`;
};

const stripHtml = (html) => {
  if (!html) return "";

  const text = html
    .replace(/<img[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .trim();
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;

  return textarea.value;
};

const isInSelectedDateRange = (post, dateRange) => {
  if (dateRange === "all") return true;
  if (!post.createdAt) return false;

  const createdDate = new Date(post.createdAt.replace(" ", "T"));
  if (Number.isNaN(createdDate.getTime())) return true;

  const now = new Date();
  const diffMs = now.getTime() - createdDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (dateRange === "today") {
    return createdDate.toDateString() === now.toDateString();
  }

  return diffDays <= 7;
};

/* ==========================================================================
 * 게시글 관리 컨테이너 컴포넌트
 * --------------------------------------------------------------------------
 * 게시글 관리에 필요한 기능을 이 컴포넌트가 직접 소유합니다.
 *
 * 초보자 설명:
 * - state: 화면에서 바뀌는 값입니다. 예) 검색어, 선택된 게시글, 현재 페이지
 * - useEffect: 컴포넌트가 처음 보이거나 토큰이 바뀔 때 API를 호출합니다.
 * - useMemo: 게시글 목록이 많아질 수 있으므로 필터 결과를 필요할 때만 다시 계산합니다.
 * - 하위 컴포넌트는 화면 조각을 담당하고, 실제 데이터 흐름은 여기서 관리합니다.
 * ========================================================================== */
export function ContentPostManagement() {
  const [selectedContentType, setSelectedContentType] = useState("게시글"); // 현재 선택한 콘텐츠 탭입니다.
  const [selectedStatus, setSelectedStatus] = useState("전체"); // 공개/숨김/삭제 필터 값입니다.
  const [searchField, setSearchField] = useState("title"); // 제목 또는 작성자 중 검색 기준입니다.
  const [searchKeyword, setSearchKeyword] = useState(""); // 검색창에 입력된 문구입니다.
  const [selectedEmotionId, setSelectedEmotionId] = useState("all"); // 감정 필터 값입니다.
  const [dateRange, setDateRange] = useState("all"); // 작성일 필터 값입니다.
  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지 번호입니다.
  const [posts, setPosts] = useState([]); // 백엔드에서 받아온 전체 게시글 목록입니다.
  const [selectedPostIds, setSelectedPostIds] = useState([]); // 체크박스로 선택한 게시글 id 목록입니다.
  const [postsLoading, setPostsLoading] = useState(false); // 게시글 조회 중인지 표시합니다.
  const [postsError, setPostsError] = useState(false); // 게시글 조회 실패 여부입니다.
  const [actionLoadingPostId, setActionLoadingPostId] = useState(null); // 개별 처리 중인 게시글 id입니다.
  const [bulkActionLoading, setBulkActionLoading] = useState(false); // 여러 게시글을 처리 중인지 표시합니다.
  const { accessToken } = useAuthStore(); // 관리자 API 호출에 필요한 토큰입니다.

  const BACKSERVER = (
    import.meta.env.VITE_BACKSERVER || "http://localhost:8080"
  ).replace(/\/$/, "");

  useEffect(() => {
    if (!accessToken) return;

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

      if (!statusMatched || !emotionMatched || !dateMatched) return false;
      if (!trimmedKeyword) return true;

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
  const selectedPosts = posts.filter((post) =>
    selectedPostIds.includes(post.postId),
  );
  const currentPagePostIds = paginatedPosts.map((post) => post.postId);
  const isCurrentPageAllSelected =
    currentPagePostIds.length > 0 &&
    currentPagePostIds.every((postId) => selectedPostIds.includes(postId));

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

  const replacePostInList = (updatedPost) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.postId === updatedPost.postId ? updatedPost : post,
      ),
    );
  };

  const removePostFromList = (postId) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.postId !== postId));
    setSelectedPostIds((prevIds) => prevIds.filter((id) => id !== postId));
  };

  const getPostActionConfig = (post, actionType) => {
    const baseUrl = `${BACKSERVER}/admin/api/content/posts/${post.postId}`;

    const actionConfig = {
      hide: {
        method: "put",
        url: `${baseUrl}/hide`,
        confirmMessage: "선택한 게시글을 숨김 처리하시겠습니까?",
      },
      restoreHidden: {
        method: "put",
        url: `${baseUrl}/visibility/restore`,
        confirmMessage: "숨김 처리된 게시글을 공개 상태로 복구하시겠습니까?",
      },
      softDelete: {
        method: "put",
        url: `${baseUrl}/delete`,
        confirmMessage: "선택한 게시글을 삭제 탭으로 이동시키겠습니까?",
      },
      restoreDeleted: {
        method: "put",
        url: `${baseUrl}/delete/restore`,
        confirmMessage: "삭제된 게시글을 복구하시겠습니까?",
      },
      hardDelete: {
        method: "delete",
        url: `${baseUrl}/delete/permanent`,
        confirmMessage:
          "해당 게시글을 완전히 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
      },
    };

    return actionConfig[actionType];
  };

  const requestPostAction = (post, actionType) => {
    const config = getPostActionConfig(post, actionType);

    return axios({
      method: config.method,
      url: config.url,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  };

  const handlePostAction = (post, actionType) => {
    if (!accessToken) {
      alert("로그인 정보가 없어 게시글을 처리할 수 없습니다.");
      return;
    }

    const config = getPostActionConfig(post, actionType);

    if (!config || !window.confirm(config.confirmMessage)) return;

    setActionLoadingPostId(post.postId);

    requestPostAction(post, actionType)
      .then((res) => {
        if (actionType === "hardDelete") {
          removePostFromList(post.postId);
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

  const togglePostSelection = (postId) => {
    setSelectedPostIds((prevIds) =>
      prevIds.includes(postId)
        ? prevIds.filter((id) => id !== postId)
        : [...prevIds, postId],
    );
  };

  const toggleCurrentPageSelection = () => {
    setSelectedPostIds((prevIds) => {
      if (isCurrentPageAllSelected) {
        return prevIds.filter((postId) => !currentPagePostIds.includes(postId));
      }

      return Array.from(new Set([...prevIds, ...currentPagePostIds]));
    });
  };

  const handleBulkAction = async (actionType) => {
    if (!accessToken) {
      alert("로그인 정보가 없어 게시글을 처리할 수 없습니다.");
      return;
    }

    const targetPosts = selectedPosts.filter((post) => {
      const status = getPostStatus(post);

      if (actionType === "hide") return status !== "삭제";
      if (actionType === "softDelete") return status !== "삭제";
      if (actionType === "restore") return status === "숨김" || status === "삭제";

      return false;
    });

    if (targetPosts.length === 0) {
      alert("선택한 게시글 중 처리할 수 있는 대상이 없습니다.");
      return;
    }

    const actionLabel =
      actionType === "hide" ? "숨김" : actionType === "softDelete" ? "삭제" : "복구";

    if (!window.confirm(`${targetPosts.length}개 게시글을 ${actionLabel} 처리하시겠습니까?`)) {
      return;
    }

    setBulkActionLoading(true);

    try {
      const responses = await Promise.all(
        targetPosts.map((post) => {
          const status = getPostStatus(post);
          const nextActionType =
            actionType === "restore"
              ? status === "삭제"
                ? "restoreDeleted"
                : "restoreHidden"
              : actionType;

          return requestPostAction(post, nextActionType).then((res) => ({
            post,
            res,
          }));
        }),
      );

      responses.forEach(({ post, res }) => {
        if (res.data?.post) {
          replacePostInList(res.data.post);
        } else {
          removePostFromList(post.postId);
        }
      });
      setSelectedPostIds([]);
    } catch (error) {
      console.error("[ADMIN_CONTENT_POST_BULK_ACTION_ERROR]", {
        actionType,
        status: error.response?.status,
        response: error.response?.data,
        message: error.message,
      });
      alert("선택 게시글 처리 중 문제가 발생했습니다.");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const getPostImageInfo = (post) => {
    const rawImageSrc =
      post.imageSrc ||
      post.image ||
      post.cover ||
      post.thumbnail ||
      extractImageUrl(post.content);

    return {
      hasImage: Boolean(rawImageSrc),
      imageSrc: buildImageUrl(rawImageSrc, BACKSERVER),
    };
  };

  const resetFilters = () => {
    setSelectedStatus("전체");
    setSelectedEmotionId("all");
    setDateRange("all");
    setSearchKeyword("");
    setSelectedPostIds([]);
  };

  return (
    <>
      <ContentManagementToolbar
        contentTabs={contentTabs}
        selectedContentType={selectedContentType}
        onSelectContentType={setSelectedContentType}
        searchField={searchField}
        onSearchFieldChange={setSearchField}
        searchKeyword={searchKeyword}
        onSearchKeywordChange={setSearchKeyword}
      />

      <section className={styles.contentShell}>
        <main className={styles.contentMain}>
          <ContentManagementControls
            statusFilters={statusFilters}
            selectedStatus={selectedStatus}
            onSelectedStatusChange={setSelectedStatus}
            filteredPostCount={filteredPosts.length}
            emotionFilters={emotionFilters}
            selectedEmotionId={selectedEmotionId}
            onSelectedEmotionIdChange={setSelectedEmotionId}
          />

          <ContentBulkActions
            isCurrentPageAllSelected={isCurrentPageAllSelected}
            onToggleCurrentPageSelection={toggleCurrentPageSelection}
            selectedCount={selectedPostIds.length}
            bulkActionLoading={bulkActionLoading}
            onBulkAction={handleBulkAction}
          />

          <ContentPostGrid
            postsLoading={postsLoading}
            postsError={postsError}
            paginatedPosts={paginatedPosts}
            selectedPostIds={selectedPostIds}
            onTogglePostSelection={togglePostSelection}
            getPostStatus={getPostStatus}
            getStatusClassName={getStatusClassName}
            getAuthorName={getAuthorName}
            getEmotionMeta={getEmotionMeta}
            getPostImageInfo={getPostImageInfo}
            stripHtml={stripHtml}
            actionLoadingPostId={actionLoadingPostId}
            onPostAction={handlePostAction}
            filteredPostCount={filteredPosts.length}
            currentPage={currentPage}
            totalPageCount={totalPageCount}
            pageNumbers={pageNumbers}
            onPageChange={setCurrentPage}
          />
        </main>

        <ContentSidePanel
          selectedContentType={selectedContentType}
          contentDescriptions={contentDescriptions}
          emotionFilters={emotionFilters}
          selectedEmotionId={selectedEmotionId}
          onSelectedEmotionIdChange={setSelectedEmotionId}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onResetFilters={resetFilters}
        />
      </section>
    </>
  );
}
