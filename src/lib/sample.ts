import {
  makeActivity,
  makeDay,
  makeDayItem,
  makeFlight,
  makeHotel,
  makeItinerary,
  makeLineItem,
  uid,
} from "./defaults";
import { addDays, toISODate } from "./format";
import type { Itinerary, ItineraryImage } from "./types";

/**
 * Fixed ids for the entities that carry sample photos, so the photos attach to
 * the right activity rather than to whatever happens to be at that index.
 */
const SAMPLE_IDS = {
  terraces: "sample_act_terraces",
  waterfall: "sample_act_waterfall",
  uluwatu: "sample_act_uluwatu",
  beachSunset: "sample_itm_beach_sunset",
} as const;

/** A fully populated itinerary used by the “Load sample” action. */
export function makeSampleItinerary(): Itinerary {
  const base = makeItinerary();
  const start = addDays(toISODate(new Date()), 21);
  const d = (n: number) => addDays(start, n);

  return {
    ...base,
    customer: {
      name: "Ananya Iyer",
      email: "ananya.iyer@example.com",
      phone: "+91 99300 77812",
      altPhone: "+91 22 4004 1122",
      address: "18 Hill Road, Bandra West, Mumbai 400050",
      notes: "Vegetarian meals for both travellers. Prefers a high-floor room.",
    },
    trip: {
      ...base.trip,
      title: "Bali Escape — Ubud & Seminyak",
      destination: "Bali, Indonesia",
      origin: "Mumbai, India",
      startDate: start,
      endDate: d(5),
      adults: 2,
      children: 0,
      infants: 0,
      currency: "INR",
      overview:
        "Six unhurried days across Bali — rice-terrace mornings in Ubud, a private waterfall trek, and three slow evenings on the Seminyak coast. The pace is deliberately gentle, with a private vehicle and driver on call throughout.",
      bestTimeToVisit: "April to October (dry season)",
      languages: "Indonesian, English",
      timeZone: "GMT +8 (WITA)",
      preparedBy: "Rhea Menon, Senior Travel Consultant",
    },
    flights: [
      makeFlight({
        airline: "Singapore Airlines",
        flightNumber: "SQ 421",
        aircraft: "Boeing 787-10",
        departureAirport: "BOM",
        departureCity: "Mumbai",
        departureTerminal: "T2",
        departureDate: start,
        departureTime: "23:45",
        arrivalAirport: "SIN",
        arrivalCity: "Singapore",
        arrivalTerminal: "T3",
        arrivalDate: d(1),
        arrivalTime: "08:10",
        travelClass: "Economy",
        baggageCabin: "7 kg",
        baggageCheckIn: "30 kg",
        farePerPax: 32500,
        pax: 2,
        notes: "Layover of 2h 05m in Singapore before the onward leg.",
      }),
      makeFlight({
        airline: "Singapore Airlines",
        flightNumber: "SQ 938",
        aircraft: "Airbus A350-900",
        departureAirport: "SIN",
        departureCity: "Singapore",
        departureTerminal: "T3",
        departureDate: d(1),
        departureTime: "10:15",
        arrivalAirport: "DPS",
        arrivalCity: "Denpasar",
        arrivalTerminal: "Intl",
        arrivalDate: d(1),
        arrivalTime: "13:00",
        travelClass: "Economy",
        baggageCabin: "7 kg",
        baggageCheckIn: "30 kg",
        farePerPax: 11800,
        pax: 2,
      }),
      makeFlight({
        airline: "Singapore Airlines",
        flightNumber: "SQ 943 / SQ 422",
        aircraft: "Airbus A350-900",
        departureAirport: "DPS",
        departureCity: "Denpasar",
        departureTerminal: "Intl",
        departureDate: d(5),
        departureTime: "16:40",
        arrivalAirport: "BOM",
        arrivalCity: "Mumbai",
        arrivalTerminal: "T2",
        arrivalDate: d(6),
        arrivalTime: "01:05",
        travelClass: "Economy",
        baggageCabin: "7 kg",
        baggageCheckIn: "30 kg",
        farePerPax: 38400,
        pax: 2,
      }),
    ],
    hotels: [
      makeHotel({
        name: "Kayon Jungle Resort",
        rating: "5",
        location: "Ubud, Gianyar",
        address: "Banjar Bresela, Payangan, Gianyar, Bali 80572",
        checkInDate: d(1),
        checkOutDate: d(3),
        checkInTime: "14:00",
        checkOutTime: "12:00",
        roomType: "Jungle Pool Villa",
        rooms: 1,
        mealPlan: "Breakfast included",
        amenities: "Private pool, Valley view, Spa access, Airport transfer, Wi-Fi",
        ratePerNight: 24500,
        notes: "Adults-only property. Complimentary afternoon tea daily.",
      }),
      makeHotel({
        name: "Katamama Suites",
        rating: "5",
        location: "Seminyak, Badung",
        address: "Jl. Petitenget No.51B, Seminyak, Bali 80361",
        checkInDate: d(3),
        checkOutDate: d(5),
        checkInTime: "15:00",
        checkOutTime: "11:00",
        roomType: "Ocean Suite",
        rooms: 1,
        mealPlan: "Breakfast included",
        amenities: "Beachfront, Rooftop bar, Gym, Wi-Fi, Late check-out on request",
        ratePerNight: 21800,
        extraCharges: 3200,
        notes: "Extra charge covers the one-time resort levy.",
      }),
    ],
    activities: [
      makeActivity({
        id: SAMPLE_IDS.terraces,
        name: "Tegallalang Rice Terraces & Swing",
        location: "Tegallalang, Ubud",
        date: d(2),
        startTime: "08:30",
        endTime: "12:00",
        description:
          "An early walk through the terraced valley before the crowds arrive, followed by the jungle swing over the gorge.",
        inclusions: "Entry tickets, Swing session, Bottled water, Local guide",
        ticketPerPerson: 1850,
        pax: 2,
        guideCharges: 2400,
        transportCharges: 1800,
      }),
      makeActivity({
        id: SAMPLE_IDS.waterfall,
        name: "Tegenungan Waterfall Trek",
        location: "Gianyar Regency",
        date: d(2),
        startTime: "14:00",
        endTime: "17:30",
        description:
          "A short, shaded descent to a single-drop waterfall with a wide bathing pool — the quietest of the Ubud falls.",
        inclusions: "Entry fee, Trek guide, Towels",
        ticketPerPerson: 900,
        pax: 2,
        guideCharges: 1600,
        transportCharges: 1500,
      }),
      makeActivity({
        id: SAMPLE_IDS.uluwatu,
        name: "Uluwatu Temple & Kecak Fire Dance",
        location: "Pecatu, South Kuta",
        date: d(4),
        startTime: "15:30",
        endTime: "19:30",
        description:
          "Clifftop temple at golden hour, then reserved seating for the Kecak performance as the sun drops behind the Indian Ocean.",
        inclusions: "Temple entry, Sarong hire, Reserved dance seating",
        ticketPerPerson: 1450,
        pax: 2,
        guideCharges: 2000,
        transportCharges: 2600,
      }),
    ],
    days: [
      makeDay({
        date: start,
        title: "Departure from Mumbai",
        summary: "An evening departure with an overnight flight to Singapore.",
        overnightAt: "In flight",
        meals: { breakfast: false, lunch: false, dinner: false },
        items: [
          makeDayItem({
            kind: "transfer",
            time: "20:00",
            title: "Private transfer to Mumbai T2",
            location: "Bandra West → CSMIA T2",
            description: "Sedan for two guests with luggage assistance.",
          }),
          makeDayItem({
            kind: "departure",
            time: "23:45",
            title: "SQ 421 departs for Singapore",
            location: "Mumbai T2",
            description: "Report at the counter by 20:45 hrs.",
          }),
        ],
      }),
      makeDay({
        date: d(1),
        title: "Arrival in Bali · Ubud",
        summary: "Land at Denpasar, transfer north to the Ubud valley and settle in.",
        overnightAt: "Kayon Jungle Resort, Ubud",
        meals: { breakfast: true, lunch: false, dinner: true },
        items: [
          makeDayItem({
            kind: "arrival",
            time: "13:00",
            title: "Arrive at Denpasar (DPS)",
            location: "Ngurah Rai International",
            description: "Visa-on-arrival counter, then baggage and greeting.",
          }),
          makeDayItem({
            kind: "transfer",
            time: "13:45",
            endTime: "15:15",
            title: "Airport transfer to Ubud",
            location: "DPS → Payangan",
            description: "Private air-conditioned vehicle, roughly 90 minutes.",
          }),
          makeDayItem({
            kind: "checkin",
            time: "15:30",
            title: "Check in at Kayon Jungle Resort",
            location: "Banjar Bresela, Payangan",
          }),
          makeDayItem({
            kind: "freetime",
            time: "16:30",
            endTime: "19:00",
            title: "Afternoon at leisure",
            description: "Pool, valley deck and the resort's afternoon tea service.",
          }),
          makeDayItem({
            kind: "dinner",
            time: "19:30",
            title: "Dinner at the resort restaurant",
          }),
        ],
      }),
      makeDay({
        date: d(2),
        title: "Rice Terraces & Waterfalls",
        summary: "A full day across the Ubud highlands with a private guide.",
        overnightAt: "Kayon Jungle Resort, Ubud",
        meals: { breakfast: true, lunch: true, dinner: false },
        items: [
          makeDayItem({ kind: "breakfast", time: "07:00", title: "Breakfast at the resort" }),
          makeDayItem({
            kind: "sightseeing",
            time: "08:30",
            endTime: "12:00",
            title: "Tegallalang Rice Terraces & Jungle Swing",
            location: "Tegallalang",
          }),
          makeDayItem({
            kind: "lunch",
            time: "12:30",
            title: "Lunch at a terrace warung",
            location: "Tegallalang",
          }),
          makeDayItem({
            kind: "sightseeing",
            time: "14:00",
            endTime: "17:30",
            title: "Tegenungan Waterfall trek",
            location: "Gianyar Regency",
          }),
          makeDayItem({
            kind: "freetime",
            time: "18:30",
            title: "Evening free in Ubud town",
            description: "Optional walk through the Ubud art market.",
          }),
        ],
      }),
      makeDay({
        date: d(3),
        title: "Ubud to Seminyak",
        summary: "A slow morning, then the coastal transfer to Seminyak.",
        overnightAt: "Katamama Suites, Seminyak",
        meals: { breakfast: true, lunch: false, dinner: false },
        items: [
          makeDayItem({ kind: "breakfast", time: "08:00", title: "Breakfast at the resort" }),
          makeDayItem({ kind: "checkout", time: "12:00", title: "Check out of Kayon Jungle Resort" }),
          makeDayItem({
            kind: "transfer",
            time: "12:30",
            endTime: "14:15",
            title: "Private transfer to Seminyak",
            location: "Payangan → Petitenget",
          }),
          makeDayItem({ kind: "checkin", time: "15:00", title: "Check in at Katamama Suites" }),
          makeDayItem({
            id: SAMPLE_IDS.beachSunset,
            kind: "freetime",
            time: "17:00",
            title: "Sunset on Petitenget beach",
            description: "A five-minute walk from the property.",
          }),
        ],
      }),
      makeDay({
        date: d(4),
        title: "Uluwatu & the Kecak Dance",
        summary: "A free morning on the coast and a clifftop evening in the south.",
        overnightAt: "Katamama Suites, Seminyak",
        meals: { breakfast: true, lunch: false, dinner: true },
        items: [
          makeDayItem({ kind: "breakfast", time: "08:30", title: "Breakfast at the hotel" }),
          makeDayItem({
            kind: "freetime",
            time: "10:00",
            endTime: "14:00",
            title: "Morning at leisure in Seminyak",
            description: "Beach clubs, Petitenget boutiques or the hotel spa.",
          }),
          makeDayItem({
            kind: "sightseeing",
            time: "15:30",
            endTime: "19:30",
            title: "Uluwatu Temple & Kecak Fire Dance",
            location: "Pecatu",
          }),
          makeDayItem({
            kind: "dinner",
            time: "20:15",
            title: "Seafood dinner at Jimbaran Bay",
            location: "Jimbaran",
          }),
        ],
      }),
      makeDay({
        date: d(5),
        title: "Departure",
        summary: "A relaxed final morning before the afternoon flight home.",
        overnightAt: "In flight",
        meals: { breakfast: true, lunch: false, dinner: false },
        items: [
          makeDayItem({ kind: "breakfast", time: "08:30", title: "Breakfast at the hotel" }),
          makeDayItem({ kind: "checkout", time: "11:00", title: "Check out of Katamama Suites" }),
          makeDayItem({
            kind: "transfer",
            time: "13:30",
            endTime: "14:20",
            title: "Transfer to Denpasar airport",
            location: "Seminyak → DPS",
          }),
          makeDayItem({
            kind: "departure",
            time: "16:40",
            title: "SQ 943 departs for Singapore",
            location: "Denpasar (DPS)",
            description: "Connecting to SQ 422 for Mumbai.",
          }),
        ],
      }),
    ],
    pricing: {
      ...base.pricing,
      transportation: 18500,
      transportationNote: "Private vehicle with driver for all six days",
      meals: 9600,
      mealsNote: "Two included lunches and one seafood dinner",
      guideCharges: 4500,
      guideChargesNote: "English-speaking guide, full-day rate",
      otherExpenses: [
        makeLineItem({ label: "Indonesia visa on arrival (2 pax)", amount: 8600 }),
        makeLineItem({ label: "Travel insurance (2 pax)", amount: 5400 }),
      ],
      serviceChargeMode: "percent",
      serviceChargeValue: 5,
      discountMode: "flat",
      discountValue: 12000,
      discountLabel: "Early-bird discount",
      taxLabel: "GST",
      taxPercent: 5,
      advancePaid: 100000,
    },
  };
}


