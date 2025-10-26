import { pgTable, text } from "drizzle-orm/pg-core";
import { baseModel } from "./base";

export const tenants = pgTable("tenants", {
    ...baseModel,
    name: text("name").notNull(),
    description: text("description"),
});

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

