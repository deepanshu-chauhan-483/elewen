import { useEffect, useMemo, useRef, useState } from 'react'
import CustomSelect from '../components/common/CustomSelect'
import { useToast } from '../components/common/useToast'
import { getFieldErrors, getGlobalErrorMessage } from '../lib/formErrors'
import { submitVendorRegistration } from '../lib/api'

const SERVICE_OPTIONS = [
  'Decorator',
  'Catering Services',
  'Bartending Services',
  'Production',
  'Fabrication (Tenting)',
  'Merchandise & Stationary / Printing',
  'Photographer / Videographer',
  'Designer 2D / 3D',
  'Tech Engagements',
  'Artist - Emcee, Dancer, Make-up Artist, Art Installation etc.',
  'Sound / Light / Technical Support',
  'Other',
]

const EVENT_TYPE_OPTIONS = [
  'Wedding',
  'Birthday',
  'Anniversary',
  'House Party',
  'Corporate',
  'Baby Shower',
  'Private Dinner',
]

const VERIFICATION_DOCUMENT_OPTIONS = [
  'Aadhaar Card',
  'PAN Card',
  'Business Registration Certificate',
  'GST Certificate',
]

const INITIAL_FORM = {
  businessName: '',
  contactPersonName: '',
  phone: '',
  email: '',
  operatingLocation: '',
  teamSize: '',
  websiteSocialPortfolio: '',
  establishedIn: '',
  serviceCategories: [],
  eventType: '',
  portfolioLink: '',
  workSample: null,
  verificationDocumentType: '',
  verificationDocument: null,
}

function DropdownArrow({ isOpen }) {
  if (isOpen) {
    return (
      <svg width="11" height="9" viewBox="0 0 11 9" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5.19531 0L-0.00083971 9H10.3915L5.19531 0Z" fill="#591902" />
      </svg>
    )
  }

  return (
    <svg width="11" height="9" viewBox="0 0 11 9" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.19531 9L10.3915 0H-0.00083971L5.19531 9Z" fill="#591902" />
    </svg>
  )
}

function extractCity(operatingLocation) {
  const trimmed = operatingLocation.trim()
  if (!trimmed) return ''

  return trimmed.split(',')[0]?.trim() || trimmed
}

