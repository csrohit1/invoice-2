import prisma from '../config/db'
import { RequestWithUser } from '../middlewares/authMiddleware'
import { ApiError } from '../utils/apiError'
import { ApiResponse } from '../utils/apiResponse'
import { asyncHandler } from '../utils/asyncHandler'
import { generateSalesOrderPDF } from '../utils/htmlToPdfGen'
import { salesOrderContent, sendEmail } from '../utils/mail'
import {
  createSalesOrderSchema,
  updateSalesOrderSchema,
} from '../validators/salesOrderValidator'

// Helper function to calculate sales order totals
const calculateSalesOrderTotals = async (items: any[], tenantId: string) => {
  // Validate all inventoryItemIds exist for this tenant and get their default values
  const inventoryItemIds = items.map((item: any) => item.inventoryItemId)
  const foundItems = await prisma.inventoryItem.findMany({
    where: { id: { in: inventoryItemIds }, tenantId },
    select: { id: true, unitPrice: true, taxRate: true },
  })

  if (foundItems.length !== inventoryItemIds.length) {
    throw new ApiError({
      status: 400,
      message: 'One or more inventory items not found for this tenant',
    })
  }

  // Create a map for quick lookup of inventory item defaults
  const inventoryItemMap = new Map(foundItems.map((item) => [item.id, item]))

  // Calculate totals and prepare items with calculated amounts
  let subTotal = 0
  let taxAmount = 0

  const itemsWithCalculations = items.map((item: any) => {
    const inventoryItem = inventoryItemMap.get(item.inventoryItemId)!

    // Use provided values or fall back to inventory item defaults
    const unitPrice = item.unitPrice ?? inventoryItem.unitPrice
    const taxRate = item.taxRate ?? inventoryItem.taxRate ?? 0

    // Calculate item amount (quantity × unitPrice)
    const amount = item.quantity * unitPrice

    // Calculate tax for this item
    const itemTaxAmount = Math.round((amount * taxRate) / 100)

    subTotal += amount
    taxAmount += itemTaxAmount

    return {
      ...item,
      unitPrice,
      taxRate,
      amount,
    }
  })

  const total = subTotal + taxAmount

  return {
    itemsWithCalculations,
    subTotal,
    taxAmount,
    total,
  }
}

export const createSalesOrder = asyncHandler(
  async (req: RequestWithUser, res) => {
    const tenantId = req.userEmbeded?.tenantId

    if (!tenantId) {
      throw new ApiError({ status: 400, message: 'Tenant ID is required' })
    }

    const parsed = createSalesOrderSchema.safeParse(req.body)

    if (!parsed.success) {
      const err = parsed.error.errors
      throw new ApiError({ status: 400, message: err[0].message })
    }

    const { itemsWithCalculations, subTotal, taxAmount, total } =
      await calculateSalesOrderTotals(parsed.data.items, tenantId)

    const salesOrder = await prisma.salesOrder.create({
      data: {
        ...parsed.data,
        tenantId,
        subTotal,
        taxAmount,
        total,
        items: {
          create: itemsWithCalculations,
        },
      },
      include: { items: true },
    })

    if (!salesOrder) {
      throw new ApiError({
        status: 400,
        message: 'Failed to create sales order',
      })
    }

    // TODO: Send email to customer with sales order details

    return res
      .status(201)
      .json(
        new ApiResponse(201, salesOrder, 'Sales order created successfully')
      )
  }
)

