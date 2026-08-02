import { useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import { formatMoney } from "../lib/format";
import { monthKey, getExpenseCycle } from "../lib/payPeriod";
import { getDefaultPayerId, setDefaultPayerId as saveDefaultPayerId } from "../lib/devicePrefs";

function SalaryRow({ user, colorVar }) {
  const { updateUser } = useData();
  const [salary, setSalary] = useState(user.salary);
  const [payDay, setPayDay] = useState(user.pay_day);

  const commitSalary = () => updateUser(user.id, { salary: Number(salary) || 0 });
  const commitPayDay = (val) => {
    setPayDay(val);
    updateUser(user.id, { pay_day: Number(val) });
  };

  return (
    <div className="flex items-center justify-between px-3 py-2.5 ledger-rule">
      <span className="font-display text-sm" style={{ color: `var(${colorVar})` }}>
        {user.name}
      </span>
      <div className="flex items-center gap-2">
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-(--color-ink-faint) font-mono text-xs">
            Rs.
          </span>
          <input
            type="number"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            onBlur={commitSalary}
            className="font-mono text-xs bg-(--color-paper) border border-(--color-line) rounded-md pl-8 pr-2 py-1.5 w-28"
          />
        </div>
        <select
          value={payDay}
          onChange={(e) => commitPayDay(e.target.value)}
          className="font-mono text-xs bg-(--color-paper) border border-(--color-line) rounded-md px-2 py-1.5"
        >
          <option value={10}>day 10</option>
          <option value={30}>day 30</option>
        </select>
      </div>
    </div>
  );
}

function OpeningBalanceRow({ user, colorVar, cycleKey, cycleLabel }) {
  const { getOpeningBalance, isOpeningBalanceConfirmed, setOpeningBalanceValue } = useData();
  const suggested = getOpeningBalance(user.id, cycleKey);
  const confirmed = isOpeningBalanceConfirmed(user.id, cycleKey);
  const [value, setValue] = useState(suggested);

  const commit = () => setOpeningBalanceValue(user.id, cycleKey, Number(value) || 0);

  return (
    <div className="px-3 py-2.5 ledger-rule">
      <div className="flex items-center justify-between">
        <span className="font-display text-sm" style={{ color: `var(${colorVar})` }}>
          {user.name}
        </span>
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-(--color-ink-faint) font-mono text-xs">
            Rs.
          </span>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={commit}
            className="font-mono text-xs bg-(--color-paper) border border-(--color-line) rounded-md pl-8 pr-2 py-1.5 w-28"
          />
        </div>
      </div>
      <p className="text-[10px] text-(--color-ink-faint) mt-1">
        {confirmed ? `Confirmed for ${cycleLabel}` : `Auto-carried from last month — edit to match your bank balance`}
      </p>
    </div>
  );
}

function SubscriptionRow({ sub }) {
  const { updateSubscription } = useData();
  const [amount, setAmount] = useState(sub.amount);
  const [day, setDay] = useState(sub.billing_day);

  const commitAmount = () => updateSubscription(sub.id, { amount: Number(amount) || 0 });
  const commitDay = (val) => {
    setDay(val);
    updateSubscription(sub.id, { billing_day: Number(val) });
  };

  const key = monthKey();
  const postedThisMonth = sub.last_posted_month === key;

  return (
    <div className="px-3 py-2.5 ledger-rule">
      <div className="flex items-center justify-between">
        <span className="text-sm text-(--color-ink)">{sub.name}</span>
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-(--color-ink-faint) font-mono text-xs">
              Rs.
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onBlur={commitAmount}
              className="font-mono text-xs bg-(--color-paper) border border-(--color-line) rounded-md pl-8 pr-2 py-1.5 w-24"
            />
          </div>
          <input
            type="number"
            min={1}
            max={31}
            value={day}
            onChange={(e) => commitDay(e.target.value)}
            className="font-mono text-xs bg-(--color-paper) border border-(--color-line) rounded-md px-2 py-1.5 w-14"
          />
          <span className="text-[10px] text-(--color-ink-faint)">day</span>
        </div>
      </div>
      <p className="text-[10px] mt-1" style={{ color: postedThisMonth ? "var(--color-income)" : "var(--color-ink-faint)" }}>
        {postedThisMonth ? "Posted to Ledger this month" : `Auto-posts on day ${sub.billing_day}`}
      </p>
    </div>
  );
}

function QuickTileRow({ tile }) {
  const { updateQuickTile } = useData();
  const [amount, setAmount] = useState(tile.default_amount ?? "");

  const commit = () => updateQuickTile(tile.id, { default_amount: Number(amount) || 0 });

  return (
    <div className="flex items-center justify-between px-3 py-2.5 ledger-rule">
      <span className="text-sm text-(--color-ink)">{tile.label}</span>
      {tile.kind === "fuel" ? (
        <span className="text-[10px] text-(--color-ink-faint) font-mono">amount entered per fill</span>
      ) : (
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-(--color-ink-faint) font-mono text-xs">
            Rs.
          </span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onBlur={commit}
            className="font-mono text-xs bg-(--color-paper) border border-(--color-line) rounded-md pl-8 pr-2 py-1.5 w-24"
          />
        </div>
      )}
    </div>
  );
}

function BudgetLimitRow({ budget, name, spent }) {
  const { updateBudget } = useData();
  const [limit, setLimit] = useState(budget.limit_amount);

  const commit = () => updateBudget(budget.id, { limit_amount: Number(limit) || 0 });

  const pct = limit ? Math.min(Math.round((spent / limit) * 100), 100) : 0;
  const over = limit ? spent > limit : false;

  return (
    <div className="px-3 py-2.5 ledger-rule">
      <div className="flex items-center justify-between">
        <span className="text-sm text-(--color-ink)">{name}</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-(--color-ink-soft)">{formatMoney(spent)} /</span>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-(--color-ink-faint) font-mono text-xs">
              Rs.
            </span>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              onBlur={commit}
              className="font-mono text-xs bg-(--color-paper) border border-(--color-line) rounded-md pl-8 pr-2 py-1.5 w-24"
            />
          </div>
        </div>
      </div>
      <div className="mt-1.5 h-1.5 w-full rounded-full bg-(--color-line) overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: over ? "var(--color-expense)" : "var(--color-gold)" }}
        />
      </div>
    </div>
  );
}

export default function Budgets() {
  const { users, budgets, transactions, categoryById, subscriptions, quickTiles } = useData();
  const cycle = getExpenseCycle();
  const key = monthKey();
  const [defaultPayer, setDefaultPayer] = useState(getDefaultPayerId());

  const setDefaultPayerId = (userId) => {
    saveDefaultPayerId(userId);
    setDefaultPayer(userId);
  };

  const spendByCategory = useMemo(() => {
    const map = {};
    transactions
      .filter((t) => categoryById[t.category_id]?.type === "expense" && t.date.slice(0, 7) === key)
      .forEach((t) => {
        const cat = categoryById[t.category_id];
        const topId = cat?.parent_id ?? t.category_id;
        map[topId] = (map[topId] || 0) + t.amount;
      });
    return map;
  }, [transactions, categoryById, key]);

  const totalLimit = budgets.reduce((s, b) => s + b.limit_amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + (spendByCategory[b.category_id] || 0), 0);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-lg text-(--color-ink)">Budgets & settings</h2>

      <div>
        <h3 className="text-xs uppercase tracking-wider text-(--color-ink-faint) font-mono mb-1.5">
          Salary & pay dates
        </h3>
        <div className="border border-(--color-line) rounded-xl bg-(--color-card)">
          <SalaryRow user={users[0]} colorVar="--color-mine" />
          <SalaryRow user={users[1]} colorVar="--color-hers" />
        </div>
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-wider text-(--color-ink-faint) font-mono mb-1.5">
          This phone's default payer
        </h3>
        <div className="border border-(--color-line) rounded-xl bg-(--color-card) p-3">
          <div className="flex gap-2">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => setDefaultPayerId(u.id)}
                className="flex-1 py-2.5 rounded-lg border text-sm transition-colors"
                style={{
                  borderColor: defaultPayer === u.id ? "var(--color-ink)" : "var(--color-line)",
                  background: defaultPayer === u.id ? "var(--color-ink)" : "var(--color-paper)",
                  color: defaultPayer === u.id ? "var(--color-paper)" : "var(--color-ink)",
                }}
              >
                {u.name}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-(--color-ink-faint) mt-2">
            Sets who's pre-selected when adding an expense on this device — useful since you're each usually on your
            own phone. This is saved on this device only, not shared with the other phone.
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-wider text-(--color-ink-faint) font-mono mb-1.5">
          Opening balance — {cycle.label}
        </h3>
        <div className="border border-(--color-line) rounded-xl bg-(--color-card)">
          <OpeningBalanceRow user={users[0]} colorVar="--color-mine" cycleKey={key} cycleLabel={cycle.label} />
          <OpeningBalanceRow user={users[1]} colorVar="--color-hers" cycleKey={key} cycleLabel={cycle.label} />
        </div>
        <p className="text-[11px] text-(--color-ink-faint) mt-2 leading-relaxed">
          Remaining this month = opening balance + salary received − spend logged. Next month's opening balance is
          suggested automatically from this month's result — adjust it any time your bank balance drifts from what's
          shown here.
        </p>
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-wider text-(--color-ink-faint) font-mono mb-1.5">
          Subscriptions
        </h3>
        <div className="border border-(--color-line) rounded-xl bg-(--color-card)">
          {subscriptions.map((s) => (
            <SubscriptionRow key={s.id} sub={s} />
          ))}
        </div>
        <p className="text-[11px] text-(--color-ink-faint) mt-2">
          Auto-posts to the Ledger as an expense once the billing day arrives each month (checked when the app
          opens). Payer defaults to {users[0].name} — edit the entry in Ledger afterward if the other person paid.
        </p>
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-wider text-(--color-ink-faint) font-mono mb-1.5">
          Quick-add tile defaults
        </h3>
        <div className="border border-(--color-line) rounded-xl bg-(--color-card)">
          {quickTiles.map((t) => (
            <QuickTileRow key={t.id} tile={t} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-wider text-(--color-ink-faint) font-mono mb-1.5">
          Category limits
        </h3>
        <div className="border border-(--color-line) rounded-xl bg-(--color-card) p-4 mb-3">
          <p className="text-[10px] uppercase tracking-wider text-(--color-ink-faint) font-mono">Total this month</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display text-xl text-(--color-ink)">{formatMoney(totalSpent)}</span>
            <span className="font-mono text-xs text-(--color-ink-faint)">/ {formatMoney(totalLimit)}</span>
          </div>
        </div>
        <div className="border border-(--color-line) rounded-xl bg-(--color-card)">
          {budgets.map((b) => {
            const cat = categoryById[b.category_id];
            return (
              <BudgetLimitRow
                key={b.id}
                budget={b}
                name={cat?.name ?? "Unknown"}
                spent={spendByCategory[b.category_id] || 0}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
