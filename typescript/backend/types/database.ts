import Sqlite from "better-sqlite3";

export type DB = {
    db: Sqlite.Database;

    query: <T extends object = any>(
        sql: string,
        params?: any[]
    ) => {
        success: boolean;
        rows?: T[];
        rowCount?: number;
        lastInsertRowid ?: number;
        changes?: number;
        error?: any;
    };

    transaction: (
        fn: (q: <U extends object = any>(
            sql: string,
            params?: any[]
        ) => { success: boolean; rows?: U[]; error?: any }) => void
    ) => void;

    disconnect: () => void;
};