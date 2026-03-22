import type { IdentifierType } from "./types.js";
import { identifiers } from "./identifiers.js";
import { db } from "../../../server.js";
import log from "../../logging/index.js";
import config from "../../../config/index.js";

const id = {
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

            const rows = db.audits.query(
                "SELECT * FROM identifiers WHERE id = ? AND type = ?",
                [id, type]
            ).rows as { id: string; type: IdentifierType }[];

            if (!rows || rows.length === 0) {
                db.audits.query(
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
    },

    get(id: string): IdentifierType | undefined {
        const rows = db.audits.query(
            "SELECT type FROM identifiers WHERE id = ?",
            [id]
        ).rows as { type: IdentifierType }[];

        return rows?.[0]?.type;
    }
};

export default id;