function estimateExperienceYears(establishedIn) {
  const year = Number.parseInt(establishedIn, 10)
  if (!Number.isFinite(year)) return ''

  const currentYear = new Date().getFullYear()
  if (year > currentYear || year < 1900) return ''

  return String(Math.max(currentYear - year, 0))
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`))
    reader.readAsDataURL(file)
  })
}

async function toUploadPayload(file) {
  if (!file) return null

  return {
    name: file.name,
    type: file.type,
    size: file.size,
    dataUrl: await readFileAsDataUrl(file),
  }
}

function isLikelyUrl(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return false
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      new URL(trimmed)
      return true
    } catch {
      return false
    }
  }
  // Allow social handles / domains without protocol (e.g. instagram.com/brand)
  return /^[\w.-]+\.[\w.-]+(\/[\w./?%&=-]*)?$/i.test(trimmed) || trimmed.startsWith('@')
}

function normalizePhone(value) {
  return String(value ?? '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '')
}

function isValidIndianPhone(value) {
  return /^[6-9]\d{9}$/.test(normalizePhone(value))
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? '').trim())
}

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
const ALLOWED_UPLOAD_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

function validateUpload(file, { required = false, label = 'File' } = {}) {
  if (!file) {
    return required ? `${label} is required` : ''
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `${label} must be 5 MB or smaller`
  }
  if (file.type && !ALLOWED_UPLOAD_TYPES.has(file.type)) {
    return `${label} must be JPG, PNG, PDF, or DOC`
  }
  return ''
}

function Input({ label, name, placeholder, value, onChange, error, type = 'text', inputMode, maxLength }) {
  return (
    <div className="flex flex-col gap-2" data-field={name}>
      <label className="text-[14px] text-[#364022]" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={`bg-white border p-3 rounded-md outline-none focus:ring-1 focus:ring-[#C4A874] ${
          error ? 'border-[#8F2D1F]' : 'border-[#E5E5E5]'
        }`}
      />
      {error ? <p className="text-[12px] text-[#8F2D1F]">{error}</p> : null}
    </div>
  )
}

function PhoneInput({ value, onChange, error }) {
  return (
    <div className="flex flex-col gap-2" data-field="phone">
      <label className="text-[14px] text-[#364022]" htmlFor="phone">
        Phone number*
      </label>
      <input
        id="phone"
        name="phone"
        type="tel"
        inputMode="numeric"
        maxLength={10}
        value={value}
        onChange={onChange}
        placeholder="10-digit mobile number"
        aria-invalid={Boolean(error)}
        className={`flex-1 bg-white border p-3 rounded-md outline-none focus:ring-1 focus:ring-[#C4A874] ${
          error ? 'border-[#8F2D1F]' : 'border-[#E5E5E5]'
        }`}
      />
      {error ? <p className="text-[12px] text-[#8F2D1F]">{error}</p> : null}
    </div>
  )
}

function MultiSelect({ label, selected, onChange, error }) {
  const [inputValue, setInputValue] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClick = event => {
      if (!ref.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const addItem = value => {
    const trimmed = value.trim()
    if (!trimmed || selected.includes(trimmed)) return

    onChange([...selected, trimmed])
    setInputValue('')
    setOpen(false)
  }

  const removeItem = item => {
    onChange(selected.filter(selectedItem => selectedItem !== item))
  }

  const filteredOptions = SERVICE_OPTIONS.filter(
    option => !selected.includes(option) && option.toLowerCase().includes(inputValue.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-2 relative" ref={ref} data-field="serviceCategories">
      <label className="text-[14px] text-[#364022]">{label}</label>

      <div
        className={`bg-white border rounded-md p-2 flex flex-wrap items-center gap-2 cursor-text ${
          error ? 'border-[#8F2D1F]' : 'border-[#E5E5E5]'
        }`}
        onClick={() => setOpen(true)}
      >
        {selected.map(item => (
          <span
            key={item}
            className="bg-[#BFAC9B] px-3 py-1 rounded-full text-[12px] text-[#591902] flex items-center gap-1"
          >
            {item}
            <button
              type="button"
              onClick={event => {
                event.stopPropagation()
                removeItem(item)
              }}
            >
              x
            </button>
          </span>
        ))}

        <input
          value={inputValue}
          onChange={event => {
            setInputValue(event.target.value)
            setOpen(true)
          }}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              event.preventDefault()
              addItem(inputValue)
            }
          }}
          placeholder={selected.length ? 'Select or type...' : 'Select services'}
          className="flex-1 min-w-[120px] outline-none text-[13px]"
        />

        <span
          onClick={event => {
            event.stopPropagation()
            setOpen(previous => !previous)
          }}
          className="ml-auto flex cursor-pointer items-center justify-center text-[#591902]"
        >
          <DropdownArrow isOpen={open} />
        </span>
      </div>

      {open && (
        <div className="absolute top-full mt-1 w-full bg-white border border-[#E5E5E5] rounded-md shadow-sm z-10">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => (
              <div
                key={option}
                onClick={() => addItem(option)}
                className="px-3 py-2 text-[13px] cursor-pointer hover:bg-black hover:text-white"
              >
                {option}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-[13px] text-gray-400">
              Press Enter to add &quot;{inputValue}&quot;
            </div>
          )}
        </div>
      )}
      {error ? <p className="text-[12px] text-[#8F2D1F]">{error}</p> : null}
    </div>
  )
}

function Select({
  label,
  value,
  onChange,
  error,
  options = EVENT_TYPE_OPTIONS,
  placeholder,
  fieldKey,
}) {
  return (
    <div className="flex flex-col gap-2" data-field={fieldKey}>
      <label className="text-[14px] text-[#364022]">{label}</label>

      <div className={`relative rounded-md ${error ? 'ring-1 ring-[#8F2D1F]' : ''}`}>
        <CustomSelect
          variant="form"
          value={value}
          options={options}
          onChange={nextValue => onChange?.({ target: { value: nextValue } })}
          placeholder={placeholder || 'Select'}
          renderArrow={({ isOpen }) => <DropdownArrow isOpen={isOpen} />}
          ariaLabel={label}
        />
      </div>
      {error ? <p className="text-[12px] text-[#8F2D1F]">{error}</p> : null}
    </div>
  )
}

function Upload({ label, full, file, onChange, accept, error, fieldKey }) {
  const inputRef = useRef(null)

  return (
    <div className={`flex flex-col gap-2 ${full ? 'w-full' : ''}`} data-field={fieldKey}>
      {label ? <label className="text-[14px] text-[#364022]">{label}</label> : null}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={event => {
          onChange(event.target.files?.[0] ?? null)
          event.target.value = ''
        }}
      />

      <div
        className={`flex items-center justify-between bg-white border p-3 rounded-md ${
          error ? 'border-[#8F2D1F]' : 'border-[#E5E5E5]'
        }`}
      >
        <span className={`text-[14px] ${file ? 'text-[#364022]' : 'text-gray-400'}`}>
          {file?.name || 'Upload file'}
        </span>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="bg-[#BFAC9B] px-3 py-1 rounded-md text-[12px]"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 2V10M8 2L11.3333 5.33333M8 2L4.66667 5.33333M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10"
              stroke="#591902"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      {error ? <p className="text-[12px] text-[#8F2D1F]">{error}</p> : null}
    </div>
  )
}

export default function VendorRegistration() {
  const { showToast } = useToast()
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const payloadPreview = useMemo(
    () => ({
      city: extractCity(formData.operatingLocation),
      experienceYears: estimateExperienceYears(formData.establishedIn),
    }),
    [formData.establishedIn, formData.operatingLocation]
  )

  const handleInputChange = event => {
    const { name, value } = event.target
    const nextValue = name === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value
    setFormData(previous => ({ ...previous, [name]: nextValue }))
    setSubmitError('')
    setFieldErrors(previous => ({ ...previous, [name]: '' }))
  }

  const setFileValue = (field, file) => {
    setFormData(previous => ({ ...previous, [field]: file }))
    setSubmitError('')
    setFieldErrors(previous => ({ ...previous, [field]: '' }))
  }

  const validateForm = () => {
    const nextErrors = {}
    const currentYear = new Date().getFullYear()

    if (!formData.businessName.trim()) {
      nextErrors.businessName = 'Business name is required'
    } else if (formData.businessName.trim().length < 2) {
      nextErrors.businessName = 'Business name must be at least 2 characters'
    }

    if (!formData.contactPersonName.trim()) {
      nextErrors.contactPersonName = 'Primary contact name is required'
    } else if (formData.contactPersonName.trim().length < 2) {
      nextErrors.contactPersonName = 'Contact name must be at least 2 characters'
    }

    if (!formData.phone.trim()) {
      nextErrors.phone = 'Phone number is required'
    } else if (!isValidIndianPhone(formData.phone)) {
      nextErrors.phone = 'Enter a valid 10-digit Indian mobile number'
    }

    if (!formData.email.trim()) {
      nextErrors.email = 'Email address is required'
    } else if (!isValidEmail(formData.email)) {
      nextErrors.email = 'Enter a valid email address'
    }

    if (!formData.operatingLocation.trim()) {
      nextErrors.operatingLocation = 'Operating location is required'
    } else if (!extractCity(formData.operatingLocation) || extractCity(formData.operatingLocation).length < 2) {
      nextErrors.operatingLocation = 'Enter a valid city / service area'
    }

    if (formData.teamSize.trim()) {
      const teamSizeNumber = Number.parseInt(formData.teamSize, 10)
      if (!Number.isFinite(teamSizeNumber) || teamSizeNumber < 1) {
        nextErrors.teamSize = 'Enter a valid team size (number)'
      }
    }

    if (!formData.websiteSocialPortfolio.trim()) {
      nextErrors.websiteSocialPortfolio = 'Website / Social / Portfolio is required'
    } else if (!isLikelyUrl(formData.websiteSocialPortfolio)) {
      nextErrors.websiteSocialPortfolio = 'Enter a valid website, social, or portfolio link'
    }

    if (formData.establishedIn.trim()) {
      const year = Number.parseInt(formData.establishedIn, 10)
      if (!Number.isFinite(year) || year < 1900 || year > currentYear) {
        nextErrors.establishedIn = `Enter a valid year between 1900 and ${currentYear}`
      }
    }

    if (!formData.serviceCategories.length) {
      nextErrors.serviceCategories = 'Select at least one service category'
    }

    if (!formData.eventType) {
      nextErrors.eventType = 'Select an event type'
    }

    if (!formData.portfolioLink.trim()) {
      nextErrors.portfolioLink = 'Share at least one recent project link'
    } else if (!isLikelyUrl(formData.portfolioLink)) {
      nextErrors.portfolioLink = 'Enter a valid project / portfolio link'
    }

    const workSampleError = validateUpload(formData.workSample, {
      required: false,
      label: 'Work sample',
    })
    if (workSampleError) nextErrors.workSample = workSampleError

    if (!formData.verificationDocumentType) {
      nextErrors.verificationDocumentType = 'Select a verification document type'
    }

    const verificationError = validateUpload(formData.verificationDocument, {
      required: true,
      label: 'Verification document',
    })
    if (verificationError) nextErrors.verificationDocument = verificationError

    return nextErrors
  }

  const scrollToFirstError = errors => {
    const firstKey = Object.keys(errors)[0]
    if (!firstKey) return
    requestAnimationFrame(() => {
      const node = document.querySelector(`[data-field="${firstKey}"]`)
      node?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  const handleSubmit = async event => {
    event.preventDefault()
    setSubmitError('')
    setFieldErrors({})

    const validationError = validateForm()
    if (Object.keys(validationError).length > 0) {
      setFieldErrors(validationError)
      setSubmitError('Please fix the highlighted fields before submitting.')
      scrollToFirstError(validationError)
      return
    }

    setIsSubmitting(true)

    try {
      const [workSamplePayload, verificationDocumentPayload] = await Promise.all([
        toUploadPayload(formData.workSample),
        toUploadPayload(formData.verificationDocument),
      ])

      const response = await submitVendorRegistration({
        business_name: formData.businessName.trim(),
        contact_person_name: formData.contactPersonName.trim(),
        email: formData.email.trim(),
        phone: normalizePhone(formData.phone),
        city: payloadPreview.city,
        operating_location: formData.operatingLocation.trim(),
        team_size: formData.teamSize.trim(),
        website_social_portfolio: formData.websiteSocialPortfolio.trim(),
        established_in: formData.establishedIn.trim(),
        service_category: formData.serviceCategories,
        event_types: [formData.eventType],
        portfolio_link: formData.portfolioLink.trim(),
        experience_years: payloadPreview.experienceYears,
        description: formData.verificationDocumentType
          ? `Verification document type: ${formData.verificationDocumentType}`
          : '',
        work_sample: workSamplePayload,
        verification_document: verificationDocumentPayload,
      })

      showToast({
        message: response.message || "We've received your application and will review it shortly.",
      })
      setFormData({ ...INITIAL_FORM, serviceCategories: [] })
    } catch (error) {
      const nextFieldErrors = getFieldErrors(error, {
        business_name: 'businessName',
        contact_person_name: 'contactPersonName',
        operating_location: 'operatingLocation',
        website_social_portfolio: 'websiteSocialPortfolio',
        service_category: 'serviceCategories',
        event_types: 'eventType',
        verification_document: 'verificationDocument',
        work_sample: 'workSample',
        portfolio_link: 'portfolioLink',
        established_in: 'establishedIn',
        team_size: 'teamSize',
        description: 'verificationDocumentType',
      })

      if (Object.keys(nextFieldErrors).length > 0) {
        setFieldErrors(nextFieldErrors)
        scrollToFirstError(nextFieldErrors)
      } else {
        setSubmitError(
          getGlobalErrorMessage(error, 'Failed to submit vendor registration. Please try again.')
        )
      }
      console.error('[VendorRegistration] submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full">
      <section
        className="text-center py-[clamp(60px,8vw,120px)] px-[clamp(20px,6vw,120px)] md:mt-10"
        style={{ backgroundColor: '#591902' }}
      >
        <h1
          className="text-white text-[clamp(24px,4vw,36px)] leading-[120%] max-w-[900px] mx-auto"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          Thank you for your interest in becoming a part of Elewen&apos;s curated vendor network!
        </h1>

        <p className="text-white/70 mt-4 text-[16px] max-w-[700px] mx-auto">
          Please fill in the details below so we can understand your brand, quality, and working
          style better. We&apos;re excited to start this partnership with you!
        </p>
      </section>

      <form onSubmit={handleSubmit} noValidate>
        <section className="py-[clamp(50px,6vw,100px)] px-4 sm:px-8 lg:px-12 bg-[#F8F4ED]">
          <div className="mx-auto w-full max-w-[980px]">
            <h2
              className="text-center text-[22px] md:text-[27px] mb-8 text-[#591902]"
              style={{ fontFamily: "'Malgin', serif" }}
            >
              Basic Details
            </h2>

            <div className="grid md:grid-cols-2 gap-5 md:gap-6">
              <Input
                label="Business Name*"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                placeholder="Enter your business name"
                maxLength={100}
                error={fieldErrors.businessName}
              />
              <Input
                label="Primary Contact Name*"
                name="contactPersonName"
                value={formData.contactPersonName}
                onChange={handleInputChange}
                placeholder="Enter full name"
                maxLength={100}
                error={fieldErrors.contactPersonName}
              />

              <PhoneInput
                value={formData.phone}
                onChange={handleInputChange}
                error={fieldErrors.phone}
              />
              <Input
                label="Email Address*"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email address"
                maxLength={120}
                error={fieldErrors.email}
              />

              <Input
                label="Operating Location*"
                name="operatingLocation"
                value={formData.operatingLocation}
                onChange={handleInputChange}
                placeholder="City & service area"
                maxLength={200}
                error={fieldErrors.operatingLocation}
              />
              <Input
                label="Team Size"
                name="teamSize"
                value={formData.teamSize}
                onChange={handleInputChange}
                placeholder="e.g. 8"
                inputMode="numeric"
                maxLength={4}
                error={fieldErrors.teamSize}
              />

              <Input
                label="Website / Social / Portfolio*"
                name="websiteSocialPortfolio"
                value={formData.websiteSocialPortfolio}
                onChange={handleInputChange}
                placeholder="Paste link"
                maxLength={300}
                error={fieldErrors.websiteSocialPortfolio}
              />
              <Input
                label="Established In"
                name="establishedIn"
                value={formData.establishedIn}
                onChange={handleInputChange}
                placeholder="e.g. 2021"
                inputMode="numeric"
                maxLength={4}
                error={fieldErrors.establishedIn}
              />
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-8 lg:px-12 bg-[#FFFFFF]">
          <div className="mx-auto my-[clamp(50px,6vw,80px)] w-full max-w-[980px]">
            <h2
              className="text-center text-[22px] md:text-[27px] mb-8 text-[#591902]"
              style={{ fontFamily: "'Malgin', serif" }}
            >
              About Your Company
            </h2>

            <div className="flex flex-col gap-5 md:gap-6">
              <MultiSelect
                label="Select your service category (You may select more than one category)*"
                selected={formData.serviceCategories}
                onChange={serviceCategories => {
                  setFormData(previous => ({ ...previous, serviceCategories }))
                  setSubmitError('')
                  setFieldErrors(previous => ({ ...previous, serviceCategories: '' }))
                }}
                error={fieldErrors.serviceCategories}
              />
              <Select
                label="What kind of events do you usually cater to?*"
                fieldKey="eventType"
                value={formData.eventType}
                onChange={event => {
                  setFormData(previous => ({ ...previous, eventType: event.target.value }))
                  setSubmitError('')
                  setFieldErrors(previous => ({ ...previous, eventType: '' }))
                }}
                options={EVENT_TYPE_OPTIONS}
                placeholder="Select event type"
                error={fieldErrors.eventType}
              />

              <div className="grid md:grid-cols-2 gap-5 md:gap-6">
                <Input
                  label="Share links of your best recent projects*"
                  name="portfolioLink"
                  value={formData.portfolioLink}
                  onChange={handleInputChange}
                  placeholder="Paste project / portfolio links"
                  maxLength={300}
                  error={fieldErrors.portfolioLink}
                />
                <Upload
                  label="Share pictures of your best recent projects"
                  fieldKey="workSample"
                  file={formData.workSample}
                  onChange={file => setFileValue('workSample', file)}
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                  error={fieldErrors.workSample}
                />
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-[14px] text-[#364022]">
                  Upload any 1 of the following documents for verification. (This is for internal use
                  only and ensures credibility on the platform)*
                </p>
                <Select
                  label="Document type*"
                  fieldKey="verificationDocumentType"
                  value={formData.verificationDocumentType}
                  onChange={event => {
                    setFormData(previous => ({
                      ...previous,
                      verificationDocumentType: event.target.value,
                    }))
                    setSubmitError('')
                    setFieldErrors(previous => ({ ...previous, verificationDocumentType: '' }))
                  }}
                  options={VERIFICATION_DOCUMENT_OPTIONS}
                  placeholder="Select document type"
                  error={fieldErrors.verificationDocumentType}
                />
                <Upload
                  label=""
                  full
                  fieldKey="verificationDocument"
                  file={formData.verificationDocument}
                  onChange={file => setFileValue('verificationDocument', file)}
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                  error={fieldErrors.verificationDocument}
                />
                <p className="text-[12px] text-[#8F8F8F]">
                  Accepted: JPG, PNG, PDF, DOC — max 5 MB
                </p>
              </div>
            </div>

            {submitError ? (
              <div className="mt-8 rounded-md bg-[#FFE6E6] px-4 py-3 text-sm text-[#8F2D1F]">
                {submitError}
              </div>
            ) : null}

            <div className="flex justify-end mt-10">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#C4A874] text-white px-10 py-3 rounded-full disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </section>
      </form>
    </div>
  )
}
