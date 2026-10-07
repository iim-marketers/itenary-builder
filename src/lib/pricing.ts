import { daysBetween, toMinutes } from "./format";
import { hasPremium } from "./insurance";
import { needsVisa } from "./visa";
import type { Activity, Flight, Hotel, InsuranceInfo, Itinerary, VisaInfo } from "./types";

const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

/* ------------------------------------------------------------- per-item math */

export function flightTotal(f: Flight): number {
  return round2(num(f.farePerPax) * Math.max(1, num(f.pax) || 1));
}

/** Nights derived from the stay dates, unless the admin overrode the value. */
export function hotelNights(h: Hotel): number {
  if (h.nightsOverride !== null && h.nightsOverride !== undefined) {
    return Math.max(0, num(h.nightsOverride));
  }
  const diff = daysBetween(h.checkInDate, h.checkOutDate);
  return diff === null ? 0 : Math.max(0, diff);
}

export function hotelTotal(h: Hotel): number {
  const rooms = Math.max(1, num(h.rooms) || 1);
  return round2(num(h.ratePerNight) * hotelNights(h) * rooms + num(h.extraCharges));
}

export function activityTickets(a: Activity): number {
  return round2(num(a.ticketPerPerson) * Math.max(1, num(a.pax) || 1));
}

export function activityTotal(a: Activity): number {
  return round2(
    activityTickets(a) + num(a.guideCharges) + num(a.transportCharges)
  );
}

/** Embassy fee plus service fee, per applicant. */
export function visaFeePerPerson(v: VisaInfo): number {
  return round2(num(v.feePerPerson) + num(v.serviceFeePerPerson));
}

/** Visa cost for the whole party, or 0 when no visa is needed. */
export function visaTotal(v: VisaInfo): number {
  if (!needsVisa(v.requirement)) return 0;
  return round2(visaFeePerPerson(v) * Math.max(0, num(v.pax)));
}

/** Premium for the whole party, or 0 when the agency is not selling the policy. */
export function insuranceTotal(i: InsuranceInfo): number {
  if (!hasPremium(i.mode)) return 0;
  return round2(num(i.premiumPerPerson) * Math.max(0, num(i.pax)));
}

/** Only an included policy can be folded into the package; an add-on never is. */
export function insuranceInPackage(i: InsuranceInfo): boolean {
  return i.mode === "included" && i.addToPricing;
}

/** Flight duration in minutes from the date/time pair, or null when incomplete. */
export function flightDurationMinutes(f: Flight): number | null {
  const dep = toMinutes(f.departureDate, f.departureTime);
  const arr = toMinutes(f.arrivalDate, f.arrivalTime);
  if (dep === null || arr === null) return null;
  const diff = arr - dep;
  return diff >= 0 ? diff : null;
}

/* --------------------------------------------------------------- roll-up */

export interface PriceRow {
  key: string;
  label: string;
  detail?: string;
  amount: number;
}

export interface PricingBreakdown {
  travellers: number;
  payingTravellers: number;
  flightRows: PriceRow[];
  hotelRows: PriceRow[];
  activityRows: PriceRow[];
  extraRows: PriceRow[];
  flightsTotal: number;
  hotelsTotal: number;
  activitiesTotal: number;
  transportation: number;
  meals: number;
  guideCharges: number;
  /** Visa fees folded into the package — 0 unless the admin opted in. */
  visaFees: number;
  /** Insurance premium folded into the package — 0 unless included and opted in. */
  insurancePremium: number;
  otherExpensesTotal: number;
  extrasTotal: number;
  subtotal: number;
  discountAmount: number;
  discountLabel: string;
  afterDiscount: number;
  serviceChargeAmount: number;
  taxableBase: number;
  taxAmount: number;
  taxLabel: string;
  grandTotal: number;
  perPerson: number;
  advancePaid: number;
  balanceDue: number;
}

