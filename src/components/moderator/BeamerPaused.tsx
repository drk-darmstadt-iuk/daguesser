"use client";

export function BeamerPaused(): React.ReactElement {
  return (
    <div className="text-center space-y-8">
      <div className="w-32 h-32 mx-auto rounded-full bg-warning/20 flex items-center justify-center">
        <svg
          className="w-16 h-16 text-warning"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-label="Pause Icon"
          role="img"
        >
          <rect x="6" y="4" width="4" height="16" />
          <rect x="14" y="4" width="4" height="16" />
        </svg>
      </div>
      <h1 className="text-5xl font-bold text-warning">Pause</h1>
    </div>
  );
}
