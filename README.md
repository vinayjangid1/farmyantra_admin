# FarmYantra Admin Panel

Team admin panel for **FarmYantra**. It covers:

* the enquiry and call-back queue, with SLA, call logging, assignment and call-back ⇄ quotation switching
* quotations (GST, PDF, versions)
* orders and customers
* products, including the bilingual editor, media, 3D and customisation rules
* categories and catalogue PDFs
* offers and coupons
* reviews (verification vs moderation)
* website content
* reports, team and roles, audit log, and settings with tax rules

Built on the Raddiwalla admin kit: same layout, theme engine, permissions context, Apollo client and shared components (`CustomTable`, `SidebarPanel`, `PageHeader`, `FilterDropdown`, `StatCard`, `ExportButton`, …).

| Doc | What |
|---|---|
| [`docs/FARMYANTRA_MASTER_SPEC.md`](docs/FARMYANTRA_MASTER_SPEC.md) | Full product + technical spec |
| [`docs/ADMIN_ROADMAP.md`](docs/ADMIN_ROADMAP.md) | Structure, page inventory, status and next steps |

## Quick start

```bash
npm install
npm run dev            # http://localhost:5200/admin/farmyantra/ (expects farmyantra_backend on :5100)
npm run lint && npm run build
```

Sign in with the Super Admin created by the backend's `npm run seed:super-admin`. Each sidebar item and action follows the member's role permissions, and the API enforces the same permission checks.
