import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { difficulty, gameMode } from "./schema";

/**
 * Generate a random 6-character alphanumeric join code
 */
function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed I, O, 0, 1 for clarity
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a new game
 */
export const create = mutation({
  args: {
    name: v.string(),
    defaultTimeLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to create a game");
    }

    // Validate time limit bounds (5-300 seconds)
    const timeLimit = args.defaultTimeLimit ?? 30;
    if (timeLimit < 5 || timeLimit > 300) {
      throw new Error("Time limit must be between 5 and 300 seconds");
    }

    // Generate a unique join code
    let joinCode = generateJoinCode();
    let existing = await ctx.db
      .query("games")
      .withIndex("by_join_code", (q) => q.eq("joinCode", joinCode))
      .first();

    // Keep generating until we find a unique code
    while (existing) {
      joinCode = generateJoinCode();
      existing = await ctx.db
        .query("games")
        .withIndex("by_join_code", (q) => q.eq("joinCode", joinCode))
        .first();
    }

    const gameId = await ctx.db.insert("games", {
      joinCode,
      moderatorId: userId,
      name: args.name,
      status: "lobby",
      currentRoundIndex: 0,
      defaultTimeLimit: args.defaultTimeLimit ?? 30,
      createdAt: Date.now(),
    });

    return { gameId, joinCode };
  },
});

/**
 * Import locations from JSON and create rounds
 */
export const importLocations = mutation({
  args: {
    gameId: v.id("games"),
    locations: v.array(
      v.object({
        name: v.string(),
        latitude: v.number(),
        longitude: v.number(),
        utmZone: v.string(),
        utmEasting: v.number(),
        utmNorthing: v.number(),
        imageUrls: v.array(v.string()),
        hint: v.optional(v.string()),
        difficulty: difficulty,
        category: v.optional(v.string()),
        // Direction & Distance mode fields
        bearingDegrees: v.optional(v.number()),
        distanceMeters: v.optional(v.number()),
        startPointName: v.optional(v.string()),
        startPointImageUrls: v.optional(v.array(v.string())),
        startPointLatitude: v.optional(v.number()),
        startPointLongitude: v.optional(v.number()),
        // Multiple Choice mode fields
        mcOptions: v.optional(v.array(v.string())),
      }),
    ),
    modes: v.array(gameMode),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.moderatorId !== userId) {
      throw new Error("Only the moderator can import locations");
    }

    if (game.status !== "lobby") {
      throw new Error("Can only import locations in lobby status");
    }

    // Validate mode-specific required fields before creating anything
    for (let i = 0; i < args.locations.length; i++) {
      const loc = args.locations[i];
      for (const mode of args.modes) {
        if (mode === "directionDistance") {
          if (
            loc.bearingDegrees === undefined ||
            loc.distanceMeters === undefined
          ) {
            throw new Error(
              `Location "${loc.name}": directionDistance mode requires bearingDegrees and distanceMeters`,
            );
          }
          if (loc.bearingDegrees < 0 || loc.bearingDegrees >= 360) {
            throw new Error(
              `Location "${loc.name}": bearingDegrees must be 0-359`,
            );
          }
          if (loc.distanceMeters <= 0) {
            throw new Error(
              `Location "${loc.name}": distanceMeters must be positive`,
            );
          }
        }
        if (mode === "multipleChoice") {
          if (!loc.mcOptions || loc.mcOptions.length !== 3) {
            throw new Error(
              `Location "${loc.name}": multipleChoice mode requires exactly 3 wrong options in mcOptions`,
            );
          }
        }
      }
    }

    // Create locations and rounds
    let roundNumber = 1;

    for (let i = 0; i < args.locations.length; i++) {
      const loc = args.locations[i];

      // Create location
      const locationId = await ctx.db.insert("locations", {
        gameId: args.gameId,
        name: loc.name,
        latitude: loc.latitude,
        longitude: loc.longitude,
        utmZone: loc.utmZone,
        utmEasting: loc.utmEasting,
        utmNorthing: loc.utmNorthing,
        imageUrls: loc.imageUrls,
        hint: loc.hint,
        difficulty: loc.difficulty,
        category: loc.category,
        orderIndex: i,
        // Direction & Distance mode fields
        bearingDegrees: loc.bearingDegrees,
        distanceMeters: loc.distanceMeters,
        startPointName: loc.startPointName,
        startPointImageUrls: loc.startPointImageUrls,
        startPointLatitude: loc.startPointLatitude,
        startPointLongitude: loc.startPointLongitude,
        // Multiple Choice mode fields
        mcOptions: loc.mcOptions,
      });

      // Create rounds for each mode
      for (const mode of args.modes) {
        await ctx.db.insert("rounds", {
          gameId: args.gameId,
          locationId,
          roundNumber,
          mode,
          status: "pending",
          timeLimit: game.defaultTimeLimit,
        });
        roundNumber++;
      }
    }

    return {
      locationCount: args.locations.length,
      roundCount: roundNumber - 1,
    };
  },
});

/**
 * Get a game by ID
 */
export const get = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return null;

    // Get total rounds count
    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    // Get teams count
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    return {
      ...game,
      totalRounds: rounds.length,
      teamCount: teams.filter((t) => t.isActive).length,
    };
  },
});

/**
 * Get a game by join code
 */
export const getByJoinCode = query({
  args: { joinCode: v.string() },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_join_code", (q) =>
        q.eq("joinCode", args.joinCode.toUpperCase()),
      )
      .first();

    if (!game) return null;

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_game", (q) => q.eq("gameId", game._id))
      .collect();

    return {
      ...game,
      teamCount: teams.filter((t) => t.isActive).length,
    };
  },
});

/**
 * List games for the current moderator
 */
export const listMyGames = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const games = await ctx.db
      .query("games")
      .withIndex("by_moderator", (q) => q.eq("moderatorId", userId))
      .order("desc")
      .collect();

    return games;
  },
});

/**
 * Start the game (move from lobby to playing)
 */
export const start = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.moderatorId !== userId) {
      throw new Error("Only the moderator can start the game");
    }

    if (game.status !== "lobby") {
      throw new Error("Game must be in lobby status to start");
    }

    // Check there are rounds
    const firstRound = await ctx.db
      .query("rounds")
      .withIndex("by_game_and_number", (q) =>
        q.eq("gameId", args.gameId).eq("roundNumber", 1),
      )
      .first();

    if (!firstRound) {
      throw new Error("Game must have at least one round");
    }

    await ctx.db.patch(args.gameId, {
      status: "playing",
      startedAt: Date.now(),
      currentRoundIndex: 0,
    });

    return { success: true };
  },
});

/**
 * Pause the game
 */
export const pause = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.moderatorId !== userId) {
      throw new Error("Only the moderator can pause the game");
    }

    if (game.status !== "playing") {
      throw new Error("Game must be playing to pause");
    }

    await ctx.db.patch(args.gameId, {
      status: "paused",
    });

    return { success: true };
  },
});

/**
 * Resume a paused game
 */
export const resume = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.moderatorId !== userId) {
      throw new Error("Only the moderator can resume the game");
    }

    if (game.status !== "paused") {
      throw new Error("Game must be paused to resume");
    }

    await ctx.db.patch(args.gameId, {
      status: "playing",
    });

    return { success: true };
  },
});

/**
 * End the game
 */
export const finish = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.moderatorId !== userId) {
      throw new Error("Only the moderator can end the game");
    }

    await ctx.db.patch(args.gameId, {
      status: "finished",
      finishedAt: Date.now(),
    });

    return { success: true };
  },
});
