import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  DashboardErrorState,
  DashboardLoadingState,
} from '../../components/dashboard/DashboardUI'
import { useDashboardSession } from '../../hooks/useDashboardData'
import {
  bookingGet,
  bookingGetInfoCollection,
  bookingSubmitInfoCollection,
  getStoredJwt,
  getValidStoredJwt,
} from '../../lib/api'
import DateTimePicker from '../../components/common/DateTimePicker'

function FieldLabel({ label }) {
  return <p className="text-[12px] text-[#7A7A7A]">{label}</p>
}

function inputClass() {
  return 'w-full border-b border-[#2D2D2D] bg-transparent pb-[6px] text-[16px] outline-none'
}

function pickerClass() {
  return 'w-full border-b border-[#2D2D2D] bg-transparent pb-3 text-[16px] outline-none'
}

const EMPTY_FORM = {
  fullName: '',
  email: '',
  phone: '',
  eventDate: '',
  eventTime: '',
  addressLine1: '',
  addressLine2: '',
  addressFloor: '',
  pinCode: '',
  hasLift: '',
  guestCount: '',
  setupArrivalTime: '',
  eventDayContactName: '',
  eventDayContactPhone: '',
  parkingInstructions: '',
  specialRequest: '',
}

function toDateValue(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10)
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return ''
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(
    parsed.getDate()
  ).padStart(2, '0')}`
}

function pickFormFromSources(...sources) {
  const next = { ...EMPTY_FORM }
  for (const key of Object.keys(EMPTY_FORM)) {
    for (const source of sources) {
      const value = source?.[key]
      if (value == null) continue
      const text = String(value).trim()
      if (!text || /^not provided$/i.test(text)) continue
      next[key] = key === 'eventDate' ? toDateValue(text) || text : text
      break
    }
  }
  return next
}

export default function InfoCollection() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const bookingId = String(searchParams.get('bookingId') ?? '').trim()
  const sessionQuery = useDashboardSession()
  // /auth/me does not return jwt — use the stored access token.
  const [token, setToken] = useState(() => getStoredJwt())

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showGuestCount, setShowGuestCount] = useState(false)
  const [statusLabel, setStatusLabel] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    let active = true
    getValidStoredJwt().then(next => {
      if (active && next) setToken(next)
    })
    const sync = () => setToken(getStoredJwt())
    window.addEventListener('elewen-auth-change', sync)
    return () => {
      active = false
      window.removeEventListener('elewen-auth-change', sync)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!bookingId) {
        setLoading(false)
        return
      }

      const accessToken = (await getValidStoredJwt()) || getStoredJwt()
      if (!accessToken) {
        setLoading(false)
        setError('Please log in again to open this form.')
        return
      }
      setToken(accessToken)

      setLoading(true)
      setError('')
      try {
        const [infoResponse, bookingResponse] = await Promise.all([
          bookingGetInfoCollection(accessToken, bookingId).catch(() => null),
          bookingGet(accessToken, bookingId).catch(() => null),
        ])
        if (cancelled) return

        const booking = bookingResponse?.booking ?? null
        const info = infoResponse?.form ?? {}
        const fromBooking = booking?.infoCollection ?? {}
        const sessionUser = sessionQuery.data?.user ?? {}
        const sessionProfile = sessionQuery.data?.profile ?? {}
        const profileName = [sessionProfile.first_name, sessionProfile.last_name]
          .filter(Boolean)
          .join(' ')
          .trim()

        setForm(
          pickFormFromSources(info, fromBooking, {
            fullName: profileName || sessionUser?.username || '',
            email: sessionUser?.email || sessionProfile?.email || '',
            phone: sessionUser?.phone || sessionProfile?.phone || '',
            eventDate: booking?.eventDate || '',
            eventTime: booking?.eventTime || '',
            addressLine1: booking?.address?.line1 || fromBooking.addressLine1 || '',
            addressLine2: booking?.address?.line2 || fromBooking.addressLine2 || '',
            pinCode: booking?.pinCode || booking?.address?.pincode || '',
            guestCount: booking?.guestCount != null ? String(booking.guestCount) : '',
            specialRequest: booking?.specialRequest || '',
          })
        )
        setShowGuestCount(
          Boolean(infoResponse?.showGuestCount ?? booking?.isCateringBooking)
        )
        setStatusLabel(
          infoResponse?.statusLabel ||
            booking?.statusLabel ||
            infoResponse?.status ||
            booking?.status ||
            ''
        )
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Could not load the information form.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [bookingId, sessionQuery.data?.user?.id, sessionQuery.data?.profile?.first_name])

  const setField = key => event => {
    const value = event?.target ? event.target.value : event
    setForm(prev => ({ ...prev, [key]: value }))
    setSuccess('')
  }

  const handleSubmit = async event => {
    event.preventDefault()
    if (!bookingId) return

    const accessToken = (await getValidStoredJwt()) || token || getStoredJwt()
    if (!accessToken) {
      setError('Please log in again to submit this form.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await bookingSubmitInfoCollection(accessToken, bookingId, form)
      setSuccess('Thank you — your details were saved.')
      setTimeout(() => navigate('/user-dashboard/active-booking'), 800)
    } catch (err) {
      setError(err?.message || 'Could not save your details. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!bookingId) {
    return (
      <DashboardErrorState
        title="Booking not found"
        body="Open this form from an active booking that is in Information Collection."
      />
    )
  }

  if (sessionQuery.isLoading || loading) {
    return <DashboardLoadingState title="Loading information form..." />
  }

  if (error && !form.fullName && !form.eventDate && !form.email) {
    return <DashboardErrorState title="We could not load this form." body={error} />
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1
            className="text-[20px] font-semibold text-[#2C2C2C]"
            style={{ fontFamily: "'Poppins'" }}
          >
            Information Collection
          </h1>
          <p className="mt-2 text-[14px] text-[#7A7A7A]">
            Details from checkout are filled in when available. Add anything that is still missing —
            nothing is mandatory.
          </p>
          {statusLabel ? (
            <p className="mt-2 text-[12px] text-[#957960]">Booking status: {statusLabel}</p>
          ) : null}
        </div>
        <Link
          to="/user-dashboard/active-booking"
          className="rounded-full border border-[#CDB17E] px-4 py-2 text-sm text-[#957960]"
        >
          Back to active bookings
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-[20px] border border-[#95796066] bg-white p-6 md:p-8"
      >
        <h2
          className="text-[18px] font-semibold text-[#2C2C2C]"
          style={{ fontFamily: "'Poppins'" }}
        >
          Basic Details
        </h2>

        <div className="mt-6 space-y-6">
          <div>
            <FieldLabel label="Full Name" />
            <input
              type="text"
              value={form.fullName}
              onChange={setField('fullName')}
              className={inputClass()}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <FieldLabel label="Email Address" />
              <input
                type="email"
                value={form.email}
                onChange={setField('email')}
                className={inputClass()}
              />
            </div>
            <div>
              <FieldLabel label="Phone Number" />
              <input
                type="tel"
                value={form.phone}
                onChange={setField('phone')}
                className={inputClass()}
              />
            </div>
          </div>
        </div>

        <h2
          className="mt-10 text-[18px] font-semibold text-[#2C2C2C]"
          style={{ fontFamily: "'Poppins'" }}
        >
          Event Details
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <FieldLabel label="Event Date" />
            <DateTimePicker
              type="date"
              value={form.eventDate}
              onChange={setField('eventDate')}
              className={pickerClass()}
            />
          </div>
          <div>
            <FieldLabel label="What time does the event start" />
            <DateTimePicker
              type="time"
              value={form.eventTime}
              onChange={setField('eventTime')}
              className={pickerClass()}
            />
          </div>

          <div className="md:col-span-2">
            <FieldLabel label="Event Location / Venue Address (first line)" />
            <input
              type="text"
              value={form.addressLine1}
              onChange={setField('addressLine1')}
              className={inputClass()}
            />
          </div>
          <div>
            <FieldLabel label="Second line" />
            <input
              type="text"
              value={form.addressLine2}
              onChange={setField('addressLine2')}
              className={inputClass()}
            />
          </div>
          <div>
            <FieldLabel label="Event location floor" />
            <input
              type="text"
              value={form.addressFloor}
              onChange={setField('addressFloor')}
              className={inputClass()}
            />
          </div>
          <div>
            <FieldLabel label="PIN Code" />
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={form.pinCode}
              onChange={event => setField('pinCode')(event.target.value.replace(/\D/g, '').slice(0, 6))}
              className={inputClass()}
            />
          </div>
          <div>
            <FieldLabel label="Is there a lift in your building?" />
            <select value={form.hasLift} onChange={setField('hasLift')} className={inputClass()}>
              <option value="">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Not sure">Not sure</option>
            </select>
          </div>

          {showGuestCount ? (
            <div>
              <FieldLabel label="Guest Count" />
              <input
                type="number"
                min="1"
                value={form.guestCount}
                onChange={setField('guestCount')}
                className={inputClass()}
              />
            </div>
          ) : null}

          <div className="md:col-span-2">
            <FieldLabel label="What is the earliest time that our team can reach the venue for set-up" />
            <DateTimePicker
              type="time"
              value={form.setupArrivalTime}
              onChange={setField('setupArrivalTime')}
              className={pickerClass()}
            />
          </div>
          <div>
            <FieldLabel label="Event-day contact person" />
            <input
              type="text"
              value={form.eventDayContactName}
              onChange={setField('eventDayContactName')}
              className={inputClass()}
            />
          </div>
          <div>
            <FieldLabel label="Event-day contact mobile number" />
            <input
              type="tel"
              value={form.eventDayContactPhone}
              onChange={setField('eventDayContactPhone')}
              className={inputClass()}
            />
          </div>
          <div className="md:col-span-2">
            <FieldLabel label="Parking or loading instructions (if applicable)" />
            <input
              type="text"
              value={form.parkingInstructions}
              onChange={setField('parkingInstructions')}
              className={inputClass()}
            />
          </div>
          <div className="md:col-span-2">
            <FieldLabel label="Any special instructions" />
            <textarea
              rows={3}
              value={form.specialRequest}
              onChange={setField('specialRequest')}
              className="w-full border-b border-[#2D2D2D] bg-transparent pb-[6px] text-[16px] outline-none"
            />
          </div>
        </div>

        {error ? <p className="mt-6 text-sm text-[#B42318]">{error}</p> : null}
        {success ? <p className="mt-6 text-sm text-[#238E64]">{success}</p> : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-[#CDB17E] px-6 py-3 text-[14px] font-medium text-white hover:bg-[#C6AB7F] disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Submit'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/user-dashboard/active-booking')}
            className="rounded-full border border-[#CDB17E] px-6 py-3 text-[14px] font-medium text-[#957960]"
          >
            Back
          </button>
        </div>
        <p className="mt-3 text-sm text-[#7A7A7A]">
          Checkout details are filled when available. Add only what is still missing — nothing is
          required.
        </p>
      </form>
    </div>
  )
}
