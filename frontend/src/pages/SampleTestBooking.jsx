import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const PACKAGES = [
  {
    id: 'royal-feast',
    title: 'Royal Feast Package',
    tag: 'Catering',
    desc: 'A premium multi-course curated for corporate & social events.',
    items: [
      {
        id: 'paneer-tikka',
        name: 'Paneer Tikka Starter',
        desc: 'Tandoor smoked, mint chutney',
        price: '₹180',
      },
      {
        id: 'dal-makhani',
        name: 'Dal Makhani + Naan',
        desc: 'Slow-cooked black lentil, butter naan',
        price: '₹180',
      },
      {
        id: 'mutton-biryani',
        name: 'Mutton Biryani',
        desc: 'Dum-cooked, saffron, raita',
        price: '₹180',
      },
      {
        id: 'gulab-jamun',
        name: 'Gulab Jamun (Dessert)',
        desc: 'Rose syrup, warm serve',
        price: '₹180',
      },
      {
        id: 'gulab-jamun',
        name: 'Gulab Jamun (Dessert)',
        desc: 'Rose syrup, warm serve',
        price: '₹180',
      },
      {
        id: 'gulab-jamun',
        name: 'Gulab Jamun (Dessert)',
        desc: 'Rose syrup, warm serve',
        price: '₹180',
      },
    ],
    selectedCountText: '2 of 12 items selected',
  },
  {
    id: 'signature-bar',
    title: 'Signature Bar Package',
    tag: 'Bartending',
    desc: 'Handcrafted cocktails, mocktails & live bar experience for your tasting.',
    items: [
      {
        id: 'mojito-classic',
        name: 'Mojito Classic',
        desc: 'Rum, mint, lime, soda',
        price: '₹180',
      },
      {
        id: 'mango-tango',
        name: 'Mango Tango Mocktail',
        desc: 'Fresh mango, ginger, sparkling water',
        price: '₹180',
      },
      {
        id: 'old-fashioned',
        name: 'Old Fashioned',
        desc: 'Whiskey, bitters, orange peel',
        price: '₹180',
      },
      {
        id: 'old-fashioned',
        name: 'Old Fashioned',
        desc: 'Whiskey, bitters, orange peel',
        price: '₹180',
      },
      {
        id: 'old-fashioned',
        name: 'Old Fashioned',
        desc: 'Whiskey, bitters, orange peel',
        price: '₹180',
      },
    ],
    selectedCountText: '2 of 3 items selected',
  },
]

const SELECTED_ITEMS = new Set(['paneer-tikka', 'dal-makhani', 'mojito-classic', 'mango-tango'])

