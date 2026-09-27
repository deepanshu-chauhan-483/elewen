# Elewen — Event theme catalog handover

| | |
|---|---|
| **Status** | Code ready locally; **not fully live** until Strapi schema deploy + remote CMS seed |
| **Audience** | Engineers / ops taking over this work |
| **Source of truth (product)** | [`docs/event with theme.docx`](./event%20with%20theme.docx) |
| **Live CMS** | [https://strapi.elewen.co.in/admin](https://strapi.elewen.co.in/admin) |
| **Live site** | [https://elewen.co.in](https://elewen.co.in) |
| **Date** | 2026-09-25 (updated 2026-09-27 after malware cleanup) |

---

## Table of contents

1. [What this work is](#1-what-this-work-is)
2. [Current status / blockers](#2-current-status--blockers)
3. [Product rules from the Word doc](#3-product-rules-from-the-word-doc)
4. [Architecture (hybrid)](#4-architecture-hybrid)
5. [Files changed](#5-files-changed)
6. [How navigation decides the next URL](#6-how-navigation-decides-the-next-url)
7. [Deploy order (do not reverse)](#7-deploy-order-do-not-reverse)
8. [CMS seed against deployed Strapi](#8-cms-seed-against-deployed-strapi)
9. [Rollback plan](#9-rollback-plan)
10. [How editors add a new theme later](#10-how-editors-add-a-new-theme-later)
11. [Verification / smoke tests](#11-verification--smoke-tests)
12. [What is intentionally out of scope](#12-what-is-intentionally-out-of-scope)
13. [Open decisions / next owner actions](#13-open-decisions--next-owner-actions)

---

## 1. What this work is

Decor event themes on the live site were wrong relative to the client Word doc. Root causes:

1. **No Event → Theme map in CMS.** Themes exist as a Theme collection and on decor package components, but Events had no `themes` relation and no flow field.
2. **Frontend hardcoding fought the CMS.** A global 9-theme fallback (`DECOR_THEME_FALLBACK`) and several event slug Sets decided what customers saw.
3. **Navigation predicates disagreed with the Word doc** (for example Bridal forced “General Pack only”; Mehendi was not consultation-only).

**Chosen approach (hybrid):**

- Hardcode the Word-doc event → flow / themes map as the **baseline** (works even if CMS is empty).
- Allow **CMS extras**: link more Themes on an Event in Strapi; they merge into the picker.
- Seed CMS carefully on **deployed** Strapi so admin matches the Word doc.
- Keep an instant frontend kill switch for rollback.

---

## 1a. Malware cleanup (2026-09-27)

Infected commit `6839a41` hid obfuscated crypto-miner / payload code after whitespace in:

- `frontend/postcss.config.js`
- `admin-pannel/postcss.config.js`

**Done:**

1. Force-reset `origin/main`, `origin/dev`, `origin/hritik-dev` to clean `0135ba0`.
2. Deleted `~/Downloads/elewen-main.zip` (payload archive).
3. Re-shipped the event theme catalog as `a8abd0a` on those three branches.
4. Verified remote `postcss.config.js` is the short clean Tailwind config only.

Anyone who pulled `6839a41` should hard-reset to `origin/main` and reinstall dependencies on a clean tree. Rotate GitHub tokens / SSH keys if the zip or infected tree ran on a machine.

---

## 2. Current status / blockers

| Item | State |
|---|---|
| Frontend Word-doc catalog module | Done (local uncommitted / branch work) |
| Navigation wiring (`serviceFlow`, `packageFilters`, theme page, filter bar) | Done |
| Strapi Event schema (`decor_flow`, `themes`) | Done **in repo**; **not on production Strapi yet** |
| Bootstrap seed (`SEED_EVENT_THEME_MAP`) | Done in repo |
| Remote REST seed script | Done: `scripts/seed-event-theme-map-remote.mjs` |
| Assert script | Done: `frontend/scripts/assert-decor-theme-catalog.mjs` |
| Production CMS seed | **Blocked** — see below |
| Frontend live deploy | **Not done** — wait for schema + seed gate (or ship frontend-only with hardcode) |

### Blockers against https://strapi.elewen.co.in

1. **Schema missing on prod.** Public `GET /api/events` does not return `decor_flow` or `themes`. `populate[themes]=true` fails until Strapi with the updated Event schema is deployed.
2. **API token in `api/.env` is not accepted by prod** (401 Unauthorized). That token is almost certainly for local Strapi. Need a production token from Strapi Admin → Settings → API Tokens (Full access, or Events + Themes create/update/publish).
3. **Local Strapi is not the target.** Do not seed `localhost:1337` for this work. Use deployed CMS only.

Frontend Word-doc hardcode can still ship **without** CMS fields. CMS seed and admin extras need the schema deploy first.

---

## 3. Product rules from the Word doc

### Events with a theme step

| Event (canonical slug) | Themes (URL / filter slugs) |
|---|---|
| Birthday Party (`birthday-parties`) | General Pack (`birthday-party`), Bubbles & Black Tie (`bubbles-and-black-tie`), Bohemian (`bohemian`), Pastel (`pastel`) |
| House Party (`house-parties`) | General Pack (`birthday-party`), House Party (`house-party`) |
| Anniversary (`anniversary`) | General Pack (`birthday-party`), Still Us (`still-us`), Bubbles & Black Tie (`bubbles-and-black-tie`) |
| Baby Shower (`baby-shower`) | General Pack (`birthday-party`), A little honey (`a-little-honey`), Oh Baby (`oh-baby`) |

### Skip theme → package listing

- Bridal Shower (`bridal-shower`)
- Proposal (`proposal`)

### Book a consultation

- Mehndi / Mehendi (`mehendi`)
- Sufi Night (`sufi-night`)
- Haldi (`haldi`)

### Unpublish / unavailable

- Wedding (`wedding`)
- Engagement (`engagement`)

### Deferred (do not touch)

- **Diwali Party** — client will add packages later. Do not seed flow, themes, or packages for Diwali. Leave current live behaviour (fallback path) as-is.

---

## 4. Architecture (hybrid)

```text
Word-doc map (hardcoded)     CMS Event.themes / decor_flow
        │                              │
        ▼                              ▼
 decorEventThemeCatalog.js  ←── merge extras / optional flow override
        │
        ├── serviceFlow.js      (consultation / unavailable / skip → levels)
        ├── packageFilters.js   (requires theme step?)
        ├── DecorThemePage.jsx  (picker list)
        └── PackageResultsHero  (theme pills)
```

### Resolve rules

| Concern | Rule |
|---|---|
| Flow | Word-doc map for known events. If CMS `decor_flow` is set and catalog mode is on, CMS wins. Diwali not in map → existing fallback Set still owns it. |
| Theme picker | Word-doc theme slugs **∪** CMS `Event.themes`. Labels/images from Theme API when present. |
| Unknown events | Old package-derived filtering / legacy behaviour. |
| Kill switch | `VITE_DECOR_THEME_CATALOG=legacy` restores pre-change Sets and does not use the Word-doc allowlist. |

### Flow values (`decor_flow` enum)

- `theme_step` — show `/event-flow/decor-theme`
- `skip_to_packages` — go to `/packages/decor-levels?skipTheme=1`
- `consultation` — `/book-consultation`
- `unavailable` — treated like fallback / unpublished deep links (`/fallback-screen` for unavailable)

### Important slug note

Customer-facing **“General Pack”** uses canonical theme slug **`birthday-party`** (existing package filter convention). Alias `general-pack` is accepted in matching helpers.

---

## 5. Files changed

### Frontend

| File | Role |
|---|---|
| [`frontend/src/lib/decorEventThemeCatalog.js`](../frontend/src/lib/decorEventThemeCatalog.js) | Word-doc map, resolve helpers, legacy flag |
| [`frontend/src/lib/serviceFlow.js`](../frontend/src/lib/serviceFlow.js) | Consultation / unavailable / skip-to-levels using catalog |
| [`frontend/src/lib/packageFilters.js`](../frontend/src/lib/packageFilters.js) | `requiresDecorThemeSelection` uses catalog in word-doc mode |
| [`frontend/src/pages/DecorThemePage.jsx`](../frontend/src/pages/DecorThemePage.jsx) | Allowlist filter; skip-theme redirect |
| [`frontend/src/components/package-listing/PackageResultsHero.jsx`](../frontend/src/components/package-listing/PackageResultsHero.jsx) | Theme pills use catalog allowlist |
| [`frontend/src/hooks/useEventTypes.js`](../frontend/src/hooks/useEventTypes.js) | Populate `themes`; map `decor_flow` on event cards |
| [`frontend/.env.example`](../frontend/.env.example) | Documents `VITE_DECOR_THEME_CATALOG` |
| [`frontend/scripts/assert-decor-theme-catalog.mjs`](../frontend/scripts/assert-decor-theme-catalog.mjs) | Runnable asserts (word-doc + legacy) |

### Strapi

| File | Role |
|---|---|
| [`strapi/src/api/event/content-types/event/schema.json`](../strapi/src/api/event/content-types/event/schema.json) | Adds `decor_flow` enum + `themes` manyToMany |
| [`strapi/src/seed/event-theme-map.js`](../strapi/src/seed/event-theme-map.js) | In-process seed + snapshot + rollback (boot flag) |
| [`strapi/src/index.js`](../strapi/src/index.js) | Wires `SEED_EVENT_THEME_MAP` / rollback env |

### Scripts / repo

| File | Role |
|---|---|
| [`scripts/seed-event-theme-map-remote.mjs`](../scripts/seed-event-theme-map-remote.mjs) | **Preferred for prod:** REST seed against deployed Strapi |
| [`.gitignore`](../.gitignore) | Ignores `strapi/src/seed/.snapshots/` |

### Source doc (not code)

| File | Role |
|---|---|
| [`docs/event with theme.docx`](./event%20with%20theme.docx) | Client theme / flow specification |

---

## 6. How navigation decides the next URL

Routes themselves are unchanged:

`/event-flow/category` → `/event-flow/event` → `/event-flow/service` → `/event-flow/decor-theme` → `/packages/decor-levels` → `/packages/decor`

Also: `/book-consultation`, `/fallback-screen`.

What changes is **which events reach which URL**.

| Event class | Destination after choosing Decor |
|---|---|
| `theme_step` | `/event-flow/decor-theme?...` |
| `skip_to_packages` | `/packages/decor-levels?...&skipTheme=1` |
| `consultation` | `/book-consultation` |
| `unavailable` | `/fallback-screen` (and seed unpublishes Wedding/Engagement) |
| Diwali (not in catalog) | Existing fallback-only behaviour |

Mutual guards that must stay aligned:

- `DecorThemePage` — consultation / fallback / skip redirects
- `DecorLevelsPage` — `requiresDecorThemeSelection` bounce back to theme page if needed

Do not half-migrate these two.

---

## 7. Deploy order (do not reverse)

1. **Merge / deploy Strapi** with Event schema (`decor_flow`, `themes`). Restart Strapi so Content-Type Builder / DB sync picks up fields.
2. **Create a production API token** (if you do not already have one that works against prod).
3. **Dry-run remote seed**, then **mutate seed** on https://strapi.elewen.co.in.
4. **Smoke CMS in admin** (Event → Themes linked, `decor_flow` set, Wedding/Engagement unpublished).
5. **Deploy frontend** with catalog mode default (`word-doc`). Optional explicit env: `VITE_DECOR_THEME_CATALOG=word-doc`.
6. **Smoke live site** journeys in section 11.

Frontend-only deploy (step 5 without 1–4) is possible because of the hardcoded baseline, but admin will not show the Event theme map until schema + seed land.

---

## 8. CMS seed against deployed Strapi

### Preferred: remote REST script

```bash
# From repo root. Loads STRAPI_API_TOKEN from api/.env (or env).
# Always targets https://strapi.elewen.co.in unless --url= is set.
# Ignores local/docker STRAPI_URL from api/.env.

node scripts/seed-event-theme-map-remote.mjs --dry-run
node scripts/seed-event-theme-map-remote.mjs
node scripts/seed-event-theme-map-remote.mjs --rollback
```

Behaviour:

- Ensures Theme documents by stable slug (reuse if present).
- Sets `decor_flow` + `themes` on in-scope Events only.
- Unpublishes Wedding / Engagement.
- **Never mutates Diwali.**
- Writes before-snapshot under `strapi/src/seed/.snapshots/event-theme-map-remote-before-*.json` (gitignored).

### Alternate: Strapi boot seed (inside the Strapi container)

```bash
# Production: must set true explicitly
SEED_EVENT_THEME_MAP=true

# Rollback (restore latest local snapshot from that environment)
SEED_EVENT_THEME_MAP=true
SEED_EVENT_THEME_MAP_ROLLBACK=true
```

Use remote REST from a laptop when you cannot easily set boot env on the VPS.

### Token requirements

- Must work against **https://strapi.elewen.co.in** (not localhost).
- Needs permission to find/create Themes, update Events, publish/unpublish.
- Do not commit tokens. Do not paste tokens into chat or PRs.

---

## 9. Rollback plan

### R0 — Instant frontend rollback (preferred, minutes)

1. Set `VITE_DECOR_THEME_CATALOG=legacy` on the live frontend build env.
2. Rebuild and redeploy frontend only.
3. Do **not** drop Strapi fields. Additive schema is safe while legacy mode ignores them.
4. Verify Birthday themes and Mehendi routing match pre-change behaviour.

### R1 — CMS seed rollback

1. Keep the before-snapshot from the remote seed run.
2. Run `node scripts/seed-event-theme-map-remote.mjs --rollback`  
   or boot Strapi with `SEED_EVENT_THEME_MAP_ROLLBACK=true` + `SEED_EVENT_THEME_MAP=true`.
3. Diwali was never mutated — no Diwali restore step.
4. Verify Event admin + public API match the snapshot.

### R2 — Git / deploy rollback

1. Keep this work in a focused PR/branch.
2. `git revert` the merge commit if needed; redeploy frontend (and Strapi only if required).
3. Do not force-push main.

### What rollback must never do

- Delete Theme or Package documents.
- Invent or delete Diwali packages.
- Require a DB “down” migration for the first emergency (R0 is enough).

---

## 10. How editors add a new theme later

After schema + seed are live:

1. Strapi Admin → **Theme** → create Theme (name, slug, preview image, active, publish).
2. Open the **Event** (for example Birthday Parties).
3. Link the new Theme under **themes**.
4. Save + Publish.
5. Website picker shows Word-doc baselines **plus** the new CMS theme for that event.

To change flow without code:

1. Set Event **decor_flow** (`theme_step` / `skip_to_packages` / `consultation` / `unavailable`).
2. Save + Publish.

**Diwali:** when the client is ready, add packages in CMS, then set `decor_flow` / themes. Prefer CMS over new frontend hardcoding.

---

## 11. Verification / smoke tests

### Local asserts (no CMS required)

```bash
node frontend/scripts/assert-decor-theme-catalog.mjs

# Rollback path
# PowerShell:
$env:VITE_DECOR_THEME_CATALOG='legacy'; node frontend/scripts/assert-decor-theme-catalog.mjs
Remove-Item Env:VITE_DECOR_THEME_CATALOG
```

### Live / staging journeys

| Journey | Expected |
|---|---|
| Social → Birthday → Decor | Theme page with General Pack, Bubbles & Black Tie, Bohemian, Pastel only |
| Social → House Party → Decor | General Pack + House Party |
| Social → Anniversary → Decor | General Pack + Still Us + Bubbles & Black Tie |
| Social → Baby Shower → Decor | General Pack + A little honey + Oh Baby |
| Social → Bridal / Proposal → Decor | Skip theme; packages / levels with `skipTheme=1` |
| Social → Mehendi / Sufi / Haldi → Decor | `/book-consultation` |
| Wedding / Engagement | Not in picker after seed; deep link → unavailable/fallback |
| Diwali | Unchanged from today (fallback path) |
| Filter bar event switch | Same rules as above |
| R0 drill | `legacy` flag restores old behaviour on staging once before prod |

### API probes (after schema deploy)

```text
GET https://strapi.elewen.co.in/api/events?filters[slug][$eq]=birthday-parties&populate[themes]=true
```

Expect `decor_flow: "theme_step"` and theme slugs matching the Word-doc table.

---

## 12. What is intentionally out of scope

- Diwali packages and Diwali flow changes.
- Inventing package catalog content.
- Reworking parent/child package theme slug maps beyond what navigation needs.
- Corporate / religious theme steps unless an Event is explicitly set to `theme_step` in CMS.
- Client-facing Strapi how-to for package inclusions (see existing Decor package handover).

Related existing docs:

- [`Elewen-Decor-Package-Strapi-Client-Handover.md`](./Elewen-Decor-Package-Strapi-Client-Handover.md)
- [`DEPLOYMENT.md`](../DEPLOYMENT.md)

---

## 13. Open decisions / next owner actions

1. **Deploy Strapi** with Event schema to production (docker rebuild of `elewen_strapi` per `DEPLOYMENT.md`).
2. **Issue a production API token** and put it in `api/.env` as `STRAPI_API_TOKEN` (local machine only; never commit).
3. Run remote seed dry-run → mutate → verify admin.
4. Drill R0 (`legacy`) once on staging.
5. Deploy frontend.
6. Smoke the journey table above on https://elewen.co.in.
7. When client delivers Diwali packages, configure Diwali in CMS only.

### Quick command cheat sheet

```bash
# Asserts
node frontend/scripts/assert-decor-theme-catalog.mjs

# Prod CMS (after schema + prod token)
node scripts/seed-event-theme-map-remote.mjs --dry-run
node scripts/seed-event-theme-map-remote.mjs
node scripts/seed-event-theme-map-remote.mjs --rollback

# Frontend kill switch (build env)
VITE_DECOR_THEME_CATALOG=legacy
```

---

## Appendix A — Why live looked wrong before this work

- Theme picker was “global themes + package-derived filter + hardcoded fallback,” not “per-event Word-doc list.”
- Sufi Night appeared as a **theme card** in the fallback list while the Word doc treats Sufi Night as a **consultation event**.
- Bridal / Diwali special-cases in frontend Sets disagreed with the Word doc (and with each other for Diwali).

## Appendix B — Security notes for the next owner

- Do not commit `.env`, API tokens, or snapshot files that contain production document IDs into public channels if avoidable.
- Tokens pasted into chat should be rotated if there is any chance of leak.
- Remote seed fails closed if schema or auth is wrong; do not bypass by seeding localhost for “prod data.”
