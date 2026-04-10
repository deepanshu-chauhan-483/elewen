import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  createOrder,
  verifyPayment,
  getPayments,
  getAllPayments,
  requestRefund,
  processRefund,
  getRefunds,
  createVendorPayout,
  updateVendorPayout,
  getVendorPayouts,
} from '../controllers/payment.js'

const router = Router()

// All payment routes require authentication
router.use(requireAuth)

// ─── Payment Orders ──────────────────────────────────────────────────────────

/**
 * @openapi
 * /payments/create-order:
 *   post:
 *     tags: [Payments]
 *     summary: Create a Razorpay order for a booking payment
 *     description: |
 *       Creates a Razorpay order and a pending Payment record.
 *       Returns the order details needed to open the Razorpay checkout modal on the frontend.
 *       Idempotent: if a pending order already exists for the same booking + type, returns it.
 *
 *       **Payment flow:**
 *       1. Call this endpoint → get `razorpayOrderId`, `amount`, `keyId`
 *       2. Open Razorpay modal with these values
 *       3. Customer pays → Razorpay returns `razorpayPaymentId` + `razorpaySignature`
 *       4. Call `POST /payments/verify` with all three IDs + signature
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId, paymentType]
 *             properties:
 *               bookingId:
 *                 type: string
 *                 format: uuid
 *               paymentType:
 *                 type: string
 *                 enum: [advance, remaining, full]
 *                 description: "'advance' for the initial deposit, 'remaining' after advance is paid, 'full' for one-shot payment"
 *     responses:
 *       201:
 *         description: Razorpay order created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 paymentId:
 *                   type: string
 *                   format: uuid
 *                   description: Internal Payment record ID — pass this to /verify
 *                 razorpayOrderId:
 *                   type: string
 *                   example: order_PjlNfxSsZD
 *                 amount:
 *                   type: number
 *                   description: Amount in INR (not paise)
 *                 currency:
 *                   type: string
 *                   example: INR
 *                 keyId:
 *                   type: string
 *                   description: Razorpay key_id to pass to the frontend modal
 *       400:
 *         description: Invalid paymentType, advance already paid, or booking not payable
 *       403:
 *         description: Booking belongs to another user
 *       404:
 *         description: Booking not found
 */
router.post('/create-order', createOrder)

/**
 * @openapi
 * /payments/verify:
 *   post:
 *     tags: [Payments]
 *     summary: Verify Razorpay payment signature after modal completion
 *     description: |
 *       Called by the frontend after Razorpay modal success callback.
 *       Verifies HMAC-SHA256 signature, marks payment as success, and auto-confirms booking on advance payment.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature]
 *             properties:
 *               paymentId:
 *                 type: string
 *                 format: uuid
 *                 description: Internal Payment record ID from create-order response
 *               razorpayOrderId:
 *                 type: string
 *                 example: order_PjlNfxSsZD
 *               razorpayPaymentId:
 *                 type: string
 *                 example: pay_PjlNfxSsZE
 *               razorpaySignature:
 *                 type: string
 *                 description: HMAC-SHA256 signature from Razorpay modal callback
 *               paymentMethod:
 *                 type: string
 *                 enum: [card, upi, netbanking, offline]
 *                 description: Optional — auto-detected from gateway response if omitted
 *     responses:
 *       200:
 *         description: Payment verified, booking auto-confirmed if advance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payment:
 *                   $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Invalid signature or order ID mismatch
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Payment record not found
 */
router.post('/verify', verifyPayment)

/**
 * @openapi
 * /payments:
 *   get:
 *     tags: [Payments]
 *     summary: Get payments for a specific booking
 *     description: Customer can only view payments on their own bookings.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Array of payments with refunds
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Payment'
 *       400:
 *         description: bookingId required
 *       403:
 *         description: Booking belongs to another user
 */
router.get('/', getPayments)

