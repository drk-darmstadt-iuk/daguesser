"use client";

import { CountdownDisplay, CountdownTimer } from "@/components/CountdownTimer";
import { GuessSubmittedCard } from "@/components/GuessSubmittedCard";
import { LocationRevealCard } from "@/components/LocationRevealCard";
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
  return <LocationRevealCard locationName={location.name} />;
}
