import { toISODate } from "./format";
import {
  DEFAULT_PHOTO_SPECS,
  DEFAULT_SUBMISSION,
  DEFAULT_VISA_NOTES,
  STANDARD_DOCUMENTS,
} from "./visa";
import {
  DEFAULT_CLAIM_STEPS,
  DEFAULT_EXCLUSIONS,
  DEFAULT_INSURANCE_NOTES,
  STANDARD_BENEFITS,
} from "./insurance";
import type {
  Activity,
  ContentBlocks,
  DayItem,
  Flight,
  Hotel,
  Itinerary,
  ItineraryDay,
  InsuranceBenefit,
  InsuranceInfo,
  InsuranceScope,
  InsuredTraveller,
  ItineraryImage,
  LineItem,
  VisaApplicant,
  VisaDocument,
  VisaInfo,
  VisaRequirement,
} from "./types";

export function uid(prefix = "id"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function makeFlight(partial: Partial<Flight> = {}): Flight {
  return {
    airline: "",
    flightNumber: "",
    aircraft: "",
    departureAirport: "",
    departureCity: "",
    departureTerminal: "",
    departureDate: "",
    departureTime: "",
    arrivalAirport: "",
    arrivalCity: "",
    arrivalTerminal: "",
    arrivalDate: "",
    arrivalTime: "",
    travelClass: "Economy",
    baggageCabin: "7 kg",
    baggageCheckIn: "20 kg",
    durationOverride: "",
    notes: "",
    farePerPax: 0,
    pax: 1,
    ...partial,
    id: partial.id || uid("flt"),
  };
}

export function makeHotel(partial: Partial<Hotel> = {}): Hotel {
  return {
    name: "",
    rating: "4",
    location: "",
    address: "",
    checkInDate: "",
    checkInTime: "14:00",
    checkOutDate: "",
    checkOutTime: "11:00",
    nightsOverride: null,
    roomType: "Deluxe Room",
    rooms: 1,
    mealPlan: "Breakfast included",
    amenities: "",
    notes: "",
    ratePerNight: 0,
    extraCharges: 0,
    ...partial,
    id: partial.id || uid("htl"),
  };
}

export function makeActivity(partial: Partial<Activity> = {}): Activity {
  return {
    name: "",
    location: "",
    date: "",
    startTime: "",
    endTime: "",
    description: "",
    inclusions: "",
    notes: "",
    ticketPerPerson: 0,
    pax: 1,
    guideCharges: 0,
    transportCharges: 0,
    images: [],
    ...partial,
    id: partial.id || uid("act"),
  };
}

export function makeDayItem(partial: Partial<DayItem> = {}): DayItem {
  return {
    kind: "sightseeing",
    time: "",
    endTime: "",
    title: "",
    location: "",
    description: "",
    images: [],
    ...partial,
    id: partial.id || uid("itm"),
  };
}

export function makeDay(partial: Partial<ItineraryDay> = {}): ItineraryDay {
  return {
    date: "",
    title: "",
    summary: "",
    overnightAt: "",
    meals: { breakfast: false, lunch: false, dinner: false },
    items: [],
    ...partial,
    id: partial.id || uid("day"),
  };
}

export function makeLineItem(partial: Partial<LineItem> = {}): LineItem {
  return { label: "", amount: 0, ...partial, id: partial.id || uid("ln") };
}

export function makeVisaDocument(partial: Partial<VisaDocument> = {}): VisaDocument {
  return { label: "", mandatory: true, ...partial, id: partial.id || uid("vdoc") };
}

export function makeApplicant(partial: Partial<VisaApplicant> = {}): VisaApplicant {
  return {
    fullName: "",
    nationality: "",
    dateOfBirth: "",
    passportNumber: "",
    passportIssueDate: "",
    passportExpiry: "",
    status: "awaiting-documents",
    visaNumber: "",
    notes: "",
    ...partial,
    id: partial.id || uid("app"),
  };
}

/** The standard document checklist for a kind of visa, as fresh entities. */
export function standardVisaDocuments(requirement: VisaRequirement): VisaDocument[] {
  if (requirement === "not-applicable") return [];
  return STANDARD_DOCUMENTS[requirement].map((d) => makeVisaDocument(d));
}

export function makeVisa(partial: Partial<VisaInfo> = {}): VisaInfo {
  return {
    requirement: "not-applicable",
    country: "",
    visaType: "Tourist visa",
    entries: "single",
    validity: "",
    maxStay: "",
    processingTime: "",
    applyVia: "",
    documentsDueBy: "",
    feePerPerson: 0,
    serviceFeePerPerson: 0,
    pax: 2,
    addToPricing: true,
    documents: [],
    submissionInstructions: DEFAULT_SUBMISSION,
    photoSpecs: DEFAULT_PHOTO_SPECS,
    notes: [...DEFAULT_VISA_NOTES],
    applicants: [],
    showApplicants: true,
    ...partial,
  };
}

export function makeBenefit(partial: Partial<InsuranceBenefit> = {}): InsuranceBenefit {
  return { label: "", limit: "", deductible: "", ...partial, id: partial.id || uid("ben") };
}

export function makeInsured(partial: Partial<InsuredTraveller> = {}): InsuredTraveller {
  return {
    fullName: "",
    dateOfBirth: "",
    passportNumber: "",
    nominee: "",
    preExistingConditions: "",
    certificateNumber: "",
    status: "details-pending",
    ...partial,
    id: partial.id || uid("ins"),
  };
}

/** The standard schedule of benefits for a scope, as fresh entities. */
export function standardBenefits(scope: InsuranceScope): InsuranceBenefit[] {
  return STANDARD_BENEFITS[scope].map((b) => makeBenefit(b));
}

export function makeInsurance(partial: Partial<InsuranceInfo> = {}): InsuranceInfo {
  return {
    mode: "none",
    scope: "international",
    provider: "",
    planName: "",
    policyType: "individual",
    coverageRegion: "",
    sumInsured: "",
    policyNumber: "",
    startDate: "",
    endDate: "",
    requiredForVisa: false,
    premiumPerPerson: 0,
    pax: 2,
    addToPricing: true,
    benefits: [],
    exclusions: [...DEFAULT_EXCLUSIONS],
    assistancePhone: "",
    assistanceEmail: "",
    claimSteps: [...DEFAULT_CLAIM_STEPS],
    notes: [...DEFAULT_INSURANCE_NOTES],
    travellers: [],
    showTravellers: true,
    ...partial,
  };
}

const asStrings = (value: unknown, fallback: string[]): string[] =>
  Array.isArray(value)
    ? value.filter((n): n is string => typeof n === "string")
    : [...fallback];

export const DEFAULT_CONTENT: ContentBlocks = {
  inclusions: [
    "Accommodation as per the itinerary on the mentioned meal plan",
    "All transfers and sightseeing by a private air-conditioned vehicle",
    "Entrance fees for the monuments and attractions listed",
    "All applicable toll, parking and driver charges",
    "24×7 on-trip assistance from our travel desk",
  ],
  exclusions: [
    "Airfare and visa fees unless explicitly mentioned as included",
    "Travel insurance, personal expenses, tips and gratuities",
    "Anything not specifically listed under the inclusions",
    "Cost escalation due to flight delays, roadblocks or force majeure",
    "Early check-in or late check-out charges at the hotels",
  ],
  importantNotes: [
    "Standard hotel check-in is at 14:00 hrs and check-out at 11:00 hrs.",
    "All rates are subject to availability at the time of confirmation.",
    "Please carry a valid government photo ID for every traveller.",
    "The sequence of sightseeing may change due to weather or local conditions.",
  ],
  termsAndConditions: [
    "This quotation is valid for 7 days from the date of issue.",
    "Confirmation is subject to receipt of the advance payment and availability.",
    "Rates may revise if there is a change in taxes or government levies.",
    "Refunds, where applicable, are processed within 15 working days.",
  ],
  paymentTerms:
    "50% advance at the time of booking. The balance is payable 15 days before departure.",
  cancellationPolicy:
    "30+ days before departure: 10% of the tour cost. 15–29 days: 30%. 7–14 days: 50%. Under 7 days: no refund.",
  closingNote:
    "We look forward to hosting you. Should you wish to adjust anything in this plan, simply let us know and we will rework it.",
};

export function makeItinerary(): Itinerary {
  const today = toISODate(new Date());
  return {
    customer: {
      name: "",
      email: "",
      phone: "",
      altPhone: "",
      address: "",
      notes: "",
    },
    trip: {
      title: "",
      reference: `TRP-${today.replace(/-/g, "").slice(2)}-${Math.floor(
        Math.random() * 900 + 100
      )}`,
      destination: "",
      origin: "",
      startDate: "",
      endDate: "",
      adults: 2,
      children: 0,
      infants: 0,
      currency: "INR",
      overview: "",
      bestTimeToVisit: "",
      languages: "",
      timeZone: "",
      preparedBy: "",
    },
    flights: [],
    hotels: [],
    activities: [],
    days: [],
    visa: makeVisa(),
    insurance: makeInsurance(),
    pricing: {
      transportation: 0,
      transportationNote: "",
      meals: 0,
      mealsNote: "",
      guideCharges: 0,
      guideChargesNote: "",
      otherExpenses: [],
      serviceChargeMode: "percent",
      serviceChargeValue: 0,
      discountMode: "flat",
      discountValue: 0,
      discountLabel: "Discount",
      taxLabel: "GST",
      taxPercent: 5,
      roundOff: true,
      showPerPerson: true,
      advancePaid: 0,
    },
    content: {
      inclusions: [...DEFAULT_CONTENT.inclusions],
      exclusions: [...DEFAULT_CONTENT.exclusions],
      importantNotes: [...DEFAULT_CONTENT.importantNotes],
      termsAndConditions: [...DEFAULT_CONTENT.termsAndConditions],
      paymentTerms: DEFAULT_CONTENT.paymentTerms,
      cancellationPolicy: DEFAULT_CONTENT.cancellationPolicy,
      closingNote: DEFAULT_CONTENT.closingNote,
    },
    createdAt: new Date().toISOString(),
  };
}

/* --------------------------------------------------------------- migration */

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asImages(value: unknown): ItineraryImage[] {
  return asArray<Partial<ItineraryImage>>(value)
    .filter((img) => typeof img?.dataUrl === "string" && img.dataUrl.length > 0)
    .map((img) => ({
      id: img.id || uid("img"),
      dataUrl: img.dataUrl as string,
      name: img.name ?? "",
      width: Number(img.width) || 0,
      height: Number(img.height) || 0,
      caption: img.caption ?? "",
    }));
}

/**
 * Rebuilds a persisted draft into the current shape.
 *
 * A stored itinerary can predate the fields the app now reads — a draft saved
 * before photos existed has activities with no `images` array, which used to
 * crash the form on restore. Running every entity back through its factory
 * fills in whatever is missing, so the same code also absorbs the next field
 * that gets added. Unknown keys from older versions are dropped rather than
 * carried forward.
 */
export function normalizeItinerary(raw: unknown): Itinerary {
  const base = makeItinerary();
  if (!raw || typeof raw !== "object") return base;
  const draft = raw as Partial<Itinerary>;
  if (!draft.trip) return base;

  return {
    customer: { ...base.customer, ...draft.customer },
    trip: { ...base.trip, ...draft.trip },
    flights: asArray<Partial<Flight>>(draft.flights).map((f) => makeFlight(f)),
    hotels: asArray<Partial<Hotel>>(draft.hotels).map((h) => makeHotel(h)),
    activities: asArray<Partial<Activity>>(draft.activities).map((a) =>
      makeActivity({ ...a, images: asImages(a.images) })
    ),
    days: asArray<Partial<ItineraryDay>>(draft.days).map((d) =>
      makeDay({
        ...d,
        meals: { ...makeDay().meals, ...d.meals },
        items: asArray<Partial<DayItem>>(d.items).map((i) =>
          makeDayItem({ ...i, images: asImages(i.images) })
        ),
      })
    ),
    visa: makeVisa({
      ...draft.visa,
      documents: asArray<Partial<VisaDocument>>(draft.visa?.documents).map((d) =>
        makeVisaDocument(d)
      ),
      applicants: asArray<Partial<VisaApplicant>>(draft.visa?.applicants).map((a) =>
        makeApplicant(a)
      ),
      notes: draft.visa?.notes
        ? asArray<unknown>(draft.visa.notes).filter((n): n is string => typeof n === "string")
        : [...DEFAULT_VISA_NOTES],
    }),
    insurance: makeInsurance({
      ...draft.insurance,
      benefits: asArray<Partial<InsuranceBenefit>>(draft.insurance?.benefits).map((b) =>
        makeBenefit(b)
      ),
      travellers: asArray<Partial<InsuredTraveller>>(draft.insurance?.travellers).map((t) =>
        makeInsured(t)
      ),
      exclusions: asStrings(draft.insurance?.exclusions, DEFAULT_EXCLUSIONS),
      claimSteps: asStrings(draft.insurance?.claimSteps, DEFAULT_CLAIM_STEPS),
      notes: asStrings(draft.insurance?.notes, DEFAULT_INSURANCE_NOTES),
    }),
    pricing: {
      ...base.pricing,
      ...draft.pricing,
      otherExpenses: asArray<Partial<LineItem>>(draft.pricing?.otherExpenses).map(
        (l) => makeLineItem(l)
      ),
    },
    content: { ...base.content, ...draft.content },
    createdAt:
      typeof draft.createdAt === "string" ? draft.createdAt : base.createdAt,
  };
}
