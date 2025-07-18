import { Router } from 'express'
import {
  createSalesOrder,
  getSalesOrder,
  mailSalesOrder,
  updateSalesOrder,
  updateSalesOrderStatus,
} from '../controllers/salesOrderControllers'
import { verifyJWT, verifyPermission } from '../middlewares/authMiddleware'
import { Role } from '../../generated/prisma'
import {
  setSalesOrderStatusAccepted,
  setSalesOrderStatusRejected,
} from '../utils/helper'

const router = Router()

// TODO: Protect the route

router.use(verifyJWT, verifyPermission([Role.ADMIN]))

router.route('/').post(createSalesOrder)

router.route('/:id').get(getSalesOrder).patch(updateSalesOrder)

router
  .route('/:id/status/accept')
  .patch(setSalesOrderStatusAccepted, updateSalesOrderStatus)
router
  .route('/:id/status/reject')
  .patch(setSalesOrderStatusRejected, updateSalesOrderStatus)

router.route('/:id/mail').post(mailSalesOrder)

export default router
