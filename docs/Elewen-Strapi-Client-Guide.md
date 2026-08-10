# Elewen content guide

For the admin panel: https://strapi.elewen.co.in/admin

Simple steps to update the website. Use short pointers. Ask support if unsure.

---

## Always do this

- Click **Save** after every change
- Click **Publish** if you see it
- Check the live website after you finish

---

## What you can edit

- Packages (name, price, photos, show / hide, sale badge)
- Level 1 / 2 / 3
- What’s included / not included / bullet points
- Choose headings and choose options (decor)
- Catering food dishes and menu sections
- Catering package text (ideal for, notes, requirements)
- Decor / bartending / sheesha package details
- Add-ons (extras) and link them to packages
- Events, themes, services
- Coupons and guest discounts
- Home page blocks, About, FAQs, How it works
- Footer, menu labels, button text
- Cart / checkout / booking message text
- Policies, blogs, testimonials
- Service areas (where you deliver)

## What to leave alone

- Codes / ID fields
- Settings, users, passwords (unless asked)
- Vendor records, customer profiles
- Deleting whole packages unless you are sure
- Short website link fields (rename with **Title / Name** only)

---

## How to open the admin panel

1. Go to https://strapi.elewen.co.in/admin
2. Log in
3. Open **Content Manager**
4. Pick what you want to edit

---

## Packages (all services)

**Open:** Content Manager → **Package**

- **Title** → package name
- **Description** → long text
- **Images** → photos
- **Base price** → main price
- **Discount** → sale on/off, amount, dates
- **Discount badge** → short sale text (example: Festival Offer)
- **Is active / Visibility** → show or hide
- **Is featured / Most booked** → highlight badges
- **Events** → which celebrations it belongs to
- **Service categories** → Decor / Catering / etc.
- Save → Publish

---

## Level 1 / 2 / 3

### On a package
- Open the package details block
- Set **Budget level** to Level 1, 2, or 3
- Save → Publish

### Rename Level labels (rare)
- Content Manager → **Budget Level**
- Edit name / description
- Save → Publish

---

## What’s included (normal bullets)

**Open:** Package → details → **Inclusions**

- Add one line per point
- Put the words in **Text**
- One idea = one line
- Save → Publish

**What’s not included**
- Use **Exclusions**
- Same idea: one line per item
- Save → Publish

---

## Choose groups (decor “Choose 1” options)

Customers pick one option from a group.

### 1) Make the heading
In **Inclusions**, on the heading row:
- Turn **Is choice group** on
- **Choice group label** → example: `Choose 1`
- **Choice group key** → same short code for this group  
  Example: `backdrop`  
  (Heading and options must use the **same** key)
- Save → Publish

### 2) Add choose options
- Add new inclusion lines for each option
- **Text** → option name
- **Images** → option photos
- Use the **same Choice group key** as the heading
- Save → Publish

### 3) Add bullets under an option
- Add more inclusion lines for that option
- Each detail goes in **Text** (one detail = one line)
- These show as small bullet points under the option
- Save → Publish

### Simple rule
- Heading = “Choose 1”
- Option = what they can pick
- Bullets = small points under that option
- Same group key = they stay linked

---

## Catering packages

**Open:** Package → catering details

### Prices
- Price per person veg
- Price per person non-veg
- Save → Publish

### Extra text you can edit
- Package subtitle
- Level description
- Ideal for
- Client requirements / setup needs
- Nitty gritty / notes
- Price covers
- Service style notes
- Save → Publish

### Catering group type
- Essentials / Assisted / End to end  
  (Ask support before changing this if unsure)

### Food menu sections on this package
**Menu items**
- **Title** → example: Salad (Choose 1)
- **Row type**
  - `choose` = customer picks dishes
  - `included` = fixed / included
  - `info` = note only
- **Choose hint** → short help text (optional)
- **Category** → which dish list opens
- **Extra category** → for veg + non-veg split (if needed)
- **Max pick** → how many they may choose
- **Veg pick / Nonveg pick** → for 2+2 style choices
- Save → Publish

### Do not put these in Menu items
Put in **Add-ons** instead:
- Serving staff
- Water bottles
- Cutlery
- Buffet tables

---

## Food dish list (shared)

**Open:** Content Manager → **Catering Menu Library**

- Open the right section (Salad, Starters, Dessert, etc.)
- Add / edit dish name and short description
- Mark veg / non-veg / both
- Turn Level 1 / 2 / 3 on for that dish if needed
- Save → Publish

---

## Decor packages

**Open:** Package → decor details

You can edit:
- Theme link
- Inclusions / choose groups (see above)
- Why we love it
- Best placed at
- Nitty gritty
- Price covers
- Key decor elements
- Setup needs
- Backdrop images
- Save → Publish

