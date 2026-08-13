import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  DashboardErrorState,
  DashboardLoadingState,
  DashboardPageIntro,
  SectionCard,
} from '../../components/dashboard/DashboardUI'
import {
  useDashboardSession,
  useDashboardUpdateProfile,
  useDashboardCoupons,
  useDashboardBookings,
} from '../../hooks/useDashboardData'
import { getInitials } from '../../components/dashboard/dashboardUtils'
import { isValidIndianPhone, normalizeIndianPhone } from '../../lib/phone'

function formatCouponDiscount(coupon) {
  if (coupon.discount_type === 'percentage') {
    return `${coupon.discount_value}% off`
  }
  return `₹${Number(coupon.discount_value ?? 0).toLocaleString('en-IN')} off`
}

function formatCouponDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
function buildFullName(session) {
  return (
    [session?.profile?.first_name, session?.profile?.last_name].filter(Boolean).join(' ') ||
    [session?.user?.first_name, session?.user?.last_name].filter(Boolean).join(' ') ||
    session?.user?.email ||
    'Customer'
  )
}

function buildInitialForm(session) {
  return {
    first_name: session?.profile?.first_name || session?.user?.first_name || '',
    last_name: session?.profile?.last_name || session?.user?.last_name || '',
    email: session?.user?.email || '',
    phone: normalizeIndianPhone(session?.user?.phone || ''),
  }
}

function ProfileField({ label, children }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_1px_0_rgba(17,24,39,0.03)]">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#8F8F8F]">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  )
}

function ProfileInput({ value, onChange, type = 'text', disabled = false, placeholder = '' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      className="w-full rounded-xl border border-[#E4DED8] bg-white px-3 py-2 text-sm text-[#2E2E2E] outline-none transition focus:border-[#C6A15B] disabled:cursor-not-allowed disabled:bg-[#F9F7F4] disabled:text-[#6B7280]"
    />
  )
}

function ProfileValue({ value }) {
  return <p className="text-sm text-[#2E2E2E]">{value || 'Not shared yet'}</p>
}

