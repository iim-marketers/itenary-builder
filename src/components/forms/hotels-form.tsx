"use client";

import { Hotel as HotelIcon, Plus, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  FieldGrid,
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/forms/fields";
import {
  EmptyState,
  RepeatableCard,
  SectionHead,
  SubHeading,
} from "@/components/forms/section-shell";
import { currencySymbol, daysBetween, formatMoney, pluralise } from "@/lib/format";
import { hotelNights, hotelTotal } from "@/lib/pricing";
import { useItinerary } from "@/store/itinerary-store";
import type { Hotel } from "@/lib/types";

const MEAL_PLANS = [
  "Room only",
  "Breakfast included",
  "Breakfast & dinner",
  "Half board",
  "Full board",
  "All inclusive",
].map((v) => ({ value: v, label: v }));

const RATINGS = ["5", "4", "3", "2", "1", "0"].map((v) => ({
  value: v,
  label: v === "0" ? "Unrated" : `${v} star`,
}));

export function HotelsForm() {
  const { itinerary, dispatch } = useItinerary();
  const { hotels, trip } = itinerary;
  const symbol = currencySymbol(trip.currency);

  const patch = (id: string, p: Partial<Hotel>) =>
    dispatch({ type: "hotel/patch", id, patch: p });

  const total = hotels.reduce((s, h) => s + hotelTotal(h), 0);

  return (
    <div className="space-y-4">
      <SectionHead
        title="Hotels"
        description="Each stay with its dates, room configuration and nightly rate."
        count={hotels.length}
        action={
          <div className="flex items-center gap-3">
            {hotels.length > 0 ? (
              <span className="text-sm text-muted-foreground">
                Total{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {formatMoney(total, trip.currency)}
                </span>
              </span>
            ) : null}
            <Button size="sm" onClick={() => dispatch({ type: "hotel/add" })}>
              <Plus className="size-4" />
              Add hotel
            </Button>
          </div>
        }
      />

      {hotels.length === 0 ? (
        <EmptyState
          icon={HotelIcon}
          title="No hotels added"
          description="Add each property with check-in and check-out details. Nights and the stay total are calculated from the dates."
          actionLabel="Add the first hotel"
          onAction={() => dispatch({ type: "hotel/add" })}
        />
      ) : (
        <div className="space-y-3">
          {hotels.map((h, i) => {
            const derived = daysBetween(h.checkInDate, h.checkOutDate);
            const nights = hotelNights(h);
            const line = hotelTotal(h);
            const rooms = Math.max(1, h.rooms || 1);
            return (
              <RepeatableCard
                key={h.id}
                index={i}
                total={hotels.length}
                eyebrow={`Stay ${i + 1}`}
                title={h.name || "Untitled hotel"}
                subtitle={
                  h.location || h.address
                    ? `${h.location || h.address} · ${pluralise(nights, "night")}`
                    : "Set the location below"
                }
                meta={
                  <Badge variant="outline" className="tabular-nums">
                    {formatMoney(line, trip.currency)}
                  </Badge>
                }
                onMove={(delta) => dispatch({ type: "hotel/move", id: h.id, delta })}
                onDuplicate={() => dispatch({ type: "hotel/duplicate", id: h.id })}
                onRemove={() => dispatch({ type: "hotel/remove", id: h.id })}
              >
                <FieldGrid cols={3}>
                  <TextField
                    label="Hotel name"
                    required
                    placeholder="Kayon Jungle Resort"
                    value={h.name}
                    onValueChange={(v) => patch(h.id, { name: v })}
                  />
                  <TextField
                    label="Location / area"
                    required
                    placeholder="Ubud, Gianyar"
                    value={h.location}
                    onValueChange={(v) => patch(h.id, { location: v })}
                  />
                  <SelectField
                    label="Star rating"
                    value={h.rating}
                    onValueChange={(v) => patch(h.id, { rating: v })}
                    options={RATINGS}
                  />
                </FieldGrid>

                <TextAreaField
                  label="Full address"
                  rows={2}
                  placeholder="Street, area, city, postal code"
                  value={h.address}
                  onValueChange={(v) => patch(h.id, { address: v })}
                />

                <Separator />

                <SubHeading>Stay dates</SubHeading>
                <FieldGrid cols={4}>
                  <TextField
                    label="Check-in date"
                    type="date"
                    required
                    value={h.checkInDate}
                    onValueChange={(v) => patch(h.id, { checkInDate: v })}
                  />
                  <TextField
                    label="Check-in time"
                    type="time"
                    required
                    value={h.checkInTime}
                    onValueChange={(v) => patch(h.id, { checkInTime: v })}
                  />
                  <TextField
                    label="Check-out date"
                    type="date"
                    required
                    value={h.checkOutDate}
                    onValueChange={(v) => patch(h.id, { checkOutDate: v })}
                  />
                  <TextField
                    label="Check-out time"
                    type="time"
                    required
                    value={h.checkOutTime}
                    onValueChange={(v) => patch(h.id, { checkOutTime: v })}
                  />
                </FieldGrid>

                <div className="flex flex-wrap items-end gap-3">
                  <NumberField
                    label="Nights"
                    min={0}
                    wrapperClassName="w-32"
                    value={nights}
                    hint={
                      h.nightsOverride === null
                        ? derived === null
                          ? "Set both dates to calculate."
                          : "Calculated from the dates."
                        : "Manually overridden."
                    }
                    onValueChange={(v) =>
                      patch(h.id, { nightsOverride: Math.max(0, Math.floor(v)) })
                    }
                  />
                  {h.nightsOverride !== null ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="mb-5"
                      onClick={() => patch(h.id, { nightsOverride: null })}
                    >
                      <RotateCcw className="size-4" />
                      Use calculated
                    </Button>
                  ) : null}
                </div>

                <Separator />

                <SubHeading>Room &amp; board</SubHeading>
                <FieldGrid cols={3}>
                  <TextField
                    label="Room type"
                    placeholder="Jungle Pool Villa"
                    value={h.roomType}
                    onValueChange={(v) => patch(h.id, { roomType: v })}
                  />
                  <NumberField
                    label="Number of rooms"
                    min={1}
                    value={h.rooms}
                    onValueChange={(v) => patch(h.id, { rooms: Math.max(1, Math.floor(v)) })}
                  />
                  <SelectField
                    label="Meal plan"
                    value={h.mealPlan}
                    onValueChange={(v) => patch(h.id, { mealPlan: v })}
                    options={MEAL_PLANS}
                  />
                </FieldGrid>

                <FieldGrid cols={2}>
                  <TextAreaField
                    label="Amenities"
                    rows={2}
                    hint="Comma separated — each becomes a chip in the PDF."
                    placeholder="Private pool, Spa access, Wi-Fi"
                    value={h.amenities}
                    onValueChange={(v) => patch(h.id, { amenities: v })}
                  />
                  <TextAreaField
                    label="Notes"
                    rows={2}
                    placeholder="Anything the traveller should know about this stay."
                    value={h.notes}
                    onValueChange={(v) => patch(h.id, { notes: v })}
                  />
                </FieldGrid>

                <Separator />

                <FieldGrid cols={3}>
                  <NumberField
                    label="Rate per room / night"
                    prefix={symbol}
                    min={0}
                    step="0.01"
                    value={h.ratePerNight}
                    onValueChange={(v) => patch(h.id, { ratePerNight: v })}
                  />
                  <NumberField
                    label="Extra charges"
                    prefix={symbol}
                    min={0}
                    step="0.01"
                    hint="Resort fees, levies, early check-in…"
                    value={h.extraCharges}
                    onValueChange={(v) => patch(h.id, { extraCharges: v })}
                  />
                  <div className="grid gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      Stay total
                    </span>
                    <div className="flex h-8 items-center rounded-lg border border-dashed px-2.5 text-sm font-semibold tabular-nums">
                      {formatMoney(line, trip.currency)}
                    </div>
                    <p className="text-[11px] leading-tight text-muted-foreground">
                      {formatMoney(h.ratePerNight, trip.currency)} × {nights} ×{" "}
                      {rooms}
                      {h.extraCharges
                        ? ` + ${formatMoney(h.extraCharges, trip.currency)}`
                        : ""}
                    </p>
                  </div>
                </FieldGrid>
              </RepeatableCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
