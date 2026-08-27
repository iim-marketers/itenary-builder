import {
  DAY_ITEM_KINDS,
  daysBetween,
  formatDate,
  formatDuration,
  formatTime,
  isValidTime,
  pluralise,
} from "./format";
import {
  activityTickets,
  activityTotal,
  computePricing,
  flightDurationMinutes,
  flightTotal,
  hotelNights,
  hotelTotal,
  type PricingBreakdown,
} from "./pricing";
import { BRAND } from "./brand";
import type { Itinerary, ItineraryDay, ItineraryImage } from "./types";

/**
 * A flattened, presentation-ready view of the itinerary. Both the on-screen
 * preview and the PDF renderer read from this so the two stay identical.
 */
export interface DocModel {
  brandColor: string;
  companyName: string;
  tagline: string;
  logo: string | null;
  contactLines: string[];
  companyAddress: string;
  gstin: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    altPhone: string;
    address: string;
    notes: string;
  };
  headline: string;
  destination: string;
  origin: string;
  reference: string;
  preparedBy: string;
  preparedOn: string;
  dateRange: string;
  durationLabel: string;
  travellerLabel: string;
  travellerBreakdown: string;
  overview: string;
  facts: { label: string; value: string }[];
  coverHighlights: { label: string; title: string }[];
  flights: FlightView[];
  hotels: HotelView[];
  activities: ActivityView[];
  days: DayView[];
  pricing: PricingBreakdown;
  currency: Itinerary["trip"]["currency"];
  inclusions: string[];
  exclusions: string[];
  importantNotes: string[];
  terms: string[];
  paymentTerms: string;
  cancellationPolicy: string;
  closingNote: string;
  showPerPerson: boolean;
  hasAdvance: boolean;
}

export interface FlightView {
  id: string;
  title: string;
  subtitle: string;
  travelClass: string;
  depAirport: string;
  depCity: string;
  depTerminal: string;
  depDate: string;
  depTime: string;
  arrAirport: string;
  arrCity: string;
  arrTerminal: string;
  arrDate: string;
  arrTime: string;
  duration: string;
  baggage: string;
  notes: string;
  fareLine: string;
  total: number;
  overnight: boolean;
}

export interface HotelView {
  id: string;
  name: string;
  stars: number;
  location: string;
  address: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  stayLine: string;
  roomLine: string;
  mealPlan: string;
  amenities: string[];
  notes: string;
  rateLine: string;
  total: number;
}

export interface ActivityView {
  id: string;
  name: string;
  location: string;
  date: string;
  timeWindow: string;
  description: string;
  inclusions: string[];
  notes: string;
  charges: { label: string; amount: number }[];
  total: number;
  images: ItineraryImage[];
}

export interface DayView {
  id: string;
  index: number;
  dateLabel: string;
  weekday: string;
  title: string;
  summary: string;
  overnightAt: string;
  mealsLabel: string;
  items: {
    id: string;
    time: string;
    timeRange: string;
    icon: string;
    kindLabel: string;
    title: string;
    location: string;
    description: string;
    images: ItineraryImage[];
  }[];
}

const iconFor = (kind: string) =>
  DAY_ITEM_KINDS.find((k) => k.value === kind)?.icon ?? "•";
const labelFor = (kind: string) =>
  DAY_ITEM_KINDS.find((k) => k.value === kind)?.label ?? "Other";

function dayMealsLabel(day: ItineraryDay): string {
  const on = [
    day.meals.breakfast && "Breakfast",
    day.meals.lunch && "Lunch",
    day.meals.dinner && "Dinner",
  ].filter(Boolean) as string[];
  return on.length ? on.join(" · ") : "";
}

