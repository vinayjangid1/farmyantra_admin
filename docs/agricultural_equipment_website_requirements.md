# Agricultural Equipment E-Commerce Website — Requirements Specification

**Document type:** Product requirements and functional specification  
**Version:** 1.1  
**Date:** 12 October 2026  
**Status:** Requirements baseline. v1.0 sections 1–23 are unchanged except where marked *(v1.1)*. Sections 24–35 are new.  
**Companion:** `FARMYANTRA_MASTER_SPEC.md` (functional and technical specification). Status codes are defined once in Master Spec §34.

**Change log**
- **1.1:** added the multi-machine cart, the `both` request type, product lead times, order acceptance/editing/creation with versions, manufacturing tracking, shipping and drivers, order documents and offline payments, delivery confirmation, reward points, the order tracker, public trust content, the visual identity and motion, and the mobile app-like/PWA experience. Updated roles, pages, dashboard, admin modules, phases, acceptance criteria and open questions to match.
- **1.0:** initial requirements.

---

## 1. Project Overview

Build a modern, mobile-first website for an agricultural equipment business. The website will present products with rich media, interactive 3D viewing, configurable equipment options, add-ons, customer reviews, promotions, downloadable catalogues, quotations, and enquiry-based ordering.

Customers must create an account before submitting an enquiry. Account creation should be low-friction: verify a phone number first, then collect the customer's name and email address. Once the enquiry is submitted, it appears in the admin panel. The admin reviews and accepts or rejects it. The customer is notified when the status changes.

This is an **enquiry-led commerce system**, not an automatic checkout/payment system in the initial release.

*(v1.1)* Customers can add several machines to a cart ("My Request List") and send them as one request, asking for a **call-back**, a **quotation**, or **both**. After the conversation or the quotation, an order is placed or confirmed and then tracked end to end: manufacturing for made-to-order items, shipment, delivery confirmation, documents and payments recorded offline. Delivered orders earn reward points.

## 2. Product Goals

- Present equipment in a professional, modern, trustworthy way.
- Make product discovery and configuration easy on phones, tablets, and desktops.
- Let customers inspect machines through photos, videos, and mobile-friendly 3D models.
- Allow only admin-approved customisation and add-on options.
- Calculate indicative pricing transparently as options are changed.
- Capture qualified enquiries with the customer's selected configuration.
- Give customers an account area for enquiries, quotations, and order history.
- Give administrators control over products, configurations, prices, offers, content, enquiries, and catalogue exports.
- Support future expansion without needing to rebuild the whole platform.
- *(v1.1)* Give honest, clearly labelled lead-time estimates and keep them current.
- *(v1.1)* Make the journey after the sale visible: manufacturing, shipping, documents and delivery.
- *(v1.1)* Feel like a native app on phones and be installable as a PWA.
- *(v1.1)* Reward repeat customers with a fair, abuse-resistant points programme.

## 3. Users and Roles

### 3.1 Guest visitor
- Browse and search products.
- View product details, images, videos, specifications, and available 3D models.
- View published, approved reviews.
- Use product configurators where permitted.
- View offers and download public catalogues.
- Generate or request a quotation where allowed.
- Must sign in before submitting an enquiry.

### 3.2 Registered customer
- All guest capabilities.
- Manage basic profile details.
- Submit product enquiries with selected configurations and quantities.
- View enquiry status and history.
- View accepted quotations and download quotation PDFs.
- View previous orders or confirmed sales records made by the business.
- Receive email and/or in-site notifications.
- Submit a review after the business verifies eligibility, such as a completed purchase or admin-approved transaction.
- Track review moderation status.

### 3.3 Administrator
- Manage products, categories, media, specifications, variants, configuration rules, add-ons, and prices.
- Enable/disable product customisation and control which fields can be changed.
- Manage customers, enquiries, quotations, orders, reviews, offers, coupons, catalogue exports, and notifications.
- Configure business identity, logo, contact details, and quotation templates.
- View audit history and reports.

### 3.4 Optional future roles
- Product/content manager with limited permissions.
- Sales representative who can manage assigned enquiries.
- Supplier/fulfilment operator if supplier workflows are added later.
- *(v1.1)* Production supervisor (manufacturing updates), logistics coordinator (shipments, drivers, delivery issues) and accounts executive (payments, documents). These are configurable roles, not code.
- *(v1.1)* **Drivers are not users.** They are records the team manages. A driver app is a future option.

Use role-based access control so each role only sees and changes permitted information.

## 4. Website Experience and Design

### 4.1 Visual direction
Create a polished, modern agricultural machinery storefront—not a generic template. Use:
- Strong product photography and video.
- Clean typography, clear hierarchy, generous spacing, and high-contrast calls to action.
- Consistent product cards and specification layouts.
- A distinctive agricultural brand identity with restrained, accessible colours.
- Subtle motion and transitions that do not slow down browsing.
- Responsive layouts designed for mobile first.

### 4.2 Main public pages
1. Home page
2. Product catalogue / shop
3. Category listing pages
4. Product detail page
5. Product comparison page (recommended)
6. Offers and promotions
7. Downloadable catalogues
8. About the company
9. Contact / support
10. Buying guides / articles (recommended for SEO)
11. Shipping, warranty, returns, privacy, and terms pages
12. Sign in / account creation
13. Customer dashboard
14. Enquiry and quotation detail pages
15. Review submission and review status
16. *(v1.1)* Cart / "My Request List"
17. *(v1.1)* Order tracker (one page per order)
18. *(v1.1)* Reward points
19. *(v1.1)* Offline fallback page (PWA)

### 4.3 Home page
Include:
- Hero section with a clear value proposition and product discovery CTA.
- Featured categories and products.
- New, popular, or recommended products.
- Current offers.
- Benefits such as warranty, support, or service only where factually applicable.
- Videos or product demonstrations.
- Catalogue download CTA.
- Customer testimonials that are genuine and approved.
- *(v1.1)* A trust section with real, computed or dated figures (§33).
- Contact and WhatsApp enquiry options, if enabled by the business.

