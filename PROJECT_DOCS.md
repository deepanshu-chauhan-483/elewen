# Elewen Project Documentation

## 1. Project Overview

Elewen is split into three connected layers:

1. `frontend/`
   React + Vite frontend for the public website, event flow, auth screens, blog screens, and package listing UI.
2. `strapi/`
   Strapi CMS for marketing content, events, service categories, packages, blogs, testimonials, customer profiles, planner leads, and other content models.
3. `api/`
   Custom Express + Prisma API for business workflows such as auth session handling, cart, bookings, payments, messaging, notifications, support, vendor assignment, and lead submission.

The frontend talks to:

- Strapi directly for public content/data reads
- Express API for auth and operational workflows

## 2. High-Level Architecture

### Frontend

Main app entry:

- [frontend/src/main.jsx](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/main.jsx)
- [frontend/src/App.jsx](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/App.jsx)

Main frontend responsibilities:

- Route rendering
- Public content display
- Event selection flow
- Package listing screens
- Auth UI
- Lead capture forms

### Strapi

Main Strapi content source:

- `landing-page`
- `about-page`
- `inhouse-planner-page`
- `global-setting`
- `event`
- `service-category`
- `package`
- `theme`
- `budget-level`
- `blog`
- `testimonial`
- `planner-lead`
- `customer-profile`

### Express API

Main API server:

- [api/src/server.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/server.js)

Main API responsibilities:

- Session-based auth refresh cookie handling
- Customer auth proxying to Strapi
- Lead submission
- Cart persistence
- Booking lifecycle
- Payments and refunds
- Messaging
- Support tickets
- Notifications
- Vendor workflows

### Prisma

Custom database schema:

- [api/prisma/schema.prisma](/c:/Users/PRENEEL/Desktop/Elewen/api/prisma/schema.prisma)

Important note:

- Prisma only covers the custom API tables.
- Strapi manages its own CMS tables separately.
- Many Prisma records store Strapi entity IDs as plain strings instead of Prisma relations.

## 3. Frontend Data Access Layer

### Direct Strapi Client

Frontend Strapi client:

- [frontend/src/lib/strapi.js](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/lib/strapi.js)

Used for:

- Public CMS and catalog reads
- Query param based Strapi fetches
- Fallback mode with `VITE_USE_FALLBACK=true`

### Express API Client

Frontend custom API client:

- [frontend/src/lib/api.js](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/lib/api.js)

Used for:

- Auth
- Consultation submission
- Planner lead submission

Currently defined but not yet used by frontend screens:

- Cart
- Booking
- Payment
- Messaging
- Support
- Notifications

### React Query Hooks

Key hooks:

- [frontend/src/hooks/useCmsPages.js](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/hooks/useCmsPages.js)
- [frontend/src/hooks/useEventTypes.js](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/hooks/useEventTypes.js)
- [frontend/src/hooks/usePackages.js](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/hooks/usePackages.js)
- [frontend/src/hooks/useBlogs.js](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/hooks/useBlogs.js)
- [frontend/src/hooks/useTestimonials.js](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/hooks/useTestimonials.js)
- [frontend/src/hooks/useConsultation.js](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/hooks/useConsultation.js)
- [frontend/src/hooks/usePlannerLead.js](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/hooks/usePlannerLead.js)

## 4. Frontend Route Map

Defined in:

- [frontend/src/App.jsx](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/App.jsx)

### Marketing and Content Routes

| Route | Page | Data Source |
| --- | --- | --- |
| `/` | LandingPage | Strapi |
| `/about` | About | Strapi |
| `/in-house-planner` | InHousePlannerPage | Strapi + Express submit |
| `/how-it-work` | HowItWorkPage | Static in current code |
| `/blogs` | BlogPage | Strapi |
| `/blogs/:slug` | SingleBlogPage | Strapi |
| `/book-consultation` | BookConsultation | Express submit |
| `/consultation-confirmation` | ConsultationConfirmation | Static |

### Auth Routes

| Route | Page | Data Source |
| --- | --- | --- |
| `/login` | LoginPage | Express auth |
| `/signup` | SignUpPage | Express auth |
| `/forgot-password` | ForgotPasswordPage | Express auth |
| `/new-password` | NewPasswordPage | Express auth |
| `/reset-password` | ResetPasswordPage | Express auth |
| `/auth/callback` | AuthCallbackPage | Express auth |

### Event Flow Routes

| Route | Page | Data Source |
| --- | --- | --- |
| `/event-flow/category` | CategoryPage | Strapi events |
| `/event-flow/event` | EventPage | Strapi events |
| `/event-flow/service` | ServicePage | Strapi service categories |
| `/event-flow/decor-theme` | DecorThemePage | Strapi wizard/theme data |
| `/event-flow/catering-levels` | CateringLevelsPage | Strapi wizard/budget-level data |
| `/event-flow/bartending-levels` | BartendingLevelsPage | Strapi wizard/budget-level data |

