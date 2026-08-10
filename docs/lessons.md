# Lessons

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
