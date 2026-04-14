import https from "https";
import axios from "axios";
import * as cheerio from "cheerio";
import robotsParser from "robots-parser";

import { config } from "../modules/config/readConfig.js";
import { log } from "../modules/logging/log.js";
import { DB } from "../types/database.js";

/**
 * A lightweight webclient with:
 * - robots.txt compliance
 * - metadata caching
 * - raw HTML crawling
 * - API wrapper
 *
 * @example
 * const wc = new WebClient(db.metadata);
 *
 * const meta = await wc.getMetadata("https://example.com");
 * const html = await wc.crawl("https://example.com");
 * const api = await wc.callAPI("https://api.example.com/data");
 */
export default class WebClient {
    private database: DB;

    constructor(database: DB) {
        this.database = database;
    }

    private getUserAgent() {
        const hasContact = config.crawler.website || config.crawler.contact;

        return `${config.crawler.name}/${config.crawler.version} ${
            hasContact
                ? `(+${config.crawler.website}${config.crawler.contact ? `; ${config.crawler.contact}` : ""})`
                : ""
        }`;
    }

    /**
     * Get metadata from cache (fetch fallback)
     *
     * @param url - The target URL
     * @returns Cached or fetched metadata object
     */
    async getMetadata(url: string) {
        const cached = this.database.query("SELECT * FROM metadata WHERE url = ?", [url]).rows?.[0];

        if (cached) {
            return cached;
        }

        const fetch: any = await this.fetchMetadata(url);

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
     * Fetch metadata from web (no cache)
     *
     * @param url - The target URL
     * @returns Fetched metadata object
     */
    async fetchMetadata(url: string) {
        if (!this.isAllowed(url)) return;

        const httpsAgent = new https.Agent({
            rejectUnauthorized: config.isProduction
        });

        try {
            const response = await axios.get<string>(url, {
                httpsAgent,
                headers: {
                    "User-Agent": this.getUserAgent()
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
     * Clears cached metadata older than a given duration
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

    /**
     * Crawl html from web
     *
     * @param url - The target URL
     * @returns HTML string or null
     */
    async crawl(url: string) {
        if (!this.isAllowed(url)) return;

        const httpsAgent = new https.Agent({
            rejectUnauthorized: config.isProduction
        });

        try {
            const response = await axios.get<string>(url, {
                httpsAgent,
                headers: {
                    "User-Agent": this.getUserAgent()
                },
                timeout: 10000,
                maxRedirects: 5,
                validateStatus: () => true
            });

            const $ = cheerio.load(response.data);

            $("script").remove();
            $("style").remove();
            $("noscript").remove();

            $("[onclick],[onload],[onerror]").each((_, el) => {
                $(el).removeAttr("onclick");
                $(el).removeAttr("onload");
                $(el).removeAttr("onerror");
            });

            return $.html();

        } catch (error: any) {
            log.crawler.error(error?.code || error?.message);

            return null
        }
    }

    /**
     * API wrapper
     *
     * @example
     * const data = await wc.callAPI("https://api.example.com", {
     *   method: "GET",
     *   auth: "Bearer TOKEN",
     *   format: "json"
     *   headers: {
     *       "X-Client-Version": "1.0.0"
     *   }
     * });
     */
    async callAPI(
        url: string,
        options?: {
            method?: "GET" | "POST" | "PUT" | "DELETE";
            auth?: string;
            format?: "json" | "text";
            data?: any;
            headers?: Record<string, string>;
        }
    ) {
        if (!this.isAllowed(url)) return;

        const httpsAgent = new https.Agent({
            rejectUnauthorized: config.isProduction
        });

        try {
            const response = await axios.request({
                url,
                method: options?.method || "GET",
                httpsAgent,
                timeout: 10000,
                maxRedirects: 5,
                headers: {
                    "User-Agent": this.getUserAgent(),
                    ...(options?.auth ? { Authorization: options.auth } : {}),
                    ...(options?.headers || {})
                },
                data: options?.data,
                responseType: options?.format === "text" ? "text" : "json",
                validateStatus: () => true
            });

            return response.data;
        } catch (error: any) {
            log.crawler.error(error?.code || error?.message);
            return null;
        }
    }

    /**
     * Check if crawler is blocked by robots.txt
     *
     * @param url - The target URL
     * @returns boolean
     */
    async isAllowed(url: string) {
        try {
            const parsedUrl = new URL(url);
            const robotsUrl = `${parsedUrl.protocol}//${parsedUrl.host}/robots.txt`;

            const httpsAgent = new https.Agent({
                rejectUnauthorized: config.isProduction
            });

            const response = await axios.get(robotsUrl, {
                httpsAgent,
                timeout: 5000,
                validateStatus: () => true
            });

            if (response.status !== 200) {
                return true;
            }

            // @ts-ignore
            const robots = robotsParser(robotsUrl, response.data);
            const result = robots.isAllowed(url, config.crawler.name) ?? true;

            if (!result) log.crawler.warn(`${config.crawler.name} is not allowed to crawl ${url}`)

            return result
        } catch (error: any) {
            log.crawler.error(error?.code || error?.message);
            return true;
        }
    }
}