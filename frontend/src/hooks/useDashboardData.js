import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import {
  authLogout,
  bookingCancel,
  authMe,
  authUpdateProfile,
  bookingGet,
  bookingGetTimeline,
  bookingList,
  clearStoredJwt,
  dashboardGetHelp,
  dashboardGetSummary,
  dashboardGetCoupons,
  getValidStoredJwt,
  getStoredJwt,
  messageGetOrCreateThread,
  messageGetThread,
  messageSend,
  notificationClearAll,
  notificationList,
  notificationGetUnreadCount,
  notificationMarkAllRead,
  notificationMarkRead,
  sampleTasteList,
  sampleTasteRecordDecision,
  supportCreate,
  supportGet,
  supportList,
  supportReply,
} from '../lib/api'

function createAuthRequiredError(message = 'AUTH_REQUIRED') {
  const error = new Error(message)
  error.code = 'AUTH_REQUIRED'
  return error
}

function useDashboardToken() {
  const [token, setToken] = useState(() => getStoredJwt())

  useEffect(() => {
    const syncToken = () => setToken(getStoredJwt())

    window.addEventListener('elewen-auth-change', syncToken)
    window.addEventListener('storage', syncToken)

    return () => {
      window.removeEventListener('elewen-auth-change', syncToken)
      window.removeEventListener('storage', syncToken)
    }
  }, [])

  useEffect(() => {
    let active = true

    getValidStoredJwt().then(nextToken => {
      if (!active) return
      if (nextToken !== token) {
        setToken(nextToken)
      }
    })

    return () => {
      active = false
    }
  }, [token])

  return token
}

async function withDashboardToken(task) {
  const token = await getValidStoredJwt()
  if (!token) {
    throw createAuthRequiredError()
  }

  return task(token)
}

function useAuthedDashboardQuery({ queryKey, queryFn, enabled = true, staleTime = 60 * 1000 }) {
  const token = useDashboardToken()

  return useQuery({
    queryKey: [...queryKey, token || 'guest'],
    enabled: enabled && Boolean(token),
    retry: false,
    staleTime,
    queryFn: () => withDashboardToken(queryFn),
  })
}

export function useDashboardSession() {
  return useAuthedDashboardQuery({
    queryKey: ['dashboard', 'session'],
    staleTime: 2 * 60 * 1000,
    queryFn: token => authMe(token),
  })
}

export function useDashboardSummary() {
  return useAuthedDashboardQuery({
    queryKey: ['dashboard', 'summary'],
    staleTime: 30 * 1000,
    queryFn: async token => {
      const response = await dashboardGetSummary(token)
      return response?.summary ?? {}
    },
  })
}

export function useDashboardCoupons() {
  return useAuthedDashboardQuery({
    queryKey: ['dashboard', 'coupons'],
    staleTime: 30 * 1000,
    queryFn: async token => {
      const response = await dashboardGetCoupons(token)
      return response?.coupons ?? []
    },
  })
}

export function useDashboardUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: body => withDashboardToken(token => authUpdateProfile(token, body)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'session'] })
    },
  })
}

export function useDashboardNotificationCount() {
  return useAuthedDashboardQuery({
    queryKey: ['dashboard', 'notification-count'],
    staleTime: 30 * 1000,
    queryFn: async token => {
      const response = await notificationGetUnreadCount(token)
      return Number(response?.count ?? 0)
    },
  })
}

export function useDashboardNotifications(params = {}) {
  const unreadOnly = params?.unreadOnly === true
  const limit = Number(params?.limit ?? 10)

  return useAuthedDashboardQuery({
    queryKey: ['dashboard', 'notifications', unreadOnly ? 'unread' : 'all', limit],
    staleTime: 15 * 1000,
    queryFn: async token => {
      const response = await notificationList(token, { limit, unreadOnly })
      return {
        notifications: response?.notifications ?? [],
        unreadCount: Number(response?.unreadCount ?? 0),
      }
    },
  })
}

export function useDashboardBookings(typeOrParams = 'all', params = {}) {
  const resolvedType =
    typeof typeOrParams === 'string' ? typeOrParams : String(typeOrParams?.type ?? 'all')
  const resolvedParams = typeof typeOrParams === 'string' ? params : (typeOrParams ?? {})

  return useAuthedDashboardQuery({
    queryKey: ['dashboard', 'bookings', resolvedType, JSON.stringify(resolvedParams)],
    queryFn: async token => {
      const response = await bookingList(token, { type: resolvedType, ...resolvedParams })
      return response?.bookings ?? []
    },
  })
}

