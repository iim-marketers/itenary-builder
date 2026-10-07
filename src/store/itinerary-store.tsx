"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  makeActivity,
  makeApplicant,
  makeBenefit,
  makeDay,
  makeDayItem,
  makeFlight,
  makeHotel,
  makeInsured,
  makeItinerary,
  makeLineItem,
  makeVisaDocument,
  normalizeItinerary,
} from "@/lib/defaults";
import type {
  Activity,
  ContentBlocks,
  CustomerInfo,
  DayItem,
  Flight,
  Hotel,
  ID,
  InsuranceBenefit,
  InsuranceInfo,
  InsuredTraveller,
  Itinerary,
  ItineraryDay,
  LineItem,
  PricingInput,
  TripInfo,
  VisaApplicant,
  VisaDocument,
  VisaInfo,
} from "@/lib/types";

const STORAGE_KEY = "itinerary-builder:draft";

/* --------------------------------------------------------------- actions */

type Action =
  | { type: "reset" }
  | { type: "load"; itinerary: Itinerary }
  | { type: "customer/patch"; patch: Partial<CustomerInfo> }
  | { type: "trip/patch"; patch: Partial<TripInfo> }
  | { type: "pricing/patch"; patch: Partial<PricingInput> }
  | { type: "content/patch"; patch: Partial<ContentBlocks> }
  | { type: "flight/add"; flight?: Partial<Flight> }
  | { type: "flight/patch"; id: ID; patch: Partial<Flight> }
  | { type: "flight/remove"; id: ID }
  | { type: "flight/duplicate"; id: ID }
  | { type: "flight/move"; id: ID; delta: number }
  | { type: "hotel/add"; hotel?: Partial<Hotel> }
  | { type: "hotel/patch"; id: ID; patch: Partial<Hotel> }
  | { type: "hotel/remove"; id: ID }
  | { type: "hotel/duplicate"; id: ID }
  | { type: "hotel/move"; id: ID; delta: number }
  | { type: "activity/add"; activity?: Partial<Activity> }
  | { type: "activity/patch"; id: ID; patch: Partial<Activity> }
  | { type: "activity/remove"; id: ID }
  | { type: "activity/duplicate"; id: ID }
  | { type: "activity/move"; id: ID; delta: number }
  | { type: "day/add"; day?: Partial<ItineraryDay> }
  | { type: "day/patch"; id: ID; patch: Partial<ItineraryDay> }
  | { type: "day/remove"; id: ID }
  | { type: "day/duplicate"; id: ID }
  | { type: "day/move"; id: ID; delta: number }
  | { type: "day/sort" }
  | { type: "day/generate" }
  | { type: "dayItem/add"; dayId: ID; item?: Partial<DayItem> }
  | { type: "dayItem/patch"; dayId: ID; id: ID; patch: Partial<DayItem> }
  | { type: "dayItem/remove"; dayId: ID; id: ID }
  | { type: "dayItem/duplicate"; dayId: ID; id: ID }
  | { type: "dayItem/move"; dayId: ID; id: ID; delta: number }
  | { type: "dayItem/sort"; dayId: ID }
  | { type: "visa/patch"; patch: Partial<VisaInfo> }
  | { type: "visaDoc/add"; doc?: Partial<VisaDocument> }
  | { type: "visaDoc/patch"; id: ID; patch: Partial<VisaDocument> }
  | { type: "visaDoc/remove"; id: ID }
  | { type: "visaDoc/move"; id: ID; delta: number }
  | { type: "applicant/add"; applicants?: Partial<VisaApplicant>[] }
  | { type: "applicant/patch"; id: ID; patch: Partial<VisaApplicant> }
  | { type: "applicant/remove"; id: ID }
  | { type: "applicant/duplicate"; id: ID }
  | { type: "applicant/move"; id: ID; delta: number }
  | { type: "insurance/patch"; patch: Partial<InsuranceInfo> }
  | { type: "benefit/add"; benefit?: Partial<InsuranceBenefit> }
  | { type: "benefit/patch"; id: ID; patch: Partial<InsuranceBenefit> }
  | { type: "benefit/remove"; id: ID }
  | { type: "benefit/move"; id: ID; delta: number }
  | { type: "insured/add"; travellers?: Partial<InsuredTraveller>[] }
  | { type: "insured/patch"; id: ID; patch: Partial<InsuredTraveller> }
  | { type: "insured/remove"; id: ID }
  | { type: "insured/duplicate"; id: ID }
  | { type: "insured/move"; id: ID; delta: number }
  | { type: "expense/add" }
  | { type: "expense/patch"; id: ID; patch: Partial<LineItem> }
  | { type: "expense/remove"; id: ID };

