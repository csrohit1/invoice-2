import { z } from 'zod'
import { Role } from '../../generated/prisma'

const baseTenantSchema = {
  name: z.string().min(2),
  slug: z.string().min(2),
  gstNumber: z.string().optional(),
  logoUrl: z.string().url().optional(),

  email: z.string().email().optional(),
  phone: z.string().min(7).max(15).optional(),
  website: z.string().url().optional(),
  supportEmail: z.string().email().optional(),
  contactPersonName: z.string().optional(),

  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  country: z.string().optional(),

  industry: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
  trialEndsAt: z.coerce.date().optional(),
}

export const createTenantSchema = z.object({
  ...baseTenantSchema,
})

export const updateTenantSchema = z.object({
  id: z.string().uuid(),
  data: z.object({
    ...baseTenantSchema,
  }),
})

export const listTenantsQuerySchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
})

export const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  role: z.nativeEnum(Role).optional(),
})

export const initiateOnboardingSchema = z.object({
  companyName: z
    .string()
    .min(2, { message: 'Company name must be at least 2 characters long' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string({ required_error: 'Password is required' }),
  phone: z
    .string()
    .min(10, { message: 'Phone number must be at least 10 digits' })
    .max(15, { message: 'Phone number must be at most 15 digits' }),
  gstNumber: z.string().optional(),

  contactPersonName: z.string().optional(),
  supportEmail: z
    .string()
    .email({ message: 'Invalid support email address' })
    .optional(),
  website: z.string().url({ message: 'Invalid website URL' }).optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  country: z.string().optional(),
})
