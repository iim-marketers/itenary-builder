"use client";

import { Calculator, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  FieldGrid,
  NumberField,
  SelectField,
  TextField,
} from "@/components/forms/fields";
import { SectionHead, SubHeading } from "@/components/forms/section-shell";
import { currencySymbol, formatMoney } from "@/lib/format";
import { computePricing } from "@/lib/pricing";
import { useItinerary } from "@/store/itinerary-store";
import type { ChargeMode } from "@/lib/types";
import { cn } from "@/lib/utils";

const MODES = [
  { value: "flat", label: "Flat amount" },
  { value: "percent", label: "Percentage" },
];

export function PricingForm() {
  const { itinerary, dispatch } = useItinerary();
  const { pricing, trip } = itinerary;
  const symbol = currencySymbol(trip.currency);
  const b = computePricing(itinerary);
  const money = (n: number) => formatMoney(n, trip.currency);

  const setPricing = (patch: Partial<typeof pricing>) =>
    dispatch({ type: "pricing/patch", patch });

  return (
    <div className="space-y-4">
      <SectionHead
        title="Pricing"
        description="Component costs roll up automatically. Add the extras, then set charges, discounts and tax."
        action={
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Grand total
            </p>
            <p className="text-xl font-semibold tabular-nums">{money(b.grandTotal)}</p>
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          {/* -------------------------------------------------- from sections */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Calculated from your entries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <AutoRow
                label="Flights"
                detail={`${b.flightRows.length} sector${b.flightRows.length === 1 ? "" : "s"}`}
                amount={money(b.flightsTotal)}
              />
              <AutoRow
                label="Hotels"
                detail={`${b.hotelRows.length} stay${b.hotelRows.length === 1 ? "" : "s"}`}
                amount={money(b.hotelsTotal)}
              />
              <AutoRow
                label="Sightseeing & activities"
                detail={`${b.activityRows.length} activit${
                  b.activityRows.length === 1 ? "y" : "ies"
                } · includes guide and transport charges entered there`}
                amount={money(b.activitiesTotal)}
              />
            </CardContent>
          </Card>

          {/* ------------------------------------------------------- extras */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Additional costs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FieldGrid cols={2}>
                <NumberField
                  label="Transportation"
                  prefix={symbol}
                  min={0}
                  step="0.01"
                  value={pricing.transportation}
                  onValueChange={(v) => setPricing({ transportation: v })}
                />
                <TextField
                  label="Transportation note"
                  placeholder="Private vehicle for six days"
                  value={pricing.transportationNote}
                  onValueChange={(v) => setPricing({ transportationNote: v })}
                />
                <NumberField
                  label="Meals"
                  prefix={symbol}
                  min={0}
                  step="0.01"
                  value={pricing.meals}
                  onValueChange={(v) => setPricing({ meals: v })}
                />
                <TextField
                  label="Meals note"
                  placeholder="Two included lunches"
                  value={pricing.mealsNote}
                  onValueChange={(v) => setPricing({ mealsNote: v })}
                />
                <NumberField
                  label="Guide charges"
                  prefix={symbol}
                  min={0}
                  step="0.01"
                  hint="Guide charges beyond those entered per activity."
                  value={pricing.guideCharges}
                  onValueChange={(v) => setPricing({ guideCharges: v })}
                />
                <TextField
                  label="Guide note"
                  placeholder="English-speaking guide, full-day rate"
                  value={pricing.guideChargesNote}
                  onValueChange={(v) => setPricing({ guideChargesNote: v })}
                />
              </FieldGrid>

              <Separator />

              <div className="flex items-center justify-between">
                <SubHeading>Other expenses</SubHeading>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => dispatch({ type: "expense/add" })}
                >
                  <Plus className="size-4" />
                  Add expense
                </Button>
              </div>

              {pricing.otherExpenses.length === 0 ? (
                <p className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
                  No other expenses. Add visa fees, insurance, permits and the like.
                </p>
              ) : (
                <div className="space-y-2">
                  {pricing.otherExpenses.map((l) => (
                    <div key={l.id} className="flex items-center gap-2">
                      <Input
                        aria-label="Expense label"
                        placeholder="Visa fees, insurance, permits…"
                        className="flex-1"
                        value={l.label}
                        onChange={(e) =>
                          dispatch({
                            type: "expense/patch",
                            id: l.id,
                            patch: { label: e.target.value },
                          })
                        }
                      />
                      <div className="relative w-40">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-sm text-muted-foreground">
                          {symbol}
                        </span>
                        <Input
                          aria-label="Expense amount"
                          type="number"
                          min={0}
                          step="0.01"
                          className="pl-7 text-right tabular-nums"
                          value={l.amount}
                          onChange={(e) =>
                            dispatch({
                              type: "expense/patch",
                              id: l.id,
                              patch: { amount: Number(e.target.value) || 0 },
                            })
                          }
                        />
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                        aria-label="Remove expense"
                        onClick={() => dispatch({ type: "expense/remove", id: l.id })}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ------------------------------------------ charges & discounts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Charges, discount &amp; tax</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FieldGrid cols={3}>
                <TextField
                  label="Discount label"
                  placeholder="Early-bird discount"
                  value={pricing.discountLabel}
                  onValueChange={(v) => setPricing({ discountLabel: v })}
                />
                <SelectField
                  label="Discount type"
                  value={pricing.discountMode}
                  onValueChange={(v) => setPricing({ discountMode: v as ChargeMode })}
                  options={MODES}
                />
                <NumberField
                  label="Discount value"
                  prefix={pricing.discountMode === "flat" ? symbol : undefined}
                  suffix={pricing.discountMode === "percent" ? "%" : undefined}
                  min={0}
                  step="0.01"
                  hint={`Applied to the subtotal — ${money(b.discountAmount)}`}
                  value={pricing.discountValue}
                  onValueChange={(v) => setPricing({ discountValue: v })}
                />
              </FieldGrid>

              <FieldGrid cols={3}>
                <SelectField
                  label="Service charge type"
                  value={pricing.serviceChargeMode}
                  onValueChange={(v) =>
                    setPricing({ serviceChargeMode: v as ChargeMode })
                  }
                  options={MODES}
                />
                <NumberField
                  label="Service charge"
                  prefix={pricing.serviceChargeMode === "flat" ? symbol : undefined}
                  suffix={pricing.serviceChargeMode === "percent" ? "%" : undefined}
                  min={0}
                  step="0.01"
                  hint={`Applied after the discount — ${money(b.serviceChargeAmount)}`}
                  value={pricing.serviceChargeValue}
                  onValueChange={(v) => setPricing({ serviceChargeValue: v })}
                />
                <div />
              </FieldGrid>

              <FieldGrid cols={3}>
                <TextField
                  label="Tax label"
                  placeholder="GST"
                  value={pricing.taxLabel}
                  onValueChange={(v) => setPricing({ taxLabel: v })}
                />
                <NumberField
                  label="Tax rate"
                  suffix="%"
                  min={0}
                  max={100}
                  step="0.01"
                  hint={`On ${money(b.taxableBase)} — ${money(b.taxAmount)}`}
                  value={pricing.taxPercent}
                  onValueChange={(v) => setPricing({ taxPercent: v })}
                />
                <NumberField
                  label="Advance paid"
                  prefix={symbol}
                  min={0}
                  step="0.01"
                  hint={
                    b.advancePaid > 0
                      ? `Balance due ${money(b.balanceDue)}`
                      : "Optional — shows a balance-due line in the PDF."
                  }
                  value={pricing.advancePaid}
                  onValueChange={(v) => setPricing({ advancePaid: v })}
                />
              </FieldGrid>

              <Separator />

              <div className="grid gap-3 sm:grid-cols-2">
                <ToggleRow
                  label="Round off the grand total"
                  description="Rounds the final figure to the nearest whole unit."
                  checked={pricing.roundOff}
                  onCheckedChange={(v) => setPricing({ roundOff: v })}
                />
                <ToggleRow
                  label="Show per-person price"
                  description="Adds a per-traveller figure to the pricing page."
                  checked={pricing.showPerPerson}
                  onCheckedChange={(v) => setPricing({ showPerPerson: v })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ----------------------------------------------------- breakdown */}
        <div className="xl:sticky xl:top-4 xl:self-start">
          <Card className="gap-0 py-0">
            <CardHeader className="border-b py-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calculator className="size-4 text-muted-foreground" />
                Calculation breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 py-4 text-sm">
              <CalcRow label="Flights" value={money(b.flightsTotal)} />
              <CalcRow label="Hotels" value={money(b.hotelsTotal)} />
              <CalcRow label="Sightseeing & activities" value={money(b.activitiesTotal)} />
              {b.transportation ? (
                <CalcRow label="Transportation" value={money(b.transportation)} />
              ) : null}
              {b.meals ? <CalcRow label="Meals" value={money(b.meals)} /> : null}
              {b.guideCharges ? (
                <CalcRow label="Guide charges" value={money(b.guideCharges)} />
              ) : null}
              {b.otherExpensesTotal ? (
                <CalcRow label="Other expenses" value={money(b.otherExpensesTotal)} />
              ) : null}

              <Separator className="my-2" />
              <CalcRow label="Subtotal" value={money(b.subtotal)} strong />

              {b.discountAmount ? (
                <CalcRow
                  label={b.discountLabel}
                  value={`− ${money(b.discountAmount)}`}
                  tone="positive"
                />
              ) : null}
              {b.discountAmount ? (
                <CalcRow label="After discount" value={money(b.afterDiscount)} muted />
              ) : null}
              {b.serviceChargeAmount ? (
                <CalcRow label="Service charge" value={money(b.serviceChargeAmount)} />
              ) : null}
              {b.taxAmount ? (
                <>
                  <CalcRow label="Taxable amount" value={money(b.taxableBase)} muted />
                  <CalcRow
                    label={`${b.taxLabel} @ ${itinerary.pricing.taxPercent}%`}
                    value={money(b.taxAmount)}
                  />
                </>
              ) : null}

              <Separator className="my-2" />
              <div className="flex items-baseline justify-between gap-3 rounded-lg bg-muted px-3 py-2.5">
                <span className="text-sm font-semibold">Grand total</span>
                <span className="text-lg font-semibold tabular-nums">
                  {money(b.grandTotal)}
                </span>
              </div>

              {pricing.showPerPerson ? (
                <CalcRow
                  label={`Per person (${b.payingTravellers} paying)`}
                  value={money(b.perPerson)}
                  muted
                />
              ) : null}
              {b.advancePaid > 0 ? (
                <>
                  <CalcRow label="Advance received" value={`− ${money(b.advancePaid)}`} />
                  <CalcRow label="Balance due" value={money(b.balanceDue)} strong />
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- fragments */

function AutoRow({
  label,
  detail,
  amount,
}: {
  label: string;
  detail: string;
  amount: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border bg-muted/30 px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
      <span className="shrink-0 text-sm font-semibold tabular-nums">{amount}</span>
    </div>
  );
}

function CalcRow({
  label,
  value,
  strong,
  muted,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
  tone?: "positive";
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span
        className={cn(
          "text-sm",
          muted && "text-xs text-muted-foreground",
          strong && "font-semibold"
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "shrink-0 text-sm tabular-nums",
          muted && "text-xs text-muted-foreground",
          strong && "font-semibold",
          tone === "positive" && "text-emerald-600 dark:text-emerald-400"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded-lg border p-3">
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}
