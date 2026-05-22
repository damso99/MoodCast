import { useMemo, useState } from "react";
import { AdminLayout } from "../common/AdminLayout";
import { EmptyState } from "../common/EmptyState";
import { SegmentedControl } from "../common/SegmentedControl";
import styles from "../../adminComponentsCss/noticeManagement/NoticeManagementPage.module.css";

const noticeCategories = ["전체", "일반", "업데이트", "긴급", "삭제 공지"];
const writableCategories = ["일반", "업데이트", "긴급"];

const initialNoticeForm = {
  title: "",
  category: "일반",
  content: "",
};

const initialNotices = [];

/* ==========================================================================
 * 공지사항 관리 페이지
 * --------------------------------------------------------------------------
 * 관리자가 공지사항을 작성, 수정, 삭제하고 목록을 확인하는 화면입니다.
 *
 * 현재 동작 방식:
 * - 백엔드가 아직 연결되지 않았기 때문에 공지사항은 React state에 임시 저장됩니다.
 * - 작성한 공지사항은 소프트 삭제 전까지 일반 목록 테이블에 남아 있습니다.
 * - 삭제 버튼을 누른 공지는 완전히 사라지지 않고 "삭제 공지" 탭으로 이동합니다.
 * - "삭제 공지" 탭에서 완전 삭제를 누른 경우에만 목록에서 완전히 제거됩니다.
 * - 새로고침하면 프론트 state가 초기화되므로, 실제 서비스에서는 DB 저장 API가 필요합니다.
 *
 * 주요 기능:
 * - 공지사항 작성: 제목, 분류, 내용 입력 후 목록에 추가합니다.
 * - 공지사항 수정: 목록의 수정 버튼을 누르면 작성 폼에 기존 내용이 채워집니다.
 * - 공지사항 삭제: 일반 목록의 삭제 버튼을 누르면 삭제 공지 상태로 바꿉니다.
 * - 공지사항 복구: 삭제 공지 탭의 복구 버튼을 누르면 일반 목록으로 되돌립니다.
 * - 공지사항 완전 삭제: 삭제 공지 탭에서만 실제 목록에서 제거합니다.
 * - 공지사항 필터: 전체, 일반, 업데이트, 긴급, 삭제 공지 기준으로 목록을 좁혀 봅니다.
 * - 공지사항 전문 팝업: 제목 버튼을 누르면 공지사항 전체 내용이 모달로 열립니다.
 * ========================================================================== */
