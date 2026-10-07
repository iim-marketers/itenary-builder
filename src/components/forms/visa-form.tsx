"use client";

import * as React from "react";
import {
  Ban,
  CalendarClock,
  CircleAlert,
  ClipboardList,
  Globe,
  IdCard,
  Landmark,
  MonitorSmartphone,
  MoveDown,
  MoveUp,
  PlaneLanding,
  Plus,
  ShieldCheck,
  Trash2,
  UserPlus,
  Wallet,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  FieldGrid,
  ListField,
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
  ToggleRow,
} from "@/components/forms/fields";
import {
  EmptyState,
  IconAction,
  RepeatableCard,
  SectionHead,
  SubHeading,
} from "@/components/forms/section-shell";
import { standardVisaDocuments } from "@/lib/defaults";
import { currencySymbol, daysBetween, formatDate, formatMoney, pluralise } from "@/lib/format";
import { visaFeePerPerson, visaTotal } from "@/lib/pricing";
import {
  checkPassport,
  daysUntil,
  needsVisa,
  STANDARD_DOCUMENTS,
  statusMeta,
  suggestedDeadline,
  VISA_ENTRIES,
  VISA_REQUIREMENTS,
  VISA_STATUSES,
  type StatusTone,
} from "@/lib/visa";
import { useItinerary } from "@/store/itinerary-store";
import type { VisaApplicant, VisaInfo, VisaRequirement } from "@/lib/types";
import { cn } from "@/lib/utils";

const REQUIREMENT_ICON: Record<VisaRequirement, React.ComponentType<{ className?: string }>> = {
  "not-applicable": Ban,
  "visa-free": ShieldCheck,
  "on-arrival": PlaneLanding,
  "e-visa": MonitorSmartphone,
  embassy: Landmark,
};

const TONE_CLASS: Record<StatusTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  progress: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  danger: "bg-destructive/10 text-destructive",
};

const TONE_DOT: Record<StatusTone, string> = {
  neutral: "bg-muted-foreground/50",
  info: "bg-sky-500",
  progress: "bg-amber-500",
  success: "bg-emerald-500",
  danger: "bg-destructive",
};

const STATUS_OPTIONS = VISA_STATUSES.map((s) => ({ value: s.value, label: s.label }));

/** "Bali, Indonesia" → "Indonesia": the country is usually the last part. */
function countryFrom(destination: string): string {
  const parts = destination.split(",").map((p) => p.trim()).filter(Boolean);
  return parts[parts.length - 1] ?? "";
}

/** True when the checklist is still exactly the standard one for `requirement`. */
function isStandardList(visa: VisaInfo, requirement: VisaRequirement): boolean {
  if (requirement === "not-applicable") return visa.documents.length === 0;
  const std = STANDARD_DOCUMENTS[requirement];
  return (
    visa.documents.length === std.length &&
    visa.documents.every((d, i) => d.label === std[i].label && d.mandatory === std[i].mandatory)
  );
}