### Package Routes

| Route | Page | Data Source |
| --- | --- | --- |
| `/package-listing` | PackageListingPage | Strapi packages |
| `/packages/decor-levels` | DecorLevelsPage | Strapi packages |
| `/packages/decor` | DecorPackagesPage | Strapi packages |
| `/packages/rental-furniture` | RentalFurniturePackagesPage | Strapi packages |
| `/packages/catering` | CateringPackagesPage | Strapi packages |
| `/packages/bartending` | BartendingPackagesPage | Strapi packages |
| `/packages/sheesha` | SheeshaPackagesPage | Strapi packages |

## 5. Pages Connected to Strapi

### Directly Connected to Strapi for Read Data

- `LandingPage`
- `About`
- `InHousePlannerPage`
- `BlogPage`
- `SingleBlogPage`
- `CategoryPage`
- `EventPage`
- `ServicePage`
- `DecorThemePage`
- `CateringLevelsPage`
- `BartendingLevelsPage`
- `DecorLevelsPage`
- `PackageListingPage`
- `DecorPackagesPage`
- `RentalFurniturePackagesPage`
- `CateringPackagesPage`
- `BartendingPackagesPage`
- `SheeshaPackagesPage`

### Not Connected to Strapi for Read Data in Current Frontend

- `HowItWorkPage`
- `BookConsultation`
- `ConsultationConfirmation`
- `LoginPage`
- `SignUpPage`
- `ForgotPasswordPage`
- `NewPasswordPage`
- `ResetPasswordPage`
- `AuthCallbackPage`

### Pages That Write Through Express Into Strapi

- `BookConsultation`
  Sends to Express `POST /consultations`, then Express creates a Strapi `planner-lead` with `lead_type = consultation`.
- `InHousePlannerPage`
  Sends to Express `POST /planner-leads`, then Express creates a Strapi `planner-lead` with `lead_type = planner`.
- Auth pages
  Use Express `/auth/*`, which then creates/reads/updates Strapi users and customer profiles.

## 6. Page-by-Page Documentation

### Landing Page

File:

- [frontend/src/pages/LandingPage.jsx](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/pages/LandingPage.jsx)

Reads:

- `useLandingPage()` from Strapi `landing-page`
- `usePackages()` from Strapi `packages`
- `useEventCategories()` from Strapi `events`
- `useEventCards()` from Strapi `events`
- `useServiceCards()` from Strapi `service-categories`
- `useTestimonials()` from Strapi `testimonials`
- `useBlogs()` from Strapi `blogs`
- `useBlogCategories()` from Strapi `blogs`

Purpose:

- Main marketing homepage
- Shows CMS-driven sections plus event, service, package, testimonial, and blog highlights
- Entry point into event flow and consultation/planner journeys

### About Page

File:

- [frontend/src/pages/About.jsx](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/pages/About.jsx)

Reads:

- `useAboutPage()` from Strapi `about-page`

Purpose:

- Brand story and founder story page
- Mostly CMS-driven content mixed with local assets and animation logic

### In-House Planner Page

File:

- [frontend/src/pages/InHousePlannerPage.jsx](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/pages/InHousePlannerPage.jsx)

Reads:

- `useInHousePlannerPage()` from Strapi `inhouse-planner-page`

Writes:

- `usePlannerLead()` -> Express `POST /planner-leads` -> Strapi `planner-leads`

Purpose:

- Planner service landing page
- Planner inquiry form

### Blog Listing Page

File:

- [frontend/src/pages/BlogPage.jsx](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/pages/BlogPage.jsx)

Reads:

- `useBlogCategories()` from Strapi `blogs`
- `useBlogs({ limit: 50 })` from Strapi `blogs`

Purpose:

- Blog index
- Category filtering
- Links to blog detail page

### Single Blog Page

File:

- [frontend/src/pages/SingleBlogPage.jsx](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/pages/SingleBlogPage.jsx)

Reads:

- `useBlogs({ limit: 1, slug })` for the current post
- `useBlogs({ limit: 50 })` for related posts

Current behavior:

- Renders Strapi `content`, `author`, `post_published_at`, `title`, `excerpt`, `category`, and `cover_image`
- Loads the current blog post by URL `slug`
- Uses a loading state on hard refresh before redirecting back to `/blogs`
- Still keeps local fallback content/images only when Strapi is unavailable or CMS data is missing

### How It Work Page

File:

- [frontend/src/pages/HowItWorkPage.jsx](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/pages/HowItWorkPage.jsx)

Current state:

- Static content in current code
- Not reading the Strapi `how-it-works` single/content type even though it exists in Strapi

