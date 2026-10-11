import type { DbExecutor, SqlValue } from "./executor.js";

export function createD1Executor(db: D1Database): DbExecutor {
  return {
    dialect: "sqlite",
    async one<T extends Record<string, unknown>>(sql: string, ...params: SqlValue[]) {
      return (await db.prepare(sql).bind(...params).first<T>()) ?? null;
    },
    async all<T extends Record<string, unknown>>(sql: string, ...params: SqlValue[]) {
      const result = await db.prepare(sql).bind(...params).all<T>();
      return result.results ?? [];
    },
    async run(sql: string, ...params: SqlValue[]) {
      await db.prepare(sql).bind(...params).run();
    },
    async execStatements(statements: string[]) {
      const batchSize = 50;
      for (let index = 0; index < statements.length; index += batchSize) {
        const batch = statements.slice(index, index + batchSize);
        await db.batch(batch.map((statement) => db.prepare(statement)));
      }
    },
  };
}
