import { useEffect, useState } from 'react'
import {
  ActionButton,
  EmptyState,
  ErrorState,
  FieldList,
  InputField,
  LoadingState,
  MetricCard,
  PageIntro,
  Panel,
  SelectField,
  StatusBadge,
  TextAreaField,
} from '../components/ui/AdminUI'
import {
  useAdminBookings,
  useAdminCreateCoupon,
  useAdminCreateVendorPayout,
  useAdminPaymentWorkspace,
  useAdminProcessRefund,
  useAdminUpdateCoupon,
  useAdminUpdateSettings,
  useAdminUpdateVendorPayout,
  useAdminVendors,
} from '../hooks/useAdminData'
import { formatCurrency, formatDate, formatDateTime } from '../lib/formatters'

const paymentSections = [
  { key: 'customer', label: 'Customer Payment History' },
  { key: 'vendor', label: 'Vendor Payment History' },
  { key: 'coupon', label: 'Generate Discount Coupon' },
  { key: 'settings', label: 'Advance Payment Settings' },
]

const customerTabs = [
  { key: 'active', label: 'Active Bookings' },
  { key: 'post_event', label: 'Post-Event Pending' },
  { key: 'failed', label: 'Failed Payments' },
  { key: 'completed', label: 'Completed Payments' },
]

const vendorTabs = [
  { key: 'pending', label: 'Pending Vendor Payments' },
  { key: 'paid', label: 'Paid Vendors' },
]

