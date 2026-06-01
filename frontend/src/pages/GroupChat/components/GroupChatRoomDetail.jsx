import { useEffect, useLayoutEffect, useRef, useState } from "react";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import KeyboardArrowLeftRoundedIcon from "@mui/icons-material/KeyboardArrowLeftRounded";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import SentimentSatisfiedAltRoundedIcon from "@mui/icons-material/SentimentSatisfiedAltRounded";
import styles from "../../MoodChat/MoodChatPage.module.css";
import { defaultAvatarSrc } from "../../../shared/lib/defaultAvatar";
import { formatKoreanTime } from "../../../shared/lib/dateTime";
import { uploadChatImages } from "../../../shared/api/fileUploadApi";

function getRoomTitle(activeRoom) {
  return activeRoom?.roomName || "그룹 채팅방";
}

function getRoomSubtitle(activeRoom, connected) {
  const memberCount = Number(activeRoom?.memberCount || 0);
  const countText = memberCount > 0 ? `참여 인원 ${memberCount}명` : "참여 인원 정보 없음";
  const connectionText = connected ? "실시간 연결됨" : "연결 대기";
  return `${countText} · ${connectionText}`;
}

function isNearBottom(element) {
  if (!element) {
    return true;
  }

  const distance = element.scrollHeight - element.scrollTop - element.clientHeight;
  return distance < 80;
}

function createImageEntries(files) {
  return files.map((file, index) => ({
    id: `${file.name}-${file.lastModified}-${index}`,
    file,
    previewUrl: URL.createObjectURL(file),
  }));
}

