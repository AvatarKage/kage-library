/* 
————————————————————————————————————————————————————————————————
Copyright (c) 2026 AvatarKage. Released under the MIT License

https://avatarka.ge/github
———————————————————————————————————————————————————————————————— 
*/

import fs from "fs";
import path from "path";
import { DateTime } from "luxon";
import chalk from "chalk";

import { config } from "../../config/readConfig.js";
import { pad } from "../../helpers/misc.js";
import { colors } from "./colors.js";
import { icons } from "./icons.js";

function writeToFile(scope: string, content: string) {
    const now = DateTime.now();
    const date = now.toFormat("yyyy-MM-dd");

    const dir = path.join(config.folders.logs, scope);
    const file = path.join(dir, `${date}.log`);

    fs.mkdirSync(dir, { recursive: true });

    fs.appendFileSync(file, content + "\n", "utf-8");
}

function formatArg(arg: any, depth = 0): string {
    const indent = (lvl: number) => "    ".repeat(lvl);

    if (typeof arg === "string") return arg;
    if (typeof arg === "number" || typeof arg === "boolean") return String(arg);
    if (arg === null) return "null";
    if (arg === undefined) return "undefined";

    if (arg instanceof Map) {
        const entries = Array.from(arg.entries());

        if (entries.length === 0) return "Map {}";

        return `Map {\n${entries
            .map(([k, v]) =>
                `${indent(depth + 1)}${String(k)} => ${formatArg(v, depth + 1)}`
            )
            .join("\n")}\n${indent(depth)}}`;
    }

    if (arg instanceof Set) {
        const values = Array.from(arg);

        if (values.length === 0) return "Set {}";

        return `Set {\n${values
            .map(v => `${indent(depth + 1)}${formatArg(v, depth + 1)}`)
            .join("\n")}\n${indent(depth)}}`;
    }

    if (Array.isArray(arg)) {
        if (arg.length === 0) return "[]";

        return `[\n${arg
            .map(v => `${indent(depth + 1)}${formatArg(v, depth + 1)}`)
            .join("\n")}\n${indent(depth)}]`;
    }

    if (typeof arg === "object") {
        const entries = Object.entries(arg);

        if (entries.length === 0) return "{}";

        return `{\n${entries
            .map(([k, v]) =>
                `${indent(depth + 1)}${k}: ${formatArg(v, depth + 1)}`
            )
            .join("\n")}\n${indent(depth)}}`;
    }

    return String(arg);
}

function print(scope: string, level: string, args: any[], treeLevel = 0, endTree = false) {
    const now = DateTime.now();
    const time = chalk.gray(`${pad(now.hour, 2)}:${pad(now.minute, 2)}:${pad(now.second, 2)}`);
    const tag = chalk.gray(`[${scope.toUpperCase()}]`);
    const color = colors[level] ?? ((t: string) => t);
    const scopeIcons = icons[scope as any] ?? icons["default"];
    const icon = scopeIcons[level as any] ?? icons["default"][level as any] ?? icons["default"]["info"];
    const tree = chalk.gray(`${treeLevel > 1 ? "│ ".repeat(treeLevel - 1) : ""}${treeLevel !== 0 ? endTree ? "└─" : "├─" : ""}`);
    let message = args.map(formatArg).join(" ");
    const raw_message = message
    message = message.replace(/(https?:\/\/[^\s"',\)\]\}<>]+)/g, (url: any) => chalk.gray(` ${url}`));

    const type =
        level === "error" ? console.error :
        level === "warn" ? console.warn :
        level === "debug" ? console.log :
        level === "info" ? console.log :
        console.log;

    type(
        level === "terminate"
            ? `${time} ${tree}${color(` ${config.debug.useNerdFonts ? "" : "[TERMINATE]"} ${message} `)}`
            : `${time} ${tree}${color(`${config.debug.useNerdFonts ? icon : tag} ${message}`)}`
    );

    if (level !== "terminate") {
        writeToFile(scope, `${pad(now.hour, 2)}:${pad(now.minute, 2)}:${pad(now.second, 2)} [${level.toUpperCase()}] ${raw_message}`);
    }
}

function createLogMethod(scope: string, level: string) {
    return (...args: any[]) => {
        let treeLevel = 0;
        let endTree = false;
        let printed = false;

        const wrapper: any = {
            tree(lvl: number) {
                treeLevel = lvl;
                return wrapper;
            },
            end() {
                endTree = true;
                return wrapper;
            },
            then(resolve: any) {
                if (!printed) {
                    printed = true;
                    print(scope, level, args, treeLevel, endTree);
                }
                resolve();
                return wrapper;
            },
        };

        setTimeout(() => {
            if (!printed) {
                printed = true;
                print(scope, level, args, treeLevel, endTree);
            }
        }, 0);

        return wrapper;
    };
}

function scoped(scope: string) {
    return {
        info: createLogMethod(scope, "info"),
        success: createLogMethod(scope, "success"),
        warn: createLogMethod(scope, "warn"),
        error: createLogMethod(scope, "error"),
        debug: createLogMethod(scope, "debug"),
        trace: createLogMethod(scope, "trace"),
    };
}

/**
 * Scoped logger utility with tree-style formatting.
 *
 * Each scope is accessed via:
 *   log.<scope>.<level>(...args)
 *
 * Levels:
 * - info
 * - success
 * - warn
 * - error
 * - debug
 * - trace
 * 
 * - terminate (no scope)
 *
 * Tree helpers:
 * - .tree(n) -> indentation level
 * - .end() -> marks last branch item
 * - .then() -> callback after flush
 *
 * @example
 * log.server.info("Starting server...")
 *
 * @example
 * log.server.success("Server started").tree(1)
 *
 * @example
 * log.terminate("Server terminated").end()

 * @example
 * log.server.info("Done").then(() => {
 *      // Do something here
 * })
 */
export const log = new Proxy(
    {},
    {
        get(_, key: string) {
            if (key === "terminate") {
                return createLogMethod("global", "terminate");
            }
            return scoped(key);
        },
    }
) as Record<string, ReturnType<typeof scoped>> & { terminate: ReturnType<typeof createLogMethod> };