### 4.4 Product discovery
- Search by product name, model, brand, and relevant keywords.
- Filter by category, price range, power/capacity, fuel/power type, weight, intended use, availability, and other product-specific attributes.
- Sort by relevance, newest, price, or popularity where reliable data exists.
- Pagination or accessible “load more” behaviour.
- Product cards show primary image, name/model, key specifications, indicative price or “Request quotation,” customisation availability, and a clear action.
- Preserve filter/search state when users navigate back from a product page.

## 5. Product Detail Page

Each product should support the following fields and content:

### 5.1 Product information
- Product name and model/SKU.
- Category and optional brand/manufacturer.
- Short description and full description.
- Key benefits and intended use.
- Technical specifications.
- Dimensions and weight, with units.
- Power, capacity, fuel type, materials, included accessories, and other relevant attributes.
- Base price, indicative price, or “Request quotation” setting.
- Availability/status and lead-time text where confirmed. *(v1.1)* Lead time comes from the product's fulfilment type (§26).
- Warranty and service details where applicable.
- Manuals, safety documents, and downloadable files.
- Related products, compatible add-ons, and accessories.

### 5.2 Media and brochure support
- Multiple product images, including gallery and zoom.
- Product videos and demonstrations.
- PDF brochures and manuals.
- Image/video captions, alt text, and ordering.
- Admin can upload, reorder, replace, publish, or remove media.
- Support optimised image formats, responsive sizes, thumbnails, and lazy loading.
- Video should use a poster image and load only when needed; prefer hosted/CDN video or a reliable streaming provider rather than loading large files immediately.

### 5.3 Mobile-friendly 3D product viewer
- Support a 3D model viewer for products with an approved model, ideally using an optimised glTF/GLB asset.
- Allow orbit/rotate, zoom, and reset-to-default view.
- Provide touch gestures and sensible limits so the model remains easy to use on mobile.
- Show loading progress and a helpful fallback if the device/browser cannot display the model.
- Lazy-load the 3D viewer only when requested or when near the viewport.
- Offer a normal image/video gallery as a fallback.
- Optimise model polygon count, textures, file size, and lighting for mobile performance.
- Allow the admin to upload/assign the model and set whether the viewer is enabled.
- Do not block product details or enquiry actions while the 3D model loads.

## 6. Product Configuration and Customisation

Configuration must be **admin-controlled per product**. No customer should be able to modify a field or machine feature that the administrator has not explicitly enabled.

### 6.1 Customisation controls
For each product, the admin can:
- Enable or disable customisation.
- Define which options are available.
- Set allowed values, constraints, price adjustments, and display order.
- Mark options as optional or required.
- Set minimum/maximum values where applicable.
- Decide whether an option affects the displayed price.
- Preview configuration changes before publishing.
- Disable an option without deleting historic enquiry data.

### 6.2 Colour customisation
Where enabled:
- Display approved colour swatches and, where possible, corresponding product previews.
- Admin defines the allowed colours and any additional cost.
- Customer selects only from permitted colours.
- Store the selected colour and its stable identifier in the enquiry snapshot.
- Do not imply that any arbitrary colour is available unless the admin has approved it.

### 6.3 Add-ons and machine modifications
Admin can define add-ons/modifications for a product, for example:
- Accessory or attachment.
- Upgraded component.
- Extra tool or spare part.
- Optional service or package, where offered.
- A custom text/name engraving or label option, if supported by the product.

Each add-on can have:
- Name, description, image, and optional diagram.
- Fixed price, quantity-based price, or “price on request.”
- Required/optional status.
- Compatibility rules.
- Quantity limits.
- Dependencies or exclusions.
- Availability and active/inactive status.
- Whether it changes the base machine price.

Customers can select available add-ons. The system recalculates the indicative price immediately and explains the price components.

### 6.4 Customer-defined name or label
Where an admin has enabled personalisation:
- Customer can enter their requested name/text.
- Customer selects an allowed placement from admin-defined locations (for example, a designated panel or label area).
- Admin defines character limits, allowed characters, placement options, extra price, and any preview rules.
- Validate input and show a confirmation preview or clear summary.
- Treat custom text as a request requiring admin approval before production.
- Do not let the customer position text anywhere on a real machine image unless the product supports that capability and the admin has configured it.

### 6.5 Configuration price calculation
Show a clear breakdown:
- Base price.
- Selected upgrades/add-ons.
- Colour or customisation charge.
- Personalisation charge.
- Quantity.
- Offer/coupon discount, if eligible.
- Estimated total or indicative total.
- Taxes, delivery, and other charges only when known and configured correctly.

If final pricing depends on inspection, availability, delivery location, or negotiation, label the amount **“Indicative price”** and state that the admin will confirm the final quotation. Avoid promising a final price when it is not yet determined.

Store a snapshot of the exact configuration and applicable prices at enquiry time. Later admin edits to a product must not silently change an existing enquiry.

## 7. Offers, Discounts, Bundles, and Coupons

Admins need a promotion management module.

### 7.1 Promotion types
- Percentage discount.
- Fixed amount discount.
- Minimum purchase value.
- Minimum quantity.
- Product-specific offer.
- Category-specific offer.
- Buy two or more eligible products for a specified bundle price.
- Buy X, get Y, if supported by the business.
- Date-limited campaign.
- Coupon-code discount.
- Customer/group-specific promotion, if needed later.

### 7.2 Promotion settings
- Internal name and customer-facing title.
- Description and optional banner/image.
- Start/end date and time.
- Applicable products/categories.
- Minimum quantity or spend.
- Maximum discount, if applicable.
- Usage limit and per-customer limit.
- Coupon code, where relevant.
- Whether promotions can be combined.
- Priority when multiple offers apply.
- Active/draft/expired status.