/* ------------------------------------------------------------- utilities */

function patchById<T extends { id: ID }>(list: T[], id: ID, patch: Partial<T>): T[] {
  return list.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

function moveById<T extends { id: ID }>(list: T[], id: ID, delta: number): T[] {
  const index = list.findIndex((item) => item.id === id);
  if (index < 0) return list;
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  const [moved] = next.splice(index, 1);
  next.splice(target, 0, moved);
  return next;
}

function duplicateById<T extends { id: ID }>(
  list: T[],
  id: ID,
  clone: (item: T) => T
): T[] {
  const index = list.findIndex((item) => item.id === id);
  if (index < 0) return list;
  const next = [...list];
  next.splice(index + 1, 0, clone(list[index]));
  return next;
}

/** Sorts by an `HH:mm` field, keeping blank times at the end. */
function byTime<T extends { time: string }>(a: T, b: T): number {
  if (!a.time) return 1;
  if (!b.time) return -1;
  return a.time.localeCompare(b.time);
}

/* -------------------------------------------------------------- reducer */

function reducer(state: Itinerary, action: Action): Itinerary {
  switch (action.type) {
    case "reset":
      return makeItinerary();
    case "load":
      return action.itinerary;

    case "customer/patch":
      return { ...state, customer: { ...state.customer, ...action.patch } };
    case "trip/patch":
      return { ...state, trip: { ...state.trip, ...action.patch } };
    case "pricing/patch":
      return { ...state, pricing: { ...state.pricing, ...action.patch } };
    case "content/patch":
      return { ...state, content: { ...state.content, ...action.patch } };

    /* ------------------------------------------------------------ flights */
    case "flight/add":
      return {
        ...state,
        flights: [
          ...state.flights,
          makeFlight({
            departureDate: state.trip.startDate,
            arrivalDate: state.trip.startDate,
            departureCity: state.trip.origin,
            arrivalCity: state.trip.destination,
            pax: Math.max(1, state.trip.adults + state.trip.children),
            ...action.flight,
          }),
        ],
      };
    case "flight/patch":
      return { ...state, flights: patchById(state.flights, action.id, action.patch) };
    case "flight/remove":
      return { ...state, flights: state.flights.filter((f) => f.id !== action.id) };
    case "flight/duplicate":
      return {
        ...state,
        flights: duplicateById(state.flights, action.id, (f) => makeFlight({ ...f, id: undefined })),
      };
    case "flight/move":
      return { ...state, flights: moveById(state.flights, action.id, action.delta) };

    /* ------------------------------------------------------------- hotels */
    case "hotel/add":
      return {
        ...state,
        hotels: [
          ...state.hotels,
          makeHotel({
            location: state.trip.destination,
            checkInDate: state.trip.startDate,
            checkOutDate: state.trip.endDate,
            ...action.hotel,
          }),
        ],
      };
    case "hotel/patch":
      return { ...state, hotels: patchById(state.hotels, action.id, action.patch) };
    case "hotel/remove":
      return { ...state, hotels: state.hotels.filter((h) => h.id !== action.id) };
    case "hotel/duplicate":
      return {
        ...state,
        hotels: duplicateById(state.hotels, action.id, (h) => makeHotel({ ...h, id: undefined })),
      };
    case "hotel/move":
      return { ...state, hotels: moveById(state.hotels, action.id, action.delta) };

    /* --------------------------------------------------------- activities */
    case "activity/add":
      return {
        ...state,
        activities: [
          ...state.activities,
          makeActivity({
            location: state.trip.destination,
            date: state.trip.startDate,
            pax: Math.max(1, state.trip.adults + state.trip.children),
            ...action.activity,
          }),
        ],
      };
    case "activity/patch":
      return { ...state, activities: patchById(state.activities, action.id, action.patch) };
    case "activity/remove":
      return { ...state, activities: state.activities.filter((a) => a.id !== action.id) };
    case "activity/duplicate":
      return {
        ...state,
        activities: duplicateById(state.activities, action.id, (a) =>
          makeActivity({ ...a, id: undefined })
        ),
      };
    case "activity/move":
      return { ...state, activities: moveById(state.activities, action.id, action.delta) };

    /* --------------------------------------------------------------- days */
    case "day/add": {
      const last = state.days[state.days.length - 1];
      const nextDate = last?.date
        ? shiftDate(last.date, 1)
        : state.trip.startDate;
      return {
        ...state,
        days: [...state.days, makeDay({ date: nextDate, ...action.day })],
      };
    }
    case "day/patch":
      return { ...state, days: patchById(state.days, action.id, action.patch) };
    case "day/remove":
      return { ...state, days: state.days.filter((d) => d.id !== action.id) };
    case "day/duplicate":
      return {
        ...state,
        days: duplicateById(state.days, action.id, (d) =>
          makeDay({
            ...d,
            id: undefined,
            date: shiftDate(d.date, 1),
            items: d.items.map((i) => makeDayItem({ ...i, id: undefined })),
          })
        ),
      };
    case "day/move":
      return { ...state, days: moveById(state.days, action.id, action.delta) };
    case "day/sort":
      return {
        ...state,
        days: [...state.days].sort((a, b) => {
          if (!a.date) return 1;
          if (!b.date) return -1;
          return a.date.localeCompare(b.date);
        }),
      };
    case "day/generate": {
      // Builds one empty day per calendar date of the trip, keeping any day
      // the admin has already filled in for that date.
      const { startDate, endDate } = state.trip;
      const span = spanDays(startDate, endDate);
      if (span === null) return state;
      const existing = new Map(state.days.map((d) => [d.date, d]));
      const days: ItineraryDay[] = [];
      for (let i = 0; i <= span; i += 1) {
        const date = shiftDate(startDate, i);
        days.push(existing.get(date) ?? makeDay({ date }));
        existing.delete(date);
      }
      // Anything dated outside the trip window is preserved at the end.
      return { ...state, days: [...days, ...existing.values()] };
    }

    /* ---------------------------------------------------------- day items */
    case "dayItem/add":
      return {
        ...state,
        days: state.days.map((d) =>
          d.id === action.dayId
            ? { ...d, items: [...d.items, makeDayItem(action.item)] }
            : d
        ),
      };
    case "dayItem/patch":
      return {
        ...state,
        days: state.days.map((d) =>
          d.id === action.dayId
            ? { ...d, items: patchById(d.items, action.id, action.patch) }
            : d
        ),
      };
    case "dayItem/remove":
      return {
        ...state,
        days: state.days.map((d) =>
          d.id === action.dayId
            ? { ...d, items: d.items.filter((i) => i.id !== action.id) }
            : d
        ),
      };
    case "dayItem/duplicate":
      return {
        ...state,
        days: state.days.map((d) =>
          d.id === action.dayId
            ? {
                ...d,
                items: duplicateById(d.items, action.id, (i) =>
                  makeDayItem({ ...i, id: undefined })
                ),
              }
            : d
        ),
      };
    case "dayItem/move":
      return {
        ...state,
        days: state.days.map((d) =>
          d.id === action.dayId
            ? { ...d, items: moveById(d.items, action.id, action.delta) }
            : d
        ),
      };
    case "dayItem/sort":
      return {
        ...state,
        days: state.days.map((d) =>
          d.id === action.dayId ? { ...d, items: [...d.items].sort(byTime) } : d
        ),
      };

    /* --------------------------------------------------------------- visa */
    case "visa/patch":
      return { ...state, visa: { ...state.visa, ...action.patch } };
    case "visaDoc/add":
      return {
        ...state,
        visa: {
          ...state.visa,
          documents: [...state.visa.documents, makeVisaDocument(action.doc)],
        },
      };
    case "visaDoc/patch":
      return {
        ...state,
        visa: {
          ...state.visa,
          documents: patchById(state.visa.documents, action.id, action.patch),
        },
      };
    case "visaDoc/remove":
      return {
        ...state,
        visa: {
          ...state.visa,
          documents: state.visa.documents.filter((d) => d.id !== action.id),
        },
      };
    case "visaDoc/move":
      return {
        ...state,
        visa: {
          ...state.visa,
          documents: moveById(state.visa.documents, action.id, action.delta),
        },
      };
    case "applicant/add": {
      // Applicants usually share a nationality, so new ones inherit the last one's.
      const last = state.visa.applicants[state.visa.applicants.length - 1];
      const specs = action.applicants?.length ? action.applicants : [{}];
      return {
        ...state,
        visa: {
          ...state.visa,
          applicants: [
            ...state.visa.applicants,
            ...specs.map((a) =>
              makeApplicant({ nationality: last?.nationality ?? "", ...a })
            ),
          ],
        },
      };
    }
    case "applicant/patch":
      return {
        ...state,
        visa: {
          ...state.visa,
          applicants: patchById(state.visa.applicants, action.id, action.patch),
        },
      };
    case "applicant/remove":
      return {
        ...state,
        visa: {
          ...state.visa,
          applicants: state.visa.applicants.filter((a) => a.id !== action.id),
        },
      };
    case "applicant/duplicate":
      return {
        ...state,
        visa: {
          ...state.visa,
          applicants: duplicateById(state.visa.applicants, action.id, (a) =>
            makeApplicant({ ...a, id: undefined })
          ),
        },
      };
    case "applicant/move":
      return {
        ...state,
        visa: {
          ...state.visa,
          applicants: moveById(state.visa.applicants, action.id, action.delta),
        },
      };

    /* ---------------------------------------------------------- insurance */
    case "insurance/patch":
      return { ...state, insurance: { ...state.insurance, ...action.patch } };
    case "benefit/add":
      return {
        ...state,
        insurance: {
          ...state.insurance,
          benefits: [...state.insurance.benefits, makeBenefit(action.benefit)],
        },
      };
    case "benefit/patch":
      return {
        ...state,
        insurance: {
          ...state.insurance,
          benefits: patchById(state.insurance.benefits, action.id, action.patch),
        },
      };
    case "benefit/remove":
      return {
        ...state,
        insurance: {
          ...state.insurance,
          benefits: state.insurance.benefits.filter((b) => b.id !== action.id),
        },
      };
    case "benefit/move":
      return {
        ...state,
        insurance: {
          ...state.insurance,
          benefits: moveById(state.insurance.benefits, action.id, action.delta),
        },
      };
    case "insured/add": {
      const specs = action.travellers?.length ? action.travellers : [{}];
      return {
        ...state,
        insurance: {
          ...state.insurance,
          travellers: [...state.insurance.travellers, ...specs.map((t) => makeInsured(t))],
        },
      };
    }
    case "insured/patch":
      return {
        ...state,
        insurance: {
          ...state.insurance,
          travellers: patchById(state.insurance.travellers, action.id, action.patch),
        },
      };
    case "insured/remove":
      return {
        ...state,
        insurance: {
          ...state.insurance,
          travellers: state.insurance.travellers.filter((t) => t.id !== action.id),
        },
      };
    case "insured/duplicate":
      return {
        ...state,
        insurance: {
          ...state.insurance,
          travellers: duplicateById(state.insurance.travellers, action.id, (t) =>
            makeInsured({ ...t, id: undefined })
          ),
        },
      };
    case "insured/move":
      return {
        ...state,
        insurance: {
          ...state.insurance,
          travellers: moveById(state.insurance.travellers, action.id, action.delta),
        },
      };

    /* ----------------------------------------------------------- expenses */
    case "expense/add":
      return {
        ...state,
        pricing: {
          ...state.pricing,
          otherExpenses: [...state.pricing.otherExpenses, makeLineItem()],
        },
      };
    case "expense/patch":
      return {
        ...state,
        pricing: {
          ...state.pricing,
          otherExpenses: patchById(state.pricing.otherExpenses, action.id, action.patch),
        },
      };
    case "expense/remove":
      return {
        ...state,
        pricing: {
          ...state.pricing,
          otherExpenses: state.pricing.otherExpenses.filter((l) => l.id !== action.id),
        },
      };

    default:
      return state;
  }
}

/* Local date helpers kept here to avoid a circular import with lib/format. */
function shiftDate(value: string, days: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!m) return "";
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function spanDays(from: string, to: string): number | null {
  const a = /^(\d{4})-(\d{2})-(\d{2})$/.exec(from ?? "");
  const b = /^(\d{4})-(\d{2})-(\d{2})$/.exec(to ?? "");
  if (!a || !b) return null;
  const da = new Date(Number(a[1]), Number(a[2]) - 1, Number(a[3]));
  const db = new Date(Number(b[1]), Number(b[2]) - 1, Number(b[3]));
  const diff = Math.round((db.getTime() - da.getTime()) / 86400000);
  return diff < 0 || diff > 365 ? null : diff;
}

/* -------------------------------------------------------------- context */

interface StoreValue {
  itinerary: Itinerary;
  dispatch: React.Dispatch<Action>;
  hydrated: boolean;
}

const ItineraryContext = React.createContext<StoreValue | null>(null);

/** Reads any in-progress draft. Runs on the client only. */
function loadDraft(): Itinerary {
  const base = makeItinerary();
  if (typeof window === "undefined") return base;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    return normalizeItinerary(JSON.parse(raw));
  } catch {
    // A corrupt draft is not worth surfacing — start clean.
  }
  return base;
}

