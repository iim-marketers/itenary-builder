"use client";

import * as React from "react";
import {
  ChevronDown,
  Copy,
  MoveDown,
  MoveUp,
  Plus,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------ SectionHead */

export function SectionHead({
  title,
  description,
  count,
  action,
}: {
  title: string;
  description?: string;
  count?: number;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {typeof count === "number" ? (
            <Badge variant="secondary" className="tabular-nums">
              {count}
            </Badge>
          ) : null}
        </div>
        {description ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/* ----------------------------------------------------------- IconAction */

export function IconAction({
  label,
  icon: Icon,
  onClick,
  disabled,
  destructive,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "size-7 text-muted-foreground",
            destructive && "hover:bg-destructive/10 hover:text-destructive"
          )}
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
        >
          <Icon className="size-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/* ---------------------------------------------------------- RepeatableCard */

interface RepeatableCardProps {
  index: number;
  total: number;
  eyebrow: string;
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
  invalid?: boolean;
  defaultOpen?: boolean;
  onMove: (delta: number) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  children: React.ReactNode;
}

/**
 * The collapsible shell every repeatable entity (flight, hotel, activity, day)
 * shares — header summary, reorder / duplicate / delete controls, body.
 */
export function RepeatableCard({
  index,
  total,
  eyebrow,
  title,
  subtitle,
  meta,
  invalid,
  defaultOpen = true,
  onMove,
  onDuplicate,
  onRemove,
  children,
}: RepeatableCardProps) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden py-0 transition-colors",
        invalid && "border-destructive/40"
      )}
    >
      <div className="flex items-start gap-2 p-3 sm:p-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
        >
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold tabular-nums text-muted-foreground">
            {index + 1}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {eyebrow}
            </span>
            <span className="block truncate text-sm font-medium">{title}</span>
            {subtitle ? (
              <span className="block truncate text-xs text-muted-foreground">
                {subtitle}
              </span>
            ) : null}
          </span>
          <ChevronDown
            className={cn(
              "mt-1 size-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </button>

        <div className="flex shrink-0 items-center gap-0.5">
          {meta ? <div className="mr-1 hidden sm:block">{meta}</div> : null}
          <IconAction
            label="Move up"
            icon={MoveUp}
            onClick={() => onMove(-1)}
            disabled={index === 0}
          />
          <IconAction
            label="Move down"
            icon={MoveDown}
            onClick={() => onMove(1)}
            disabled={index === total - 1}
          />
          <IconAction label="Duplicate" icon={Copy} onClick={onDuplicate} />
          <IconAction label="Delete" icon={Trash2} onClick={onRemove} destructive />
        </div>
      </div>

      {meta ? (
        <div className="px-3 pb-3 sm:hidden">{meta}</div>
      ) : null}

      {open ? (
        <>
          <Separator />
          <div className="space-y-4 bg-muted/30 p-3 sm:p-4">{children}</div>
        </>
      ) : null}
    </Card>
  );
}

/* -------------------------------------------------------------- EmptyState */

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <Card className="border-dashed py-0">
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-muted">
          <Icon className="size-5 text-muted-foreground" />
        </span>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        <Button type="button" size="sm" onClick={onAction}>
          <Plus className="size-4" />
          {actionLabel}
        </Button>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------- SubHeading */

export function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}
