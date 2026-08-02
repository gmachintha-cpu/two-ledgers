-- Two Ledgers — Stage 1 schema (Postgres / Supabase)
-- Run this in the Supabase SQL editor on a fresh project.

create extension if not exists "pgcrypto";

create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pay_day int not null check (pay_day in (10, 30, 31)),
  salary numeric(14,2) not null default 0,
  auth_id uuid references auth.users(id)
);

create type account_type as enum ('cash', 'bank', 'asset', 'liability');

create table accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type account_type not null,
  owner_id uuid references users(id),        -- null = joint
  opening_balance numeric(14,2) not null default 0,
  interest_rate numeric(5,2)                  -- annual %, null if not applicable
);

create table vehicles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references users(id)          -- null = joint
);

create type category_type as enum ('income', 'expense');

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type category_type not null,
  parent_id uuid references categories(id)    -- null = top-level
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  amount numeric(14,2) not null check (amount > 0),
  payer_id uuid not null references users(id),
  category_id uuid not null references categories(id),
  account_id uuid not null references accounts(id),
  vehicle_id uuid references vehicles(id),
  shared boolean not null default true,
  pay_period text,                            -- computed client-side, e.g. '2026-07-A'
  notes text,
  receipt_url text,                           -- populated in Stage 3
  created_at timestamptz not null default now()
);

create type budget_period as enum ('monthly', 'pay_period');

create table budgets (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id),
  limit_amount numeric(14,2) not null,
  period budget_period not null default 'monthly'
);

-- Reconciled starting balance per person per calendar month. If a month has
-- no row here, the app suggests last month's computed remaining balance
-- (opening + salary − spend) and the person can confirm/edit it — see
-- DataContext.getOpeningBalance / setOpeningBalanceValue.
create table opening_balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  month text not null,                        -- 'YYYY-MM'
  amount numeric(14,2) not null,
  unique (user_id, month)
);

-- One row per fill-up, linked to its expense transaction. Powers the
-- fuel-efficiency (km/l) view in Vehicles and any later analysis.
create table fuel_logs (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references transactions(id) on delete cascade,
  vehicle_id uuid not null references vehicles(id),
  date date not null,
  fuel_type text not null check (fuel_type in ('super', 'regular')),
  amount numeric(14,2) not null,
  liters numeric(6,2) not null,
  odometer integer not null
);

-- Recurring subscriptions. Auto-posted as an expense transaction once the
-- billing day arrives each month; last_posted_month prevents double-posting.
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount numeric(14,2) not null,
  billing_day int not null check (billing_day between 1 and 31),
  category_id uuid references categories(id),
  last_posted_month text                       -- 'YYYY-MM', null until first auto-post
);

-- Home-screen one-tap tiles. "instant" tiles carry a default_amount and post
-- immediately; "fuel" tiles (fuel_type set) open the fuel form instead.
create table quick_tiles (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('instant', 'fuel')),
  label text not null,
  icon text not null,
  category_id uuid not null references categories(id),
  vehicle_id uuid references vehicles(id),         -- fixed vehicle for instant tiles (e.g. Parking -> Car)
  default_vehicle_id uuid references vehicles(id),  -- pre-selected, changeable vehicle for fuel tiles
  fuel_type text check (fuel_type in ('super', 'regular')),
  default_amount numeric(14,2),
  payer_id uuid not null references users(id),
  shared boolean not null default false,
  notes text,
  sort_order int not null default 0
);

-- Row Level Security: both household members can read/write everything.
-- Tighten this later if you want per-user privacy on "personal" transactions.
alter table users enable row level security;
alter table accounts enable row level security;
alter table vehicles enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table budgets enable row level security;
alter table opening_balances enable row level security;
alter table fuel_logs enable row level security;
alter table subscriptions enable row level security;
alter table quick_tiles enable row level security;

create policy "household full access" on users for all using (true) with check (true);
create policy "household full access" on accounts for all using (true) with check (true);
create policy "household full access" on vehicles for all using (true) with check (true);
create policy "household full access" on categories for all using (true) with check (true);
create policy "household full access" on transactions for all using (true) with check (true);
create policy "household full access" on budgets for all using (true) with check (true);
create policy "household full access" on opening_balances for all using (true) with check (true);
create policy "household full access" on fuel_logs for all using (true) with check (true);
create policy "household full access" on subscriptions for all using (true) with check (true);
create policy "household full access" on quick_tiles for all using (true) with check (true);

-- Seed categories (matches src/lib/mockData.js so demo mode and real mode line up)
insert into categories (name, type) values
  ('Salary', 'income'),
  ('Savings Interest', 'income'),
  ('FD Interest', 'income'),
  ('Lottery', 'income'),
  ('Chit Fund Payout', 'income'),
  ('Housing & Utilities', 'expense'),
  ('Rent', 'expense'),
  ('Groceries', 'expense'),
  ('Child', 'expense'),
  ('Vehicles', 'expense'),
  ('Dining Out', 'expense'),
  ('Subscriptions', 'expense'),
  ('Healthcare', 'expense'),
  ('Personal', 'expense'),
  ('Pawning / Loan Interest', 'expense'),
  ('Savings & Investment', 'expense'),
  ('Gifts & Occasions', 'expense'),
  ('Miscellaneous', 'expense'),
  ('Transport', 'expense');

insert into categories (name, type, parent_id)
  select 'Fuel', 'expense'::category_type, id from categories where name = 'Vehicles'
  union all
  select 'Service & Maintenance', 'expense'::category_type, id from categories where name = 'Vehicles'
  union all
  select 'Insurance & Registration', 'expense'::category_type, id from categories where name = 'Vehicles'
  union all
  select 'Parking', 'expense'::category_type, id from categories where name = 'Vehicles'
  union all
  select 'Parts', 'expense'::category_type, id from categories where name = 'Vehicles'
  union all
  select 'Repairs', 'expense'::category_type, id from categories where name = 'Vehicles'
  union all
  select 'Car Wash', 'expense'::category_type, id from categories where name = 'Vehicles';
