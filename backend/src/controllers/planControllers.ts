import { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import prisma from '../config/db'
import { ApiResponse } from '../utils/apiResponse'
import {
  createPlanSchema,
  updatePlanSchema,
} from '../validators/plansValidator'
import { ApiError } from '../utils/apiError'

export const getPlans = asyncHandler(async (_req: Request, res: Response) => {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' },
  })

  return res.status(200).json(new ApiResponse(200, plans, 'Plans fetched'))
})

export const createPlan = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createPlanSchema.safeParse(req.body)
  if (!parsed.success) {
    const err = parsed.error.errors[0]
    throw new ApiError({ status: 400, message: err.message })
  }

  const plan = await prisma.plan.create({ data: parsed.data })

  return res.status(201).json(new ApiResponse(201, plan, 'Plan created'))
})

export const updatePlan = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const parsed = updatePlanSchema.safeParse(req.body)
  if (!parsed.success) {
    const err = parsed.error.errors[0]
    throw new ApiError({ status: 400, message: err.message })
  }

  const plan = await prisma.plan.update({
    where: { id },
    data: parsed.data,
  })

  return res.status(200).json(new ApiResponse(200, plan, 'Plan updated'))
})

export const deletePlan = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  const plan = await prisma.plan.update({
    where: { id },
    data: { isActive: false },
  })

  return res.status(200).json(new ApiResponse(200, plan, 'Plan deactivated'))
})
