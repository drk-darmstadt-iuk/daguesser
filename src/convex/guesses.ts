import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Import scoring utilities - these need to be duplicated here since
// Convex can't import from outside the convex folder
// We'll use simplified inline versions

/**
 * Calculate distance between two points using Haversine formula
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate UTM distance (Euclidean for same zone)
 */
function utmDistance(e1: number, n1: number, e2: number, n2: number): number {
  const dE = e2 - e1;
  const dN = n2 - n1;
  return Math.sqrt(dE * dE + dN * dN);
}

/**
 * Calculate score based on distance
 */
function calculateScore(distanceMeters: number): number {
  const maxPoints = 1000;
  const perfectRadius = 10;
  const zeroPointRadius = 5000;

  if (distanceMeters <= perfectRadius) {
    return maxPoints;
  }
  if (distanceMeters >= zeroPointRadius) {
    return 0;
  }

  const normalizedDistance =
    (distanceMeters - perfectRadius) / (zeroPointRadius - perfectRadius);
  const score = maxPoints * Math.exp(-5 * normalizedDistance);
  return Math.round(score);
}

/**
 * Submit a guess for the current round
 */
export const submit = mutation({
  args: {
    roundId: v.id("rounds"),
    // For imageToUtm mode
    utmEasting: v.optional(v.number()),
    utmNorthing: v.optional(v.number()),
    // For utmToLocation mode
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sessionId = await auth.getSessionId(ctx);
    if (!sessionId) {
      throw new Error("Must be authenticated");
    }

    // Get the round
    const round = await ctx.db.get(args.roundId);
    if (!round) {
      throw new Error("Round not found");
    }

    // Check round is accepting guesses
    if (round.status !== "guessing") {
      throw new Error("Round is not accepting guesses");
    }

    // Check countdown hasn't ended
    if (round.countdownEndsAt && Date.now() > round.countdownEndsAt) {
      throw new Error("Time's up!");
    }

    // Get the team
    const team = await ctx.db
      .query("teams")
      .withIndex("by_game_and_session", (q) =>
        q.eq("gameId", round.gameId).eq("sessionId", sessionId),
      )
      .first();

    if (!team) {
      throw new Error("Team not found - must join the game first");
    }

    // Check team hasn't already guessed this round
    const existingGuess = await ctx.db
      .query("guesses")
      .withIndex("by_round_and_team", (q) =>
        q.eq("roundId", args.roundId).eq("teamId", team._id),
      )
      .first();

    if (existingGuess) {
      throw new Error("Already submitted a guess for this round");
    }

    // Get the location
    const location = await ctx.db.get(round.locationId);
    if (!location) {
      throw new Error("Location not found");
    }

    // Calculate distance and score based on mode
    let distanceMeters: number;
    let guessedUtmEasting: number | undefined;
    let guessedUtmNorthing: number | undefined;
    let guessedLatitude: number | undefined;
    let guessedLongitude: number | undefined;

    if (round.mode === "imageToUtm") {
      // Team guessed UTM coordinates
      if (args.utmEasting === undefined || args.utmNorthing === undefined) {
        throw new Error("UTM coordinates required for this mode");
      }
      guessedUtmEasting = args.utmEasting;
      guessedUtmNorthing = args.utmNorthing;

      // Calculate distance using UTM (same zone assumed for Darmstadt)
      distanceMeters = utmDistance(
        location.utmEasting,
        location.utmNorthing,
        args.utmEasting,
        args.utmNorthing,
      );
    } else {
      // Team selected location on map
      if (args.latitude === undefined || args.longitude === undefined) {
        throw new Error("Map coordinates required for this mode");
      }
      guessedLatitude = args.latitude;
      guessedLongitude = args.longitude;

      // Calculate distance using Haversine
      distanceMeters = haversineDistance(
        location.latitude,
        location.longitude,
        args.latitude,
        args.longitude,
      );
    }

    // Calculate score
    const score = calculateScore(distanceMeters);

    // Calculate response time (time since countdown started)
    const startTime = round.countdownEndsAt
      ? round.countdownEndsAt - round.timeLimit * 1000
      : 0;
    const responseTimeMs = startTime ? Date.now() - startTime : 0;

    // Create the guess (score is calculated but NOT added to team yet - happens on reveal)
    const guessId = await ctx.db.insert("guesses", {
      roundId: args.roundId,
      teamId: team._id,
      guessedUtmEasting,
      guessedUtmNorthing,
      guessedLatitude,
      guessedLongitude,
      distanceMeters: Math.round(distanceMeters),
      score,
      responseTimeMs: Math.max(0, responseTimeMs),
      submittedAt: Date.now(),
    });

    // NOTE: Team score is NOT updated here - it happens when moderator reveals the round
    // This keeps the results hidden until the reveal

    return {
      guessId,
      // Don't return score/distance to keep it secret until reveal
    };
  },
});

