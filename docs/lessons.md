# Lessons

## 2026-08-10: Signature Essentials 3 CMS edits not showing on frontend

**Root cause:** Anniversary decor seed (`seedDecorAnniversaryPackages`) hard-coded `refreshExistingDecor: true`. On each Strapi bootstrap (dev default: seed runs unless `SEED_DECOR_ANNIVERSARY_PACKAGES=false`), existing packages including `signature-essentials-3` were overwritten with seed title, description, `base_price`, and the full decor dynamic zone. Frontend correctly read the published API; the API kept receiving seed data after restarts.

**Failure symptoms:** Changes saved in Strapi admin for Signature Essentials 3 did not stick on the website (or reverted after Strapi restart). Publish + frontend cache alone looked like the bug.

**Fix details:** Removed forced `refreshExistingDecor: true` from anniversary and Still Us extra seeds so refresh follows `SEED_DECOR_REFRESH_EXISTING=true` only. Documented opt-out via `SEED_DECOR_ANNIVERSARY_PACKAGES=false` in `strapi/SEEDING.md` and `strapi/.env.example`.

**Consulted sources:** `strapi/src/seed/decor-anniversary-packages.js`, `strapi/src/seed/decor-proposal-shared.js` (`ensureProposalPackage`), `frontend/src/hooks/usePackages.js` (publish + `is_active`/`visibility` filters).

**Prevention guidance:** Do not hard-force `refreshExistingDecor: true` on seeds for packages that editors maintain in Strapi. Prefer create-once + skip; use `SEED_DECOR_REFRESH_EXISTING` for intentional re-sync. Always Save → Publish; remember frontend package `staleTime` is 5 minutes.
