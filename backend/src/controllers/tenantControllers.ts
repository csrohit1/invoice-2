import bcrypt from 'bcrypt'
import prisma from '../config/db'
import { ApiError } from '../utils/apiError'
import { asyncHandler } from '../utils/asyncHandler'
import { generateSecurePassword } from '../utils/genSecurePass'
import { createStaffUserSchema } from '../validators/userProfileValidator'
import { RequestWithUser } from '../middlewares/authMiddleware'
import { sendEmail, staffAccountCreationContent } from '../utils/mail'
import { ApiResponse } from '../utils/apiResponse'
import {
  updateTenantSchema,
  updateUserSchema,
} from '../validators/tenantValidator'

export const createStaffUser = asyncHandler(
  async (req: RequestWithUser, res) => {
    const parsed = createStaffUserSchema.safeParse(req.body)
    if (!parsed.success) {
      const err = parsed.error.errors[0]
      throw new ApiError({ status: 400, message: err.message })
    }

    const { email, firstName, lastName, phone, role } = parsed.data

    // Check if already exists
    const existing = await prisma.auth.findUnique({ where: { email } })
    if (existing) {
      throw new ApiError({
        status: 409,
        message: 'User with this email already exists',
      })
    }

    const plainPassword = generateSecurePassword() // use any strong password generator function
    const hashedPassword = await bcrypt.hash(plainPassword, 10)

    // Assuming you are attaching tenant info from middleware
    const tenantId = req.userEmbeded?.tenantId
    if (!tenantId) {
      throw new ApiError({ status: 403, message: 'Tenant context not found' })
    }

    // 1. Create Auth
    const auth = await prisma.auth.create({
      data: {
        email,
        password: hashedPassword,
        isVerified: true,
      },
    })

    // 2. Create Profile
    await prisma.userProfile.create({
      data: {
        firstName,
        lastName,
        phone,
        role,
        authId: auth.id,
        tenantId,
      },
    })

    // 3. Send Credentials Email
    await sendEmail({
      email,
      subject: `${process.env.PROJECT_TITLE}: Account Created`,
      mailgenContent: staffAccountCreationContent(
        `${firstName} ${lastName}`,
        `${process.env.CLIENT_URI}/login`, // TODO: Adjust URL according to frontend
        email,
        plainPassword
      ),
    })

    return res
      .status(201)
      .json(
        new ApiResponse(201, {}, 'User account created and credentials sent')
      )
  }
)

export const getTenantUsers = asyncHandler(
  async (req: RequestWithUser, res) => {
    const tenantId = req.userEmbeded?.tenantId
    if (!tenantId) {
      throw new ApiError({ status: 403, message: 'Tenant context missing' })
    }

    const { page = '1', limit = '20', role, search } = req.query

    const pageNumber = parseInt(page as string, 10)
    const pageSize = parseInt(limit as string, 10)

    const whereClause: any = {
      tenantId,
      ...(role && { role }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { auth: { email: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    }

    const [users, total] = await prisma.$transaction([
      prisma.userProfile.findMany({
        where: whereClause,
        include: { auth: { select: { email: true } } },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.userProfile.count({ where: whereClause }),
    ])

    return res.status(200).json(
      new ApiResponse(200, {
        users,
        pagination: {
          total,
          page: pageNumber,
          limit: pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      })
    )
  }
)

export const updateUser = asyncHandler(async (req: RequestWithUser, res) => {
  const { userId } = req.params

  // Validate input
  const parsed = updateUserSchema.safeParse(req.body)
  if (!parsed.success) {
    const err = parsed.error.errors[0]
    throw new ApiError({ status: 400, message: err.message })
  }

  // Check if user belongs to same tenant
  const user = await prisma.userProfile.findUnique({
    where: { id: userId },
    select: {
      tenantId: true,
    },
  })

  if (!user) {
    throw new ApiError({ status: 404, message: 'User not found' })
  }

  if (user.tenantId !== req.userEmbeded?.tenantId) {
    throw new ApiError({ status: 403, message: 'Unauthorized access' })
  }

  // Update user profile
  const updated = await prisma.userProfile.update({
    where: { id: userId },
    data: parsed.data,
  })

  return res
    .status(200)
    .json(new ApiResponse(200, updated, 'User updated successfully'))
})

export const deleteUser = asyncHandler(async (req: RequestWithUser, res) => {
  const { userId } = req.params

  // Fetch the user profile to be deleted
  const user = await prisma.userProfile.findUnique({
    where: { id: userId },
    include: { auth: true },
  })

  if (!user) {
    throw new ApiError({ status: 404, message: 'User not found' })
  }

  // Only allow deletion within same tenant
  if (user.tenantId !== req.userEmbeded?.tenantId) {
    throw new ApiError({
      status: 403,
      message: "You're not allowed to delete this user",
    })
  }

  // Prevent self-deletion
  if (user.authId === req.userEmbeded.id) {
    throw new ApiError({
      status: 400,
      message: "You can't delete your own account",
    })
  }

  await prisma.$transaction(async (tx) => {
    // Delete the profile
    await tx.userProfile.delete({ where: { id: userId } })

    // Check if auth has any other profiles
    const otherProfiles = await tx.userProfile.findMany({
      where: { authId: user.authId },
    })

    // If no other profiles exist, delete the auth account as well
    if (otherProfiles.length === 0) {
      await tx.auth.delete({ where: { id: user.authId } })
    }
  })

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'User deleted successfully'))
})

export const updateTenantSettings = asyncHandler(
  async (req: RequestWithUser, res) => {
    const parsed = updateTenantSchema.safeParse(req.body)

    if (!parsed.success) {
      const err = parsed.error.errors[0]
      throw new ApiError({ status: 400, message: err.message })
    }

    const tenantId = req.userEmbeded?.tenantId
    const role = req.userEmbeded?.role

    if (!tenantId || role !== 'ADMIN') {
      throw new ApiError({
        status: 403,
        message: "You're not allowed to perform this action",
      })
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: parsed.data,
    })

    return res
      .status(200)
      .json(new ApiResponse(200, updatedTenant, 'Tenant updated successfully'))
  }
)
