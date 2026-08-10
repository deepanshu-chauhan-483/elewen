import { Router } from 'express'
import { requireAdminAccess } from '../middleware/adminAccess.js'
import {
  addAdminBookingNote,
  addAdminSupportMessage,
  createAdminCoupon,
  deleteAdminCoupon,
  shareAdminCoupon,
  getAdminBooking,
  getAdminMessageThread,
  getAdminOverview,
  getAdminPaymentWorkspace,
  getAdminPaymentSummary,
  getAdminSession,
  getAdminSettings,
  getAdminSupportTicket,
  getAdminVendorWorkspace,
  listAdminAlerts,
  listAdminBookings,
  listAdminConsultations,
  listAdminCoupons,
  listAdminMessageThreads,
  listAdminPayments,
  listAdminRefunds,
  listAdminSampleTastes,
  listAdminSupportTickets,
  listAdminVendorAssignments,
  listAdminVendorPayouts,
  listAdminVendors,
  recordAdminSampleTasteDecision,
  sendAdminMessage,
  updateAdminAlert,
  updateAdminBookingStatus,
  collectAdminBookingCod,
  recordAdminManualPayment,
  previewAdminBookingPersonalizationEmail,
  sendAdminBookingPersonalizationEmail,
  uploadAdminDesignImage,
  updateAdminConsultation,
  updateAdminCoupon,
  updateAdminSampleTasteStatus,
  updateAdminSettings,
  updateAdminSupportTicket,
  updateAdminVendor,
} from '../controllers/admin.js'
import {
  getAdminBookingCouponSuggestion,
  getMyCoupons,
  sendAdminReferralCoupon,
} from '../controllers/couponGrants.js'
import {
  createAssignment,
  deleteAssignment,
  reassignAssignment,
  updateAssignment,
} from '../controllers/vendorAssignment.js'
import { createVendorPayout, processRefund, updateVendorPayout } from '../controllers/payment.js'

const router = Router()

router.use(requireAdminAccess)

router.get('/session', getAdminSession)
router.get('/overview', getAdminOverview)

router.get('/bookings', listAdminBookings)
router.get('/bookings/:id', getAdminBooking)
router.get('/bookings/:id/coupon-suggestion', getAdminBookingCouponSuggestion)
router.post('/bookings/:id/send-referral-coupon', sendAdminReferralCoupon)
router.patch('/bookings/:id/status', updateAdminBookingStatus)
router.post('/bookings/:id/cod/collect', collectAdminBookingCod)
router.post('/bookings/:id/payments/manual', recordAdminManualPayment)
router.post('/upload-image', uploadAdminDesignImage)
router.post('/bookings/:id/preview-personalization-email', previewAdminBookingPersonalizationEmail)
router.post('/bookings/:id/send-personalization-email', sendAdminBookingPersonalizationEmail)
router.post('/bookings/:id/notes', addAdminBookingNote)

router.get('/sample-taste', listAdminSampleTastes)
router.patch('/sample-taste/:id/status', updateAdminSampleTasteStatus)
router.post('/sample-taste/:id/decision', recordAdminSampleTasteDecision)

router.get('/vendors', listAdminVendors)
router.get('/vendors/workspace', getAdminVendorWorkspace)
router.patch('/vendors/:id', updateAdminVendor)

router.get('/vendor-assignments', listAdminVendorAssignments)
router.post('/vendor-assignments', createAssignment)
router.post('/vendor-assignments/:id/reassign', reassignAssignment)
router.patch('/vendor-assignments/:id', updateAssignment)
router.delete('/vendor-assignments/:id', deleteAssignment)

router.get('/messages/threads', listAdminMessageThreads)
router.get('/messages/threads/:bookingId', getAdminMessageThread)
router.post('/messages', sendAdminMessage)

router.get('/payments/summary', getAdminPaymentSummary)
router.get('/payments/workspace', getAdminPaymentWorkspace)
router.get('/payments', listAdminPayments)

router.get('/refunds', listAdminRefunds)
router.patch('/refunds/:id', processRefund)

router.get('/vendor-payouts', listAdminVendorPayouts)
router.post('/vendor-payouts', createVendorPayout)
router.patch('/vendor-payouts/:id', updateVendorPayout)

router.get('/coupons', listAdminCoupons)
router.post('/coupons', createAdminCoupon)
router.post('/coupons/:id/share', shareAdminCoupon)
router.patch('/coupons/:id', updateAdminCoupon)
router.delete('/coupons/:id', deleteAdminCoupon)

router.get('/settings', getAdminSettings)
router.patch('/settings', updateAdminSettings)

router.get('/support', listAdminSupportTickets)
router.get('/support/:id', getAdminSupportTicket)
router.patch('/support/:id', updateAdminSupportTicket)
router.post('/support/:id/messages', addAdminSupportMessage)

router.get('/consultations', listAdminConsultations)
router.patch('/consultations/:id', updateAdminConsultation)

router.get('/alerts', listAdminAlerts)
router.patch('/alerts/:id', updateAdminAlert)

export default router
