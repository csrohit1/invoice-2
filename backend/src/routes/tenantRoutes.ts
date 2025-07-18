import { Router } from 'express'
import {
  createStaffUser,
  deleteUser,
  getTenantUsers,
  updateTenantSettings,
  updateUser,
} from '../controllers/tenantControllers'
import { fetchTenantOnboardingSession } from '../controllers/subscriptionControllers'

const router = Router()

// TODO: Protect routes
router.route('/fetch-onboarding-session').post(fetchTenantOnboardingSession)
router.route('/create-user').post(createStaffUser)
router.route('/get-users').get(getTenantUsers)
router.route('/update-user').patch(updateUser)
router.route('/delete-user').delete(deleteUser)

router.route('/update-tenant-settings').patch(updateTenantSettings)

export default router
