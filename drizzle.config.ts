import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

export default defineConfig({
    dialect: "postgresql",
    schema: "./src/db/schema", // drizzle will recursively pick up all TS files
    out: "./drizzle",          // migrations + generated SQL output
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
    verbose: true,             // optional: useful while debugging
    strict: true,              // validates schema for safety
});
