/*
————————————————————————————————————————————————————————————————
Copyright (c) 2026 AvatarKage. Released under the MIT License.

https://avatarka.ge/github
————————————————————————————————————————————————————————————————
*/

import { promises as fs } from "fs";
import path from "path";

type I18nOptions = {
    localesPath: string;
    locale?: string;
    defaultLocale: string;
};

type LocaleValue = string | Record<string, unknown>;
type LocaleDict = Record<string, LocaleValue>;

type InterpolationOptions = Record<string, string | number>;

export type TFunction = (
    key: string,
    options?: InterpolationOptions
) => string;

export interface I18nInstance {
    t: TFunction;
    raw: LocaleDict;
}

/**
 * Loads, manages, and translates locale files (.json).
 *
 * Supports:
 * - Dot-notation keys (e.g. "user.greeting.title")
 * - Variable interpolation using {{variable}}
 * - Locale fallback chain (e.g. "es-MX" → "es" → default locale)
 *
 * @example
 * const i18n = await I18nService.load({ localesPath: "/public/locales", locale: "es", defaultLocale: "en-US" });
 *
 * console.log(i18n.t("welcome"));
 *
 * // Interpolation:
 * // { name: "Username" } → replaces {{name}} in strings
 * console.log(i18n.t("user.greeting", { name: "Username" }));
 */
export default class I18nService {
    private messages: LocaleDict = {};

    private constructor(messages: LocaleDict) {
        this.messages = messages;
    }

    static async load({
        localesPath,
        locale,
        defaultLocale
    }: I18nOptions): Promise<I18nService> {
        const chain: string[] = [];

        if (!locale) {
            chain.push(defaultLocale);
        } else {
            const normalized = locale.toLowerCase();
            const base = normalized.split("-")[0];

            chain.push(normalized);
            if (base !== normalized) chain.push(base);
            chain.push(defaultLocale);
        }

        const seen = new Set<string>();
        let messages: LocaleDict = {};

        const ordered = [...chain].reverse();

        for (const lng of ordered) {
            if (seen.has(lng)) continue;
            seen.add(lng);

            const filePath = path.join(process.cwd(), localesPath, `${lng}.json`);
            const json = await I18nService.readLocaleFile(filePath);

            if (json) {
                messages = I18nService.deepMerge(messages, json);
            }
        }

        return new I18nService(messages);
    }

    private static deepMerge(
        target: LocaleDict,
        source: LocaleDict
    ): LocaleDict {
        const output: LocaleDict = { ...target };

        for (const key in source) {
            const sourceValue = source[key];
            const targetValue = target[key];

            if (
                typeof sourceValue === "object" &&
                sourceValue !== null &&
                !Array.isArray(sourceValue) &&
                typeof targetValue === "object" &&
                targetValue !== null &&
                !Array.isArray(targetValue)
            ) {
                output[key] = I18nService.deepMerge(
                    targetValue as LocaleDict,
                    sourceValue as LocaleDict
                );
            } else {
                output[key] = sourceValue;
            }
        }

        return output;
    }

    /**
     * Translate function
     */
    public t: TFunction = (key, options) => {
        const value = this.resolveKey(this.messages, key);

        if (typeof value !== "string") {
            return key;
        }

        return this.interpolate(value, options);
    };

    /**
     * Get raw loaded locale
     */
    public get raw(): LocaleDict {
        return this.messages;
    }

    private static async readLocaleFile(
        filePath: string
    ): Promise<LocaleDict | null> {
        try {
            const data = await fs.readFile(filePath, "utf-8");
            return JSON.parse(data) as LocaleDict;
        } catch {
            return null;
        }
    }

    private interpolate(
        str: string,
        options?: InterpolationOptions
    ): string {
        if (!options) return str;

        return str.replace(/{{\s*(\w+)\s*}}/g, (_, key: string) => {
            const value = options[key];
            return value !== undefined ? String(value) : `{{${key}}}`;
        });
    }

    private resolveKey(obj: unknown, key: string): unknown {
        return key.split(".").reduce<unknown>((acc, part) => {
            if (acc && typeof acc === "object") {
                return (acc as Record<string, unknown>)[part];
            }
            return undefined;
        }, obj);
    }
}