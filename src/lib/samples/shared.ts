import { uid } from "@/lib/defaults";
import type { Itinerary, ItineraryImage } from "@/lib/types";

/** One bundled photo, and the activity or day item it belongs to. */
export interface SamplePhoto {
  /** id of the activity or day item this photo attaches to. */
  target: string;
  /** Path under `public/`. */
  file: string;
  caption: string;
}

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
 * Returns the itinerary with its bundled photos attached. Any photo that fails
 * to load is skipped, so a sample still works offline or with `public/sample/`
 * deleted — it simply arrives without pictures.
 */
export async function attachSamplePhotos(
  itinerary: Itinerary,
  photos: SamplePhoto[]
): Promise<Itinerary> {
  const loaded = await Promise.all(
    photos.map(async (spec) => ({
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
