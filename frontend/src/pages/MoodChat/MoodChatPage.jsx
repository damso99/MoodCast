import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import KeyboardArrowLeftRoundedIcon from "@mui/icons-material/KeyboardArrowLeftRounded";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import SentimentSatisfiedAltRoundedIcon from "@mui/icons-material/SentimentSatisfiedAltRounded";
import { DesktopShell } from "../../components/layout/DesktopShell";
import { MobileShell } from "../../components/layout/MobileShell";
import { useAuthStore } from "../../stores/useAuthStore";
import { useRealtimeChat } from "../../hooks/useRealtimeChat";
import { notifyChatUnreadChanged } from "../../hooks/useUnreadChatCount";
import { useIsDesktop } from "../../hooks/useViewportWidth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { formatKoreanTime } from "../../shared/lib/dateTime";
import { formatChatPreview, parseChatContent, serializeChatContent } from "../../shared/lib/chatContent";
import { fetchChatInviteCandidates } from "../../shared/api/chatInviteApi";
import { fetchGroupChatRooms } from "../../shared/api/groupChatApi";
import {
  createGroupChatRoom,
  inviteGroupChatMembers,
} from "../../shared/api/groupChatApi";
import { uploadChatImages } from "../../shared/api/fileUploadApi";
import { ChatRoomCreateModal } from "./components/ChatRoomCreateModal";
import { GroupRoomOverlay } from "./components/GroupRoomOverlay";
import styles from "./MoodChatPage.module.css";

const API_BASE = import.meta.env.VITE_BACKSERVER || "http://localhost:8080";
const DEFAULT_CURRENT_USER_ID = null;
function normalizeIncomingMessage(message, currentUserId, timeCache) {
  const senderId = Number(message?.senderId);
  const parsedContent = parseChatContent(message?.content ?? "");
  const messageKey =
    message?.chatId ??
    message?.id ??
    `${senderId}-${message?.createdAt ?? Date.now()}`;
  const cachedTime = timeCache?.get?.(messageKey);
  const computedTime = message?.time || formatKoreanTime(message?.createdAt) || "";
  const displayTime = cachedTime || computedTime;

  if (timeCache && displayTime && !cachedTime) {
    timeCache.set(messageKey, displayTime);
  }

  return {
    id: messageKey,
    sender: senderId === currentUserId ? "me" : "them",
    text: parsedContent.text || message?.text || "",
    imageUrls: parsedContent.imageUrls,
    rawContent: message?.content ?? "",
    time: displayTime,
    senderId,
    receiverId: Number(message?.receiverId),
    createdAt: message?.createdAt ?? "",
    isRead: message?.isRead ?? 0,
    eventType: message?.eventType ?? "CHAT_MESSAGE",
  };
}

function normalizeGroupMessage(message) {
  return {
    messageId: message?.messageId ?? message?.id,
    roomId: message?.roomId,
    senderId: Number(message?.senderId),
    senderName: message?.senderName || "회원",
    profileImageUrl: message?.profileImageUrl || "",
    content: message?.content || "",
    time: message?.time || (message?.createdAt ? formatKoreanTime(message.createdAt) : ""),
    createdAt: message?.createdAt || "",
  };
}

function getMemberDisplayName(member) {
  return member?.nickname || member?.name || `회원 ${member?.memberId}`;
}

function buildRoomName(selectedMembers) {
  const names = selectedMembers.map(getMemberDisplayName).filter(Boolean);

  if (names.length === 0) {
    return "새 채팅방";
  }

  if (names.length === 1) {
    return `${names[0]} 님과의 채팅`;
  }

  return `${names[0]} 외 ${names.length - 1}명`;
}

function buildDirectThread(memberItem) {
  return {
    roomType: "direct",
    roomId: null,
    threadKey: `direct-${memberItem?.memberId}`,
    partnerMemberId: memberItem?.memberId,
    partnerName: memberItem?.name || "",
    partnerNickname: memberItem?.nickname || memberItem?.name || "",
    partnerProfileImageUrl: memberItem?.profileImageUrl || "",
    roomName: memberItem?.nickname || memberItem?.name || "",
    roomDescription: "",
    lastMessage: "",
    lastMessageAt: "",
    unreadCount: 0,
    memberCount: 2,
  };
}

function buildImageEntries(files) {
  return files.map((file, index) => ({
    id: `${file.name}-${file.lastModified}-${index}`,
    file,
    previewUrl: URL.createObjectURL(file),
  }));
}

