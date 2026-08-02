// Two clocks running in parallel:
// 1. Expense cycle — calendar month (1st to last day). Used for the donut chart,
//    category breakdown, and budgets. Simple and lines up with bank/credit card statements.
// 2. Salary clock — per-person, anchored to their own pay day (10th or 30th).
//    Used only for the "remaining" bars at the top. Tracked independently because
//    the two people get paid on different days.

export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getExpenseCycle(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const fmt = (d) => d.getDate();
  const monthLabel = start.toLocaleDateString("en-GB", { month: "short" });
  return {
    key: monthKey(date),
    label: `${fmt(start)} \u2013 ${fmt(end)} ${monthLabel}`,
    start,
    end,
  };
}

// Clamp pay_day to the last real day of the given month (handles 30/31 in Feb etc).
function paydayDateInMonth(payDay, year, month) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(payDay, lastDay));
}

export function getNextPayday(payDay, from = new Date()) {
  const thisMonth = paydayDateInMonth(payDay, from.getFullYear(), from.getMonth());
  if (thisMonth >= new Date(from.toDateString())) return thisMonth;
  return paydayDateInMonth(payDay, from.getFullYear(), from.getMonth() + 1);
}

export function daysUntil(date, from = new Date()) {
  const diff = Math.ceil((date - new Date(from.toDateString())) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0);
}

// Has this month's payday already happened (so salary should count toward "received")?
export function hasBeenPaidThisMonth(payDay, from = new Date()) {
  const payday = paydayDateInMonth(payDay, from.getFullYear(), from.getMonth());
  return from >= payday;
}

export function previousMonthKey(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return monthKey(d);
}

export function daysInMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function dayOfMonth(date = new Date()) {
  return date.getDate();
}
