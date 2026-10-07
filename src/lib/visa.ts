import { addDays, daysBetween, formatDate, parseDate, toISODate } from "./format";
import type { VisaEntry, VisaRequirement, VisaStatus } from "./types";

/* ----------------------------------------------------------- requirements */

export interface RequirementMeta {
  value: VisaRequirement;
  label: string;
  /** One line for the admin, under the option in the builder. */
  hint: string;
}

export const VISA_REQUIREMENTS: RequirementMeta[] = [
  {
    value: "not-applicable",
    label: "Not applicable",
    hint: "Domestic trip — no visa page in the itinerary.",
  },
  {
    value: "visa-free",
    label: "Visa-free",
    hint: "Entry on passport alone. Lists the documents to carry.",
  },
  {
    value: "on-arrival",
    label: "Visa on arrival",
    hint: "Issued at the port of entry.",
  },
  {
    value: "e-visa",
    label: "e-Visa",
    hint: "Applied for online before departure.",
  },
  {
    value: "embassy",
    label: "Embassy visa",
    hint: "Stamped by the embassy, consulate or VFS.",
  },
];

export function requirementLabel(value: VisaRequirement): string {
  return VISA_REQUIREMENTS.find((r) => r.value === value)?.label ?? "Visa";
}

/** Whether a visa has to be obtained at all (before or on arrival). */
export function needsVisa(value: VisaRequirement): boolean {
  return value === "on-arrival" || value === "e-visa" || value === "embassy";
}

/** The guest-facing explanation printed at the top of the visa page. */
export function requirementBlurb(value: VisaRequirement, country: string): string {
  const where = country.trim() || "your destination";
  switch (value) {
    case "visa-free":
      return `No visa is needed to enter ${where} on your passport. Immigration may still ask to see the documents below, so please keep them handy.`;
    case "on-arrival":
      return `${where} grants visas on arrival. Keep the documents below ready — immigration may ask to see them when you land.`;
    case "e-visa":
      return `${where} requires an electronic visa that must be approved before you fly. Send us the documents below and we will file the application on your behalf.`;
    case "embassy":
      return `A visa for ${where} must be issued by the embassy or consulate before travel. Send us the documents below so we can prepare and file your application.`;
    default:
      return "";
  }
}

export const VISA_ENTRIES: { value: VisaEntry; label: string }[] = [
  { value: "single", label: "Single entry" },
  { value: "double", label: "Double entry" },
  { value: "multiple", label: "Multiple entry" },
];

/* ---------------------------------------------------------------- status */

export type StatusTone = "neutral" | "info" | "progress" | "success" | "danger";

export const VISA_STATUSES: { value: VisaStatus; label: string; tone: StatusTone }[] = [
  { value: "awaiting-documents", label: "Awaiting documents", tone: "neutral" },
  { value: "documents-received", label: "Documents received", tone: "info" },
  { value: "submitted", label: "Submitted", tone: "progress" },
  { value: "approved", label: "Approved", tone: "success" },
  { value: "rejected", label: "Rejected", tone: "danger" },
  { value: "not-required", label: "Not required", tone: "neutral" },
];

export function statusMeta(value: VisaStatus) {
  return VISA_STATUSES.find((s) => s.value === value) ?? VISA_STATUSES[0];
}

/* ------------------------------------------------------- standard wording */

type DocSpec = { label: string; mandatory: boolean };

const PASSPORT: DocSpec = {
  label: "Original passport valid for at least 6 months beyond the return date, with 2 blank pages",
  mandatory: true,
};
const TICKETS: DocSpec = { label: "Confirmed return flight tickets", mandatory: true };
const HOTELS: DocSpec = {
  label: "Hotel booking confirmations for the entire stay",
  mandatory: true,
};

/** The usual checklist for each kind of visa — a starting point to edit. */
export const STANDARD_DOCUMENTS: Record<
  Exclude<VisaRequirement, "not-applicable">,
  DocSpec[]
