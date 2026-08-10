import nodemailer from 'nodemailer'
import {
  customerBookingDetailsUrl,
  customerInfoCollectionUrl,
  customerProfileCouponsUrl,
} from './customerUrls.js'

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
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'info@elewen.co.in'

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
              <p style="margin:4px 0 0;font-size:12px;color:#0d0d0d;opacity:0.7;letter-spacing:1px;">Plan differently.</p>
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
                Questions? Reply to this email or contact us at ${SUPPORT_EMAIL}<br/>
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

const HOOKAH_JOURNEY_SECTIONS = [
  {
    title: 'Booking',
    items: [
      'Booking placed',
      'Payment received',
      'Confirmation email & call from our team',
    ],
  },
  {
    title: 'Customisation (if applicable)',
    items: [
      'Your celebration details shared',
      'We begin designing your setup',
      'Final deck shared for your approval',
    ],
  },
  {
    title: 'Event Day',
    items: [
      'Elewen vendor network arrives',
      'Setup completed and styled',
      'Final payment',
      'Dismantling after the celebration',
    ],
  },
  {
    title: 'After',
    items: ["Review us and join the Fam! (we'd love to hear from you 🤍)"],
  },
]

const hookahJourneyHtml = () =>
  HOOKAH_JOURNEY_SECTIONS.map(
    section => `
      <p style="margin:16px 0 8px;font-size:14px;font-weight:700;color:#fff;">${section.title}</p>
      ${section.items
        .map(
          item =>
            `<p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#cccccc;">⬜ ${item}</p>`
        )
        .join('')}`
  ).join('')

const hookahConfirmationBody = ({
  packageBooked,
  eventDate,
  venueName,
  totalAmount,
  supportPhone,
  bookingUrl,
}) => `
  ${h1("It's Official! Your Celebration Just Got an Upgrade.")}
  ${p(`Thank you for choosing our <strong style="color:#fff;">${packageBooked}</strong> Packages. We've received your booking and your date is officially secured in our calendar.`)}
  ${p("Sit back and relax. We'll take it from here.")}
  ${divider()}
  ${p('<strong style="color:#fff;">Booking Summary</strong>')}
  ${infoTable(`
    ${infoRow('Package', packageBooked)}
    ${infoRow('Date', eventDate)}
    ${infoRow('Location', venueName)}
    ${infoRow('Total Pay', totalAmount)}
  `)}
  ${divider()}
  ${p('<strong style="color:#fff;">Need to add something?</strong>')}
  ${p(`If you have any last-minute questions or want to add an extra touch to your decor, simply email or call us at ${supportPhone || '9810937700'}.`)}
  ${divider()}
  ${p('<strong style="color:#fff;">✨ Your Elewen Journey</strong>')}
  ${p("We'll keep ticking things off, so you always know exactly where we are.")}
  ${hookahJourneyHtml()}
  ${bookingUrl ? ctaBtn('View Booking', bookingUrl) : ''}
  ${divider()}
  ${p(`Team Elewen<br/>${supportPhone || '9810937700'}`)}
