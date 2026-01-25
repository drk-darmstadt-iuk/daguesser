"use client";

import { Button } from "@/components/ui/button";
import type { GameStatus } from "./types";

interface GameControlsProps {
  gameStatus: GameStatus;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
}

export function GameControls({
  gameStatus,
  onPause,
  onResume,
  onFinish,
}: GameControlsProps): React.ReactElement | null {
  if (gameStatus === "paused") {
    return (
      <div className="flex gap-2 pt-2">
        <Button size="lg" className="w-full" onClick={onResume}>
          Fortsetzen
        </Button>
      </div>
    );
  }

  if (gameStatus === "playing") {
    return (
      <div className="flex gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={onPause}>
          Pausieren
        </Button>
        <Button variant="outline" size="sm" onClick={onFinish}>
          Spiel beenden
        </Button>
      </div>
    );
  }

  return null;
}
