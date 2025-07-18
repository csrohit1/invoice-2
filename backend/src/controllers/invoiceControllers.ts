import prisma from '../config/db'
import { RequestWithUser } from '../middlewares/authMiddleware'
import { ApiError } from '../utils/apiError'
import { ApiResponse } from '../utils/apiResponse'
import { asyncHandler } from '../utils/asyncHandler'
import {
  createInvoiceValidator,
  updateInvoiceValidator,
} from '../validators/InvoiceValidator'

export const createInvoice = asyncHandler(async (req: RequestWithUser, res) => {
  const tenantId = req.userEmbeded?.tenantId
  if (!tenantId) {
    throw new ApiError({ status: 400, message: 'Tenant ID is required' })
  }

  // If salesOrderId is provided, use sales order data for invoice creation
  if (req.body.salesOrderId) {
    const salesOrderId = req.body.salesOrderId
    // Fetch sales order and its items
    const salesOrder = await prisma.salesOrder.findUnique({
      where: { id: salesOrderId, tenantId },
      include: { items: true, customer: true },
    })
    if (!salesOrder) {
      throw new ApiError({ status: 404, message: 'Sales order not found' })
    }
    if (salesOrder.status !== 'ACCEPTED') {
      throw new ApiError({
        status: 400,
        message: 'Sales order must be accepted before generating invoice',
      })
    }
    // Check for existing invoice for this sales order
    const existingInvoice = await prisma.invoice.findUnique({
      where: { salesOrderId },
    })
    if (existingInvoice) {
      throw new ApiError({
        status: 400,
        message: 'Invoice already exists for this sales order',
      })
    }
    // Check for sufficient stock
    const inventoryItemIds = salesOrder.items.map(
      (item) => item.inventoryItemId
    )
    const foundItems = await prisma.inventoryItem.findMany({
      where: { id: { in: inventoryItemIds }, tenantId },
      select: { id: true, quantity: true },
    })
    for (const item of salesOrder.items) {
      const inv = foundItems.find((i) => i.id === item.inventoryItemId)
      if (inv && inv.quantity !== undefined && inv.quantity < item.quantity) {
        throw new ApiError({
          status: 400,
          message: `Insufficient stock for item: ${item.inventoryItemId}`,
        })
      }
    }
    // Transaction: create invoice and update inventory quantities
    const result = await prisma.$transaction(async (tx) => {
      // Decrement inventory quantities
      for (const item of salesOrder.items) {
        await tx.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: { quantity: { decrement: item.quantity } },
        })
      }
      // Generate invoice number (auto-increment logic)
      const counter = await tx.tenantCounter.upsert({
        where: { tenantId },
        update: { nextInvoiceNumber: { increment: 1 } },
        create: { tenantId },
      })
      // Create invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber: counter.nextInvoiceNumber,
          tenantId,
          customerId: salesOrder.customerId,
          salesOrderId: salesOrder.id,
          issueDate: req.body.issueDate
            ? new Date(req.body.issueDate)
            : new Date(),
          dueDate: req.body.dueDate
            ? new Date(req.body.dueDate)
            : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          status: req.body.status || 'PENDING',
          notes: req.body.notes || salesOrder.notes,
          terms: req.body.terms || salesOrder.terms,
          items: {
            create: salesOrder.items.map((item) => ({
              inventoryItemId: item.inventoryItemId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxRate: item.taxRate,
            })),
          },
        },
        include: { items: true },
      })
      return invoice
    })
    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          result,
          'Invoice created successfully from sales order'
        )
      )
  }

  // Validate input
  const parsed = createInvoiceValidator.safeParse(req.body)
  if (!parsed.success) {
    const err = parsed.error.errors
    throw new ApiError({ status: 400, message: err[0].message })
  }
  const data = parsed.data

  // Validate all inventoryItemIds exist for this tenant
  const inventoryItemIds = data.items.map((item) => item.inventoryItemId)
  const foundItems = await prisma.inventoryItem.findMany({
    where: { id: { in: inventoryItemIds }, tenantId: data.tenantId },
    select: { id: true, quantity: true },
  })
  if (foundItems.length !== inventoryItemIds.length) {
    throw new ApiError({
      status: 400,
      message: 'One or more inventory items not found for this tenant',
    })
  }
  // Check for sufficient stock
  for (const item of data.items) {
    const inv = foundItems.find((i) => i.id === item.inventoryItemId)
    if (inv && inv.quantity !== undefined && inv.quantity < item.quantity) {
      throw new ApiError({
        status: 400,
        message: `Insufficient stock for item: ${item.inventoryItemId}`,
      })
    }
  }

  // Transaction: create invoice and update inventory quantities
  const result = await prisma.$transaction(async (tx) => {
    // Decrement inventory quantities
    if (Array.isArray(data.items)) {
      for (const item of data.items) {
        await tx.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: { quantity: { decrement: item.quantity } },
        })
      }
    }
    // Generate invoice number (auto-increment logic)
    let invoiceNumber = data.invoiceNumber
    if (!invoiceNumber) {
      const counter = await tx.tenantCounter.upsert({
        where: { tenantId: data.tenantId },
        update: { nextInvoiceNumber: { increment: 1 } },
        create: { tenantId: data.tenantId },
      })
      invoiceNumber = counter.nextInvoiceNumber
    }
    // Create invoice
    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        tenantId: data.tenantId,
        customerId: data.customerId,
        salesOrderId: data.salesOrderId,
        issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
        dueDate: data.dueDate
          ? new Date(data.dueDate)
          : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: data.status || 'PENDING',
        notes: data.notes,
        terms: data.terms,
        items: {
          create: data.items,
        },
      },
      include: { items: true },
    })
    return invoice
  })

  // Respond with invoice
  return res
    .status(201)
    .json(new ApiResponse(201, result, 'Invoice created successfully'))
})

