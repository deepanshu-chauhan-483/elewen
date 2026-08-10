# Lessons

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
