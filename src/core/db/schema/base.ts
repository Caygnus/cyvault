import { text, timestamp } from "drizzle-orm/pg-core";
import { EntityStatus } from "@/types";

/**
 * Base fields that are common across all entities.
 * These can be spread into any pgTable definition.
 * 
 * Note: Don't add type annotations here - let TypeScript infer the types.
 * This allows the fields to be properly spread into table definitions.
 */
export const baseModel = {
    id: text("id").primaryKey(),
    status: text("status").default(EntityStatus.PUBLISHED).notNull(),
    createdBy: text("created_by"),  // Supabase UUID
    updatedBy: text("updated_by"),  // Supabase UUID
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
} as const;

