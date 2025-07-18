import { z } from 'zod'
import { Role } from '../../generated/prisma'

export const createUserProfileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(10).max(15).optional(),
  authId: z.string().uuid(),
  tenantId: z.string().uuid(),
  role: z.enum(['ADMIN', 'ACCOUNTANT', 'STAFF', 'VIEWER']),
})

export const updateUserProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().min(10).max(15).optional(),
  role: z.nativeEnum(Role).optional(),
})

export const createStaffUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  role: z
    .nativeEnum(Role)
    .refine((r) => r !== 'SUPEPR_ADMIN' && r !== 'ADMIN', {
      message: 'Cannot assign SUPER_ADMIN or ADMIN role directly',
    }),
})
