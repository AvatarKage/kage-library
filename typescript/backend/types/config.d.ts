export {};

declare global {
    export interface Config {
        isProduction: boolean;

        debug: {
            useNerdFonts: boolean;
            config: boolean;
            snowflake: boolean;
            // Add more as needed
        };

        maintenance: {
            isEnabled: boolean;
            endsAt: string;

            scheduled: {
                interval: string;
                duration: string;
            };
        };

        announcement: {
            isEnabled: boolean;
            startsAt: string;
            endsAt: string;
            type: "info" | "warning" | "critical" | "";
        };

        metadata: {
            id: string;
            name: string;
            accent: string;
            theme: "dark" | "light" | "system";
            language: string;
            urls: string[];

            version: {
                semver: string;
                stage: "prealpha" | "alpha" | "beta" | "rc" | "release";
                build: string;
                buildDate: string;
            };

            assets: {
                logo: string;
                icon: string;
                banner: string;
                // Add more as needed
            };

            legal: {
                owner: string;
                license: string;
                trademarks: string[];
            };

            contact: {
                support: string;
                legal: string;
                // Add more as needed
            };
        };

        crawler: {
            name: string;
            version: string;
            website: string;
            contact: string;
        };

        ports: {
            proxy: number;
            status: number;
            api: number;
            cdn: number;
            // Add more as needed
        };

        ips: {
            main: string;
            status: string;
            api: string;
            cdn: string;
            // Add more as needed
        };

        domains: {
            main: string;
            status: string;
            api: string;
            cdn: string;
            // Add more as needed
        };

        urls: {
            main: string;
            status: string;
            api: string;
            cdn: string;
            // Add more as needed
        };

        generation: {
            machine: number;
            epoch: string;
            seed: string;
            translations: string[];
        };

        folders: {
            root: string,
            config: string,
            logs: string,
            data: string,
            backups: string
            sql: string
            // Add more as needed
        }
    }
}