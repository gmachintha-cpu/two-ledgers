import { monthKey, previousMonthKey, daysInMonth, dayOfMonth } from "./payPeriod";

// Simple run-rate projection: whatever the pace has been so far this month,
// assume it continues. Deliberately naive for v1 — no seasonality, no
// day-of-week weighting. "Good enough to flag a problem early" is the bar.
export function projectAmount(spentSoFar, date = new Date()) {
  const elapsed = Math.max(dayOfMonth(date), 1);
  const total = daysInMonth(date);
  return (spentSoFar / elapsed) * total;
}

// Categories projected to finish the month over their budget limit.
// Returns the worst offender first (by rupee amount over budget).
export function getOverspendAlerts({ transactions, categoryById, budgets, date = new Date() }) {
  const key = monthKey(date);
  const spendByCategory = {};
  transactions.forEach((t) => {
    const cat = categoryById[t.category_id];
    if (cat?.type !== "expense") return;
    if (t.date.slice(0, 7) !== key) return;
    const topId = cat.parent_id ?? t.category_id;
    spendByCategory[topId] = (spendByCategory[topId] || 0) + t.amount;
  });

  return budgets
    .map((b) => {
      const spent = spendByCategory[b.category_id] || 0;
      const projected = projectAmount(spent, date);
      const overBy = projected - b.limit_amount;
      return { ...b, name: categoryById[b.category_id]?.name, spent, projected, overBy };
    })
    .filter((b) => b.overBy > 0)
    .sort((a, b) => b.overBy - a.overBy);
}

// Total projected expense for the month, combined across both of you.
export function getProjectedMonthEndSpend({ transactions, categoryById, date = new Date() }) {
  const key = monthKey(date);
  const spent = transactions
    .filter((t) => categoryById[t.category_id]?.type === "expense" && t.date.slice(0, 7) === key)
    .reduce((s, t) => s + t.amount, 0);
  return projectAmount(spent, date);
}

// A category counts as "recurring" if it has expense activity in at least 2
// of the last 3 calendar months (current month included, however partial).
// No amount-similarity check — deliberately simple for v1.
export function detectRecurringCategories({ transactions, categoryById, date = new Date() }) {
  const months = [monthKey(date), previousMonthKey(date), previousMonthKey(new Date(`${previousMonthKey(date)}-01`))];

  const presenceByCategory = {};
  transactions.forEach((t) => {
    const cat = categoryById[t.category_id];
    if (!cat || cat.type !== "expense") return;
    const txMonth = t.date.slice(0, 7);
    const monthIndex = months.indexOf(txMonth);
    if (monthIndex === -1) return;
    if (!presenceByCategory[t.category_id]) presenceByCategory[t.category_id] = new Set();
    presenceByCategory[t.category_id].add(txMonth);
  });

  return Object.entries(presenceByCategory)
    .filter(([, monthsPresent]) => monthsPresent.size >= 2)
    .map(([categoryId, monthsPresent]) => ({
      categoryId,
      name: categoryById[categoryId]?.name,
      monthsPresent: monthsPresent.size,
    }))
    .sort((a, b) => b.monthsPresent - a.monthsPresent);
}
