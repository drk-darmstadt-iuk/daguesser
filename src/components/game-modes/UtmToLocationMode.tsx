"use client";

import { CountdownDisplay, CountdownTimer } from "@/components/CountdownTimer";
import { UtmDisplay } from "@/components/UtmDisplay";
import { Card, CardContent } from "@/components/ui/card";
import type {
  GameModeGuessingProps,
  GameModeRevealProps,
  GameModeShowingProps,
} from "./types";

interface UtmToLocationShowingProps extends GameModeShowingProps {}

export function UtmToLocationShowing({
  location,
  timeLimit,
}: UtmToLocationShowingProps): React.ReactElement {
  const utmZone = location.utmZone ?? "32U";
  const utmEasting = location.utmEasting ?? 0;
  const utmNorthing = location.utmNorthing ?? 0;

  return (
    <>
      <UtmDisplay
        utmZone={utmZone}
        easting={utmEasting}
        northing={utmNorthing}
        size="lg"
      />

      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground mb-2">Gleich geht&apos;s los!</p>
          <CountdownDisplay seconds={timeLimit} size="lg" />
        </CardContent>
      </Card>
    </>
  );
}

interface UtmToLocationGuessingProps extends GameModeGuessingProps {}

export function UtmToLocationGuessing({
  location,
  countdownEndsAt,
  timeLimit,
  hasGuessed,
}: UtmToLocationGuessingProps): React.ReactElement {
  const utmZone = location.utmZone ?? "32U";
  const utmEasting = location.utmEasting ?? 0;
  const utmNorthing = location.utmNorthing ?? 0;

  return (
    <>
      <UtmDisplay
        utmZone={utmZone}
        easting={utmEasting}
        northing={utmNorthing}
        size="md"
      />

      {countdownEndsAt && (
        <CountdownTimer
          endsAt={countdownEndsAt}
          totalSeconds={timeLimit}
          size="lg"
        />
      )}

      {hasGuessed ? (
        <GuessSubmittedCard />
      ) : (
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Finde den Ort auf der Karte!
              </p>
              {/* TODO: Map component with PlanZeiger */}
              <p className="text-sm text-muted-foreground">
                Karten-Modus kommt bald...
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

interface UtmToLocationRevealProps extends GameModeRevealProps {}

export function UtmToLocationReveal({
  location,
}: UtmToLocationRevealProps): React.ReactElement {
  return (
    <Card className="w-full max-w-md bg-card/80">
      <CardContent className="pt-6 text-center">
        <p className="text-sm text-muted-foreground">Ort</p>
        <h3 className="text-lg font-bold text-secondary">{location.name}</h3>
      </CardContent>
    </Card>
  );
}

function GuessSubmittedCard(): React.ReactElement {
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
