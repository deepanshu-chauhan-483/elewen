import crypto from 'crypto'

const CASHFREE_API_VERSION = '2023-08-01'

const isPlaceholderCredential = value => {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
  return !normalized || normalized.includes('placeholder')
}

export function hasCashfreeCredentials() {
  return (
    !isPlaceholderCredential(process.env.CASHFREE_APP_ID) &&
    !isPlaceholderCredential(process.env.CASHFREE_SECRET_KEY)
  )
}

function getBaseUrl() {
  const env = String(process.env.CASHFREE_ENV ?? 'sandbox')
    .trim()
    .toLowerCase()
  return env === 'production' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg'
}

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-api-version': CASHFREE_API_VERSION,
    'x-client-id': process.env.CASHFREE_APP_ID,
    'x-client-secret': process.env.CASHFREE_SECRET_KEY,
  }
}

export function getCashfreeEnvironment() {
  return String(process.env.CASHFREE_ENV ?? 'sandbox')
    .trim()
    .toLowerCase() === 'production'
    ? 'production'
    : 'sandbox'
}

export async function createCashfreeOrder({
  orderId,
  amount,
  customerId,
  customerPhone,
  customerEmail,
  returnUrl,
  notifyUrl,
  note,
}) {
  const orderMeta = {}
  if (returnUrl) orderMeta.return_url = returnUrl
  if (notifyUrl) orderMeta.notify_url = notifyUrl

  const response = await fetch(`${getBaseUrl()}/orders`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      order_amount: amount,
      order_currency: 'INR',
      order_id: orderId,
      customer_details: {
        customer_id: customerId,
        customer_phone: customerPhone || '9999999999',
        customer_email: customerEmail || undefined,
      },
      order_meta: Object.keys(orderMeta).length ? orderMeta : undefined,
      order_note: note || undefined,
    }),
  })

  const data = await response.json()
  if (!response.ok) {
    const detail =
      data?.message ||
      data?.error?.message ||
      data?.error_description ||
      JSON.stringify(data)
    throw new Error(`Cashfree order creation failed: ${detail}`)
  }

  return data
}

export async function fetchCashfreeOrder(orderId) {
  const response = await fetch(`${getBaseUrl()}/orders/${encodeURIComponent(orderId)}`, {
    method: 'GET',
    headers: getHeaders(),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.message || 'Cashfree order fetch failed')
  }

  return data
}

export async function createCashfreeRefund(orderId, { refundId, amount, note }) {
  const response = await fetch(`${getBaseUrl()}/orders/${encodeURIComponent(orderId)}/refunds`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      refund_amount: amount,
      refund_id: refundId,
      refund_note: note || 'Refund',
    }),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.message || 'Cashfree refund failed')
  }

  return data
}

export function verifyCashfreeWebhookSignature(rawBody, timestamp, signature) {
  const secret = process.env.CASHFREE_SECRET_KEY
  if (!secret || isPlaceholderCredential(secret)) {
    return false
  }

  const signedPayload = `${timestamp}${rawBody}`
  const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('base64')
  return expected === signature
}

export function mapCashfreePaymentMethod(orderData) {
  const paymentGroup = String(
    orderData?.payment_method ??
      orderData?.payments?.[0]?.payment_group ??
      orderData?.payment_group ??
      ''
  ).toLowerCase()

  if (paymentGroup.includes('upi')) return 'upi'
  if (paymentGroup.includes('netbank')) return 'netbanking'
  if (paymentGroup.includes('card') || paymentGroup.includes('credit') || paymentGroup.includes('debit')) {
    return 'card'
  }

  return 'card'
}
