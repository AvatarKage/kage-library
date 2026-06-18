/* 
————————————————————————————————————————————————————————————————
Copyright (c) 2026 AvatarKage. Released under the MIT License.

https://avatarka.ge/github
———————————————————————————————————————————————————————————————— 
*/

import https from "https";
import axios from "axios";
import * as cheerio from "cheerio";
import robotsParser from "robots-parser";

import { DB } from "../types/database.type.js";

type WC = {
    crawler: CrawlerConfig, 
    database?: DB
    useSecureSSL?: boolean
};

type CrawlerConfig = {
    name: string;
    version: string;
    website?: string;
    contact?: string;
};

export interface Metadata {
    url: string | null;
    siteName: string | null;
    icon: string | null;
    title: string | null;
    description: string | null;
    image: string | null;
    type: string | null;
    accent: string | null;
    jsonLd: Record<string, unknown>;
}

/**
 * A lightweight webclient with robots.txt compliance, metadata caching, crawling, and an API wrapper.
 * A metadata table will be created in the database.
 * 
 * @example
 * const wc = new WebClient({
 *     crawler: {
 *         name: "ExampleCrawler",
 *         version: "1.0",
 *         website: "https://example.com",
 *         contact: "admin@example.com"
 *     },
 *     database: db.metadata,
 *     useSecureSSL: true
 * });
 *
 * const meta = await wc.getMetadata("https://example.com");
 * const html = await wc.crawl("https://example.com");
 * const api = await wc.callAPI("https://api.example.com/data");
 */
export default class WebClient {
    private crawler: CrawlerConfig;
    private database: DB | undefined;
    private useSecureSSL: boolean;

    constructor({ crawler, database, useSecureSSL }: WC) {
        this.crawler = crawler
        this.database = database ?? undefined;
        this.useSecureSSL = useSecureSSL ?? true;
    }

    private getUserAgent() {
        const hasContact = this.crawler.website || this.crawler.contact;

        return `${this.crawler.name}/${this.crawler.version} ${
            hasContact
                ? `(+${this.crawler.website}${this.crawler.contact ? `; ${this.crawler.contact}` : ""})`
                : ""
        }`;
    }

    /**
     * Ping a URL to check its latency
     *
     * @param url - The target URL
     * @returns Object with status info
     */
    async ping(url: string) {
        const parsedUrl = new URL(url);

        const httpsAgent = new https.Agent({
            rejectUnauthorized: false,
            minVersion: "TLSv1.2",
            servername: parsedUrl.hostname,
        });

        const start = Date.now();

        try {
            const response = await axios.get(url, {
                httpsAgent,
                headers: {
                    "User-Agent": this.getUserAgent()
                },
                timeout: 10000,
                maxRedirects: 5,
                validateStatus: () => true,
            });

            const latency = Date.now() - start;

            return {
                url,
                ok: response.status >= 200 && response.status < 400,
                latency,
            };
        } catch {
            const latency = Date.now() - start;

            return {
                url,
                ok: false,
                latency,
            };
        }
    }

    /**
     * Get metadata from cache (fetch fallback)
     *
     * @param url - The target URL
     * @returns Cached or fetched metadata object
     */
    async getMetadata(url: string) {
        if (!this.database) {
            throw new Error("A valid database was not passed to WebClient");
        }

        this.database.transaction((query) => {
            if (!query("SELECT * FROM metadata LIMIT 1").success) { 
                query(
                    `
                        CREATE TABLE IF NOT EXISTS metadata (
                            url TEXT PRIMARY KEY,
                            siteName TEXT,
                            icon TEXT,
                            title TEXT,
                            description TEXT,
                            image TEXT,
                            type TEXT,
                            accent TEXT,
                            cacheDate TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
                        );
                    `
                ); 
            };
        });

        const result = this.database.query(
            "SELECT * FROM metadata WHERE url = ?",
            [url]
        );

        if (!result.success) {
            throw new Error(String(result.error));
        }

        const cached = result.rows?.[0];

        if (cached) {
            return cached;
        }

        const fetch = await this.fetchMetadata(url);

        if (!fetch) {
            throw new Error(`Failed to fetch metadata for ${url}`);
        }

        const metadata: Metadata = fetch;

        this.database.query(
            `
            INSERT INTO metadata (url, siteName, icon, title, description, image, type, accent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                metadata.url,
                metadata.siteName,
                metadata.icon,
                metadata.title,
                metadata.description,
                metadata.image,
                metadata.type,
                metadata.accent
            ]
        );

        return metadata;
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
            rejectUnauthorized: this.useSecureSSL
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
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw error;
            }

            throw new Error("Unknown error occurred");
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
        if (!this.database) throw new Error("A valid database was not passed to WebClient");

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
            rejectUnauthorized: this.useSecureSSL
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

        } catch (error: unknown) {
            if (error instanceof Error) {
                throw error;
            }

            throw new Error("Unknown error occurred");
        }
    }

    /**
     * API wrapper
     *
     * @example
     * const data = await wc.callAPI("https://api.example.com", {
     *   method: "GET",
     *   auth: "Bearer TOKEN",
     *   format: "json",
     *   headers: {
     *       "X-Client-Version": "1.0.0"
     *   }
     * });
     */
    async callAPI<T = unknown>(
        url: string,
        options?: {
            method?: "GET" | "POST" | "PUT" | "DELETE";
            auth?: string;
            format?: "json" | "text" | "binary";
            body?: unknown;
            headers?: Record<string, string>;
        }
    ): Promise<T> {
        if (!this.isAllowed(url)) throw new Error("Crawler is not allowed to crawl:" + url);

        const httpsAgent = new https.Agent({
            rejectUnauthorized: this.useSecureSSL
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
                data: options?.body,
                responseType:
                options?.format === "text"
                    ? "text"
                    : options?.format === "binary"
                    ? "arraybuffer"
                    : "json",
                validateStatus: () => true
            });

            return response.data;
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw error;
            }

            throw new Error("Unknown error occurred");
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
                rejectUnauthorized: this.useSecureSSL
            });

            const response = await axios.get(robotsUrl, {
                httpsAgent,
                timeout: 5000,
                validateStatus: () => true
            });

            if (response.status !== 200) {
                return true;
            }

            if (response.data && !response.data.error) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                const robots = robotsParser(robotsUrl, response.data);
                const result = robots.isAllowed(url, this.crawler.name) ?? true;

                return result
            } else {
                return true;
            }
            
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw error;
            }

            throw new Error("Unknown error occurred");
        }
    }
}