export const updateInvoice = asyncHandler(async (req: RequestWithUser, res) => {
  // Validate input
  const parsed = updateInvoiceValidator.safeParse(req.body)
  if (!parsed.success) {
    const err = parsed.error.errors
    throw new ApiError({ status: 400, message: err[0].message })
  }
  const data = parsed.data
  const { id } = req.params
  const tenantId = req.userEmbeded?.tenantId

  if (!id) {
    throw new ApiError({ status: 400, message: 'Invoice ID is required' })
  }

  if (!tenantId) {
    throw new ApiError({ status: 400, message: 'Tenant context missing' })
  }

  // If salesOrderId is provided, update invoice items and details from sales order
  if (data.salesOrderId) {
    // Fetch the invoice and its items
    const invoice = await prisma.invoice.findUnique({
      where: { id, tenantId },
      include: { items: true },
    })
    if (!invoice) {
      throw new ApiError({ status: 404, message: 'Invoice not found' })
    }
    // Fetch the sales order and its items
    const salesOrder = await prisma.salesOrder.findUnique({
      where: { id: data.salesOrderId },
      include: { items: true, customer: true },
    })
    if (!salesOrder) {
      throw new ApiError({ status: 404, message: 'Sales order not found' })
    }
    if (salesOrder.status !== 'ACCEPTED') {
      throw new ApiError({
        status: 400,
        message: 'Sales order must be accepted before updating invoice from it',
      })
    }
    // Transaction: restore old inventory, update invoice, decrement new inventory
    const result = await prisma.$transaction(async (tx) => {
      // Restore old inventory quantities
      for (const oldItem of invoice.items) {
        await tx.inventoryItem.update({
          where: { id: oldItem.inventoryItemId },
          data: { quantity: { increment: oldItem.quantity } },
        })
      }
      // Delete old items
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } })
      // Check for sufficient stock for new items
      const inventoryItemIds = salesOrder.items.map(
        (item) => item.inventoryItemId
      )
      const foundItems = await tx.inventoryItem.findMany({
        where: { id: { in: inventoryItemIds }, tenantId: invoice.tenantId },
        select: { id: true, quantity: true },
      })
      for (const item of salesOrder.items) {
        const inv = foundItems.find((i) => i.id === item.inventoryItemId)
        if (inv && inv.quantity !== undefined && inv.quantity < item.quantity) {
          throw new ApiError({
            status: 400,
            message: `Insufficient stock for item: ${item.inventoryItemId}`,
          })
        }
      }
      // Decrement new inventory quantities
      for (const item of salesOrder.items) {
        await tx.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: { quantity: { decrement: item.quantity } },
        })
      }
      // Update invoice
      const updatedInvoice = await tx.invoice.update({
        where: { id, tenantId },
        data: {
          invoiceNumber: data.invoiceNumber,
          tenantId: invoice.tenantId,
          customerId: salesOrder.customerId,
          salesOrderId: salesOrder.id,
          issueDate: data.issueDate
            ? new Date(data.issueDate)
            : invoice.issueDate,
          dueDate: data.dueDate ? new Date(data.dueDate) : invoice.dueDate,
          status: data.status || invoice.status,
          notes: data.notes || salesOrder.notes,
          terms: data.terms || salesOrder.terms,
          items: {
            create: salesOrder.items.map((item) => ({
              inventoryItemId: item.inventoryItemId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxRate: item.taxRate,
            })),
          },
        },
        include: { items: true },
      })
      return updatedInvoice
    })
    // Respond with updated invoice
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          result,
          'Invoice updated from sales order successfully'
        )
      )
  }

  // Fetch the invoice and its items
  const invoice = await prisma.invoice.findUnique({
    where: { id, tenantId },
    include: { items: true },
  })
  if (!invoice) {
    throw new ApiError({ status: 404, message: 'Invoice not found' })
  }

  // Prepare update data
  const updateData: Record<string, any> = {}

  // Only update fields if present in request
  if (typeof data.invoiceNumber !== 'undefined')
    updateData.invoiceNumber = data.invoiceNumber
  if (typeof data.tenantId !== 'undefined') updateData.tenantId = data.tenantId
  if (typeof data.customerId !== 'undefined')
    updateData.customerId = data.customerId
  if (typeof data.salesOrderId !== 'undefined')
    updateData.salesOrderId = data.salesOrderId
  if (typeof data.issueDate !== 'undefined')
    updateData.issueDate = data.issueDate
      ? new Date(data.issueDate)
      : invoice.issueDate
  if (typeof data.dueDate !== 'undefined')
    updateData.dueDate = data.dueDate ? new Date(data.dueDate) : invoice.dueDate
  if (typeof data.status !== 'undefined') updateData.status = data.status
  if (typeof data.notes !== 'undefined') updateData.notes = data.notes
  if (typeof data.terms !== 'undefined') updateData.terms = data.terms

  // Transaction: restore old inventory, update invoice, decrement new inventory only if items are present
  let result
  if (Array.isArray(data.items)) {
    result = await prisma.$transaction(async (tx) => {
      // Restore old inventory quantities
      for (const oldItem of invoice.items) {
        await tx.inventoryItem.update({
          where: { id: oldItem.inventoryItemId },
          data: { quantity: { increment: oldItem.quantity } },
        })
      }
      // Delete old items
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } })
      // Validate new inventory items
      const inventoryItemIds = data.items!.map((item) => item.inventoryItemId)
      const foundItems = await tx.inventoryItem.findMany({
        where: {
          id: { in: inventoryItemIds },
          tenantId: data.tenantId || invoice.tenantId,
        },
        select: { id: true, quantity: true },
      })
      if (foundItems.length !== inventoryItemIds.length) {
        throw new ApiError({
          status: 400,
          message: 'One or more inventory items not found for this tenant',
        })
      }
      // Check for sufficient stock
      for (const item of data.items!) {
        const inv = foundItems.find((i) => i.id === item.inventoryItemId)
        if (inv && inv.quantity !== undefined && inv.quantity < item.quantity) {
          throw new ApiError({
            status: 400,
            message: `Insufficient stock for item: ${item.inventoryItemId}`,
          })
        }
      }
      // Decrement new inventory quantities
      for (const item of data.items!) {
        await tx.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: { quantity: { decrement: item.quantity } },
        })
      }
      // Update invoice
      const updatedInvoice = await tx.invoice.update({
        where: { id },
        data: {
          ...updateData,
          items: {
            create: data.items,
          },
        },
        include: { items: true },
      })
      return updatedInvoice
    })
  } else {
    // No items update, just update fields
    result = await prisma.invoice.update({
      where: { id, tenantId },
      data: updateData,
      include: { items: true },
    })
  }

  // Respond with updated invoice
  return res
    .status(200)
    .json(new ApiResponse(200, result, 'Invoice updated successfully'))
})

