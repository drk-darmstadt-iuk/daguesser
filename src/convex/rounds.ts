import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

/**
 * Get the current round for a game
 */
export const getCurrent = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return null;

    // Get the current round based on game's currentRoundIndex
    const round = await ctx.db
      .query("rounds")
      .withIndex("by_game_and_number", (q) =>
        q.eq("gameId", args.gameId).eq("roundNumber", game.currentRoundIndex + 1),
      )
      .first();

    if (!round) return null;

    // Get the location for this round
    const location = await ctx.db.get(round.locationId);

    // Get guess count for this round
    const guesses = await ctx.db
      .query("guesses")
      .withIndex("by_round", (q) => q.eq("roundId", round._id))
      .collect();

    // Get total active teams
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return {
      ...round,
      location: location
        ? {
            _id: location._id,
            name: location.name,
            // Only include full coordinates during reveal
            ...(round.status === "reveal" || round.status === "completed"
              ? {
                  latitude: location.latitude,
                  longitude: location.longitude,
                  utmEasting: location.utmEasting,
                  utmNorthing: location.utmNorthing,
                  utmZone: location.utmZone,
                }
              : {}),
            // Include image URLs for imageToUtm mode
            ...(round.mode === "imageToUtm"
              ? { imageUrls: location.imageUrls }
              : {}),
            // Include UTM for utmToLocation mode (but only the display parts)
            ...(round.mode === "utmToLocation"
              ? {
                  utmZone: location.utmZone,
                  utmEasting: location.utmEasting,
                  utmNorthing: location.utmNorthing,
                }
              : {}),
            hint: location.hint,
            difficulty: location.difficulty,
          }
        : null,
      guessCount: guesses.length,
      totalTeams: teams.length,
      allTeamsGuessed: guesses.length >= teams.length,
    };
  },
});

/**
 * Get a specific round by ID
 */
export const get = query({
  args: { roundId: v.id("rounds") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.roundId);
  },
});

/**
 * List all rounds for a game
 */
export const listByGame = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    return rounds.sort((a, b) => a.roundNumber - b.roundNumber);
  },
});

/**
 * Start showing the round (location/image visible, countdown not started)
 */
export const start = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.moderatorId !== userId) {
      throw new Error("Only the moderator can start rounds");
    }

    if (game.status !== "playing") {
      throw new Error("Game must be playing");
    }

    // Get current round
    const round = await ctx.db
      .query("rounds")
      .withIndex("by_game_and_number", (q) =>
        q.eq("gameId", args.gameId).eq("roundNumber", game.currentRoundIndex + 1),
      )
      .first();

    if (!round) {
      throw new Error("No more rounds");
    }

    if (round.status !== "pending") {
      throw new Error("Round already started");
    }

    await ctx.db.patch(round._id, {
      status: "showing",
      startedAt: Date.now(),
    });

    return { roundId: round._id };
  },
});

/**
 * Start the countdown (teams can now guess)
 */
export const startCountdown = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.moderatorId !== userId) {
      throw new Error("Only the moderator can start countdown");
    }

    if (game.status !== "playing") {
      throw new Error("Game must be playing");
    }

    // Get current round
    const round = await ctx.db
      .query("rounds")
      .withIndex("by_game_and_number", (q) =>
        q.eq("gameId", args.gameId).eq("roundNumber", game.currentRoundIndex + 1),
      )
      .first();

    if (!round) {
      throw new Error("No current round");
    }

    if (round.status !== "showing") {
      throw new Error("Round must be showing to start countdown");
    }

    const countdownEndsAt = Date.now() + round.timeLimit * 1000;

    await ctx.db.patch(round._id, {
      status: "guessing",
      countdownEndsAt,
    });

    return { roundId: round._id, countdownEndsAt };
  },
});

/**
 * Reveal the results (show correct answer and scores)
 */
export const reveal = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.moderatorId !== userId) {
      throw new Error("Only the moderator can reveal");
    }

    if (game.status !== "playing") {
      throw new Error("Game must be playing");
    }

    // Get current round
    const round = await ctx.db
      .query("rounds")
      .withIndex("by_game_and_number", (q) =>
        q.eq("gameId", args.gameId).eq("roundNumber", game.currentRoundIndex + 1),
      )
      .first();

    if (!round) {
      throw new Error("No current round");
    }

    if (round.status !== "guessing" && round.status !== "showing") {
      throw new Error("Round must be showing or guessing to reveal");
    }

    await ctx.db.patch(round._id, {
      status: "reveal",
      revealedAt: Date.now(),
    });

    return { roundId: round._id };
  },
});

/**
 * Complete the round and move to the next one
 */
export const complete = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.moderatorId !== userId) {
      throw new Error("Only the moderator can complete rounds");
    }

    if (game.status !== "playing") {
      throw new Error("Game must be playing");
    }

    // Get current round
    const round = await ctx.db
      .query("rounds")
      .withIndex("by_game_and_number", (q) =>
        q.eq("gameId", args.gameId).eq("roundNumber", game.currentRoundIndex + 1),
      )
      .first();

    if (!round) {
      throw new Error("No current round");
    }

    if (round.status !== "reveal") {
      throw new Error("Round must be in reveal status to complete");
    }

    // Mark round as completed
    await ctx.db.patch(round._id, {
      status: "completed",
      completedAt: Date.now(),
    });

    // Check if there's a next round
    const nextRound = await ctx.db
      .query("rounds")
      .withIndex("by_game_and_number", (q) =>
        q.eq("gameId", args.gameId).eq("roundNumber", game.currentRoundIndex + 2),
      )
      .first();

    if (nextRound) {
      // Move to next round
      await ctx.db.patch(args.gameId, {
        currentRoundIndex: game.currentRoundIndex + 1,
      });
      return { hasNextRound: true, nextRoundNumber: game.currentRoundIndex + 2 };
    }
    // Game finished
    await ctx.db.patch(args.gameId, {
      status: "finished",
      finishedAt: Date.now(),
    });
    return { hasNextRound: false };
  },
});

/**
 * Update time limit for a round
 */
export const updateTimeLimit = mutation({
  args: {
    roundId: v.id("rounds"),
    timeLimit: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const round = await ctx.db.get(args.roundId);
    if (!round) {
      throw new Error("Round not found");
    }

    const game = await ctx.db.get(round.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.moderatorId !== userId) {
      throw new Error("Only the moderator can update rounds");
    }

    if (round.status !== "pending" && round.status !== "showing") {
      throw new Error("Cannot change time limit after countdown started");
    }

    await ctx.db.patch(args.roundId, {
      timeLimit: args.timeLimit,
    });

    return { success: true };
  },
});
