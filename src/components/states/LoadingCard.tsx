"use client";

import { Card, CardContent } from "@/components/ui/card";

interface LoadingCardProps {
  message?: string;
}

/**
 * Card-level loading state for in-page loading.
 */
export function LoadingCard({
  message = "Wird geladen...",
}: LoadingCardProps): React.ReactElement {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-6 text-center">
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}
