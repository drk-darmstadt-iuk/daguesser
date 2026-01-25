"use client";

import { Pause } from "lucide-react";

export function BeamerPaused(): React.ReactElement {
  return (
    <div className="text-center space-y-8">
      <div className="w-32 h-32 mx-auto rounded-full bg-warning/20 flex items-center justify-center">
        <Pause
          className="w-16 h-16 text-warning"
          fill="currentColor"
          aria-hidden="true"
        />
      </div>
      <h1 className="text-5xl font-bold text-warning">Pause</h1>
    </div>
  );
}