/* ----------------------------------------------------------- sample photos */

interface SamplePhoto {
  target: string;
  file: string;
  caption: string;
}

/**
 * Real photographs of the places in the sample trip, served from
 * `public/sample/`. All CC0 or public domain — see `public/sample/CREDITS.md`.
 */
const SAMPLE_PHOTOS: SamplePhoto[] = [
  {
    target: SAMPLE_IDS.terraces,
    file: "/sample/tegallalang.jpg",
    caption: "The terraced valley at Tegallalang",
  },
  {
    target: SAMPLE_IDS.terraces,
    file: "/sample/swing-gorge.jpg",
    caption: "The jungle swing over the gorge",
  },
  {
    target: SAMPLE_IDS.terraces,
    file: "/sample/swing-couple.jpg",
    caption: "Tandem swing above the falls",
  },
  {
    target: SAMPLE_IDS.waterfall,
    file: "/sample/tegenungan.jpg",
    caption: "Tegenungan Waterfall, Gianyar",
  },
  {
    target: SAMPLE_IDS.uluwatu,
    file: "/sample/uluwatu.jpg",
    caption: "Pura Luhur Uluwatu on the cliffs",
  },
  {
    target: SAMPLE_IDS.uluwatu,
    file: "/sample/kecak.jpg",
    caption: "The Kecak fire dance at dusk",
  },
  {
    target: SAMPLE_IDS.beachSunset,
    file: "/sample/beach-dusk.jpg",
    caption: "",
  },
];

