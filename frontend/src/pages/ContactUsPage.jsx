import bgImage from '../assets/images/contact.png'

export default function ContactUsPage() {
  return (
    <div className="w-full bg-white px-4 pb-12 md:px-8 lg:px-16" data-nav-theme="blue-glass">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 lg:flex-row">
        <div className="hidden lg:block lg:w-[48%] lg:shrink-0">
          <div className="sticky top-10">
            <div
              className="relative flex min-h-[90vh] w-full flex-col justify-end overflow-hidden rounded-[20px] p-12"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%), url(${bgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="max-w-[520px] text-white">
                <h2
                  className="text-[clamp(40px,5vw,64px)] leading-[100%]"
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

                <div className="mt-6 flex items-center gap-6 text-[14px] text-white/80">
                  <span>xyz@gmail.com</span>
                  <span>+91 7652872986</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mx-auto flex w-full max-w-[655px] flex-col px-4 py-6 min-[540px]:mt-15  min-[540px]:px-8 min-[540px]:py-2">
            <div className="flex w-full flex-col justify-start">
              <div className="mx-auto flex w-full max-w-[527px] flex-col gap-[16px] min-[540px]:gap-[24px]">
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
                >
                  <div className="flex w-full flex-col gap-[16px] min-[540px]:flex-row">
                    <div className="flex flex-1 flex-col gap-[8px]">
                      <label className="text-[13px] font-medium leading-[150%] text-[#364022] min-[540px]:text-[16px]">
                        First name
                      </label>
                      <input
                        type="text"
                        placeholder="Name"
                        className="h-[40px] w-full rounded-[6px] border border-[rgba(45,45,45,0.25)] bg-[#F8F4ED] px-[16px] py-[8px] text-[14px] text-[#364022] placeholder:text-[#BFAC9B] transition-colors focus:border-[#CDB17E] focus:outline-none min-[540px]:text-[16px]"
                      />
                    </div>

                    <div className="flex flex-1 flex-col gap-[8px]">
                      <label className="text-[13px] font-medium leading-[150%] text-[#364022] min-[540px]:text-[16px]">
                        Last name
                      </label>
                      <input
                        type="text"
                        placeholder="Name"
                        className="h-[40px] w-full rounded-[6px] border border-[rgba(45,45,45,0.25)] bg-[#F8F4ED] px-[16px] py-[8px] text-[14px] text-[#364022] placeholder:text-[#BFAC9B] transition-colors focus:border-[#CDB17E] focus:outline-none min-[540px]:text-[16px]"
                      />
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-[8px]">
                    <label className="text-[13px] font-medium leading-[150%] text-[#364022] min-[540px]:text-[16px]">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="email@"
                      className="h-[40px] w-full rounded-[6px] border border-[rgba(45,45,45,0.25)] bg-[#F8F4ED] px-[16px] py-[8px] text-[14px] text-[#364022] placeholder:text-[#BFAC9B] transition-colors focus:border-[#CDB17E] focus:outline-none min-[540px]:text-[16px]"
                    />
                  </div>

                  <div className="flex w-full flex-col gap-[8px]">
                    <label className="text-[13px] font-medium leading-[150%] text-[#364022] min-[540px]:text-[16px]">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      placeholder="Enter your phone number"
                      className="h-[40px] w-full rounded-[6px] border border-[rgba(45,45,45,0.25)] bg-[#F8F4ED] px-[16px] py-[8px] text-[14px] text-[#364022] placeholder:text-[#BFAC9B] transition-colors focus:border-[#CDB17E] focus:outline-none min-[540px]:text-[16px]"
                    />
                  </div>

                  <div className="flex w-full flex-col gap-[8px]">
                    <label className="text-[13px] font-medium leading-[150%] text-[#364022] min-[540px]:text-[16px]">
                      Message
                    </label>
                    <textarea
                      rows={6}
                      placeholder="Tell us how we can help"
                      className="w-full resize-none rounded-[6px] border border-[rgba(45,45,45,0.25)] bg-[#F8F4ED] px-[16px] py-[12px] text-[14px] text-[#364022] placeholder:text-[#BFAC9B] transition-colors focus:border-[#CDB17E] focus:outline-none min-[540px]:text-[16px]"
                    />
                  </div>

                  <div className="flex w-full flex-col items-center gap-[16px] pt-2">
                    <button
                      type="submit"
                      className="flex h-[44px] w-full items-center justify-center rounded-[56px] bg-[#CDB17E] text-[14px] font-medium leading-[150%] text-[#FAFAFA] transition-colors hover:bg-[#b89e6e] min-[540px]:text-[16px]"
                    >
                      Send message
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