### Consultation Page

File:

- [frontend/src/pages/BookConsultation.jsx](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/pages/BookConsultation.jsx)

Writes:

- `useConsultation()` -> Express `POST /consultations` -> Strapi `planner-leads`

Purpose:

- Lead capture for consultation bookings

### Auth Pages

Files:

- [frontend/src/pages/LoginPage.jsx](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/pages/LoginPage.jsx)
- [frontend/src/pages/SignUpPage.jsx](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/pages/SignUpPage.jsx)
- [frontend/src/pages/ForgotPasswordPage.jsx](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/pages/ForgotPasswordPage.jsx)
- [frontend/src/pages/NewPasswordPage.jsx](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/pages/NewPasswordPage.jsx)
- [frontend/src/pages/ResetPasswordPage.jsx](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/pages/ResetPasswordPage.jsx)
- [frontend/src/pages/AuthCallbackPage.jsx](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/pages/AuthCallbackPage.jsx)

Use:

- Express `/auth/register`
- Express `/auth/login`
- Express `/auth/forgot-password`
- Express `/auth/reset-password`
- Express `/auth/google/session`

Purpose:

- Local login/signup UI
- Google OAuth callback handling
- JWT storage in localStorage
- Refresh token is stored as HttpOnly cookie by backend

## 7. Full Frontend Navigation Flow

### Main User Entry Flows

#### Flow A: Marketing to Event Selection

1. User lands on `/`
2. User chooses event-related CTA
3. User enters `/event-flow/category`
4. User selects category
5. User moves to `/event-flow/event?category=<slug>`
6. User selects event subtype
7. User moves to `/event-flow/service?...`
8. User selects service
9. User is routed into theme/level/package branch

#### Flow B: Marketing to Blogs

1. `/`
2. `/blogs`
3. `/blogs/:slug`

#### Flow C: Marketing to Consultation

1. `/`
2. `/book-consultation`
3. Submit form
4. `/consultation-confirmation`

#### Flow D: Marketing to Planner Lead

1. `/`
2. `/in-house-planner`
3. Submit form
4. Backend stores planner lead

#### Flow E: Auth

1. `/signup` or `/login`
2. Email/password or Google connect
3. If Google, Strapi redirects to `/auth/callback`
4. Callback exchanges token using Express
5. JWT stored in localStorage
6. User redirected to `/`

## 8. Event Flow Documentation

Event flow pages:

- [frontend/src/pages/CategoryPage.jsx](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/pages/CategoryPage.jsx)
- [frontend/src/pages/EventPage.jsx](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/pages/EventPage.jsx)
- [frontend/src/pages/ServicePage.jsx](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/pages/ServicePage.jsx)
- [frontend/src/pages/DecorThemePage.jsx](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/pages/DecorThemePage.jsx)
- [frontend/src/pages/CateringLevelsPage.jsx](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/pages/CateringLevelsPage.jsx)
- [frontend/src/pages/BartendingLevelsPage.jsx](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/pages/BartendingLevelsPage.jsx)
- [frontend/src/pages/DecorLevelsPage.jsx](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/pages/DecorLevelsPage.jsx)

### Step 1: Category

Page:

- `CategoryPage`

Data:

- `useEventCategoryOptions()`
- Reads top-level `events` where `parent_event` is null

Navigation:

- Each card links to `/event-flow/event?category=<categorySlug>`

### Step 2: Event

Page:

- `EventPage`

Data:

- `useEventCategoryOptions()`
- `useEventsByCategory(categorySlug)`

Dependency:

- Requires `category` query param

Navigation:

- Each card links to `/event-flow/service?category=<categorySlug>&event=<eventSlug>&eventId=<numericId>`

### Step 3: Service

Page:

- `ServicePage`

Data:

- `useServiceOptions()`

Dependencies:

- Requires `category`
- Requires `event`
- Optionally passes `eventId`

Service routing rules:

- `decor` -> `/event-flow/decor-theme`
- `rental-furniture` -> `/packages/rental-furniture`
- `catering` -> `/event-flow/catering-levels`
- `bartending` or `bar-tending` -> `/event-flow/bartending-levels`
- `sheesha` -> `/packages/sheesha`
- fallback -> `/package-listing`

### Decor Branch

#### Step 4: Theme

Page:

- `DecorThemePage`

Data:

- `useDecorThemeOptions(serviceId)`

Dependencies:

- Needs `category`
- Needs `event`
- Uses `serviceId` to resolve wizard steps from Strapi service category

Navigation:

- Theme select -> `/packages/decor-levels?...&theme=<themeSlug>`
- Skip button -> `/packages/decor-levels?...` without theme

#### Step 5: Decor Package Levels

Page:

- `DecorLevelsPage`

Data:

