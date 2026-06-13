/* 
————————————————————————————————————————————————————————————————
Copyright (c) 2026 AvatarKage. Released under the MIT License.

https://avatarka.ge/github
———————————————————————————————————————————————————————————————— 
*/

import { DB } from "../types/database.type.js";

export type IdentifierDefinition = {
    regex: RegExp;
    length: number;
};

export type IdentifierMap<T extends string = string> = Record<
    T,
    IdentifierDefinition
>;

/**
 * Generates and resolves unique identifiers using user-defined schemas.
 *
 * This class does not include any built-in identifier types.
 * All identifier types and rules (length, allowed character set, etc.)
 * must be provided during construction.
 *
 * A database is optional:
 * - If provided, identifiers are persisted and checked for uniqueness.
 * - If omitted, identifiers are generated without persistence guarantees.
 *
 * An `ids` table will be created automatically when a database is used.
 *
 * This class ensures that generated IDs are:
 * - Unique per type (when a database is provided)
 * - Constrained by user-defined character rules and length
 * - Collision-resistant with up to 1000 retries (database mode only)
 *
 * @template T - String union of identifier type names
 *
 * @example
 * import Identifier from "./identifier.js";
 * import { db } from "./server.js";
 *
 * // Define your own identifier types
 * const id = new Identifier({
 *     SHORTLINK: { regex: /[A-Za-z0-9]/, length: 8 },
 *     CODE: { regex: /[A-Za-z0-9]/, length: 16 },
 *     HASH: { regex: /[A-Za-z0-9]/, length: 32 },
 *     TOKEN: { regex: /[A-Za-z0-9]/, length: 64 }
 * }, db.audits);
 *
 * // Generate a new ID
 * const shortlink = id.gen("SHORTLINK");
 * console.log(shortlink);
 *
 * // Resolve type from ID (only works if DB is provided)
 * const type = id.get(shortlink);
 * console.log(type);
 */
export default class Identifier<T extends string = string> {
    private database: DB | null;
    private identifiers: IdentifierMap<T>;

    constructor(
        identifiers: IdentifierMap<T>,
        database?: DB
    ) {
        this.identifiers = identifiers;
        this.database = database || null;
    }

    private ensureTable(): void {
        if (!this.database) return;

        this.database.transaction((query) => {
            if (!query("SELECT * FROM ids LIMIT 1").success) {
                query(`
                    CREATE TABLE IF NOT EXISTS ids (
                        id TEXT PRIMARY KEY NOT NULL,
                        type TEXT NOT NULL,
                        date TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
                    );
                `);
            }
        });
    }

    /**
     * Generate a unique identifier for a given type.
     *
     * @param type - The identifier type (e.g. "SHORTLINK")
     * @returns A unique string identifier
     */
    gen(type: T): string {
        const definition = this.identifiers[type];
        if (!definition) {
            throw new Error(`Unknown identifier type: ${String(type)}`);
        }

        const maxRetries = 1000;
        let attempts = 0;

        const allowedChars = Array.from({ length: 128 }, (_, i) =>
            String.fromCharCode(i)
        ).filter((c) => definition.regex.test(c));

        const createIdentifier = (): string =>
            Array.from({ length: definition.length }, () =>
                allowedChars[Math.floor(Math.random() * allowedChars.length)]
            ).join("");

        this.ensureTable();

        while (attempts < maxRetries) {
            const id = createIdentifier();

            // If no DB, just return generated ID (no persistence guarantees)
            if (!this.database) {
                return id;
            }

            const res = this.database.query<{ id: string; type: T }>(
                "SELECT 1 FROM ids WHERE id = ? AND type = ?",
                [id, type]
            );

            if (!res.success) {
                throw res.error;
            }

            if (res.rowCount === 0) {
                const insert = this.database.query(
                    "INSERT INTO ids (id, type) VALUES (?, ?)",
                    [id, type]
                );

                if (!insert.success) {
                    throw insert.error;
                }

                return id;
            }

            attempts++;
        }

        // fallback (non-DB mode or extreme collision case)
        return createIdentifier();
    }

    /**
     * Get the identifier type for a given ID. (only works if DB is provided)
     *
     * @param id - The identifier string to look up
     * @returns The identifier type if found, otherwise undefined
     */
    get(id: string): T | undefined {
        if (!this.database) return undefined;

        const res = this.database.query<{ type: T }>(
            "SELECT type FROM ids WHERE id = ?",
            [id]
        );

        if (!res.success) {
            return undefined;
        }

        return res.rows[0]?.type;
    }
}