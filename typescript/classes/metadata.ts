import https from "https";
import axios from "axios";
import * as cheerio from "cheerio";

import { config } from "../modules/config/readConfig.js";
import { log } from "../modules/logging/log.js";
import { DB } from "../types/database.js";
import parseDuration from "../helpers/parseDuration.js";

/**
 * Fetchs, parses, and caches url's metadata.
 *
 * @example
 * import Metadata from "./metadata.js";
 * import { db } from "./server.js";
 *
 * // Create a new instance with metadata database
 * const md = new Metadata(db.metadata);
 *
 * // Get metadata from cache (fetch fallback)
 * const cache = md.get("https://example.com/path?query=value#hash");
 * console.log(cache);
 *
 * // Fetch metadata from web (no cache)
 * const fetch = md.fetch("https://example.com/path?query=value#hash");
 * console.log(fetch);
 * 
 * // Clears cached metadata older than a given duration. 
 * const results = md.clearCache("1d");
 * console.log(results);
 */
export default class Metadata {
    private database: DB;

    constructor(database: DB) {
        this.database = database;
    }

    /**
     * Get metadata from cache (fetch fallback).
     *
     * @param url - The target URL
     * @returns Cached or fetched metadata object
     */
    async get(url: string) {
        const cached = this.database.query("SELECT * FROM metadata WHERE url = ?", [url]).rows?.[0];

        if (cached) {
            return cached;
        }

        const fetch = await this.fetch(url);

        this.database.query(`
            INSERT INTO metadata (url, siteName, icon, title, description, image, type, accent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                fetch.url,
                fetch.siteName,
                fetch.icon,
                fetch.title,
                fetch.description,
                fetch.image,
                fetch.type,
                fetch.accent
            ]
        );

        return fetch;
    }

    /**
     * Fetch metadata from web (no cache).
     *
     * @param url - The target URL
     * @returns Fetched metadata object
     */
    async fetch(url: string) {
        const httpsAgent = new https.Agent({
            rejectUnauthorized: config.isProduction
        });

        try {
            const hasContact = config.crawler.website || config.crawler.contact;

            const response = await axios.get<string>(url, {
                httpsAgent,
                headers: {
                    "User-Agent": `${config.crawler.name}/${config.crawler.version} ${hasContact ? `(+${config.crawler.website}${ config.crawler.contact ? `; ${config.crawler.contact}` : "" })` : ""}`
                },
                timeout: 10000,
                maxRedirects: 5,
                validateStatus: () => true
            });

            const $ = cheerio.load(response.data);
            const meta: Record<string, string> = {};

            $("meta").each((_, el) => {
                const key =
                    $(el).attr("property") ||
                    $(el).attr("name") ||
                    $(el).attr("itemprop");

                const content = $(el).attr("content");

                if (key && content) {
                    meta[key.toLowerCase()] = content.trim();
                }
            });

            const resolvers: Record<string, () => string | null> = {
                icon: () =>
                    $("link[rel='icon']").attr("href") ||
                    $("link[rel='shortcut icon']").attr("href") ||
                    $("link[rel*='icon']").attr("href") ||
                    $("link[rel='apple-touch-icon']").attr("href") ||
                    null
            };

            const pick = (...keys: string[]) => {
                for (const k of keys) {
                    const key = k.toLowerCase();
                    const v = meta[key];
                    if (v) return v;

                    if (resolvers[key]) return resolvers[key]();
                }
                return null;
            };

            return {
                url,
                siteName: pick("og:site_name") || null,
                icon: pick("icon") || null,
                title: pick("og:title", "twitter:title") || $("title").text() || null,
                description: pick("og:description", "twitter:description", "description") || null,
                image: pick("og:image", "twitter:image") || null,
                type: pick("og:type") || null,
                accent: pick("theme-color") || null,
                jsonLd: (() => {
                    try {
                        const raw = $('script[type="application/ld+json"]').first().html();
                        return raw ? JSON.parse(raw) : null;
                    } catch {
                        return null;
                    }
                })()
            };
        } catch (error: any) {
            log.crawler.error(error?.code || error?.message);

            return {
                url,
                siteName: null,
                icon: null,
                title: null,
                description: null,
                image: null,
                type: null,
                accent: null,
                jsonLd: null
            };
        }
    }

    /**
     * Clears cached metadata older than a given duration.
     *
     * @example
     * md.clearCache(parseDuration("7d"));
     * md.clearCache(60000);
     */
    clearCache(duration: number) {
        const cutoff = new Date(Date.now() - duration).toISOString();

        const result = this.database.query(
            "DELETE FROM metadata WHERE cacheDate < ?",
            [cutoff]
        );

        return {
            result,
            cutoff
        };
    }
}