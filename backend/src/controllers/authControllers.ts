import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'

import { ApiError } from '../utils/apiError'
import { asyncHandler } from '../utils/asyncHandler'
import {
  changePasswordSchema,
  createAuthSchema,
  loginSchema,
} from '../validators/authValidators'
import prisma from '../config/db'
import {
  emailVerificationContent,
  forgottenPasswordResetContent,
  sendEmail,
} from '../utils/mail'
import {
  generateAccessToken,
  generateRefreshToken,
  generateTemporaryToken,
} from '../utils/helper'
import { ApiResponse } from '../utils/apiResponse'
import {
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from '../utils/constants'
import { initiateOnboardingSchema } from '../validators/tenantValidator'
import dayjs from 'dayjs'
import {
  requestPasswordResetSchema,
  resetPasswordSchema,
} from '../validators/passResetValidators'
import { RequestWithUser } from '../middlewares/authMiddleware'

export const createAuth = asyncHandler(async (req, res) => {
  const parsed = createAuthSchema.safeParse(req.body)
  if (!parsed.success) {
    const err = parsed.error.errors[0]
    throw new ApiError({ status: 400, message: err.message })
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 10)

  const existingAuth = await prisma.auth.findUnique({
    where: {
      email: parsed.data.email,
    },
  })

  if (existingAuth) {
    throw new ApiError({
      status: 400,
      message: 'An account with this email already exists',
    })
  }

  const { unhashedToken, hashedToken, tokenExpiry } =
    await generateTemporaryToken()

  const [auth, emailVerificationToken] = await prisma.$transaction(
    async (tx) => {
      const auth = await tx.auth.create({
        data: {
          ...parsed.data,
          password: hashedPassword,
        },
      })

      const emailVerificationToken = await tx.emailVerificationToken.create({
        data: {
          token: hashedToken,
          expiresAt: tokenExpiry,
          authId: auth.id,
        },
      })

      return [auth, emailVerificationToken]
    }
  )

  if (!auth) {
    throw new ApiError({
      status: 500,
      message: 'Something went wrong while creating auth',
    })
  }

  if (!emailVerificationToken) {
    throw new ApiError({
      status: 500,
      message: 'Something went wrong while creating email verification token',
    })
  }

  try {
    await sendEmail({
      email: auth.email,
      subject: 'Verify your email address',
      mailgenContent: emailVerificationContent(
        'User',
        `${req.protocol}://${req.get(
          'host'
        )}/api/v1/auth/verify-email/${unhashedToken}`
      ),
    })
  } catch (error) {
    console.error('Error sending email:', error)
    throw new ApiError({
      status: 500,
      message: 'Something went wrong while sending verification email',
    })
  }

  return res
    .status(201)
    .json(
      new ApiResponse(201, { email: auth.email }, 'Auth created successfully')
    )
})

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params

  if (!token) {
    throw new ApiError({
      status: 400,
      message: 'Email verification token is required',
    })
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

  const evToken = await prisma.emailVerificationToken.findFirst({
    where: {
      token: hashedToken,
      expiresAt: { gte: new Date(Date.now()) }, // Check if the token is not expired
    },
  })

  if (!evToken) {
    throw new ApiError({
      status: 400,
      message: 'Invalid or expired email verification token',
    })
  }

  const updatedAuth = await prisma.$transaction(async (tx) => {
    const auth = await tx.auth.update({
      where: { id: evToken.authId },
      data: { isVerified: true },
    })

    await tx.emailVerificationToken.delete({ where: { id: evToken.id } })

    return auth
  })

  if (!updatedAuth) {
    throw new ApiError({
      status: 500,
      message: 'Something went wrong while verifying email',
    })
  }

  return res.status(309).redirect(`${process.env.CLIENT_URI}/auth/verified`)

  // return res
  //   .status(200)
  //   .json(
  //     new ApiResponse(
  //       200,
  //       { isVerified: true, email: auth.email },
  //       'Email verified successfully'
  //     )
  //   )
})

