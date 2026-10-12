# FarmYantra — Master Specification & Delivery Roadmap

| | |
|---|---|
| **Document** | Product, functional and technical specification for the FarmYantra platform |
| **Version** | 2.1: adds the cart, lead times, order editing, manufacturing tracking, shipping and drivers, order documents and offline payments, delivery confirmation, reward points, the order tracker, trust content, the visual identity and the mobile/PWA experience (§23–§34). Built on the "Agricultural Equipment E-Commerce Website — Requirements Specification v1.1" |
| **Date** | 12 October 2026 |
| **Repositories** | `farmyantra_backend` (API), `farmyantra_website` (customer e-commerce site), `farmyantra_admin` (team admin panel) |
| **Reference architecture** | Raddiwalla: same folder layout, DB conventions, auth/RBAC model and admin component kit |
| **Status** | Phases 0–3 are implemented in the three repositories. Phases 4–8 are planned (see §20). Everything in §23–§34 is **specified, not yet built**. |

> **How to read this document.** §1–§12 describe *what* the product does, written for business, design and QA readers.
> §13–§19 describe *how* it is built, for engineers. §20–§22 are the roadmap, the acceptance checklist and the open decisions.
> §23–§34 (Part B, added in v2.1) specify the order-fulfilment, trust and mobile features. They are appended rather than
> inserted, so existing section numbers stay stable. Where an earlier section changes, it says so and points to Part B.
> §34 is the **single status reference** for every entity; any other file that lists statuses must match it.
> Section numbers in code comments (for example `// §10.2`) refer to this document.

---

## Table of contents

