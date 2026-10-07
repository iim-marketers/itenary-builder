/**
 * Domain model for the itinerary builder.
 * Everything here is plain, serialisable data — it lives only in the browser session.
 */

export type ID = string;

export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP" | "AED" | "SGD" | "AUD";

export type ChargeMode = "flat" | "percent";

/* ------------------------------------------------------------------ customer */

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  altPhone: string;
  address: string;
  notes: string;
}

/* ---------------------------------------------------------------------- trip */

export interface TripInfo {
  title: string;
  reference: string;
  destination: string;
  origin: string;
  startDate: string; // yyyy-mm-dd
  endDate: string; // yyyy-mm-dd
  adults: number;
  children: number;
  infants: number;
  currency: CurrencyCode;
  overview: string;
  bestTimeToVisit: string;
  languages: string;
  timeZone: string;
  preparedBy: string;
}

/* -------------------------------------------------------------------- flight */

export interface Flight {
  id: ID;
  airline: string;
  flightNumber: string;
  aircraft: string;
  departureAirport: string;
  departureCity: string;
  departureTerminal: string;
  departureDate: string;
  departureTime: string; // HH:mm
  arrivalAirport: string;
  arrivalCity: string;
  arrivalTerminal: string;
  arrivalDate: string;
  arrivalTime: string;
  travelClass: string;
  baggageCabin: string;
  baggageCheckIn: string;
  durationOverride: string;
  notes: string;
  farePerPax: number;
  pax: number;
}

/* ------------------------------------------------------------------- images */

export interface ItineraryImage {
  id: ID;
  /** JPEG data URL — embedded directly into the PDF. */
  dataUrl: string;
  name: string;
  width: number;
  height: number;
  caption: string;
}

/* --------------------------------------------------------------------- hotel */

export interface Hotel {
  id: ID;
  name: string;
  rating: string;
  location: string;
  address: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  nightsOverride: number | null;
  roomType: string;
  rooms: number;
  mealPlan: string;
  amenities: string;
  notes: string;
  ratePerNight: number;
  extraCharges: number;
}

/* ------------------------------------------------------------------ activity */

export interface Activity {
  id: ID;
  name: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  inclusions: string;
  notes: string;
  ticketPerPerson: number;
  pax: number;
  guideCharges: number;
  transportCharges: number;
  images: ItineraryImage[];
}

/* ------------------------------------------------------------------ day plan */

export type DayItemKind =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "transfer"
  | "sightseeing"
  | "checkin"
  | "checkout"
  | "freetime"
  | "flight"
  | "departure"
  | "arrival"
  | "other";

export interface DayItem {
  id: ID;
  kind: DayItemKind;
  time: string; // HH:mm
  endTime: string;
  title: string;
  location: string;
  description: string;
  images: ItineraryImage[];
}

export interface ItineraryDay {
  id: ID;
  date: string;
  title: string;
  summary: string;
  overnightAt: string;
  meals: { breakfast: boolean; lunch: boolean; dinner: boolean };
  items: DayItem[];
}

/* ------------------------------------------------------------------- pricing */

export interface LineItem {
  id: ID;
  label: string;
  amount: number;
}

export interface PricingInput {
  transportation: number;
  transportationNote: string;
  meals: number;
  mealsNote: string;
  guideCharges: number;
  guideChargesNote: string;
  otherExpenses: LineItem[];
  serviceChargeMode: ChargeMode;
  serviceChargeValue: number;
  discountMode: ChargeMode;
  discountValue: number;
  discountLabel: string;
  taxLabel: string;
  taxPercent: number;
  roundOff: boolean;
  showPerPerson: boolean;
  advancePaid: number;
}

/* ---------------------------------------------------------------------- visa */

/**
 * How the destination admits the travellers. `not-applicable` (a domestic
 * trip) switches the visa page off in the document entirely.
 */
export type VisaRequirement =
  | "not-applicable"
  | "visa-free"
  | "on-arrival"
  | "e-visa"
  | "embassy";

export type VisaEntry = "single" | "double" | "multiple";

export type VisaStatus =
  | "awaiting-documents"
  | "documents-received"
  | "submitted"
  | "approved"
  | "rejected"
  | "not-required";