export const loginUser = asyncHandler(async (req, res) => {
  // extract user device information
  const device = req.useragent?.isMobile ? 'mobile' : 'desktop'
  const userAgent =
    req.useragent?.source || req.headers['user-agent'] || 'unknown'
  const isMobile = req.useragent?.isMobile

  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    const err = parsed.error.errors[0]
    throw new ApiError({ status: 400, message: err.message })
  }

  const auth = await prisma.auth.findUnique({
    where: {
      email: parsed.data.email,
    },
  })

  if (!auth) {
    throw new ApiError({
      status: 400,
      message: `No account found with this email`,
    })
  }

  const isPasswordValid = await bcrypt.compare(
    parsed.data.password,
    auth.password
  )

  if (!isPasswordValid) {
    throw new ApiError({
      status: 400,
      message: 'Invalid password',
    })
  }

  if (!auth.isVerified) {
    throw new ApiError({
      status: 400,
      message: 'Please verify your email before logging in',
    })
  }

  const accessToken = await generateAccessToken(auth.id)
  const refreshToken = await generateRefreshToken(auth.id)

  if (!accessToken || !refreshToken) {
    throw new ApiError({
      status: 500,
      message: 'Something went wrong while generating tokens',
    })
  }

  const hashedRefreshToken = crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex')

  const refreshTokenEntity = await prisma.refreshToken.create({
    data: {
      token: hashedRefreshToken,
      authId: auth.id,
      expiresAt: new Date(
        Date.now() + Number(process.env.JWT_REFRESH_TOKEN_EXPIRY_MILI_SECONDS!)
      ),
      userAgent,
      device: device as string | null,
    },
  })

  if (!refreshTokenEntity) {
    throw new ApiError({
      status: 500,
      message: 'Something went wrong while saving refresh token',
    })
  }

  const { password, ...authWithoutPassword } = auth

  if (isMobile) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { ...authWithoutPassword, accessToken, refreshToken },
          'User logged in successfully'
        )
      )
  }

  // TODO: remove cookies from res body later in prod
  return res
    .status(200)
    .cookie('accessToken', accessToken, accessTokenCookieOptions)
    .cookie('refreshToken', refreshToken, refreshTokenCookieOptions)
    .json(
      new ApiResponse(
        200,
        { ...authWithoutPassword, accessToken, refreshToken },
        'User logged in successfully'
      )
    )
})

