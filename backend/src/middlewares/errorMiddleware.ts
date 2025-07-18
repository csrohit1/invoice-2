import type { ErrorRequestHandler } from 'express'
import { Prisma } from '../../generated/prisma'
import { formatPrismaError } from '../utils/prismaErrFormat'
import { ApiError } from '../utils/apiError'

/**
 * Express error handler middleware that:
 * 1. Formats Prisma errors
 * 2. Wraps unknown errors as ApiError
 * 3. Logs errors cleanly
 * 4. Sends standardized error response
 * @type {ErrorRequestHandler}
 * @param {Error} err - The error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */

const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let error = err

  // 1. Format Prisma errors properly
  const isPrismaError =
    err instanceof Prisma.PrismaClientKnownRequestError ||
    err instanceof Prisma.PrismaClientUnknownRequestError ||
    err instanceof Prisma.PrismaClientValidationError ||
    err instanceof Prisma.PrismaClientInitializationError ||
    err instanceof Prisma.PrismaClientRustPanicError

  if (isPrismaError) {
    error = formatPrismaError(err)
  }

  // 2. Wrap unknown errors as ApiError
  if (!(error instanceof ApiError)) {
    error = new ApiError({
      status: 500,
      message: err.message || 'Unexpected error occurred',
      stack: err.stack,
    })
  }

  // 3. Log cleanly
  console.error(`[${new Date().toISOString()}] Error:`, {
    status: error.status,
    message: error.message,
    path: req.path,
    method: req.method,
    ...(error.errors?.length > 0 && { errorCount: error.errors.length }),
  })

  // 4. Respond
  res.status(error.status).json(error.toJSON())
}
export { errorHandler }
