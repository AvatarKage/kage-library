const toArray = (obj: object | object[]): object[] => Array.isArray(obj) ? obj : [obj];
const pad = (n: number, p: number) => n.toString().padStart(p, "0");
const toMs = (t: number) => (t / 1000).toFixed(3);

function formatNumber(number: number, style: string = "short") {
    if (!number) {
        throw new Error("No number provided");
    }

    if (style === "long") {
        return Math.round(number).toLocaleString();
    } 
    
    if (style === "short") {
        const suffixes = ["", "K", "M", "B", "T", "Q"]; 
        let num = number;
        let magnitude = 0;

        while (Math.abs(num) >= 1000 && magnitude < suffixes.length - 1) {
        num /= 1000;
        magnitude++;
        }

        return (num % 1 === 0 ? num.toFixed(0) : num.toFixed(1)) + suffixes[magnitude];
    }
}

export { 
    pad,
    toArray,
    toMs,
    formatNumber
};