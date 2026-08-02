import { useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import { formatMoney, formatDate } from "../lib/format";
import CategoryBar from "../components/CategoryBar";
import MonthSwitcher from "../components/MonthSwitcher";
import { getExpenseCycle } from "../lib/payPeriod";

const FILTERS = ["combined", "husband", "wife"];

export default function Ledger({ onEdit, viewDate, onChangeMonth }) {
  const { users, transactions, categoryById, userById, vehicleById, budgets, deleteTransaction } = useData();
  const [filter, setFilter] = useState("combined");
  const husband = users[0];
  const wife = users[1];
  const cycle = getExpenseCycle(viewDate);

  const scoped = useMemo(() => {
    return transactions.filter((t) => {
      if (t.date.slice(0, 7) !== cycle.key) return false;
      if (filter === "husband") return t.payer_id === husband.id;
      if (filter === "wife") return t.payer_id === wife.id;
      return true;
    });
  }, [transactions, filter, husband, wife, cycle.key]);

  const totalIncome = scoped
    .filter((t) => categoryById[t.category_id]?.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = scoped
    .filter((t) => categoryById[t.category_id]?.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const byCategory = useMemo(() => {
    const map = {};
    scoped.forEach((t) => {
      const cat = categoryById[t.category_id];
      if (!cat || cat.type !== "expense") return;
      const topId = cat.parent_id ?? cat.id;
      map[topId] = (map[topId] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([id, spent]) => ({ id, name: categoryById[id]?.name, spent }))
      .sort((a, b) => b.spent - a.spent);
  }, [scoped, categoryById]);

  const budgetByCategory = Object.fromEntries(budgets.map((b) => [b.category_id, b.limit_amount]));

  const entries = [...scoped].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="space-y-6">
      <MonthSwitcher viewDate={viewDate} onChange={onChangeMonth} label={cycle.label.split(" ").pop() + " " + viewDate.getFullYear()} />

      <div className="flex items-center gap-1.5 p-1 bg-(--color-card) border border-(--color-line) rounded-full w-fit">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3.5 py-1.5 rounded-full text-xs font-medium capitalize transition-colors"
            style={{
              background: filter === f ? "var(--color-ink)" : "transparent",
              color: filter === f ? "var(--color-paper)" : "var(--color-ink-soft)",
            }}
          >
            {f === "husband" ? husband.name : f === "wife" ? wife.name : "Combined"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="border border-(--color-line) rounded-xl bg-(--color-card) p-4">
          <p className="text-[10px] uppercase tracking-wider text-(--color-ink-faint) font-mono">Income · {cycle.label}</p>
          <p className="font-display text-xl mt-1 text-(--color-income)">{formatMoney(totalIncome)}</p>
        </div>
        <div className="border border-(--color-line) rounded-xl bg-(--color-card) p-4">
          <p className="text-[10px] uppercase tracking-wider text-(--color-ink-faint) font-mono">Expense · {cycle.label}</p>
          <p className="font-display text-xl mt-1 text-(--color-expense)">{formatMoney(totalExpense)}</p>
        </div>
      </div>

      <div>
        <h2 className="font-display text-base text-(--color-ink) mb-1">By category</h2>
        <div className="border border-(--color-line) rounded-xl bg-(--color-card) px-4">
          {byCategory.length === 0 && (
            <p className="py-6 text-sm text-(--color-ink-faint) text-center">No spend logged this month.</p>
          )}
          {byCategory.map((c) => (
            <CategoryBar key={c.id} name={c.name} spent={c.spent} limit={budgetByCategory[c.id]} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-display text-base text-(--color-ink) mb-1">All entries · {cycle.label}</h2>
        <p className="text-[11px] text-(--color-ink-faint) mb-1.5">Tap an entry to edit it</p>
        <div className="border border-(--color-line) rounded-xl bg-(--color-card) divide-y divide-(--color-line)">
          {entries.map((t) => {
            const cat = categoryById[t.category_id];
            const payer = userById[t.payer_id];
            const vehicle = t.vehicle_id ? vehicleById[t.vehicle_id] : null;
            const isIncome = cat?.type === "income";
            return (
              <div
                key={t.id}
                onClick={() => onEdit?.(t)}
                className="flex items-center justify-between px-4 py-3 gap-2 cursor-pointer active:bg-(--color-paper)"
              >
                <div className="min-w-0">
                  <p className="text-sm text-(--color-ink) truncate">
                    {cat?.name}
                    {vehicle ? ` · ${vehicle.name}` : ""}
                  </p>
                  <p className="text-xs text-(--color-ink-faint) mt-0.5">
                    {formatDate(t.date)} · {isIncome ? "received by" : "paid by"} {payer?.name}
                    {t.notes ? ` · ${t.notes}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span
                    className="font-mono text-sm"
                    style={{ color: isIncome ? "var(--color-income)" : "var(--color-expense)" }}
                  >
                    {isIncome ? "+" : "-"}
                    {formatMoney(t.amount)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTransaction(t.id);
                    }}
                    className="text-(--color-ink-faint) hover:text-(--color-expense) text-xs"
                    aria-label="Delete entry"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
          {entries.length === 0 && (
            <p className="py-6 text-sm text-(--color-ink-faint) text-center">Nothing logged this month.</p>
          )}
        </div>
      </div>
    </div>
  );
}
