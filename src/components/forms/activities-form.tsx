"use client";

import { Camera, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  FieldGrid,
  NumberField,
  TextAreaField,
  TextField,
} from "@/components/forms/fields";
import {
  EmptyState,
  RepeatableCard,
  SectionHead,
  SubHeading,
} from "@/components/forms/section-shell";
import { ImageUploader } from "@/components/forms/image-uploader";
import { currencySymbol, formatMoney } from "@/lib/format";
import { activityTickets, activityTotal } from "@/lib/pricing";
import { useItinerary } from "@/store/itinerary-store";
import type { Activity } from "@/lib/types";

export function ActivitiesForm() {
  const { itinerary, dispatch } = useItinerary();
  const { activities, trip } = itinerary;
  const symbol = currencySymbol(trip.currency);

  const patch = (id: string, p: Partial<Activity>) =>
    dispatch({ type: "activity/patch", id, patch: p });

  const total = activities.reduce((s, a) => s + activityTotal(a), 0);

  return (
    <div className="space-y-4">
      <SectionHead
        title="Sightseeing &amp; activities"
        description="Tours, entries and experiences, each with its own cost breakdown."
        count={activities.length}
        action={
          <div className="flex items-center gap-3">
            {activities.length > 0 ? (
              <span className="text-sm text-muted-foreground">
                Total{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {formatMoney(total, trip.currency)}
                </span>
              </span>
            ) : null}
            <Button size="sm" onClick={() => dispatch({ type: "activity/add" })}>
              <Plus className="size-4" />
              Add activity
            </Button>
          </div>
        }
      />

      {activities.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="No activities added"
          description="Add each experience with its timings and charges. Tickets, guide and transport roll up into one activity total."
          actionLabel="Add the first activity"
          onAction={() => dispatch({ type: "activity/add" })}
        />
      ) : (
        <div className="space-y-3">
          {activities.map((a, i) => {
            const tickets = activityTickets(a);
            const line = activityTotal(a);
            return (
              <RepeatableCard
                key={a.id}
                index={i}
                total={activities.length}
                eyebrow={`Activity ${i + 1}`}
                title={a.name || "Untitled activity"}
                subtitle={
                  [a.location, a.date].filter(Boolean).join(" · ") ||
                  "Set the location and date below"
                }
                meta={
                  <Badge variant="outline" className="tabular-nums">
                    {formatMoney(line, trip.currency)}
                  </Badge>
                }
                onMove={(delta) => dispatch({ type: "activity/move", id: a.id, delta })}
                onDuplicate={() => dispatch({ type: "activity/duplicate", id: a.id })}
                onRemove={() => dispatch({ type: "activity/remove", id: a.id })}
              >
                <FieldGrid cols={2}>
                  <TextField
                    label="Activity name"
                    required
                    placeholder="Tegallalang Rice Terraces & Swing"
                    value={a.name}
                    onValueChange={(v) => patch(a.id, { name: v })}
                  />
                  <TextField
                    label="Location"
                    placeholder="Tegallalang, Ubud"
                    value={a.location}
                    onValueChange={(v) => patch(a.id, { location: v })}
                  />
                </FieldGrid>

                <FieldGrid cols={3}>
                  <TextField
                    label="Date"
                    type="date"
                    required
                    value={a.date}
                    onValueChange={(v) => patch(a.id, { date: v })}
                  />
                  <TextField
                    label="Start time"
                    type="time"
                    required
                    value={a.startTime}
                    onValueChange={(v) => patch(a.id, { startTime: v })}
                  />
                  <TextField
                    label="End time"
                    type="time"
                    value={a.endTime}
                    onValueChange={(v) => patch(a.id, { endTime: v })}
                  />
                </FieldGrid>

                <TextAreaField
                  label="Description"
                  rows={3}
                  placeholder="A short paragraph describing the experience for the traveller."
                  value={a.description}
                  onValueChange={(v) => patch(a.id, { description: v })}
                />

                <FieldGrid cols={2}>
                  <TextAreaField
                    label="Inclusions"
                    rows={2}
                    hint="Comma separated — each becomes a chip in the PDF."
                    placeholder="Entry tickets, Bottled water, Local guide"
                    value={a.inclusions}
                    onValueChange={(v) => patch(a.id, { inclusions: v })}
                  />
                  <TextAreaField
                    label="Notes"
                    rows={2}
                    placeholder="Meeting point, what to carry, fitness level…"
                    value={a.notes}
                    onValueChange={(v) => patch(a.id, { notes: v })}
                  />
                </FieldGrid>

                <Separator />

                <SubHeading>Photos of this place</SubHeading>
                <ImageUploader
                  label="Photos"
                  images={a.images}
                  max={6}
                  hint="Drop photos of this place here, or click to browse. They appear with this activity in the PDF."
                  onChange={(images) => patch(a.id, { images })}
                />

                <Separator />

                <SubHeading>Charges</SubHeading>
                <FieldGrid cols={4}>
                  <NumberField
                    label="Tickets / entry per person"
                    prefix={symbol}
                    min={0}
                    step="0.01"
                    value={a.ticketPerPerson}
                    onValueChange={(v) => patch(a.id, { ticketPerPerson: v })}
                  />
                  <NumberField
                    label="Participants"
                    min={1}
                    value={a.pax}
                    onValueChange={(v) => patch(a.id, { pax: Math.max(1, Math.floor(v)) })}
                  />
                  <NumberField
                    label="Guide charges"
                    prefix={symbol}
                    min={0}
                    step="0.01"
                    value={a.guideCharges}
                    onValueChange={(v) => patch(a.id, { guideCharges: v })}
                  />
                  <NumberField
                    label="Transport charges"
                    prefix={symbol}
                    min={0}
                    step="0.01"
                    value={a.transportCharges}
                    onValueChange={(v) => patch(a.id, { transportCharges: v })}
                  />
                </FieldGrid>

                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed bg-background px-3 py-2">
                  <span className="text-xs text-muted-foreground">
                    Tickets {formatMoney(tickets, trip.currency)}
                    {a.guideCharges
                      ? ` + guide ${formatMoney(a.guideCharges, trip.currency)}`
                      : ""}
                    {a.transportCharges
                      ? ` + transport ${formatMoney(a.transportCharges, trip.currency)}`
                      : ""}
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatMoney(line, trip.currency)}
                  </span>
                </div>
              </RepeatableCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
