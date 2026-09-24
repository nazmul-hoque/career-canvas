const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
// Days are stored as UTC calendar days; formatting them in local time would
// show yesterday to anyone west of Greenwich.
const utcDateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" });
const utcDayFormat = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const isDay = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

/** Accepts timestamps and bare `YYYY-MM-DD` days. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(isDay(value) ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return "—";
  return (isDay(value) ? utcDateFormat : dateFormat).format(date);
}

export const formatDay = (value: string) => utcDayFormat.format(new Date(`${value}T00:00:00Z`));

export const formatCount = (n: number) => n.toLocaleString();
