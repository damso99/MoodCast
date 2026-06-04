import { useEffect, useMemo, useState } from "react";
import styles from "../../adminComponentsCss/common/AdminPeriodRangeControl.module.css";

const SERVICE_START_YEAR = 2026;

function formatDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getToday() {
  return new Date();
}

function getMonthStartDate(year, month) {
  return new Date(year, month - 1, 1);
}

function getMonthEndDate(year, month) {
  return new Date(year, month, 0);
}

function getWeekStartDate(value) {
  const date = value ? new Date(`${value}T00:00:00`) : getToday();
  const day = date.getDay();

  date.setDate(date.getDate() - ((day + 6) % 7));
  date.setHours(0, 0, 0, 0);

  return date;
}

function buildRange(period, year, month, selectedDate, selectedWeekStartDate) {
  if (period === "week") {
    const start = getWeekStartDate(selectedWeekStartDate);
    const end = new Date(start);

    end.setDate(start.getDate() + 6);

    return {
      startDate: formatDateInputValue(start),
      endDate: formatDateInputValue(end),
    };
  }

  if (period === "month") {
    const start = getMonthStartDate(year, month);
    const end = getMonthEndDate(year, month);

    return {
      startDate: formatDateInputValue(start),
      endDate: formatDateInputValue(end),
    };
  }

  return {
    startDate: selectedDate,
    endDate: selectedDate,
  };
}

function getInitialState() {
  const today = getToday();
  const year = Math.max(SERVICE_START_YEAR, today.getFullYear());
  const month = today.getMonth() + 1;
  const selectedDate = formatDateInputValue(today);
  const selectedWeekStartDate = formatDateInputValue(getWeekStartDate(selectedDate));

  return {
    year,
    month,
    selectedDate,
    selectedWeekStartDate,
  };
}

export function AdminPeriodRangeControl({ period, onRangeChange }) {
  const [rangeState, setRangeState] = useState(() => getInitialState());
  const currentYear = getToday().getFullYear();
  const years = useMemo(
    () =>
      Array.from(
        { length: Math.max(currentYear - SERVICE_START_YEAR + 1, 1) },
        (_, index) => SERVICE_START_YEAR + index,
      ),
    [currentYear],
  );

  const emitRange = (nextState) => {
    const range = buildRange(
      period,
      nextState.year,
      nextState.month,
      nextState.selectedDate,
      nextState.selectedWeekStartDate,
    );

    onRangeChange(range);
  };

  const resetRange = () => {
    const nextState = getInitialState();

    setRangeState(nextState);
    emitRange(nextState);
  };

  useEffect(() => {
    resetRange();
  }, [period]);

  const updateRangeState = (patch) => {
    setRangeState((prevState) => {
      const nextState = { ...prevState, ...patch };

      emitRange(nextState);

      return nextState;
    });
  };

  const updateYear = (nextYear) => {
    if (period === "day") {
      updateRangeState({
        year: nextYear,
        selectedDate: `${nextYear}-01-01`,
      });
      return;
    }

    if (period === "week") {
      updateRangeState({
        year: nextYear,
        selectedWeekStartDate: `${nextYear}-01-01`,
      });
      return;
    }

    updateRangeState({ year: nextYear });
  };

  return (
    <div className={styles.rangeControl}>
      <label>
        <span>연도</span>
        <select
          value={rangeState.year}
          onChange={(event) =>
            updateYear(Number(event.target.value))
          }
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}년
            </option>
          ))}
        </select>
      </label>

      {period === "day" ? (
        <label>
          <span>날짜</span>
          <input
            type="date"
            min={`${SERVICE_START_YEAR}-01-01`}
            max={`${currentYear}-12-31`}
            value={rangeState.selectedDate}
            onChange={(event) =>
              updateRangeState({
                selectedDate: event.target.value,
                year: Number(event.target.value.slice(0, 4)),
              })
            }
          />
        </label>
      ) : null}

      {period === "week" ? (
        <label>
          <span>주 시작일</span>
          <input
            type="date"
            min={`${SERVICE_START_YEAR}-01-01`}
            max={`${currentYear}-12-31`}
            value={rangeState.selectedWeekStartDate}
            onChange={(event) =>
              updateRangeState({
                selectedWeekStartDate: event.target.value,
                year: Number(event.target.value.slice(0, 4)),
              })
            }
          />
        </label>
      ) : null}

      {period === "month" ? (
        <label>
          <span>월</span>
          <select
            value={rangeState.month}
            onChange={(event) =>
              updateRangeState({ month: Number(event.target.value) })
            }
          >
            {Array.from({ length: 12 }, (_, index) => index + 1).map(
              (month) => (
                <option key={month} value={month}>
                  {month}월
                </option>
              ),
            )}
          </select>
        </label>
      ) : null}

      <button type="button" onClick={resetRange}>
        초기화
      </button>
    </div>
  );
}
