import prisma from '../lib/prisma.js'
import { fetchDashboardHelpContent, getBookingCategory } from '../lib/dashboardData.js'
import { strapiServerGet } from '../lib/strapi.js'
import { withCache, cacheDel, TTL } from '../lib/cache.js'

export const getCustomerHelp = async (req, res, next) => {
  try {
    const help = await fetchDashboardHelpContent()
    res.json({ help })
  } catch (err) {
    next(err)
  }
}

export async function invalidateDashboardCache(userId) {
  await cacheDel(`dashboard:summary:${userId}`)
}

export const getCustomerSummary = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const cacheKey = `dashboard:summary:${userId}`

    const summary = await withCache(cacheKey, TTL.DASHBOARD, async () => {
      const [
        bookings,
        pendingSampleTasteCount,
        unreadMessagesCount,
        openSupportTicketsCount,
        unreadNotificationsCount,
        savedPackages,
      ] = await Promise.all([
        prisma.booking.findMany({
          where: { userId },
          select: { id: true, status: true, eventDate: true },
        }),
        prisma.sampleTasteBooking.count({
          where: { userId, status: { not: 'completed' } },
        }),
        prisma.message.count({
          where: {
            senderId: { not: userId },
            readStatus: { none: { userId } },
            thread: { is: { booking: { is: { userId } } } },
          },
        }),
        prisma.supportTicket.count({
          where: { userId, status: { in: ['open', 'in_progress'] } },
        }),
        prisma.notification.count({
          where: { userId, isRead: false },
        }),
        strapiServerGet(
          `/api/saved-packages?filters[user][id][$eq]=${userId}&pagination[page]=1&pagination[pageSize]=1&publicationState=preview`
        ),
      ])

      const activeBookingsCount = bookings.filter(b => getBookingCategory(b) === 'active').length
      const previousBookingsCount = bookings.filter(
        b => getBookingCategory(b) === 'previous'
      ).length

      return {
        activeBookingsCount,
        previousBookingsCount,
        pendingSampleTasteCount,
        savedPackagesCount: savedPackages?.meta?.pagination?.total ?? 0,
        unreadMessagesCount,
        openSupportTicketsCount,
        unreadNotificationsCount,
      }
    })

    res.json({ summary })
  } catch (err) {
    next(err)
  }
}
