import { parse } from "tldts";

type NativeURL = globalThis.URL;

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
    private url: NativeURL;

    constructor(input: string) {
        this.url = new globalThis.URL(input);
    }

    get href(): string {
        return this.url.href;
    }

    get origin(): string {
        const protocol = this.protocol + ":";
        const host = this.url.hostname;
        const port = this.url.port ? `:${this.url.port}` : "";

        return `${protocol}//${host}${port}`;
    }

    get protocol(): string {
        return this.url.protocol.replace(":", "");
    }

    get fullHost(): string {
        return this.url.hostname;
    }

    get domain(): string | null {
        return parse(this.url.hostname).domain;
    }

    get subdomain(): string | null {
        return parse(this.url.hostname).subdomain;
    }

    get port(): string {
        return this.url.port;
    }

    get path(): string {
        return this.url.pathname;
    }

    get query(): Record<string, string> {
        return Object.fromEntries(this.url.searchParams.entries());
    }

    get hash(): string {
        return this.url.hash.replace("#", "");
    }

    updateProtocol(protocol: string): void {
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

    updateDomain(domain: string): void {
        const parsed = parse(this.url.hostname);

        const sub = parsed.subdomain;

        this.url.hostname = sub ? `${sub}.${domain}` : domain;
    }

    updateSubdomain(sub: string): void {
        const parsed = parse(this.url.hostname);

        const domain = parsed.domain;
        if (!domain) throw new Error("Invalid domain");

        this.url.hostname = sub ? `${sub}.${domain}` : domain;
    }

    updatePath(path: string): void {
        if (!path.startsWith("/")) {
            path = `/${path}`;
        }

        this.url.pathname = path;
    }

    updatePort(port?: string | number): void {
        if (port === undefined || port === null || port === "") {
            this.url.port = "";
            return;
        }

        this.url.port = String(port);
    }

    updateQuery(key: string, value?: string): void {
        if (value === undefined || value === null || value === "") {
            this.url.searchParams.delete(key);
            return;
        }

        this.url.searchParams.set(key, value);
    }

    updateHash(value?: string): void {
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