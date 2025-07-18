import { z } from 'zod'

// Enums
export const SalesOrderStatus = z.enum(['PENDING', 'ACCEPTED', 'REJECTED'], {
  errorMap: () => ({ message: 'Invalid sales order status' }),
})
export type SalesOrderStatus = z.infer<typeof SalesOrderStatus>

// --- Base Item Schema ---
const baseSalesOrderItemSchema = z.object({
  inventoryItemId: z.string().uuid({ message: 'Invalid inventory item ID' }),
  quantity: z
    .number()
    .int({ message: 'Quantity must be an integer' })
    .positive({ message: 'Quantity must be positive' }),
  unitPrice: z
    .number()
    .int({ message: 'Unit price must be an integer' })
    .nonnegative({ message: 'Unit price must be non-negative' }),
  taxRate: z
    .number()
    .min(0, { message: 'Tax rate must be at least 0%' })
    .max(100, { message: 'Tax rate must be at most 100%' })
    .optional(),
  hsnOrSacCode: z
    .string()
    .max(10, { message: 'HSN/SAC code must be at most 10 characters' })
    .optional(),
  // amount is computed in controller — not included in validation
})

// --- Base Sales Order Schema ---
const baseSalesOrderSchema = z.object({
  customerId: z.string().uuid({ message: 'Invalid customer ID' }),
  status: SalesOrderStatus.optional(),
  notes: z
    .string()
    .max(2000, { message: 'Notes must be at most 2000 characters' })
    .optional(),
  terms: z
    .string()
    .max(2000, { message: 'Terms must be at most 2000 characters' })
    .optional(),
  orderDate: z
    .string()
    .datetime({ message: 'Invalid order date format' })
    .optional(),
  placeOfSupply: z
    .string()
    .max(100, { message: 'Place of supply must be at most 100 characters' })
    .optional(),
  // subTotal, taxAmount, rounding, total — excluded
})

// --- CRUD Schemas ---

export const createSalesOrderItemSchema = baseSalesOrderItemSchema
export type CreateSalesOrderItemInput = z.infer<
  typeof createSalesOrderItemSchema
>

export const updateSalesOrderItemSchema = baseSalesOrderItemSchema
  .extend({
    id: z.string().uuid({ message: 'Invalid item ID' }).optional(),
  })
  .partial()
export type UpdateSalesOrderItemInput = z.infer<
  typeof updateSalesOrderItemSchema
>

export const createSalesOrderSchema = baseSalesOrderSchema.extend({
  items: z
    .array(createSalesOrderItemSchema)
    .min(1, { message: 'At least one item is required' }),
})
export type CreateSalesOrderInput = z.infer<typeof createSalesOrderSchema>

export const updateSalesOrderSchema = baseSalesOrderSchema
  .extend({
    id: z.string().uuid({ message: 'Invalid order ID' }),
    items: z
      .array(z.union([createSalesOrderItemSchema, updateSalesOrderItemSchema]))
      .optional(),
  })
  .partial()
export type UpdateSalesOrderInput = z.infer<typeof updateSalesOrderSchema>

export const getSalesOrderSchema = z.object({
  id: z.string().uuid({ message: 'Invalid order ID' }),
})
export type GetSalesOrderInput = z.infer<typeof getSalesOrderSchema>

export const deleteSalesOrderSchema = z.object({
  id: z.string().uuid({ message: 'Invalid order ID' }),
})
export type DeleteSalesOrderInput = z.infer<typeof deleteSalesOrderSchema>

export const listSalesOrdersSchema = z.object({
  tenantId: z.string().uuid({ message: 'Invalid tenant ID' }),
  customerId: z.string().uuid({ message: 'Invalid customer ID' }).optional(),
  status: SalesOrderStatus.optional(),
  limit: z
    .number()
    .int({ message: 'Limit must be an integer' })
    .positive({ message: 'Limit must be positive' })
    .max(100, { message: 'Limit must be at most 100' })
    .default(10),
  page: z
    .number()
    .int({ message: 'Page must be an integer' })
    .positive({ message: 'Page must be positive' })
    .default(1),
})
export type ListSalesOrdersInput = z.infer<typeof listSalesOrdersSchema>