### 7.3 Offer calculation rules
- Validate offers on the server; never trust a client-side calculation alone.
- Clearly show why a promotion does or does not apply.
- Prevent invalid combinations and negative totals.
- Store the applied offer and price breakdown with the enquiry/quotation.
- For enquiry-led orders, clarify that a promotion is subject to admin confirmation if final prices are not immediately binding.

## 8. Product Reviews and Moderation

### 8.1 Review submission
- Signed-in customers can submit a rating, written review, and optional images/videos.
- Reviews can reference a specific product and, when applicable, a verified purchase/order.
- Show a “Verified purchase” label only after the system confirms the defined verification criteria.
- Customers can see their review status.

### 8.2 Review moderation and publication
Review states:
- Draft/submitted.
- Pending verification.
- Pending moderation.
- Approved/published.
- Rejected.
- Hidden/removed.

The admin can:
- Review text and media.
- Verify eligibility.
- Approve, reject, hide, or request changes.
- Record a moderation reason internally.
- Flag spam, abusive content, irrelevant uploads, or unsafe media.
- Keep an audit trail.

Only reviews that pass the configured verification and moderation process appear publicly. Define the verification method clearly—such as a confirmed purchase, accepted business record, or manual admin verification. Do not imply that an unverified review is verified.

### 8.3 Media safety and performance
- Restrict file types and file sizes.
- Validate uploaded files and scan for malware where supported.
- Re-encode images and transcode videos as appropriate.
- Use private storage for pending review media and serve public media only after approval.
- Provide reporting/moderation tools for published content.

## 9. Account Creation and Authentication

### 9.1 Phone-first registration
1. Customer enters phone number.
2. System sends an OTP through a configured SMS/OTP provider.
3. Customer verifies the OTP.
4. In step two, collect name and email address.
5. Validate the details and create/complete the customer account.
6. Customer is signed in and can submit the enquiry.

Requirements:
- Do not create an account from an unverified phone number.
- Prevent OTP abuse with rate limits, expiry, attempt limits, and resend cooldown.
- Avoid exposing whether a phone number is registered through error messages.
- Use secure sessions/tokens and safe logout/session expiry.
- Email verification can be added if required; do not assume an email is verified just because it was entered.
- Collect only necessary data and provide a privacy notice and appropriate consent.
- Provide a secure account recovery process.

### 9.2 Enquiry submission gate
- Guest may configure a product and prepare an enquiry.
- On clicking **Send Enquiry**, require phone verification and completion of name/email if not already signed in.
- Preserve the selected product, configuration, quantity, offer, and notes during sign-in.
- After successful authentication, show a final enquiry summary before submission.
- Prevent duplicate submissions from repeated taps/retries.

## 10. Enquiry Workflow

### 10.1 Customer enquiry form
Include:
- Product and model.
- Selected colour, add-ons, custom text/placement, and other configuration.
- Quantity.
- Indicative price breakdown, where available.
- Customer name, verified phone number, and email.
- Delivery city/pincode or location if needed to prepare the quote.
- Customer message / special requirements.
- Preferred contact method, if supported.
- Consent/acknowledgement that the final quotation may require admin confirmation.

### 10.2 Enquiry statuses
Recommended statuses:
- Draft.
- Submitted.
- Under review.
- Accepted / quotation in progress.
- Quotation sent.
- Customer clarification required.
- Customer accepted quotation.
- Converted to order.
- Rejected.
- Cancelled.
- Closed.

Use a documented state-transition workflow so staff cannot accidentally move an enquiry to an invalid state.

*(v1.1)* The implemented status codes are `submitted`, `under_review`, `contacted`, `clarification_required`, `accepted`, `quotation_sent`, `customer_accepted`, `customer_declined`, `converted_to_order`, `rejected`, `cancelled` and `closed`. "Draft" is the cart, which is not an enquiry. "Accepted / quotation in progress" is `accepted`. Each request also has a request type: `callback`, `quotation` or `both`. The canonical list is Master Spec §34.

### 10.3 Admin processing
- New enquiries appear in an admin queue.
- Admin can open full details, inspect the configuration, and view customer contact information.
- Admin can add internal notes not visible to the customer.
- Admin can accept, reject, request clarification, or prepare a quotation.
- Admin can change price/availability only with a recorded reason and clear updated quotation.
- Record who changed the status and when.
- Customer receives an email and in-site notification when an important status changes.
- Notify the customer only after the status change is successfully saved.
- Admin can resend a notification if delivery fails.

### 10.4 Customer notifications
At minimum, send notifications for:
- Enquiry submitted.
- Enquiry accepted / being processed.
- Clarification requested.
- Quotation sent or updated.
- Enquiry rejected or cancelled.
- Quotation expiry approaching, if expiry is configured.
- Enquiry converted into an order.

Email should be the initial channel if configured. SMS/WhatsApp notifications can be added based on provider, consent, and budget. In-site notifications should be available in the account dashboard.

## 11. Quotations and PDF Documents

### 11.1 Quotation creation
Admin can generate a quotation from an enquiry and adjust:
- Quotation number.
- Issue date and validity/expiry date.
- Customer and business details.
- Business logo and contact information.
- Product name, model/SKU, quantity, and full selected configuration.
- Itemised base price and add-on prices.
- Discounts/offers.
- Tax details where applicable.
- Delivery/installation charges where applicable.
- Total and payment terms, if relevant.
- Weight and dimensions where available.
- Warranty/lead-time notes.
- Terms and conditions.
- Prepared-by contact details.

### 11.2 PDF output
- Generate a clean, print-ready PDF.
- Include the correct business logo, brand styling, date, quotation number, and all required details.
- Use consistent currency and units.
- Support multiple products and pages.
- Add a footer with page number and contact details.
- Allow admin and customer to download the appropriate quotation.
- Keep a record of every sent quotation version; do not overwrite a quotation that has already been sent.
- Clearly mark draft, sent, accepted, rejected, or expired quotations.

