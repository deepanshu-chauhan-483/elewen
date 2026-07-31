import { listSharedDiscountBanners } from '../lib/coupons.js'

export async function getSharedDiscountBanners(_req, res, next) {
  try {
    const banners = await listSharedDiscountBanners()
    return res.json({ banners })
  } catch (err) {
    next(err)
  }
}
