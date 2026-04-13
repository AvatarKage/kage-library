/**
 * Converts an object or array into an array.
 * 
 * If the input is already an array, it is returned as-is.
 * Otherwise, the object is wrapped inside an array.
 * 
 * @param {object | object[]} value - The value to convert
 * @returns {object[]} - Always returns an array
 * 
 * @example 
 * toArray({ a: 1 }); // [{ a: 1 }]
 * toArray([{ a: 1 }]); // [{ a: 1 }]
 */
export default function toArray<T>(value: T | T[]): T[] {
    return Array.isArray(value) ? value : [value];
}