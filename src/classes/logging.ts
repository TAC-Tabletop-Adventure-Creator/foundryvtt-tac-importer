import { SETTINGS } from "../settings/module-settings";

export class Logger {
    static info(message: string): void {
        console.info(`%c${SETTINGS.MODULE_NAME}`, `color:blue;`, ` | ${message}`);
    }

    static warning(message: string): void {
        console.warn(`%c${SETTINGS.MODULE_NAME}`, `color:orange;`, ` | ${message}`);
    }

    static error(message: string | Error): void {
        if (message instanceof Error) {
            console.error(`%c${SETTINGS.MODULE_NAME}`, `color:red;`, ` | Error "${message.message}"\n${message.stack}`);
        } else {
            console.error(`%c${SETTINGS.MODULE_NAME}`, `color:red;`, ` | ${message}`);
        }
    }
}