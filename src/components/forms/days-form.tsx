"use client";

import * as React from "react";
import {
  ArrowDownWideNarrow,
  CalendarRange,
  Clock,
  Copy,
  MoveDown,
  MoveUp,
  Plus,
  Trash2,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  FieldGrid,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/forms/fields";
import { ImageUploader } from "@/components/forms/image-uploader";
import {
  EmptyState,
  IconAction,
  RepeatableCard,
  SectionHead,
  SubHeading,
} from "@/components/forms/section-shell";
import { DAY_ITEM_KINDS, formatDate, formatTime, isValidTime } from "@/lib/format";
import { useItinerary } from "@/store/itinerary-store";
import type { DayItem, DayItemKind, ItineraryDay } from "@/lib/types";
import { cn } from "@/lib/utils";

const KIND_OPTIONS = DAY_ITEM_KINDS.map((k) => ({
  value: k.value,
  label: `${k.icon}  ${k.label}`,
}));

/** Quick-add presets so a typical day can be assembled in a few clicks. */
const QUICK_ADD: { kind: DayItemKind; title: string; time: string }[] = [
  { kind: "breakfast", title: "Breakfast at the hotel", time: "08:00" },
  { kind: "transfer", title: "Private transfer", time: "09:30" },
  { kind: "sightseeing", title: "Sightseeing", time: "10:00" },
  { kind: "lunch", title: "Lunch", time: "13:00" },
  { kind: "checkin", title: "Hotel check-in", time: "15:00" },
  { kind: "freetime", title: "Time at leisure", time: "17:00" },
  { kind: "dinner", title: "Dinner", time: "20:00" },
];

export function DaysForm() {
  const { itinerary, dispatch } = useItinerary();
  const { days, trip } = itinerary;

  const canGenerate = Boolean(trip.startDate && trip.endDate);

  const generate = () => {
    const before = days.length;
    dispatch({ type: "day/generate" });
    toast.success(
      before === 0
        ? "Days created from the trip dates."
        : "Days synced with the trip dates — existing days were kept."
    );
  };

  return (
    <div className="space-y-4">
      <SectionHead
        title="Day-by-day itinerary"
        description="Build each travel day, then add time-stamped moments in the order they happen."
        count={days.length}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!canGenerate}
              onClick={generate}
              title={
                canGenerate
                  ? "Create one day per date of the trip"
                  : "Set the trip start and end dates first"
              }
            >
              <Wand2 className="size-4" />
              Generate from dates
            </Button>
            {days.length > 1 ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  dispatch({ type: "day/sort" });
                  toast.success("Days sorted by date.");
                }}
              >
                <ArrowDownWideNarrow className="size-4" />
                Sort by date
              </Button>
            ) : null}
            <Button size="sm" onClick={() => dispatch({ type: "day/add" })}>
              <Plus className="size-4" />
              Add day
            </Button>
          </div>
        }
      />

      {days.length === 0 ? (
        <EmptyState
          icon={CalendarRange}
          title="No days planned yet"
          description="Generate one day per date from the trip dates, or add days one at a time and fill in each schedule."
          actionLabel={canGenerate ? "Generate days from trip dates" : "Add the first day"}
          onAction={canGenerate ? generate : () => dispatch({ type: "day/add" })}
        />
      ) : (
        <div className="space-y-3">
          {days.map((day, i) => (
            <DayCard key={day.id} day={day} index={i} total={days.length} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ DayCard */

function DayCard({
  day,
  index,
  total,
}: {
  day: ItineraryDay;
  index: number;
  total: number;
}) {
  const { dispatch } = useItinerary();

  const patchDay = (patch: Partial<ItineraryDay>) =>
    dispatch({ type: "day/patch", id: day.id, patch });

  const addItem = (item?: Partial<DayItem>) =>
    dispatch({ type: "dayItem/add", dayId: day.id, item });

  const outOfOrder = React.useMemo(() => {
    const times = day.items.map((i) => i.time).filter(isValidTime);
    return times.some((t, i) => i > 0 && t < times[i - 1]);
  }, [day.items]);

  return (
    <RepeatableCard
      index={index}
      total={total}
      eyebrow={`Day ${index + 1}`}
      title={day.title || (day.date ? formatDate(day.date, "long") : "Untitled day")}
      subtitle={
        day.date
          ? `${formatDate(day.date, "dayLong")} · ${day.items.length} ${
              day.items.length === 1 ? "item" : "items"
            }`
          : "Set the date below"
      }
      meta={
        day.overnightAt ? (
          <Badge variant="outline" className="max-w-[14rem] truncate">
            {day.overnightAt}
          </Badge>
        ) : null
      }
      onMove={(delta) => dispatch({ type: "day/move", id: day.id, delta })}
      onDuplicate={() => dispatch({ type: "day/duplicate", id: day.id })}
      onRemove={() => dispatch({ type: "day/remove", id: day.id })}
    >
      <FieldGrid cols={3}>
        <TextField
          label="Date"
          type="date"
          required
          value={day.date}
          onValueChange={(v) => patchDay({ date: v })}
        />
        <TextField
          label="Day title"
          placeholder="Arrival in Bali · Ubud"
          value={day.title}
          onValueChange={(v) => patchDay({ title: v })}
        />
        <TextField
          label="Overnight at"
          placeholder="Kayon Jungle Resort, Ubud"
          value={day.overnightAt}
          onValueChange={(v) => patchDay({ overnightAt: v })}
        />
      </FieldGrid>

      <TextAreaField
        label="Day summary"
        rows={2}
        placeholder="One line describing the shape of the day."
        value={day.summary}
        onValueChange={(v) => patchDay({ summary: v })}
      />

      <div className="flex flex-wrap items-center gap-4">
        <SubHeading>Meals included</SubHeading>
        {(["breakfast", "lunch", "dinner"] as const).map((meal) => (
          <label
            key={meal}
            className="flex cursor-pointer items-center gap-2 text-sm capitalize"
          >
            <Checkbox
              checked={day.meals[meal]}
              onCheckedChange={(checked) =>
                patchDay({ meals: { ...day.meals, [meal]: checked === true } })
              }
            />
            {meal}
          </label>
        ))}
      </div>

      <Separator />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SubHeading>Schedule</SubHeading>
          <Badge variant="secondary" className="tabular-nums">
            {day.items.length}
          </Badge>
          {outOfOrder ? (
            <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400">
              Times out of order
            </Badge>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {day.items.length > 1 ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => dispatch({ type: "dayItem/sort", dayId: day.id })}
            >
              <Clock className="size-4" />
              Sort by time
            </Button>
          ) : null}
          <Button size="sm" variant="outline" onClick={() => addItem()}>
            <Plus className="size-4" />
            Add item
          </Button>
        </div>
      </div>

      {day.items.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-background p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Nothing scheduled yet. Start from a common moment:
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {QUICK_ADD.map((q) => (
              <Button
                key={q.kind + q.title}
                size="sm"
                variant="secondary"
                onClick={() => addItem(q)}
              >
                {DAY_ITEM_KINDS.find((k) => k.value === q.kind)?.icon} {q.title}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {day.items.map((item, j) => (
            <DayItemRow
              key={item.id}
              dayId={day.id}
              item={item}
              index={j}
              total={day.items.length}
            />
          ))}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {QUICK_ADD.map((q) => (
              <Button
                key={q.kind + q.title}
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => addItem(q)}
              >
                <Plus className="size-3" />
                {q.title}
              </Button>
            ))}
          </div>
        </div>
      )}
    </RepeatableCard>
  );
}

/* -------------------------------------------------------------- DayItemRow */

function DayItemRow({
  dayId,
  item,
  index,
  total,
}: {
  dayId: string;
  item: DayItem;
  index: number;
  total: number;
}) {
  const { dispatch } = useItinerary();
  const [open, setOpen] = React.useState(!item.title);

  const patch = (p: Partial<DayItem>) =>
    dispatch({ type: "dayItem/patch", dayId, id: item.id, patch: p });

  const icon = DAY_ITEM_KINDS.find((k) => k.value === item.kind)?.icon ?? "•";
  const kindLabel =
    DAY_ITEM_KINDS.find((k) => k.value === item.kind)?.label ?? "Other";

  return (
    <div className="rounded-lg border bg-background">
      <div className="flex items-center gap-2 p-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-expanded={open}
        >
          <span
            className={cn(
              "w-16 shrink-0 text-right text-xs font-semibold tabular-nums",
              isValidTime(item.time) ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {isValidTime(item.time) ? formatTime(item.time) : "--:--"}
          </span>
          <span className="text-base leading-none">{icon}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">
              {item.title || kindLabel}
            </span>
            {item.location ? (
              <span className="block truncate text-xs text-muted-foreground">
                {item.location}
              </span>
            ) : null}
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-0.5">
          <IconAction
            label="Move up"
            icon={MoveUp}
            disabled={index === 0}
            onClick={() => dispatch({ type: "dayItem/move", dayId, id: item.id, delta: -1 })}
          />
          <IconAction
            label="Move down"
            icon={MoveDown}
            disabled={index === total - 1}
            onClick={() => dispatch({ type: "dayItem/move", dayId, id: item.id, delta: 1 })}
          />
          <IconAction
            label="Duplicate"
            icon={Copy}
            onClick={() => dispatch({ type: "dayItem/duplicate", dayId, id: item.id })}
          />
          <IconAction
            label="Delete"
            icon={Trash2}
            destructive
            onClick={() => dispatch({ type: "dayItem/remove", dayId, id: item.id })}
          />
        </div>
      </div>

      {open ? (
        <div className="space-y-3 border-t bg-muted/30 p-3">
          <FieldGrid cols={4}>
            <SelectField
              label="Type"
              value={item.kind}
              onValueChange={(v) => patch({ kind: v as DayItemKind })}
              options={KIND_OPTIONS}
            />
            <TextField
              label="Start time"
              type="time"
              required
              value={item.time}
              onValueChange={(v) => patch({ time: v })}
            />
            <TextField
              label="End time"
              type="time"
              value={item.endTime}
              onValueChange={(v) => patch({ endTime: v })}
            />
            <TextField
              label="Location"
              placeholder="Tegallalang"
              value={item.location}
              onValueChange={(v) => patch({ location: v })}
            />
          </FieldGrid>
          <TextField
            label="Title"
            required
            placeholder="Tegallalang Rice Terraces & Jungle Swing"
            value={item.title}
            onValueChange={(v) => patch({ title: v })}
          />
          <TextAreaField
            label="Description"
            rows={2}
            placeholder="Optional detail shown under the item in the PDF."
            value={item.description}
            onValueChange={(v) => patch({ description: v })}
          />
          <ImageUploader
            label="Photos"
            images={item.images}
            max={3}
            compact
            captions={false}
            hint="Photos for this stop — shown with it in the day-by-day pages."
            onChange={(images) => patch({ images })}
          />
        </div>
      ) : null}
    </div>
  );
}

