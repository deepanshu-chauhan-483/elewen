# Customer Dashboard API Audit

Date: 2026-05-04

This document maps the customer dashboard IA and userflow to:

- required dynamic data
- existing backend APIs in the custom Express + Prisma service
- existing Strapi content types already available
- missing APIs or backend work still needed

## Dashboard Summary

The backend already has most transactional entities needed for the customer dashboard:

- bookings
- booking timeline
- booking notes
- payments
- refunds
- sample taste bookings
- messages
- support tickets
- notifications
- saved packages
- customer profile

The biggest missing pieces are:

- dashboard-specific summary/aggregator APIs
- enriched booking and sample-taste responses with Strapi content joined in
- rebook / convert-to-booking actions
- completion of payment order creation logic
- stricter ownership and role checks in some endpoints

## Existing Data Sources

### Custom backend data in Prisma

Source: [api/prisma/schema.prisma](/c:/Users/PRENEEL/Desktop/Elewen/api/prisma/schema.prisma:211)

- `Booking`
- `BookingItem`
- `BookingStatusLog`
- `BookingTimeline`
- `BookingNote`
- `Cancellation`
- `BookingFile`
- `SampleTasteBooking`
- `SampleTasteVendor`
- `Payment`
- `Refund`
- `MessageThread`
- `Message`
- `SupportTicket`
- `SupportMessage`
- `Notification`
- `VendorAssignment`

### Strapi CMS / structured content

- Customer profile: [strapi/src/api/customer-profile/content-types/customer-profile/schema.json](/c:/Users/PRENEEL/Desktop/Elewen/strapi/src/api/customer-profile/content-types/customer-profile/schema.json:14)
- Global setting: [strapi/src/api/global-setting/content-types/global-setting/schema.json](/c:/Users/PRENEEL/Desktop/Elewen/strapi/src/api/global-setting/content-types/global-setting/schema.json:17)
- Saved package: [strapi/src/api/saved-package/content-types/saved-package/schema.json](/c:/Users/PRENEEL/Desktop/Elewen/strapi/src/api/saved-package/content-types/saved-package/schema.json:17)
- Package: [strapi/src/api/package/content-types/package/schema.json](/c:/Users/PRENEEL/Desktop/Elewen/strapi/src/api/package/content-types/package/schema.json:14)
- Event: [strapi/src/api/event/content-types/event/schema.json](/c:/Users/PRENEEL/Desktop/Elewen/strapi/src/api/event/content-types/event/schema.json:14)
- Address: [strapi/src/api/address/content-types/address/schema.json](/c:/Users/PRENEEL/Desktop/Elewen/strapi/src/api/address/content-types/address/schema.json:14)
- Vendor: [strapi/src/api/vendor/content-types/vendor/schema.json](/c:/Users/PRENEEL/Desktop/Elewen/strapi/src/api/vendor/content-types/vendor/schema.json:14)

## Section-by-Section Dashboard Mapping

### 1. Active Bookings

IA needs:

- booking cards
- event name
- delivery / event date
- status
- amount due
- CTA: view details

Dynamic fields needed:

- booking id
- package id and package title
- event id and event name
- event date
- booking status
- total price
- advance amount
- remaining amount
- expiry date if relevant
- last status update
- location summary
- preview image if shown in UI

Current backend support:

- `GET /bookings`
- `GET /bookings/:id`

Route references:

- [api/src/routes/booking.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/routes/booking.js:60)
- [api/src/controllers/booking.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/controllers/booking.js:221)

What already works:

- booking rows are returned from Prisma
- status is available
- monetary fields are available
- items are available

What is missing:

- package title/image enrichment from Strapi package
- event name enrichment from Strapi event
- address enrichment from Strapi address
- active vs previous filtering support at API level
- dashboard summary counts

Recommended API improvements:

- `GET /dashboard/customer/summary`
- `GET /bookings?type=active`
- enrich `GET /bookings` response with package/event/address preview fields

Backend source of truth:

- Prisma: `Booking`
- Strapi: `package`, `event`, `address`

Status:

- partially ready

### 2. Sample Taste Booking

IA needs:

- list/table of sample taste bookings
- package name
- vendors selected
- delivery date
- status
- expiry countdown
- compare vendors
- give feedback
- proceed with full booking
- try different vendor
- save package for later
- cancel package

Dynamic fields needed:

- sample booking id
- related package info
- guest count
- booking date
- delivery date
- status
- decision
- expiry date
- vendor comparison data
- vendor rating / feedback state

Current backend support:

- `GET /sample-taste`
- `GET /sample-taste/:id`
- `PATCH /sample-taste/:id/status`
- `POST /sample-taste/:id/decision`

Route references:

- [api/src/routes/sampleTaste.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/routes/sampleTaste.js:64)
- [api/src/controllers/sampleTaste.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/controllers/sampleTaste.js:46)

What already works:

- sample list and detail exist
- vendor rows are stored
- decision submission exists

What is missing:

- package title/image enrichment
- vendor profile enrichment from Strapi vendor
- clear “compare vendors” response shape
- action endpoint to convert sample taste to booking
- action endpoint to retry / request another vendor

Recommended API improvements:

- enrich `GET /sample-taste`
- enrich `GET /sample-taste/:id`
- `POST /sample-taste/:id/convert-to-booking`
- `POST /sample-taste/:id/request-different-vendor`

Backend source of truth:

- Prisma: `SampleTasteBooking`, `SampleTasteVendor`
- Strapi: `package`, `vendor`

Status:

- partially ready

### 3. Booking Timeline & Status

IA needs:

- timeline steps
- current stage
- completed/pending states

Dynamic fields needed:

- timeline entry title
- description
- timeline date
- step status
- booking current status

Current backend support:

- `GET /bookings/:id/timeline`
- `GET /bookings/:id`

Route references:

- [api/src/routes/booking.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/routes/booking.js:176)
- [api/src/controllers/booking.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/controllers/booking.js:427)

What already works:

- timeline table exists
- booking status exists

What is missing:

- nothing major for read-only customer display
- possible need for normalized frontend-friendly step labels

Recommended API improvements:

- optionally include computed `currentStep` and `stepOrder` in booking detail response

Backend source of truth:

- Prisma: `BookingTimeline`, `BookingStatusLog`, `Booking`

Status:

- ready for basic UI

### 4. Booking Details

IA needs:

- selected package
- chosen elements
- event date
- event location
- price breakdown
- total
- advance paid
- remaining balance
- message admin CTA
- cancel booking CTA

Dynamic fields needed:

- booking core fields
- booking items
- package title
- package pricing summary
- event name
- address details
- payment history
- vendor assignment summary
- cancellation state

Current backend support:

- `GET /bookings/:id`
- `GET /payments?bookingId=...`
- `POST /bookings/:id/cancel`

Route references:

- [api/src/routes/booking.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/routes/booking.js:81)
- [api/src/controllers/booking.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/controllers/booking.js:241)
- [api/src/routes/payment.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/routes/payment.js:177)
- [api/src/controllers/payment.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/controllers/payment.js:375)

What already works:

- booking detail returns items, timeline, vendor assignments, payments
- cancel action exists

What is missing:

- package/event/address/vendor enrichment from Strapi
- cleaner price-breakdown shape for frontend
- payment CTA readiness depends on incomplete `createOrder`

Recommended API improvements:

- enrich `GET /bookings/:id`
- optionally add `GET /bookings/:id/summary`

Backend source of truth:

- Prisma: `Booking`, `BookingItem`, `Payment`, `VendorAssignment`, `Cancellation`
- Strapi: `package`, `event`, `address`, `vendor`

Status:

- partially ready

### 5. Messages & Updates

IA needs:

- booking-specific message threads
- status updates
- admin clarification notes
- read-only behavior for previous bookings if desired

Dynamic fields needed:

- thread id
- booking id
- messages
- message type
- attachments
- read status
- unread count

Current backend support:

- `POST /messages/threads`
- `GET /messages/threads/:bookingId`
- `POST /messages`
- `PATCH /messages/:id/read`
- `GET /messages/unread-count`

Route references:

- [api/src/routes/messaging.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/routes/messaging.js:34)
- [api/src/controllers/messaging.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/controllers/messaging.js:5)

What already works:

- thread creation and fetch exist
- send message exists
- unread count exists

What is missing:

- stronger ownership / role enforcement
- optional thread list endpoint if dashboard wants all threads without booking drill-in
- system/admin update shaping if those should display separately from chat

Important backend concern:

- ownership check is intentionally loose in current code
- see [api/src/controllers/messaging.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/controllers/messaging.js:17)

Recommended API improvements:

- tighten access control
- optionally add `GET /messages/threads`

Backend source of truth:

- Prisma: `MessageThread`, `Message`, `MessageReadStatus`, `MessageAttachment`

Status:

- functionally present, security hardening needed

### 6. Previous Bookings

IA needs:

- collapsed list
- date
- status
- amount paid
- final payment summary
- rebook CTA

