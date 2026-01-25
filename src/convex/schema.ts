import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Game status enum values
export const gameStatus = v.union(
  v.literal("lobby"),
  v.literal("playing"),
  v.literal("paused"),
  v.literal("finished"),
);

// Round status enum values
export const roundStatus = v.union(
  v.literal("pending"),
  v.literal("showing"), // Location/image is shown, countdown not started
  v.literal("guessing"), // Countdown is running, teams can guess
  v.literal("reveal"), // Results are being shown
  v.literal("completed"),
);

// Game mode enum values
export const gameMode = v.union(
  v.literal("imageToUtm"), // Mode A: Show image, guess UTM coordinates
  v.literal("utmToLocation"), // Mode B: Show UTM, find on map
);

// Difficulty enum values
export const difficulty = v.union(
  v.literal("easy"),
  v.literal("medium"),
  v.literal("hard"),
);

const schema = defineSchema(
  {
    ...authTables,

    // Games - Main game sessions
    games: defineTable({
      // 6-character alphanumeric join code
      joinCode: v.string(),
      // Reference to the moderator user
      moderatorId: v.id("users"),
      // Game name/title
      name: v.string(),
      // Current status of the game
      status: gameStatus,
      // Index of the current round (0-based)
      currentRoundIndex: v.number(),
      // Default time limit for rounds in seconds
      defaultTimeLimit: v.number(),
      // Timestamps
      createdAt: v.number(),
      startedAt: v.optional(v.number()),
      finishedAt: v.optional(v.number()),
    })
      .index("by_join_code", ["joinCode"])
      .index("by_moderator", ["moderatorId"]),

    // Locations - Places to guess in the game
    locations: defineTable({
      // Reference to the game this location belongs to
      gameId: v.id("games"),
      // Name of the location
      name: v.string(),
      // Geographic coordinates
      latitude: v.number(),
      longitude: v.number(),
      // UTM coordinates (calculated from lat/lng)
      utmZone: v.string(), // e.g., "32U"
      utmEasting: v.number(), // Full easting value
      utmNorthing: v.number(), // Full northing value
      // Image URLs for Mode A (Convex file storage IDs or external URLs)
      imageUrls: v.array(v.string()),
      // Optional hint text
      hint: v.optional(v.string()),
      // Difficulty level
      difficulty: difficulty,
      // Category/tag for grouping
      category: v.optional(v.string()),
      // Order in the game
      orderIndex: v.number(),
    })
      .index("by_game", ["gameId"])
      .index("by_game_and_order", ["gameId", "orderIndex"]),

    // Rounds - Individual game rounds
    rounds: defineTable({
      // Reference to the game
      gameId: v.id("games"),
      // Reference to the location for this round
      locationId: v.id("locations"),
      // Round number (1-based for display)
      roundNumber: v.number(),
      // Game mode for this round
      mode: gameMode,
      // Current status of the round
      status: roundStatus,
      // Time limit in seconds
      timeLimit: v.number(),
      // Timestamp when countdown ends (null if not started)
      countdownEndsAt: v.optional(v.number()),
      // Timestamps
      startedAt: v.optional(v.number()),
      revealedAt: v.optional(v.number()),
      completedAt: v.optional(v.number()),
    })
      .index("by_game", ["gameId"])
      .index("by_game_and_number", ["gameId", "roundNumber"]),

    // Teams - Participating teams
    teams: defineTable({
      // Reference to the game
      gameId: v.id("games"),
      // Team name chosen by players
      name: v.string(),
      // Session ID from anonymous auth (links to user session)
      sessionId: v.string(),
      // User ID (from anonymous auth)
      userId: v.optional(v.id("users")),
      // Total score across all rounds
      score: v.number(),
      // Timestamps
      joinedAt: v.number(),
      // Is the team still connected/active?
      isActive: v.boolean(),
      lastSeenAt: v.number(),
    })
      .index("by_game", ["gameId"])
      .index("by_game_and_session", ["gameId", "sessionId"])
      .index("by_game_and_score", ["gameId", "score"]),

    // Guesses - Team submissions for rounds
    guesses: defineTable({
      // Reference to the round
      roundId: v.id("rounds"),
      // Reference to the team
      teamId: v.id("teams"),
      // For Mode A (imageToUtm): The UTM coordinates guessed
      // For Mode B (utmToLocation): The lat/lng position selected on map
      guessedUtmEasting: v.optional(v.number()),
      guessedUtmNorthing: v.optional(v.number()),
      guessedLatitude: v.optional(v.number()),
      guessedLongitude: v.optional(v.number()),
      // Calculated distance from correct location in meters
      distanceMeters: v.number(),
      // Points awarded for this guess
      score: v.number(),
      // Time taken to submit (from countdown start) in milliseconds
      responseTimeMs: v.number(),
      // Timestamp when submitted
      submittedAt: v.number(),
    })
      .index("by_round", ["roundId"])
      .index("by_team", ["teamId"])
      .index("by_round_and_team", ["roundId", "teamId"]),
  },
  {
    schemaValidation: true,
  },
);

export default schema;
