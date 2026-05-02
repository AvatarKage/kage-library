/* 
————————————————————————————————————————————————————————————————
Copyright (c) 2026 AvatarKage. Released under the MIT License.

https://avatarka.ge/github
———————————————————————————————————————————————————————————————— 
*/

/* eslint-disable */
export default class WsClient<TSend = unknown, TReceive = unknown> {
    private ws: WebSocket;
    private queue: string[] = [];

    constructor(log: any, url: string) {
        if (!log) {
            throw new Error("Log instance is not defined");
        }

        if (!url) {
            throw new Error("Url is not defined");
        }
        
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            log.ws.info("Client connected to server");

            this.queue.forEach((msg) => this.ws.send(msg));
            this.queue = [];
        };

        this.ws.onmessage = (event: MessageEvent<string>) => {
            try {
                const data: TReceive = JSON.parse(event.data);
                log.ws.info("Received from server:", data);
            } catch (error) {
                log.ws.error("Invalid JSON received:", event.data);
            }
        };

        this.ws.onerror = (event: Event) => {
            log.ws.error("WebSocket error:", event);
        };

        this.ws.onclose = () => {
            log.ws.warn("WebSocket connection closed");
        };
    }

    send(payload: TSend): void {
        const msg = JSON.stringify(payload);

        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(msg);
        } else {
            this.queue.push(msg);
        }
    }

    close(code?: number, reason?: string): void {
        this.ws.close(code, reason);
    }
}