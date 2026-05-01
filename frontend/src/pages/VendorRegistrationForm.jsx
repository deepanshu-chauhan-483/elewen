import { useState, useRef, useEffect } from 'react'

// INPUT
function Input({ label, placeholder }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[14px] text-[#364022]">{label}</label>
      <input
        placeholder={placeholder}
        className="bg-white border border-[#E5E5E5] p-3 rounded-md outline-none focus:ring-1 focus:ring-[#C4A874]"
      />
    </div>
  )
}

// PHONE INPUT
function PhoneInput() {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[14px] text-[#364022]">Phone number*</label>
      <input
        placeholder="Enter mobile number"
        className="flex-1 bg-white border border-[#E5E5E5] p-3 rounded-md outline-none focus:ring-1 focus:ring-[#C4A874]"
      />
    </div>
  )
}

function MultiSelect({ label }) {
  const options = ['Decor', 'Catering Services', 'Sheesha Services', 'Bartending']

  const [selected, setSelected] = useState(['Decor', 'Catering Services'])
  const [inputValue, setInputValue] = useState('')
  const [open, setOpen] = useState(false)

  const ref = useRef()

  // close dropdown on outside click
  useEffect(() => {
    const handleClick = e => {
      if (!ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const addItem = value => {
    if (!value.trim()) return
    if (!selected.includes(value)) {
      setSelected([...selected, value])
    }
    setInputValue('')
  }

  const removeItem = item => {
    setSelected(selected.filter(i => i !== item))
  }

  const filteredOptions = options.filter(
    opt => !selected.includes(opt) && opt.toLowerCase().includes(inputValue.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-2 relative" ref={ref}>
      <label className="text-[14px] text-[#364022]">{label}</label>

      {/* INPUT BOX */}
      <div
        className="bg-white border border-[#E5E5E5] rounded-md p-2 flex flex-wrap items-center gap-2 cursor-text"
        onClick={() => setOpen(true)}
      >
        {/* TAGS */}
        {selected.map((item, i) => (
          <span
            key={i}
            className="bg-[#BFAC9B] px-3 py-1 rounded-full text-[12px] text-[#591902] flex items-center gap-1"
          >
            {item}
            <button onClick={() => removeItem(item)}>×</button>
          </span>
        ))}

        {/* INPUT */}
        <input
          value={inputValue}
          onChange={e => {
            setInputValue(e.target.value)
            setOpen(true)
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addItem(inputValue)
            }
          }}
          placeholder="Select or type..."
          className="flex-1 min-w-[120px] outline-none text-[13px]"
        />

        {/* DROPDOWN ICON */}
        <span
          onClick={e => {
            e.stopPropagation() // prevent parent click
            setOpen(prev => !prev)
          }}
          className="ml-auto cursor-pointer text-[#591902] text-[12px]"
        >
          {open ? '▲' : '▼'}
        </span>
      </div>

      {/* DROPDOWN */}
      {open && (
        <div className="absolute top-full mt-1 w-full bg-white border border-[#E5E5E5] rounded-md shadow-sm z-10">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, i) => (
              <div
                key={i}
                onClick={() => addItem(opt)}
                className="px-3 py-2 text-[13px] cursor-pointer hover:bg-[#F5F2EC]"
              >
                {opt}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-[13px] text-gray-400">
              Press Enter to add &quot;{inputValue}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// SELECT
function Select({ label }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[14px] text-[#364022]">{label}</label>

      <select className="bg-white border border-[#E5E5E5] p-3 rounded-md outline-none focus:ring-1 focus:ring-[#C4A874]">
        <option>Select all that apply</option>
        <option>Wedding</option>
        <option>Birthday</option>
        <option>Corporate</option>
      </select>
    </div>
  )
}

// UPLOAD
function Upload({ label, full }) {
  return (
    <div className={`flex flex-col gap-2 ${full ? 'w-full' : ''}`}>
      <label className="text-[14px] text-[#364022]">{label}</label>

      <div className="flex items-center justify-between bg-white border border-[#E5E5E5] p-3 rounded-md">
        <span className="text-gray-400 text-[14px]">Upload file</span>

        <button type="button" className="bg-[#BFAC9B] px-3 py-1 rounded-md text-[12px]">
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
    </div>
  )
}

export default function VendorRegistration() {
  return (
    <div className="w-full">
      {/* HEADER */}
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

      {/* FORM SECTION */}
      <section className="py-[clamp(50px,6vw,100px)] px-[clamp(80px,10vw,200px)] bg-[#F8F4ED]">
        {/* BASIC DETAILS */}
        <div className=" mx-auto">
          <h2
            className="text-center text-[22px] md:text-[27px] mb-8 text-[#591902]"
            style={{ fontFamily: "'Malgin', serif" }}
          >
            Basic Details
          </h2>

          <div className="grid md:grid-cols-2 gap-[clamp(20px,3vw,30px)]">
            <Input label="Business Name*" placeholder="Enter your business name" />
            <Input label="Primary Contact Name*" placeholder="Enter full name" />

            <PhoneInput />
            <Input label="Email Address*" placeholder="Enter email address" />

            <Input label="Operating Location*" placeholder="City & service area" />
            <Input label="Team Size" placeholder="e.g. 8 members" />

            <Input label="Website / Social / Portfolio*" placeholder="Paste link" />
            <Input label="Established In" placeholder="e.g. 2021" />
          </div>
        </div>
      </section>
      <section className="px-[clamp(80px,10vw,200px)] bg-[#FFFFFF]">
        {/* COMPANY DETAILS */}
        <div className="mx-auto my-[clamp(50px,6vw,80px)]">
          <h2
            className="text-center text-[22px] md:text-[27px] mb-8 text-[#591902]"
            style={{ fontFamily: "'Malgin', serif" }}
          >
            Company Details
          </h2>

          <div className="flex flex-col gap-[clamp(20px,3vw,30px)]">
            <MultiSelect label="Services You Offer*" />
            <Select label="Event Types You Cater To*" />

            <div className="grid md:grid-cols-2 gap-[clamp(20px,3vw,40px)]">
              <Input label="Portfolio Link" placeholder="Paste your portfolio link" />
              <Upload label="Upload Work Samples" />
            </div>

            <Upload label="Verification Document*" full />
          </div>

          {/* BUTTON */}
          <div className="flex justify-end mt-10">
            <button className="bg-[#C4A874] text-white px-10 py-3 rounded-full">Submit</button>
          </div>
        </div>
      </section>
    </div>
  )
}
