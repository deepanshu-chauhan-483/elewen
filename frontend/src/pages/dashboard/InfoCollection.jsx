import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  DashboardErrorState,
  DashboardLoadingState,
} from '../../components/dashboard/DashboardUI'
import { useDashboardSession } from '../../hooks/useDashboardData'
import { bookingGetInfoCollection, bookingSubmitInfoCollection } from '../../lib/api'
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

export default function InfoCollection() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const bookingId = String(searchParams.get('bookingId') ?? '').trim()
  const sessionQuery = useDashboardSession()
  const token = sessionQuery.data?.jwt || ''

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [canEdit, setCanEdit] = useState(false)
  const [showGuestCount, setShowGuestCount] = useState(false)
  const [statusLabel, setStatusLabel] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!bookingId || !token) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')
      try {
        const response = await bookingGetInfoCollection(token, bookingId)
        if (cancelled) return
        setForm({ ...EMPTY_FORM, ...(response?.form ?? {}) })
        setCanEdit(Boolean(response?.canEdit))
        setShowGuestCount(Boolean(response?.showGuestCount))
        setStatusLabel(response?.statusLabel || response?.status || '')
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
  }, [bookingId, token])

  const setField = key => event => {
    const value = event?.target ? event.target.value : event
    setForm(prev => ({ ...prev, [key]: value }))
    setSuccess('')
  }

  const handleSubmit = async event => {
    event.preventDefault()
    if (!canEdit || !bookingId || !token) return

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await bookingSubmitInfoCollection(token, bookingId, form)
      setSuccess('Thank you — your details were saved. Let it all come together!!')
      setCanEdit(true)
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

  if (error && !form.fullName && !form.eventDate) {
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
            Details from checkout are filled in already. Add anything that is still missing — nothing
            is mandatory.
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
              disabled={!canEdit}
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
                disabled={!canEdit}
                className={inputClass()}
              />
            </div>
            <div>
              <FieldLabel label="Phone Number" />
              <input
                type="tel"
                value={form.phone}
                onChange={setField('phone')}
                disabled={!canEdit}
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
              disabled={!canEdit}
              className={pickerClass()}
            />
          </div>
          <div>
            <FieldLabel label="What time does the event start" />
            <DateTimePicker
              type="time"
              value={form.eventTime}
              onChange={setField('eventTime')}
              disabled={!canEdit}
              className={pickerClass()}
            />
          </div>

          <div className="md:col-span-2">
            <FieldLabel label="Event Location / Venue Address (first line)" />
            <input
              type="text"
              value={form.addressLine1}
              onChange={setField('addressLine1')}
              disabled={!canEdit}
              placeholder="Building, street, area"
              className={inputClass()}
            />
          </div>
          <div>
            <FieldLabel label="Second line" />
            <input
              type="text"
              value={form.addressLine2}
              onChange={setField('addressLine2')}
              disabled={!canEdit}
              placeholder="Landmark, block, or locality"
              className={inputClass()}
            />
          </div>
          <div>
            <FieldLabel label="Event location floor" />
            <input
              type="text"
              value={form.addressFloor}
              onChange={setField('addressFloor')}
              disabled={!canEdit}
              placeholder="Ground floor, 3rd floor, etc."
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
              disabled={!canEdit}
              className={inputClass()}
            />
          </div>
          <div>
            <FieldLabel label="Is there a lift in your building?" />
            <select
              value={form.hasLift}
              onChange={setField('hasLift')}
              disabled={!canEdit}
              className={inputClass()}
            >
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
                disabled={!canEdit}
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
              disabled={!canEdit}
              className={pickerClass()}
            />
          </div>
          <div>
            <FieldLabel label="Event-day contact person" />
            <input
              type="text"
              value={form.eventDayContactName}
              onChange={setField('eventDayContactName')}
              disabled={!canEdit}
              className={inputClass()}
            />
          </div>
          <div>
            <FieldLabel label="Event-day contact mobile number" />
            <input
              type="tel"
              value={form.eventDayContactPhone}
              onChange={setField('eventDayContactPhone')}
              disabled={!canEdit}
              className={inputClass()}
            />
          </div>
          <div className="md:col-span-2">
            <FieldLabel label="Parking or loading instructions (if applicable)" />
            <input
              type="text"
              value={form.parkingInstructions}
              onChange={setField('parkingInstructions')}
              disabled={!canEdit}
              className={inputClass()}
            />
          </div>
          <div className="md:col-span-2">
            <FieldLabel label="Any special instructions" />
            <textarea
              rows={3}
              value={form.specialRequest}
              onChange={setField('specialRequest')}
              disabled={!canEdit}
              className="w-full border-b border-[#2D2D2D] bg-transparent pb-[6px] text-[16px] outline-none"
            />
          </div>
        </div>

        {error ? <p className="mt-6 text-sm text-[#B42318]">{error}</p> : null}
        {success ? <p className="mt-6 text-sm text-[#238E64]">{success}</p> : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving || !canEdit}
            className="rounded-full bg-[#CDB17E] px-6 py-3 text-[14px] font-medium text-white hover:bg-[#C6AB7F] disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Submit / Proceed'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/user-dashboard/active-booking')}
            className="rounded-full border border-[#CDB17E] px-6 py-3 text-[14px] font-medium text-[#957960]"
          >
            Back
          </button>
        </div>
        {!canEdit ? (
          <p className="mt-3 text-sm text-[#7A7A7A]">
            Submit is available while the booking status is Information Collection.
          </p>
        ) : (
          <p className="mt-3 text-sm text-[#7A7A7A]">
            Checkout details are already filled. Add only what is still missing — nothing is
            required.
          </p>
        )}

        <p className="mt-6 text-center text-[14px] text-[#957960]">Let it all come together!!</p>
      </form>
    </div>
  )
}
