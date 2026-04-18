const colors = {
    info: "color: #767676",
    success: "color: #13a10e",
    warn: "color: #c19c00",
    error: "color: #c50f1f",
    debug: "color: #881798",
    trace: "color: #3a96dd"
};

const icons = {
    "default": {
        "info": "",
        "success": "",
        "warn": "",
        "error": "",
        "debug": "",
        "trace": ""
    },
    "sw": {
        "info": ""
    },
    "config": {
        "info": "",
        "success": "",
        "warn": "",
        "error": "",
        "debug": "",
        "trace": ""
    },
    "server": {
        "info": "󰒋",
        "success": "󰒋",
        "warn": "󰒋",
        "error": "󰒏",
        "debug": "󰒋",
        "trace": "󰒋"
    },
    "search": {
        "info": "",
        "success": "",
        "warn": "",
        "error": "",
        "debug": "",
        "trace": ""
    },
    "mic": {
        "info": "󰍬",
        "success": "󰍬",
        "warn": "󰍬",
        "error": "󰍭",
        "debug": "󰍬",
        "trace": "󰍬"
    },
    "msg": {
        "info": "󰍡",
        "success": "󰍡",
        "warn": "󰍡",
        "error": "󰍡",
        "debug": "󰍡",
        "trace": "󰍡"
    }
};

function pad(n, len = 2) {
    return String(n).padStart(len, "0");
}

function print(scope, level, args, treeLevel = 0, endTree = false) {
    const now = new Date();
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const scopeIcons = icons[scope] || icons.default;
    const icon = scopeIcons[level] || icons.default[level] || "•";
    const tree = treeLevel > 1  ? "│ ".repeat(treeLevel - 1) + (endTree ? "└─" : "├─") : treeLevel === 1 ? (endTree ? "└─" : "├─") : "";
    const levelStyle = colors[level] || "";
    const infoStyle = colors.info;
    let message = args.map(arg => typeof arg === "string" ? arg : JSON.stringify(arg, null, 2)).join(" ");
    const parts = message.split(/(https?:\/\/[^\s"',\)\]\}<>]+)/g);
    let fmt = `%c${time} ${tree}%c${icon} `;
    const styles = [ infoStyle, levelStyle ];

    for (const part of parts) {
        if (/^https?:\/\//.test(part)) {
            fmt += `%c🔗 ${part}%c`;
            styles.push(infoStyle, levelStyle);
        } else {
            fmt += `%c${part}%c`;
            styles.push(levelStyle, levelStyle);
        }
    }

    console.log(fmt, ...styles);
}

function createLogMethod(scope, level) {
    return (...args) => {
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
            
            then(cb) {
                if (!printed) {
                    printed = true;
                    print(scope, level, args, treeLevel, endTree);
                    }
                    cb?.();
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

const log = new Proxy({}, {
    get(_, key) {
        return scoped(key);
    }
});

window.log = log;