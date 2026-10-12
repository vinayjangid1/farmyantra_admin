# FarmYantra — Master Specification & Delivery Roadmap

| | |
|---|---|
| **Document** | Product, functional and technical specification for the FarmYantra platform |
| **Version** | 2.0, an expansion of the "Agricultural Equipment E-Commerce Website — Requirements Specification v1.0" |
| **Date** | 12 October 2026 |
| **Repositories** | `farmyantra_backend` (API), `farmyantra_website` (customer e-commerce site), `farmyantra_admin` (team admin panel) |
| **Reference architecture** | Raddiwalla: same folder layout, DB conventions, auth/RBAC model and admin component kit |
| **Status** | Phases 0–3 are implemented in the three repositories. Phases 4–5 are planned (see §20). |

> **How to read this document.** §1–§12 describe *what* the product does, written for business, design and QA readers.
> §13–§19 describe *how* it is built, for engineers. §20–§22 are the roadmap, the acceptance checklist and the open decisions.
> Section numbers in code comments (for example `// §10.2`) refer to this document.

---

## Table of contents

1. [Overview](#1-overview)
2. [The two ways a customer can ask: call-back or quotation](#2-the-two-ways-a-customer-can-ask-call-back-or-quotation)
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

---

## 1. Overview

FarmYantra is a mobile-first **enquiry-led e-commerce** platform for agricultural machinery: tillers, rotavators, harvesters, sprayers, implements and spares. It looks and browses like an online shop, with categories, filters, product pages, offers, an "enquiry list" in place of a cart, and an account area. It does **not** take online payment in the initial release. Instead, the customer chooses how they want the team to respond:

* **Call me back.** The sales team phones the customer, answers questions and closes the deal by phone.
* **Send me a quotation.** The team prepares a written, itemised, GST-correct PDF quotation that the customer can accept or decline online.

A customer can switch between these at any time while the enquiry is open (§2.3).

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

### 1.2 Out of scope for the initial release

* Online payment and checkout. The `orders` table already records payment status manually (§9), so a payment gateway can be added later.
* WhatsApp and live chat. The enquiry message thread (§7.6) is designed so it can be extended into chat.
* Dealer/partner portals and multiple warehouses. These are covered by Phase 5 in §20.

---

## 2. The two ways a customer can ask: call-back or quotation

This is the core business flow. Every enquiry carries a `request_type`:

| `request_type` | Customer sees | Team action | Typical outcome |
|---|---|---|---|
| `callback` | "Request a call-back. Our expert will call you within 24 hours." | Phone the customer, then log every attempt (§7.4) | The deal is closed by phone, or the team creates a quotation after the call |
| `quotation` | "Get a written quotation. We will email an itemised PDF quotation." | Prepare and send a quotation (§8) | The customer accepts online and an order is created |

### 2.1 Call-back flow

1. The customer browses, optionally configures a machine, and adds it to the **Enquiry list** (stored in the browser, no login needed).
2. On the Enquiry list they choose **"Call me back"**, a preferred call window (`preferred_call_window`: morning / afternoon / evening / anytime) and an optional message.
3. If not logged in, they verify their phone with Firebase OTP and complete their name and email. The list is kept.
4. The server re-prices the list, stores an immutable snapshot of the configuration and prices, and creates `ENQ-YYYY-NNNNNN` with `request_type = callback`. It sets `callback_due_at = now + commerce.callback_sla_hours` (24 by default).
5. The team sees the enquiry at the top of **Enquiries → Overdue call-backs** once it is past due. Assignment notifies the assignee.
6. The sales rep calls and logs the outcome: `connected`, `no_answer`, `busy`, `switched_off`, `wrong_number` or `call_back_later`. A `call_back_later` or no-answer outcome can set the next call time.
7. After talking, the rep either:
   * moves the enquiry to `contacted` → `accepted` and **creates a quotation** (the enquiry switches to quotation mode automatically when the quotation is sent), or
   * closes or rejects it with a reason.
8. The customer sees each status change in their dashboard and receives an email, apart from internal-only notes.

### 2.2 Quotation flow

1. Steps 1–3 are the same as above, but the customer chooses **"Send me a quotation"**.
2. The enquiry is created with `request_type = quotation`. There is no call SLA, but the dashboard shows "awaiting quotation" counts.
3. A team member reviews it (`under_review`), asks for clarification if needed (`clarification_required`, which requires a reason the customer sees), then accepts it.
4. **Create quotation.** The draft is pre-filled from the enquiry snapshot: lines, add-ons, colours, personalisation and offer discounts. The team adjusts prices, delivery charges, discounts, terms and validity. **Any change to a price needs a written reason**, which is audited.
5. **Send.** This freezes the version, generates the PDF, emails it to the customer with the PDF attached, and moves the enquiry to `quotation_sent`.
6. The customer opens **Account → Quotations**, downloads the PDF and either **accepts** (ticks the terms; the system stores version, timestamp, IP and user agent) or **declines** with an optional reason.
7. Acceptance moves the enquiry to `customer_accepted`. If `commerce.acceptance_creates_order = true` (the default), an order is created in `pending_confirmation` (§9). The team confirms it after checking stock and payment terms.
8. Any revision creates a **new version** (v2, v3…). Earlier versions become `superseded` and need fresh acceptance.
9. Unaccepted quotations expire at `valid_until` through a nightly job. A reminder email goes out `quotation.expiry_reminder_days` before expiry.

### 2.3 Switching between the two

| Who | How | Rules |
|---|---|---|
| Customer | **"Get a written quotation instead"** button on a call-back enquiry in their dashboard | Allowed while the enquiry is open. One-way (callback → quotation). Notifies the assignee or the team. |
| Team | **Wants** selector on the enquiry detail page | Allowed both ways and audited (`enquiry.request_type_changed`). Typical use: the customer asked on the phone for a written quote. |
| System | Sending a quotation | The enquiry becomes `quotation_sent` whatever the original type, because a written quote now exists. |

### 2.4 Contact form (no account)

The `/contact` page creates a **contact message**, not an enquiry. It is meant for general questions. Contact messages appear in the admin under **Sales → Contact messages** with `new`, `in_progress` and `closed` statuses. A product-specific request always goes through the enquiry flow so it carries a configuration and price snapshot.

---

## 3. Users, roles and permissions

### 3.1 Actors

| Actor | Authentication | Can |
|---|---|---|
| Guest | none | Browse, search, filter, configure, compare, build an enquiry list, download public catalogues/brochures, read reviews, contact the business |
| Customer | Firebase phone OTP, then profile (name and email required) | All guest actions, plus submit enquiries, reply to clarifications, switch to quotation, accept or decline quotations, track orders, save products, write reviews (purchase required), manage profile and language |
| Team member | Email and password (bcrypt, locked out after 5 failures) | Only the admin modules their role and overrides allow |
| Super Admin | Same as team member | Everything, including granting privileged permissions |

### 3.2 Permission model (same model as Raddiwalla)

* Permission strings are `admin:<feature>:<read|write>`. `write` implies `read`.
* **Effective permissions** = the role's permissions, then per-member overrides (`member_access` rows: none, read, or read+write per feature). A Super Admin has every permission.
* The API checks permissions on **every** resolver (`adminQuery(feature, …)` and `adminMutation(feature, …)`). The admin UI hides what the member cannot use, but the server check is what enforces it.
* **Privileged permissions** can only be granted by a Super Admin: `admin:team_members:write`, `admin:settings:write`, `admin:pricing:write`.
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
| `orders` | Order status, delivery, payment record | ✔ |
| `reviews` | Verification and moderation | ✔ |
| `promotions` | Offers, coupons, cart preview | ✔ |
| `catalogues` | Catalogue PDF generation and publishing | ✔ |
| `content` | Website pages, legal, guides, FAQs | ✔ |
| `reports` | Reports | – |
| `settings` | Site settings and email templates | ✔ (privileged) |
| `team_members` | Members and roles | ✔ (privileged) |
| `audit_logs` | Audit log | – |
| `notifications` | Admin notification bell | ✔ |

### 3.4 Pre-configured roles (seeded, editable)

| Role | Purpose | Main permissions |
|---|---|---|
| Sales Manager | Owns the sales pipeline | enquiries, customers, quotations, orders: write; products, promotions, reports, dashboard: read |
| Sales Representative | Works assigned call-backs and quotations | enquiries, quotations: write; customers, products, dashboard: read |
| Product / Content Manager | Catalogue and website | products, product_translations, customisation, catalogues, content, reviews: write; dashboard: read |

---

## 4. Website (customer side)

### 4.1 Design direction

* **Brand:** deep field green `#1F4D2B` (primary) and harvest amber `#E8A317` (accent) on warm off-white, with high-contrast text. The look is modern e-commerce with large product imagery, sticky "Add to enquiry" on mobile, and clear price labels.
* **Typography:** system UI stack with a Devanagari fallback, so Hindi renders without web-font downloads.
* **Mobile first:** 360 px baseline, thumb-reachable actions, bottom navigation on product pages, 44 px touch targets.
* **Performance budget:** see §17.1. The 3D viewer and Firebase SDK are lazy-loaded only when needed.
* **Languages:** English and Hindi throughout. The language toggle is in the header, remembered per device and stored on the customer profile.

### 4.2 Pages and routes

| Route | Page | Notes |
|---|---|---|
| `/` | Home | Hero (settings → home), featured categories, featured and new products, live offers, benefits, featured reviews, catalogue CTA |
| `/shop`, `/category/:slug` | Shop | Search, filters (category, price, power HP, fuel, capacity, availability, customisable, rating), sorting, pagination, facet counts |
| `/product/:slug` | Product | Gallery (images, video, YouTube/Vimeo embeds, colour-linked images), optional 3D viewer, key specs, full spec table, configurator, live indicative price, documents, reviews, related/accessories/alternatives, compare, save, add to enquiry |
| `/compare` | Compare | Up to 4 products side by side, with highlighted differences |
| `/offers` | Offers | Live offers with banners and coupon hints |
| `/catalogues` | Catalogues | Published catalogue PDFs per category and language |
| `/guides`, `/guides/:slug`, `/about`, `/legal/:slug` | Content | Buying guides, FAQ, about, terms/privacy/refund |
| `/contact` | Contact | Contact form (§2.4) and business details |
| `/enquiry` | Enquiry list | Lines with configuration, quantity, re-price, coupon, **call-back vs quotation choice**, preferred time, delivery city/pincode, consent, submit |
| `/login` | Login | Phone, then OTP, then profile completion |
| `/account` | Overview | Counts, latest activity |
| `/account/enquiries[/:id]` | Enquiries | Status timeline, messages, reply to clarification, switch to quotation, cancel |
| `/account/quotations[/:id]` | Quotations | Versions, PDF download, accept/decline |
| `/account/orders[/:id]` | Orders | Status timeline, expected delivery, tracking reference |
| `/account/notifications`, `/saved`, `/reviews`, `/profile` | Account | Notifications, saved products, my reviews, profile and language |

### 4.3 Enquiry list (the cart)

* It lives in `localStorage`, so it survives refresh and login. It is keyed by product and configuration, so the same tiller in two colours is two lines.
* Each change calls `quoteCart` on the server, which returns validated lines, offer discounts, GST and the total. The client **never** computes final money.
* Invalid lines are shown with the reason and excluded from submission. Examples: a product is unpublished, or an option is disabled.
* Coupons are validated on the server with a clear reason when they don't apply.
* Submission uses an idempotency key, so a double tap creates one enquiry.

### 4.4 Product page details

* **Price labels.** `fixed` shows "₹X". `starting_from` shows "Starting from ₹X". `on_request` shows "Price on request". The configured total is labelled "Indicative price (excl. GST)", and the final price is always the quotation.
* **Configurator.** It shows only enabled options. Colour swatches switch the gallery to images linked to that colour. Add-ons are grouped, show requires/excludes rules, and each has a quantity stepper within its limits. Personalisation is a text field with allowed characters and a placement picker. The server validates everything again (`previewConfiguration`).
* **3D viewer.** `<model-viewer>` loads on demand with a poster image and falls back to the gallery when WebGL is unavailable or the network is slow.
* **Reviews.** Verified-buyer badge, rating breakdown, photos and videos (approved only), pagination.

---

## 5. Products, configuration and pricing

### 5.1 Product record

* **Core:** slug, SKU, model, brand, category, status (`draft`, `published`, `archived`), availability (`in_stock`, `made_to_order`, `out_of_stock`, `coming_soon`, `discontinued`), lead time, warranty months, minimum and maximum order quantity.
* **Filterable attributes:** power HP, fuel type, capacity (value and unit), weight, dimensions, intended uses, tags.
* **Text, per language (`product_translations`):** name, short description, description, key benefits, intended use, in-the-box items, warranty text, service text, lead-time text, SEO title and description.
* **Specs:** grouped label/value/unit rows (bilingual). "Key" specs appear on cards and in comparison.
* **Media:** images (WebP with thumbnails; 2 MB limit), videos (50 MB limit), YouTube/Vimeo embeds. Media can be ordered, set as primary, hidden, given alt text and linked to a colour.
* **Documents:** brochure, manual, safety, warranty and spec sheet (PDF), per language, public or staff-only.
* **3D:** one active GLB per product with camera orbit, limits and exposure. Off until `viewer_3d_enabled`.
* **Relations:** related, accessory and alternative.
* **Publishing checklist (blocking):** English name and short description, category, at least one published image, and a base price unless the price is on request. A missing Hindi translation is a warning only.

### 5.2 Customisation (off by default)

Master switch `customisation_enabled`, plus three sub-switches:

| Option | Rules |
|---|---|
| Colours | Code, bilingual name, hex, preview image, price delta (can be negative), one default, active/inactive |
| Add-ons | Type (accessory, attachment, upgrade, spare part, service, package), pricing (`fixed`, `per_unit`, `on_request`), minimum and maximum quantity, required, "replaces a standard component", group, **requires** and **excludes** rules between add-ons |
| Personalisation | Bilingual label and help text, minimum and maximum length, allowed-character class, price, required, plus admin-defined **placements** with a price delta and preview image |

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
| `converted_to_order` | Order created | System |
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

### 7.3 Snapshot

At submission each `enquiry_items` row stores the product name in both languages, the SKU, the selection, the price breakdown, the line totals, the applied offers and the tax rate. Later product edits **never** change a submitted enquiry.

### 7.4 Call-back handling

* `callback_due_at` (the SLA), `preferred_call_window`, `last_contacted_at` and the logged call attempts in the timeline.
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

* Created from an accepted quotation version. Lines and totals are copied, so an order never re-prices.
* **Statuses:** `pending_confirmation → confirmed → in_production → ready_to_dispatch → dispatched → delivered → completed`. `cancelled` is possible until dispatch.
* **Fields:** expected delivery date, tracking reference, customer-visible notes, internal notes, payment status (`not_recorded`, `partial`, `paid`, `refunded`) and amount received (recorded manually, not a payment gateway).
* Each status change adds an `order_events` row, sends a customer notification and email, and writes to the audit log. Confirming an order confirms reserved offer usage. Cancelling releases it.
* A delivered or completed order makes the customer **eligible to review** the products on it.

---

## 10. Reviews

* **Eligibility:** a logged-in customer with an order containing the product (not cancelled). One review per product per customer. Rate-limited.
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

* Emails are sent in the customer's preferred language and fall back to English.
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
                  │  /files/* (PDF, catalogue, review-media routes)   │──► SMTP (nodemailer)
                  │  node-cron jobs (email retry, expiry, reminders)  │──► Storage: local disk or S3 (+CDN)
                  └──────────────────────┬───────────────────────────┘
                                         ▼
                                PostgreSQL 15+ (pgcrypto)
```

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
src/integrations/                 storage (local/S3), email (SMTP)
src/templates/                    emailTemplates, pdfTemplates
src/jobs/                         cronJobs
src/shared/                       logger, guards, tokens, i18n, money, sql/validation utils, teamAccess catalog
scripts/setup|dev/                create tables, seed super admin, seed demo catalogue, e2e smoke
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
| Customers | `customers` (phone unique and verified, Firebase UID, profile, language, marketing consent, status), `customer_login_history`, `saved_products` |
| Catalogue | `categories`, `products`, `product_translations`, `product_specs`, `product_media`, `product_documents`, `product_3d_models`, `product_colours`, `product_addons`, `product_addon_rules`, `product_personalisation`, `product_personalisation_placements`, `product_relations` |
| Offers | `promotions`, `promotion_targets`, `coupons`, `promotion_redemptions` |
| Sales | `enquiries` (number, customer, **request_type**, status, contact snapshot, delivery location, preferred time, **callback_due_at**, call attempts, assignment, totals, idempotency key), `enquiry_items` (snapshot), `enquiry_events` (timeline), `enquiry_messages`; `quotations`, `quotation_versions`, `quotation_items`, `quotation_decisions`; `orders`, `order_items`, `order_events` |
| Reviews | `reviews`, `review_media`, `review_moderation_events` |
| Notifications | `notifications` (customer in-app), `notification_deliveries` (email outbox with retries) |
| Catalogues | `catalogue_versions` |

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

### 15.3 Admin schema (`/admin/graphql`)

| Group | Operations (permission feature) |
|---|---|
| Auth & team | `login`, `changeOwnPassword`, `me`, `permissionCatalog`, `teamMembers`, `teamMember`, `roles`, `createTeamMember`, `updateTeamMember`, `resetTeamMemberPassword`, `deleteTeamMember`, `saveRole`, `deleteRole` (team_members) |
| Dashboard & reports | `dashboard` (dashboard); `enquiryTrend`, `conversionFunnel`, `productInterest` (reports); `auditLogs` (audit_logs); `adminNotifications`, `markAdminNotificationsRead` |
| Catalogue | `products`, `product`, `categories`, `createProduct`, `updateProduct` (pricing fields need `pricing:write`, switches need `customisation:write`), `setProductStatus`, `duplicateProduct`, `saveProductSpecs`, `add/update/reorder/deleteProductMedia`, `add/update/deleteProductDocument`, `uploadProduct3dModel`, `updateProduct3dSettings`, `removeProduct3dModel`, `saveProductRelations`, `saveCategory`, `deleteCategory` (products); `saveProductTranslation`, `deleteProductTranslation` (product_translations); `saveProductColour`, `saveProductAddon`, `saveProductPersonalisation`, `saveProductPlacement`, `setProductOptionActive`, `uploadOptionImage` (customisation); `taxRules`, `saveTaxRule` (pricing) |
| Enquiries | `enquiries(filter: statuses, requestType, assignedTo, unassigned, callbackOverdue, search…)`, `enquiry`, `changeEnquiryStatus`, `assignEnquiry`, `assignableMembers`, `logEnquiryCall`, **`setEnquiryRequestType`**, `addEnquiryMessage`, `resendNotification`, `contactMessages`, `setContactMessageStatus` |
| Quotations & orders | `quotations`, `quotation`, `createQuotation`, `updateQuotationDraft`, `sendQuotation`, `reviseQuotation`, `cancelQuotation`, `convertQuotationToOrder`; `orders`, `order`, `changeOrderStatus`, `updateOrder` |
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
* **Rate limits.** Admin login, OTP login, enquiry submission, contact form and review submission are rate-limited.
* **Idempotency.** Enquiry submission uses an idempotency key, so a retry never duplicates the enquiry.
* **Audit.** Every price, status, permission, settings, content and moderation change is recorded with actor, IP, reason and diff. The audit log is append-only.
* **PII.** Phone and email are visible only to staff with `customers:read` or `enquiries:read`. Exports are permission-gated. The logger redacts sensitive keys (tokens, passwords, secrets).
* **Transport.** HTTPS only, HSTS, secure CORS allow-list (`CORS_ORIGINS`), and `helmet`-style headers through nginx. The admin API is served on a separate path and can be IP-restricted at the proxy.
* **Backups.** Daily `pg_dump`, 30-day retention, and a monthly restore test. Uploads are versioned in the S3 bucket.

---

## 17. Non-functional requirements

### 17.1 Performance

* Home and product page LCP under 2.5 s on a mid-range Android phone over 4G. Initial JS under 200 kB gzip excluding lazy chunks.
* Images: responsive WebP thumbnails with lazy loading. Video posters. The 3D viewer and Firebase are dynamic imports.
* API: p95 under 300 ms for catalogue queries. Lists are paginated, with indexes on all filter columns.

### 17.2 Accessibility

Semantic HTML, keyboard-operable configurator and dialogs (focus trap), visible focus, `prefers-reduced-motion`, labelled form errors, AA contrast and 44 px targets.

### 17.3 Internationalisation

All UI strings are in `i18n/en.js` and `i18n/hi.js`. Data falls back to English for missing Hindi. Numbers and dates use the `en-IN` format. Indian rupee formatting uses lakh/crore grouping.

### 17.4 Reliability and observability

* Structured, levelled logs with redaction, plus `/health`. Request IDs and log shipping are Phase 4 items.
* Cron jobs are idempotent. With several API instances, set `CRON_ENABLED=false` on all but one.
* Email failures never fail the business action; they go to the outbox and are retried.
* Error tracking (Sentry or similar) is a Phase 4 item.

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

**Website:** `VITE_SITE_URL`, `VITE_API_URL`, `VITE_REQUEST_TIMEOUT_MS`, `VITE_FIREBASE_*` (leave blank locally to use the API's dev OTP bypass).

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
| **5. Growth** | Online payments (Razorpay) for advance payment on accepted quotations; WhatsApp notifications (templates through the BSP); internal chat built on enquiry messages; dealer/partner role with territory assignment; EMI/finance enquiry; spare-parts finder by machine model; service requests; analytics (GA4 + server events); multi-warehouse stock; PWA/offline catalogue | Planned |

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
5. Whether dealers or partners need their own logins (Phase 5).
6. The WhatsApp Business provider, if WhatsApp is wanted in Phase 5.
