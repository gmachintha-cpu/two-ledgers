# Two Ledgers — household finance app

A shared expense tracker for Husband and Wife, one baby, two vehicles, and two
different pay dates. Built as a PWA so it works on both Android and iPhone
from the same codebase — add it to your home screen from Chrome or Safari
and it behaves like an app icon.

## What's in this build

- **Home** — donut chart of the month's spend, Combined/Husband/Wife toggle, one-tap Quick add tiles, month navigation (swipe left/right or tap the arrows to check previous months)
- **Quick add tiles** — Parking, Fuel Super, Fuel Regular, NAN 3, Tuk Tuk, Bus. Fixed-amount tiles log instantly; Fuel tiles open a short form (amount, liters, odometer) and compute km/l fuel efficiency automatically
- **Ledger** — income + expense totals, category breakdown, full entry list for whichever month you're viewing (same month navigation as Home). Tap any entry to edit it, including liters/odometer on a linked fuel fill
- **Vehicles** — Car vs Bike costs tracked separately, plus a fuel-efficiency log (km/l per fill, running average) per vehicle
- **Net worth** — assets and liabilities (editable, with interest rate), a Kiyosaki-style cashflow quadrant (income/expense linked to assets/liabilities), each liability shows its linked interest paid automatically
- **Forecasting** — a run-rate projection (spend-so-far ÷ days elapsed × days in month) flags categories on pace to overspend, both as a banner on Home and in full on Net Worth, plus a projected month-end combined balance
- **Recurring-expense detection** — categories with expense activity in 2+ of the last 3 months are surfaced automatically
- **Budgets & settings** — category limits, editable salary + pay day, monthly opening-balance reconciliation, editable subscriptions (auto-post to Ledger on their billing day), editable quick-tile defaults, and a per-device default payer toggle
- **Per-device default payer** — since you're usually each on your own phone, this pre-selects who paid on the general Add form and the Fuel form. Stored on-device only (localStorage), not synced between phones
- Categories include **Rent**, **Child**, **Transport**, and Vehicles sub-categories (Fuel, Parking, Parts, Repairs, Car Wash, Service & Maintenance, Insurance & Registration)
- Two independent clocks: the **expense cycle** is the calendar month (1st–last day), while each person's **salary clock** runs on their own pay day (10th / 30th) and only drives the "remaining" bars at the top

## Running it

```bash
npm install
npm run dev
```

No setup required to try it — starts with realistic demo data (`src/lib/mockData.js`) held in memory; refreshing resets it.

## How "remaining" is calculated

For each person, every month:

```
remaining = opening balance + salary received so far this month − spend logged this month
```

- **Opening balance** for the 1st of a new month is auto-suggested from last month's result (opening + salary − spend), so most months need no input.
- If your actual bank balance drifts from that, edit the opening balance in **Budgets & settings** — it's a plain editable field, pre-filled with the suggestion.
- "Salary received" only counts once that month's pay day has passed.

## Stage 3.1 — going live: Supabase, GitHub, Vercel

The app switches between two modes automatically:
- **No `.env.local`** → demo mode, in-memory mock data
- **`.env.local` filled in** → real mode, reads and writes Supabase directly

### 1. Supabase (the database)

1. Create a free project at supabase.com
2. Open the SQL editor and run `supabase/schema.sql` — creates all 10 tables and seeds categories
3. Run `supabase/seed.sql` — seeds Husband/Wife, Car/Bike, the joint account, starter budgets, both subscriptions, and all 6 quick tiles
4. Project Settings → API → copy your **Project URL** and **anon / public key** (or **Publishable key** on newer projects — either works)
5. Copy `.env.example` to `.env.local` and paste those in:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-key-here
   ```
   Note: the URL is just the bare project URL — no `/rest/v1/` suffix, the client library adds that itself.
6. Run `npm run dev` — the "demo data" badge should disappear. Add an expense and refresh to confirm it persists

### 2. GitHub

```bash
cd household-finance
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```
Create the empty repo on GitHub first (github.com/new, don't add a README there). `.env.local` is gitignored, so your keys won't get committed.

### 3. Vercel

1. vercel.com → Add New Project → import the repo (auto-detects Vite)
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables
3. Deploy → open the `*.vercel.app` URL on both phones and Add to Home Screen

`vercel.json` handles client-side routing so refreshing on any tab doesn't 404. Every `git push` after this auto-deploys.

## Project structure

```
src/
  lib/
    mockData.js         demo data, shaped exactly like supabase/schema.sql
    payPeriod.js         calendar-month expense cycle + per-person salary clock
    forecast.js          run-rate projection + recurring-expense detection
    categoryColors.js    fixed color per category for the donut chart
    devicePrefs.js        per-device default payer (localStorage)
    supabaseClient.js    Supabase client (inactive until .env.local is set)
    db.js                fetch/insert/update/delete helpers used when Supabase is connected
    format.js            currency/date formatting (LKR)
  context/
    DataContext.jsx      central store — demo mode (in-memory) or real mode (Supabase), same shape either way
  components/
    Layout.jsx             app shell, bottom tab nav, settings gear
    PayPeriodLedger.jsx     remaining-money strip at the top of every screen
    MonthSwitcher.jsx       month navigation (swipe + tap arrows) used on Home and Ledger
    DonutChart.jsx          CSS conic-gradient donut, used on Home
    QuickTiles.jsx          one-tap expense tiles on Home
    FuelQuickAdd.jsx        fuel form (amount, liters, odometer) with live km/l preview
    OverspendBanner.jsx     Home banner for the worst overspend forecast, if any
    CategoryBar.jsx         budget progress bar
  pages/
    Home.jsx  Ledger.jsx  AddTransaction.jsx  Vehicles.jsx  NetWorth.jsx  Budgets.jsx
supabase/
  schema.sql   run first — creates tables, seeds categories
  seed.sql     run second — seeds your household's starting data
vercel.json    SPA rewrite so client-side routes don't 404 on refresh
```

## Design notes

Colors, type, and spacing are all driven by CSS variables in `src/index.css`
(`@theme` block). Money figures use IBM Plex Mono throughout so amounts line
up visually, ledger-style.

## Not in this build yet

- Camera / OCR receipt capture
- Deleting an asset/liability once added (edit balance/rate only, for now)
- Realtime sync between two devices open at once (each write goes to Supabase immediately, but the other device won't see it until it refreshes)
