import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  getCart,
  addItem,
  updateItem,
  removeItem,
  updateCart,
  applyCoupon,
  removeCoupon,
} from '../controllers/cart.js'

const router = Router()

router.use(requireAuth)

/**
 * @openapi
 * /cart:
 *   get:
 *     tags: [Cart]
 *     summary: Get current user's cart (auto-created if none exists)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart with items and totals
 *   patch:
 *     tags: [Cart]
 *     summary: Update cart event details (date, city, guest count)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               eventDate: { type: string, format: date }
 *               eventCity: { type: string }
 *               guestCount: { type: integer }
 *     responses:
 *       200:
 *         description: Updated cart
 */
router.get('/', getCart)
router.patch('/', updateCart)

/**
 * @openapi
 * /cart/items:
 *   post:
 *     tags: [Cart]
 *     summary: Add a package to cart
 *     description: "packageId is the Strapi numeric integer ID (e.g. 4). Get it from GET /api/packages on Strapi (port 1337)."
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [packageId]
 *             properties:
 *               packageId: { type: integer, example: 4, description: "Strapi numeric package ID — from /api/packages response" }
 *               quantity: { type: integer, default: 1, example: 1 }
 *     responses:
 *       201:
 *         description: Item added, updated cart returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cart:
 *                   $ref: '#/components/schemas/Cart'
 *       404:
 *         description: Package not found in Strapi
 */
router.post('/items', addItem)

/**
 * @openapi
 * /cart/items/{itemId}:
 *   put:
 *     tags: [Cart]
 *     summary: Update cart item quantity
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: itemId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: Updated cart
 *       403:
 *         description: Item belongs to another user's cart
 *       404:
 *         description: Cart item not found
 *   delete:
 *     tags: [Cart]
 *     summary: Remove item from cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: itemId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Updated cart
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Cart item not found
 */
router.put('/items/:itemId', updateItem)
router.delete('/items/:itemId', removeItem)

/**
 * @openapi
 * /cart/coupon:
 *   post:
 *     tags: [Cart]
 *     summary: Apply a coupon code to cart
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string, example: SAVE10 }
 *     responses:
 *       200:
 *         description: Coupon applied, cart updated with discount
 *       400:
 *         description: Coupon expired, not active, or usage limit reached
 *       404:
 *         description: Invalid or inactive coupon code
 *   delete:
 *     tags: [Cart]
 *     summary: Remove applied coupon from cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Coupon removed, totals recalculated
 */
router.post('/coupon', applyCoupon)
router.delete('/coupon', removeCoupon)

export default router
