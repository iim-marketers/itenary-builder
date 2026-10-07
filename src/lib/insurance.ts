import { daysBetween, formatDate, parseDate } from "./format";
import type { StatusTone } from "./visa";
import type {
  InsuranceMode,
  InsurancePolicyType,
  InsuranceScope,
  InsuranceStatus,
} from "./types";

/* ------------------------------------------------------------------ modes */

export interface ModeMeta {
  value: InsuranceMode;
  label: string;
  /** One line for the admin, under the option in the builder. */
  hint: string;
}

export const INSURANCE_MODES: ModeMeta[] = [
  {
    value: "none",
    label: "Not covered",
    hint: "No insurance page in the itinerary.",
  },
  {
    value: "included",
    label: "Included",
    hint: "You arrange the policy as part of the package.",
  },
  {
    value: "optional",
    label: "Optional add-on",
    hint: "Offered to the guest at an extra cost.",
  },
  {
    value: "self-arranged",
    label: "Guest arranges",
    hint: "The guest buys cover; you set the minimum.",
  },
];

export function modeLabel(value: InsuranceMode): string {
  return INSURANCE_MODES.find((m) => m.value === value)?.label ?? "Travel insurance";
}

/** Whether the agency sells this policy, so a premium applies. */
export function hasPremium(value: InsuranceMode): boolean {
  return value === "included" || value === "optional";
}

/** The guest-facing explanation printed at the top of the insurance page. */
export function modeBlurb(value: InsuranceMode, requiredForVisa: boolean): string {
  const visa = requiredForVisa
    ? " Valid travel insurance is also a condition of your visa, so the policy must be in place before the application is filed."
    : "";
  switch (value) {
    case "included":
      return `Your package includes travel insurance for the whole trip. We will issue the policy before departure and share the schedule with each traveller.${visa}`;
    case "optional":
      return `We strongly recommend travel insurance for this trip. It is not part of the package price — let us know and we will arrange the policy below for you.${visa}`;
    case "self-arranged":
      return `Please arrange your own travel insurance for the full trip, with at least the cover listed below, and send us a copy of the policy before departure.${visa}`;
    default:
      return "";
  }
}

export const POLICY_TYPES: { value: InsurancePolicyType; label: string }[] = [
  { value: "individual", label: "Individual policies" },
  { value: "family", label: "Family floater" },
  { value: "group", label: "Group policy" },
];

export const SCOPES: { value: InsuranceScope; label: string }[] = [
  { value: "international", label: "International" },
  { value: "domestic", label: "Domestic" },
];

/** Quick picks for the coverage region — the admin can still type anything. */
export const REGION_PRESETS: Record<InsuranceScope, string[]> = {
  international: [
    "Worldwide",
    "Worldwide excluding USA & Canada",
    "Asia (excluding Japan)",
    "Schengen & Europe",
  ],
  domestic: ["Within India"],
};

/* ---------------------------------------------------------------- status */

export const INSURANCE_STATUSES: {
  value: InsuranceStatus;
  label: string;
  tone: StatusTone;
}[] = [
  { value: "details-pending", label: "Details pending", tone: "neutral" },
  { value: "proposal-submitted", label: "Proposal submitted", tone: "progress" },
  { value: "issued", label: "Policy issued", tone: "success" },
  { value: "own-cover", label: "Own cover", tone: "info" },
  { value: "opted-out", label: "Opted out", tone: "danger" },
];

export function insuranceStatusMeta(value: InsuranceStatus) {
  return INSURANCE_STATUSES.find((s) => s.value === value) ?? INSURANCE_STATUSES[0];
}

/** A traveller counts as covered once a policy exists, ours or theirs. */
export function isCovered(value: InsuranceStatus): boolean {
  return value === "issued" || value === "own-cover";
}

/* ------------------------------------------------------- standard wording */

type BenefitSpec = { label: string; limit: string; deductible: string };

/**
 * A typical schedule for each scope — a starting point only. Limits vary by
 * insurer and plan, so the admin is reminded to check them against the policy.
 */
export const STANDARD_BENEFITS: Record<InsuranceScope, BenefitSpec[]> = {
  international: [
    {
      label: "Emergency medical expenses — illness and accident",
      limit: "USD 50,000",
      deductible: "USD 100",
    },
    { label: "Emergency medical evacuation", limit: "Within the medical limit", deductible: "" },
    { label: "Repatriation of mortal remains", limit: "USD 5,000", deductible: "" },
    { label: "Hospital daily cash", limit: "USD 50 a day, up to 5 days", deductible: "" },
    {
      label: "Personal accident — accidental death and permanent disablement",
      limit: "USD 10,000",
      deductible: "",
    },
    { label: "Trip cancellation", limit: "USD 1,000", deductible: "" },
    { label: "Trip interruption and curtailment", limit: "USD 1,000", deductible: "" },
    { label: "Flight delay over 6 hours", limit: "USD 50 per 6 hours, up to USD 300", deductible: "" },
    { label: "Missed connection", limit: "USD 300", deductible: "" },
    { label: "Loss of checked-in baggage", limit: "USD 500", deductible: "" },
    { label: "Delay of checked-in baggage over 12 hours", limit: "USD 100", deductible: "" },
    { label: "Loss of passport", limit: "USD 250", deductible: "USD 25" },
    { label: "Personal liability", limit: "USD 100,000", deductible: "USD 100" },
  ],
  domestic: [
    { label: "Hospitalisation — accident and illness", limit: "₹ 1,00,000", deductible: "₹ 1,000" },
    { label: "Emergency medical evacuation", limit: "₹ 50,000", deductible: "" },
    {
      label: "Personal accident — accidental death and permanent disablement",
      limit: "₹ 5,00,000",
      deductible: "",
    },
    { label: "Trip cancellation and curtailment", limit: "₹ 25,000", deductible: "" },
    { label: "Flight delay over 4 hours", limit: "₹ 1,000 per 4 hours, up to ₹ 5,000", deductible: "" },
    { label: "Loss of checked-in baggage", limit: "₹ 10,000", deductible: "" },
    { label: "Loss of personal documents", limit: "₹ 5,000", deductible: "" },
  ],
};

