// utils/logger.ts
import winston from 'winston'
import 'winston-daily-rotate-file'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

// Extend dayjs with required plugins
dayjs.extend(utc)
dayjs.extend(timezone)

// const logFormat = winston.format.printf(
// 	({ level, message, timestamp, ...meta }) => {
// 		const istTime = dayjs(timestamp as string | number | Date)
// 			.tz("Asia/Kolkata")
// 			.format("YYYY-MM-DD HH:mm:ss");
// 		return `${istTime} [${level.toUpperCase()}] ${message} ${
// 			Object.keys(meta).length ? JSON.stringify(meta) : ""
// 		}`;
// 	}
// );

const jsonFormatter = winston.format.printf(
  ({ level, message, timestamp, ...meta }) => {
    const istTime = dayjs(timestamp as string | number | Date)
      .tz('Asia/Kolkata')
      .format('YYYY-MM-DD HH:mm:ss')

    return JSON.stringify({
      timestamp: istTime,
      level: level.toUpperCase(),
      message,
      ...meta,
    })
  }
)

const logger = winston.createLogger({
  level: 'info',
  // format: winston.format.combine(winston.format.timestamp(), logFormat),
  format: winston.format.combine(winston.format.timestamp(), jsonFormatter),
  transports: [
    // new winston.transports.Console(),
    new winston.transports.DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
    }),
    new winston.transports.DailyRotateFile({
      level: 'error',
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '10m',
      maxFiles: '30d',
    }),
  ],
})

export default logger