/**
 * Loads a bundled photo as an `ItineraryImage`. The files are already sized and
 * compressed for the document, so they are embedded as-is rather than being put
 * back through the upload pipeline — that would re-encode an already-lossy JPEG
 * for no benefit.
 */
async function loadSamplePhoto(spec: SamplePhoto): Promise<ItineraryImage | null> {
  try {
    const res = await fetch(spec.file);
    if (!res.ok) return null;
    const blob = await res.blob();

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("unreadable"));
      reader.readAsDataURL(blob);
    });

    const size = await new Promise<{ width: number; height: number }>((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve({ width: 0, height: 0 });
      img.src = dataUrl;
    });

    return {
      id: uid("img"),
      dataUrl,
      name: spec.file.split("/").pop() ?? "photo.jpg",
      caption: spec.caption,
      ...size,
    };
  } catch {
    return null;
  }
}

/**
 * Returns the sample itinerary with its photos attached. Any photo that fails to
 * load is skipped, so the sample still works offline or with `public/sample/`
 * deleted — it simply arrives without pictures.
 */
export async function attachSamplePhotos(itinerary: Itinerary): Promise<Itinerary> {
  const loaded = await Promise.all(
    SAMPLE_PHOTOS.map(async (spec) => ({
      target: spec.target,
      image: await loadSamplePhoto(spec),
    }))
  );

  const byTarget = new Map<string, ItineraryImage[]>();
  for (const { target, image } of loaded) {
    if (!image) continue;
    byTarget.set(target, [...(byTarget.get(target) ?? []), image]);
  }
  if (byTarget.size === 0) return itinerary;

  return {
    ...itinerary,
    activities: itinerary.activities.map((a) =>
      byTarget.has(a.id) ? { ...a, images: byTarget.get(a.id)! } : a
    ),
    days: itinerary.days.map((d) => ({
      ...d,
      items: d.items.map((i) =>
        byTarget.has(i.id) ? { ...i, images: byTarget.get(i.id)! } : i
      ),
    })),
  };
}
