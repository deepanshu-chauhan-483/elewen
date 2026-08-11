# Lessons

## 2026-08-11: Message Box showed email instead of customer name

**Root cause:** `MessageBoxPage.getCustomerDisplay` used only `booking.customer.name` from profile/`up_users`. Email-signup users often have empty profile names, so the thread title fell back to email (e.g. `bansalgauri23@gmail.com`) while Swati-style accounts with profile names looked correct.

**Failure symptoms:** Message list/header showed email as the title instead of Name + email like other chats.

**Fix details:** Reuse `resolveCustomerDisplayName` (checkout `infoCollection.fullName` → profile → customer.name). Include `infoCollection.fullName` in message-thread search haystack.

**Consulted sources:** `MessageBoxPage.jsx`, `bookingDisplay.js`, `docs/lessons.md` booking CUSTOMER name entry

**Prevention guidance:** Any admin surface that shows a customer label must use `resolveCustomerDisplayName`, not raw `customer.name` alone.

## 2026-08-11: Info collection allowed editing checkout-filled fields

**Root cause:** Customer Information Collection form prefills checkout note values but left every input editable.

**Failure symptoms:** Customers could change name/email/address/etc. already captured at checkout.

**Fix details:** API returns `lockedFields` from checkout notes only (`buildCheckoutLockedFields`); form uses `readOnly`/`disabled`; submit merges locked checkout values server-side.

**Consulted sources:** `InfoCollection.jsx`, `booking.js` get/submit info-collection, `dashboardData.js`

**Prevention guidance:** Treat checkout-captured contact/event fields as immutable on the later info-collection form; only unlock empty optional logistics fields.

## 2026-08-11: Confirm email Update Event Details wrong URL

**Root cause:** `updateDetailsUrl` in `buildBookingEmailContext` pointed at booking details (`/user-dashboard/details`), not the customer info-collection form.

**Failure symptoms:** "Update Event Details" in the confirmed booking email did not open the customer form.

**Fix details:** Point `updateDetailsUrl` at `customerInfoCollectionUrl(booking.id)`; template falls back to the same helper.

**Consulted sources:** Google Doc "Elewen Website changes", `bookingEmailService.js`, `customerUrls.js`

**Prevention guidance:** CTAs that ask customers to fill event details must use `customerInfoCollectionUrl`, not booking details.

## 2026-08-11: Personalization email — multi images + attachments

**Root cause:** Admin UI forced three labeled “Design Option 1/2/3” slots; payload only supported `designImage1..3`.

**Failure symptoms:** Planners could not drag multiple designs (4+) or share PDF/docs in the personalization mail.

**Fix details:** One multi-image dropzone + attachment dropzone; API accepts `designImages[]` and `attachments[]`; email embeds all images and download links; first three images still stored in existing DB columns.

**Consulted sources:** `BookingManagementPage.jsx`, `bookingEmailService.js`, `email.js`, `admin.js` upload/personalization handlers

**Prevention guidance:** Prefer open-ended media lists over fixed option slots for planner-shared assets.

## 2026-08-11: Admin booking CUSTOMER name showed dash

**Root cause:** Booking Management header used only `booking.customer.name` from `up_users` / `customer_profiles` first+last. Accounts with email/phone but empty names (common after signup) rendered "—". Checkout contact name lives on notes → `infoCollection.fullName`, which Payment Management already resolved and Booking Management ignored.

**Failure symptoms:** CUSTOMER field "—"; EMAIL and PHONE populated for the same booking.

**Fix details:** Shared `resolveCustomerDisplayName` in `bookingDisplay.js` (checkout fullName → profile names → `customerName` → `customer.name`). Booking Management header and FULL NAME field use it; Payment Management imports the shared helper.

**Consulted sources:** `BookingManagementPage.jsx`, `PaymentManagementPage.jsx`, `api/src/controllers/admin.js` `fetchUsersByIds` / `resolveCustomerDisplayName`