- `usePackages()`
- `PackageResultsHero` also reads category/event/theme/level labels

Current behavior:

- Filters packages by selected `category`, `event`, `eventId`, `serviceId`, and `theme`
- Uses Strapi `budget-level` options to build the level sections
- Splits the filtered package set into per-level groups before rendering each level row
- Passes the chosen level into the final decor packages route through the "View all" links

#### Step 6: Final Decor Packages

Page:

- `DecorPackagesPage`

Component:

- `ServicePackagesPageContent`

Data:

- `usePackages()`

Current behavior:

- Shows the final package listing UI after filtering by event-flow query params
- Enforces route/service-specific filtering through the shared package listing component

### Catering Branch

#### Step 4: Budget Level

Page:

- `CateringLevelsPage`

Data:

- `useBudgetLevelOptions(serviceId)`

Dependencies:

- `category`
- `event`
- `service`
- `serviceId`

Navigation:

- `/packages/catering?...&level=<levelSlug>`

### Bartending Branch

#### Step 4: Budget Level

Page:

- `BartendingLevelsPage`

Data:

- `useBudgetLevelOptions(serviceId)`

Navigation:

- `/packages/bartending?...&level=<levelSlug>`

### Direct Package Branches

These skip extra wizard steps:

- Rental furniture -> `/packages/rental-furniture`
- Sheesha -> `/packages/sheesha`

## 9. Event Flow Dependencies

The event flow depends heavily on query params.

Main params passed between pages:

- `category`
- `event`
- `eventId`
- `service`
- `serviceId`
- `theme`
- `level`

### Why `serviceId` Matters

`serviceId` is the key input for:

- `usePackageWizardSteps(serviceCategoryId)`
- `useDecorThemeOptions(serviceCategoryId)`
- `useBudgetLevelOptions(serviceCategoryId)`

This means later steps are controlled by the selected Strapi service category and its `wizard_steps` JSON.

### Current Event Flow Logic Source

Core logic:

- [frontend/src/hooks/useEventTypes.js](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/hooks/useEventTypes.js)

This hook layer:

- fetches event categories
- fetches child events
- fetches services
- fetches service category wizard steps
- resolves step source options from `themes` and `budget-levels`

## 10. Event Package Flow Map

This section explains the end-to-end event/package flow from event selection up to ordering.

Important reality:

- The frontend currently implements the event selection and package listing flow.
- A package detail page, cart page, checkout page, and order page are not yet wired in the visible frontend routes.
- The backend already has cart, booking, and payment APIs, so the order flow is partially backend-ready but not fully connected in the frontend UI.

### Current Frontend Event to Package Flow

```text
Landing Page
  -> Event Flow Category Page
  -> Event Flow Event Page
  -> Event Flow Service Page
     -> Decor branch
        -> Decor Theme Page
        -> Decor Levels Page
        -> Decor Packages Page
     -> Catering branch
        -> Catering Levels Page
        -> Catering Packages Page
     -> Bartending branch
        -> Bartending Levels Page
        -> Bartending Packages Page
     -> Rental Furniture branch
        -> Rental Furniture Packages Page
     -> Sheesha branch
        -> Sheesha Packages Page
```

### Branch-by-Branch Flow

#### Common Start

1. User opens `/event-flow/category`
2. User chooses a top-level event category
3. App goes to `/event-flow/event?category=<categorySlug>`
4. User chooses an event subtype
5. App goes to `/event-flow/service?category=<categorySlug>&event=<eventSlug>&eventId=<eventId>`
6. User chooses a service

At this point the next step depends on the selected service.

#### Decor Flow

1. `/event-flow/service?...&service=decor&serviceId=<serviceId>`
2. User is sent to `/event-flow/decor-theme?...`
3. User selects a theme
4. App goes to `/packages/decor-levels?...&theme=<themeSlug>`
5. User sees decor package levels grouped by Strapi budget level
6. User clicks `View all` for a chosen level
7. App goes to `/packages/decor?...&level=<levelSlug>`
8. User sees the final filtered decor package listing

#### Catering Flow

1. `/event-flow/service?...&service=catering&serviceId=<serviceId>`
2. User is sent to `/event-flow/catering-levels?...`
3. User selects a catering budget level
4. App goes to `/packages/catering?...&level=<levelSlug>`
5. User sees the final filtered catering package listing

#### Bartending Flow

1. `/event-flow/service?...&service=bartending&serviceId=<serviceId>`
2. User is sent to `/event-flow/bartending-levels?...`
3. User selects a bartending budget level
4. App goes to `/packages/bartending?...&level=<levelSlug>`
5. User sees the final filtered bartending package listing

#### Rental Furniture Flow

1. `/event-flow/service?...&service=rental-furniture&serviceId=<serviceId>`
2. User is sent directly to `/packages/rental-furniture?...`
3. User sees the final filtered rental furniture package listing

