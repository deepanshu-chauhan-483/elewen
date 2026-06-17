import { useState } from 'react'
import bgImage from '../assets/images/contact.png'
import { getFieldErrors, getGlobalErrorMessage } from '../lib/formErrors'
import { submitContact } from '../lib/api'

export default function ContactUsPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const handleInputChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setSubmitError('')
    setFieldErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validateForm = () => {
    const nextErrors = {}

    if (!formData.firstName.trim()) nextErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) nextErrors.lastName = 'Last name is required'
    if (!formData.email.trim()) nextErrors.email = 'Email is required'
    if (!formData.phone.trim()) nextErrors.phone = 'Phone number is required'
    if (!formData.message.trim()) nextErrors.message = 'Message is required'

    return nextErrors
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setSubmitError('')
    setSubmitMessage('')
    setFieldErrors({})

    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      return
    }

    setIsSubmitting(true)

    try {
      const data = await submitContact(formData)
      setSubmitMessage(data.message || 'Your message has been sent successfully!')

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        message: '',
      })

      // Clear success message after 5 seconds
      setTimeout(() => setSubmitMessage(''), 5000)
    } catch (err) {
      const nextFieldErrors = getFieldErrors(err)
      if (Object.keys(nextFieldErrors).length > 0) {
        setFieldErrors(nextFieldErrors)
      } else {
        setSubmitError(getGlobalErrorMessage(err, 'Failed to send message. Please try again.'))
      }
      console.error('[ContactUsPage] submission error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full bg-white  px-4 pb-12 md:px-4 lg:px-6" data-nav-theme="glass">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 md:flex-row">
        <div className="hidden md:block md:w-[48%] md:shrink-0">
          <div className="sticky top-15">
            <div
              className="relative flex min-h-[90vh] w-full flex-col justify-end overflow-hidden rounded-[20px] p-12 "
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%), url(${bgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="max-w-[520px] text-white">
                <h2
                  className="text-[clamp(40px,5vw,61px)] leading-[100%]"
                  style={{ fontFamily: "'Malgin', serif" }}
                >
                  Let&apos;s Plan
                  <br />
                  This Together
                </h2>

                <p className="mt-4 text-[16px] leading-[150%] text-white/80">
                  Have questions, need help, or want to discuss your event? We&apos;re here to guide
                  you.
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-white/80">
                  <div className="flex flex-wrap items-center md:gap-2 lg:gap-6 text-[14px] font-medium">
                    <a
                      href="mailto:xyz@gmail.com"
                      className="flex items-center transition-opacity hover:opacity-100"
                    >
                      <span className="flex h-7 w-7 items-center justify-start text-white">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <rect x="3" y="5" width="18" height="14" rx="2.5" />
                          <path
                            d="m4.5 7 6.62 5.29a1.4 1.4 0 0 0 1.76 0L19.5 7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <span>info@elewen.co.in</span>
                    </a>

                    <a
                      href="tel:+917652872986"
                      className="flex items-center transition-opacity hover:opacity-100"
                    >
                      <span className="flex h-7 w-7 items-center justify-start text-white">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <path
                            d="M21 16.2v2.6a1.8 1.8 0 0 1-1.96 1.8A17.83 17.83 0 0 1 3.4 4.96 1.8 1.8 0 0 1 5.2 3h2.6a1.8 1.8 0 0 1 1.8 1.55l.28 2.24a1.8 1.8 0 0 1-.51 1.49l-1.64 1.64a14.5 14.5 0 0 0 6.35 6.35l1.64-1.64a1.8 1.8 0 0 1 1.49-.51l2.24.28A1.8 1.8 0 0 1 21 16.2Z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <span>+91 7652872986</span>
                    </a>
                  </div>

                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                    className="flex h-7 w-7 items-center justify-start text-white transition-opacity hover:opacity-100"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="5" />
                      <circle cx="12" cy="12" r="4.2" />
                      <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mx-auto flex w-full flex-col px-4 py-6 mt-8 min-[540px]:mt-15  min-[540px]:px-8 min-[540px]:py-2">
            <div className="flex w-full flex-col justify-start">
              <div className=" flex w-full  flex-col gap-[16px] min-[540px]:gap-[24px]">
                <div className="flex w-full flex-col items-center gap-[8px]">
                  <h1
                    className="w-full text-center text-[32px] leading-[100%] text-[#364022] min-[540px]:text-[44px] lg:text-[61px]"
                    style={{ fontFamily: "'Malgin', serif" }}
                  >
                    Get in Touch
                  </h1>
                  <p
                    className="w-full max-w-[421px] text-center text-[13px] leading-[150%] text-[#727355] min-[540px]:text-[15px] lg:text-[16px]"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    We&apos;re here to help whether you have a question, need guidance, or simply
                    want to connect.
                  </p>
                </div>

                <form
                  className="flex w-full flex-col gap-[16px] min-[540px]:gap-[24px]"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                  onSubmit={handleSubmit}
                >
                  <div className="flex w-full flex-col gap-[16px] min-[540px]:flex-row">
                    <div className="flex flex-1 flex-col gap-[8px]">
                      <label className="text-[13px] font-medium leading-[150%] text-[#364022] min-[540px]:text-[16px]">
                        First name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="Name"
                        className="h-[40px] w-full rounded-[6px] border border-[rgba(45,45,45,0.25)] bg-[#F8F4ED] px-[16px] py-[8px] text-[14px] text-[#364022] placeholder:text-[#BFAC9B] transition-colors focus:border-[#CDB17E] focus:outline-none min-[540px]:text-[16px]"
                      />
                      {fieldErrors.firstName ? (
                        <p className="text-[12px] text-[#8F2D1F]">{fieldErrors.firstName}</p>
                      ) : null}
                    </div>

                    <div className="flex flex-1 flex-col gap-[8px]">
                      <label className="text-[13px] font-medium leading-[150%] text-[#364022] min-[540px]:text-[16px]">
                        Last name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Name"
                        className="h-[40px] w-full rounded-[6px] border border-[rgba(45,45,45,0.25)] bg-[#F8F4ED] px-[16px] py-[8px] text-[14px] text-[#364022] placeholder:text-[#BFAC9B] transition-colors focus:border-[#CDB17E] focus:outline-none min-[540px]:text-[16px]"
                      />
                      {fieldErrors.lastName ? (
                        <p className="text-[12px] text-[#8F2D1F]">{fieldErrors.lastName}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-[8px]">
                    <label className="text-[13px] font-medium leading-[150%] text-[#364022] min-[540px]:text-[16px]">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="email@"
                      className="h-[40px] w-full rounded-[6px] border border-[rgba(45,45,45,0.25)] bg-[#F8F4ED] px-[16px] py-[8px] text-[14px] text-[#364022] placeholder:text-[#BFAC9B] transition-colors focus:border-[#CDB17E] focus:outline-none min-[540px]:text-[16px]"
                    />
                    {fieldErrors.email ? (
                      <p className="text-[12px] text-[#8F2D1F]">{fieldErrors.email}</p>
                    ) : null}
                  </div>

                  <div className="flex w-full flex-col gap-[8px]">
                    <label className="text-[13px] font-medium leading-[150%] text-[#364022] min-[540px]:text-[16px]">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                      className="h-[40px] w-full rounded-[6px] border border-[rgba(45,45,45,0.25)] bg-[#F8F4ED] px-[16px] py-[8px] text-[14px] text-[#364022] placeholder:text-[#BFAC9B] transition-colors focus:border-[#CDB17E] focus:outline-none min-[540px]:text-[16px]"
                    />
                    {fieldErrors.phone ? (
                      <p className="text-[12px] text-[#8F2D1F]">{fieldErrors.phone}</p>
                    ) : null}
                  </div>

                  <div className="flex w-full flex-col gap-[8px]">
                    <label className="text-[13px] font-medium leading-[150%] text-[#364022] min-[540px]:text-[16px]">
                      Message
                    </label>
                    <textarea
                      rows={6}
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Tell us how we can help"
                      className="w-full resize-none rounded-[6px] border border-[rgba(45,45,45,0.25)] bg-[#F8F4ED] px-[16px] py-[12px] text-[14px] text-[#364022] placeholder:text-[#BFAC9B] transition-colors focus:border-[#CDB17E] focus:outline-none min-[540px]:text-[16px]"
                    />
                    {fieldErrors.message ? (
                      <p className="text-[12px] text-[#8F2D1F]">{fieldErrors.message}</p>
                    ) : null}
                  </div>

                  <div className="flex w-full flex-col items-center gap-[16px] pt-2">
                    {submitError && (
                      <div className="w-full rounded-[6px] bg-[#FFE6E6] px-4 py-3 text-sm text-[#8F2D1F]">
                        {submitError}
                      </div>
                    )}
                    {submitMessage && (
                      <div className="w-full rounded-[6px] bg-[#E8F5E9] px-4 py-3 text-sm text-[#2E7D32]">
                        {submitMessage}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex h-[44px] w-full items-center justify-center rounded-[56px] bg-[#CDB17E] text-[14px] font-medium leading-[150%] text-[#FAFAFA] transition-colors hover:bg-[#b89e6e] disabled:cursor-not-allowed disabled:opacity-60 min-[540px]:text-[16px]"
                    >
                      {isSubmitting ? 'Sending...' : 'Send message'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