/**
 * @openapi
 * /payments/all:
 *   get:
 *     tags: [Payments]
 *     summary: (Admin) List all payments with pagination
 *     description: Returns all payments across all bookings. Used by admin payment management panel.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: status, schema: { type: string, enum: [pending, success, failed, refunded] } }
 *       - { in: query, name: paymentType, schema: { type: string, enum: [advance, remaining, full] } }
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20 } }
 *     responses:
 *       200:
 *         description: Paginated payments list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Payment'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 */
router.get('/all', getAllPayments)

// ─── Refunds ─────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /payments/refunds:
 *   post:
 *     tags: [Payments]
 *     summary: Request a refund for a successful payment
 *     description: |
 *       Creates a refund request with status 'requested'. An admin must approve via PATCH /payments/refunds/:id.
 *       Only one open refund (requested/processing) allowed per payment.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paymentId]
 *             properties:
 *               paymentId:
 *                 type: string
 *                 format: uuid
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Refund request created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 refund:
 *                   $ref: '#/components/schemas/Refund'
 *       400:
 *         description: Payment not successful or refund already exists
 *       403:
 *         description: Payment belongs to another user's booking
 *   get:
 *     tags: [Payments]
 *     summary: List refunds (optionally filtered)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: bookingId, schema: { type: string, format: uuid } }
 *       - { in: query, name: status, schema: { type: string, enum: [requested, processing, completed, rejected] } }
 *     responses:
 *       200:
 *         description: Array of refunds
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 refunds:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Refund'
 */
router.post('/refunds', requestRefund)
router.get('/refunds', getRefunds)

/**
 * @openapi
 * /payments/refunds/{id}:
 *   patch:
 *     tags: [Payments]
 *     summary: (Admin) Approve or reject a refund request
 *     description: |
 *       - **approve**: Calls Razorpay refund API → sets status to 'processing'. Webhook `refund.processed` will set it to 'completed'.
 *       - **reject**: Sets status to 'rejected' immediately.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *     responses:
 *       200:
 *         description: Refund updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 refund:
 *                   $ref: '#/components/schemas/Refund'
 *       400:
 *         description: Invalid action or refund not in requested state
 *       404:
 *         description: Refund not found
 *       502:
 *         description: Razorpay refund API call failed
 */
router.patch('/refunds/:id', processRefund)

// ─── Vendor Payouts ──────────────────────────────────────────────────────────

/**
 * @openapi
 * /payments/vendor-payouts:
 *   post:
 *     tags: [Payments]
 *     summary: (Admin) Create a vendor payout record
 *     description: Records a pending payout to a vendor for a completed booking. Use PATCH to mark it paid.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vendorId, bookingId, amount]
 *             properties:
 *               vendorId:
 *                 type: string
 *                 description: Strapi vendor ID (numeric string)
 *               bookingId:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *                 enum: [portal, offline]
 *                 default: offline
 *     responses:
 *       201:
 *         description: Vendor payout created with status pending
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payout:
 *                   $ref: '#/components/schemas/VendorPayout'
 *   get:
 *     tags: [Payments]
 *     summary: List vendor payouts
 *     description: Admin sees all payouts. Vendor portal uses vendorId filter.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: vendorId, schema: { type: string } }
 *       - { in: query, name: bookingId, schema: { type: string, format: uuid } }
 *       - { in: query, name: status, schema: { type: string, enum: [pending, paid, failed] } }
 *     responses:
 *       200:
 *         description: Array of vendor payouts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payouts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/VendorPayout'
 */
router.post('/vendor-payouts', createVendorPayout)
router.get('/vendor-payouts', getVendorPayouts)

/**
 * @openapi
 * /payments/vendor-payouts/{id}:
 *   patch:
 *     tags: [Payments]
 *     summary: (Admin) Mark a vendor payout as paid or failed
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [paid, failed]
 *               referenceId:
 *                 type: string
 *                 description: Bank transfer reference / UTR number
 *     responses:
 *       200:
 *         description: Payout updated with paidAt timestamp if status=paid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payout:
 *                   $ref: '#/components/schemas/VendorPayout'
 *       400:
 *         description: Invalid status or payout already settled
 *       404:
 *         description: Vendor payout not found
 */
router.patch('/vendor-payouts/:id', updateVendorPayout)

export default router
