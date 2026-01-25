# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DAGuesser is a multiplayer map-based learning game for the German Red Cross (DRK) Darmstadt. Teams compete in location-guessing challenges using UTM coordinates and interactive maps.

## Development Commands

```bash
# Start development (Next.js + Convex)
npm run dev

# Build for production
npm run build

# Lint with Biome
npm run lint

# Format code with Biome
npm run format
```

**Convex CLI**: Run `npx convex dev` in a separate terminal for backend development with hot-reload.

## Architecture

### Technology Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Backend**: Convex (BaaS with real-time sync)
- **Styling**: Tailwind CSS 4, shadcn/ui (New York style)
- **Maps**: MapLibre GL
- **Auth**: Convex Auth (GitHub OAuth for moderators, Anonymous for players)

### Directory Structure

```
src/
├── app/                      # Next.js app router pages
│   ├── play/[joinCode]/      # Player game interface
│   └── moderator/            # Moderator control panel
├── components/
│   ├── game-modes/           # Game mode implementations
│   ├── moderator/            # Moderator-specific components
│   ├── states/               # Loading/error states
│   └── ui/                   # shadcn/ui components
├── convex/                   # Backend functions & schema
│   └── lib/                  # Backend utilities (scoring)
├── lib/                      # Frontend utilities (UTM, scoring)
└── types/                    # Shared TypeScript types
```

### Game Flow

**Two game modes:**
1. `imageToUtm`: Show location image → teams guess UTM coordinates
2. `utmToLocation`: Show UTM coordinates → teams find location on map

**Round states:** `pending` → `showing` → `guessing` → `reveal` → `completed`

**Game states:** `lobby` → `playing` → `paused` → `finished`

### Key Patterns

- **Moderator-only mutations**: Check `game.moderatorId === userId`
- **Session-based teams**: Teams linked to browser session ID (anonymous auth)
- **Score concealment**: Scores calculated on submit but hidden until reveal
- **Real-time sync**: Convex queries auto-update on data changes

### Database Tables (Convex)

- `games` - Game sessions with join codes
- `locations` - Geographic locations with UTM and lat/lng
- `rounds` - Individual rounds with mode and status
- `teams` - Participating teams with scores
- `guesses` - Team submissions per round

### UTM Coordinate System

The game uses UTM coordinates centered on Darmstadt (Zone 32U). Key utilities:
- `src/lib/utm.ts` - Lat/lng ↔ UTM conversion
- `src/lib/utm-helpers.ts` - Input parsing and formatting
- `src/convex/lib/scoring.ts` - Distance calculation (Haversine + UTM Euclidean)

## Code Style

- **Biome** handles linting and formatting
- **Path alias**: `@/*` maps to `src/*`
- **Components**: Use shadcn/ui patterns with CVA for variants
- **German UI**: User-facing text is in German