export const updateSalesOrder = asyncHandler(
  async (req: RequestWithUser, res) => {
    const tenantId = req.userEmbeded?.tenantId
    const salesOrderId = req.params.id

    if (!salesOrderId) {
      throw new ApiError({ status: 400, message: 'Sales Order ID is required' })
    }
    if (!tenantId) {
      throw new ApiError({ status: 400, message: 'Tenant ID is required' })
    }

    // Check if sales order exists
    const existingSalesOrder = await prisma.salesOrder.findUnique({
      where: { id: salesOrderId, tenantId },
      include: { items: true },
    })

    if (!existingSalesOrder) {
      throw new ApiError({
        status: 404,
        message: 'Sales order not found',
      })
    }

    const parsed = updateSalesOrderSchema.safeParse({
      ...req.body,
      id: salesOrderId,
    })
    if (!parsed.success) {
      const err = parsed.error.errors
      throw new ApiError({ status: 400, message: err[0].message })
    }

    let updateData: any = { ...parsed.data }
    delete updateData.id // Remove id from update data
    delete updateData.items // Handle items separately

    // If items are being updated, calculate totals
    if (parsed.data.items && parsed.data.items.length > 0) {
      const { itemsWithCalculations, subTotal, taxAmount, total } =
        await calculateSalesOrderTotals(parsed.data.items, tenantId)

      // Remove old items and add new ones (simple approach)
      await prisma.salesOrderItem.deleteMany({ where: { salesOrderId } })

      updateData = {
        ...updateData,
        subTotal,
        taxAmount,
        total,
        items: {
          create: itemsWithCalculations,
        },
      }
    }

    const salesOrder = await prisma.salesOrder.update({
      where: { id: salesOrderId, tenantId },
      data: updateData,
      include: { items: true },
    })

    if (!salesOrder) {
      throw new ApiError({
        status: 400,
        message: 'Failed to update sales order',
      })
    }

    // TODO: Send email to customer with sales order details

    return res
      .status(200)
      .json(
        new ApiResponse(200, salesOrder, 'Sales order updated successfully')
      )
  }
)

export const getSalesOrder = asyncHandler(async (req: RequestWithUser, res) => {
  const tenantId = req.userEmbeded?.tenantId

  const salesOrderId = req.params.id

  if (!salesOrderId) {
    throw new ApiError({ status: 400, message: 'Sales Order ID is required' })
  }

  if (!tenantId) {
    throw new ApiError({ status: 400, message: 'Tenant ID is required' })
  }

  const salesOrder = await prisma.salesOrder.findUnique({
    where: { id: salesOrderId, tenantId },
    include: { items: true },
  })

  if (!salesOrder) {
    throw new ApiError({
      status: 404,
      message: 'Sales order not found',
    })
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, salesOrder, 'Sales order retrieved successfully')
    )
})

export const updateSalesOrderStatus = asyncHandler(
  async (req: RequestWithUser, res) => {
    const tenantId = req.userEmbeded?.tenantId
    const salesOrderId = req.params.id

    if (!salesOrderId) {
      throw new ApiError({ status: 400, message: 'Sales Order ID is required' })
    }

    if (!tenantId) {
      throw new ApiError({ status: 400, message: 'Tenant ID is required' })
    }

    const { status } = req.body

    if (!status) {
      throw new ApiError({ status: 400, message: 'Status is required' })
    }

    // Validate status value
    if (!['ACCEPTED', 'REJECTED', 'PENDING'].includes(status)) {
      throw new ApiError({
        status: 400,
        message: 'Invalid status. Must be ACCEPTED, REJECTED, or PENDING',
      })
    }

    // Check if sales order exists and get current status
    const existingSalesOrder = await prisma.salesOrder.findUnique({
      where: { id: salesOrderId, tenantId },
      select: { id: true, status: true, orderNumber: true },
    })

    if (!existingSalesOrder) {
      throw new ApiError({
        status: 404,
        message: 'Sales order not found',
      })
    }

    // Business logic: prevent changing status from ACCEPTED/REJECTED back to PENDING
    if (existingSalesOrder.status !== 'PENDING' && status === 'PENDING') {
      throw new ApiError({
        status: 400,
        message:
          'Cannot change status back to PENDING once it has been ACCEPTED or REJECTED',
      })
    }

    // Update the sales order status
    const salesOrder = await prisma.salesOrder.update({
      where: { id: salesOrderId, tenantId },
      data: { status },
      include: {
        customer: {
          select: { name: true, email: true },
        },
        items: {
          include: {
            inventoryItem: {
              select: { name: true },
            },
          },
        },
      },
    })

    // Determine the action message
    const actionMessage =
      status === 'ACCEPTED'
        ? 'accepted'
        : status === 'REJECTED'
        ? 'rejected'
        : 'updated'

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          salesOrder,
          `Sales order #${salesOrder.orderNumber} has been ${actionMessage} successfully`
        )
      )
  }
)

