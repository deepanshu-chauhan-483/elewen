import { useEffect, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  adminAddBookingNote,
  adminCollectBookingCod,
  adminRecordBookingPayment,
  adminAddSupportMessage,
  adminAlerts,
  adminBooking,
  adminBookingCouponSuggestion,
  adminSendReferralCoupon,
  adminSendPersonalizationEmail,
  adminPreviewPersonalizationEmail,
  adminUploadDesignImage,
  adminBookings,
  adminConsultations,
  adminCoupons,
  adminCreateCoupon,
  adminCreateVendorAssignment,
  adminCreateVendorPayout,
  adminMessageThread,
  adminMessageThreads,
  adminOverview,
  adminPaymentWorkspace,
  adminPaymentSummary,
  adminPayments,
  adminReassignVendorAssignment,
  adminProcessRefund,
  adminRecordSampleTasteDecision,
  adminRefunds,
  adminSampleTastes,
  adminSendMessage,
  adminSession,
  adminSettings,
  adminSupportTicket,
  adminSupportTickets,
  adminUpdateAlert,
  adminUpdateBookingStatus,
  adminUpdateConsultation,
  adminDeleteCoupon,
  adminShareCoupon,
  adminUpdateCoupon,
  adminUpdateSampleTasteStatus,
  adminUpdateSettings,
  adminUpdateSupportTicket,
  adminUpdateVendor,
  adminUpdateVendorAssignment,
  adminVendorAssignments,
  adminVendorPayouts,
  adminVendorWorkspace,
  adminVendors,
  adminUpdateVendorPayout,
  authLogin,
  authLogout,
  clearStoredAdminJwt,
  getStoredAdminJwt,
  getValidStoredAdminJwt,
  setStoredAdminJwt,
} from '../lib/api'

function createAuthRequiredError(message = 'AUTH_REQUIRED') {
  const error = new Error(message)
  error.code = 'AUTH_REQUIRED'
  return error
}

function useAdminToken() {
  const [token, setToken] = useState(() => getStoredAdminJwt())

  useEffect(() => {
    const sync = () => setToken(getStoredAdminJwt())
    window.addEventListener('elewen-admin-auth-change', sync)
    window.addEventListener('storage', sync)

    return () => {
      window.removeEventListener('elewen-admin-auth-change', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  useEffect(() => {
    let active = true

    getValidStoredAdminJwt().then(nextToken => {
      if (!active) return
      if (nextToken !== token) setToken(nextToken)
    })

    return () => {
      active = false
    }
  }, [token])

  return token
}

async function withAdminToken(task) {
  const token = await getValidStoredAdminJwt()
  if (!token) throw createAuthRequiredError()
  return task(token)
}

function useAuthedAdminQuery({ queryKey, queryFn, enabled = true, staleTime = 30 * 1000 }) {
  const token = useAdminToken()

  return useQuery({
    queryKey: [...queryKey, token || 'guest'],
    enabled: enabled && Boolean(token),
    retry: false,
    staleTime,
    placeholderData: keepPreviousData,
    queryFn: () => withAdminToken(queryFn),
  })
}

export function useAdminLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async body => {
      const response = await authLogin(body)
      if (!response?.jwt) {
        throw new Error('Login did not return a JWT')
      }

      setStoredAdminJwt(response.jwt)
      return withAdminToken(token => adminSession(token))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] })
    },
    onError: () => {
      clearStoredAdminJwt()
    },
  })
}

export function useAdminLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      try {
        await authLogout()
      } finally {
        clearStoredAdminJwt()
      }
    },
    onSuccess: () => {
      queryClient.clear()
    },
  })
}

export function useAdminSession() {
  return useAuthedAdminQuery({
    queryKey: ['admin', 'session'],
    staleTime: 2 * 60 * 1000,
    queryFn: token => adminSession(token).then(response => response?.session ?? null),
  })
}

export function useAdminOverview() {
  return useAuthedAdminQuery({
    queryKey: ['admin', 'overview'],
    queryFn: token => adminOverview(token).then(response => response?.overview ?? null),
  })
}

export function useAdminBookings(params = {}) {
  return useAuthedAdminQuery({
    queryKey: ['admin', 'bookings', JSON.stringify(params)],
    queryFn: token => adminBookings(token, params),
  })
}

export function useAdminBooking(bookingId) {
  return useAuthedAdminQuery({
    queryKey: ['admin', 'booking', bookingId],
    enabled: Boolean(bookingId),
    queryFn: token => adminBooking(token, bookingId).then(response => response?.booking ?? null),
  })
}

export function useAdminBookingCouponSuggestion(bookingId, enabled = true) {
  return useAuthedAdminQuery({
    queryKey: ['admin', 'booking', bookingId, 'coupon-suggestion'],
    enabled: Boolean(bookingId) && enabled,
    queryFn: token =>
      adminBookingCouponSuggestion(token, bookingId).then(response => response ?? null),
  })
}

export function useAdminSendReferralCoupon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ bookingId, body }) =>
      withAdminToken(token => adminSendReferralCoupon(token, bookingId, body)),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'booking', variables?.bookingId] })
      queryClient.invalidateQueries({
        queryKey: ['admin', 'booking', variables?.bookingId, 'coupon-suggestion'],
      })
    },
  })
}

