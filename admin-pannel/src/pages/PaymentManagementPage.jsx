import { useState } from 'react'
import { EmptyState, ErrorState, LoadingState, SelectField } from '../components/ui/AdminUI'
import {
  useAdminBookings,
  useAdminCoupons,
  useAdminCreateCoupon,
  useAdminCreateVendorPayout,
  useAdminPaymentWorkspace,
  useAdminProcessRefund,
  useAdminSettings,
  useAdminUpdateCoupon,
  useAdminUpdateSettings,
  useAdminUpdateVendorPayout,
  useAdminVendors,
} from '../hooks/useAdminData'
import { getAdminBadgeClass } from '../lib/adminBadges'
import { formatCurrency, formatDate, formatDateTime } from '../lib/formatters'

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

function Input({ type = 'text', value, onChange, placeholder, className = '' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`h-10 w-full rounded-lg border border-[#E4DED8] bg-[#F3F3F3] px-4 text-sm text-[#2D2D2D] placeholder:text-[#8F8F8F] outline-none focus:border-[#CDB17E] focus:ring-1 focus:ring-[#CDB17E] transition ${className}`}
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
      className="w-full rounded-lg border border-[#E4DED8] bg-[#F3F3F3] px-4 py-3 text-sm text-[#2D2D2D] placeholder:text-[#8F8F8F] outline-none focus:border-[#CDB17E] focus:ring-1 focus:ring-[#CDB17E] transition resize-none"
    />
  )
}

