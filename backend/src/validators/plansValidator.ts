import { z } from 'zod'

export const createPlanSchema = z.object({
  name: z.string().min(1),
  price: z.number().min(0),
  durationDays: z.number().min(1),
  description: z.string().optional(),
  features: z.record(z.string(), z.any()).optional(),
})

export const updatePlanSchema = createPlanSchema.partial()
