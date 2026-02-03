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
import { buildShuffledMcOptions } from "./lib/shuffle";

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
      if (args.utmEasting === undefined || args.utmNorthing === undefined) {
        throw new Error("UTM coordinates required for this mode");
      }
      guessedUtmEasting = args.utmEasting;
      guessedUtmNorthing = args.utmNorthing;

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
      if (args.latitude === undefined || args.longitude === undefined) {
        throw new Error("Map coordinates required for this mode");
      }
      guessedLatitude = args.latitude;
      guessedLongitude = args.longitude;

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
      if (args.mcOptionIndex === undefined || args.mcOptionName === undefined) {
        throw new Error("Option selection required for this mode");
      }

      if (args.mcOptionIndex < 0 || args.mcOptionIndex > 3) {
        throw new Error("Invalid option index (must be 0-3)");
      }

      let shuffledOptions = round.mcShuffledOptions;
      let correctIndex = round.mcCorrectIndex;

      if (!shuffledOptions || correctIndex === undefined) {
        shuffledOptions = buildShuffledMcOptions(
          location.name,
          location.mcOptions ?? [],
          round._id,
        );
        correctIndex = shuffledOptions.indexOf(location.name);
      }

      if (shuffledOptions[args.mcOptionIndex] !== args.mcOptionName) {
        throw new Error("Invalid submission: option index does not match name");
      }

      guessedOptionIndex = args.mcOptionIndex;
      guessedOptionName = args.mcOptionName;

      const isCorrect = args.mcOptionIndex === correctIndex;

      distanceMeters = 0;
      distanceScore = isCorrect ? MC_CORRECT_BASE_SCORE : 0;
      timeBonus = isCorrect
        ? calculateTimeBonus(responseTimeMs, round.timeLimit)
        : 0;
      score = calculateTotalScore(distanceScore, timeBonus);
    } else {
      throw new Error(`Unknown game mode: ${round.mode}`);
    }

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

    return { guessId };
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

    const guessesWithTeams = await Promise.all(
      guesses.map(async (guess) => {
        const team = await ctx.db.get(guess.teamId);
        return {
          ...guess,
          teamName: team?.name ?? "Unknown",
          distanceScore: guess.distanceScore ?? guess.score,
          timeBonus: guess.timeBonus ?? 0,
        };
      }),
    );

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

    const isRevealed =
      round.status === "reveal" || round.status === "completed";

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
      score: isRevealed ? guess.score : undefined,
      distanceScore: isRevealed ? distanceScore : undefined,
      timeBonus: isRevealed ? timeBonus : undefined,
      distanceMeters: isRevealed ? guess.distanceMeters : undefined,
      hasSubmitted: true,
    };
  },
});