### 11.3 Date-based catalogue/quotation exports
- Customer can download the current published catalogue.
- Admin can export a catalogue snapshot generated on a chosen date.
- Catalogue should include only published products and selected public fields.
- Include generated date/version and business branding.
- Admin can optionally generate category-specific catalogues.
- A quotation is a customer-specific document; it should be generated from the enquiry and its saved configuration snapshot, not from the current product page alone.

## 12. Catalogue Downloads

- Offer a full product catalogue PDF.
- Offer category-specific catalogues where useful.
- Include product images, product names/models, concise descriptions, key specifications, weights/dimensions, and prices only where approved for publication.
- Include logo, contact details, website, catalogue generation date, and version.
- Admin can generate, preview, publish, unpublish, and regenerate catalogues.
- Large catalogues should be generated asynchronously if necessary, with status and download link.
- Keep a stable published download URL where practical, while retaining dated versions internally.
- Do not expose internal supplier costs or private data in public catalogues.

## 13. Customer Dashboard

After login, customers should see:
- Profile details and verified phone number.
- Current and past enquiries.
- Enquiry status timeline.
- Product configurations submitted.
- Messages/clarification requests.
- Quotations with download links and expiry dates.
- Confirmed order history and status, if an enquiry becomes an order.
- Review submissions and moderation status.
- Notifications.
- Account logout and privacy/account-support links.
- *(v1.1)* Cart, the order tracker per order (manufacturing, shipments, documents, payments, delivery confirmation), pending order changes to confirm, and reward points.

Customers must only be able to access their own data. Use server-side authorisation checks for every record request.

## 14. Admin Panel

### 14.1 Dashboard
- New enquiries and status counts.
- Recent enquiries and quotations.
- Products needing attention.
- Pending reviews.
- Active and upcoming promotions.
- Catalogue generation status.
- Basic enquiry conversion and product interest metrics.
- *(v1.1)* Orders to accept, revisions awaiting customers, delayed manufacturing jobs, shipments in transit, deliveries awaiting confirmation, open delivery issues, and abandoned carts (consent-aware).

### 14.2 Product management
- Create, edit, preview, publish, unpublish, archive, and duplicate products.
- Manage categories, attributes, SKU/model, pricing, specifications, weight/dimensions, warranty, and availability.
- Upload and order images/videos/documents.
- Assign 3D models.
- Manage variants, colours, add-ons, personalisation fields, compatibility rules, and configuration prices.
- Validate required fields before publication.
- Maintain a history of important changes.

### 14.3 Enquiry and quotation management
- Search/filter by status, date, product, customer, location, and assigned staff.
- View configuration snapshot and uploaded files.
- Add private notes and customer-facing messages.
- Accept/reject/request clarification.
- Create and revise quotations.
- Track notification delivery state.
- Convert an accepted quotation to an order.
- Export appropriate records for internal use.

### 14.4 Reviews
- Verification queue.
- Media preview.
- Approve/reject/hide.
- Moderation reasons and audit log.
- Search and filter by product, date, status, and rating.

### 14.5 Promotions
- Create and edit coupons, offers, bundles, and date rules.
- Preview eligible products and price calculation.
- Track usage and errors.
- Disable an offer without erasing historical records.

### 14.6 Site settings
- Logo, business name, address, email, phone, and contact links.
- Currency and units.
- Tax display settings, where applicable.
- Quotation and catalogue templates.
- Email templates.
- Terms, privacy, warranty, returns, and other public content.
- SEO metadata and social sharing images.

### 14.6a Fulfilment and after-sales modules *(v1.1)*
- Order acceptance, editing (versions with diff) and creation on behalf (§27).
- Manufacturing templates, jobs and updates with media (§28).
- Drivers, shipments and manual tracking events (§29).
- Order documents and offline payment records (§30).
- Delivery confirmations and delivery issue cases (§31).
- Reward rules, campaigns and adjustments (§32).
- Banners and posters (§34), and trust content (§33).
- Mobile-friendly urgent flows: view order, call customer, log call, update tracking, upload camera photo/video (§35).

### 14.7 Admin security
- Secure admin login and role permissions.
- Strong password policy and optional MFA.
- Rate limiting and session expiry.
- Audit logs for pricing, status, review, promotion, and permission changes.
- Never expose admin APIs or private customer data to public clients.

## 15. Recommended Additional Features

These features are useful but should be prioritised after the core experience:

1. **Product comparison:** compare dimensions, weight, power, capacity, included accessories, and warranty.
2. **WhatsApp contact:** optional click-to-chat with a prefilled message containing a product link or enquiry reference. The customer must send the message themselves unless an approved messaging integration is implemented.
3. **Saved products:** customers can bookmark products.
4. **Recently viewed products:** help customers return to machines they inspected.
5. **Related accessories:** suggest compatible add-ons, while respecting compatibility rules.
6. **Buying guides and FAQs:** support customers and improve organic search visibility.
7. **SEO:** unique titles/descriptions, canonical URLs, structured product data, sitemap, robots.txt, and clean category/product URLs.
8. **Analytics:** product views, configurator usage, catalogue downloads, enquiry submissions, and enquiry conversion.
9. **Abandoned enquiry recovery:** preserve a customer's unfinished configuration locally or in their account; send follow-up only with appropriate consent. *(v1.1: now delivered by the server-side cart and abandoned-cart list, §24.)*
10. **Multi-language content:** prepare the data model for English and Hindi product descriptions, specifications, and UI strings.
11. **Accessibility:** keyboard support, readable contrast, form labels, reduced-motion support, and screen-reader-friendly controls.
12. **Product support cases:** a future warranty/service request workflow, if the business offers support.

## 16. Technical Architecture

