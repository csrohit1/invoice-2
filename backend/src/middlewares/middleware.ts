import express, { Application } from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import cors from 'cors'
import rateLimit from 'express-rate-limit'

export const useMiddlewares = (app: Application): void => {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })

  // Security HTTP headers
  app.use(helmet())

  app.use(limiter)

  // CORS configuration
  app.use(
    cors({
      origin: [process.env.CLIENT_URI!], // or ['*'] for dev
      credentials: true,
    })
  )

  // Body parsers
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true }))

  // Compress responses
  app.use(compression())

  // Request logging (in dev only)
  if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'))
  } else {
    app.use(morgan('combined'))
  }
}
