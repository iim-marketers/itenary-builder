"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ItineraryDocument } from "@/components/preview/itinerary-document";
import type { DocModel } from "@/lib/document-model";
import { cn } from "@/lib/utils";

const PAGE_WIDTH = 794; // A4 at 96dpi

/**
 * Renders the document at its true A4 width and scales it down to fit the
 * available space, so the preview is pixel-faithful to the printed page.
 */
export function PreviewPanel({
  doc,
  className,
  maxScale = 1,
}: {
  doc: DocModel;
  className?: string;
  maxScale?: number;
}) {
  const outerRef = React.useRef<HTMLDivElement>(null);
  const innerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0.6);
  const [height, setHeight] = React.useState(0);

  React.useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      if (width > 0) setScale(Math.min(maxScale, width / PAGE_WIDTH));
    });
    observer.observe(outer);
    return () => observer.disconnect();
  }, [maxScale]);

  // Track the unscaled document height so the scaled wrapper reserves the
  // right amount of room and the scroll container behaves.
  React.useLayoutEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;
    const observer = new ResizeObserver(([entry]) => {
      setHeight(entry.contentRect.height);
    });
    observer.observe(inner);
    return () => observer.disconnect();
  });

  return (
    <div ref={outerRef} className={cn("w-full overflow-hidden", className)}>
      <div style={{ height: height * scale }}>
        <div
          ref={innerRef}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            width: PAGE_WIDTH,
          }}
          className="shadow-sm ring-1 ring-black/5"
        >
          <ItineraryDocument doc={doc} />
        </div>
      </div>
    </div>
  );
}

/**
 * The off-screen copy the browser prints. Rendered through a portal so it is a
 * sibling of the app root — the print stylesheet then hides every other body
 * child and lets this one flow normally onto the page.
 */
export function PrintRoot({ doc }: { doc: DocModel }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div id="print-root" aria-hidden>
      <ItineraryDocument doc={doc} />
    </div>,
    document.body
  );
}
