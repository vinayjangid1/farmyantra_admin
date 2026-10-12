# farmyantra_admin: Roadmap & Engineering Guide

The team admin panel. Built on the **Raddiwalla admin panel kit**: same layout, theme engine, permission context, Apollo client, toast/snackbar system and shared components. Behaviour is specified in [`FARMYANTRA_MASTER_SPEC.md`](./FARMYANTRA_MASTER_SPEC.md) (v2.1):

* §3: roles and permissions
* §7–§11: workflows
* §15.3: admin API
* Part B: §23 carts, §24 fulfilment fields, §25 order versions, §26 manufacturing, §27 shipping and drivers, §28 documents and payments, §29 delivery, §30 rewards, §31.3 trust, §32.4 banners, §33.5 mobile urgent flows

Status chips must cover every code in **§34**. Phase numbers match Master Spec §20.

## 1. Structure

```
src/
  app/
    App.jsx, routes.config.jsx   navigationConfig (sidebar) + lazy protectedRoutes, each with a permission
    layout/                      Layout, Sidebar, Navbar (from Raddiwalla, rebranded)
    ProtectedRoute, LandingRedirect
  core/config|constants          env.js (VITE_GRAPHQL_ENDPOINT, VITE_WEBSITE_URL), app.config, branding, colours
  features/
    permissions/                 PermissionsContext (me → hasPermission), RequirePermission, PermissionGate
    notifications/               NotificationBell (admin notifications)
  lib/graphql/client.js          Apollo + upload link + auth header + error link (logs out on UNAUTHENTICATED)
  services/
    admin.api.js                 every GraphQL document, grouped by area
    files.js                     authenticated PDF/media fetch, mediaUrl
    auth.service.js, queryOptions.js, teamMembers.service.js
  shared/
    components/                  Raddiwalla kit: CustomTable, PageHeader, PageContainer, SidebarPanel, FilterDropdown,
                                 StatCard, ExportButton, ConfirmDialog, EmptyState, ErrorState, LoadingState …
    components/fy/               FarmYantra helpers: StatusChip, I18nField (EN + HI), MoneyField (₹ ↔ paise),
                                 usePagedQuery, KeyValue, Toolbar, en(), humanize()
    hooks/                       useAction (mutation + toast), useDebounce, usePageTitle …
  pages/                         one folder per area (see §2)
  theme/                         MUI theme (green #1F4D2B / amber #E8A317), light/dark
  utils/                         money.js, dateFormatter.js, categories.js
```

**Rules**

- Every route and nav item declares `admin:<feature>:read`. Every write control checks `hasPermission('admin:<feature>:write')`. The API enforces the same checks, so the UI only hides what the member cannot use.
- Use `useAction().run(MUTATION, vars, { success })` for mutations. It shows the toast and returns `data` or `null`.
- Use `MoneyField` for any amount: the API speaks paise, and people type rupees.
- Use `I18nField` for any `*_i18n` value. English is required; Hindi is optional and falls back to English.
- Lists use `usePagedQuery(QUERY, key, variables)` with `CustomTable` controlled pagination.
- *(v2.1)* `StatusChip` (`shared/components/fy`) must have a colour for every §34 code. New codes go there first.
- *(v2.1)* Every new nav item and route declares its feature: `carts`, `manufacturing`, `shipments`, `drivers`, `driver_identity`, `order_documents`, `payments`, `delivery_issues`, `rewards` or `banners`.
  - Driver identity files are fetched only through their audited route. They are never shown in lists and never cached.
- *(v2.1)* **Uploads:**
  - pre-check size and type in the browser (images ≤ 2 MB, video ≤ 50 MB, documents ≤ 20 MB) and show progress and retry
  - camera capture uses `accept="image/*,video/*" capture="environment"`
- *(v2.1)* **Immutable things look immutable:** shipment events, points ledger and audit log have no edit buttons. They offer "Add correction" or "Adjust" instead.
- *(v2.1)* **Mutations:**
  - any action that changes an order's money, items or terms goes through **Propose revision** (with a reason) and never edits in place
  - money-affecting mutations send an idempotency key generated when the form opens

## 2. Pages

