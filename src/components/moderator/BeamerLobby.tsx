"use client";

interface BeamerLobbyProps {
  joinCode: string;
  teamCount: number;
}

export function BeamerLobby({
  joinCode,
  teamCount,
}: BeamerLobbyProps): React.ReactElement {
  return (
    <div className="text-center space-y-8">
      <h1 className="text-4xl font-bold text-muted-foreground">
        Bereit zum Spielen?
      </h1>
      <div className="space-y-4">
        <p className="text-2xl text-muted-foreground">Gib diesen Code ein:</p>
        <div className="font-mono text-9xl font-bold text-primary tracking-[0.3em]">
          {joinCode}
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 text-2xl text-muted-foreground">
        <span className="text-secondary text-3xl font-bold">{teamCount}</span>
        <span>Teams warten</span>
      </div>
    </div>
  );
}
