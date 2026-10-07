"use client";

import * as React from "react";
import {
  BadgeCheck,
  CalendarCheck,
  CircleAlert,
  FileText,
  HeartPulse,
  Import,
  LifeBuoy,
  MoveDown,
  MoveUp,
  Plus,
  ShieldCheck,
  ShieldOff,
  ShieldPlus,
  Trash2,
  Umbrella,
  UserPlus,
  Users,
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
import { TONE_CLASS, TONE_DOT } from "@/components/forms/visa-form";
import { standardBenefits } from "@/lib/defaults";
import { currencySymbol, formatMoney, pluralise } from "@/lib/format";
import {
  ageNote,
  ageOn,
  checkPeriod,
  hasPremium,
  INSURANCE_MODES,
  INSURANCE_STATUSES,
  insuranceStatusMeta,
  isCovered,
  POLICY_TYPES,
  REGION_PRESETS,
  SCOPES,
  SENIOR_AGE,
  STANDARD_BENEFITS,
  type PeriodCheck,
} from "@/lib/insurance";
import { insuranceInPackage, insuranceTotal } from "@/lib/pricing";
import { useItinerary } from "@/store/itinerary-store";
import type {
  InsuranceInfo,
  InsuranceMode,
  InsuranceScope,
  InsuredTraveller,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const MODE_ICON: Record<InsuranceMode, React.ComponentType<{ className?: string }>> = {
  none: ShieldOff,
  included: ShieldCheck,
  optional: ShieldPlus,
  "self-arranged": Umbrella,
};

const STATUS_OPTIONS = INSURANCE_STATUSES.map((s) => ({ value: s.value, label: s.label }));

const LEVEL_TEXT: Record<PeriodCheck["level"], string> = {
  ok: "text-emerald-700 dark:text-emerald-400",
  warning: "text-amber-700 dark:text-amber-400",
  error: "text-destructive",
  unknown: "text-muted-foreground",
};

/** True when the schedule is still exactly the standard one for `scope`. */
function isStandardSchedule(ins: InsuranceInfo, scope: InsuranceScope): boolean {
  const std = STANDARD_BENEFITS[scope];
  return (
    ins.benefits.length === std.length &&
    ins.benefits.every(
      (b, i) =>
        b.label === std[i].label && b.limit === std[i].limit && b.deductible === std[i].deductible
    )
  );
}

const sameName = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase() && a.trim() !== "";

export function InsuranceForm() {
  const { itinerary, dispatch } = useItinerary();
  const { insurance: ins, trip, visa } = itinerary;
  const travellers = trip.adults + trip.children + trip.infants;

  const setIns = (patch: Partial<InsuranceInfo>) => dispatch({ type: "insurance/patch", patch });

  /**
   * Turning cover on for the first time fills whatever the admin has not set
   * yet: the scope (domestic when there is no visa), the policy period from the
   * trip dates, the insured count and the standard schedule of benefits.
   */
  const chooseMode = (next: InsuranceMode) => {
    if (next === ins.mode) return;
    const patch: Partial<InsuranceInfo> = { mode: next };
    if (ins.mode === "none" && next !== "none") {
      const scope: InsuranceScope =
        visa.requirement === "not-applicable" && ins.benefits.length === 0
          ? "domestic"
          : ins.scope;
      patch.scope = scope;
      if (!ins.startDate) patch.startDate = trip.startDate;
      if (!ins.endDate) patch.endDate = trip.endDate;
      if (ins.travellers.length === 0) patch.pax = travellers;
      if (ins.benefits.length === 0) patch.benefits = standardBenefits(scope);
      if (!ins.coverageRegion.trim() && scope === "domestic") {
        patch.coverageRegion = REGION_PRESETS.domestic[0];
      }
      if (visa.requirement === "embassy") patch.requiredForVisa = true;
    }
    setIns(patch);
  };

  const chooseScope = (next: InsuranceScope) => {
    if (next === ins.scope) return;
    const patch: Partial<InsuranceInfo> = { scope: next };
    if (ins.benefits.length === 0 || isStandardSchedule(ins, ins.scope)) {
      patch.benefits = standardBenefits(next);
    }
    if (!ins.coverageRegion.trim() || REGION_PRESETS[ins.scope].includes(ins.coverageRegion)) {
      patch.coverageRegion = next === "domestic" ? REGION_PRESETS.domestic[0] : "";
    }
    setIns(patch);
  };

  const loadStandardBenefits = () => {
    const previous = ins.benefits;
    setIns({ benefits: standardBenefits(ins.scope) });
    toast.success("Standard schedule loaded — check the limits against the policy wording.", {
      action: previous.length
        ? { label: "Undo", onClick: () => setIns({ benefits: previous }) }
        : undefined,
    });
  };

  return (
    <div className="space-y-4">
      <SectionHead
        title="Travel insurance"
        description="Who arranges cover, what the policy pays for, how to claim, and which travellers are insured."
      />

      {/* ------------------------------------------------------------ mode */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cover arrangement</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            role="radiogroup"
            aria-label="Cover arrangement"
            className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
          >
            {INSURANCE_MODES.map((m) => {
              const Icon = MODE_ICON[m.value];
              const active = ins.mode === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => chooseMode(m.value)}
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
                    <span className="block text-sm font-medium">{m.label}</span>
                    <span className="block text-xs leading-snug text-muted-foreground">
                      {m.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {ins.mode === "none" ? (
        <Card className="border-dashed py-0">
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-muted">
              <Umbrella className="size-5 text-muted-foreground" />
            </span>
            <div>
              <p className="text-sm font-medium">No insurance section in this itinerary</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Choose how cover is arranged above. The policy period, the standard
                schedule of benefits, exclusions and claim steps are filled in for you.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0 space-y-4">
            <PolicyCard ins={ins} setIns={setIns} onScope={chooseScope} />
            {hasPremium(ins.mode) ? (
              <PremiumCard ins={ins} setIns={setIns} travellers={travellers} />
            ) : null}
            <BenefitsCard ins={ins} onLoadStandard={loadStandardBenefits} />
            <AssistanceCard ins={ins} setIns={setIns} />
            <InsuredSection travellers={travellers} />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="size-4 text-muted-foreground" />
                  Exclusions & notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FieldGrid cols={2}>
                  <ListField
                    label="What the policy does not cover"
                    value={ins.exclusions}
                    onValueChange={(v) => setIns({ exclusions: v })}
                    rows={6}
                  />
                  <ListField
                    label="Please note"
                    value={ins.notes}
                    onValueChange={(v) => setIns({ notes: v })}
                    rows={6}
                  />
                </FieldGrid>
                <ToggleRow
                  label="List the insured travellers in the itinerary"
                  description="Shows each traveller's age, nominee, certificate number and policy status. Passport numbers are never printed."
                  checked={ins.showTravellers}
                  onCheckedChange={(v) => setIns({ showTravellers: v })}
                />
              </CardContent>
            </Card>
          </div>

          <div className="xl:sticky xl:top-4 xl:self-start">
            <CoverSummaryCard />
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- policy */

function PolicyCard({
  ins,
  setIns,
  onScope,
}: {
  ins: InsuranceInfo;
  setIns: (patch: Partial<InsuranceInfo>) => void;
  onScope: (scope: InsuranceScope) => void;
}) {
  const { itinerary } = useItinerary();
  const { trip } = itinerary;
  const own = ins.mode === "self-arranged";
  const period = checkPeriod(ins.startDate, ins.endDate, trip.startDate, trip.endDate);
  const matchesTrip = ins.startDate === trip.startDate && ins.endDate === trip.endDate;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="size-4 text-muted-foreground" />
          {own ? "Minimum cover required" : "Policy details"}
        </CardTitle>
        <div
          role="radiogroup"
          aria-label="Trip scope"
          className="inline-flex rounded-lg border bg-muted/50 p-0.5"
        >
          {SCOPES.map((sc) => (
            <button
              key={sc.value}
              type="button"
              role="radio"
              aria-checked={ins.scope === sc.value}
              onClick={() => onScope(sc.value)}
              className={cn(
                "h-7 rounded-md px-3 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                ins.scope === sc.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {sc.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {own ? null : (
          <FieldGrid cols={3}>
            <TextField
              label="Insurer"
              placeholder="TATA AIG, HDFC ERGO…"
              value={ins.provider}
              onValueChange={(v) => setIns({ provider: v })}
            />
            <TextField
              label="Plan name"
              placeholder="Travel Guard Silver"
              value={ins.planName}
              onValueChange={(v) => setIns({ planName: v })}
            />
            <SelectField
              label="Policy type"
              value={ins.policyType}
              onValueChange={(v) => setIns({ policyType: v as InsuranceInfo["policyType"] })}
              options={POLICY_TYPES}
            />
          </FieldGrid>
        )}

        <FieldGrid cols={own ? 2 : 3}>
          <div className="grid content-start gap-1.5">
            <TextField
              label="Coverage region"
              placeholder={ins.scope === "domestic" ? "Within India" : "Worldwide excluding USA & Canada"}
              value={ins.coverageRegion}
              onValueChange={(v) => setIns({ coverageRegion: v })}
            />
            <div className="flex flex-wrap gap-1">
              {REGION_PRESETS[ins.scope]
                .filter((r) => r !== ins.coverageRegion)
                .map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setIns({ coverageRegion: r })}
                    className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {r}
                  </button>
                ))}
            </div>
          </div>
          <TextField
            label={own ? "Minimum sum insured" : "Sum insured"}
            placeholder={ins.scope === "domestic" ? "₹ 5,00,000" : "USD 50,000"}
            hint="Include the currency — policies are often in USD or EUR."
            value={ins.sumInsured}
            onValueChange={(v) => setIns({ sumInsured: v })}
          />
          {own ? null : (
            <TextField
              label="Master policy number"
              placeholder="Once issued"
              hint="For a group or family policy."
              value={ins.policyNumber}
              onValueChange={(v) => setIns({ policyNumber: v })}
            />
          )}
        </FieldGrid>

        <Separator />

        <SubHeading>{own ? "Cover needed for" : "Policy period"}</SubHeading>
        <div className="flex flex-wrap items-end gap-3">
          <TextField
            label="Starts"
            type="date"
            wrapperClassName="w-44"
            value={ins.startDate}
            onValueChange={(v) => setIns({ startDate: v })}
          />
          <TextField
            label="Ends"
            type="date"
            wrapperClassName="w-44"
            value={ins.endDate}
            onValueChange={(v) => setIns({ endDate: v })}
          />
          {trip.startDate && trip.endDate && !matchesTrip ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIns({ startDate: trip.startDate, endDate: trip.endDate })}
            >
              <CalendarCheck className="size-4" />
              Match trip dates
            </Button>
          ) : null}
        </div>
        <p className={cn("flex items-center gap-1.5 text-xs", LEVEL_TEXT[period.level])}>
          {period.level === "ok" ? (
            <BadgeCheck className="size-3.5" />
          ) : period.level === "error" ? (
            <CircleAlert className="size-3.5" />
          ) : null}
          {period.message}
        </p>

        <ToggleRow
          label="Required for the visa"
          description="Schengen and many embassy visas refuse applications without insurance. Prints a notice on the insurance page."
          checked={ins.requiredForVisa}
          onCheckedChange={(v) => setIns({ requiredForVisa: v })}
        />
      </CardContent>
    </Card>
  );
}

/* --------------------------------------------------------------- premium */

function PremiumCard({
  ins,
  setIns,
  travellers,
}: {
  ins: InsuranceInfo;
  setIns: (patch: Partial<InsuranceInfo>) => void;
  travellers: number;
}) {
  const { itinerary } = useItinerary();
  const currency = itinerary.trip.currency;
  const total = insuranceTotal(ins);
  const optional = ins.mode === "optional";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="size-4 text-muted-foreground" />
          Premium
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FieldGrid cols={2}>
          <NumberField
            label="Premium per person"
            prefix={currencySymbol(currency)}
            min={0}
            step="0.01"
            hint="Average across the party, including GST."
            value={ins.premiumPerPerson}
            onValueChange={(v) => setIns({ premiumPerPerson: v })}
          />
          <div className="flex items-end gap-2">
            <NumberField
              label="Insured travellers"
              min={0}
              wrapperClassName="flex-1"
              hint={
                ins.pax === travellers
                  ? "Matches the traveller count."
                  : `The trip has ${pluralise(travellers, "traveller")}.`
              }
              value={ins.pax}
              onValueChange={(v) => setIns({ pax: Math.max(0, Math.floor(v)) })}
            />
            {ins.pax !== travellers ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mb-5"
                onClick={() => setIns({ pax: travellers })}
              >
                Match
              </Button>
            ) : null}
          </div>
        </FieldGrid>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed px-3 py-2.5">
          <div className="text-sm">
            <span className="text-muted-foreground">
              {formatMoney(ins.premiumPerPerson, currency)} × {ins.pax} ={" "}
            </span>
            <span className="font-semibold tabular-nums">{formatMoney(total, currency)}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {optional
              ? "Quoted as an optional add-on"
              : ins.addToPricing
                ? "Added to the package total"
                : "Shown as payable separately"}
          </span>
        </div>

        {optional ? (
          <p className="text-xs text-muted-foreground">
            An optional add-on is never added to the package total. Switch to{" "}
            <span className="font-medium text-foreground">Included</span> once the guest
            accepts it.
          </p>
        ) : (
          <ToggleRow
            label="Include the premium in the package price"
            description="Adds a travel insurance line to the pricing breakdown. Turn off to quote it separately."
            checked={ins.addToPricing}
            onCheckedChange={(v) => setIns({ addToPricing: v })}
          />
        )}
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------- benefits */

function BenefitsCard({
  ins,
  onLoadStandard,
}: {
  ins: InsuranceInfo;
  onLoadStandard: () => void;
}) {
  const { dispatch } = useItinerary();
  const own = ins.mode === "self-arranged";
  const patch = (id: string, p: Partial<InsuranceInfo["benefits"][number]>) =>
    dispatch({ type: "benefit/patch", id, patch: p });

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <HeartPulse className="size-4 text-muted-foreground" />
            {own ? "Minimum benefits" : "Schedule of benefits"}
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {own
              ? "The least cover the guest's own policy should carry."
              : "What the policy pays, per traveller. Printed as a table."}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={onLoadStandard}>
          <WandSparkles className="size-4" />
          Load {ins.scope} schedule
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {ins.benefits.length === 0 ? (
          <p className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
            No benefits listed. Load the standard schedule, or add the lines from the policy.
          </p>
        ) : (
          <>
            <div className="hidden grid-cols-[1.5rem_minmax(0,1fr)_10rem_7.5rem_5.25rem] gap-2 px-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground md:grid">
              <span />
              <span>Benefit</span>
              <span>{own ? "Minimum" : "Limit"}</span>
              <span>Excess</span>
              <span />
            </div>
            <ol className="space-y-2">
              {ins.benefits.map((b, i) => (
                <li
                  key={b.id}
                  className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border p-2 md:grid-cols-[1.5rem_minmax(0,1fr)_10rem_7.5rem_5.25rem] md:rounded-none md:border-0 md:p-0"
                >
                  <span className="flex size-6 items-center justify-center rounded-md bg-muted text-[11px] font-semibold tabular-nums text-muted-foreground">
                    {i + 1}
                  </span>
                  <Input
                    aria-label={`Benefit ${i + 1}`}
                    placeholder="Emergency medical expenses"
                    value={b.label}
                    onChange={(e) => patch(b.id, { label: e.target.value })}
                  />
                  <div className="col-span-3 col-start-1 row-start-2 grid grid-cols-2 gap-2 md:col-span-1 md:col-start-auto md:row-start-auto md:contents">
                    <Input
                      aria-label={`Benefit ${i + 1} limit`}
                      placeholder={own ? "Minimum" : "Limit"}
                      value={b.limit}
                      onChange={(e) => patch(b.id, { limit: e.target.value })}
                    />
                    <Input
                      aria-label={`Benefit ${i + 1} excess`}
                      placeholder="Excess"
                      value={b.deductible}
                      onChange={(e) => patch(b.id, { deductible: e.target.value })}
                    />
                  </div>
                  <div className="col-start-3 row-start-1 flex items-center justify-end md:col-start-auto md:row-start-auto">
                    <IconAction
                      label="Move up"
                      icon={MoveUp}
                      disabled={i === 0}
                      onClick={() => dispatch({ type: "benefit/move", id: b.id, delta: -1 })}
                    />
                    <IconAction
                      label="Move down"
                      icon={MoveDown}
                      disabled={i === ins.benefits.length - 1}
                      onClick={() => dispatch({ type: "benefit/move", id: b.id, delta: 1 })}
                    />
                    <IconAction
                      label="Remove benefit"
                      icon={Trash2}
                      destructive
                      onClick={() => dispatch({ type: "benefit/remove", id: b.id })}
                    />
                  </div>
                </li>
              ))}
            </ol>
          </>
        )}

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => dispatch({ type: "benefit/add" })}
        >
          <Plus className="size-4" />
          Add benefit
        </Button>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------ assistance */

function AssistanceCard({
  ins,
  setIns,
}: {
  ins: InsuranceInfo;
  setIns: (patch: Partial<InsuranceInfo>) => void;
}) {
  const own = ins.mode === "self-arranged";
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <LifeBuoy className="size-4 text-muted-foreground" />
          Emergencies & claims
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {own ? (
          <p className="text-sm text-muted-foreground">
            The guest&rsquo;s own insurer runs the assistance line. Add your travel desk&rsquo;s
            number here if you want it printed as a fallback.
          </p>
        ) : null}
        <FieldGrid cols={2}>
          <TextField
            label={own ? "Our emergency desk" : "24×7 assistance number"}
            type="tel"
            placeholder="+91 124 4876 000"
            hint={own ? undefined : "Printed prominently — the first call in a medical emergency."}
            value={ins.assistancePhone}
            onValueChange={(v) => setIns({ assistancePhone: v })}
          />
          <TextField
            label="Claims email"
            type="email"
            placeholder="claims@insurer.com"
            value={ins.assistanceEmail}
            onValueChange={(v) => setIns({ assistanceEmail: v })}
          />
        </FieldGrid>
        <ListField
          label="How to claim — printed as numbered steps"
          value={ins.claimSteps}
          onValueChange={(v) => setIns({ claimSteps: v })}
          rows={5}
        />
      </CardContent>
    </Card>
  );
}

/* --------------------------------------------------------------- insured */

function InsuredSection({ travellers }: { travellers: number }) {
  const { itinerary, dispatch } = useItinerary();
  const { insurance: ins, trip, visa } = itinerary;
  const remaining = Math.max(0, travellers - ins.travellers.length);
  const domestic = ins.scope === "domestic";

  // Visa applicants not on the policy yet, matched by name.
  const importable = visa.applicants.filter(
    (a) => a.fullName.trim() && !ins.travellers.some((t) => sameName(t.fullName, a.fullName))
  );

  const patch = (id: string, p: Partial<InsuredTraveller>) =>
    dispatch({ type: "insured/patch", id, patch: p });

  const addRemaining = () =>
    dispatch({
      type: "insured/add",
      travellers: Array.from({ length: Math.max(1, remaining) }, () => ({})),
    });

  const importApplicants = () => {
    dispatch({
      type: "insured/add",
      travellers: importable.map((a) => ({
        fullName: a.fullName,
        dateOfBirth: a.dateOfBirth,
        passportNumber: a.passportNumber,
      })),
    });
    toast.success(`${pluralise(importable.length, "traveller")} copied from the visa applicants.`);
  };

  const importButton = importable.length ? (
    <Button size="sm" variant="outline" onClick={importApplicants}>
      <Import className="size-4" />
      Copy {importable.length} from visa
    </Button>
  ) : null;

  return (
    <div className="space-y-3">
      <SectionHead
        title="Insured travellers"
        description="One card per person on the policy — the details the insurer asks for."
        count={ins.travellers.length}
        action={
          ins.travellers.length ? (
            <div className="flex flex-wrap gap-2">
              {importButton}
              {remaining > 1 ? (
                <Button size="sm" variant="outline" onClick={addRemaining}>
                  <UserPlus className="size-4" />
                  Add remaining {remaining}
                </Button>
              ) : null}
              <Button size="sm" onClick={() => dispatch({ type: "insured/add" })}>
                <Plus className="size-4" />
                Add traveller
              </Button>
            </div>
          ) : importButton
        }
      />

      {ins.travellers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No insured travellers yet"
          description="Add each traveller to record their nominee, declare medical conditions and track the policy through to issue."
          actionLabel={
            travellers > 1 ? `Add all ${travellers} travellers` : "Add the first traveller"
          }
          onAction={addRemaining}
        />
      ) : (
        <div className="space-y-3">
          {ins.travellers.map((t, i) => {
            const status = insuranceStatusMeta(t.status);
            const age = ageOn(t.dateOfBirth, trip.startDate);
            const note = ageNote(age);
            return (
              <RepeatableCard
                key={t.id}
                index={i}
                total={ins.travellers.length}
                eyebrow={`Traveller ${i + 1}`}
                title={t.fullName || "Unnamed traveller"}
                subtitle={
                  [
                    age !== null && `Age ${age}`,
                    t.certificateNumber && `Certificate ${t.certificateNumber}`,
                    t.preExistingConditions.trim() && "Conditions declared",
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Details pending"
                }
                invalid={!t.fullName.trim()}
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
                onMove={(delta) => dispatch({ type: "insured/move", id: t.id, delta })}
                onDuplicate={() => dispatch({ type: "insured/duplicate", id: t.id })}
                onRemove={() => dispatch({ type: "insured/remove", id: t.id })}
              >
                <FieldGrid cols={domestic ? 2 : 3}>
                  <TextField
                    label={domestic ? "Full name as on ID" : "Full name as on passport"}
                    required
                    placeholder="ANANYA IYER"
                    value={t.fullName}
                    onValueChange={(v) => patch(t.id, { fullName: v })}
                  />
                  <TextField
                    label="Date of birth"
                    type="date"
                    value={t.dateOfBirth}
                    hint={
                      note ? (
                        <span className={cn(note.level === "warning" && LEVEL_TEXT.warning)}>
                          {note.message}
                        </span>
                      ) : (
                        "Premiums are priced by age."
                      )
                    }
                    onValueChange={(v) => patch(t.id, { dateOfBirth: v })}
                  />
                  {domestic ? null : (
                    <TextField
                      label="Passport number"
                      placeholder="Z1234567"
                      className="uppercase"
                      autoComplete="off"
                      value={t.passportNumber}
                      onValueChange={(v) => patch(t.id, { passportNumber: v.toUpperCase() })}
                    />
                  )}
                </FieldGrid>

                <FieldGrid cols={2}>
                  <TextField
                    label="Nominee and relationship"
                    placeholder="Karthik Iyer (spouse)"
                    value={t.nominee}
                    onValueChange={(v) => patch(t.id, { nominee: v })}
                  />
                  <TextField
                    label="Pre-existing medical conditions"
                    placeholder="None declared"
                    hint="Declared to the insurer on the proposal. Not printed in the itinerary."
                    value={t.preExistingConditions}
                    onValueChange={(v) => patch(t.id, { preExistingConditions: v })}
                  />
                </FieldGrid>

                <Separator />

                <SubHeading>Policy</SubHeading>
                <FieldGrid cols={2}>
                  <SelectField
                    label="Status"
                    value={t.status}
                    onValueChange={(v) => patch(t.id, { status: v as InsuredTraveller["status"] })}
                    options={STATUS_OPTIONS}
                  />
                  <TextField
                    label={t.status === "own-cover" ? "Their policy number" : "Certificate number"}
                    placeholder="Once issued"
                    value={t.certificateNumber}
                    onValueChange={(v) => patch(t.id, { certificateNumber: v })}
                  />
                </FieldGrid>
                {t.status === "opted-out" ? (
                  <p className="flex items-start gap-1.5 rounded-md bg-destructive/5 px-2.5 py-2 text-xs text-destructive">
                    <CircleAlert className="mt-px size-3.5 shrink-0" />
                    Keep a signed waiver from this traveller confirming they declined cover.
                  </p>
                ) : null}
              </RepeatableCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- summary */

function CoverSummaryCard() {
  const { itinerary } = useItinerary();
  const { insurance: ins, trip } = itinerary;
  const list = ins.travellers;
  const covered = list.filter((t) => isCovered(t.status)).length;
  const percent = list.length ? Math.round((covered / list.length) * 100) : 0;
  const seniors = list.filter((t) => (ageOn(t.dateOfBirth, trip.startDate) ?? 0) >= SENIOR_AGE).length;
  const period = checkPeriod(ins.startDate, ins.endDate, trip.startDate, trip.endDate);
  const sells = hasPremium(ins.mode);

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Umbrella className="size-4 text-muted-foreground" />
          Cover summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 py-4 text-sm">
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-medium">
              {list.length ? `${covered} of ${list.length} covered` : "No travellers yet"}
            </span>
            <span className="text-xs tabular-nums text-muted-foreground">{percent}%</span>
          </div>
          <Progress value={percent} className="mt-2 h-1.5" />
        </div>

        {list.length ? (
          <ul className="space-y-1.5">
            {INSURANCE_STATUSES.map((s) => {
              const count = list.filter((t) => t.status === s.value).length;
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
            <dt className="text-muted-foreground">Period</dt>
            <dd className={cn("text-right", LEVEL_TEXT[period.level])}>
              {period.level === "ok"
                ? "Covers the trip"
                : period.level === "unknown"
                  ? "Not set"
                  : "Gap in cover"}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-muted-foreground">Sum insured</dt>
            <dd className="text-right font-medium">{ins.sumInsured.trim() || "—"}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Benefits</dt>
            <dd className="tabular-nums">{pluralise(ins.benefits.length, "line")}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Assistance line</dt>
            <dd>
              {ins.assistancePhone.trim() ? (
                <span className="text-emerald-700 dark:text-emerald-400">Added</span>
              ) : (
                <span className="text-muted-foreground">Missing</span>
              )}
            </dd>
          </div>
          {seniors ? (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Seniors ({SENIOR_AGE}+)</dt>
              <dd className="font-medium text-amber-700 dark:text-amber-400">{seniors}</dd>
            </div>
          ) : null}
          {ins.requiredForVisa ? (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Visa</dt>
              <dd>
                <Badge variant="outline">Required for visa</Badge>
              </dd>
            </div>
          ) : null}
          {sells ? (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Premium</dt>
              <dd className="text-right">
                <span className="block font-semibold tabular-nums">
                  {formatMoney(insuranceTotal(ins), trip.currency)}
                </span>
                <Badge variant="outline" className="mt-1">
                  {ins.mode === "optional"
                    ? "Optional"
                    : insuranceInPackage(ins)
                      ? "In package"
                      : "Separate"}
                </Badge>
              </dd>
            </div>
          ) : null}
        </dl>
      </CardContent>
    </Card>
  );
}