const noopSubscribe = () => () => {};

export function ItineraryProvider({ children }: { children: React.ReactNode }) {
  // The draft is read synchronously so there is no empty-form flash. `hydrated`
  // is false through the server render *and* the hydration render, so the two
  // agree; it flips to true only once React is running on the client.
  const [itinerary, dispatch] = React.useReducer(reducer, undefined, loadDraft);
  const hydrated = React.useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );

  // Persist to sessionStorage — not a database — so the work survives an
  // accidental refresh but disappears with the browser session.
  const warnedRef = React.useRef(false);
  React.useEffect(() => {
    if (!hydrated) return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(itinerary));
      warnedRef.current = false;
    } catch {
      // Almost always the photo payload outgrowing the session quota. The
      // in-memory itinerary is untouched, but a refresh would now lose it.
      if (!warnedRef.current) {
        warnedRef.current = true;
        toast.warning("Too many photos to auto-save this draft.", {
          description:
            "Your work is safe in this tab, but a refresh would lose it. Export the PDF, or remove a few photos.",
        });
      }
    }
  }, [itinerary, hydrated]);

  const value = React.useMemo(
    () => ({ itinerary, dispatch, hydrated }),
    [itinerary, hydrated]
  );

  return (
    <ItineraryContext.Provider value={value}>{children}</ItineraryContext.Provider>
  );
}

export function useItinerary(): StoreValue {
  const ctx = React.useContext(ItineraryContext);
  if (!ctx) {
    throw new Error("useItinerary must be used inside an <ItineraryProvider>.");
  }
  return ctx;
}

export function clearStoredDraft() {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export type { Action as ItineraryAction };
