const NOTICE_STORAGE_KEY = "moodcast_admin_notices_v1";

export const NOTICE_CATEGORY = {
  GENERAL: "일반",
  UPDATE: "업데이트",
  URGENT: "긴급",
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

const safeJsonParse = (rawValue, fallbackValue) => {
  try {
    return JSON.parse(rawValue);
  } catch {
    return fallbackValue;
  }
};

const normalizeNotice = (notice) => {
  const category = NOTICE_WRITABLE_CATEGORIES.includes(notice.category)
    ? notice.category
    : NOTICE_CATEGORY.GENERAL;

  return {
    ...notice,
    category,
    status: notice.status || NOTICE_STATUS.ACTIVE,
    createdTimestamp: notice.createdTimestamp || Number(notice.id) || Date.now(),
    version: notice.version ?? 1,
  };
};

export const loadNotices = () => {
  const storedValue = window.localStorage.getItem(NOTICE_STORAGE_KEY);
  if (!storedValue) {
    return [];
  }

  const parsed = safeJsonParse(storedValue, []);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.map(normalizeNotice);
};

export const saveNotices = (notices) => {
  window.localStorage.setItem(NOTICE_STORAGE_KEY, JSON.stringify(notices));
};

export const getLatestActiveNotice = (notices) => {
  return notices
    .filter((notice) => notice.status === NOTICE_STATUS.ACTIVE)
    .sort((left, right) => right.createdTimestamp - left.createdTimestamp)[0];
};

export const formatCategoryTag = (category) => `[${category}]`;
