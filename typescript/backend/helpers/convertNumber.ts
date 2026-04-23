/* 
————————————————————————————————————————————————————————————————
Copyright (c) 2026 AvatarKage. Released under the MIT License

https://avatarka.ge/github
———————————————————————————————————————————————————————————————— 
*/

type Format = "numbers" | "words";

const wordToNum: Record<string, string> = {
    zero: "0",
    one: "1",
    two: "2",
    three: "3",
    four: "4",
    five: "5",
    six: "6",
    seven: "7",
    eight: "8",
    nine: "9",
    ten: "10",
};

const numToWord: Record<string, string> = Object.fromEntries(
    Object.entries(wordToNum).map(([word, num]) => [num, word])
);

/**
 * Converts numbers or words inside a string.
 *
 * @param text - Input string (e.g. "I have one apple" or "I have 1 apple")
 * @param format - Conversion mode:
 *   - "numbers": converts words -> numbers ("one" -> "1")
 *   - "words": converts numbers -> words ("1" -> "one")
 *
 * @returns Converted string
 *
 * @example
 * convertNumber("I have one apple", "numbers")
 * // "I have 1 apple"
 *
 * convertNumber("I have 1 apple", "words")
 * // "I have one apple"
 */
export function convertNumber(text: string, format: Format): string {
    if (format === "numbers") {
        const pattern = new RegExp(`\\b(${Object.keys(wordToNum).join("|")})\\b`, "gi");

        return text.replace(pattern, (match) => {
            return wordToNum[match.toLowerCase()];
        });
    }

    if (format === "words") {
        const pattern = new RegExp(`\\b(${Object.keys(numToWord).join("|")})\\b`, "g");

        return text.replace(pattern, (match) => {
            return numToWord[match];
        });
    }

    return text;
}