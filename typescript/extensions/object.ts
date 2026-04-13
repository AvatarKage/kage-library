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
 * const cleaned = data.clean();
 * console.log(cleaned);
 * // Output:
 * // {
 * //   name: "John",
 * //   tags: ["dev"],
 * //   meta: { valid: "yes" }
 * // }
 */
Object.defineProperty(Object.prototype, "clean", {
    value: function () {
        const seen = new WeakSet();

        const clean = (obj: any): any => {
            if (!obj) return obj;

            if (typeof obj !== "object") return obj;

            if (seen.has(obj)) return undefined;
            seen.add(obj);

            if (Array.isArray(obj)) {
                const arr = obj
                    .map(clean)
                    .filter(v =>
                        v !== null &&
                        v !== "" &&
                        v !== undefined &&
                        !(Array.isArray(v) ? v.length === 0 : isEmptyObject(v))
                    );

                return arr.length ? arr : undefined;
            }

            const cleaned = Object.fromEntries(
                Object.entries(obj)
                    .map(([k, v]) => [k, clean(v)])
                    .filter(([_, v]) =>
                        v !== undefined &&
                        v !== null &&
                        v !== "" &&
                        !(Array.isArray(v) ? v.length === 0 : isEmptyObject(v))
                    )
            );

            return Object.keys(cleaned).length ? cleaned : undefined;
        };

        const isEmptyObject = (v: any) =>
            typeof v === "object" &&
            v !== null &&
            !Array.isArray(v) &&
            Object.keys(v).length === 0;

        return clean(this);
    },
    enumerable: false
});