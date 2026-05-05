import Razorpay from 'razorpay'

const isPlaceholderCredential = value => {
  const normalized = String(value ?? '').trim().toLowerCase()
  return !normalized || normalized.includes('placeholder')
}

const hasRazorpayCredentials =
  !isPlaceholderCredential(process.env.RAZORPAY_KEY_ID) &&
  !isPlaceholderCredential(process.env.RAZORPAY_KEY_SECRET)

const razorpay = hasRazorpayCredentials
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null

export default razorpay
