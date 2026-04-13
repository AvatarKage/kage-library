import fs from "fs";
import path from "path";

import type { DB } from "../types/database.js";

import Sqlite from "better-sqlite3";

/**
 * Loads SQL either from a raw string or from a `.sql` file.
 *
 * @param sqlOrFile - SQL string or path to a `.sql` file
 * @returns SQL content as a string
 *
 * @example
 * loadSql("CREATE TABLE IF NOT EXISTS example");
 *
 * @example
 * loadSql("./queries/getUsers.sql");
 */
export function loadSql(sqlOrFile: string) {
    if (sqlOrFile.endsWith(".sql")) {
        return fs.readFileSync(sqlOrFile, "utf-8");
    }
    return sqlOrFile;
}

/**
 * Creates (if not existing) and connects to a SQLite database.
 *
 * @param file - Path to SQLite database file
 * @returns DB wrapper with query, transaction, and disconnect methods
 */
export default class Database implements DB {
    public db: Sqlite.Database;

    constructor(file: string) {
        const dir = path.dirname(file);
        fs.mkdirSync(dir, { recursive: true });
        
        this.db = new Sqlite(file);

        this.db.pragma("journal_mode = WAL");
        this.db.pragma("foreign_keys = ON");
    }

    /**
     * Executes SQL queries with optional parameters.
     *
     * @param sql - SQL string or path to `.sql` file
     * @param params - Parameter values for prepared statements
     * @returns Execution result object
     *
     * @example
     * query("SELECT * FROM table WHERE field = ?", [value])
     */
    query = <T extends object = any>(
        sql: string,
        params: any[] = []
    ): { success: boolean; rows?: T[]; rowCount?: number; lastInsertRowid?: number; changes?: number; error?: any } => {
        try {
            const statements = loadSql(sql)
                .trim()
                .split(';')
                .map(s => s.trim())
                .filter(Boolean);

            let results: T[] = [];
            let rowCount = 0;
            let lastInsertRowid: number | undefined = undefined;
            let changes = 0;

            for (const stmtSql of statements) {
                const stmt = this.db.prepare(stmtSql);
                const isSelect = /^(SELECT|PRAGMA|WITH)\b/i.test(stmtSql);

                if (isSelect) {
                    const rows = stmt.all(params) as T[];
                    results = results.concat(rows);
                    rowCount += rows.length;
                } else {
                    const info = stmt.run(params);
                    changes += info.changes;

                    if (info.lastInsertRowid !== undefined) {
                        lastInsertRowid = typeof info.lastInsertRowid === "bigint"
                            ? Number(info.lastInsertRowid)
                            : info.lastInsertRowid;
                    }
                }
            }

            return { success: true, rows: results, rowCount, lastInsertRowid, changes };
        } catch (error) {
            return { success: false, error };
        }
    };

    /**
     * Runs multiple queries inside a SQLite transaction.
     *
     * The transaction automatically rolls back on failure.
     *
     * @param fn - Function receiving the `query` helper
     *
     * @example
     * transaction(q => {
     *   q("INSERT INTO table(field) VALUES(?)", ["value"]);
     * });
     */
    transaction = (
        fn: (q: <U extends object = any>(sql: string, params?: any[]) => { success: boolean, rows?: U[], error?: any }) => void
    ) => {
        const trx = this.db.transaction(() => {
            fn(this.query);
        });
        trx();
    };

    /**
     * Closes the database connection.
     */
    disconnect = () => {
        this.db.close();
    };
}