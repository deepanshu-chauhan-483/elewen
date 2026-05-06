import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { getCustomerHelp, getCustomerSummary } from '../controllers/dashboard.js'

const router = Router()

router.use(requireAuth)

router.get('/customer/help', getCustomerHelp)
router.get('/customer/summary', getCustomerSummary)

export default router