#### Sheesha Flow

1. `/event-flow/service?...&service=sheesha&serviceId=<serviceId>`
2. User is sent directly to `/packages/sheesha?...`
3. User sees the final filtered sheesha package listing

### Query Param Flow Between Pages

The event package flow is driven by query params carried from one page to the next.

Main params:

- `category`
- `event`
- `eventId`
- `service`
- `serviceId`
- `theme`
- `level`

How they are used:

- `category` identifies the selected top-level event category
- `event` identifies the selected event subtype
- `eventId` keeps the numeric event record when needed later
- `service` identifies the chosen service branch
- `serviceId` drives service-specific wizard steps from Strapi
- `theme` applies to decor only
- `level` applies to decor, catering, and bartending package filtering

### Current End of Frontend Flow

Right now, the user journey ends at the package listing pages:

- `/packages/decor`
- `/packages/catering`
- `/packages/bartending`
- `/packages/rental-furniture`
- `/packages/sheesha`

What exists today:

- Package list cards
- Filtered package results
- Package images, title, price, description, and tags

What does not exist yet in the visible frontend:

- Package detail page route
- Save package flow
- Add to cart button in package cards
- Cart page
- Checkout page
- Order confirmation page
- Dashboard booking resume flow

### Backend-Supported Future Order Flow

The backend already supports the next stages even though the frontend screens are not yet built.

Intended order flow based on backend APIs:

```text
Package Listing
  -> Package Detail Page (not built in current frontend)
  -> Add to Cart (backend API exists)
  -> Cart Page (not built in current frontend)
  -> Update Event Details / Guest Count / City
  -> Apply Coupon
  -> Proceed to Checkout
  -> Create Booking
  -> Create Razorpay Order
  -> Verify Payment
  -> Booking / Order Confirmation
  -> Dashboard Booking View
```

### Backend APIs That Support the Order Flow

Cart stage:

- `GET /cart`
- `PATCH /cart`
- `POST /cart/items`
- `PUT /cart/items/:itemId`
- `DELETE /cart/items/:itemId`
- `POST /cart/coupon`
- `DELETE /cart/coupon`

Booking stage:

- `POST /bookings`
- `GET /bookings`
- `GET /bookings/:id`

Payment stage:

- `POST /payments/create-order`
- `POST /payments/verify`
- `POST /payments/webhook`

### Exact Current Status

- Event selection flow: implemented
- Service branching flow: implemented
- Theme/budget selection flow: implemented
- Package listing flow: implemented
- Package filtering by event-flow answers: implemented in frontend
- Package detail page: not implemented in visible frontend
- Cart UI: not implemented in visible frontend
- Checkout UI: not implemented in visible frontend
- Order confirmation UI: not implemented in visible frontend

## 11. Package Listing System

Primary files:

- [frontend/src/hooks/usePackages.js](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/hooks/usePackages.js)
- [frontend/src/components/package-listing/ServicePackagesPageContent.jsx](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/components/package-listing/ServicePackagesPageContent.jsx)
- [frontend/src/components/package-listing/PackageResultsHero.jsx](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/components/package-listing/PackageResultsHero.jsx)
- [frontend/src/lib/packageFilters.js](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/lib/packageFilters.js)

Current package data fetch:

- `GET /api/packages` from Strapi with populated relations and media

Mapped frontend package fields:

- `id`
- `documentId`
- `title`
- `category`
- `description`
- `price`
- `base_price`
- `tags`
- `event_slugs`
- `event_ids`
- `category_slugs`
- `category_ids`
- `service_slugs`
- `service_ids`
- `theme_slugs`
- `level_slug`
- `level_id`
- `images`

Current filtering behavior:

- Shared listing pages now filter packages before sort/pagination using:
  - `category`
  - `event`
  - `eventId`
  - `service`
  - `serviceId`
  - `theme`
  - `level`
- `DecorLevelsPage` additionally groups the already-filtered package set into Strapi budget-level sections
- `PackageResultsHero` still displays the selected chips from query params, but now those chips match the actual filtered result set

## 12. Strapi Content Types Used by Frontend

### `event`

Schema:

- [strapi/src/api/event/content-types/event/schema.json](/c:/Users/PRENEEL/Desktop/Elewen/strapi/src/api/event/content-types/event/schema.json)

Used for:

- top-level event categories
- child event options
- featured event cards

Important fields:

- `name`
- `slug`
- `description`
- `tagline`
- `icon`
- `is_active`
- `is_featured`
- `parent_event`

### `service-category`

Schema:

- [strapi/src/api/service-category/content-types/service-category/schema.json](/c:/Users/PRENEEL/Desktop/Elewen/strapi/src/api/service-category/content-types/service-category/schema.json)

