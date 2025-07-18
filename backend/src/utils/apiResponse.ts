// Custom centralized class for consistent API responses
export class ApiResponse<T> {
  statusCode: number
  message: string
  data?: T
  success: boolean

  constructor(statusCode: number, data: T, message = 'Success') {
    this.statusCode = statusCode
    this.data = data
    this.message = message
    this.success = statusCode < 400
  }

  toJSON() {
    return JSON.parse(
      JSON.stringify(
        {
          statusCode: this.statusCode,
          message: this.message,
          data: this.data,
          success: this.success,
        },
        (_, value) => (typeof value === 'bigint' ? value.toString() : value)
      )
    )
  }
}
