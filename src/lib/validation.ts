import { daysBetween, isValidDate, isValidTime, toMinutes } from "./format";
import { hotelNights } from "./pricing";
import type { Itinerary, ValidationIssue } from "./types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+()\d][\d\s\-()]{5,}$/;

/**
 * Validates the whole itinerary. `error` blocks export; `warning` is advisory
 * and only nudges the admin.
 */
export function validateItinerary(it: Itinerary): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const push = (
    level: ValidationIssue["level"],
    section: ValidationIssue["section"],
    message: string
  ) => issues.push({ id: `${section}:${issues.length}`, level, section, message });

  /* ------------------------------------------------------------------ trip */
  const { trip, customer } = it;

  if (!customer.name.trim()) push("error", "trip", "Customer name is required.");
  if (!customer.email.trim() && !customer.phone.trim()) {
    push("error", "trip", "Add at least one contact detail — an email or a phone number.");
  }
  if (customer.email.trim() && !EMAIL_RE.test(customer.email.trim())) {
    push("error", "trip", `“${customer.email}” is not a valid email address.`);
  }
  if (customer.phone.trim() && !PHONE_RE.test(customer.phone.trim())) {
    push("warning", "trip", `“${customer.phone}” does not look like a valid phone number.`);
  }

  if (!trip.destination.trim()) push("error", "trip", "Destination is required.");
  if (!isValidDate(trip.startDate)) push("error", "trip", "A valid trip start date is required.");
  if (!isValidDate(trip.endDate)) push("error", "trip", "A valid trip end date is required.");

  const tripSpan = daysBetween(trip.startDate, trip.endDate);
  if (tripSpan !== null && tripSpan < 0) {
    push("error", "trip", "The trip end date falls before the start date.");
  }
  if (tripSpan !== null && tripSpan > 365) {
    push("warning", "trip", "The trip spans more than a year — check the dates.");
  }

  const travellers = trip.adults + trip.children + trip.infants;
  if (travellers < 1) push("error", "trip", "The trip needs at least one traveller.");
  if (trip.adults < 0 || trip.children < 0 || trip.infants < 0) {
    push("error", "trip", "Traveller counts cannot be negative.");
  }
  if (travellers > 0 && trip.adults < 1) {
    push("warning", "trip", "There are no adults in the traveller mix.");
  }

  const withinTrip = (d: string) => {
    if (tripSpan === null || tripSpan < 0 || !isValidDate(d)) return true;
    const a = daysBetween(trip.startDate, d);
    return a !== null && a >= 0 && a <= tripSpan;
  };

  /* --------------------------------------------------------------- flights */
  it.flights.forEach((f, i) => {
    const tag = `Flight ${i + 1}`;
    if (!f.airline.trim()) push("error", "flights", `${tag}: airline name is required.`);
    if (!f.flightNumber.trim()) push("error", "flights", `${tag}: flight number is required.`);
    if (!f.departureAirport.trim()) push("error", "flights", `${tag}: departure airport is required.`);
    if (!f.arrivalAirport.trim()) push("error", "flights", `${tag}: arrival airport is required.`);
    if (!isValidDate(f.departureDate)) push("error", "flights", `${tag}: a valid departure date is required.`);
    if (!isValidTime(f.departureTime)) push("error", "flights", `${tag}: departure time must be in HH:MM.`);
    if (!isValidDate(f.arrivalDate)) push("error", "flights", `${tag}: a valid arrival date is required.`);
    if (!isValidTime(f.arrivalTime)) push("error", "flights", `${tag}: arrival time must be in HH:MM.`);

    const dep = toMinutes(f.departureDate, f.departureTime);
    const arr = toMinutes(f.arrivalDate, f.arrivalTime);
    if (dep !== null && arr !== null && arr <= dep) {
      push("error", "flights", `${tag}: arrival must be after departure.`);
    }
    if (f.farePerPax < 0) push("error", "flights", `${tag}: fare cannot be negative.`);
    if (f.pax < 1) push("error", "flights", `${tag}: passenger count must be at least 1.`);
    if (f.farePerPax === 0) push("warning", "flights", `${tag}: the fare is zero.`);
    if (!withinTrip(f.departureDate)) {
      push("warning", "flights", `${tag}: the departure date is outside the trip dates.`);
    }
  });

  /* ---------------------------------------------------------------- hotels */
  it.hotels.forEach((h, i) => {
    const tag = `Hotel ${i + 1}`;
    if (!h.name.trim()) push("error", "hotels", `${tag}: hotel name is required.`);
    if (!h.location.trim() && !h.address.trim()) {
      push("error", "hotels", `${tag}: add a location or address.`);
    }
    if (!isValidDate(h.checkInDate)) push("error", "hotels", `${tag}: a valid check-in date is required.`);
    if (!isValidDate(h.checkOutDate)) push("error", "hotels", `${tag}: a valid check-out date is required.`);
    if (!isValidTime(h.checkInTime)) push("error", "hotels", `${tag}: check-in time must be in HH:MM.`);
    if (!isValidTime(h.checkOutTime)) push("error", "hotels", `${tag}: check-out time must be in HH:MM.`);

    const span = daysBetween(h.checkInDate, h.checkOutDate);
    if (span !== null && span < 0) {
      push("error", "hotels", `${tag}: check-out falls before check-in.`);
    } else if (span === 0 && h.nightsOverride === null) {
      push("warning", "hotels", `${tag}: check-in and check-out are on the same day — 0 nights.`);
    }
    if (!h.roomType.trim()) push("warning", "hotels", `${tag}: no room type set.`);
    if (h.rooms < 1) push("error", "hotels", `${tag}: at least one room is required.`);
    if (h.ratePerNight < 0 || h.extraCharges < 0) {
      push("error", "hotels", `${tag}: costs cannot be negative.`);
    }
    if (h.ratePerNight === 0 && h.extraCharges === 0) {
      push("warning", "hotels", `${tag}: the cost is zero.`);
    }
    if (hotelNights(h) === 0 && h.ratePerNight > 0) {
      push("warning", "hotels", `${tag}: 0 nights, so the nightly rate adds nothing to the total.`);
    }
    if (!withinTrip(h.checkInDate)) {
      push("warning", "hotels", `${tag}: check-in is outside the trip dates.`);
    }
  });

  /* ------------------------------------------------------------ activities */
  it.activities.forEach((a, i) => {
    const tag = `Activity ${i + 1}`;
    if (!a.name.trim()) push("error", "activities", `${tag}: activity name is required.`);
    if (!a.location.trim()) push("warning", "activities", `${tag}: no location set.`);
    if (!isValidDate(a.date)) push("error", "activities", `${tag}: a valid date is required.`);
    if (!isValidTime(a.startTime)) push("error", "activities", `${tag}: start time must be in HH:MM.`);
    if (a.endTime && !isValidTime(a.endTime)) {
      push("error", "activities", `${tag}: end time must be in HH:MM.`);
    }
    if (isValidTime(a.startTime) && isValidTime(a.endTime) && a.endTime <= a.startTime) {
      push("warning", "activities", `${tag}: the end time is not after the start time.`);
    }
    if (a.ticketPerPerson < 0 || a.guideCharges < 0 || a.transportCharges < 0) {
      push("error", "activities", `${tag}: charges cannot be negative.`);
    }
    if (a.pax < 1) push("error", "activities", `${tag}: participant count must be at least 1.`);
    if (!withinTrip(a.date)) {
      push("warning", "activities", `${tag}: the date is outside the trip dates.`);
    }
  });

  /* ------------------------------------------------------------------ days */
  if (it.days.length === 0) {
    push("warning", "days", "No day-by-day plan has been added yet.");
  }
  const seenDates = new Set<string>();
  it.days.forEach((d, i) => {
    const tag = `Day ${i + 1}`;
    if (!isValidDate(d.date)) {
      push("error", "days", `${tag}: a valid date is required.`);
    } else {
      if (seenDates.has(d.date)) push("warning", "days", `${tag}: duplicate date.`);
      seenDates.add(d.date);
      if (!withinTrip(d.date)) {
        push("warning", "days", `${tag}: the date is outside the trip dates.`);
      }
    }
    if (!d.title.trim()) push("warning", "days", `${tag}: no day title set.`);
    if (d.items.length === 0) push("warning", "days", `${tag}: no activities added.`);

    d.items.forEach((item, j) => {
      const itag = `${tag} · item ${j + 1}`;
      if (!item.title.trim()) push("error", "days", `${itag}: a title is required.`);
      if (!isValidTime(item.time)) push("error", "days", `${itag}: time must be in HH:MM.`);
      if (item.endTime && !isValidTime(item.endTime)) {
        push("error", "days", `${itag}: end time must be in HH:MM.`);
      }
      if (
        isValidTime(item.time) &&
        isValidTime(item.endTime) &&
        item.endTime < item.time
      ) {
        push("warning", "days", `${itag}: the end time is before the start time.`);
      }
    });
  });

  /* --------------------------------------------------------------- pricing */
  const p = it.pricing;
  if (p.transportation < 0 || p.meals < 0 || p.guideCharges < 0) {
    push("error", "pricing", "Cost buckets cannot be negative.");
  }
  p.otherExpenses.forEach((l, i) => {
    if (l.amount !== 0 && !l.label.trim()) {
      push("warning", "pricing", `Other expense ${i + 1} has an amount but no label.`);
    }
    if (l.amount < 0) push("error", "pricing", `Other expense ${i + 1} cannot be negative.`);
  });
  if (p.discountValue < 0) push("error", "pricing", "The discount cannot be negative.");
  if (p.discountMode === "percent" && p.discountValue > 100) {
    push("error", "pricing", "A percentage discount cannot exceed 100%.");
  }
  if (p.serviceChargeValue < 0) push("error", "pricing", "The service charge cannot be negative.");
  if (p.taxPercent < 0 || p.taxPercent > 100) {
    push("error", "pricing", "The tax rate must be between 0 and 100%.");
  }
  if (p.advancePaid < 0) push("error", "pricing", "The advance paid cannot be negative.");

  const hasAnyCost =
    it.flights.length || it.hotels.length || it.activities.length ||
    p.transportation || p.meals || p.guideCharges || p.otherExpenses.length;
  if (!hasAnyCost) {
    push("warning", "pricing", "Nothing has been costed yet — the grand total is zero.");
  }

  /* --------------------------------------------------------------- content */
  if (it.content.inclusions.length === 0) {
    push("warning", "content", "No inclusions listed.");
  }
  if (it.content.termsAndConditions.length === 0) {
    push("warning", "content", "No terms & conditions listed.");
  }

  return issues;
}

export function countBy(issues: ValidationIssue[]) {
  return {
    errors: issues.filter((i) => i.level === "error").length,
    warnings: issues.filter((i) => i.level === "warning").length,
  };
}

export function issuesFor(issues: ValidationIssue[], section: string) {
  return issues.filter((i) => i.section === section);
}