**Prevention guidance:** Never bind admin customer display to a single profile name field; always prefer checkout/info-collection name with profile fallback.

## 2026-08-11: SE3 Fancy Bar surcharge missing on live cart

**Root cause:** Live Strapi Signature Essentials 3 had `price_surcharge: null` on Fancy Bar (and CMS backdrop titles differed from seed). Cart used stored `unitPrice` without surcharge, so Fancy Bar stayed “Included” at ₹85,000 instead of ₹90,000.

**Failure symptoms:** Choosing Fancy Bar did not add ₹5,000; price summary showed Included.

**Fix details:** Frontend SE3 fallback applies ₹5,000 for Fancy Bar and backdrop option 1 / bows when CMS surcharge is null. Patch script updated for live option titles. Customers must remove and re-add the package after deploy.

**Consulted sources:** Live Strapi package API, `resolveDecorOptionSurcharge`, CartPage

**Prevention guidance:** After changing surcharge rules, verify live inclusion `price_surcharge` and re-add cart lines so `unitPrice` recalculates.

## 2026-08-10: Signature Essentials 3 option surcharges in cart

**Root cause:** SE3 seed already had `price_surcharge: 5000` on Single Panel Backdrop and Fancy Bar, but cart selected-options did not emit a Service charge line, and live CMS often lacked the field until a targeted patch. Option tags also showed the surcharge on a secondary line.

**Failure symptoms:** Customers did not clearly see +₹5,000 on the option chip or a Service charge line after choosing those ups; price could stay base-only if CMS surcharge was missing.

**Fix details:** Option tag shows title + `+₹5,000` inline. Selected options store `Service charge — …` rows for cart/summary. Patch script `scripts/patch-se3-option-surcharges.mjs` sets live Strapi surcharges.

**Consulted sources:** `DecorSinglePackagePage.jsx`, `chooseOnePricing.js`, `CartPage.jsx`, SE3 seed

**Prevention guidance:** Additive decor ups belong on inclusion `price_surcharge`; cart must persist service-charge lines beside the chosen option title.

## 2026-08-10: Cart/checkout showed inflated decor package price

**Root cause:** `getCartItemSummary` preferred `sum(price_breakdown)` over cart `totalPrice`. Decor seeds like Raise the Bar 3 list component line items **and** a “Package Price” rollup, so the sum (₹56,500) exceeded `base_price` (₹30,200). Payment QR used booking/`totalPrice` and stayed correct. API delivery reprice had the same sum-all-rows bug.

**Failure symptoms:** Cart and checkout Base Package / Total showed ~₹56,500; Cashfree QR and post-booking amounts showed ₹30,200.

**Fix details:** Cart summary total always uses `item.totalPrice` (+ transport addon only when pincode applies). Display rows drop component lines when a Package Price rollup exists. `computeCartItemsWithDeliveryCharges` adds transport addon onto cart total instead of replacing with breakdown sum.

**Consulted sources:** `cartItemPricing.js`, `deliveryChargePricing.js`, `decor-general-pack-packages.js` Raise the Bar 3

**Prevention guidance:** Treat cart/`base_price` as money authority; use `price_breakdown` for labels and transport-tier mutation only — never as the line total when a Package Price rollup is present.

## 2026-08-10: Admin manual final payment in Payment Management

**Root cause:** Customer Payments rows only linked out to Booking Management; there was no in-place way to mark remaining balance collected via UPI/cash/Cashfree without changing booking stage.

**Failure symptoms:** Admins could not clear remaining to ₹0 from Payment Management; notes risked being confused with customer-visible stage updates.

**Fix details:** Expandable Active Booking cards show name/phone/event + advance/paid/remaining. `POST /admin/bookings/:id/payments/manual` records a successful remaining/full payment, sets `remainingAmount` to 0, stores channel + admin-only internal note (no stage change).

**Consulted sources:** `PaymentManagementPage.jsx`, `recordAdminManualPayment`, Booking UPDATE STAGE UI pattern

