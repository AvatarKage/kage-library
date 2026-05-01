/* 
————————————————————————————————————————————————————————————————
Copyright (c) 2026 AvatarKage. Released under the MIT License.

https://avatarka.ge/github
———————————————————————————————————————————————————————————————— 
*/

import Sqlite from "better-sqlite3";

export type QueryResult<T extends object = Record<string, unknown>> =
    | {
          success: true;
          rows: T[];
          rowCount: number;
          lastInsertRowid?: number;
          changes?: number;
      }
    | {
          success: false;
          error: unknown;
      };

export type DB = {
    db: Sqlite.Database;

    query: <T extends object = Record<string, unknown>>(
        sql: string,
        params?: unknown[]
    ) => QueryResult<T>;

    transaction: (
        fn: <U extends object = Record<string, unknown>>(
            q: (
                sql: string,
                params?: unknown[]
            ) => QueryResult<U>
        ) => void
    ) => void;

    disconnect: () => void;
};