export function useAdminPreviewPersonalizationEmail() {
  return useMutation({
    mutationFn: ({ bookingId, body }) =>
      withAdminToken(token => adminPreviewPersonalizationEmail(token, bookingId, body)),
  })
}

export function useAdminUploadDesignImage() {
  return useMutation({
    mutationFn: body => withAdminToken(token => adminUploadDesignImage(token, body)),
  })
}

export function useAdminSendPersonalizationEmail() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ bookingId, body }) =>
      withAdminToken(token => adminSendPersonalizationEmail(token, bookingId, body)),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'booking', variables?.bookingId] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] })
    },
  })
}

export function useAdminUpdateBookingStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ bookingId, body }) =>
      withAdminToken(token => adminUpdateBookingStatus(token, bookingId, body)),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'booking', variables?.bookingId] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'refunds'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'payment-summary'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments', 'workspace'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'payment-workspace'] })
    },
  })
}

export function useAdminAddBookingNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ bookingId, body }) =>
      withAdminToken(token => adminAddBookingNote(token, bookingId, body)),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'booking', variables?.bookingId] })
    },
  })
}

export function useAdminCollectBookingCod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ bookingId }) =>
      withAdminToken(token => adminCollectBookingCod(token, bookingId)),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'booking', variables?.bookingId] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'payment-workspace'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
    },
  })
}

export function useAdminRecordBookingPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ bookingId, body }) =>
      withAdminToken(token => adminRecordBookingPayment(token, bookingId, body)),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'booking', variables?.bookingId] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments', 'workspace'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'payment-workspace'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'payment-summary'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
    },
  })
}

export function useAdminSampleTastes(params = {}) {
  return useAuthedAdminQuery({
    queryKey: ['admin', 'sample-taste', JSON.stringify(params)],
    queryFn: token => adminSampleTastes(token, params),
  })
}

export function useAdminUpdateSampleTasteStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sampleId, body }) =>
      withAdminToken(token => adminUpdateSampleTasteStatus(token, sampleId, body)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sample-taste'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
    },
  })
}

export function useAdminRecordSampleTasteDecision() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sampleId, body }) =>
      withAdminToken(token => adminRecordSampleTasteDecision(token, sampleId, body)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sample-taste'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
    },
  })
}

export function useAdminVendors(params = {}) {
  return useAuthedAdminQuery({
    queryKey: ['admin', 'vendors', JSON.stringify(params)],
    queryFn: token => adminVendors(token, params),
  })
}

export function useAdminUpdateVendor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ vendorId, body }) =>
      withAdminToken(token => adminUpdateVendor(token, vendorId, body)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vendors'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'vendors', 'workspace'] })
    },
  })
}

export function useAdminVendorWorkspace(params = {}) {
  return useAuthedAdminQuery({
    queryKey: ['admin', 'vendors', 'workspace', JSON.stringify(params)],
    queryFn: token =>
      adminVendorWorkspace(token, params).then(response => response?.workspace ?? null),
  })
}

export function useAdminVendorAssignments(params = {}) {
  const { enabled = true, ...queryParams } = params

  return useAuthedAdminQuery({
    queryKey: ['admin', 'vendor-assignments', JSON.stringify(queryParams)],
    enabled,
    queryFn: token => adminVendorAssignments(token, queryParams),
  })
}

export function useAdminCreateVendorAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: body => withAdminToken(token => adminCreateVendorAssignment(token, body)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vendor-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'booking'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'vendors'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'vendors', 'workspace'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments', 'workspace'] })
    },
  })
}

export function useAdminReassignVendorAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ assignmentId, body }) =>
      withAdminToken(token => adminReassignVendorAssignment(token, assignmentId, body)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vendor-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'booking'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'vendors'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'vendors', 'workspace'] })
    },
  })
}

export function useAdminUpdateVendorAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ assignmentId, body }) =>
      withAdminToken(token => adminUpdateVendorAssignment(token, assignmentId, body)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vendor-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'vendors'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'vendors', 'workspace'] })
    },
  })
}

export function useAdminMessageThreads(params = {}) {
  return useAuthedAdminQuery({
    queryKey: ['admin', 'message-threads', JSON.stringify(params)],
    queryFn: token => adminMessageThreads(token, params),
  })
}

export function useAdminMessageThread(bookingId) {
  return useAuthedAdminQuery({
    queryKey: ['admin', 'message-thread', bookingId],
    enabled: Boolean(bookingId),
    queryFn: token =>
      adminMessageThread(token, bookingId).then(response => response?.thread ?? null),
  })
}

export function useAdminSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: body => withAdminToken(token => adminSendMessage(token, body)),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'message-threads'] })
      queryClient.invalidateQueries({
        queryKey: ['admin', 'message-thread', variables?.bookingId],
      })
    },
  })
}

export function useAdminPaymentSummary() {
  return useAuthedAdminQuery({
    queryKey: ['admin', 'payment-summary'],
    queryFn: token => adminPaymentSummary(token).then(response => response?.summary ?? null),
  })
}