`

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
      'One Step Away from a Stress-Free Event ✨',
      `
      ${h1('One Step Away from a Stress-Free Event ✨')}
      ${p('Thank you for choosing Elewen. Your booking has been received and is awaiting advance payment.')}
      ${divider()}
      ${infoTable(`
        ${infoRow('Event Date', new Date(eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }))}
        ${infoRow('Guests', guestCount)}
        ${infoRow('Total', `₹${(Number(totalPrice) || totalPrice.toNumber?.()).toLocaleString('en-IN')}`)}
        ${infoRow('Advance Due', `₹${(Number(advanceAmount) || advanceAmount.toNumber?.()).toLocaleString('en-IN')}`)}
      `)}
      ${divider()}
      ${p('To confirm your booking, please complete the advance payment.')}
      ${ctaBtn('Pay Advance & Confirm', customerBookingDetailsUrl(bookingId))}
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
      ${ctaBtn('View Booking', customerBookingDetailsUrl(bookingId))}
    `
    ),

  booking_info_collection: ({
    bookingId,
    eventDate,
    guestCount,
    totalPrice,
    advanceDue,
    amountPaid,
    remainingDue,
    formUrl,
    paymentUrl,
  }) => {
    const advanceLeft = Number(advanceDue) || 0
    const remainingLeft = Number(remainingDue) || 0
    const paid = Number(amountPaid) || 0
    const advanceDueLabel = `₹${advanceLeft.toLocaleString('en-IN')}`
    const remainingLabel = `₹${remainingLeft.toLocaleString('en-IN')}`
    const amountPaidLabel = `₹${paid.toLocaleString('en-IN')}`
    const eventDateLabel =
      eventDate instanceof Date || (typeof eventDate === 'string' && eventDate)
        ? new Date(eventDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        : String(eventDate ?? 'To be confirmed')

    const paymentSection =
      advanceLeft > 0
        ? `${p('<strong style="color:#ffffff;">Step 2:</strong> Pay the advance (typically 30%) to confirm planning can begin.')}
           ${ctaBtn('Pay Advance', paymentUrl || customerBookingDetailsUrl(bookingId))}`
        : remainingLeft > 0
          ? `${p('<strong style="color:#ffffff;">Step 2:</strong> Your advance is paid. Remaining balance is still pending — please pay the remaining amount.')}
             ${infoTable(`${infoRow('Remaining Due', remainingLabel)}`)}
             ${ctaBtn('Pay Remaining Amount', paymentUrl || customerBookingDetailsUrl(bookingId))}`
          : `${p('<strong style="color:#ffffff;">Payment:</strong> Fully paid. Remaining due is ₹0.')}`

    const headline =
      advanceLeft > 0
        ? 'Almost there — a few details & your advance'
        : remainingLeft > 0
          ? 'Almost there — details & remaining payment'
          : 'Almost there — a few event details'

    const intro =
      advanceLeft > 0
        ? 'Your booking is in Information Collection. Please fill the event form first, then complete the advance payment.'
        : remainingLeft > 0
          ? 'Your booking is in Information Collection. Advance is already paid — fill the event form, then complete the remaining balance.'
          : 'Your booking is in Information Collection. Please fill the event form. Your payment is already complete.'

    const amountRows =
      advanceLeft > 0
        ? `${infoRow('Amount Paid', amountPaidLabel)}
        ${infoRow('Advance Due', advanceDueLabel)}
        ${infoRow('Remaining Due', remainingLabel)}`
        : `${infoRow('Amount Paid', amountPaidLabel)}
        ${infoRow('Remaining Due', remainingLabel)}`

    return layout(
      'Information Collection — Elewen',
      `
      ${h1(headline)}
      ${p(intro)}
      ${divider()}
      ${infoTable(`
        ${infoRow('Event Date', eventDateLabel)}
        ${infoRow('Guests', guestCount ?? '—')}
        ${infoRow('Total', `₹${Number(totalPrice || 0).toLocaleString('en-IN')}`)}
        ${amountRows}
      `)}
      ${divider()}
      ${p('<strong style="color:#ffffff;">Step 1:</strong> Fill your event information form.')}
      ${ctaBtn('Fill Information Form', formUrl || customerInfoCollectionUrl(bookingId))}
      ${paymentSection}
    `
    )
  },

  booking_final_payment: ({
    bookingId,
    eventDate,
    guestCount,
    totalPrice,
    amountPaid,
    remainingDue,
    paymentUrl,
  }) => {
    const due = Number(remainingDue) || 0
    const paid = Number(amountPaid) || 0
    const remainingLabel = `₹${due.toLocaleString('en-IN')}`
    const amountPaidLabel = `₹${paid.toLocaleString('en-IN')}`
    const eventDateLabel =
      eventDate instanceof Date || (typeof eventDate === 'string' && eventDate)
        ? new Date(eventDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        : String(eventDate ?? 'To be confirmed')

    return layout(
      'Final Payment — Elewen',
      `
      ${h1('Time for your final payment')}
      ${p('Your event is approaching. Please complete any remaining balance before the event begins so our team can proceed smoothly.')}
      ${divider()}
      ${infoTable(`
        ${infoRow('Event Date', eventDateLabel)}
        ${infoRow('Guests', guestCount ?? '—')}
        ${infoRow('Total', `₹${Number(totalPrice || 0).toLocaleString('en-IN')}`)}
        ${infoRow('Amount Paid', amountPaidLabel)}
        ${infoRow('Remaining Due', remainingLabel)}
      `)}
      ${divider()}
      ${
        due > 0
          ? `${p('Please complete your final payment using the button below.')}
             ${ctaBtn('Pay Final Amount', paymentUrl || customerBookingDetailsUrl(bookingId))}`
          : `${p('Good news — your payment is already complete. Remaining due is ₹0.')}
             ${ctaBtn('View Booking', paymentUrl || customerBookingDetailsUrl(bookingId))}`
      }
    `
    )
  },

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
      ${ctaBtn('View Booking', customerBookingDetailsUrl(bookingId))}
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
      ${ctaBtn('View Booking', customerBookingDetailsUrl(bookingId))}
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
      ${ctaBtn('Retry Payment', customerBookingDetailsUrl(bookingId))}
    `
    ),

  refund_requested: ({ bookingId, amount, reason }) =>
    layout(
      'Refund Requested — Elewen',
      `
      <div style="margin-bottom:20px;">${badge('Refund Requested', '#f59e0b')}</div>
      ${h1('Refund request received')}
      ${p('We have recorded your refund request. Our team will review and process it shortly.')}
      ${divider()}
      ${infoTable(`
        ${infoRow('Booking ID', `#${String(bookingId).slice(0, 8).toUpperCase()}`)}
        ${infoRow('Refund Amount', `₹${Number(amount || 0).toLocaleString('en-IN')}`)}
        ${reason ? infoRow('Reason', reason) : ''}
      `)}
      ${ctaBtn('View Booking', customerBookingDetailsUrl(bookingId))}
    `
    ),

  refund_requested_admin: ({ bookingId, amount, reason, customerEmail }) =>
    layout(
      'Admin — Refund Requested',
      `
      <div style="margin-bottom:20px;">${badge('Action Needed', '#f59e0b')}</div>
      ${h1('New refund request')}
      ${p('A customer refund request needs review in the admin panel.')}
      ${divider()}
      ${infoTable(`
        ${infoRow('Booking ID', `#${String(bookingId).slice(0, 8).toUpperCase()}`)}
        ${infoRow('Refund Amount', `₹${Number(amount || 0).toLocaleString('en-IN')}`)}
        ${customerEmail ? infoRow('Customer', customerEmail) : ''}
        ${reason ? infoRow('Reason', reason) : ''}
      `)}
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
        ${infoRow('Booking ID', `#${String(bookingId).slice(0, 8).toUpperCase()}`)}
        ${infoRow('Refund Amount', `₹${Number(amount).toLocaleString('en-IN')}`)}
      `)}
      ${ctaBtn('View Booking', customerBookingDetailsUrl(bookingId))}
    `
    ),

  refund_processed_admin: ({ bookingId, amount, customerEmail }) =>
    layout(
      'Admin — Refund Processed',
      `
      <div style="margin-bottom:20px;">${badge('Refund Processed', '#3b82f6')}</div>
      ${h1(`₹${Number(amount).toLocaleString('en-IN')} refund initiated`)}
      ${p('A refund has been approved and sent to Cashfree for processing.')}
      ${divider()}
      ${infoTable(`
        ${infoRow('Booking ID', `#${String(bookingId).slice(0, 8).toUpperCase()}`)}
        ${infoRow('Refund Amount', `₹${Number(amount).toLocaleString('en-IN')}`)}
        ${customerEmail ? infoRow('Customer', customerEmail) : ''}
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
      ${ctaBtn('View My Coupons', customerProfileCouponsUrl())}
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

  // ─── Lifecycle emails (admin confirm / personalization / T-2 / post-event) ───

  booking_hookah_placed: ({
    packageBooked,
    eventDate,
    venueName,
    totalAmount,
    supportPhone,
    bookingUrl,
  }) =>
    layout(
      "It's Official! Your Celebration Just Got an Upgrade.",
      hookahConfirmationBody({
        packageBooked,
        eventDate,
        venueName,
        totalAmount,
        supportPhone,
        bookingUrl,
      })
    ),

  booking_hookah_confirmed_lifecycle: ({
    packageBooked,
    eventDate,
    venueName,
    totalAmount,
    supportPhone,
    bookingUrl,
  }) =>
    layout(
      "It's Official! Your Celebration Just Got an Upgrade.",
      `
      <div style="margin-bottom:20px;">${badge('Booking Confirmed', '#22c55e')}</div>
      ${hookahConfirmationBody({
        packageBooked,
        eventDate,
        venueName,
        totalAmount,
        supportPhone,
        bookingUrl,
      })}
    `
    ),

  booking_confirmed_lifecycle: ({
    bookingIdShort,
    eventType,
    eventDate,
    eventTime,
    venueName,
    servicesBooked,
    packageBooked,
    totalAmount,
    amountPaid,
    remainingBalance,
    isCodBooking,
    isFullyPaid,
    updateDetailsUrl,
    supportPhone,
  }) =>
    layout(
      "You're all set! Here's what happens next",
      `
      <div style="margin-bottom:20px;">${badge('Booking Confirmed', '#22c55e')}</div>
      ${h1('Booking Confirmed ✅')}
      ${p("Your booking with Elewen has been successfully confirmed, and we're excited to be a part of your celebration! Here's everything you need to know.")}
      ${divider()}
      ${p('<strong style="color:#fff;">📋 Your Booking</strong>')}
      ${infoTable(`
        ${infoRow('Booking ID', bookingIdShort)}
        ${infoRow('Event', eventType)}
        ${infoRow('Event Date', eventDate)}
        ${infoRow('Event Time', eventTime)}
        ${infoRow('Venue', venueName)}
        ${infoRow('Services Booked', servicesBooked)}
        ${infoRow('Package Booked', packageBooked)}
      `)}
      ${divider()}
      ${p('<strong style="color:#fff;">💳 Payment Summary</strong>')}
      ${infoTable(`
        ${infoRow('Total Booking Amount', totalAmount)}
        ${infoRow(
          'Amount Paid',
          isCodBooking
            ? `${amountPaid} (Pay on delivery — no advance required)`
            : isFullyPaid
              ? `${amountPaid} (Full payment received)`
              : `${amountPaid} (typically 30% advance)`
        )}
        ${infoRow(
          'Remaining Balance',
          isFullyPaid
            ? `${remainingBalance}`
            : isCodBooking
              ? `${remainingBalance} (due on delivery)`
              : `${remainingBalance} (typically 70% before the event)`
        )}
      `)}
      ${divider()}
      ${p('<strong style="color:#fff;">📝 Action Required (IMPORTANT)</strong>')}
      ${p('To help our team prepare for your event, please make sure the following details are updated in your booking (if you haven\'t already):')}
      ${ctaBtn('Update Event Details', updateDetailsUrl)}
      ${divider()}
      ${p('<strong style="color:#fff;">What Happens Next?</strong>')}
      ${p("We've got things covered from here.")}
      ${p('✔ Your booking has been confirmed.<br/>✔ Our team will send you options to customize text or the colour palette (if applicable).<br/>✔ We\'ll send you one final update 2 days before your event with delivery status, final logistical details, and a remaining payment reminder (if applicable).')}
      ${divider()}
      ${p('<strong style="color:#fff;">A Few Things to Keep in Mind</strong>')}
      ${p('Outstanding/remaining payments must be completed before your event begins. If your event details change (date, venue, timings or guest count), contact us as soon as possible. Any booking changes or additional service requests are subject to availability and may result in revised pricing.')}
      ${divider()}
      ${p('Thank you for choosing Elewen. We\'re looking forward to helping you create a memorable event. ✨')}
      ${p(`Team Elewen<br/>${supportPhone || '9810937700'}`)}
    `
    ),

  booking_personalization: ({
    serviceName,
    designImage1,
    designImage2,
    designImage3,
    responseDeadline,
    personalizeUrl,
    supportPhone,
    headline,
    introText,
    customMessage,
    chooseHeading,
    chooseSubtext,
    optionLabel1,
    optionLabel2,
    optionLabel3,
    replyPrompt,
    ctaLabel,
    textSectionHeading,
    textSectionBody,
    textExamples,
    anythingElseHeading,
    anythingElseBody,
    deadlineText,
    noReplyText,
    signOff,
  }) => {
    const escapeHtml = value =>
      String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
    const plainToHtml = value => escapeHtml(value).replace(/\r\n|\r|\n/g, '<br/>')

    const safeService = escapeHtml(serviceName || 'service')
    const title = headline?.trim()
      ? plainToHtml(headline.trim())
      : "Let's personalise your booking ✨"
    const intro = introText?.trim()
      ? plainToHtml(introText.trim())
      : `We're getting everything ready for your event, and it's now time to customise your <strong style="color:#fff;">${safeService}</strong>.`
    const note = customMessage?.trim()
      ? `
      <div style="margin:16px 0;padding:16px;background:#222;border-radius:8px;border-left:3px solid #c9a96e;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#c9a96e;">Note from your planner</p>
        <p style="margin:0;font-size:15px;line-height:1.6;color:#cccccc;">${plainToHtml(customMessage.trim())}</p>
      </div>`
      : ''

    // Only render options that have an image — never show empty "shared by planner" placeholders.
    const designOptions = [
      { label: optionLabel1?.trim() || 'Design Option 1', url: String(designImage1 || '').trim() },
      { label: optionLabel2?.trim() || 'Design Option 2', url: String(designImage2 || '').trim() },
      { label: optionLabel3?.trim() || 'Design Option 3', url: String(designImage3 || '').trim() },
    ].filter(option => option.url)

    const designBlock = (label, url) => `
      <div style="margin:16px 0;padding:16px;background:#222;border-radius:8px;">
        <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#c9a96e;">${escapeHtml(label)}</p>
        <img src="${escapeHtml(url)}" alt="${escapeHtml(label)}" style="display:block;width:100%;max-width:520px;border-radius:8px;border:1px solid #333;" />
      </div>`

    const defaultReplyPrompt =
      designOptions.length <= 1
        ? '👉 Simply reply with Option 1 — or open your booking to share details.'
        : designOptions.length === 2
          ? '👉 Simply reply with Option 1 or 2 — or open your booking to share details.'
          : '👉 Simply reply with Option 1, 2 or 3 — or open your booking to share details.'

    const defaultChooseSubtext =
      designOptions.length <= 1
        ? "We've shortlisted an option based on your booking."
        : "We've shortlisted a few options based on your booking."

    const chooseTitle = chooseHeading?.trim()
      ? plainToHtml(chooseHeading.trim())
      : 'Please choose your preferred design'
    const chooseBody = chooseSubtext?.trim()
      ? plainToHtml(chooseSubtext.trim())
      : defaultChooseSubtext
    const replyBody = replyPrompt?.trim() ? plainToHtml(replyPrompt.trim()) : defaultReplyPrompt
    const buttonLabel = ctaLabel?.trim() || 'Open My Booking'
    const textHeading = textSectionHeading?.trim()
      ? plainToHtml(textSectionHeading.trim())
      : 'What would you like it to say?'
    const textBody = textSectionBody?.trim()
      ? plainToHtml(textSectionBody.trim())
      : "Please share the exact text you'd like us to use. For example:"
    const examples = textExamples?.trim()
      ? plainToHtml(textExamples.trim())
      : "Welcome to Aarav's First Birthday<br/>Happy 25th Anniversary<br/>Congratulations, Riya &amp; Arjun"
    const elseHeading = anythingElseHeading?.trim()
      ? plainToHtml(anythingElseHeading.trim())
      : "Anything else you'd like us to know?"
    const elseBody = anythingElseBody?.trim()
      ? plainToHtml(anythingElseBody.trim())
      : 'If you have any special requests or instructions, you can add them while submitting your selections. We will review your request and check its feasibility.'
    const deadlineBody = deadlineText?.trim()
      ? plainToHtml(deadlineText.trim()).replace(
          /\{\{deadline\}\}/g,
          `<strong style="color:#fff;">${escapeHtml(responseDeadline || 'the shared deadline')}</strong>`
        )
      : `Please send us your selections by <strong style="color:#fff;">${escapeHtml(responseDeadline || 'the shared deadline')}</strong> so our team has enough time to prepare everything for your event.`
    const noReplyBody = noReplyText?.trim()
      ? plainToHtml(noReplyText.trim())
      : "If we don't hear back by then, we'll proceed with the default option discussed during your booking."
    const signOffBody = signOff?.trim()
      ? plainToHtml(signOff.trim())
      : `Team Elewen<br/>${escapeHtml(supportPhone || '9810937700')}`

    return layout(
      "Let's personalise your booking with Elewen",
      `
      ${h1(title)}
      ${p(intro)}
      ${note}
      ${divider()}
      ${p(`<strong style="color:#fff;">${chooseTitle}</strong>`)}
      ${p(chooseBody)}
      ${designOptions.map(option => designBlock(option.label, option.url)).join('')}
      ${p(replyBody)}
      ${ctaBtn(buttonLabel, personalizeUrl)}
      ${divider()}
      ${p(`<strong style="color:#fff;">${textHeading}</strong>`)}
      ${p(textBody)}
      ${p(examples)}
      ${divider()}
      ${p(`<strong style="color:#fff;">${elseHeading}</strong>`)}
      ${p(elseBody)}
      ${divider()}
      ${p(deadlineBody)}
      ${p(noReplyBody)}
      ${p(signOffBody)}
    `
    )
  },

  booking_pre_event_2day: ({
    remainingBalanceRaw,
    remainingBalance,
    paymentUrl,
    supportPhone,
  }) =>
    layout(
      'Just 2 days to go!',
      `
      ${h1('Your event is almost here! 🎉')}
      ${p('Just a quick update from the Elewen team — everything is on track for your upcoming event.')}
      ${divider()}
      ${p('<strong style="color:#fff;">Status Update</strong>')}
      ${p('✅ All booked services have been confirmed<br/>✅ Our team will reach on the discussed time<br/>✅ Your dedicated planner from team Elewen will coordinate everything with you.')}
      ${divider()}
      ${p('<strong style="color:#fff;">Remaining Payment</strong>')}
      ${
        Number(remainingBalanceRaw) > 0
          ? `${p(`If your balance payment is still pending (${remainingBalance}), please keep it ready. As per our payment policy, the remaining amount will be collected before the event begins.`)}${ctaBtn('Complete Payment', paymentUrl)}`
          : p('Your payment is complete — no remaining balance due. Thank you!')
      }
      ${divider()}
      ${p('<strong style="color:#fff;">🤝 Our Promise to You</strong>')}
      ${p('Your experience matters to us. While we work closely with our vendors to ensure everything goes smoothly, if you face any concerns during the event, please let us know as soon as possible. Share a few photos of the issue with our support team so we can assess it quickly and work towards the best possible resolution.')}
      ${p("We're committed to making things right wherever we can, because your trust means everything to us.")}
      ${divider()}
      ${p('<strong style="color:#fff;">Final Checklist</strong>')}
      ${p('Before the big day, please ensure:<br/>✓ Venue access is available for setup<br/>✓ Your event-day contact person is available on call<br/>✓ Parking/loading instructions (if any) have been shared<br/>✓ Need us during the event? We are just a call / WhatsApp message away')}
      ${divider()}
      ${p("We're excited to be a part of your celebration and can't wait to help make it a memorable one.")}
      ${p('See you in 2 days!')}
      ${p(`Team Elewen<br/>${supportPhone || '9810937700'}`)}
    `
    ),

  booking_post_event_feedback: ({ couponValue, feedbackUrl, supportPhone }) =>
    layout(
      'Tell us how we did & enjoy a little thank-you!',
      `
      ${h1('Thank you for celebrating with Elewen! ✨')}
      ${p('We hope your event was everything you envisioned and more. It was a pleasure being a part of your special day, and we truly appreciate you choosing Elewen.')}
      ${divider()}
      ${p('<strong style="color:#fff;">A Little Something for You 🎁</strong>')}
      ${p("Let's be honest... filling out feedback forms isn't exactly everyone's favourite thing. 😄")}
      ${p(`So here's a little thank-you from us! Once you submit your feedback, you'll receive an exclusive <strong style="color:#fff;">${couponValue}</strong> Elewen Gift Coupon.`)}
      ${p('You can:<br/>🎉 Save it for your next Elewen booking, or<br/>🎁 Gift it to a friend or family member planning an event.')}
      ${p('Valid for 2 months from the date of issue. It\'s our way of saying thanks for helping us get better. ❤️')}
      ${divider()}
      ${p('<strong style="color:#fff;">We\'d Love Your Feedback 💛</strong>')}
      ${p('Your feedback helps us improve and helps future customers book with confidence. It\'ll only take a minute, we promise. 😊')}
      ${ctaBtn('⭐ Leave Your Feedback', feedbackUrl)}
      ${divider()}
      ${p(`— Team Elewen<br/>${supportPhone || '9810937700'}`)}
      ${p('<em style="color:#888;">"Here\'s to planning differently"</em>')}
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

/** Admin inboxes from ADMIN_EMAILS (comma-separated) and SUPPORT_EMAIL. */
export function getAdminNotificationEmails() {
  const emails = new Set()
  String(process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean)
    .forEach(email => emails.add(email))

  const support = String(process.env.SUPPORT_EMAIL || SUPPORT_EMAIL || '')
    .trim()
    .toLowerCase()
  if (support) emails.add(support)

  return [...emails]
}

export async function sendAdminEmails(subject, html) {
  const recipients = getAdminNotificationEmails()
  if (!recipients.length) {
    console.warn('[email] No ADMIN_EMAILS/SUPPORT_EMAIL configured — skipping admin email')
    return { sent: false, reason: 'no_admin_emails' }
  }

  await Promise.all(recipients.map(to => sendEmail(to, subject, html)))
  return { sent: true, recipients }
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