export function useDashboardBooking(bookingId) {
  return useAuthedDashboardQuery({
    queryKey: ['dashboard', 'booking', bookingId],
    enabled: Boolean(bookingId),
    queryFn: async token => {
      const response = await bookingGet(token, bookingId)
      return response?.booking ?? null
    },
  })
}

export function useDashboardBookingTimeline(bookingId) {
  return useAuthedDashboardQuery({
    queryKey: ['dashboard', 'booking-timeline', bookingId],
    enabled: Boolean(bookingId),
    queryFn: async token => {
      const response = await bookingGetTimeline(token, bookingId)
      return response?.timeline ?? []
    },
  })
}

export function useDashboardSampleTastes(params = {}) {
  return useAuthedDashboardQuery({
    queryKey: ['dashboard', 'sample-tastes', JSON.stringify(params)],
    queryFn: async token => {
      const response = await sampleTasteList(token, params)
      return response?.samples ?? []
    },
  })
}

export function useDashboardHelp() {
  return useAuthedDashboardQuery({
    queryKey: ['dashboard', 'help'],
    staleTime: 5 * 60 * 1000,
    queryFn: async token => {
      const response = await dashboardGetHelp(token)
      return response?.help ?? {}
    },
  })
}

export function useDashboardSupportTickets(params = {}) {
  return useAuthedDashboardQuery({
    queryKey: ['dashboard', 'support-tickets', JSON.stringify(params)],
    queryFn: async token => {
      const response = await supportList(token, params)
      return response?.tickets ?? []
    },
  })
}

export function useDashboardSupportTicket(ticketId) {
  return useAuthedDashboardQuery({
    queryKey: ['dashboard', 'support-ticket', ticketId],
    enabled: Boolean(ticketId),
    queryFn: async token => {
      const response = await supportGet(token, ticketId)
      return response?.ticket ?? null
    },
  })
}

export function useDashboardThread(bookingId, options = {}) {
  const createIfMissing = options?.createIfMissing !== false

  return useAuthedDashboardQuery({
    queryKey: ['dashboard', 'thread', bookingId, createIfMissing ? 'create' : 'readonly'],
    enabled: Boolean(bookingId),
    queryFn: async token => {
      try {
        const response = await messageGetThread(token, bookingId)
        return response?.thread ?? null
      } catch (error) {
        const message = String(error?.message ?? '')
        const isNotFound = Number(error?.status) === 404 || message.includes('API 404')

        if (!isNotFound || !createIfMissing) {
          if (isNotFound) return null
          throw error
        }

        const response = await messageGetOrCreateThread(token, bookingId)
        return response?.thread ?? null
      }
    },
  })
}

export function useDashboardSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: body => withDashboardToken(token => messageSend(token, body)),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['dashboard', 'thread', variables?.bookingId],
      })
      queryClient.invalidateQueries({
        queryKey: ['dashboard', 'notification-count'],
      })
    },
  })
}

export function useDashboardMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: notificationId =>
      withDashboardToken(token => notificationMarkRead(token, notificationId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'notifications'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'notification-count'] })
    },
  })
}

export function useDashboardMarkAllNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => withDashboardToken(token => notificationMarkAllRead(token)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'notifications'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'notification-count'] })
    },
  })
}

export function useDashboardClearAllNotifications() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => withDashboardToken(token => notificationClearAll(token)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'notifications'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'notification-count'] })
    },
  })
}

export function useDashboardCreateTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: body => withDashboardToken(token => supportCreate(token, body)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'support-tickets'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] })
    },
  })
}

export function useDashboardCancelBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ bookingId, body }) =>
      withDashboardToken(token => bookingCancel(token, bookingId, body)),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'bookings'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] })
      queryClient.invalidateQueries({
        queryKey: ['dashboard', 'booking', variables?.bookingId],
      })
      queryClient.invalidateQueries({
        queryKey: ['dashboard', 'booking-timeline', variables?.bookingId],
      })
      queryClient.invalidateQueries({
        queryKey: ['dashboard', 'thread', variables?.bookingId],
      })
    },
  })
}

export function useDashboardSampleTasteDecision() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sampleId, body }) =>
      withDashboardToken(token => sampleTasteRecordDecision(token, sampleId, body)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'sample-tastes'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] })
    },
  })
}

export function useDashboardReplyToTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ticketId, body }) =>
      withDashboardToken(token => supportReply(token, ticketId, body)),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'support-tickets'] })
      queryClient.invalidateQueries({
        queryKey: ['dashboard', 'support-ticket', variables?.ticketId],
      })
    },
  })
}

export function useDashboardLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      try {
        await authLogout()
      } finally {
        clearStoredJwt()
      }
    },
    onSuccess: () => {
      queryClient.clear()
    },
  })
}
