import { uid } from "./defaults";
import type { ItineraryImage } from "./types";

/** Longest edge, in pixels, that an uploaded photo is downscaled to. */
const MAX_EDGE = 1100;
/** JPEG quality for the re-encoded photo. */
const QUALITY = 0.74;
/** Guard on the *original* file, before downscaling. */
export const MAX_UPLOAD_BYTES = 12_000_000;

export const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/webp";

const IMAGE_TYPE_RE = /^image\/(png|jpe?g|webp)$/i;

export function isAcceptedImage(file: File): boolean {
  return IMAGE_TYPE_RE.test(file.type);
}

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  // `createImageBitmap` applies EXIF orientation for us where it is supported.
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Fall through to the <img> path below.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("The image could not be decoded."));
      img.src = url;
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

/**
 * Decodes an uploaded photo, downscales it and re-encodes it as a JPEG data
 * URL. Photos are embedded straight into the PDF and mirrored into
 * sessionStorage, so keeping them small matters more than keeping them pristine.
 */
export async function processImageFile(file: File): Promise<ItineraryImage> {
  if (!isAcceptedImage(file)) {
    throw new Error(`“${file.name}” is not a PNG, JPG or WebP image.`);
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`“${file.name}” is larger than 12 MB.`);
  }

  const source = await decode(file);
  const sw = "width" in source ? source.width : 0;
  const sh = "height" in source ? source.height : 0;
  if (!sw || !sh) throw new Error(`“${file.name}” has no readable dimensions.`);

  const scale = Math.min(1, MAX_EDGE / Math.max(sw, sh));
  const width = Math.max(1, Math.round(sw * scale));
  const height = Math.max(1, Math.round(sh * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser cannot process images.");

  // JPEG has no alpha, so flatten onto white rather than onto black.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(source as CanvasImageSource, 0, 0, width, height);
  if ("close" in source) source.close();

  return {
    id: uid("img"),
    dataUrl: canvas.toDataURL("image/jpeg", QUALITY),
    name: file.name,
    width,
    height,
    caption: "",
  };
}

/** Rough byte size of a data URL, for the storage-budget hint. */
export function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return 0;
  return Math.round(((dataUrl.length - comma - 1) * 3) / 4);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Splits a list into rows of `size` — used to lay photos out in grids. */
export function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}
