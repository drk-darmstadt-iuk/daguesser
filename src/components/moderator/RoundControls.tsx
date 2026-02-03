"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import type { RoundStatusValue } from "./types";

interface RoundControlsProps {
  roundStatus: RoundStatusValue;
  roundNumber: number;
  totalRounds: number;
  timeLimit: number;
  onStartRound: () => void | Promise<void>;
  onStartCountdown: () => void | Promise<void>;
  onReveal: () => void | Promise<void>;
  onComplete: () => void | Promise<void>;
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

  // Loading states for each action to prevent double-clicks
  const [isStartingRound, setIsStartingRound] = useState(false);
  const [isStartingCountdown, setIsStartingCountdown] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleStartRound = useCallback(async () => {
    setIsStartingRound(true);
    try {
      await onStartRound();
    } finally {
      setIsStartingRound(false);
    }
  }, [onStartRound]);

  const handleStartCountdown = useCallback(async () => {
    setIsStartingCountdown(true);
    try {
      await onStartCountdown();
    } finally {
      setIsStartingCountdown(false);
    }
  }, [onStartCountdown]);

  const handleReveal = useCallback(async () => {
    setIsRevealing(true);
    try {
      await onReveal();
    } finally {
      setIsRevealing(false);
    }
  }, [onReveal]);

  const handleComplete = useCallback(async () => {
    setIsCompleting(true);
    try {
      await onComplete();
    } finally {
      setIsCompleting(false);
    }
  }, [onComplete]);

  return (
    <div className="flex flex-wrap gap-2">
      {roundStatus === "pending" && (
        <Button
          onClick={handleStartRound}
          disabled={isStartingRound}
          className="flex-1"
        >
          {isStartingRound ? "Wird gestartet..." : "Runde starten"}
        </Button>
      )}

      {roundStatus === "showing" && (
        <Button
          onClick={handleStartCountdown}
          disabled={isStartingCountdown}
          className="flex-1"
        >
          {isStartingCountdown
            ? "Wird gestartet..."
            : `Countdown starten (${timeLimit}s)`}
        </Button>
      )}

      {roundStatus === "guessing" && (
        <Button
          variant="secondary"
          onClick={handleReveal}
          disabled={isRevealing}
          className="flex-1"
        >
          {isRevealing ? "Wird aufgeloest..." : "Aufloesen"}
        </Button>
      )}

      {roundStatus === "reveal" && (
        <Button
          onClick={handleComplete}
          disabled={isCompleting}
          className="flex-1"
        >
          {isCompleting
            ? "Wird geladen..."
            : isLastRound
              ? "Spiel beenden"
              : "Naechste Runde"}
        </Button>
      )}
    </div>
  );
}