Used for:

- service cards
- service options
- wizard step definition source

Important fields:

- `name`
- `slug`
- `description`
- `icon`
- `is_active`
- `is_featured`
- `wizard_steps`
- `parent_category`

### `package`

Schema:

- [strapi/src/api/package/content-types/package/schema.json](/c:/Users/PRENEEL/Desktop/Elewen/strapi/src/api/package/content-types/package/schema.json)

Used for:

- package listings
- package relationships to event/service/theme/budget level

Important fields:

- `title`
- `slug`
- `description`
- `base_price`
- `images`
- `budget_level`
- `service_categories`
- `events`
- `themes`
- `pricing_rules`
- `elements`
- `addons`

### `theme`

Schema:

- [strapi/src/api/theme/content-types/theme/schema.json](/c:/Users/PRENEEL/Desktop/Elewen/strapi/src/api/theme/content-types/theme/schema.json)

Used for:

- decor theme selection

### `budget-level`

Schema:

- [strapi/src/api/budget-level/content-types/budget-level/schema.json](/c:/Users/PRENEEL/Desktop/Elewen/strapi/src/api/budget-level/content-types/budget-level/schema.json)

Used for:

- catering/bartending level selection

### `blog`

Schema:

- [strapi/src/api/blog/content-types/blog/schema.json](/c:/Users/PRENEEL/Desktop/Elewen/strapi/src/api/blog/content-types/blog/schema.json)

Used for:

- blog list
- single blog detail lookup by slug
- blog content body
- author
- published date
- slug
- excerpt
- cover image
- category

### `testimonial`

Schema:

- [strapi/src/api/testimonial/content-types/testimonial/schema.json](/c:/Users/PRENEEL/Desktop/Elewen/strapi/src/api/testimonial/content-types/testimonial/schema.json)

Used for:

- featured testimonials on landing page

### `landing-page`, `about-page`, `inhouse-planner-page`, `global-setting`

Read through:

- [frontend/src/hooks/useCmsPages.js](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/hooks/useCmsPages.js)

## 13. Strapi Content Types Present but Not Used by Frontend Read Logic

These exist in Strapi but are not currently wired in the visible frontend pages:

- `how-it-works`
- `consultation-page`
- `footer-content`
- `navigation-menu`
- `faq-item`
- `policy`
- `global-ctas`
- `saved-package`
- `vendor-portfolio`
- `vendor-document`
- `vendor-service`
- `booking-review`
- `booking-confirmation-messaging`
- `cart-messaging`
- `checkout-messaging`
- `coupon-messaging`
- `advance-payment-explanation`
- `remaining-balance-explanation`
- `planner-portfolio-item`
- `address`
- `service`

## 14. Express API Documentation

Main server:

- [api/src/server.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/server.js)

Registered route groups:

- `/auth`
- `/vendor`
- `/planner-leads`
- `/consultations`
- `/cart`
- `/bookings`
- `/sample-taste`
- `/payments`
- `/vendor-assignments`
- `/messages`
- `/support`
- `/packages`
- `/notifications`

## 15. Express Auth System

Routes:

- [api/src/routes/auth.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/routes/auth.js)

Controller:

- [api/src/controllers/auth.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/controllers/auth.js)

How it works:

- Registration uses Strapi auth/local/register
- Extra fields like `first_name`, `last_name`, `phone` are added via admin API after registration
- Customer profile is created in Strapi `customer-profiles`
- Login proxies to Strapi local auth
- Refresh token is generated by Express and stored in Prisma `user_sessions`
- Refresh cookie is HttpOnly and scoped to `/auth`
- JWT verification is done locally using `STRAPI_JWT_SECRET`
- Google login completes via Strapi connect flow and is finalized by Express `/auth/google/session`

Related files:

- [api/src/lib/strapi.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/lib/strapi.js)
- [api/src/middleware/auth.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/middleware/auth.js)

## 16. Lead Submission APIs

### Consultation API

Route:

- [api/src/routes/consultation.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/routes/consultation.js)

Controller:

- [api/src/controllers/consultation.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/controllers/consultation.js)

Behavior:

- Validates required fields
- Converts guest count range string to integer lower bound if needed
- Creates Strapi `planner-lead` with `lead_type = consultation`

### Planner Lead API

Route:

- [api/src/routes/plannerLead.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/routes/plannerLead.js)

Controller:

- [api/src/controllers/plannerLead.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/controllers/plannerLead.js)

Behavior:

- Validates required fields
- Converts guest count range to integer
- Creates Strapi `planner-lead` with `lead_type = planner`

Strapi schema:

- [strapi/src/api/planner-lead/content-types/planner-lead/schema.json](/c:/Users/PRENEEL/Desktop/Elewen/strapi/src/api/planner-lead/content-types/planner-lead/schema.json)

