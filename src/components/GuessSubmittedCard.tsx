"use client";

import { Check } from "lucide-react";
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
          <Check
            className="w-6 h-6 text-correct"
            strokeWidth={3}
            aria-label="Erfolgreich eingereicht"
          />
        </div>
        <p className="font-semibold text-correct">Antwort abgegeben!</p>
        <p className="text-sm text-muted-foreground mt-2">
          Warte auf die Aufloesung...
        </p>
      </CardContent>
    </Card>
  );
}
