import { Prisma } from '../../generated/prisma'
import { ApiError } from './apiError'

/**
 * Extracts the most meaningful line from a verbose Prisma error message.
 */
function extractPrismaCoreError(fullMessage: string): string {
  const lines = fullMessage.split('\n')

  // Look for the first line that says something like:
  // "Unknown field `name` for select statement on model `Lab`."
  const coreLine = lines.find((line) =>
    /Unknown field|Argument .+ is missing|Expected .*? but got/.test(line)
  )

  // Fallback to first non-empty trimmed line
  return (
    coreLine?.trim() || lines.find(Boolean)?.trim() || 'Unknown Prisma error.'
  )
}

export function formatPrismaError(error: unknown): ApiError {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientValidationError ||
    error instanceof Prisma.PrismaClientUnknownRequestError
  ) {
    return new ApiError({
      status: 400,
      message:
        extractPrismaCoreError(error.message) ||
        'Validation failed while querying the database.',
      errors: [extractPrismaCoreError(error.message)],
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    })
  }

  return new ApiError({
    status: 500,
    message: 'Unexpected error occurred.',
    stack: error instanceof Error ? error.stack : undefined,
  })
}