export function buildDocModel(it: Itinerary): DocModel {
  const pricing = computePricing(it);
  const { trip, customer, content } = it;

  const span = daysBetween(trip.startDate, trip.endDate);
  const durationLabel =
    span === null || span < 0
      ? "—"
      : `${pluralise(span + 1, "Day")} / ${pluralise(span, "Night")}`;

  const dateRange =
    trip.startDate && trip.endDate
      ? `${formatDate(trip.startDate, "long")} — ${formatDate(trip.endDate, "long")}`
      : trip.startDate
        ? formatDate(trip.startDate, "long")
        : "Dates to be confirmed";

  const breakdown = [
    trip.adults > 0 && pluralise(trip.adults, "Adult"),
    trip.children > 0 && pluralise(trip.children, "Child", "Children"),
    trip.infants > 0 && pluralise(trip.infants, "Infant"),
  ].filter(Boolean) as string[];

  const contactLines = [BRAND.phone, BRAND.email, BRAND.website]
    .map((v) => v.trim())
    .filter(Boolean);

  const facts: { label: string; value: string }[] = [
    { label: "Destination", value: trip.destination || "—" },
    { label: "Duration", value: durationLabel },
    { label: "Travel dates", value: dateRange },
    { label: "Travellers", value: breakdown.join(" · ") || "—" },
  ];
  if (trip.origin.trim()) facts.push({ label: "Departing from", value: trip.origin });
  if (trip.bestTimeToVisit.trim())
    facts.push({ label: "Best time to visit", value: trip.bestTimeToVisit });
  if (trip.languages.trim()) facts.push({ label: "Languages", value: trip.languages });
  if (trip.timeZone.trim()) facts.push({ label: "Time zone", value: trip.timeZone });

  /* ------------------------------------------------------------- flights */
  const flights: FlightView[] = it.flights.map((f) => {
    const mins = flightDurationMinutes(f);
    const baggage = [
      f.baggageCheckIn.trim() && `Check-in ${f.baggageCheckIn.trim()}`,
      f.baggageCabin.trim() && `Cabin ${f.baggageCabin.trim()}`,
    ]
      .filter(Boolean)
      .join(" · ");
    return {
      id: f.id,
      title: f.airline.trim() || "Flight",
      subtitle: [f.flightNumber.trim(), f.aircraft.trim()].filter(Boolean).join(" · "),
      travelClass: f.travelClass.trim(),
      depAirport: f.departureAirport.trim() || "—",
      depCity: f.departureCity.trim(),
      depTerminal: f.departureTerminal.trim(),
      depDate: formatDate(f.departureDate, "dayLong"),
      depTime: formatTime(f.departureTime),
      arrAirport: f.arrivalAirport.trim() || "—",
      arrCity: f.arrivalCity.trim(),
      arrTerminal: f.arrivalTerminal.trim(),
      arrDate: formatDate(f.arrivalDate, "dayLong"),
      arrTime: formatTime(f.arrivalTime),
      duration:
        f.durationOverride.trim() || (mins !== null ? formatDuration(mins) : "—"),
      baggage,
      notes: f.notes.trim(),
      fareLine:
        f.pax > 1 ? `${f.pax} × fare per traveller` : "Fare for 1 traveller",
      total: flightTotal(f),
      overnight:
        Boolean(f.departureDate && f.arrivalDate && f.departureDate !== f.arrivalDate),
    };
  });

  /* -------------------------------------------------------------- hotels */
  const hotels: HotelView[] = it.hotels.map((h) => {
    const nights = hotelNights(h);
    const rooms = Math.max(1, h.rooms || 1);
    const stars = Number.parseInt(h.rating, 10);
    return {
      id: h.id,
      name: h.name.trim() || "Hotel",
      stars: Number.isFinite(stars) ? Math.min(5, Math.max(0, stars)) : 0,
      location: h.location.trim(),
      address: h.address.trim(),
      checkIn: `${formatDate(h.checkInDate, "medium")}${
        isValidTime(h.checkInTime) ? ` · ${formatTime(h.checkInTime)}` : ""
      }`,
      checkOut: `${formatDate(h.checkOutDate, "medium")}${
        isValidTime(h.checkOutTime) ? ` · ${formatTime(h.checkOutTime)}` : ""
      }`,
      nights,
      stayLine: `${pluralise(nights, "night")} · ${pluralise(rooms, "room")}`,
      roomLine: h.roomType.trim() || "Room",
      mealPlan: h.mealPlan.trim(),
      amenities: h.amenities
        .split(/[,\n]/)
        .map((a) => a.trim())
        .filter(Boolean),
      notes: h.notes.trim(),
      rateLine:
        nights > 0 ? `${rooms} room × ${nights} night × rate/night` : "Stay cost",
      total: hotelTotal(h),
    };
  });

  /* ---------------------------------------------------------- activities */
  const activities: ActivityView[] = it.activities.map((a) => {
    const charges: { label: string; amount: number }[] = [];
    const tickets = activityTickets(a);
    if (tickets) {
      charges.push({
        label: a.pax > 1 ? `Tickets / entry (${a.pax} pax)` : "Tickets / entry",
        amount: tickets,
      });
    }
    if (a.guideCharges) charges.push({ label: "Guide charges", amount: a.guideCharges });
    if (a.transportCharges)
      charges.push({ label: "Transport charges", amount: a.transportCharges });

    const window = isValidTime(a.startTime)
      ? isValidTime(a.endTime)
        ? `${formatTime(a.startTime)} – ${formatTime(a.endTime)}`
        : formatTime(a.startTime)
      : "";

    return {
      id: a.id,
      name: a.name.trim() || "Activity",
      location: a.location.trim(),
      date: formatDate(a.date, "dayLong"),
      timeWindow: window,
      description: a.description.trim(),
      inclusions: a.inclusions
        .split(/[,\n]/)
        .map((v) => v.trim())
        .filter(Boolean),
      notes: a.notes.trim(),
      charges,
      total: activityTotal(a),
      images: a.images ?? [],
    };
  });

  /* ---------------------------------------------------------------- days */
  const days: DayView[] = it.days.map((d, index) => ({
    id: d.id,
    index: index + 1,
    dateLabel: formatDate(d.date, "long"),
    weekday: formatDate(d.date, "dayLong").split(",")[0],
    title: d.title.trim() || (d.date ? formatDate(d.date, "long") : `Day ${index + 1}`),
    summary: d.summary.trim(),
    overnightAt: d.overnightAt.trim(),
    mealsLabel: dayMealsLabel(d),
    items: d.items.map((i) => ({
      id: i.id,
      time: formatTime(i.time),
      timeRange: isValidTime(i.endTime)
        ? `${formatTime(i.time)} – ${formatTime(i.endTime)}`
        : formatTime(i.time),
      icon: iconFor(i.kind),
      kindLabel: labelFor(i.kind),
      title: i.title.trim() || labelFor(i.kind),
      location: i.location.trim(),
      description: i.description.trim(),
      images: i.images ?? [],
    })),
  }));

  const headline =
    trip.title.trim() ||
    (trip.destination.trim() ? `${trip.destination.trim()} Holiday` : "Travel Itinerary");

  return {
    brandColor: BRAND.color,
    companyName: BRAND.name,
    tagline: BRAND.tagline,
    logo: BRAND.logoSrc,
    contactLines,
    companyAddress: BRAND.address.trim(),
    gstin: BRAND.gstin.trim(),
    customer: {
      name: customer.name.trim() || "Guest",
      email: customer.email.trim(),
      phone: customer.phone.trim(),
      altPhone: customer.altPhone.trim(),
      address: customer.address.trim(),
      notes: customer.notes.trim(),
    },
    headline,
    destination: trip.destination.trim() || "Your destination",
    origin: trip.origin.trim(),
    reference: trip.reference.trim(),
    preparedBy: trip.preparedBy.trim(),
    preparedOn: formatDate(it.createdAt.slice(0, 10), "long"),
    dateRange,
    durationLabel,
    travellerLabel: pluralise(pricing.travellers, "Traveller"),
    travellerBreakdown: breakdown.join(" · "),
    overview: trip.overview.trim(),
    facts,
    coverHighlights: days
      .filter((d) => d.title.trim())
      .slice(0, 6)
      .map((d) => ({ label: `Day ${d.index}`, title: d.title })),
    flights,
    hotels,
    activities,
    days,
    pricing,
    currency: trip.currency,
    inclusions: content.inclusions,
    exclusions: content.exclusions,
    importantNotes: content.importantNotes,
    terms: content.termsAndConditions,
    paymentTerms: content.paymentTerms.trim(),
    cancellationPolicy: content.cancellationPolicy.trim(),
    closingNote: content.closingNote.trim(),
    showPerPerson: it.pricing.showPerPerson,
    hasAdvance: pricing.advancePaid > 0,
  };
}
