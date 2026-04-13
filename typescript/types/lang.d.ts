export {};

declare global {
    export interface Lang {
        maintenance: {
            reason: string;
            scheduled: {
                reason: string;
                
            };
        };

        announcement: {
            message: string;
        };

        metadata: {
            tagline: string;
            description: string;
            keywords: Array;
            version: {
                name: string;
            };
        };

        messages: {
            emptyFields: string;
            noAccess: string;
            badGateway: Array;
        };

        // Add more as needed
    }
}