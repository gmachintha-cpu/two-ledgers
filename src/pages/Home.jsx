import { useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import { formatMoney } from "../lib/format";
import { getExpenseCycle } from "../lib/payPeriod";
import { colorForCategory } from "../lib/categoryColors";
import DonutChart from "../components/DonutChart";
import QuickTiles from "../components/QuickTiles";
import OverspendBanner from "../components/OverspendBanner";
import MonthSwitcher from "../components/MonthSwitcher";

const FILTERS = ["combined", "husband", "wife"];

export default function Home({ onAddExpense, viewDate, onChangeMonth }) {
  const { users, transactions, categoryById } = useData();
  const [filter, setFilter] = useState("combined");
  const husband = users[0];
  const wife = users[1];
  const cycle = getExpenseCycle(viewDate);
  const isCurrentMonth = cycle.key === getExpenseCycle().key;

  const scoped = useMemo(() => {
    return transactions.filter((t) => {
      if (categoryById[t.category_id]?.type !== "expense") return false;
      if (t.date.slice(0, 7) !== cycle.key) return false;
      if (filter === "husband") return t.payer_id === husband.id;
      if (filter === "wife") return t.payer_id === wife.id;
      return true;
    });
  }, [transactions, filter, categoryById, cycle.key, husband, wife]);

  const total = scoped.reduce((s, t) => s + t.amount, 0);

  const segments = useMemo(() => {
    const map = {};
    scoped.forEach((t) => {
      const cat = categoryById[t.category_id];
      if (!cat) return;
      const topId = cat.parent_id ?? cat.id;
      map[topId] = (map[topId] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([id, value]) => ({ id, name: categoryById[id]?.name, value, color: colorForCategory(id) }))
      .sort((a, b) => b.value - a.value);
  }, [scoped, categoryById]);

  return (
    <div className="space-y-6">
      <MonthSwitcher viewDate={viewDate} onChange={onChangeMonth} label={cycle.label.split(" ").pop() + " " + viewDate.getFullYear()} />

      {isCurrentMonth && <OverspendBanner />}

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

      <div className="flex flex-col items-center py-2">
        <DonutChart
          segments={segments}
          centerLabel={cycle.label.toUpperCase()}
          centerValue={formatMoney(total)}
        />

        {segments.length === 0 ? (
          <p className="text-sm text-(--color-ink-faint) mt-6">No expenses logged yet this month.</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-6 w-full max-w-xs">
            {segments.map((s) => (
              <div key={s.id} className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: s.color }} />
                <span className="text-xs text-(--color-ink-soft) truncate">
                  {s.name} {total ? Math.round((s.value / total) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {isCurrentMonth && <QuickTiles />}

      <div>
        <button
          onClick={onAddExpense}
          className="w-full py-3.5 rounded-xl font-medium text-[15px] flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
          style={{ background: "var(--color-card)", color: "var(--color-ink)", border: "1px solid var(--color-line)" }}
        >
          <span className="text-lg leading-none">+</span> Something else…
        </button>
      </div>
    </div>
  );
}
