# Shopify Coupon Code Generator

A Next.js app for generating single and batch discount codes across multiple Shopify brands.

## Features

- **Multi-Brand Support** — Switch between Shopify stores (brands) via a dropdown; each brand has its own credentials and allowed origin
- **Single Code Generation** — Create individual discount codes with custom prefixes
- **Batch Generation** — Generate up to 500 codes at once (processed in batches of 100)
- **Price Rules** — Fixed amount ($) or percentage (%) discounts
- **Scheduling** — Set start/end dates for promotions
- **Usage Limits** — Total usage caps and once-per-customer restrictions
- **Export** — Copy individual codes, copy all, or export as CSV
- **Dynamic CORS** — Middleware sets `Access-Control-Allow-Origin` based on the active brand

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Fill in `.env.local` with your brand credentials:

```env
BRAND_COUNT=2

# ─── Brand 1: Skwezed ────────────────────────────────────
BRAND_1_NAME=Skwezed
BRAND_1_SHOPIFY_DOMAIN=skwezed.myshopify.com
BRAND_1_SHOPIFY_ADMIN_API_URL=https://skwezed.myshopify.com/admin/api/2024-10
BRAND_1_SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxx
BRAND_1_SHOPIFY_API_KEY=
BRAND_1_SHOPIFY_API_SECRET=
BRAND_1_SHOPIFY_ADMIN_API_URL_GRAPHQL=https://skwezed.myshopify.com/admin/api/2024-10/graphql.json
BRAND_1_ALLOWED_ORIGIN=https://www.skwezed.com

# ─── Brand 2: Its Litto ──────────────────────────────────
BRAND_2_NAME=Its Litto
BRAND_2_SHOPIFY_DOMAIN=itslitto.myshopify.com
BRAND_2_SHOPIFY_ADMIN_API_URL=https://itslitto.myshopify.com/admin/api/2024-10
BRAND_2_SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxx
BRAND_2_SHOPIFY_API_KEY=
BRAND_2_SHOPIFY_API_SECRET=
BRAND_2_SHOPIFY_ADMIN_API_URL_GRAPHQL=https://itslitto.myshopify.com/admin/api/2024-10/graphql.json
BRAND_2_ALLOWED_ORIGIN=https://itslitto.com
```

Add up to 10 brands by incrementing `BRAND_COUNT` and adding `BRAND_N_*` variables.

### 3. Required Shopify Scopes

Each Shopify app needs these API access scopes:

- `write_price_rules` / `read_price_rules`
- `write_discounts` / `read_discounts`

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

```
src/
├── middleware.ts                       # Dynamic CORS per brand
├── app/
│   ├── api/
│   │   ├── brands/route.ts            # List brands, switch active brand
│   │   ├── price-rules/route.ts       # Price rule CRUD
│   │   └── discount-codes/
│   │       ├── route.ts               # Single code CRUD
│   │       └── batch/route.ts         # Batch code creation
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                       # Main generator UI
├── components/
│   └── BrandSwitcher.tsx              # Brand dropdown switcher
├── lib/
│   ├── brands.ts                      # Brand config loader (env → typed config)
│   ├── shopify.ts                     # Shopify API client (uses active brand)
│   └── utils.ts                       # Code generation utilities
└── types/
    └── index.ts
```

## How It Works

1. **Select a brand** from the switcher — sets a cookie, all subsequent API calls use that brand's Shopify credentials
2. **Configure** your discount — type (% or $), value, code format, schedule
3. **Generate** — creates a Shopify Price Rule then discount code(s) on the selected brand's store
4. **Distribute** — copy codes or export as CSV

## CORS

The middleware (`src/middleware.ts`) dynamically resolves `Access-Control-Allow-Origin` from the active brand's `BRAND_N_ALLOWED_ORIGIN` env var. Localhost origins are always allowed in development.