Recommended baseline:
- **Frontend:** React with Vite and TypeScript.
- **Backend:** Node.js with Express and TypeScript.
- **Database:** PostgreSQL.
- **Media storage:** S3-compatible object storage or equivalent, with CDN delivery.
- **3D assets:** optimised GLB/glTF files and a browser-based viewer.
- **PDF generation:** server-side PDF generation with reusable templates.
- **Authentication:** phone OTP through a reputable provider, with secure session/token handling.
- **Email:** transactional email provider.
- **Background jobs:** queue/worker for catalogue generation, media processing, and email retries as the system grows.
- **Deployment:** managed hosting or a VPS with separate production/staging environments, HTTPS, backups, logging, and monitoring.

Keep business rules such as pricing, offer eligibility, enquiry state transitions, and permissions on the server. The frontend may preview totals, but the server must recalculate and validate all submitted prices and options.

## 17. Initial Data Model

Suggested entities/tables:
- `users`
- `customer_profiles`
- `admin_users` or role-linked users
- `roles`
- `permissions`
- `categories`
- `products`
- `product_translations`
- `product_attributes`
- `product_media`
- `product_documents`
- `product_3d_models`
- `product_variants`
- `product_customisation_rules`
- `product_colours`
- `product_addons`
- `product_addon_compatibility`
- `product_price_rules`
- `promotions`
- `promotion_products`
- `coupons`
- `coupon_redemptions`
- `enquiries`
- `enquiry_items`
- `enquiry_configuration_snapshots`
- `enquiry_events`
- `enquiry_messages`
- `quotations`
- `quotation_versions`
- `quotation_items`
- `orders`
- `order_items`
- `reviews`
- `review_media`
- `review_moderation_events`
- `notifications`
- `notification_deliveries`
- `catalogue_jobs`
- `catalogue_versions`
- `audit_logs`
- `site_settings`

Use stable IDs, timestamps, appropriate indexes, and foreign keys. Store money as integer minor units or a precise decimal type—not floating-point numbers. Keep a snapshot of product/configuration/pricing data on each submitted enquiry and quotation.

## 18. Non-Functional Requirements

### Performance
- Mobile-first, fast initial page load.
- Responsive image sizes and modern formats.
- Lazy-load videos, 3D models, and below-the-fold media.
- Avoid layout shifts; reserve media dimensions.
- Cache public catalogue/product data safely.
- Set performance budgets and test on mid-range Android phones and slower networks.

### Security and privacy
- HTTPS everywhere.
- Server-side validation and authorisation.
- Secure OTP handling, rate limits, and abuse protection.
- Protect against common web risks, including injection, XSS, CSRF where applicable, and insecure file uploads.
- Keep secrets out of frontend code and source control.
- Minimise personal data collection and define retention/deletion rules.
- Maintain database backups and test recovery.
- Keep audit records for important admin actions.

### Reliability
- Friendly error and empty states.
- Retry-safe enquiry submission and notification delivery.
- Monitoring for failed emails, uploads, PDF jobs, and background tasks.
- Clear fallback when 3D media fails.
- Avoid losing a customer's configured product during sign-in or a temporary network error.

### Accessibility
- Semantic headings and controls.
- Keyboard-accessible navigation and configurators.
- Visible focus states and form error messages.
- Adequate contrast and touch target sizes.
- Respect reduced-motion preferences.

## 19. Business Rules and Important Decisions

- Initial release uses enquiry-led ordering; no direct payment checkout unless added as a separate phase.
- Product customisation is off by default until configured by an admin.
- Only approved colours, options, add-ons, and placements can be selected.
- Custom prices and promotion eligibility must be recalculated by the backend.
- A submitted enquiry keeps the configuration and pricing snapshot from submission time.
- Final prices may require admin confirmation; label indicative prices clearly.
- Only reviews that pass the configured verification and moderation workflow are publicly visible.
- Product claims, stock, warranty, shipping time, and service promises must be accurate.
- Public catalogues must never include private supplier costs or internal notes.
- Customer data must be isolated by account and authorised on the server.
- *(v1.1)* Estimated dates are always labelled as estimates, and every revision has a reason.
- *(v1.1)* A price, item or terms change to an order takes effect only after customer confirmation.
- *(v1.1)* Documents, tracking events and points ledger entries are never overwritten. Corrections are new versions or new entries.
- *(v1.1)* Driver identity documents are private and never shown to customers.
- *(v1.1)* Public trust figures are computed from real data or are admin overrides with an "as of" date. They are never invented.
- *(v1.1)* Only original, licensed or business-owned artwork and photos are used.

## 20. Suggested Delivery Phases

### Phase 1 — Foundation
- Brand/design system and responsive layout.
- Product categories, catalogue, search, filters, and product detail pages.
- Admin product management and media uploads.
- Phone OTP, profile completion, and account area.
- Basic enquiry submission and admin workflow.
- Email and in-site notifications.
- Deployment, security basics, and backups.

### Phase 2 — Configuration and documents
- Admin-controlled colours and add-ons.
- Configurator and server-side price calculations.
- Quotation workflow and PDF generation.
- Public catalogue PDF generation.
- Enquiry history and quotation downloads.

### Phase 3 — Rich media and promotions
- Mobile-friendly 3D viewer.
- Video and brochure improvements.
- Coupon codes, minimum-spend/quantity offers, and bundles.
- Review submission, verification, and moderation.

### Phase 4 — Optimisation and growth
- Product comparison, saved products, buying guides, analytics, SEO improvements, and optional WhatsApp integration.
- Multi-language content and additional sales-team roles as needed.
- Performance tuning based on real device and usage data.

*(v1.1)* The Master Spec's delivery plan (§20) supersedes this list. Its phases are: 4 Launch hardening; 5 Mobile app experience, cart and lead times; 6 Order lifecycle and tracking; 7 Reward points; 8 Growth.

## 21. Acceptance Criteria

The initial release is ready for launch when:

