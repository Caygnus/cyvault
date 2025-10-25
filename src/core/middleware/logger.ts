import { LOG_CONFIG } from './config';

/**
 * Logging utility for middleware
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class MiddlewareLogger {
    private isEnabled: boolean;
    private level: LogLevel;

    constructor() {
        this.isEnabled = LOG_CONFIG.ENABLED;
        this.level = LOG_CONFIG.LEVEL;
    }

    private shouldLog(level: LogLevel): boolean {
        if (!this.isEnabled) return false;

        const levels = { debug: 0, info: 1, warn: 2, error: 3 };
        return levels[level] >= levels[this.level];
    }

    private formatMessage(level: LogLevel, message: string, data?: unknown): string {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}] [MIDDLEWARE]`;

        if (data) {
            return `${prefix} ${message} ${JSON.stringify(data, null, 2)}`;
        }

        return `${prefix} ${message}`;
    }

    debug(message: string, data?: unknown): void {
        if (this.shouldLog('debug')) {
            console.log(this.formatMessage('debug', message, data));
        }
    }

    info(message: string, data?: unknown): void {
        if (this.shouldLog('info')) {
            console.info(this.formatMessage('info', message, data));
        }
    }

    warn(message: string, data?: unknown): void {
        if (this.shouldLog('warn')) {
            console.warn(this.formatMessage('warn', message, data));
        }
    }

    error(message: string, data?: unknown): void {
        if (this.shouldLog('error')) {
            console.error(this.formatMessage('error', message, data));
        }
    }

}

export const logger = new MiddlewareLogger();
