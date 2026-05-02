/* 
————————————————————————————————————————————————————————————————
Copyright (c) 2026 AvatarKage. Released under the MIT License.

https://avatarka.ge/github
———————————————————————————————————————————————————————————————— 
*/

import { DateTime } from "luxon";
import chalk from "chalk";

type LoggerOptions = {
    path?: string;
    useNerdFonts?: boolean;
    saveAllToFile?: boolean;
};

type LogLevel = "info" | "warn" | "error" | "debug" | "terminate";

type LogChain = {
    tree(lvl: number): LogChain;
    end(): LogChain;
    save(): LogChain;
    then(resolve: () => void): LogChain;
};

type LogMethod = (...args: unknown[]) => LogChain;

type ScopeMethods = {
    info: LogMethod;
    warn: LogMethod;
    error: LogMethod;
    debug: LogMethod;
};

/**
 * Scoped logger utility with tree-style formatting.
 * 
 * Create a new instance pointing to the logs folder:
 *   const log = new Logger("/logs", useNerdFonts, saveAllToFile);
 *
 * Each scope is accessed via:
 *   log.<scope>.<level>(...args);
 *
 * Levels:
 * - info
 * - warn
 * - error
 * - debug
 * 
 * - terminate (no scope)
 *
 * Tree helpers:
 * - .tree(n) -> indentation level
 * - .end() -> marks last branch item
 * - .save() -> saves the log to file
 * - .then() -> callback after flush
 *
 * @example
 * log.server.info("Starting server...")
 *
 * @example
 * log.server.info("Server started").tree(1).save()
 *
 * @example
 * log.terminate("Server terminated").end()

 * @example
 * log.server.info("Done").then(() => {
 *      // Do something here
 * })
 */

/* eslint-disable */
export default class Logger {
    private fsNode: typeof import("fs") | null = null;
    private pathNode: typeof import("path") | null = null;
    private path: string | undefined;
    private useNerdFonts: boolean | undefined;
    private saveAllToFile: boolean | undefined;
    private ready: Promise<void>;

    /**
     * Terminate is a special direct log function useful to highlight crashes in console
     */
    terminate: any;

    // List of log types
    process: any;
    memory: any;
    cpu: any;
    disk: any;
    fs: any;
    upload: any;
    download: any;
    app: any;
    server: any;
    client: any;
    config: any;
    db: any;
    cache: any;
    worker: any;
    cron: any;
    proxy: any;
    network: any;
    ws: any;
    auth: any;
    watchdog: any;
    test: any;
    time: any;
    i18n: any;
    cmd: any;
    level: any;
    ai: any;
    music: any;
    scan: any;
    id: any;
    snowflake: any;
    notif: any;
    email: any;
    msg: any;
    mic: any;
    webhook: any;
    discord: any
    
    public constructor({
        path,
        useNerdFonts = false,
        saveAllToFile = false
    }: LoggerOptions) {
        this.path = path;
        this.useNerdFonts = useNerdFonts;
        this.saveAllToFile = saveAllToFile;

        this.ready = (async () => {
            if (typeof window !== "undefined") return;

            const fsMod = await import("fs");
            const pathMod = await import("path");

            this.fsNode = fsMod.default ?? fsMod;
            this.pathNode = pathMod.default ?? pathMod;

            if (path) {
                this.path = this.pathNode.join(process.cwd(), path);
            }
        })();

        return this.createProxy() as unknown as this;
    }

    static create({ path, useNerdFonts, saveAllToFile}: LoggerOptions) {
        const instance = new Logger({ path, useNerdFonts, saveAllToFile });

        const proxy = new Proxy(instance, {
            get: (target, key: string) => {
                if (key === "terminate") {
                    return target.createLogMethod("global", "terminate");
                }
                return target.scoped(key);
            },
        });

        return proxy as unknown as Record<string, ScopeMethods> & {
            terminate: LogMethod;
        };
    }

    private colors: Record<string, (text: string) => string> = {
        info: chalk.green,
        warn: chalk.yellow,
        error: chalk.red,
        debug: chalk.cyan,
        terminate: chalk.bgRed.black,
    };

