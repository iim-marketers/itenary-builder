"use client";

import type { DocModel } from "@/lib/document-model";

/**
 * Renders the itinerary to a PDF blob entirely in the browser. Both
 * `@react-pdf/renderer` and the document component are imported lazily so the
 * (sizeable) PDF engine only loads when the admin actually asks for a PDF.
 */
export async function generatePdfBlob(doc: DocModel): Promise<Blob> {
  const [{ pdf }, { ItineraryPdf }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./itinerary-pdf"),
  ]);
  return pdf(<ItineraryPdf doc={doc} />).toBlob();
}

/** `Bali Escape — Ananya Iyer — Itinerary.pdf` → filesystem-safe. */
export function pdfFileName(doc: DocModel): string {
  const parts = [doc.headline, doc.customer.name, doc.reference].filter(Boolean);
  const base = parts
    .join(" - ")
    .replace(/[\\/:*?"<>|]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return `${base || "Travel itinerary"}.pdf`;
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a moment to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
