export type SqlValue = string | number | null;

export type DbDialect = "sqlite" | "postgres";

export interface DbExecutor {
  dialect: DbDialect;
  one<T extends Record<string, unknown>>(
    sql: string,
    ...params: SqlValue[]
  ): Promise<T | null>;
  all<T extends Record<string, unknown>>(
    sql: string,
    ...params: SqlValue[]
  ): Promise<T[]>;
  run(sql: string, ...params: SqlValue[]): Promise<void>;
  execStatements(statements: string[]): Promise<void>;
}

export function qmarkToNumbered(sql: string): string {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}
