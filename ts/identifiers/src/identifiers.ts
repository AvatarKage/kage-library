import type { IdentifierType } from "./types.js";

export const identifiers: Record<IdentifierType, { regex: RegExp; length: number }> = {
    AUDIT: { regex: /[0-9]/, length: 16 },
};