    // To properly render icons, you need to view this file using a Nerd Font: https://nerdfonts.com
    private icons: Record<string, Record<string, string>> = {
        default: { info: "", warn: "", error: "", debug: "" },

        // System
        process: { info: "", warn: "", error: "", debug: "" },
        memory: { info: "", warn: "", error: "", debug: "" },
        cpu: { info: "", warn: "", error: "", debug: "" },
        disk: { info: "󰋊", warn: "󰋊", error: "󰋊", debug: "󰋊" },

        // Storage
        fs: { info: "󱥾", warn: "󰷌", error: "󱧴", debug: "󰉋" },
        upload: { info: "󰕒", warn: "󰕒", error: "󰕒", debug: "󰕒" },
        download: { info: "󰇚", warn: "󰇚", error: "󰇚", debug: "󰇚" },

        // Application
        app: { info: "", warn: "", error: "", debug: "" },
        server: { info: "󰒋", warn: "󰒋", error: "󰒏", debug: "󰒋" },
        client: { info: "", warn: "", error: "", debug: "" },
        config: { info: "󰒓", warn: "󰒓", error: "󰒓", debug: "󰒓" },

        // Infrastructure
        db: { info: "󰆼", warn: "󱘺", error: "󰴀", debug: "󰆼" },
        cache: { info: "", warn: "", error: "", debug: "" },
        worker: { info: "󰆍", warn: "󰆍", error: "󰆍", debug: "󰆍" },
        cron: { info: "󰓦", warn: "󰓦", error: "󰓦", debug: "󰓦" },

        // Networking
        proxy: { info: "", warn: "", error: "", debug: "" },
        network: { info: "󰖩", warn: "󱚵", error: "󱚼", debug: "󰖩" },
        ws: { info: "󰚥", warn: "󰚥", error: "󰚦", debug: "󰚥" },

        // Security
        auth: { info: "󰌆", warn: "󰌆", error: "󰌆", debug: "󰌆" },
        watchdog: { info: "󰩄", warn: "󰩄", error: "󰩄", debug: "󰩄" },
    
        // Features
        test: { info: "", warn: "", error: "", debug: "" },
        time: { info: "", warn: "", error: "", debug: "" },
        i18n: { info: "󰗊", warn: "󰗊", error: "󰗊", debug: "󰗊" },
        cmd: { info: "", warn: "", error: "", debug: "" },
        level: { info: "", warn: "", error: "", debug: "" },
        ai: { info: "󰚩", warn: "󱚟", error: "󱚧", debug: "󰚩" },
        music: { info: "󰎇", warn: "󰎇", error: "󰎇", debug: "󰎇" },
        playback: { info: "", warn: "", error: "", debug: "" },
        scan: { info: "", warn: "", error: "", debug: "" },
        id: { info: "", warn: "", error: "", debug: "" },
        snowflake: { info: "", warn: "", error: "", debug: "" },

        // Communication
        notif: { info: "󱇥", warn: "󰵙", error: "󰂛", debug: "󰂚" },
        email: { info: "󰪱", warn: "󰛏", error: "󱏣", debug: "󰥡" },
        msg: { info: "󰍡", warn: "󰍡", error: "󰍡", debug: "󰍡" },
        mic: { info: "󰍬", warn: "󰍬", error: "󰍭", debug: "󰍬" },

        // Integrations
        webhook: { info: "󰘯", warn: "󰘯", error: "󰘯", debug: "󰘯" },
        discord: { info: "", warn: "", error: "", debug: "" }
    }

    private async writeToFile(scope: string, content: string) {
        await this.ready;
        if (!this.fsNode || !this.pathNode || !this.path) return;

        const now = DateTime.now();
        const date = now.toFormat("yyyy-MM-dd");

        const dir = this.pathNode.join(this.path, scope);
        const file = this.pathNode.join(dir, `${date}.log`);

        this.fsNode.mkdirSync(dir, { recursive: true });
        this.fsNode.appendFileSync(file, content + "\n", "utf-8");
    }

    private formatArg(arg: unknown, depth = 0): string {
        const inspectSym = Symbol.for("nodejs.util.inspect.custom");
        const indent = (lvl: number) => "    ".repeat(lvl);

        if (typeof arg === "string") return arg;
        if (typeof arg === "number") return chalk.yellow(String(arg));
        if (typeof arg === "boolean") return chalk.yellow(String(arg));
        if (arg === null) return chalk.gray("null");
        if (arg === undefined) return chalk.gray("undefined");

        if (arg instanceof Date) {
            return chalk.magenta(arg.toISOString());
        }

        if (arg instanceof DateTime) {
            return chalk.magenta(arg.toISO());
        }

        if (arg instanceof Map) {
            const entries = Array.from(arg.entries());
            if (entries.length === 0) return chalk.gray("Map {}");

            return `Map {\n${entries
                .map(([k, v]) =>
                    `${indent(depth + 1)}${chalk.cyan(String(k))} => ${this.formatArg(v, depth + 1)}`
                )
                .join("\n")}\n${indent(depth)}}`;
        }

        if (arg instanceof Set) {
            const values = Array.from(arg);
            if (values.length === 0) return chalk.gray("Set {}");

            return `Set {\n${values
                .map(v => `${indent(depth + 1)}${this.formatArg(v, depth + 1)}`)
                .join("\n")}\n${indent(depth)}}`;
        }

        if (Array.isArray(arg)) {
            if (arg.length === 0) return chalk.gray("[]");

            return `[\n${arg
                .map(v => `${indent(depth + 1)}${this.formatArg(v, depth + 1)}`)
                .join("\n")}\n${indent(depth)}]`;
        }

       if (typeof arg === "object" && arg !== null) {
            if (arg instanceof Date) {
                return chalk.magenta(arg.toISOString());
            }

            if (arg instanceof DateTime) {
                return chalk.magenta(arg.toISO());
            }

            if (typeof (arg as any)[inspectSym] === "function") {
                return this.formatArg((arg as any)[inspectSym](), depth);
            }

            if (typeof (arg as any).toJSON === "function") {
                return this.formatArg((arg as any).toJSON(), depth);
            }

            const entries = Object.entries(arg as Record<string, unknown>);

            if (entries.length === 0) return "{}";

            return `{\n${entries
                .map(([k, v]) =>
                    `${indent(depth + 1)}${k}: ${
                        typeof v === "string"
                            ? `"${v}"`
                            : this.formatArg(v, depth + 1)
                    }`
                )
                .join("\n")}\n${indent(depth)}}`;
        }

        return String(arg);
    }