function SectionTabs({ items, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(item => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={`rounded-full px-4 py-2 text-sm transition ${
            value === item.key ? 'bg-[#5D2E17] text-white' : 'bg-white text-[#6F6257]'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

function BookingPaymentRow({ booking }) {
  return (
    <div className="rounded-[24px] bg-white px-4 py-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-base font-medium text-[#2B211B]">
            {booking.customer?.name || 'Customer'} / {booking.package?.title || booking.id}
          </p>
          <p className="mt-1 text-sm text-[#6F6257]">
            {formatDate(booking.eventDate)} / {booking.locationSummary || 'Venue pending'}
          </p>
          <p className="mt-2 text-sm text-[#6F6257]">
            Paid {formatCurrency(booking.paidAmount)} / Remaining {formatCurrency(booking.outstandingAmount)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={booking.status} label={booking.statusLabel} />
          <StatusBadge
            status={booking.vendorAssignments?.length ? 'confirmed' : 'pending'}
            label={booking.vendorAssignments?.length ? 'Vendor assigned' : 'Vendor unassigned'}
          />
        </div>
      </div>
    </div>
  )
}

function PaymentRecordRow({ payment, showRefundActions = false, onRefundAction, isRefundBusy = false }) {
  return (
    <div className="rounded-[24px] bg-white px-4 py-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-base font-medium text-[#2B211B]">
            {payment.bookingSummary?.customer?.name || 'Customer'} /{' '}
            {payment.bookingSummary?.package?.title || payment.bookingId}
          </p>
          <p className="mt-1 text-sm text-[#6F6257]">
            {payment.paymentType} / {formatCurrency(payment.amount)} / {formatDateTime(payment.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={payment.status} />
          <StatusBadge status={payment.paymentMethod} label={payment.paymentMethod || 'Method pending'} />
          {showRefundActions && payment.refunds?.some(refund => refund.status === 'requested') ? (
            <>
              <ActionButton
                className="min-h-9 px-3"
                disabled={isRefundBusy}
                onClick={() => onRefundAction?.(payment.refunds.find(refund => refund.status === 'requested')?.id, 'approve')}
              >
                Approve Refund
              </ActionButton>
              <ActionButton
                tone="danger"
                className="min-h-9 px-3"
                disabled={isRefundBusy}
                onClick={() => onRefundAction?.(payment.refunds.find(refund => refund.status === 'requested')?.id, 'reject')}
              >
                Reject Refund
              </ActionButton>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function PayoutRow({ payout, onMark, isBusy = false }) {
  return (
    <div className="rounded-[24px] bg-white px-4 py-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-base font-medium text-[#2B211B]">
            {payout.vendor?.companyName || payout.vendorId} / {formatCurrency(payout.amount)}
          </p>
          <p className="mt-1 text-sm text-[#6F6257]">
            {payout.bookingSummary?.package?.title || payout.bookingId} / {formatDateTime(payout.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={payout.status} />
          <StatusBadge status={payout.paymentMethod} label={payout.paymentMethod || 'Offline'} />
          {payout.status === 'pending' ? (
            <>
              <ActionButton className="min-h-9 px-3" disabled={isBusy} onClick={() => onMark?.(payout.id, 'paid')}>
                Mark Paid
              </ActionButton>
              <ActionButton tone="danger" className="min-h-9 px-3" disabled={isBusy} onClick={() => onMark?.(payout.id, 'failed')}>
                Mark Failed
              </ActionButton>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function PaymentManagementPage() {
  const [section, setSection] = useState('customer')
  const [customerTab, setCustomerTab] = useState('active')
  const [vendorTab, setVendorTab] = useState('pending')
  const [vendorId, setVendorId] = useState('')
  const [bookingId, setBookingId] = useState('')
  const [payoutAmount, setPayoutAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('offline')
  const [couponForm, setCouponForm] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    max_uses: '',
    valid_from: '',
    valid_to: '',
  })
  const [settingsForm, setSettingsForm] = useState({
    advance_payment_percentage: '',
    primary_phone: '',
    support_email: '',
    whatsapp_number: '',
    support_availability_text: '',
    response_expectation_text: '',
  })

  const workspaceQuery = useAdminPaymentWorkspace()
  const vendorsQuery = useAdminVendors({ limit: 100, status: 'approved' })
  const bookingsQuery = useAdminBookings({ bucket: 'active', limit: 100 })
  const processRefundMutation = useAdminProcessRefund()
  const createVendorPayoutMutation = useAdminCreateVendorPayout()
  const updateVendorPayoutMutation = useAdminUpdateVendorPayout()
  const createCouponMutation = useAdminCreateCoupon()
  const updateCouponMutation = useAdminUpdateCoupon()
  const updateSettingsMutation = useAdminUpdateSettings()

  useEffect(() => {
    const settings = workspaceQuery.data?.settings
    if (!settings) return

    setSettingsForm({
      advance_payment_percentage: settings.advance_payment_percentage ?? '',
      primary_phone: settings.primary_phone ?? '',
      support_email: settings.support_email ?? '',
      whatsapp_number: settings.whatsapp_number ?? '',
      support_availability_text: settings.support_availability_text ?? '',
      response_expectation_text: settings.response_expectation_text ?? '',
    })
  }, [workspaceQuery.data?.settings?.documentId, workspaceQuery.data?.settings?.updatedAt])

  if (workspaceQuery.isLoading) {
    return <LoadingState label="Loading payment operations..." />
  }

  if (workspaceQuery.error) {
    return <ErrorState label="Payment operations could not be loaded right now." />
  }

  const workspace = workspaceQuery.data ?? {}
  const summary = workspace.summary ?? {}
  const customerPayments = workspace.customerPayments ?? {}
  const vendorPayments = workspace.vendorPayments ?? {}
  const coupons = workspace.coupons ?? []

  return (
    <div className="space-y-6">
      <PageIntro
        title="Payment Management"
        subtitle="Live payment operations arranged using the IA breakdown: customer history, vendor settlements, discount coupons, and advance payment controls."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Collected" value={formatCurrency(summary.collectedAmount)} helper="Successful payments" />
        <MetricCard label="Pending" value={formatCurrency(summary.pendingAmount)} helper="Open payment records" />
        <MetricCard label="Outstanding" value={formatCurrency(summary.totalOutstanding)} helper="Remaining booking balance" />
        <MetricCard label="Vendor Payouts" value={formatCurrency(summary.vendorPayoutPendingAmount)} helper="Pending settlements" />
        <MetricCard label="Advance %" value={`${summary.advancePaymentPercentage ?? 30}%`} helper="Global default" />
      </div>

      <Panel
        title="Payment Management Workspace"
        subtitle="Choose an IA section and manage the full payment lifecycle from one place."
        action={<SectionTabs items={paymentSections} value={section} onChange={setSection} />}
      >
        {section === 'customer' ? (
          <div className="space-y-6">
            <SectionTabs items={customerTabs} value={customerTab} onChange={setCustomerTab} />

            {customerTab === 'active' ? (
              (customerPayments.activeBookings ?? []).length ? (
                <div className="space-y-3">
                  {customerPayments.activeBookings.map(booking => (
                    <BookingPaymentRow key={booking.id} booking={booking} />
                  ))}
                </div>
              ) : (
                <EmptyState title="No active booking balances" body="Active bookings with payment context will appear here." />
              )
            ) : null}

            {customerTab === 'post_event' ? (
              (customerPayments.postEventPending ?? []).length ? (
                <div className="space-y-3">
                  {customerPayments.postEventPending.map(booking => (
                    <div key={booking.id} className="rounded-[24px] bg-white px-4 py-4">
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                        <div>
                          <p className="text-base font-medium text-[#2B211B]">
                            {booking.customer?.name || 'Customer'} / {booking.package?.title || booking.id}
                          </p>
                          <p className="mt-1 text-sm text-[#6F6257]">
                            Post-event balance due {formatCurrency(booking.outstandingAmount)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge status={booking.status} label={booking.statusLabel} />
                          <StatusBadge status={booking.outstandingAmount > 0 ? 'pending' : 'resolved'} label={booking.outstandingAmount > 0 ? 'Reminder needed' : 'Settled'} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No post-event pending payments" body="Outstanding post-event booking balances will appear here." />
              )
            ) : null}

            {customerTab === 'failed' ? (
              (customerPayments.failedPayments ?? []).length ? (
                <div className="space-y-3">
                  {customerPayments.failedPayments.map(payment => (
                    <PaymentRecordRow
                      key={payment.id}
                      payment={payment}
                      showRefundActions
                      isRefundBusy={processRefundMutation.isPending}
                      onRefundAction={(refundId, action) =>
                        refundId
                          ? processRefundMutation.mutate({
                              refundId,
                              body: { action },
                            })
                          : null
                      }
                    />
                  ))}
                </div>
              ) : (
                <EmptyState title="No failed payments" body="Failed transactions needing follow-up will appear here." />
              )
            ) : null}

            {customerTab === 'completed' ? (
              (customerPayments.completedPayments ?? []).length ? (
                <div className="space-y-3">
                  {customerPayments.completedPayments.map(payment => (
                    <PaymentRecordRow key={payment.id} payment={payment} />
                  ))}
                </div>
              ) : (
                <EmptyState title="No completed payments" body="Successful and refunded payment records will appear here." />
              )
            ) : null}
          </div>
        ) : null}

        {section === 'vendor' ? (
          <div className="space-y-6">
            <div className="rounded-[26px] bg-[#FBF7F4] p-5">
              <h3 className="text-lg font-semibold text-[#2B211B]">Create Vendor Payout</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <SelectField value={vendorId} onChange={setVendorId}>
                  <option value="">Select vendor</option>
                  {(vendorsQuery.data?.vendors ?? []).map(vendor => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.companyName}
                    </option>
                  ))}
                </SelectField>
                <SelectField value={bookingId} onChange={setBookingId}>
                  <option value="">Select booking</option>
                  {(bookingsQuery.data?.bookings ?? []).map(booking => (
                    <option key={booking.id} value={booking.id}>
                      {booking.package?.title || booking.event?.name || booking.id}
                    </option>
                  ))}
                </SelectField>
                <InputField type="number" value={payoutAmount} onChange={event => setPayoutAmount(event.target.value)} placeholder="Amount" />
                <SelectField value={paymentMethod} onChange={setPaymentMethod}>
                  <option value="offline">Offline</option>
                  <option value="portal">Portal</option>
                </SelectField>
              </div>
              <ActionButton
                className="mt-4"
                disabled={createVendorPayoutMutation.isPending || !vendorId || !bookingId || !payoutAmount}
                onClick={() =>
                  createVendorPayoutMutation.mutate({
                    vendorId,
                    bookingId,
                    amount: Number(payoutAmount),
                    paymentMethod,
                  })
                }
              >
                Create Payout
              </ActionButton>
            </div>

            <SectionTabs items={vendorTabs} value={vendorTab} onChange={setVendorTab} />

            {vendorTab === 'pending' ? (
              (vendorPayments.pending ?? []).length ? (
                <div className="space-y-3">
                  {vendorPayments.pending.map(payout => (
                    <PayoutRow
                      key={payout.id}
                      payout={payout}
                      isBusy={updateVendorPayoutMutation.isPending}
                      onMark={(payoutId, status) =>
                        updateVendorPayoutMutation.mutate({
                          payoutId,
                          body: { status },
                        })
                      }
                    />
                  ))}
                </div>
              ) : (
                <EmptyState title="No pending vendor payments" body="Pending vendor payout approvals will appear here." />
              )
            ) : null}

            {vendorTab === 'paid' ? (
              (vendorPayments.paid ?? []).length ? (
                <div className="space-y-3">
                  {vendorPayments.paid.map(payout => (
                    <PayoutRow key={payout.id} payout={payout} />
                  ))}
                </div>
              ) : (
                <EmptyState title="No paid vendors yet" body="Paid vendor settlements will appear here once processed." />
              )
            ) : null}
          </div>
        ) : null}

        {section === 'coupon' ? (
          <div className="space-y-6">
            <div className="rounded-[26px] bg-[#FBF7F4] p-5">
              <h3 className="text-lg font-semibold text-[#2B211B]">Generate Discount Coupon</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <InputField value={couponForm.code} onChange={event => setCouponForm(current => ({ ...current, code: event.target.value }))} placeholder="Code" />
                <SelectField value={couponForm.discount_type} onChange={value => setCouponForm(current => ({ ...current, discount_type: value }))}>
                  <option value="percentage">Percentage</option>
                  <option value="flat">Flat</option>
                </SelectField>
                <InputField type="number" value={couponForm.discount_value} onChange={event => setCouponForm(current => ({ ...current, discount_value: event.target.value }))} placeholder="Discount value" />
                <InputField type="number" value={couponForm.max_uses} onChange={event => setCouponForm(current => ({ ...current, max_uses: event.target.value }))} placeholder="Max uses" />
                <InputField type="date" value={couponForm.valid_from} onChange={event => setCouponForm(current => ({ ...current, valid_from: event.target.value }))} />
                <InputField type="date" value={couponForm.valid_to} onChange={event => setCouponForm(current => ({ ...current, valid_to: event.target.value }))} />
              </div>
              <ActionButton
                className="mt-4"
                disabled={createCouponMutation.isPending || !couponForm.code || !couponForm.discount_value}
                onClick={() =>
                  createCouponMutation.mutate({
                    ...couponForm,
                    discount_value: Number(couponForm.discount_value),
                    max_uses: couponForm.max_uses ? Number(couponForm.max_uses) : null,
                  })
                }
              >
                Create Coupon
              </ActionButton>
            </div>

            {coupons.length ? (
              <div className="space-y-3">
                {coupons.map(coupon => (
                  <div key={coupon.id} className="rounded-[24px] bg-white px-4 py-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <p className="text-base font-medium text-[#2B211B]">{coupon.code}</p>
                        <p className="mt-1 text-sm text-[#6F6257]">
                          {coupon.discount_type} / {coupon.discount_value}
                          {coupon.discount_type === 'percentage' ? '%' : ' INR'} / Valid {formatDate(coupon.valid_from)} to {formatDate(coupon.valid_to)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge status={coupon.is_active ? 'success' : 'failed'} label={coupon.is_active ? 'Active' : 'Inactive'} />
                        <ActionButton
                          tone="ghost"
                          className="min-h-9 px-3"
                          onClick={() =>
                            updateCouponMutation.mutate({
                              couponId: coupon.id,
                              body: { is_active: !coupon.is_active },
                            })
                          }
                        >
                          {coupon.is_active ? 'Disable' : 'Enable'}
                        </ActionButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No coupons available" body="Create your first coupon to manage promotional offers." />
            )}
          </div>
        ) : null}

        {section === 'settings' ? (
          <div className="space-y-6">
            <FieldList
              items={[
                { label: 'Advance payment percentage', value: `${settingsForm.advance_payment_percentage || 0}%` },
                { label: 'Primary phone', value: settingsForm.primary_phone },
                { label: 'Support email', value: settingsForm.support_email },
                { label: 'WhatsApp number', value: settingsForm.whatsapp_number },
              ]}
            />

            <div className="rounded-[26px] bg-[#FBF7F4] p-5">
              <h3 className="text-lg font-semibold text-[#2B211B]">Advance Payment Settings</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <InputField
                  type="number"
                  value={settingsForm.advance_payment_percentage}
                  onChange={event => setSettingsForm(current => ({ ...current, advance_payment_percentage: event.target.value }))}
                  placeholder="Advance payment percentage"
                />
                <InputField value={settingsForm.primary_phone} onChange={event => setSettingsForm(current => ({ ...current, primary_phone: event.target.value }))} placeholder="Primary phone" />
                <InputField value={settingsForm.support_email} onChange={event => setSettingsForm(current => ({ ...current, support_email: event.target.value }))} placeholder="Support email" />
                <InputField value={settingsForm.whatsapp_number} onChange={event => setSettingsForm(current => ({ ...current, whatsapp_number: event.target.value }))} placeholder="WhatsApp number" />
                <TextAreaField
                  value={settingsForm.support_availability_text}
                  onChange={event => setSettingsForm(current => ({ ...current, support_availability_text: event.target.value }))}
                  placeholder="Support availability text"
                />
                <TextAreaField
                  value={settingsForm.response_expectation_text}
                  onChange={event => setSettingsForm(current => ({ ...current, response_expectation_text: event.target.value }))}
                  placeholder="Response expectation text"
                />
              </div>
              <ActionButton
                className="mt-4"
                disabled={updateSettingsMutation.isPending}
                onClick={() =>
                  updateSettingsMutation.mutate({
                    ...settingsForm,
                    advance_payment_percentage: Number(settingsForm.advance_payment_percentage || 0),
                  })
                }
              >
                {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
              </ActionButton>
            </div>
          </div>
        ) : null}
      </Panel>
    </div>
  )
}
