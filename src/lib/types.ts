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
  | "pricing"
  | "content";
