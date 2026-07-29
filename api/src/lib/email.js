import nodemailer from 'nodemailer'

const RESEND_EMAIL_API_URL = 'https://api.resend.com/emails'

const buildSmtpTransporter = () => {
  const port = Number(process.env.SMTP_PORT || 587)

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

const formatAddress = value => {
  if (!value) return undefined
  return process.env.SMTP_FROM_NAME ? `${process.env.SMTP_FROM_NAME} <${value}>` : value
}

const FROM = process.env.SMTP_FROM || 'deepanshuchauhan483@gmail.com'

// ─── Base layout ──────────────────────────────────────────────────────────────
const layout = (title, bodyHtml) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;overflow:hidden;max-width:600px;">
          <!-- Header -->
          <tr>
            <td style="background:#c9a96e;padding:24px 40px;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#0d0d0d;letter-spacing:2px;text-transform:uppercase;">ELEWEN</p>
              <p style="margin:4px 0 0;font-size:12px;color:#0d0d0d;opacity:0.7;letter-spacing:1px;">EVENT EXPERIENCES</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #2a2a2a;">
              <p style="margin:0;font-size:12px;color:#666;text-align:center;">
                Questions? Reply to this email or contact us at support@elewen.in<br/>
                <span style="color:#444;">© 2026 Elewen. All rights reserved.</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

// ─── Shared styles ────────────────────────────────────────────────────────────
const h1 = text =>
  `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#ffffff;">${text}</h1>`
const p = (text, style = '') =>
  `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#cccccc;${style}">${text}</p>`
const badge = (text, color = '#c9a96e') =>
  `<span style="display:inline-block;background:${color};color:#0d0d0d;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;letter-spacing:1px;text-transform:uppercase;">${text}</span>`
const divider = () => `<hr style="border:none;border-top:1px solid #2a2a2a;margin:24px 0;" />`
const infoRow = (label, value) => `
  <tr>
    <td style="padding:8px 0;font-size:13px;color:#888;width:40%;">${label}</td>
    <td style="padding:8px 0;font-size:14px;color:#fff;font-weight:500;">${value}</td>
  </tr>`
const infoTable = rows => `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
    ${rows}
  </table>`
const ctaBtn = (text, url) => `
  <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="background:#c9a96e;border-radius:6px;">
        <a href="${url}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:700;color:#0d0d0d;text-decoration:none;letter-spacing:0.5px;">${text}</a>
      </td>
    </tr>
  </table>`

/** Large copy-friendly coupon code block for customer emails */
const couponCodeBlock = code => `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
    <tr>
      <td align="center" style="background:#2a2418;border:2px dashed #c9a96e;border-radius:10px;padding:22px 16px;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#c9a96e;font-weight:700;">Your coupon code</p>
        <p style="margin:0;font-size:32px;line-height:1.2;font-weight:800;letter-spacing:3px;color:#ffffff;font-family:Consolas,'Courier New',monospace;">${code}</p>
        <p style="margin:10px 0 0;font-size:13px;color:#aaaaaa;">Copy this exact code and paste it on the cart page</p>
      </td>
    </tr>
  </table>`

// ─── Templates ────────────────────────────────────────────────────────────────

export const templates = {
  booking_created: ({ bookingId, totalPrice, advanceAmount, eventDate, guestCount }) =>
    layout(
      'Booking Created — Elewen',
      `
      ${h1('Booking Placed')}
      ${p('Thank you for choosing Elewen. Your booking has been received and is awaiting advance payment.')}
      ${divider()}
      ${infoTable(`
        ${infoRow('Booking ID', `#${bookingId.slice(0, 8).toUpperCase()}`)}
        ${infoRow('Event Date', new Date(eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }))}
        ${infoRow('Guests', guestCount)}
        ${infoRow('Total', `₹${(Number(totalPrice) || totalPrice.toNumber?.()).toLocaleString('en-IN')}`)}
        ${infoRow('Advance Due', `₹${(Number(advanceAmount) || advanceAmount.toNumber?.()).toLocaleString('en-IN')}`)}
      `)}
      ${divider()}
      ${p('To confirm your booking, please complete the advance payment.')}
      ${ctaBtn('Pay Advance & Confirm', `${process.env.APP_URL || 'https://elewen.in'}/dashboard/bookings/${bookingId}`)}
    `
    ),

  booking_confirmed: ({ bookingId, totalPrice, eventDate, guestCount }) =>
    layout(
      'Booking Confirmed — Elewen',
      `
      <div style="margin-bottom:20px;">${badge('Confirmed', '#22c55e')}</div>
      ${h1("You're all set!")}
      ${p('Your advance payment has been received. Your event booking is now confirmed.')}
      ${divider()}
      ${infoTable(`
        ${infoRow('Booking ID', `#${bookingId.slice(0, 8).toUpperCase()}`)}
        ${infoRow('Event Date', new Date(eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }))}
        ${infoRow('Guests', guestCount)}
        ${infoRow('Total', `₹${Number(totalPrice).toLocaleString('en-IN')}`)}
      `)}
      ${divider()}
      ${p('Our team will be in touch shortly to begin planning your event.')}
      ${ctaBtn('View Booking', `${process.env.APP_URL || 'https://elewen.in'}/dashboard/bookings/${bookingId}`)}
    `
    ),

  booking_status_update: ({ bookingId, previousStatus, newStatus, eventDate }) =>
    layout(
      'Booking Update — Elewen',
      `
      <div style="margin-bottom:20px;">${badge(newStatus.replace('_', ' '))}</div>
      ${h1('Booking Status Updated')}
      ${p(`Your booking status has been updated.`)}
      ${divider()}
      ${infoTable(`
        ${infoRow('Booking ID', `#${bookingId.slice(0, 8).toUpperCase()}`)}
        ${infoRow('Event Date', new Date(eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }))}
        ${infoRow('Previous Status', previousStatus.replace('_', ' '))}
        ${infoRow('New Status', newStatus.replace('_', ' '))}
      `)}
      ${ctaBtn('View Booking', `${process.env.APP_URL || 'https://elewen.in'}/dashboard/bookings/${bookingId}`)}
    `
    ),

  booking_cancelled: ({ bookingId, reason }) =>
    layout(
      'Booking Cancelled — Elewen',
      `
      <div style="margin-bottom:20px;">${badge('Cancelled', '#ef4444')}</div>
      ${h1('Booking Cancelled')}
      ${p('Your booking cancellation request has been submitted.')}
      ${divider()}
      ${infoTable(`
        ${infoRow('Booking ID', `#${bookingId.slice(0, 8).toUpperCase()}`)}
        ${reason ? infoRow('Reason', reason) : ''}
      `)}
      ${divider()}
      ${p('If you believe this is an error or need assistance, please contact our support team.')}
    `
    ),

  payment_success: ({ bookingId, amount, paymentType }) =>
    layout(
      'Payment Received — Elewen',
      `
      <div style="margin-bottom:20px;">${badge('Payment Received', '#22c55e')}</div>
      ${h1(`₹${Number(amount).toLocaleString('en-IN')} received`)}
      ${p('Your payment has been successfully processed.')}
      ${divider()}
      ${infoTable(`
        ${infoRow('Booking ID', `#${bookingId.slice(0, 8).toUpperCase()}`)}
        ${infoRow('Amount', `₹${Number(amount).toLocaleString('en-IN')}`)}
        ${infoRow('Type', paymentType.charAt(0).toUpperCase() + paymentType.slice(1) + ' Payment')}
      `)}
      ${ctaBtn('View Booking', `${process.env.APP_URL || 'https://elewen.in'}/dashboard/bookings/${bookingId}`)}
    `
    ),

  payment_failed: ({ bookingId, amount }) =>
    layout(
      'Payment Failed — Elewen',
      `
      <div style="margin-bottom:20px;">${badge('Payment Failed', '#ef4444')}</div>
      ${h1('Payment could not be processed')}
      ${p('Unfortunately your payment did not go through. Please try again.')}
      ${divider()}
      ${infoTable(`
        ${infoRow('Booking ID', `#${bookingId.slice(0, 8).toUpperCase()}`)}
        ${infoRow('Amount', `₹${Number(amount).toLocaleString('en-IN')}`)}
      `)}
      ${ctaBtn('Retry Payment', `${process.env.APP_URL || 'https://elewen.in'}/dashboard/bookings/${bookingId}`)}
    `
    ),

  refund_processed: ({ bookingId, amount }) =>
    layout(
      'Refund Processed — Elewen',
      `
      <div style="margin-bottom:20px;">${badge('Refund Processed', '#3b82f6')}</div>
      ${h1(`₹${Number(amount).toLocaleString('en-IN')} refund initiated`)}
      ${p('Your refund has been processed and will reflect in your account within 5–7 business days.')}
      ${divider()}
      ${infoTable(`
        ${infoRow('Booking ID', `#${bookingId.slice(0, 8).toUpperCase()}`)}
        ${infoRow('Refund Amount', `₹${Number(amount).toLocaleString('en-IN')}`)}
      `)}
    `
    ),

  coupon_granted: ({ code, title, discountLabel, terms, validTo, note }) =>
    layout(
      'Your Elewen coupon',
      `
      <div style="margin-bottom:20px;">${badge('Referral Coupon')}</div>
      ${h1(title || 'You received a coupon')}
      ${p(`You get <strong style="color:#fff;">${discountLabel}</strong> on your next booking.`)}
      ${couponCodeBlock(code)}
      ${divider()}
      ${infoTable(`
        ${infoRow('Coupon code', `<strong style="color:#c9a96e;font-size:16px;letter-spacing:1px;">${code}</strong>`)}
        ${infoRow('Offer', discountLabel)}
        ${infoRow('Valid till', validTo || 'See terms')}
      `)}
      ${terms ? `${divider()}${p(`<strong style="color:#fff;">Terms &amp; conditions</strong><br/>${terms}`)}` : ''}
      ${note ? p(note) : ''}
      ${p('This code is assigned to your account only and can be used once within the validity period.')}
      ${ctaBtn('View My Coupons', `${process.env.APP_URL || 'https://elewen.in'}/dashboard/profile#my-coupons`)}
    `
    ),

  coupon_share: ({ code, discountLabel, terms, validTo, loginUrl }) =>
    layout(
      'Your Elewen discount coupon',
      `
      <div style="margin-bottom:20px;">${badge('Special Offer')}</div>
      ${h1('You have a discount waiting')}
      ${p(`You get <strong style="color:#fff;">${discountLabel}</strong> on your next booking. Use the code below on the cart page.`)}
      ${couponCodeBlock(code)}
      ${divider()}
      ${infoTable(`
        ${infoRow('Coupon code', `<strong style="color:#c9a96e;font-size:16px;letter-spacing:1px;">${code}</strong>`)}
        ${infoRow('Offer', discountLabel)}
        ${validTo ? infoRow('Valid till', validTo) : ''}
      `)}
      ${terms ? `${divider()}${p(`<strong style="color:#fff;">Terms &amp; conditions</strong><br/>${terms}`)}` : ''}
      ${p('Log in, add packages to your cart, enter this exact code under Apply Coupon, then tap Apply before checkout.')}
      ${ctaBtn('Login & shop', loginUrl)}
    `
    ),
}

// ─── Send email ───────────────────────────────────────────────────────────────
const sendEmailWithSmtp = async (to, subject, html) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[email] SMTP not configured — skipping email to', to)
    return
  }
  try {
    const transporter = buildSmtpTransporter()
    await transporter.sendMail({ from: FROM, to, subject, html })
  } catch (err) {
    console.error('[email] Failed to send to', to, err?.message)
  }
}

export const sendEmail = async (to, subject, html) => {
  if (!process.env.RESEND_API_KEY) {
    return sendEmailWithSmtp(to, subject, html)
  }

  try {
    const response = await fetch(RESEND_EMAIL_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: formatAddress(FROM),
        to,
        subject,
        html,
        reply_to: process.env.SMTP_REPLY_TO || undefined,
      }),
    })

    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      throw new Error(
        payload?.message || payload?.error || `Resend failed with HTTP ${response.status}`
      )
    }

    return payload
  } catch (err) {
    console.error('[email] Resend failed to send to', to, err?.message)
  }
}
