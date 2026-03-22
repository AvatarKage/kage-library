import { DateTime } from "luxon";
import chalk from "chalk";
import { pad } from "../../formatting/index.js";
import colors from "./colors.js";
import icons from "./icons.js";
function print(scope, level, message, treeLevel = 0, endTree = false) {
    const now = DateTime.now();
    const time = chalk.gray(`[${pad(now.hour, 2)}:${pad(now.minute, 2)}:${pad(now.second, 2)}]`);
    const tag = chalk.gray(`[${scope.toUpperCase()}]`);
    const color = colors[level] ?? ((t) => t);
    const scopeIcons = icons[scope] ?? icons["default"];
    const icon = scopeIcons[level] ?? icons["default"][level] ?? icons["default"]["info"];
    const tree = chalk.gray(`${treeLevel > 1 ? "│ ".repeat(treeLevel - 1) : ""}${treeLevel !== 0 ? endTree ? "└─" : "├─" : ""}`);
    message = typeof message === "string" ? message : JSON.stringify(message, null, 4);
    message = message.replace(/(https?:\/\/[^\s"',\)\]\}<>]+)/g, (url) => chalk.gray(` ${url}`));
    // Console
    level == "terminate" ?
        console.log(`${time} ${tree}${color(`  ${message} `)}`)
        :
            console.log(`${time} ${tree}${color(`${icon} ${message}`)}`);
}
function createLogMethod(scope, level) {
    return (msg) => {
        let treeLevel = 0;
        let endTree = false;
        let printed = false;
        const wrapper = {
            tree(lvl) {
                treeLevel = lvl;
                return wrapper;
            },
            end() {
                endTree = true;
                return wrapper;
            },
            then(resolve) {
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
function scoped(scope) {
    return {
        info: createLogMethod(scope, "info"),
        success: createLogMethod(scope, "success"),
        warn: createLogMethod(scope, "warn"),
        error: createLogMethod(scope, "error"),
        debug: createLogMethod(scope, "debug"),
        trace: createLogMethod(scope, "trace"),
    };
}
export const log = new Proxy({}, {
    get(_, key) {
        if (key === "terminate") {
            return createLogMethod("global", "terminate");
        }
        return scoped(key);
    },
});
//# sourceMappingURL=log.js.map