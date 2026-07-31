import { Router } from 'express'
import { getSharedDiscountBanners } from '../controllers/couponBanners.js'

const router = Router()

/**
 * @openapi
 * /coupons/banners:
 *   get:
 *     tags: [Coupons]
 *     summary: List discount banners shared to the homepage carousel
 *     description: Public endpoint. Returns active coupons with banner_shared=true.
 *     responses:
 *       200:
 *         description: Shared discount banners
 */
router.get('/banners', getSharedDiscountBanners)

export default router
