import React from 'react'

/* SMALL REUSABLE COMPONENT */
function Detail({ label, value }) {
  return (
    <div className="flex justify-between items-start">
      <p className="text-gray-500">{label}</p>
      <p className="text-[#2C2C2C] text-right">{value}</p>
    </div>
  )
}

/* DATA */
const STEPS = [
  {
    title: 'Confirmation Email',
    desc: 'A booking confirmation will be sent to priya@example.com',
  },
  {
    title: 'Vendor Coordination',
    desc: 'Our team will contact you within 24 hrs to confirm details',
  },
  {
    title: 'Event Day',
    desc: 'Your vendor arrives 2 hrs before the event for setup',
  },
  {
    title: 'Balance Payment',
    desc: 'Remaining ₹47,950 due 3 days before the event',
  },
]

export default function BookingConfirmation() {
  return (
    <div className="bg-[#FAF9F7] min-h-screen px-4 md:px-8 lg:px-16 py-10 md:pt-24">
      {/* MAIN GRID */}
      <div className="flex flex-col md:flex-row gap-[clamp(24px,6vw,150px)]">
        {/* LEFT SIDE */}
        <div className="flex-1 space-y-6">
          {/* SUCCESS ICON */}
          <div className="w-14 h-14 rounded-full bg-[#B7B59F] flex items-center justify-center mb-6">
            ✓
          </div>

          {/* TITLE */}
          <h1 className=" text-[16px] md:text-[27px] font-semibold text-[#2C2C2C] mb-2">
            Booking Confirmed!
          </h1>

          <p className="text-gray-500 mb-6 text-[12px] md:text-[16px]">
            Your event has been successfully booked. Details below.
          </p>

          {/* BUTTONS */}
          <div className="flex gap-4 mb-8 flex-wrap">
            <button className="px-3 py-2 rounded-full border border-[#957960] text-[#957960] text-[12px]">
              Download Receipt
            </button>

            <button className="px-3 py-2 rounded-full bg-[#D8C9AF] text-[#6B5B4D] text-[12px]">
              Back to Home
            </button>
          </div>

          <hr className="my-4 border-[#0000001A]" />

          {/* ADVANCE PAID BOX */}
          <div className="bg-[#F8F4ED] rounded-xl p-5 flex justify-between items-center mb-6">
            <div>
              <p className="text-[#957960] font-medium">Advance Paid</p>
              <p className="text-sm text-gray-500">Balance due before event</p>
            </div>

            <div className="text-right">
              <p className="text-lg text-[#957960] font-semibold">₹20,550</p>
              <p className="text-sm text-gray-700">₹47,950</p>
            </div>
          </div>

          <hr className="my-4 border-[#0000001A]" />

          {/* EVENT DETAILS */}
          <div className="justify-between text-[12px]">
            <Detail label="Event" value="The Grand Celebration — Birthday Party" />
            <Detail label="Date" value="Saturday, 14 June 2026" />
            <Detail label="Location" value="Jaipur, Rajasthan" />
            <Detail label="Package" value="Grand Celebration + 5 Add-ons" />
          </div>

          <hr className="my-4 border-[#0000001A]" />

          <p className="text-xs text-gray-500">
            Questions? Contact us at support@elewen.in or call +91 98XX XXXXX
          </p>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex-1">
          <div className="bg-[#EADEC8] rounded-2xl p-6 h-fit max-w-[458px] lg:ml-auto">
            <h3 className="text-[#591902] text-[12px] font-medium mb-6">What Happens Next</h3>

            <div className="space-y-8 relative">
              {/* vertical line */}
              <div className="absolute left-4 top-2 bottom-2 w-[1px] border-l border-dashed border-[#C8B89E]"></div>

              {STEPS.map((step, i) => (
                <div key={i} className="flex gap-4 relative">
                  {/* number */}
                  <div className="w-8 h-8 rounded-full border border-[#CDB17E] text-[#957960] flex items-center justify-center bg-white z-10">
                    {i + 1}
                  </div>

                  {/* content */}
                  <div>
                    <p className="font-medium text-[#1C1C1C] text-[16px]">{step.title}</p>
                    <p className="text-sm text-[#364022] text-[12px]">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
