import type { CurrencyCode, DayItemKind } from "./types";

export const CURRENCIES: Record<
  CurrencyCode,
  { symbol: string; label: string; locale: string }
> = {
  INR: { symbol: "₹", label: "Indian Rupee", locale: "en-IN" },
  USD: { symbol: "$", label: "US Dollar", locale: "en-US" },
  EUR: { symbol: "€", label: "Euro", locale: "de-DE" },
  GBP: { symbol: "£", label: "Pound Sterling", locale: "en-GB" },
  AED: { symbol: "AED ", label: "UAE Dirham", locale: "en-AE" },
  SGD: { symbol: "S$", label: "Singapore Dollar", locale: "en-SG" },
  AUD: { symbol: "A$", label: "Australian Dollar", locale: "en-AU" },
};

/** Formats an amount with grouping. Uses the plain symbol so it renders in a PDF too. */
export function formatMoney(amount: number, currency: CurrencyCode): string {
  const meta = CURRENCIES[currency] ?? CURRENCIES.INR;
  const safe = Number.isFinite(amount) ? amount : 0;
  const body = new Intl.NumberFormat(meta.locale, {
    minimumFractionDigits: Number.isInteger(safe) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(safe));
  return `${safe < 0 ? "-" : ""}${meta.symbol}${body}`;
}

export function currencySymbol(currency: CurrencyCode): string {
  return (CURRENCIES[currency] ?? CURRENCIES.INR).symbol;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

/** Parses a `yyyy-mm-dd` string as a *local* date (avoids the UTC shift of `new Date(str)`). */
export function parseDate(value: string): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isValidDate(value: string): boolean {
  return parseDate(value) !== null;
}

export function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test((value ?? "").trim());
}

export type DateStyle = "long" | "medium" | "short" | "dayLong";

export function formatDate(value: string, style: DateStyle = "medium"): string {
  const d = parseDate(value);
  if (!d) return "—";
  const day = d.getDate();
  const month = MONTHS[d.getMonth()];
  const year = d.getFullYear();
  switch (style) {
    case "long":
      return `${day} ${month} ${year}`;
    case "dayLong":
      return `${DAYS[d.getDay()]}, ${day} ${month} ${year}`;
    case "short":
      return `${String(day).padStart(2, "0")} ${month.slice(0, 3)}`;
    default:
      return `${String(day).padStart(2, "0")} ${month.slice(0, 3)} ${year}`;
  }
}

export function weekdayShort(value: string): string {
  const d = parseDate(value);
  return d ? DAYS[d.getDay()].slice(0, 3).toUpperCase() : "";
}

/** 24h `HH:mm` -> `9:30 AM`. Returns an em dash when unset/invalid. */
export function formatTime(value: string): string {
  if (!isValidTime(value)) return "—";
  const [h, m] = value.split(":").map(Number);
  const suffix = h < 12 ? "AM" : "PM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function toMinutes(date: string, time: string): number | null {
  const d = parseDate(date);
  if (!d || !isValidTime(time)) return null;
  const [h, m] = time.split(":").map(Number);
  return Math.floor(d.getTime() / 60000) + h * 60 + m;
}

/** Whole days between two `yyyy-mm-dd` values, or null if either is unparseable. */
export function daysBetween(from: string, to: string): number | null {
  const a = parseDate(from);
  const b = parseDate(to);
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function addDays(value: string, count: number): string {
  const d = parseDate(value);
  if (!d) return "";
  d.setDate(d.getDate() + count);
  return toISODate(d);
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export const DAY_ITEM_KINDS: { value: DayItemKind; label: string; icon: string }[] = [
  { value: "breakfast", label: "Breakfast", icon: "☕" },
  { value: "lunch", label: "Lunch", icon: "🍽" },
  { value: "dinner", label: "Dinner", icon: "🍽" },
  { value: "transfer", label: "Transfer", icon: "🚖" },
  { value: "sightseeing", label: "Sightseeing", icon: "📷" },
  { value: "checkin", label: "Hotel check-in", icon: "🏨" },
  { value: "checkout", label: "Hotel check-out", icon: "🧳" },
  { value: "freetime", label: "Free time", icon: "☀" },
  { value: "flight", label: "Flight", icon: "✈" },
  { value: "arrival", label: "Arrival", icon: "🛬" },
  { value: "departure", label: "Departure", icon: "🛫" },
  { value: "other", label: "Other", icon: "•" },
];

export function dayItemLabel(kind: DayItemKind): string {
  return DAY_ITEM_KINDS.find((k) => k.value === kind)?.label ?? "Other";
}

/** Splits a textarea value into trimmed, non-empty lines. */
export function linesOf(value: string): string[] {
  return (value ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export function pluralise(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

export function initialsOf(name: string): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "TR";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}