Dynamic fields needed:

- booking id
- past event date
- final status
- paid amounts
- package/event summary

Current backend support:

- `GET /bookings`
- `GET /payments?bookingId=...`

What already works:

- backend can return the raw data needed

What is missing:

- API-level previous booking filter
- computed amount paid summary
- rebook endpoint

Recommended API improvements:

- `GET /bookings?type=previous`
- `POST /bookings/:id/rebook`

Backend source of truth:

- Prisma: `Booking`, `Payment`
- Strapi: `package`, `event`

Status:

- partially ready

### 7. Saved Packages

IA needs:

- saved package cards
- status: not booked yet
- resume booking
- remove package

Dynamic fields needed:

- saved record id
- package id
- package title
- package slug
- package price
- package image
- custom config if any

Current backend support:

- `GET /wishlist`
- `POST /wishlist`
- `DELETE /wishlist/:packageId`

Route references:

- [api/src/routes/wishlist.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/routes/wishlist.js:13)
- [api/src/controllers/wishlist.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/controllers/wishlist.js:36)

What already works:

- saved package records are managed through backend + Strapi
- package ids and titles are returned

What is missing:

- richer package card payload
- resume-booking deep-link strategy

Recommended API improvements:

- enrich `GET /wishlist` with image, slug, price, service tags

Backend source of truth:

- Strapi: `saved-package`, `package`

Status:

- ready for simple list, enrichment recommended

### 8. Support & Help

IA needs:

- help message
- contact options
- call
- WhatsApp
- email
- ticket creation / updates

Dynamic fields needed:

- support email
- WhatsApp number
- availability text
- response expectation text
- support ticket list
- ticket details

Current backend support:

- `POST /support`
- `GET /support`
- `GET /support/:id`
- `POST /support/:id/messages`

Current Strapi support:

- `global-setting` has:
  - `support_email`
  - `support_availability_text`
  - `whatsapp_number`
  - `response_expectation_text`

References:

- [api/src/routes/support.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/routes/support.js:91)
- [api/src/controllers/support.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/controllers/support.js:5)
- [strapi/src/api/global-setting/content-types/global-setting/schema.json](/c:/Users/PRENEEL/Desktop/Elewen/strapi/src/api/global-setting/content-types/global-setting/schema.json:17)

What already works:

- support ticket CRUD for customers exists
- contact/help content fields exist in Strapi

What is missing:

- dashboard-facing help settings fetch helper
- stricter permission checks on some support endpoints

Important backend concern:

- support detail/update currently rely too much on frontend/admin gating
- see [api/src/controllers/support.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/controllers/support.js:105)

Recommended API improvements:

- `GET /dashboard/customer/help`
- tighten ownership and admin role checks

Backend source of truth:

- Prisma: `SupportTicket`, `SupportMessage`
- Strapi: `global-setting`

Status:

- partially ready

### 9. Profile Snapshot

IA needs:

- name
- email
- phone number
- profile image if available
- edit basic info

Dynamic fields needed:

- auth user identity
- first name
- last name
- email
- phone
- profile photo
- date of birth if account page needs it
- preferred language if used later

Current backend support:

- `GET /auth/me`
- `GET /auth/profile`
- `PATCH /auth/profile`

Route references:

- [api/src/routes/auth.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/routes/auth.js:119)
- [api/src/routes/auth.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/routes/auth.js:241)
- [api/src/controllers/auth.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/controllers/auth.js:381)

What already works:

- customer profile exists in Strapi
- backend already merges auth user and profile data

What is missing:

- frontend API wrapper for profile fetch/update in dashboard flow

Backend source of truth:

- Strapi user
- Strapi `customer-profile`

Status:

- ready

### 10. Notifications

IA may need:

- unread badge
- latest alerts
- notification center drawer/panel

Dynamic fields needed:

- notification id
- title
- message
- link URL
- read/unread
- unread count

Current backend support:

