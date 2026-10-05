# Amazon Duaa — implementation roadmap

## Included in v1 foundation

- Amazon Duaa branding and Arabic RTL document shell
- Supabase configuration template for the provided project
- WhatsApp storefront number configuration
- Additive commerce schema for brands, variants, inventory ledger, discounts, coupons, payments, shipments, notifications
- Extended order lifecycle values
- AI product-image analysis endpoint
- Admin-only read-only AI Copilot endpoint
- AI draft/action tables with approval/audit status

## Next implementation layers

1. Arabic translation of every storefront/admin label and validation message.
2. Admin managers for brands, variants, inventory, discounts and coupons.
3. Checkout integration for online payment providers while keeping COD.
4. Shipment provider adapters + customer tracking page.
5. WhatsApp Cloud API notification worker with retries and templates.
6. AI Product Studio UI: image upload, background-removal provider, draft preview, approve/publish.
7. AI Admin Copilot UI with explicit tool calls, approvals and audit trail.
8. File ingestion for PDF/CSV/XLSX/DOCX/TXT and a searchable AI knowledge base.
9. Role/permission matrix beyond the initial admin claim.
10. Production CI, backups, rate limiting, observability and security review.
