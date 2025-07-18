import { z } from 'zod'
import { InvoiceStatus } from '../../generated/prisma'

// Base validators
const uuidValidator = z.string().uuid()
const dateValidator = z.coerce.date()
const positiveIntValidator = z.number().int().positive()

// Invoice Item Validator (aligned with schema and controller logic)
const invoiceItemValidator = z.object({
  inventoryItemId: uuidValidator,
  quantity: positiveIntValidator,
  unitPrice: positiveIntValidator,
  taxRate: z.number().min(0).max(100).optional(),
})

// Invoice Validator for Create
const createInvoiceValidator = z.object({
  invoiceNumber: positiveIntValidator.optional(),
  tenantId: uuidValidator,
  customerId: uuidValidator,
  salesOrderId: uuidValidator.optional().nullable(),
  issueDate: dateValidator.optional(),
  dueDate: dateValidator
    .optional()
    .refine(
      (date) => !date || date > new Date(),
      'Due date must be in the future'
    ),
  status: z.nativeEnum(InvoiceStatus).optional(),
  notes: z.string().max(2000).optional(),
  terms: z.string().max(2000).optional(),
  items: z.array(invoiceItemValidator).min(1, 'At least one item is required'),
})

// Invoice Validator for Update
const updateInvoiceValidator = z
  .object({
    invoiceNumber: positiveIntValidator.optional(),
    tenantId: uuidValidator.optional(),
    customerId: uuidValidator.optional(),
    salesOrderId: uuidValidator.optional().nullable(),
    issueDate: dateValidator.optional(),
    dueDate: dateValidator.optional(),
    status: z.nativeEnum(InvoiceStatus).optional(),
    notes: z.string().max(2000).optional().nullable(),
    terms: z.string().max(2000).optional().nullable(),
    items: z.array(invoiceItemValidator).optional(),
  })
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update'
  )

// Invoice Validator for Read/Delete
const invoiceIdValidator = z.object({
  id: uuidValidator,
})

// Status Update Validator
const updateInvoiceStatusValidator = z.object({
  id: uuidValidator,
  status: z.nativeEnum(InvoiceStatus),
})

// Query Validator (for filtering/searching invoices)
const queryInvoicesValidator = z
  .object({
    status: z.nativeEnum(InvoiceStatus).optional(),
    customerId: uuidValidator.optional(),
    startDate: dateValidator.optional(),
    endDate: dateValidator.optional(),
    minAmount: positiveIntValidator.optional(),
    maxAmount: positiveIntValidator.optional(),
    limit: positiveIntValidator.optional(),
    offset: positiveIntValidator.optional(),
  })
  .partial()

export {
  createInvoiceValidator,
  updateInvoiceValidator,
  invoiceIdValidator,
  updateInvoiceStatusValidator,
  queryInvoicesValidator,
  invoiceItemValidator,
}
