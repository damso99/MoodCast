export const KOREAN_TIME_ZONE = "Asia/Seoul";
export const KOREAN_LOCALE = "ko-KR";

function toValidDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatKoreanDate(value) {
  const date = toValidDate(value);

  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat(KOREAN_LOCALE, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: KOREAN_TIME_ZONE,
  }).format(date);
}

export function formatKoreanTime(value) {
  const date = toValidDate(value);

  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat(KOREAN_LOCALE, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: KOREAN_TIME_ZONE,
  }).format(date);
}
