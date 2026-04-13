import { parse } from "tldts";
/**
 * Managable URL wrapper that supports protocol, subdomain, domain, port, path, query, and hash updates.
 *
 * @example
 * const url = new URL("https://www.example.com/page?q=1#top");
 * url.updateQuery("q", "2");
 * url.updateHash("bottom");
 * console.log(url);
 */
export default class URL {
    url;
    constructor(input) {
        this.url = new globalThis.URL(input);
    }
    get href() {
        return this.url.href;
    }
    get origin() {
        const protocol = this.protocol + ":";
        const host = this.url.hostname;
        const port = this.url.port ? `:${this.url.port}` : "";
        return `${protocol}//${host}${port}`;
    }
    get protocol() {
        return this.url.protocol.replace(":", "");
    }
    get fullHost() {
        return this.url.hostname;
    }
    get domain() {
        return parse(this.url.hostname).domain;
    }
    get subdomain() {
        return parse(this.url.hostname).subdomain;
    }
    get port() {
        return this.url.port;
    }
    get path() {
        return this.url.pathname;
    }
    get query() {
        return Object.fromEntries(this.url.searchParams.entries());
    }
    get hash() {
        return this.url.hash.replace("#", "");
    }
    updateProtocol(protocol) {
        protocol = protocol.replace(":", "").toLowerCase();
        const validProtocols = new Set([
            "http",
            "https",
            "ws",
            "wss",
            "ftp",
            "ftps",
            "file",
            "mailto",
            "data",
            "blob",
            "ws",
            "wss"
        ]);
        if (!validProtocols.has(protocol)) {
            throw new Error(`Invalid protocol: ${protocol}`);
        }
        this.url.protocol = protocol;
    }
    updateDomain(domain) {
        const parsed = parse(this.url.hostname);
        const sub = parsed.subdomain;
        this.url.hostname = sub ? `${sub}.${domain}` : domain;
    }
    updateSubdomain(sub) {
        const parsed = parse(this.url.hostname);
        const domain = parsed.domain;
        if (!domain)
            throw new Error("Invalid domain");
        this.url.hostname = sub ? `${sub}.${domain}` : domain;
    }
    updatePath(path) {
        if (!path.startsWith("/")) {
            path = `/${path}`;
        }
        this.url.pathname = path;
    }
    updatePort(port) {
        if (port === undefined || port === null || port === "") {
            this.url.port = "";
            return;
        }
        this.url.port = String(port);
    }
    updateQuery(key, value) {
        if (value === undefined || value === null || value === "") {
            this.url.searchParams.delete(key);
            return;
        }
        this.url.searchParams.set(key, value);
    }
    updateHash(value) {
        if (value === undefined || value === null || value === "") {
            this.url.hash = "";
            return;
        }
        this.url.hash = value.startsWith("#") ? value : `#${value}`;
    }
    toJSON() {
        return {
            protocol: this.protocol.replace(":", ""),
            domain: this.domain,
            subdomain: this.subdomain,
            query: this.query,
            hash: this.hash,
            path: this.path,
            port: this.port,
            href: this.href,
            origin: this.origin,
        };
    }
    [Symbol.for("nodejs.util.inspect.custom")]() {
        return this.toJSON();
    }
}
