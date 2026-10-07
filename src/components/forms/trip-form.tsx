"use client";

import * as React from "react";
import { Plane, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  FieldGrid,
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/forms/fields";
import { SubHeading } from "@/components/forms/section-shell";
import { CURRENCIES, daysBetween, pluralise } from "@/lib/format";
import { useItinerary } from "@/store/itinerary-store";
import type { CurrencyCode, CustomerInfo, TripInfo } from "@/lib/types";

export function TripForm() {
  const { itinerary, dispatch } = useItinerary();
  const { customer, trip } = itinerary;

  const setCustomer = (patch: Partial<CustomerInfo>) =>
    dispatch({ type: "customer/patch", patch });
  const setTrip = (patch: Partial<TripInfo>) => dispatch({ type: "trip/patch", patch });

  const span = daysBetween(trip.startDate, trip.endDate);
  const durationHint =
    span === null
      ? "Set both dates to see the trip length."
      : span < 0
        ? "The end date is before the start date."
        : `${pluralise(span + 1, "day")} · ${pluralise(span, "night")}`;

  return (
    <div className="space-y-4">
      {/* ------------------------------------------------------- customer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="size-4 text-muted-foreground" />
            Customer details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldGrid cols={2}>
            <TextField
              label="Customer name"
              required
              placeholder="Ananya Iyer"
              value={customer.name}
              onValueChange={(v) => setCustomer({ name: v })}
            />
            <TextField
              label="Email address"
              type="email"
              placeholder="name@example.com"
              value={customer.email}
              onValueChange={(v) => setCustomer({ email: v })}
            />
            <TextField
              label="Phone"
              placeholder="+91 99300 77812"
              value={customer.phone}
              onValueChange={(v) => setCustomer({ phone: v })}
            />
            <TextField
              label="Alternate phone"
              placeholder="Optional"
              value={customer.altPhone}
              onValueChange={(v) => setCustomer({ altPhone: v })}
            />
          </FieldGrid>
          <FieldGrid cols={2}>
            <TextAreaField
              label="Address"
              rows={2}
              placeholder="Optional billing or correspondence address"
              value={customer.address}
              onValueChange={(v) => setCustomer({ address: v })}
            />
            <TextAreaField
              label="Preferences / internal notes"
              rows={2}
              placeholder="Dietary needs, room preferences, special occasions…"
              value={customer.notes}
              onValueChange={(v) => setCustomer({ notes: v })}
            />
          </FieldGrid>
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------- trip */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plane className="size-4 text-muted-foreground" />
            Trip details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldGrid cols={2}>
            <TextField
              label="Itinerary title"
              placeholder="Bali Escape — Ubud & Seminyak"
              hint="Shown as the headline on the cover page."
              value={trip.title}
              onValueChange={(v) => setTrip({ title: v })}
            />
            <TextField
              label="Reference number"
              placeholder="TRP-250101-482"
              value={trip.reference}
              onValueChange={(v) => setTrip({ reference: v })}
            />
            <TextField
              label="Destination"
              required
              placeholder="Bali, Indonesia"
              value={trip.destination}
              onValueChange={(v) => setTrip({ destination: v })}
            />
            <TextField
              label="Departing from"
              placeholder="Mumbai, India"
              value={trip.origin}
              onValueChange={(v) => setTrip({ origin: v })}
            />
          </FieldGrid>

          <Separator />

          <FieldGrid cols={4}>
            <TextField
              label="Start date"
              type="date"
              required
              value={trip.startDate}
              onValueChange={(v) => setTrip({ startDate: v })}
            />
            <TextField
              label="End date"
              type="date"
              required
              hint={durationHint}
              value={trip.endDate}
              onValueChange={(v) => setTrip({ endDate: v })}
            />
            <SelectField
              label="Currency"
              value={trip.currency}
              onValueChange={(v) => setTrip({ currency: v as CurrencyCode })}
              options={Object.entries(CURRENCIES).map(([code, meta]) => ({
                value: code,
                label: `${code} — ${meta.label}`,
              }))}
            />
            <TextField
              label="Prepared by"
              placeholder="Consultant name"
              value={trip.preparedBy}
              onValueChange={(v) => setTrip({ preparedBy: v })}
            />
          </FieldGrid>

          <div>
            <SubHeading>Travellers</SubHeading>
            <FieldGrid cols={4} className="mt-2">
              <NumberField
                label="Adults"
                required
                min={0}
                value={trip.adults}
                onValueChange={(v) => setTrip({ adults: Math.max(0, Math.floor(v)) })}
              />
              <NumberField
                label="Children"
                min={0}
                value={trip.children}
                onValueChange={(v) => setTrip({ children: Math.max(0, Math.floor(v)) })}
              />
              <NumberField
                label="Infants"
                min={0}
                value={trip.infants}
                onValueChange={(v) => setTrip({ infants: Math.max(0, Math.floor(v)) })}
              />
              <div className="grid content-start gap-1.5">
                <span className="text-xs leading-none font-medium text-muted-foreground">
                  Total travellers
                </span>
                <div className="flex h-8 items-center rounded-lg border border-dashed px-2.5 text-sm font-semibold tabular-nums">
                  {trip.adults + trip.children + trip.infants}
                </div>
              </div>
            </FieldGrid>
          </div>

          <Separator />

          <SubHeading>Destination information</SubHeading>
          <TextAreaField
            label="Destination overview"
            rows={3}
            placeholder="A short, evocative paragraph that opens the itinerary."
            value={trip.overview}
            onValueChange={(v) => setTrip({ overview: v })}
          />
          <FieldGrid cols={3}>
            <TextField
              label="Best time to visit"
              placeholder="April to October"
              value={trip.bestTimeToVisit}
              onValueChange={(v) => setTrip({ bestTimeToVisit: v })}
            />
            <TextField
              label="Languages"
              placeholder="Indonesian, English"
              value={trip.languages}
              onValueChange={(v) => setTrip({ languages: v })}
            />
            <TextField
              label="Time zone"
              placeholder="GMT +8 (WITA)"
              value={trip.timeZone}
              onValueChange={(v) => setTrip({ timeZone: v })}
            />
          </FieldGrid>
        </CardContent>
      </Card>

    </div>
  );
}