- The site works on common mobile, tablet, and desktop screen sizes.
- Admin can create and publish a product with images, videos, specifications, and downloadable documents.
- Product pages load usable details even if video or 3D media is slow or unavailable.
- A product's configurator exposes only admin-enabled options.
- Changing options updates the indicative price, and the server independently validates the final calculation.
- A guest cannot submit an enquiry without verifying a phone number and completing the required profile fields.
- A customer can submit an enquiry and then view it in their dashboard.
- Admin can review, accept, reject, or request clarification on an enquiry.
- Customer receives a notification after a successful status change.
- Admin can generate a branded quotation PDF with date, customer details, product configuration, weight/specifications where available, price breakdown, and terms.
- Admin can generate and publish a dated product catalogue PDF.
- Reviews are not public until they pass the defined verification and moderation workflow.
- Promotions and coupons are validated on the backend and cannot produce invalid totals.
- Customers cannot view another customer's enquiries, quotations, reviews, or orders.
- Important admin actions are recorded in audit logs.
- Backups, HTTPS, error handling, and basic monitoring are in place.

*(v1.1)* Additional criteria:
- A customer can add several machines (including the same machine with different configurations) to a cart that survives login and works across devices, and submit one request with many items as call-back, quotation or both.
- Changed, unpublished or out-of-stock cart items are flagged and cannot be submitted silently.
- Product pages and the cart show "Ready to dispatch" or "Made to order: about X–Y days" as estimates, and the cart shows the longest item's estimate.
- Admin can accept, edit (new version with reason and diff) or create an order. Price, item or terms changes require customer confirmation.
- Made-to-order items show a manufacturing timeline with customer-visible media only.
- Orders can ship in several shipments with immutable tracking events and logged driver changes. Customers never see driver identity data.
- Documents are versioned and shared through short-lived links. Offline payments are recorded and the payment status is shown.
- Customers confirm delivery or report issues. Unconfirmed deliveries can be marked delivered only with a recorded reason.
- Confirmed deliveries make reviews verified purchases, and moderation still applies.
- Reward points are earned, reserved, consumed, returned and expired correctly, are never negative, and are safe under concurrent use.
- No horizontal scroll at 320 px. Safe areas are respected. The PWA installs and works offline for the shell. LCP ≤ 2.5 s and CLS ≤ 0.1 on a mid-range Android phone over 4G.

## 22. Confirmed Business Decisions

The following decisions have been confirmed by the business and should be treated as requirements.

1. **Public pricing:** Product prices will be visible, presented as “Starting from ₹X” when the final price depends on selected variants, add-ons, or other options. Clearly distinguish the starting price from the configured indicative total and the final quotation.
2. **Authentication:** Use Firebase Authentication for phone-number OTP login. After phone verification, collect the customer's name and email address. Use the business email address as the sender for transactional email; configure and verify the sender/domain with the chosen email service before launch.
3. **3D models:** 3D models are not available initially. The website must work fully without them. Admins can upload and assign models to products when they become available.
4. **Quotation acceptance:** After an enquiry is reviewed and accepted by an admin, the admin sends a quotation to the customer by email and makes it available in the customer account. The customer can accept the quotation online. Record acceptance, timestamp, quotation version, and any applicable terms. Acceptance should move the workflow to the next configured status, such as “Customer accepted quotation” or “Order confirmation required”; it must not imply payment has been collected.
5. **Taxes and warranty:** Show taxes separately from the base price and itemised add-ons. Calculate tax according to admin-configured rules and applicable product/order details. Display warranty details on the product page and in quotations when provided. Obtain appropriate tax advice and confirm applicable rates before launch.
6. **Languages:** Launch in both English and Hindi. Product names, descriptions, specifications, category labels, UI text, emails, quotations, and catalogues should use the selected language wherever translations are available. Admins need a way to maintain both language versions. If a translation is missing, use a defined fallback language rather than showing blank content.
7. **Reviews:** Reviews are restricted to customers with a purchase record. For the initial version, admins will manually verify that the reviewer is an eligible customer and moderate the content before publication. Clearly distinguish verification from moderation approval.
8. **Chat:** Do not build WhatsApp or a live-chat integration in the initial release. Design the system so an internal chat/messaging feature can be added later.
9. **Media limits:** Maximum image upload size is 2 MB per image; maximum video upload size is 50 MB per video. Enforce limits in the frontend and backend. Validate MIME type and file contents, provide useful error messages, and optimise images where possible. These limits apply per file, not necessarily to the total product gallery.
10. **Team and permissions:** The Super Admin can perform all actions. Super Admin can create team members and assign role-based permissions. Team members can access only the permitted modules/actions—for example, products, enquiries, pricing, reviews, quotations, offers, catalogue management, or reporting. Apply permission checks in the backend API as well as the admin UI; hiding a button is not sufficient security.

### 22.1 Updated quotation workflow

1. Customer browses a product and selects admin-enabled options.
2. The site shows the base “Starting from” price and updates the indicative price as options change.
3. Customer verifies their phone through Firebase Authentication, completes name and email, and submits the enquiry.
4. Enquiry appears in the admin panel with a saved configuration and price snapshot.
5. An authorised team member reviews it; the Super Admin retains full access.
6. Admin accepts the enquiry and creates/sends a quotation. The customer receives an email and can view the quotation in their dashboard.
7. Customer accepts or declines the quotation online. Acceptance is tied to the exact quotation version and recorded with a timestamp.
8. The system records the resulting order/next step and notifies the relevant admin/team member and customer.
9. Any revised price or terms require a new quotation version and renewed customer acceptance.

### 22.2 Team roles and permissions

Use configurable, role-based access control rather than hard-coding every permission to one fixed role. Suggested permission areas include:
- Products and product media
- Product translations
- Pricing and tax settings
- Customisation rules and add-ons
- Enquiries and customer contact details
- Quotations and quotation acceptance records
- Orders
- Reviews and verification
- Offers and coupons
- Catalogue generation
- Team members and permissions
- Reports and analytics
- Site settings and templates
- Audit logs

