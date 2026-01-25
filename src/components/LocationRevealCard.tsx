"use client";

import { Card, CardContent } from "@/components/ui/card";

interface LocationRevealCardProps {
  /** Name of the location being revealed */
  locationName: string;
  /** Additional content to render above the location name */
  children?: React.ReactNode;
  /** Additional class name for the card */
  className?: string;
}

/**
 * Card displayed during reveal phase showing the correct location.
 * Used by both player and moderator views.
 */
export function LocationRevealCard({
  locationName,
  children,
  className = "w-full max-w-md bg-card/80",
}: LocationRevealCardProps): React.ReactElement {
  return (
    <Card className={className}>
      <CardContent className="pt-6">
        {children}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Ort</p>
          <h3 className="text-lg font-bold text-secondary">{locationName}</h3>
        </div>
      </CardContent>
    </Card>
  );
}
