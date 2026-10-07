"use client";

import * as React from "react";
import Image from "next/image";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eraser,
  Eye,
  FilePlus2,
  FileText,
  Loader2,
  Printer,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { PrintRoot } from "@/components/preview/preview-panel";
import {
  downloadBlob,
  generatePdfBlob,
  pdfFileName,
} from "@/components/pdf/generate-pdf";
import { BRAND } from "@/lib/brand";
import { buildDocModel } from "@/lib/document-model";
import {
  SAMPLES,
  withSamplePhotos,
  type SampleDefinition,
} from "@/lib/samples";
import { countBy } from "@/lib/validation";
import { clearStoredDraft, useItinerary } from "@/store/itinerary-store";
import type { SectionKey, ValidationIssue } from "@/lib/types";
import { cn } from "@/lib/utils";

const SECTION_LABEL: Record<SectionKey, string> = {
  trip: "Trip & customer",
  flights: "Flights",
  hotels: "Hotels",
  activities: "Activities",
  days: "Day-by-day",
  visa: "Visa details",
  pricing: "Pricing",
  content: "Notes & terms",
};

export function Toolbar({
  issues,
  onJumpToSection,
  previewDocked,
  onTogglePreview,
}: {
  issues: ValidationIssue[];
  onJumpToSection: (section: SectionKey) => void;
  previewDocked: boolean;
  onTogglePreview: () => void;
}) {
  const { itinerary, dispatch } = useItinerary();
  const doc = React.useMemo(() => buildDocModel(itinerary), [itinerary]);
  const { errors, warnings } = countBy(issues);

  const [busy, setBusy] = React.useState<null | "preview" | "download">(null);
  const [printing, setPrinting] = React.useState(false);
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const [confirm, setConfirm] = React.useState<null | "new" | "clear">(null);
  const [issuesOpen, setIssuesOpen] = React.useState(false);

  /* ------------------------------------------------------------- print */

  React.useEffect(() => {
    if (!printing) return;
    const done = () => setPrinting(false);
    window.addEventListener("afterprint", done);
    // Two frames so the off-screen copy is laid out before the dialog opens.
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => window.print()),
    );
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("afterprint", done);
    };
  }, [printing]);

  /* --------------------------------------------------------------- pdf */

  const guard = (): boolean => {
    if (errors > 0) {
      setIssuesOpen(true);
      toast.error(
        `Fix ${errors} required ${errors === 1 ? "field" : "fields"} before exporting.`,
      );
      return false;
    }
    return true;
  };

  const openPdfPreview = async () => {
    if (!guard()) return;
    setBusy("preview");
    try {
      const blob = await generatePdfBlob(doc);
      setPdfUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(blob);
      });
    } catch (err) {
      console.error(err);
      toast.error(
        "The PDF could not be generated. Check the console for details.",
      );
    } finally {
      setBusy(null);
    }
  };

  const downloadPdf = async () => {
    if (!guard()) return;
    setBusy("download");
    try {
      const blob = await generatePdfBlob(doc);
      downloadBlob(blob, pdfFileName(doc));
      toast.success("PDF downloaded.");
    } catch (err) {
      console.error(err);
      toast.error(
        "The PDF could not be generated. Check the console for details.",
      );
    } finally {
      setBusy(null);
    }
  };

  React.useEffect(
    () => () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    },
    [pdfUrl],
  );

  /* ------------------------------------------------------------ resets */

  const startNew = () => {
    dispatch({ type: "reset" });
    clearStoredDraft();
    setConfirm(null);
    window.scrollTo({ top: 0 });
    toast.success("Started a new itinerary.");
  };

  const clearAll = () => {
    dispatch({ type: "reset" });
    clearStoredDraft();
    setConfirm(null);
    toast.success("Everything cleared.");
  };

  const loadSample = async (sample: SampleDefinition) => {
    // Show the itinerary straight away, then fold in the photos once the
    // bundled files have loaded — they are the slow part.
    const itinerary = sample.build();
    dispatch({ type: "load", itinerary });
    toast.success(`${sample.label} sample loaded.`);
    try {
      const withPhotos = await withSamplePhotos(sample, itinerary);
      if (withPhotos !== itinerary) {
        dispatch({ type: "load", itinerary: withPhotos });
      }
    } catch {
      // The sample is perfectly usable without its pictures.
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex max-w-[110rem] flex-wrap items-center gap-3 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <Image
              src="/logo/travelmaxx-mark.png"
              alt=""
              width={64}
              height={64}
              priority
              className="size-8 shrink-0 object-contain"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight">
                {BRAND.name}
              </p>
              <p className="truncate text-[11px] leading-tight text-muted-foreground">
                {doc.headline} · {doc.customer.name}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "ml-auto h-8 gap-1.5",
              errors > 0 && "text-destructive hover:text-destructive",
            )}
            onClick={() => setIssuesOpen(true)}
          >
            {errors > 0 ? (
              <AlertTriangle className="size-4" />
            ) : (
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
            )}
            <span className="hidden sm:inline">
              {errors > 0
                ? `${errors} to fix`
                : warnings > 0
                  ? `${warnings} suggestion${warnings === 1 ? "" : "s"}`
                  : "Ready to export"}
            </span>
            {errors > 0 ? (
              <Badge variant="destructive" className="sm:hidden">
                {errors}
              </Badge>
            ) : null}
          </Button>

          <Separator orientation="vertical" className="hidden h-6 sm:block" />

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              // The pressed styling only makes sense from `xl` up, where the
              // button toggles the docked panel rather than opening a sheet.
              className={cn(
                "h-8",
                previewDocked && "xl:bg-accent xl:text-accent-foreground",
              )}
              onClick={onTogglePreview}
              aria-pressed={previewDocked}
              aria-label="Live preview"
            >
              <Eye className="size-4" />
              <span className="hidden sm:inline">Live preview</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={openPdfPreview}
              disabled={busy !== null}
              aria-label="Preview PDF"
            >
              {busy === "preview" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileText className="size-4" />
              )}
              <span className="hidden md:inline">Preview PDF</span>
            </Button>

            <Button
              size="sm"
              className="h-8"
              onClick={downloadPdf}
              disabled={busy !== null}
              aria-label="Download PDF"
            >
              {busy === "download" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              <span className="hidden md:inline">Download PDF</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  ⋯<span className="sr-only">More actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onSelect={() => setPrinting(true)}>
                  <Printer className="size-4" />
                  Print itinerary
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Sparkles className="size-4" />
                    Load sample itinerary
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-64">
                    {SAMPLES.map((sample) => (
                      <DropdownMenuItem
                        key={sample.id}
                        className="flex-col items-start gap-0.5"
                        onSelect={() => void loadSample(sample)}
                      >
                        <span>{sample.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {sample.description}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setConfirm("new")}>
                  <FilePlus2 className="size-4" />
                  Start new itinerary
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setConfirm("clear")}
                >
                  <Eraser className="size-4" />
                  Clear all
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {printing ? <PrintRoot doc={doc} /> : null}

      {/* ------------------------------------------------------ PDF preview */}
      <Dialog
        open={pdfUrl !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPdfUrl((old) => {
              if (old) URL.revokeObjectURL(old);
              return null;
            });
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="flex h-[92vh] w-[96vw] max-w-6xl flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl"
        >
          <DialogHeader className="flex-row items-center justify-between gap-3 border-b px-4 py-3">
            <div>
              <DialogTitle className="text-base">PDF preview</DialogTitle>
              <DialogDescription className="text-xs">
                {pdfFileName(doc)}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={downloadPdf} disabled={busy !== null}>
                <Download className="size-4" />
                Download
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-8"
                aria-label="Close preview"
                onClick={() =>
                  setPdfUrl((old) => {
                    if (old) URL.revokeObjectURL(old);
                    return null;
                  })
                }
              >
                <X className="size-4" />
              </Button>
            </div>
          </DialogHeader>
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              title="Itinerary PDF preview"
              className="h-full w-full flex-1 border-0 bg-muted"
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* --------------------------------------------------------- issues */}
      <Dialog open={issuesOpen} onOpenChange={setIssuesOpen}>
        <DialogContent className="max-h-[85vh] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {errors > 0 ? "Fix these before exporting" : "Itinerary check"}
            </DialogTitle>
            <DialogDescription>
              {errors > 0
                ? `${errors} required ${errors === 1 ? "item" : "items"}${
                    warnings > 0
                      ? ` and ${warnings} suggestion${warnings === 1 ? "" : "s"}`
                      : ""
                  }.`
                : warnings > 0
                  ? `Everything required is filled in. ${warnings} optional suggestion${
                      warnings === 1 ? "" : "s"
                    }.`
                  : "Everything checks out — the itinerary is ready to export."}
            </DialogDescription>
          </DialogHeader>

          {issues.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm text-muted-foreground">
                No issues found in this itinerary.
              </p>
            </div>
          ) : (
            <ScrollArea className="-mx-2 max-h-[52vh] px-2">
              <div className="space-y-4">
                {(Object.keys(SECTION_LABEL) as SectionKey[]).map((section) => {
                  const list = issues.filter((i) => i.section === section);
                  if (!list.length) return null;
                  return (
                    <div key={section}>
                      <button
                        type="button"
                        className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          onJumpToSection(section);
                          setIssuesOpen(false);
                        }}
                      >
                        {SECTION_LABEL[section]} →
                      </button>
                      <ul className="space-y-1.5">
                        {list.map((issue) => (
                          <li
                            key={issue.id}
                            className="flex items-start gap-2 text-sm"
                          >
                            <span
                              className={cn(
                                "mt-1.5 size-1.5 shrink-0 rounded-full",
                                issue.level === "error"
                                  ? "bg-destructive"
                                  : "bg-amber-500",
                              )}
                            />
                            <span
                              className={cn(
                                issue.level === "error"
                                  ? "text-foreground"
                                  : "text-muted-foreground",
                              )}
                            >
                              {issue.message}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIssuesOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -------------------------------------------------------- confirm */}
      <Dialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirm === "new"
                ? "Start a new itinerary?"
                : "Clear everything?"}
            </DialogTitle>
            <DialogDescription>
              Nothing is stored on a server — this itinerary exists only in this
              browser session and will be permanently discarded. Download the
              PDF first if you still need it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirm === "new" ? startNew : clearAll}
            >
              {confirm === "new" ? "Start new" : "Clear all"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
