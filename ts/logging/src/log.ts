import { DateTime } from "luxon";
import chalk from "chalk";

import { pad } from "../../formatting/index.js";
import colors from "./colors.js";
import icons from "./icons.js";

function print(scope: string, level: string, message: any, treeLevel = 0, endTree = false) {
    const now = DateTime.now();
    const time = chalk.gray(`[${pad(now.hour, 2)}:${pad(now.minute, 2)}:${pad(now.second, 2)}]`);
    const tag = chalk.gray(`[${scope.toUpperCase()}]`);
    const color = colors[level] ?? ((t: string) => t);
    const scopeIcons = icons[scope as any] ?? icons["default"];
    const icon = scopeIcons[level as any] ?? icons["default"][level as any] ?? icons["default"]["info"];
    const tree = chalk.gray(`${treeLevel > 1 ? "│ ".repeat(treeLevel - 1) : ""}${treeLevel !== 0 ? endTree ? "└─" : "├─" : ""}`)
    
    message = typeof message === "string" ? message : JSON.stringify(message, null, 4);
    message = message.replace(/(https?:\/\/[^\s"',\)\]\}<>]+)/g, (url: any) => chalk.gray(` ${url}`));

    // Console
    level == "terminate" ?
        console.log(`${time} ${tree}${color(`  ${message} `)}`)
        :
        console.log(`${time} ${tree}${color(`${icon} ${message}`)}`);
}

function createLogMethod(scope: string, level: string) {
    return (msg: any) => {
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
                    print(scope, level, msg, treeLevel, endTree);
                }
                resolve();
                return wrapper;
            },
        };

        setTimeout(() => {
            if (!printed) {
                printed = true;
                print(scope, level, msg, treeLevel, endTree);
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