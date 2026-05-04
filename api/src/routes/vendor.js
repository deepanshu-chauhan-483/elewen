import { Router } from 'express'
import { registerVendor } from '../controllers/vendor.js'

const router = Router()

/**
 * @openapi
 * /vendor/register:
 *   post:
 *     tags: [Vendor]
 *     summary: Submit a vendor registration application
 *     description: Creates a vendor entry in Strapi with status `pending`. Admin reviews from Strapi admin panel.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - business_name
 *               - contact_person_name
 *               - email
 *               - phone
 *               - city
 *               - service_category
 *               - website_social_portfolio
 *               - event_types
 *               - verification_document
 *             properties:
 *               business_name: { type: string }
 *               contact_person_name: { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *               city: { type: string }
 *               operating_location: { type: string }
 *               team_size: { type: string }
 *               website_social_portfolio: { type: string }
 *               established_in: { type: string }
 *               service_category:
 *                 type: array
 *                 items: { type: string }
 *               event_types:
 *                 type: array
 *                 items: { type: string }
 *               portfolio_link: { type: string }
 *               experience_years: { type: integer }
 *               description: { type: string }
 *               work_sample:
 *                 type: object
 *               verification_document:
 *                 type: object
 *     responses:
 *       201:
 *         description: Application received
 *       400:
 *         description: Required fields missing
 *       409:
 *         description: Vendor with this email already exists
 */
router.post('/register', registerVendor)

export default router
