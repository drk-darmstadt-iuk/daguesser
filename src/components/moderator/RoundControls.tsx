"use client";

import { Button } from "@/components/ui/button";
import type { RoundStatusValue } from "./types";

interface RoundControlsProps {
  roundStatus: RoundStatusValue;
  roundNumber: number;
  totalRounds: number;
  timeLimit: number;
  onStartRound: () => void;
  onStartCountdown: () => void;
  onReveal: () => void;
  onComplete: () => void;
}

export function RoundControls({
  roundStatus,
  roundNumber,
  totalRounds,
  timeLimit,
  onStartRound,
  onStartCountdown,
  onReveal,
  onComplete,
}: RoundControlsProps): React.ReactElement {
  const isLastRound = roundNumber === totalRounds;

  return (
    <div className="flex flex-wrap gap-2">
      {roundStatus === "pending" && (
        <Button onClick={onStartRound} className="flex-1">
          Runde starten
        </Button>
      )}

      {roundStatus === "showing" && (
        <Button onClick={onStartCountdown} className="flex-1">
          Countdown starten ({timeLimit}s)
        </Button>
      )}

      {roundStatus === "guessing" && (
        <Button variant="secondary" onClick={onReveal} className="flex-1">
          Aufloesen
        </Button>
      )}

      {roundStatus === "reveal" && (
        <Button onClick={onComplete} className="flex-1">
          {isLastRound ? "Spiel beenden" : "Naechste Runde"}
        </Button>
      )}
    </div>
  );
}
