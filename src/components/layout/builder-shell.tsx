"use client";

import * as React from "react";
import {
  CalendarRange,
  Camera,
  Hotel,
  Plane,
  ReceiptText,
  ScrollText,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivitiesForm } from "@/components/forms/activities-form";
import { ContentForm } from "@/components/forms/content-form";
import { DaysForm } from "@/components/forms/days-form";
import { FlightsForm } from "@/components/forms/flights-form";
import { HotelsForm } from "@/components/forms/hotels-form";
import { PricingForm } from "@/components/forms/pricing-form";
import { TripForm } from "@/components/forms/trip-form";
import { Toolbar } from "@/components/layout/toolbar";
import { PreviewPanel } from "@/components/preview/preview-panel";
import { buildDocModel } from "@/lib/document-model";
import { formatMoney } from "@/lib/format";
import { validateItinerary } from "@/lib/validation";
import { useItinerary } from "@/store/itinerary-store";
import type { SectionKey } from "@/lib/types";
import { cn } from "@/lib/utils";

const TABS: {
  key: SectionKey;
  label: string;
  short: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "trip", label: "Trip & customer", short: "Trip", icon: UserRound },
  { key: "flights", label: "Flights", short: "Flights", icon: Plane },
  { key: "hotels", label: "Hotels", short: "Hotels", icon: Hotel },
  { key: "activities", label: "Activities", short: "Activities", icon: Camera },
  { key: "days", label: "Day-by-day", short: "Days", icon: CalendarRange },
  { key: "pricing", label: "Pricing", short: "Pricing", icon: ReceiptText },
  { key: "content", label: "Notes & terms", short: "Terms", icon: ScrollText },
];

export function BuilderShell() {
  const { itinerary, hydrated } = useItinerary();
  const [tab, setTab] = React.useState<SectionKey>("trip");
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewDocked, setPreviewDocked] = React.useState(false);

  const issues = React.useMemo(() => validateItinerary(itinerary), [itinerary]);
  const doc = React.useMemo(() => buildDocModel(itinerary), [itinerary]);

  const errorsBySection = React.useMemo(() => {
    const map = {} as Record<SectionKey, number>;
    for (const issue of issues) {
      if (issue.level !== "error") continue;
      map[issue.section] = (map[issue.section] ?? 0) + 1;
    }
    return map;
  }, [issues]);

  // Wide screens dock the preview beside the forms; anything narrower has no
  // room for it, so the same button slides it in as an overlay instead.
  const togglePreview = () => {
    if (window.matchMedia("(min-width: 80rem)").matches) {
      setPreviewDocked((open) => !open);
    } else {
      setPreviewOpen(true);
    }
  };

  const jump = (section: SectionKey) => {
    setTab(section);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-[110rem] space-y-4 p-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[60vh] w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Toolbar
        issues={issues}
        onJumpToSection={jump}
        previewDocked={previewDocked}
        onTogglePreview={togglePreview}
      />

      <main className="mx-auto max-w-[110rem] px-4 py-4">
        <div
          className={cn(
            "grid gap-5",
            previewDocked &&
              "xl:grid-cols-[minmax(0,1fr)_30rem] 2xl:grid-cols-[minmax(0,1fr)_34rem]",
          )}
        >
          {/* ------------------------------------------------------ forms */}
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as SectionKey)}
            className="min-w-0 gap-4"
          >
            <div className="w-full overflow-x-auto pb-0.5">
              <TabsList className="w-max min-w-full justify-start">
                {TABS.map((t) => {
                  const count = errorsBySection[t.key] ?? 0;
                  return (
                    <TabsTrigger key={t.key} value={t.key} className="gap-1.5">
                      <t.icon className="size-4" />
                      <span className="hidden sm:inline">{t.label}</span>
                      <span className="sm:hidden">{t.short}</span>
                      {count > 0 ? (
                        <Badge
                          variant="destructive"
                          className="size-4 justify-center rounded-full p-0 text-[10px] tabular-nums"
                        >
                          {count}
                        </Badge>
                      ) : null}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            <TabsContent value="trip" className="mt-0">
              <TripForm />
            </TabsContent>
            <TabsContent value="flights" className="mt-0">
              <FlightsForm />
            </TabsContent>
            <TabsContent value="hotels" className="mt-0">
              <HotelsForm />
            </TabsContent>
            <TabsContent value="activities" className="mt-0">
              <ActivitiesForm />
            </TabsContent>
            <TabsContent value="days" className="mt-0">
              <DaysForm />
            </TabsContent>
            <TabsContent value="pricing" className="mt-0">
              <PricingForm />
            </TabsContent>
            <TabsContent value="content" className="mt-0">
              <ContentForm />
            </TabsContent>
          </Tabs>

          {/* ---------------------------------------------------- preview */}
          <aside className={cn("hidden", previewDocked && "xl:block")}>
            <div className="sticky top-17">
              <PreviewHeader doc={doc} />
              <Card className="overflow-hidden p-0">
                <div className="h-[calc(100vh-9.5rem)] overflow-y-auto overscroll-contain bg-muted/60 p-3">
                  <PreviewPanel doc={doc} />
                </div>
              </Card>
            </div>
          </aside>
        </div>
      </main>

      {/* --------------------------------------------- preview on small screens */}
      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-2xl">
          <SheetHeader className="border-b">
            <SheetTitle>Live preview</SheetTitle>
          </SheetHeader>
          <div className="h-full overflow-y-auto overscroll-contain bg-muted/60 p-3">
            <PreviewPanel doc={doc} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function PreviewHeader({ doc }: { doc: ReturnType<typeof buildDocModel> }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3 px-1">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Live preview
        </p>
        <p className="truncate text-sm font-medium">{doc.headline}</p>
      </div>
      <div className="text-right">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Total
        </p>
        <p
          className={cn(
            "text-sm font-semibold tabular-nums",
            doc.pricing.grandTotal === 0 && "text-muted-foreground",
          )}
        >
          {formatMoney(doc.pricing.grandTotal, doc.currency)}
        </p>
      </div>
    </div>
  );
}
