/**
 * Razorpay Webhook Test Script
 * ─────────────────────────────
 * Simulates exactly what Razorpay sends to /payments/webhook.
 * Uses the same HMAC-SHA256 signing that Razorpay uses.
 *
 * Usage:
 *   node test-webhook.js payment.captured  <razorpayOrderId>  <razorpayPaymentId>
 *   node test-webhook.js payment.failed    <razorpayOrderId>
 *   node test-webhook.js refund.processed  <gatewayRefundId>
 *
 * Examples:
 *   node test-webhook.js payment.captured order_abc123 pay_xyz789
 *   node test-webhook.js payment.failed order_abc123
 *   node test-webhook.js refund.processed rfnd_abc123
 */

import crypto from 'crypto'
import dotenv from 'dotenv'
dotenv.config()

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'set_this_in_razorpay_dashboard'
const API_URL = `http://localhost:${process.env.PORT || 3000}`

const [, , eventType, arg1, arg2] = process.argv

if (!eventType) {
  console.log('Usage: node test-webhook.js <event> [arg1] [arg2]')
  console.log('Events: payment.captured | payment.failed | refund.processed')
  process.exit(1)
}

// ─── Build payload matching Razorpay's actual webhook structure ───────────────
const buildPayload = () => {
  const now = Math.floor(Date.now() / 1000)

  if (eventType === 'payment.captured') {
    const orderId = arg1 || 'order_TEST_' + Date.now()
    const paymentId = arg2 || 'pay_TEST_' + Date.now()
    return {
      entity: 'event',
      account_id: 'acc_test',
      event: 'payment.captured',
      contains: ['payment'],
      payload: {
        payment: {
          entity: {
            id: paymentId,
            entity: 'payment',
            amount: 50000,
            currency: 'INR',
            status: 'captured',
            order_id: orderId,
            method: 'upi',
            captured: true,
            created_at: now,
          },
        },
      },
      created_at: now,
    }
  }

  if (eventType === 'payment.failed') {
    const orderId = arg1 || 'order_TEST_' + Date.now()
    return {
      entity: 'event',
      account_id: 'acc_test',
      event: 'payment.failed',
      contains: ['payment'],
      payload: {
        payment: {
          entity: {
            id: 'pay_TEST_FAILED_' + Date.now(),
            entity: 'payment',
            amount: 50000,
            currency: 'INR',
            status: 'failed',
            order_id: orderId,
            method: 'card',
            error_code: 'BAD_REQUEST_ERROR',
            error_description: 'Card declined by issuing bank',
            error_reason: 'payment_failed',
            created_at: now,
          },
        },
      },
      created_at: now,
    }
  }

  if (eventType === 'refund.processed') {
    const refundId = arg1 || 'rfnd_TEST_' + Date.now()
    return {
      entity: 'event',
      account_id: 'acc_test',
      event: 'refund.processed',
      contains: ['refund'],
      payload: {
        refund: {
          entity: {
            id: refundId,
            entity: 'refund',
            amount: 50000,
            currency: 'INR',
            payment_id: 'pay_TEST_' + Date.now(),
            status: 'processed',
            created_at: now,
          },
        },
      },
      created_at: now,
    }
  }

  console.error(`Unknown event: ${eventType}`)
  process.exit(1)
}

// ─── Sign and send ────────────────────────────────────────────────────────────
const payload = buildPayload()
const body = JSON.stringify(payload)

const signature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex')

console.log(`\nSending webhook: ${eventType}`)
console.log(`To: ${API_URL}/payments/webhook`)
console.log(`Signature: ${signature.slice(0, 20)}...`)
console.log(`Payload:`, JSON.stringify(payload, null, 2))

fetch(`${API_URL}/payments/webhook`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Razorpay-Signature': signature,
  },
  body,
})
  .then(async res => {
    const text = await res.text()
    console.log(`\nResponse: ${res.status}`)
    console.log(text)
  })
  .catch(err => {
    console.error('\nFailed to reach API:', err.message)
    console.error('Is the API server running on port 3000?')
  })
