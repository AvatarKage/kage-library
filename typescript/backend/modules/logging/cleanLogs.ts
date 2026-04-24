/* 
————————————————————————————————————————————————————————————————
Copyright (c) 2026 AvatarKage. Released under the MIT License

https://avatarka.ge/github
———————————————————————————————————————————————————————————————— 
*/

import path from "path";
import fs from "fs";

import { config } from "../../config/readConfig.js";
import { log } from "./log.js";

/**
 * Cleans up old log files in the log directory.
 * 
 * Expects log filenames in format: YYYY-MM-DD.log
 * Deletes files with names older than 30 days
 */
export default function cleanLogs(): void {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    const cutoff = date.toISOString().slice(0, 10);

    function walk(dir: string) {
        fs.readdir(dir, { withFileTypes: true }, (err, entries) => {
            if (err) {
                log.dir.error("Failed to read directory:", dir, err).save();
                return;
            }

            entries.forEach((entry) => {
                const fullPath = path.join(dir, entry.name);

                if (entry.isDirectory()) {
                    walk(fullPath);
                    return;
                }

                if (!entry.name.endsWith(".log")) return;

                const name = path.basename(entry.name, ".log");

                if (!/^\d{4}-\d{2}-\d{2}$/.test(name)) return;

                if (name < cutoff) {
                    fs.unlink(fullPath, (err) => {
                        if (err) {
                            log.dir.error("Delete failed:", fullPath, err).save();
                        }
                    });
                }
            });
        });
    }

    walk(config.folders.logs);
}