Only the Super Admin can grant or revoke privileged access, manage Super Admin-level settings, or perform unrestricted operations. Team-member creation, permission changes, price changes, quotation changes, and other sensitive actions should be recorded in audit logs.

## 23. Remaining Implementation Questions

These are implementation details to finalise during planning rather than unresolved business direction:
1. Which transactional email service will send mail from the business email address?
2. Which tax configuration and rounding rules will be approved for the product categories and customer locations?
3. Should accepting a quotation immediately create a confirmed order, or should it create an order pending a final admin confirmation?
4. Which initial team roles should be preconfigured, in addition to the Super Admin?
5. Which currency and language should be the default for first-time visitors? The system must support both English and Hindi regardless.

*(v1.1)* New questions. Each has a recommendation, detailed in Master Spec §22.3:

6. When are redeemed points consumed? *Recommendation: reserve at order confirmation, consume at delivery, release on cancellation.*
7. When do earned points become usable, and at what value and earn rate? *Recommendation: pending for 7 days after confirmed delivery; 1 point = ₹1; earn 1 %; redeem at most 10 % of an order; expire after 12 months.*
8. How do points appear for GST? *Recommendation: a separate pre-tax discount line, subject to accountant sign-off.*
9. Who issues tax invoices? *Decided: FarmYantra generates GST invoices, proforma invoices and credit notes in the admin panel, with templates, and emails them to customers (D5).*
10. Do item or configuration changes without a price change need customer confirmation? *Recommendation: yes.*
11. May staff record a customer's phone confirmation of an order? *Recommendation: allowed, off by default, with a logged call and reason.*
12. Video handling and large uploads from phones. *Recommendation: transcode to H.264 MP4 in the background; direct-to-storage uploads for large videos.*
13. Driver phone visibility and driver data retention. *Recommendation: show the company dispatch number by default; keep ID files 3 years after the last shipment; get a legal review under the DPDP Act.*
14. Release order. *Recommendation: soft launch after hardening plus the mobile/cart/lead-time phase; order tracking immediately after.*
15. Heading font, map embed, and Lottie use. *Recommendation: self-hosted Mukta for headings; a static map with a directions link; CSS/SVG animation first.*

---

**Implementation note:** Treat this document as the product baseline. Before development, convert each phase into prioritised user stories, wireframes, API contracts, database migrations, and test cases. Keep the first release focused on the complete product-to-enquiry-to-quotation workflow; add advanced configurator and media features in a controlled sequence.

---

# Part B — Requirements added in v1.1

Section numbers continue from v1.0. Each section names its detailed specification in the Master Spec.

## 24. Cart — "My Request List" *(Master Spec §23)*

- Customers (and guests) can add several machines, and the same machine several times with different configurations or quantities.
- The cart is **not** a payment checkout. Submitting it creates **one request with multiple items**, using the request types call-back, quotation or **both**.
- The cart is stored on the server. It survives refresh, login and a change of device. A guest cart is merged into the account cart at login.
- Prices, options and availability are re-validated on the server whenever the cart is viewed or submitted. Items that were unpublished, changed in price, had an option withdrawn or are short of stock are clearly flagged, and cannot be submitted until the customer resolves them.
- Each item keeps its own configuration snapshot, fulfilment type and lead time. The cart shows a combined estimate: the longest item, when shipping together.
- The customer can choose to receive everything together or each item as soon as it is ready.
- Admin, with permission, can view a customer's cart and a list of abandoned carts with each customer's consent status, log follow-ups, and edit items on a submitted request or order. Automated reminders go only to customers with marketing consent, at most once per cart.

## 25. Request types *(Master Spec §2)*

- Call-back, quotation, or **both**. "Both" means the call-back time commitment applies and a written quotation is also expected.
- Customers can add a response type to an open request. Staff can change it either way, and the change is recorded.

## 26. Fulfilment type and lead time *(Master Spec §24)*

- When creating a product, the admin chooses **In stock** or **Made to order**.
- **In stock:** stock quantity and dispatch time (for example 1–3 days). No manufacturing tracking.
- **Made to order:** waiting time as a minimum and maximum in days or weeks, an optional extra time per option (for example a custom colour adds 3 days), and a manufacturing stage template with planned durations.
- The website shows "Ready to dispatch" or "Made to order: about X–Y days". All dates are labelled as **estimates**. Estimates update as the order progresses, and any change shows a reason.

## 27. Order acceptance, editing and creation *(Master Spec §25)*

- After a call or a quotation, the order is placed (quotation accepted) or confirmed (order created by staff).
- Admin can **accept** an order as-is, **edit** it to match the customer's needs (items, configuration, quantity, price, delivery details), or **create** an order directly for a customer.
- Every edit creates a **new order version** with a reason, a visible difference (diff) view and an audit record. Changes to price, items, configuration or terms take effect only after the customer confirms them. Delivery address or date changes only notify the customer.
- An order can contain both in-stock and made-to-order items. Each item is fulfilled on its own and items can ship together or separately.

## 28. Manufacturing tracking *(Master Spec §26)*

- Applies to made-to-order items only.
- Stage templates per product or category, for example: Order confirmed, Material procurement, Fabrication, Painting, Assembly, Quality check, Ready for dispatch.
- Staff update stages manually with notes and photos/videos (image ≤ 2 MB, video ≤ 50 MB, file type checked, processed for the web). Each update is marked **customer-visible** or **internal**.
- Staff can revise the estimated completion with a reason and flag delays.
- Customers see a timeline with media and with estimated vs revised dates, and are notified of every visible update.

## 29. Shipping and drivers *(Master Spec §27)*

