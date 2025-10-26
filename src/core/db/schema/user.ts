import { pgTable, text } from "drizzle-orm/pg-core";
import { baseModel } from "./base";
import { tenants } from "./tenant";

export const users = pgTable("users", {
    ...baseModel,
    name: text("name").notNull(),
    email: text("email").unique().notNull(),
    tenantId: text("tenant_id").references(() => tenants.id).notNull().default(""),
    avatarUrl: text("avatar_url").default(""),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

