import { config } from "../modules/config/readConfig.js";
import { log } from "../modules/logging/log.js";

/**
 * Snowflake ID Generator
 * 
 * Generates unique 64-bit IDs based on:
 * - Timestamp
 * - Machine ID
 * - Sequence number
 * 
 * @example
 * const epoch = 1767225600000; // Custom epoch (Jan 1, 2026)
 * const machineId = 1; // Machine identifier (0–1023)
 * 
 * const snowflake = new Snowflake(epoch, machineId);
 * 
 * const id = snowflake.generate();
 * console.log(id);
 * 
 * const date = snowflake.decode(id);
 * console.log(date);
 */
export default class Snowflake {
    private epoch: bigint;
    private sequence: bigint;
    private lastTimestamp: bigint;
    private machineId: number;

    constructor(epoch: number | string = 1577836800000, machine: number = 0) {
        if (machine < 0 || machine > 1023) {
            throw new Error('Machine ID must be between 0 and 1023');
        }

        this.machineId = machine;

        const epochMs = typeof epoch === "string"
            ? Date.parse(epoch)
            : epoch;

        if (Number.isNaN(epochMs)) {
            throw new Error("Invalid epoch value. Must be a valid timestamp or ISO date string.");
        }

        this.epoch = BigInt(epochMs);
        this.sequence = 0n;
        this.lastTimestamp = 0n;
    }

    /**
     * Gets the current timestamp in milliseconds as a bigint.
     * 
     * @private
     * @returns {bigint}
     */
    private currentTime(): bigint {
        return BigInt(Date.now());
    }

    /**
     * Decodes a Snowflake ID into its original timestamp.
     * 
     * @param {string} id - The Snowflake ID
     * @returns {Date} The date extracted from the ID
     */
    public decode(id: string): Date {
        const bigintId = BigInt(id);
        const timestamp = (bigintId >> 22n) + this.epoch;
        return new Date(Number(timestamp));
    }

    /**
     * Generates a new unique Snowflake ID.
     * 
     * @returns {string} A unique ID as a string
     */
    public generate(): string {
        let timestamp = this.currentTime();

        if (timestamp === this.lastTimestamp) {
            this.sequence = (this.sequence + 1n) & 0xFFFn;
            if (this.sequence === 0n) {
                while (timestamp <= this.lastTimestamp) {
                    timestamp = this.currentTime();
                }
            }
        } else {
            this.sequence = 0n;
        }

        this.lastTimestamp = timestamp;

        const id = ((timestamp - this.epoch) << 22n) | (BigInt(this.machineId) << 12n) | this.sequence;

        if (config.debug.snowflake) {
            log.snowflake.trace(`Generated: ${id.toString()}`);
        }
        
        return id.toString();
    }
}