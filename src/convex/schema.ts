import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema(
  {
    ...authTables,
    tasks: defineTable({
      isCompleted: v.boolean(),
      text: v.string(),
    }),
    // Your other tables...
  },
  {
    schemaValidation: true,
  },
);

export default schema;
