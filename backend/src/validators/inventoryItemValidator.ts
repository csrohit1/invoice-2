import { z } from 'zod'

// Base validators
const uuidValidator = z.string().uuid()
const positiveIntValidator = z.number().int().positive()
const positiveFloatValidator = z.number().min(0)

// Inventory Item Validator
export const inventoryItemValidator = z.object({
  id: uuidValidator.optional(),
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(1000).optional(),
  unitPrice: positiveIntValidator,
  taxRate: positiveFloatValidator.max(100).optional(),
})

// Create Inventory Item
export const createInventoryItemValidator = inventoryItemValidator.omit({
  id: true,
})

// Update Inventory Item
export const updateInventoryItemValidator = inventoryItemValidator.partial()

// For getting/deleting by id
export const inventoryItemIdValidator = z.object({
  id: uuidValidator,
})
