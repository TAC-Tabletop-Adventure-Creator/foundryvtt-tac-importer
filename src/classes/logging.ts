import { MODULE_NAME } from "../settings";

export class Logger {
    static info(message: string): void {
        console.info(`%c${MODULE_NAME}`, `color:blue;`, ` | ${message}`);
    }

    static warning(message: string): void {
        console.warn(`%c${MODULE_NAME}`, `color:orange;`, ` | ${message}`);
    }

    static error(message: string | Error): void {
        if (message instanceof Error) {
            console.error(`%c${MODULE_NAME}`, `color:red;`, ` | Error "${message.message}"\n${message.stack}`);
        } else {
            console.error(`%c${MODULE_NAME}`, `color:red;`, ` | ${message}`);
        }
    }
}