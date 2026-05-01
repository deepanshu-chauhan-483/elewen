import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  addWishlistItem,
  getWishlist,
  removeWishlistItem,
} from '../controllers/wishlist.js'

const router = Router()

router.use(requireAuth)

router.get('/', getWishlist)
router.post('/', addWishlistItem)
router.delete('/:packageId', removeWishlistItem)

export default router
