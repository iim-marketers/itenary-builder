/** Small colour helpers — the PDF renderer has no `color-mix()`. */

function clamp(n: number): number {
  return Math.min(255, Math.max(0, Math.round(n)));
}

export function parseHex(hex: string): [number, number, number] {
  const raw = (hex ?? "").trim().replace(/^#/, "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  if (!/^[0-9a-f]{6}$/i.test(full)) return [15, 82, 87]; // fall back to the default brand
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

export function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((c) => clamp(c).toString(16).padStart(2, "0")).join("")}`;
}

/** Mixes `hex` with white. `amount` is how much of the original colour to keep. */
export function tint(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex);
  const t = Math.min(1, Math.max(0, amount));
  return toHex([
    r * t + 255 * (1 - t),
    g * t + 255 * (1 - t),
    b * t + 255 * (1 - t),
  ]);
}

/** Darkens `hex` towards black by `amount`. */
export function shade(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex);
  const t = Math.min(1, Math.max(0, amount));
  return toHex([r * (1 - t), g * (1 - t), b * (1 - t)]);
}

/** Returns near-white or near-black, whichever reads better on `hex`. */
export function onColor(hex: string): string {
  const [r, g, b] = parseHex(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#16211F" : "#FFFFFF";
}

/** Normalises any user input to a `#rrggbb` string the PDF renderer accepts. */
export function safeHex(hex: string): string {
  return toHex(parseHex(hex));
}