- `GET /notifications`
- `GET /notifications/unread-count`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/read-all`

Route references:

- [api/src/routes/notification.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/routes/notification.js:31)
- [api/src/controllers/notification.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/controllers/notification.js:5)

What already works:

- notification APIs exist

What is missing:

- frontend wiring only

Backend source of truth:

- Prisma: `Notification`

Status:

- ready

## Recommended New APIs

These are the most useful additions for your customer dashboard.

### High priority

1. `GET /dashboard/customer/summary`

Purpose:

- one-call dashboard top-level stats

Suggested response:

```json
{
  "activeBookingsCount": 2,
  "previousBookingsCount": 4,
  "pendingSampleTasteCount": 1,
  "savedPackagesCount": 6,
  "unreadMessagesCount": 3,
  "openSupportTicketsCount": 1,
  "unreadNotificationsCount": 5
}
```

2. Enriched `GET /bookings`

Purpose:

- cards for active and previous bookings

Should include:

- package title/image/slug
- event name
- address preview
- amount paid / amount due summary

3. Enriched `GET /bookings/:id`

Purpose:

- detail page without requiring many extra client-side joins

Should include:

- package info
- event info
- address info
- vendor summaries
- payment summary
- cancellation summary

4. Enriched `GET /sample-taste` and `GET /sample-taste/:id`

Purpose:

- customer can understand vendor comparison and next actions without separate Strapi calls

5. `POST /bookings/:id/rebook`

Purpose:

- re-create cart or draft booking from previous booking

6. `POST /sample-taste/:id/convert-to-booking`

Purpose:

- move from sample taste decision to full booking flow

### Medium priority

7. `GET /dashboard/customer/help`

Purpose:

- expose Strapi global support settings in one frontend-safe shape

8. `GET /messages/threads`

Purpose:

- if dashboard home wants message previews across bookings

9. `GET /wishlist` enrichment

Purpose:

- better saved package cards

## Existing Backend Issues To Fix Before Dashboard Launch

### 1. Payment order creation is incomplete

Reference:

- [api/src/controllers/payment.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/controllers/payment.js:28)

Issue:

- `createOrder` contains placeholder text: `// rest of your existing logic...`

Impact:

- booking detail payment CTA is not fully reliable

Priority:

- critical

### 2. Messaging access control is weak

Reference:

- [api/src/controllers/messaging.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/controllers/messaging.js:17)

Issue:

- code allows non-owner access without real admin role verification

Impact:

- customer message threads are not fully protected

Priority:

- critical

### 3. Support access control is weak

Reference:

- [api/src/controllers/support.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/controllers/support.js:105)

Issue:

- code comments say access is effectively gated by frontend/admin panel assumptions

Impact:

- support ticket privacy may be exposed

Priority:

- critical

### 4. Refund list is not customer-scoped

Reference:

- [api/src/controllers/payment.js](/c:/Users/PRENEEL/Desktop/Elewen/api/src/controllers/payment.js:576)

Issue:

- refunds can be listed without booking ownership filtering

Impact:

- customer-facing refund history endpoint is unsafe

Priority:

- high

### 5. Frontend API wrappers are incomplete

Reference:

- [frontend/src/lib/api.js](/c:/Users/PRENEEL/Desktop/Elewen/frontend/src/lib/api.js:160)

Issue:

- only auth, cart, wishlist, booking create/note, and payment verify basics are wired

Impact:

- dashboard frontend cannot yet consume most existing backend APIs cleanly

Priority:

- high

## Implementation Priority Order

### Phase 1

- finish `POST /payments/create-order`
- fix messaging/support/refund access control
- add frontend API wrappers for bookings, support, messages, notifications, sample taste, profile

### Phase 2

- build `GET /dashboard/customer/summary`
- enrich `GET /bookings`
- enrich `GET /bookings/:id`
- enrich `GET /sample-taste`
- enrich `GET /wishlist`

### Phase 3

- add `POST /bookings/:id/rebook`
- add `POST /sample-taste/:id/convert-to-booking`
- add `GET /dashboard/customer/help`

## Repo Status Cross-check

Project status already confirms these frontend gaps:

- dashboard page not done
- saved packages frontend flow not done
- booking management frontend flow not done
- messaging frontend flow not done
- support frontend flow not done
- notifications frontend flow not done

Reference:

- [PROJECT_STATUS.md](/c:/Users/PRENEEL/Desktop/Elewen/PROJECT_STATUS.md:250)

## Final Classification

### Already available

- booking storage and basic booking APIs
- booking timeline APIs
- payment history APIs
- sample taste APIs
- messaging APIs
- support APIs
- notifications APIs
- saved package APIs
- customer profile APIs
- Strapi support/profile/package/event/address/vendor content types

### Needs enrichment / dashboard shaping

- active bookings
- previous bookings
- booking details
- sample taste comparison
- saved package cards
- support/help static contact block
- dashboard home summary

### Needs new backend work

- dashboard summary API
- rebook API
- sample-taste convert-to-booking API
- optional help API wrapper
- optional thread list API

### Needs fixes before launch

- payment create-order completion
- messaging authorization hardening
- support authorization hardening
- refund ownership filtering

