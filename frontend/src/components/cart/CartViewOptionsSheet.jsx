import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'
import {
  getPackageLineLabel,
  getSelectedOptionsText,
  parseBookingItemTitle,
} from '../../lib/bookingDisplay'
import { resolveCartItemSelectedOptions } from '../../lib/cartItemMeta'

function formatCurrency(value) {
  const amount = Number(value ?? 0)
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

function getOptionRows(item) {
  const selectedOptions = resolveCartItemSelectedOptions(item)
  const parsed = parseBookingItemTitle(item?.title ?? '')
  const additionalInfo = parsed.additionalInfo

  const rows = Object.entries(selectedOptions)
    .filter(
      ([key]) =>
        String(key ?? '')
          .trim()
          .toLowerCase() !== '__additional_info__'
    )
    .map(([label, value]) => ({
      label: String(label ?? '').replace(/_\d+$/, ''),
      value: String(value ?? '').trim(),
    }))
    .filter(row => row.label && row.value)

  if (additionalInfo) {
    rows.push({ label: 'Additional info', value: additionalInfo })
  }

  return rows
}

export default function CartViewOptionsSheet({ open, onClose, onBrowseOptions }) {
  const { cart, itemCount, loading } = useCart()

  const items = useMemo(() => {
    return (cart?.items ?? []).map(item => {
      const parsed = parseBookingItemTitle(item?.title ?? '')
      const selectedOptions = resolveCartItemSelectedOptions(item)
      const title = getPackageLineLabel(item?.title, 'Selected item')
      const optionSummary = getSelectedOptionsText(selectedOptions)
      const optionRows = getOptionRows({ ...item, selectedOptions })

      return {
        id: item.id,
        title,
        quantity: Math.max(1, Number(item?.quantity ?? 1)),
        totalPrice: item?.totalPrice,
        itemType: parsed.itemType,
        optionSummary,
        optionRows,
      }
    })
  }, [cart?.items])

  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = event => {
      if (event.key === 'Escape') onClose?.()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close cart options"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-view-options-title"
        className="relative z-[71] flex max-h-[min(85dvh,40rem)] w-full max-w-[32rem] flex-col overflow-hidden rounded-t-2xl bg-[#FAFAFA] shadow-[0_-8px_40px_rgba(0,0,0,0.18)] sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#E8DDD0] bg-[#F8F4ED] px-4 py-3 sm:px-5">
          <div>
            <h2
              id="cart-view-options-title"
              className="text-[16px] font-semibold text-[#591902]"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Your cart options
            </h2>
            <p className="mt-0.5 text-[12px] text-[#6A6864]">
              {loading
                ? 'Loading…'
                : itemCount > 0
                  ? `${itemCount} item${itemCount === 1 ? '' : 's'} in cart`
                  : 'No packages added yet'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#591902] shadow-sm"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5" data-lenis-prevent>
          {loading && items.length === 0 ? (
            <p className="py-8 text-center text-[14px] text-[#6A6864]">Loading your cart…</p>
          ) : items.length === 0 ? (
            <div className="space-y-4 py-6 text-center">
              <p className="text-[15px] font-medium text-[#2C2C2C]">Your cart is empty</p>
              <p className="text-[13px] leading-[1.5] text-[#6A6864]">
                Choose package options on this page, then add them to cart.
              </p>
              {onBrowseOptions ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose?.()
                    onBrowseOptions()
                  }}
                  className="inline-flex rounded-full bg-[#591902] px-5 py-2.5 text-[13px] font-medium text-white"
                >
                  Browse options
                </button>
              ) : null}
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map(item => (
                <li
                  key={item.id}
                  className="overflow-hidden rounded-xl border border-[#95796066] bg-white"
                >
                  <div className="flex items-start justify-between gap-3 border-b border-[#F0E8DE] bg-[#F8F4ED] px-3.5 py-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium leading-snug text-[#1C1C1C]">
                        {item.title}
                        {item.quantity > 1 ? (
                          <span className="ml-2 rounded-full bg-[#EFE7DC] px-2 py-0.5 text-[11px] font-medium text-[#591902]">
                            x{item.quantity}
                          </span>
                        ) : null}
                      </p>
                      {item.itemType === 'addon' ? (
                        <p className="mt-1 text-[11px] uppercase tracking-wide text-[#8B8B8B]">
                          Add-on
                        </p>
                      ) : null}
                    </div>
                    <p className="shrink-0 text-[14px] font-semibold text-[#591902]">
                      {formatCurrency(item.totalPrice)}
                    </p>
                  </div>

                  <div className="space-y-2.5 px-3.5 py-3">
                    {item.optionRows.length > 0 ? (
                      item.optionRows.map(row => (
                        <div
                          key={`${item.id}-${row.label}-${row.value}`}
                          className="border-b border-[#00000014] pb-2 last:border-none last:pb-0"
                        >
                          <p className="text-[13px] font-medium text-[#2C2C2C]">{row.value}</p>
                          <p className="text-[12px] text-[#8B8B8B]">{row.label}</p>
                        </div>
                      ))
                    ) : item.optionSummary ? (
                      <p className="text-[13px] leading-[1.5] text-[#2C2C2C]">{item.optionSummary}</p>
                    ) : (
                      <p className="text-[13px] text-[#8B8B8B]">No custom options for this item.</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex gap-2 border-t border-[#E8DDD0] bg-white px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 flex-1 items-center justify-center rounded-full border border-[#95796066] text-[13px] font-medium text-[#2C2C2C]"
          >
            Close
          </button>
          <Link
            to="/cart"
            onClick={onClose}
            className="flex h-11 flex-1 items-center justify-center rounded-full bg-[#591902] text-[13px] font-medium text-white"
          >
            {items.length > 0 ? 'Go to cart' : 'Open cart'}
          </Link>
        </div>
      </div>
    </div>
  )
}
