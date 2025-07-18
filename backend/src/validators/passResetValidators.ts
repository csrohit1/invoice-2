import { z } from 'zod'

// request password reset
export const requestPasswordResetSchema = z.object({
  email: z.string().email(),
})

// perform password reset
export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})