export default function ProfilePage() {
  const { data: session, isLoading: sessionLoading, error: sessionError } = useDashboardSession()
  const { data: coupons = [], isLoading: couponsLoading } = useDashboardCoupons()
  const { data: previousBookings = [] } = useDashboardBookings('previous')
  const updateProfileMutation = useDashboardUpdateProfile()
  const [isEditing, setIsEditing] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [copiedCode, setCopiedCode] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const initialForm = useMemo(() => buildInitialForm(session), [session])
  const [form, setForm] = useState(() => buildInitialForm(session))

  const fullName = useMemo(() => buildFullName(session), [session])
  const photoUrl = session?.profile?.photoUrl || null
  const displayForm = isEditing ? form : initialForm
  const hasPreviousBooking = useMemo(
    () =>
      previousBookings.some(booking => {
        const status = String(booking?.status ?? '')
          .trim()
          .toLowerCase()
        return ['completed', 'cancelled', 'canceled'].includes(status)
      }),
    [previousBookings]
  )

  if (sessionLoading) {
    return <DashboardLoadingState title="Loading your profile..." />
  }

  if (sessionError) {
    return <DashboardErrorState title="We could not load your profile details." />
  }

  const handleFieldChange = key => event => {
    const nextValue = event.target.value
    setForm(current => ({ ...current, [key]: nextValue }))
  }

  const handleCancel = () => {
    setForm(initialForm)
    setIsEditing(false)
    setSaveMessage('')
    setFieldErrors({})
  }

  const handleStartEditing = () => {
    setSaveMessage('')
    setFieldErrors({})
    setForm(buildInitialForm(session))
    setIsEditing(true)
  }

  const handleSubmit = async event => {
    event.preventDefault()
    setSaveMessage('')
    setFieldErrors({})

    const payload = {}
    const nextErrors = {}
    const trimmedFirst = form.first_name.trim()
    const trimmedLast = form.last_name.trim()
    const normalizedPhone = normalizeIndianPhone(form.phone)
    const initialPhone = normalizeIndianPhone(initialForm.phone)

    if (trimmedFirst !== initialForm.first_name.trim()) {
      if (trimmedFirst.length < 2) {
        nextErrors.first_name = 'First name must be at least 2 characters'
      } else {
        payload.first_name = trimmedFirst
      }
    }
    if (trimmedLast !== initialForm.last_name.trim()) {
      if (trimmedLast.length < 2) {
        nextErrors.last_name = 'Last name must be at least 2 characters'
      } else {
        payload.last_name = trimmedLast
      }
    }
    if (normalizedPhone !== initialPhone) {
      if (normalizedPhone && !isValidIndianPhone(normalizedPhone)) {
        nextErrors.phone = 'Enter a valid 10-digit Indian phone number'
      } else {
        payload.phone = normalizedPhone
      }
    }

    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors)
      return
    }

    if (!Object.keys(payload).length) {
      setIsEditing(false)
      return
    }

    try {
      await updateProfileMutation.mutateAsync(payload)
      setIsEditing(false)
      setSaveMessage('Profile updated successfully.')
    } catch (error) {
      if (error?.fieldErrors && typeof error.fieldErrors === 'object') {
        setFieldErrors(error.fieldErrors)
      }
    }
  }

  const handleCopyCode = async code => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      window.setTimeout(() => setCopiedCode(''), 2000)
    } catch {
      setCopiedCode('')
    }
  }

  return (
    <div className="">
      <DashboardPageIntro
        title="Profile Snapshot"
        subtitle="Review the personal details connected to your Elewen dashboard account."
      />

      <SectionCard>
        <form id="profile-form" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={fullName}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#E5E7EB] text-xl font-medium text-[#4B5563]">
                  {getInitials(fullName) || 'CU'}
                </div>
              )}

              <div>
                <h2 className="text-2xl font-serif text-[#2E2E2E]">{fullName}</h2>
                <p className="mt-1 text-sm text-[#6B7280]">
                  {session?.user?.email || 'Customer account'}
                </p>
              </div>
            </div>
            <div className="relative z-10 flex shrink-0 items-center gap-3 pointer-events-auto">
              {saveMessage ? (
                <span className="text-xs font-medium text-[#12803D]">{saveMessage}</span>
              ) : null}
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="rounded-full border border-[#D6CDC3] px-4 py-2 text-sm text-[#2E2E2E] transition hover:bg-[#ECE7E1]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="profile-form"
                    disabled={updateProfileMutation.isPending}
                    className="rounded-full bg-[#C6A15B] px-4 py-2 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleStartEditing}
                  className="rounded-full bg-[#CDB17E] hover:bg-[#C6AB7F] px-4 py-2 text-sm text-white transition"
                >
                  Edit basic info
                </button>
              )}
            </div>
          </div>

          {updateProfileMutation.error && !Object.keys(fieldErrors).length ? (
            <p className="mt-4 text-sm text-[#8A1C1C]">
              We could not update your profile right now. Please try once again.
            </p>
          ) : null}

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ProfileField label="First Name">
              {isEditing ? (
                <ProfileInput
                  value={displayForm.first_name}
                  onChange={handleFieldChange('first_name')}
                />
              ) : (
                <ProfileValue value={displayForm.first_name} />
              )}
              {fieldErrors.first_name ? (
                <p className="mt-2 text-xs text-[#8A1C1C]">{fieldErrors.first_name}</p>
              ) : null}
            </ProfileField>

            <ProfileField label="Last Name">
              {isEditing ? (
                <ProfileInput
                  value={displayForm.last_name}
                  onChange={handleFieldChange('last_name')}
                />
              ) : (
                <ProfileValue value={displayForm.last_name} />
              )}
              {fieldErrors.last_name ? (
                <p className="mt-2 text-xs text-[#8A1C1C]">{fieldErrors.last_name}</p>
              ) : null}
            </ProfileField>

            <ProfileField label="Email">
              <ProfileValue value={displayForm.email} />
            </ProfileField>

            <ProfileField label="Phone Number">
              {isEditing ? (
                <ProfileInput value={displayForm.phone} onChange={handleFieldChange('phone')} />
              ) : (
                <ProfileValue
                  value={displayForm.phone || normalizeIndianPhone(session?.user?.phone)}
                />
              )}
              {fieldErrors.phone ? (
                <p className="mt-2 text-xs text-[#8A1C1C]">{fieldErrors.phone}</p>
              ) : null}
            </ProfileField>
          </div>
        </form>
      </SectionCard>

      <div className="mt-6" id="my-coupons">
        <SectionCard>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-serif text-[#2E2E2E]">My coupons</h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              Referral and reward coupons sent to your account. Copy a code to use at checkout.
            </p>
          </div>
          {hasPreviousBooking ? (
            <Link
              to="/user-dashboard/previous"
              className="shrink-0 text-sm font-medium text-[#957960] underline underline-offset-2 hover:text-[#7A624E]"
            >
              Claim your coupon
            </Link>
          ) : null}
        </div>

        {couponsLoading ? (
          <p className="mt-4 text-sm text-[#6B7280]">Loading your coupons...</p>
        ) : coupons.length ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {coupons.map(coupon => (
              <div
                key={coupon.id}
                className="rounded-2xl border border-[#E4DED8] bg-[#FBF7F3] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#2E2E2E]">
                      {coupon.title || formatCouponDiscount(coupon)}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[#8F8F8F]">
                      {coupon.code}
                    </p>
                  </div>
                  <span
                    className={[
                      'rounded-full px-2.5 py-1 text-[11px] font-medium capitalize',
                      coupon.status === 'active'
                        ? 'bg-[#E7F6EC] text-[#12803D]'
                        : coupon.status === 'used'
                          ? 'bg-[#F3F4F6] text-[#6B7280]'
                          : 'bg-[#F3F4F6] text-[#6B7280]',
                    ].join(' ')}
                  >
                    {coupon.status === 'used' ? 'Used' : coupon.status}
                  </span>
                </div>

                <p className="mt-3 text-sm text-[#4B5563]">
                  {formatCouponDiscount(coupon)}
                  {coupon.min_order_value
                    ? ` · Min order ₹${Number(coupon.min_order_value).toLocaleString('en-IN')}`
                    : ''}
                </p>
                <p className="mt-1 text-xs text-[#8F8F8F]">
                  Valid till {formatCouponDate(coupon.valid_to)}
                </p>
                {coupon.terms_customer ? (
                  <p className="mt-3 text-xs leading-5 text-[#6B7280]">{coupon.terms_customer}</p>
                ) : null}

                {coupon.status === 'active' ? (
                  <button
                    type="button"
                    onClick={() => handleCopyCode(coupon.code)}
                    className="mt-4 rounded-full border border-[#CDB17E] px-4 py-2 text-sm text-[#5A1E0E] transition hover:bg-[#F5EDE3]"
                  >
                    {copiedCode === coupon.code ? 'Copied!' : 'Copy code'}
                  </button>
                ) : coupon.status === 'used' ? (
                  <p className="mt-4 text-sm font-medium text-[#6B7280]">
                    Used by you — cannot use again
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-[#6B7280]">
            No coupons yet. After your event is complete, our team may send you a referral offer by
            email and here in your profile.
          </p>
        )}
        </SectionCard>
      </div>
    </div>
  )
}
