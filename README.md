# TravelMaxx — Itinerary Builder

A client-side travel itinerary builder and PDF generator for TravelMaxx. An
administrator enters a trip by hand and exports a print-ready, agency-grade PDF —
with **no database, no authentication and no backend API**. Everything lives in
the browser session.

## Your company details

The agency is fixed, not a form field. Everything about TravelMaxx lives in
[`src/lib/brand.ts`](src/lib/brand.ts) — name, tagline, phone, email, website,
address, GSTIN, brand colour and an optional logo. Phone, email, website, address
and GSTIN ship blank so nothing invented appears on a real quotation; fill them in
and they appear on the cover and the closing page. A blank field is simply
omitted.

To use a logo instead of the wordmark, drop a PNG or JPG into `public/brand/` and
set `logoSrc: "/brand/logo.png"`.

## Running it

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build && pnpm start
```

## What it does

**Build** — seven form sections, all with live validation:

| Section | Captures |
| --- | --- |
| Trip & customer | Customer contact details, destination, dates, traveller mix, currency and destination notes |
| Flights | Airline, flight number, aircraft, both airports with terminals, exact dates and times, class, baggage, duration, fare × passengers |
| Hotels | Property, rating, location and address, check-in/out dates and times, nights, room type, room count, meal plan, amenities, rate and extras |
| Activities | Name, location, date, start and end time, description, inclusions, **photos of the place** (up to 6, with captions), tickets, guide and transport charges |
| Day-by-day | One card per travel day with time-stamped items (breakfast, transfers, sightseeing, check-in, free time, dinner, departure…), each addable, editable, reorderable, removable, and each able to carry up to 3 photos |
| Pricing | Auto roll-up of every component plus transportation, meals, guide charges and free-form expenses, then discount → service charge → tax → grand total |
| Notes & terms | Inclusions, exclusions, important notes, terms, payment terms, cancellation policy, closing note |

**Preview** — a live A4 replica renders beside the form as you type (in a sheet on
smaller screens), scaled to fit but pixel-faithful to the printed page.

**Export** — *Preview PDF*, *Download PDF*, *Print*, *Start new itinerary*,
*Clear all*, and *Load sample itinerary*. Export is blocked while any required
field is invalid; the issues dialog lists every problem and links to its section.

## Photos

Sightseeing activities take up to six photos with optional captions; individual
day-by-day stops take up to three. Both render into the PDF — one photo becomes a
wide banner, two or more lay out in a grid three to a row, and captions sit
underneath.

A single photo runs the full width when it is landscape and takes half the width
when it is portrait, so a tall picture is not cropped into a letterbox strip.

Uploads never reach state at full size. `lib/image.ts` decodes each file (applying
EXIF orientation), downscales the longest edge to 1100px, flattens onto white and
re-encodes as a JPEG data URL. That keeps the PDF small and the session draft
inside the browser's storage quota. If the quota is exceeded anyway you get a
warning: the itinerary is still intact in the tab, but a refresh would lose it.

## Sample itineraries

**Load sample itinerary** offers two fully populated demos, both with real
photographs of the places involved:

| Sample | Shape |
| --- | --- |
| India family tour | 10 days, 5 states — Delhi, Uttar Pradesh, Rajasthan, Punjab, Uttarakhand — for 4 adults and 3 children, in INR. Three flight sectors, five hotels, an overnight train, and child-aware ticketing (ASI monuments are free under 15, so those activities are costed for the adults only). |
| Bali escape | 6 days international for 2 adults — the smaller, simpler case. |

Photos live in `public/sample/` and `public/sample/india/`. Every one is CC0 or
public domain; sources are listed in `public/sample/CREDITS.md`. Delete a folder
and that sample simply loads without pictures.

The Amritsar activity deliberately ships without a photo — no modern image of the
Golden Temple on Wikimedia Commons is CC0 or public domain, and the ShareAlike
alternatives carry attribution duties best kept out of a document you send to
clients.

Samples are registered in [`src/lib/samples/index.ts`](src/lib/samples/index.ts);
add another by writing a builder and listing it there.

## How the pricing is calculated

Shown step by step in the sidebar so every figure can be checked:

```
flights      = Σ (fare per traveller × passengers)
hotels       = Σ (rate per night × nights × rooms + extra charges)
activities   = Σ (tickets per person × pax + guide + transport)
extras       = transportation + meals + guide charges + other expenses

