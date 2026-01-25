"use client";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

interface JoinCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function JoinCodeInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = true,
}: JoinCodeInputProps) {
  const handleChange = (newValue: string) => {
    // Convert to uppercase
    const upperValue = newValue.toUpperCase();
    onChange(upperValue);

    // Trigger onComplete when 6 characters entered
    if (upperValue.length === 6 && onComplete) {
      onComplete(upperValue);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <label className="text-sm font-medium text-muted-foreground">
        Spiel-Code eingeben
      </label>
      <InputOTP
        maxLength={6}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        autoFocus={autoFocus}
        pattern="[A-Za-z0-9]*"
      >
        <InputOTPGroup>
          <InputOTPSlot
            index={0}
            className="h-14 w-12 text-2xl font-mono uppercase border-border bg-card"
          />
          <InputOTPSlot
            index={1}
            className="h-14 w-12 text-2xl font-mono uppercase border-border bg-card"
          />
          <InputOTPSlot
            index={2}
            className="h-14 w-12 text-2xl font-mono uppercase border-border bg-card"
          />
        </InputOTPGroup>
        <span className="text-muted-foreground text-2xl mx-1">-</span>
        <InputOTPGroup>
          <InputOTPSlot
            index={3}
            className="h-14 w-12 text-2xl font-mono uppercase border-border bg-card"
          />
          <InputOTPSlot
            index={4}
            className="h-14 w-12 text-2xl font-mono uppercase border-border bg-card"
          />
          <InputOTPSlot
            index={5}
            className="h-14 w-12 text-2xl font-mono uppercase border-border bg-card"
          />
        </InputOTPGroup>
      </InputOTP>
      <p className="text-xs text-muted-foreground">
        Frag den Moderator nach dem Code
      </p>
    </div>
  );
}
