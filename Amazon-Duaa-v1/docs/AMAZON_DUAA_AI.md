# Amazon Duaa — AI foundation

This version adds a server-only Gemini adapter and two guarded endpoints:

- `POST /api/ai/product-analyze` — analyzes an uploaded product image and returns structured catalog suggestions.
- `POST /api/ai/copilot` — admin-only, read-only copilot using a bounded product/order context.

## Security

- `GEMINI_API_KEY` is server-only and must never be prefixed with `NEXT_PUBLIC_`.
- The copilot checks the Supabase Auth `app_metadata.role === admin` claim.
- The copilot is intentionally read-only in v1. Future mutations should go through explicit server tools, approval, and audit logging.
- Do not put a Supabase service-role key in browser code.

## Product AI response

The product analyzer returns Arabic/English names, description, category/brand suggestions, tags, SEO copy, optional price suggestion, and confidence. Suggestions are advisory and should be reviewed before publishing.
