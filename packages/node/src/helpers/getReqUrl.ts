/* 
————————————————————————————————————————————————————————————————
Copyright (c) 2026 AvatarKage. Released under the MIT License.

https://avatarka.ge/github
———————————————————————————————————————————————————————————————— 
*/

import type { Request } from "express";

/**
 * Builds the full absolute URL from an Express request.
 *
 * Includes protocol, host, and original URL (path + query string).
 *
 * Handles reverse proxies by checking the `x-forwarded-proto` header.
 *
 * @param req - Express request object
 * @returns Full absolute URL (e.g. https://example.com/path?query=1)
 */
export default function getReqUrl(req: Request): string {
    const protocol =
        (req.headers["x-forwarded-proto"] as string)?.split(",")[0] ||
        req.protocol;

    const host = req.get("host") ?? "localhost";

    return `${protocol}://${host}${req.originalUrl}`;
}