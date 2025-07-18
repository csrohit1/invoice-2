import prisma from '../config/db'
import { ApiError } from '../utils/apiError'
import { ApiResponse } from '../utils/apiResponse'
import { asyncHandler } from '../utils/asyncHandler'
import {
  createInventoryItemValidator,
  updateInventoryItemValidator,
  inventoryItemIdValidator,
} from '../validators/inventoryItemValidator'
import { RequestWithUser } from '../middlewares/authMiddleware'

// Create Inventory Item
export const createInventoryItem = asyncHandler(
  async (req: RequestWithUser, res) => {
    const tenantId = req.userEmbeded?.tenantId
    if (!tenantId) {
      throw new ApiError({ status: 400, message: 'Tenant ID is required' })
    }

    const parsed = createInventoryItemValidator.safeParse({
      ...req.body,
    })
    if (!parsed.success) {
      throw new ApiError({
        status: 400,
        message: parsed.error.errors[0].message,
      })
    }

    const item = await prisma.inventoryItem.create({
      data: {
        ...parsed.data,
        tenantId,
      },
    })

    return res
      .status(201)
      .json(new ApiResponse(201, item, 'Inventory item created successfully'))
  }
)

// Get Inventory Item by ID
export const getInventoryItem = asyncHandler(
  async (req: RequestWithUser, res) => {
    const tenantId = req.userEmbeded?.tenantId
    if (!tenantId) {
      throw new ApiError({ status: 400, message: 'Tenant ID is required' })
    }

    const parsed = inventoryItemIdValidator.safeParse(req.params)
    if (!parsed.success) {
      throw new ApiError({
        status: 400,
        message: parsed.error.errors[0].message,
      })
    }
    const { id } = parsed.data

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
    })

    if (!item || item.tenantId !== tenantId) {
      throw new ApiError({ status: 404, message: 'Inventory item not found' })
    }

    return res
      .status(200)
      .json(new ApiResponse(200, item, 'Inventory item fetched successfully'))
  }
)

// List Inventory Items for a Tenant
export const listInventoryItems = asyncHandler(
  async (req: RequestWithUser, res) => {
    const tenantId = req.userEmbeded?.tenantId
    if (!tenantId) {
      throw new ApiError({ status: 400, message: 'Tenant ID is required' })
    }

    const items = await prisma.inventoryItem.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    })

    return res
      .status(200)
      .json(new ApiResponse(200, items, 'Inventory items fetched successfully'))
  }
)

// Update Inventory Item
export const updateInventoryItem = asyncHandler(
  async (req: RequestWithUser, res) => {
    const tenantId = req.userEmbeded?.tenantId
    if (!tenantId) {
      throw new ApiError({ status: 400, message: 'Tenant ID is required' })
    }

    const { id } = req.params

    if (!id) {
      throw new ApiError({
        status: 400,
        message: 'Inventory item ID is required',
      })
    }

    const parsed = updateInventoryItemValidator.safeParse(req.body)
    if (!parsed.success) {
      throw new ApiError({
        status: 400,
        message: parsed.error.errors[0].message,
      })
    }
    const data = parsed.data

    // Check if item exists and belongs to the tenant
    const item = await prisma.inventoryItem.findUnique({
      where: { id, tenantId },
    })
    if (!item) {
      throw new ApiError({ status: 404, message: 'Inventory item not found' })
    }

    const updatedItem = await prisma.inventoryItem.update({
      where: { id, tenantId },
      data: { ...data }, // Prevent updating the id, ensure tenantId is correct
    })

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedItem, 'Inventory item updated successfully')
      )
  }
)

// Delete Inventory Item
export const deleteInventoryItem = asyncHandler(
  async (req: RequestWithUser, res) => {
    const tenantId = req.userEmbeded?.tenantId
    if (!tenantId) {
      throw new ApiError({ status: 400, message: 'Tenant ID is required' })
    }

    const parsed = inventoryItemIdValidator.safeParse(req.params)
    if (!parsed.success) {
      throw new ApiError({
        status: 400,
        message: parsed.error.errors[0].message,
      })
    }
    const { id } = req.params
    if (!id) {
      throw new ApiError({
        status: 400,
        message: 'Inventory item ID is required',
      })
    }

    // Check if item exists and belongs to the tenant
    const item = await prisma.inventoryItem.findUnique({
      where: { id, tenantId },
    })
    if (!item) {
      throw new ApiError({ status: 404, message: 'Inventory item not found' })
    }

    await prisma.inventoryItem.delete({
      where: { id, tenantId },
    })

    return res
      .status(200)
      .json(new ApiResponse(200, null, 'Inventory item deleted successfully'))
  }
)

export const searchInventoryItems = asyncHandler(
  async (req: RequestWithUser, res) => {
    const tenantId = req.userEmbeded?.tenantId
    if (!tenantId) {
      throw new ApiError({ status: 400, message: 'Tenant ID is required' })
    }

    const { q } = req.query
    if (!q || typeof q !== 'string') {
      throw new ApiError({ status: 400, message: 'Name query is required' })
    }

    const items = await prisma.inventoryItem.findMany({
      where: {
        tenantId,
        OR: [
          {
            name: {
              contains: q,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: q,
              mode: 'insensitive',
            },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    })

    return res
      .status(200)
      .json(new ApiResponse(200, items, 'Inventory items fetched successfully'))
  }
)
