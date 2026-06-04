export default function PriceSummaryDiscountRows({
  guestDiscountSummary = null,
  couponDiscount = 0,
  formatCurrency,
}) {
  const guestDiscounts = guestDiscountSummary?.discounts ?? []
  const totalGuestDiscount = Number(guestDiscountSummary?.totalGuestDiscount ?? 0)
  const couponAmount = Number(couponDiscount ?? 0)

  if (!guestDiscounts.length && couponAmount <= 0) return null

  return (
    <div className="space-y-2 text-sm">
      {totalGuestDiscount > 0 ? (
        <>
          {guestDiscounts.map(discount => (
            <div key={discount.tierKey}>
              <div className="flex justify-between gap-3 text-[#2F6B3A]">
                <span className="min-w-0 text-[#787575]">
                  Guest count discount ({discount.tierLabel})
                  {discount.packageCount > 1
                    ? ` · ${discount.packageCount} packages`
                    : ' · 1 package'}
                </span>
                <span className="shrink-0 font-medium">
                  -{formatCurrency(discount.totalAmount)}
                </span>
              </div>
              {discount.packageCount === 1 && discount.packages[0] ? (
                <p className="mt-0.5 text-[11px] text-[#767676]">
                  {discount.packages[0].title} · {discount.packages[0].guestCount} guests · ₹
                  {Number(discount.discountPerPerson).toLocaleString('en-IN')}/person off
                </p>
              ) : discount.packageCount > 1 ? (
                <p className="mt-0.5 text-[11px] text-[#767676]">
                  ₹{Number(discount.discountPerPerson).toLocaleString('en-IN')}/person off per
                  package
                </p>
              ) : null}
            </div>
          ))}
        </>
      ) : null}

      {couponAmount > 0 ? (
        <div className="flex justify-between text-[#6B1D0C]">
          <span className="text-[#787575]">Discount coupon applied</span>
          <span className="text-[#787575]">-{formatCurrency(couponAmount)}</span>
        </div>
      ) : null}
    </div>
  )
}
