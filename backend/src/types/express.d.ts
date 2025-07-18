import { Request } from 'express'

declare global {
  namespace Express {
    interface Request {
      log: {
        info: (msg: string, meta?: Record<string, unknown>) => void
        warn: (msg: string, meta?: Record<string, unknown>) => void
        error: (msg: string, meta?: Record<string, unknown>) => void
        debug: (msg: string, meta?: Record<string, unknown>) => void
      }

      rawBody?: Buffer
    }
  }
}