function normalizeDirectThread(thread) {
  return {
    roomType: "direct",
    roomId: null,
    threadKey: `direct-${thread?.partnerMemberId}`,
    partnerMemberId: thread?.partnerMemberId,
    partnerName: thread?.partnerName || "",
    partnerNickname: thread?.partnerNickname || "",
    partnerProfileImageUrl: thread?.partnerProfileImageUrl || "",
    roomName: thread?.partnerNickname || thread?.partnerName || "",
    roomDescription: "",
    lastMessage: thread?.lastMessage || "",
    lastMessageAt: thread?.lastMessageAt || "",
    unreadCount: Number(thread?.unreadCount || 0),
    memberCount: 2,
  };
}

function normalizeGroupThread(thread) {
  return {
    roomType: "group",
    roomId: thread?.roomId,
    threadKey: `group-${thread?.roomId}`,
    roomName: thread?.roomName || "그룹 채팅방",
    roomDescription: thread?.roomDescription || "",
    lastMessage: thread?.lastMessage || "",
    lastMessageAt: thread?.lastMessageAt || "",
    unreadCount: Number(thread?.unreadCount || 0),
    memberCount: Number(thread?.memberCount || 0),
    createdBy: thread?.createdBy,
  };
}

function getThreadSortValue(thread) {
  const rawValue = thread?.lastMessageAt || thread?.createdAt || "";
  if (!rawValue) {
    return 0;
  }

  const parsedValue = Date.parse(String(rawValue).replace(" ", "T"));
  return Number.isNaN(parsedValue) ? 0 : parsedValue;
}

