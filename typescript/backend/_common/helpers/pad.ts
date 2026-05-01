/* 
————————————————————————————————————————————————————————————————
Copyright (c) 2026 AvatarKage. Released under the MIT License.

https://avatarka.ge/github
———————————————————————————————————————————————————————————————— 
*/

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