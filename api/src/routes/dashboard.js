import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { getCustomerHelp, getCustomerSummary } from '../controllers/dashboard.js'
import { getMyCoupons } from '../controllers/couponGrants.js'

const router = Router()

router.use(requireAuth)

router.get('/customer/help', getCustomerHelp)
router.get('/customer/summary', getCustomerSummary)
router.get('/customer/coupons', getMyCoupons)

export default router
