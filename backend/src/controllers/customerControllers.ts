import prisma from '../config/db'
import { RequestWithUser } from '../middlewares/authMiddleware'
import { ApiError } from '../utils/apiError'
import { ApiResponse } from '../utils/apiResponse'
import { asyncHandler } from '../utils/asyncHandler'
import {
  createCustomerSchema,
  updateCustomerSchema,
} from '../validators/customerValidator'

export const createCustomer = asyncHandler(
  async (req: RequestWithUser, res) => {
    const tenantId = req.userEmbeded?.tenantId

    if (!tenantId) {
      throw new ApiError({ status: 400, message: 'tenant context missing' })
    }
    const parsed = createCustomerSchema.safeParse(req.body)

    if (!parsed.success) {
      const err = parsed.error.errors
      throw new ApiError({ status: 400, message: err[0].message })
    }

    const existingCustomer = await prisma.customer.findFirst({
      where: {
        tenantId,
        email: parsed.data.email,
      },
    })

    if (existingCustomer) {
      throw new ApiError({
        status: 400,
        message: 'Customer with this email already exists',
      })
    }

    // Create customer logic here
    const createdCustomer = await prisma.customer.create({
      data: {
        ...parsed.data,
        tenantId,
      },
    })

    if (!createdCustomer) {
      throw new ApiError({ status: 500, message: 'Failed to create customer' })
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, createdCustomer, 'Customer created successfully')
      )
  }
)

//Controller to update a customer
export const updateCustomer = asyncHandler(
  async (req: RequestWithUser, res) => {
    const tenantId = req.userEmbeded?.tenantId

    if (!tenantId) {
      throw new ApiError({ status: 400, message: 'tenant context missing' })
    }

    const customerId = req.params.customerId

    if (!customerId) {
      throw new ApiError({ status: 400, message: 'Customer ID is required' })
    }

    const parsed = updateCustomerSchema.safeParse(req.body)

    if (!parsed.success) {
      const err = parsed.error.errors
      throw new ApiError({ status: 400, message: err[0].message })
    }

    const { customerExists, updatedCustomer } = await prisma.$transaction(
      async (tx) => {
        const customerExists = await tx.customer.findUnique({
          where: { id: customerId, tenantId },
        })

        const updatedCustomer = await tx.customer.update({
          where: { id: customerExists?.id },
          data: { ...parsed.data },
        })

        return { customerExists, updatedCustomer }
      }
    )

    if (!customerExists) {
      throw new ApiError({ status: 404, message: 'Customer not found' })
    }

    if (!updatedCustomer) {
      throw new ApiError({ status: 500, message: 'Failed to update customer' })
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedCustomer, 'Customer updated successfully')
      )
  }
)

// Controller to list customers
export const listCustomers = asyncHandler(async (req: RequestWithUser, res) => {
  const tenantId = req.userEmbeded?.tenantId

  if (!tenantId) {
    throw new ApiError({ status: 400, message: 'tenant context missing' })
  }
  const customers = await prisma.customer.findMany({
    where: {
      tenantId,
      deleted: false, // Assuming you have a 'deleted' field to filter out soft-deleted customers
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  if (!customers) {
    throw new ApiError({ status: 500, message: 'Failed to fetch customers' })
  }

  return res
    .status(200)
    .json(new ApiResponse(200, customers, 'Customers fetched successfully'))
})

export const getCustomer = asyncHandler(async (req: RequestWithUser, res) => {
  const tenantId = req.userEmbeded?.tenantId

  if (!tenantId) {
    throw new ApiError({ status: 400, message: 'tenant context missing' })
  }

  const customerId = req.params.customerId

  if (!customerId) {
    throw new ApiError({ status: 400, message: 'Customer ID is required' })
  }

  const customer = await prisma.customer.findUnique({
    where: { id: customerId, tenantId },
  })

  if (!customer) {
    throw new ApiError({ status: 404, message: 'Customer not found' })
  }

  return res
    .status(200)
    .json(new ApiResponse(200, customer, 'Customer fetched successfully'))
})
