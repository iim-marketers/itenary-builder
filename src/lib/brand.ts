/**
 * The agency this builder produces itineraries for.
 *
 * This is the single place to edit your company details — they appear on the
 * PDF cover, the running footer and the closing page. Leave a field blank and
 * it is simply omitted from the document.
 */
export const BRAND = {
  name: "TravelMaxx",
  tagline: "Crafted journeys, handled end to end",

  /* Contact block — shown on the cover and the closing page. */
  phone: "",
  email: "",
  website: "",
  address: "",
  gstin: "",

  /** Drives the cover band, section rules and the pricing summary. */
  color: "#0F5257",

  /**
   * Optional logo shown on the cover instead of the wordmark. Drop a PNG or
   * JPG into `public/brand/` and point at it, e.g. "/brand/logo.png".
   */
  logoSrc: null as string | null,
} as const;
