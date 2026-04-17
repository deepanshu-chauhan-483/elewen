import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  createAssignment,
  getAssignments,
  updateAssignment,
  deleteAssignment,
  getBankInfo,
  upsertBankInfo,
} from '../controllers/vendorAssignment.js'

const router = Router()
router.use(requireAuth)

/**
 * @openapi
 * /vendor-assignments:
 *   post:
 *     tags: [Vendor Assignments]
 *     summary: (Admin) Assign a vendor to a booking
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId, vendorId]
 *             properties:
 *               bookingId:
 *                 type: string
 *                 format: uuid
 *               vendorId:
 *                 type: string
 *                 description: Strapi vendor ID
 *               serviceId:
 *                 type: string
 *                 description: Strapi service category ID (optional)
 *     responses:
 *       201:
 *         description: Vendor assigned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 assignment:
 *                   $ref: '#/components/schemas/VendorAssignment'
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Booking not found
 *   get:
 *     tags: [Vendor Assignments]
 *     summary: List vendor assignments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: bookingId, schema: { type: string, format: uuid } }
 *       - { in: query, name: vendorId, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Array of vendor assignments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 assignments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/VendorAssignment'
 */
router.post('/', createAssignment)
router.get('/', getAssignments)

/**
 * @openapi
 * /vendor-assignments/{id}:
 *   patch:
 *     tags: [Vendor Assignments]
 *     summary: (Admin) Update assignment status
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
 *                 enum: [assigned, confirmed, completed, reassigned]
 *     responses:
 *       200:
 *         description: Assignment updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 assignment:
 *                   $ref: '#/components/schemas/VendorAssignment'
 *       400:
 *         description: Invalid status value
 *       404:
 *         description: Assignment not found
 *   delete:
 *     tags: [Vendor Assignments]
 *     summary: (Admin) Remove a vendor assignment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Assignment removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Assignment removed
 *       404:
 *         description: Assignment not found
 */
router.patch('/:id', updateAssignment)
router.delete('/:id', deleteAssignment)

/**
 * @openapi
 * /vendor-assignments/bank-info/{vendorId}:
 *   get:
 *     tags: [Vendor Assignments]
 *     summary: Get vendor bank/payout info
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: vendorId, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Bank info or null if not set
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bankInfo:
 *                   oneOf:
 *                     - $ref: '#/components/schemas/VendorBankInfo'
 *                     - type: 'null'
 */
router.get('/bank-info/:vendorId', getBankInfo)

/**
 * @openapi
 * /vendor-assignments/bank-info:
 *   put:
 *     tags: [Vendor Assignments]
 *     summary: Upsert vendor bank/payout info
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vendorId]
 *             properties:
 *               vendorId:
 *                 type: string
 *               bankName:
 *                 type: string
 *               accountNumber:
 *                 type: string
 *               ifscCode:
 *                 type: string
 *               accountHolderName:
 *                 type: string
 *               paymentPreference:
 *                 type: string
 *                 enum: [portal, offline]
 *     responses:
 *       200:
 *         description: Bank info saved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bankInfo:
 *                   $ref: '#/components/schemas/VendorBankInfo'
 */
router.put('/bank-info', upsertBankInfo)

export default router