---

## Bartending packages

**Open:** Package → bartending details

You can edit:
- Bartender type / name style
- Hours range
- Price per extra hour
- Ideal for
- Inclusions / exclusions
- Price covers
- Save → Publish

---

## Sheesha packages

**Open:** Package → sheesha details

You can edit:
- Size
- Service duration
- Flavors
- Inclusions
- Price covers
- Save → Publish

---

## Add-ons (extras)

### Edit an add-on
**Open:** Content Manager → **Addon**
- Name, description, price
- Visibility
- Save

### Link add-ons to a package
**Open:** Package
- Attach under reusable add-ons / add-ons
- Save → Publish

---

## Policy on a package

- In package details, attach the right **Policy**
- Save → Publish  
(This shows policy text on the package page)

---

## Events

**Open:** Content Manager → **Event**
- Name, description, icon
- Active / featured
- Save → Publish

Link events on each package so it shows under the right celebration.

---

## Themes

**Open:** Content Manager → **Theme**
- Name, description, preview image
- Active / inactive
- Save → Publish

Link the theme on decor packages.

---

## Services (Decor, Catering, etc.)

**Open:** Content Manager → **Service** or **Service Category**
- Name, description
- Active / featured if shown
- Save → Publish

---

## Coupons

**Open:** Content Manager → **Coupon**
- Code
- Discount type and amount
- Dates / minimum order if needed
- Save → Publish
- Test once before sharing

---

## Guest count discounts (catering)

**Open:** Content Manager → **Catering Settings**
- Discount title / note
- Guest count tiers and amounts
- Save → Publish

---

## Home and website pages

**Open:** Content Manager → the page name

Main pages:
- Landing Page
- Celebration every day
- Grand celebrations intro
- About Page
- How It Works
- How It Works Step Landing page
- Book a Consultation Page
- In-House Planner Page
- Faq Item
- Privacy Policy
- Terms
- Cancellation Policy
- Policy

Steps:
1. Open the page
2. Edit text / images
3. Save → Publish
4. Check the live page

---

## Menu bar, footer, buttons

- **Navigation Menu** → top menu labels / links
- **Footer Content** → footer text / links
- **Global CTAs & Copy** → common button / call-to-action text
- Save → Publish

---

## Cart, checkout, booking messages

Edit these if customers see wrong wording:
- Cart Page Messaging
- Checkout Page Messaging
- Coupon & Discount Messaging
- Booking Confirmation Messaging
- Booking Cancellation Messaging
- Payment Failed Messaging
- Payment Cancelled Messaging
- Advance Payment Explanation
- Remaining Balance Explanation

Steps: open → edit text → Save → Publish

---

## Service areas

**Open:** Content Manager → **service-area**
- Where you deliver / serve
- Save → Publish

---

## Delivery charge

**Open:** Content Manager → **delivery-charge**
- Delivery fee rules / amounts
- Save → Publish

---

## Blogs and testimonials

- **Blog** → title, text, image
- **Testimonial** → name, quote, image
- Save → Publish

---

## Planner portfolio (optional)

**Open:** Content Manager → **Planner Portfolio Item**
- Photos / titles for planner portfolio
- Save → Publish

---

## Quick “I want to…”

- Rename package → Package → Title
- Change Level → Package → Budget level
- Change price → Base price (+ veg/non-veg for catering)
- Add inclusion bullet → Inclusions → Text Text line
- Change choose heading → Inclusions → Choice group label + same group key
- Add choose option → Inclusions → option Text + same group key + photos
- Add bullets under option → more Text lines for that option
- Add dish → Catering Menu Library
- Change food choose count → Menu items → Max pick
- Edit decor story text → decor details (why we love it, etc.)
- Edit bartending hours → bartending details
- Edit sheesha flavors → sheesha details
- Add extra → Addon (+ link on package)
- Hide package → turn off active / visibility
- Make coupon → Coupon
- Change footer / menu → Footer Content / Navigation Menu
- Change cart wording → Cart Page Messaging

Always: Save → Publish → check website

---

## Common mistakes

- Forgetting **Publish**
- Putting staff / bottles inside food Menu items
- Changing short website links instead of Title
- Choose heading and options with **different** group keys
- Turning off all Levels on a dish
- Editing without checking the live page
- Expecting a draft (Saved but not Published) package to appear on the website

---

## When to ask for help

Ask support if you need to:
- Build a new package structure from scratch
- Change website layout
- Fix something broken after an edit
- Recover something deleted
- Change login users

Share:
- Package or page name
- What you tried to change
- What you see now
