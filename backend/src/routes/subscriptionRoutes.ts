import { Router } from 'express'
import {
  handleCashfreeWebhook,
  proceedTenantPayment,
} from '../controllers/subscriptionControllers'

const router = Router()

router.route('/init-payment').post(proceedTenantPayment)
router.route('/confirm-payment').post(handleCashfreeWebhook)

export default router
