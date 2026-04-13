import { log } from "../modules/logging/log.js";

/**
 * Gracefully shuts down the server/application.
 *
 * This function is intended to be called during controlled shutdown
 * scenarios (e.g., SIGINT, SIGTERM). It should:
 * - Close database connections (if enabled)
 * - Terminate logs
 * - Exit the Node.js process with code 0
 *
 * @returns A promise that resolves once shutdown logging is complete.
 *
 * @example
 * process.on("SIGINT", async () => {
 *   await shutdownServer();
 * });
 */
export async function shutdownServer() {
    // for (const connection of Object.values(db)) {
    //     connection.disconnect();
    // }

    await log.terminate("Application terminated");
    process.exit(0);
}