**Prevention guidance:** Money collection UI belongs in Payment Management; booking stage updates stay separate. Manual payment notes must use `isInternal: true`.

## 2026-08-10: Admin cancel did not create refund requests

**Root cause:** Customer cancel created `Refund` rows (`requested`); admin `updateAdminBookingStatus` → `cancelled` only wrote Cancellation + status. Payment Management Refunds lists `Refund` records only, so admin-cancelled paid bookings never appeared for Pay Refund. Customer Payments also omitted the API `cancelled` tab.

**Failure symptoms:** Admin cancelled a booking; Refunds section stayed empty; no Pay Refund action despite successful payments.

**Fix details:** Shared `cancellationRefunds.js` builds/persists refund entries. Admin cancel creates full-paid-amount `requested` refunds, alerts, and customer notify. Restored Customer Payments **Cancelled / Refunds** tab. Status update invalidates refunds + payment workspace queries.

**Consulted sources:** `cancelBooking`, `updateAdminBookingStatus`, `listAdminRefunds`, `PaymentManagementPage`

**Prevention guidance:** Any cancel path that ends in `cancelled` with successful payments must create the same refund request rows the Refunds UI reads — do not treat Cancellation alone as enough.

## 2026-08-10: Booking Status Tracker stage filter hid confirmed bookings

**Root cause:** Tracker mapped most stages to API `bucket=active`, and `active` is payment-aware (`isAdvanceSatisfied`). Confirmed bookings without recorded advance (or non-COD unpaid) were filtered out even when `status=confirmed`. Default API sort was also `event_date` ascending, so newly confirmed bookings could sit past page 1.

**Failure symptoms:** Admin confirmed bookings; Booking Status Tracker filter for Confirmed / other stages showed empty or wrong counts; just-confirmed packages not visible.

**Fix details:** `resolveTrackerBucket` always returns `all` so the tracker filters by `status` only. Added Latest First / By Event Date sort (default Latest First). API admin bookings default sort is `latest`.

**Consulted sources:** `BookingStatusTrackerPage.jsx`, `listAdminBookings`, `bookingMatchesOperationalBucket`

**Prevention guidance:** Stage pipeline UI must not reuse payment-bucket filters (Today/Active/Incomplete); keep those on Booking Management only. Default list sort for ops screens should be latest-first.

## 2026-08-10: Admin stage updates blocked by event-date rules

**Root cause:** Admin `canProgressToStage` required event-day / post-event day offsets before Setup, Review, and Dismantling, so admins could not advance stages when needed.

**Failure symptoms:** Message like “Review stage becomes available after the event date has passed” blocked Admin status updates.

**Fix details:** Removed all event-date gates from admin `bookingStages.js`. Forward progression (and cancel) remains; execution still requires remaining payment cleared.

**Consulted sources:** `admin-pannel/src/lib/bookingStages.js`, BookingManagementPage

**Prevention guidance:** Customer timeline may show dates for display; admin stage control must not be gated on calendar day unless product explicitly asks.

## 2026-08-10: Decor option surcharges via Strapi price_surcharge

**Root cause:** Option prices lived on ordered `elements.base_price` as absolute package amounts, and cart ignored them. “Base + ₹5,000 on Fancy Bar” could not be edited next to the inclusion option.

**Failure symptoms:** SE3 Backdrop / Fancy Bar choices had no tag surcharge and cart stayed at base price.

**Fix details:** Added optional `price_surcharge` on `package.inclusions`; frontend shows `+₹…` on tags and adds selected surcharges to display + cart `unitPrice`. Seeded SE3 Single Panel Backdrop and Fancy Bar at 5000.

**Consulted sources:** `inclusions.json`, `chooseOnePricing.js`, `DecorSinglePackagePage.jsx`

**Prevention guidance:** Use inclusion `price_surcharge` for additive ups; keep `elements.base_price` for absolute choose-1 package pricing only.

## 2026-08-10: Cart not emptied in UI after booking

**Root cause:** API cleared cart items after payment/COD confirm, but the React cart context kept the previous items until a full remount/sync. Confirmation page never refreshed or re-cleared the cart.

