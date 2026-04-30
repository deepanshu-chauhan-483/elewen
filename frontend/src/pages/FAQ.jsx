import { useState } from 'react'

const faqs = [
  {
    q: 'How does Elewen work?',
    a: 'You select your event, choose services like decor or catering, and pick from curated packages. We handle the rest — from coordination to execution.',
  },
  { q: 'Can I customize a package?', a: '' },
  { q: 'Do I need to book everything at once?', a: '' },
  { q: 'What do the package levels mean?', a: '' },
  { q: 'Why does the final price differ from the starting price?', a: '' },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <div className="w-full">
      {/* HEADER */}
      <section
        className="w-full text-center py-[80px] mt-6 md:mt-10"
        style={{ backgroundColor: '#591902' }}
      >
        <h1 className="text-white text-[80px] leading-tight">Frequently Asked Questions</h1>
        <p className="text-white/70 mt-4 text-[16px]">
          Everything you need to know about planning, booking, and experiencing Elewen.
        </p>
      </section>

      {/* CONTENT */}
      <section className="flex max-w-[1200px] mx-auto py-[60px]">
        {/* LEFT MENU */}
        <div className="w-[250px] pr-6 border-r border-[#364022]">
          <ul className="space-y-5 text-[16px] text-gray-600">
            <li className="text-black font-medium">General</li>
            <li>Packages & Pricing</li>
            <li>Sample Tasting</li>
            <li>Bookings & Payments</li>
            <li>Vendors & Execution</li>
            <li>Changes & Support</li>
          </ul>
        </div>

        {/* FAQ BOX */}
        <div className="flex-1 pl-10">
          <div className="bg-[#f7f7f7] p-8">
            {faqs.map((item, index) => (
              <div
                key={index}
                className="border-b border-gray-300 py-5 cursor-pointer"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-[27px] font-serif">{item.q}</h3>
                  <span className="text-[24px]">{openIndex === index ? '−' : '+'}</span>
                </div>

                {openIndex === index && item.a && (
                  <p className="mt-3 text-[16px] text-gray-600 max-w-[700px]">{item.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
