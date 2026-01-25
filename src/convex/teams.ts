import { getAuthSessionId, getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

/**
 * Join a game as a team
 */
export const join = mutation({
  args: {
    joinCode: v.string(),
    teamName: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate team name length (1-50 characters)
    const trimmedName = args.teamName.trim();
    if (trimmedName.length < 1) {
      throw new Error("Team name cannot be empty");
    }
    if (trimmedName.length > 50) {
      throw new Error("Team name must be 50 characters or less");
    }

    // Get the session ID for anonymous auth
    const sessionId = await getAuthSessionId(ctx);
    if (!sessionId) {
      throw new Error("Must be authenticated (anonymous or OAuth)");
    }

    const userId = await getAuthUserId(ctx);

    // Find the game
    const game = await ctx.db
      .query("games")
      .withIndex("by_join_code", (q) =>
        q.eq("joinCode", args.joinCode.toUpperCase()),
      )
      .first();

    if (!game) {
      throw new Error("Game not found");
    }

    if (game.status === "finished") {
      throw new Error("Game has already ended");
    }

    // Check if team already exists for this session in this game
    const existingTeam = await ctx.db
      .query("teams")
      .withIndex("by_game_and_session", (q) =>
        q.eq("gameId", game._id).eq("sessionId", sessionId),
      )
      .first();

    if (existingTeam) {
      // Update team name and mark as active
      await ctx.db.patch(existingTeam._id, {
        name: args.teamName,
        isActive: true,
        lastSeenAt: Date.now(),
      });
      return { teamId: existingTeam._id, gameId: game._id, rejoined: true };
    }

    // Check team name is unique in this game
    const existingName = await ctx.db
      .query("teams")
      .withIndex("by_game", (q) => q.eq("gameId", game._id))
      .filter((q) => q.eq(q.field("name"), args.teamName))
      .first();

    if (existingName) {
      throw new Error("This team name is already taken");
    }

    // Create new team
    const teamId = await ctx.db.insert("teams", {
      gameId: game._id,
      name: args.teamName,
      sessionId,
      userId: userId ?? undefined,
      score: 0,
      joinedAt: Date.now(),
      isActive: true,
      lastSeenAt: Date.now(),
    });

    return { teamId, gameId: game._id, rejoined: false };
  },
});

/**
 * Get the current team for a session in a game
 */
export const getMyTeam = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const sessionId = await getAuthSessionId(ctx);
    if (!sessionId) return null;

    const team = await ctx.db
      .query("teams")
      .withIndex("by_game_and_session", (q) =>
        q.eq("gameId", args.gameId).eq("sessionId", sessionId),
      )
      .first();

    return team;
  },
});

/**
 * List all teams in a game
 */
export const listByGame = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    // Sort by score descending, then by join time
    return teams.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.joinedAt - b.joinedAt;
    });
  },
});

/**
 * Get active teams count
 */
export const getActiveCount = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return teams.length;
  },
});

/**
 * Update team name
 */
export const updateName = mutation({
  args: {
    teamId: v.id("teams"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate team name length (1-50 characters)
    const trimmedName = args.name.trim();
    if (trimmedName.length < 1) {
      throw new Error("Team name cannot be empty");
    }
    if (trimmedName.length > 50) {
      throw new Error("Team name must be 50 characters or less");
    }

    const sessionId = await getAuthSessionId(ctx);
    if (!sessionId) {
      throw new Error("Must be authenticated");
    }

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    if (team.sessionId !== sessionId) {
      throw new Error("Not your team");
    }

    // Check name uniqueness
    const existingName = await ctx.db
      .query("teams")
      .withIndex("by_game", (q) => q.eq("gameId", team.gameId))
      .filter((q) =>
        q.and(
          q.eq(q.field("name"), trimmedName),
          q.neq(q.field("_id"), args.teamId),
        ),
      )
      .first();

    if (existingName) {
      throw new Error("This team name is already taken");
    }

    await ctx.db.patch(args.teamId, {
      name: trimmedName,
      lastSeenAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Heartbeat to keep team active
 */
export const heartbeat = mutation({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const sessionId = await getAuthSessionId(ctx);
    if (!sessionId) {
      throw new Error("Must be authenticated");
    }

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    if (team.sessionId !== sessionId) {
      throw new Error("Not your team");
    }

    await ctx.db.patch(args.teamId, {
      lastSeenAt: Date.now(),
      isActive: true,
    });

    return { success: true };
  },
});

/**
 * Mark team as inactive (disconnect)
 */
export const setInactive = mutation({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const sessionId = await getAuthSessionId(ctx);
    if (!sessionId) {
      throw new Error("Must be authenticated");
    }

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    if (team.sessionId !== sessionId) {
      throw new Error("Not your team");
    }

    await ctx.db.patch(args.teamId, {
      isActive: false,
      lastSeenAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Remove a team (moderator only)
 */
export const remove = mutation({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    const game = await ctx.db.get(team.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.moderatorId !== userId) {
      throw new Error("Only the moderator can remove teams");
    }

    // Delete all guesses for this team
    const guesses = await ctx.db
      .query("guesses")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    for (const guess of guesses) {
      await ctx.db.delete(guess._id);
    }

    // Delete the team
    await ctx.db.delete(args.teamId);

    return { success: true };
  },
});

/**
 * Update team score (internal helper, called after scoring)
 * This is an internal mutation - not callable from clients.
 */
export const addScore = internalMutation({
  args: {
    teamId: v.id("teams"),
    points: v.number(),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    await ctx.db.patch(args.teamId, {
      score: team.score + args.points,
    });

    return { newScore: team.score + args.points };
  },
});
