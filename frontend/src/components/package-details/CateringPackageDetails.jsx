import { useState } from 'react'
import CustomSelect from '../common/CustomSelect'
import {
  formatCateringAddonPerPersonPrice,
  isCateringPerPersonAddon,
} from '../../lib/cateringAddonPricing'

function PillSelect({ label, value, options, onChange }) {
  return (
    <div className="min-w-0 flex-1">
      {label ? (
        <label className="mb-1.5 block text-[11px] font-medium text-[#591902] opacity-70">
          {label}
        </label>
      ) : null}
      <CustomSelect
        variant="catering"
        value={value}
        options={options}
        onChange={onChange}
        placeholder={label}
        ariaLabel={label}
      />
    </div>
  )
}

function ExpandableInfoRow({ title, items = [], defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-[#364022]/35 last:border-b-0">
      <button
        type="button"
        onClick={() => setIsOpen(open => !open)}
        className="flex w-full items-center justify-between gap-4 py-3.5 text-left"
      >
        <span className="text-[15px] font-semibold text-[#2D2D2D]">{title}</span>
        <span className="text-[20px] leading-none text-[#C4A36B]">{isOpen ? '−' : '+'}</span>
      </button>
      <div
        className="grid transition-[grid-template-rows,opacity] duration-300 ease-out"
        style={{
          gridTemplateRows: isOpen ? '1fr' : '0fr',
          opacity: isOpen ? 1 : 0.6,
        }}
      >
        <div className="overflow-hidden">
          {items.length ? (
            <ul className="space-y-2 pb-3">
              {items.map(item => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-[12px] leading-[1.55] text-[#591902] opacity-80"
                >
                  <span className="mt-[6px] h-[4px] w-[4px] shrink-0 rounded-full bg-[#591902]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="pb-3 text-[12px] leading-[1.55] text-[#591902] opacity-50">
              Details will appear here once added in the CMS.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function MenuActionButton({ variant = 'choose', label, onClick, disabled = false }) {
  if (variant === 'included') {
    return (
      <span className="shrink-0 rounded-full border border-[#D9D9D9] bg-[#EFEFEF] px-4 py-1.5 text-[11px] font-medium text-[#8A847E]">
        {label}
      </span>
    )
  }

  if (variant === 'edit') {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="shrink-0 rounded-full border border-[#591902] bg-white px-4 py-1.5 text-[11px] font-medium text-[#591902] transition-colors hover:bg-[#FBF6ED] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {label}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="shrink-0 rounded-full bg-[#591902] px-4 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-[#4B1501] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
    </button>
  )
}

function MenuSelectionBox({ rows = [], onRowAction }) {
  return (
    <div className="rounded-[10px] border border-[#591902] bg-[#F8F4ED] p-4">
      <p
        className="text-[16px] font-semibold leading-[1.5] text-[#591902]"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        Menu selection
      </p>
      <div className="mt-3 space-y-3">
        {rows.map((row, index) => (
          <div
            key={`${row.title}-${index}`}
            className="flex items-start justify-between gap-3 border-b border-[#591902]/15 pb-3 last:border-b-0 last:pb-0"
          >
            <div className="min-w-0">
              <p
                className="text-[12px] font-medium leading-[1.5] text-[#591902]"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {row.title}
              </p>
              {row.subtitle ? (
                <p className="mt-1 text-[11px] leading-[1.45] text-[#591902] opacity-55">
                  {row.subtitle}
                </p>
              ) : null}
            </div>
            <MenuActionButton
              variant={row.variant}
              label={row.actionLabel}
              onClick={() => onRowAction?.(row, index)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function formatAddonPriceRange(addon) {
  if (isCateringPerPersonAddon(addon)) {
    return formatCateringAddonPerPersonPrice(addon)
  }

  const price = Number(addon?.price ?? 0)
  const maxPrice = Number(addon?.max_price ?? addon?.price_max ?? 0)

  if (price > 0 && maxPrice > price) {
    return `(₹${price.toLocaleString('en-IN')} - ₹${maxPrice.toLocaleString('en-IN')})`
  }

  if (price > 0) {
    return `(₹${price.toLocaleString('en-IN')})`
  }

  return ''
}

function AddonsPanel({ guestLabel = '30', addons = [], selectedAddonIds = [], onToggleAddon }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="rounded-[10px] border border-[#591902] bg-[#F8F4ED]">
      <button
        type="button"
        onClick={() => setIsExpanded(open => !open)}
        className="flex w-full items-start justify-between gap-3 p-4 text-left"
      >
        <div className="min-w-0 pr-2">
          <p className="text-[13px] font-semibold leading-[1.35] text-[#591902]">
            Add ons (Items - For {guestLabel} pax)
          </p>
          <p className="mt-1 text-[11px] leading-[1.45] text-[#591902] opacity-55">
            Exact range calculated according to the dish you choose
          </p>
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#591902] text-white">
          <span
            className="text-[18px] leading-none transition-transform duration-200"
            style={{ transform: isExpanded ? 'rotate(45deg)' : 'rotate(0deg)' }}
          >
            +
          </span>
        </span>
      </button>

      {isExpanded ? (
        <div className="space-y-3 border-t border-[#591902]/15 px-4 pb-4 pt-3">
          {addons.length ? (
            addons.map(addon => {
              const addonId = String(addon.id ?? addon.name)
              const isSelected = selectedAddonIds.includes(addonId)
              const priceRange = formatAddonPriceRange(addon)

              return (
                <div
                  key={addonId}
                  className="flex items-start justify-between gap-3 border-b border-[#591902]/10 pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-[#591902]">
                      {addon.name}
                      {priceRange ? (
                        <span className="font-normal opacity-80"> {priceRange}</span>
                      ) : null}
                    </p>
                    {addon.description ? (
                      <p className="mt-1 text-[11px] leading-[1.45] text-[#591902] opacity-55">
                        {addon.description}
                      </p>
                    ) : null}
                  </div>
                  {isSelected ? (
                    <MenuActionButton
                      variant="edit"
                      label="Edit"
                      onClick={() => onToggleAddon?.(addon)}
                    />
                  ) : (
                    <MenuActionButton
                      variant="choose"
                      label="Add"
                      onClick={() => onToggleAddon?.(addon)}
                    />
                  )}
                </div>
              )
            })
          ) : (
            <p className="text-[12px] text-[#591902] opacity-50">No add-ons available yet.</p>
          )}
        </div>
      ) : null}
    </div>
  )
}

function BottomAccordion({ title, body, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-t border-[#36402280] py-4">
      <button
        type="button"
        onClick={() => setIsOpen(open => !open)}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <span className="text-[16px] font-semibold leading-none text-[#6B7152]">{title}</span>
        <span className="text-[20px] leading-none text-[#C4A36B]">{isOpen ? '−' : '+'}</span>
      </button>
      <div
        className="grid transition-[grid-template-rows,opacity] duration-300 ease-out"
        style={{
          gridTemplateRows: isOpen ? '1fr' : '0fr',
          opacity: isOpen ? 1 : 0.55,
        }}
      >
        <div className="overflow-hidden">
          <p className="mt-3 whitespace-pre-line text-[13px] leading-[1.65] text-[#591902] opacity-50">
            {body}
          </p>
        </div>
      </div>
    </div>
  )
}

function QuantityControl({ quantity, onDecrement, onIncrement }) {
  return (
    <div className="flex items-center gap-2">
      <p className="text-[12px] font-medium text-[#591902]">Quantity :</p>
      <div className="flex items-center border border-[#D9D9D9] bg-white">
        <button
          type="button"
          onClick={onDecrement}
          className="flex h-[28px] w-[28px] items-center justify-center border-r border-[#D9D9D9] text-[18px] font-light text-black"
        >
          −
        </button>
        <div className="flex h-[28px] w-[28px] items-center justify-center text-[16px] font-medium text-black">
          {quantity}
        </div>
        <button
          type="button"
          onClick={onIncrement}
          className="flex h-[28px] w-[28px] items-center justify-center border-l border-[#D9D9D9] text-[18px] font-light text-black"
        >
          +
        </button>
      </div>
    </div>
  )
}

export default function CateringPackageDetails({
  title,
  price,
  originalPrice = '',
  discountBadge = '',
  intro,
  guestOptions = [],
  vegOptions = [],
  selectedGuestCount,
  selectedVeg,
  onGuestCountChange,
  onVegChange,
  inclusions = [],
  exclusions = [],
  menuRows = [],
  onMenuRowAction,
  addons = [],
  selectedAddonIds = [],
  onToggleAddon,
  quantity = 1,
  onDecrement,
  onIncrement,
  promptContent,
  addToCartLabel = 'Add to cart',
  addToCartMessage = '',
  disableAddToCart = false,
  onAddToCart,
  accordionSections = [],
}) {
  const guestLabel =
    String(selectedGuestCount ?? '')
      .replace(/[^\d]/g, '')
      .slice(0, 3) || '30'

  return (
    <div className="mt-5 md:pr-3">
      <div className="flex items-start justify-between gap-4">
        <h1
          className="text-[28px] leading-[0.95] text-[#591902] sm:text-[36px]"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          {title}
        </h1>
        {price ? (
          <div className="shrink-0 pt-1 text-right">
            {discountBadge ? (
              <span className="mb-1 inline-flex rounded-full bg-[#591902] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#F5E6C8]">
                {discountBadge}
              </span>
            ) : null}
            <p className="text-[22px] font-medium text-[#591902]">{price}</p>
            {originalPrice ? (
              <p className="text-[13px] text-[#8A847E] line-through">{originalPrice}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      {intro ? (
        <p className="mt-4 max-w-[540px] text-[14px] leading-[1.55] text-[#2D2D2D] opacity-80">
          {intro}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:gap-4">
        <PillSelect
          label="Guest count"
          value={selectedGuestCount}
          options={guestOptions}
          onChange={onGuestCountChange}
        />
        <PillSelect label="Veg" value={selectedVeg} options={vegOptions} onChange={onVegChange} />
      </div>

      <div className="mt-5 rounded-[10px]  px-1">
        <ExpandableInfoRow title="Inclusions" items={inclusions} />
        <ExpandableInfoRow title="Exclusions" items={exclusions} />
      </div>

      <div className="mt-5">
        <MenuSelectionBox rows={menuRows} onRowAction={onMenuRowAction} />
      </div>

      <div className="mt-5">
        <AddonsPanel
          guestLabel={guestLabel}
          addons={addons}
          selectedAddonIds={selectedAddonIds}
          onToggleAddon={onToggleAddon}
        />
      </div>

      <div className="mt-6">
        <QuantityControl quantity={quantity} onDecrement={onDecrement} onIncrement={onIncrement} />
      </div>

      {promptContent ? <div className="mt-5">{promptContent}</div> : null}

      <button
        type="button"
        disabled={disableAddToCart}
        onClick={onAddToCart}
        className={`group ${promptContent ? 'mt-4' : 'mt-5'} flex w-full items-center justify-between rounded-full pl-6 pr-1.5 py-1.5 text-[13px] font-medium transition-colors ${
          disableAddToCart
            ? 'cursor-not-allowed bg-[#CDB17E] text-[#8A847E]'
            : 'bg-[#D4BA8E] text-white hover:bg-[#C6AB7F]'
        }`}
      >
        <span className="mr-5">{addToCartLabel}</span>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full shadow-sm ${
            disableAddToCart ? 'bg-[#E2DEDA] text-[#9B958E]' : 'bg-white text-[#D4BA8E]'
          }`}
        >
          <svg
            className="h-[24px] w-[24px]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v10M7 12h10" />
          </svg>
        </span>
      </button>

      {addToCartMessage ? (
        <p className="mt-3 text-[12px] leading-[1.5] text-[#591902] opacity-70">
          {addToCartMessage}
        </p>
      ) : null}

      {accordionSections.length ? (
        <div className="mt-8">
          {accordionSections.map((section, index) => (
            <BottomAccordion
              key={section.title}
              title={section.title}
              body={section.body}
              defaultOpen={index === 0}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
