import fs from "fs";
import path from "path";
import { DateTime } from "luxon";
import chalk from "chalk";

import { config } from "../config/readConfig.js";
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

function print(scope: string, level: string, args: any[], treeLevel = 0, endTree = false) {
    const now = DateTime.now();
    const time = chalk.gray(`${pad(now.hour, 2)}:${pad(now.minute, 2)}:${pad(now.second, 2)}`);
    const tag = chalk.gray(`[${scope.toUpperCase()}]`);
    const color = colors[level] ?? ((t: string) => t);
    const scopeIcons = icons[scope as any] ?? icons["default"];
    const icon = scopeIcons[level as any] ?? icons["default"][level as any] ?? icons["default"]["info"];
    const tree = chalk.gray(`${treeLevel > 1 ? "│ ".repeat(treeLevel - 1) : ""}${treeLevel !== 0 ? endTree ? "└─" : "├─" : ""}`);
    
    let message = args
        .map((arg) =>
            typeof arg === "string"
                ? arg
                : JSON.stringify(arg, null, 4)
        )
        .join(" ");

    const raw_message = message
    message = message.replace(/(https?:\/\/[^\s"',\)\]\}<>]+)/g, (url: any) => chalk.gray(` ${url}`));

    console.log(
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