## 17. Cart API

Routes:

- [api/src/routes/cart.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/routes/cart.js)

Controller:

- [api/src/controllers/cart.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/controllers/cart.js)

Features implemented:

- get current user cart
- create cart automatically if missing
- add cart item from Strapi package
- update item quantity
- remove item
- update event date/city/guest count
- apply coupon
- remove coupon
- recalculate subtotal, discount, and total

Storage:

- Prisma `Cart`
- Prisma `CartItem`
- Strapi coupons read for discount validation

Current frontend usage:

- Not wired to visible frontend screens yet

## 18. Booking API

Routes:

- [api/src/routes/booking.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/routes/booking.js)

Controller:

- [api/src/controllers/booking.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/controllers/booking.js)

Features implemented:

- create booking from cart
- list bookings
- get booking details
- state machine status updates
- cancellation request
- booking timeline entries
- customer notes
- file attachments by URL

Important booking logic:

- booking is created from current cart
- cart must have items, `eventDate`, and `guestCount`
- booking totals use Strapi `global-setting.advance_payment_percentage`
- coupon is revalidated before booking creation
- coupon usage is stored in Prisma
- cart is cleared after booking creation
- in-app/email notifications are triggered after important actions

Current frontend usage:

- Not wired to current visible frontend screens

## 19. Payment API

Routes:

- [api/src/routes/payment.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/routes/payment.js)

Controller:

- [api/src/controllers/payment.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/controllers/payment.js)

Features implemented:

- create Razorpay order
- verify Razorpay signature
- handle payment webhook
- list booking payments
- admin payment listing
- refund requests
- refund approve/reject
- vendor payout creation and settlement

How payment flow works:

1. Client calls `/payments/create-order`
2. Backend creates Razorpay order and local pending payment record
3. Client opens Razorpay checkout
4. After payment success client calls `/payments/verify`
5. Backend verifies signature, marks payment success
6. Advance payment can auto-confirm booking
7. Webhook also syncs success/failure/refund states as backup

Current frontend usage:

- Not yet connected from current frontend screens

## 20. Messaging API

Routes:

- [api/src/routes/messaging.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/routes/messaging.js)

Controller:

- [api/src/controllers/messaging.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/controllers/messaging.js)

Features implemented:

- get or create thread per booking
- fetch thread messages
- send message
- mark read
- unread count

Storage:

- Prisma `MessageThread`
- Prisma `Message`
- Prisma `MessageReadStatus`
- Prisma `MessageAttachment`

Current frontend usage:

- Not yet connected from current frontend screens

## 21. Support API

Routes:

- [api/src/routes/support.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/routes/support.js)

Controller:

- [api/src/controllers/support.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/controllers/support.js)

Features implemented:

- create support ticket
- list tickets
- get ticket detail
- add replies/internal notes
- update ticket status and priority

Current frontend usage:

- Not yet connected from current frontend screens

## 22. Notifications API

Routes:

- [api/src/routes/notification.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/routes/notification.js)

Controller:

- [api/src/controllers/notification.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/controllers/notification.js)

Features implemented:

- list user notifications
- unread count
- mark one as read
- mark all as read

Notification creation helper:

- [api/src/lib/notify.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/lib/notify.js)

Email helper:

- [api/src/lib/email.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/lib/email.js)

Current frontend usage:

- Not yet connected from current frontend screens

## 23. Packages Helper API

Routes:

- [api/src/routes/package.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/routes/package.js)

Controller:

- [api/src/controllers/package.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/controllers/package.js)

Features implemented:

- `GET /packages/wizard-steps/:serviceCategoryId`
- `POST /packages/wizard-filter`
- `POST /packages/calculate-price`

Purpose:

- expose wizard-step metadata
- filter packages by wizard answers
- calculate adjusted pricing using pricing rules

Current frontend usage:

- Current visible frontend uses direct Strapi reads instead of these Express package helper endpoints

## 24. Vendor APIs

### Vendor Registration

Route:

- [api/src/routes/vendor.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/routes/vendor.js)

Controller:

- [api/src/controllers/vendor.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/controllers/vendor.js)

Behavior:

- validates vendor registration fields
- writes pending vendor record into Strapi `vendors`

### Vendor Assignment and Bank Info

Route:

- [api/src/routes/vendorAssignment.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/routes/vendorAssignment.js)

Controller:

- [api/src/controllers/vendorAssignment.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/controllers/vendorAssignment.js)

Features:

- create assignment
- list assignments
- update assignment status
- delete assignment
- get vendor bank info
- upsert vendor bank info

Current frontend usage:

- Not yet wired in current frontend

## 25. Sample Taste API

Route:

- [api/src/routes/sampleTaste.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/routes/sampleTaste.js)

