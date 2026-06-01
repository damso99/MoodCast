import { useEffect, useMemo, useRef, useState } from "react";
import { AdminLayout } from "../common/AdminLayout";
import { EmptyState } from "../common/EmptyState";
import { SegmentedControl } from "../common/SegmentedControl";
import { formatKoreanDate } from "../../../../shared/lib/dateTime";
import styles from "../../adminComponentsCss/noticeManagement/NoticeManagementPage.module.css";
import {
  formatCategoryTag,
  loadNotices,
  NOTICE_CATEGORY,
  NOTICE_STATUS,
  NOTICE_WRITABLE_CATEGORIES,
  saveNotices,
} from "./noticeStorage";

const noticeCategories = ["전체", "일반", "업데이트", "긴급", "삭제 공지"];

const initialNoticeForm = {
  title: "",
  category: NOTICE_CATEGORY.GENERAL,
  content: "",
};

const initialEditorMarks = {
  bold: false,
  underline: false,
  unorderedList: false,
  orderedList: false,
  link: false,
};

export function NoticeManagementPage() {
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [noticeForm, setNoticeForm] = useState(initialNoticeForm);
  const [notices, setNotices] = useState([]);
  const [editingNoticeId, setEditingNoticeId] = useState(null);
  const [openedNotice, setOpenedNotice] = useState(null);
  const [editorMarks, setEditorMarks] = useState(initialEditorMarks);
  const [editorLink, setEditorLink] = useState("");
  const editorRef = useRef(null);
  const savedSelectionRef = useRef(null);
  const listEnterCountRef = useRef(0);

  useEffect(() => {
    setNotices(loadNotices());
  }, []);

  useEffect(() => {
    saveNotices(notices);
  }, [notices]);

  const filteredNotices = useMemo(() => {
    if (selectedCategory === "삭제 공지") {
      return notices.filter((notice) => notice.status === NOTICE_STATUS.DELETE);
    }

    const activeNotices = notices.filter(
      (notice) => notice.status === NOTICE_STATUS.ACTIVE,
    );

    if (selectedCategory === "전체") {
      return activeNotices;
    }

    return activeNotices.filter(
      (notice) => notice.category === selectedCategory,
    );
  }, [notices, selectedCategory]);

  const isEditing = editingNoticeId !== null;
  const isDeletedNoticeTab = selectedCategory === "삭제 공지";

  const categoryClassMap = {
    [NOTICE_CATEGORY.GENERAL]: styles.categoryGeneral,
    [NOTICE_CATEGORY.UPDATE]: styles.categoryUpdate,
    [NOTICE_CATEGORY.URGENT]: styles.categoryUrgent,
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setNoticeForm((prevForm) => ({ ...prevForm, [name]: value }));
  };

  const saveEditorSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    const anchorNode = selection?.anchorNode;

    if (
      !editor ||
      !selection ||
      selection.rangeCount === 0 ||
      !anchorNode ||
      !editor.contains(anchorNode)
    ) {
      return;
    }

    savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
  };

  const restoreEditorSelection = () => {
    const editor = editorRef.current;
    const range = savedSelectionRef.current;

    if (!editor) {
      return;
    }

    editor.focus();

    if (!range) {
      return;
    }

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const updateEditorContent = () => {
    if (!editorRef.current) {
      return;
    }

    setNoticeForm((prevForm) => ({
      ...prevForm,
      content: editorRef.current.innerHTML,
    }));
  };

  const resetForm = () => {
    setNoticeForm(initialNoticeForm);
    setEditingNoticeId(null);
    setEditorMarks(initialEditorMarks);
    setEditorLink("");
    savedSelectionRef.current = null;
    listEnterCountRef.current = 0;

    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
  };

  const ensureEditorCommandState = (command, shouldBeActive) => {
    const isActive = document.queryCommandState(command);

    if (isActive !== shouldBeActive) {
      document.execCommand(command, false, null);
    }
  };

  const applyEditorState = (marks = editorMarks) => {
    restoreEditorSelection();

    document.execCommand("styleWithCSS", false, true);
    ensureEditorCommandState("bold", marks.bold);
    ensureEditorCommandState("underline", marks.underline);

    updateEditorContent();
    saveEditorSelection();
  };

  const toggleInlineMark = (markKey) => {
    const nextMarks = {
      ...editorMarks,
      [markKey]: !editorMarks[markKey],
    };

    setEditorMarks(nextMarks);
    applyEditorState(nextMarks);
  };

  const toggleListMark = (markKey, command) => {
    listEnterCountRef.current = 0;

    const nextMarks = {
      ...editorMarks,
      [markKey]: !editorMarks[markKey],
    };

    setEditorMarks(nextMarks);
    restoreEditorSelection();
    ensureEditorCommandState(command, nextMarks[markKey]);
    applyEditorState(nextMarks);
    updateEditorContent();
    saveEditorSelection();
  };

  const disableInlineMarksAfterEnter = () => {
    const nextMarks = {
      ...editorMarks,
      bold: false,
      underline: false,
    };

    setEditorMarks(nextMarks);
    applyEditorState(nextMarks);
  };

  const toggleLinkMark = () => {
    if (editorMarks.link) {
      setEditorMarks((prevMarks) => ({ ...prevMarks, link: false }));
      setEditorLink("");
      restoreEditorSelection();
      document.execCommand("unlink", false, null);
      updateEditorContent();
      saveEditorSelection();
      return;
    }

    const link = window.prompt("링크 주소를 입력하세요.", "https://");
    if (!link) {
      return;
    }

    setEditorMarks((prevMarks) => ({ ...prevMarks, link: true }));
    setEditorLink(link);
    restoreEditorSelection();
    document.execCommand("createLink", false, link);
    updateEditorContent();
    saveEditorSelection();
  };

  const handleToolbarMouseDown = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleEditorInput = () => {
    updateEditorContent();
    saveEditorSelection();
  };

  const handleEditorSelectionChange = () => {
    saveEditorSelection();
  };

  const handleEditorKeyDown = (event) => {
    if (event.key !== "Enter") {
      listEnterCountRef.current = 0;
      return;
    }

    const isListMode = editorMarks.unorderedList || editorMarks.orderedList;
    if (isListMode) {
      listEnterCountRef.current += 1;

      if (listEnterCountRef.current >= 2) {
        requestAnimationFrame(() => {
          const nextMarks = {
            ...editorMarks,
            unorderedList: false,
            orderedList: false,
          };

          setEditorMarks(nextMarks);
          restoreEditorSelection();
          ensureEditorCommandState("insertUnorderedList", false);
          ensureEditorCommandState("insertOrderedList", false);
          applyEditorState(nextMarks);
          updateEditorContent();
          saveEditorSelection();
          listEnterCountRef.current = 0;
        });
      }

      return;
    }

    listEnterCountRef.current = 0;

    if (!editorMarks.bold && !editorMarks.underline) {
      return;
    }

    requestAnimationFrame(() => {
      const nextMarks = {
        ...editorMarks,
        bold: false,
        underline: false,
      };
      disableInlineMarksAfterEnter();
    });
  };

  const handleBold = () => toggleInlineMark("bold");
  const handleUnderline = () => toggleInlineMark("underline");
  const handleBulletList = () =>
    toggleListMark("unorderedList", "insertUnorderedList");
  const handleNumberList = () =>
    toggleListMark("orderedList", "insertOrderedList");
  const handleLink = () => toggleLinkMark();

  const handleSubmitNotice = (event) => {
    event.preventDefault();

    const trimmedTitle = noticeForm.title.trim();
    const plainContent = noticeForm.content.replace(/<[^>]*>/g, "").trim();

    if (!trimmedTitle || !plainContent) {
      return;
    }

    if (isEditing) {
      setNotices((prevNotices) =>
        prevNotices.map((notice) =>
          notice.id === editingNoticeId
            ? {
                ...notice,
                title: trimmedTitle,
                category: noticeForm.category,
                content: noticeForm.content,
                updatedAt: formatKoreanDate(new Date()),
                updatedTimestamp: Date.now(),
                version: (notice.version ?? 1) + 1,
              }
            : notice,
        ),
      );
      resetForm();
      return;
    }

    const createdNotice = {
      id: Date.now(),
      title: trimmedTitle,
      category: noticeForm.category,
      content: noticeForm.content,
      status: NOTICE_STATUS.ACTIVE,
      createdAt: formatKoreanDate(new Date()),
      createdTimestamp: Date.now(),
      adminName: "관리자",
      updatedAt: null,
      updatedTimestamp: null,
      deletedAt: null,
      version: 1,
    };

    setNotices((prevNotices) => [createdNotice, ...prevNotices]);
    resetForm();
  };

  const handleEditNotice = (notice) => {
    if (notice.status === NOTICE_STATUS.DELETE) {
      return;
    }

    setEditingNoticeId(notice.id);
    setNoticeForm({
      title: notice.title,
      category: notice.category,
      content: notice.content,
    });
    setEditorMarks(initialEditorMarks);
    setEditorLink("");

    requestAnimationFrame(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = notice.content;
        editorRef.current.focus();
        saveEditorSelection();
      }
    });
  };

  const handleDeleteNotice = (noticeId) => {
    const deletedDate = formatKoreanDate(new Date());

    setNotices((prevNotices) =>
      prevNotices.map((notice) =>
        notice.id === noticeId
          ? {
              ...notice,
              status: NOTICE_STATUS.DELETE,
              deletedAt: deletedDate,
            }
          : notice,
      ),
    );

    if (editingNoticeId === noticeId) {
      resetForm();
    }

    if (openedNotice?.id === noticeId) {
      setOpenedNotice(null);
    }
  };

  const handleRestoreNotice = (noticeId) => {
    setNotices((prevNotices) =>
      prevNotices.map((notice) =>
        notice.id === noticeId
          ? {
              ...notice,
              status: NOTICE_STATUS.ACTIVE,
              deletedAt: null,
            }
          : notice,
      ),
    );
  };

  const handlePermanentDeleteNotice = (noticeId) => {
    setNotices((prevNotices) =>
      prevNotices.filter((notice) => notice.id !== noticeId),
    );

    if (openedNotice?.id === noticeId) {
      setOpenedNotice(null);
    }
  };

  const editorButtons = [
    { key: "bold", label: "굵게", pressed: editorMarks.bold, onClick: handleBold },
    {
      key: "underline",
      label: "밑줄",
      pressed: editorMarks.underline,
      onClick: handleUnderline,
    },
    {
      key: "unorderedList",
      label: "목록",
      pressed: editorMarks.unorderedList,
      onClick: handleBulletList,
    },
    {
      key: "orderedList",
      label: "번호",
      pressed: editorMarks.orderedList,
      onClick: handleNumberList,
    },
    { key: "link", label: "링크", pressed: editorMarks.link, onClick: handleLink },
  ];

  return (
    <AdminLayout
      title="공지사항 관리"
      description="공지사항을 작성, 수정, 삭제하고 목록을 관리하세요."
    >
      <section className={styles.composePanel}>
        <div className={styles.composeHeader}>
          <div>
            <p className={styles.eyebrow}>Notice editor</p>
            <h2>{isEditing ? "공지사항 수정" : "공지사항 작성"}</h2>
            <span>
              {isEditing
                ? "수정 저장 시 대시보드 공지가 다시 노출됩니다."
                : "새 공지를 작성하면 최신 공지 1건만 대시보드에 노출됩니다."}
            </span>
          </div>
          <span className={styles.modeBadge}>
            {isEditing ? "수정 중" : "새 공지"}
          </span>
        </div>

        <form className={styles.noticeForm} onSubmit={handleSubmitNotice}>
          <label className={styles.titleField}>
            공지사항 제목
            <input
              name="title"
              type="text"
              value={noticeForm.title}
              placeholder="공지사항 제목을 입력하세요"
              onChange={handleFormChange}
            />
          </label>

          <label className={styles.categoryField}>
            공지사항 분류
            <select
              name="category"
              value={noticeForm.category}
              onChange={handleFormChange}
            >
              {NOTICE_WRITABLE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.fullField}>
            <span className={styles.fieldLabel}>공지사항 내용</span>
            <div className={styles.editorShell}>
              <div className={styles.editorToolbar}>
                {editorButtons.map((button) => (
                  <button
                    key={button.key}
                    type="button"
                    onMouseDown={handleToolbarMouseDown}
                    onClick={button.onClick}
                    aria-pressed={button.pressed}
                    title={
                      button.key === "link" && editorLink
                        ? editorLink
                        : button.label
                    }
                    className={button.pressed ? styles.editorButtonActive : ""}
                  >
                    {button.label}
                  </button>
                ))}
              </div>
              <div
                ref={editorRef}
                className={styles.richEditor}
                contentEditable
                data-placeholder="공지사항 내용을 입력하세요"
                suppressContentEditableWarning
                onInput={handleEditorInput}
                onFocus={handleEditorSelectionChange}
                onKeyUp={handleEditorSelectionChange}
                onKeyDown={handleEditorKeyDown}
                onMouseUp={handleEditorSelectionChange}
                aria-label="공지사항 텍스트 에디터"
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="button" onClick={resetForm}>
              {isEditing ? "수정 취소" : "초기화"}
            </button>
            <button type="submit">
              {isEditing ? "공지사항 수정" : "공지사항 작성"}
            </button>
          </div>
        </form>
      </section>

      <section className={styles.toolbar}>
        <SegmentedControl
          labels={noticeCategories}
          selectedLabel={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>{isDeletedNoticeTab ? "삭제 공지 목록" : "공지사항 목록"}</h2>
          <span>
            {isDeletedNoticeTab
              ? "DELETE 상태 공지만 완전 삭제할 수 있습니다."
              : "최신 공지 1건만 대시보드 팝업에 노출됩니다."}
          </span>
        </div>

        <div className={styles.tableWrap}>
          <table
            className={`${styles.noticeTable} ${isDeletedNoticeTab ? styles.deletedNoticeTable : ""}`}
          >
            <thead>
              <tr>
                <th>분류</th>
                <th>공지사항 제목</th>
                <th>작성일</th>
                <th>작성 관리자</th>
                {isDeletedNoticeTab ? <th>삭제일</th> : null}
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotices.length > 0 ? (
                filteredNotices.map((notice) => (
                  <tr key={notice.id}>
                    <td>
                      <span
                        className={`${styles.categoryBadge} ${categoryClassMap[notice.category] || ""}`}
                      >
                        {formatCategoryTag(notice.category)}
                      </span>
                    </td>
                    <td>
                      <button
                        className={styles.noticeTitleButton}
                        type="button"
                        onClick={() => setOpenedNotice(notice)}
                      >
                        {notice.title}
                      </button>
                    </td>
                    <td>{notice.createdAt}</td>
                    <td>{notice.adminName}</td>
                    {isDeletedNoticeTab ? <td>{notice.deletedAt}</td> : null}
                    <td>
                      <div className={styles.rowActions}>
                        {isDeletedNoticeTab ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleRestoreNotice(notice.id)}
                            >
                              복구
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handlePermanentDeleteNotice(notice.id)
                              }
                            >
                              완전 삭제
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleEditNotice(notice)}
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteNotice(notice.id)}
                            >
                              삭제
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isDeletedNoticeTab ? 6 : 5}>
                    <EmptyState
                      title={
                        isDeletedNoticeTab ? "삭제 공지 없음" : "공지사항 없음"
                      }
                      description={
                        isDeletedNoticeTab
                          ? "소프트 삭제 상태의 공지사항이 없습니다."
                          : "작성된 공지사항이 없거나 선택한 필터에 해당하는 공지사항이 없습니다."
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {openedNotice ? (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={() => setOpenedNotice(null)}
        >
          <section
            className={styles.noticeModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="notice-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHead}>
              <div>
                <span
                  className={`${styles.categoryBadge} ${categoryClassMap[openedNotice.category] || ""}`}
                >
                  {formatCategoryTag(openedNotice.category)}
                </span>
                <h2 id="notice-modal-title">{openedNotice.title}</h2>
              </div>
              <button type="button" onClick={() => setOpenedNotice(null)}>
                닫기
              </button>
            </div>
            <div className={styles.modalMeta}>
              <span>작성일 {openedNotice.createdAt}</span>
              <span>작성 관리자 {openedNotice.adminName}</span>
              {openedNotice.updatedAt ? (
                <span>수정일 {openedNotice.updatedAt}</span>
              ) : null}
            </div>
            <div
              className={styles.modalContent}
              dangerouslySetInnerHTML={{ __html: openedNotice.content }}
            />
          </section>
        </div>
      ) : null}
    </AdminLayout>
  );
}
