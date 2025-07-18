import { z } from 'zod'

// Base customer schema
const baseCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().max(20).optional(),
  address: z.string().max(1000).optional(),
})

// CRUD Schemas
export const createCustomerSchema = baseCustomerSchema
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>

export const updateCustomerSchema = baseCustomerSchema.partial()
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>

export const getCustomerSchema = z.object({
  id: z.string().uuid('Invalid customer ID'),
})
export type GetCustomerInput = z.infer<typeof getCustomerSchema>

export const deleteCustomerSchema = z.object({
  id: z.string().uuid('Invalid customer ID'),
})
export type DeleteCustomerInput = z.infer<typeof deleteCustomerSchema>

export const listCustomersSchema = z.object({
  tenantId: z.string().uuid('Invalid tenant ID'),
  name: z.string().max(255).optional(),
  email: z.string().max(255).optional(),
  limit: z.number().int().positive().max(100).default(10),
  page: z.number().int().positive().default(1),
})
export type ListCustomersInput = z.infer<typeof listCustomersSchema>