export const submitTenantDetails = asyncHandler(async (req, res) => {
  const parsed = initiateOnboardingSchema.safeParse(req.body)
  if (!parsed.success) {
    const err = parsed.error.errors[0]
    throw new ApiError({ status: 400, message: err.message })
  }

  const {
    companyName,
    email,
    phone,
    gstNumber,
    contactPersonName,
    supportEmail,
    website,
    addressLine1,
    addressLine2,
    city,
    state,
    pincode,
    country,
    password,
  } = parsed.data

  const existing = await prisma.tenantOnboardingSession.findFirst({
    where: { email, status: { in: ['INITIATED', 'PENDING'] } },
  })
  if (existing) {
    throw new ApiError({
      status: 400,
      message:
        'You have already initiated onboarding. Please check your email.',
    })
  }

  let auth = await prisma.auth.findUnique({ where: { email } })
  const hashedPassword = await bcrypt.hash(password, 10)

  if (!auth) {
    auth = await prisma.auth.create({
      data: {
        email,
        password: hashedPassword,
        isVerified: false,
      },
    })
  }

  const session = await prisma.tenantOnboardingSession.create({
    data: {
      email,
      phone,
      gstNumber,
      company: companyName,
      contactPersonName,
      supportEmail,
      website,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      country,
      status: 'INITIATED',
      cashfreeOrderId: `cf_order_${uuidv4()}`,
      password, // Add password field as required by the model
    },
  })

  const unhashedToken = uuidv4()
  const hashedToken = crypto
    .createHash('sha256')
    .update(unhashedToken)
    .digest('hex')
  const expiresAt = dayjs().add(15, 'minutes').toDate()

  await prisma.emailVerificationToken.upsert({
    where: { authId: auth.id },
    update: { token: hashedToken, expiresAt },
    create: {
      authId: auth.id,
      token: hashedToken,
      expiresAt,
    },
  })

  const verificationUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/auth/tenant/verify-email/${unhashedToken}`

  // try {
  //   await sendEmail({
  //     email,
  //     subject: 'Verify your email address to continue onboarding',
  //     mailgenContent: emailVerificationContent(
  //       companyName,
  //       verificationUrl,
  //       15
  //     ),
  //   })
  // } catch (error) {
  //   console.log('Some error occured while sending verification mail')
  // }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { email, verificationUrl },
        'Onboarding started. Please verify your email.'
      )
    )
})

export const verifyOnboardingEmail = asyncHandler(async (req, res) => {
  const { token } = req.params
  if (!token) {
    throw new ApiError({ status: 400, message: 'Token is required' })
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

  // 1. Find token record
  const tokenRecord = await prisma.emailVerificationToken.findFirst({
    where: {
      token: hashedToken,
      expiresAt: { gte: new Date() },
    },
    include: {
      auth: true,
    },
  })

  if (!tokenRecord || !tokenRecord.auth) {
    throw new ApiError({
      status: 400,
      message: 'Invalid or expired token',
    })
  }

  const authId = tokenRecord.auth.id

  const session = await prisma.tenantOnboardingSession.findFirst({
    where: {
      email: tokenRecord.auth.email,
      status: 'INITIATED',
    },
  })

  if (!session) {
    throw new ApiError({
      status: 404,
      message: 'No matching onboarding session found',
    })
  }

  // 3. Update auth and session
  await prisma.$transaction([
    prisma.auth.update({
      where: { id: authId },
      data: { isVerified: true },
    }),
    prisma.tenantOnboardingSession.update({
      where: { id: session.id },
      data: {
        isEmailVerified: true,
        status: 'PENDING',
      },
    }),
    prisma.emailVerificationToken.delete({
      where: { id: tokenRecord.id },
    }),
  ])

  // return res
  //   .status(200)
  //   .json(
  //     new ApiResponse(
  //       200,
  //       { sessionId: session.id },
  //       'Email verified successfully.'
  //     )
  //   )

  return res
    .status(309)
    .redirect(`${process.env.CLIENT_URI}/onboarding/${session.id}/select-plan`)
})

export const requestPasswordReset = asyncHandler(async (req, res) => {
  const parsed = requestPasswordResetSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new ApiError({ status: 400, message: parsed.error.errors[0].message })
  }

  const { email } = parsed.data

  const auth = await prisma.auth.findUnique({ where: { email } })
  if (!auth || !auth.isVerified) {
    // Don't reveal whether email exists
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          'If your email exists, a reset link has been sent.'
        )
      )
  }

  const { unhashedToken, hashedToken, tokenExpiry } =
    await generateTemporaryToken()

  await prisma.passwordResetToken.upsert({
    where: { authId: auth.id },
    update: { token: hashedToken, expiresAt: tokenExpiry },
    create: { token: hashedToken, expiresAt: tokenExpiry, authId: auth.id },
  })

  const resetUrl = `${process.env.CLIENT_URI}/auth/reset-password/${unhashedToken}`

  await sendEmail({
    email,
    subject: 'Reset your password',
    mailgenContent: forgottenPasswordResetContent('User', resetUrl),
  })

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Reset link sent if the email exists.'))
})

export const resetPassword = asyncHandler(async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new ApiError({ status: 400, message: parsed.error.errors[0].message })
  }

  const { token, newPassword } = parsed.data

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

  const tokenRecord = await prisma.passwordResetToken.findFirst({
    where: {
      token: hashedToken,
      expiresAt: { gte: new Date() },
    },
    include: { auth: true },
  })

  if (!tokenRecord) {
    throw new ApiError({ status: 400, message: 'Invalid or expired token' })
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10)

  await prisma.$transaction([
    prisma.auth.update({
      where: { id: tokenRecord.authId },
      data: { password: hashedPassword },
    }),
    prisma.passwordResetToken.delete({ where: { id: tokenRecord.id } }),
    prisma.refreshToken.deleteMany({ where: { authId: tokenRecord.authId } }), // logout everywhere
  ])

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Password has been reset successfully'))
})

export const changePassword = asyncHandler(
  async (req: RequestWithUser, res) => {
    const parsed = changePasswordSchema.safeParse(req.body)
    if (!parsed.success) {
      const err = parsed.error.errors[0]
      throw new ApiError({ status: 400, message: err.message })
    }

    const { currentPassword, newPassword } = parsed.data
    const authId = req.userEmbeded?.id // Extracted from JWT middleware

    const auth = await prisma.auth.findUnique({ where: { id: authId } })

    if (!auth) {
      throw new ApiError({ status: 404, message: 'User not found' })
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, auth.password)
    if (!isPasswordValid) {
      throw new ApiError({
        status: 400,
        message: 'Current password is incorrect',
      })
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    await prisma.$transaction([
      prisma.auth.update({
        where: { id: authId },
        data: { password: hashedNewPassword },
      }),
      prisma.refreshToken.deleteMany({
        where: { authId }, // Optional: revoke all refresh tokens
      }),
    ])

    return res
      .status(200)
      .json(new ApiResponse(200, {}, 'Password changed successfully'))
  }
)