export const DEFAULT_EXCLUSIONS: string[] = [
  "Pre-existing medical conditions, unless declared on the proposal and accepted by the insurer",
  "Adventure sports such as scuba diving, paragliding or bungee jumping, unless an adventure add-on is bought",
  "Treatment that is not an emergency, or travel undertaken to obtain medical treatment",
  "Claims arising under the influence of alcohol or drugs",
  "Self-inflicted injury, war, and nuclear or radioactive risks",
  "Baggage, cash or valuables left unattended, and losses not reported to the police or airline",
];

export const DEFAULT_CLAIM_STEPS: string[] = [
  "In a medical emergency, call the 24×7 assistance line before admission, or as soon as you can — they arrange cashless treatment wherever possible.",
  "Report lost or stolen baggage, passports or valuables to the airline or police within 24 hours and keep a copy of the report.",
  "Keep every original bill, prescription, medical report, boarding pass and receipt.",
  "Tell us within 7 days of returning home. We will help you fill in the claim form and send it to the insurer.",
];

export const DEFAULT_INSURANCE_NOTES: string[] = [
  "This page is a summary. The policy wording issued by the insurer is the final word on what is and is not covered.",
  "Declare every pre-existing medical condition on the proposal — an undeclared condition can void a claim.",
  "A policy cannot be bought once the trip has begun, so please confirm your cover before departure.",
  "Carry a printed copy of the policy schedule and save the assistance number on your phone.",
];

/* ---------------------------------------------------------------- checks */

export interface PeriodCheck {
  level: "ok" | "warning" | "error" | "unknown";
  message: string;
}

/** Insurers count both the first and the last day. */
export function policyDays(start: string, end: string): number | null {
  const span = daysBetween(start, end);
  return span === null || span < 0 ? null : span + 1;
}

/** Whether the policy period covers every day of the trip. */
export function checkPeriod(
  start: string,
  end: string,
  tripStart: string,
  tripEnd: string
): PeriodCheck {
  if (!parseDate(start) || !parseDate(end)) {
    return { level: "unknown", message: "Set the policy start and end dates." };
  }
  const span = daysBetween(start, end) ?? 0;
  if (span < 0) return { level: "error", message: "The policy ends before it starts." };

  const days = span + 1;
  const length = `${days} day${days === 1 ? "" : "s"} of cover`;
  if (!parseDate(tripStart) || !parseDate(tripEnd)) {
    return { level: "ok", message: `${length}. Set the trip dates to check it covers the trip.` };
  }
  const lateStart = daysBetween(tripStart, start) ?? 0;
  const earlyEnd = daysBetween(end, tripEnd) ?? 0;
  if (lateStart > 0 && earlyEnd > 0) {
    return { level: "error", message: "The policy misses both the first and last days of the trip." };
  }
  if (lateStart > 0) {
    return { level: "error", message: `Cover starts ${lateStart} day${lateStart === 1 ? "" : "s"} after departure.` };
  }
  if (earlyEnd > 0) {
    return { level: "error", message: `Cover ends ${earlyEnd} day${earlyEnd === 1 ? "" : "s"} before the trip does.` };
  }
  return { level: "ok", message: `${length} — the whole trip is covered.` };
}

/** Age in whole years on `on`, or null when either date is missing. */
export function ageOn(dateOfBirth: string, on: string): number | null {
  const dob = parseDate(dateOfBirth);
  const ref = parseDate(on);
  if (!dob || !ref) return null;
  let age = ref.getFullYear() - dob.getFullYear();
  const beforeBirthday =
    ref.getMonth() < dob.getMonth() ||
    (ref.getMonth() === dob.getMonth() && ref.getDate() < dob.getDate());
  if (beforeBirthday) age -= 1;
  return age < 0 ? null : age;
}

/** Most insurers load the premium from 61 and cap or refuse cover past 70. */
export const SENIOR_AGE = 61;

export function ageNote(age: number | null): { level: "ok" | "warning"; message: string } | null {
  if (age === null) return null;
  if (age > 70) {
    return {
      level: "warning",
      message: `${age} at departure — many plans cap cover or need a medical check past 70.`,
    };
  }
  if (age >= SENIOR_AGE) {
    return { level: "warning", message: `${age} at departure — a senior premium loading may apply.` };
  }
  return { level: "ok", message: `${age} at departure.` };
}

/** "12 Oct 2026 – 18 Oct 2026 · 7 days", or "" when the dates are incomplete. */
export function periodLabel(start: string, end: string): string {
  const days = policyDays(start, end);
  if (days === null) return "";
  return `${formatDate(start, "medium")} – ${formatDate(end, "medium")} · ${days} day${days === 1 ? "" : "s"}`;
}