export default function SampleTasteBooking() {
  const [selectedDelivery, setSelectedDelivery] = useState(true)
  const navigate = useNavigate()

  return (
    <div className="bg-[#FAF9F7] min-h-screen px-4 md:px-8 lg:px-16 py-10 mt-10">
      <div className="mb-10">
        <h1 className="text-[clamp(18px,4vw,36px)] leading-tight text-[#2C2C2C]">
          Book Your Tasting Session
        </h1>
        <p className="text-gray-500 mt-2 text-[clamp(14px,1.2vw,18px)]">
          Try before you commit. Select what you had like to taste and we will deliver it to you.
        </p>
      </div>

      <div className="flex flex-col gap-[clamp(24px,5vw,100px)] md:flex-row">
        {/* LEFT SIDE */}
        <div className="flex-1 space-y-6">
          <div className="flex flex-row border border-[#0383E4] bg-[#EAF5FF] rounded-xl px-4 py-3">
            <div className="flex items-start mr-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9.9974 13.3334V10.0001M9.9974 6.66675H10.0057M18.3307 10.0001C18.3307 14.6025 14.5998 18.3334 9.9974 18.3334C5.39502 18.3334 1.66406 14.6025 1.66406 10.0001C1.66406 5.39771 5.39502 1.66675 9.9974 1.66675C14.5998 1.66675 18.3307 5.39771 18.3307 10.0001Z"
                  stroke="#0383E4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex flex-col ml-2">
              <p className="text-[#0383E4] text-[12px] font-medium">
                Items are tasting portions only — not full servings.
              </p>
              <p className="text-[#00477C] text-[11px] mt-1">
                Your feedback helps confirm your final event order.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="accent-[#2C2C2C]" />
              <span>Single Vendor</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="accent-[#2C2C2C]" />
              <span>2 Different Vendors</span>
            </label>
          </div>

          <div className="space-y-5">
            {PACKAGES.map(pkg => (
              <div
                key={pkg.id}
                className="border border-[#95796066] rounded-xl overflow-hidden bg-white"
              >
                <div className="px-5 py-4 flex justify-between items-start border-b border-[#95796033]">
                  <div>
                    <h2
                      className="text-[18px] font-medium text-[#2C2C2C]"
                      style={{ fontFamily: "'Poppins'" }}
                    >
                      {pkg.title}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">{pkg.desc}</p>
                  </div>

                  <span className="bg-[#E7E0DA] text-[#591902] text-[12px] font-medium px-3 py-1 rounded-full">
                    {pkg.tag}
                  </span>
                </div>

                <div
                  className="p-4 space-y-3 max-h-[240px] overflow-y-auto pr-1 hide-scrollbar mr-2"
                  data-lenis-prevent
                >
                  {pkg.items.map(item => {
                    const selected = SELECTED_ITEMS.has(item.id)

                    return (
                      <div
                        key={item.id}
                        className={`max-h-[44px] rounded-xl px-4 py-3 flex items-center justify-between gap-4 transition ${
                          selected ? 'bg-[#E7E7DF]' : 'bg-[#F5F5F5]'
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={selected}
                            readOnly
                            className="mt-1 accent-[#2C2C2C] shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-[#2C2C2C] font-medium text-[12px] leading-5">
                              {item.name}
                            </p>
                            <p className="text-gray-500 text-[11px] leading-4 mt-1">{item.desc}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          {selected && (
                            <div className="flex items-center gap-3 bg-white rounded-full px-3 py-1">
                              <button className="text-lg leading-none">−</button>
                              <span className="text-sm">1</span>
                              <button className="text-lg leading-none">+</button>
                            </div>
                          )}
                          <p className="text-[#2C2C2C] font-medium">{item.price}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="px-5 pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button className="w-8 h-8 rounded-full bg-[#E7E7E2] flex items-center justify-center text-sm">
                      ✎
                    </button>
                    <button className="w-8 h-8 rounded-full bg-[#6B1D0C] text-white flex items-center justify-center text-sm">
                      🗑
                    </button>
                  </div>

                  <p className="text-sm text-gray-500">{pkg.selectedCountText}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex-1 space-y-6">
          <div className="border border-[#95796066] rounded-xl p-5 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-[18px] font-medium text-[#2C2C2C]"
                style={{ fontFamily: "'Poppins'" }}
              >
                Delivery Details
              </h3>
              <span className="text-sm text-gray-500">Standard Est: 3-4 days</span>
            </div>

            <div className="border-b border-[#2D2D2D] pb-3 flex items-center gap-2">
              <span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M13.3307 6.66658C13.3307 9.99525 9.63806 13.4619 8.39806 14.5326C8.28254 14.6194 8.14193 14.6664 7.9974 14.6664C7.85286 14.6664 7.71225 14.6194 7.59673 14.5326C6.35673 13.4619 2.66406 9.99525 2.66406 6.66658C2.66406 5.2521 3.22597 3.89554 4.22616 2.89535C5.22635 1.89516 6.58291 1.33325 7.9974 1.33325C9.41188 1.33325 10.7684 1.89516 11.7686 2.89535C12.7688 3.89554 13.3307 5.2521 13.3307 6.66658Z"
                    stroke="#1C1C1C"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7.9974 8.66658C9.10196 8.66658 9.9974 7.77115 9.9974 6.66658C9.9974 5.56202 9.10196 4.66658 7.9974 4.66658C6.89283 4.66658 5.9974 5.56202 5.9974 6.66658C5.9974 7.77115 6.89283 8.66658 7.9974 8.66658Z"
                    stroke="#1C1C1C"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Enter delivery address"
                className="w-full outline-none bg-transparent"
              />
            </div>

            <div className="mt-4 bg-[#FEE6D3] border border-[#F39A2D] rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex flex-row gap-x-4">
                <div className="flex items-center">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3.33618 11.6667C3.17848 11.6673 3.02387 11.623 2.8903 11.5392C2.75674 11.4554 2.6497 11.3354 2.58163 11.1931C2.51356 11.0509 2.48725 10.8922 2.50576 10.7356C2.52426 10.579 2.58683 10.4309 2.68618 10.3084L10.9362 1.80839C10.9981 1.73696 11.0824 1.68868 11.1753 1.6715C11.2683 1.65431 11.3643 1.66923 11.4476 1.71381C11.531 1.75838 11.5967 1.82997 11.634 1.91681C11.6712 2.00365 11.6779 2.10059 11.6528 2.19172L10.0528 7.20839C10.0057 7.33466 9.98982 7.47049 10.0067 7.60423C10.0235 7.73797 10.0726 7.86562 10.1496 7.97624C10.2266 8.08686 10.3293 8.17715 10.4489 8.23935C10.5685 8.30156 10.7014 8.33383 10.8362 8.33339H16.6695C16.8272 8.33285 16.9818 8.37707 17.1154 8.46091C17.2489 8.54474 17.356 8.66476 17.4241 8.80701C17.4921 8.94926 17.5184 9.1079 17.4999 9.26451C17.4814 9.42111 17.4189 9.56926 17.3195 9.69172L9.06951 18.1917C9.00762 18.2632 8.92329 18.3114 8.83036 18.3286C8.73742 18.3458 8.6414 18.3309 8.55807 18.2863C8.47473 18.2417 8.40902 18.1701 8.37173 18.0833C8.33444 17.9965 8.32778 17.8995 8.35284 17.8084L9.95284 12.7917C10 12.6655 10.0159 12.5296 9.99902 12.3959C9.98217 12.2621 9.93313 12.1345 9.8561 12.0239C9.77907 11.9132 9.67636 11.823 9.55678 11.7608C9.43719 11.6985 9.3043 11.6663 9.16951 11.6667H3.33618Z"
                      fill="#FFAA32"
                    />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <h4 className="text-[#E48E03] text-[12px]" style={{ fontFamily: "'Poppins'" }}>
                    Get it faster — Express Delivery
                  </h4>
                  <p className="text-[#E48E03] text-[11px] mt-1">
                    Delivery in 2 days for ₹300 extra
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedDelivery(!selectedDelivery)}
                className={`w-12 h-7 rounded-full flex items-center px-1 transition ${
                  selectedDelivery ? 'bg-[#E48E03] justify-end' : 'bg-gray-300 justify-start'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white shadow" />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
              <span>Standard: ₹0 included</span>
              <span>Express: +₹300</span>
            </div>
          </div>

          <div className="border border-[#95796066] rounded-xl overflow-hidden bg-white">
            <div className="bg-[#242C14] text-white px-5 py-3 flex items-center justify-between">
              <h3 className="font-medium" style={{ fontFamily: "'Poppins'" }}>
                Tasting Summary
              </h3>
              <span className="text-sm">4 items selected</span>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[#2C2C2C]">Royal Feast Package</p>
                    <span className="bg-[#E7E0DA] text-[#591902] text-[12px] px-2 py-1 rounded-full">
                      Catering
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paneer Tikka Starter</span>
                    <span>₹180</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dal Makhani + Naan</span>
                    <span>₹240</span>
                  </div>
                </div>
              </div>

              <hr className="my-4 border-[#0000001A]" />

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <p className="font-medium text-[#2C2C2C]">Signature Bar Pkg</p>
                  <span className="bg-[#E7E0DA] text-[#591902] text-[12px] px-2 py-1 rounded-full">
                    Bartending
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mojito Classic</span>
                    <span>₹200</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mango Tango Mocktail</span>
                    <span>₹150</span>
                  </div>
                </div>
              </div>

              <hr className="my-4 border-[#0000001A]" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal (4 items)</span>
                  <span>₹770</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">GST (18%)</span>
                  <span>₹120</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery Fee</span>
                  <span>₹80</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Express Delivery</span>
                  <span className="text-[#E48E03]">+₹300</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Platform Fee</span>
                  <span>₹80</span>
                </div>
              </div>

              <div className="bg-[#F8F4ED] rounded-lg px-4 py-3 flex justify-between items-center font-medium">
                <span>Total Amount</span>
                <span>₹1,180</span>
              </div>
            </div>
          </div>

          <div className="border border-[#95796066] rounded-xl p-5 bg-white">
            <div className="bg-[#E6F8D9] rounded-lg py-3 text-center text-sm mb-4">
              🔒 Secure & Verified Platform
            </div>
            <button
              type="button"
              onClick={() =>
                navigate('/checkout?mode=sample-tasting', {
                  state: {
                    checkoutMode: 'sample-tasting',
                    sampleSessionDetails: {
                      dateLabel: 'Saturday, 14 June',
                      timeLabel: '2:00 PM',
                      address: 'E-22 Vaishali nagar, jaipur, rajasthan',
                    },
                  },
                })
              }
              className="mx-auto mt-4 flex w-full items-center justify-between rounded-full bg-[#D4BA8E] py-1.5 pl-6 pr-1.5 transition-colors hover:bg-[#C6AB7F] group disabled:cursor-not-allowed disabled:bg-[#CFCBC5]"
            >
              <span className="mr-5 text-[15px] font-medium text-white">Proceed to Checkout</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
                <svg
                  className="h-[18px] w-[18px] text-[#D4BA8E] transition-colors transition-transform duration-300 ease-out group-hover:rotate-45 group-hover:text-[#C6AB7F]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H9M17 7v8" />
                </svg>
              </div>
            </button>

            <div className="text-center text-sm text-gray-500 mt-4">
              Have an account? <span className="text-[#D2B27A]">Sign in to continue</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
