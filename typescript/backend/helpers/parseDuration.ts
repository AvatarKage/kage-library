/**
 * Converts a duration string into milliseconds.
 *
 * Supported formats:
 * - s = seconds
 * - m = minutes
 * - h = hours
 * - d = days
 * 
 * @example
 * - "30s" -> 30000
 * - "15m" -> 900000
 * - "2h"  -> 7200000
 * - "7d"  -> 604800000
 */
export default function parseDuration(input: string): number {
    const match = input.match(/^(\d+)(d|h|m|s)$/i);

    if (!match) {
        throw new Error(`Invalid duration format: ${input}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    const multipliers: Record<string, number> = {
        s: 1000,
        m: 1000 * 60,
        h: 1000 * 60 * 60,
        d: 1000 * 60 * 60 * 24
    };

    return value * multipliers[unit];
}