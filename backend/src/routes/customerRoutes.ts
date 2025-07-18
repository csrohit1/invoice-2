import { Router } from 'express'
import {
  createCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
} from '../controllers/customerControllers'
import { verifyJWT, verifyPermission } from '../middlewares/authMiddleware'
import { Role } from '../../generated/prisma'

const router = Router()

// TODO: Protect routes

router.use(verifyJWT, verifyPermission([Role.ADMIN]))

router.route('/').get(listCustomers)
router.route('/').post(createCustomer)
router.route('/:customerId').patch(updateCustomer)
router.route('/:customerId').get(getCustomer)
export default router
