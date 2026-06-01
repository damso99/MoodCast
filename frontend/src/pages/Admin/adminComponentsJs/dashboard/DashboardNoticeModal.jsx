import { useEffect, useMemo, useState } from "react";
import {
  formatCategoryTag,
  getLatestActiveNotice,
  loadNotices,
  NOTICE_CATEGORY,
} from "../noticeManagement/noticeStorage";
import styles from "../../adminComponentsCss/dashboard/DashboardNoticeModal.module.css";

const getTodayKey = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getDismissKey = (notice) =>
  `moodcast_notice_dismiss_${notice.id}_${notice.version ?? 1}_${getTodayKey()}`;

export function DashboardNoticeModal() {
  const [notices, setNotices] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [skipToday, setSkipToday] = useState(false);

  useEffect(() => {
    const syncNotices = () => {
      setNotices(loadNotices());
    };

    syncNotices();
    window.addEventListener("storage", syncNotices);
    return () => window.removeEventListener("storage", syncNotices);
  }, []);

  const latestNotice = useMemo(() => getLatestActiveNotice(notices), [notices]);

  useEffect(() => {
    if (!latestNotice) {
      setIsOpen(false);
      return;
    }

    const dismissedToday = window.localStorage.getItem(
      getDismissKey(latestNotice),
    );
    setIsOpen(!dismissedToday);
    setSkipToday(false);
  }, [latestNotice]);

  if (!latestNotice || !isOpen) {
    return null;
  }

  const handleClose = () => {
    if (skipToday) {
      window.localStorage.setItem(getDismissKey(latestNotice), "true");
    }
    setIsOpen(false);
  };

  const categoryClassMap = {
    [NOTICE_CATEGORY.GENERAL]: styles.categoryGeneral,
    [NOTICE_CATEGORY.UPDATE]: styles.categoryUpdate,
    [NOTICE_CATEGORY.URGENT]: styles.categoryUrgent,
  };

  return (
    <div className={styles.backdrop} role="presentation" onClick={handleClose}>
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-notice-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div>
            <h2>공지사항</h2>
            <p>서비스 이용에 필요한 안내사항입니다.</p>
          </div>
          <button type="button" onClick={handleClose} aria-label="공지 닫기">
            ×
          </button>
        </header>

        <div className={styles.contentWrap}>
          <span
            className={`${styles.categoryBadge} ${categoryClassMap[latestNotice.category] || ""}`}
          >
            {formatCategoryTag(latestNotice.category)}
          </span>
          <h3 id="dashboard-notice-title">{latestNotice.title}</h3>
          <div
            className={styles.contentText}
            dangerouslySetInnerHTML={{ __html: latestNotice.content }}
          />
        </div>

        <footer className={styles.footer}>
          <label className={styles.checkLabel}>
            <input
              type="checkbox"
              checked={skipToday}
              onChange={(event) => setSkipToday(event.target.checked)}
            />
            오늘 하루 보지 않기
          </label>
          <button
            type="button"
            onClick={handleClose}
            className={styles.closeButton}
          >
            닫기
          </button>
        </footer>
      </section>
    </div>
  );
}