export function useAdminPaymentWorkspace(params = {}) {
  return useAuthedAdminQuery({
    queryKey: ['admin', 'payments', 'workspace', JSON.stringify(params)],
    queryFn: token =>
      adminPaymentWorkspace(token, params).then(response => response?.workspace ?? null),
  })
}

export function useAdminPayments(params = {}) {
  return useAuthedAdminQuery({
    queryKey: ['admin', 'payments', JSON.stringify(params)],
    queryFn: token => adminPayments(token, params),
  })
}

export function useAdminRefunds(params = {}) {
  return useAuthedAdminQuery({
    queryKey: ['admin', 'refunds', JSON.stringify(params)],
    queryFn: token => adminRefunds(token, params),
  })
}

export function useAdminProcessRefund() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ refundId, body }) =>
      withAdminToken(token => adminProcessRefund(token, refundId, body)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'refunds'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'payment-summary'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments', 'workspace'] })
    },
  })
}

export function useAdminVendorPayouts(params = {}) {
  return useAuthedAdminQuery({
    queryKey: ['admin', 'vendor-payouts', JSON.stringify(params)],
    queryFn: token => adminVendorPayouts(token, params),
  })
}

export function useAdminCreateVendorPayout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: body => withAdminToken(token => adminCreateVendorPayout(token, body)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vendor-payouts'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'payment-summary'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'vendors'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments', 'workspace'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'vendors', 'workspace'] })
    },
  })
}

export function useAdminUpdateVendorPayout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ payoutId, body }) =>
      withAdminToken(token => adminUpdateVendorPayout(token, payoutId, body)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vendor-payouts'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'payment-summary'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'vendors'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments', 'workspace'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'vendors', 'workspace'] })
    },
  })
}

export function useAdminCoupons(params = {}) {
  return useAuthedAdminQuery({
    queryKey: ['admin', 'coupons', JSON.stringify(params)],
    queryFn: token => adminCoupons(token, params),
  })
}

export function useAdminCreateCoupon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: body => withAdminToken(token => adminCreateCoupon(token, body)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments', 'workspace'] })
    },
  })
}

export function useAdminUpdateCoupon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ couponId, body }) =>
      withAdminToken(token => adminUpdateCoupon(token, couponId, body)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments', 'workspace'] })
    },
  })
}

export function useAdminDeleteCoupon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: couponId => withAdminToken(token => adminDeleteCoupon(token, couponId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments', 'workspace'] })
    },
  })
}

export function useAdminShareCoupon() {
  return useMutation({
    mutationFn: ({ couponId, email }) =>
      withAdminToken(token => adminShareCoupon(token, couponId, { email })),
  })
}

export function useAdminSettings() {
  return useAuthedAdminQuery({
    queryKey: ['admin', 'settings'],
    staleTime: 5 * 60 * 1000,
    queryFn: token => adminSettings(token).then(response => response?.settings ?? null),
  })
}

export function useAdminUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: body => withAdminToken(token => adminUpdateSettings(token, body)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'payment-summary'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments', 'workspace'] })
    },
  })
}

export function useAdminSupportTickets(params = {}) {
  return useAuthedAdminQuery({
    queryKey: ['admin', 'support-tickets', JSON.stringify(params)],
    queryFn: token => adminSupportTickets(token, params),
  })
}

export function useAdminSupportTicket(ticketId) {
  return useAuthedAdminQuery({
    queryKey: ['admin', 'support-ticket', ticketId],
    enabled: Boolean(ticketId),
    queryFn: token =>
      adminSupportTicket(token, ticketId).then(response => response?.ticket ?? null),
  })
}

export function useAdminUpdateSupportTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ticketId, body }) =>
      withAdminToken(token => adminUpdateSupportTicket(token, ticketId, body)),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'support-tickets'] })
      queryClient.invalidateQueries({
        queryKey: ['admin', 'support-ticket', variables?.ticketId],
      })
    },
  })
}

export function useAdminAddSupportMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ticketId, body }) =>
      withAdminToken(token => adminAddSupportMessage(token, ticketId, body)),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'support-tickets'] })
      queryClient.invalidateQueries({
        queryKey: ['admin', 'support-ticket', variables?.ticketId],
      })
    },
  })
}

export function useAdminAlerts(params = {}) {
  return useAuthedAdminQuery({
    queryKey: ['admin', 'alerts', JSON.stringify(params)],
    queryFn: token => adminAlerts(token, params),
  })
}

export function useAdminUpdateAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ alertId, body }) =>
      withAdminToken(token => adminUpdateAlert(token, alertId, body)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'alerts'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
    },
  })
}

export function useAdminConsultations(params = {}) {
  return useAuthedAdminQuery({
    queryKey: ['admin', 'consultations', JSON.stringify(params)],
    queryFn: token => adminConsultations(token, params),
  })
}

export function useAdminUpdateConsultation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ consultationId, body }) =>
      withAdminToken(token => adminUpdateConsultation(token, consultationId, body)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'consultations'] })
    },
  })
}