**Failure symptoms:** After booking, `/cart` still showed the booked packages until hard refresh.

**Fix details:** `emptyCartAfterBooking` clears guest storage + pin + server items and refreshes cart state; booking confirmation page calls it once per booking id.

**Consulted sources:** `useCart.js`, `BookingConfirmation.jsx`, `api` `clearUserCart`

**Prevention guidance:** After successful checkout navigation, always sync/empty client cart state — do not rely on server clear alone for the badge/UI.

## 2026-08-10: Pincode and coupon only on cart (not checkout)

**Root cause:** Cart rendered coupon twice (mobile + desktop slots) and checkout asked for pincode + coupon again after cart already collected them. Checkout also cleared `elewen_cart_pin_code` on mount so the cart pin never carried over.

**Failure symptoms:** Users entered pincode and applied coupon twice across `/cart` → `/checkout`; coupon used a manual code field instead of account dropdown on cart.

**Fix details:** Single pincode + dropdown-only coupon on cart; persist valid pin to `elewen_cart_pin_code`; checkout reads that pin for booking/validation with no pin input or coupon UI.

**Consulted sources:** `CartPage.jsx`, `CheckoutPage.jsx`, `CheckoutCouponSection.jsx`

**Prevention guidance:** Collect service pin and coupons once on cart; checkout should consume cart pin storage, not re-ask.

## 2026-08-10: Guest cart merge inflated totals after login

**Root cause:** `migrateGuestCartToServer` POSTed guest items onto the existing account cart. Server `addItem` also increments quantity when the same package already exists, so old cart lines + guest lines stacked (e.g. guest qty 1 + account qty 4 → 5).

**Failure symptoms:** Customer added one package as guest, went to checkout, logged in, and checkout showed ~5× package cost / quantity.

**Fix details:** Before pushing guest items, clear all server cart items so the guest cart replaces the account cart on login. Also forward guest `unitPrice` / `totalPrice` on migrate.

**Consulted sources:** `frontend/src/hooks/useCart.js`, `api/src/controllers/cart.js` `addItem`

**Prevention guidance:** Guest→auth cart migration must define replace vs merge explicitly; default merge silently doubles checkout totals for returning accounts.

## 2026-08-10: Mobile inclusion preview was a fixed tiny toast

**Root cause:** `InclusionImageToast` used `fixed bottom-4` with a 200×150 cropped frame, so mobile users only saw a small cropped chip, not the full inclusion photo.

**Failure symptoms:** Tapping inclusion options on mobile opened a small fixed bottom popup instead of a full image.

**Fix details:** Replaced with a full-screen mobile lightbox (`object-contain`, max 90vh) matching the package gallery lightbox pattern; no auto-dismiss crop toast.

**Consulted sources:** `InclusionImageToast.jsx`, `PackageImageLightbox`

**Prevention guidance:** Mobile media previews should be full-viewport contain lightboxes, not fixed thumbnail toasts.

## 2026-08-10: Bartending addon cards used preview-only action

**Root cause:** Addon cards used a full-width eye/preview control; purchase only happened later via package Add to cart with selected add-ons.

**Failure symptoms:** Customers could preview add-ons but had no clear per-addon Add to cart path.

**Fix details:** Card now shows a preview eye icon above an Add to cart button that calls `addPackage({ addon })`. Detail page also has Add to cart + image preview lightbox.

**Consulted sources:** `BartendingSinglePackagePage.jsx`, `BartendingAddonDetailPage.jsx`, `useCart.addPackage`

**Prevention guidance:** Sellable add-on tiles should expose purchase CTA directly; keep preview as a secondary icon.

## 2026-08-10: Key Decor Elements moved into accordion above Nitty-Gritty

**Root cause:** Key Decor Elements was rendered as always-open copy above “What’s included”, separate from accordion sections that already use the `+` expand pattern.

