// import React from "react";

// DATA
const ITEMS = [
  { name: 'Decor (2 packages)', price: '₹60,500' },
  { name: 'Catering (1 package)', price: '₹65,000' },
  { name: 'Bartending (1 package)', price: '₹65,000' },
  { name: 'Sheesha (1 package)', price: '₹65,000' },
]

import { useState } from 'react'
import { Link } from 'react-router-dom'

const PAYMENT_OPTIONS = [
  {
    id: 'upi',
    title: 'UPI / BHIM',
    desc: 'Google Pay, PhonePe, Paytm',
  },
  {
    id: 'card',
    title: 'Credit / Debit Card',
    desc: 'Visa, Mastercard, RuPay',
  },
  {
    id: 'net',
    title: 'Net Banking',
    desc: 'All major bank supported',
  },
]

const PaymentMethod = () => {
  const [selected, setSelected] = useState('upi')

  const base = 'flex items-center gap-3 border rounded-xl p-4 cursor-pointer transition'

  return (
    <div className="border border-[#95796066] rounded-xl p-5">
      <h3 className="font-medium text-lg mb-4">Payment Method</h3>

      <div className="space-y-3">
        {PAYMENT_OPTIONS.map(option => {
          const isActive = selected === option.id

          return (
            <label
              key={option.id}
              className={`${base} ${
                isActive ? 'bg-[#E9E9E2] border-[#222815]' : 'bg-[#F5F5F5] border-transparent'
              }`}
            >
              <input
                type="radio"
                name="payment"
                className="hidden"
                checked={isActive}
                onChange={() => setSelected(option.id)}
              />

              {/* custom radio */}
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  isActive ? 'border-[#222815]' : 'border-gray-400'
                }`}
              >
                {isActive && <div className="w-2 h-2 bg-[#222815] rounded-full"></div>}
              </div>

              <div>
                <p className="font-medium">{option.title}</p>
                <p className="text-sm text-gray-500">{option.desc}</p>
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <div className="bg-[#FAF9F7] min-h-screen px-4 md:px-8 lg:px-16 py-10 pt-24">
      {/* HEADER */}
      <div className="mb-10">
        <h1 className="text-4xl font-semibold text-[#2C2C2C]">Checkout</h1>
        <p className="text-gray-500 mt-2">Review your event packages and complete your booking.</p>
      </div>

      {/* MAIN GRID */}
      <div className="flex flex-col md:flex-row gap-[clamp(24px,5vw,100px)]">
        {/* LEFT SIDE (SUMMARY) */}
        <div className="flex-1 space-y-6">
          <div className="border border-[#95796066] rounded-xl overflow-hidden">
            {/* HEADER */}
            <div className="bg-[#1F2A16] text-white px-5 py-3">
              <h3 className="font-medium">Booking Summary</h3>
            </div>

            {/* CONTENT */}
            <div className="p-5 space-y-4 text-sm">
              {/* BASE PACKAGE */}
              <div className="flex justify-between font-medium text-base">
                <span>Base Package — Grand Celebration</span>
                <span>₹55,000</span>
              </div>

              <hr className="my-4 border-[#0000001A]" />

              {/* ITEMS */}
              {ITEMS.map((item, i) => (
                <div key={i} className="flex justify-between text-gray-600">
                  <span>{item.name}</span>
                  <span>{item.price}</span>
                </div>
              ))}

              <hr className="my-4 border-[#0000001A]" />

              {/* PRICE BREAKDOWN */}
              <div className="space-y-2 text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal (before GST)</span>
                  <span>₹3,35,500</span>
                </div>

                <div className="flex justify-between">
                  <span>GST (18%)</span>
                  <span>₹60,390</span>
                </div>

                <div className="flex justify-between">
                  <span>Discount coupon applied</span>
                  <span className="text-red-500">−₹2,000</span>
                </div>
              </div>

              <hr className="my-4 border-[#0000001A]" />

              {/* TOTAL */}
              <div className="bg-[#F3EFE9] rounded-lg px-4 py-3 flex justify-between font-medium text-base">
                <span>Total Amount</span>
                <span>₹68,500</span>
              </div>

              {/* ADVANCE */}
              <div className="bg-[#F1F1F1] rounded-lg px-4 py-3 flex justify-between font-medium text-base">
                <span>Advance Payable (30%)</span>
                <span>₹20,550</span>
              </div>

              <p className="text-xs text-gray-500">Balance: ₹47,950 due on event day</p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex-1 space-y-6">
          {/* USER DETAILS */}
          <div className="border border-[#95796066] rounded-xl p-5">
            <h3 className="font-medium text-lg mb-1">Your Details</h3>
            <p className="text-sm text-gray-500 mb-4">
              We’ll use these details to confirm and coordinate your event
            </p>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                className="w-full border-b-[0.5px] border-[#2D2D2D] outline-none pb-2 bg-transparent"
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Phone Number"
                  className="border-b-[0.5px] border-[#2D2D2D] outline-none pb-2 bg-transparent"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="border-b-[0.5px] border-[#2D2D2D] outline-none pb-2 bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* PAYMENT METHOD */}
          <PaymentMethod></PaymentMethod>

          {/* PAYMENT BUTTON */}
          <div className="border border-[#95796066] rounded-xl p-5">
            <div className="bg-[#E6F2E1] text-sm text-center py-3 rounded-lg mb-4">
              🔒 SSL Secured · Instant Confirmation · Easy Cancellation
            </div>

            <Link
              to="/booking-confirmation"
              className="mx-auto group mt-8 flex w-full justify-between items-center rounded-full bg-[#D4BA8E] pl-6 pr-1.5 py-1.5  transition-colors hover:bg-[#C6AB7F]"
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
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
