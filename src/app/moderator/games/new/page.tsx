"use client";

import { Authenticated, Unauthenticated, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { latLngToUtm } from "@/lib/utm";
import type { GameMode } from "@/types/game";
import { api } from "../../../../convex/_generated/api";

// Game mode configuration for UI
const GAME_MODE_CONFIG: Record<
  GameMode,
  { label: string; description: string }
> = {
  imageToUtm: {
    label: "Bild → UTM",
    description: "Bild zeigen, UTM-Koordinaten raten",
  },
  utmToLocation: {
    label: "UTM → Karte",
    description: "UTM-Koordinaten zeigen, Ort auf Karte finden",
  },
  directionDistance: {
    label: "Richtung & Distanz",
    description: "Startpunkt + Richtung/Distanz zeigen, Ziel finden",
  },
  multipleChoice: {
    label: "Multiple Choice",
    description: "Bild zeigen, aus 4 Optionen wählen",
  },
};

// Sample locations for Darmstadt with data for all game modes
const SAMPLE_LOCATIONS = [
  {
    name: "Luisenplatz",
    latitude: 49.8728,
    longitude: 8.6512,
    imageUrls: [],
    hint: "Zentrum von Darmstadt",
    difficulty: "easy" as const,
    category: "Landmark",
    // Multiple Choice options (3 wrong answers)
    mcOptions: ["Friedensplatz", "Marktplatz", "Karolinenplatz"],
    // Direction & Distance: from Schloss Darmstadt
    startPointName: "Schloss Darmstadt",
    startPointLatitude: 49.8744,
    startPointLongitude: 8.6547,
    bearingDegrees: 220, // SW direction
    distanceMeters: 300,
  },
  {
    name: "Mathildenhöhe",
    latitude: 49.8756,
    longitude: 8.6694,
    imageUrls: [],
    hint: "Jugendstil-Ensemble",
    difficulty: "medium" as const,
    category: "Landmark",
    mcOptions: ["Rosenhöhe", "Prinz-Emil-Garten", "Herrngarten"],
    startPointName: "Russische Kapelle",
    startPointLatitude: 49.8765,
    startPointLongitude: 8.6682,
    bearingDegrees: 200,
    distanceMeters: 120,
  },
  {
    name: "Schloss Darmstadt",
    latitude: 49.8744,
    longitude: 8.6547,
    imageUrls: [],
    hint: "Residenzschloss",
    difficulty: "easy" as const,
    category: "Historisch",
    mcOptions: ["Jagdschloss Kranichstein", "Orangerie", "Prinz-Georg-Palais"],
    startPointName: "Marktplatz",
    startPointLatitude: 49.8735,
    startPointLongitude: 8.6525,
    bearingDegrees: 45, // NE direction
    distanceMeters: 200,
  },
  {
    name: "Hauptbahnhof",
    latitude: 49.8722,
    longitude: 8.6294,
    imageUrls: [],
    hint: "Verkehrsknotenpunkt",
    difficulty: "easy" as const,
    category: "Infrastruktur",
    mcOptions: ["Ostbahnhof", "Nordbahnhof", "TU Lichtwiese"],
    startPointName: "Luisenplatz",
    startPointLatitude: 49.8728,
    startPointLongitude: 8.6512,
    bearingDegrees: 270, // West
    distanceMeters: 1700,
  },
  {
    name: "Großer Woog",
    latitude: 49.8681,
    longitude: 8.6672,
    imageUrls: [],
    hint: "Naturbadestelle",
    difficulty: "medium" as const,
    category: "Natur",
    mcOptions: ["Steinbrücker Teich", "Backhausteich", "Oberwaldhaus"],
    startPointName: "Jugendstilbad",
    startPointLatitude: 49.8695,
    startPointLongitude: 8.6655,
    bearingDegrees: 150, // SE direction
    distanceMeters: 200,
  },
];

/** Input location data that can come from sample data or JSON import */
interface LocationInput {
  name: string;
  latitude: number;
  longitude: number;
  imageUrls?: string[];
  hint?: string;
  difficulty?: "easy" | "medium" | "hard";
  category?: string;
  bearingDegrees?: number;
  distanceMeters?: number;
  startPointName?: string;
  startPointImageUrls?: string[];
  startPointLatitude?: number;
  startPointLongitude?: number;
  mcOptions?: string[];
}

/**
 * Transform location input to include UTM coordinates for import.
 */
function transformLocationWithUtm(loc: LocationInput) {
  const utm = latLngToUtm(loc.latitude, loc.longitude);
  return {
    name: loc.name,
    latitude: loc.latitude,
    longitude: loc.longitude,
    utmZone: `${utm.zone}${utm.zoneLetter}`,
    utmEasting: utm.easting,
    utmNorthing: utm.northing,
    imageUrls: loc.imageUrls ?? [],
    hint: loc.hint,
    difficulty: loc.difficulty ?? "medium",
    category: loc.category,
    bearingDegrees: loc.bearingDegrees,
    distanceMeters: loc.distanceMeters,
    startPointName: loc.startPointName,
    startPointImageUrls: loc.startPointImageUrls,
    startPointLatitude: loc.startPointLatitude,
    startPointLongitude: loc.startPointLongitude,
    mcOptions: loc.mcOptions,
  };
}

function NewGameForm() {
  const router = useRouter();
  const [gameName, setGameName] = useState("");
  const [timeLimit, setTimeLimit] = useState("30");
  const [jsonInput, setJsonInput] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModes, setSelectedModes] = useState<string[]>(["imageToUtm"]);

  const createGame = useMutation(api.games.create);
  const importLocations = useMutation(api.games.importLocations);

  const handleCreateWithSample = async () => {
    if (!gameName.trim()) {
      setError("Bitte gib einen Spielnamen ein");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const { gameId } = await createGame({
        name: gameName.trim(),
        defaultTimeLimit: Number.parseInt(timeLimit, 10),
      });

      const locationsWithUtm = SAMPLE_LOCATIONS.map(transformLocationWithUtm);

      await importLocations({
        gameId,
        locations: locationsWithUtm,
        modes: selectedModes as GameMode[],
      });

      router.push(`/moderator/games/${gameId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Erstellen");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateFromJson = async () => {
    if (!gameName.trim()) {
      setError("Bitte gib einen Spielnamen ein");
      return;
    }

    if (!jsonInput.trim()) {
      setError("Bitte füge JSON-Daten ein");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const data = JSON.parse(jsonInput);

      if (!Array.isArray(data.locations)) {
        throw new Error("JSON muss ein 'locations' Array enthalten");
      }

      const { gameId } = await createGame({
        name: gameName.trim(),
        defaultTimeLimit:
          data.defaultTimeLimit ?? Number.parseInt(timeLimit, 10),
      });

      const locationsWithUtm = (data.locations as LocationInput[]).map(
        transformLocationWithUtm,
      );

      await importLocations({
        gameId,
        locations: locationsWithUtm,
        modes: data.modes ?? selectedModes,
      });

      router.push(`/moderator/games/${gameId}`);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError("Ungültiges JSON-Format");
      } else {
        setError(err instanceof Error ? err.message : "Fehler beim Erstellen");
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/moderator")}
            className="mb-4"
          >
            &larr; Zurück
          </Button>
          <h1 className="text-3xl font-bold">Neues Spiel erstellen</h1>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Spiel-Einstellungen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Game Name */}
            <div className="space-y-2">
              <Label htmlFor="gameName">Spielname</Label>
              <Input
                id="gameName"
                placeholder="z.B. Kartenkunde Training 2024"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
              />
            </div>

            {/* Time Limit */}
            <div className="space-y-2">
              <Label htmlFor="timeLimit">Zeitlimit pro Runde (Sekunden)</Label>
              <Input
                id="timeLimit"
                type="number"
                min="10"
                max="300"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
              />
            </div>

            {/* Game Modes */}
            <div className="space-y-2">
              <Label>Spielmodi</Label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(GAME_MODE_CONFIG) as GameMode[]).map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    variant={
                      selectedModes.includes(mode) ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setSelectedModes((prev) =>
                        prev.includes(mode)
                          ? prev.filter((m) => m !== mode)
                          : [...prev, mode],
                      )
                    }
                    title={GAME_MODE_CONFIG[mode].description}
                  >
                    {GAME_MODE_CONFIG[mode].label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Bei mehreren Modi wird für jeden Ort eine Runde pro Modus
                erstellt.
              </p>
            </div>

            {/* Locations Source */}
            <Tabs defaultValue="sample" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sample">Beispiel-Orte</TabsTrigger>
                <TabsTrigger value="json">JSON importieren</TabsTrigger>
              </TabsList>

              <TabsContent value="sample" className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm mb-2">
                    <strong>{SAMPLE_LOCATIONS.length} Beispiel-Orte</strong> aus
                    Darmstadt werden verwendet:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {SAMPLE_LOCATIONS.map((loc) => (
                      <li key={loc.name}>
                        • {loc.name} ({loc.difficulty})
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleCreateWithSample}
                  disabled={isCreating || selectedModes.length === 0}
                >
                  {isCreating
                    ? "Wird erstellt..."
                    : "Mit Beispiel-Orten erstellen"}
                </Button>
              </TabsContent>

              <TabsContent value="json" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="json">JSON-Daten</Label>
                  <textarea
                    id="json"
                    className="w-full h-48 p-3 rounded-md border border-input bg-background text-sm font-mono"
                    placeholder={`{
  "locations": [
    {
      "name": "Ort Name",
      "latitude": 49.8728,
      "longitude": 8.6512,
      "imageUrls": ["https://..."],
      "hint": "Hinweis",
      "difficulty": "easy",
      "category": "Kategorie",
      "mcOptions": ["Falsch 1", "Falsch 2", "Falsch 3"],
      "startPointName": "Startpunkt",
      "startPointLatitude": 49.87,
      "startPointLongitude": 8.65,
      "bearingDegrees": 45,
      "distanceMeters": 500
    }
  ],
  "modes": ["imageToUtm", "multipleChoice"],
  "defaultTimeLimit": 30
}`}
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                  />
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleCreateFromJson}
                  disabled={isCreating || selectedModes.length === 0}
                >
                  {isCreating ? "Wird erstellt..." : "Mit JSON erstellen"}
                </Button>
              </TabsContent>
            </Tabs>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function NewGamePage() {
  const router = useRouter();

  return (
    <>
      <Unauthenticated>
        <main className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">
                Bitte melde dich an, um Spiele zu erstellen.
              </p>
              <Button onClick={() => router.push("/moderator")}>
                Zur Anmeldung
              </Button>
            </CardContent>
          </Card>
        </main>
      </Unauthenticated>
      <Authenticated>
        <NewGameForm />
      </Authenticated>
    </>
  );
}
