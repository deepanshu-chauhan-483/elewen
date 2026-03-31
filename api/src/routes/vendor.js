import { Router } from 'express'
import { registerVendor } from '../controllers/vendor.js'

const router = Router()

/**
 * @openapi
 * /vendor/register:
 *   post:
 *     tags: [Vendor]
 *     summary: Submit a vendor registration application
 *     description: >
 *       Creates a vendor entry in Strapi with status `pending`.
 *       Admin reviews and approves/rejects from the Strapi admin panel.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [business_name, contact_person_name, email, phone, city, service_category]
 *             properties:
 *               business_name:
 *                 type: string
 *                 example: Floral Dreams Decor
 *               contact_person_name:
 *                 type: string
 *                 example: Rajan Kumar
 *               email:
 *                 type: string
 *                 format: email
 *                 example: rajan@floraldreams.com
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               city:
 *                 type: string
 *                 example: Chennai
 *               service_category:
 *                 type: string
 *                 example: Decor & Styling
 *               experience_years:
 *                 type: integer
 *                 example: 5
 *               description:
 *                 type: string
 *                 example: We specialise in floral installations for weddings and corporate events.
 *     responses:
 *       201:
 *         description: Application received
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: We've received your application and will review it shortly.
 *       400:
 *         description: Validation error — required fields missing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       409:
 *         description: A vendor with this email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', registerVendor)

export default router
