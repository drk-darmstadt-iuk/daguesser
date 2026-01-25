"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type RoundStatusValue =
  | "pending"
  | "showing"
  | "guessing"
  | "reveal"
  | "completed";

interface RoundStatusProps {
  status: RoundStatusValue;
  className?: string;
}

const statusConfig: Record<
  RoundStatusValue,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
    className: string;
  }
> = {
  pending: {
    label: "Wartet",
    variant: "outline",
    className: "border-muted-foreground text-muted-foreground",
  },
  showing: {
    label: "Zeigt an",
    variant: "secondary",
    className: "bg-secondary/20 text-secondary border-secondary",
  },
  guessing: {
    label: "Raten",
    variant: "default",
    className: "bg-primary text-primary-foreground animate-pulse",
  },
  reveal: {
    label: "Auflösung",
    variant: "secondary",
    className: "bg-correct/20 text-correct border-correct",
  },
  completed: {
    label: "Beendet",
    variant: "outline",
    className: "border-muted text-muted-foreground",
  },
};

export function RoundStatus({ status, className }: RoundStatusProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}

type GameStatusValue = "lobby" | "playing" | "paused" | "finished";

interface GameStatusProps {
  status: GameStatusValue;
  className?: string;
}

const gameStatusConfig: Record<
  GameStatusValue,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
    className: string;
  }
> = {
  lobby: {
    label: "Warteraum",
    variant: "outline",
    className: "border-secondary text-secondary",
  },
  playing: {
    label: "Läuft",
    variant: "default",
    className: "bg-correct text-correct-foreground",
  },
  paused: {
    label: "Pausiert",
    variant: "secondary",
    className: "bg-warning/20 text-warning border-warning",
  },
  finished: {
    label: "Beendet",
    variant: "outline",
    className: "border-muted text-muted-foreground",
  },
};

export function GameStatus({ status, className }: GameStatusProps) {
  const config = gameStatusConfig[status];

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}

type GameModeValue = "imageToUtm" | "utmToLocation";

interface GameModeProps {
  mode: GameModeValue;
  className?: string;
}

const gameModeConfig: Record<
  GameModeValue,
  { label: string; description: string }
> = {
  imageToUtm: {
    label: "Bild → UTM",
    description: "Bild anschauen, Koordinaten raten",
  },
  utmToLocation: {
    label: "UTM → Karte",
    description: "Koordinaten finden auf der Karte",
  },
};

export function GameMode({ mode, className }: GameModeProps) {
  const config = gameModeConfig[mode];

  return (
    <Badge
      variant="outline"
      className={cn("border-secondary/50 text-secondary", className)}
    >
      {config.label}
    </Badge>
  );
}

export function GameModeDescription({ mode }: { mode: GameModeValue }) {
  return (
    <span className="text-sm text-muted-foreground">
      {gameModeConfig[mode].description}
    </span>
  );
}