export function computePricing(it: Itinerary): PricingBreakdown {
  const { trip, pricing } = it;

  const travellers =
    Math.max(0, num(trip.adults)) +
    Math.max(0, num(trip.children)) +
    Math.max(0, num(trip.infants));
  const payingTravellers = Math.max(
    1,
    Math.max(0, num(trip.adults)) + Math.max(0, num(trip.children))
  );

  const flightRows: PriceRow[] = it.flights.map((f) => ({
    key: f.id,
    label:
      [f.airline, f.flightNumber].filter(Boolean).join(" ") || "Flight",
    detail: [f.departureAirport, f.arrivalAirport].filter(Boolean).join(" → "),
    amount: flightTotal(f),
  }));

  const hotelRows: PriceRow[] = it.hotels.map((h) => {
    const nights = hotelNights(h);
    const rooms = Math.max(1, num(h.rooms) || 1);
    return {
      key: h.id,
      label: h.name || "Hotel",
      detail: `${nights} night${nights === 1 ? "" : "s"} × ${rooms} room${
        rooms === 1 ? "" : "s"
      }`,
      amount: hotelTotal(h),
    };
  });

  const activityRows: PriceRow[] = it.activities.map((a) => ({
    key: a.id,
    label: a.name || "Activity",
    detail: a.location,
    amount: activityTotal(a),
  }));

  const flightsTotal = round2(flightRows.reduce((s, r) => s + r.amount, 0));
  const hotelsTotal = round2(hotelRows.reduce((s, r) => s + r.amount, 0));
  const activitiesTotal = round2(activityRows.reduce((s, r) => s + r.amount, 0));

  const transportation = round2(num(pricing.transportation));
  const meals = round2(num(pricing.meals));
  const guideCharges = round2(num(pricing.guideCharges));
  const visaFees = it.visa.addToPricing ? visaTotal(it.visa) : 0;
  const insurancePremium = insuranceInPackage(it.insurance) ? insuranceTotal(it.insurance) : 0;
  const otherExpensesTotal = round2(
    pricing.otherExpenses.reduce((s, l) => s + num(l.amount), 0)
  );

  const extraRows: PriceRow[] = [];
  if (transportation) {
    extraRows.push({
      key: "transportation",
      label: "Transportation",
      detail: pricing.transportationNote,
      amount: transportation,
    });
  }
  if (meals) {
    extraRows.push({
      key: "meals",
      label: "Meals",
      detail: pricing.mealsNote,
      amount: meals,
    });
  }
  if (guideCharges) {
    extraRows.push({
      key: "guide",
      label: "Guide charges",
      detail: pricing.guideChargesNote,
      amount: guideCharges,
    });
  }
  if (visaFees) {
    const pax = Math.max(0, num(it.visa.pax));
    extraRows.push({
      key: "visa",
      label: it.visa.visaType.trim() || "Visa fees",
      detail: `${it.visa.country.trim() ? `${it.visa.country.trim()} · ` : ""}${pax} applicant${
        pax === 1 ? "" : "s"
      }`,
      amount: visaFees,
    });
  }
  if (insurancePremium) {
    const ins = it.insurance;
    const pax = Math.max(0, num(ins.pax));
    extraRows.push({
      key: "insurance",
      label: "Travel insurance",
      detail: [ins.provider.trim(), ins.planName.trim(), `${pax} traveller${pax === 1 ? "" : "s"}`]
        .filter(Boolean)
        .join(" · "),
      amount: insurancePremium,
    });
  }
  for (const l of pricing.otherExpenses) {
    if (!num(l.amount) && !l.label.trim()) continue;
    extraRows.push({
      key: l.id,
      label: l.label.trim() || "Other expense",
      amount: round2(num(l.amount)),
    });
  }

  const extrasTotal = round2(
    transportation + meals + guideCharges + visaFees + insurancePremium + otherExpensesTotal
  );
  const subtotal = round2(
    flightsTotal + hotelsTotal + activitiesTotal + extrasTotal
  );

  const discountRaw =
    pricing.discountMode === "percent"
      ? (subtotal * num(pricing.discountValue)) / 100
      : num(pricing.discountValue);
  // Never discount below zero, and never let a negative "discount" inflate the bill.
  const discountAmount = round2(Math.min(Math.max(0, discountRaw), subtotal));
  const afterDiscount = round2(subtotal - discountAmount);

  const serviceChargeAmount = round2(
    pricing.serviceChargeMode === "percent"
      ? (afterDiscount * num(pricing.serviceChargeValue)) / 100
      : num(pricing.serviceChargeValue)
  );

  const taxableBase = round2(afterDiscount + serviceChargeAmount);
  const taxAmount = round2((taxableBase * num(pricing.taxPercent)) / 100);

  let grandTotal = round2(taxableBase + taxAmount);
  if (pricing.roundOff) grandTotal = Math.round(grandTotal);

  const advancePaid = round2(Math.min(Math.max(0, num(pricing.advancePaid)), grandTotal));

  return {
    travellers,
    payingTravellers,
    flightRows,
    hotelRows,
    activityRows,
    extraRows,
    flightsTotal,
    hotelsTotal,
    activitiesTotal,
    transportation,
    meals,
    guideCharges,
    visaFees,
    insurancePremium,
    otherExpensesTotal,
    extrasTotal,
    subtotal,
    discountAmount,
    discountLabel: pricing.discountLabel?.trim() || "Discount",
    afterDiscount,
    serviceChargeAmount,
    taxableBase,
    taxAmount,
    taxLabel: pricing.taxLabel?.trim() || "Tax / GST",
    grandTotal,
    perPerson: round2(grandTotal / payingTravellers),
    advancePaid,
    balanceDue: round2(grandTotal - advancePaid),
  };
}

/** Nights/days headline for the trip, derived from the trip dates. */
export function tripDuration(it: Itinerary): { nights: number; days: number } | null {
  const diff = daysBetween(it.trip.startDate, it.trip.endDate);
  if (diff === null || diff < 0) return null;
  return { nights: diff, days: diff + 1 };
}
