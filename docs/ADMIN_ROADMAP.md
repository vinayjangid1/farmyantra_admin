# farmyantra_admin: Roadmap & Engineering Guide

The team admin panel. Built on the **Raddiwalla admin panel kit**: same layout, theme engine, permission context, Apollo client, toast/snackbar system and shared components. Behaviour is specified in [`FARMYANTRA_MASTER_SPEC.md`](./FARMYANTRA_MASTER_SPEC.md) §3 (roles), §7–§11 (workflows) and §15.3 (admin API).

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

### Later: Phase 5 (growth)

- [ ] Payments tab on orders (Razorpay records, refunds)
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
