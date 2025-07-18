import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import { JwtPayloadWithId } from '../types/jwt'
import { ApiError } from '../utils/apiError'
import prisma from '../config/db'
import { asyncHandler } from '../utils/asyncHandler'
import { Role } from '../../generated/prisma'

// Extend Request type
export interface RequestWithUser extends Request {
  userEmbeded?: {
    id: string
    tenantId: string
    role: Role
  }
}

// 🔐 Middleware: Verifies JWT and adds user info to req.userEmbeded
export const verifyJWT = asyncHandler(
  async (req: RequestWithUser, _res: Response, next: NextFunction) => {
    const token =
      req.cookies?.accessToken ||
      req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      throw new ApiError({
        status: 401,
        message: 'Unauthorized request',
      })
    }

    let decoded: JwtPayloadWithId
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_ACCESS_TOKEN_SECRET!
      ) as JwtPayloadWithId
    } catch (err) {
      throw new ApiError({
        status: 401,
        message:
          err instanceof Error ? err.message : 'Invalid or expired token',
      })
    }

    const profile = await prisma.userProfile.findFirst({
      where: { authId: decoded.id },
      select: {
        tenantId: true,
        role: true,
      },
    })

    if (!profile) {
      throw new ApiError({
        status: 401,
        message: 'User profile not found',
      })
    }

    req.userEmbeded = {
      id: decoded.id,
      tenantId: profile.tenantId,
      role: profile.role,
    }

    next()
  }
)

export const verifyPermission =
  (roles: string[] = []) =>
  (req: RequestWithUser, _res: Response, next: NextFunction) => {
    if (!req.userEmbeded) {
      throw new ApiError({
        status: 401,
        message: 'Unauthorized request',
      })
    }

    if (!roles.includes(req.userEmbeded.role)) {
      throw new ApiError({
        status: 403,
        message: "You're not allowed to perform this action",
      })
    }

    next()
  }
