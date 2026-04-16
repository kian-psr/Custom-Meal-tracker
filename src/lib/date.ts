function pad(part: number) {
  return String(part).padStart(2, "0");
}

export function getDateKey(date: Date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDateKey(dateKey?: string) {
  const baseDate = dateKey ? new Date(`${dateKey}T00:00:00`) : new Date();

  if (Number.isNaN(baseDate.getTime())) {
    throw new Error("Invalid date supplied.");
  }

  return baseDate;
}

export function getDayRange(dateKey?: string) {
  const baseDate = parseDateKey(dateKey);

  const start = new Date(baseDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return {
    key: getDateKey(start),
    start,
    end,
  };
}

export function addDays(dateKey: string, offset: number) {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + offset);
  return getDateKey(date);
}

export function listDateKeysEndingAt(dateKey: string, totalDays: number) {
  return Array.from({ length: totalDays }, (_, index) =>
    addDays(dateKey, -(totalDays - index - 1))
  );
}

export function formatDisplayDate(dateKey: string) {
  const date = parseDateKey(dateKey);

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatShortDate(dateKey: string) {
  const date = parseDateKey(dateKey);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function isToday(dateKey: string) {
  return getDateKey() === dateKey;
}

export function toDateTimeLocalValue(date: Date) {
  return `${getDateKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function dateTimeLocalForDay(dateKey: string, source?: Date) {
  const base = source ? new Date(source) : new Date();
  const day = parseDateKey(dateKey);
  day.setHours(base.getHours(), base.getMinutes(), 0, 0);
  return toDateTimeLocalValue(day);
}