export function GroupChatRoomDetail({
  activeRoom,
  messages,
  connected,
  currentMemberId,
  messageInputRef,
  messageValue,
  onMessageChange,
  onSubmitMessage,
  onDeleteMessage,
  onLeaveRoom,
  onInviteMembers,
  onProfileClick,
  onBack,
}) {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [showScrollBottomButton, setShowScrollBottomButton] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [error, setError] = useState("");
  const [imageViewer, setImageViewer] = useState(null);
  const messagesRef = useRef(null);
  const bottomRef = useRef(null);
  const imageInputRef = useRef(null);
  const selectedImagesRef = useRef([]);
  const isUserNearBottomRef = useRef(true);

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
        setImageViewer(null);
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
      return createImageEntries(files);
    });
  };

  const removeSelectedImage = (imageId) => {
    setSelectedImages((previousImages) => {
      const removedImage = previousImages.find((item) => item.id === imageId);
      if (removedImage) {
        URL.revokeObjectURL(removedImage.previewUrl);
      }

      return previousImages.filter((item) => item.id !== imageId);
    });
  };

  const openImageViewer = (src, alt) => {
    if (!src) {
      return;
    }

    setImageViewer({ src, alt: alt || "이미지" });
  };

  const openImageViewerWithList = (images, index, alt) => {
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
      orientation: "horizontal",
      alt: alt || "이미지",
    });
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

  const scrollToBottom = (behavior = "auto") => {
    const element = bottomRef.current;
    if (!element) {
      return;
    }

    element.scrollIntoView({ behavior, block: "end" });
  };

  const handleMessagesScroll = () => {
    const element = messagesRef.current;
    const nearBottom = isNearBottom(element);
    isUserNearBottomRef.current = nearBottom;
    setShowScrollBottomButton(!nearBottom && messages.length > 0);
  };

  useLayoutEffect(() => {
    setIsMoreMenuOpen(false);
    isUserNearBottomRef.current = true;
    setShowScrollBottomButton(false);

    requestAnimationFrame(() => {
      scrollToBottom("auto");
    });
  }, [activeRoom?.roomId]);

  useEffect(() => {
    if (!activeRoom?.roomId || messages.length === 0) {
      setShowScrollBottomButton(false);
      return;
    }

    if (isUserNearBottomRef.current) {
      requestAnimationFrame(() => {
        scrollToBottom("auto");
      });
      setShowScrollBottomButton(false);
      return;
    }

    setShowScrollBottomButton(true);
  }, [messages.length, activeRoom?.roomId]);

  useEffect(() => {
    if (!activeRoom?.roomId) {
      clearSelectedImages();
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoom?.roomId]);

  if (!activeRoom) {
    return null;
  }

  const roomTitle = getRoomTitle(activeRoom);
  const roomInitial = roomTitle.charAt(0).toUpperCase();
  const roomSubtitle = getRoomSubtitle(activeRoom, connected);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedMessage = messageValue.trim();

    if ((!trimmedMessage && selectedImages.length === 0) || !activeRoom || !currentMemberId) {
      return;
    }

    try {
      if (selectedImages.length > 0) {
        setIsUploadingImages(true);
      }

      let uploadedImageUrls = [];
      if (selectedImages.length > 0) {
        uploadedImageUrls = await uploadChatImages(selectedImages.map((item) => item.file));
      }

      await onSubmitMessage({
        text: trimmedMessage,
        imageUrls: uploadedImageUrls,
      });
      clearSelectedImages();
    } catch (requestError) {
      console.error("그룹 채팅 메시지 전송 실패", requestError);
      setError(
        requestError?.response?.data?.message ||
          (selectedImages.length > 0
            ? "이미지 업로드 또는 전송에 실패했습니다."
            : "메시지 전송에 실패했습니다."),
      );
    } finally {
      setIsUploadingImages(false);
    }
  };

  return (
    <div className={styles.room}>
      <div className={styles.roomHeader}>
        <button
          type="button"
          className={styles.backButton}
          onClick={onBack}
          aria-label="뒤로 가기"
        >
          <ArrowBackRoundedIcon />
        </button>
        <div className={styles.headerAvatar}>{roomInitial}</div>
        <div className={styles.roomTitle}>
          <strong>{roomTitle}</strong>
          <span>{roomSubtitle}</span>
        </div>
        <div className={styles.headerActions}>
          <div style={{ position: "relative" }}>
            <button
              type="button"
              aria-label="더보기"
              onClick={() => setIsMoreMenuOpen((value) => !value)}
            >
              <MoreVertRoundedIcon />
            </button>
            {isMoreMenuOpen ? (
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
                    setIsMoreMenuOpen(false);
                    onInviteMembers?.();
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
                  참여자 초대
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    onLeaveRoom?.();
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
                  대화방 나가기
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div
        ref={messagesRef}
        className={styles.messages}
        aria-live="polite"
        onScroll={handleMessagesScroll}
      >
        {messages.length === 0 ? <p className={styles.emptyState}>아직 메시지가 없습니다.</p> : null}
        {messages.map((item) => {
          const isMine = Number(item.senderId) === Number(currentMemberId);
          const senderName = item.senderName || "회원";
          const senderInitial = senderName.charAt(0).toUpperCase();
          const profileImageUrl = item.profileImageUrl || defaultAvatarSrc;
          const unreadCount = Number(item.unreadCount || 0);
          const imageUrls = Array.isArray(item.imageUrls) ? item.imageUrls : [];

          return (
            <div
              key={item.messageId}
              className={`${styles.messageRow} ${isMine ? styles.me : styles.them}`}
            >
              {!isMine ? (
                <button
                  type="button"
                  className={styles.messageAvatar}
                  onClick={() => onProfileClick?.(item.senderId)}
                  aria-label={`${senderName} 프로필 보기`}
                  title={`${senderName} 프로필 보기`}
                >
                  {profileImageUrl ? (
                    <img
                      src={profileImageUrl}
                      alt={senderName}
                      className={styles.messageAvatarImage}
                      onError={(event) => {
                        event.currentTarget.src = defaultAvatarSrc;
                      }}
                    />
                  ) : (
                    <span>{senderInitial}</span>
                  )}
                </button>
              ) : null}

              <div className={`${styles.messageItem} ${isMine ? styles.me : styles.them}`}>
                {!isMine ? <span className={styles.senderLabel}>{senderName}</span> : null}
                <div className={styles.bubbleWrap}>
                  {isMine ? (
                    <button
                      type="button"
                      className={styles.deleteButton}
                      aria-label="메시지 삭제"
                      title="메시지 삭제"
                      onClick={() => onDeleteMessage?.(item)}
                    >
                      <DeleteOutlineRoundedIcon />
                    </button>
                  ) : null}
                  <div className={styles.bubbleLine}>
                    {isMine ? (
                      <>
                        {unreadCount > 0 ? (
                          <span className={styles.unreadMarker}>{unreadCount}</span>
                        ) : null}
                        <div className={`${styles.bubble} ${styles.me}`}>
                          {item.content ? <p>{item.content}</p> : null}
                          {imageUrls.length > 0 ? (
                            <div
                              className={`${styles.messageMediaGrid} ${
                                imageUrls.length === 1 ? styles.singleMessageMediaGrid : ""
                              }`}
                            >
                              {imageUrls.map((imageUrl, index) => (
                                <img
                                  key={`${imageUrl}-${index}`}
                                  className={styles.messageMediaImage}
                                  src={imageUrl}
                                  alt={`첨부 이미지 ${index + 1}`}
                                  loading="lazy"
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => openImageViewerWithList(imageUrls, index, `첨부 이미지 ${index + 1}`)}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                      event.preventDefault();
                                      openImageViewerWithList(imageUrls, index, `첨부 이미지 ${index + 1}`);
                                    }
                                  }}
                                />
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={`${styles.bubble} ${styles.them}`}>
                          {item.content ? <p>{item.content}</p> : null}
                          {imageUrls.length > 0 ? (
                            <div
                              className={`${styles.messageMediaGrid} ${
                                imageUrls.length === 1 ? styles.singleMessageMediaGrid : ""
                              }`}
                            >
                              {imageUrls.map((imageUrl, index) => (
                                <img
                                  key={`${imageUrl}-${index}`}
                                  className={styles.messageMediaImage}
                                  src={imageUrl}
                                  alt={`첨부 이미지 ${index + 1}`}
                                  loading="lazy"
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => openImageViewerWithList(imageUrls, index, `첨부 이미지 ${index + 1}`)}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                      event.preventDefault();
                                      openImageViewerWithList(imageUrls, index, `첨부 이미지 ${index + 1}`);
                                    }
                                  }}
                                />
                              ))}
                            </div>
                          ) : null}
                        </div>
                        {unreadCount > 0 ? (
                          <span
                            className={styles.unreadMarker}
                            style={{ marginLeft: "6px", marginBottom: "4px" }}
                          >
                            {unreadCount}
                          </span>
                        ) : null}
                      </>
                    )}
                  </div>
                  <span
                    className={styles.messageTime}
                    style={isMine ? { textAlign: "right" } : { textAlign: "left" }}
                  >
                    {item.time || formatKoreanTime(item.createdAt) || ""}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

  {showScrollBottomButton ? (
        <button
          type="button"
          className={styles.scrollBottomButton}
          onClick={() => {
            isUserNearBottomRef.current = true;
            setShowScrollBottomButton(false);
            scrollToBottom("smooth");
          }}
          aria-label="최신 메시지로 이동"
          title="최신 메시지로 이동"
        >
          <KeyboardArrowDownRoundedIcon />
        </button>
      ) : null}

      {imageViewer ? (
        <div
          className={styles.imageViewerOverlay}
          role="presentation"
          onClick={() => setImageViewer(null)}
        >
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
              onClick={() => setImageViewer(null)}
            >
              <CloseRoundedIcon />
            </button>
            {Array.isArray(imageViewer.images) && imageViewer.images.length > 1 ? (
              <>
                <button
                  type="button"
                  className={`${styles.imageViewerNavButton} ${styles.imageViewerPrevButton}`}
                  aria-label="이전 이미지"
                  title="이전 이미지"
                  onClick={() => moveImageViewer(-1)}
                >
                  <KeyboardArrowLeftRoundedIcon className={styles.imageViewerNavIcon} />
                </button>
                <button
                  type="button"
                  className={`${styles.imageViewerNavButton} ${styles.imageViewerNextButton}`}
                  aria-label="다음 이미지"
                  title="다음 이미지"
                  onClick={() => moveImageViewer(1)}
                >
                  <KeyboardArrowRightRoundedIcon className={styles.imageViewerNavIcon} />
                </button>
              </>
            ) : null}
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
              onClick={() => setImageViewer(null)}
            />
          </div>
        </div>
      ) : null}

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

        {error ? <p className={styles.errorText}>{error}</p> : null}

        <div className={styles.composerRow}>
          <label className={styles.addButton} aria-label="이미지 추가" title="이미지 추가">
            <AddRoundedIcon />
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelection}
              disabled={!activeRoom || isUploadingImages}
            />
          </label>
          <div className={styles.inputShell}>
            <input
              ref={messageInputRef}
              placeholder="메시지를 입력하세요..."
              value={messageValue}
              onChange={onMessageChange}
              disabled={!activeRoom || isUploadingImages}
            />
            <button
              type="button"
              className={styles.emojiButton}
              aria-label="이모지"
              title="이모지"
              disabled={!activeRoom || isUploadingImages}
            >
              <SentimentSatisfiedAltRoundedIcon />
            </button>
          </div>
          <button
            type="submit"
            className={styles.sendButton}
            aria-label="메시지 보내기"
            title="메시지 보내기"
            disabled={!activeRoom || isUploadingImages}
          >
            <SendRoundedIcon />
          </button>
        </div>
      </form>
    </div>
  );
}
