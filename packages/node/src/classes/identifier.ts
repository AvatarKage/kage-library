/* 
————————————————————————————————————————————————————————————————
Copyright (c) 2026 AvatarKage. Released under the MIT License.

https://avatarka.ge/github
———————————————————————————————————————————————————————————————— 
*/

import { DB } from "../types/database.type.js";

type IdentifierType =
    | "SHORTLINK"
    | "CODE"
    | "HASH"
    | "TOKEN"

const identifiers: Record<
    IdentifierType,
    { regex: RegExp; length: number }
> = {
    SHORTLINK: { regex: /[A-Za-z0-9]/, length: 8 },
    CODE: { regex: /[A-Za-z0-9]/, length: 16 },
    HASH: { regex: /[A-Za-z0-9]/, length: 32 },
    TOKEN: { regex: /[A-Za-z0-9]/, length: 64 }
};

/**
 * Generates and resolves unique identifiers stored in a database.
 * An identifiers table will be created in the database.
 *
 * This class ensures that generated IDs are:
 * - Unique per type (checked against database)
 * - Constrained by allowed character sets per identifier definition
 * - Up to 1000 retries on collision match
 *
 * @example
 * import Identifier from "./identifier.js";
 * import { db } from "./server.js";
 *
 * // Create a new instance with audit database
 * const id = new Identifier(db.audits);
 *
 * // Generate a new ID for a given type
 * const shortlink = id.gen("SHORTLINK");
 * console.log(shortlink);
 *
 * // Lookup identifier type from an existing ID
 * const type = id.get(shortlink);
 * console.log(type);
 */
export default class Identifier {
    private database: DB;

    constructor(database: DB) {
        this.database = database;
    }

    /**
     * Generate a unique identifier for a given type.
     *
     * @param type - The identifier type (e.g. "SHORTLINK")
     * @returns A unique string identifier
     */
    gen(type: IdentifierType): string {
        const identifier = identifiers[type];
        const maxRetries = 1000;
        let attempts = 0;

        const allowedChars = Array.from({ length: 128 }, (_, i) =>
            String.fromCharCode(i)
        ).filter((c) => identifier.regex.test(c));

        const createIdentifier = (): string =>
            Array.from({ length: identifier.length }, () =>
                allowedChars[Math.floor(Math.random() * allowedChars.length)]
            ).join("");

        while (attempts < maxRetries) {
            const id = createIdentifier();

            this.database.transaction((query) => {
                if (!query("SELECT * FROM ids LIMIT 1").success) { 
                    query(
                        `
                            CREATE TABLE IF NOT EXISTS ids (
                                id TEXT PRIMARY KEY NOT NULL,
                                type TEXT NOT NULL,
                                date TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
                            );
                        `
                    ); 
                };
            });

            const res = this.database.query<{ id: string; type: IdentifierType }>(
                "SELECT 1 FROM ids WHERE id = ? AND type = ?", [id, type]
            );

            if (!res.success) {
                throw res.error;
            }

            if (res.rowCount === 0) {
                const insert = this.database.query(
                    "INSERT INTO ids (id, type) VALUES (?, ?)", [id, type]
                );

                if (!insert.success) {
                    throw insert.error;
                }

                return id;
            }

            attempts++;
        }

        return createIdentifier();
    }

    /**
     * Get the identifier type for a given ID.
     *
     * @param id - The identifier string to look up
     * @returns The identifier type if found, otherwise undefined
     */
    get(id: string): IdentifierType | undefined {
        const res = this.database.query<{ type: IdentifierType }>(
            "SELECT type FROM ids WHERE id = ?", [id]
        );

        if (!res.success) {
            return undefined;
        }

        return res.rows[0]?.type;
    }
}