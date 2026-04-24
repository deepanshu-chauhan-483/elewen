# Elewen Project Status

## Project Summary

- Frontend website -- done
- Strapi CMS integration -- partially done
- Custom backend API -- partially done
- Event flow -- done
- Package filtering flow -- done
- Blog listing and single blog CMS flow -- done
- Auth flow -- done
- Cart to checkout frontend UI -- not done
- Order frontend UI -- not done

## Frontend Pages Status

### Marketing Pages

- Landing page -- done
- About page -- done
- In-house planner page -- done
- How it work page -- done as static page
- How it work page Strapi connection -- not done
- Book consultation page -- done
- Consultation confirmation page -- done

### Blog Pages

- Blog listing page -- done
- Blog categories from Strapi -- done
- Blog single page route by slug -- done
- Blog content from Strapi -- done
- Blog author from Strapi -- done
- Blog published date from Strapi -- done
- Blog refresh bug on single page -- fixed
- Blog fallback content/images -- still present as backup

### Auth Pages

- Login page -- done
- Signup page -- done
- Forgot password page -- done
- Reset password page -- done
- Google auth callback page -- done
- Auth connected to backend API -- done

### Event Flow Pages

- Event category page -- done
- Event page -- done
- Service page -- done
- Decor theme page -- done
- Catering levels page -- done
- Bartending levels page -- done
- Decor levels page -- done

### Package Pages

- Package listing page -- done
- Decor packages page -- done
- Rental furniture packages page -- done
- Catering packages page -- done
- Bartending packages page -- done
- Sheesha packages page -- done
- Package results hero/filter chips -- done
- Real package filtering by selected query params -- done
- Decor level grouping by Strapi budget levels -- done
- Package detail page -- not done
- Add to cart button in frontend package cards -- not done
- Save package button/flow -- not done

## Frontend to Strapi Connection Status

### Connected to Strapi

- Landing page CMS -- done
- About page CMS -- done
- In-house planner CMS -- done
- Events data -- done
- Service categories data -- done
- Packages data -- done
- Themes data -- done
- Budget levels data -- done
- Blogs data -- done
- Testimonials data -- done
- Global settings read -- done

### Not Connected to Strapi

- How it work page CMS -- not done
- Consultation page CMS -- not done
- Footer content CMS -- not done
- Navigation menu CMS -- not done
- FAQ CMS -- not done
- Policy CMS -- not done

## Event Package Flow Status

- Category selection flow -- done
- Event selection flow -- done
- Service selection flow -- done
- Decor theme selection flow -- done
- Catering level selection flow -- done
- Bartending level selection flow -- done
- Direct rental furniture package flow -- done
- Direct sheesha package flow -- done
- Final filtered package listing flow -- done
- Package detail flow -- not done
- Cart flow from package listing -- not done
- Checkout flow from frontend -- not done
- Order confirmation flow from frontend -- not done

## Blog System Status

- Blog list fetch from Strapi -- done
- Blog single fetch by slug -- done
- Blog content render from Strapi -- done
- Blog date consistency between list and single page -- fixed
- Blog redirect-on-refresh bug -- fixed

## Package System Status

- Package fetch from Strapi -- done
- Package relation mapping in frontend -- done
- Package sort by price/title -- done
- Package filter by category -- done
- Package filter by event -- done
- Package filter by eventId -- done
- Package filter by service -- done
- Package filter by serviceId -- done
- Package filter by theme -- done
- Package filter by level -- done
- Service-specific package pages -- done
- Decor level page filtering -- done

## Backend API Status

### Auth API

- Register API -- done
- Login API -- done
- Logout API -- done
- Refresh token API -- done
- Current user API -- done
- Forgot password API -- done
- Reset password API -- done
- Google session API -- done
- Customer profile handling -- done

### Lead APIs

- Planner lead API -- done
- Consultation API -- done
- Planner lead write into Strapi -- done
- Consultation lead write into Strapi -- done

### Cart API

- Get cart API -- done
- Create cart if missing -- done
- Add item to cart API -- done
- Update cart item quantity API -- done
- Remove cart item API -- done
- Update event details in cart API -- done
- Apply coupon API -- done
- Remove coupon API -- done
- Cart totals recalculation -- done
- Frontend cart page/UI -- not done

### Booking API

- Create booking from cart API -- done
- Booking list API -- done
- Booking detail API -- done
- Booking status update flow -- done
- Booking timeline entries -- done
- Booking notes -- done
- Booking file attachment by URL -- done
- Frontend booking screens -- not done

### Payment API

- Create Razorpay order API -- done
- Verify Razorpay payment API -- done
- Razorpay webhook handling -- done
- Payment list APIs -- done
- Refund flow APIs -- done
- Vendor payout APIs -- done
- Frontend checkout/payment screens -- not done

### Messaging API

- Thread creation/get API -- done
- Message list API -- done
- Send message API -- done
- Mark as read API -- done
- Unread count API -- done
- Frontend messaging UI -- not done

### Support API

- Create ticket API -- done
- List tickets API -- done
- Ticket detail API -- done
- Reply/internal notes API -- done
- Status/priority update API -- done
- Frontend support UI -- not done

### Notifications API

- Notification list API -- done
- Unread count API -- done
- Mark one as read API -- done
- Mark all as read API -- done
- Frontend notifications UI -- not done

### Packages Helper API

- Wizard steps API -- done
- Wizard filter API -- done
- Calculate price API -- done
- Frontend uses these helper APIs -- not done

### Vendor API

- Vendor registration API -- done
- Vendor assignment API -- done
- Vendor bank info API -- done
- Frontend vendor UI -- not done

### Sample Taste API

- Sample taste create API -- done
- Sample taste list API -- done
- Sample taste detail API -- done
- Sample taste status update API -- done
- Frontend sample taste UI -- not done

## Database / Storage Status

- Strapi content storage -- done
- Prisma custom business tables -- done
- Session storage in Prisma -- done
- Cart storage in Prisma -- done
- Booking storage in Prisma -- done
- Payment storage in Prisma -- done
- Messaging storage in Prisma -- done
- Notification storage in Prisma -- done

## Current Missing Frontend Features

- Package detail page -- not done
- Add to cart frontend -- not done
- Cart page -- not done
- Checkout page -- not done
- Order confirmation page -- not done
- Dashboard page -- not done
- Saved packages frontend flow -- not done
- Booking management frontend flow -- not done
- Payment frontend flow -- not done
- Messaging frontend flow -- not done
- Support frontend flow -- not done
- Notifications frontend flow -- not done

## Current Important Notes

- How it work page is still static
- Blog system is now CMS-driven but still keeps fallback backup data
- Package filtering now works in frontend listing pages
- Order/cart/payment backend is built, but frontend UI for that flow is still missing
- Some links/routes are still missing in frontend, like `/account`, `/contact`, `/faqs`, `/services`
