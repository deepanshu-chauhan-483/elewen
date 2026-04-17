import { Router } from 'express'
import { calculatePrice, getWizardSteps, wizardFilter } from '../controllers/package.js'

const router = Router()

/**
 * @openapi
 * /packages/calculate-price:
 *   post:
 *     tags: [Packages]
 *     summary: Calculate adjusted price for a package based on guest count
 *     description: Applies pricing_rules (guest_count rules) from the package to return a final adjusted price. No auth required — used on the public package detail page.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [packageId]
 *             properties:
 *               packageId:
 *                 type: integer
 *                 example: 4
 *                 description: Strapi numeric package ID
 *               guestCount:
 *                 type: integer
 *                 example: 120
 *                 description: Number of guests — used to match guest_count pricing rules
 *     responses:
 *       200:
 *         description: Price breakdown with adjusted total
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 packageId: { type: integer }
 *                 guestCount: { type: integer }
 *                 base_price: { type: string, example: "25000.00" }
 *                 adjusted_price: { type: string, example: "28750.00" }
 *                 currency: { type: string, example: "INR" }
 *                 breakdown:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rule: { type: string }
 *                       type: { type: string, enum: [percentage, flat_amount] }
 *                       modifier: { type: number }
 *                       delta: { type: string }
 *                       description: { type: string }
 *       400:
 *         description: packageId is required
 *       404:
 *         description: Package not found
 */
/**
 * @openapi
 * /packages/wizard-steps/{serviceCategoryId}:
 *   get:
 *     tags: [Packages]
 *     summary: Get wizard steps for a service category
 *     description: Returns the wizard_steps config for the given service category, with each step's source (themes, budget_levels, etc.) resolved into an options array ready for rendering.
 *     parameters:
 *       - in: path
 *         name: serviceCategoryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Strapi numeric service category ID
 *     responses:
 *       200:
 *         description: Wizard steps with resolved options
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 serviceCategoryId: { type: string }
 *                 categoryName: { type: string }
 *                 steps:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Service category not found
 */
router.get('/wizard-steps/:serviceCategoryId', getWizardSteps)

/**
 * @openapi
 * /packages/wizard-filter:
 *   post:
 *     tags: [Packages]
 *     summary: Filter packages using wizard answers
 *     description: Takes wizard answers (theme slug, budget level slug, guest count, etc.) and returns matching packages filtered via Strapi. Answers are mapped to Strapi filters using the wizard_steps maps_to config.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eventId, serviceCategoryId]
 *             properties:
 *               eventId:
 *                 type: integer
 *                 example: 1
 *               serviceCategoryId:
 *                 type: integer
 *                 example: 3
 *               answers:
 *                 type: object
 *                 example: { "theme": "floral", "budget_level": "premium", "guest_count": 120 }
 *               page:
 *                 type: integer
 *                 example: 1
 *               pageSize:
 *                 type: integer
 *                 example: 9
 *     responses:
 *       200:
 *         description: Filtered packages with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 packages:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                 appliedAnswers:
 *                   type: object
 *       400:
 *         description: eventId or serviceCategoryId is required
 *       404:
 *         description: Service category not found
 */
router.post('/wizard-filter', wizardFilter)

router.post('/calculate-price', calculatePrice)

export default router
