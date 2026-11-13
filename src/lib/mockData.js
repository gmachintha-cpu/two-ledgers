// Demo data shaped exactly like the Stage 1 schema (see /supabase/schema.sql).
// Swap DataContext's storage layer for the Supabase client in src/lib/supabaseClient.js
// once real accounts are ready — the shape below is what the rest of the app expects.

import { monthKey } from "./payPeriod";
const currentMonthKey = () => monthKey(new Date());

export const users = [
  { id: "u1", name: "Husband", pay_day: 10, salary: 150000 },
  { id: "u2", name: "Wife", pay_day: 30, salary: 85000 },
];

export const accounts = [
  { id: "a1", name: "Joint Current Account", type: "bank", owner_id: null, opening_balance: 145000, interest_rate: null },
  { id: "a2", name: "Joint Savings", type: "asset", owner_id: null, opening_balance: 320000, interest_rate: 7.5 },
  { id: "a3", name: "Fixed Deposit — 12mo", type: "asset", owner_id: null, opening_balance: 500000, interest_rate: 11 },
  { id: "a4", name: "ETF / Unit Trust", type: "asset", owner_id: "u1", opening_balance: 180000, interest_rate: null },
  { id: "a5", name: "EPF Balance", type: "asset", owner_id: "u1", opening_balance: 610000, interest_rate: null },
  { id: "a6", name: "Chit Fund — Round 4", type: "asset", owner_id: "u2", opening_balance: 60000, interest_rate: null },
  { id: "a7", name: "Pawning Loan — Wife's Jewellery", type: "liability", owner_id: "u2", opening_balance: 150000, interest_rate: 18 },
  { id: "a8", name: "Soft Loan — from Brother", type: "liability", owner_id: "u1", opening_balance: 50000, interest_rate: 0 },
];

export const vehicles = [
  { id: "v1", name: "Car", owner_id: null },
  { id: "v2", name: "Bike", owner_id: "u1" },
];

// type: income | expense. parent_id groups sub-categories (e.g. Fuel under Vehicles).
export const categories = [
  { id: "c1", name: "Salary", type: "income", parent_id: null },
  { id: "c2", name: "Savings Interest", type: "income", parent_id: null },
  { id: "c3", name: "FD Interest", type: "income", parent_id: null },
  { id: "c4", name: "Lottery", type: "income", parent_id: null },
  { id: "c5", name: "Chit Fund Payout", type: "income", parent_id: null },

  { id: "c10", name: "Housing & Utilities", type: "expense", parent_id: null },
  { id: "c10a", name: "Rent", type: "expense", parent_id: null },
  { id: "c11", name: "Groceries", type: "expense", parent_id: null },
  { id: "c12", name: "Child", type: "expense", parent_id: null },
  { id: "c13", name: "Vehicles", type: "expense", parent_id: null },
  { id: "c13a", name: "Fuel", type: "expense", parent_id: "c13" },
  { id: "c13b", name: "Service & Maintenance", type: "expense", parent_id: "c13" },
  { id: "c13c", name: "Insurance & Registration", type: "expense", parent_id: "c13" },
  { id: "c13d", name: "Parking", type: "expense", parent_id: "c13" },
  { id: "c13e", name: "Parts", type: "expense", parent_id: "c13" },
  { id: "c13f", name: "Repairs", type: "expense", parent_id: "c13" },
  { id: "c13g", name: "Car Wash", type: "expense", parent_id: "c13" },
  { id: "c14", name: "Dining Out", type: "expense", parent_id: null },
  { id: "c15", name: "Subscriptions", type: "expense", parent_id: null },
  { id: "c16", name: "Healthcare", type: "expense", parent_id: null },
  { id: "c17", name: "Personal", type: "expense", parent_id: null },
  { id: "c18", name: "Pawning / Loan Interest", type: "expense", parent_id: null },
  { id: "c19", name: "Savings & Investment", type: "expense", parent_id: null },
  { id: "c20", name: "Gifts & Occasions", type: "expense", parent_id: null },
  { id: "c21", name: "Miscellaneous", type: "expense", parent_id: null },
  { id: "c22", name: "Transport", type: "expense", parent_id: null },
];

const today = new Date();
const iso = (offsetDays) => {
  const d = new Date(today);
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().slice(0, 10);
};

