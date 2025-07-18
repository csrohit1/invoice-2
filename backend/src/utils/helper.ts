import fs from 'fs'
// Packages
import otpGenerator from 'otp-generator'
import prisma from '../config/db'
import jwt, { JwtPayload } from 'jsonwebtoken'
import crypto from 'crypto'

// Modules
import { ApiError } from './apiError'
import path from 'path'
import dayjs from 'dayjs'

// Types and declarations
interface MoveFileOpts {
  file: Express.Multer.File // file.path is from temp folder
  destPath: string // e.g. "labs/123/gallery"
  newFileName: string // base name without extension
  isPublic?: boolean // default = false (private)
}

interface MoveFileResult {
  success: boolean
  relPath?: string // e.g. "/assets/labs/123/gallery/img_123.png"
  absPath?: string // absolute path on disk
  errMsg?: string
}

export const generateOTP = (length: number = 6) => {
  return otpGenerator.generate(length, {
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  })
}

export const generateAccessToken = async (authId: string) => {
  try {
    console.log('This is the user id  - ', authId)
    const auth = await prisma.auth.findUnique({
      where: { id: authId },
    })
    if (!auth) {
      throw new ApiError({
        status: 400,
        message: `No user found with the id - ${authId}`,
      })
    }

    const userProfile = await prisma.userProfile.findFirst({
      where: { authId: auth.id },
      select: {
        id: true,
        role: true,
        tenantId: true,
      },
    })

    if (!userProfile) {
      throw new ApiError({
        status: 400,
        message: `No user profile found for the auth id - ${authId}`,
      })
    }

    const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET
    const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_TOKEN_EXPIRY || '1h'

    if (!ACCESS_TOKEN_SECRET) {
      throw new ApiError({
        status: 500,
        message: 'No access token secret found',
      })
    }

    const accessToken = jwt.sign(
      {
        id: auth.id,
        email: auth.email,
        role: userProfile.role,
        tenantId: userProfile.tenantId,
        profileId: userProfile.id,
      } as JwtPayload,
      ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY } as jwt.SignOptions
    )

    return accessToken
  } catch (error) {
    throw new ApiError({
      status: 500,
      message: 'Something went wrong while generating access token',
    })
  }
}

export const generateRefreshToken = async (authId: string) => {
  try {
    const auth = await prisma.auth.findUnique({ where: { id: authId } })
    if (!auth) {
      throw new ApiError({
        status: 400,
        message: `No user found with the id - ${authId}`,
      })
    }

    const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET
    const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_TOKEN_EXPIRY || '1h'

    if (!REFRESH_TOKEN_SECRET) {
      throw new ApiError({
        status: 500,
        message: 'No refresh token secret found',
      })
    }

    const refreshToken = jwt.sign(
      {
        id: auth.id,
      } as JwtPayload,
      REFRESH_TOKEN_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY } as jwt.SignOptions
    )

    return refreshToken
  } catch (error) {
    throw new ApiError({
      status: 500,
      message: 'Something went wrong while generating refresh token',
    })
  }
}

export const generateTemporaryToken = async () => {
  const unhashedToken = crypto.randomBytes(20).toString('hex')

  const hashedToken = crypto
    .createHash('sha256')
    .update(unhashedToken)
    .digest('hex')

  const tokenExpiry = new Date(
    Number(Date.now() + Number(process.env.TEMPORARY_TOKEN_EXPIRY))
  )

  return { unhashedToken, hashedToken, tokenExpiry }
}

export const moveFile = ({
  file,
  destPath,
  newFileName,
  isPublic = false,
}: MoveFileOpts): MoveFileResult => {
  // where the final root lives on disk
  const ROOT = isPublic
    ? path.join(__dirname, '../../public/assets')
    : path.join(__dirname, '../../storage/private')

  try {
    // 1. Ensure destination dir exists
    const targetDir = path.join(ROOT, destPath)
    fs.mkdirSync(targetDir, { recursive: true })

    // 2. Build final filename & path
    const ext = path.extname(file.originalname)
    const filename = `${newFileName}_${Date.now()}${ext}`
    const finalAbsPath = path.join(targetDir, filename)

    // 3. Move (rename) temp → final
    fs.renameSync(file.path, finalAbsPath)

    // 4. Build relative URL path for DB
    const relPathPrefix = isPublic ? '/assets' : '/secure'
    const finalRelPath = path
      .join(relPathPrefix, destPath, filename)
      .replace(/\\/g, '/')

    return {
      success: true,
      relPath: finalRelPath, // store this in Asset.path
      absPath: finalAbsPath,
    }
  } catch (err: any) {
    // best‑effort cleanup of temp file
    try {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path)
    } catch (_) {}

    return { success: false, errMsg: err.message }
  }
}

export const convertTo12HourFormat = (time24: string): string => {
  // Validate the input format
  const regex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/
  const match = time24.match(regex)

  if (!match) {
    throw new Error('Invalid time format. Please use HH:MM format.')
  }

  const hours = parseInt(match[1], 10)
  const minutes = match[2]
  let period = 'AM'

  // Determine the period (AM/PM) and convert hours
  if (hours >= 12) {
    period = 'PM'
  }
  const hours12 = hours % 12 || 12 // Convert 0 to 12 for midnight

  return `${hours12}:${minutes} ${period}`
}

export const createSlug = (name: string) => {
  return name.toLocaleLowerCase().split(' ').join('-')
}

export const addMinutesToTime = (time: string, minutes: number): string => {
  return dayjs(`2020-01-01T${time}`).add(minutes, 'minute').format('HH:mm')
}

// Middleware to set sales order status to ACCEPTED
export const setSalesOrderStatusAccepted = (req: any, res: any, next: any) => {
  req.body = { ...req.body, status: 'ACCEPTED' }
  next()
}

// Middleware to set sales order status to REJECTED
export const setSalesOrderStatusRejected = (req: any, res: any, next: any) => {
  req.body = { ...req.body, status: 'REJECTED' }
  next()
}

// Middleware to set invoice status to PAID
export const setInvoiceStatusPaid = (req: any, res: any, next: any) => {
  req.body = { ...req.body, status: 'PAID' }
  next()
}

// Middleware to set invoice status to OVERDUE
export const setInvoiceStatusOverdue = (req: any, res: any, next: any) => {
  req.body = { ...req.body, status: 'OVERDUE' }
  next()
}

// Middleware to set invoice status to CANCELLED
export const setInvoiceStatusCancelled = (req: any, res: any, next: any) => {
  req.body = { ...req.body, status: 'CANCELLED' }
  next()
}
