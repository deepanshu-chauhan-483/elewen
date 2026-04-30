import { useMemo, useState } from 'react'
import contactVisual from '../assets/images/calls.png'

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  message: '',
}

function ContactInfoRow({ href, label, children }) {
  const content = (
    <span className="inline-flex items-center gap-3 text-[15px] text-white/90">
      {children}
      <span>{label}</span>
    </span>
  )

  if (href) {
    return (
      <a href={href} className="transition-opacity hover:opacity-75">
        {content}
      </a>
    )
  }

  return content
}

export default function ContactPage() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const isFormValid = useMemo(
    () =>
      form.firstName.trim() &&
      form.lastName.trim() &&
      form.email.trim() &&
      form.phone.trim() &&
      form.message.trim(),
    [form]
  )

  const handleChange = event => {
    const { name, value } = event.target
    setIsSubmitted(false)
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = event => {
    event.preventDefault()
    if (!isFormValid) return

    setIsSubmitted(true)
    setForm(INITIAL_FORM)
  }

  return (
    <main className="min-h-screen  px-5 pb-16 pt-28 md:px-8 md:pb-20 md:pt-32 lg:px-12">
      <section
        data-nav-theme="light"
        className=" grid max-w-[1400px] overflow-hidden    lg:grid-cols-[1.08fr_0.92fr]"
      >
        <div className="relative min-h-[520px] overflow-hidden lg:min-h-[840px]">
          <img
            src={contactVisual}
            alt="Contact Elewen"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 " />

          <div className="relative flex h-full flex-col justify-end px-7 pb-7 pt-12 md:px-10 md:pb-10 lg:px-12 lg:pb-12">
            <div className="max-w-[420px]">
              <p
                className="text-[48px] leading-[0.92] text-white md:text-[66px]"
                style={{ fontFamily: "'Malgin', serif", fontWeight: 400 }}
              >
                Let&apos;s Plan
                <br />
                This Together
              </p>
              <p className="mt-5 max-w-[360px] text-[15px] leading-[1.7] text-white/90 md:text-[16px]">
                Have questions, need help, or want to discuss your event? We&apos;re here to
                guide you.
              </p>
            </div>

            <div className="mt-10 flex flex-col gap-4 text-white md:flex-row md:flex-wrap md:items-center md:gap-x-8 md:gap-y-3">
              <ContactInfoRow href="mailto:hello@elewen.com" label="hello@elewen.com">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 7L10.94 11.85C11.57 12.29 12.43 12.29 13.06 11.85L20 7M5.6 19H18.4C19.28 19 20 18.28 20 17.4V6.6C20 5.72 19.28 5 18.4 5H5.6C4.72 5 4 5.72 4 6.6V17.4C4 18.28 4.72 19 5.6 19Z"
                    stroke="white"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </ContactInfoRow>

              <ContactInfoRow href="tel:+917652872986" label="+91 7652872986">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21 16.92V19.92C21 20.47 20.55 20.92 20 20.92C10.61 20.92 3 13.31 3 3.92C3 3.37 3.45 2.92 4 2.92H7C7.55 2.92 8 3.37 8 3.92V6.92C8 7.3 7.79 7.66 7.45 7.84L5.91 8.69C6.76 11.08 8.84 13.16 11.23 14.01L12.08 12.47C12.26 12.13 12.62 11.92 13 11.92H16C16.55 11.92 17 12.37 17 12.92V15.92C17 16.47 17.45 16.92 18 16.92H21Z"
                    stroke="white"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </ContactInfoRow>

              <ContactInfoRow href="https://www.instagram.com" label="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M16 3H8C5.24 3 3 5.24 3 8V16C3 18.76 5.24 21 8 21H16C18.76 21 21 18.76 21 16V8C21 5.24 18.76 3 16 3Z"
                    stroke="white"
                    strokeWidth="1.7"
                  />
                  <path
                    d="M15.5 11.37C15.62 12.18 15.48 13 15.11 13.73C14.74 14.46 14.16 15.06 13.44 15.45C12.72 15.84 11.9 16 11.09 15.9C10.28 15.8 9.52 15.45 8.93 14.9C8.35 14.35 7.95 13.61 7.81 12.81C7.67 12 7.8 11.18 8.16 10.43C8.52 9.69 9.09 9.06 9.8 8.65C10.52 8.25 11.33 8.07 12.14 8.14C12.97 8.22 13.74 8.56 14.35 9.09C14.96 9.62 15.38 10.33 15.5 11.13V11.37Z"
                    stroke="white"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M16.5 7.5H16.51" stroke="white" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </ContactInfoRow>
            </div>
          </div>
        </div>

        <div className="relative px-6 py-10 md:px-10 md:py-12 lg:px-12 lg:py-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,186,142,0.16),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.84),rgba(244,238,229,0.68))]" />

          <div className="relative mx-2 max-w-[560px]">
            <div className="text-center">
              <h1
                className="text-[48px] leading-[0.95] text-[#364022] md:text-[60px]"
                style={{ fontFamily: "'Malgin', serif", fontWeight: 400 }}
              >
                Get in Touch
              </h1>
              <p className="mx-auto mt-5 max-w-[460px] text-[16px] leading-[1.65] text-[#6C675D]">
                We&apos;re here to help whether you have a question, need guidance, or simply
                want to connect.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-10 space-y-6 md:mt-12">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-3 block text-[14px] font-medium text-[#2D2D2D]">
                    First name*
                  </span>
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="Enter your first name"
                    className="h-[52px] w-full rounded-[10px] border border-[#D7CFC1] bg-[#F4EFE6] px-4 text-[16px] text-[#2D2D2D] outline-none transition-colors placeholder:text-[#B5AA9A] focus:border-[#CDB17E]"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-3 block text-[14px] font-medium text-[#2D2D2D]">
                    Last name*
                  </span>
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="Enter your last name"
                    className="h-[52px] w-full rounded-[10px] border border-[#D7CFC1] bg-[#F4EFE6] px-4 text-[16px] text-[#2D2D2D] outline-none transition-colors placeholder:text-[#B5AA9A] focus:border-[#CDB17E]"
                    required
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-3 block text-[14px] font-medium text-[#2D2D2D]">Email*</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="h-[52px] w-full rounded-[10px] border border-[#D7CFC1] bg-[#F4EFE6] px-4 text-[16px] text-[#2D2D2D] outline-none transition-colors placeholder:text-[#B5AA9A] focus:border-[#CDB17E]"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-3 block text-[14px] font-medium text-[#2D2D2D]">
                  Phone number*
                </span>
                <div className="flex gap-3">
                  <div className="flex h-[52px] w-[92px] items-center justify-between rounded-[10px] border border-[#D7CFC1] bg-[#F4EFE6] px-3 text-[16px] text-[#2D2D2D]">
                    <span className="text-[22px] leading-none">🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    className="h-[52px] flex-1 rounded-[10px] border border-[#D7CFC1] bg-[#F4EFE6] px-4 text-[16px] text-[#2D2D2D] outline-none transition-colors placeholder:text-[#B5AA9A] focus:border-[#CDB17E]"
                    required
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-3 block text-[14px] font-medium text-[#2D2D2D]">Message</span>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Enter your message"
                  rows={6}
                  className="w-full rounded-[10px] border border-[#D7CFC1] bg-[#F4EFE6] px-4 py-4 text-[16px] text-[#2D2D2D] outline-none transition-colors placeholder:text-[#B5AA9A] focus:border-[#CDB17E]"
                  required
                />
              </label>

              {isSubmitted ? (
                <p className="text-center text-[14px] text-[#364022]">
                  Thanks, your message has been noted. Our team will connect with you soon.
                </p>
              ) : null}

              <button
                type="submit"
                disabled={!isFormValid}
                className="flex h-[56px] w-full items-center justify-center rounded-full bg-[#D4BA8E] px-6 text-[18px] font-medium text-white transition-colors hover:bg-[#C6AB7F] disabled:cursor-not-allowed disabled:bg-[#D8D2C7]"
              >
                Send message
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}
