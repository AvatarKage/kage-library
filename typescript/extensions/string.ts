/**
 * Converts a string to a boolean.
 * 
 * Returns `true` only if the string (case-insensitive) equals `"true"`,
 * otherwise returns `false`.
 * 
 * @returns {boolean}
 * 
 * @example
 * "true".toBoolean();   // true
 * "TRUE".toBoolean();   // true
 * "false".toBoolean();  // false
 * "yes".toBoolean();    // false
 */
String.prototype.toBoolean = function (): boolean {
    return this.toLowerCase() === "true";
};

/**
 * Converts a string to a number.
 * 
 * Throws an error if the string cannot be converted to a valid number.
 * 
 * @returns {number}
 * @throws {Error} If the value is not a valid number
 * 
 * @example
 * "123".toNumber();     // 123
 * "3.14".toNumber();   // 3.14
 * "abc".toNumber();    // throws Error
 */
String.prototype.toNumber = function (): number {
    const n = Number(this);
    if (Number.isNaN(n)) {
        throw new Error(`Cannot convert "${this}" to number`);
    }
    return n;
};