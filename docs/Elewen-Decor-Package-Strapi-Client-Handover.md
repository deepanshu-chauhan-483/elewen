# Elewen — Decor packages: Strapi client handover

| | |
|---|---|
| **Admin panel** | [https://strapi.elewen.co.in/admin](https://strapi.elewen.co.in/admin) |
| **What this covers** | Decor packages only (name, price, photos, inclusions, Choose 1 options, add-ons, theme, Level, story text) |
| **Audience** | Client / content editor |
| **Website effect** | Changes appear on Decor listing, Level pages, theme pages, and each package detail page after you **Publish** |

For **all services** (Decor, Catering, Bartending, Sheesha, Furniture, Social / Corporate / Religious, website pages, coupons, FAQs, and more), share the full guide instead:  
[`Elewen-Strapi-Admin-Client-Handover.md`](./Elewen-Strapi-Admin-Client-Handover.md)

---

## Table of contents

1. [Before you start](#1-before-you-start)
2. [Find a Decor package](#2-find-a-decor-package)
3. [Edit package name, description, price, photos](#3-edit-package-name-description-price-photos)
4. [Show or hide a package](#4-show-or-hide-a-package)
5. [Sale / discount](#5-sale--discount)
6. [Which celebration and service](#6-which-celebration-and-service)
7. [Open Decor details](#7-open-decor-details)
8. [Level 1 / 2 / 3](#8-level-1--2--3)
9. [Theme](#9-theme)
10. [Story text (why we love it, setup needs, etc.)](#10-story-text-why-we-love-it-setup-needs-etc)
11. [Photos (main + backdrop)](#11-photos-main--backdrop)
12. [What’s included — normal bullets](#12-whats-included--normal-bullets)
13. [Choose 1 options (customer picks one)](#13-choose-1-options-customer-picks-one)
14. [Add-ons (extras)](#14-add-ons-extras)
15. [Price covers and price breakdown](#15-price-covers-and-price-breakdown)
16. [Policy](#16-policy)
17. [Check your work on the website](#17-check-your-work-on-the-website)
18. [Do not change](#18-do-not-change)
19. [Quick checklist](#19-quick-checklist)
20. [Need help?](#20-need-help)

---

## 1. Before you start

1. Open [https://strapi.elewen.co.in/admin](https://strapi.elewen.co.in/admin) and log in.
2. Use the left menu → **Content Manager**.
3. After every change:
   - Click **Save**
   - Click **Publish** (if you see it)
4. Wait a minute, then check the live website (hard refresh if needed: Ctrl+F5 / Cmd+Shift+R).

**Important:** If you only Save and forget Publish, the website will not update.

---

## 2. Find a Decor package

There are many Decor packages (for example Signature Essentials 1 / 2 / 3, Still Us themes, House Party, and more).

1. Content Manager → **Package**
2. Use the search box to type the package name (example: `Signature Essentials 3`)
3. Open the package you want
4. Confirm it is Decor:
   - **Service categories** should include **Decor** (or Furniture / rental if that package is furniture décor)
   - Scroll until you see a **Decor** details block (sometimes labelled like `decorpackages`)

If you open Catering / Bartending / Sheesha by mistake, stop and open a Decor package instead. This guide is Decor only.

---

## 3. Edit package name, description, price, photos

These fields are at the **top** of the Package entry (same for all packages).

| What you want to change | Field name in Strapi | What the customer sees |
|-------------------------|----------------------|------------------------|
| Package name | **Title** | Name on listing cards and package page |
| Long description | **Description** | Main text on the package page |
| Main price | **Base price** | Price on cards and package page |
| Main photos | **Images** | Card cover + package gallery |

### Exact steps — Title

1. Open the package
2. Find **Title**
3. Type the new name
4. **Save** → **Publish**

### Exact steps — Description

1. Find **Description**
2. Edit the text
3. **Save** → **Publish**

### Exact steps — Base price

1. Find **Base price**
2. Enter the number (example: `60620`)
3. **Save** → **Publish**

### Exact steps — Main images

1. Find **Images**
2. Click to upload or add media
3. Add or remove photos as needed
4. **Save** → **Publish**

Tip: Clear, bright photos work best for listing cards. The first image is often used as the cover.

---

## 4. Show or hide a package

| Field | Meaning |
|-------|---------|
| **Is active** | Package is available in the system |
| **Visibility** | Package is shown on the public website |

To hide a package from the website:

1. Turn **Visibility** off (or turn **Is active** off)
2. **Save** → **Publish**

To show it again, turn both back **on**, then Save → Publish.

---

## 5. Sale / discount

Optional. Use when you want a sale price or badge.

1. Open the package
2. Set **Discount active** to on
3. Choose **Discount type**: percentage or flat amount
4. Enter **Discount value**
5. Optional: **Discount badge** (example: `Festival Offer`)
6. Optional: **Discount valid from** / **Discount valid to**
7. **Save** → **Publish**

The website shows the sale price (and badge when set) on cards and the package page during valid dates.

---

## 6. Which celebration and service

| Field | What it does |
|-------|----------------|
| **Events** | Which celebration this package belongs to (Anniversary, Birthday, Proposal, etc.) |
| **Service categories** | Must stay linked to **Decor** for Decor pages |

### Change the event (celebration)

1. Find **Events**
2. Link or unlink the celebration
3. **Save** → **Publish**

### Service category

Leave **Decor** linked unless support asks you to change it. Wrong service = package may disappear from Decor pages.

---

## 7. Open Decor details

1. Scroll inside the Package entry
2. Find the **Decor** block (may appear as **decorpackages** or under the dynamic **Packages** section)
3. All Decor-only text, Level, Theme, Inclusions, and Decor add-ons live here

Note: The inclusions list may appear with a spelling quirk such as **Inclustions**. That is the correct Decor field — use it for bullets and Choose 1 options.

---

## 8. Level 1 / 2 / 3

This controls which Level tab or group the package appears under on Decor Level pages.

1. Inside Decor details, find **Budget level**
2. Choose Level 1, Level 2, or Level 3
3. **Save** → **Publish**

To rename Level labels globally (rare): Content Manager → **Budget Level** → edit name → Save → Publish.

---

## 9. Theme

Themes group packages on Decor theme pages (example: Signature Essentials, Still Us, Pastel).

1. Inside Decor details, find **Theme**
2. Link the correct theme
3. Optional: **Theme name** (text label — keep it matching the theme you linked)
4. **Save** → **Publish**

If the theme link is wrong, the package shows under the wrong theme on the website.

---

## 10. Story text (why we love it, setup needs, etc.)

All of these sit inside **Decor details**. Edit any of them, then Save → Publish.

| Field in Strapi | What it is | Where it shows |
|-----------------|------------|----------------|
| **Why we love it** | Short “why this look” text | Package page accordion / story |
| **Best placed at** | Best venues / placement | Package page |
| **Key decor elements** | Short décor summary | Package page intro area |
| **Purpose** | What the look is for | Package page (supporting copy) |
| **Notes** | Extra notes | Package page (supporting copy) |
| **Nitty gritty** | Fine print / practical detail | Package page accordion |
| **Setup needs** | What the client site must provide | Package page accordion |
| **Color palette** | Colour notes | Optional / limited on site |
| **Setup time** | Setup duration text | Optional / limited on site |
| **Ballon count** | Balloon number (spelling quirk in admin) | Optional / limited on site |

You do not need to fill every field. Fill the ones you use for marketing and customer clarity.

---

## 11. Photos (main + backdrop)

| Photos | Where to edit | Website |
|--------|---------------|---------|
| Main gallery | Package top → **Images** | Cards + main gallery |
| Backdrop photos | Decor details → **Backdrop images** | Extra gallery slides on package page |
| Option photos | Each inclusion / choose option → **Images** | Photos for that option; click-to-match on package page |

Always Save → Publish after media changes.

---

## 12. What’s included — normal bullets

Use this for fixed “included” lines (no customer choice).

1. Open Decor details
2. Find **Inclustions** / **Inclusions**
3. Click **Add an entry** (or edit an existing line)
4. Fill:
   - **Text** → the bullet wording (one idea per line)
   - **Group title** → section heading (example: `Printables`, `Lighting`, `Centerpieces`)
5. Leave **Is choice group** off for normal bullets
6. Optional: add **Images** for that line
7. **Save** → **Publish**

Some short bullets also appear as chips on listing cards.

---

## 13. Choose 1 options (customer picks one)

Customers pick **one** option from a group (example: Entrance Setup — Floral Easel / Mirror / Crates).

You need three kinds of rows in **Inclustions**:

1. **Heading** — “Choose 1” for that group  
2. **Options** — each choice the customer can pick  
3. **Detail bullets under an option** (optional) — small points that belong to one option  

### Rule that must never break

All rows in one choose group must share the **same Choice group key**  
(example: `se3-entrance` or `backdrop`).

If keys differ, options will not group correctly on the website.

---

### Step A — Create the Choose heading

1. In **Inclustions**, add a new entry
2. Turn **Is choice group** **ON**
3. Set:
   - **Choice group label** → example: `Entrance Setup (choose 1)` or `Choose 1`
   - **Choice group key** → short code, example: `entrance`
   - **Text** can match the label or stay short
4. **Save** → **Publish**

---

### Step B — Add each option

For every option the customer can pick:

1. Add another inclusion entry
2. Turn **Is choice group** **ON**
3. Use the **same Choice group key** as the heading
4. Set:
   - **Text** → option name (example: `Floral Easel Entrance`)
   - **Images** → photos for this option
   - **Price surcharge** (optional) → extra INR on top of the package base price when this option is selected (example: `5000`). Leave blank or `0` if the option does not change the price. The website shows `+₹5,000` on that option tag and adds it to the package total and cart.
5. **Save** → **Publish**

Repeat for every option in that group.

**Price surcharge rules**

- Only fill **Price surcharge** on Choose 1 **option** rows (`Is choice group` ON) that cost extra.
- Amount is a **delta** added to the package base price (not a full replacement price).
- Example (Signature Essentials 3): `Single Panel Backdrop` = `5000`, `Fancy Bar` = `5000`. Other options in those groups stay at `0`.
- Packages with no surcharges behave as before.

---

### Step C — Add detail bullets under one option

If an option needs small points underneath (example: “Carpet and crates styling”):

1. Add another inclusion entry
2. Keep **Is choice group** **OFF**
3. Put the detail in **Text**
4. Set **Group title** carefully so it belongs to that option  
   Pattern used in Elewen:  
   `when:{same-key}:{exact option Text}`  
   Example: if key is `entrance` and option text is `Floral Easel Entrance`, use:  
   `when:entrance:Floral Easel Entrance`
5. **Save** → **Publish**

The option **Text** and the part after the last `:` must match exactly (including spelling and spaces).

---

### Simple Choose 1 picture

```text
Heading   → Entrance Setup (choose 1)     key: entrance
Option A  → Floral Easel Entrance         key: entrance
  bullet  → when:entrance:Floral Easel Entrance
Option B  → Mirror Entrance               key: entrance
  bullet  → when:entrance:Mirror Entrance
```

---

## 14. Add-ons (extras)

Add-ons are optional extras customers can add (extra pieces, upgrades, etc.).

### Option A — Edit a shared add-on (recommended for catalog extras)

1. Content Manager → **Addon**
2. Open the add-on (or create one)
3. Edit:
   - **Name**
   - **Description**
   - **Price**
   - **Visibility**
   - **Image**
   - **Addon scope** → for Decor, use Decor or Universal (ask support if unsure)
4. **Save** (and Publish if shown)

### Option B — Link shared add-ons to this package

1. Open the Decor **Package**
2. Find **Reusable addons**
3. Link the add-ons you want
4. **Save** → **Publish**

### Option C — Decor-local add-ons on the package

1. Open Decor details
2. Find **Addons** (inside the Decor block)
3. Add entries with **Name**, **Description**, **Price**, **Visibility**, optional unit / max quantity
4. **Save** → **Publish**

Linked / visible add-ons appear on the package flow and cart when the frontend loads them for that package.

---

## 15. Price covers and price breakdown

### Price covers (simple bullets: “this price includes…”)

1. Decor details → **Price covers**
2. Add one row per bullet in **Text**
3. **Save** → **Publish**

Shows in the package page accordion area.

### Price breakdown (labelled amounts)

1. Decor details → **Price breakdown**
2. For each row set:
   - **Label** (example: `Backdrop`)
   - **Amount** (number)
3. **Save** → **Publish**

Keep the sum sensible vs **Base price** so customers are not confused.

---

## 16. Policy

1. Decor details → **Policy**
2. Link the correct policy (example: material / rental policy for decor)
3. **Save** → **Publish**

Policy text appears in the package page accordion / policy area.

To edit the policy wording itself: Content Manager → **Policy** → open that policy → edit → Save → Publish.

---

## 17. Check your work on the website

After Publish:

1. Open the live Elewen website
2. Go to **Decor** packages
3. Open the same package (by name / theme / Level)
4. Confirm:
   - Title, price, photos
   - Inclusions / Choose 1 options
   - Story text and add-ons (if used)

If nothing changed:

- Confirm you clicked **Publish**
- Confirm **Is active** and **Visibility** are on
- Hard refresh the page
- Wait 1–2 minutes (website may cache briefly)

---

## 18. Do not change

Leave these alone unless support asks:

- Slug / short website link fields (change the **Title** instead)
- Codes / IDs
- Users, passwords, Roles, Settings
- Deleting whole packages (hide with Visibility instead)
- Removing **Decor** from Service categories
- Vendor / customer / booking records
- Random empty dynamic-zone blocks for Catering / Bartending / Sheesha on a Decor package

---

## 19. Quick checklist

| Task | Where | Remember |
|------|--------|----------|
| Rename package | Package → **Title** | Save → Publish |
| Change story | Package → **Description** | Save → Publish |
| Change price | Package → **Base price** | Save → Publish |
| Change main photos | Package → **Images** | Save → Publish |
| Hide package | **Visibility** / **Is active** | Save → Publish |
| Change Level | Decor → **Budget level** | Save → Publish |
| Change theme | Decor → **Theme** | Save → Publish |
| Edit bullets | Decor → **Inclustions** | One idea per **Text** line |
| Edit Choose 1 | Same inclusions + **same group key** | Heading + options share key |
| Option price may vary | Inclustions → **Price surcharge** | Extra ₹ on that option tag + total |
| Edit add-ons | **Addon** and/or Package **Reusable addons** / Decor **Addons** | Save → Publish |
| Edit “price covers” | Decor → **Price covers** | Save → Publish |
| Check live site | Decor listing + package page | Hard refresh if needed |

---

## 20. Need help?

Ask support and share:

1. Package name (example: Signature Essentials 3)
2. What you tried to change
3. What you see on the website now
4. Screenshot of the Strapi fields if possible

Admin login: [https://strapi.elewen.co.in/admin](https://strapi.elewen.co.in/admin)

---

*Decor-only handover for Elewen. For other services (Catering, Bartending, Sheesha) use the full content guide or ask support for a matching handover.*
