-- Amazon Duaa additive commerce + AI foundation.
-- This migration does not delete or rewrite existing catalog/order data.

-- Extended order lifecycle.
alter type public.order_status add value if not exists 'in_transit';
alter type public.order_status add value if not exists 'out_for_delivery';
alter type public.order_status add value if not exists 'delivered';
alter type public.order_status add value if not exists 'returned';
alter type public.order_status add value if not exists 'refunded';

create type public.discount_type as enum ('percentage', 'fixed');
create type public.shipment_status as enum ('pending', 'packed', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'returned');
create type public.payment_status as enum ('pending', 'authorized', 'paid', 'failed', 'refunded', 'partially_refunded');
create type public.ai_action_status as enum ('proposed', 'approved', 'rejected', 'executed', 'failed');

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name varchar(150) not null unique,
  slug varchar(150) not null unique,
  description text,
  logo_url text,
  website_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products add column if not exists brand_id uuid references public.brands(id) on delete set null;
alter table public.products add column if not exists sku varchar(100);
alter table public.products add column if not exists slug varchar(255);
alter table public.products add column if not exists compare_at_price numeric(10,2);
alter table public.products add column if not exists cost_price numeric(10,2);
alter table public.products add column if not exists seo_title text;
alter table public.products add column if not exists seo_description text;
alter table public.products add column if not exists tags text[] not null default '{}';
alter table public.products add column if not exists updated_at timestamptz not null default now();
create unique index if not exists products_sku_unique_idx on public.products(sku) where sku is not null;
create unique index if not exists products_slug_unique_idx on public.products(slug) where slug is not null;
create index if not exists products_brand_id_idx on public.products(brand_id);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku varchar(100) unique,
  name varchar(255) not null,
  options jsonb not null default '{}'::jsonb,
  price numeric(10,2),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists product_variants_product_id_idx on public.product_variants(product_id);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  quantity_change integer not null,
  reason varchar(100) not null,
  reference_id uuid,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint inventory_movement_target_check check (product_id is not null or variant_id is not null)
);
create index if not exists inventory_movements_product_idx on public.inventory_movements(product_id, created_at desc);
create index if not exists inventory_movements_variant_idx on public.inventory_movements(variant_id, created_at desc);

create table if not exists public.discounts (
  id uuid primary key default gen_random_uuid(),
  name varchar(150) not null,
  discount_type public.discount_type not null,
  value numeric(10,2) not null check (value >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  product_id uuid references public.products(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists discounts_active_idx on public.discounts(is_active, starts_at, ends_at);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code varchar(80) not null unique,
  discount_type public.discount_type not null,
  value numeric(10,2) not null check (value >= 0),
  min_order_amount numeric(10,2) default 0 check (min_order_amount >= 0),
  max_uses integer check (max_uses is null or max_uses > 0),
  used_count integer not null default 0 check (used_count >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider varchar(80),
  provider_reference varchar(255),
  amount numeric(10,2) not null check (amount >= 0),
  status public.payment_status not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists payments_order_idx on public.payments(order_id, created_at desc);

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  carrier varchar(120),
  tracking_number varchar(150),
  status public.shipment_status not null default 'pending',
  tracking_url text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists shipments_status_idx on public.shipments(status);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  channel varchar(30) not null check (channel in ('whatsapp', 'email', 'sms', 'in_app')),
  recipient varchar(255),
  template_key varchar(120),
  payload jsonb not null default '{}'::jsonb,
  status varchar(30) not null default 'pending',
  sent_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);
create index if not exists notifications_order_idx on public.notifications(order_id, created_at desc);

create table if not exists public.ai_product_drafts (
  id uuid primary key default gen_random_uuid(),
  source_image_url text,
  input_metadata jsonb not null default '{}'::jsonb,
  suggested_data jsonb not null default '{}'::jsonb,
  model varchar(120),
  confidence numeric(5,4),
  status public.ai_action_status not null default 'proposed',
  created_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.ai_actions (
  id uuid primary key default gen_random_uuid(),
  action_key varchar(120) not null,
  status public.ai_action_status not null default 'proposed',
  target_table varchar(120),
  target_id uuid,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error_message text,
  requested_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  executed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ai_actions_created_idx on public.ai_actions(created_at desc);
create index if not exists ai_actions_status_idx on public.ai_actions(status);

-- RLS: these new operational tables are admin-managed by default.
alter table public.brands enable row level security;
alter table public.product_variants enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.discounts enable row level security;
alter table public.coupons enable row level security;
alter table public.payments enable row level security;
alter table public.shipments enable row level security;
alter table public.notifications enable row level security;
alter table public.ai_product_drafts enable row level security;
alter table public.ai_actions enable row level security;

create policy "Public can read active brands" on public.brands for select to anon, authenticated using (true);
create policy "Admins manage brands" on public.brands for all to anon, authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage product variants" on public.product_variants for all to anon, authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage inventory movements" on public.inventory_movements for all to anon, authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage discounts" on public.discounts for all to anon, authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage coupons" on public.coupons for all to anon, authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage payments" on public.payments for all to anon, authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage shipments" on public.shipments for all to anon, authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage notifications" on public.notifications for all to anon, authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage AI drafts" on public.ai_product_drafts for all to anon, authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage AI actions" on public.ai_actions for all to anon, authenticated using (public.is_admin()) with check (public.is_admin());

comment on table public.ai_actions is 'Approval/audit boundary for future AI mutations. AI must not receive arbitrary SQL or service-role access.';
comment on table public.inventory_movements is 'Immutable-style stock ledger foundation; business actions should append movements rather than rewrite history.';
comment on column public.products.tags is 'Search/SEO tags generated or curated for Amazon Duaa.';