    private print(
        scope: string,
        level: LogLevel,
        args: unknown[],
        treeLevel = 0,
        endTree = false,
        saveToFile = false
    ): void {
        const now = DateTime.now();
        const time = `${now.toFormat("HH:mm:ss")}`;
        const tag = `[${scope.toUpperCase()}]`;
        const color = this.colors[level];

        const scopeIcons = this.icons[scope] ?? this.icons["default"];
        const icon =
            scopeIcons[level] ??
            this.icons["default"][level] ??
            this.icons["default"].info;

        const tree =
            `${treeLevel > 1 ? "│ ".repeat(treeLevel - 1) : ""}` +
            `${treeLevel !== 0 ? (endTree ? "└─" : "├─") : ""}`;

        let message = args.map(arg => this.formatArg(arg)).join(" ");
        const rawMessage = message;

        message = message.replace(
            /\b([a-z][a-z0-9+.-]*:\/\/[^\s"',)\]}<>]+|mailto:[^\s"',)\]}<>]+)/gi,
            (url) => {
                if (/^(https:\/\/|mailto:)/i.test(url)) {
                    return chalk.magenta(` ${url}`);
                }

                if (/^wss?:\/\//i.test(url)) {
                    return chalk.magenta(url);
                }

                return url;
            }
        );

        const type =
            level === "error" || level === "terminate"
                ? console.error
                : level === "debug"
                ? console.debug
                : console.log;

        type(
            level === "terminate"
                ? color(` ${time} ${tree}${this.useNerdFonts ? "" : "[TERMINATE]"} ${message} `)
                : color(`${time} ${tree}${this.useNerdFonts ? icon : tag} ${message}`)
        );

        if (saveToFile && level !== "terminate" || this.saveAllToFile && level !== "terminate") {
            void this.writeToFile(
                scope,
                `${time} [${level.toUpperCase()}] ${rawMessage}`
            );
        }
    }

    private createLogMethod(scope: string, level: LogLevel): LogMethod {
        return (...args: unknown[]) => {
            let treeLevel = 0;
            let endTree = false;
            let printed = false;

            const wrapper = {
                tree: (lvl: number) => {
                    treeLevel = lvl;
                    return wrapper;
                },
                end: () => {
                    endTree = true;
                    return wrapper;
                },
                save: () => {
                    if (!printed) {
                        printed = true;
                        this.print(scope, level, args, treeLevel, endTree, true);
                    }
                    return wrapper;
                },
                then: (resolve: () => void) => {
                    if (!printed) {
                        printed = true;
                        this.print(scope, level, args, treeLevel, endTree);
                    }
                    resolve();
                    return wrapper;
                },
            };

            setTimeout(() => {
                if (!printed) {
                    printed = true;
                    this.print(scope, level, args, treeLevel, endTree);
                }
            }, 0);

            return wrapper;
        };
    }

    private scoped(scope: string) {
        return {
            info: this.createLogMethod(scope, "info"),
            warn: this.createLogMethod(scope, "warn"),
            error: this.createLogMethod(scope, "error"),
            debug: this.createLogMethod(scope, "debug")
        };
    }

    private createProxy() {
        return new Proxy(this, {
            get: (target, key: string, receiver) => {
                const value = Reflect.get(target, key, receiver);
                if (typeof value === "function") {
                    return value.bind(target);
                }

                if (key === "terminate") {
                    return target.createLogMethod("global", "terminate");
                }

                return target.scoped(key);
            },
        });
    }

    /**
     * Cleans up old log files in the log directory.
     * 
     * Expects log filenames in format: YYYY-MM-DD.log
     * Deletes files with names older than 30 days
     */
    public async cleanLogs(days = 30): Promise<void> {
        await this.ready;
        if (!this.fsNode || !this.pathNode || !this.path) return;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoff = cutoffDate.toISOString().slice(0, 10);

        const walk = (dir: string): void => {
            if (!this.fsNode!.existsSync(dir)) return;

            for (const entry of this.fsNode!.readdirSync(dir, { withFileTypes: true })) {
                const fullPath = this.pathNode!.join(dir, entry.name);

                if (entry.isDirectory()) {
                    walk(fullPath);
                    continue;
                }

                if (!entry.name.endsWith(".log")) continue;

                const name = this.pathNode!.basename(entry.name, ".log");

                if (!/^\d{4}-\d{2}-\d{2}$/.test(name)) continue;

                if (name < cutoff) {
                    this.fsNode!.unlinkSync(fullPath);
                }
            }
        };

        walk(this.path);
    }
}