function ChatBody({ desktop, onRoomOpenChange }) {
  const { member, accessToken } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentMemberId = useMemo(() => {
    const memberId = Number(member?.memberId);
    return Number.isFinite(memberId) && memberId > 0
      ? memberId
      : DEFAULT_CURRENT_USER_ID;
  }, [member?.memberId]);
  const initialPartnerId = useMemo(() => {
    const partnerId = Number(searchParams.get("partnerId"));
    return Number.isFinite(partnerId) && partnerId > 0 ? partnerId : null;
  }, [searchParams]);
  const initialPartnerName = searchParams.get("partnerName") || "";
  const messageListRef = useRef(null);
  const messageInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const directMessageTimeCacheRef = useRef(new Map());
  const selectedImagesRef = useRef([]);
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [isRoomOpen, setIsRoomOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [showScrollBottomButton, setShowScrollBottomButton] = useState(false);
  const [error, setError] = useState("");
  const [imageViewer, setImageViewer] = useState(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteMode, setInviteMode] = useState("create");
  const [inviteCandidates, setInviteCandidates] = useState([]);
  const [selectedInviteIds, setSelectedInviteIds] = useState([]);
  const [isLoadingInviteCandidates, setIsLoadingInviteCandidates] = useState(false);
  const [activeGroupRoom, setActiveGroupRoom] = useState(null);
  const [isThreadMenuOpen, setIsThreadMenuOpen] = useState(false);

  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  useEffect(() => {
    return () => {
      selectedImagesRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  useEffect(() => {
    if (!imageViewer) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeImageViewer();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveImageViewer(-1);
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        moveImageViewer(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [imageViewer]);

  const clearSelectedImages = () => {
    setSelectedImages((previousImages) => {
      previousImages.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return [];
    });

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handleImageSelection = (event) => {
    const files = Array.from(event.target.files || []).filter((file) =>
      file.type.startsWith("image/"),
    );

    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    if (files.length > 5) {
      setError("이미지는 최대 5개까지 업로드할 수 있습니다.");
      return;
    }

    setError("");
    setSelectedImages((previousImages) => {
      previousImages.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return buildImageEntries(files);
    });
  };

  const removeSelectedImage = (imageId) => {
    setSelectedImages((previousImages) => {
      const nextImages = previousImages.filter((item) => item.id !== imageId);
      const removedImage = previousImages.find((item) => item.id === imageId);

      if (removedImage) {
        URL.revokeObjectURL(removedImage.previewUrl);
      }

      return nextImages;
    });
  };

  const openImageViewer = (images, index, alt) => {
    const normalizedImages = Array.isArray(images)
      ? images.filter((imageUrl) => typeof imageUrl === "string" && imageUrl.trim().length > 0)
      : [];

    if (normalizedImages.length === 0) {
      return;
    }

    const safeIndex = Math.min(Math.max(Number(index) || 0, 0), normalizedImages.length - 1);
    setImageViewer({
      images: normalizedImages,
      index: safeIndex,
      alt: alt || "이미지",
      orientation: "horizontal",
    });
  };

  const closeImageViewer = () => {
    setImageViewer(null);
  };

  const handleViewerImageLoad = (event) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    if (!naturalWidth || !naturalHeight) {
      return;
    }

    setImageViewer((previousViewer) => {
      if (!previousViewer) {
        return previousViewer;
      }

      return {
        ...previousViewer,
        orientation: naturalHeight > naturalWidth ? "vertical" : "horizontal",
      };
    });
  };

  const moveImageViewer = (direction) => {
    setImageViewer((previousViewer) => {
      if (!previousViewer || !Array.isArray(previousViewer.images) || previousViewer.images.length === 0) {
        return previousViewer;
      }

      const nextIndex =
        (previousViewer.index + direction + previousViewer.images.length) %
        previousViewer.images.length;

      return {
        ...previousViewer,
        index: nextIndex,
      };
    });
  };

  useEffect(() => {
    if (!accessToken || !currentMemberId) {
      navigate("/auth/login", { replace: true });
    }
  }, [accessToken, currentMemberId, navigate]);

  const handleIncomingMessage = (incomingMessage) => {
    if (incomingMessage?.eventType === "CHAT_DELETE") {
      const deletedChatId = Number(incomingMessage.chatId ?? incomingMessage.id);

      setMessages((previousMessages) =>
        previousMessages.filter((item) => Number(item.id) !== deletedChatId),
      );
      loadThreads();
      return;
    }

    if (incomingMessage?.eventType === "READ_RECEIPT") {
      const readerId = Number(incomingMessage.receiverId);

      setMessages((previousMessages) =>
        previousMessages.map((item) =>
          item.senderId === currentMemberId && item.receiverId === readerId
            ? { ...item, isRead: 1 }
            : item,
        ),
      );
      return;
    }

    const normalizedMessage = normalizeIncomingMessage(
      incomingMessage,
      currentMemberId,
      directMessageTimeCacheRef.current,
    );
    const incomingPartnerId =
      normalizedMessage.senderId === currentMemberId
        ? normalizedMessage.receiverId
        : normalizedMessage.senderId;
    const isActiveThreadMessage =
      activeThread &&
      Number(activeThread.partnerMemberId) === Number(incomingPartnerId) &&
      (normalizedMessage.senderId === currentMemberId ||
        normalizedMessage.receiverId === currentMemberId);

    setMessages((previousMessages) => {
      if (previousMessages.some((item) => item.id === normalizedMessage.id)) {
        return previousMessages;
      }

      if (!isActiveThreadMessage) {
        return previousMessages;
      }

      return [...previousMessages, normalizedMessage];
    });

    if (
      isActiveThreadMessage &&
      normalizedMessage.receiverId === currentMemberId
    ) {
      markMessagesAsRead(incomingPartnerId).then(loadThreads);
      return;
    }

    loadThreads();
  };

  const { connected: isChatConnected, sendMessage } = useRealtimeChat(
    currentMemberId,
    handleIncomingMessage,
  );

  const loadInviteCandidates = async () => {
    if (!currentMemberId) {
      setInviteCandidates([]);
      return;
    }

    setIsLoadingInviteCandidates(true);

    try {
      const candidates = await fetchChatInviteCandidates(
        currentMemberId,
        accessToken || window.sessionStorage.getItem("moodcast-access-token"),
      );
      setInviteCandidates(candidates);
    } catch (requestError) {
      console.error("초대 대상 목록 조회 실패", requestError);
      setInviteCandidates([]);
    } finally {
      setIsLoadingInviteCandidates(false);
    }
  };

  const openCreateRoomModal = async () => {
    setInviteMode("create");
    setSelectedInviteIds([]);
    setInviteModalOpen(true);
    await loadInviteCandidates();
  };

  const openInviteRoomModal = async (room) => {
    setInviteMode("invite");
    setSelectedInviteIds([]);
    setActiveGroupRoom(room);
    setInviteModalOpen(true);
    await loadInviteCandidates();
  };

  const toggleInviteMember = (memberItem) => {
    const memberId = Number(memberItem?.memberId);
    if (!Number.isFinite(memberId) || memberId <= 0) {
      return;
    }

    setSelectedInviteIds((previousIds) =>
      previousIds.includes(memberId)
        ? previousIds.filter((id) => id !== memberId)
        : [...previousIds, memberId],
    );
  };

  const submitInviteSelection = async () => {
    const selectedMembers = inviteCandidates.filter((item) =>
      selectedInviteIds.includes(Number(item.memberId)),
    );

    if (selectedInviteIds.length === 0) {
      return;
    }

    try {
      if (inviteMode === "invite" && activeGroupRoom?.roomId) {
        await inviteGroupChatMembers(activeGroupRoom.roomId, {
          memberIds: selectedInviteIds,
        });
      } else if (inviteMode === "create" && selectedMembers.length === 1) {
        const directThread = buildDirectThread(selectedMembers[0]);
        setActiveGroupRoom(null);
        setInviteModalOpen(false);
        setSelectedInviteIds([]);
        openThread(directThread);
        return;
      } else {
        const response = await createGroupChatRoom({
          roomName: buildRoomName(selectedMembers),
          roomDescription: "",
          creatorId: currentMemberId,
          memberIds: selectedInviteIds,
        });
        setActiveGroupRoom(response.data);
      }

      setInviteModalOpen(false);
      setSelectedInviteIds([]);
    } catch (requestError) {
      console.error("채팅방 생성/초대 실패", requestError);
      setError(requestError.response?.data?.message || "채팅방을 만들지 못했습니다.");
    }
  };

  const markMessagesAsRead = async (partnerId) => {
    if (!currentMemberId || !partnerId) {
      return;
    }

    try {
      await axios.post(`${API_BASE}/chat/read`, null, {
        params: {
          memberId: currentMemberId,
          partnerId,
        },
      });

      setThreads((previousThreads) =>
        previousThreads.map((thread) =>
          Number(thread.partnerMemberId) === Number(partnerId)
            ? { ...thread, unreadCount: 0 }
            : thread,
        ),
      );
      notifyChatUnreadChanged();
    } catch (requestError) {
      console.error("메시지 읽음 처리 실패", requestError);
    }
  };

  const loadThreads = async () => {
    if (!currentMemberId) {
      setThreads([]);
      return;
    }

    setIsLoadingThreads(true);
    setError("");

    try {
      const [directResponse, groupResponse] = await Promise.all([
        axios.get(`${API_BASE}/chat/threads`, {
          params: { memberId: currentMemberId },
        }),
        fetchGroupChatRooms(currentMemberId),
      ]);

      const directThreads = Array.isArray(directResponse.data)
        ? directResponse.data.map(normalizeDirectThread)
        : [];
      const groupThreads = Array.isArray(groupResponse.data)
        ? groupResponse.data.map(normalizeGroupThread)
        : [];

      const nextThreads = [...directThreads, ...groupThreads].sort(
        (leftThread, rightThread) => getThreadSortValue(rightThread) - getThreadSortValue(leftThread),
      );

      setThreads(
        nextThreads.map((thread) =>
          activeGroupRoom?.roomId && Number(activeGroupRoom.roomId) === Number(thread.roomId)
            ? { ...thread, unreadCount: 0 }
            : thread,
        ),
      );
    } catch (requestError) {
      console.error("채팅 리스트 조회 실패", requestError);
      setThreads([]);
      setError("채팅 리스트를 불러오지 못했습니다.");
    } finally {
      setIsLoadingThreads(false);
    }
  };

  const loadMessages = async (partnerThread) => {
    if (!currentMemberId || !partnerThread?.partnerMemberId) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    setError("");

    try {
      await markMessagesAsRead(partnerThread.partnerMemberId);

      const response = await axios.get(`${API_BASE}/chat/messages`, {
        params: {
          memberId: currentMemberId,
          partnerId: partnerThread.partnerMemberId,
        },
      });
      const list = Array.isArray(response.data) ? response.data : [];

      setMessages(
        list.map((item) =>
          normalizeIncomingMessage(item, currentMemberId, directMessageTimeCacheRef.current),
        ),
      );
    } catch (requestError) {
      console.error("메시지 조회 실패", requestError);
      setMessages([]);
      setError("메시지를 불러오지 못했습니다.");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMemberId]);

  useEffect(() => {
    if (!initialPartnerId) {
      setActiveThread(null);
      setIsRoomOpen(false);
      setMessages([]);
      setMessage("");
      clearSelectedImages();
      setError("");
      setShowScrollBottomButton(false);
      return;
    }

    if (!currentMemberId) {
      return;
    }

    const partnerThread = {
      partnerMemberId: initialPartnerId,
      partnerName: initialPartnerName || `회원 ${initialPartnerId}`,
      partnerNickname: initialPartnerName || `회원 ${initialPartnerId}`,
      partnerProfileImageUrl: "",
      lastMessage: "",
      lastMessageAt: "",
      unreadCount: 0,
    };

    setActiveThread(partnerThread);
    setIsRoomOpen(true);
    setMessage("");
    clearSelectedImages();
    setShowScrollBottomButton(false);
    loadMessages(partnerThread);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMemberId, initialPartnerId, initialPartnerName]);

  useEffect(() => {
    if (searchParams.get("view") !== "list") {
      return;
    }

    setActiveGroupRoom(null);
    setActiveThread(null);
    setIsRoomOpen(false);
    setMessages([]);
    setMessage("");
    clearSelectedImages();
    setShowScrollBottomButton(false);
    setIsThreadMenuOpen(false);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("view");
    nextParams.delete("ts");
    setSearchParams(nextParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setSearchParams]);

  const updateScrollBottomButton = () => {
    const messageListElement = messageListRef.current;

    if (!messageListElement) {
      return;
    }

    const bottomGap =
      messageListElement.scrollHeight -
      messageListElement.scrollTop -
      messageListElement.clientHeight;
    setShowScrollBottomButton(bottomGap > 24);
  };

  const scrollToMessageBottom = (behavior = "smooth") => {
    const messageListElement = messageListRef.current;

    if (!messageListElement) {
      return;
    }

    messageListElement.scrollTo({
      top: messageListElement.scrollHeight,
      behavior,
    });
    setShowScrollBottomButton(false);
  };

  useEffect(() => {
    if (!isRoomOpen) {
      setShowScrollBottomButton(false);
      return;
    }

    if (!showScrollBottomButton) {
      requestAnimationFrame(() => scrollToMessageBottom("auto"));
      return;
    }

    requestAnimationFrame(updateScrollBottomButton);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isRoomOpen, activeThread]);

  const openThread = (thread) => {
    setActiveGroupRoom(null);
    setActiveThread(thread);
    setIsRoomOpen(true);
    setMessage("");
    clearSelectedImages();
    setShowScrollBottomButton(false);
    setIsThreadMenuOpen(false);
    loadMessages(thread);
  };

  const openGroupRoom = (thread) => {
    if (!thread?.roomId) {
      return;
    }

    setIsThreadMenuOpen(false);
    setActiveGroupRoom(thread);
    setThreads((previousThreads) =>
      previousThreads.map((item) =>
        Number(item.roomId) === Number(thread.roomId) ? { ...item, unreadCount: 0 } : item,
      ),
    );
    setIsRoomOpen(false);
    setActiveThread(null);
    setMessages([]);
    setMessage("");
    clearSelectedImages();
    setShowScrollBottomButton(false);
    setError("");
  };

  const handleDeleteMessage = async (item) => {
    if (!currentMemberId || !item?.id) {
      return;
    }

    try {
      await axios.post(`${API_BASE}/chat/messages/delete`, null, {
        params: {
          chatId: item.id,
          memberId: currentMemberId,
        },
      });

      setMessages((previousMessages) =>
        previousMessages.filter((message) => Number(message.id) !== Number(item.id)),
      );
      await loadThreads();
    } catch (requestError) {
      console.error("메시지 삭제 실패", requestError);
      setError("메시지 삭제 중 문제가 발생했습니다.");
    }
  };

  const handleExitRoom = () => {
    setIsRoomOpen(false);
    setActiveThread(null);
    setMessages([]);
    setMessage("");
    clearSelectedImages();
    setError("");
    setShowScrollBottomButton(false);
    setIsThreadMenuOpen(false);
  };

  const handleOpenPartnerProfile = () => {
    if (!activeThread?.partnerMemberId) {
      return;
    }

    navigate(`/app/user/${activeThread.partnerMemberId}`);
  };

  const handleSend = async () => {
    const trimmedMessage = message.trim();

    if (
      (!trimmedMessage && selectedImages.length === 0) ||
      !activeThread ||
      !currentMemberId ||
      isSending ||
      isUploadingImages
    ) {
      return;
    }

    setIsSending(true);
    setError("");

    try {
      let uploadedImageUrls = [];
      if (selectedImages.length > 0) {
        setIsUploadingImages(true);
        uploadedImageUrls = await uploadChatImages(selectedImages.map((item) => item.file));
      }

      const content = serializeChatContent({
        text: trimmedMessage,
        imageUrls: uploadedImageUrls,
      });

      if (!content) {
        setError("메시지나 이미지를 입력해주세요.");
        return;
      }

      const isPublished = sendMessage({
        content,
        senderId: currentMemberId,
        receiverId: activeThread.partnerMemberId,
        isRead: 0,
      });

      if (!isPublished) {
        await axios.post(`${API_BASE}/chat/send`, {
          content,
          senderId: currentMemberId,
          receiverId: activeThread.partnerMemberId,
          isRead: 0,
        });
        await loadMessages(activeThread);
      }

      setMessage("");
      clearSelectedImages();
      await loadThreads();
    } catch (requestError) {
      console.error("메시지 전송 실패", requestError);
      setError("메시지 전송에 실패했습니다.");
    } finally {
      setIsSending(false);
      setIsUploadingImages(false);
      requestAnimationFrame(() => {
        messageInputRef.current?.focus();
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await handleSend();
  };

  useEffect(() => {
    onRoomOpenChange?.(isRoomOpen || Boolean(activeGroupRoom));
  }, [isRoomOpen, activeGroupRoom, onRoomOpenChange]);
  const partnerName =
    activeThread?.partnerNickname || activeThread?.partnerName || "상대방";
  const partnerInitial = partnerName.charAt(0).toUpperCase();

  const threadList = (
    <div className={styles.threadList}>
      {isLoadingThreads ? (
        <p className={styles.statusText}>채팅 리스트를 불러오는 중입니다.</p>
      ) : null}
      {!isLoadingThreads && threads.length === 0 ? (
        <p className={styles.emptyState}>아직 대화 중인 채팅방이 없습니다.</p>
      ) : null}
      {threads.map((thread) => {
        const isGroupThread = thread.roomType === "group";
        const isThreadActive = isGroupThread
          ? activeGroupRoom?.roomId === thread.roomId
          : activeThread?.partnerMemberId === thread.partnerMemberId;

        return (
          <button
            key={thread.threadKey}
            type="button"
            className={`${styles.threadItem} ${isThreadActive ? styles.active : ""}`}
            onClick={() =>
              isGroupThread ? openGroupRoom(thread) : openThread(thread)
            }
          >
            <div className={styles.threadContent}>
              <strong>
                {isGroupThread
                  ? thread.roomName || "그룹 채팅방"
                  : thread.partnerNickname ||
                    thread.partnerName ||
                    `회원 ${thread.partnerMemberId}`}
              </strong>
              <span className={styles.threadTypeLabel}>
                {isGroupThread ? `그룹 · ${thread.memberCount || 0}명` : "1:1"}
              </span>
              <p className={styles.threadPreview}>
                {formatChatPreview(thread.lastMessage) || "메시지가 없습니다."}
              </p>
            </div>
            <div className={styles.threadMeta}>
              <span>
                {thread.lastMessageAt
                  ? formatKoreanTime(thread.lastMessageAt) || thread.lastMessageAt
                  : ""}
              </span>
              {thread.unreadCount > 0 ? (
                <b className={styles.unreadBadge}>{thread.unreadCount}</b>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );

  const messageList = (
    <div
      ref={messageListRef}
      className={styles.messages}
      aria-live="polite"
      onScroll={updateScrollBottomButton}
    >
      {isLoadingMessages ? (
        <p className={styles.statusText}>메시지를 불러오는 중입니다.</p>
      ) : null}
      {error ? <p className={styles.errorText}>{error}</p> : null}
      {!isLoadingMessages && messages.length === 0 ? (
        <p className={styles.emptyState}>
          아직 메시지가 없습니다. 대화를 시작해보세요.
        </p>
      ) : null}
      {messages.map((item) => {
        const isUnreadByReceiver =
          item.sender === "me" && Number(item.isRead) !== 1;

        return (
          <div
            key={item.id}
            className={`${styles.messageRow} ${item.sender === "me" ? styles.me : styles.them}`}
          >
            {item.sender === "them" ? (
              <div className={styles.messageAvatar}>{partnerInitial}</div>
            ) : null}
            <div
              className={`${styles.messageItem} ${item.sender === "me" ? styles.me : styles.them}`}
            >
              {item.sender === "them" ? (
                <span className={styles.senderLabel}>{partnerName}</span>
              ) : null}
              <div className={styles.bubbleWrap}>
                <button
                  type="button"
                  className={styles.deleteButton}
                  aria-label="메시지 삭제"
                  title="메시지 삭제"
                  onClick={() => handleDeleteMessage(item)}
                >
                  <DeleteOutlineRoundedIcon />
                </button>
                <div className={styles.bubbleLine}>
                  {isUnreadByReceiver ? (
                    <span className={styles.unreadMarker}>1</span>
                  ) : null}
                  <div className={styles.bubble}>
                    {item.text ? <p>{item.text}</p> : null}
                    {Array.isArray(item.imageUrls) && item.imageUrls.length > 0 ? (
                      <div
                        className={`${styles.messageMediaGrid} ${
                          item.imageUrls.length === 1 ? styles.singleMessageMediaGrid : ""
                        }`}
                      >
                        {item.imageUrls.map((imageUrl, index) => (
                          <img
                            key={`${imageUrl}-${index}`}
                            className={styles.messageMediaImage}
                            src={imageUrl}
                            alt={`첨부 이미지 ${index + 1}`}
                            loading="lazy"
                            role="button"
                            tabIndex={0}
                            onClick={() => openImageViewer(item.imageUrls, index, `첨부 이미지 ${index + 1}`)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                openImageViewer(item.imageUrls, index, `첨부 이미지 ${index + 1}`);
                              }
                            }}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                <span className={styles.messageTime}>{item.time}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const composer = (
    <form className={styles.composer} onSubmit={handleSubmit}>
      {selectedImages.length > 0 ? (
        <div className={styles.composerPreview}>
          <div className={styles.composerPreviewHead}>
            <span>첨부 이미지 {selectedImages.length}/5</span>
            <button type="button" onClick={clearSelectedImages}>
              전체 삭제
            </button>
          </div>
          <div
            className={`${styles.composerPreviewGrid} ${
              selectedImages.length === 1 ? styles.singleComposerPreviewGrid : ""
            } ${
              selectedImages.length >= 2 ? styles.compactComposerPreviewGrid : ""
            }`}
          >
            {selectedImages.map((image) => (
              <div key={image.id} className={styles.composerPreviewItem}>
                <img src={image.previewUrl} alt={image.file.name} />
                <button
                  type="button"
                  className={styles.composerPreviewRemoveButton}
                  onClick={() => removeSelectedImage(image.id)}
                  aria-label="첨부 이미지 삭제"
                  title="첨부 이미지 삭제"
                >
                  <DeleteOutlineRoundedIcon />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div className={styles.composerRow}>
        <label className={styles.addButton} aria-label="이미지 추가" title="이미지 추가">
          <AddRoundedIcon />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelection}
            disabled={!activeThread || isSending || isUploadingImages}
          />
        </label>
        <div className={styles.inputShell}>
          <input
            ref={messageInputRef}
            placeholder="메시지를 입력하세요..."
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            disabled={!activeThread || isSending || isUploadingImages}
          />
          <button
            type="button"
            className={styles.emojiButton}
            aria-label="이모지"
            title="이모지"
            disabled={!activeThread || isSending || isUploadingImages}
          >
            <SentimentSatisfiedAltRoundedIcon />
          </button>
        </div>
        <button
          type="submit"
          className={styles.sendButton}
          aria-label="메시지 보내기"
          title="메시지 보내기"
          disabled={isSending || isUploadingImages || !activeThread}
        >
          <SendRoundedIcon />
        </button>
      </div>
    </form>
  );

  const chatRoom = (
    <div className={styles.room}>
      <div className={styles.roomHeader}>
        <button
          type="button"
          className={styles.backButton}
          onClick={handleExitRoom}
          aria-label="채팅방 나가기"
        >
          <ArrowBackRoundedIcon />
        </button>
        <div className={styles.headerAvatar}>{partnerInitial}</div>
        <div className={styles.roomTitle}>
          <strong>{partnerName}</strong>
          <span>{isChatConnected ? "실시간 연결됨" : "연결되지 않음"}</span>
        </div>
        <div className={styles.headerActions}>
          <div style={{ position: "relative" }}>
            <button
              type="button"
              aria-label="더보기"
              onClick={() => setIsThreadMenuOpen((value) => !value)}
            >
              <MoreVertRoundedIcon />
            </button>
            {isThreadMenuOpen ? (
              <div
                style={{
                  position: "absolute",
                  top: "46px",
                  right: 0,
                  display: "grid",
                  gap: "8px",
                  minWidth: "160px",
                  padding: "10px",
                  borderRadius: "16px",
                  background: "rgba(255, 255, 255, 0.98)",
                  boxShadow: "0 18px 40px rgba(17, 24, 39, 0.14)",
                  zIndex: 1000,
                  justifyItems: "stretch",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsThreadMenuOpen(false);
                    handleOpenPartnerProfile();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    minHeight: "42px",
                    padding: "0 14px",
                    border: 0,
                    borderRadius: "12px",
                    background: "rgba(124, 77, 255, 0.1)",
                    color: "#7c4dff",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    wordBreak: "keep-all",
                    fontWeight: 600,
                  }}
                >
                  상대 프로필 보기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsThreadMenuOpen(false);
                    handleExitRoom();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    minHeight: "42px",
                    padding: "0 14px",
                    border: 0,
                    borderRadius: "12px",
                    background: "rgba(255, 106, 119, 0.1)",
                    color: "#d92d20",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    wordBreak: "keep-all",
                    fontWeight: 600,
                  }}
                >
                  대화방 닫기
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {messageList}
      {showScrollBottomButton ? (
        <button
          type="button"
          className={styles.scrollBottomButton}
          aria-label="최신 메시지로 이동"
          title="최신 메시지로 이동"
          onClick={() => scrollToMessageBottom()}
        >
          <KeyboardArrowDownRoundedIcon />
        </button>
      ) : null}
      {composer}
    </div>
  );

  const groupRoomPanel = activeGroupRoom ? (
    <GroupRoomOverlay
      room={activeGroupRoom}
      currentMember={member}
      onClose={() => setActiveGroupRoom(null)}
      onProfileClick={(memberId) => navigate(`/app/user/${memberId}`)}
      onRoomUpdated={loadThreads}
      onRequestInvite={async (room) => {
        setActiveGroupRoom(room);
        await openInviteRoomModal(room);
      }}
    />
  ) : null;

  const roomCreateModal = (
    <ChatRoomCreateModal
      open={inviteModalOpen}
      mode={inviteMode}
      members={inviteCandidates}
      selectedIds={selectedInviteIds}
      currentMemberId={currentMemberId}
      currentRoomName={activeGroupRoom?.roomName || ""}
      isLoading={isLoadingInviteCandidates}
      onToggleMember={toggleInviteMember}
      onClose={() => {
        setInviteModalOpen(false);
        setSelectedInviteIds([]);
      }}
      onSubmit={submitInviteSelection}
    />
  );

  const createRoomButton = (
    <button
      type="button"
      className={styles.createRoomButton}
      aria-label="채팅방 만들기"
      title="채팅방 만들기"
      onClick={openCreateRoomModal}
    >
      <AddRoundedIcon />
    </button>
  );

  const imageViewerModal = imageViewer ? (
    <div
      className={styles.imageViewerOverlay}
      role="presentation"
      onClick={closeImageViewer}
    >
      {Array.isArray(imageViewer.images) && imageViewer.images.length > 1 ? (
        <button
          type="button"
          className={`${styles.imageViewerNavButton} ${styles.imageViewerPrevButton}`}
          aria-label="이전 이미지"
          title="이전 이미지"
          onClick={(event) => {
            event.stopPropagation();
            moveImageViewer(-1);
          }}
        >
          <KeyboardArrowLeftRoundedIcon className={styles.imageViewerNavIcon} />
        </button>
      ) : null}
      <div
        className={`${styles.imageViewerContent} ${
          imageViewer.orientation === "vertical"
            ? styles.imageViewerVertical
            : styles.imageViewerHorizontal
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={imageViewer.alt}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={styles.imageViewerClose}
          aria-label="이미지 닫기"
          title="이미지 닫기"
          onClick={closeImageViewer}
        >
          <CloseRoundedIcon />
        </button>
        <span className={styles.imageViewerCounter}>
          {Array.isArray(imageViewer.images) && imageViewer.images.length > 0
            ? `${imageViewer.index + 1} / ${imageViewer.images.length}`
            : ""}
        </span>
        <img
          className={styles.imageViewerImage}
          src={imageViewer.images?.[imageViewer.index]}
          alt={imageViewer.alt}
          onLoad={handleViewerImageLoad}
          onClick={closeImageViewer}
        />
      </div>
      {Array.isArray(imageViewer.images) && imageViewer.images.length > 1 ? (
        <button
          type="button"
          className={`${styles.imageViewerNavButton} ${styles.imageViewerNextButton}`}
          aria-label="다음 이미지"
          title="다음 이미지"
          onClick={(event) => {
            event.stopPropagation();
            moveImageViewer(1);
          }}
        >
          <KeyboardArrowRightRoundedIcon className={styles.imageViewerNavIcon} />
        </button>
      ) : null}
    </div>
  ) : null;

  const showCreateRoomButton = !isRoomOpen && !activeGroupRoom;

  if (!desktop) {
    return (
      <>
        <div className={styles.chatCanvas}>
          <section className={styles.mobileChat}>
            {!isRoomOpen && !activeGroupRoom ? (
              <div className={styles.mobileListView}>
                <div className={styles.threadHeader}>
                  <strong>채팅 리스트</strong>
                </div>
                {threadList}
              </div>
            ) : activeGroupRoom ? (
              <div className={styles.roomView}>{groupRoomPanel}</div>
            ) : (
              chatRoom
            )}
          </section>
          {showCreateRoomButton ? createRoomButton : null}
        </div>
        {imageViewerModal}
        {roomCreateModal}
      </>
    );
  }

  return (
    <>
      <div className={styles.chatCanvas}>
        <section className={styles.desktopChat}>
          <div className={styles.hero}>
            <strong>Mood Chat</strong>
            <p>{isChatConnected ? "실시간 연결됨" : "연결을 시도하는 중입니다."}</p>
          </div>
          {!isRoomOpen && !activeGroupRoom ? (
            <div className={styles.listView}>
              <div className={styles.threadHeader}>
                <strong>채팅 리스트</strong>
              </div>
              {threadList}
            </div>
          ) : activeGroupRoom ? (
            <div className={styles.roomView}>{groupRoomPanel}</div>
          ) : (
            <div className={styles.roomView}>{chatRoom}</div>
          )}
        </section>
        {showCreateRoomButton ? createRoomButton : null}
      </div>
      {imageViewerModal}
      {roomCreateModal}
    </>
  );
}

export function MoodChatPage() {
  const desktop = useIsDesktop();
  const [mobileRoomOpen, setMobileRoomOpen] = useState(false);

  if (!desktop) {
    return (
      <MobileShell
        title="Mood Chat"
        hideSearch
        fixedContent
        hideBottomNav={mobileRoomOpen}
      >
        <ChatBody desktop={false} onRoomOpenChange={setMobileRoomOpen} />
      </MobileShell>
    );
  }

  return (
    <DesktopShell>
      <ChatBody desktop />
    </DesktopShell>
  );
}


