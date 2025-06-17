import { createLogger, addColors, format, transports } from 'winston';

const customLevels = {
    levels: {
        fatal: 0,
        error: 1,
        warn: 2,
        info: 3,
        debug: 4,
        trace: 5,
    },
    colors: {
        fatal: 'redBG white',
        error: 'red',
        warn: 'yellow',
        info: 'green',
        debug: 'blue',
        trace: 'magenta',
    },
};

// Colorful, tracable and beautiful
addColors(customLevels.colors);

export const WinstonLogger = createLogger({
    levels: customLevels.levels,
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
        format.colorize({ all: true }),
        format.printf(({ timestamp, level, message, context, ...meta }) => {
            const ctx = context ? `[${context}] ` : '';
            const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
            return `${timestamp} [${level}] ${ctx}${message} ${metaString}`;
        }),
    ),
    transports: [new transports.Console()],
});