export function NoticeManagementPage() {
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [noticeForm, setNoticeForm] = useState(initialNoticeForm);
  const [notices, setNotices] = useState(initialNotices);
  const [editingNoticeId, setEditingNoticeId] = useState(null);
  const [openedNotice, setOpenedNotice] = useState(null);

  // 공지사항 필터 ----------------------------------
  const filteredNotices = useMemo(() => {
    if (selectedCategory === "삭제 공지") {
      return notices.filter((notice) => notice.deletedAt);
    }

    const activeNotices = notices.filter((notice) => !notice.deletedAt);

    if (selectedCategory === "전체") {
      return activeNotices;
    }

    return activeNotices.filter(
      (notice) => notice.category === selectedCategory,
    );
  }, [notices, selectedCategory]);

  const isEditing = editingNoticeId !== null;
  const isDeletedNoticeTab = selectedCategory === "삭제 공지";

  // 공지사항 입력값 변경 ----------------------------------
  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setNoticeForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  // 공지사항 작성/수정 초기화 ----------------------------------
  const resetForm = () => {
    setNoticeForm(initialNoticeForm);
    setEditingNoticeId(null);
  };

  // 공지사항 작성 ----------------------------------
  const handleSubmitNotice = (event) => {
    event.preventDefault();

    const trimmedTitle = noticeForm.title.trim();
    const trimmedContent = noticeForm.content.trim();

    if (!trimmedTitle || !trimmedContent) {
      return;
    }

    // 공지사항 수정 ----------------------------------
    if (isEditing) {
      setNotices((prevNotices) =>
        prevNotices.map((notice) =>
          notice.id === editingNoticeId
            ? {
                ...notice,
                title: trimmedTitle,
                category: noticeForm.category,
                content: trimmedContent,
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
      content: trimmedContent,
      createdAt: new Date().toLocaleDateString("ko-KR"),
      adminName: "관리자",
      deletedAt: null,
    };

    setNotices((prevNotices) => [createdNotice, ...prevNotices]);
    resetForm();
  };

  // 공지사항 수정 화면 전환 ----------------------------------
  const handleEditNotice = (notice) => {
    if (notice.deletedAt) {
      return;
    }

    setEditingNoticeId(notice.id);
    setNoticeForm({
      title: notice.title,
      category: notice.category,
      content: notice.content,
    });
  };

  // 공지사항 소프트 삭제 ----------------------------------
  const handleDeleteNotice = (noticeId) => {
    const deletedDate = new Date().toLocaleDateString("ko-KR");

    setNotices((prevNotices) =>
      prevNotices.map((notice) =>
        notice.id === noticeId
          ? {
              ...notice,
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

  // 공지사항 복구 ----------------------------------
  const handleRestoreNotice = (noticeId) => {
    setNotices((prevNotices) =>
      prevNotices.map((notice) =>
        notice.id === noticeId
          ? {
              ...notice,
              deletedAt: null,
            }
          : notice,
      ),
    );
  };

  // 공지사항 완전 삭제 ----------------------------------
  const handlePermanentDeleteNotice = (noticeId) => {
    setNotices((prevNotices) =>
      prevNotices.filter((notice) => notice.id !== noticeId),
    );

    if (openedNotice?.id === noticeId) {
      setOpenedNotice(null);
    }
  };

  return (
    <AdminLayout
      title="공지사항 관리"
      description="공지사항을 작성, 수정, 삭제하고 목록을 관리하세요."
    >
      {/* 공지사항 작성 ---------------------------------- */}
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>{isEditing ? "공지사항 수정" : "공지사항 작성"}</h2>
          <span>
            {isEditing
              ? "선택한 공지사항을 수정 중입니다."
              : "새 공지사항을 작성합니다."}
          </span>
        </div>

        <form className={styles.noticeForm} onSubmit={handleSubmitNotice}>
          <label>
            공지사항 제목
            <input
              name="title"
              type="text"
              value={noticeForm.title}
              placeholder="공지사항 제목을 입력하세요"
              onChange={handleFormChange}
            />
          </label>

          <label>
            공지사항 분류
            <select
              name="category"
              value={noticeForm.category}
              onChange={handleFormChange}
            >
              {writableCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.fullField}>
            공지사항 내용
            <textarea
              name="content"
              value={noticeForm.content}
              placeholder="공지사항 내용을 입력하세요"
              onChange={handleFormChange}
            />
          </label>

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

      {/* 공지사항 필터 ---------------------------------- */}
      <section className={styles.toolbar}>
        <SegmentedControl
          labels={noticeCategories}
          selectedLabel={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </section>

      {/* 공지사항 목록 ---------------------------------- */}
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>{isDeletedNoticeTab ? "삭제 공지 목록" : "공지사항 목록"}</h2>
          <span>
            {isDeletedNoticeTab
              ? "소프트 삭제된 공지는 이 탭에서만 완전 삭제할 수 있습니다."
              : "삭제하지 않은 공지사항은 목록 테이블에 계속 보관됩니다."}
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
                        className={`${styles.categoryBadge} ${styles[`category${notice.category}`]}`}
                      >
                        {notice.category}
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
                            {/* 공지사항 복구 ---------------------------------- */}
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
                            {/* 공지사항 수정 ---------------------------------- */}
                            <button
                              type="button"
                              onClick={() => handleEditNotice(notice)}
                            >
                              수정
                            </button>
                            {/* 공지사항 소프트 삭제 ---------------------------------- */}
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

      {/* 공지사항 전문 팝업 ---------------------------------- */}
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
                  className={`${styles.categoryBadge} ${styles[`category${openedNotice.category}`]}`}
                >
                  {openedNotice.category}
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
            </div>
            <p className={styles.modalContent}>{openedNotice.content}</p>
          </section>
        </div>
      ) : null}
    </AdminLayout>
  );
}
