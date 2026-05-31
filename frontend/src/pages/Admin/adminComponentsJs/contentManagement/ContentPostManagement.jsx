import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import SentimentDissatisfiedIcon from "@mui/icons-material/SentimentDissatisfied";
import SpaIcon from "@mui/icons-material/Spa";
import MoodBadIcon from "@mui/icons-material/MoodBad";
import CelebrationIcon from "@mui/icons-material/Celebration";
import SentimentNeutralIcon from "@mui/icons-material/SentimentNeutral";
import { useAuthStore } from "../../../../stores/useAuthStore";
import { extractImageUrls } from "../../../../shared/lib/postHelpers";
import { ContentBulkActions } from "./ContentBulkActions";
import { ContentCommentGrid } from "./ContentCommentGrid";
import { ContentHashtagGrid } from "./ContentHashtagGrid";
import { ContentManagementControls } from "./ContentManagementControls";
import { ContentManagementToolbar } from "./ContentManagementToolbar";
import { ContentPostDetailModal } from "./ContentPostDetailModal";
import { ContentPostGrid } from "./ContentPostGrid";
import { ContentSidePanel } from "./ContentSidePanel";
import styles from "../../adminComponentsCss/contentManagement/ContentPostManagement.module.css";

const POSTS_PER_PAGE = 12;
const PAGE_BUTTON_COUNT = 10;

const statusFilters = ["전체", "공개", "숨김", "삭제"];

const emotionFilters = [
  { value: "all", label: "전체 감정", color: "#667085", icon: SentimentNeutralIcon },
  { value: "1", label: "행복", color: "#FFD700", icon: EmojiEmotionsIcon },
  { value: "2", label: "슬픔", color: "#4A90E2", icon: SentimentDissatisfiedIcon },
  { value: "3", label: "차분함", color: "#F4A460", icon: SpaIcon },
  { value: "4", label: "화남", color: "#E74C3C", icon: MoodBadIcon },
  { value: "5", label: "신남", color: "#FF69B4", icon: CelebrationIcon },
  { value: "6", label: "무감정", color: "#95A5A6", icon: SentimentNeutralIcon },
];

/* ==========================================================================
 * 게시글 콘텐츠 관리 컨테이너
 * --------------------------------------------------------------------------
 * 게시글 조회, 검색, 필터, 페이지네이션, 단일/복수 상태 변경을 담당합니다.
 *
 * 초보자 설명:
 * - 이 컴포넌트는 데이터를 가져오고 상태를 관리하는 중심 컴포넌트입니다.
 * - 화면 조각은 Toolbar, Controls, BulkActions, PostGrid, SidePanel로 나눴습니다.
 * - 컴포넌트 분리 후에도 기능이 흩어지지 않도록 API 호출과 계산은 이 파일에서
 *   한 번에 관리하고, 하위 컴포넌트에는 필요한 값과 이벤트만 넘깁니다.
 * ========================================================================== */
