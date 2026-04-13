/**
 * Pads a number with leading zeros to a fixed length.
 *
 * @param n - The number to pad.
 * @param p - The total length of the resulting string.
 * @returns The number converted to a string, left-padded with "0" to length `p`.
 *
 * @example
 * pad(5, 2); // "05"
 * pad(42, 5); // "00042"
 */
export const pad = (n: number, p: number) => n.toString().padStart(p, "0");

/**
 * Converts milliseconds to seconds as a formatted string.
 *
 * @param t - Time value in milliseconds.
 * @returns Time converted to seconds, rounded to 3 decimal places.
 *
 * @example
 * toMs(1); // "0.001"
 * toMs(1500); // "1.500"
 */
export const toMs = (t: number) => (t / 1000).toFixed(3);