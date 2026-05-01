/* 
————————————————————————————————————————————————————————————————
Copyright (c) 2026 AvatarKage. Released under the MIT License.

https://avatarka.ge/github
———————————————————————————————————————————————————————————————— 
*/

/* eslint-disable */
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

import { config } from "../../../../app.config.js";

dotenv.config();

/**
 * Get the value of an environment variable
 */
export const getEnv = (key: string): any => {
    const value = process.env[key];

    if (key === "SSL") {
        return {
            cert: fs.readFileSync(
                path.join(config.folders.root, value as string, `${config.isProduction ? "prod" : "dev"}.crt`)
            ),
            key: fs.readFileSync(
                path.join(config.folders.root, value as string, `${config.isProduction ? "prod" : "dev"}.key`)
            )
        }
    }
    
    if (!value) {
        throw new Error(`Missing environment variable: ${key}`);
    }

    return value;
};