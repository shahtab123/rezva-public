import { createD1Executor } from "./d1.js";
import type { DbExecutor } from "./executor.js";
import { createNeonExecutor } from "./neon.js";

export type DatabaseEnv = {
  DB?: D1Database;
  DATABASE_URL?: string;
};

export function createDbExecutor(env: DatabaseEnv): DbExecutor {
  if (env.DATABASE_URL) {
    return createNeonExecutor(env.DATABASE_URL);
  }
  if (env.DB) {
    return createD1Executor(env.DB);
  }
  throw new Error("No database configured. Set DATABASE_URL or bind D1.");
}
