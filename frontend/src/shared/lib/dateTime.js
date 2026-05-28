export const KOREAN_TIME_ZONE = "Asia/Seoul";
export const KOREAN_LOCALE = "ko-KR";

function toValidDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string") {
    const normalizedValue = value.trim();
    const hasTimeZoneOffset = /([zZ]|[+-]\d{2}:?\d{2})$/.test(normalizedValue);
    const localTimestampPattern =
      /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?$/;

    if (localTimestampPattern.test(normalizedValue) && !hasTimeZoneOffset) {
      const [datePart, timePart] = normalizedValue.split(/[T\s]/);
      const [year, month, day] = datePart.split("-").map(Number);
      const [hour, minute, secondWithMs] = timePart.split(":");
      const [second, millisecond = "0"] = secondWithMs.split(".");

      const kstDate = new Date(
        Date.UTC(
          year,
          month - 1,
          day,
          Number(hour) - 9,
          Number(minute),
          Number(second),
          Number(millisecond.padEnd(3, "0")),
        ),
      );

      return Number.isNaN(kstDate.getTime()) ? null : kstDate;
    }
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
