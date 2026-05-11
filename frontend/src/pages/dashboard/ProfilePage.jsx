import { useMemo, useState } from 'react'
import {
  DashboardErrorState,
  DashboardLoadingState,
  DashboardPageIntro,
  SectionCard,
} from '../../components/dashboard/DashboardUI'
import { useDashboardSession, useDashboardUpdateProfile } from '../../hooks/useDashboardData'
import { getInitials } from '../../components/dashboard/dashboardUtils'

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
    phone: session?.user?.phone || '',
    date_of_birth: session?.profile?.date_of_birth || '',
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
  const updateProfileMutation = useDashboardUpdateProfile()
  const [isEditing, setIsEditing] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const initialForm = useMemo(() => buildInitialForm(session), [session])
  const [form, setForm] = useState(initialForm)

  const fullName = useMemo(() => buildFullName(session), [session])
  const photoUrl = session?.profile?.photoUrl || null
  const displayForm = isEditing ? form : initialForm

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
  }

  const handleSubmit = async event => {
    event.preventDefault()
    setSaveMessage('')

    const payload = {}

    if (form.first_name.trim() !== initialForm.first_name) {
      payload.first_name = form.first_name.trim()
    }
    if (form.last_name.trim() !== initialForm.last_name) {
      payload.last_name = form.last_name.trim()
    }
    if (form.phone.trim() !== initialForm.phone) {
      payload.phone = form.phone.trim()
    }
    if ((form.date_of_birth || '') !== (initialForm.date_of_birth || '')) {
      payload.date_of_birth = form.date_of_birth || null
    }

    if (!Object.keys(payload).length) {
      setIsEditing(false)
      return
    }

    await updateProfileMutation.mutateAsync(payload)

    setForm(initialForm)
    setIsEditing(false)
    setSaveMessage('Profile updated successfully.')
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
            <div className="flex items-center gap-4">
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
            <div className="flex items-center gap-3">
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
                  onClick={() => {
                    setSaveMessage('')
                    setIsEditing(true)
                  }}
                  className="rounded-full bg-[#C6A15B] px-4 py-2 text-sm text-white transition hover:opacity-90"
                >
                  Edit basic info
                </button>
              )}
            </div>
          </div>

          {updateProfileMutation.error ? (
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
            </ProfileField>

            <ProfileField label="Email">
              <ProfileValue value={displayForm.email} />
            </ProfileField>

            <ProfileField label="Phone Number">
              {isEditing ? (
                <ProfileInput value={displayForm.phone} onChange={handleFieldChange('phone')} />
              ) : (
                <ProfileValue value={displayForm.phone} />
              )}
            </ProfileField>

            <ProfileField label="Date Of Birth">
              {isEditing ? (
                <ProfileInput
                  type="date"
                  value={displayForm.date_of_birth}
                  onChange={handleFieldChange('date_of_birth')}
                />
              ) : (
                <ProfileValue value={displayForm.date_of_birth} />
              )}
            </ProfileField>
          </div>
        </form>
      </SectionCard>
    </div>
  )
}
