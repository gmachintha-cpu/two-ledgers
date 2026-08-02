-- Two Ledgers — seed data. Run this AFTER schema.sql, in the Supabase SQL editor.
-- Mirrors what the demo app ships with, so your real data starts where the
-- demo left off. Edit amounts/names below before running, or just run it and
-- adjust afterward from the Budgets & settings screen (salary, pay day,
-- subscriptions, and quick-tile amounts are all editable there).

insert into users (name, pay_day, salary) values
  ('Husband', 10, 150000),
  ('Wife', 30, 85000);

insert into vehicles (name, owner_id)
  select 'Car', null
  union all
  select 'Bike', (select id from users where name = 'Husband');

insert into accounts (name, type, owner_id, opening_balance, interest_rate) values
  ('Joint Current Account', 'bank', null, 0, null);
-- Add rows here for Savings, FDs, ETF/EPF, Chit Fund, Pawning Loan, Soft Loan
-- when you're ready for Stage 4 (assets/liabilities/cashflow view).

insert into budgets (category_id, limit_amount, period)
  select id, 65000, 'monthly'::budget_period from categories where name = 'Rent'
  union all
  select id, 40000, 'monthly'::budget_period from categories where name = 'Groceries'
  union all
  select id, 35000, 'monthly'::budget_period from categories where name = 'Child'
  union all
  select id, 30000, 'monthly'::budget_period from categories where name = 'Vehicles'
  union all
  select id, 15000, 'monthly'::budget_period from categories where name = 'Dining Out';

insert into subscriptions (name, amount, billing_day, category_id)
  select 'Youtube Family', 3000, 11, id from categories where name = 'Subscriptions'
  union all
  select 'Claude', 6000, 28, id from categories where name = 'Subscriptions';

insert into quick_tiles (kind, label, icon, category_id, vehicle_id, default_vehicle_id, fuel_type, default_amount, payer_id, shared, notes, sort_order)
  select 'instant', 'Parking', 'parking',
    (select id from categories where name = 'Parking'),
    (select id from vehicles where name = 'Car'),
    null, null, 700,
    (select id from users where name = 'Husband'), false, 'Parking', 1
  union all
  select 'fuel', 'Fuel Super', 'gas-station',
    (select id from categories where name = 'Fuel'),
    null,
    (select id from vehicles where name = 'Car'),
    'super', null,
    (select id from users where name = 'Husband'), false, null, 2
  union all
  select 'fuel', 'Fuel Regular', 'gas-station',
    (select id from categories where name = 'Fuel'),
    null,
    (select id from vehicles where name = 'Car'),
    'regular', null,
    (select id from users where name = 'Husband'), false, null, 3
  union all
  select 'instant', 'NAN 3', 'bottle',
    (select id from categories where name = 'Child'),
    null, null, null, 2000,
    (select id from users where name = 'Husband'), true, 'NAN 3 milk powder', 4
  union all
  select 'instant', 'Tuk Tuk', 'car',
    (select id from categories where name = 'Transport'),
    null, null, null, 400,
    (select id from users where name = 'Wife'), false, 'Tuk Tuk — morning', 5
  union all
  select 'instant', 'Bus', 'bus',
    (select id from categories where name = 'Transport'),
    null, null, null, 100,
    (select id from users where name = 'Wife'), false, 'Bus — evening', 6;

-- Starting opening balance for this month so "remaining" has something to work
-- from immediately. Replace 0 with your real current bank balance for each of
-- you, or just edit it in Budgets & settings after the app is running.
insert into opening_balances (user_id, month, amount)
  select id, to_char(current_date, 'YYYY-MM'), 0 from users where name = 'Husband'
  union all
  select id, to_char(current_date, 'YYYY-MM'), 0 from users where name = 'Wife';
