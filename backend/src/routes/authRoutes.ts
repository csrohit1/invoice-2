import express, { Router } from 'express'
import {
  changePassword,
  createAuth,
  loginUser,
  requestPasswordReset,
  resetPassword,
  submitTenantDetails,
  verifyEmail,
  verifyOnboardingEmail,
} from '../controllers/authControllers'
import { verifyJWT } from '../middlewares/authMiddleware'

const router = Router()

router.route('/create').post(createAuth)
router.route('/verify-email/:token').get(verifyEmail)
router.route('/login').post(loginUser)
router.route('/request-password-reset').post(requestPasswordReset)
router.route('/reset-password').post(resetPassword)

router.route('/change-current-password').patch(verifyJWT, changePassword)

router.route('/submit-tenant-details').post(submitTenantDetails)
router.route('/tenant/verify-email/:token').get(verifyOnboardingEmail)

// router.post(
//   '/payments/webhook',
//   express.json({
//     verify: (req: express.Request & { rawBody?: Buffer }, res, buf) => {
//       req.rawBody = buf
//     },
//   }),
//   handleCashfreeWebhook
// )

export default router
