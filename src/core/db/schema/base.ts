import { text, timestamp, uuid } from "drizzle-orm/pg-core";
import { EntityStatus } from "@/types";

/**
 * Base fields that are common across all entities.
 * These can be spread into any pgTable definition.
 * 
 * Note: Don't add type annotations here - let TypeScript infer the types.
 * This allows the fields to be properly spread into table definitions.
 */
export const baseModel = {
    id: uuid("id").primaryKey(),
    status: text("status").default(EntityStatus.PUBLISHED).notNull(),
    createdBy: uuid("created_by"),
    updatedBy: uuid("updated_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
} as const;

