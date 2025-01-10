const winston = require('winston');
const { combine, timestamp, printf, colorize, align } = winston.format;

winston.loggers.add('serviceALogger', {
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        timestamp({
        format: 'YYYY-MM-DD hh:mm:ss.SSS A',
        }),
        align(),
        printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
    ),
    transports: [
        new winston.transports.File({
        filename: 'log-cronjob.log',
        }),
    ],
});

winston.loggers.add('serviceBLogger', {
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        colorize({ all: true }),
        timestamp({
        format: 'YYYY-MM-DD hh:mm:ss.SSS A',
        }),
        align(),
        printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
    ),
    transports: [new winston.transports.Console()],
});