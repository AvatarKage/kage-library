/*
————————————————————————————————————————————————————————————————
Copyright (c) 2026 AvatarKage. Released under the MIT License.

https://avatarka.ge/github
————————————————————————————————————————————————————————————————
*/

import fs from "fs";
import path from "path";

/**
 * Backups a directory (databases/uploads/etc.) into a date-stamped folder.
 *
 * @example
 * const result = backupService(
 *   "/my-app/data",
 *   "/my-app/backups"
 * );
 * console.log(result);
 */
export default function backupService(basePath: string, backupsPath: string) {
    const now = new Date();
    const dateString = now.toISOString().split("T")[0];
    basePath = path.resolve(process.cwd(), basePath);
    backupsPath = path.resolve(process.cwd(), backupsPath);

    const backupDir = path.join(backupsPath, dateString);

    try {
        fs.mkdirSync(backupDir, { recursive: true });

        const copyRecursive = (src: string, dest: string): void => {
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

        copyRecursive(basePath, backupDir);

        return {
            success: true,
            source: basePath,
            backupPath: backupDir,
            name: dateString,
        };
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw error;
        }

        throw new Error("Unknown error occurred");
    }
}