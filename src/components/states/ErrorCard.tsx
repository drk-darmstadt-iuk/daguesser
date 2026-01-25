"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorCardProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/**
 * Card-level error display.
 */
export function ErrorCard({
  title = "Fehler",
  message,
  onRetry,
  retryLabel = "Erneut versuchen",
}: ErrorCardProps): React.ReactElement {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-6 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-destructive/20 flex items-center justify-center">
          <AlertCircle
            className="w-6 h-6 text-destructive"
            aria-hidden="true"
          />
        </div>
        <h3 className="font-semibold text-destructive mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{message}</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
