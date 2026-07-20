# Strapi seeding guide

How package and CMS seed scripts behave, when to run them, and how to avoid duplicate data after a Strapi rebuild.

---

## Quick answer

**Re-running seeds on an existing database does not normally create duplicates.**

Seeds look up existing records (mostly by **slug**) and **skip** or **update** instead of creating again.

---

## When seeds run

| Environment | Default |
|-------------|---------|
| **Production** (`NODE_ENV=production`) | Seeds run **only** when the matching `SEED_*` env var is `true` |
| **Development** | Seeds run on Strapi bootstrap **unless** the env var is `false` |

Production defaults in `.env.docker.example` keep all seeds **off**:

```env
SEED_CATERING_ESSENTIALS=false
SEED_CATERING_MENU=false
SEED_DELIVERY_CHARGES=false
SEED_DECOR_PROPOSAL_PACKAGES=false
SEED_DECOR_ANNIVERSARY_PACKAGES=false
SEED_DECOR_BABY_SHOWER_PACKAGES=false
SEED_DECOR_BACHELORETTE_PACKAGES=false
SEED_DECOR_EXCEL_PACKAGES=false
```

Bootstrap entry point: `strapi/src/index.js` → `bootstrap()`.

Manual scripts (same idempotent logic):

```bash
cd strapi
npm run seed:decor
npm run seed:decor-bachelorette
npm run seed:excel-decor
npm run seed:catering-essentials
npm run seed:catering-assisted
npm run seed:catering-end-to-end
npm run seed:catering-addons
npm run seed:catering-discounts
npm run seed:delivery-charges
```

---

## How idempotency works

### Packages (decor + catering)

Flow in `decor-proposal-shared.js` / `catering-shared.js`:

1. `findPackageBySlug(strapi, pkgSeed.slug)`
2. **Exists + has decor/catering block** → `skipped: true` (no new row)
3. **Exists + missing block** → `update` / `repaired: true` (still one package)
4. **Does not exist** → `create` once

Package `slug` is a Strapi `uid` field — each seed package has a stable slug (e.g. `table-stories-1`).

### Delivery charges

`delivery-charges.js`: if **any** published delivery-charge row exists → entire seed is **skipped**.

### Policies, service categories, addons, menus

Find existing record → skip, update, or create once. No blind bulk insert.

### Refresh existing decor (optional)

```env
SEED_DECOR_REFRESH_EXISTING=true
```

When set, decor seeds **update** packages that already have a decor block (title, description, base_price, inclusions, elements). **Does not touch images.** Still no duplicates — updates in place.

### Excel-import decor (Bubbles & Black Tie, Sufi Night, House Party)

Generated from repo Excel files via:

```bash
python scripts/parse_package_excel.py
python scripts/generate_decor_seeds.py
```

One-shot production seed (34 packages, slug-deduped):

```bash
cd strapi && npm run seed:excel-decor
```

**Not seeded from Excel (avoid duplicates):**

- `Final Catering Menu - 14.05.26.xlsx` — same packages as existing `catering-essentials.js`, `catering-assisted.js`, `catering-end-to-end.js`. Re-run those scripts if you need catering refresh.
- Incomplete sheets skipped: Sufi `IS 2` / `IS 3` (missing package price), Birthday `CP` (reference complete package).

---

## Rebuild scenarios

| Scenario | Re-run seeds? | Duplicates? |
|----------|---------------|-------------|
| Rebuild Strapi container, **Postgres volume kept** | Optional | **No** — existing slugs are skipped |
| **Fresh empty Postgres** (new volume) | Yes, once | **No** — creates once |
| Fresh DB + run seeds twice | Second run | **No** — second run skips |
| Production normal deploy | Leave `SEED_*=false` | N/A — seeds do not run |

### Recommended: Strapi rebuild, same database

1. Rebuild / restart Strapi
2. **Do not** enable seeds unless you intentionally want to repair or refresh content
3. Data remains in Postgres

### Recommended: full reset (empty database)

1. Start Strapi
2. Set required `SEED_*=true` **for one boot only** (or run manual `npm run seed:*` scripts once)
3. Check logs for `created=` vs `skipped=`
4. Set `SEED_*=false` again in production `.env`
5. Restart Strapi

Example log lines to expect:

```text
[seed/decor-anniversary] created=12, updated=0, repaired=0, skipped=0   # first run on empty DB
[seed/decor-anniversary] created=0, updated=0, repaired=0, skipped=12  # second run
```

---

## When duplicates *can* happen

1. Same package content seeded with a **different slug** than an existing CMS entry
2. **Manual duplicates** in Strapi admin (two entries, two slugs)
3. Changing a package slug in seed without cleaning the old CMS row

Seeds do **not** dedupe by title — only by slug (and type-specific checks for addons, menus, etc.).

---

## Seed file map

| File | Purpose |
|------|---------|
| `decor-proposal-packages.js` | Proposal / walk-to-forever decor |
| `decor-anniversary-packages.js` | Anniversary / still-us decor |
| `decor-baby-shower-packages.js` | Baby shower decor |
| `decor-bachelorette-packages.js` | Bachelors / bachelorette decor |
| `decor-bubbles-black-tie-packages.js` | Birthday / anniversary — Bubbles & Black Tie (generated) |
| `decor-sufi-night-packages.js` | Engagement — Ishq Sufiyana (generated) |
| `decor-house-party-birthday-packages.js` | House party / birthday general packs (generated) |
| `decor-pastel-packages.js` | Birthday Pastel theme packs (from `Birthday Packages - Pastel.xlsx`) |
| `decor-bohemian-packages.js` | Birthday Bohemian theme packs (from `Birthday Package- Bohemian .xlsx`) |
| `decor-proposal-shared.js` | Shared decor seed helpers |
| `decor-choice-elements.js` | Choice option prices → `elements` |
| `catering-essentials.js` | Essentials catering packages |
| `catering-assisted.js` | Assisted catering |
| `catering-end-to-end.js` | End-to-end catering |
| `catering-addons.js` | Catering addons |
| `catering-menu-library.js` | Menu library |
| `catering-discount-settings.js` | Guest discount settings |
| `delivery-charges.js` | Pincode delivery charges |
| `seed-env.js` | `isSeedEnabled()`, `shouldRefreshExistingDecor()` |

---

## Checklist after deploy or rebuild

- [ ] Confirm `SEED_*` flags in production `.env` (usually all `false`)
- [ ] If fresh DB: run seeds once, verify logs (`created` > 0, then `skipped` on re-run)
- [ ] Spot-check Strapi admin: one row per package slug
- [ ] Frontend: package listing and a few detail pages load correctly
- [ ] Only set `SEED_DECOR_REFRESH_EXISTING=true` when intentionally updating seed text/pricing on existing packages

---

## Related

- Docker / production URLs: `DEPLOYMENT.md` (repo root)
- Strapi env template: `strapi/.env.example`, root `.env.docker.example`
