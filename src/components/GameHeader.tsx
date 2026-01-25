"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { RoundStatus, GameMode } from "./RoundStatus";

interface GameHeaderProps {
  /** Game join code */
  joinCode?: string;
  /** Current round number */
  roundNumber?: number;
  /** Total number of rounds */
  totalRounds?: number;
  /** Round status */
  roundStatus?: "pending" | "showing" | "guessing" | "reveal" | "completed";
  /** Game mode */
  mode?: "imageToUtm" | "utmToLocation";
  /** Team name (for team view) */
  teamName?: string;
  /** Team score */
  teamScore?: number;
  /** Additional class name */
  className?: string;
  /** Children (for additional controls) */
  children?: React.ReactNode;
}

export function GameHeader({
  joinCode,
  roundNumber,
  totalRounds,
  roundStatus,
  mode,
  teamName,
  teamScore,
  className,
  children,
}: GameHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between px-4 py-3 bg-card border-b border-border",
        className,
      )}
    >
      {/* Left section: Round info */}
      <div className="flex items-center gap-4">
        {roundNumber !== undefined && totalRounds !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Runde</span>
            <span className="font-mono font-bold text-lg text-secondary">
              {roundNumber}/{totalRounds}
            </span>
          </div>
        )}

        {roundStatus && <RoundStatus status={roundStatus} />}

        {mode && <GameMode mode={mode} />}
      </div>

      {/* Center section: Join code or team info */}
      <div className="flex items-center gap-4">
        {joinCode && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Code:</span>
            <Badge
              variant="outline"
              className="font-mono text-lg tracking-wider border-secondary/50"
            >
              {joinCode}
            </Badge>
          </div>
        )}
      </div>

      {/* Right section: Team info or children */}
      <div className="flex items-center gap-4">
        {teamName && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{teamName}</span>
            {teamScore !== undefined && (
              <span className="font-mono font-bold text-lg text-secondary tabular-nums">
                {teamScore.toLocaleString("de-DE")} Pkt.
              </span>
            )}
          </div>
        )}

        {children}
      </div>
    </header>
  );
}

/**
 * Minimal header for beamer/presentation view
 */
export function GameHeaderBeamer({
  roundNumber,
  totalRounds,
  joinCode,
  className,
}: Pick<
  GameHeaderProps,
  "roundNumber" | "totalRounds" | "joinCode" | "className"
>) {
  return (
    <header
      className={cn(
        "flex items-center justify-between px-8 py-4 bg-transparent",
        className,
      )}
    >
      {roundNumber !== undefined && totalRounds !== undefined && (
        <div className="flex items-center gap-3">
          <span className="text-2xl text-muted-foreground">Runde</span>
          <span className="font-mono font-bold text-4xl text-secondary">
            {roundNumber}/{totalRounds}
          </span>
        </div>
      )}

      {joinCode && (
        <div className="flex items-center gap-3">
          <span className="text-2xl text-muted-foreground">Mitspielen:</span>
          <span className="font-mono font-bold text-4xl text-primary tracking-widest">
            {joinCode}
          </span>
        </div>
      )}
    </header>
  );
}

/**
 * Header for team lobby/waiting room
 */
export function LobbyHeader({
  joinCode,
  gameName,
  teamCount,
  className,
}: {
  joinCode: string;
  gameName: string;
  teamCount: number;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col items-center gap-4 py-8 px-4 text-center",
        className,
      )}
    >
      <h1 className="text-2xl font-bold">{gameName}</h1>

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Code:</span>
        <Badge
          variant="outline"
          className="font-mono text-2xl tracking-widest border-secondary px-4 py-2"
        >
          {joinCode}
        </Badge>
      </div>

      <p className="text-muted-foreground">
        {teamCount} {teamCount === 1 ? "Team" : "Teams"} warten
      </p>
    </header>
  );
}
