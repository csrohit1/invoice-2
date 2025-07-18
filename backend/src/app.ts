import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import cron from 'node-cron'
import userAgent from 'express-useragent'
import { asyncHandler } from './utils/asyncHandler'
import { ApiResponse } from './utils/apiResponse'
import { errorHandler } from './middlewares/errorMiddleware'
import authRoutes from './routes/authRoutes'
import planRoutes from './routes/planRoutes'
import { cleanupUnverifiedAuth } from './utils/cleanup'
import subscriptionRoutes from './routes/subscriptionRoutes'
import salesOrderRoutes from './routes/salesOrderRoutes'
import customersRoutes from './routes/customerRoutes'
import invoiceRoutes from './routes/invoceRoutes'
import intentoryItemRoutes from './routes/inventoryRoutes'
import open from 'open'

const app = express()
const basePath = process.env.BASE_PATH || 'api/v1'

app.use(userAgent.express())
app.use(cors({ origin: process.env.CLIENT_URI, credentials: true }))
app.use(helmet())
app.use(express.json())
app.use(cookieParser())
cron.schedule('0 0 * * *', async () => {
  console.log('[CLEANUP] Running cleanup task for unverified auth records')
  try {
    await cleanupUnverifiedAuth()
    console.log('[CLEANUP] Cleanup task completed successfully')
  } catch (error) {
    console.error('[CLEANUP] Error during cleanup task:', error)
  }
})

app.use(`/${basePath}/auth`, authRoutes)
app.use(`/${basePath}/plans`, planRoutes)
app.use(`/${basePath}/subscriptions`, subscriptionRoutes)
app.use(`/${basePath}/sales-order`, salesOrderRoutes)
app.use(`/${basePath}/customers`, customersRoutes)
app.use(`/${basePath}/invoice`, invoiceRoutes)
app.use(`/${basePath}/inventory-item`, intentoryItemRoutes)

app.get(
  '/',
  asyncHandler(async (_req, res) => {
    return res.status(200).json(new ApiResponse(200, {}, 'Everything is okay'))
  })
)

app.use(errorHandler)

export default app
