/* 
————————————————————————————————————————————————————————————————
Copyright (c) 2026 AvatarKage. Released under the MIT License

https://avatarka.ge/github
———————————————————————————————————————————————————————————————— 
*/

import chalk from "chalk";

export const colors: Record<string, (text: string) => string> = {
    info: chalk.green,
    warn: chalk.yellow,
    error: chalk.red,
    debug: chalk.cyan,
    terminate: chalk.bgRed.black,
};