function PrimaryBtn({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center justify-center rounded-full bg-[#CDB17E] px-5 text-sm font-semibold text-[#FAFAFA] transition hover:bg-[#C6A15B] hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
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
      className="inline-flex h-10 items-center justify-center rounded-full border border-[#E4DED8] bg-white px-5 text-sm font-semibold text-[#591902] transition hover:bg-[#F4EFE5] hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
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
      className="inline-flex h-10 items-center justify-center rounded-full border border-[#FECACA] bg-[#FFF3F3] px-5 text-sm font-semibold text-[#8A1C1C] transition hover:bg-[#FFE4E4] hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {children}
    </button>
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

function BookingPaymentRow({ booking }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-[#E4DED8] bg-white px-4 py-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#1C1C1C]">
          {booking.customer?.name || 'Customer'}
          <span className="ml-2 font-normal text-[#6B7280]">
            / {booking.package?.title || booking.id}
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
        <Badge
          status={booking.vendorAssignments?.length ? 'assigned' : 'unassigned'}
          label={booking.vendorAssignments?.length ? 'Vendor assigned' : 'No vendor'}
        />
      </div>
    </div>
  )
}

function PaymentRecordRow({
  payment,
  showRefundActions = false,
  onRefundAction,
  isRefundBusy = false,
}) {
  const pendingRefund = payment.refunds?.find(r => r.status === 'requested')
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-[#E4DED8] bg-white px-4 py-4">
      <div className="flex-1 min-w-0">
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
        <Badge status={payment.paymentMethod} label={payment.paymentMethod || 'Method pending'} />
        {showRefundActions && pendingRefund && (
          <>
            <PrimaryBtn
              disabled={isRefundBusy}
              onClick={() => onRefundAction?.(pendingRefund.id, 'approve')}
            >
              Approve Refund
            </PrimaryBtn>
            <DangerBtn
              disabled={isRefundBusy}
              onClick={() => onRefundAction?.(pendingRefund.id, 'reject')}
            >
              Reject
            </DangerBtn>
          </>
        )}
      </div>
    </div>
  )
}

function PayoutRow({ payout, onMark, isBusy = false }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-[#E4DED8] bg-white px-4 py-4">
      <div className="flex-1 min-w-0">
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
            <PrimaryBtn disabled={isBusy} onClick={() => onMark?.(payout.id, 'paid')}>
              Mark Paid
            </PrimaryBtn>
            <DangerBtn disabled={isBusy} onClick={() => onMark?.(payout.id, 'failed')}>
              Mark Failed
            </DangerBtn>
          </>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section: Customer Payments
// ---------------------------------------------------------------------------
const customerTabs = [
  { key: 'active', label: 'Active Bookings' },
  { key: 'post_event', label: 'Post-Event Pending' },
  { key: 'failed', label: 'Failed Payments' },
  { key: 'completed', label: 'Completed' },
]

function CustomerPayments({ customerPayments, processRefundMutation }) {
  const [tab, setTab] = useState('active')

  const lists = {
    active: customerPayments.activeBookings ?? [],
    post_event: customerPayments.postEventPending ?? [],
    failed: customerPayments.failedPayments ?? [],
    completed: customerPayments.completedPayments ?? [],
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg text-[#1C1C1C]">Customer Payments</h2>

        <div className="ml-auto w-full max-w-[260px] md:w-[260px]">
          <SelectField
            value={tab}
            onChange={setTab}
            placeholder="Select Tab"
            className="h-[42px] rounded-full border border-[#E4DED8] bg-white px-4 text-sm font-medium text-[#1C1C1C]"
          >
            {customerTabs.map(item => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </SelectField>
        </div>
      </div>

      {/* Active bookings */}
      {tab === 'active' &&
        (lists.active.length ? (
          <div className="space-y-2.5">
            {lists.active.map(b => (
              <BookingPaymentRow key={b.id} booking={b} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No active booking balances"
            body="Active bookings with payment context will appear here."
          />
        ))}

      {/* Post-event */}
      {tab === 'post_event' &&
        (lists.post_event.length ? (
          <div className="space-y-2.5">
            {lists.post_event.map(b => (
              <div
                key={b.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-[#E4DED8] bg-white px-4 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#1C1C1C]">
                    {b.customer?.name || 'Customer'}
                    <span className="ml-2 font-normal text-[#6B7280]">
                      / {b.package?.title || b.id}
                    </span>
                  </p>

                  <p className="mt-1 text-xs text-[#8F8F8F]">
                    Balance due:{' '}
                    <span className="font-medium text-[#2D2D2D]">
                      {formatCurrency(b.outstandingAmount)}
                    </span>
                  </p>
                </div>

                <div className="flex gap-2">
                  <Badge status={b.status} label={b.statusLabel} />

                  <Badge
                    status={b.outstandingAmount > 0 ? 'pending' : 'resolved'}
                    label={b.outstandingAmount > 0 ? 'Reminder needed' : 'Settled'}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No post-event pending payments"
            body="Outstanding post-event balances will appear here."
          />
        ))}

      {/* Failed */}
      {tab === 'failed' &&
        (lists.failed.length ? (
          <div className="space-y-2.5">
            {lists.failed.map(p => (
              <PaymentRecordRow
                key={p.id}
                payment={p}
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
          </div>
        ) : (
          <EmptyState
            title="No failed payments"
            body="Failed transactions needing follow-up will appear here."
          />
        ))}

      {/* Completed */}
      {tab === 'completed' &&
        (lists.completed.length ? (
          <div className="space-y-2.5">
            {lists.completed.map(p => (
              <PaymentRecordRow key={p.id} payment={p} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No completed payments"
            body="Successful and refunded records will appear here."
          />
        ))}
    </div>
  )
}
// ---------------------------------------------------------------------------
// Section: Vendor Payments
// ---------------------------------------------------------------------------
const vendorTabs = [
  { key: 'pending', label: 'Pending Payouts' },
  { key: 'paid', label: 'Paid' },
]

function VendorPayments({
  vendorPayments,
  vendorsQuery,
  bookingsQuery,
  createVendorPayoutMutation,
  updateVendorPayoutMutation,
}) {
  const [tab, setTab] = useState('pending')
  const [vendorId, setVendorId] = useState('')
  const [bookingId, setBookingId] = useState('')
  const [payoutAmount, setPayoutAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('offline')

  return (
    <div className="space-y-5">
      {/* Create payout form */}
      <div className="rounded-2xl border border-[#E4DED8] bg-[#FBF7F3] p-5">
        <h3 className="mb-4 text-base font-semibold text-[#1C1C1C]">Create Vendor Payout</h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SelectField
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
          </SelectField>
          <SelectField
            value={bookingId}
            onChange={setBookingId}
            placeholder="Select booking"
            className="min-h-10 bg-[#F3F3F3]"
          >
            <option value="">Select booking…</option>
            {(bookingsQuery.data?.bookings ?? []).map(b => (
              <option key={b.id} value={b.id}>
                {b.package?.title || b.event?.name || b.id}
              </option>
            ))}
          </SelectField>
          <Input
            type="number"
            value={payoutAmount}
            onChange={e => setPayoutAmount(e.target.value)}
            placeholder="Amount (₹)"
            className="rounded-full"
          />
          <SelectField
            value={paymentMethod}
            onChange={setPaymentMethod}
            placeholder="Select payment method"
            className="min-h-10 bg-[#F3F3F3]"
          >
            <option value="offline">Offline</option>
            <option value="portal">Portal</option>
          </SelectField>
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

      <Tabs items={vendorTabs} value={tab} onChange={setTab} size="sm" />

      {tab === 'pending' &&
        ((vendorPayments.pending ?? []).length ? (
          <div className="space-y-2.5">
            {vendorPayments.pending.map(p => (
              <PayoutRow
                key={p.id}
                payout={p}
                isBusy={updateVendorPayoutMutation.isPending}
                onMark={(id, status) =>
                  updateVendorPayoutMutation.mutate({ payoutId: id, body: { status } })
                }
              />
            ))}
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
            {vendorPayments.paid.map(p => (
              <PayoutRow key={p.id} payout={p} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No paid vendors yet"
            body="Paid settlements will appear here once processed."
          />
        ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section: Coupons
// ---------------------------------------------------------------------------
const BLANK_COUPON_FORM = {
  code: '',
  discount_type: 'percentage',
  discount_value: '',
  max_uses: '',
  used_count: '0',
  valid_from: '',
  valid_to: '',
  is_active: true,
}

function CouponRow({ coupon, updateCouponMutation }) {
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const setE = (key, val) => setEditForm(f => ({ ...f, [key]: val }))

  function openEdit() {
    setEditForm({
      discount_type: coupon.discount_type ?? 'percentage',
      discount_value: String(coupon.discount_value ?? ''),
      max_uses: coupon.max_uses != null ? String(coupon.max_uses) : '',
      valid_from: coupon.valid_from ?? '',
      valid_to: coupon.valid_to ?? '',
    })
    setEditing(true)
  }

  function saveEdit() {
    updateCouponMutation.mutate(
      {
        couponId: coupon.id,
        body: {
          discount_type: editForm.discount_type,
          discount_value: Number(editForm.discount_value),
          max_uses: editForm.max_uses ? Number(editForm.max_uses) : null,
          valid_from: editForm.valid_from || null,
          valid_to: editForm.valid_to || null,
        },
      },
      { onSuccess: () => setEditing(false) }
    )
  }

  return (
    <div className="rounded-2xl border border-[#E4DED8] bg-white px-4 py-4 space-y-3">
      {/* Row header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#1C1C1C]">{coupon.code}</p>
          <p className="mt-1 text-xs text-[#8F8F8F]">
            {coupon.discount_type === 'percentage'
              ? `${coupon.discount_value}% off`
              : `₹${coupon.discount_value} off`}
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
          <GhostBtn
            disabled={updateCouponMutation.isPending}
            onClick={() =>
              updateCouponMutation.mutate({
                couponId: coupon.id,
                body: { is_active: !coupon.is_active },
              })
            }
          >
            {coupon.is_active ? 'Disable' : 'Enable'}
          </GhostBtn>
          <GhostBtn onClick={editing ? () => setEditing(false) : openEdit}>
            {editing ? 'Cancel' : 'Edit'}
          </GhostBtn>
        </div>
      </div>

      {/* Inline edit form */}
      {editing && (
        <div className="border-t border-[#E4DED8] pt-3">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SelectField
              value={editForm.discount_type}
              onChange={v => setE('discount_type', v)}
              className="min-h-10 bg-[#F3F3F3]"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="flat">Flat amount (₹)</option>
            </SelectField>
            <Input
              type="number"
              value={editForm.discount_value}
              onChange={e => setE('discount_value', e.target.value)}
              placeholder="Discount value"
            />
            <Input
              type="number"
              value={editForm.max_uses}
              onChange={e => setE('max_uses', e.target.value)}
              placeholder="Max uses (blank = unlimited)"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="mb-1 text-xs text-[#8F8F8F]">Valid from</p>
                <Input
                  type="date"
                  value={editForm.valid_from}
                  onChange={e => setE('valid_from', e.target.value)}
                />
              </div>
              <div>
                <p className="mb-1 text-xs text-[#8F8F8F]">Valid to</p>
                <Input
                  type="date"
                  value={editForm.valid_to}
                  onChange={e => setE('valid_to', e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <PrimaryBtn
              disabled={updateCouponMutation.isPending || !editForm.discount_value}
              onClick={saveEdit}
            >
              {updateCouponMutation.isPending ? 'Saving…' : 'Save Changes'}
            </PrimaryBtn>
            <GhostBtn onClick={() => setEditing(false)}>Cancel</GhostBtn>
          </div>
        </div>
      )}
    </div>
  )
}

function CouponSection({ coupons, createCouponMutation, updateCouponMutation }) {
  const [form, setForm] = useState(BLANK_COUPON_FORM)
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  function handleCreate() {
    createCouponMutation.mutate(
      {
        ...form,
        discount_value: Number(form.discount_value),
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        used_count: Number(form.used_count || 0),
      },
      { onSuccess: () => setForm(BLANK_COUPON_FORM) }
    )
  }

  return (
    <div className="space-y-5">
      {/* Create form */}
      <div className="rounded-2xl border border-[#E4DED8] bg-[#FBF7F3] p-5">
        <h3 className="mb-4 text-base font-semibold text-[#1C1C1C]">Generate Discount Coupon</h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Input
            value={form.code}
            onChange={e => set('code', e.target.value.toUpperCase())}
            placeholder="Coupon code (e.g. SAVE20)"
          />
          <SelectField
            value={form.discount_type}
            onChange={v => set('discount_type', v)}
            placeholder="Discount type"
            className="min-h-10 rounded-lg bg-[#F3F3F3]"
          >
            <option value="percentage">Percentage (%)</option>
            <option value="flat">Flat amount (₹)</option>
          </SelectField>
          <Input
            type="number"
            value={form.discount_value}
            onChange={e => set('discount_value', e.target.value)}
            placeholder={
              form.discount_type === 'percentage' ? 'Discount % (e.g. 20)' : 'Discount ₹ (e.g. 500)'
            }
          />
          <Input
            type="number"
            value={form.max_uses}
            onChange={e => set('max_uses', e.target.value)}
            placeholder="Max uses (blank = unlimited)"
          />
          <div>
            <p className="mb-1 text-xs text-[#8F8F8F]">Valid from</p>
            <Input
              type="date"
              value={form.valid_from}
              onChange={e => set('valid_from', e.target.value)}
            />
          </div>
          <div>
            <p className="mb-1 text-xs text-[#8F8F8F]">Valid to</p>
            <Input
              type="date"
              value={form.valid_to}
              onChange={e => set('valid_to', e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4">
          <PrimaryBtn
            disabled={createCouponMutation.isPending || !form.code || !form.discount_value}
            onClick={handleCreate}
          >
            {createCouponMutation.isPending ? 'Creating…' : 'Create Coupon'}
          </PrimaryBtn>
        </div>
      </div>

      {/* Coupon list */}
      {coupons.length ? (
        <div className="space-y-2.5">
          {coupons.map(coupon => (
            <CouponRow
              key={coupon.id}
              coupon={coupon}
              updateCouponMutation={updateCouponMutation}
            />
          ))}
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

// ---------------------------------------------------------------------------
// Section: Settings
// ---------------------------------------------------------------------------
function SettingsSection({ updateSettingsMutation }) {
  const [form, setForm] = useState({
    advance_payment_percentage: '',
    primary_phone: '',
    support_email: '',
    whatsapp_number: '',
    support_availability_text: '',
    response_expectation_text: '',
  })
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  return (
    <div className="space-y-5">
      {/* Current values */}
      <div className="grid grid-cols-2 gap-4 rounded-2xl border border-[#E4DED8] bg-white p-5 md:grid-cols-4">
        {[
          { label: 'Advance %', value: `${form.advance_payment_percentage || 0}%` },
          { label: 'Phone', value: form.primary_phone || '—' },
          { label: 'Email', value: form.support_email || '—' },
          { label: 'WhatsApp', value: form.whatsapp_number || '—' },
        ].map(f => (
          <div key={f.label}>
            <p className="text-[11px] uppercase tracking-widest text-[#8F8F8F]">{f.label}</p>
            <p className="mt-0.5 text-sm font-medium text-[#2D2D2D]">{f.value}</p>
          </div>
        ))}
      </div>

      {/* Edit form */}
      <div className="rounded-2xl border border-[#E4DED8] bg-[#FBF7F3] p-5">
        <h3 className="mb-4 text-base font-semibold text-[#1C1C1C]">Edit Settings</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs text-[#8F8F8F]">Advance payment %</p>
            <Input
              type="number"
              value={form.advance_payment_percentage}
              onChange={e => set('advance_payment_percentage', e.target.value)}
              placeholder="e.g. 30"
            />
          </div>
          <div>
            <p className="mb-1 text-xs text-[#8F8F8F]">Primary phone</p>
            <Input
              value={form.primary_phone}
              onChange={e => set('primary_phone', e.target.value)}
              placeholder="+91 …"
            />
          </div>
          <div>
            <p className="mb-1 text-xs text-[#8F8F8F]">Support email</p>
            <Input
              value={form.support_email}
              onChange={e => set('support_email', e.target.value)}
              placeholder="support@…"
            />
          </div>
          <div>
            <p className="mb-1 text-xs text-[#8F8F8F]">WhatsApp number</p>
            <Input
              value={form.whatsapp_number}
              onChange={e => set('whatsapp_number', e.target.value)}
              placeholder="+91 …"
            />
          </div>
          <div>
            <p className="mb-1 text-xs text-[#8F8F8F]">Support availability note</p>
            <Textarea
              value={form.support_availability_text}
              onChange={e => set('support_availability_text', e.target.value)}
              placeholder="e.g. Mon–Sat, 10am–7pm"
              rows={2}
            />
          </div>
          <div>
            <p className="mb-1 text-xs text-[#8F8F8F]">Response expectation note</p>
            <Textarea
              value={form.response_expectation_text}
              onChange={e => set('response_expectation_text', e.target.value)}
              placeholder="e.g. Replies within 4 hours"
              rows={2}
            />
          </div>
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
            {updateSettingsMutation.isPending ? 'Saving…' : 'Save Settings'}
          </PrimaryBtn>
        </div>
      </div>
    </div>
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
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function PaymentManagementPage() {
  const [section, setSection] = useState('customer')

  const workspaceQuery = useAdminPaymentWorkspace()
  const couponsQuery = useAdminCoupons({ limit: 50 })
  const settingsQuery = useAdminSettings()
  const vendorsQuery = useAdminVendors({ limit: 100, status: 'approved' })
  const bookingsQuery = useAdminBookings({ bucket: 'active', limit: 100 })
  const processRefundMutation = useAdminProcessRefund()
  const createVendorPayoutMutation = useAdminCreateVendorPayout()
  const updateVendorPayoutMutation = useAdminUpdateVendorPayout()
  const createCouponMutation = useAdminCreateCoupon()
  const updateCouponMutation = useAdminUpdateCoupon()
  const updateSettingsMutation = useAdminUpdateSettings()

  if (workspaceQuery.isLoading) {
    return <LoadingState label="Loading payment operations…" />
  }
  if (workspaceQuery.error) {
    return <ErrorState label="Payment operations could not be loaded right now." />
  }

  const workspace = workspaceQuery.data ?? {}
  const summary = workspace.summary ?? {}
  const customerPayments = workspace.customerPayments ?? {}
  const vendorPayments = workspace.vendorPayments ?? {}
  const coupons = couponsQuery.data?.coupons ?? workspace.coupons ?? []
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
      <div className="rounded-2xl border border-[#E4DED8] bg-[#FBF7F3] p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#767676]">
          Section
        </p>
        <Tabs items={mainSections} value={section} onChange={setSection} />
      </div>

      {/* ── Content area ── */}
      <div>
        {section === 'customer' && (
          <CustomerPayments
            customerPayments={customerPayments}
            processRefundMutation={processRefundMutation}
          />
        )}

        {section === 'vendor' && (
          <VendorPayments
            vendorPayments={vendorPayments}
            vendorsQuery={vendorsQuery}
            bookingsQuery={bookingsQuery}
            createVendorPayoutMutation={createVendorPayoutMutation}
            updateVendorPayoutMutation={updateVendorPayoutMutation}
          />
        )}

        {section === 'coupon' && (
          <CouponSection
            coupons={coupons}
            createCouponMutation={createCouponMutation}
            updateCouponMutation={updateCouponMutation}
          />
        )}

        {section === 'settings' && (
          <SettingsSection
            key={settings?.documentId ?? settings?.updatedAt ?? 'settings'}
            workspaceSettings={settings}
            updateSettingsMutation={updateSettingsMutation}
          />
        )}
      </div>
    </div>
  )
}
