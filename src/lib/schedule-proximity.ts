export type DeadlineProximity = "normal" | "soon" | "urgent";

const dayInMilliseconds = 24 * 60 * 60 * 1000;

export function getDateOnlyInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric"
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function addDaysToDateOnly(dateOnly: string, days: number) {
  const { day, month, year } = parseDateOnly(dateOnly);
  const date = new Date(Date.UTC(year, month - 1, day + days));

  return date.toISOString().slice(0, 10);
}

export function getDateOnlyDaysUntil(dueOn: string, now: Date, timeZone: string) {
  const today = getDateOnlyInTimeZone(now, timeZone);

  return (dateOnlyToUtcDay(dueOn) - dateOnlyToUtcDay(today)) / dayInMilliseconds;
}

export function getDeadlineProximity(
  dueOn: string,
  now: Date,
  timeZone: string
): DeadlineProximity {
  const daysUntil = getDateOnlyDaysUntil(dueOn, now, timeZone);

  if (daysUntil <= 1) {
    return "urgent";
  }

  if (daysUntil <= 7) {
    return "soon";
  }

  return "normal";
}

export function isDeadlineWithin48Hours(dueOn: string, now: Date, timeZone: string) {
  const daysUntil = getDateOnlyDaysUntil(dueOn, now, timeZone);

  return daysUntil >= 0 && daysUntil <= 2;
}

function dateOnlyToUtcDay(dateOnly: string) {
  const { day, month, year } = parseDateOnly(dateOnly);

  return Date.UTC(year, month - 1, day);
}

function parseDateOnly(dateOnly: string) {
  const [yearText, monthText, dayText] = dateOnly.split("-");

  return {
    day: Number(dayText),
    month: Number(monthText),
    year: Number(yearText)
  };
}
