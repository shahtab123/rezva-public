import { neon } from "@neondatabase/serverless";
import { qmarkToNumbered, type DbExecutor, type SqlValue } from "./executor.js";

export function createNeonExecutor(connectionString: string): DbExecutor {
  const query = neon(connectionString);

  return {
    dialect: "postgres",
    async one<T extends Record<string, unknown>>(sql: string, ...params: SqlValue[]) {
      const rows = (await query.query(qmarkToNumbered(sql), params)) as T[];
      return rows[0] ?? null;
    },
    async all<T extends Record<string, unknown>>(sql: string, ...params: SqlValue[]) {
      return (await query.query(qmarkToNumbered(sql), params)) as T[];
    },
    async run(sql: string, ...params: SqlValue[]) {
      await query.query(qmarkToNumbered(sql), params);
    },
    async execStatements(statements: string[]) {
      for (const statement of statements) {
        await query.query(statement);
      }
    },
  };
}
