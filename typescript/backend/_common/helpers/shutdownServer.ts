/* 
————————————————————————————————————————————————————————————————
Copyright (c) 2026 AvatarKage. Released under the MIT License.

https://avatarka.ge/github
———————————————————————————————————————————————————————————————— 
*/

/**
 * Gracefully shuts down the server/application.
 *
 * This function is intended to be called during controlled shutdown
 * scenarios (e.g., SIGINT, SIGTERM). It should:
 * - Close database connections (if enabled)
 * - Exit the Node.js process with code 0
 *
 * @returns A promise that resolves once shutdown logging is complete.
 *
 * @example
 * process.on("SIGINT", async () => {
 *   await shutdownServer(log, db);
 * });
 */

/* eslint-disable */
export async function shutdownServer(
    log: any,
    db?: any
) {
    if (!log) {
        throw new Error("Log instance is not defined");
    }

    if (db) {
        await Promise.all(db.connections.map((c: { disconnect: () => any; }) => c.disconnect()));
    }

    await log.terminate("Application terminated").save();
    process.exit(0);
}