**Failure symptoms:** Key Decor sat in the wrong place; users wanted it expandable with `+` directly above The Nitty-Gritty.

**Fix details:** Removed the inline Key Decor block from `DecorPackageSections`. Inject `Key Decor Elements` into accordion lists above `The Nitty-Gritty` via `buildDecorAccordionSections` and `buildAccordionSections` in `usePackages.js`.

**Consulted sources:** `DecorSinglePackagePage.jsx`, `usePackages.js`, `AccordionSection` in `SingleProductPageContent.jsx`

**Prevention guidance:** Package narrative fields that share the accordion UX should be built into accordion sections, not duplicated as static blocks above inclusions.

## 2026-08-10: Package gallery main image only updated on thumb click

**Root cause:** Side thumbnail strip required an explicit click to call `setSelectedOverride`. Scrolling the strip alone did not change the main image (desktop or mobile).

**Failure symptoms:** User scrolled thumbnails then still had to click; main image stayed on the previous photo until click.

**Fix details:** Scroll listener on the thumb strip picks the thumb nearest the top focus line and updates the main image automatically; click still works. Applied in shared `SingleProductPageContent` for all packages.

**Consulted sources:** `SingleProductPageContent.jsx` ProductImageLayout

**Prevention guidance:** Gallery strips that show a large preview must sync on scroll (scroll-spy), not click-only.

## 2026-08-10: Golden Touch 1 card had no mobile image arrows

**Root cause:** Listing cover builder returned only `pkg.images` when present. Golden Touch 1 has one cover (`gt1.png`) plus two inclusion photos, so the card saw `images.length === 1` and hid left/right controls / swipe carousel.

**Failure symptoms:** On mobile decor levels, Golden Touch 1 image was not scrollable and had no left/right buttons; other multi-image packages worked.

**Fix details:** For slug `golden-touch-1`, `buildListingCoverImages` uses full `buildPackageImageUrls` (cover + inclusion/backdrop/element images).

**Consulted sources:** Live Strapi package `golden-touch-1`, `usePackages.js`, `PackageCard.jsx`

**Prevention guidance:** If a package should carousel on listing cards, either upload multiple `images` or include inclusion media in the listing cover merge for that slug/pattern.

## 2026-08-10: Theme cards uneven height on mobile

**Root cause:** `ThemeCard` used `h-full` + image `flex-1` without a fixed mobile height; only desktop set `md:h-[424px]`. On phones the image frame collapsed to each photo’s intrinsic size, so some themes looked short and others taller.

**Failure symptoms:** Decor theme images inconsistent length/height on mobile only; desktop looked fine.

**Fix details:** Mobile image area uses fixed `aspect-[278/356]` and absolute-fill `BrandedImage`; desktop keeps flex-1 inside 424px card.

**Consulted sources:** `DecorThemePage.jsx` ThemeCard

**Prevention guidance:** Flow cards that share one grid must use aspect-ratio or fixed height on mobile — never `h-full`/`flex-1` alone without a sized parent.

## 2026-08-10: Hero mobile cards + one-scroll video

**Root cause:** Mobile footer still showed W + “ork made easy” taglines; hero scroll track was 300–420vh with scrub 3.5, so several wheel/swipes were needed before the video moved to the next section.

**Failure symptoms:** Mobile showed Work made easy instead of Birthday/Anniversary/House Party; desktop W had a visible gap before ork/orth; home hero felt like ~5 scrolls.

**Fix details:** Mobile footer = event cards only; desktop W uses `mr-0` + slight negative margin on taglines; wrapper height ~145–160vh and scrub `true`.

**Consulted sources:** `HeroSection.jsx`

**Prevention guidance:** Keep mobile event cards and desktop W taglines as separate footers; tune hero height/scrub together when changing scroll feel.

## 2026-08-10: Disco-ball hero video stuck on iPhone (reload/play control)

