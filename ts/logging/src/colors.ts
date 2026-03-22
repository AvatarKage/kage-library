import chalk from "chalk";

const colors: Record<string, (text: string) => string> = {
    info: chalk.gray,
    success: chalk.green,
    warn: chalk.yellow,
    error: chalk.red,
    debug: chalk.magenta,
    trace: chalk.cyan,
    terminate: chalk.bgRed.black,
};

export default colors