- Staff create one or more **shipments** per order, after manufacturing completes or straight away for in-stock items.
- **Driver records:** name, address, mobile, optional email, ID photo, optional licence number, vehicle registration number, vehicle type, vehicle photo, notes and active/inactive status. Records are reusable. ID photos and licence details are stored privately and visible only to specially permitted staff.
- **Shipment:** included items, origin, destination, driver and vehicle, planned pickup and delivery dates, internal freight cost, shipment reference, handling notes, and LR / e-way bill / invoice numbers with uploads.
- **Manual tracking** (no GPS): staff phone the driver and record events such as Preparing, Picked up from warehouse, In transit, Reached [location], Delayed, Reached destination and Delivered. Each event has a time, location text, note, optional photo/video and customer-visible flag. **Event history cannot be edited.**
- A driver or vehicle change during a journey is supported and recorded.
- Customers see the tracking timeline and a limited driver/vehicle view controlled by the admin (for example vehicle number and a contact number). They never see ID photos or other private data.

## 30. Bills and documents *(Master Spec §28)*

- Staff attach documents to an order, a manufacturing stage or a shipment. Types: tax invoice, proforma invoice, payment receipt, e-way bill, lorry receipt, warranty card, user manual, test/QC report, delivery challan, and other.
- Each document records its type, number, date, amount (where relevant), language, version, visibility (customer-visible or internal) and who uploaded it, with an audit record. Replacing a document creates a new version. Nothing is overwritten.
- Customers have a **Documents** section per order, download through short-lived secure links, and are notified when a document is shared.
- No online payment collection in this release. Staff **record offline payments** (amount, date, mode, reference) so customers can see the payment status and receipts. The design keeps room for online payments later.
- ⚠ Invoices must follow applicable GST rules. Accountant sign-off is required before launch.

## 31. Delivery confirmation and review *(Master Spec §29)*

- When staff mark a shipment "Reached destination", the customer is asked in the dashboard and by email to choose: **Received in good condition**, **Received with issues** (with a description and photos), or **Not received yet**.
- If there is no response after a configurable number of days, staff can mark it delivered with a recorded reason.
- Issues open a **delivery issue case** with a status, messages and resolution notes.
- After confirmed delivery, the customer is invited to review. Such reviews count as **verified purchases** without manual verification. Moderation still applies.

## 32. Reward points *(Master Spec §30)*

- Customers earn points on **confirmed-delivered** orders. The rule is configurable: a percentage of value, fixed points per product, or bonus campaigns. Optional bonuses for an approved review or a referral can be enabled.
- A points ledger records points earned, redeemed, expired, adjusted and reversed. The rules cover balance, expiry, minimum redemption, the maximum share of an order payable with points, the point-to-rupee rate, and exclusions (products, offers that cannot be combined).
- Points are redeemed at request, quotation or order time as a **separate discount line**. They are reserved when the order is accepted, consumed at delivery (recommended), and returned if the order is cancelled. All calculation is server-side, totals are never negative, and it is safe when two redemptions happen at once.
- **Customer:** balance, history, "points you will earn" on product and cart, and a redeem toggle at request review.
- **Admin:** rules, manual adjustments with a reason, reports, abuse checks and an audit trail. Points show on quotations and invoices as a separate discount line.

## 33. Customer transparency and trust *(Master Spec §31)*

- One **Order Tracker** page per order shows the full journey: Order accepted → Manufacturing stages (or Ready in stock) → Dispatch → In transit → Reached → Delivered → Review. It includes media, documents, estimated dates and delays with reasons, in plain English or Hindi.
- A public **trust section** on the Home and About pages, with every number admin-managed or computed from real data and never fabricated:
  - established year and years of experience
  - happy customers and machines delivered, computed from delivered orders, with an admin override that must carry an "as of" date
  - average rating from approved verified reviews
  - states and cities served
  - office/factory address with a map, phone, email, working hours and a directions link
  - real, approved testimonials, and delivery photos shown only with customer consent
  - certifications and awards where factually applicable
- Count-up animation on the stats, which is skipped under reduced motion.

## 34. Modern UI, graphics and animation *(Master Spec §32)*

- A modern, warm, farmer-friendly identity: illustrated or photographic farmers, tractors, machines and fields; poster-style offer and campaign banners; bold typography; rounded cards.
- Only original, licensed or admin-uploaded artwork. No copyrighted characters or unlicensed images.
- An art-direction brief covers the palette, illustration style, hero concept, poster templates (festival offer, new arrival, catalogue, testimonial), empty-state illustrations and the icon set.
- Admins manage hero banners and posters (upload, schedule, language variants).
- **Animations:** hero entrance, scroll reveals, card feedback, page transitions, the animated tracker progress, stat count-ups and skeleton loaders; optional Lottie or SVG.
- **Animation rules:** transform and opacity only, 150–400 ms, never blocking content, honouring reduced motion, within the performance budget (LCP ≤ 2.5 s on a mid-range Android phone over 4G, CLS ≤ 0.1).

## 35. Mobile-first, app-like experience *(priority; Master Spec §33)*

- **Native-app feel:**
  - a bottom tab bar (Home, Products, Cart/Requests, Orders/Tracking, Account) and sticky action bars
  - bottom sheets for filters and the configurator
  - swipeable galleries and pull-to-refresh on lists
  - smooth transitions, and skeletons instead of spinners
- **Device handling:**
  - safe areas (`viewport-fit=cover` and safe-area insets) and dynamic viewport units
  - keyboard-aware forms, no horizontal scroll at 320 px, and 44×44 px touch targets
  - primary actions in the thumb zone, notch and landscape handling, and a status-bar theme colour for light and dark
- **Installable PWA:** manifest, icons, splash, an offline fallback page, cached static assets and a non-intrusive "Add to Home Screen" prompt. Push notifications are a future extension.
- **Admin panel on mobile:** usable for urgent work: view an order, call the customer, log a call, update tracking, and upload a photo or video from the camera.
- **Testing:** test plans for iOS Safari, Android Chrome, small phones (320–360 px), notched devices and slow networks.
