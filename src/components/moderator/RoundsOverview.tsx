"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Id } from "@/convex/_generated/dataModel";
import type { RoundStatusValue } from "./types";

interface RoundSummary {
  _id: Id<"rounds">;
  roundNumber: number;
  status: RoundStatusValue;
}

interface RoundsOverviewProps {
  rounds: RoundSummary[];
  currentRoundId?: Id<"rounds">;
}

export function RoundsOverview({
  rounds,
  currentRoundId,
}: RoundsOverviewProps): React.ReactElement | null {
  if (rounds.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Runden-Uebersicht</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {rounds.map((round) => {
            const isCurrent = round._id === currentRoundId;
            const isCompleted = round.status === "completed";

            return (
              <Badge
                key={round._id}
                variant={
                  isCompleted ? "secondary" : isCurrent ? "default" : "outline"
                }
                className={isCurrent ? "bg-secondary" : ""}
              >
                {round.roundNumber}
              </Badge>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
