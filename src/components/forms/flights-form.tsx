"use client";

import { Plane, Plus } from "lucide-react";
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
import { currencySymbol, formatDuration, formatMoney } from "@/lib/format";
import { flightDurationMinutes, flightTotal } from "@/lib/pricing";
import { useItinerary } from "@/store/itinerary-store";
import type { Flight } from "@/lib/types";

const TRAVEL_CLASSES = [
  "Economy",
  "Premium Economy",
  "Business",
  "First",
].map((v) => ({ value: v, label: v }));

export function FlightsForm() {
  const { itinerary, dispatch } = useItinerary();
  const { flights, trip } = itinerary;
  const symbol = currencySymbol(trip.currency);

  const patch = (id: string, p: Partial<Flight>) =>
    dispatch({ type: "flight/patch", id, patch: p });

  const total = flights.reduce((s, f) => s + flightTotal(f), 0);

  return (
    <div className="space-y-4">
      <SectionHead
        title="Flights"
        description="Every sector of the journey, in the order the travellers will fly them."
        count={flights.length}
        action={
          <div className="flex items-center gap-3">
            {flights.length > 0 ? (
              <span className="text-sm text-muted-foreground">
                Total{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {formatMoney(total, trip.currency)}
                </span>
              </span>
            ) : null}
            <Button size="sm" onClick={() => dispatch({ type: "flight/add" })}>
              <Plus className="size-4" />
              Add flight
            </Button>
          </div>
        }
      />

      {flights.length === 0 ? (
        <EmptyState
          icon={Plane}
          title="No flights added"
          description="Add each leg with its airline, timings, terminals and fare. The duration and line total are calculated for you."
          actionLabel="Add the first flight"
          onAction={() => dispatch({ type: "flight/add" })}
        />
      ) : (
        <div className="space-y-3">
          {flights.map((f, i) => {
            const mins = flightDurationMinutes(f);
            const line = flightTotal(f);
            return (
              <RepeatableCard
                key={f.id}
                index={i}
                total={flights.length}
                eyebrow={`Sector ${i + 1}`}
                title={
                  [f.airline, f.flightNumber].filter(Boolean).join(" ") ||
                  "Untitled flight"
                }
                subtitle={
                  f.departureAirport || f.arrivalAirport
                    ? `${f.departureAirport || "—"} → ${f.arrivalAirport || "—"}`
                    : "Set the route below"
                }
                meta={
                  <Badge variant="outline" className="tabular-nums">
                    {formatMoney(line, trip.currency)}
                  </Badge>
                }
                onMove={(delta) => dispatch({ type: "flight/move", id: f.id, delta })}
                onDuplicate={() => dispatch({ type: "flight/duplicate", id: f.id })}
                onRemove={() => dispatch({ type: "flight/remove", id: f.id })}
              >
                <FieldGrid cols={3}>
                  <TextField
                    label="Airline"
                    required
                    placeholder="Singapore Airlines"
                    value={f.airline}
                    onValueChange={(v) => patch(f.id, { airline: v })}
                  />
                  <TextField
                    label="Flight number"
                    required
                    placeholder="SQ 421"
                    value={f.flightNumber}
                    onValueChange={(v) => patch(f.id, { flightNumber: v })}
                  />
                  <TextField
                    label="Aircraft"
                    placeholder="Boeing 787-10"
                    value={f.aircraft}
                    onValueChange={(v) => patch(f.id, { aircraft: v })}
                  />
                </FieldGrid>

                <Separator />

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-3">
                    <SubHeading>Departure</SubHeading>
                    <FieldGrid cols={2}>
                      <TextField
                        label="Airport / code"
                        required
                        placeholder="BOM"
                        value={f.departureAirport}
                        onValueChange={(v) => patch(f.id, { departureAirport: v })}
                      />
                      <TextField
                        label="City"
                        placeholder="Mumbai"
                        value={f.departureCity}
                        onValueChange={(v) => patch(f.id, { departureCity: v })}
                      />
                      <TextField
                        label="Terminal"
                        placeholder="T2"
                        value={f.departureTerminal}
                        onValueChange={(v) => patch(f.id, { departureTerminal: v })}
                      />
                      <TextField
                        label="Date"
                        type="date"
                        required
                        value={f.departureDate}
                        onValueChange={(v) => patch(f.id, { departureDate: v })}
                      />
                      <TextField
                        label="Time"
                        type="time"
                        required
                        wrapperClassName="sm:col-span-2"
                        value={f.departureTime}
                        onValueChange={(v) => patch(f.id, { departureTime: v })}
                      />
                    </FieldGrid>
                  </div>

                  <div className="space-y-3">
                    <SubHeading>Arrival</SubHeading>
                    <FieldGrid cols={2}>
                      <TextField
                        label="Airport / code"
                        required
                        placeholder="SIN"
                        value={f.arrivalAirport}
                        onValueChange={(v) => patch(f.id, { arrivalAirport: v })}
                      />
                      <TextField
                        label="City"
                        placeholder="Singapore"
                        value={f.arrivalCity}
                        onValueChange={(v) => patch(f.id, { arrivalCity: v })}
                      />
                      <TextField
                        label="Terminal"
                        placeholder="T3"
                        value={f.arrivalTerminal}
                        onValueChange={(v) => patch(f.id, { arrivalTerminal: v })}
                      />
                      <TextField
                        label="Date"
                        type="date"
                        required
                        value={f.arrivalDate}
                        onValueChange={(v) => patch(f.id, { arrivalDate: v })}
                      />
                      <TextField
                        label="Time"
                        type="time"
                        required
                        wrapperClassName="sm:col-span-2"
                        value={f.arrivalTime}
                        onValueChange={(v) => patch(f.id, { arrivalTime: v })}
                      />
                    </FieldGrid>
                  </div>
                </div>

                <Separator />

                <FieldGrid cols={4}>
                  <SelectField
                    label="Travel class"
                    value={f.travelClass}
                    onValueChange={(v) => patch(f.id, { travelClass: v })}
                    options={TRAVEL_CLASSES}
                  />
                  <TextField
                    label="Check-in baggage"
                    placeholder="30 kg"
                    value={f.baggageCheckIn}
                    onValueChange={(v) => patch(f.id, { baggageCheckIn: v })}
                  />
                  <TextField
                    label="Cabin baggage"
                    placeholder="7 kg"
                    value={f.baggageCabin}
                    onValueChange={(v) => patch(f.id, { baggageCabin: v })}
                  />
                  <TextField
                    label="Duration"
                    placeholder={mins !== null ? formatDuration(mins) : "e.g. 5h 25m"}
                    hint={
                      mins !== null
                        ? `Calculated: ${formatDuration(mins)}. Leave blank to use it.`
                        : "Set both date/time pairs to calculate this."
                    }
                    value={f.durationOverride}
                    onValueChange={(v) => patch(f.id, { durationOverride: v })}
                  />
                </FieldGrid>

                <Separator />

                <FieldGrid cols={3}>
                  <NumberField
                    label="Fare per traveller"
                    prefix={symbol}
                    min={0}
                    step="0.01"
                    value={f.farePerPax}
                    onValueChange={(v) => patch(f.id, { farePerPax: v })}
                  />
                  <NumberField
                    label="Passengers"
                    min={1}
                    value={f.pax}
                    onValueChange={(v) => patch(f.id, { pax: Math.max(1, Math.floor(v)) })}
                  />
                  <div className="grid content-start gap-1.5">
                    <span className="text-xs leading-none font-medium text-muted-foreground">
                      Sector total
                    </span>
                    <div className="flex h-8 items-center rounded-lg border border-dashed px-2.5 text-sm font-semibold tabular-nums">
                      {formatMoney(line, trip.currency)}
                    </div>
                    <p className="text-[11px] leading-tight text-muted-foreground">
                      {f.pax} × {formatMoney(f.farePerPax, trip.currency)}
                    </p>
                  </div>
                </FieldGrid>

                <TextAreaField
                  label="Notes"
                  rows={2}
                  placeholder="Layover details, seat requests, meal preferences…"
                  value={f.notes}
                  onValueChange={(v) => patch(f.id, { notes: v })}
                />
              </RepeatableCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