Controller:

- [api/src/controllers/sampleTaste.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/controllers/sampleTaste.js)

Features:

- create sample taste booking
- list sample tastes
- get single sample taste
- update status
- record user decision and vendor feedback

Current frontend usage:

- Not yet wired in current frontend

## 26. Prisma Models Summary

Key Prisma domains in [api/prisma/schema.prisma](/c:/Users/PRENEEL/Desktop/Elewen/api/prisma/schema.prisma):

- Auth/session
  `UserSession`, `OAuthAccount`
- Cart
  `Cart`, `CartItem`
- Booking
  `Booking`, `BookingItem`, `BookingStatusLog`, `BookingTimeline`, `BookingNote`, `Cancellation`, `BookingFile`
- Sample taste
  `SampleTasteBooking`, `SampleTasteVendor`
- Payments
  `Payment`, `PaymentTransaction`, `Refund`, `PaymentLog`
- Vendor operations
  `VendorAssignment`, `VendorPayout`, `VendorBankInfo`
- Coupon tracking
  `CouponUsage`
- Messaging
  `MessageThread`, `Message`, `MessageReadStatus`, `MessageAttachment`
- Support
  `SupportTicket`, `SupportMessage`
- Notifications/alerts
  `Notification`, `Alert`
- Finance snapshots
  `FinanceSnapshot`

## 27. Current Implementation Gaps

These are important current realities from the code:

- `HowItWorkPage` is static even though Strapi contains a `how-it-works` API.
- Blog pages still keep local fallback content and fallback images for offline/fallback mode and for missing CMS fields.
- Package filtering is now implemented in the frontend listing flow, but it still depends on Strapi package relations being populated correctly for category, event, service, theme, and budget level.
- Several backend features are implemented but not used by the visible frontend:
  cart, bookings, payments, messages, support, notifications, vendor features, sample taste.
- Some frontend links point to routes not currently defined in `App.jsx`, such as:
  `/services`, `/faqs`, `/contact`, `/account`
- Some backend comments describe admin-only behavior, but strict role checks are still limited in code.

## 28. Key Files Reference

Frontend core:

- [frontend/src/App.jsx](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/App.jsx)
- [frontend/src/main.jsx](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/main.jsx)
- [frontend/src/lib/strapi.js](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/lib/strapi.js)
- [frontend/src/lib/api.js](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/lib/api.js)

Frontend data hooks:

- [frontend/src/hooks/useCmsPages.js](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/hooks/useCmsPages.js)
- [frontend/src/hooks/useEventTypes.js](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/hooks/useEventTypes.js)
- [frontend/src/hooks/usePackages.js](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/hooks/usePackages.js)
- [frontend/src/hooks/useBlogs.js](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/hooks/useBlogs.js)
- [frontend/src/hooks/useTestimonials.js](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/hooks/useTestimonials.js)

Backend core:

- [api/src/server.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/server.js)
- [api/prisma/schema.prisma](/c:/Users/PRENEEL/Desktop/Elewen/api/prisma/schema.prisma)
- [api/src/lib/strapi.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/lib/strapi.js)
- [api/src/middleware/auth.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/middleware/auth.js)

Strapi schemas:

- [strapi/src/api/event/content-types/event/schema.json](/c:/Users/PRENEEL/Desktop/Elewen/strapi/src/api/event/content-types/event/schema.json)
- [strapi/src/api/service-category/content-types/service-category/schema.json](/c:/Users/PRENEEL/Desktop/Elewen/strapi/src/api/service-category/content-types/service-category/schema.json)
- [strapi/src/api/package/content-types/package/schema.json](/c:/Users/PRENEEL/Desktop/Elewen/strapi/src/api/package/content-types/package/schema.json)
- [strapi/src/api/blog/content-types/blog/schema.json](/c:/Users/PRENEEL/Desktop/Elewen/strapi/src/api/blog/content-types/blog/schema.json)
- [strapi/src/api/testimonial/content-types/testimonial/schema.json](/c:/Users/PRENEEL/Desktop/Elewen/strapi/src/api/testimonial/content-types/testimonial/schema.json)
- [strapi/src/api/planner-lead/content-types/planner-lead/schema.json](/c:/Users/PRENEEL/Desktop/Elewen/strapi/src/api/planner-lead/content-types/planner-lead/schema.json)
- [strapi/src/api/customer-profile/content-types/customer-profile/schema.json](/c:/Users/PRENEEL/Desktop/Elewen/strapi/src/api/customer-profile/content-types/customer-profile/schema.json)
- [strapi/src/api/global-setting/content-types/global-setting/schema.json](/c:/Users/PRENEEL/Desktop/Elewen/strapi/src/api/global-setting/content-types/global-setting/schema.json)
