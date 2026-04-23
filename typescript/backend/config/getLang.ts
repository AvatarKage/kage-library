import fs from "fs";
import path from "path";

import "../../../../../src/packages/kage-library/extensions/string.js"
import "../../../../../src/packages/kage-library/extensions/object.js"

import { config } from "./readConfig.js";

/**
 * Parses a `.lang` file string into an object.
 *
 * @param input - Name of the .lang file
 * @returns Parsed nested object representation
 *
 * @example
 * parseLang("en-US");
 * // { messages: { welcome: "Hello" } }
 */
export function parseLang(loc: string): any {
    const filePath = path.join(config.folders.config, "lang", `${loc}.lang`);
    if (!fs.existsSync(filePath)) return;

    const raw = fs.readFileSync(filePath, "utf-8");

    const result: any = {};

    const setDeep = (obj: any, path: string[], value: string) => {
        let cur = obj;

        for (let i = 0; i < path.length; i++) {
            const key = path[i];

            if (i === path.length - 1) {
                cur[key] = value;
            } else {
                if (!cur[key] || typeof cur[key] !== "object") {
                    cur[key] = {};
                }
                cur = cur[key];
            }
        }
    };

    const parseString = (value: string) => {
        const v = value.trim();

        if (
            (v.startsWith('"') && v.endsWith('"')) ||
            (v.startsWith("'") && v.endsWith("'"))
        ) {
            return v.slice(1, -1);
        }

        return v;
    };

    const lines = raw
        .split("\n")
        .map(l => l.trim())
        .filter(l => l && !l.startsWith("#"));

    for (const line of lines) {
        const idx = line.indexOf("=");
        if (idx === -1) continue;

        const key = line.slice(0, idx).trim();
        const value = parseString(line.slice(idx + 1));

        setDeep(result, key.split("."), value);
    }

    return result;
}

/**
 * Loads and merges locale `.lang` files into a single language object.
 *
 * Resolution order:
 * - Requested locale (e.g. en-UK)
 * - Fallback variant (en-GB <-> en-UK)
 * - config.metadata.language (default fallback)
 * 
 * @param locale - Optional locale string (default: config.metadata.language)
 * @returns Fully merged language object
 */
export function getLang(locale?: string): Lang {
    const resolvedLocale = locale ?? config.metadata.language;
    let localesToTry: string[] = [];

    switch (resolvedLocale) {
        case "en-GB":
            localesToTry = [resolvedLocale, "en-UK"];
            break;

        case "en-UK":
            localesToTry = [resolvedLocale, "en-GB"];
            break;

        default:
            localesToTry = [resolvedLocale];
            break;
    }

    if (!localesToTry.includes(config.metadata.language)) {
        localesToTry.push(config.metadata.language);
    }

    const merge = (a: any, b: any) => {
        for (const k in b) {
            if (
                b[k] &&
                typeof b[k] === "object" &&
                !Array.isArray(b[k])
            ) {
                if (!a[k]) a[k] = {};
                merge(a[k], b[k]);
            } else {
                if (a[k] === undefined) {
                    a[k] = b[k];
                }
            }
        }
        return a;
    };

    let final: any = {};

    for (const loc of localesToTry) {
        const parsed = parseLang(loc);

        final = merge(final, parsed);
    }

    return final;
}