import { resolve } from "path";
import fs from "fs";
import dotenv from "dotenv";
import toml from "toml";

import { log } from "../logging/log.js";

const dir = process.cwd();

export const env = dotenv.parse(fs.readFileSync("config/.env", "utf-8"));
const configTOML = toml.parse(fs.readFileSync("config/config.toml", "utf-8"));

/* 
————————————————————————————————————————————————————————————————
Helpers
———————————————————————————————————————————————————————————————— 
*/

/**
 * Retrieves an IP address from config based on environment.
 *
 * - Uses `ips.dev` when not in production
 * - Uses `ips` when in production
 *
 * @param key - IP key (e.g. "api", "cdn")
 * @returns Resolved IP string
 * @throws If IP configuration is missing
 */
function getIP(key: any) {
    const ips = configTOML.isProduction
        ? configTOML.ips
        : configTOML.ips.dev;

    if (!ips) {
        throw new Error("IP config is missing");
    }

    return ips[key];
}

/**
 * Retrieves a domain from config based on environment.
 *
 * - Uses `domains.dev` when not in production
 * - Uses `domains` when in production
 *
 * @param key - Domain key (e.g. "api", "cdn")
 * @returns Domain string
 * @throws If domain configuration is missing
 */
function getDomain(key: any) {
    const domains = configTOML.isProduction
        ? configTOML.domains
        : configTOML.domains.dev;

    if (!domains) {
        throw new Error("Domain config is missing");
    }

    return domains[key];
}

/**
 * Builds a full HTTPS URL from a domain config key.
 *
 * @param key - Domain key
 * @returns Fully qualified URL (https://...)
 *
 * @example
 * toURL("api") // "https://api.example.com"
 */
function toURL(key: any) {
    return `https://${getDomain(key)}`;
}

/* 
————————————————————————————————————————————————————————————————
Set up config
———————————————————————————————————————————————————————————————— 
*/

/**
 * Normalizes and enriches the raw TOML config object.
 *
 * - Applies production overrides
 * - Generates full URLs
 * - Removes dev sections
 *
 * @param obj - Raw TOML config object
 * @returns Normalized config object
 */
function setupConfig(obj: any) {
    obj.urls = {};

    if (obj.ports) obj.ports.proxy = 443

    if (obj.ips) {
        for (const key of Object.keys(obj.ips)) {
            if (key === "dev") continue;

            obj.ips[key] = getIP(key);
        }
    }

    if (obj.domains) {
        for (const key of Object.keys(obj.domains)) {
            if (key === "dev") continue;

            obj.domains[key] = getDomain(key);
            obj.urls[key] = toURL(key);
        }
    }

    if (obj.ips?.dev) delete obj.ips.dev;
    if (obj.domains?.dev) delete obj.domains.dev;

    return obj;
}

export const config: Config = {
    ...setupConfig(configTOML),

    folders: {
        root: resolve(dir),
        config: resolve(dir, "config"),
        logs: resolve(dir, "logs"),
        data: resolve(dir, "data"),
        backups: resolve(dir, "backups"),
        sql: resolve(dir, "src", "servers", "api", "sql")
        // Add more as needed
    }
}.clean();

// @ts-ignore
if (config.debug?.env) log.config.debug("env:", env);
if (config.debug?.config) log.config.debug("config:", config);