**Root cause:** Hero `<video>` relied on the `autoPlay` attribute while starting off-screen (`top: 100vh` during preloader). iOS Safari (especially Low Power Mode) often refuses muted autoplay until the element is on-screen and/or `video.play()` runs. Preload helper also called `removeAttribute('src')` + `load()` on a throwaway element, which can stall the same URL for the real player on iOS.

**Failure symptoms:** Ball video plays on desktop/Android; on iPhone a native reload/play control appears; tap then starts playback (user gesture unlocks play).

**Fix details:** `ensureHeroVideoPlaying()` sets muted + playsinline/webkit-playsinline and calls `play()` after preload, on video reveal, on `loadedmetadata`/`canplay`, and on first touch. Stopped `video.load()` after clearing preload src.

**Consulted sources:** `HeroSection.jsx`, `homePagePreload.js`, iOS muted inline autoplay rules.

**Prevention guidance:** Never depend on HTML `autoPlay` alone for off-screen hero videos on iOS; always call `play()` when the clip becomes visible and keep a one-shot touch unlock for Low Power Mode.

## 2026-08-10: Signature Essentials 3 CMS edits not showing on frontend

**Root cause:** Anniversary decor seed (`seedDecorAnniversaryPackages`) hard-coded `refreshExistingDecor: true`. On each Strapi bootstrap (dev default: seed runs unless `SEED_DECOR_ANNIVERSARY_PACKAGES=false`), existing packages including `signature-essentials-3` were overwritten with seed title, description, `base_price`, and the full decor dynamic zone. Frontend correctly read the published API; the API kept receiving seed data after restarts.

**Failure symptoms:** Changes saved in Strapi admin for Signature Essentials 3 did not stick on the website (or reverted after Strapi restart). Publish + frontend cache alone looked like the bug.

**Fix details:** Removed forced `refreshExistingDecor: true` from anniversary and Still Us extra seeds so refresh follows `SEED_DECOR_REFRESH_EXISTING=true` only. Documented opt-out via `SEED_DECOR_ANNIVERSARY_PACKAGES=false` in `strapi/SEEDING.md` and `strapi/.env.example`.

**Consulted sources:** `strapi/src/seed/decor-anniversary-packages.js`, `strapi/src/seed/decor-proposal-shared.js` (`ensureProposalPackage`), `frontend/src/hooks/usePackages.js` (publish + `is_active`/`visibility` filters).

**Prevention guidance:** Do not hard-force `refreshExistingDecor: true` on seeds for packages that editors maintain in Strapi. Prefer create-once + skip; use `SEED_DECOR_REFRESH_EXISTING` for intentional re-sync. Always Save → Publish; remember frontend package `staleTime` is 5 minutes.

## 2026-08-11: Admin booking tabs showed stale package after cancel

**Root cause:** Two stacked bugs. (1) `placeholderData: keepPreviousData` reused the previous bucket list while switching tabs. (2) `displayBookings` always prepended the currently opened booking (`openBookingId` / `?open=`) even when that booking no longer belonged in the active bucket. After cancel, Today/Upcoming still showed the same "Cancelled by admin" card until the browser tab was closed (which cleared React Query + open state).

**Failure symptoms:** Cancel a booking on Today → switch Upcoming/Cancelled (or stay on Today) → same cancelled package still on screen. Close tab / hard refresh → correct empty Today and cancelled under Cancelled.

**Fix details:** Removed `keepPreviousData`. On status update, `removeQueries` for `['admin', 'bookings']`. Stop pinning opened bookings into the wrong bucket via `bookingBelongsInBucket`; clear `openBookingId` on tab change and when a status update moves the row out of the current bucket; client-filter list rows that do not belong.

**Consulted sources:** `admin-pannel/src/pages/BookingManagementPage.jsx`, `admin-pannel/src/hooks/useAdminData.js`, `api/src/controllers/admin.js` (`buildBookingBucketFilter` / `bookingMatchesOperationalBucket`).

**Prevention guidance:** Deep-link "open this booking" helpers must respect the active filter/bucket. Never use `keepPreviousData` across filter keys. After mutations that move rows between lists, clear open/pin state and reset list caches.
