export const DURATION_MINUTES = Array.from(
  { length: 16 },
  (_, index) => (index + 1) * 30,
);

export function bangkokToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function addDays(isoDate, days) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));

  return next.toISOString().slice(0, 10);
}

export function clockMinutes(eventTime) {
  const [hours, minutes] = String(eventTime).slice(0, 5).split(":").map(Number);

  return hours * 60 + minutes;
}

export function formatClock(totalMinutes) {
  const wrapped = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = String(Math.floor(wrapped / 60)).padStart(2, "0");
  const minutes = String(wrapped % 60).padStart(2, "0");

  return `${hours}:${minutes}`;
}

export function formatTimeRange(eventTime, durationMinutes) {
  const start = clockMinutes(eventTime);

  return `${formatClock(start)}–${formatClock(start + durationMinutes)}`;
}

export function formatDuration(durationMinutes) {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours === 0) {
    return `${minutes} นาที`;
  }

  if (minutes === 0) {
    return `${hours} ชม.`;
  }

  return `${hours} ชม. ${minutes} นาที`;
}

export function partyStartMs(eventDate, eventTime) {
  return Date.parse(`${eventDate}T${String(eventTime).slice(0, 5)}:00+07:00`);
}

export function partyEndMs(eventDate, eventTime, durationMinutes) {
  return partyStartMs(eventDate, eventTime) + durationMinutes * 60 * 1000;
}

// Weekday names are fixed rather than taken from Intl: Node and browsers
// disagree on the short form ("เสาร์" vs "ส."), which breaks hydration now that
// cards also render on the client.
const WEEKDAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

export function formatEventDate(isoDate) {
  const weekday = WEEKDAYS[new Date(`${isoDate}T12:00:00Z`).getUTCDay()];
  const rest = new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(new Date(`${isoDate}T00:00:00+07:00`));

  return `${weekday} ${rest}`;
}

// A timestamptz (e.g. profiles.created_at) as a Thai date, with the time when
// withTime is set: "9 ต.ค. 2569" or "9 ต.ค. 2569 14:05".
export function formatTimestamp(iso, { withTime = false } = {}) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Asia/Bangkok",
  }).format(new Date(iso));
}