export const mailSalesOrder = asyncHandler(
  async (req: RequestWithUser, res) => {
    const { id } = req.params
    const tenantId = req.userEmbeded?.tenantId

    if (!id) {
      throw new ApiError({ status: 400, message: 'Sales Order ID is required' })
    }

    if (!tenantId) {
      throw new ApiError({ status: 400, message: 'Missing tenant context' })
    }

    const salesOrder = await prisma.salesOrder.findUnique({
      where: { id, tenantId },
      include: {
        items: {
          include: { inventoryItem: true },
        },
        customer: true,
        tenant: true,
      },
    })

    if (!salesOrder) {
      throw new ApiError({ status: 404, message: 'Sales Order not found' })
    }

    try {
      const salesOrderPdf = await generateSalesOrderPDF({
        id: salesOrder.id,
        orderNumber: salesOrder.orderNumber,
        logoUrl:
          salesOrder.tenant.logoUrl ||
          'https://www.dsac.gov/image-repository/blank-profile-picuture.png/@@images/image.png',
        tenantId: salesOrder.tenantId,
        customerId: salesOrder.customerId,
        placeOfSupply: salesOrder.placeOfSupply || '',
        status: salesOrder.status,
        notes: salesOrder.notes || undefined,
        terms: salesOrder.terms || undefined,
        subTotal: salesOrder.subTotal,
        taxAmount: salesOrder.taxAmount,
        total: salesOrder.total,
        tenantName: salesOrder.tenant.name.split(' ')[0],
        tenantName2:
          salesOrder?.tenant.name.split(' ').slice(1).join(' ') || undefined,
        companyId: salesOrder.tenant.companyId || '-', // fallback to id if companyId not present
        addressLine1: salesOrder.tenant.addressLine1 || '-',
        addressLine2: salesOrder.tenant.addressLine2 || undefined,
        city: salesOrder.tenant.city || '-',
        state: salesOrder.tenant.state || '-',
        zip: salesOrder.tenant.pincode || '-', // Not present, set as empty string
        gstIn: salesOrder.tenant.gstNumber || '',
        customerName: salesOrder.customer.name,
        orderDate: salesOrder.createdAt.toLocaleDateString(),
        createdAt:
          typeof salesOrder.createdAt === 'string'
            ? salesOrder.createdAt
            : salesOrder.createdAt.toISOString(),
        items: salesOrder.items.map((item, i) => ({
          index: i + 1,
          id: item.id,
          salesOrderId: item.salesOrderId,
          inventoryItemId: item.inventoryItemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: typeof item.taxRate === 'number' ? item.taxRate : undefined,
          hsnOrSacCode: item.hsnOrSacCode || '-',
          amount: item.amount,
          name: item.inventoryItem.name, // inventoryItem name not available in include, set as undefined
        })),
      })

      // Save PDF to public folder
      const fs = require('fs')
      const path = require('path')
      const publicDir = path.join(__dirname, '../../public')
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true })
      }
      // const pdfFileName = `sales-order-${
      //   salesOrder.customer.name
      // }-${Date.now()}.pdf`
      // const pdfFilePath = path.join(publicDir, pdfFileName)
      // fs.writeFileSync(pdfFilePath, salesOrderPdf)

      await sendEmail({
        email: salesOrder.customer.email,
        subject: 'Sales order',
        htmlContent: salesOrderContent({
          amount: salesOrder.total,
          customerName: salesOrder.customer.name,
          orderDate: salesOrder.createdAt.toLocaleDateString(),
          orderNumber: salesOrder.orderNumber,
          tenantName: salesOrder.tenant.name,
        }),
        attachments: [
          {
            filename: `sales-order-${salesOrder.customer.name}.pdf`,
            content: salesOrderPdf,
            contentType: 'application/pdf',
          },
        ],
      })
    } catch (error) {
      console.log('Error while sending sales order mail')
      console.log(`sales order mail err - ${error}`)
      throw new ApiError({
        status: 500,
        message: 'Something went wrong while sending email',
        data: error,
      })
    }

    return res
      .status(200)
      .json(new ApiResponse(200, salesOrder, 'Sales order sent to mail'))
  }
)