subtotal        = flights + hotels + activities + extras
discount        = flat amount, or a % of the subtotal   (clamped to [0, subtotal])
after discount  = subtotal − discount
service charge  = flat amount, or a % of "after discount"
taxable base    = after discount + service charge
tax             = taxable base × tax %
grand total     = taxable base + tax            (optionally rounded)
per person      = grand total ÷ (adults + children)
balance due     = grand total − advance paid
```

Nights and flight durations derive from the dates and times entered; nights can be
overridden per hotel.

## Architecture

```
src/
  lib/
    brand.ts            your company details — edit this one
    types.ts            domain model
    defaults.ts         factories for every entity
    format.ts           date, time, money and duration formatting
    pricing.ts          per-item maths and the pricing roll-up
    validation.ts       every rule, as errors (block export) or warnings
    document-model.ts   one presentation-ready view both renderers read
    color.ts            brand-colour tints (the PDF has no color-mix())
    image.ts            upload decode, downscale and re-encode
    samples/            the demo itineraries and their photo manifests
  store/
    itinerary-store.tsx  useReducer + context; ~40 typed actions
  components/
    forms/               reusable fields, the repeatable-card shell, image uploader
    preview/             the A4 HTML document (live preview and print)
    pdf/                 the @react-pdf/renderer document
    layout/              toolbar and the builder shell
```

`document-model.ts` is the seam that matters: the on-screen preview and the PDF are
two renderers over one derived model, so they cannot drift apart.

### PDF generation

`@react-pdf/renderer` produces a real vector PDF in the browser — selectable text,
true page breaks, and repeating headers and footers with page numbers. Both the
engine and the document component are imported lazily, so the PDF bundle only loads
when an export is requested.

Inter and Playfair Display ship as TTFs in `public/fonts/` and are registered at
export time. The built-in PDF fonts are Latin-1 only and cannot render `₹`, `★` or
`✓`; bundling the faces also keeps exports working offline.

Two react-pdf browser-build quirks are worked around in `itinerary-pdf.tsx`:
`bottom` does not resolve on absolutely positioned page children (the footer is
placed with a computed `top`), and glyphs outside the registered faces render blank
(the flight direction marker is drawn as SVG).

### Page breaks

A day's header, summary and first stop render inside one `wrap={false}` group so
a day title can never be stranded at the foot of a page with its schedule
overleaf; the remaining stops follow in a second timeline container that uses
`paddingTop` rather than `marginTop`, keeping the timeline rule unbroken across
the join. react-pdf's own `minPresenceAhead` is a no-op in the browser build, so
it cannot be relied on for this.

### Vertical rhythm

Every gap in the PDF comes from the `SP` scale and every text role declares an
explicit `LH` line height, both at the top of `itinerary-pdf.tsx`. This is
deliberate: react-pdf cascades `lineHeight` from the page, so display type that
does not opt out ends up with body leading — which is what previously let section
titles collide with their own underline and stacked stat labels over their figures.
Add spacing by reaching for `SP`, not a fresh magic number.

### Storage

State lives in React. It is mirrored to `sessionStorage` purely so an accidental
refresh does not lose the work — it is not a database, it is never sent anywhere,
and it is wiped by *Start new itinerary* and *Clear all* and by closing the tab.

## Stack

Next.js 16 (App Router, static) · React 19 · TypeScript · Tailwind CSS v4 ·
shadcn/ui · @react-pdf/renderer · pnpm
