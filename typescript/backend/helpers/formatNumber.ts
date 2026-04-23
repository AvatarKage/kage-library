/**
 * Formats a number into multiple readable representations.
 *
 * Produces:
 * - Full string with commas
 * - Short format with suffixes (K, M, B, T, etc.)
 * - Long format with full scale names (Thousand, Million, etc.)
 *
 * Supports values up to Decillion.
 *
 * @param {number} number - The number to format
 * @returns {{
 *   string: string,
 *   short: string,
 *   long: string
 * }}
 *
 * @example
 * formatNumber(1234567);
 * // {
 * //   string: "1,234,567",
 * //   short: "1.2M",
 * //   long: "1.2 Million"
 * // }
 */
export default function formatNumber(number: number): {
    string: string;
    short: string;
    long: string;
} {
    if (number === null || number === undefined) {
        throw new Error("No number provided");
    }

    const suffixes = [
        "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"
    ];

    const suffixesLong = [
        "Thousand",
        "Million",
        "Billion",
        "Trillion",
        "Quadrillion",
        "Quintillion",
        "Sextillion",
        "Septillion",
        "Octillion",
        "Nonillion",
        "Decillion"
    ];

    let num = number;
    let magnitude = 0;

    while (Math.abs(num) >= 1000 && magnitude < suffixes.length) {
        num /= 1000;
        magnitude++;
    }

    const formattedFull = Math.round(number).toLocaleString();

    const formattedShortNumber =
        num % 1 === 0 ? num.toFixed(0) : num.toFixed(1);

    return {
        string: formattedFull,
        short:
            magnitude === 0
                ? formattedShortNumber
                : formattedShortNumber + suffixes[magnitude - 1],
        long:
            magnitude === 0
                ? formattedShortNumber
                : formattedShortNumber + " " + suffixesLong[magnitude - 1],
    };
}