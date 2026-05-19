/* 
————————————————————————————————————————————————————————————————
Copyright (c) 2026 AvatarKage. Released under the MIT License.

https://avatarka.ge/github
———————————————————————————————————————————————————————————————— 
*/

type AdvancedErrorOptions = {
    code: number;
    message?: string;
    details?: unknown;
};

const DefaultErrorMessages: Record<number, string> = {
    100: "Continue",
    101: "Switching Protocols",
    102: "Processing",
    103: "Early Hints",
    200: "OK",
    201: "Created",
    202: "Accepted",
    203: "Non-Authoritative Information",
    204: "No Content",
    205: "Reset Content",
    206: "Partial Content",
    207: "Multi-Status",
    208: "Already Reported",
    226: "IM Used",
    300: "Multiple Choices",
    301: "Moved Permanently",
    302: "Found",
    303: "See Other",
    304: "Not Modified",
    305: "Use Proxy",
    307: "Temporary Redirect",
    308: "Permanent Redirect",
    400: "Bad Request",
    401: "Unauthorized",
    402: "Payment Required",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    406: "Not Acceptable",
    407: "Proxy Authentication Required",
    408: "Request Timeout",
    409: "Conflict",
    410: "Gone",
    411: "Length Required",
    412: "Precondition Failed",
    413: "Payload Too Large",
    414: "URI Too Long",
    415: "Unsupported Media Type",
    416: "Range Not Satisfiable",
    417: "Expectation Failed",
    418: "I'm a Teapot",
    421: "Misdirected Request",
    422: "Unprocessable Entity",
    423: "Locked",
    424: "Failed Dependency",
    425: "Too Early",
    426: "Upgrade Required",
    428: "Precondition Required",
    429: "Too Many Requests",
    431: "Request Header Fields Too Large",
    451: "Unavailable For Legal Reasons",
    500: "Internal Server Error",
    501: "Not Implemented",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
    505: "HTTP Version Not Supported",
    506: "Variant Also Negotiates",
    507: "Insufficient Storage",
    508: "Loop Detected",
    509: "Bandwidth Limit Exceeded",
    510: "Not Extended",
    511: "Network Authentication Required"
};

/**
 * AdvancedError extends the native Error object and adds 
 * structured metadata for API-driven applications.
 *
 * It supports:
 * - numeric error codes
 * - optional custom or default messages (fallbacks based on code)
 * - optional context details for logging and debugging
 *
 * If no message is provided, a default message is resolved from the error code
 * (e.g., 500 -> "Internal Server Error").
 * 
 * @example
 * try {
 *     throw new AdvancedError({
 *         code: 500,
 *         message: "An error occurred while fetching account",
 *         details: {
 *             query: "SELECT * FROM accounts",
 *             userId: "123"
 *         }
 *     });
 * } catch (err) {
 *     if (err instanceof AdvancedError) {
 *         console.log("Code:", err.code);
 *         console.log("Message:", err.message);
 *         console.log("Details:", err.details);
 *     } else {
 *         console.log("Unknown error:", err);
 *     }
 * }
 */
export default class AdvancedError extends Error {
    public code: number;
    public details?: unknown;

    constructor({ code, message, details }: AdvancedErrorOptions) {
        const resolvedMessage =
            message ??
            DefaultErrorMessages[code] ??
            "Unknown Error";

        super(resolvedMessage);

        this.code = code;
        this.details = details;

        Error.captureStackTrace?.(this, this.constructor);
    }
}