/**
 * Get guesses for a round (for reveal)
 */
export const getForRound = query({
  args: { roundId: v.id("rounds") },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) return [];

    // Only show guesses during reveal or after
    if (round.status !== "reveal" && round.status !== "completed") {
      return [];
    }

    const guesses = await ctx.db
      .query("guesses")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .collect();

    // Get team info for each guess
    const guessesWithTeams = await Promise.all(
      guesses.map(async (guess) => {
        const team = await ctx.db.get(guess.teamId);
        return {
          ...guess,
          teamName: team?.name ?? "Unknown",
        };
      }),
    );

    // Sort by score descending
    return guessesWithTeams.sort((a, b) => b.score - a.score);
  },
});

/**
 * Get my guess for a round
 * Note: Score and distance are hidden until the round is revealed
 */
export const getMyGuess = query({
  args: { roundId: v.id("rounds") },
  handler: async (ctx, args) => {
    const sessionId = await auth.getSessionId(ctx);
    if (!sessionId) return null;

    const round = await ctx.db.get(args.roundId);
    if (!round) return null;

    const team = await ctx.db
      .query("teams")
      .withIndex("by_game_and_session", (q) =>
        q.eq("gameId", round.gameId).eq("sessionId", sessionId),
      )
      .first();

    if (!team) return null;

    const guess = await ctx.db
      .query("guesses")
      .withIndex("by_round_and_team", (q) =>
        q.eq("roundId", args.roundId).eq("teamId", team._id),
      )
      .first();

    if (!guess) return null;

    // Only show score and distance after reveal
    const isRevealed =
      round.status === "reveal" || round.status === "completed";

    return {
      _id: guess._id,
      _creationTime: guess._creationTime,
      roundId: guess.roundId,
      teamId: guess.teamId,
      guessedUtmEasting: guess.guessedUtmEasting,
      guessedUtmNorthing: guess.guessedUtmNorthing,
      guessedLatitude: guess.guessedLatitude,
      guessedLongitude: guess.guessedLongitude,
      submittedAt: guess.submittedAt,
      responseTimeMs: guess.responseTimeMs,
      // Hide score and distance until reveal
      score: isRevealed ? guess.score : undefined,
      distanceMeters: isRevealed ? guess.distanceMeters : undefined,
      hasSubmitted: true,
    };
  },
});

/**
 * Check if team has guessed this round
 */
export const hasGuessed = query({
  args: { roundId: v.id("rounds") },
  handler: async (ctx, args) => {
    const sessionId = await auth.getSessionId(ctx);
    if (!sessionId) return false;

    const round = await ctx.db.get(args.roundId);
    if (!round) return false;

    const team = await ctx.db
      .query("teams")
      .withIndex("by_game_and_session", (q) =>
        q.eq("gameId", round.gameId).eq("sessionId", sessionId),
      )
      .first();

    if (!team) return false;

    const guess = await ctx.db
      .query("guesses")
      .withIndex("by_round_and_team", (q) =>
        q.eq("roundId", args.roundId).eq("teamId", team._id),
      )
      .first();

    return guess !== null;
  },
});

/**
 * Get guess count for a round
 */
export const getCount = query({
  args: { roundId: v.id("rounds") },
  handler: async (ctx, args) => {
    const guesses = await ctx.db
      .query("guesses")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .collect();

    return guesses.length;
  },
});
