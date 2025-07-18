import express from 'express'
import {
  createPlan,
  deletePlan,
  getPlans,
  updatePlan,
} from '../controllers/planControllers'
import { verifyPermission } from '../middlewares/authMiddleware'
import { Role } from '../../generated/prisma'

const router = express.Router()

router.get('/', getPlans)

// router.use(verifyPermission([Role.SUPEPR_ADMIN]))

router.post('/', createPlan)
router.put('/:id', updatePlan)
router.delete('/:id', deletePlan)

export default router
