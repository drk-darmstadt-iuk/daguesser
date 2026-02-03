"use client";

import { CountdownDisplay } from "@/components/CountdownTimer";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CountdownPreviewCardProps {
  /** Time limit in seconds to display */
  timeLimit: number;
  /** Optional className for the Card */
  className?: string;
}

/**
 * Countdown preview card shown during the "showing" phase
 * before the guessing countdown starts.
 */
export function CountdownPreviewCard({
  timeLimit,
  className,
}: CountdownPreviewCardProps): React.ReactElement {
  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardContent className="pt-6 text-center">
        <p className="text-muted-foreground mb-2">Gleich geht&apos;s los!</p>
        <CountdownDisplay seconds={timeLimit} size="lg" />
      </CardContent>
    </Card>
  );
}
