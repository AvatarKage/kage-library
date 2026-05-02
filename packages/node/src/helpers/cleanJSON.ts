/* 
————————————————————————————————————————————————————————————————
Copyright (c) 2026 AvatarKage. Released under the MIT License.

https://avatarka.ge/github
———————————————————————————————————————————————————————————————— 
*/

/**
 * Recursively cleans an object by removing:
 * - `null`
 * - `undefined`
 * - empty strings (`""`)
 * - empty arrays (`[]`)
 * - empty objects (`{}`)
 * 
 * @returns {any} A cleaned version of the object, or `undefined` if empty
 * 
 * @example
 * const data = {
 *   name: "John",
 *   age: null,
 *   tags: ["dev", "", null],
 *   meta: {
 *     empty: {},
 *     valid: "yes"
 *   }
 * };
 * 
 * const cleaned = cleanJSON(data);
 * console.log(cleaned);
 * // Output:
 * // {
 * //   name: "John",
 * //   tags: ["dev"],
 * //   meta: { valid: "yes" }
 * // }
 */
export default function cleanJSON(input: unknown): unknown {
    const seen = new WeakSet<object>();

    const isEmptyObject = (v: unknown) =>
        typeof v === "object" &&
        v !== null &&
        !Array.isArray(v) &&
        Object.keys(v as object).length === 0;

    const clean = (obj: unknown): unknown => {
        if (Buffer.isBuffer(obj)) return obj;
        if (obj === null || obj === undefined) return undefined;

        if (typeof obj !== "object") return obj;

        if (seen.has(obj as object)) return undefined;
        seen.add(obj as object);

        if (Array.isArray(obj)) {
            const arr = obj
                .map(clean)
                .filter(v =>
                    v !== undefined &&
                    v !== null &&
                    v !== "" &&
                    !(Array.isArray(v) ? v.length === 0 : isEmptyObject(v))
                );

            return arr.length ? arr : undefined;
        }

        const cleaned = Object.fromEntries(
            Object.entries(obj as Record<string, unknown>)
                .map(([k, v]) => [k, clean(v)])
                .filter(([, v]) =>
                    v !== undefined &&
                    v !== null &&
                    v !== "" &&
                    !(Array.isArray(v) ? v.length === 0 : isEmptyObject(v))
                )
        );

        return Object.keys(cleaned).length ? cleaned : undefined;
    };

    return clean(input);
}