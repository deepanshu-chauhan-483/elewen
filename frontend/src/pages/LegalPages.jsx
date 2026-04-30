import { useState } from 'react'

const termsData = [
  {
    id: 'terms',
    title: '1. What are Terms and Conditions',
    content: [
      ' Lorem ipsum dolor sit amet consectetur adipisicing elit. Distinctio quisquam, laborum nam aliquid assumenda facere dicta sequi neque, quas, nesciunt ratione. Pariatur numquam dolorem alias facilis provident laboriosam. Sint, repellendus.',
      'Cras sagittis nunc lectus, in condimentum ligula ornare at...',
    ],
    children: [
      {
        id: 'personal-data',
        title: 'A. Personal Data that we collect about you.',
        content: ['Etiam rhoncus quis eros eget fringilla...'],
      },
      {
        id: 'auto-data',
        title: 'B. Information that we collect automatically on our Sites.',
        content: ['Proin efficitur vestibulum molestie...'],
      },
    ],
  },
  {
    id: 'privacy',
    title: '2. Privacy and copyright protection',
    content: ['Proin commodo aliquam elit eu dignissim...'],
  },
  {
    id: 'content',
    title: '3. Your content in our services',
    content: ['Integer vel dictum felis, vitae gravida sem...'],
  },
]

export default function Terms() {
  const [activeId, setActiveId] = useState('personal-data')

  return (
    <div className="w-full">
      {/* HEADER */}
      <section
        className="w-full text-center py-[80px] mt-6 md:mt-10"
        style={{ backgroundColor: '#591902' }}
      >
        <h1 className="text-white text-[80px] font-serif">Terms & Conditions</h1>
        <p className="text-white/70 mt-3 text-[16px]">
          These terms govern your use of Elewen and our services.
        </p>
      </section>

      {/* CONTENT */}
      <section className="max-w-[1440px] mx-auto flex py-[70px] px-[clamp(80px,10vw,200px)] gap-[clamp(40px,6vw,70px)]">
        {/* LEFT CONTENT */}
        <div className="flex-2 text-[#3a3a3a] space-y-6">
          {termsData.map(section => (
            <div key={section.id} id={section.id}>
              {/* MAIN TITLE */}
              <h2 className="text-[24px] font-semibold mb-3" style={{ fontFamily: "'Poppins'" }}>
                {section.title}
              </h2>

              {/* MAIN CONTENT */}
              {section.content?.map((para, i) => (
                <p key={i} className="text-[14px] leading-[1.8] mb-3">
                  {para}
                </p>
              ))}

              {/* CHILD SECTIONS */}
              {section.children?.map(child => (
                <div key={child.id} id={child.id} className="mt-4">
                  <h4 className="text-[18px] font-medium mb-2">{child.title}</h4>

                  {child.content.map((para, i) => (
                    <p key={i} className="text-[14px] leading-[1.8] mb-2">
                      {para}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="w-[260px] flex-1">
          <div className="bg-[#FAFAFA] p-5 text-[14px] sticky top-[120px]">
            <ul className="space-y-3">
              {termsData.map(section => (
                <div key={section.id}>
                  {/* MAIN */}
                  <li
                    className="font-medium cursor-pointer"
                    onClick={() =>
                      document.getElementById(section.id)?.scrollIntoView({
                        behavior: 'smooth',
                      })
                    }
                  >
                    {section.title}
                  </li>

                  {/* CHILD */}
                  {section.children?.map(child => (
                    <li
                      key={child.id}
                      onClick={() => {
                        setActiveId(child.id)
                        document.getElementById(child.id)?.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className={`cursor-pointer pl-3 ${
                        activeId === child.id ? 'text-[#6a8f4e] font-medium' : 'text-gray-600'
                      }`}
                    >
                      {child.title}
                    </li>
                  ))}
                </div>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
