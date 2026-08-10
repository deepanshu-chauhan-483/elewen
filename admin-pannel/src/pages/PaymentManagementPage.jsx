import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  SectionLoadingState,
  CustomSelect,
} from '../components/ui/AdminUI'
import { useAdminToast } from '../components/common/AdminToastProvider'
import {
  useAdminBookings,
  useAdminCoupons,
  useAdminCreateCoupon,
  useAdminCreateVendorPayout,
  useAdminDeleteCoupon,
  useAdminShareCoupon,
  useAdminPaymentWorkspace,
  useAdminProcessRefund,
  useAdminRefunds,
  useAdminSettings,
  useAdminUpdateCoupon,
  useAdminUpdateSettings,
  useAdminUpdateVendorPayout,
  useAdminVendors,
} from '../hooks/useAdminData'
import { useScrollToTop } from '../hooks/useScrollToTop'
import { getAdminBadgeClass } from '../lib/adminBadges'
import { formatCurrency, formatDate, formatDateTime } from '../lib/formatters'
import { bookingHasHookahCod, isCodPayment } from '../lib/sheeshaCheckout'

// ---------------------------------------------------------------------------
// Shared primitives — consistent with BookingManagementPage style
// ---------------------------------------------------------------------------

function Badge({ status, label }) {
  const key = status?.toLowerCase() ?? ''
  const cls = getAdminBadgeClass(status, { preset: 'vivid' })
  const text = label ?? key.charAt(0).toUpperCase() + key.slice(1) ?? '—'
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap ${cls}`}
    >
      {text}
    </span>
  )
}

function MetricCard({ label, value, helper }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border-t-[3px] border-t-[#D4BA8E] bg-white px-5 py-5">
      <span className="text-[11px] uppercase tracking-widest text-[#8F8F8F]">{label}</span>
      <span className="text-[26px] font-semibold leading-none text-[#1C1C1C]">{value}</span>
      <span className="text-xs text-[#6B7280]">{helper}</span>
    </div>
  )
}

function Input({ type = 'text', value, onChange, placeholder }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full border-b border-[#2D2D2D] bg-transparent text-[16px] outline-none"
    />
  )
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-2xl border border-[#E4DED8] bg-[#F3F3F3] px-4 py-3 text-sm text-[#2D2D2D] placeholder:text-[#8F8F8F] outline-none focus:border-[#CDB17E] focus:ring-1 focus:ring-[#CDB17E] transition resize-none"
    />
  )
}

function PrimaryBtn({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center justify-center rounded-full bg-[#CDB17E] px-5 text-sm text-[#FAFAFA] hover:bg-[#C6AB7F] disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  )
}

function GhostBtn({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center justify-center px-5 text-sm rounded-full border border-[#CDB17E] bg-[#FFFFFF] hover:bg-[#FAF6F1] text-[#CDB17E] disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  )
}

function DangerBtn({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center justify-center rounded-full px-5 text-sm  bg-[#591902] text-[#FAFAFA] hover:bg-[#651D03] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  )
}

function ArrowIcon({ direction = 'right' }) {
  const rotationClass = direction === 'left' ? '' : 'rotate-180'

  return (
    <svg className={`h-6 w-6 ${rotationClass}`} viewBox="0 0 36 36" fill="none">
      <path
        d="M28.5 18H7.5M7.5 18L18 28.5M7.5 18L18 7.5"
        stroke="#1C1C1C"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function buildMailtoHref(to, subject, bodyLines = []) {
  const recipient = String(to ?? '').trim()
  if (!recipient) return ''

  // encodeURIComponent → %20 for spaces. URLSearchParams uses +, which many mail apps show literally.
  const parts = []
  if (subject) parts.push(`subject=${encodeURIComponent(subject)}`)
  const body = bodyLines.filter(Boolean).join('\n')
  if (body) parts.push(`body=${encodeURIComponent(body)}`)

  const query = parts.join('&')
  return `mailto:${recipient}${query ? `?${query}` : ''}`
}

function buildBookingWorkspaceHref(bookingId = '') {
  const id = String(bookingId ?? '').trim()
  return id ? `/bookings?open=${encodeURIComponent(id)}&bucket=live` : '/bookings'
}

function openBookingInManagement(navigate, bookingId) {
  const href = buildBookingWorkspaceHref(bookingId)
  if (href === '/bookings') return
  navigate(href)
}

function PaginationControls({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null
  const latestRefund = null

  return (
    <div className="mt-4 flex justify-end gap-2">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="rounded-full border border-[#E4DED8] bg-white px-3 py-3 text-xs font-semibold text-[#1C1C1C] transition hover:border-[#D4BA8E] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ArrowIcon direction="left" />
      </button>
      <div className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold text-[#1C1C1C]">
        {currentPage} / {totalPages}
        {latestRefund ? (
          <p className="mt-2 text-xs text-[#8F8F8F]">
            Refund: {formatCurrency(latestRefund.amount)} Â· {latestRefund.status}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="rounded-full border border-[#E4DED8] bg-white px-3 py-3 text-xs font-semibold text-[#1C1C1C] transition hover:border-[#D4BA8E] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ArrowIcon direction="right" />
      </button>
    </div>
  )
}

// Section tabs (main nav + sub-tabs)
function Tabs({ items, value, onChange, size = 'md' }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(item => {
        const isActive = value === item.key
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={[
              'rounded-full border transition',
              size === 'sm' ? 'px-3 py-1 text-xs font-semibold' : 'px-4 py-2 text-sm font-semibold',
              isActive
                ? 'border-[#D4BA8E] bg-[#D4BA8E] text-[#FAFAFA]'
                : 'border-[#E4DED8] bg-white text-[#6B7280] hover:border-[#D4BA8E] hover:text-[#7A5C2E]',
            ].join(' ')}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Row cards
// ---------------------------------------------------------------------------

function BookingPaymentRow({ booking, onOpen }) {
  const showHookahCodBadge = bookingHasHookahCod(booking)

  return (
    <button
      type="button"
      onClick={() => onOpen?.(booking.id)}
      className="flex w-full flex-wrap items-start justify-between gap-3 rounded-2xl border border-[#E4DED8] bg-white px-4 py-4 text-left transition hover:border-[#D4BA8E] hover:bg-[#FBF8F3]"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[#1C1C1C]">
          {booking?.customer?.name || 'Customer'}
          <span className="ml-2 font-normal text-[#6B7280]">
            / {booking?.package?.title || booking.id}
          </span>
        </p>
        <p className="mt-1 text-xs text-[#8F8F8F]">
          {formatDate(booking.eventDate)}
          {booking.locationSummary ? ` · ${booking.locationSummary}` : ''}
        </p>
        <div className="mt-2 flex gap-4 text-sm">
          <span>
            <span className="text-[#8F8F8F]">Paid </span>
            <span className="font-medium text-[#2D2D2D]">{formatCurrency(booking.paidAmount)}</span>
          </span>
          <span>
            <span className="text-[#8F8F8F]">Remaining </span>
            <span className="font-medium text-[#2D2D2D]">
              {formatCurrency(booking.outstandingAmount)}
            </span>
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge status={booking.status} label={booking.statusLabel} />
        {showHookahCodBadge ? <Badge status="pending" label="Hookah · COD" /> : null}
        <Badge
          status={booking.vendorAssignments?.length ? 'assigned' : 'unassigned'}
          label={booking.vendorAssignments?.length ? 'Vendor assigned' : 'No vendor'}
        />
        <span className="rounded-full border border-[#E4DED8] px-3 py-1 text-xs font-medium text-[#7A5C2E]">
          Open booking
        </span>
      </div>
    </button>
  )
}

function PaymentRecordRow({
  payment,
  showRefundActions = false,
  onRefundAction,
  isRefundBusy = false,
  onOpen,
}) {
  const refunds = Array.isArray(payment.refunds) ? payment.refunds : []
  const pendingRefund = refunds.find(r => r.status === 'requested')
  const latestRefund =
    [...refunds].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))[0] ??
    null
  const showHookahCodBadge = isCodPayment(payment)
  const bookingId = payment.bookingId || payment.bookingSummary?.id

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(bookingId)}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen?.(bookingId)
        }
      }}
      className="flex w-full cursor-pointer flex-wrap items-start justify-between gap-3 rounded-2xl border border-[#E4DED8] bg-white px-4 py-4 text-left transition hover:border-[#D4BA8E] hover:bg-[#FBF8F3]"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[#1C1C1C]">
          {payment.bookingSummary?.customer?.name || 'Customer'}
          <span className="ml-2 font-normal text-[#6B7280]">
            / {payment.bookingSummary?.package?.title || payment.bookingId}
          </span>
        </p>
        <p className="mt-1 text-xs text-[#8F8F8F]">
          {payment.paymentType} · {formatCurrency(payment.amount)} ·{' '}
          {formatDateTime(payment.createdAt)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge status={payment.status} />
        {showHookahCodBadge ? <Badge status="pending" label="Hookah · COD" /> : null}
        <Badge status={payment.paymentMethod} label={payment.paymentMethod || 'Method pending'} />
        {latestRefund ? (
          <Badge status={latestRefund.status} label={`Refund ${latestRefund.status}`} />
        ) : null}
        {showRefundActions && pendingRefund && (
          <PrimaryBtn
            disabled={isRefundBusy}
            onClick={event => {
              event.stopPropagation()
              onRefundAction?.(pendingRefund.id, 'approve')
            }}
          >
            Pay Refund
          </PrimaryBtn>
        )}
        <span className="rounded-full border border-[#E4DED8] px-3 py-1 text-xs font-medium text-[#7A5C2E]">
          Open booking
        </span>
      </div>
    </div>
  )
}

function PayoutRow({ payout, onMark, isBusy = false, onOpen }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(payout.bookingId)}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen?.(payout.bookingId)
        }
      }}
      className="flex w-full cursor-pointer flex-wrap items-start justify-between gap-3 rounded-2xl border border-[#E4DED8] bg-white px-4 py-4 text-left transition hover:border-[#D4BA8E] hover:bg-[#FBF8F3]"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[#1C1C1C]">
          {payout.vendor?.companyName || payout.vendorId}
          <span className="ml-2 font-normal text-[#6B7280]">· {formatCurrency(payout.amount)}</span>
        </p>
        <p className="mt-1 text-xs text-[#8F8F8F]">
          {payout.bookingSummary?.package?.title || payout.bookingId} ·{' '}
          {formatDateTime(payout.createdAt)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge status={payout.status} />
        <Badge status={payout.paymentMethod} label={payout.paymentMethod || 'Offline'} />
        {payout.status === 'pending' && (
          <>
            <PrimaryBtn
              disabled={isBusy}
              onClick={event => {
                event.stopPropagation()
                onMark?.(payout.id, 'paid')
              }}
            >
              Mark Paid
            </PrimaryBtn>
            <DangerBtn
              disabled={isBusy}
              onClick={event => {
                event.stopPropagation()
                onMark?.(payout.id, 'failed')
              }}
            >
              Mark Failed
            </DangerBtn>
          </>
        )}
        <span className="rounded-full border border-[#E4DED8] px-3 py-1 text-xs font-medium text-[#7A5C2E]">
          Open booking
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section: Customer Payments
// ---------------------------------------------------------------------------
const customerTabs = [
  { key: 'today', label: "Today's Payments" },
  { key: 'active', label: 'Active Bookings' },
  { key: 'failed', label: 'Failed Payments' },
  { key: 'completed', label: 'Completed' },
]

function RefundRow({ refund, processRefundMutation }) {
  const booking = refund.bookingSummary ?? null

  return (
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-[#E4DED8] bg-white px-4 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[#1C1C1C]">
          {booking?.customer?.name || 'Customer'}
          <span className="ml-2 font-normal text-[#6B7280]">
            / {booking?.package?.title || refund.bookingId}
          </span>
        </p>
        <p className="mt-1 text-xs text-[#8F8F8F]">
          Cancelled booking · {formatDate(booking.eventDate)}
          {booking.locationSummary ? ` · ${booking.locationSummary}` : ''}
        </p>
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          <span>
            <span className="text-[#8F8F8F]">Refund Amount </span>
            <span className="font-medium text-[#2D2D2D]">{formatCurrency(refund.amount)}</span>
          </span>
          <span>
            <span className="text-[#8F8F8F]">Requested </span>
            <span className="font-medium text-[#2D2D2D]">{formatDateTime(refund.createdAt)}</span>
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge status={booking?.status} label={booking?.statusLabel || 'Cancelled'} />
        <Badge status={refund.status} label={`Refund ${refund.status}`} />
        {refund.status === 'requested' ? (
          <PrimaryBtn
            disabled={processRefundMutation.isPending}
            onClick={() =>
              processRefundMutation.mutate({
                refundId: refund.id,
                body: { action: 'approve' },
              })
            }
          >
            Pay Refund
          </PrimaryBtn>
        ) : null}
      </div>
    </div>
  )
}

function CustomerPayments({ processRefundMutation, initialTab = 'today' }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState(
    customerTabs.some(item => item.key === initialTab) ? initialTab : 'today'
  )
  const [currentPage, setCurrentPage] = useState(1)
  const workspaceQuery = useAdminPaymentWorkspace({
    customerTab: tab,
    customerPage: currentPage,
    limit: 10,
  })
  const customerPayments = workspaceQuery.data?.customerPayments ?? {}
  const lists = {
    today: customerPayments.todayPayments ?? [],
    active: customerPayments.activeBookings ?? [],
    failed: customerPayments.failedPayments ?? [],
    completed: customerPayments.completedPayments ?? [],
  }
  const currentList = lists[tab] ?? []
  const totalPages = Math.max(1, Number(customerPayments.pages ?? 1))
  const visiblePage = Math.min(currentPage, totalPages)
  const isSectionLoading = workspaceQuery.isFetching && !workspaceQuery.isLoading
  const openBooking = bookingId => openBookingInManagement(navigate, bookingId)

  useScrollToTop(currentPage)

  if (workspaceQuery.isLoading) return <LoadingState label="Loading customer payments…" />
  if (workspaceQuery.error)
    return <ErrorState label="Customer payments are unavailable right now." />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg text-[#1C1C1C]">Customer Payments</h2>

        <div className="ml-auto w-full max-w-[260px] md:w-[260px]">
          <CustomSelect
            value={tab}
            onChange={value => {
              setTab(value)
              setCurrentPage(1)
            }}
            placeholder="Select Tab"
            className="h-[42px] rounded-full border border-[#E4DED8] bg-white px-4 text-sm font-medium text-[#1C1C1C]"
          >
            {customerTabs.map(item => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </CustomSelect>
        </div>
      </div>

      {isSectionLoading ? (
        <SectionLoadingState label="Loading customer payments…" />
      ) : (
        <>
          {tab === 'today' &&
            (lists.today.length ? (
              <div className="space-y-2.5">
                {currentList.map(p => (
                  <PaymentRecordRow
                    key={p.id}
                    payment={p}
                    onOpen={openBooking}
                    showRefundActions
                    isRefundBusy={processRefundMutation.isPending}
                    onRefundAction={(refundId, action) =>
                      refundId &&
                      processRefundMutation.mutate({
                        refundId,
                        body: { action },
                      })
                    }
                  />
                ))}
                <PaginationControls
                  currentPage={visiblePage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            ) : (
              <EmptyState
                title="No payments today"
                body="Customer payment attempts made today (IST) will appear here."
              />
            ))}

          {tab === 'active' &&
            (lists.active.length ? (
              <div className="space-y-2.5">
                {currentList.map(b => (
                  <BookingPaymentRow key={b.id} booking={b} onOpen={openBooking} />
                ))}
                <PaginationControls
                  currentPage={visiblePage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            ) : (
              <EmptyState
                title="No active booking balances"
                body="Active bookings with payment context will appear here."
              />
            ))}

          {tab === 'failed' &&
            (lists.failed.length ? (
              <div className="space-y-2.5">
                {currentList.map(p => (
                  <PaymentRecordRow
                    key={p.id}
                    payment={p}
                    onOpen={openBooking}
                    showRefundActions
                    isRefundBusy={processRefundMutation.isPending}
                    onRefundAction={(refundId, action) =>
                      refundId &&
                      processRefundMutation.mutate({
                        refundId,
                        body: { action },
                      })
                    }
                  />
                ))}
                <PaginationControls
                  currentPage={visiblePage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            ) : (
              <EmptyState
                title="No failed payments"
                body="Failed transactions needing follow-up will appear here."
              />
            ))}

          {tab === 'completed' &&
            (lists.completed.length ? (
              <div className="space-y-2.5">
                {currentList.map(p => (
                  <PaymentRecordRow
                    key={p.id}
                    payment={p}
                    onOpen={openBooking}
                    showRefundActions
                    isRefundBusy={processRefundMutation.isPending}
                    onRefundAction={(refundId, action) =>
                      refundId &&
                      processRefundMutation.mutate({
                        refundId,
                        body: { action },
                      })
                    }
                  />
                ))}
                <PaginationControls
                  currentPage={visiblePage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            ) : (
              <EmptyState
                title="No completed payments"
                body="Successful customer payments will appear here."
              />
            ))}
        </>
      )}
    </div>
  )
}

const vendorTabs = [
  { key: 'pending', label: 'Pending Payouts' },
  { key: 'paid', label: 'Paid' },
]

function VendorPayments({
  vendorsQuery,
  bookingsQuery,
  createVendorPayoutMutation,
  updateVendorPayoutMutation,
}) {
  const navigate = useNavigate()
  const [tab, setTab] = useState('pending')
  const [currentPage, setCurrentPage] = useState(1)
  const [vendorId, setVendorId] = useState('')
  const [bookingId, setBookingId] = useState('')
  const [payoutAmount, setPayoutAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('offline')
  const workspaceQuery = useAdminPaymentWorkspace({
    vendorTab: tab,
    vendorPage: currentPage,
    limit: 10,
  })
  const vendorPayments = workspaceQuery.data?.vendorPayments ?? {}
  const currentList = vendorPayments[tab] ?? []
  const totalPages = Math.max(1, Number(vendorPayments.pages ?? 1))
  const visiblePage = Math.min(currentPage, totalPages)

  useScrollToTop(currentPage)
  const isSectionLoading = workspaceQuery.isFetching && !workspaceQuery.isLoading

  if (workspaceQuery.isLoading) return <LoadingState label="Loading vendor payouts…" />
  if (workspaceQuery.error) return <ErrorState label="Vendor payouts are unavailable right now." />

  return (
    <div className="space-y-5">
      {/* Create payout form */}
      <div className="rounded-2xl border border-[#E4DED8] bg-[#FBF7F3] p-5">
        <h3 className="mb-4 text-lg text-[#1C1C1C]">Create Vendor Payout</h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="min-w-0">
            <CustomSelect
              value={vendorId}
              onChange={setVendorId}
              placeholder="Select vendor"
              className="min-h-10 bg-[#F3F3F3]"
            >
              <option value="">Select vendor…</option>
              {(vendorsQuery.data?.vendors ?? []).map(v => (
                <option key={v.id} value={v.id}>
                  {v.companyName}
                </option>
              ))}
            </CustomSelect>
          </div>
          <div className="min-w-0 overflow-hidden">
            <CustomSelect
              value={bookingId}
              onChange={setBookingId}
              placeholder="Select booking"
              className="min-h-10 max-w-full bg-[#F3F3F3]"
            >
              <option value="">Select booking…</option>
              {(bookingsQuery.data?.bookings ?? []).map(b => {
                const bookingId = String(b.id ?? '').trim()
                const shortId = bookingId
                  ? `#${bookingId.slice(0, 8).toUpperCase()}`
                  : 'Unknown booking'
                const customerName = String(b.customer?.name || 'Customer').trim()
                const shortCustomer =
                  customerName.length > 22 ? `${customerName.slice(0, 21)}…` : customerName
                return (
                  <option key={b.id} value={b.id} title={`${bookingId} — ${customerName}`}>
                    {shortId} — {shortCustomer}
                  </option>
                )
              })}
            </CustomSelect>
          </div>
          <div className="min-w-0">
            <input
              type="number"
              value={payoutAmount}
              onChange={e => setPayoutAmount(e.target.value)}
              placeholder="Amount (₹)"
              className="w-full min-w-0 rounded-full border border-[#D9D2CB] px-4 py-2 text-[15px] font-medium bg-[#FFFFFF] text-[#5B534B] placeholder:text-[#767676] outline-none transition focus:border-[#CDB17E] focus:ring-1 focus:ring-[#CDB17E]"
            />
          </div>
          <div className="min-w-0">
            <CustomSelect
              value={paymentMethod}
              onChange={setPaymentMethod}
              placeholder="Select payment method"
              className="min-h-10 bg-[#F3F3F3]"
            >
              <option value="offline">Offline</option>
              <option value="portal">Portal</option>
            </CustomSelect>
          </div>
        </div>
        <div className="mt-4">
          <PrimaryBtn
            disabled={
              createVendorPayoutMutation.isPending || !vendorId || !bookingId || !payoutAmount
            }
            onClick={() =>
              createVendorPayoutMutation.mutate({
                vendorId,
                bookingId,
                amount: Number(payoutAmount),
                paymentMethod,
              })
            }
          >
            {createVendorPayoutMutation.isPending ? 'Creating…' : 'Create Payout'}
          </PrimaryBtn>
        </div>
      </div>

      <Tabs
        items={vendorTabs}
        value={tab}
        onChange={value => {
          setTab(value)
          setCurrentPage(1)
        }}
        size="sm"
      />

      {isSectionLoading ? (
        <SectionLoadingState label="Loading vendor payoutsâ€¦" />
      ) : (
        <>
          {tab === 'pending' &&
            ((vendorPayments.pending ?? []).length ? (
              <div className="space-y-2.5">
                {currentList.map(p => (
                  <PayoutRow
                    key={p.id}
                    payout={p}
                    onOpen={bookingId => openBookingInManagement(navigate, bookingId)}
                    isBusy={updateVendorPayoutMutation.isPending}
                    onMark={(id, status) =>
                      updateVendorPayoutMutation.mutate({ payoutId: id, body: { status } })
                    }
                  />
                ))}
                <PaginationControls
                  currentPage={visiblePage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            ) : (
              <EmptyState
                title="No pending vendor payouts"
                body="Pending payout approvals will appear here."
              />
            ))}

          {tab === 'paid' &&
            ((vendorPayments.paid ?? []).length ? (
              <div className="space-y-2.5">
                {currentList.map(p => (
                  <PayoutRow key={p.id} payout={p} onOpen={bookingId => openBookingInManagement(navigate, bookingId)} />
                ))}
                <PaginationControls
                  currentPage={visiblePage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            ) : (
              <EmptyState
                title="No paid vendors yet"
                body="Paid settlements will appear here once processed."
              />
            ))}
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section: Coupons
// ---------------------------------------------------------------------------
const BLANK_COUPON_FORM = {
  code: '',
  title: '',
  discount_type: 'percentage',
  discount_value: '',
  min_order_value: '',
  max_order_value: '',
  terms_customer: '',
  admin_notes: '',
  first_order_only: 'false',
  max_uses: '',
  used_count: '0',
  valid_from: '',
  valid_to: '',
  is_active: true,
}

const COUPON_FIELDS = [
  { key: 'code', label: 'Coupon code', type: 'text', placeholder: 'Coupon code (e.g. SAVE20)' },
  { key: 'title', label: 'Display title', type: 'text', placeholder: 'Flat Rs 500 off' },
  {
    key: 'discount_type',
    label: 'Discount type',
    type: 'select',
    options: [
      { value: 'percentage', label: 'Percentage (%)' },
      { value: 'flat', label: 'Flat amount (Rs)' },
    ],
  },
  { key: 'discount_value', label: 'Discount value', type: 'number' },
  { key: 'min_order_value', label: 'Min order (Rs)', type: 'number', placeholder: 'e.g. 5000' },
  { key: 'max_order_value', label: 'Max order (Rs)', type: 'number', placeholder: 'Optional cap' },
  { key: 'max_uses', label: 'Max uses', type: 'number', placeholder: 'Blank = unlimited' },
  { key: 'used_count', label: 'Used count', type: 'number', placeholder: 'Default 0' },
  { key: 'valid_from', label: 'Valid from', type: 'date' },
  { key: 'valid_to', label: 'Valid to', type: 'date' },
  {
    key: 'first_order_only',
    label: 'First order only',
    type: 'select',
    options: [
      { value: 'false', label: 'No' },
      { value: 'true', label: 'Yes' },
    ],
  },
  {
    key: 'is_active',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'true', label: 'Active' },
      { value: 'false', label: 'Inactive' },
    ],
  },
  {
    key: 'terms_customer',
    label: 'T&C (shown to customer)',
    type: 'textarea',
    placeholder: 'Valid on orders above Rs 5000…',
    rows: 3,
  },
  {
    key: 'admin_notes',
    label: 'Admin notes',
    type: 'textarea',
    placeholder: 'When to send, campaign notes…',
    rows: 2,
  },
]

const SETTINGS_FIELDS = [
  {
    key: 'advance_payment_percentage',
    label: 'Advance payment %',
    type: 'number',
    placeholder: 'e.g. 30',
  },
  { key: 'primary_phone', label: 'Primary phone', type: 'text', placeholder: '+91 ...' },
  {
    key: 'support_email',
    label: 'Support email',
    type: 'email',
    placeholder: 'support@example.com',
  },
  { key: 'whatsapp_number', label: 'WhatsApp number', type: 'text', placeholder: '+91 ...' },
  {
    key: 'support_availability_text',
    label: 'Support availability note',
    type: 'textarea',
    placeholder: 'e.g. Mon-Sat, 10am-7pm',
    rows: 2,
  },
  {
    key: 'response_expectation_text',
    label: 'Response expectation note',
    type: 'textarea',
    placeholder: 'e.g. Replies within 4 hours',
    rows: 2,
  },
]

function toDateInputValue(value) {
  const text = String(value ?? '').trim()
  return text ? text.slice(0, 10) : ''
}

function couponFormFromSource(source = {}) {
  return {
    code: String(source.code ?? '').toUpperCase(),
    title: String(source.title ?? ''),
    discount_type: source.discount_type ?? 'percentage',
    discount_value:
      source.discount_value !== undefined && source.discount_value !== null
        ? String(source.discount_value)
        : '',
    min_order_value:
      source.min_order_value !== undefined && source.min_order_value !== null
        ? String(source.min_order_value)
        : '',
    max_order_value:
      source.max_order_value !== undefined && source.max_order_value !== null
        ? String(source.max_order_value)
        : '',
    terms_customer: String(source.terms_customer ?? ''),
    admin_notes: String(source.admin_notes ?? ''),
    first_order_only: source.first_order_only ? 'true' : 'false',
    max_uses:
      source.max_uses !== undefined && source.max_uses !== null ? String(source.max_uses) : '',
    used_count:
      source.used_count !== undefined && source.used_count !== null
        ? String(source.used_count)
        : '0',
    valid_from: toDateInputValue(source.valid_from),
    valid_to: toDateInputValue(source.valid_to),
    is_active: source.is_active !== false,
  }
}

function settingsFormFromSource(source = {}) {
  const s = source ?? {}
  return {
    advance_payment_percentage:
      s.advance_payment_percentage !== undefined && s.advance_payment_percentage !== null
        ? String(s.advance_payment_percentage)
        : '',
    primary_phone: String(s.primary_phone ?? ''),
    support_email: String(s.support_email ?? ''),
    whatsapp_number: String(s.whatsapp_number ?? ''),
    support_availability_text: String(s.support_availability_text ?? ''),
    response_expectation_text: String(s.response_expectation_text ?? ''),
  }
}

function renderFormField({ field, value, onChange, selectClassName = '' }) {
  if (field.type === 'select') {
    return (
      <div key={field.key}>
        <p className="mb-1 text-xs text-[#8F8F8F]">{field.label}</p>
        <CustomSelect
          value={
            field.key === 'is_active' || field.key === 'first_order_only'
              ? String(value)
              : value
          }
          onChange={nextValue =>
            onChange(
              field.key,
              field.key === 'is_active' || field.key === 'first_order_only'
                ? nextValue === 'true'
                : nextValue
            )
          }
          className={`min-h-10 rounded-lg bg-[#F3F3F3] ${selectClassName}`.trim()}
        >
          {field.options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </CustomSelect>
      </div>
    )
  }

  if (field.type === 'textarea') {
    return (
      <div key={field.key}>
        <p className="mb-1 text-xs text-[#8F8F8F]">{field.label}</p>
        <Textarea
          value={value}
          onChange={event => onChange(field.key, event.target.value)}
          placeholder={field.placeholder}
          rows={field.rows ?? 3}
        />
      </div>
    )
  }

  return (
    <div key={field.key}>
      <p className="mb-1 text-xs text-[#8F8F8F]">{field.label}</p>
      <Input
        type={field.type}
        value={value}
        onChange={event => onChange(field.key, event.target.value)}
        placeholder={field.placeholder}
      />
    </div>
  )
}

// function CouponRow({ coupon, updateCouponMutation }) {
//   const [editing, setEditing] = useState(false)
//   const [editForm, setEditForm] = useState({})
//   const setE = (key, val) => setEditForm(f => ({ ...f, [key]: val }))

//   function openEdit() {
//     setEditForm(couponFormFromSource(coupon))
//     setEditing(true)
//   }

//   function saveEdit() {
//     updateCouponMutation.mutate(
//       {
//         couponId: coupon.id,
//         body: {
//           code: editForm.code,
//           discount_type: editForm.discount_type,
//           discount_value: Number(editForm.discount_value),
//           max_uses: editForm.max_uses ? Number(editForm.max_uses) : null,
//           used_count: Number(editForm.used_count || 0),
//           valid_from: editForm.valid_from || null,
//           valid_to: editForm.valid_to || null,
//           is_active: Boolean(editForm.is_active),
//         },
//       },
//       { onSuccess: () => setEditing(false) }
//     )
//   }

//   return (
//     <div className="rounded-2xl border border-[#E4DED8] bg-white px-4 py-4 space-y-3">
//       {/* Row header */}
//       <div className="flex flex-wrap items-start justify-between gap-3">
//         <div>
//           <p className="text-sm font-semibold text-[#1C1C1C]">{coupon.code}</p>
//           <p className="mt-1 text-xs text-[#8F8F8F]">
//             {coupon.discount_type === 'percentage'
//               ? `${coupon.discount_value}% off`
//               : `₹${coupon.discount_value} off`}
//             {coupon.valid_from || coupon.valid_to
//               ? ` · Valid ${formatDate(coupon.valid_from)} → ${formatDate(coupon.valid_to)}`
//               : ''}
//             {coupon.max_uses ? ` · Max ${coupon.max_uses} uses` : ' · Unlimited uses'}
//             {` · Used ${coupon.used_count ?? 0} times`}
//           </p>
//         </div>
//         <div className="flex items-center gap-2">
//           <Badge
//             status={coupon.is_active ? 'active' : 'inactive'}
//             label={coupon.is_active ? 'Active' : 'Inactive'}
//           />
//           <GhostBtn
//             disabled={updateCouponMutation.isPending}
//             onClick={() =>
//               updateCouponMutation.mutate({
//                 couponId: coupon.id,
//                 body: { is_active: !coupon.is_active },
//               })
//             }
//           >
//             {coupon.is_active ? 'Disable' : 'Enable'}
//           </GhostBtn>
//           <GhostBtn onClick={editing ? () => setEditing(false) : openEdit}>
//             {editing ? 'Cancel' : 'Edit'}
//           </GhostBtn>
//         </div>
//       </div>

//       {/* Inline edit form */}
//       {editing && (
//         <div className="border-t border-[#E4DED8] pt-3">
//           <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
//             <CustomSelect
//               value={editForm.discount_type}
//               onChange={v => setE('discount_type', v)}
//               className="min-h-10 bg-[#F3F3F3]"
//             >
//               <option value="percentage">Percentage (%)</option>
//               <option value="flat">Flat amount (₹)</option>
//             </CustomSelect>
//             <Input
//               type="number"
//               value={editForm.discount_value}
//               onChange={e => setE('discount_value', e.target.value)}
//               placeholder="Discount value"
//             />
//             <Input
//               type="number"
//               value={editForm.max_uses}
//               onChange={e => setE('max_uses', e.target.value)}
//               placeholder="Max uses (blank = unlimited)"
//             />
//             <div className="grid grid-cols-2 gap-2">
//               <div>
//                 <p className="mb-1 text-xs text-[#8F8F8F]">Valid from</p>
//                 <Input
//                   type="date"
//                   value={editForm.valid_from}
//                   onChange={e => setE('valid_from', e.target.value)}
//                 />
//               </div>
//               <div>
//                 <p className="mb-1 text-xs text-[#8F8F8F]">Valid to</p>
//                 <Input
//                   type="date"
//                   value={editForm.valid_to}
//                   onChange={e => setE('valid_to', e.target.value)}
//                 />
//               </div>
//             </div>
//           </div>
//           <div className="mt-3 flex gap-2">
//             <PrimaryBtn
//               disabled={updateCouponMutation.isPending || !editForm.discount_value}
//               onClick={saveEdit}
//             >
//               {updateCouponMutation.isPending ? 'Saving…' : 'Save Changes'}
//             </PrimaryBtn>
//             <GhostBtn onClick={() => setEditing(false)}>Cancel</GhostBtn>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// ---------------------------------------------------------------------------
// Section: Coupons Dynamic
// ---------------------------------------------------------------------------
// function SettingsSection({ updateSettingsMutation }) {
//   const [form, setForm] = useState({
//     advance_payment_percentage: '',
//     primary_phone: '',
//     support_email: '',
//     whatsapp_number: '',
//     support_availability_text: '',
//     response_expectation_text: '',
//   })
//   const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

//   return (
//     <div className="space-y-5">
//       {/* Current values */}
//       <div className="grid grid-cols-2 gap-4 rounded-2xl border border-[#E4DED8] bg-white p-5 md:grid-cols-4">
//         {[
//           { label: 'Advance %', value: `${form.advance_payment_percentage || 0}%` },
//           { label: 'Phone', value: form.primary_phone || '—' },
//           { label: 'Email', value: form.support_email || '—' },
//           { label: 'WhatsApp', value: form.whatsapp_number || '—' },
//         ].map(f => (
//           <div key={f.label}>
//             <p className="text-[11px] uppercase tracking-widest text-[#8F8F8F]">{f.label}</p>
//             <p className="mt-0.5 text-sm font-medium text-[#2D2D2D]">{f.value}</p>
//           </div>
//         ))}
//       </div>

//       {/* Edit form */}
//       <div className="rounded-2xl border border-[#E4DED8] bg-[#FBF7F3] p-5">
//         <h3 className="mb-4 text-base font-semibold text-[#1C1C1C]">Edit Settings</h3>
//         <div className="grid gap-3 sm:grid-cols-2">
//           <div>
//             <p className="mb-1 text-xs text-[#8F8F8F]">Advance payment %</p>
//             <Input
//               type="number"
//               value={form.advance_payment_percentage}
//               onChange={e => set('advance_payment_percentage', e.target.value)}
//               placeholder="e.g. 30"
//             />
//           </div>
//           <div>
//             <p className="mb-1 text-xs text-[#8F8F8F]">Primary phone</p>
//             <Input
//               value={form.primary_phone}
//               onChange={e => set('primary_phone', e.target.value)}
//               placeholder="+91 …"
//             />
//           </div>
//           <div>
//             <p className="mb-1 text-xs text-[#8F8F8F]">Support email</p>
//             <Input
//               value={form.support_email}
//               onChange={e => set('support_email', e.target.value)}
//               placeholder="support@…"
//             />
//           </div>
//           <div>
//             <p className="mb-1 text-xs text-[#8F8F8F]">WhatsApp number</p>
//             <Input
//               value={form.whatsapp_number}
//               onChange={e => set('whatsapp_number', e.target.value)}
//               placeholder="+91 …"
//             />
//           </div>
//           <div>
//             <p className="mb-1 text-xs text-[#8F8F8F]">Support availability note</p>
//             <Textarea
//               value={form.support_availability_text}
//               onChange={e => set('support_availability_text', e.target.value)}
//               placeholder="e.g. Mon–Sat, 10am–7pm"
//               rows={2}
//             />
//           </div>
//           <div>
//             <p className="mb-1 text-xs text-[#8F8F8F]">Response expectation note</p>
//             <Textarea
//               value={form.response_expectation_text}
//               onChange={e => set('response_expectation_text', e.target.value)}
//               placeholder="e.g. Replies within 4 hours"
//               rows={2}
//             />
//           </div>
//         </div>
//         <div className="mt-4">
//           <PrimaryBtn
//             disabled={updateSettingsMutation.isPending}
//             onClick={() =>
//               updateSettingsMutation.mutate({
//                 ...form,
//                 advance_payment_percentage: Number(form.advance_payment_percentage || 0),
//               })
//             }
//           >
//             {updateSettingsMutation.isPending ? 'Saving…' : 'Save Settings'}
//           </PrimaryBtn>
//         </div>
//       </div>
//     </div>
//   )
// }

function CouponRowDynamic({ coupon, updateCouponMutation, deleteCouponMutation }) {
  const [editing, setEditing] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareEmail, setShareEmail] = useState('')
  const [editForm, setEditForm] = useState(couponFormFromSource(coupon))
  const shareCouponMutation = useAdminShareCoupon()
  const { showToast } = useAdminToast()
  const setField = (key, value) => setEditForm(current => ({ ...current, [key]: value }))

  function openEdit() {
    setEditForm(couponFormFromSource(coupon))
    setEditing(true)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setEditForm(couponFormFromSource(coupon))
    }, 0)
    return () => clearTimeout(timer)
  }, [coupon])

  function saveEdit() {
    updateCouponMutation.mutate(
      {
        couponId: coupon.id,
        body: {
          code: editForm.code,
          title: editForm.title || null,
          discount_type: editForm.discount_type,
          discount_value: Number(editForm.discount_value),
          min_order_value: editForm.min_order_value ? Number(editForm.min_order_value) : 0,
          max_order_value: editForm.max_order_value ? Number(editForm.max_order_value) : null,
          terms_customer: editForm.terms_customer || null,
          admin_notes: editForm.admin_notes || null,
          first_order_only: editForm.first_order_only === true || editForm.first_order_only === 'true',
          max_uses: editForm.max_uses ? Number(editForm.max_uses) : null,
          used_count: Number(editForm.used_count || 0),
          valid_from: editForm.valid_from || null,
          valid_to: editForm.valid_to || null,
          is_active: Boolean(editForm.is_active),
        },
      },
      { onSuccess: () => setEditing(false) }
    )
  }

  async function handleShareCoupon(event) {
    event?.preventDefault?.()

    const email = shareEmail.trim()
    if (!email) {
      showToast({ message: 'Enter the customer email address.', tone: 'error' })
      return
    }

    try {
      const result = await shareCouponMutation.mutateAsync({
        couponId: coupon.id,
        email,
      })
      showToast({
        message: 'Coupon shared successfully',
        tone: 'success',
      })
      setShareOpen(false)
      setShareEmail('')
    } catch (error) {
      showToast({
        message: error?.message ?? 'Could not send coupon email. Please try again.',
        tone: 'error',
      })
    }
  }

  function toggleSharePanel() {
    setShareOpen(current => {
      const next = !current
      if (!next) {
        setShareEmail('')
      }
      return next
    })
  }

  return (
    <div className="rounded-2xl border border-[#E4DED8] bg-white px-4 py-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#1C1C1C]">{coupon.code}</p>
          <p className="mt-1 text-xs text-[#8F8F8F]">
            {coupon.discount_type === 'percentage'
              ? `${coupon.discount_value}% off`
              : `Rs ${coupon.discount_value} off`}
            {coupon.valid_from || coupon.valid_to
              ? ` · Valid ${formatDate(coupon.valid_from)} → ${formatDate(coupon.valid_to)}`
              : ''}
            {coupon.max_uses ? ` · Max ${coupon.max_uses} uses` : ' · Unlimited uses'}
            {` · Used ${coupon.used_count ?? 0} times`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            status={coupon.is_active ? 'active' : 'inactive'}
            label={coupon.is_active ? 'Active' : 'Inactive'}
          />
          <PrimaryBtn onClick={editing ? () => setEditing(false) : openEdit}>
            {editing ? 'Cancel' : 'Edit'}
          </PrimaryBtn>
          <DangerBtn
            disabled={updateCouponMutation.isPending}
            onClick={() =>
              updateCouponMutation.mutate({
                couponId: coupon.id,
                body: { is_active: !coupon.is_active },
              })
            }
          >
            {coupon.is_active ? 'Disable' : 'Enable'}
          </DangerBtn>
          <GhostBtn onClick={() => setEditing(current => !current)}>
            {editing ? 'Cancel' : 'Edit'}
          </GhostBtn>
          <GhostBtn
            onClick={async () => {
              if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(coupon.code)
              }
            }}
          >
            Copy Code
          </GhostBtn>
          <GhostBtn
            disabled={shareCouponMutation.isPending || !coupon.is_active}
            onClick={toggleSharePanel}
          >
            {shareOpen ? 'Close Share' : shareCouponMutation.isPending ? 'Sending…' : 'Share Coupon'}
          </GhostBtn>
          <GhostBtn
            disabled={
              updateCouponMutation.isPending || (!coupon.is_active && !coupon.banner_shared)
            }
            onClick={() =>
              updateCouponMutation.mutate({
                couponId: coupon.id,
                body: { banner_shared: !coupon.banner_shared },
              })
            }
          >
            {coupon.banner_shared ? 'Stop Banner' : 'Share Banner'}
          </GhostBtn>
          <DangerBtn
            disabled={deleteCouponMutation.isPending}
            onClick={() => {
              if (window.confirm(`Delete coupon "${coupon.code}"? This cannot be undone.`)) {
                deleteCouponMutation.mutate(coupon.id)
              }
            }}
          >
            {deleteCouponMutation.isPending ? 'Deleting…' : 'Delete'}
          </DangerBtn>
        </div>
      </div>

      {editing && (
        <div className="border-t border-[#E4DED8] pt-3">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {COUPON_FIELDS.map(field =>
              renderFormField({
                field,
                value: editForm[field.key] ?? '',
                onChange: (key, value) =>
                  setField(key, key === 'code' ? String(value).toUpperCase() : value),
                selectClassName: 'bg-[#F3F3F3]',
              })
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <PrimaryBtn
              disabled={
                updateCouponMutation.isPending || !editForm.code || !editForm.discount_value
              }
              onClick={saveEdit}
            >
              {updateCouponMutation.isPending ? 'Saving...' : 'Save Changes'}
            </PrimaryBtn>
            <GhostBtn onClick={() => setEditing(false)}>Cancel</GhostBtn>
          </div>
        </div>
      )}

      {shareOpen && (
        <form
          className="border-t border-[#E4DED8] pt-3"
          onSubmit={handleShareCoupon}
        >
          <p className="text-sm font-medium text-[#1C1C1C]">Send personal coupon to customer</p>
          <p className="mt-1 text-xs text-[#8F8F8F]">
            A unique code is created for this email only. They cannot share it with others.
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 space-y-1">
              <span className="text-xs uppercase tracking-widest text-[#8F8F8F]">
                Customer email
              </span>
              <input
                type="email"
                autoComplete="email"
                value={shareEmail}
                onChange={event => setShareEmail(event.target.value)}
                placeholder="customer@example.com"
                className="w-full rounded-2xl border border-[#E4DED8] bg-[#F3F3F3] px-4 py-3 text-sm text-[#2D2D2D] placeholder:text-[#8F8F8F] outline-none focus:border-[#CDB17E] focus:ring-1 focus:ring-[#CDB17E] transition"
              />
            </label>
            <div className="flex shrink-0 gap-2">
              <PrimaryBtn disabled={shareCouponMutation.isPending} onClick={handleShareCoupon}>
                {shareCouponMutation.isPending ? 'Sending…' : 'Send Coupon'}
              </PrimaryBtn>
              <GhostBtn
                disabled={shareCouponMutation.isPending}
                onClick={() => {
                  setShareOpen(false)
                  setShareEmail('')
                }}
              >
                Cancel
              </GhostBtn>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}

function CouponSectionDynamic({
  createCouponMutation,
  updateCouponMutation,
  deleteCouponMutation,
}) {
  const [form, setForm] = useState(BLANK_COUPON_FORM)
  const [currentPage, setCurrentPage] = useState(1)
  const couponsQuery = useAdminCoupons({ page: currentPage, limit: 10 })
  const coupons = couponsQuery.data?.coupons ?? []
  const totalPages = Math.max(1, Number(couponsQuery.data?.pages ?? 1))
  const visiblePage = Math.min(currentPage, totalPages)
  const isSectionLoading = couponsQuery.isFetching && !couponsQuery.isLoading
  useScrollToTop(currentPage)
  const setField = (key, value) => setForm(current => ({ ...current, [key]: value }))

  if (couponsQuery.isLoading) return <LoadingState label="Loading coupons..." />
  if (couponsQuery.error) return <ErrorState label="Coupons are unavailable right now." />

  function handleCreate() {
    createCouponMutation.mutate(
      {
        code: form.code,
        title: form.title || undefined,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        min_order_value: form.min_order_value ? Number(form.min_order_value) : 0,
        max_order_value: form.max_order_value ? Number(form.max_order_value) : null,
        terms_customer: form.terms_customer || null,
        admin_notes: form.admin_notes || null,
        first_order_only: form.first_order_only === true || form.first_order_only === 'true',
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        used_count: Number(form.used_count || 0),
        valid_from: form.valid_from || null,
        valid_to: form.valid_to || null,
        is_active: Boolean(form.is_active),
      },
      { onSuccess: () => setForm(BLANK_COUPON_FORM) }
    )
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#E4DED8] bg-[#FBF7F3] p-5">
        <h3 className="mb-4 text-base font-semibold text-[#1C1C1C]">Generate Discount Coupon</h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {COUPON_FIELDS.map(field =>
            renderFormField({
              field: {
                ...field,
                placeholder:
                  field.key === 'discount_value'
                    ? form.discount_type === 'percentage'
                      ? 'Discount % (e.g. 20)'
                      : 'Discount Rs (e.g. 500)'
                    : field.placeholder,
              },
              value: form[field.key] ?? '',
              onChange: (key, value) =>
                setField(key, key === 'code' ? String(value).toUpperCase() : value),
              selectClassName: 'bg-[#F3F3F3]',
            })
          )}
        </div>
        <div className="mt-4">
          <PrimaryBtn
            disabled={createCouponMutation.isPending || !form.code || !form.discount_value}
            onClick={handleCreate}
          >
            {createCouponMutation.isPending ? 'Creating...' : 'Create Coupon'}
          </PrimaryBtn>
        </div>
      </div>

      {isSectionLoading ? (
        <SectionLoadingState label="Loading coupons..." />
      ) : coupons.length ? (
        <div className="space-y-2.5">
          {coupons.map(coupon => (
            <CouponRowDynamic
              key={coupon.id}
              coupon={coupon}
              updateCouponMutation={updateCouponMutation}
              deleteCouponMutation={deleteCouponMutation}
            />
          ))}
          <PaginationControls
            currentPage={visiblePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      ) : (
        <EmptyState
          title="No coupons yet"
          body="Create your first coupon above to manage promotional offers."
        />
      )}
    </div>
  )
}

function SettingsSectionDynamic({ workspaceSettings, updateSettingsMutation }) {
  const [form, setForm] = useState(settingsFormFromSource(workspaceSettings))
  const setField = (key, value) => setForm(current => ({ ...current, [key]: value }))

  useEffect(() => {
    const timer = setTimeout(() => {
      setForm(settingsFormFromSource(workspaceSettings))
    }, 0)
    return () => clearTimeout(timer)
  }, [workspaceSettings])

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 rounded-2xl border border-[#E4DED8] bg-white p-5 md:grid-cols-4">
        {[
          { label: 'Advance %', value: `${form.advance_payment_percentage || 0}%` },
          { label: 'Phone', value: form.primary_phone || '-' },
          { label: 'Email', value: form.support_email || '-' },
          { label: 'WhatsApp', value: form.whatsapp_number || '-' },
        ].map(item => (
          <div key={item.label}>
            <p className="text-[11px] uppercase tracking-widest text-[#8F8F8F]">{item.label}</p>
            <p className="mt-0.5 text-sm font-medium text-[#2D2D2D]">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[#E4DED8] bg-[#FBF7F3] p-5">
        <h3 className="mb-4 text-base font-semibold text-[#1C1C1C]">Edit Settings</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {SETTINGS_FIELDS.map(field =>
            renderFormField({
              field,
              value: form[field.key] ?? '',
              onChange: setField,
            })
          )}
        </div>
        <div className="mt-4">
          <PrimaryBtn
            disabled={updateSettingsMutation.isPending}
            onClick={() =>
              updateSettingsMutation.mutate({
                ...form,
                advance_payment_percentage: Number(form.advance_payment_percentage || 0),
              })
            }
          >
            {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
          </PrimaryBtn>
        </div>
      </div>
    </div>
  )
}

function RefundsSection({ processRefundMutation }) {
  const refundsQuery = useAdminRefunds()
  const refunds = refundsQuery.data?.refunds ?? []

  if (refundsQuery.isLoading) return <LoadingState label="Loading refunds..." />
  if (refundsQuery.error) return <ErrorState label="Refunds are unavailable right now." />

  return refunds.length ? (
    <div className="space-y-2.5">
      {refunds.map(refund => (
        <RefundRow key={refund.id} refund={refund} processRefundMutation={processRefundMutation} />
      ))}
    </div>
  ) : (
    <EmptyState title="No refunds yet" body="Cancelled booking refunds will appear here." />
  )
}

// ---------------------------------------------------------------------------
// Main sections config
// ---------------------------------------------------------------------------
const mainSections = [
  { key: 'customer', label: 'Customer Payments' },
  { key: 'vendor', label: 'Vendor Payouts' },
  { key: 'coupon', label: 'Discount Coupons' },
  { key: 'settings', label: 'Settings' },
  { key: 'refunds', label: 'Refunds' },
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function PaymentManagementPage() {
  const [searchParams] = useSearchParams()
  const sectionParam = String(searchParams.get('section') ?? '').trim()
  const tabParam = String(searchParams.get('tab') ?? '').trim()
  const [section, setSection] = useState(
    mainSections.some(item => item.key === sectionParam) ? sectionParam : 'customer'
  )

  useEffect(() => {
    if (mainSections.some(item => item.key === sectionParam)) {
      setSection(sectionParam)
    }
  }, [sectionParam])

  const workspaceQuery = useAdminPaymentWorkspace()
  const settingsQuery = useAdminSettings()
  const vendorsQuery = useAdminVendors({ limit: 100, status: 'approved' })
  const bookingsQuery = useAdminBookings({ bucket: 'active', limit: 100 })
  const processRefundMutation = useAdminProcessRefund()
  const createVendorPayoutMutation = useAdminCreateVendorPayout()
  const updateVendorPayoutMutation = useAdminUpdateVendorPayout()
  const createCouponMutation = useAdminCreateCoupon()
  const updateCouponMutation = useAdminUpdateCoupon()
  const deleteCouponMutation = useAdminDeleteCoupon()
  const updateSettingsMutation = useAdminUpdateSettings()

  if (workspaceQuery.isLoading) {
    return <LoadingState label="Loading payment operations…" />
  }
  if (workspaceQuery.error) {
    return <ErrorState label="Payment operations could not be loaded right now." />
  }

  const workspace = workspaceQuery.data ?? {}
  const summary = workspace.summary ?? {}
  const settings = settingsQuery.data ?? workspace.settings ?? null

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl text-[#1C1C1C]">Payment Management</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Manage customer payments, vendor payouts, discount coupons, and advance settings.
        </p>
      </div>

      {/* ── Metrics ── */}
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Collected"
          value={formatCurrency(summary.collectedAmount)}
          helper="Successful payments"
        />
        <MetricCard
          label="Pending"
          value={formatCurrency(summary.pendingAmount)}
          helper="Open payment records"
        />
        <MetricCard
          label="Outstanding"
          value={formatCurrency(summary.totalOutstanding)}
          helper="Remaining balances"
        />
        <MetricCard
          label="Vendor Payouts"
          value={formatCurrency(summary.vendorPayoutPendingAmount)}
          helper="Pending settlements"
        />
        <MetricCard
          label="Advance %"
          value={`${settings?.advance_payment_percentage ?? summary.advancePaymentPercentage ?? 30}%`}
          helper="Global default"
        />
      </div>

      {/* ── Section tabs ── */}
      <div className="rounded-2xl border border-[#E4DED8] bg-[#FAFAFA] p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#767676]">
          Section
        </p>
        <Tabs items={mainSections} value={section} onChange={setSection} />
      </div>

      {/* ── Content area ── */}
      <div>
        {section === 'customer' && (
          <CustomerPayments
            key={`customer-${tabParam || 'today'}`}
            processRefundMutation={processRefundMutation}
            initialTab={tabParam}
          />
        )}

        {section === 'vendor' && (
          <VendorPayments
            vendorsQuery={vendorsQuery}
            bookingsQuery={bookingsQuery}
            createVendorPayoutMutation={createVendorPayoutMutation}
            updateVendorPayoutMutation={updateVendorPayoutMutation}
          />
        )}

        {section === 'coupon' && (
          <CouponSectionDynamic
            createCouponMutation={createCouponMutation}
            updateCouponMutation={updateCouponMutation}
            deleteCouponMutation={deleteCouponMutation}
          />
        )}

        {section === 'settings' && (
          <SettingsSectionDynamic
            key={settings?.documentId ?? settings?.updatedAt ?? 'settings'}
            workspaceSettings={settings}
            updateSettingsMutation={updateSettingsMutation}
          />
        )}

        {section === 'refunds' && <RefundsSection processRefundMutation={processRefundMutation} />}
      </div>
    </div>
  )
}
