"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface NotFoundPageProps {
  title?: string;
  message?: string;
  onBack?: () => void;
  backLabel?: string;
}

/**
 * Full page 404/not found state.
 */
export function NotFoundPage({
  title = "Nicht gefunden",
  message = "Die angeforderte Ressource wurde nicht gefunden.",
  onBack,
  backLabel = "Zurueck",
}: NotFoundPageProps): React.ReactElement {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <h2 className="text-xl font-bold text-destructive mb-2">{title}</h2>
          <p className="text-muted-foreground mb-4">{message}</p>
          {onBack && <Button onClick={onBack}>{backLabel}</Button>}
        </CardContent>
      </Card>
    </main>
  );
}
