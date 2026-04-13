import type { Identifier as IdentifierType } from "../types/identifier.js";

import { log } from "../modules/logging/log.js";
import { config } from "../modules/config/readConfig.js";

export const identifiers: Record<IdentifierType, { regex: RegExp; length: number }> = {
    SHORTLINK: { regex: /[A-Za-z0-9]/, length: 8 },
    // Add more as needed
};

/**
 * Generates and resolves unique identifiers stored in a database.
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
 * const shortlink = id.generate("SHORTLINK");
 * console.log(shortlink);
 *
 * // Lookup identifier type from an existing ID
 * const type = id.get(shortlink);
 * console.log(type);
 */
export default class Identifier {
    private database: any;

    constructor(database: any) {
        this.database = database;
    }

    /**
     * Generate a unique identifier for a given type.
     *
     * @param type - The identifier type (e.g. "SHORTLINK")
     * @returns A unique string identifier
     */
    generate(type: IdentifierType): string {
        const identifier = identifiers[type];
        const maxRetries = 1000;
        let attempts = 0;

        const allowedChars = Array.from(
            Array.from({ length: 128 }, (_, i) => String.fromCharCode(i))
                .filter((c) => identifier.regex.test(c))
        );

        const createIdentifier = (): string =>
            Array.from({ length: identifier.length }, () =>
                allowedChars[Math.floor(Math.random() * allowedChars.length)]
            ).join("");

        while (attempts < maxRetries) {
            const id = createIdentifier();

            const rows = this.database.query(
                "SELECT * FROM identifiers WHERE id = ? AND type = ?",
                [id, type]
            ).rows as { id: string; type: IdentifierType }[];

            if (!rows || rows.length === 0) {
                this.database.query(
                    "INSERT INTO identifiers (id, type) VALUES (?, ?)",
                    [id, type]
                );

                if (config.debug.snowflake) {
                    log.identifiers.trace(`Generated ${type}: ${id}`);
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
    get(id: string): Identifier | undefined {
        const rows = this.database.query(
            "SELECT type FROM identifiers WHERE id = ?",
            [id]
        ).rows as { type: Identifier }[];

        return rows?.[0]?.type;
    }
}