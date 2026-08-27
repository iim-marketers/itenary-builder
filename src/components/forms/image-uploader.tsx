"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ACCEPTED_IMAGE_TYPES,
  dataUrlBytes,
  formatBytes,
  processImageFile,
} from "@/lib/image";
import type { ItineraryImage } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  /** Tolerates `undefined` so a malformed entity degrades instead of crashing. */
  images: ItineraryImage[] | undefined;
  onChange: (images: ItineraryImage[]) => void;
  max?: number;
  label?: string;
  hint?: string;
  captions?: boolean;
  compact?: boolean;
}

/**
 * Adds, captions, reorders and removes photos. Uploads are downscaled and
 * re-encoded before they reach state — see `lib/image.ts`.
 */
export function ImageUploader({
  images: imagesProp,
  onChange,
  max = 6,
  label = "Photos",
  hint,
  captions = true,
  compact = false,
}: ImageUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);

  const images = React.useMemo(() => imagesProp ?? [], [imagesProp]);
  const remaining = max - images.length;
  const totalBytes = images.reduce((n, i) => n + dataUrlBytes(i.dataUrl), 0);

  const addFiles = async (files: File[]) => {
    if (!files.length) return;
    if (remaining <= 0) {
      toast.error(`Up to ${max} photos here — remove one first.`);
      return;
    }
    const accepted = files.slice(0, remaining);
    if (files.length > remaining) {
      toast.warning(`Only the first ${remaining} of ${files.length} photos were added.`);
    }

    setBusy(true);
    const added: ItineraryImage[] = [];
    for (const file of accepted) {
      try {
        added.push(await processImageFile(file));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "That image could not be read.");
      }
    }
    setBusy(false);

    if (added.length) {
      onChange([...images, ...added]);
      toast.success(
        added.length === 1 ? "Photo added." : `${added.length} photos added.`
      );
    }
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    onChange(next);
  };

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
          {images.length > 0 ? (
            <span className="ml-1.5 tabular-nums">
              {images.length}/{max} · {formatBytes(totalBytes)}
            </span>
          ) : null}
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7"
          disabled={busy || remaining <= 0}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <ImagePlus className="size-3.5" />
          )}
          Add photos
        </Button>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void addFiles(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          "rounded-lg border border-dashed bg-background p-2 transition-colors",
          dragging && "border-primary bg-primary/5"
        )}
      >
        {images.length === 0 ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center gap-1 py-4 text-center"
          >
            <ImagePlus className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {hint ?? "Drop photos here, or click to browse. JPG, PNG or WebP."}
            </span>
          </button>
        ) : (
          <div
            className={cn(
              "grid gap-2",
              compact
                ? "grid-cols-2 sm:grid-cols-3"
                : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
            )}
          >
            {images.map((img, i) => (
              <figure
                key={img.id}
                className="group overflow-hidden rounded-md border bg-muted/40"
              >
                <div className="relative aspect-[4/3]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.dataUrl}
                    alt={img.caption || img.name}
                    className="size-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                    <div className="flex gap-0.5">
                      <IconBtn
                        label="Move left"
                        disabled={i === 0}
                        onClick={() => move(i, -1)}
                      >
                        <ChevronLeft className="size-3.5" />
                      </IconBtn>
                      <IconBtn
                        label="Move right"
                        disabled={i === images.length - 1}
                        onClick={() => move(i, 1)}
                      >
                        <ChevronRight className="size-3.5" />
                      </IconBtn>
                    </div>
                    <IconBtn
                      label="Remove photo"
                      onClick={() => onChange(images.filter((x) => x.id !== img.id))}
                    >
                      <Trash2 className="size-3.5" />
                    </IconBtn>
                  </div>
                </div>
                {captions ? (
                  <figcaption className="p-1">
                    <Input
                      aria-label={`Caption for ${img.name}`}
                      placeholder="Caption (optional)"
                      className="h-7 border-0 bg-transparent px-1 text-xs shadow-none focus-visible:ring-0"
                      value={img.caption}
                      onChange={(e) =>
                        onChange(
                          images.map((x) =>
                            x.id === img.id ? { ...x, caption: e.target.value } : x
                          )
                        )
                      }
                    />
                  </figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_IMAGE_TYPES}
        className="hidden"
        onChange={(e) => {
          void addFiles(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="rounded bg-black/55 p-1 text-white transition-colors hover:bg-black/80 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
