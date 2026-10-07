"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------- Field */

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: React.ReactNode;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Field({
  label,
  htmlFor,
  hint,
  required,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("grid content-start gap-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
        {required ? <span className="text-destructive">*</span> : null}
      </Label>
      {children}
      {hint ? (
        <p className="text-[11px] leading-tight text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/* --------------------------------------------------------------- TextField */

interface TextFieldProps
  extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  hint?: React.ReactNode;
  required?: boolean;
  wrapperClassName?: string;
}

export function TextField({
  label,
  value,
  onValueChange,
  hint,
  required,
  wrapperClassName,
  id,
  ...props
}: TextFieldProps) {
  const autoId = React.useId();
  const fieldId = id ?? autoId;
  return (
    <Field
      label={label}
      htmlFor={fieldId}
      hint={hint}
      required={required}
      className={wrapperClassName}
    >
      <Input
        id={fieldId}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        {...props}
      />
    </Field>
  );
}

/* ----------------------------------------------------------- NumericField */

interface NumberFieldProps
  extends Omit<React.ComponentProps<"input">, "onChange" | "value" | "type"> {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  hint?: React.ReactNode;
  required?: boolean;
  prefix?: string;
  suffix?: string;
  wrapperClassName?: string;
}

/**
 * A numeric input that keeps its own text buffer, so the admin can clear the
 * field or type `12.` without the value snapping back to 0 mid-keystroke.
 */
export function NumberField({
  label,
  value,
  onValueChange,
  hint,
  required,
  prefix,
  suffix,
  wrapperClassName,
  id,
  min = 0,
  ...props
}: NumberFieldProps) {
  const autoId = React.useId();
  const fieldId = id ?? autoId;
  // The text buffer is only authoritative while the field has focus, so the
  // displayed value is derived rather than mirrored — no syncing effect needed.
  const [draft, setDraft] = React.useState<string>("");
  const [focused, setFocused] = React.useState(false);
  const shown = focused ? draft : String(value ?? 0);

  const commit = (raw: string) => {
    const parsed = Number(raw);
    onValueChange(raw.trim() === "" || Number.isNaN(parsed) ? 0 : parsed);
  };

  return (
    <Field
      label={label}
      htmlFor={fieldId}
      hint={hint}
      required={required}
      className={wrapperClassName}
    >
      <div className="relative">
        {prefix ? (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-sm text-muted-foreground">
            {prefix}
          </span>
        ) : null}
        <Input
          id={fieldId}
          type="number"
          inputMode="decimal"
          min={min}
          value={shown}
          onFocus={(e) => {
            setDraft(e.target.value);
            setFocused(true);
          }}
          onChange={(e) => {
            setDraft(e.target.value);
            commit(e.target.value);
          }}
          onBlur={(e) => {
            setFocused(false);
            const parsed = Number(e.target.value);
            onValueChange(
              e.target.value.trim() === "" || Number.isNaN(parsed) ? 0 : parsed
            );
          }}
          className={cn(
            prefix && "pl-7",
            suffix && "pr-9",
            "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          )}
          {...props}
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-sm text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </div>
    </Field>
  );
}

/* ------------------------------------------------------------- SelectField */

interface SelectFieldProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  hint?: React.ReactNode;
  required?: boolean;
  wrapperClassName?: string;
}

export function SelectField({
  label,
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  hint,
  required,
  wrapperClassName,
}: SelectFieldProps) {
  const id = React.useId();
  return (
    <Field
      label={label}
      htmlFor={id}
      hint={hint}
      required={required}
      className={wrapperClassName}
    >
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

/* --------------------------------------------------------- TextAreaField */

interface TextAreaFieldProps
  extends Omit<React.ComponentProps<"textarea">, "onChange" | "value"> {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  hint?: React.ReactNode;
  required?: boolean;
  wrapperClassName?: string;
}

export function TextAreaField({
  label,
  value,
  onValueChange,
  hint,
  required,
  wrapperClassName,
  id,
  rows = 3,
  ...props
}: TextAreaFieldProps) {
  const autoId = React.useId();
  const fieldId = id ?? autoId;
  return (
    <Field
      label={label}
      htmlFor={fieldId}
      hint={hint}
      required={required}
      className={wrapperClassName}
    >
      <Textarea
        id={fieldId}
        rows={rows}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="min-h-0 resize-y"
        {...props}
      />
    </Field>
  );
}

/* ------------------------------------------------------------- ListField */

interface ListFieldProps {
  label: string;
  value: string[];
  onValueChange: (value: string[]) => void;
  hint?: React.ReactNode;
  rows?: number;
  placeholder?: string;
}

/** Edits a string[] as one-item-per-line text. */
export function ListField({
  label,
  value,
  onValueChange,
  hint,
  rows = 6,
  placeholder,
}: ListFieldProps) {
  // Kept as raw text while focused so blank lines survive mid-edit.
  const [draft, setDraft] = React.useState("");
  const [focused, setFocused] = React.useState(false);
  const shown = focused ? draft : value.join("\n");

  return (
    <TextAreaField
      label={label}
      hint={hint ?? "One item per line."}
      rows={rows}
      placeholder={placeholder}
      value={shown}
      onFocus={(e) => {
        setDraft(e.target.value);
        setFocused(true);
      }}
      onBlur={() => setFocused(false)}
      onValueChange={(next) => {
        setDraft(next);
        onValueChange(
          next.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
        );
      }}
    />
  );
}

/* ------------------------------------------------------------- FieldGroup */

export function FieldGrid({
  cols = 2,
  className,
  children,
}: {
  cols?: 1 | 2 | 3 | 4;
  className?: string;
  children: React.ReactNode;
}) {
  const map = {
    1: "sm:grid-cols-1",
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  } as const;
  return (
    <div className={cn("grid grid-cols-1 gap-3", map[cols], className)}>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------- ToggleRow */

export function ToggleRow({
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
