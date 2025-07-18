// utils/asyncHandler.ts
import { Request, Response, NextFunction } from 'express'

type AsyncHandlerFn = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>

export const asyncHandler = (handler: AsyncHandlerFn) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next)
  }
}