| Area | Page | Highlights |
|---|---|---|
| Dashboard | `Dashboard` | Today's counts, **overdue call-backs**, quotations awaiting decision, expiring quotations, orders to confirm, reviews to moderate, recent activity |
| Sales | `Enquiries` | Status groups with counts, **call-back / quotation filter**, assigned-to-me / unassigned, **overdue call-backs** switch, search, CSV export |
| | `EnquiryDetail` | Snapshot lines, customer and delivery details, timeline, **Wants: call-back ⇄ quotation**, allowed status transitions only, **log call** (outcome and next call), assign, messages (customer-visible or internal), resend email, create/open quotation |
| | `Quotations`, `QuotationEditor` | Draft editing with price-change reasons, GST preview (CGST/SGST vs IGST), send, revise, cancel, PDF preview/download, convert to order |
| | `Orders`, `OrderDetail` | Status flow, expected delivery, tracking, payment record, notes |
| | `Customers` | Search, profile panel with enquiries/orders, internal notes, block/unblock |
| | `ContactMessages` | Contact form inbox with status |
| Catalogue | `Products` | Filters (status, category, availability, missing Hindi), language coverage, new product |
| | `ProductEditor` | Tabs: Details · Pricing & tax (audited reason) · English/हिंदी · Specifications · Media, documents & 3D · Customisation (switches, colours, add-ons with rules, personalisation, placements) · Related; publish checklist, duplicate, archive |
| | `Categories` | Tree, bilingual names, image, shop filters, featured/visible |
| | `Catalogues` | Generate (scope, language, prices), auto-refresh while generating, publish/unpublish, regenerate, delete |
| Marketing | `Promotions` | Offer editor (4 types, scope, conditions, dates, limits, stacking, priority, banner), coupons (list/generate/deactivate), **Test a cart** with the live engine |
| | `Reviews` | Needs-a-decision queue, private media viewer, purchase-record check, verify vs moderate actions with reasons, flags, history |
| | `ContentPages` | Pages / legal / guides / FAQ, bilingual, cover image, publish |
| Insights | `Reports` | Enquiries per day (call-back vs quotation), conversion funnel, product interest + CSV |
| Admin | `TeamMembers` | Members (role, status, Super Admin, per-feature overrides, password reset) and roles (permission matrix; privileged permissions locked for non-Super Admins) |
| | `AuditLog` | Filter by record type, date, text; full diff viewer |
| | `Settings` | Sections generated from the settings payload (EN/HI pairs, switches, uploads, JSON) + **Tax rules** |

**Planned pages (v2.1)**

| Area | Page | Highlights | Phase |
|---|---|---|---|
| Sales | `AbandonedCarts` (+ cart card on `Customers` panel) | Value, items, last activity, **consent badge**, consent-only filter, follow-up log (`contacted` / `not_interested` / `converted` / `do_not_contact`) | 5 |
| Catalogue | `ProductEditor` → new **Fulfilment** tab | `in_stock` (stock qty, dispatch window) / `made_to_order` (window in days or weeks, manufacturing template picker with total-days warning); option `lead_time_impact_days` fields on the Customisation tab; points per unit / excluded (Phase 7) | 5 |
| Marketing | `Banners` | Placements, schedule, priority, language × device variants with focal-point picker and **required alt text and licence note**, live preview at 360 px and 1440 px | 5 |
| Marketing | `TrustContent` | Computed vs override side by side, override needs an "as of" date and a note; certifications (validity, document); delivery photos linked to consented confirmations | 5 |
| Sales | `OrderDetail` v2 | Accept as-is / Propose revision / Cancel; **version list + side-by-side diff** (changed cells highlighted, totals compared); pending-revision banner; record phone confirmation (if enabled); per-item fulfilment with estimates and revisions; tabs: Manufacturing, Shipments, Documents, Payments, Delivery, Points | 6 |
| Sales | `CreateOrder` | Customer picker (or create an `invited` customer by phone), prefill from enquiry or cart, configurator with server validation, price overrides with reasons, delivery details and terms, points within balance, send for confirmation | 6 |
| Production | `ManufacturingTemplates`, `ManufacturingBoard` | Templates by scope; jobs board grouped by stage, delayed filter; job drawer with stage chips, update form (note, visibility, media), **revise estimate with reason**, delay flag | 6 |
| Logistics | `Drivers` | Driver master; vehicle photo; ID photo and licence section visible only with `driver_identity` (view is audited); active/inactive | 6 |
| Logistics | `Shipments` | Create from ready items with **unit quantities**, driver/vehicle, dates, freight cost, LR / e-way / invoice numbers; event timeline (append-only) with quick-add form; change driver/vehicle with reason; customer preview of the driver card | 6 |
| Accounts | Documents & Payments (tabs on `OrderDetail`) | Upload with type/number/date/amount/language/visibility; **Replace** (new version + reason) / Withdraw; version history; record payment/refund (mode, reference, receipt) and void with reason; computed status | 6 |
| After-sales | `DeliveryQueue`, `DeliveryIssues` | Awaiting confirmation (with age), overdue after N days → **Mark delivered with reason**; issue cases with status, thread (customer/internal), media, resolution | 6 |
| Loyalty | `Rewards` | Rules (settings), campaigns, customer points panel (balances, ledger), **Adjust** with reason (Super Admin above ±1,000), liability report, abuse signals | 7 |
| Mobile | `Today` (mobile home) | Overdue call-backs, deliveries awaiting confirmation, delayed jobs, shipments in transit; one-tap Call / Log call / Add tracking event / Camera upload | 6 |

