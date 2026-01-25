import { v } from "convex/values";
import type { QueryCtx } from "./_generated/server";
import { query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export interface LeaderboardEntry {
  teamId: string;
  teamName: string;
  score: number;
  rank: number;
  isActive: boolean;
  roundScores: Array<{
    roundNumber: number;
    score: number;
    distanceMeters: number;
  }>;
}

/**
 * Internal helper to get leaderboard data
 */
async function getLeaderboardData(
  ctx: QueryCtx,
  gameId: Id<"games">,
): Promise<LeaderboardEntry[]> {
  // Get all teams
  const teams = await ctx.db
    .query("teams")
    .withIndex("by_game", (q) => q.eq("gameId", gameId))
    .collect();

  // Get all rounds
  const rounds = await ctx.db
    .query("rounds")
    .withIndex("by_game", (q) => q.eq("gameId", gameId))
    .collect();

  const roundsMap = new Map(rounds.map((r) => [r._id, r]));

  // Get all guesses for this game's rounds
  const allGuesses = await Promise.all(
    rounds.map((round) =>
      ctx.db
        .query("guesses")
        .withIndex("by_round", (q) => q.eq("roundId", round._id))
        .collect(),
    ),
  );
  const guesses = allGuesses.flat();

  // Build leaderboard entries with join time for tie-breaking
  const entriesWithJoinTime = teams.map((team) => {
    const teamGuesses = guesses.filter((g) => g.teamId === team._id);

    // Only show round scores for revealed/completed rounds
    const roundScores = teamGuesses
      .map((guess) => {
        const round = roundsMap.get(guess.roundId);
        // Only include if round is revealed or completed
        if (
          !round ||
          (round.status !== "reveal" && round.status !== "completed")
        ) {
          return null;
        }
        return {
          roundNumber: round.roundNumber,
          score: guess.score,
          distanceMeters: guess.distanceMeters,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => a.roundNumber - b.roundNumber);

    return {
      teamId: team._id,
      teamName: team.name,
      score: team.score,
      isActive: team.isActive,
      roundScores,
      joinedAt: team.joinedAt,
    };
  });

  // Sort by score descending, then by join time ascending (earlier = higher rank)
  entriesWithJoinTime.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Tie-breaker: earlier join time ranks higher
    return a.joinedAt - b.joinedAt;
  });

  // Remove joinedAt from final entries (not part of LeaderboardEntry interface)
  const entries = entriesWithJoinTime.map(({ joinedAt: _, ...entry }) => entry);

  // Assign ranks (same rank for tied scores)
  let currentRank = 1;
  let previousScore = -1;
  let sameRankCount = 0;

  return entries.map((entry) => {
    if (entry.score === previousScore) {
      sameRankCount++;
    } else {
      currentRank = currentRank + sameRankCount;
      sameRankCount = 1;
      previousScore = entry.score;
    }

    return {
      ...entry,
      rank: currentRank,
    };
  });
}

/**
 * Get the leaderboard for a game
 */
export const get = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args): Promise<LeaderboardEntry[]> => {
    return getLeaderboardData(ctx, args.gameId);
  },
});

/**
 * Get leaderboard with only top N teams
 */
export const getTop = query({
  args: {
    gameId: v.id("games"),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const fullLeaderboard = await getLeaderboardData(ctx, args.gameId);
    return fullLeaderboard.slice(0, args.limit);
  },
});

/**
 * Get a specific team's position in the leaderboard
 */
export const getTeamPosition = query({
  args: {
    gameId: v.id("games"),
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const fullLeaderboard = await getLeaderboardData(ctx, args.gameId);
    const teamEntry = fullLeaderboard.find((e) => e.teamId === args.teamId);

    if (!teamEntry) return null;

    const index = fullLeaderboard.findIndex((e) => e.teamId === args.teamId);
    const totalTeams = fullLeaderboard.length;

    // Get neighbors
    const above = index > 0 ? fullLeaderboard[index - 1] : null;
    const below =
      index < fullLeaderboard.length - 1 ? fullLeaderboard[index + 1] : null;

    return {
      ...teamEntry,
      position: index + 1,
      totalTeams,
      teamAbove: above
        ? { teamName: above.teamName, score: above.score, rank: above.rank }
        : null,
      teamBelow: below
        ? { teamName: below.teamName, score: below.score, rank: below.rank }
        : null,
    };
  },
});

/**
 * Get round-by-round breakdown for a team
 */
export const getTeamBreakdown = query({
  args: {
    gameId: v.id("games"),
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) return null;

    // Get all rounds
    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    // Get all guesses for this team
    const guesses = await ctx.db
      .query("guesses")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const guessMap = new Map(guesses.map((g) => [g.roundId, g]));

    // Build breakdown
    const breakdown = rounds
      .sort((a, b) => a.roundNumber - b.roundNumber)
      .map((round) => {
        const guess = guessMap.get(round._id);
        return {
          roundNumber: round.roundNumber,
          mode: round.mode,
          status: round.status,
          guess: guess
            ? {
                score: guess.score,
                distanceMeters: guess.distanceMeters,
                responseTimeMs: guess.responseTimeMs,
              }
            : null,
        };
      });

    return {
      teamId: team._id,
      teamName: team.name,
      totalScore: team.score,
      roundBreakdown: breakdown,
    };
  },
});
