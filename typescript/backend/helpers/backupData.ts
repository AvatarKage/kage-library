/* 
————————————————————————————————————————————————————————————————
Copyright (c) 2026 AvatarKage. Released under the MIT License

https://avatarka.ge/github
———————————————————————————————————————————————————————————————— 
*/

import fs from "fs";
import path from "path";

import { config } from "../config/readConfig.js";
import { log } from "../modules/logging/log.js";

/**
 * Backups databases and uploads
 */
export default function backupData() {
    const now = new Date();
    const dateString = now.toISOString().split("T")[0];

    const backupBase = config.folders.backups;
    const backupDir = path.join(backupBase, dateString);

    try {
        fs.mkdirSync(backupDir, { recursive: true });

        const copyRecursive = (src: any, dest: any) => {
            if (!fs.existsSync(src)) return;

            const stats = fs.statSync(src);

            if (stats.isDirectory()) {
                fs.mkdirSync(dest, { recursive: true });
                const files = fs.readdirSync(src);

                for (const file of files) {
                    copyRecursive(
                        path.join(src, file),
                        path.join(dest, file)
                    );
                }
            } else {
                fs.copyFileSync(src, dest);
            }
        };

        copyRecursive(
            config.folders.data,
            path.join(backupDir, "data")
        );

        copyRecursive(
            config.folders.uploads,
            path.join(backupDir, "uploads")
        );

        log.cron.info(`Completed backup of databases and uploads: ${backupDir}`);
    } catch (err) {
        log.cron.error("Failed to backup databases and uploads:", err).save();
    }
}