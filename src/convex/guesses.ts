import { getAuthSessionId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { isValidBearing, isValidDistance } from "./lib/bearing";
import {
  calculateDistanceScore,
  calculateTimeBonus,
  calculateTotalScore,
  haversineDistance,
  utmDistance,
} from "./lib/scoring";
import { shuffleWithSeed } from "./lib/shuffle";

// Max score for multiple choice correct answers
const MC_CORRECT_BASE_SCORE = 1000;

/**
 * Submit a guess for the current round
 */
export const submit = mutation({
  args: {
    roundId: v.id("rounds"),
    // For imageToUtm mode
    utmEasting: v.optional(v.number()),
    utmNorthing: v.optional(v.number()),
    // For utmToLocation and directionDistance modes
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    // For multipleChoice mode
    mcOptionIndex: v.optional(v.number()),
    mcOptionName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sessionId = await getAuthSessionId(ctx);
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

    // Calculate response time (time since countdown started)
    const startTime = round.countdownEndsAt
      ? round.countdownEndsAt - round.timeLimit * 1000
      : 0;
    const responseTimeMs = startTime ? Date.now() - startTime : 0;

    // Calculate distance and score based on mode
    let distanceMeters: number;
    let distanceScore: number;
    let timeBonus: number;
    let score: number;
    let guessedUtmEasting: number | undefined;
    let guessedUtmNorthing: number | undefined;
    let guessedLatitude: number | undefined;
    let guessedLongitude: number | undefined;
    let guessedOptionIndex: number | undefined;
    let guessedOptionName: string | undefined;

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

      distanceScore = calculateDistanceScore(distanceMeters);
      timeBonus = calculateTimeBonus(responseTimeMs, round.timeLimit);
      score = calculateTotalScore(distanceScore, timeBonus);
    } else if (
      round.mode === "utmToLocation" ||
      round.mode === "directionDistance"
    ) {
      // Team selected location on map
      if (args.latitude === undefined || args.longitude === undefined) {
        throw new Error("Map coordinates required for this mode");
      }
      guessedLatitude = args.latitude;
      guessedLongitude = args.longitude;

      // Validate direction/distance mode location data
      if (round.mode === "directionDistance") {
        if (
          location.bearingDegrees !== undefined &&
          !isValidBearing(location.bearingDegrees)
        ) {
          throw new Error("Invalid bearing in location data");
        }
        if (
          location.distanceMeters !== undefined &&
          !isValidDistance(location.distanceMeters)
        ) {
          throw new Error("Invalid distance in location data");
        }
      }

      // Calculate distance using Haversine
      distanceMeters = haversineDistance(
        location.latitude,
        location.longitude,
        args.latitude,
        args.longitude,
      );

      distanceScore = calculateDistanceScore(distanceMeters);
      timeBonus = calculateTimeBonus(responseTimeMs, round.timeLimit);
      score = calculateTotalScore(distanceScore, timeBonus);
    } else if (round.mode === "multipleChoice") {
      // Team selected an option
      if (args.mcOptionIndex === undefined || args.mcOptionName === undefined) {
        throw new Error("Option selection required for this mode");
      }

      // Validate option index (0-3)
      if (args.mcOptionIndex < 0 || args.mcOptionIndex > 3) {
        throw new Error("Invalid option index (must be 0-3)");
      }

      // Server-side validation: rebuild shuffled options and verify index matches name
      const mcOptions = location.mcOptions ?? [];
      const allOptions = [location.name, ...mcOptions];
      const shuffledOptions = shuffleWithSeed(allOptions, round._id);

      if (shuffledOptions[args.mcOptionIndex] !== args.mcOptionName) {
        throw new Error("Invalid submission: option index does not match name");
      }

      guessedOptionIndex = args.mcOptionIndex;
      guessedOptionName = args.mcOptionName;

      // Check if correct
      const isCorrect = args.mcOptionName === location.name;

      // For MC mode: correct = base score + time bonus, wrong = 0
      distanceMeters = 0; // No distance concept in MC mode
      distanceScore = isCorrect ? MC_CORRECT_BASE_SCORE : 0;
      timeBonus = isCorrect
        ? calculateTimeBonus(responseTimeMs, round.timeLimit)
        : 0;
      score = calculateTotalScore(distanceScore, timeBonus);
    } else {
      throw new Error(`Unknown game mode: ${round.mode}`);
    }

    // Create the guess (score is calculated but NOT added to team yet - happens on reveal)
    const guessId = await ctx.db.insert("guesses", {
      roundId: args.roundId,
      teamId: team._id,
      guessedUtmEasting,
      guessedUtmNorthing,
      guessedLatitude,
      guessedLongitude,
      guessedOptionIndex,
      guessedOptionName,
      distanceMeters: Math.round(distanceMeters),
      score,
      distanceScore,
      timeBonus,
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

    // Get team info for each guess and apply backfill for old data
    const guessesWithTeams = await Promise.all(
      guesses.map(async (guess) => {
        const team = await ctx.db.get(guess.teamId);
        return {
          ...guess,
          teamName: team?.name ?? "Unknown",
          // Backfill for old guesses without score breakdown
          distanceScore: guess.distanceScore ?? guess.score,
          timeBonus: guess.timeBonus ?? 0,
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
    const sessionId = await getAuthSessionId(ctx);
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

    // Backfill for old guesses without score breakdown
    const distanceScore = guess.distanceScore ?? guess.score;
    const timeBonus = guess.timeBonus ?? 0;

    return {
      _id: guess._id,
      _creationTime: guess._creationTime,
      roundId: guess.roundId,
      teamId: guess.teamId,
      guessedUtmEasting: guess.guessedUtmEasting,
      guessedUtmNorthing: guess.guessedUtmNorthing,
      guessedLatitude: guess.guessedLatitude,
      guessedLongitude: guess.guessedLongitude,
      guessedOptionIndex: guess.guessedOptionIndex,
      guessedOptionName: guess.guessedOptionName,
      submittedAt: guess.submittedAt,
      responseTimeMs: guess.responseTimeMs,
      // Hide score and distance until reveal
      score: isRevealed ? guess.score : undefined,
      distanceScore: isRevealed ? distanceScore : undefined,
      timeBonus: isRevealed ? timeBonus : undefined,
      distanceMeters: isRevealed ? guess.distanceMeters : undefined,
      hasSubmitted: true,
    };
  },
});