> = {
  "visa-free": [
    PASSPORT,
    TICKETS,
    HOTELS,
    { label: "Proof of sufficient funds (recent bank statement or credit card)", mandatory: false },
    { label: "Travel insurance covering the full trip", mandatory: false },
  ],
  "on-arrival": [
    PASSPORT,
    { label: "Two recent passport-size colour photographs, white background", mandatory: true },
    TICKETS,
    HOTELS,
    { label: "Visa fee in cash (USD or local currency) for the immigration counter", mandatory: true },
    { label: "Proof of sufficient funds (recent bank statement or credit card)", mandatory: false },
    { label: "Travel insurance covering the full trip", mandatory: false },
  ],
  "e-visa": [
    { label: "Clear colour scan of the passport front and back pages", mandatory: true },
    { label: "Recent digital photograph (JPEG, white background, no glasses)", mandatory: true },
    TICKETS,
    HOTELS,
    { label: "Bank statement for the last 3 months", mandatory: false },
    { label: "Travel insurance covering the full trip", mandatory: false },
  ],
  embassy: [
    PASSPORT,
    { label: "Visa application form, filled and signed by the applicant", mandatory: true },
    { label: "Two recent passport-size colour photographs as per embassy specifications", mandatory: true },
    { label: "Bank statements for the last 6 months, stamped by the bank", mandatory: true },
    { label: "Income tax returns for the last 3 years", mandatory: true },
    { label: "Covering letter stating the purpose and dates of travel", mandatory: true },
    { label: "Leave letter / NOC from employer, or business registration if self-employed", mandatory: true },
    TICKETS,
    HOTELS,
    { label: "Travel insurance covering the full trip", mandatory: true },
    { label: "All old passports, if any", mandatory: false },
    { label: "Birth certificate and parents' consent letter for minors", mandatory: false },
  ],
};

export const DEFAULT_VISA_NOTES: string[] = [
  "The grant of a visa is at the sole discretion of the embassy or immigration authority. We cannot influence the decision or the processing time.",
  "Visa fees are non-refundable once the application has been filed, whatever the outcome.",
  "Names on the flight tickets must match the passport exactly — please check the spelling.",
  "Carry printed copies of the visa approval, tickets and hotel bookings on the day of travel.",
];

export const DEFAULT_SUBMISSION =
  "Email clear scans of every document to our travel desk, or share them on WhatsApp. Original passports, where needed, can be couriered to our office.";

export const DEFAULT_PHOTO_SPECS =
  "35 × 45 mm, white background, matte finish, taken within the last 3 months. Face centred, no glasses or headwear.";

/* -------------------------------------------------------------- passports */

/** `A1234567` → `•••• 4567`, so the document never prints a full passport number. */
export function maskPassport(value: string): string {
  const clean = value.replace(/\s+/g, "");
  if (!clean) return "—";
  if (clean.length <= 4) return clean;
  return `•••• ${clean.slice(-4)}`;
}

function addMonths(value: string, months: number): string {
  const d = parseDate(value);
  if (!d) return "";
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  // Clamp 31 Aug + 6 months to 28/29 Feb rather than rolling into March.
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return toISODate(d);
}

export interface PassportCheck {
  level: "ok" | "warning" | "error" | "unknown";
  message: string;
}

/**
 * Most countries refuse entry on a passport that expires within six months of
 * the return date, so that is the rule checked here.
 */
export function checkPassport(expiry: string, tripEnd: string): PassportCheck {
  if (!parseDate(expiry)) return { level: "unknown", message: "Add the expiry date to check validity." };
  const reference = parseDate(tripEnd) ? tripEnd : toISODate(new Date());
  const anchor = parseDate(tripEnd) ? "the return date" : "today";

  if ((daysBetween(reference, expiry) ?? 0) < 0) {
    return { level: "error", message: `Expires before ${anchor} — the passport must be renewed.` };
  }
  const sixMonths = addMonths(reference, 6);
  if ((daysBetween(sixMonths, expiry) ?? 0) < 0) {
    return {
      level: "warning",
      message: `Valid for under 6 months after ${anchor}. Most countries will refuse entry — renewal advised.`,
    };
  }
  return { level: "ok", message: `Valid until ${formatDate(expiry, "medium")}.` };
}

/** Days from today until the document deadline (negative once it has passed). */
export function daysUntil(value: string): number | null {
  return daysBetween(toISODate(new Date()), value);
}

/** A sensible deadline: the processing time is unknown, so allow three weeks. */
export function suggestedDeadline(tripStart: string): string {
  return parseDate(tripStart) ? addDays(tripStart, -21) : "";
}