1. [Overview](#1-overview)
2. [How a customer can ask: call-back, quotation or both](#2-how-a-customer-can-ask-call-back-quotation-or-both)
3. [Users, roles and permissions](#3-users-roles-and-permissions)
4. [Website (customer side)](#4-website-customer-side)
5. [Products, configuration and pricing](#5-products-configuration-and-pricing)
6. [Offers, bundles and coupons](#6-offers-bundles-and-coupons)
7. [Enquiry workflow](#7-enquiry-workflow)
8. [Quotations](#8-quotations)
9. [Orders](#9-orders)
10. [Reviews](#10-reviews)
11. [Catalogues, content and settings](#11-catalogues-content-and-settings)
12. [Notifications](#12-notifications)
13. [Architecture](#13-architecture)
14. [Data model](#14-data-model)
15. [API contract](#15-api-contract)
16. [Security and privacy](#16-security-and-privacy)
17. [Non-functional requirements](#17-non-functional-requirements)
18. [Configuration, environments and deployment](#18-configuration-environments-and-deployment)
19. [Testing strategy](#19-testing-strategy)
20. [Delivery roadmap](#20-delivery-roadmap)
21. [Acceptance checklist](#21-acceptance-checklist)
22. [Decisions taken and open questions](#22-decisions-taken-and-open-questions)

**Part B: fulfilment, trust and mobile (v2.1)**

23. [Cart: "My Request List"](#23-cart-my-request-list)
24. [Fulfilment types and lead times](#24-fulfilment-types-and-lead-times)
25. [Order acceptance, editing, creation and versions](#25-order-acceptance-editing-creation-and-versions)
26. [Manufacturing tracking](#26-manufacturing-tracking)
27. [Shipping, drivers and manual tracking](#27-shipping-drivers-and-manual-tracking)
28. [Order documents and offline payments](#28-order-documents-and-offline-payments)
29. [Delivery confirmation, delivery issues and verified reviews](#29-delivery-confirmation-delivery-issues-and-verified-reviews)
30. [Reward points](#30-reward-points)
31. [Order tracker and public trust content](#31-order-tracker-and-public-trust-content)
32. [Visual identity, art direction and motion](#32-visual-identity-art-direction-and-motion)
33. [Mobile-first, app-like experience and PWA](#33-mobile-first-app-like-experience-and-pwa)
34. [Status reference](#34-status-reference)

---

## 1. Overview

FarmYantra is a mobile-first **enquiry-led e-commerce** platform for agricultural machinery: tillers, rotavators, harvesters, sprayers, implements and spares. It looks and browses like an online shop, with categories, filters, product pages, offers, a server-side cart called **"My Request List"** (§23), and an account area. It does **not** take online payment in the initial release. Instead, the customer chooses how they want the team to respond:

* **Call me back.** The sales team phones the customer, answers questions and closes the deal by phone.
* **Send me a quotation.** The team prepares a written, itemised, GST-correct PDF quotation that the customer can accept or decline online.
* **Both.** The customer wants a call *and* a written quotation.

A customer can switch between these at any time while the enquiry is open (§2.3). After the call or the quotation, an **order** is created. The team can accept it as-is, edit it with a versioned, customer-confirmed revision, or create it directly on the customer's behalf (§25). The customer then follows the order on one tracker page (§31): manufacturing (§26), dispatch and delivery (§27), documents and payments (§28), and delivery confirmation (§29). Delivered orders earn reward points (§30).

### 1.1 Goals

1. Present machines professionally, with photos, videos, documents and an optional 3D viewer.
2. Make discovery and configuration easy on low-end Android phones on 3G/4G.
3. Allow only admin-approved customisation: colours, add-ons and text personalisation.
4. Show transparent "Starting from ₹X" and indicative configured prices, always recomputed on the server.
5. Capture **qualified** enquiries that carry the exact configuration, price snapshot and the customer's preferred response type.
6. Give the sales team one queue for call-backs and quotation requests, with SLAs, call logging, assignment and an audit trail.
7. Produce branded quotation and catalogue PDFs in English and Hindi.
8. Give customers a dashboard of enquiries, quotations, orders, notifications, saved products and reviews.
9. Run on configurable role-based access, so the business can grow its team without code changes.
10. Be honest about time: show realistic, clearly labelled lead-time estimates and keep them up to date (§24, §26).
11. Make the whole journey after the order visible, with real media, documents and dates (§31).
12. Feel like a native app on phones, and be installable as a PWA (§33).

### 1.2 Out of scope for the initial release

* Online payment and checkout. Offline payments are **recorded** by the team (§28.4), and the data model has extension points for a gateway later (Phase 8).
* GPS or live vehicle tracking. Shipment tracking is **manual**: the team phones the driver and records events (§27).
* Push notifications. The PWA reserves an extension point (§33.4) but does not send push in this release.
* WhatsApp and live chat. The enquiry message thread (§7.6) is designed so it can be extended into chat.
* Dealer/partner portals and multiple warehouses. These are covered by Phase 8 in §20.

---

## 2. How a customer can ask: call-back, quotation or both

This is the core business flow. Every enquiry (also called a *request*) carries a `request_type`. A request can hold **one or many items** submitted from the cart (§23):

| `request_type` | Customer sees | Team action | Typical outcome |
|---|---|---|---|
| `callback` | "Request a call-back. Our expert will call you within 24 hours." | Phone the customer, then log every attempt (§7.4) | The deal is closed by phone, or the team creates a quotation after the call |
| `quotation` | "Get a written quotation. We will email an itemised PDF quotation." | Prepare and send a quotation (§8) | The customer accepts online and an order is created |
| `both` | "Call me and send a written quotation." | Both of the above: the call SLA applies **and** a quotation is expected | The call clarifies needs, then the quotation is sent and accepted |

`both` appears in the call-back queue (with the SLA) **and** in the "awaiting quotation" count. Logging a `connected` call does not close the quotation expectation.
### 2.1 Call-back flow

1. The customer browses, optionally configures one or more machines, and adds them to **My Request List**, the cart (§23). It is stored on the server under a guest token, so no login is needed, and it is merged into the account at login.
2. On My Request List they choose **"Call me back"**, a preferred call window (`preferred_call_window`: morning / afternoon / evening / anytime) and an optional message.
3. If not logged in, they verify their phone with Firebase OTP and complete their name and email. The list is kept.
4. The server re-validates and re-prices every cart item (§23.3), stores an immutable per-item snapshot of the configuration, prices and lead-time estimate, and creates `ENQ-YYYY-NNNNNN` with `request_type = callback`. It sets `callback_due_at = now + commerce.callback_sla_hours` (24 by default).
5. The team sees the enquiry at the top of **Enquiries → Overdue call-backs** once it is past due. Assignment notifies the assignee.
6. The sales rep calls and logs the outcome: `connected`, `no_answer`, `busy`, `switched_off`, `wrong_number` or `call_back_later`. A `call_back_later` or no-answer outcome can set the next call time.
7. After talking, the rep either:
   * moves the enquiry to `contacted` → `accepted` and **creates a quotation** (the enquiry switches to quotation mode automatically when the quotation is sent), or
   * **creates the order directly** on the customer's behalf from the enquiry (§25.3). The customer confirms it online (or, if enabled, the team records the phone confirmation with a reason; D7), or
   * closes or rejects it with a reason.
8. The customer sees each status change in their dashboard and receives an email, apart from internal-only notes.

### 2.2 Quotation flow

1. Steps 1–3 are the same as above, but the customer chooses **"Send me a quotation"**.
2. The enquiry is created with `request_type = quotation`. There is no call SLA, but the dashboard shows "awaiting quotation" counts.
3. A team member reviews it (`under_review`), asks for clarification if needed (`clarification_required`, which requires a reason the customer sees), then accepts it.
4. **Create quotation.** The draft is pre-filled from the enquiry snapshot: lines, add-ons, colours, personalisation and offer discounts. The team adjusts prices, delivery charges, discounts, terms and validity. **Any change to a price needs a written reason**, which is audited.
5. **Send.** This freezes the version, generates the PDF, emails it to the customer with the PDF attached, and moves the enquiry to `quotation_sent`.
6. The customer opens **Account → Quotations**, downloads the PDF and either **accepts** (ticks the terms; the system stores version, timestamp, IP and user agent) or **declines** with an optional reason.
7. Acceptance moves the enquiry to `customer_accepted`. If `commerce.acceptance_creates_order = true` (the default), an order is created in `pending_confirmation` (§9, §25). The team then **accepts it as-is** or **edits it** with a new order version, after checking stock, lead time and payment terms.
8. Any revision creates a **new version** (v2, v3…). Earlier versions become `superseded` and need fresh acceptance.
9. Unaccepted quotations expire at `valid_until` through a nightly job. A reminder email goes out `quotation.expiry_reminder_days` before expiry.

### 2.3 Switching between the two

| Who | How | Rules |
|---|---|---|
| Customer | **"Also send me a written quotation"** / **"Please call me too"** buttons on an open enquiry in their dashboard | Allowed while the enquiry is open. The customer can only **add** a response type: `callback` → `both` or `quotation`, and `quotation` → `both`. They cannot remove one. Notifies the assignee or the team. |
| Team | **Wants** selector on the enquiry detail page | Any value (`callback`, `quotation`, `both`), audited (`enquiry.request_type_changed`). Moving to `callback` or `both` sets a new `callback_due_at`. Typical use: the customer asked on the phone for a written quote. |
| System | Sending a quotation | The enquiry becomes `quotation_sent` whatever the original type, because a written quote now exists. |

### 2.4 Contact form (no account)

The `/contact` page creates a **contact message**, not an enquiry. It is meant for general questions. Contact messages appear in the admin under **Sales → Contact messages** with `new`, `in_progress` and `closed` statuses. A product-specific request always goes through the enquiry flow so it carries a configuration and price snapshot.

---

## 3. Users, roles and permissions

### 3.1 Actors

| Actor | Authentication | Can |
|---|---|---|
| Guest | none | Browse, search, filter, configure, compare, build a cart (server-side, guest token), see lead-time estimates, download public catalogues/brochures, read reviews, contact the business |
| Customer | Firebase phone OTP, then profile (name and email required) | All guest actions, plus submit requests from the cart, reply to clarifications, add a response type, accept or decline quotations, confirm or decline order revisions, follow the order tracker, download shared documents, confirm delivery or report issues, earn and redeem reward points, save products, write reviews (purchase required), manage profile and language |
| Team member | Email and password (bcrypt, locked out after 5 failures) | Only the admin modules their role and overrides allow |
| Driver | **none**: drivers never log in in this release | Nothing. Drivers are master records that the team manages (§27.2) |
| Super Admin | Same as team member | Everything, including granting privileged permissions |

### 3.2 Permission model (same model as Raddiwalla)

* Permission strings are `admin:<feature>:<read|write>`. `write` implies `read`.
* **Effective permissions** = the role's permissions, then per-member overrides (`member_access` rows: none, read, or read+write per feature). A Super Admin has every permission.
* The API checks permissions on **every** resolver (`adminQuery(feature, …)` and `adminMutation(feature, …)`). The admin UI hides what the member cannot use, but the server check is what enforces it.
* **Privileged permissions** can only be granted by a Super Admin: `admin:team_members:write`, `admin:settings:write`, `admin:pricing:write`, `admin:driver_identity:read` (and therefore `:write`), and `admin:rewards:write`.
* Changing a role or a member's access bumps `token_version`, which signs the member out everywhere so the new permissions apply immediately.
* The last active Super Admin cannot be demoted, deactivated or deleted.

### 3.3 Feature catalogue

| Feature key | Area | Write? |
|---|---|---|
| `dashboard` | Dashboard | – |
| `products` | Products, categories, media, documents, 3D, related products | ✔ |
| `product_translations` | English/Hindi product text | ✔ |
| `pricing` | Price display, base/MRP, tax rule on products; tax rules | ✔ (privileged) |
| `customisation` | Customisation switches, colours, add-ons, personalisation, placements | ✔ |
| `enquiries` | Enquiries, call-backs, contact messages, messages, assignment | ✔ |
| `customers` | Customer records and notes | ✔ |
| `quotations` | Draft, send, revise, cancel, convert to order | ✔ |
| `orders` | Orders: accept, create on behalf, propose/withdraw revisions, cancel, complete, mark delivered with reason (§25, §29) | ✔ |
| `carts` | View customer carts and abandoned carts; log follow-ups (§23.6) | ✔ |
| `manufacturing` | Stage templates, manufacturing jobs, stage updates and media, estimate revisions, delays (§26) | ✔ |
| `shipments` | Shipments, shipment events, driver/vehicle changes on a shipment (§27) | ✔ |
| `drivers` | Driver master: contact and vehicle details, vehicle photo (§27.2) | ✔ |
| `driver_identity` | Driver ID photo and licence (private storage) (§27.2) | ✔ (privileged, including read) |
| `order_documents` | Order, stage and shipment documents and their versions (§28) | ✔ |
| `invoices` | Tax invoices, proforma invoices, credit notes, invoice templates and numbering settings; email PDFs to customers (§28.3) | ✔ |
| `payments` | Record and void offline payments and refunds (§28.4) | ✔ |
| `delivery_issues` | Delivery confirmation follow-up and delivery issue cases (§29) | ✔ |
| `rewards` | Reward rules, campaigns, manual adjustments, abuse review (§30) | ✔ (privileged) |
| `banners` | Hero banners and posters, schedules, language variants (§32.4) | ✔ |
| `reviews` | Verification and moderation | ✔ |
| `promotions` | Offers, coupons, cart preview | ✔ |
| `catalogues` | Catalogue PDF generation and publishing | ✔ |
| `content` | Website pages, legal, guides, FAQs, trust content (stat overrides, certifications, delivery photos) (§31.3) | ✔ |
| `reports` | Reports | – |
| `settings` | Site settings and email templates | ✔ (privileged) |
| `team_members` | Members and roles | ✔ (privileged) |
| `audit_logs` | Audit log | – |
| `notifications` | Admin notification bell | ✔ |

### 3.4 Pre-configured roles (seeded, editable)

| Role | Purpose | Main permissions |
|---|---|---|
| Sales Manager | Owns the sales pipeline | enquiries, customers, quotations, orders, carts, delivery_issues: write; products, promotions, reports, dashboard, manufacturing, shipments, order_documents, payments, rewards: read |
| Sales Representative | Works assigned call-backs and quotations | enquiries, quotations: write; customers, products, carts, orders, dashboard: read |
| Product / Content Manager | Catalogue and website | products, product_translations, customisation, catalogues, content, reviews, banners: write; dashboard: read |
| Production Supervisor *(new)* | Runs the workshop | manufacturing: write; orders, products, dashboard: read |
| Logistics Coordinator *(new)* | Dispatch and delivery | shipments, drivers, order_documents, delivery_issues: write; orders, manufacturing, customers, dashboard: read |
| Accounts Executive *(new)* | Bills and money | invoices, payments, order_documents: write; orders, customers, rewards, reports, dashboard: read |

`driver_identity` and `rewards:write` are deliberately absent from every seeded role. A Super Admin grants them to named people.

---

## 4. Website (customer side)

### 4.1 Design direction

* **Brand:** deep field green `#1F4D2B` (primary) and harvest amber `#E8A317` (accent) on warm off-white, with high-contrast text. The look is modern e-commerce with large product imagery, sticky "Add to request list" on mobile, and clear price labels. The full art-direction brief is in §32.
* **Typography:** system UI stack with a Devanagari fallback for body text, so Hindi renders without web-font downloads. A bold display face for headings is an open decision (§22.3).
* **Mobile first:** 320 px minimum, 360 px design baseline, an app-like shell with a bottom tab bar, bottom sheets, safe-area handling and 44×44 px touch targets (§33).
* **Performance budget:** see §17.1. The 3D viewer and Firebase SDK are lazy-loaded only when needed.
* **Languages:** English and Hindi throughout. The language toggle is in the header, remembered per device and stored on the customer profile.

### 4.2 Pages and routes

| Route | Page | Notes |
|---|---|---|
| `/` | Home | Scheduled hero banners and posters (§32.4), featured categories, featured and new products, live offers, benefits, **trust section** (§31.3), featured verified reviews, catalogue CTA |
| `/shop`, `/category/:slug` | Shop | Search, filters (category, price, power HP, fuel, capacity, availability, customisable, rating), sorting, pagination, facet counts |
| `/product/:slug` | Product | Gallery (images, video, YouTube/Vimeo embeds, colour-linked images; swipeable), optional 3D viewer, key specs, full spec table, configurator (a bottom sheet on mobile), live indicative price, **lead-time badge** ("Ready to dispatch" / "Made to order: about X–Y days", updated by the chosen options) (§24), **"points you will earn"** (§30), documents, reviews, related/accessories/alternatives, compare, save, add to request list |
| `/compare` | Compare | Up to 4 products side by side, with highlighted differences |
| `/offers` | Offers | Live offers with banners and coupon hints |
| `/catalogues` | Catalogues | Published catalogue PDFs per category and language |
| `/guides`, `/guides/:slug`, `/legal/:slug` | Content | Buying guides, FAQ, terms/privacy/refund/shipping |
| `/about` | About | Company story plus the **trust section**: established year, computed stats with "as of" dates, states served, address with map and directions, certifications, delivery photos (§31.3) |
| `/contact` | Contact | Contact form (§2.4) and business details |
| `/cart` | My Request List | Server-side cart (§23): items with configuration, quantity, per-item fulfilment and lead time, combined estimate, validation warnings, coupon, points redemption toggle, **call-back / quotation / both choice**, preferred call window, delivery details, delivery preference (ship together / ship when ready), consent, submit. `/enquiry` redirects here |
| `/login` | Login | Phone, then OTP, then profile completion |
| `/account` | Overview | Counts, latest activity |
| `/account/enquiries[/:id]` | Requests | Status timeline, items, messages, reply to clarification, add a response type, cancel |
| `/account/quotations[/:id]` | Quotations | Versions, PDF download, accept/decline, points discount line |
| `/account/orders` | Orders | List with status chips and the combined estimate |
| `/account/orders/:id` | **Order tracker** (§31.1) | The full journey on one page: order accepted → manufacturing stages or ready in stock → dispatch → in transit → reached → delivered → review. It includes media, estimated vs revised dates, delays with reasons, shipments with limited driver/vehicle details, documents, payments, pending revision to confirm, delivery confirmation and issue cases |
| `/account/rewards` | Reward points | Balance (available / pending / reserved), history, expiring soon, how to earn (§30) |
| `/account/notifications`, `/saved`, `/reviews`, `/profile` | Account | Notifications, saved products, my reviews, profile and language |
| `/offline` | Offline fallback | Served by the service worker when there is no connection (§33.3) |

### 4.3 My Request List (the cart)

> **Changed in v2.1.** The browser-only enquiry list is replaced by a **server-side cart**, specified in full in §23. The rules below still apply.

* Each line is a product plus a configuration plus a quantity. The same tiller in two colours is two lines, and the same configuration added twice can be merged or kept apart.
* Every change is validated and priced on the server. The response gives validated lines, offer discounts, points preview, GST, the total and the lead-time estimate. The client **never** computes final money or dates.
* Invalid lines are shown with the reason and excluded from submission. Examples: the product was unpublished, an option was disabled, the price changed, or stock is short (§23.3).
* Coupons are validated on the server with a clear reason when they don't apply.
* Submission uses an idempotency key, so a double tap creates one request.

### 4.4 Product page details

* **Price labels.** `fixed` shows "₹X". `starting_from` shows "Starting from ₹X". `on_request` shows "Price on request". The configured total is labelled "Indicative price (excl. GST)", and the final price is always the quotation.
* **Configurator.** It shows only enabled options. Colour swatches switch the gallery to images linked to that colour. Add-ons are grouped, show requires/excludes rules, and each has a quantity stepper within its limits. Personalisation is a text field with allowed characters and a placement picker. The server validates everything again (`previewConfiguration`).
* **3D viewer.** `<model-viewer>` loads on demand with a poster image and falls back to the gallery when WebGL is unavailable or the network is slow.
* **Reviews.** Verified-buyer badge, rating breakdown, photos and videos (approved only), pagination.

---

## 5. Products, configuration and pricing

### 5.1 Product record

* **Core:** slug, SKU, model, brand, category, status (`draft`, `published`, `archived`), warranty months, minimum and maximum order quantity.
* **Fulfilment (v2.1, §24):** `fulfilment_type` (`in_stock` | `made_to_order`), stock quantity and dispatch window (in stock), lead-time window and manufacturing stage template (made to order). `availability` (`in_stock`, `made_to_order`, `out_of_stock`, `coming_soon`, `discontinued`) is now **derived** from fulfilment type and stock, except `coming_soon` and `discontinued`, which stay manual overrides (§24.1). The old single `lead_time_days` column is migrated into the window and then dropped.
* **Filterable attributes:** power HP, fuel type, capacity (value and unit), weight, dimensions, intended uses, tags.
* **Text, per language (`product_translations`):** name, short description, description, key benefits, intended use, in-the-box items, warranty text, service text, lead-time text, SEO title and description.
* **Specs:** grouped label/value/unit rows (bilingual). "Key" specs appear on cards and in comparison.
* **Media:** images (WebP with thumbnails; 2 MB limit), videos (50 MB limit), YouTube/Vimeo embeds. Media can be ordered, set as primary, hidden, given alt text and linked to a colour.
* **Documents:** brochure, manual, safety, warranty and spec sheet (PDF), per language, public or staff-only.
* **3D:** one active GLB per product with camera orbit, limits and exposure. Off until `viewer_3d_enabled`.
* **Relations:** related, accessory and alternative.
* **Reward overrides (v2.1, §30):** optional fixed points per unit, and an "excluded from points" flag.
* **Publishing checklist (blocking):** English name and short description, category, at least one published image, a base price unless the price is on request, and a **fulfilment type with a valid window** (§24). A missing Hindi translation is a warning only.

### 5.2 Customisation (off by default)

Master switch `customisation_enabled`, plus three sub-switches:

| Option | Rules |
|---|---|
| Colours | Code, bilingual name, hex, preview image, price delta (can be negative), one default, active/inactive |
| Add-ons | Type (accessory, attachment, upgrade, spare part, service, package), pricing (`fixed`, `per_unit`, `on_request`), minimum and maximum quantity, required, "replaces a standard component", group, **requires** and **excludes** rules between add-ons |
| Personalisation | Bilingual label and help text, minimum and maximum length, allowed-character class, price, required, plus admin-defined **placements** with a price delta and preview image |

Every colour, add-on, personalisation and placement can also carry `lead_time_impact_days` (≥ 0; for example, a custom colour adds 3 days). Impacts are **added** to the product's made-to-order window (§24.3). For an in-stock product, any option with a positive impact turns that cart line into made-to-order. The website explains why.

### 5.3 Pricing engine (`services/pricingHelper/pricingEngine.mjs`, pure and unit-tested)

```
unit_price  = base_price + colour_delta + placement_delta + personalisation_price
            + Σ(upgrade add-ons that change base price)
line_price  = unit_price × qty + Σ(fixed add-ons × addon_qty) + Σ(per_unit add-ons × addon_qty × qty)
on_request  = base on_request OR any selected on_request add-on → line flagged, excluded from totals
```

* All money is **integer paise**. There are no floats anywhere.
* Every selection is validated: the option exists and is active, quantity limits, requires/excludes, required add-ons, personalisation length and character set, placement validity, and product min/max quantity.
* The result has per-line breakdown rows that the website renders as "what you pay for".

### 5.4 Tax

* Tax rules: name, HSN code, rate in basis points (1200 = 12 %), type `GST` or `NONE`, whether it applies to add-ons, one default rule.
* Product → its own tax rule, otherwise the default rule.
* Quotations split GST into **CGST + SGST** when the delivery state equals the business state, otherwise **IGST** (`quotationMath.mjs`). Rounding is per line, half-up to the paise.
* Website prices are shown **excluding GST**, with tax shown as a separate line.

---

## 6. Offers, bundles and coupons

### 6.1 Types

| Type | `value` meaning | Example |
|---|---|---|
| `percentage` | basis points; optional `max_discount_paise` cap | 7 % off, max ₹5,000 |
| `fixed_amount` | paise | ₹2,000 off |
| `bundle_price` | paise for `bundle_quantity` units | 2 sprayers for ₹7,500 |
| `buy_x_get_y` | `buy_quantity` and `get_quantity` | Buy 3 get 1 free (cheapest units free) |

**Scope** is the whole cart, selected products, or selected categories. **Conditions** are minimum spend, minimum quantity, start and end, total usage limit and per-customer limit. Other settings: coupon required, stackable, priority (lower runs first), and whether to show on the Offers page.

### 6.2 Engine rules (`promotionEngine.mjs`, pure and unit-tested)

1. Collect live offers (active and within their dates) and the coupon's offer, if any.
2. Sort by priority. Apply each eligible offer. A non-stackable offer cannot combine with another, and the engine reports "Cannot be combined with another offer already applied".
3. The discount is allocated across eligible lines in proportion, so line totals and GST stay correct.
4. A discount never exceeds the eligible amount, and totals never go negative.
5. Usage is **reserved** when an enquiry is submitted, **confirmed** when an order is created, and **released** on cancellation or rejection.
6. The admin **Test a cart** panel runs the same engine.
7. **Order of discounts (v2.1):** offers and coupons first, then reward points (§30.4) on the remaining pre-tax amount, then GST. Whether points combine with a given offer is controlled per offer (`allow_points`, default true) and globally (`rewards.combinable_with_offers`).

### 6.3 Coupons

Coupons can only be issued for offers that need a code. Codes are case-insensitive and unique. They can be created from a list or generated as `PREFIX-XXXXXX` with an optional per-code usage limit, and individually deactivated.

---

## 7. Enquiry workflow

### 7.1 Statuses

| Status | Meaning | Set by |
|---|---|---|
| `submitted` | New | Customer |
| `under_review` | Team is looking at it | Team / system (customer replied) |
| `contacted` | Customer was reached by phone | Team |
| `clarification_required` | Waiting for the customer (reason required, visible to customer) | Team |
| `accepted` | Team will quote / proceed | Team |
| `quotation_sent` | A quotation version was sent | System |
| `customer_accepted` / `customer_declined` | Customer decision on the quotation | System |
| `converted_to_order` | Order created from a quotation acceptance or by the team on the customer's behalf (§25) | System |
| `rejected` | Team cannot serve it (reason required) | Team |
| `cancelled` | Customer withdrew (reason required) | Customer |
| `closed` | Done / archived | Team |

### 7.2 Transitions

These are enforced by `enquiryStateMachine.mjs`, which is pure and unit-tested:

```
submitted ─► under_review ─► contacted ─► accepted ─(send quote)─► quotation_sent ─► customer_accepted ─► converted_to_order ─► closed
    │             │              │           ▲                          │
    │             ▼              ▼           │ (revise)                 └─► customer_declined ─► accepted (re-quote) / closed
    │      clarification_required ◄──────────┘
    ▼
cancelled (customer, until a quotation is accepted)     rejected (team)     closed (team)
```

* Team members can only move to the statuses listed for the current status. The admin UI shows exactly those.
* System-only statuses cannot be set by hand.
* `rejected` and `closed` can be re-opened to `under_review`. `cancelled` is terminal.
* When a customer replies to a `clarification_required` enquiry, it moves back to `under_review` automatically.
* **v2.1, orders created on behalf (§25.3):** the system may move an enquiry to `converted_to_order` from `under_review`, `contacted`, `accepted`, `quotation_sent` or `customer_accepted`. If that order is cancelled **before the customer ever confirmed it**, the enquiry returns to `accepted` (system transition) so the team can continue. After confirmation, the enquiry stays `converted_to_order` until it is `closed`.
* `request_type` does not change the status machine. `callback` and `both` additionally carry the call SLA (§7.4).

### 7.3 Snapshot

At submission each `enquiry_items` row stores the product name in both languages, the SKU, the selection, the price breakdown, the line totals, the applied offers and the tax rate. Later product edits **never** change a submitted enquiry.

### 7.4 Call-back handling

* `callback_due_at` (the SLA, for `request_type` `callback` and `both`), `preferred_call_window`, `last_contacted_at` and the logged call attempts in the timeline.
* **Log call:** outcome, note and optional next call time. A `connected` outcome clears the due time. Other outcomes keep it or move it to the next call time.
* The queue filter **Overdue call-backs** sorts by due time. The dashboard shows overdue counts.

### 7.5 Assignment

The enquiry can be assigned to any active member with `enquiries:read`. The **assignable members** list is available to anyone who can read enquiries. Assignment notifies the assignee in the bell and is audited.

### 7.6 Messages

Each message is either **customer-visible** or **internal**. Customer-visible messages trigger an email and an in-app notification. Unread counters exist on both sides. The thread is the basis for future chat.

---

## 8. Quotations

* **Numbering:** `QTN-YYYY-NNNNNN` per quotation. Versions are `v1`, `v2`, …. Enquiries use `ENQ-` and orders `ORD-`. Numbering is gap-free per year (`document_sequences`).
* **Draft** (editable): lines (description, configuration text, quantity, unit price, discount, tax rate, HSN), delivery charge, extra discount, validity date, payment and delivery terms, general terms, notes to the customer, internal notes. Prices are pre-filled from the enquiry snapshot. **A price change versus the snapshot requires a reason**, which is stored on the line and audited.
* **Maths** (`quotationMath.mjs`, unit-tested): line taxable = qty × unit − discount; tax per line; CGST/SGST or IGST split; grand total; amount in words (Indian numbering).
* **Send:** freezes the version, renders the PDF (pdfkit, A4, branded, bilingual where translations exist), emails the customer with the PDF attached, notifies in-app, and moves the enquiry to `quotation_sent`.
* **PDF contents:** business header with logo, GSTIN and address; customer and delivery details; quotation number, version, date and validity; itemised lines with configuration (colour, add-ons, personalisation), key specs and weight where available; tax breakdown; totals; terms; and an acceptance note.
* **Customer decision:** accept (terms checkbox; stores version, timestamp, IP and user agent in `quotation_decisions`) or decline (optional reason). The team is notified.
* **Revise:** creates the next draft version from the latest one. The previous version becomes `superseded` once the new one is sent.
* **Cancel:** with a reason. **Expire:** a nightly job. **Reminder:** a daily job, N days before expiry.
* **Convert to order:** manual (when the customer accepted by phone, for example) or automatic on acceptance (§9).
* **PDF access:** `/files/quotations/:versionId` is authorised for the owning customer, or for staff with `quotations:read` (`?scope=admin`). PDFs are stored privately and never under a public URL.

---

## 9. Orders

> **Changed in v2.1.** This section summarises orders. The full rules are in §25 (acceptance, editing, creation, versions), §26 (manufacturing), §27 (shipments), §28 (documents and payments) and §29 (delivery confirmation). Statuses are defined once in §34.

* **Sources:** an accepted quotation version (`quotation_acceptance`), or created by the team on the customer's behalf (`admin_created`, §25.3). An order holds **many items**, each with its own configuration snapshot and fulfilment type. Lines and totals are copied from the source, so an order never silently re-prices. Every price change is a new **order version** (§25.4).
* **Statuses (header):** `pending_confirmation` / `awaiting_customer_confirmation` → `confirmed` → `in_production` → `ready_to_dispatch` → `partially_dispatched` → `dispatched` → `partially_delivered` → `delivered` → `completed`, plus `cancelled`. After `confirmed`, the header status is **rolled up by the system** from item fulfilment and shipments (§25.6). The team sets only `confirmed`, `cancelled` and `completed`, and can mark a shipment delivered with a reason (§29.3).
* **Fields:** the existing ones (customer-visible notes, internal notes), plus the combined estimate and revised dates (§24), delivery preference, points redeemed (§30), and payment status (`not_recorded`, `partial`, `paid`, `refunded`). Payment status is computed from recorded offline payments (§28.4), never typed in. The old free-text tracking reference is replaced by shipments (§27).
* Each change adds an `order_events` row, sends a customer notification and email where customer-visible, and writes to the audit log. Confirming an order confirms reserved offer usage and **reserves redeemed points**. Cancelling releases both.
* A **confirmed delivery** (§29) makes the customer's review of those products **verified automatically** (§10). Moderation still applies.

---

## 10. Reviews

* **Eligibility:** a logged-in customer with an order containing the product (not cancelled). One review per product per customer. Rate-limited.
* **v2.1, delivery-verified reviews (§29.5):** when the order item was **delivered and confirmed** (`received_ok`, `received_with_issues`, or `admin_marked_delivered`), the review is created with `verification_status = verified` and `verification_source = delivery_confirmation`. No manual verification is needed. The customer is invited by email and in the dashboard. Other reviews keep the manual verification below (`verification_source = manual`).
* **Content:** rating 1–5, title, text, up to 4 photos or videos (private until approved), display name and language.
* **Two separate decisions:**
  1. **Verification:** is this customer an eligible buyer? Actions: `verify` or `reject_verification`. The admin sees the matching order.
  2. **Moderation:** is the content acceptable? Actions: `approve`, `request_changes`, `hide` or `reject`. Everything except approve needs a reason. Flags: spam, abusive, irrelevant, unsafe media, off-topic.
* **Public only when verified AND approved.** On approval the private media is copied to public storage. The product rating average and count are recomputed.
* The customer is notified of the outcome and can see the status and any feedback under **Account → My reviews**.

---

## 11. Catalogues, content and settings

### 11.1 Catalogue PDFs

* Generate for all products or one category, in English or Hindi, with or without prices. The job runs in the background (`queued → generating → ready | failed`).
* Each generation is an immutable dated version (`YYYY.MM.DD-HHmm`). Publishing a version makes it the target of the stable link `/files/catalogues/latest?lang=en&category=<slug>`.
* Catalogues never include internal notes, supplier costs or staff-only documents.

### 11.2 Website content

Content pages have the types `page`, `legal`, `guide` and `faq`. Each has a bilingual title, summary, body and SEO fields, a cover image, draft or published status and a sort order. Changes are audited.

### 11.3 Settings sections

| Section | Highlights |
|---|---|
| `business` | Name, legal name, GSTIN, address, **state (decides CGST/SGST vs IGST)**, phone, email, WhatsApp number (stored for later), support hours, logo |
| `commerce` | Show prices, tax display, default language, **callback SLA hours**, **acceptance creates order**, enquiry consent text |
| `quotation` | Validity days, reminder days, payment/delivery terms, general terms, footer, accent colour |
| `catalogue` | Cover title and intro |
| `home` | Hero title, subtitle, image and video; benefit tiles |
| `seo` | Default title, description and OG image |
| `features` | Reviews, compare, 3D viewer, WhatsApp (off) |
| `social` | Facebook, Instagram, YouTube, X, LinkedIn |
| `email_templates` | Per-event overrides of the built-in bilingual templates |
| `fulfilment` *(v2.1)* | Default dispatch window for in-stock items; default transit days and per-state transit ranges; `allow_backorder_as_mto` (an in-stock item with too little stock is offered as made-to-order); estimate rounding ("about X–Y days", or weeks when ≥ 21 days) (§24) |
| `cart` *(v2.1)* | `abandoned_after_hours` (48), `reminder_after_hours` (72), guest cart lifetime (30 days), maximum lines (20), maximum quantity per line (§23) |
| `orders` *(v2.1)* | `revision_confirmation_days` (7, after which a pending revision expires), whether the team may record phone confirmation of an admin-created order or revision (§25) |
| `delivery` *(v2.1)* | `confirmation_reminder_days` (2), `auto_mark_after_days` (N = 7), `complete_after_days` (14), issue reporting window (§29) |
| `shipping` *(v2.1)* | Customer view of driver/vehicle: `show_vehicle_number`, `show_vehicle_type`, `show_driver_first_name`, `show_driver_phone` (§27.5) |
| `rewards` *(v2.1)* | `enabled`, earn rule, point value, minimum redemption, maximum redeemable %, expiry, pending days, review and referral bonuses, combinability (§30) |
| `trust` *(v2.1)* | Established year, stat overrides with "as of" dates, states/cities override, map image and coordinates, directions URL, working hours, certifications (§31.3) |
| `pwa` *(v2.1)* | App name and short name, theme and background colours, install-prompt rules (§33.3) |

---

## 12. Notifications

| Event key | Customer email | In-app (customer) | Team bell |
|---|---|---|---|
| `enquiry_submitted` | ✔ confirmation with summary | ✔ | ✔ new enquiry (call-back or quotation) |
| `enquiry_status_changed` | ✔ | ✔ | – |
| `enquiry_clarification` | ✔ with the question | ✔ | – |
| `enquiry_message` | ✔ (customer-visible messages) | ✔ | ✔ when the customer replies |
| `enquiry_rejected` / `enquiry_cancelled` | ✔ | ✔ | ✔ on customer cancel |
| `quotation_sent` | ✔ **with PDF attached** | ✔ | – |
| `quotation_expiring` | ✔ | ✔ | – |
| `quotation_decision` | ✔ | ✔ | ✔ accepted / declined |
| `order_created` / `order_status_changed` | ✔ | ✔ | ✔ order created |
| `review_status` | ✔ | ✔ | ✔ new review to moderate |
| `order_placed` *(v2.1)* | ✔ with item summary | ✔ | ✔ new order to accept |
| `order_revision_pending` *(v2.1)* | ✔ with the change summary and a confirm link | ✔ | – |
| `order_revision_decided` *(v2.1)* | ✔ | ✔ | ✔ customer confirmed / declined |
| `manufacturing_update` *(v2.1)* | ✔ (customer-visible updates only; digest if several in 1 hour) | ✔ | – |
| `estimate_revised` *(v2.1)* | ✔ with old vs new date and reason | ✔ | – |
| `shipment_update` *(v2.1)* | ✔ for dispatch, delayed, reached destination; in-app for every visible event | ✔ | – |
| `delivery_confirmation_requested` / `delivery_confirmation_reminder` *(v2.1)* | ✔ with three one-tap answers (§29.1) | ✔ | ✔ when overdue |
| `delivery_issue_update` *(v2.1)* | ✔ | ✔ | ✔ new issue / customer reply |
| `document_shared` *(v2.1)* | ✔ (no attachment: link to the tracker) | ✔ | – |
| `payment_recorded` *(v2.1)* | ✔ with the receipt reference | ✔ | – |
| `points_earned` / `points_expiring` *(v2.1)* | ✔ | ✔ | – |
| `review_invitation` *(v2.1)* | ✔ after confirmed delivery | ✔ | – |
| `cart_reminder` *(v2.1)* | ✔ **only with marketing consent**, at most once per cart | ✔ | – |

* Emails are sent in the customer's preferred language and fall back to English.
* Internal-only updates (manufacturing, shipment events, documents marked internal) **never** create customer notifications.
* Every email is a `notification_deliveries` row with status, attempts, last error and next attempt. A cron job retries with backoff every 2 minutes. Admins can **resend** from the enquiry timeline.
* Transport: SMTP via nodemailer, so any provider (SES, Postmark, Zoho, Google Workspace) can be used. The sender domain must have SPF, DKIM and DMARC verified before launch.

---

## 13. Architecture

### 13.1 System diagram

```
            ┌──────────────────────────┐        ┌──────────────────────────┐
 Customers ─► farmyantra_website (Vite/React SPA, nginx)   Team ─► farmyantra_admin (Vite/React/MUI SPA)
            └────────────┬─────────────┘        └─────────────┬────────────┘
                         │ POST /graphql (customer schema)     │ POST /admin/graphql (admin schema)
                         ▼                                     ▼
                  ┌──────────────────────────────────────────────────┐
                  │ farmyantra_backend (Node 20, Express 4, Apollo 5) │──► Firebase Admin (verify phone ID token)
                  │  /files/* (PDF, catalogue, review-media routes,   │──► SMTP (nodemailer)
                  │   signed document/media URLs, v2.1)               │──► Storage: local disk or S3 (+CDN)
                  │  node-cron jobs (email retry, expiry, reminders;  │      public/ and private/ prefixes
                  │   v2.1: abandoned carts, delivery reminders,      │
                  │   points expiry/maturity, trust stats, media)     │
                  └──────────────────────┬───────────────────────────┘
                                         ▼
                                PostgreSQL 15+ (pgcrypto)
```

v2.1 adds a **service worker** on the website (PWA, §33.3). It caches only the static app shell and public images, and never GraphQL responses or private files. It also adds a **media processing step** for manufacturing, shipment and delivery-issue uploads (§26.4). This runs as an in-process job queue first, with a separate worker process as the scale-out path.

### 13.2 Stack

| Layer | Choice | Same as Raddiwalla? |
|---|---|---|
| API | Node ESM (`.mjs`), Express 4, Apollo Server 5, graphql-upload | ✔ |
| DB access | `pg` with the Raddiwalla `pgx` query builder; `createFilter`, `normalizePaging`, `paginationMeta` | ✔ |
| Tables | `CREATE TABLE IF NOT EXISTS` at boot, in dependency order (`config/createTables.mjs`); `database/migrations` for ALTERs | ✔ |
| Auth | JWT wrapped in AES-256-CBC (`encryptData`), audience `customer` or `admin`, `token_version` revocation | ✔ |
| Customer login | Firebase phone OTP. The ID token is verified on the server, then a FarmYantra token is issued | Phone OTP like Raddiwalla, via Firebase |
| PDFs | pdfkit | New |
| Website | Vite 5, React 18, React Router 7, react-helmet-async, react-icons, custom CSS design system | Same structure, **new e-commerce design** |
| Admin | Vite 5, React 18, MUI 5, Apollo Client, apollo-upload-client, lucide-react | ✔ same components (CustomTable, SidebarPanel, PageHeader, FilterDropdown, StatCard, ExportButton, ConfirmDialog, layout, permissions) |

### 13.3 Backend folder structure (mirrors `raddiwalla_backend`)

```
index.mjs                         boot: env → tables → express → cron
src/config/                       envLoader, createTables, firebase
src/db/                           pool, queryBuilder (pgx), schema/<domain>/*Model.mjs
src/repositories/<domain>/        SQL only, no business rules
src/services/<domain>Helper/      business rules, transactions, audit, notifications
src/graphql/common|customers|admin/{schemas,resolvers}, graphql/index/*Index.mjs
src/context/                      customerContext, adminContext (token → principal)
src/middleware/                   encryptData, error-handler, upload, rateLimiter
src/routes/                       graphqlRouter, filesRoutes
src/integrations/                 storage (local/S3, signed URLs), email (SMTP)
src/templates/                    emailTemplates, pdfTemplates
src/jobs/                         cronJobs (+ v2.1: mediaJobs, abandonedCarts, deliveryReminders, pointsMaturity/Expiry, trustStats)
src/shared/                       logger, guards, tokens, i18n, money, sql/validation utils, teamAccess catalog
scripts/setup|dev/                create tables, seed super admin, seed demo catalogue, e2e smoke

v2.1 adds these domains, each with the usual db/schema → repositories → services → graphql layering:
  carts            (cartHelper: guest token, merge, validation)
  fulfilment       (leadTimeEngine: pure, unit-tested; manufacturingHelper)
  orders           (orderVersionsHelper with diff; orderRollup: pure status roll-up)
  shipments        (shipmentsHelper, driversHelper)
  orderDocuments   (documentsHelper, paymentsHelper)
  delivery         (deliveryConfirmationHelper, deliveryIssuesHelper)
  rewards          (pointsEngine: pure, unit-tested; rewardsHelper with row locks)
  marketing        (bannersHelper, trustStatsHelper)
tests/                            node:test unit + workflow tests
```

### 13.4 Request lifecycle (admin mutation)

`POST /admin/graphql` → `adminContext` decrypts and verifies the token → loads the principal with its effective permissions (cached 15 s, invalidated on `token_version`) → `adminMutation('quotations', …)` checks `admin:quotations:write` → service: validate → transaction (`pgx.transaction`) → repository SQL → audit row in the same transaction → after commit: notifications → returns `{ success, message, code, data }`.

---

## 14. Data model

Primary keys are UUIDs (`gen_random_uuid()`), apart from append-only logs, which use `BIGSERIAL`. Timestamps are `TIMESTAMPTZ`. Money is `BIGINT` paise. Translatable short labels are `JSONB {en, hi}` (`*_i18n`). Long product text uses `product_translations`.

| Domain | Tables |
|---|---|
| Team & platform | `team_roles`, `role_permissions`, `team_members`, `member_access`, `site_settings`, `tax_rules`, `document_sequences`, `content_pages`, `contact_messages`, `audit_logs`, `admin_notifications`, `admin_notification_reads` |
| Customers | `customers` (phone unique, Firebase UID, profile, language, marketing consent, status; v2.1 adds status `invited` for phone-only buyers created by the team, §25.3), `customer_login_history`, `saved_products` |
| Catalogue | `categories`, `products`, `product_translations`, `product_specs`, `product_media`, `product_documents`, `product_3d_models`, `product_colours`, `product_addons`, `product_addon_rules`, `product_personalisation`, `product_personalisation_placements`, `product_relations` |
| Offers | `promotions`, `promotion_targets`, `coupons`, `promotion_redemptions` |
| Sales | `enquiries` (number, customer, **request_type**, status, contact snapshot, delivery location, preferred time, **callback_due_at**, call attempts, assignment, totals, idempotency key), `enquiry_items` (snapshot; v2.1 adds `fulfilment_type`, `estimate_min_days`, `estimate_max_days`), `enquiry_events` (timeline), `enquiry_messages`; `quotations`, `quotation_versions`, `quotation_items`, `quotation_decisions`; `orders`, `order_items`, `order_events` |
| Reviews | `reviews` (v2.1 adds `verification_source` and `order_item_id`), `review_media`, `review_moderation_events` |
| Notifications | `notifications` (customer in-app), `notification_deliveries` (email outbox with retries) |
| Catalogues | `catalogue_versions` |
| **Cart** *(v2.1)* | `carts` (owner: customer **or** guest token hash, status, delivery preference, `last_activity_at`), `cart_items` (product, selection, quantity, price and lead-time snapshot at add, `validation_state`), `cart_follow_ups` |
| **Fulfilment** *(v2.1)* | `products` + `fulfilment_type`, `stock_qty`, `dispatch_min_days`, `dispatch_max_days`, `lead_time_min_days`, `lead_time_max_days`, `lead_time_display_unit`, `manufacturing_template_id`; option tables + `lead_time_impact_days`; `manufacturing_templates` (scope: product / category / default), `manufacturing_template_stages` (bilingual name, planned days, order) |
| **Orders** *(v2.1 additions)* | `orders` + `source`, `current_version_id`, `has_pending_revision`, `delivery_preference`, estimate columns, points columns, `idempotency_key`, `created_by_member_id`; `order_versions` (number, status, reason, totals, terms, `diff` JSONB, requires-confirmation flag, customer decision with IP and UA); `order_version_items` (full item snapshot per version); `order_items` + `fulfilment_type`, `fulfilment_status`, `estimated_ready_min_date`, `estimated_ready_max_date`, `revised_ready_date` |
| **Manufacturing** *(v2.1)* | `manufacturing_jobs` (one per made-to-order order item), `manufacturing_job_stages` (copied from the template; planned vs actual dates), `manufacturing_updates` (note, visibility, stage, author), `estimate_revisions` (old/new dates, reason, visible flag) |
| **Shipping** *(v2.1)* | `drivers` (contact, address, vehicle registration/type/photo, notes, active), `driver_identity_files` (ID photo, licence, private), `shipments` (number, order, origin, destination, planned dates, freight cost, LR/e-way/invoice numbers, status, `is_delayed`, visibility settings snapshot), `shipment_items` (order item + quantity), `shipment_assignments` (driver/vehicle history), `shipment_events` (**append-only**) |
| **Media** *(v2.1)* | `media_assets` (owner type and ID, storage key, MIME, size, dimensions/duration, processing status, visibility) used by manufacturing updates, shipment events, delivery confirmations and issues; `media_jobs` |
| **Documents & payments** *(v2.1)* | `order_documents` (scope order / job stage / shipment, type, number, date, amount, language, `document_group_id` + `version`, status, visibility, uploaded by), `order_payments` (entry type payment/refund, amount, date, mode, reference, receipt document, status recorded/voided, void reason) |
| **Delivery** *(v2.1)* | `delivery_confirmations` (one per shipment: status, customer answer, notes, photo consent, answered at, admin reason), `delivery_issues` (number, type, status, resolution), `delivery_issue_messages` |
| **Rewards** *(v2.1)* | `customer_points_accounts` (available, pending, reserved balances; `CHECK (available >= 0)`), `points_ledger` (append-only entries), `points_lots` (earned lots with expiry and remaining), `points_reservations`, `reward_campaigns`, `referral_codes`, `referrals` |
| **Marketing & trust** *(v2.1)* | `banners`, `banner_variants` (language × device image, text, CTA, alt, licence record), `trust_stats_snapshots`, `delivery_photos` (with consent reference), `certifications` |
| **PWA** *(v2.1, reserved)* | `push_subscriptions`: schema only, created when push is enabled in a later phase |

**Key constraints:**

* There are `CHECK` constraints on every status and enum column.
* Unique keys:
  * `(product_id, language)` on translations
  * `(product_id, code)` on options
  * `UPPER(code)` on coupons
  * `(product_id, customer_id)` on reviews
  * `(promotion_id, enquiry_id)` on redemptions
* Partial unique indexes: one default tax rule, and one active 3D model per product.
* The idempotency key is unique per customer.
* **v2.1:**
  * One `active` cart per customer, and one per guest token.
  * `(order_id, version_number)` on order versions; at most one `pending_customer` version per order.
  * `(document_group_id, version)` on documents; one `current` version per group.
  * One delivery confirmation per shipment; one manufacturing job per order item.
  * Idempotency keys on order creation, revisions, payment records, point adjustments and redemptions.
* **Append-only tables:** `audit_logs`, `shipment_events` and `points_ledger` reject `UPDATE`/`DELETE` through a trigger. Corrections are new rows (`reversed`/`adjusted` entries, or a correcting event).
* New document numbers (gap-free per year in `document_sequences`): `SHP-YYYY-NNNNNN` shipments, `DIC-YYYY-NNNNNN` delivery issues, `PAY-YYYY-NNNNNN` payment records. Tax-invoice numbers are **not** generated here (§28.3).

---

## 15. API contract

### 15.1 Conventions

* **Mutations** return `Result { success, message, code, data: JSON }`. Business errors use GraphQL error codes: `BAD_USER_INPUT`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `ALREADY_EXISTS`, `CONFLICT`, `TOO_MANY_REQUESTS`.
* **Lists** return `JSONPage { items, pagination { total page totalPages limit offset hasMore }, meta }`.
* **Language:** the customer API reads `x-language: en|hi` (or `Accept-Language`) and returns resolved text with an English fallback. The admin API returns raw `*_i18n` objects.
* **Uploads:** GraphQL multipart (graphql-upload). The client must send the `apollo-require-preflight` header (CSRF protection).

### 15.2 Customer schema (`/graphql`)

| Group | Operations |
|---|---|
| Catalogue | `categories`, `category`, `products(filter, sort, page)`, `productsByIds`, `product(slug)`, `compareProducts`, `previewConfiguration`, `productReviews`, `featuredReviews`, `pages`, `page`, plus site settings / live offers / catalogues for the home and offers pages |
| Auth & profile | `loginWithPhone(firebaseIdToken)` (dev bypass `dev:+91…` when `DEV_OTP_BYPASS=true` and not production), `completeProfile`, `updateProfile` |
| Enquiries | `quoteCart`, `submitEnquiry(requestType: callback|quotation, …, idempotencyKey)`, `myEnquiries`, `myEnquiry`, `replyToEnquiry`, **`requestQuotationForEnquiry`**, `cancelEnquiry`, `markEnquiryRead` |
| Quotations & orders | `myQuotations`, `myQuotation`, `decideQuotation(versionId, decision, termsAccepted, reason)`, `myOrders`, `myOrder` |
| Other | `myNotifications`, `markNotificationsRead`, `setSavedProduct`, `reviewEligibility`, `submitReview`, `submitContactMessage` |
| **Cart** *(v2.1)* | `myCart` (guest via `x-cart-token` header, or customer), `addToCart`, `updateCartItem`, `removeCartItem`, `setCartPreferences`, `validateCart` (returns per-item validation, prices, points preview, combined estimate), `submitCart(requestType: callback|quotation|both, …, redeemPoints, idempotencyKey)`. The guest cart is **merged automatically** inside `loginWithPhone` (§23.4). `quoteCart` stays as a stateless helper |
| **Requests** *(v2.1 changes)* | `requestQuotationForEnquiry` now **adds** quotation (`callback` → `both`); new `requestCallbackForEnquiry` (`quotation` → `both`) |
| **Orders** *(v2.1)* | `myOrder` returns the tracker payload (§31.1); `decideOrderVersion(versionId, decision: confirm|decline, termsAccepted, reason, idempotencyKey)`; `orderDocumentLink(documentId)` (signed URL, §28.2); `confirmDelivery(shipmentId, answer: received_ok|received_with_issues|not_received, description, media[], photoConsent, idempotencyKey)`; `myDeliveryIssues`, `replyToDeliveryIssue` |
| **Rewards** *(v2.1)* | `myRewards` (balances, history, expiring), `pointsPreview(productId, selection, quantity)` and the cart's points preview |
| **Trust & marketing** *(v2.1)* | `trustStats`, `banners(placement)`, `testimonials`, `deliveryPhotos` |

### 15.3 Admin schema (`/admin/graphql`)

| Group | Operations (permission feature) |
|---|---|
| Auth & team | `login`, `changeOwnPassword`, `me`, `permissionCatalog`, `teamMembers`, `teamMember`, `roles`, `createTeamMember`, `updateTeamMember`, `resetTeamMemberPassword`, `deleteTeamMember`, `saveRole`, `deleteRole` (team_members) |
| Dashboard & reports | `dashboard` (dashboard); `enquiryTrend`, `conversionFunnel`, `productInterest` (reports); `auditLogs` (audit_logs); `adminNotifications`, `markAdminNotificationsRead` |
| Catalogue | `products`, `product`, `categories`, `createProduct`, `updateProduct` (pricing fields need `pricing:write`, switches need `customisation:write`), `setProductStatus`, `duplicateProduct`, `saveProductSpecs`, `add/update/reorder/deleteProductMedia`, `add/update/deleteProductDocument`, `uploadProduct3dModel`, `updateProduct3dSettings`, `removeProduct3dModel`, `saveProductRelations`, `saveCategory`, `deleteCategory` (products); `saveProductTranslation`, `deleteProductTranslation` (product_translations); `saveProductColour`, `saveProductAddon`, `saveProductPersonalisation`, `saveProductPlacement`, `setProductOptionActive`, `uploadOptionImage` (customisation); `taxRules`, `saveTaxRule` (pricing) |
| Enquiries | `enquiries(filter: statuses, requestType, assignedTo, unassigned, callbackOverdue, search…)`, `enquiry`, `changeEnquiryStatus`, `assignEnquiry`, `assignableMembers`, `logEnquiryCall`, **`setEnquiryRequestType`**, `addEnquiryMessage`, `resendNotification`, `contactMessages`, `setContactMessageStatus` |
| Quotations & orders | `quotations`, `quotation`, `createQuotation`, `updateQuotationDraft`, `sendQuotation`, `reviseQuotation`, `cancelQuotation`, `convertQuotationToOrder`; `orders`, `order`, `changeOrderStatus` (v2.1: limited to `confirmed`, `cancelled`, `completed`), `updateOrder` (v2.1: notes and delivery details only; price/item changes go through versions) |
| **Orders v2.1** (orders) | `acceptOrder(id)`, `createOrderForCustomer(customerId, enquiryId?, items, delivery, terms, idempotencyKey)`, `proposeOrderRevision(orderId, changes, reason, idempotencyKey)`, `withdrawOrderRevision(versionId, reason)`, `recordOrderConfirmationByPhone(versionId, reason, callLogId)` (only when `orders.allow_phone_confirmation`), `orderVersions(orderId)`, `orderVersionDiff(versionId)` |
| **Carts** *(v2.1, carts)* | `customerCart(customerId)`, `abandonedCarts(filter: consentOnly, since, value…)`, `logCartFollowUp(cartId, outcome, note)` |
| **Manufacturing** *(v2.1, manufacturing)* | `manufacturingTemplates`, `saveManufacturingTemplate`, `manufacturingJobs(filter: delayed, stage, due…)`, `manufacturingJob`, `updateManufacturingStage(jobStageId, status, note, visibility, media[])`, `addManufacturingUpdate`, `reviseEstimate(orderItemId, minDate, maxDate, reason, customerVisible)`, `setManufacturingDelay(jobId, delayed, reason)` |
| **Shipping** *(v2.1, shipments / drivers / driver_identity)* | `drivers`, `driver`, `saveDriver`, `setDriverActive` (drivers); `uploadDriverIdentity`, `driverIdentityLink` (driver_identity); `shipments`, `shipment`, `createShipment(orderId, items[], …)`, `updateShipment`, `addShipmentEvent(shipmentId, type, location, note, media[], customerVisible, occurredAt)`, `changeShipmentAssignment(shipmentId, driverId, vehicle, reason)`, `cancelShipment(reason)` (shipments) |
| **Documents & payments** *(v2.1, order_documents / payments)* | `orderDocuments(orderId)`, `addOrderDocument`, `replaceOrderDocument(groupId, file, reason)`, `withdrawOrderDocument(id, reason)`, `orderDocumentLink(id)`; `orderPayments(orderId)`, `recordPayment(orderId, input, idempotencyKey)`, `voidPayment(id, reason)` |
| **Delivery** *(v2.1, delivery_issues)* | `pendingDeliveryConfirmations`, `markShipmentDelivered(shipmentId, reason)`, `deliveryIssues(filter)`, `deliveryIssue`, `updateDeliveryIssue(status, resolution)`, `addDeliveryIssueMessage` |
| **Rewards** *(v2.1, rewards)* | `rewardCampaigns`, `saveRewardCampaign`, `customerPoints(customerId)`, `adjustPoints(customerId, points, reason, idempotencyKey)`, `pointsReport(range)`, `pointsAbuseSignals` (rules live in settings → `rewards`) |
| **Marketing & trust** *(v2.1, banners / content)* | `banners`, `saveBanner` (variants, schedule), `setBannerStatus`; `trustStatsAdmin` (computed vs override), `certifications`, `saveCertification`, `deliveryPhotos`, `setDeliveryPhotoPublished` |
| Customers & reviews | `customers`, `customer`, `updateCustomer`; `reviews`, `review`, `moderateReview` |
| Offers | `promotions`, `promotion`, `previewCart`, `savePromotion`, `setPromotionStatus`, `createCoupons`, `setCouponActive` |
| Catalogues, content, settings | `catalogueVersions`, `generateCatalogue`, `regenerateCatalogue`, `setCataloguePublished`, `deleteCatalogue`; `contentPages`, `saveContentPage`, `deleteContentPage`, `uploadContentImage`; `settings`, `updateSettings`, `uploadBrandAsset` |

### 15.4 File routes

| Route | Access |
|---|---|
| `GET /files/quotations/:versionId` | Owning customer, or staff with `quotations:read` (`?scope=admin`). Bearer header, or `?token=` for links |
| `GET /files/catalogues/latest?lang&category` | Public. Redirects to the published version |
| `GET /files/catalogues/:id` | Public, published versions only |
| `GET /files/review-media/:mediaId` | Staff with `reviews:read` (private media before approval) |
| `GET /files/signed/:token` *(v2.1)* | **Short-lived signed URL** (HMAC, default 300 s, bound to the file and the requesting principal) for order documents and customer-visible manufacturing, shipment and delivery media. Issued only by an authorised GraphQL call. With S3, the API returns an S3 presigned GET instead |
| `GET /files/driver-identity/:fileId` *(v2.1)* | Staff with `driver_identity:read` only. `Cache-Control: private, no-store`. Every view is audited |
| `GET /uploads/public/...` | Public media (local driver). Use a CDN in production |
| `GET /health` | Liveness |

---

## 16. Security and privacy

* **Authorisation on the server for every call.**
  * Customer resolvers always filter by `customer_id` from the token. They never trust an ID passed in the request.
  * Admin resolvers check feature permissions.
* **Tokens.** Short-lived JWTs (customer 30 days, admin 12 hours by default), encrypted (AES-256-CBC) and revocable through `token_version`. Admin accounts lock for 15 minutes after 5 failed logins.
* **OTP.** Firebase verifies the phone, and the server verifies the Firebase ID token with the Admin SDK. The dev bypass is impossible in production because `NODE_ENV=production` disables it.
* **Uploads.**
  * Size limits (configurable): images 2 MB, videos 50 MB, documents 20 MB, 3D models 30 MB. Limits are checked in the UI and on the server.
  * The MIME type is checked against the file's magic bytes, not just the extension.
  * Images are re-encoded to WebP with sharp, which strips EXIF/GPS. SVG is not accepted.
  * Review media stays private until approved. Quotation PDFs are private.
  * **v2.1:**
    * Order documents, manufacturing/shipment/delivery media and driver identity files are all private.
    * Customers get only short-lived signed URLs for customer-visible items on **their own** orders.
    * Internal items are never returned by the customer API, not even as metadata.
* **Rate limits.** Admin login, OTP login, enquiry submission, contact form and review submission are rate-limited.
* **Idempotency.** Enquiry submission uses an idempotency key, so a retry never duplicates the enquiry. v2.1 extends this to cart submission, order creation and revision decisions, payment records, delivery confirmations, point adjustments and redemptions.
* **Driver data (v2.1).** Driver phone and address are visible to staff with `drivers:read`. ID photos and licence numbers need `driver_identity:read` (privileged), and each view is audited. The customer sees only what settings → `shipping` allows (by default the vehicle number, vehicle type and a contact number), and **never** ID photos, the licence, the address or notes. Drivers are told that their details are stored and shared on that basis (§22.3).
* **Points integrity (v2.1).** Every balance change takes a row lock on `customer_points_accounts` (`SELECT … FOR UPDATE`) inside the business transaction. Balances can never go negative (`CHECK`). The ledger is append-only, and every point movement references its order, review, referral or admin adjustment.
* **Audit.** Every price, status, permission, settings, content and moderation change is recorded with actor, IP, reason and diff. The audit log is append-only.
* **PII.** Phone and email are visible only to staff with `customers:read` or `enquiries:read`. Abandoned-cart outreach lists show **consent status** and exclude customers without marketing consent from reminder sends (§23.6). Exports are permission-gated. The logger redacts sensitive keys (tokens, passwords, secrets).
* **Transport.** HTTPS only, HSTS, secure CORS allow-list (`CORS_ORIGINS`), and `helmet`-style headers through nginx. The admin API is served on a separate path and can be IP-restricted at the proxy.
* **Backups.** Daily `pg_dump`, 30-day retention, and a monthly restore test. Uploads are versioned in the S3 bucket.

---

## 17. Non-functional requirements

### 17.1 Performance

* Home and product page **LCP ≤ 2.5 s** on a mid-range Android phone over 4G, **CLS ≤ 0.1**, **INP ≤ 200 ms**. Initial JS under 200 kB gzip excluding lazy chunks. Measured in CI with Lighthouse (Moto G Power profile, Slow 4G).
* Animation stays within budget: transform/opacity only, 150–400 ms, no animation delays content, and `prefers-reduced-motion` is honoured (§32.5).
* Images: responsive WebP thumbnails with lazy loading. Video posters. The 3D viewer and Firebase are dynamic imports.
* API: p95 under 300 ms for catalogue queries. Lists are paginated, with indexes on all filter columns.

### 17.2 Accessibility

Semantic HTML, keyboard-operable configurator, dialogs and bottom sheets (focus trap, Esc to close), visible focus, `prefers-reduced-motion`, labelled form errors, AA contrast and 44×44 px targets. Every gesture (swipe, pull-to-refresh) has a button alternative. Count-up stats render their final value for screen readers and reduced-motion users (§31.3).

### 17.3 Internationalisation

All UI strings are in `i18n/en.js` and `i18n/hi.js`. Data falls back to English for missing Hindi. Numbers and dates use the `en-IN` format. Indian rupee formatting uses lakh/crore grouping.

### 17.4 Reliability and observability

* Structured, levelled logs with redaction, plus `/health`. Request IDs and log shipping are Phase 4 items.
* Cron jobs are idempotent. With several API instances, set `CRON_ENABLED=false` on all but one.
* Email failures never fail the business action; they go to the outbox and are retried.
* Error tracking (Sentry or similar) is a Phase 4 item.
* v2.1: a failed media-processing job never blocks the update it belongs to. The update is saved, the asset shows "processing failed" to staff, and staff can retry.

---

## 18. Configuration, environments and deployment

### 18.1 Environments

`development` (local, dev OTP bypass), `staging` (real Firebase test numbers, test SMTP), `production`.

### 18.2 Backend environment variables (`.env.example`)

| Group | Variables |
|---|---|
| Server | `NODE_ENV`, `PORT`, `BASE_URL`, `PUBLIC_API_URL`, `WEBSITE_URL`, `ADMIN_URL`, `CORS_ORIGINS`, `LOG_LEVEL`, `CRON_ENABLED` |
| DB | `PG_DATABASE_URL` |
| Auth | `JWT_SECRET`, `ENCRYPT_DATA_KEY`, `CUSTOMER_TOKEN_TTL`, `ADMIN_TOKEN_TTL`, `DEV_OTP_BYPASS` |
| Firebase | `FIREBASE_SERVICE_ACCOUNT_PATH` **or** `FIREBASE_PROJECT_ID` + `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY` |
| Storage | `STORAGE_DRIVER=local|s3`, `AWS_REGION`, `AWS_BUCKET_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `MEDIA_PUBLIC_BASE_URL`, `UPLOAD_MAX_*_BYTES` |
| Email | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `SALES_TEAM_EMAIL` |
| PDF | `PDF_FONT_REGULAR_PATH`, `PDF_FONT_BOLD_PATH`, **`PDF_FONT_HI_PATH`** (a Devanagari TTF such as Noto Sans Devanagari, needed for Hindi PDFs) |
| Seed | `SUPER_ADMIN_NAME`, `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD` |
| Files *(v2.1)* | `FILE_URL_SIGNING_SECRET`, `FILE_URL_TTL_SECONDS` (300), `MEDIA_JOBS_ENABLED`, `FFMPEG_PATH` (if video transcoding is approved, §22.3) |
| Cart *(v2.1)* | `GUEST_CART_TOKEN_SECRET` (the guest cart token is random; only its hash is stored) |
| PWA *(v2.1, reserved)* | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`: not used until push is enabled |

**Website:** `VITE_SITE_URL`, `VITE_API_URL`, `VITE_REQUEST_TIMEOUT_MS`, `VITE_FIREBASE_*` (leave blank locally to use the API's dev OTP bypass). v2.1: `VITE_PWA_ENABLED` (on in production; off in dev to avoid stale caches).

**Admin:** `VITE_GRAPHQL_ENDPOINT`, `VITE_WEBSITE_URL`.

### 18.3 Deployment (recommended)

* **API:** Node 20 under PM2 or a container behind nginx. One instance runs cron. Postgres is managed (RDS or Cloud SQL). S3 and CloudFront hold media.
* **Website:** `vite build` → static files on nginx (an SPA fallback is included in `nginx.conf`) or a CDN. Prerender or SSR for SEO is a Phase 4 item.
* **Admin:** `vite build` with base `/admin/farmyantra/`. Served from nginx, optionally behind an IP allow-list or VPN.
* **CI:** lint, unit tests and build on every PR. Run the e2e smoke against an ephemeral Postgres.

---

## 19. Testing strategy

| Level | What | Where |
|---|---|---|
| Unit | Pricing engine, promotion engine, enquiry state machine, quotation GST maths | `farmyantra_backend/tests/*.test.mjs` (`npm test`) |
| API end-to-end smoke | Browse → configure → cart → OTP login → call-back and quotation enquiries (idempotent) → call log → invalid transition refused → quotation draft/edit (reason required)/send → PDF auth → accept → order → statuses → review verify and approve → catalogue publish → permission denials → audit | `scripts/dev/e2e-smoke.mjs` (`npm run verify`) |
| Website | Format utilities; Playwright walk-through of shop → product → configure → enquiry → login → dashboard on desktop and mobile, English and Hindi | `farmyantra_website/tests` |
| Admin | Playwright walk-through of every page plus write flows: category, product with pricing, translations, specs, image, colours, add-ons, publish; offer with coupons and cart preview; catalogue; content; team member and role; settings | manual script (to be added to CI in Phase 4) |
| Unit *(v2.1)* | `leadTimeEngine` (windows, option impacts, backorder, combined estimate), `orderRollup` (header status from items and shipments), order version diff, `pointsEngine` (earn, redeem caps, FIFO lots, expiry, reversal, never negative), document versioning | `tests/*.test.mjs` |
| Concurrency *(v2.1)* | Parallel redemptions on one account, a double-submitted cart, a double-recorded payment and a double delivery confirmation are each applied exactly once | `tests/concurrency.test.mjs` (real Postgres) |
| E2E *(v2.1)* | Guest cart → login merge → multi-item `both` request → admin-created order → revision with price change → customer confirms → manufacturing updates with media → split shipments with driver change → delivered → documents and payment → customer confirms delivery (one with issues) → issue resolved → delivery-verified review → points earn and mature | `scripts/dev/e2e-fulfilment.mjs` |
| Device & network *(v2.1)* | The matrix in §33.6: iOS Safari, Android Chrome, 320–360 px phones, notched devices, landscape, Slow 3G/4G, offline, installed PWA | Manual on real devices plus Playwright device emulation; Lighthouse CI |
| Manual / UAT | Real Firebase OTP, real SMTP, Hindi PDF font, low-end device check | Staging |

---

## 20. Delivery roadmap

| Phase | Scope | Status |
|---|---|---|
| **0. Foundations** | Repos, Raddiwalla structure, DB bootstrap, logger, error handling, auth (customer OTP and admin), RBAC catalogue, audit log, settings, storage, email outbox, seeds | ✅ Done |
| **1. Catalogue & enquiry (MVP)** | Categories, products, translations, specs, media, documents; shop with filters/search; product page; enquiry list; **call-back and quotation enquiries**; account area; admin enquiry queue with SLA, call log, assignment, messages, request-type switching; notifications | ✅ Done |
| **2. Configuration & documents** | Colours, add-ons with rules, personalisation and placements; server pricing engine; quotation drafts/versions/send/accept/decline/expire; GST split; quotation PDFs; catalogue PDFs; orders | ✅ Done |
| **3. Rich media, offers & reviews** | 3D viewer (lazy), videos and embeds; offers, bundles, coupons, cart preview; review submission, verification and moderation, private media; compare; saved products; buying guides and content pages; reports | ✅ Done |
| **4. Launch hardening** | Real Firebase project and test numbers; SMTP domain verification (SPF/DKIM/DMARC); Devanagari PDF font; S3 + CDN; nginx/HTTPS; backups; Sentry; admin Playwright suite in CI; SEO prerender (product and category pages), sitemap.xml and structured data (Product, Offer, AggregateRating); load test; security review and pen test; tax sign-off | ⏭ Next |
| **5. Mobile app experience, cart and lead times** *(v2.1)* | App shell with bottom tab bar, bottom sheets, safe areas, gestures, skeletons, page transitions, installable PWA with offline fallback (§33); server-side cart with guest token, login merge, validation and `both` request type (§23); fulfilment types, stock, windows, option lead-time impacts, combined estimates (§24); art direction, motion system, banners and posters (§32); trust section with computed stats (§31.3) | Planned |
| **6. Order lifecycle and tracking** *(v2.1)* | Order acceptance, admin-created orders, versioned revisions with diff and customer confirmation (§25); manufacturing templates, jobs, stage updates with media, estimate revisions and delays (§26); drivers, shipments, split shipments, manual tracking events, driver/vehicle changes (§27); order documents with versions and signed URLs, offline payment records (§28); delivery confirmation, delivery issues, delivery-verified reviews (§29); order tracker page (§31.1); admin mobile urgent flows (§33.5) | Planned |
| **7. Reward points** *(v2.1)* | Points accounts, ledger, lots, reservations, earn rules and campaigns, redemption on requests, quotations and orders, expiry and maturity jobs, referral and review bonuses, admin adjustments and abuse signals, discount line on PDFs (§30) | Planned |
| **8. Growth** | Online payments (Razorpay) for advance payment on accepted quotations, built on the payment extension points in §28.4; web push through the reserved PWA hooks (§33.4); WhatsApp notifications (templates through the BSP); internal chat built on enquiry messages; dealer/partner role with territory assignment; EMI/finance enquiry; spare-parts finder by machine model; service requests; analytics (GA4 + server events); multi-warehouse stock; GPS tracking or driver app | Planned |

Detailed per-repo checklists live in `docs/BACKEND_ROADMAP.md`, `docs/WEBSITE_ROADMAP.md` and `docs/ADMIN_ROADMAP.md` in each repository.

---

## 21. Acceptance checklist

| Requirement (v1.0 §21) | Where | Status |
|---|---|---|
| Works on mobile, tablet and desktop | Website CSS system, admin responsive layout | ✅ verified at 390 px and 1440 px |
| Admin creates and publishes a product with images, videos, specs and documents | Admin → Products editor; publish checklist | ✅ |
| Product page usable when video/3D is slow | Lazy 3D with poster, gallery fallback | ✅ |
| Configurator exposes only enabled options | `catalogHelper` (active options only) + server validation | ✅ |
| Indicative price updates, server validates | `previewConfiguration`, `quoteCart`, `submitEnquiry` re-price | ✅ |
| Guest cannot submit without phone verification and profile | `RequireAuth` + customer guard requiring `profile_complete` | ✅ |
| Customer submits enquiry and views it in dashboard | `/enquiry` → `/account/enquiries/:id` | ✅ |
| **Customer chooses call-back or quotation; can switch** | `request_type`, `requestQuotationForEnquiry`, `setEnquiryRequestType` | ✅ |
| Admin reviews, accepts, rejects, requests clarification | State machine + admin enquiry page | ✅ |
| Customer notified on status change | Notification events + email outbox | ✅ |
| Branded quotation PDF with all required details | `quotationPdf.mjs` | ✅ (Hindi needs `PDF_FONT_HI_PATH`) |
| Dated catalogue PDF generated and published | Catalogue versions | ✅ |
| Reviews hidden until verified + approved | `reviewsHelper` | ✅ |
| Promotions validated server-side, totals never invalid | `promotionEngine` tests | ✅ |
| Customer data isolated | Customer resolvers scoped by token | ✅ (e2e checks) |
| Important admin actions audited | `audit_logs` | ✅ |
| Backups, HTTPS, monitoring | Deployment | ⏭ Phase 4 |

**v2.1 acceptance criteria** (all ⏭ planned; each must pass before its phase is marked done):

| Requirement | Section | Phase |
|---|---|---|
| A guest can add several machines (including the same machine with different configurations) and keeps the cart after login and on another device | §23 | 5 |
| A product that was unpublished, changed in price or became short of stock after being added is flagged in the cart and cannot be submitted silently | §23.3 | 5 |
| One request with multiple items is created with a per-item configuration snapshot, fulfilment type and estimate, for `callback`, `quotation` or `both` | §23.5 | 5 |
| Product pages and the cart show "Ready to dispatch" or "Made to order: about X–Y days", the combined estimate takes the longest item, and all dates are labelled as estimates | §24 | 5 |
| Admin can accept an order as-is, edit it (new version with reason, diff and audit), or create one on a customer's behalf. A price or terms change takes effect only after customer confirmation | §25 | 6 |
| Made-to-order items show a stage timeline with customer-visible media. Internal updates never reach the customer. A revised estimate always shows a reason | §26 | 6 |
| One order can be split into several shipments. Tracking events are immutable. A driver change mid-journey is logged. The customer never sees driver ID or licence data | §27 | 6 |
| Documents are versioned (never overwritten), shared only through short-lived signed URLs, and the customer is notified when one is shared | §28 | 6 |
| Offline payments are recorded with mode and reference, payment status is computed, and voids need a reason | §28.4 | 6 |
| On "Reached destination" the customer is asked to confirm. Issues open a case. After N days without an answer, admin can mark delivered with a reason | §29 | 6 |
| A confirmed delivery makes the review verified automatically, and moderation still applies | §29.5 | 6 |
| Points are earned, reserved, consumed, returned and expired exactly as §30.5 says. Totals are never negative. Parallel redemptions cannot overspend | §30 | 7 |
| The order tracker shows the whole journey in English and Hindi | §31.1 | 6 |
| Every trust number is computed from real data or is an admin override with an "as of" date. None are hard-coded | §31.3 | 5 |
| No horizontal scroll at 320 px. Safe areas are respected on notched devices. The PWA installs and shows the offline page. LCP ≤ 2.5 s, CLS ≤ 0.1 | §33, §17.1 | 5 |

---

## 22. Decisions taken and open questions

### 22.1 Defaults chosen (all can be changed in Settings or a role editor without code)

| v1.0 §23 question | Default implemented |
|---|---|
| Email service | Provider-neutral SMTP. Recommended: Amazon SES (ap-south-1) or Zoho Mail with the business domain |
| Tax and rounding | Per-line GST, half-up rounding to the paise; CGST+SGST vs IGST by business state vs delivery state. **Needs tax-advisor sign-off** |
| Acceptance → order? | `commerce.acceptance_creates_order = true`: creates an order in **`pending_confirmation`**, which the team confirms |
| Initial roles | Sales Manager, Sales Representative, Product / Content Manager (+ Super Admin) |
| Default currency and language | INR. English by default (`commerce.default_language`), Hindi one tap away and remembered |
| Call-back SLA | 24 hours (`commerce.callback_sla_hours`) |
| Quotation validity | 15 days, reminder 3 days before expiry |

### 22.2 Still to confirm with the business

1. Final GST rates and HSN codes per category (for example, many agricultural implements are 12 %, and some hand tools and parts differ).
2. Whether a phone-accepted quotation needs the customer's online acceptance as well, or whether the team may convert it directly. Both are supported today.
3. Delivery charge policy: a flat rate per state, per weight slab, or always quoted.
4. Whether prices on catalogues are shown by default.
5. Whether dealers or partners need their own logins (Phase 8).
6. The WhatsApp Business provider, if WhatsApp is wanted in Phase 8.

### 22.3 New open decisions (v2.1), each with a recommendation

| # | Decision | Options | Recommendation |
|---|---|---|---|
| D1 | When are redeemed points **consumed**? | (a) when the team confirms the order; (b) at confirmed delivery | **(b) at delivery.** Points are *reserved* at confirmation, so they can't be spent twice, but they are only consumed once the customer has the machine. A cancellation before delivery simply releases them, so no reversal accounting is needed |
| D2 | When do **earned** points become usable? | Immediately at delivery; after a holding period | **Pending at confirmed delivery, available after `rewards.pending_days` = 7** with no open delivery issue. This limits abuse and refund reversals |
| D3 | Point value and earn rate | Any | **Decided: the point value and every rule are editable in Admin → Reward points** (`rewards:write`, privileged; audited). Defaults: 1 point = ₹1 (100 paise); earn 1 % of the net pre-tax order value (after offers and points); at most 10 % of the pre-tax order value can be paid with points; minimum redemption 100 points; points expire 12 months after they become available. A changed point value applies to new redemptions immediately; balances keep their point count. Model the cost with the accountant before launch |
| D4 | GST treatment of points and how they show on invoices | Pre-tax discount; post-tax payment-like adjustment | **Show as a separate pre-tax discount line**, the same as offers. **Accountant sign-off required** before launch |
| D5 | Who issues **tax invoices**? | Generated in FarmYantra; produced in accounting software and uploaded | **Decided: generated in FarmYantra.** Accounts staff (`invoices:write`) create tax invoices, proforma invoices and credit notes from an order, edit drafts, issue them with gap-free financial-year numbering, and email the PDF to the customer. Layout comes from editable invoice templates. Uploading documents from other systems remains possible (§28.1). E-invoicing/IRN is not built in this release — check the turnover threshold with the accountant |
| D6 | Do item or configuration edits without a price change need customer confirmation? | Yes; no | **Yes.** Any change to items, configuration, quantity, price, discounts, points or terms needs confirmation. Delivery address and date changes do not, but the customer is notified |
| D7 | May the team record a customer's **phone confirmation** of an admin-created order or revision? | Online only; phone allowed | **Allow, off by default** (`orders.allow_phone_confirmation`). When on, it requires a logged call and a reason, and the customer still gets an email and in-app copy with a "this isn't right" link |
| D8 | Should one cart item with several units ship as one, or can units split across shipments? | Item-level; unit-level | **Unit-level quantities on `shipment_items`.** Workshops often finish 2 of 5 units first |
| D9 | Lead-time impacts of options: sum or max? | Sum; max | **Sum.** It is conservative, and the admin can tune the impacts. The cart's combined estimate is the **longest item** when shipping together, and per item when "ship when ready" |
| D10 | Video processing | Store as uploaded; transcode with ffmpeg | **Accept MP4/MOV/WebM up to 50 MB and transcode to H.264 MP4 720p in a background job** (`FFMPEG_PATH`), because iPhone HEVC `.mov` doesn't play on many Android phones. Until the worker is deployed, store as uploaded and show the poster with a download link |
| D11 | Large uploads on mobile networks | GraphQL multipart; direct-to-S3 presigned multipart | **Direct-to-S3 presigned upload for videos > 10 MB** in Phase 6, with progress and retry. GraphQL multipart for images and documents |
| D12 | Map on the About page | Embedded Google Maps; OpenStreetMap embed; static image + directions link | **Static map image (admin-uploaded) + "Get directions" link** to Google Maps coordinates. No third-party script, no cookies, no CLS |
| D13 | Heading font | System fonts only; self-hosted bold display face | **Self-host Mukta (OFL, Latin + Devanagari) weights 700/800, subset, `font-display: swap`, headings only (~35 kB)**. Body stays on the system stack |
| D14 | Lottie animations | Use Lottie; CSS/SVG only | **CSS/SVG first.** If Lottie is needed for an empty state or the hero, use the lazy dotLottie player, loaded after LCP and replaced by a static SVG under reduced motion |
| D15 | Cart reminders | Email only; email + SMS/WhatsApp | **Email + in-app, only with marketing consent, once per cart**, after 72 h. Phone follow-up by sales is a *service* contact allowed for customers who submitted a request in the past. The team can mark `do_not_contact` |
| D16 | Release order | Launch after Phase 4; after Phase 5; after Phase 6 | **Soft-launch after Phases 4 + 5** (the app-like site, cart and honest lead times are the first impression). Run Phase 6 straight after, **before** taking more than ~20 orders/month, because tracking and documents are what build trust after the sale. Phase 7 follows once the points cost is approved |
| D17 | Driver consent and data retention | – | Record driver consent when creating the driver. Keep ID files for 3 years after the driver's last shipment, then purge them through a job. **Check with a legal advisor** (DPDP Act 2023) |
| D18 | Can customers see the driver's phone number? | Yes; only a company dispatch number | **Default: show the company dispatch number, not the driver's personal phone** (`shipping.show_driver_phone = false`). Turn it on per business preference |

---

# Part B: Fulfilment, trust and mobile (v2.1)

> Everything in Part B is **specified, not yet built** (Phases 5–7, §20). All of it follows the platform conventions:
>
> * integer paise for money and UUID keys
> * `CHECK`-constrained status columns (statuses listed in §34)
> * an audit row in the same transaction as every important change
> * idempotency keys on every customer- or money-affecting create
> * permission checks on every admin resolver (§3.3) and customer data scoped by token
> * `{en, hi}` text with English fallback for all customer-facing strings

## 23. Cart: "My Request List"

### 23.1 Purpose

The cart lets a customer collect **several machines**, or the **same machine several times** with different configurations or quantities, and send them as **one request** (an enquiry with many `enquiry_items`) using the request types in §2 (`callback`, `quotation`, `both`). It is **not** a payment checkout. Orders come later (§25).

### 23.2 Ownership and persistence

* **Server-side, always.** The website keeps only a random **guest cart token** in `localStorage`. The server stores only its hash (`carts.guest_token_hash`) and the client sends the token as `x-cart-token`.
* A signed-in customer has one `active` cart, which is the same on every device. A guest cart expires after `cart.guest_cart_days` (30) of inactivity.
* **Lines.** Each `cart_items` row is a product, a selection (colour, add-ons with quantities, personalisation, placement), a quantity, and **snapshots taken when added**: unit price, line price, fulfilment type, lead-time window and product name in EN/HI.
* **Duplicates.** Adding an identical configuration increases the quantity, within the maximum. A different configuration of the same product is a new line. The customer can **duplicate a line** to vary it.
* **Limits.** `cart.max_lines` (20), and the product's minimum/maximum order quantity per line.

### 23.3 Server re-validation

`validateCart` runs on every view and change, and always before submission. Each line gets a `validation_state`:

| `validation_state` | When | Customer sees | Can submit? |
|---|---|---|---|
| `valid` | Nothing changed | – | ✔ |
| `price_changed` | Current price ≠ price at add | "Price updated from ₹X to ₹Y" | ✔ after the customer acknowledges (one tap) |
| `estimate_changed` | Lead-time window changed | "Now about X–Y days" | ✔ |
| `quantity_adjusted` | Above max qty, or above stock for an in-stock line without backorder | "Reduced to N (maximum available)" | ✔ |
| `option_unavailable` | A selected option was disabled or removed, or a rule now fails | "Colour 'Red' is no longer offered. Choose another" | ✗ until fixed |
| `product_unavailable` | Product unpublished, archived, `discontinued` or `coming_soon` | "No longer available", with a link to alternatives | ✗ (the customer can remove it or save it for later) |

The client never decides these. Prices, offers, points preview, GST and the **combined estimate** (§24.4) come back from the server with each validation.

### 23.4 Merge at login

Inside `loginWithPhone` (one transaction):

1. Load the guest cart for the token and the customer's active cart.
2. For each guest line: if an identical configuration exists, sum the quantities (capped at the maximum); otherwise move the line.
3. The guest cart becomes `merged`, and the token is invalidated.
4. The client gets a `cart_merged` summary and shows "We added 2 items from your earlier visit".

### 23.5 Submission → request

`submitCart(requestType, preferredCallWindow, delivery {city, state, pincode, address?}, deliveryPreference: ship_together | ship_when_ready, message, couponCode, redeemPoints, consent, idempotencyKey)`:

* re-validates, refusing if any line is `option_unavailable` or `product_unavailable`, or has an unacknowledged `price_changed`
* creates **one** enquiry with N items. Each `enquiry_items` row stores the configuration snapshot, price breakdown, fulfilment type, `estimate_min_days`/`estimate_max_days` and requested quantity
* reserves offer usage (§6.2), records the points **intention** (no reservation yet; §30.5), sets `callback_due_at` for `callback`/`both`, and marks the cart `converted`
* is idempotent: the same key returns the same enquiry

### 23.6 Admin: carts and follow-up (`carts` permission)

* **Customer cart:** on the customer panel, the current cart with validation state and value. Read-only, apart from the follow-up log.
* **Abandoned carts:** active carts with items and `last_activity_at` older than `cart.abandoned_after_hours` (48). Columns: customer, value, items, last activity, **marketing consent**, previous requests, follow-up status. Filters include "consent only".
* **Follow-up log** (`cart_follow_ups`): outcome `contacted`, `not_interested`, `converted`, `do_not_contact`, plus a note. `do_not_contact` suppresses `cart_reminder` permanently for that customer.
* **Automated reminder:** one `cart_reminder` after `cart.reminder_after_hours` (72), **only if** `customers.marketing_opt_in = true` and not `do_not_contact` (D15).
* **Editing items on a request** (after submission) is done on the enquiry (before an order exists) or through an order revision (§25.4). Carts themselves are never edited by staff.

---

## 24. Fulfilment types and lead times

### 24.1 Product settings

| Field | `in_stock` | `made_to_order` |
|---|---|---|
| `fulfilment_type` | `in_stock` | `made_to_order` |
| Stock | `stock_qty` (integer ≥ 0), adjusted by the team; reserved when an order is confirmed | – |
| Window | `dispatch_min_days`–`dispatch_max_days` (e.g. 1–3) | `lead_time_min_days`–`lead_time_max_days` (e.g. 21–35), entered in days or weeks (`lead_time_display_unit`) and stored in days |
| Manufacturing | none | stage template: product → category → default (§26.1) |
| Option impacts | A positive impact turns the line into made-to-order (`fulfilment_reason = option_lead_time`) | Added to the window |

`availability` (customer label) is derived as follows:

* `in_stock` + `stock_qty > 0` → `in_stock`
* `in_stock` + `stock_qty = 0` → `made_to_order` if `fulfilment.allow_backorder_as_mto` (using the product's MTO window, which is required in that case), otherwise `out_of_stock`
* `made_to_order` → `made_to_order`
* `coming_soon` and `discontinued` remain manual overrides that block adding to the cart.

### 24.2 Customer wording (EN / HI)

| Case | English | हिंदी |
|---|---|---|
| In stock | "Ready to dispatch · ships in about 1–3 days" | "डिस्पैच के लिए तैयार · लगभग 1–3 दिन में भेजा जाएगा" |
| Made to order | "Made to order · about 3–5 weeks" | "ऑर्डर पर निर्माण · लगभग 3–5 सप्ताह" |
| Option adds time | "Custom colour adds about 3 days" | "कस्टम रंग से लगभग 3 दिन अधिक" |
| Always shown | "Estimate. We confirm dates when we accept your order." | "अनुमान · ऑर्डर स्वीकार होने पर तारीख़ पक्की की जाएगी" |

Ranges are shown in weeks when the minimum is ≥ 21 days, rounded outward (never shorter than the computed value).

### 24.3 Item estimate (`leadTimeEngine.mjs`, pure and unit-tested)

```
in_stock & qty ≤ available stock & no option impact → [dispatch_min, dispatch_max]                (ready-to-dispatch window)
otherwise (made to order, backorder, or option impact) → [lead_min + Σimpacts, lead_max + Σimpacts]  (D9: impacts are summed)
delivery window = ready window + transit[state] (settings → fulfilment; default range if the state is unknown)
```

### 24.4 Combined estimate

* `ship_together`: the request or order is ready when the **longest** item is ready: `[max(min_i), max(max_i)]`.
* `ship_when_ready`: each item shows its own window, and the summary shows "first item about X days, last item about Y days".

### 24.5 Estimates during the order

When an order is created, each `order_items` row gets `estimated_ready_min_date`/`estimated_ready_max_date` from the confirmation date. They update automatically as stages complete: the remaining planned stage days are re-projected (§26.3). The team can revise them manually with a **reason** (`estimate_revisions`). The customer always sees the **original estimate**, the **current estimate** and the reason for each customer-visible revision.

---

## 25. Order acceptance, editing, creation and versions

### 25.1 How orders start

| `orders.source` | Starts when | Initial status |
|---|---|---|
| `quotation_acceptance` | The customer accepts a quotation version (§8) and `commerce.acceptance_creates_order = true`, or the team runs `convertQuotationToOrder` | `pending_confirmation` |
| `admin_created` | The team creates the order on the customer's behalf (§25.3), usually after a call | `awaiting_customer_confirmation` |

Customer-facing wording: "**Your order is placed**" (pending_confirmation) and "**Please confirm your order**" (awaiting_customer_confirmation).

### 25.2 Team actions on `pending_confirmation`

* **Accept as-is** (`acceptOrder`): checks stock and lead time, then sets the status to `confirmed`. Version 1 becomes `active`. Stock is reserved for in-stock items, manufacturing jobs are created for made-to-order items (§26), offer usage and points reservations are confirmed (§30.5), and `order_placed`/`order_status_changed` notifications go out.
* **Edit** (`proposeOrderRevision`): see §25.4. If the change needs confirmation, the status becomes `awaiting_customer_confirmation`. Otherwise it is applied, and the team then accepts.
* **Cancel**, with a reason. This releases offers and points, and returns the enquiry to `accepted` if the customer never confirmed.

### 25.3 Creating an order for a customer

`createOrderForCustomer` (permission `orders:write`):

* **Customer:** an existing customer is required. For a phone-only buyer, the team first creates a customer record with a phone number (unverified, `status = invited`). That buyer can claim it by signing in with OTP on the same number.
* **Items:** from the customer's open enquiry (pre-filled from its snapshot), from their current cart, or added freshly by the team using the same configurator and validation as the website (`pricingEngine`, option rules). Every price that differs from the computed price needs a reason, exactly like quotations.
* **Delivery:** delivery details and preference, terms, validity for confirmation (`orders.revision_confirmation_days`), and an optional points redemption (only within the customer's available balance; §30.4).
* **Result:** version 1 is created with status `pending_customer`, and the order is `awaiting_customer_confirmation`. The customer gets `order_revision_pending` with a link. The linked enquiry moves to `converted_to_order` (§7.2).
* **Phone confirmation** (`recordOrderConfirmationByPhone`) is possible only if enabled (D7). It needs a logged call and a reason, and it is audited.

### 25.4 Revisions (order versions)

* Any change to **items, configuration, quantity, unit price, discount, delivery charge, points, terms or delivery details** creates a new `order_versions` row with:
  * a reason
  * a full item snapshot (`order_version_items`)
  * recomputed totals and GST
  * a machine-readable **diff** against the active version: added, removed and changed lines; field-level old → new values; total deltas
* **Needs customer confirmation** (`requires_confirmation = true`) for any change other than delivery address or date (D6). Those two are applied immediately, with a customer-visible event.
* **One pending version at a time.** While a version is `pending_customer`, the active version stays in force and production can continue on unaffected items. The order shows "Change awaiting your confirmation".
* **Customer decision** (`decideOrderVersion`):
  * *confirm* (terms tick; stores timestamp, IP and UA): the new version becomes `active` and the previous one `superseded`. Stock, jobs, shipments not yet dispatched and points reservations are re-synced in the same transaction.
  * *decline* (optional reason): the version becomes `declined_by_customer`, and the active version stays.
* A pending version **expires** after `orders.revision_confirmation_days` (state `expired`). The team can also **withdraw** it (`withdrawn`, with a reason).
* **Guards.** Items already in a dispatched shipment cannot be removed or changed. Quantity can only go down to the dispatched quantity.
* **Admin UI:** a side-by-side **diff view** (old | new, with changed cells highlighted and totals compared). Every version is listed with author, reason and decision. Every step is audited (`order.revision_proposed`, `order.revision_confirmed`, …).

### 25.5 Items and fulfilment

Each `order_items` row has a `fulfilment_type` (copied from the snapshot and the §24.1 rules) and a `fulfilment_status`:

`pending` → (`in_production` for made-to-order) → `ready` → `in_shipment` → `dispatched` → `delivered`, or `cancelled`.

* In-stock items become `ready` when the order is confirmed and stock is reserved.
* Made-to-order items become `ready` when their manufacturing job completes (§26).
* Quantities are tracked per unit across shipments (D8): an item is `dispatched` only when all of its units are in dispatched shipments.

### 25.6 Header status roll-up (`orderRollup.mjs`, pure and unit-tested)

After `confirmed`, the system computes the header status from the non-cancelled items:

```
any item delivered & some not                     → partially_delivered
all delivered                                     → delivered
any item dispatched (or in a dispatched shipment) → partially_dispatched (dispatched if all)
all items ready / in_shipment                     → ready_to_dispatch
any manufacturing job started                     → in_production
otherwise                                         → confirmed
```

`completed` is set by the team, or automatically `delivery.complete_after_days` (14) after `delivered` when there are no open delivery issues. `cancelled` is allowed until the first shipment is dispatched. After that, the team cancels individual undispatched items through a revision.

---

## 26. Manufacturing tracking

Made-to-order items only. In-stock items show "Ready in stock" instead.

### 26.1 Stage templates

`manufacturing_templates` have a scope of `product`, `category` or `default`. Each has ordered stages with a bilingual name, planned days, an optional customer description and a "customer-visible by default" flag. A product uses its own template, then its category's, then the default.

The seeded default:

| # | Stage | Planned days |
|---|---|---|
| 1 | Order confirmed | 0 |
| 2 | Material procurement | 5 |
| 3 | Fabrication | 10 |
| 4 | Painting | 3 |
| 5 | Assembly | 4 |
| 6 | Quality check | 2 |
| 7 | Ready for dispatch | 0 |

The total planned days should sit inside the product's lead-time window. The admin is warned if they don't.

### 26.2 Jobs

When an order is confirmed, each made-to-order item gets a `manufacturing_jobs` row with stages copied from the template. A later template edit never changes running jobs.

* **Job status:** `not_started`, `in_progress`, `on_hold`, `completed` or `cancelled`, plus an `is_delayed` flag with a delay reason.
* **Stage status:** `pending`, `in_progress`, `completed` or `skipped`. A skipped stage needs a reason.

### 26.3 Updates

`updateManufacturingStage` / `addManufacturingUpdate` record:

* the stage status
* a note in the author's language (the customer sees it as written; translation is optional)
* up to 6 media files
* **visibility**: `customer` or `internal`, defaulting to the stage template's flag

Starting the first stage sets the job to `in_progress`, and the item to `in_production`. Completing the last stage sets the job to `completed`, and the item to `ready`.

* **Estimate re-projection.** On each stage change, the remaining planned days are projected from today. If the new ready date moves **later** than the current estimate by more than 2 days, the job is flagged `is_delayed` and the team is prompted to add a reason.
* **Manual revision** (`reviseEstimate`): new dates, a reason and the customer-visible flag. This creates an `estimate_revisions` row and an `estimate_revised` notification.
* **Delay flag:** set and clear with a reason. The customer sees "Delayed: <reason>" only when the flag's reason is customer-visible.

### 26.4 Media pipeline (manufacturing, shipments, delivery confirmation, issues)

| Rule | Value |
|---|---|
| Images | JPEG, PNG, WebP (HEIC from iPhones is converted by Safari when uploading through `accept="image/*"`); ≤ **2 MB**; magic-byte check; sharp → WebP + thumbnail, EXIF/GPS stripped |
| Video | MP4, MOV, WebM; ≤ **50 MB**; magic-byte check; poster frame; optional transcode to H.264 MP4 720p (D10) |
| Storage | `private/` always. Customer-visible assets are served through signed URLs (§15.4) |
| Status | `media_assets.processing_status`: `pending`, `processing`, `ready`, `failed`. The update is saved immediately and the media appears when ready |
| Limits | Rate-limited per member; 6 files per update |

---

## 27. Shipping, drivers and manual tracking

### 27.1 Shipments

The team creates one or more **shipments** per order (`SHP-YYYY-NNNNNN`) once items are `ready`. In-stock items can ship as soon as the order is confirmed. Each shipment records:

* **Contents:** items and **unit quantities** (`shipment_items`); an item's units can be split across shipments.
* **Route and dates:**
  * origin: warehouse or factory address (settings → business, or free text)
  * destination: from the active order version
  * planned pickup and delivery dates
* **People and costs:**
  * the driver and the vehicle, with registration and type copied from the driver record, overridable
  * internal **freight cost** (paise; never customer-visible)
* **References:**
  * shipment reference and handling notes (internal)
  * **LR number**, **e-way bill number** and **invoice number**, with the matching documents uploaded through §28

Shipment `status`: `planned` → `preparing` → `picked_up` → `in_transit` → `reached_destination` → `delivered`, or `cancelled` (only before `picked_up`). `is_delayed` is a separate flag.

### 27.2 Drivers (`drivers` permission; identity files need `driver_identity`)

**Driver master:**

* name, address and mobile, optional email
* ID photo (private) and optional licence number (private)
* vehicle registration number, vehicle type (e.g. tractor-trolley, pickup, mini truck, truck) and vehicle photo
* notes, and `active`/`inactive`

A driver can be reused across shipments. Inactive drivers can't be assigned. **ID photo and licence** are stored in `driver_identity_files` under `private/`. Viewing them needs `driver_identity:read`, and every view is audited. Retention follows D17.

### 27.3 Manual tracking events (no GPS)

The team phones the driver and records `addShipmentEvent`:

| Event type | Effect on status |
|---|---|
| `preparing` | → `preparing` |
| `picked_up` | → `picked_up` ("Picked up from warehouse") |
| `in_transit` | → `in_transit` |
| `reached_location` | stays `in_transit`; location text required ("Reached Indore") |
| `delayed` | sets `is_delayed`, reason required |
| `delay_cleared` | clears `is_delayed` |
| `reached_destination` | → `reached_destination`; triggers delivery confirmation (§29) |
| `delivered` | → `delivered` (only through §29, or the admin reason flow) |
| `driver_changed` / `vehicle_changed` | assignment change (§27.4) |
| `note` | none |
| `cancelled` | → `cancelled` (before pickup only) |

Each event has `occurred_at` (it can be back-dated within 24 h, and the recorded time is kept as well), location text, a note, optional photo/video (§26.4) and **`customer_visible`**. Events are **append-only**: a mistake is fixed with a new `note` event ("Correction: …"), never by editing.

### 27.4 Driver or vehicle change mid-journey

`changeShipmentAssignment(driverId, vehicle, reason)` closes the current `shipment_assignments` row and opens a new one. It writes a `driver_changed`/`vehicle_changed` event (customer-visible by default, with no personal details beyond what §27.5 allows) and an audit row.

### 27.5 What the customer sees

On the tracker:

* the shipment number, the items in it, status chips, customer-visible events with time, location, note and media
* planned and revised delivery dates
* the **limited driver/vehicle card**, as configured in settings → `shipping`:
  * vehicle number and vehicle type: shown by default
  * driver first name: shown by default
  * phone: the company dispatch number by default; the driver's own number only if `show_driver_phone` (D18)

**Never shown:** the ID photo, licence, driver address, notes, freight cost or internal events.

---

## 28. Order documents and offline payments

### 28.1 Documents

`order_documents` can attach to an **order**, a **manufacturing job stage** or a **shipment**.

Types: `tax_invoice`, `proforma_invoice`, `payment_receipt`, `eway_bill`, `lorry_receipt`, `warranty_card`, `user_manual`, `qc_report`, `delivery_challan`, `other`.

Each document has:

* document number and document date
* amount (paise, required for invoices, proformas and receipts)
* language (`en`/`hi`/`other`)
* `document_group_id` and `version`
* status `current`, `superseded` or `withdrawn`
* visibility `customer` or `internal`
* uploaded by and uploaded at

PDFs and images only, ≤ 20 MB, magic-byte check, private storage.

* **Replace** creates version n + 1 (with a reason) and supersedes the previous version. **Nothing is overwritten.** Superseded versions stay downloadable by staff and stay listed for the customer as "older version".
* **Withdraw** (with a reason) hides a document from the customer but keeps it for staff.
* Every add, replace and withdraw is audited. Sharing a customer-visible document sends `document_shared`.

### 28.2 Customer access

The tracker has a **Documents** section per order, grouped by type, showing the current versions. Downloads go through `orderDocumentLink(documentId)`, which checks ownership and visibility and returns a **signed URL valid for 300 s** (§15.4). The PDF is never emailed as an attachment, apart from quotations (§8).

### 28.3 Tax invoices (in-house, D5)

FarmYantra generates GST documents itself. Permission feature **`invoices`** (read/write); the **Accounts Executive** role holds `invoices:write` and `payments:write`.

**Document types:** `tax_invoice`, `proforma_invoice` (allowed before confirmation), `credit_note` (only against an issued tax invoice).

**Lifecycle:** `draft → issued → cancelled`.

* **Create draft** from an order's active version: lines (description, configuration summary, HSN, quantity, unit, rate, discount, GST rate), delivery and installation as service lines (SAC from settings), reward points as a separate pre-tax line, supplier snapshot (legal name, address, GSTIN, state code from Settings → Business), buyer (name, address, optional GSTIN — validated with the checksum), ship-to, place of supply.
* **Tax:** CGST + SGST when the supplier state equals the place of supply, otherwise IGST; computed per line and summarised by HSN and rate; optional rounding to the rupee with a round-off line; amount in words (Indian numbering).
* **Edit draft:** buyer, place of supply, dates, lines, notes, terms, template. Drafts render with a DRAFT watermark.
* **Issue:** assigns the next number `PREFIX + FY + / + sequence` (e.g. `INV/2026-27/0001`, max 16 characters), gap-free per type and financial year (April–March), never reused; locks the document; stores the PDF privately; shares it as a customer-visible order document. Requires the supplier GSTIN and HSN on every line.
* **Send:** emails the PDF as an attachment (`invoice_issued`) — on issue (choice, or `invoicing.auto_send_on_issue`) or later ("email again"); sent count and time are recorded.
* **Correct:** issued invoices are never edited. Raise a credit note (all or chosen lines), then cancel if needed; a tax invoice can only be cancelled after a credit note is issued against it.

**Templates** (`invoice_templates`, Admin → Tax invoices → Templates): accent colour, logo, font size, titles per type, copy label, header note, column switches (SKU, HSN, discount), tax summary, amount in words, bank details/UPI for offline payment, declaration, terms, footer, signatory name/designation and signature image. One default; live PDF preview with sample data.

**Settings** (`invoicing` section, `invoices:write`): prefixes per type, number digits, default due days, rounding, services SAC and GST rate, unit label, auto-send, state code.

> ⚠ **Accountant sign-off required before launch:** format and numbering, e-invoicing/IRN applicability for the turnover, treatment of reward-point discounts (D4) and freight.

### 28.4 Offline payments (no online collection in this release)

`recordPayment` (`payments:write`, idempotent) records:

* entry type `payment` or `refund`
* amount (paise)
* paid date
* mode: `cash`, `upi`, `bank_transfer`, `cheque`, `demand_draft`, `card_offline` or `other`
* reference (UTR, cheque number, …)
* an optional receipt document (`payment_receipt`, §28.1)
* a note

Each record is numbered `PAY-YYYY-NNNNNN`. Records are never edited. `voidPayment` needs a reason and keeps the row with `status = voided`.

**Payment status** is computed on every change (all voided rows excluded):

```
net = Σ payments − Σ refunds
not_recorded  no non-voided rows
paid          net ≥ order total (active version)
refunded      refunds > 0 and net ≤ 0
partial       otherwise
```

The customer sees the status, the received and outstanding amounts and the list of receipts. `payment_recorded` is sent for each payment.

**Extension point (Phase 8):**

* `order_payments.provider` (null = offline) and `provider_reference` columns
* a future `payment_intents` table
* webhooks feed the same `recordPayment` service, so status logic stays in one place

---

## 29. Delivery confirmation, delivery issues and verified reviews

### 29.1 Prompt

When a shipment reaches `reached_destination`:

* a `delivery_confirmations` row (`awaiting_customer`) is created
* the customer gets `delivery_confirmation_requested` by email and in-app, and a banner on the tracker and dashboard asks three one-tap questions:
  * ✅ **Received in good condition** → `received_ok`
  * ⚠ **Received with issues** → `received_with_issues` (description required, up to 6 photos/videos, issue type)
  * ❌ **Not received yet** → `not_received`

The customer can also tick **"You may show my delivery photo on the website"**. This is the consent for §31.3, stored on the confirmation.

### 29.2 Effects

| Answer | Shipment | Issue case |
|---|---|---|
| `received_ok` | `delivered` | – |
| `received_with_issues` | `delivered` (the goods are with the customer) | opened, type from the answer (`damaged`, `missing_items`, `wrong_item`, `other`) |
| `not_received` | stays `reached_destination` | opened, type `not_received`, team alerted immediately |

### 29.3 No response

A reminder goes out after `delivery.confirmation_reminder_days` (2). After `delivery.auto_mark_after_days` (N = 7), the shipment appears in **Pending delivery confirmations**. The team (`delivery_issues:write`) can **mark it delivered** with a **recorded reason**, for example "Driver confirmed handover; customer called". The confirmation becomes `admin_marked_delivered`, and it is audited. It is never automatic.

### 29.4 Delivery issue cases (`DIC-YYYY-NNNNNN`)

* **Status:** `open` → `in_progress` → `awaiting_customer` → `resolved` → `closed`. A customer reply moves `awaiting_customer` back to `in_progress`.
* **Content:** a message thread (customer-visible or internal), media, an assignee, a resolution type (`repaired`, `part_replaced`, `unit_replaced`, `redelivered`, `refund_recorded`, `no_action_needed`, `other`) and resolution notes.
* **Effects:** an open issue blocks automatic `completed` (§25.6) and earned-point maturity (§30.5).

### 29.5 Review invitation

On `received_ok`, `received_with_issues` or `admin_marked_delivered`, every delivered order item becomes **delivery-verified**, and `review_invitation` is sent (once per order, after `received_ok`, or 3 days after the other two). Reviews for these items are created as `verification_status = verified`, `verification_source = delivery_confirmation`. **Moderation still applies** (§10).

---

## 30. Reward points

### 30.1 Settings (`rewards` section; changes need `rewards:write`, which is privileged)

| Setting (editable in Admin → Reward points) | Default (D3) |
|---|---|
| `enabled` | false until Phase 7 sign-off |
| `point_value_paise` | 100 (1 point = ₹1) |
| `earn_rule` | `percent_of_value`, 100 bps (1 %) of the net pre-tax value; or `fixed_per_product` (product override, §5.1) |
| `min_redeem_points` | 100 |
| `max_redeem_percent_bps` | 1000 (10 % of the pre-tax order value after offers) |
| `pending_days` | 7 |
| `expiry_months` | 12 |
| `review_bonus_points` / `referral_bonus_points` | 0 (off); when on, review points need an approved review, and referral points need the referee's first delivered order |
| `combinable_with_offers` | true (overridable per offer, §6.2) |
| Exclusions | `products.points_excluded`, category exclusions, offers with `allow_points = false` |

**Campaigns** (`reward_campaigns`): bonus multipliers or fixed bonuses for a date range, scoped to products or categories, with an EN/HI title.

### 30.2 Data

* `customer_points_accounts`: `available`, `pending` and `reserved` balances.
* `points_lots`: each earning lot has a source, amount, remaining, `available_at`, `expires_at` and status (`pending`, `available`, `consumed`, `expired`, `reversed`).
* `points_reservations`: per order, with status `reserved`, `consumed` or `released`.
* `points_ledger`: append-only. Entry types are exactly **`earned`, `redeemed`, `expired`, `adjusted`, `reversed`**. Each entry has signed points, the balance after it, a reference (order, review, referral, adjustment, campaign), the actor and a reason.

### 30.3 Earning

* On **confirmed delivery** of an order (§29.5), points are calculated on the net pre-tax value of the delivered items, after offers and redeemed points, plus campaign bonuses. A `points_lots` row is created as `pending` and the pending balance increases. Nothing is written to the ledger yet.
* After `pending_days` with no open delivery issue, the job moves the lot to `available`. It writes an `earned` ledger entry, increases `available`, and sends `points_earned`.
* If the order (or an item) is refunded or cancelled after earning, the lot is `reversed`. If the points were already spent, the shortfall is recorded as a negative `adjusted` entry that the next earnings recover, and the account is flagged for review. Balances never go negative (§30.6).

### 30.4 Redeeming

* **Request:** the "Use my points" toggle on the cart shows the maximum usable amount (the smaller of the balance, `max_redeem_percent_bps` and the eligible value) as an **indicative** discount line.
* **Quotation:** the team includes a **points discount line** (pre-tax, after offers) within the customer's current available balance. It is re-validated at send and at acceptance. If the balance has dropped, acceptance is blocked with a clear message and the team revises.
* **Admin-created order or revision:** the same rule.
* **Line display:** "Reward points redeemed (N pts)", on quotation PDFs, order versions and uploaded invoices (D4).

### 30.5 Lifecycle (D1)

| Event | Points effect |
|---|---|
| Order **confirmed** (`acceptOrder`, or the customer confirms an admin-created order) | Create a `points_reservations` row (`reserved`); move `available` → `reserved` (FIFO lots, oldest expiry first) |
| Revision confirmed with a different points amount | Adjust the reservation up or down, re-validating the balance |
| Order **delivered** (header `delivered`) | Reservation → `consumed`; write a `redeemed` ledger entry; the lots' remaining amounts decrease |
| Order **cancelled** before delivery | Reservation → `released`; `reserved` → `available` (lots that expired in the meantime expire now) |
| Lot reaches `expires_at` | `expired` ledger entry; `points_expiring` is sent 30 days before |

### 30.6 Integrity and abuse

* All movements happen in a transaction holding `SELECT … FOR UPDATE` on the customer's account row. Every movement carries an idempotency key and a `CHECK (available >= 0 AND reserved >= 0 AND pending >= 0)`. Totals are clamped so they never go below zero.
* **Manual adjustments** (`adjustPoints`) need a reason. Above ±1,000 points they also need a Super Admin.
* **Abuse signals** (report, not automatic blocking):
  * referrals from the same device fingerprint, address or payment reference
  * many earning orders cancelled after delivery
  * unusually large adjustments
  * reviews posted only for bonus points
* Everything is audited.

### 30.7 UI

* **Customer:**
  * Account → Rewards: balances, history (ledger, in plain language), points expiring soon and how to earn
  * "You'll earn about N points" on the product page and cart (indicative; excludes points-excluded items)
  * the redeem toggle in the request review step
* **Admin:**
  * rules (settings), campaigns, the customer points panel with history and an adjust action, reports (issued, redeemed, expired, outstanding liability in ₹), and abuse signals

---

## 31. Order tracker and public trust content

### 31.1 Order tracker (`/account/orders/:id`)

One page per order, in plain English or Hindi, with an animated progress rail (§32.5):

```
Order accepted ─► Manufacturing (stages)  ─► Dispatch ─► In transit ─► Reached ─► Delivered ─► Review
                  or "Ready in stock"
```

* **Per item:** the fulfilment chip, current stage or status, and the original vs current estimate with revision reasons.
* **Manufacturing:** a timeline of customer-visible updates with photos and videos (signed URLs), plus a delay banner with the reason when flagged.
* **Shipments:** one card per shipment with the items, events, location text, the limited driver/vehicle card (§27.5) and the planned vs revised delivery date.
* **Documents** (§28.2), **payments and receipts** (§28.4), and a **pending revision** card with the diff summary and Confirm / Decline (§25.4).
* **Delivery confirmation** prompt (§29.1), **issue cases**, the **review** invitation, and **points** earned or redeemed for the order.
* **Updating:** pull-to-refresh on mobile. The page refetches on focus. There is no websocket in this release.

### 31.2 Status wording

Every status code in §34 has an EN and HI customer label in `i18n`, for example `in_production` → "Being built" / "निर्माण जारी है", and `partially_dispatched` → "Part of your order is on the way" / "आपके ऑर्डर का कुछ हिस्सा रास्ते में है". Internal codes are never shown to customers.

### 31.3 Trust section (Home and About)

**Rule: no fabricated numbers.** Each figure is either **computed** from real data or an **admin override with an "as of" date**, and the website always shows the "as of" date.

| Stat | Source | Override |
|---|---|---|
| Established year / years of experience | `trust.established_year` (years computed from it) | – |
| Happy customers | Distinct customers with ≥ 1 delivered order (nightly `trust_stats_snapshots`) | `trust.overrides.happy_customers` + `as_of` + an attestation note |
| Machines delivered | Σ quantity of delivered order items (snapshot) | Same pattern |
| Average rating | Published reviews (verified + approved) only, with the count; hidden below 5 reviews | – (not overridable) |
| States / cities served | Distinct delivery states and cities of delivered orders | Override list + `as_of` (e.g. pre-platform history) |
| Address, map, phone, email, hours | `business` + `trust` settings; static map image + "Get directions" (D12) | – |
| Testimonials | Reviews flagged *featured* that are verified + approved | – |
| Delivery photos | `delivery_photos` uploaded by staff, each linked to a delivery confirmation with **photo consent** (§29.1); withdrawable | – |
| Certifications and awards | `certifications`: name, issuer, number, valid from/to, document; shown only while valid; the admin attests they are factual | – |

Overrides need `content:write` and are audited. If neither a computed value nor an override exists, the tile is **hidden**, never shown as 0.

**Count-up animation:** 600–1,200 ms, ease-out, starts when in view, runs once. Under `prefers-reduced-motion`, or for screen readers, the final value renders immediately (`aria-live` off; the value is in the DOM from the start).

---

## 32. Visual identity, art direction and motion

### 32.1 Personality

Modern, warm, farmer-friendly, confident. *"Built in our workshop, made for your field."* The style is bold headings, rounded cards (radius 16–20 px), generous imagery, plain bilingual language, and no stock-photo clichés.

### 32.2 Palette (design tokens)

| Token | Hex | Use |
|---|---|---|
| `--fy-green-900` (field green) | `#1F4D2B` | Primary, headers, tab bar active |
| `--fy-green-600` (leaf) | `#4C9A2A` | Success, progress |
| `--fy-amber-500` (harvest) | `#E8A317` | Accent, primary CTA on dark, offer posters |
| `--fy-soil-700` | `#7A4E2D` | Illustration ground, secondary accents |
| `--fy-sky-100` | `#DCEFF7` | Hero sky, info surfaces |
| `--fy-wheat-50` | `#FFF7E6` | Page background (warm off-white) |
| `--fy-ink-900` | `#1B1F1A` | Body text (AA on all surfaces) |
| `--fy-red-600` | `#C2410C` | Delays, errors |

Each token has a dark-mode counterpart. The `theme-color` meta follows light and dark (§33.2).

### 32.3 Illustration and photography

* **Style:**
  * flat vector with a subtle grain texture and warm sunrise lighting; 2–3 tone shading; rounded shapes; no outlines thicker than 2 px
  * people: Indian farmers of different ages, **women and men**, in respectful regional clothing; no caricature
  * machines: **generic and unbranded**, or FarmYantra's own products; never another manufacturer's logos, trade dress or recognisable models
  * landscapes: wheat and paddy fields, mustard in bloom, village roads, workshop interiors
* **Photography:** the company's own product, workshop and delivery photos (with consent, §31.3), consistently colour-graded warm.
* **Licensing:** only original commissioned art, properly licensed stock, or admin-uploaded material the business owns. No copyrighted characters, film or cartoon references, or unlicensed images. Every banner and poster upload records its **licence source and proof** (`banner_variants.licence_note`, and an optional licence file). Commissioned work needs a written assignment or licence.
* **Hero concept:** a sunrise field in three parallax layers (sky, field, farmer with machine) with the headline on the left (EN/HI) and a CTA. On mobile it becomes a static stacked composition that is LCP-safe: the hero image is an AVIF/WebP `<img>` with fixed dimensions, and the parallax applies only to decorative layers after load.

### 32.4 Banners and posters (`banners` permission)

* **Placements:** `home_hero` (carousel ≤ 5, auto-advance off by default), `home_strip`, `offers_page`, `category_top`, `product_promo`.
* **Each banner:** an internal name, a placement, `starts_at`/`ends_at`, priority, stored status (`draft`, `published`, `archived`; a `published` banner is shown as *scheduled*, *live* or *ended* according to its dates), an optional link to an offer or product, and **variants** per language (`en`, `hi`) × device (`mobile`, `desktop`). Each variant has an image, a headline/subheadline/CTA text, **alt text (required)**, focal point and licence note.
* **Fallback:** a Hindi visitor sees the Hindi variant, otherwise the English one. Mobile falls back to desktop with cropping at the focal point.
* **Poster templates** (designed once, filled by the admin):

  | Template | Sizes | Content |
  |---|---|---|
  | Festival offer (Diwali, Baisakhi, Pongal, Kharif/Rabi season) | 1920×600 web, 1080×1350 social, 1080×1920 story | Offer headline, % or ₹, end date, machine cut-out, festival motif (original art) |
  | New arrival | Same | Machine photo, 3 key specs, "Starting from ₹X" |
  | Catalogue | Same | Cover mock-up, "Download free catalogue", QR to `/catalogues` |
  | Testimonial | 1080×1350 | Verified review quote, rating, customer first name + district (with consent), delivery photo |

  Text-safe zones are marked in each template. Text is kept ≤ 20 % of the image area. Hindi text uses the Devanagari display weight.
* **Empty-state illustrations:**
  * empty cart (a farmer with an empty trolley)
  * no orders yet
  * no search results (a magnifier over a field)
  * offline (a tractor under a cloud)
  * no notifications
  * no reviews yet
  * delivery issue resolved (a handshake)
* **Icon set:** a lucide-style stroke 2 px rounded base set, plus custom agri icons in the same grid:
  * machines: tractor, tiller/rotavator, sprayer, harvester, seed drill, thresher
  * process: workshop, painting brush, QC badge
  * delivery: truck, location pin, invoice, rupee coin (points)

### 32.5 Motion system

| Use | Spec |
|---|---|
| Hero entrance | Headline and CTA fade + rise 12 px, 300 ms, 60 ms stagger; never delays the LCP image |
| Scroll reveal | Opacity 0→1 + translateY 16→0, 250 ms, IntersectionObserver, once; content is never hidden if JS fails (the class is added only by JS) |
| Card hover/press | Scale 1.00→1.02 hover, 0.98 press, 150 ms; shadow change |
| Page transitions | Fade/slide 8 px, 200 ms (View Transitions API where supported, otherwise CSS); back navigation reverses direction |
| Bottom sheets | Slide up 250–300 ms with a spring-like cubic-bezier(0.2, 0.8, 0.2, 1); drag to dismiss |
| Tracker progress | Rail fills to the current step, 400 ms; the active step pulses twice, then stops |
| Stat count-up | §31.3 |
| Skeletons | Shimmer 1.2 s loop, low contrast; replaced without layout shift (reserved sizes) |

**Rules:**

* animate **transform and opacity only**
* durations 150–400 ms (count-ups excepted)
* nothing blocks interaction, and content is never hidden behind an animation
* `prefers-reduced-motion: reduce` disables movement: fades only, ≤ 150 ms, no count-up, no parallax, no auto-advancing carousels
* budgets: **LCP ≤ 2.5 s, CLS ≤ 0.1, INP ≤ 200 ms** on a mid-range Android phone over 4G (§17.1)
* no animation library heavier than 10 kB gzip on the critical path (Lottie: D14)

---

## 33. Mobile-first, app-like experience and PWA

### 33.1 App shell (website)

* **Bottom tab bar** (≤ 768 px), 5 tabs, each with an icon and a label: **Home**, **Products**, **Cart** (badge with the line count; label "Requests" when the cart is empty and requests exist), **Orders** (badge for actions needed: confirm a revision, confirm a delivery), **Account**. The active tab keeps its scroll position. Tapping the active tab scrolls to the top.
* **Sticky action bars:** "Add to request list" on the product page, "Send request" on the cart, Confirm/Decline on a pending revision. Placed in the thumb zone above the tab bar.
* **Bottom sheets** for filters, sort, the configurator, the language picker, delivery confirmation and image viewers. Each has a drag handle, a backdrop tap to close, focus trapping and Esc support.
* **Gestures:**
  * swipe in galleries (`touch-action: pan-y` on the container, snap points)
  * pull-to-refresh on orders, requests, notifications and the tracker (custom; native overscroll is disabled only on those lists)
  * swipe-to-dismiss on sheets
  * every gesture has a button alternative
* **Loading:** skeleton screens for lists, product pages and the tracker, never full-page spinners. Optimistic UI for cart quantity changes, rolled back on server error.
* **Transitions:** §32.5. The header becomes compact on scroll.

### 33.2 Safe areas, viewport and input

* **Viewport:**
  * `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
  * header, tab bar and sticky bars pad with `env(safe-area-inset-top|right|bottom|left)`
  * the tab bar height is `56px + env(safe-area-inset-bottom)`
* **Units and layout:**
  * full-height views use `100dvh` (with a `100svh` fallback for sheets), never `100vh`
  * **no horizontal scroll at 320 px**: tested with long Hindi strings, long prices (₹12,34,56,789) and long product names
* **Keyboard-aware forms:**
  * inputs scroll into view on focus (`scrollIntoView({block:'center'})` after `visualViewport` resize)
  * sticky CTAs move above the keyboard using `visualViewport`
  * the right input modes: `inputmode="numeric"` with `autocomplete="one-time-code"` for OTP, `tel` for phone, `numeric` for pincode
* **Touch targets** are ≥ 44×44 px, with ≥ 8 px between adjacent targets. Primary actions sit in the bottom third.
* **Notch and landscape:** content stays inside the safe area in landscape, and the tab bar is hidden in landscape on phones (≤ 500 px tall) to save room.
* **Status bar:**
  * `<meta name="theme-color" content="#1F4D2B" media="(prefers-color-scheme: light)">` and a dark counterpart
  * `apple-mobile-web-app-status-bar-style="black-translucent"` when installed

### 33.3 Installable PWA

* **Manifest:**
  * `name`, `short_name` ("FarmYantra"), `start_url: "/?source=pwa"`, `scope: "/"`, `display: "standalone"`, `orientation: "portrait"`
  * theme and background colours from settings → `pwa`
  * icons 192, 512 and **maskable** 512; `apple-touch-icon` 180
  * `shortcuts` for "My orders" and "Products"
* **Splash:** Android uses the manifest colours and icon. iOS uses generated `apple-touch-startup-image` sets for common device sizes.
* **Service worker** (Workbox through `vite-plugin-pwa`):
  * **precache** the app shell (HTML, JS, CSS, fonts, the offline page, empty-state SVGs)
  * runtime-cache public images (stale-while-revalidate, max 200 entries, 30 days)
  * **never cache** GraphQL POSTs, `/files/*`, signed URLs or anything with an `Authorization` header
  * navigation falls back to `/offline` when the network fails (it shows the cart count from memory and a retry button)
  * new versions show a "New version available. Refresh" toast and never auto-reload mid-task
* **Install prompt** (non-intrusive):
  * capture `beforeinstallprompt`
  * show a small dismissible card only after the second visit **or** after the first submitted request
  * never on the first screen
  * dismissing hides it for 30 days
  * iOS shows a "Share → Add to Home Screen" hint sheet under the same rules

### 33.4 Push notifications (extension point only)

* The `push_subscriptions` schema, VAPID env vars (§18.2) and a `notificationHelper` channel interface (`email`, `in_app`, later `push`) are reserved, but nothing is sent in this release.
* When enabled (Phase 8), permission is asked only in context ("Get updates on this order?"). iOS needs 16.4+ and an installed PWA.

### 33.5 Admin panel on mobile (urgent flows)

* **Layout:** the admin stays desktop-first, but these flows must work one-handed on a phone (≥ 360 px):
  * **Order view:** a compact header with status, customer and **Call** (`tel:`) and **WhatsApp link** (`https://wa.me/…`, a manual click only) buttons
  * **Log call:** a bottom sheet with outcome chips, a note and the next call time
  * **Update tracking:** a quick event form (event type chips, location, note, customer-visible toggle)
  * **Manufacturing update:** stage chips, a note and visibility
  * **Upload photo/video from the camera:** `<input type="file" accept="image/*,video/*" capture="environment">` with progress, retry, and size/type checks before upload (D11 for large videos)
* **Navigation:** a "Today" mobile home with overdue call-backs, deliveries awaiting confirmation, delayed jobs and shipments in transit. The MUI sidebar collapses into a drawer, and tables switch to card lists below 600 px for these pages.

### 33.6 Device and network test plan

| Area | Devices / conditions | Checks |
|---|---|---|
| iOS Safari | iPhone SE (2nd/3rd gen, 375×667), iPhone 13/14 (notch), iPhone 15 Pro (Dynamic Island); iOS 16.4+ and latest | Safe areas in portrait/landscape; `dvh`; keyboard over sticky CTA; Add to Home Screen; standalone status bar; video playback of uploaded media; bottom sheet drag vs page scroll |
| Android Chrome | Low-end (2–3 GB RAM, e.g. Redmi/Realme A-series), mid-range (Moto G Power profile), Samsung Internet | Install prompt and maskable icon; gesture navigation bar insets; pull-to-refresh not fighting the browser; WebView in-app browsers (WhatsApp/Facebook) |
| Small phones | 320×568, 360×640, plus 200 % text zoom | No horizontal scroll; Hindi wrapping; 44 px targets; tab bar labels don't truncate badly |
| Notched / landscape | Notch, punch-hole, foldable outer screen | Insets on all four sides; tab bar hidden in short landscape |
| Network | Slow 3G, Fast 3G, 4G throttling, offline, flaky (packet loss) | Skeletons appear < 300 ms; offline page; cart actions queue an error and retry clearly; uploads resume or retry; no double submissions (idempotency) |
| Performance | Lighthouse CI on Home, Shop, Product, Cart, Tracker | LCP ≤ 2.5 s, CLS ≤ 0.1, INP ≤ 200 ms, JS budget |
| Accessibility | VoiceOver (iOS), TalkBack (Android), reduced motion, dark mode | Sheet focus, tab bar labels, count-ups, tracker semantics (`ol` with `aria-current`) |
| Admin mobile | Android Chrome + iOS Safari, 360–414 px | Call/log call, tracking event, camera upload of 2 MB image and 50 MB video on 4G |

---

## 34. Status reference

The canonical status codes. Code, `CHECK` constraints, `i18n` labels and every other document must use exactly these. *(sys)* means only the system sets it.

| Entity | Statuses | Notes |
|---|---|---|
| Enquiry / request `request_type` | `callback`, `quotation`, `both` | §2 |
| Enquiry `status` | `submitted`, `under_review`, `contacted`, `clarification_required`, `accepted`, `quotation_sent` *(sys)*, `customer_accepted` *(sys)*, `customer_declined` *(sys)*, `converted_to_order` *(sys)*, `rejected`, `cancelled`, `closed` | §7.1–7.2 |
| Quotation | `draft`, `sent`, `accepted`, `declined`, `expired`, `cancelled` | §8 |
| Quotation version | `draft`, `sent`, `accepted`, `declined`, `expired`, `superseded` | §8 |
| Cart | `active`, `merged`, `converted`, `expired` (abandoned = `active` + inactive > threshold; derived) | §23 |
| Cart item `validation_state` | `valid`, `price_changed`, `estimate_changed`, `quantity_adjusted`, `option_unavailable`, `product_unavailable` | §23.3 |
| Cart follow-up outcome | `contacted`, `not_interested`, `converted`, `do_not_contact` | §23.6 |
| Product `fulfilment_type` | `in_stock`, `made_to_order` | §24.1 |
| Product `availability` | `in_stock`, `made_to_order`, `out_of_stock` *(derived)*; `coming_soon`, `discontinued` *(manual)* | §24.1 |
| Order `source` | `quotation_acceptance`, `admin_created` | §25.1 |
| Order `status` | `pending_confirmation`, `awaiting_customer_confirmation`, `confirmed`, `in_production` *(sys)*, `ready_to_dispatch` *(sys)*, `partially_dispatched` *(sys)*, `dispatched` *(sys)*, `partially_delivered` *(sys)*, `delivered` *(sys)*, `completed`, `cancelled` | §25.6. `awaiting_customer_confirmation` occurs only before the first confirmation. A later revision keeps the rolled-up status and sets `has_pending_revision` |
| Order version | `pending_customer`, `active`, `superseded`, `declined_by_customer`, `expired`, `withdrawn` | §25.4 (a version applied without confirmation goes straight to `active`) |
| Order item `fulfilment_status` | `pending`, `in_production`, `ready`, `in_shipment`, `dispatched`, `delivered`, `cancelled` | §25.5 |
| Order `payment_status` *(computed)* | `not_recorded`, `partial`, `paid`, `refunded` | §28.4 |
| Payment record | entry `payment`, `refund`; status `recorded`, `voided` | §28.4 |
| Manufacturing job | `not_started`, `in_progress`, `on_hold`, `completed`, `cancelled` (+ `is_delayed`) | §26.2 |
| Manufacturing job stage | `pending`, `in_progress`, `completed`, `skipped` | §26.2 |
| Shipment | `planned`, `preparing`, `picked_up`, `in_transit`, `reached_destination`, `delivered`, `cancelled` (+ `is_delayed`) | §27.1 |
| Shipment event type | `preparing`, `picked_up`, `in_transit`, `reached_location`, `delayed`, `delay_cleared`, `reached_destination`, `delivered`, `driver_changed`, `vehicle_changed`, `note`, `cancelled` | §27.3 |
| Driver | `active`, `inactive` | §27.2 |
| Order document | `current`, `superseded`, `withdrawn`; visibility `customer`, `internal` | §28.1 |
| Delivery confirmation | `awaiting_customer`, `received_ok`, `received_with_issues`, `not_received`, `admin_marked_delivered` | §29 |
| Delivery issue | `open`, `in_progress`, `awaiting_customer`, `resolved`, `closed` | §29.4 |
| Points ledger entry type | `earned`, `redeemed`, `expired`, `adjusted`, `reversed` | §30.2 |
| Points lot | `pending`, `available`, `consumed`, `expired`, `reversed` | §30.2 |
| Points reservation | `reserved`, `consumed`, `released` | §30.5 |
| Media asset processing | `pending`, `processing`, `ready`, `failed` | §26.4 |
| Banner | `draft`, `published`, `archived` (display state *scheduled* / *live* / *ended* derived from dates) | §32.4 |
| Customer | `active`, `blocked`, `deleted`, `invited` (v2.1) | §25.3 |
| Review | verification `pending`, `verified`, `rejected` (+ `verification_source` `manual` / `delivery_confirmation`); moderation `pending`, `approved`, `rejected`, `hidden`, `changes_requested` | §10 |
| Catalogue version | `queued`, `generating`, `ready`, `failed` | §11.1 |
| Contact message | `new`, `in_progress`, `closed` | §2.4 |
