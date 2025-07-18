import { Router } from 'express'
import {
  createInventoryItem,
  getInventoryItem,
  listInventoryItems,
  updateInventoryItem,
  deleteInventoryItem,
  searchInventoryItems,
} from '../controllers/inventoryControllers'
import { verifyJWT, verifyPermission } from '../middlewares/authMiddleware'
import { Role } from '../../generated/prisma'

const router = Router()

router.use(verifyJWT, verifyPermission([Role.ADMIN]))

router.route('/').post(createInventoryItem).get(listInventoryItems)

router.route('/search').get(searchInventoryItems)

router
  .route('/:id')
  .get(getInventoryItem)
  .patch(updateInventoryItem)
  .delete(deleteInventoryItem)

export default router