export function ContentPostManagement() {
  const [activeTab, setActiveTab] = useState("게시글"); // 게시글/댓글/해시태그 탭입니다.
  const [searchField, setSearchField] = useState("title"); // 제목 또는 작성자 검색 기준입니다.
  const [searchKeyword, setSearchKeyword] = useState(""); // 검색창에 입력한 검색어입니다.
  const [activeStatus, setActiveStatus] = useState("전체"); // 공개/숨김/삭제 상태 필터입니다.
  const [emotionFilter, setEmotionFilter] = useState("all"); // 선택된 감정 필터입니다.
  const [startDate, setStartDate] = useState(""); // 기간 검색 시작일입니다.
  const [endDate, setEndDate] = useState(""); // 기간 검색 종료일입니다.
  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지 번호입니다.
  const [posts, setPosts] = useState([]); // 백엔드에서 받은 게시글 목록입니다.
  const [postsLoading, setPostsLoading] = useState(false); // 게시글 목록 API 호출 중인지 표시합니다.
  const [postsError, setPostsError] = useState(false); // 게시글 목록 API 실패 여부입니다.
  const [comments, setComments] = useState([]); // 댓글 탭에서 보여줄 댓글 목록입니다.
  const [commentsLoading, setCommentsLoading] = useState(false); // 댓글 목록 API 호출 중인지 표시합니다.
  const [commentsError, setCommentsError] = useState(false); // 댓글 목록 API 실패 여부입니다.
  const [hashtags, setHashtags] = useState([]); // 해시태그 탭에서 보여줄 해시태그 목록입니다.
  const [hashtagsLoading, setHashtagsLoading] = useState(false); // 해시태그 목록 API 호출 중인지 표시합니다.
  const [hashtagsError, setHashtagsError] = useState(false); // 해시태그 목록 API 실패 여부입니다.
  const [selectedPostIds, setSelectedPostIds] = useState([]); // 체크박스로 선택된 게시글 id 목록입니다.
  const [selectedDetailPost, setSelectedDetailPost] = useState(null); // 상세보기 모달에 보여줄 게시글 정보입니다.
  const [actionLoadingPostId, setActionLoadingPostId] = useState(null); // 단일 처리 중인 게시글 id입니다.
  const [bulkActionLoading, setBulkActionLoading] = useState(false); // 복수 처리 API 호출 중인지 표시합니다.
  const { accessToken } = useAuthStore(); // 관리자 API 호출에 필요한 로그인 토큰입니다.

  const BACKSERVER = (
    import.meta.env.VITE_BACKSERVER || "http://localhost:8080"
  ).replace(/\/$/, "");

  const noImageSrc = useMemo(() => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="420" height="180" viewBox="0 0 420 180">
        <rect width="420" height="180" rx="24" fill="#f3f4f6"/>
        <circle cx="210" cy="70" r="24" fill="#d0d5dd"/>
        <path d="M128 132l52-44 40 34 28-24 44 34H128z" fill="#98a2b3"/>
        <text x="210" y="158" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#667085">이미지 없음</text>
      </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }, []);

  const fetchPosts = () => {
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
        setPosts(Array.isArray(res.data?.posts) ? res.data.posts : []);
      })
      .catch((error) => {
        console.log(error);
        setPosts([]);
        setPostsError(true);
      })
      .finally(() => {
        setPostsLoading(false);
      });
  };

  const fetchComments = () => {
    if (!accessToken) {
      return;
    }

    setCommentsLoading(true);
    setCommentsError(false);

    axios
      .get(`${BACKSERVER}/admin/api/content/comments`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((res) => {
        setComments(Array.isArray(res.data?.comments) ? res.data.comments : []);
      })
      .catch((error) => {
        console.log(error);
        setComments([]);
        setCommentsError(true);
      })
      .finally(() => {
        setCommentsLoading(false);
      });
  };

  const fetchHashtags = () => {
    if (!accessToken) {
      return;
    }

    setHashtagsLoading(true);
    setHashtagsError(false);

    axios
      .get(`${BACKSERVER}/admin/api/content/hashtags`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((res) => {
        setHashtags(Array.isArray(res.data?.hashtags) ? res.data.hashtags : []);
      })
      .catch((error) => {
        console.log(error);
        setHashtags([]);
        setHashtagsError(true);
      })
      .finally(() => {
        setHashtagsLoading(false);
      });
  };

  useEffect(() => {
    fetchPosts();
    fetchComments();
    fetchHashtags();
  }, [BACKSERVER, accessToken]);

  const getPostStatus = (post) => {
    if (post.deletedYn === "Y") {
      return "삭제";
    }

    if (post.visibility === "PRIVATE" || post.visibility === "HIDDEN") {
      return "숨김";
    }

    return "공개";
  };

  const getStatusClassName = (status) => {
    if (status === "삭제") {
      return styles.statusDeleted;
    }

    if (status === "숨김") {
      return styles.statusHidden;
    }

    return styles.statusPublic;
  };

  const getAuthorName = (post) => {
    return post.authorNickname || post.authorName || "작성자 없음";
  };

  const getEmotionMeta = (emotionId) => {
    return (
      emotionFilters.find((emotionItem) => emotionItem.value === String(emotionId)) || {
        label: "감정 없음",
        color: "#667085",
        icon: SentimentNeutralIcon,
      }
    );
  };

  const stripHtml = (value) => {
    return String(value || "").replace(/<[^>]*>/g, "").trim();
  };

  const getPostImageInfo = (post) => {
    /*
     * 피드 카드와 동일하게 게시글 본문(content) 안의 <img> 태그까지 이미지 후보로 확인합니다.
     * 게시글 작성 화면은 이미지를 업로드한 뒤 content에 <img src="..."> 형태로 저장하므로,
     * 관리자 API에 별도 thumbnailUrl이 없어도 content만 있으면 첫 번째 이미지를 카드에 표시할 수 있습니다.
     */
    const contentImageUrls = extractImageUrls(post.content);
    const explicitImageSrcs = Array.isArray(post.imageSrcs)
      ? post.imageSrcs
      : post.imageSrcs
        ? [post.imageSrcs]
        : [];
    const imageCandidates = [
      ...explicitImageSrcs,
      post.imageSrc,
      post.image,
      post.cover,
      post.thumbnail,
      post.thumbnailUrl,
      post.imageUrl,
      post.imagePath,
      post.firstImageUrl,
      post.fileUrl,
      ...contentImageUrls,
    ].filter(Boolean);
    const rawImageUrl = imageCandidates[0] || "";

    if (!rawImageUrl) {
      return { imageSrc: noImageSrc, hasImage: false };
    }

    if (/^https?:\/\//i.test(rawImageUrl)) {
      return { imageSrc: rawImageUrl, hasImage: true };
    }

    if (rawImageUrl.startsWith("/")) {
      return { imageSrc: `${BACKSERVER}${rawImageUrl}`, hasImage: true };
    }

    return { imageSrc: `${BACKSERVER}/uploads/${rawImageUrl}`, hasImage: true };
  };

  const filteredPosts = posts.filter((post) => {
    const postStatus = getPostStatus(post);
    const trimmedKeyword = searchKeyword.trim().toLowerCase();
    const authorName = getAuthorName(post).toLowerCase();
    const title = String(post.title || "").toLowerCase();
    const createdDate = String(post.createdAt || "").slice(0, 10);

    if (activeTab !== "게시글") {
      return false;
    }

    if (activeStatus !== "전체" && postStatus !== activeStatus) {
      return false;
    }

    if (
      emotionFilter !== "all" &&
      String(post.emotionId || "") !== emotionFilter
    ) {
      return false;
    }

    if (startDate && createdDate && createdDate < startDate) {
      return false;
    }

    if (endDate && createdDate && createdDate > endDate) {
      return false;
    }

    if (!trimmedKeyword) {
      return true;
    }

    if (searchField === "author") {
      return authorName.includes(trimmedKeyword);
    }

    return title.includes(trimmedKeyword);
  });

  const filteredComments = comments.filter((comment) => {
    const trimmedKeyword = searchKeyword.trim().toLowerCase();

    if (activeTab !== "댓글") {
      return false;
    }

    if (!trimmedKeyword) {
      return true;
    }

    if (searchField === "author") {
      const authorName = `${comment.authorName || ""} ${comment.authorNickname || ""}`.toLowerCase();

      return authorName.includes(trimmedKeyword);
    }

    if (searchField === "postTitle") {
      return String(comment.postTitle || "").toLowerCase().includes(trimmedKeyword);
    }

    return String(comment.content || "").toLowerCase().includes(trimmedKeyword);
  });

  const filteredHashtags = hashtags.filter((hashtag) => {
    const trimmedKeyword = searchKeyword.trim().toLowerCase().replace(/^#/, "");

    if (activeTab !== "해시태그") {
      return false;
    }

    if (!trimmedKeyword) {
      return true;
    }

    return String(hashtag.hashtag || "").toLowerCase().includes(trimmedKeyword);
  });

  const activeFilteredCount =
    activeTab === "댓글"
      ? filteredComments.length
      : activeTab === "해시태그"
        ? filteredHashtags.length
        : filteredPosts.length;
  const totalPageCount = Math.max(
    1,
    Math.ceil(activeFilteredCount / POSTS_PER_PAGE),
  );
  const pageStartIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const paginatedPosts = filteredPosts.slice(
    pageStartIndex,
    pageStartIndex + POSTS_PER_PAGE,
  );
  const paginatedComments = filteredComments.slice(
    pageStartIndex,
    pageStartIndex + POSTS_PER_PAGE,
  );
  const paginatedHashtags = filteredHashtags.slice(
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

  const currentPagePostIds = paginatedPosts.map((post) => post.postId);
  const isCurrentPageSelected =
    currentPagePostIds.length > 0 &&
    currentPagePostIds.every((postId) => selectedPostIds.includes(postId));

  useEffect(() => {
    if (activeTab === "댓글") {
      setSearchField("content");
      return;
    }

    if (activeTab === "해시태그") {
      setSearchField("hashtag");
      return;
    }

    setSearchField("title");
  }, [activeTab]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedPostIds([]);
  }, [activeTab, searchField, searchKeyword, activeStatus, emotionFilter, startDate, endDate]);

  useEffect(() => {
    if (currentPage > totalPageCount) {
      setCurrentPage(totalPageCount);
    }
  }, [currentPage, totalPageCount]);

  const updatePostInList = (updatedPost) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.postId === updatedPost.postId ? { ...post, ...updatedPost } : post,
      ),
    );
  };

  const removePostFromList = (postId) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.postId !== postId));
    setSelectedPostIds((prevIds) => prevIds.filter((id) => id !== postId));
  };

  const getActionEndpoint = (postId, actionType) => {
    const endpointMap = {
      hide: { method: "put", url: `/admin/api/content/posts/${postId}/hide` },
      restoreHidden: {
        method: "put",
        url: `/admin/api/content/posts/${postId}/visibility/restore`,
      },
      softDelete: {
        method: "put",
        url: `/admin/api/content/posts/${postId}/delete`,
      },
      restoreDeleted: {
        method: "put",
        url: `/admin/api/content/posts/${postId}/delete/restore`,
      },
      hardDelete: {
        method: "delete",
        url: `/admin/api/content/posts/${postId}/delete/permanent`,
      },
    };

    return endpointMap[actionType];
  };

  const requestPostAction = (postId, actionType) => {
    const actionEndpoint = getActionEndpoint(postId, actionType);

    if (!actionEndpoint) {
      return Promise.reject(new Error("알 수 없는 게시글 처리 요청입니다."));
    }

    return axios({
      method: actionEndpoint.method,
      url: `${BACKSERVER}${actionEndpoint.url}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  };

  const handlePostAction = (post, actionType) => {
    if (!accessToken) {
      return;
    }

    if (
      actionType === "hardDelete" &&
      !window.confirm("해당 게시글을 완전히 삭제하시겠습니까?")
    ) {
      return;
    }

    setActionLoadingPostId(post.postId);

    requestPostAction(post.postId, actionType)
      .then((res) => {
        if (actionType === "hardDelete") {
          removePostFromList(post.postId);
          return;
        }

        if (res.data?.post) {
          updatePostInList(res.data.post);
        } else {
          fetchPosts();
        }
      })
      .catch((error) => {
        console.log(error);
        window.alert("게시글 처리 중 문제가 발생했습니다.");
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
      if (isCurrentPageSelected) {
        return prevIds.filter((postId) => !currentPagePostIds.includes(postId));
      }

      return Array.from(new Set([...prevIds, ...currentPagePostIds]));
    });
  };

  const handleBulkAction = (bulkActionType) => {
    if (!accessToken || selectedPostIds.length === 0) {
      return;
    }

    const confirmMessage = {
      hide: "선택한 게시글을 숨김 처리하시겠습니까?",
      softDelete: "선택한 게시글을 삭제 상태로 전환하시겠습니까?",
      restore: "선택한 게시글을 복구하시겠습니까?",
    }[bulkActionType];

    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    setBulkActionLoading(true);

    const actionRequests = selectedPostIds.map((postId) => {
      const targetPost = posts.find((post) => post.postId === postId);
      const targetStatus = targetPost ? getPostStatus(targetPost) : "공개";

      if (bulkActionType === "restore") {
        return requestPostAction(
          postId,
          targetStatus === "삭제" ? "restoreDeleted" : "restoreHidden",
        );
      }

      return requestPostAction(postId, bulkActionType);
    });

    Promise.allSettled(actionRequests)
      .then(() => {
        setSelectedPostIds([]);
        fetchPosts();
      })
      .catch((error) => {
        console.log(error);
        window.alert("게시글 일괄 처리 중 문제가 발생했습니다.");
      })
      .finally(() => {
        setBulkActionLoading(false);
      });
  };

  const resetFilters = () => {
    setSearchField("title");
    setSearchKeyword("");
    setActiveStatus("전체");
    setEmotionFilter("all");
    setStartDate("");
    setEndDate("");
  };

  return (
    <>
      <ContentManagementToolbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchField={searchField}
        onSearchFieldChange={setSearchField}
        searchKeyword={searchKeyword}
        onSearchKeywordChange={setSearchKeyword}
      />

      <section
        className={`${styles.contentShell} ${
          activeTab === "게시글" ? "" : styles.contentShellFull
        }`}
      >
        <div className={styles.contentMain}>
          {activeTab === "게시글" && (
            <>
              <ContentManagementControls
                statusFilters={statusFilters}
                activeStatus={activeStatus}
                onStatusChange={setActiveStatus}
                filteredPostCount={filteredPosts.length}
              />

              <ContentBulkActions
                currentPagePosts={paginatedPosts}
                selectedPostIds={selectedPostIds}
                isCurrentPageSelected={isCurrentPageSelected}
                bulkActionLoading={bulkActionLoading}
                onToggleCurrentPage={toggleCurrentPageSelection}
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
                onOpenPostDetail={setSelectedDetailPost}
                filteredPostCount={filteredPosts.length}
                currentPage={currentPage}
                totalPageCount={totalPageCount}
                pageNumbers={pageNumbers}
                onPageChange={setCurrentPage}
              />
            </>
          )}

          {activeTab === "댓글" && (
            <ContentCommentGrid
              commentsLoading={commentsLoading}
              commentsError={commentsError}
              paginatedComments={paginatedComments}
              filteredCommentCount={filteredComments.length}
              currentPage={currentPage}
              totalPageCount={totalPageCount}
              pageNumbers={pageNumbers}
              onPageChange={setCurrentPage}
            />
          )}

          {activeTab === "해시태그" && (
            <ContentHashtagGrid
              hashtagsLoading={hashtagsLoading}
              hashtagsError={hashtagsError}
              paginatedHashtags={paginatedHashtags}
              filteredHashtagCount={filteredHashtags.length}
              currentPage={currentPage}
              totalPageCount={totalPageCount}
              pageNumbers={pageNumbers}
              onPageChange={setCurrentPage}
            />
          )}
        </div>

        {activeTab === "게시글" && (
          <ContentSidePanel
            emotionFilters={emotionFilters}
            emotionFilter={emotionFilter}
            onEmotionFilterChange={setEmotionFilter}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            onResetFilters={resetFilters}
          />
        )}
      </section>

      {selectedDetailPost && (
        <ContentPostDetailModal
          post={selectedDetailPost}
          onClose={() => setSelectedDetailPost(null)}
          getPostStatus={getPostStatus}
          getStatusClassName={getStatusClassName}
          getAuthorName={getAuthorName}
          getEmotionMeta={getEmotionMeta}
          getPostImageInfo={getPostImageInfo}
          stripHtml={stripHtml}
        />
      )}
    </>
  );
}
