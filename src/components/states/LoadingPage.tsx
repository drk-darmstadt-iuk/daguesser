"use client";

/**
 * Full page loading spinner for page-level loading states.
 */
export function LoadingPage(): React.ReactElement {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-muted-foreground">Wird geladen...</div>
    </main>
  );
}
