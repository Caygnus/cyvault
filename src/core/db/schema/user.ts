import { pgTable, text } from "drizzle-orm/pg-core";
import { baseModel } from "./base";

export const users = pgTable("users", {
    ...baseModel,
    name: text("name").notNull(),
    email: text("email").unique().notNull(),
    avatarUrl: text("avatar_url"),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

