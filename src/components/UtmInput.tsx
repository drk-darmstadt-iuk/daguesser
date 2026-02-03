"use client";

import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface UtmInputProps {
  /** Base UTM zone string (e.g., "32U") */
  utmZone?: string;
  /** Base easting km value (e.g., 477 for 477xxx) - displayed but not editable */
  baseEastingKm?: number;
  /** Base northing km value (e.g., 5523 for 5523xxx) - displayed but not editable */
  baseNorthingKm?: number;
  /** Current easting value (last 3 digits) */
  eastingValue: string;
  /** Current northing value (last 3 digits) */
  northingValue: string;
  /** Called when easting changes */
  onEastingChange: (value: string) => void;
  /** Called when northing changes */
  onNorthingChange: (value: string) => void;
  /** Called when both values are complete and valid */
  onComplete?: (easting: string, northing: string) => void;
  /** Disable input */
  disabled?: boolean;
  /** Show error state */
  error?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Auto focus on mount */
  autoFocus?: boolean;
  className?: string;
}

export function UtmInput({
  utmZone = "32U",
  baseEastingKm,
  baseNorthingKm,
  eastingValue,
  northingValue,
  onEastingChange,
  onNorthingChange,
  onComplete,
  disabled = false,
  error,
  size = "md",
  autoFocus = true,
  className,
}: UtmInputProps) {
  const eastingRef = useRef<HTMLInputElement>(null);
  const northingRef = useRef<HTMLInputElement>(null);

  const sizeConfig = {
    sm: { inputWidth: "w-20", fontSize: "text-lg", labelSize: "text-xs" },
    md: { inputWidth: "w-24", fontSize: "text-2xl", labelSize: "text-sm" },
    lg: { inputWidth: "w-32", fontSize: "text-4xl", labelSize: "text-base" },
  };

  const config = sizeConfig[size];

  useEffect(() => {
    if (autoFocus && eastingRef.current) {
      eastingRef.current.focus();
    }
  }, [autoFocus]);

  const handleEastingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 3);
    onEastingChange(value);

    // Auto-advance to northing when 3 digits entered
    if (value.length === 3 && northingRef.current) {
      northingRef.current.focus();
    }
  };

  const handleNorthingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 3);
    onNorthingChange(value);

    // Trigger onComplete when both fields are filled
    if (value.length === 3 && eastingValue.length === 3 && onComplete) {
      onComplete(eastingValue, value);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: "easting" | "northing",
  ) => {
    // Backspace on empty northing goes back to easting
    if (
      e.key === "Backspace" &&
      field === "northing" &&
      northingValue === "" &&
      eastingRef.current
    ) {
      eastingRef.current.focus();
    }
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Zone display */}
      <div className="text-center">
        <span className="font-mono text-secondary text-sm">Zone {utmZone}</span>
      </div>

      {/* Easting input */}
      <div className="flex flex-col gap-2">
        <Label className={cn("text-muted-foreground", config.labelSize)}>
          Rechtswert (Ost)
        </Label>
        <div className="flex items-center gap-2">
          {baseEastingKm !== undefined && (
            <span
              className={cn("font-mono text-muted-foreground", config.fontSize)}
            >
              {baseEastingKm}
            </span>
          )}
          <Input
            ref={eastingRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={3}
            value={eastingValue}
            onChange={handleEastingChange}
            onKeyDown={(e) => handleKeyDown(e, "easting")}
            disabled={disabled}
            placeholder="000"
            className={cn(
              "font-mono text-center bg-card border-secondary/50 focus:border-secondary",
              config.inputWidth,
              config.fontSize,
              error && "border-destructive",
            )}
          />
        </div>
      </div>

      {/* Northing input */}
      <div className="flex flex-col gap-2">
        <Label className={cn("text-muted-foreground", config.labelSize)}>
          Hochwert (Nord)
        </Label>
        <div className="flex items-center gap-2">
          {baseNorthingKm !== undefined && (
            <span
              className={cn("font-mono text-muted-foreground", config.fontSize)}
            >
              {baseNorthingKm}
            </span>
          )}
          <Input
            ref={northingRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={3}
            value={northingValue}
            onChange={handleNorthingChange}
            onKeyDown={(e) => handleKeyDown(e, "northing")}
            disabled={disabled}
            placeholder="000"
            className={cn(
              "font-mono text-center bg-card border-secondary/50 focus:border-secondary",
              config.inputWidth,
              config.fontSize,
              error && "border-destructive",
            )}
          />
        </div>
      </div>

      {/* Error message */}
      {error && <p className="text-sm text-destructive text-center">{error}</p>}
    </div>
  );
}

/**
 * Compact inline UTM input for smaller spaces
 */
export function UtmInputCompact({
  eastingValue,
  northingValue,
  onEastingChange,
  onNorthingChange,
  disabled = false,
  className,
}: Pick<
  UtmInputProps,
  | "eastingValue"
  | "northingValue"
  | "onEastingChange"
  | "onNorthingChange"
  | "disabled"
  | "className"
>) {
  const northingRef = useRef<HTMLInputElement>(null);

  const handleEastingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 3);
    onEastingChange(value);
    if (value.length === 3 && northingRef.current) {
      northingRef.current.focus();
    }
  };

  const handleNorthingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 3);
    onNorthingChange(value);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-muted-foreground text-sm">E</span>
      <Input
        type="text"
        inputMode="numeric"
        maxLength={3}
        value={eastingValue}
        onChange={handleEastingChange}
        disabled={disabled}
        placeholder="000"
        className="w-16 font-mono text-center text-lg bg-card"
      />
      <span className="text-muted-foreground text-sm">N</span>
      <Input
        ref={northingRef}
        type="text"
        inputMode="numeric"
        maxLength={3}
        value={northingValue}
        onChange={handleNorthingChange}
        disabled={disabled}
        placeholder="000"
        className="w-16 font-mono text-center text-lg bg-card"
      />
    </div>
  );
}
