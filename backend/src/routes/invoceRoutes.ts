import { Router } from 'express'
import {
  createInvoice,
  updateInvoice,
  getInvoice,
  listInvoices,
  updateInvoiceStatus,
} from '../controllers/invoiceControllers'
import { verifyJWT, verifyPermission } from '../middlewares/authMiddleware'
import { Role } from '../../generated/prisma'
import {
  setInvoiceStatusPaid,
  setInvoiceStatusOverdue,
  setInvoiceStatusCancelled,
} from '../utils/helper'

const router = Router()

router.use(verifyJWT, verifyPermission([Role.ADMIN]))

router.route('/').post(createInvoice).get(listInvoices)

router.route('/:id').patch(updateInvoice).get(getInvoice)

router
  .route('/:id/status/paid')
  .patch(setInvoiceStatusPaid, updateInvoiceStatus)

router
  .route('/:id/status/overdue')
  .patch(setInvoiceStatusOverdue, updateInvoiceStatus)

router
  .route('/:id/status/cancelled')
  .patch(setInvoiceStatusCancelled, updateInvoiceStatus)

export default router
