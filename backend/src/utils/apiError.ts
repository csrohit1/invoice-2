interface ApiErrorOptions<T = unknown> {
  status: number
  message: string
  data?: T
  errors?: unknown[]
  stack?: string
  isEmptyResponse?: boolean // New flag for empty array responses
}

export class ApiError<T = unknown> extends Error {
  public readonly status: number
  public readonly data?: T
  public readonly errors: unknown[]
  public readonly isEmptyResponse: boolean

  constructor(options: ApiErrorOptions<T>) {
    super(options.message)

    this.status = options.status
    this.message = options.message
    this.data = options.data
    this.errors = options.errors || []
    this.isEmptyResponse = options.isEmptyResponse || false

    if (options.stack) {
      this.stack = options.stack
    } else {
      Error.captureStackTrace(this, this.constructor)
    }

    Object.setPrototypeOf(this, ApiError.prototype)
  }

  toJSON() {
    return {
      status: this.status,
      message: this.message,
      ...(this.isEmptyResponse && { data: this.data ?? [] }), // Ensure empty array if empty response
      ...(!this.isEmptyResponse &&
        this.data !== undefined && { data: this.data }),
      ...(this.errors.length > 0 && { errors: this.errors }),
      stack: this.stack,
    }
  }
}