## 3. Status

### Done

- [x] Raddiwalla kit copied and rebranded; CRM, socket and saved-view features removed (not needed)
- [x] Login, permission-aware sidebar/routes, notification bell, page titles
- [x] Every page in §2, verified in Playwright against the live API (pages render, no console errors; write flows for category, product with pricing/translations/specs/image/colours/add-ons/publish, offer with coupons and cart preview, catalogue, content page, team member, role, settings)
- [x] Production build with vendor chunks (react / apollo / mui) and lazy pages

### Next: Phase 4 (launch hardening)

- [ ] Commit the Playwright walk-through as `tests/e2e/admin.spec.js` and run it in CI against a seeded API
- [ ] Media: drag-and-drop multi-upload, client-side size/type checks before upload (2 MB images / 50 MB video), and an image cropper for category/brand images
- [ ] Product list bulk actions (publish/unpublish/archive, assign category) using the kit's `BulkActionBar`
- [ ] Enquiry queue: saved filters per member and keyboard shortcuts (J/K to move, C to log a call)
- [ ] Quotation editor: duplicate a line, reorder lines, attach brochure PDFs to the quotation email
- [ ] Rich-text (Markdown) editor with preview for content pages and product descriptions
- [ ] Audit log: per-record history panel embedded in Product, Enquiry and Quotation pages
- [ ] Session: idle timeout warning before the 12 h token expiry
- [ ] Accessibility pass (focus order in SidebarPanel, table row keyboard activation)

### Phase 5: cart, fulfilment fields, banners, trust (Master Spec §23, §24, §31.3, §32.4)

- [ ] Enquiry pages: `request_type` filter and chip add `both`; the "Wants" selector supports all three; the SLA shows for callback/both
- [ ] Enquiry detail shows multi-item requests with per-item fulfilment type and estimate, and the combined estimate
- [ ] `AbandonedCarts` page and the customer cart card (`carts`)
- [ ] Product editor **Fulfilment** tab and option lead-time impacts; publish checklist shows the fulfilment requirement
- [ ] Settings sections `fulfilment`, `cart`, `trust`, `pwa` (generated form)
- [ ] `Banners` page (`banners`) and `TrustContent` page (`content`)
- [ ] New roles and permission rows in the Team & roles matrix

### Phase 6: order lifecycle, production, logistics, after-sales (Master Spec §25–§29)

- [ ] `OrderDetail` v2:
  - [ ] accept, propose revision, version list, **diff view**
  - [ ] roll-up status display: only confirmed/cancelled/completed are manual
- [ ] `CreateOrder` flow
- [ ] `ManufacturingTemplates` + `ManufacturingBoard`, with media upload through the processing-status UI
- [ ] `Drivers` (+ identity section), `Shipments` with event quick-add and assignment change
- [ ] Documents (versions) and Payments tabs
- [ ] `DeliveryQueue` and `DeliveryIssues`
- [ ] Settings `orders`, `delivery`, `shipping` sections
- [ ] **Mobile urgent flows** (§33.5):
  - [ ] `Today` home, tables → cards below 600 px for these pages
  - [ ] bottom-sheet forms for log call, tracking event and manufacturing update
  - [ ] `tel:` and manual WhatsApp links
  - [ ] camera capture with pre-checks, progress and retry; large videos go straight to S3 (D11)
- [ ] Dashboard tiles:
  - [ ] orders to accept and revisions awaiting customers
  - [ ] delayed jobs, shipments in transit
  - [ ] deliveries awaiting confirmation, open issues
- [ ] Playwright: the full admin side of `e2e-fulfilment`, plus the urgent flows at 360 px on Android Chrome and iOS Safari emulation

### Phase 7: reward points (Master Spec §30)

- [ ] Settings `rewards` (privileged), campaigns, customer points panel, adjust dialog (reason; Super Admin threshold), liability report, abuse signals
- [ ] Points discount line in the quotation editor, `CreateOrder` and revisions (validated server-side)

### Later: Phase 8 (growth)

- [ ] Online payments on the existing Payments tab (Razorpay records and refunds through the same `recordPayment` service)
- [ ] Internal chat view on enquiries (websocket, as in Raddiwalla's socket layer)
- [ ] Dealer management (territories, auto-assignment rules)
- [ ] Inventory per warehouse and stock alerts
- [ ] Scheduled report emails (weekly funnel to managers)

## 4. Run

```bash
npm install
# .env.development is committed with local defaults
#   VITE_GRAPHQL_ENDPOINT=http://localhost:5100/admin/graphql
#   VITE_WEBSITE_URL=http://localhost:4100
npm run dev        # http://localhost:5200/admin/farmyantra/
npm run lint && npm run build
```

Sign in with the Super Admin from the backend seed (`SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`).
