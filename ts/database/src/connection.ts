import Database from "better-sqlite3";
import type { ExtendedDB } from "./type.js";
import { loadSql } from "./sql.js";
import fs from "fs";
import path from "path";

export function connectDb(file: string): ExtendedDB {
    const dir = path.dirname(file);
    fs.mkdirSync(dir, { recursive: true });
    
    const db = new Database(file);

    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    const query = <T extends object = any>(
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
                const stmt = db.prepare(stmtSql);
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

    const transaction = (
        fn: (q: <U extends object = any>(sql: string, params?: any[]) => { success: boolean, rows?: U[], error?: any }) => void
    ) => {
        const trx = db.transaction(() => {
            fn(query);
        });
        trx();
    };

    const disconnect = () => {
        db.close();
    };

    return { db, query, transaction, disconnect };
}