export const transactions = [
  { id: "t1", date: iso(2), amount: 8400, payer_id: "u1", category_id: "c11", account_id: "a1", vehicle_id: null, shared: true, notes: "Cargills weekly shop", receipt_url: null },
  { id: "t2", date: iso(3), amount: 12500, payer_id: "u2", category_id: "c12", account_id: "a1", vehicle_id: null, shared: true, notes: "Diapers + formula, pediatrician visit", receipt_url: null },
  { id: "t3", date: iso(4), amount: 6200, payer_id: "u1", category_id: "c13a", account_id: "a1", vehicle_id: "v1", shared: false, notes: "Fuel — Super", receipt_url: null },
  { id: "t4", date: iso(5), amount: 1800, payer_id: "u1", category_id: "c13a", account_id: "a1", vehicle_id: "v2", shared: false, notes: "Fuel — Regular", receipt_url: null },
  { id: "t5", date: iso(6), amount: 22000, payer_id: "u1", category_id: "c13b", account_id: "a1", vehicle_id: "v1", shared: false, notes: "Car service — oil, brake pads", receipt_url: null },
  { id: "t6", date: iso(7), amount: 2250, payer_id: "u2", category_id: "c18", account_id: "a7", vehicle_id: null, shared: true, notes: "Pawning interest — monthly", receipt_url: null },
  { id: "t7", date: iso(8), amount: 4500, payer_id: "u2", category_id: "c14", account_id: "a1", vehicle_id: null, shared: false, notes: "Dinner out", receipt_url: null },
  { id: "t8", date: iso(9), amount: 3200, payer_id: "u1", category_id: "c15", account_id: "a1", vehicle_id: null, shared: true, notes: "Netflix, iCloud, mobile plans", receipt_url: null },
  { id: "t9", date: iso(1), amount: 15000, payer_id: "u1", category_id: "c10", account_id: "a1", vehicle_id: null, shared: true, notes: "Electricity + water", receipt_url: null },
  { id: "t10", date: iso(12), amount: 9000, payer_id: "u2", category_id: "c12", account_id: "a1", vehicle_id: null, shared: true, notes: "Daycare fee", receipt_url: null },
  { id: "t11", date: iso(20), amount: 150000, payer_id: "u1", category_id: "c1", account_id: "a1", vehicle_id: null, shared: false, notes: "Monthly salary", receipt_url: null },
  { id: "t12", date: iso(1), amount: 2100, payer_id: "u1", category_id: "c2", account_id: "a2", vehicle_id: null, shared: true, notes: "Savings account interest", receipt_url: null },
  { id: "t13", date: iso(18), amount: 6400, payer_id: "u1", category_id: "c13a", account_id: "a1", vehicle_id: "v1", shared: false, notes: "Fuel — Super", receipt_url: null },
  { id: "t14", date: iso(0), amount: 400, payer_id: "u2", category_id: "c22", account_id: "a1", vehicle_id: null, shared: false, notes: "Tuk Tuk — morning", receipt_url: null },
  { id: "t15", date: iso(0), amount: 100, payer_id: "u2", category_id: "c22", account_id: "a1", vehicle_id: null, shared: false, notes: "Bus — evening", receipt_url: null },
  { id: "t16", date: iso(3), amount: 700, payer_id: "u1", category_id: "c13d", account_id: "a1", vehicle_id: "v1", shared: false, notes: "Parking", receipt_url: null },
];

export const budgets = [
  { id: "b0", category_id: "c10a", limit_amount: 65000, period: "monthly" },
  { id: "b1", category_id: "c11", limit_amount: 40000, period: "monthly" },
  { id: "b2", category_id: "c12", limit_amount: 35000, period: "monthly" },
  { id: "b3", category_id: "c13", limit_amount: 30000, period: "monthly" },
  { id: "b4", category_id: "c14", limit_amount: 15000, period: "monthly" },
  { id: "b5", category_id: "c18", limit_amount: 2250, period: "monthly" },
];

// Opening balance per user per calendar month (key: "YYYY-MM").
// If a month has no entry here, the UI auto-suggests last month's computed
// remaining balance and lets the person confirm/edit it — see DataContext.getOpeningBalance.
export const openingBalances = [
  { id: "ob1", user_id: "u1", month: currentMonthKey(), amount: 12300 },
  { id: "ob2", user_id: "u2", month: currentMonthKey(), amount: 2900 },
];

// One row per fill-up, linked to its expense transaction. Kept separate from
// transactions (even though every fill-up is also a transaction) so Vehicles
// can show odometer/liters trends and compute km/l without digging through
// free-text notes — this is the data later fuel-efficiency analysis reads from.
export const fuelLogs = [
  { id: "fl1", transaction_id: "t13", vehicle_id: "v1", date: iso(18), fuel_type: "super", amount: 6400, liters: 19.0, odometer: 41960 },
  { id: "fl2", transaction_id: "t3", vehicle_id: "v1", date: iso(4), fuel_type: "super", amount: 6200, liters: 18.4, odometer: 42180 },
  { id: "fl3", transaction_id: "t4", vehicle_id: "v2", date: iso(5), fuel_type: "regular", amount: 1800, liters: 3.2, odometer: 8100 },
];

// Recurring subscriptions. Auto-posted as a transaction once the billing day
// arrives each month (checked on app load) — last_posted_month prevents
// posting the same charge twice if you open the app more than once that month.
export const subscriptions = [
  { id: "s1", name: "Youtube Family", amount: 3000, billing_day: 11, category_id: "c15", last_posted_month: null },
  { id: "s2", name: "Claude", amount: 6000, billing_day: 28, category_id: "c15", last_posted_month: null },
];

// Home-screen one-tap tiles. "instant" tiles log a transaction immediately
// with these defaults; "fuel" tiles open the fuel form instead since
// they need liters + odometer. Editable from Budgets.
export const quickTiles = [
 { id: "qt1", kind: "instant", label: "Metro", icon: "bus", category_id: "c22", vehicle_id: null, default_amount: 300, payer_id: "u2", shared: false, notes: "Metro bus — to work" },
  { id: "qt2", kind: "fuel", label: "Fuel Super", icon: "gas-station", fuel_type: "super", category_id: "c13a", default_vehicle_id: "v1", payer_id: "u1" },
  { id: "qt3", kind: "fuel", label: "Fuel Regular", icon: "gas-station", fuel_type: "regular", category_id: "c13a", default_vehicle_id: "v1", payer_id: "u1" },
 { id: "qt4", kind: "instant", label: "NAN 3", icon: "bottle", category_id: "c12", vehicle_id: null, default_amount: 2200, payer_id: "u1", shared: true, notes: "NAN 3 milk powder" },
  { id: "qt5", kind: "instant", label: "Tuk Tuk", icon: "car", category_id: "c22", vehicle_id: null, default_amount: 400, payer_id: "u2", shared: false, notes: "Tuk Tuk — morning" },
  { id: "qt6", kind: "instant", label: "Bus", icon: "bus", category_id: "c22", vehicle_id: null, default_amount: 100, payer_id: "u2", shared: false, notes: "Bus — evening" },
];
