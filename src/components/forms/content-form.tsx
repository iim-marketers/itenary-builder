"use client";

import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListField, TextAreaField } from "@/components/forms/fields";
import { SectionHead } from "@/components/forms/section-shell";
import { DEFAULT_CONTENT } from "@/lib/defaults";
import { useItinerary } from "@/store/itinerary-store";
import type { ContentBlocks } from "@/lib/types";

export function ContentForm() {
  const { itinerary, dispatch } = useItinerary();
  const { content } = itinerary;

  const set = (patch: Partial<ContentBlocks>) =>
    dispatch({ type: "content/patch", patch });

  const restoreDefaults = () => {
    set({
      inclusions: [...DEFAULT_CONTENT.inclusions],
      exclusions: [...DEFAULT_CONTENT.exclusions],
      importantNotes: [...DEFAULT_CONTENT.importantNotes],
      termsAndConditions: [...DEFAULT_CONTENT.termsAndConditions],
      paymentTerms: DEFAULT_CONTENT.paymentTerms,
      cancellationPolicy: DEFAULT_CONTENT.cancellationPolicy,
      closingNote: DEFAULT_CONTENT.closingNote,
    });
    toast.success("Standard wording restored.");
  };

  return (
    <div className="space-y-4">
      <SectionHead
        title="Notes &amp; terms"
        description="The standard wording that closes the document. Sensible defaults are pre-filled — edit them to match your agency."
        action={
          <Button size="sm" variant="outline" onClick={restoreDefaults}>
            <RotateCcw className="size-4" />
            Restore defaults
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inclusions</CardTitle>
          </CardHeader>
          <CardContent>
            <ListField
              label="What the price covers"
              value={content.inclusions}
              onValueChange={(v) => set({ inclusions: v })}
              rows={8}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Exclusions</CardTitle>
          </CardHeader>
          <CardContent>
            <ListField
              label="What the price does not cover"
              value={content.exclusions}
              onValueChange={(v) => set({ exclusions: v })}
              rows={8}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Important notes</CardTitle>
          </CardHeader>
          <CardContent>
            <ListField
              label="Things the traveller should know"
              value={content.importantNotes}
              onValueChange={(v) => set({ importantNotes: v })}
              rows={7}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Terms &amp; conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <ListField
              label="Booking terms"
              value={content.termsAndConditions}
              onValueChange={(v) => set({ termsAndConditions: v })}
              rows={7}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Policies &amp; closing</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          <TextAreaField
            label="Payment terms"
            rows={4}
            value={content.paymentTerms}
            onValueChange={(v) => set({ paymentTerms: v })}
          />
          <TextAreaField
            label="Cancellation policy"
            rows={4}
            value={content.cancellationPolicy}
            onValueChange={(v) => set({ cancellationPolicy: v })}
          />
          <TextAreaField
            label="Closing note"
            rows={4}
            hint="A short sign-off on the final page."
            value={content.closingNote}
            onValueChange={(v) => set({ closingNote: v })}
          />
        </CardContent>
      </Card>
    </div>
  );
}