export function VisaForm() {
  const { itinerary, dispatch } = useItinerary();
  const { visa, trip } = itinerary;
  const travellers = trip.adults + trip.children + trip.infants;
  const required = needsVisa(visa.requirement);

  const setVisa = (patch: Partial<VisaInfo>) => dispatch({ type: "visa/patch", patch });

  /**
   * Switching the requirement pre-fills whatever the admin has not touched yet:
   * the standard checklist for the new visa type, the country, the applicant
   * count and a deadline three weeks before departure.
   */
  const chooseRequirement = (next: VisaRequirement) => {
    if (next === visa.requirement) return;
    const patch: Partial<VisaInfo> = { requirement: next };
    if (isStandardList(visa, visa.requirement)) {
      patch.documents = standardVisaDocuments(next);
    }
    if (next !== "not-applicable") {
      if (!visa.country.trim()) patch.country = countryFrom(trip.destination);
      if (visa.requirement === "not-applicable") patch.pax = travellers;
      if (needsVisa(next) && !visa.documentsDueBy) {
        patch.documentsDueBy = suggestedDeadline(trip.startDate);
      }
    }
    setVisa(patch);
  };

  const loadStandardDocuments = () => {
    const previous = visa.documents;
    setVisa({ documents: standardVisaDocuments(visa.requirement) });
    toast.success("Standard document checklist loaded.", {
      action: previous.length
        ? { label: "Undo", onClick: () => setVisa({ documents: previous }) }
        : undefined,
    });
  };

  return (
    <div className="space-y-4">
      <SectionHead
        title="Visa details"
        description="Entry rules for the destination, the documents you need from each guest, and where every application stands."
      />

      {/* ------------------------------------------------------ requirement */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entry requirement</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            role="radiogroup"
            aria-label="Entry requirement"
            className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5"
          >
            {VISA_REQUIREMENTS.map((r) => {
              const Icon = REQUIREMENT_ICON[r.value];
              const active = visa.requirement === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => chooseRequirement(r.value)}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:flex-col lg:gap-2",
                    active
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "hover:bg-muted/60"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-md",
                      active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{r.label}</span>
                    <span className="block text-xs leading-snug text-muted-foreground">
                      {r.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {visa.requirement === "not-applicable" ? (
        <Card className="border-dashed py-0">
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-muted">
              <Globe className="size-5 text-muted-foreground" />
            </span>
            <div>
              <p className="text-sm font-medium">No visa section in this itinerary</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Pick an entry requirement above when the trip crosses a border. The
                standard document checklist, deadline and applicant count are filled in
                for you.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0 space-y-4">
            <OverviewCard visa={visa} setVisa={setVisa} required={required} />
            {required ? (
              <FeesCard visa={visa} setVisa={setVisa} travellers={travellers} />
            ) : null}
            <DocumentsCard
              visa={visa}
              setVisa={setVisa}
              required={required}
              tripStart={trip.startDate}
              onLoadStandard={loadStandardDocuments}
            />
            <ApplicantsSection travellers={travellers} />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Visa notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ListField
                  label="Printed under the checklist in the itinerary"
                  value={visa.notes}
                  onValueChange={(v) => setVisa({ notes: v })}
                  rows={5}
                />
                <ToggleRow
                  label="List the applicants in the itinerary"
                  description="Shows each traveller's visa status. Passport numbers are masked to the last four characters."
                  checked={visa.showApplicants}
                  onCheckedChange={(v) => setVisa({ showApplicants: v })}
                />
              </CardContent>
            </Card>
          </div>

          <div className="xl:sticky xl:top-4 xl:self-start">
            <ReadinessCard />
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ overview */

function OverviewCard({
  visa,
  setVisa,
  required,
}: {
  visa: VisaInfo;
  setVisa: (patch: Partial<VisaInfo>) => void;
  required: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="size-4 text-muted-foreground" />
          {required ? "Visa overview" : "Entry details"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {required ? (
          <>
            <FieldGrid cols={3}>
              <TextField
                label="Country"
                required
                placeholder="Indonesia"
                value={visa.country}
                onValueChange={(v) => setVisa({ country: v })}
              />
              <TextField
                label="Visa type"
                placeholder="Tourist e-Visa on Arrival"
                value={visa.visaType}
                onValueChange={(v) => setVisa({ visaType: v })}
              />
              <SelectField
                label="Entries"
                value={visa.entries}
                onValueChange={(v) => setVisa({ entries: v as VisaInfo["entries"] })}
                options={VISA_ENTRIES}
              />
              <TextField
                label="Validity"
                placeholder="90 days from issue"
                value={visa.validity}
                onValueChange={(v) => setVisa({ validity: v })}
              />
              <TextField
                label="Maximum stay"
                placeholder="30 days per visit"
                value={visa.maxStay}
                onValueChange={(v) => setVisa({ maxStay: v })}
              />
              <TextField
                label="Processing time"
                placeholder="3–5 working days"
                value={visa.processingTime}
                onValueChange={(v) => setVisa({ processingTime: v })}
              />
            </FieldGrid>
            <TextField
              label="Apply via"
              placeholder="Online at evisa.imigrasi.go.id, or VFS Global, Mumbai"
              hint="The portal, embassy or visa centre the application goes through."
              value={visa.applyVia}
              onValueChange={(v) => setVisa({ applyVia: v })}
            />
          </>
        ) : (
          <FieldGrid cols={2}>
            <TextField
              label="Country"
              required
              placeholder="Thailand"
              value={visa.country}
              onValueChange={(v) => setVisa({ country: v })}
            />
            <TextField
              label="Permitted stay"
              placeholder="Up to 60 days visa-free"
              value={visa.maxStay}
              onValueChange={(v) => setVisa({ maxStay: v })}
            />
          </FieldGrid>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------------------------------------------------------- fees */

function FeesCard({
  visa,
  setVisa,
  travellers,
}: {
  visa: VisaInfo;
  setVisa: (patch: Partial<VisaInfo>) => void;
  travellers: number;
}) {
  const { itinerary } = useItinerary();
  const currency = itinerary.trip.currency;
  const symbol = currencySymbol(currency);
  const each = visaFeePerPerson(visa);
  const total = visaTotal(visa);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="size-4 text-muted-foreground" />
          Fees
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FieldGrid cols={3}>
          <NumberField
            label="Visa fee per person"
            prefix={symbol}
            min={0}
            step="0.01"
            hint="The government or embassy fee."
            value={visa.feePerPerson}
            onValueChange={(v) => setVisa({ feePerPerson: v })}
          />
          <NumberField
            label="Service fee per person"
            prefix={symbol}
            min={0}
            step="0.01"
            hint="Your processing or VFS charge."
            value={visa.serviceFeePerPerson}
            onValueChange={(v) => setVisa({ serviceFeePerPerson: v })}
          />
          <div className="flex items-end gap-2">
            <NumberField
              label="Applicants"
              min={0}
              wrapperClassName="flex-1"
              hint={
                visa.pax === travellers
                  ? "Matches the traveller count."
                  : `The trip has ${pluralise(travellers, "traveller")}.`
              }
              value={visa.pax}
              onValueChange={(v) => setVisa({ pax: Math.max(0, Math.floor(v)) })}
            />
            {visa.pax !== travellers ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mb-5"
                onClick={() => setVisa({ pax: travellers })}
              >
                Match
              </Button>
            ) : null}
          </div>
        </FieldGrid>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed px-3 py-2.5">
          <div className="text-sm">
            <span className="text-muted-foreground">
              {formatMoney(each, currency)} × {visa.pax} ={" "}
            </span>
            <span className="font-semibold tabular-nums">{formatMoney(total, currency)}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {visa.addToPricing ? "Added to the package total" : "Shown as payable separately"}
          </span>
        </div>

        <ToggleRow
          label="Include visa fees in the package price"
          description="Adds a visa line to the pricing breakdown. Turn off to quote the fees separately."
          checked={visa.addToPricing}
          onCheckedChange={(v) => setVisa({ addToPricing: v })}
        />
      </CardContent>
    </Card>
  );
}

/* ----------------------------------------------------------- documents */

function DocumentsCard({
  visa,
  setVisa,
  required,
  tripStart,
  onLoadStandard,
}: {
  visa: VisaInfo;
  setVisa: (patch: Partial<VisaInfo>) => void;
  required: boolean;
  tripStart: string;
  onLoadStandard: () => void;
}) {
  const { dispatch } = useItinerary();
  const lead = daysBetween(visa.documentsDueBy, tripStart);
  const suggestion = suggestedDeadline(tripStart);
  const mandatory = visa.documents.filter((d) => d.mandatory).length;

  const deadlineHint =
    lead === null
      ? tripStart
        ? "When the guests must send their documents."
        : "Set the trip dates to compare against departure."
      : lead < 0
        ? "This is after the trip starts."
        : `${pluralise(lead, "day")} before departure.`;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="size-4 text-muted-foreground" />
            Documents required from guests
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {visa.documents.length
              ? `${mandatory} mandatory · ${visa.documents.length - mandatory} optional — printed as a checklist for the guests.`
              : "Printed as a checklist for the guests."}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={onLoadStandard}>
          <WandSparkles className="size-4" />
          Load standard list
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {visa.documents.length === 0 ? (
          <p className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
            No documents listed. Load the standard list for this visa type, or add your own.
          </p>
        ) : (
          <ol className="space-y-2">
            {visa.documents.map((d, i) => (
              <li key={d.id} className="flex items-center gap-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-semibold tabular-nums text-muted-foreground">
                  {i + 1}
                </span>
                <Input
                  aria-label={`Document ${i + 1}`}
                  placeholder="Passport valid for 6 months…"
                  className="flex-1"
                  value={d.label}
                  onChange={(e) =>
                    dispatch({ type: "visaDoc/patch", id: d.id, patch: { label: e.target.value } })
                  }
                />
                <button
                  type="button"
                  aria-pressed={d.mandatory}
                  title="Toggle between mandatory and optional"
                  onClick={() =>
                    dispatch({
                      type: "visaDoc/patch",
                      id: d.id,
                      patch: { mandatory: !d.mandatory },
                    })
                  }
                  className={cn(
                    "h-7 w-[5.5rem] shrink-0 rounded-md border text-xs font-medium transition-colors",
                    d.mandatory
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {d.mandatory ? "Mandatory" : "Optional"}
                </button>
                <div className="hidden shrink-0 items-center sm:flex">
                  <IconAction
                    label="Move up"
                    icon={MoveUp}
                    disabled={i === 0}
                    onClick={() => dispatch({ type: "visaDoc/move", id: d.id, delta: -1 })}
                  />
                  <IconAction
                    label="Move down"
                    icon={MoveDown}
                    disabled={i === visa.documents.length - 1}
                    onClick={() => dispatch({ type: "visaDoc/move", id: d.id, delta: 1 })}
                  />
                </div>
                <IconAction
                  label="Remove document"
                  icon={Trash2}
                  destructive
                  onClick={() => dispatch({ type: "visaDoc/remove", id: d.id })}
                />
              </li>
            ))}
          </ol>
        )}

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => dispatch({ type: "visaDoc/add" })}
        >
          <Plus className="size-4" />
          Add document
        </Button>

        <Separator />

        <SubHeading>How the guests send them</SubHeading>
        <div className="flex flex-wrap items-end gap-3">
          <TextField
            label="Documents due by"
            type="date"
            wrapperClassName="w-48"
            hint={deadlineHint}
            value={visa.documentsDueBy}
            onValueChange={(v) => setVisa({ documentsDueBy: v })}
          />
          {suggestion && suggestion !== visa.documentsDueBy ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="mb-5"
              onClick={() => setVisa({ documentsDueBy: suggestion })}
            >
              <CalendarClock className="size-4" />
              3 weeks before departure
            </Button>
          ) : null}
        </div>
        <FieldGrid cols={required ? 2 : 1}>
          <TextAreaField
            label="Submission instructions"
            rows={3}
            placeholder="Email scans to visas@youragency.com, or WhatsApp them to…"
            value={visa.submissionInstructions}
            onValueChange={(v) => setVisa({ submissionInstructions: v })}
          />
          {required ? (
            <TextAreaField
              label="Photograph specifications"
              rows={3}
              placeholder="35 × 45 mm, white background…"
              value={visa.photoSpecs}
              onValueChange={(v) => setVisa({ photoSpecs: v })}
            />
          ) : null}
        </FieldGrid>
      </CardContent>
    </Card>
  );
}

/* ---------------------------------------------------------- applicants */

function ApplicantsSection({ travellers }: { travellers: number }) {
  const { itinerary, dispatch } = useItinerary();
  const { visa, trip } = itinerary;
  const remaining = Math.max(0, travellers - visa.applicants.length);

  const patch = (id: string, p: Partial<VisaApplicant>) =>
    dispatch({ type: "applicant/patch", id, patch: p });

  const addRemaining = () =>
    dispatch({
      type: "applicant/add",
      applicants: Array.from({ length: Math.max(1, remaining) }, () => ({})),
    });

  return (
    <div className="space-y-3">
      <SectionHead
        title="Applicants"
        description="Each traveller's passport details, collected from the guests."
        count={visa.applicants.length}
        action={
          visa.applicants.length ? (
            <div className="flex flex-wrap gap-2">
              {remaining > 1 ? (
                <Button size="sm" variant="outline" onClick={addRemaining}>
                  <UserPlus className="size-4" />
                  Add remaining {remaining}
                </Button>
              ) : null}
              <Button size="sm" onClick={() => dispatch({ type: "applicant/add" })}>
                <Plus className="size-4" />
                Add applicant
              </Button>
            </div>
          ) : null
        }
      />

      {visa.applicants.length === 0 ? (
        <EmptyState
          icon={IdCard}
          title="No applicants yet"
          description="Add one card per traveller to record their passport details and track each visa from documents to approval."
          actionLabel={
            travellers > 1 ? `Add all ${travellers} travellers` : "Add the first applicant"
          }
          onAction={addRemaining}
        />
      ) : (
        <div className="space-y-3">
          {visa.applicants.map((a, i) => {
            const status = statusMeta(a.status);
            const passport = checkPassport(a.passportExpiry, trip.endDate);
            return (
              <RepeatableCard
                key={a.id}
                index={i}
                total={visa.applicants.length}
                eyebrow={`Traveller ${i + 1}`}
                title={a.fullName || "Unnamed applicant"}
                subtitle={
                  [a.nationality, a.passportNumber && `Passport ${a.passportNumber}`]
                    .filter(Boolean)
                    .join(" · ") || "Passport details pending"
                }
                invalid={!a.fullName.trim() || passport.level === "error"}
                meta={
                  <span
                    className={cn(
                      "inline-flex h-5 items-center rounded-full px-2 text-xs font-medium whitespace-nowrap",
                      TONE_CLASS[status.tone]
                    )}
                  >
                    {status.label}
                  </span>
                }
                onMove={(delta) => dispatch({ type: "applicant/move", id: a.id, delta })}
                onDuplicate={() => dispatch({ type: "applicant/duplicate", id: a.id })}
                onRemove={() => dispatch({ type: "applicant/remove", id: a.id })}
              >
                <FieldGrid cols={3}>
                  <TextField
                    label="Full name as on passport"
                    required
                    placeholder="ANANYA IYER"
                    value={a.fullName}
                    onValueChange={(v) => patch(a.id, { fullName: v })}
                  />
                  <TextField
                    label="Nationality"
                    placeholder="Indian"
                    value={a.nationality}
                    onValueChange={(v) => patch(a.id, { nationality: v })}
                  />
                  <TextField
                    label="Date of birth"
                    type="date"
                    value={a.dateOfBirth}
                    onValueChange={(v) => patch(a.id, { dateOfBirth: v })}
                  />
                </FieldGrid>

                <Separator />

                <SubHeading>Passport</SubHeading>
                <FieldGrid cols={3}>
                  <TextField
                    label="Passport number"
                    placeholder="Z1234567"
                    className="uppercase"
                    autoComplete="off"
                    value={a.passportNumber}
                    onValueChange={(v) => patch(a.id, { passportNumber: v.toUpperCase() })}
                  />
                  <TextField
                    label="Date of issue"
                    type="date"
                    value={a.passportIssueDate}
                    onValueChange={(v) => patch(a.id, { passportIssueDate: v })}
                  />
                  <TextField
                    label="Date of expiry"
                    type="date"
                    value={a.passportExpiry}
                    hint={
                      <span
                        className={cn(
                          passport.level === "error" && "text-destructive",
                          passport.level === "warning" && "text-amber-700 dark:text-amber-400",
                          passport.level === "ok" && "text-emerald-700 dark:text-emerald-400"
                        )}
                      >
                        {passport.message}
                      </span>
                    }
                    onValueChange={(v) => patch(a.id, { passportExpiry: v })}
                  />
                </FieldGrid>

                <Separator />

                <SubHeading>Application</SubHeading>
                <FieldGrid cols={3}>
                  <SelectField
                    label="Visa status"
                    value={a.status}
                    onValueChange={(v) => patch(a.id, { status: v as VisaApplicant["status"] })}
                    options={STATUS_OPTIONS}
                  />
                  <TextField
                    label="Visa / application number"
                    placeholder="Once filed or approved"
                    value={a.visaNumber}
                    onValueChange={(v) => patch(a.id, { visaNumber: v })}
                  />
                  <TextField
                    label="Notes"
                    placeholder="Old passport attached, minor…"
                    value={a.notes}
                    onValueChange={(v) => patch(a.id, { notes: v })}
                  />
                </FieldGrid>
              </RepeatableCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------- readiness */

function ReadinessCard() {
  const { itinerary } = useItinerary();
  const { visa, trip } = itinerary;
  const required = needsVisa(visa.requirement);
  const applicants = visa.applicants;

  // "Not required" applicants are as done as approved ones.
  const done = applicants.filter(
    (a) => a.status === "approved" || a.status === "not-required"
  ).length;
  const percent = applicants.length ? Math.round((done / applicants.length) * 100) : 0;
  const passportIssues = applicants.filter((a) => {
    const level = checkPassport(a.passportExpiry, trip.endDate).level;
    return level === "error" || level === "warning";
  }).length;

  const due = daysUntil(visa.documentsDueBy);
  const deadline =
    due === null
      ? { text: "No deadline set", tone: "text-muted-foreground" }
      : due < 0
        ? { text: `Overdue by ${pluralise(-due, "day")}`, tone: "text-destructive" }
        : due === 0
          ? { text: "Due today", tone: "text-amber-700 dark:text-amber-400" }
          : {
              text: `Due in ${pluralise(due, "day")}`,
              tone: due <= 7 ? "text-amber-700 dark:text-amber-400" : "text-foreground",
            };

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <IdCard className="size-4 text-muted-foreground" />
          Visa readiness
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 py-4 text-sm">
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-medium">
              {applicants.length
                ? `${done} of ${applicants.length} ready`
                : "No applicants yet"}
            </span>
            <span className="text-xs tabular-nums text-muted-foreground">{percent}%</span>
          </div>
          <Progress value={percent} className="mt-2 h-1.5" />
        </div>

        {applicants.length ? (
          <ul className="space-y-1.5">
            {VISA_STATUSES.map((s) => {
              const count = applicants.filter((a) => a.status === s.value).length;
              if (!count) return null;
              return (
                <li key={s.value} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className={cn("size-2 rounded-full", TONE_DOT[s.tone])} />
                    {s.label}
                  </span>
                  <span className="tabular-nums">{count}</span>
                </li>
              );
            })}
          </ul>
        ) : null}

        <Separator />

        <dl className="space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <dt className="text-muted-foreground">Documents</dt>
            <dd className="text-right">
              {visa.documentsDueBy ? (
                <>
                  <span className={cn("block font-medium", deadline.tone)}>{deadline.text}</span>
                  <span className="block text-xs text-muted-foreground">
                    {formatDate(visa.documentsDueBy, "medium")}
                  </span>
                </>
              ) : (
                <span className={deadline.tone}>{deadline.text}</span>
              )}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Checklist</dt>
            <dd className="tabular-nums">{pluralise(visa.documents.length, "item")}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Passports</dt>
            <dd>
              {passportIssues ? (
                <span className="flex items-center gap-1 font-medium text-destructive">
                  <CircleAlert className="size-3.5" />
                  {passportIssues} need attention
                </span>
              ) : applicants.length ? (
                <span className="text-emerald-700 dark:text-emerald-400">All valid</span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </dd>
          </div>
          {required ? (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Visa fees</dt>
              <dd className="text-right">
                <span className="block font-semibold tabular-nums">
                  {formatMoney(visaTotal(visa), trip.currency)}
                </span>
                <Badge variant="outline" className="mt-1">
                  {visa.addToPricing ? "In package" : "Separate"}
                </Badge>
              </dd>
            </div>
          ) : null}
        </dl>
      </CardContent>
    </Card>
  );
}
