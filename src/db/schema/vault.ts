import { pgTable, text, jsonb } from "drizzle-orm/pg-core";
import { baseModel } from "./base";
import { tenants } from "./tenant";

export const vaults = pgTable("vaults", {
    ...baseModel,
    name: text("name").notNull(),
    description: text("description"),
    tenantId: text("tenant_id").references(() => tenants.id).notNull(),
    iconUrl: text("icon_url").default(""),
    color: text("color").default(""), // Optional color for UI customization
    metadata: jsonb("metadata").$type<Record<string, string>>().default({}), // String-string map for additional metadata
});

export type Vault = typeof vaults.$inferSelect;
export type NewVault = typeof vaults.$inferInsert;

