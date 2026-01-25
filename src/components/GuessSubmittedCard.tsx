"use client";

import { Card, CardContent } from "@/components/ui/card";

/**
 * Card displayed after a player submits their guess.
 * Shows a confirmation message while waiting for the reveal phase.
 */
export function GuessSubmittedCard(): React.ReactElement {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-6 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-correct/20 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-correct"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            aria-label="Haekchen"
            role="img"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="font-semibold text-correct">Antwort abgegeben!</p>
        <p className="text-sm text-muted-foreground mt-2">
          Warte auf die Aufloesung...
        </p>
      </CardContent>
    </Card>
  );
}
