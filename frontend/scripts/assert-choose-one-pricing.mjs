/**
 * T0: surcharge mode adds deltas to base; absolute mode unchanged.
 * Run: node frontend/scripts/assert-choose-one-pricing.mjs
 */
import {
  formatSurchargePrice,
  resolveChooseOneDisplayPrice,
  resolveChooseOneUnitPrice,
  shouldShowChoicePrices,
} from '../src/lib/chooseOnePricing.js'

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

const surchargeSections = [
  {
    type: 'choice-row',
    title: 'Backdrop (choose 1)',
    items: [
      { title: 'Single Panel Backdrop', surcharge: 5000, price: '+₹5,000', selected: true },
      { title: 'Shimmer Wall Backdrop', selected: false },
    ],
  },
  {
    type: 'choice-row',
    title: 'Bar Setup (choose 1)',
    items: [
      { title: 'Basic Bar', selected: false },
      { title: 'Fancy Bar', surcharge: 5000, price: '+₹5,000', selected: true },
    ],
  },
]

assertEqual(formatSurchargePrice(5000), '+₹5,000', 'formatSurchargePrice')
assertEqual(shouldShowChoicePrices(surchargeSections[0]), true, 'shouldShowChoicePrices surcharge')
assertEqual(resolveChooseOneUnitPrice(surchargeSections, 60620), 70620, 'unitPrice both surcharges')
assertEqual(resolveChooseOneDisplayPrice(surchargeSections, 60620), '₹70,620', 'display both surcharges')

const absoluteSections = [
  {
    type: 'choice-row',
    title: 'Choose 1',
    items: [
      { title: 'Floral Memory Setup', priceAmount: 4730, selected: true },
      { title: 'Image Placards', priceAmount: 6980, selected: false },
    ],
  },
]

assertEqual(resolveChooseOneUnitPrice(absoluteSections, 6980), 4730, 'absolute selected sum')
assertEqual(
  resolveChooseOneDisplayPrice(
    [
      {
        type: 'choice-row',
        title: 'Choose 1',
        items: [
          { title: 'A', priceAmount: 4730, selected: false },
          { title: 'B', priceAmount: 6980, selected: false },
        ],
      },
    ],
    6980
  ),
  '₹4,730 – ₹6,980',
  'absolute range'
)

console.log('assert-choose-one-pricing: ok')
