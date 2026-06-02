import axios from "axios";

const BACKSERVER = (import.meta.env.VITE_BACKSERVER || "http://localhost:8080").replace(/\/$/, "");
const NOTICE_VISIBLE_DAYS = 7;
const NOTICE_VISIBLE_MS = NOTICE_VISIBLE_DAYS * 24 * 60 * 60 * 1000;

export const NOTICE_CATEGORY = {
  GENERAL: "일반",
  UPDATE: "업데이트",
  URGENT: "긴급",
};

export const NOTICE_TYPE = {
  NORMAL: "NORMAL",
  UPDATE: "UPDATE",
  EMERGENCY: "EMERGENCY",
};

export const NOTICE_STATUS = {
  ACTIVE: "ACTIVE",
  DELETE: "DELETE",
};

export const NOTICE_WRITABLE_CATEGORIES = [
  NOTICE_CATEGORY.GENERAL,
  NOTICE_CATEGORY.UPDATE,
  NOTICE_CATEGORY.URGENT,
];

const categoryByType = {
  [NOTICE_TYPE.NORMAL]: NOTICE_CATEGORY.GENERAL,
  [NOTICE_TYPE.UPDATE]: NOTICE_CATEGORY.UPDATE,
  [NOTICE_TYPE.EMERGENCY]: NOTICE_CATEGORY.URGENT,
};

const typeByCategory = {
  [NOTICE_CATEGORY.GENERAL]: NOTICE_TYPE.NORMAL,
  [NOTICE_CATEGORY.UPDATE]: NOTICE_TYPE.UPDATE,
  [NOTICE_CATEGORY.URGENT]: NOTICE_TYPE.EMERGENCY,
};

const formatDateText = (value) => {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0] = value;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  return String(value).replace("T", " ").slice(0, 16);
};

const toTimestamp = (value, fallback = 0) => {
  if (!value) {
    return fallback;
  }

  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = value;
    return new Date(year, month - 1, day, hour, minute, second).getTime();
  }

  const timestamp = new Date(String(value).replace(" ", "T")).getTime();
  return Number.isNaN(timestamp) ? fallback : timestamp;
};

const hasCenterWrapper = (content = "") => {
  return content.includes('data-notice-align="center"');
};

export const stripNoticeAlignWrapper = (content = "") => {
  return content
    .replace(/^<div data-notice-align="center" style="text-align: center;">/i, "")
    .replace(/<\/div>$/i, "");
};

export const buildNoticeContent = (content, alignCenter) => {
  const normalizedContent = stripNoticeAlignWrapper(content);

  if (!alignCenter) {
    return normalizedContent;
  }

  return `<div data-notice-align="center" style="text-align: center;">${normalizedContent}</div>`;
};

export const normalizeNotice = (notice) => {
  if (!notice) {
    return null;
  }

  const createdTimestamp = toTimestamp(notice.createdAt, Number(notice.noticeId) || Date.now());
  const updatedTimestamp = toTimestamp(notice.updatedAt, createdTimestamp);
  const deletedTimestamp = toTimestamp(notice.deletedAt, 0);
  const isDeleted = Boolean(notice.deletedAt);
  const isExpired = !isDeleted && Date.now() - createdTimestamp >= NOTICE_VISIBLE_MS;

  return {
    id: notice.noticeId,
    noticeId: notice.noticeId,
    title: notice.title ?? "",
    category: categoryByType[notice.noticeType] ?? NOTICE_CATEGORY.GENERAL,
    noticeType: notice.noticeType ?? NOTICE_TYPE.NORMAL,
    content: notice.content ?? "",
    alignCenter: hasCenterWrapper(notice.content),
    status: isDeleted ? NOTICE_STATUS.DELETE : NOTICE_STATUS.ACTIVE,
    isExpired,
    createdAt: formatDateText(notice.createdAt),
    createdTimestamp,
    adminName: notice.createdByAdminId ? `관리자 #${notice.createdByAdminId}` : "관리자",
    updatedAt: formatDateText(notice.updatedAt),
    updatedTimestamp,
    deletedAt: formatDateText(notice.deletedAt),
    deletedTimestamp,
    version: updatedTimestamp || createdTimestamp,
  };
};

export const toNoticePayload = ({ title, category, content }, alignCenter = false) => ({
  title,
  content: buildNoticeContent(content, alignCenter),
  noticeType: typeByCategory[category] ?? NOTICE_TYPE.NORMAL,
});

const authConfig = (accessToken, extraConfig = {}) => ({
  ...extraConfig,
  headers: {
    ...(extraConfig.headers || {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  },
});

export const fetchAdminNotices = async (accessToken, status = "all") => {
  const response = await axios.get(
    `${BACKSERVER}/admin/api/notices`,
    authConfig(accessToken, { params: { status } }),
  );

  return (response.data.notices || []).map(normalizeNotice).filter(Boolean);
};

export const fetchLatestNotice = async (accessToken) => {
  const response = await axios.get(
    `${BACKSERVER}/admin/api/notices/latest`,
    authConfig(accessToken),
  );

  return normalizeNotice(response.data.notice);
};

export const createAdminNotice = async (accessToken, payload) => {
  const response = await axios.post(
    `${BACKSERVER}/admin/api/notices`,
    payload,
    authConfig(accessToken),
  );

  return normalizeNotice(response.data.notice);
};

export const updateAdminNotice = async (accessToken, noticeId, payload) => {
  const response = await axios.put(
    `${BACKSERVER}/admin/api/notices/${noticeId}`,
    payload,
    authConfig(accessToken),
  );

  return normalizeNotice(response.data.notice);
};

export const softDeleteAdminNotice = async (accessToken, noticeId) => {
  const response = await axios.put(
    `${BACKSERVER}/admin/api/notices/${noticeId}/delete`,
    null,
    authConfig(accessToken),
  );

  return normalizeNotice(response.data.notice);
};

export const getLatestActiveNotice = (notices) => {
  return notices
    .filter((notice) => notice.status === NOTICE_STATUS.ACTIVE)
    .sort((left, right) => right.createdTimestamp - left.createdTimestamp)[0];
};

export const formatCategoryTag = (category) => `[${category}]`;