/** One document the guest is asked to provide. */
export interface VisaDocument {
  id: ID;
  label: string;
  mandatory: boolean;
}

/** One traveller's passport and application details. */
export interface VisaApplicant {
  id: ID;
  fullName: string; // exactly as printed on the passport
  nationality: string;
  dateOfBirth: string;
  passportNumber: string;
  passportIssueDate: string;
  passportExpiry: string;
  status: VisaStatus;
  visaNumber: string;
  notes: string;
}

export interface VisaInfo {
  requirement: VisaRequirement;
  country: string;
  visaType: string;
  entries: VisaEntry;
  validity: string;
  maxStay: string;
  processingTime: string;
  applyVia: string;
  /** The date the guests must hand their documents in by. */
  documentsDueBy: string;
  feePerPerson: number;
  serviceFeePerPerson: number;
  pax: number;
  /** Folds the visa fees into the package total on the pricing page. */
  addToPricing: boolean;
  documents: VisaDocument[];
  submissionInstructions: string;
  photoSpecs: string;
  notes: string[];
  applicants: VisaApplicant[];
  /** Lists the applicants (with masked passport numbers) in the document. */
  showApplicants: boolean;
}

/* ----------------------------------------------------------------- insurance */

/**
 * Who arranges the cover. `none` switches the insurance page off in the
 * document entirely.
 */
export type InsuranceMode = "none" | "included" | "optional" | "self-arranged";

/** Drives the standard benefit schedule and whether passports are asked for. */
export type InsuranceScope = "international" | "domestic";

export type InsurancePolicyType = "individual" | "family" | "group";

export type InsuranceStatus =
  | "details-pending"
  | "proposal-submitted"
  | "issued"
  | "own-cover"
  | "opted-out";

/** One line of the schedule of benefits. */
export interface InsuranceBenefit {
  id: ID;
  label: string;
  limit: string; // free text: "USD 50,000", "₹ 1,000 per 6 hours"
  deductible: string;
}

/** One traveller on the policy. */
export interface InsuredTraveller {
  id: ID;
  fullName: string;
  dateOfBirth: string;
  passportNumber: string;
  nominee: string; // "Karthik Iyer (spouse)"
  preExistingConditions: string;
  certificateNumber: string;
  status: InsuranceStatus;
}

export interface InsuranceInfo {
  mode: InsuranceMode;
  scope: InsuranceScope;
  provider: string;
  planName: string;
  policyType: InsurancePolicyType;
  coverageRegion: string;
  /** Free text so it can carry its own currency: "USD 50,000". */
  sumInsured: string;
  /** The master or group policy number, when there is one. */
  policyNumber: string;
  startDate: string;
  endDate: string;
  /** A condition of the visa (Schengen, for one) rather than just advice. */
  requiredForVisa: boolean;
  premiumPerPerson: number;
  pax: number;
  /** Folds the premium into the package total. Only applies to `included`. */
  addToPricing: boolean;
  benefits: InsuranceBenefit[];
  exclusions: string[];
  assistancePhone: string;
  assistanceEmail: string;
  claimSteps: string[];
  notes: string[];
  travellers: InsuredTraveller[];
  /** Lists the insured travellers and their certificate numbers in the document. */
  showTravellers: boolean;
}

/* -------------------------------------------------------------------- extras */

export interface ContentBlocks {
  inclusions: string[];
  exclusions: string[];
  importantNotes: string[];
  termsAndConditions: string[];
  paymentTerms: string;
  cancellationPolicy: string;
  closingNote: string;
}

/* ----------------------------------------------------------------- itinerary */

export interface Itinerary {
  customer: CustomerInfo;
  trip: TripInfo;
  flights: Flight[];
  hotels: Hotel[];
  activities: Activity[];
  days: ItineraryDay[];
  visa: VisaInfo;
  insurance: InsuranceInfo;
  pricing: PricingInput;
  content: ContentBlocks;
  createdAt: string;
}

/* ---------------------------------------------------------------- validation */

export type IssueLevel = "error" | "warning";

export interface ValidationIssue {
  id: string;
  level: IssueLevel;
  section: SectionKey;
  message: string;
}

export type SectionKey =
  | "trip"
  | "flights"
  | "hotels"
  | "activities"
  | "days"
  | "visa"
  | "insurance"
  | "pricing"
  | "content";
