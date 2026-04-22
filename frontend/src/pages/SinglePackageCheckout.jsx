// import React from "react";
import { useNavigate } from 'react-router-dom'

const ELEMENTS = [
  {
    title: 'Balloon Arch + Backdrop',
    desc: 'Installed, themed to palette',
  },
  {
    title: 'LED Fairy Lights',
    desc: 'Warm white, 200 pcs',
  },
  {
    title: 'Flower Centrepieces',
    desc: '6 tables, seasonal blooms',
  },
]

const ADDONS = [
  {
    title: 'Cake Cutting Set',
    desc: 'Pro set + napkins',
    price: '₹12,000',
  },
  {
    title: 'Cake Cutting Set',
    desc: 'Pro set + napkins',
    price: '₹12,000',
  },
  {
    title: 'Cake Cutting Set',
    desc: 'Pro set + napkins',
    price: '₹12,000',
  },
  {
    title: 'Cake Cutting Set',
    desc: 'Pro set + napkins',
    price: '₹12,000',
  },
]

const PRICE_ITEMS = [
  { name: 'Balloon Arch + Backdrop', price: '₹4,500' },
  { name: 'LED Fairy Lights', price: '₹2,200' },
  { name: 'Flower Centrepieces', price: '₹3,800' },
  { name: 'Photo Booth Setup', price: '₹3,000' },
]

export default function SinglePackageCheckout() {
  const navigate = useNavigate()
  return (
    <div className="bg-white min-h-screen px-4 md:px-8 lg:px-16 py-8 md:pt-24">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-[24px] md:text-[36px] font-semibold text-[#1C1C1C]">Package Details</h1>
        <p className="text-gray-500 mt-1 text-[12px] md:text-[16px]">
          Review what’s included in your selected packages
        </p>
      </div>

      {/* LAYOUT */}
      <div className="flex flex-col lg:flex-row gap-[clamp(24px,5vw,100px)]">
        {/* LEFT SIDE */}
        <div className="flex-1 space-y-6">
          {/* PACKAGE INFO */}
          <div className="relative border border-[#95796066] rounded-xl p-4 flex gap-4 items-center overflow-hidden">
            {/* LEFT LINE */}
            <div className="absolute left-0 top-0 h-full w-[3px] bg-[#957960] rounded-l-xl"></div>
            <div className="w-20 h-20 bg-gray-200 rounded-lg ml-2"></div>

            <div>
              <p className="text-sm text-gray-500">Birthday Party</p>
              <h3 className="font-medium text-lg">The Grand Celebration</h3>
              <p className="text-sm text-gray-500">Jaipur · Saturday, 14 June 2026</p>
            </div>
          </div>

          {/* SELECTED ELEMENTS */}
          <div className="border border-[#95796066] rounded-xl overflow-hidden">
            <div className="bg-[#F8F4ED] px-4 py-3 flex justify-between">
              <h3 className="font-medium">Selected Elements</h3>
              <span className="text-sm text-gray-500">3 elements</span>
            </div>

            <div className="p-4 space-y-4">
              {ELEMENTS.map((item, i) => (
                <div key={i} className="border-b border-[#00000033] last:border-none pb-3 flex">
                  <div className="p-2 items-start">
                    <svg
                      width="6"
                      height="6"
                      viewBox="0 0 6 6"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="3" cy="3" r="3" fill="#D5D5D5" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-[#2C2C2C]">{item.title}</p>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* EVENT DETAILS */}
          <div className="border border-[#95796066] rounded-xl overflow-hidden">
            <div className="bg-[#F8F4ED] px-4 py-3">
              <h3 className="font-medium">Event Details</h3>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#F5F5F5] rounded-lg p-4 flex justify-between">
                <div>
                  <p className="text-sm text-gray-500">City / Area</p>
                  <p className="font-medium">Jaipur, Rajasthan</p>
                </div>
                <button className="text-sm text-[#957960]">Edit</button>
              </div>

              <div className="bg-[#F3F3F3] rounded-lg p-4 flex justify-between">
                <div>
                  <p className="text-sm text-gray-500">Event Date</p>
                  <p className="font-medium">Saturday, 14 June 2025</p>
                </div>
                <button className="text-sm text-[#957960]">Edit</button>
              </div>
            </div>
          </div>

          {/* ADD-ONS */}
          <div className="border border-[#95796066] rounded-xl p-4">
            <h3 className="font-medium mb-1">Suggested Add-ons</h3>
            <p className="text-sm text-gray-500 mb-4">
              Enhance your event with these popular extras
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ADDONS.map((item, i) => (
                <div key={i} className="bg-[#F5F5F5] rounded-lg p-4 flex justify-between">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                    <p className="text-sm font-medium mt-1">{item.price}</p>
                  </div>

                  <button className="bg-[#957960] text-white px-3 py-1 rounded-full text-sm h-fit">
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex-1">
          <div className="border border-[#95796066] rounded-xl overflow-hidden top-6">
            {/* HEADER */}
            <div className="bg-[#222815] text-white px-4 py-3">
              <h3 className="font-medium">Price Summary</h3>
            </div>

            {/* CONTENT */}
            <div className="p-4 space-y-3 text-sm">
              <div className="flex justify-between font-medium">
                <span>Base Package — Grand Celebration</span>
                <span>₹55,000</span>
              </div>

              <hr className="my-4 border-[#0000001A]" />

              {PRICE_ITEMS.map((item, i) => (
                <div key={i} className="flex justify-between text-gray-600">
                  <span>{item.name}</span>
                  <span>{item.price}</span>
                </div>
              ))}

              <hr className="my-4 border-[#0000001A]" />

              <div className="bg-[#F8F4ED] rounded-lg px-4 py-3 flex justify-between font-medium">
                <span>Total Amount</span>
                <span>₹68,500</span>
              </div>

              <div className="bg-[#F1F1F1] rounded-lg px-4 py-3 flex justify-between font-medium">
                <span>Advance Payable (30%)</span>
                <span>₹20,550</span>
              </div>

              <p className="text-xs text-gray-500">Balance: ₹47,950 due on event day</p>
            </div>
          </div>
          <div className="mt-10 flex flex-row gap-4 w-full">
            <button
              onClick={() => navigate('/cart')}
              className="px-6 py-3 rounded-full bg-gray-200 text-gray-700"
            >
              ← Go Back
            </button>

            <button className="px-6 py-3 rounded-full bg-[#2E3A1F] text-white">
              ✏️ Edit Package
            </button>

            <button className="px-6 py-3 rounded-full bg-[#6B1D0C] text-white">
              🗑 Delete Package
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