export const getInvoice = asyncHandler(async (req: RequestWithUser, res) => {
  const { id } = req.params
  const tenantId = req.userEmbeded?.tenantId

  if (!tenantId) {
    throw new ApiError({ status: 400, message: 'Tenant context missing' })
  }

  // Fetch the invoice
  const invoice = await prisma.invoice.findUnique({
    where: { id, tenantId },
    include: { items: true },
  })
  if (!invoice) {
    throw new ApiError({ status: 404, message: 'Invoice not found' })
  }

  return res
    .status(200)
    .json(new ApiResponse(200, invoice, 'Invoice fetched successfully'))
})

export const listInvoices = asyncHandler(async (req: RequestWithUser, res) => {
  const tenandId = req.userEmbeded?.tenantId

  if (!tenandId) {
    throw new ApiError({ status: 400, message: 'Tenant ID is required' })
  }

  // Fetch all invoices for the tenant
  const invoices = await prisma.invoice.findMany({
    where: { tenantId: tenandId },
    include: { items: true },
  })

  return res
    .status(200)
    .json(new ApiResponse(200, invoices, 'Invoices fetched successfully'))
})

export const updateInvoiceStatus = asyncHandler(async (req: RequestWithUser, res) => {
  const tenantId = req.userEmbeded?.tenantId
  const { id } = req.params
  const { status } = req.body

  if (!id) {
    throw new ApiError({ status: 400, message: 'Invoice ID is required' })
  }
  if (!tenantId) {
    throw new ApiError({ status: 400, message: 'Tenant context missing' })
  }
  if (!status) {
    throw new ApiError({ status: 400, message: 'Status is required' })
  }

  // Validate status value
  if (!['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'].includes(status)) {
    throw new ApiError({
      status: 400,
      message: 'Invalid status. Must be PENDING, PAID, OVERDUE, or CANCELLED',
    })
  }

  // Fetch invoice and current status
  const invoice = await prisma.invoice.findUnique({
    where: { id, tenantId },
    select: { id: true, status: true, invoiceNumber: true },
  })
  if (!invoice) {
    throw new ApiError({ status: 404, message: 'Invoice not found' })
  }

  // Prevent reverting from PAID/OVERDUE/CANCELLED back to PENDING
  if (invoice.status !== 'PENDING' && status === 'PENDING') {
    throw new ApiError({
      status: 400,
      message: 'Cannot change status back to PENDING once it has been PAID, OVERDUE, or CANCELLED',
    })
  }

  // Update the invoice status
  const updatedInvoice = await prisma.invoice.update({
    where: { id, tenantId },
    data: { status },
    include: {
      customer: { select: { name: true, email: true } },
      items: { include: { inventoryItem: { select: { name: true } } } },
    },
  })

  // Determine the action message
  let actionMessage = 'updated'
  if (status === 'PAID') actionMessage = 'marked as paid'
  else if (status === 'OVERDUE') actionMessage = 'marked as overdue'
  else if (status === 'CANCELLED') actionMessage = 'cancelled'

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedInvoice,
        `Invoice #${updatedInvoice.invoiceNumber} has been ${actionMessage} successfully`
      )
    )
})