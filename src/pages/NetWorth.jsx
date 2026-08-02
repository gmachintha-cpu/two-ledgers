import { useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import { formatMoney } from "../lib/format";
import { monthKey, getExpenseCycle } from "../lib/payPeriod";
import { getOverspendAlerts, getProjectedMonthEndSpend, detectRecurringCategories, projectAmount } from "../lib/forecast";

function AccountRow({ account, isLiability }) {
  const { updateAccount, transactions, categoryById } = useData();
  const [balance, setBalance] = useState(account.opening_balance);
  const [rate, setRate] = useState(account.interest_rate ?? "");
  const [expanded, setExpanded] = useState(false);

  const commitBalance = () => updateAccount(account.id, { opening_balance: Number(balance) || 0 });
  const commitRate = () => updateAccount(account.id, { interest_rate: rate === "" ? null : Number(rate) });

  const linkedThisMonth = useMemo(() => {
    const key = monthKey();
    return transactions
      .filter((t) => t.account_id === account.id && t.date.slice(0, 7) === key)
      .filter((t) => (isLiability ? categoryById[t.category_id]?.type === "expense" : categoryById[t.category_id]?.type === "income"))
      .reduce((s, t) => s + t.amount, 0);
  }, [transactions, categoryById, account.id, isLiability]);

  return (
    <div className="px-3 py-2.5 ledger-rule">
      <button className="w-full flex items-center justify-between text-left" onClick={() => setExpanded((e) => !e)}>
        <span className="text-sm text-(--color-ink)">{account.name}</span>
        <span
          className="font-mono text-sm"
          style={{ color: isLiability ? "var(--color-expense)" : "var(--color-ink)" }}
        >
          {formatMoney(account.opening_balance)}
        </span>
      </button>
      {linkedThisMonth > 0 && (
        <p className="text-[10px] mt-1" style={{ color: isLiability ? "var(--color-expense)" : "var(--color-income)" }}>
          {isLiability ? "Interest paid" : "Interest earned"} this month: {formatMoney(linkedThisMonth)}
        </p>
      )}
      {expanded && (
        <div className="mt-2.5 pt-2.5 border-t border-(--color-line) flex items-center gap-2 flex-wrap">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-(--color-ink-faint) font-mono text-xs">
              Rs.
            </span>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              onBlur={commitBalance}
              className="font-mono text-xs bg-(--color-paper) border border-(--color-line) rounded-md pl-8 pr-2 py-1.5 w-32"
            />
          </div>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              placeholder="rate"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              onBlur={commitRate}
              className="font-mono text-xs bg-(--color-paper) border border-(--color-line) rounded-md pl-2 pr-6 py-1.5 w-20"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-(--color-ink-faint) font-mono text-xs">%</span>
          </div>
          <span className="text-[10px] text-(--color-ink-faint)">tap balance to edit, blur to save</span>
        </div>
      )}
    </div>
  );
}

function AddAccountForm({ type, users, onAdd, onClose }) {
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [rate, setRate] = useState("");
  const [ownerId, setOwnerId] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!name || balance === "") return;
    onAdd({
      name,
      type,
      owner_id: ownerId || null,
      opening_balance: Number(balance) || 0,
      interest_rate: rate === "" ? null : Number(rate),
    });
    onClose();
  };

  const inputClass =
    "bg-(--color-paper) border border-(--color-line) rounded-md px-2.5 py-1.5 text-xs font-mono text-(--color-ink)";

  return (
    <form onSubmit={submit} className="px-3 py-3 flex flex-col gap-2 ledger-rule">
      <input
        type="text"
        placeholder={type === "liability" ? "e.g. Pawning Loan — Ring" : "e.g. Fixed Deposit"}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={`${inputClass} font-sans`}
        autoFocus
      />
      <div className="flex gap-2 flex-wrap">
        <input
          type="number"
          placeholder="balance"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          className={`${inputClass} w-28`}
        />
        <input
          type="number"
          step="0.1"
          placeholder="rate %"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          className={`${inputClass} w-20`}
        />
        <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className={inputClass}>
          <option value="">Joint</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2 mt-1">
        <button type="button" onClick={onClose} className="flex-1 py-1.5 rounded-md border border-(--color-line) text-xs text-(--color-ink-soft)">
          Cancel
        </button>
        <button type="submit" className="flex-1 py-1.5 rounded-md text-xs font-medium" style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}>
          Add
        </button>
      </div>
    </form>
  );
}

export default function NetWorth() {
  const { accounts, users, transactions, categoryById, budgets, addAccount, getOpeningBalance, spendByUserInMonth } = useData();
  const cycle = getExpenseCycle();
  const key = monthKey();
  const [addingType, setAddingType] = useState(null);

  const assetAccounts = accounts.filter((a) => a.type !== "liability");
  const liabilityAccounts = accounts.filter((a) => a.type === "liability");
  const totalAssets = assetAccounts.reduce((s, a) => s + a.opening_balance, 0);
  const totalLiabilities = liabilityAccounts.reduce((s, a) => s + a.opening_balance, 0);
  const netWorth = totalAssets - totalLiabilities;

  const monthIncome = transactions
    .filter((t) => categoryById[t.category_id]?.type === "income" && t.date.slice(0, 7) === key)
    .reduce((s, t) => s + t.amount, 0);
  const monthExpense = transactions
    .filter((t) => categoryById[t.category_id]?.type === "expense" && t.date.slice(0, 7) === key)
    .reduce((s, t) => s + t.amount, 0);

  const alerts = useMemo(() => getOverspendAlerts({ transactions, categoryById, budgets }), [transactions, categoryById, budgets]);
  const projectedSpend = useMemo(() => getProjectedMonthEndSpend({ transactions, categoryById }), [transactions, categoryById]);
  const recurring = useMemo(() => detectRecurringCategories({ transactions, categoryById }), [transactions, categoryById]);

  // Both pay days always fall within the month (10th and 30th), so by
  // month-end both salaries have landed regardless of today's date.
  const projectedBalance = users.reduce((sum, u) => {
    const opening = getOpeningBalance(u.id, key);
    const projectedUserSpend = projectAmount(spendByUserInMonth(u.id, key));
    return sum + opening + (u.salary || 0) - projectedUserSpend;
  }, 0);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-lg text-(--color-ink)">Net worth</h2>

      <div className="border border-(--color-line) rounded-xl bg-(--color-card) p-4">
        <p className="text-[10px] uppercase tracking-wider text-(--color-ink-faint) font-mono">Net worth today</p>
        <p className="font-display text-2xl mt-1 text-(--color-ink)">{formatMoney(netWorth)}</p>
        <div className="flex gap-4 mt-2">
          <span className="text-xs" style={{ color: "var(--color-income)" }}>
            Assets {formatMoney(totalAssets)}
          </span>
          <span className="text-xs" style={{ color: "var(--color-expense)" }}>
            Liabilities {formatMoney(totalLiabilities)}
          </span>
        </div>
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-wider text-(--color-ink-faint) font-mono mb-1.5">Cashflow quadrant</h3>
        <div className="border border-(--color-line) rounded-xl bg-(--color-card) grid grid-cols-2 overflow-hidden">
          <div className="p-3 border-r border-b border-(--color-line)" style={{ background: "var(--color-income-soft)" }}>
            <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--color-income)" }}>Income</p>
            <p className="font-mono text-sm text-(--color-ink) mt-1">{formatMoney(monthIncome)}</p>
          </div>
          <div className="p-3 border-b border-(--color-line)" style={{ background: "var(--color-expense-soft)" }}>
            <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--color-expense)" }}>Expenses</p>
            <p className="font-mono text-sm text-(--color-ink) mt-1">{formatMoney(monthExpense)}</p>
          </div>
          <div className="p-3 border-r border-(--color-line)">
            <p className="text-[10px] uppercase tracking-wide text-(--color-ink-soft)">Assets</p>
            <p className="font-mono text-sm text-(--color-ink) mt-1">{formatMoney(totalAssets)}</p>
          </div>
          <div className="p-3">
            <p className="text-[10px] uppercase tracking-wide text-(--color-ink-soft)">Liabilities</p>
            <p className="font-mono text-sm text-(--color-ink) mt-1">{formatMoney(totalLiabilities)}</p>
          </div>
        </div>
        <p className="text-[10px] text-(--color-ink-faint) mt-1.5">
          Assets generate income; liabilities generate expense (interest) — that link shows on each account below.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-xs uppercase tracking-wider text-(--color-ink-faint) font-mono">Assets</h3>
          <button onClick={() => setAddingType(addingType === "asset" ? null : "asset")} className="text-xs text-(--color-ink-soft)">
            {addingType === "asset" ? "Cancel" : "+ Add"}
          </button>
        </div>
        <div className="border border-(--color-line) rounded-xl bg-(--color-card)">
          {assetAccounts.map((a) => (
            <AccountRow key={a.id} account={a} isLiability={false} />
          ))}
          {assetAccounts.length === 0 && addingType !== "asset" && (
            <p className="py-5 text-sm text-(--color-ink-faint) text-center">No assets added yet.</p>
          )}
          {addingType === "asset" && (
            <AddAccountForm type="asset" users={users} onAdd={addAccount} onClose={() => setAddingType(null)} />
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-xs uppercase tracking-wider text-(--color-ink-faint) font-mono">Liabilities</h3>
          <button onClick={() => setAddingType(addingType === "liability" ? null : "liability")} className="text-xs text-(--color-ink-soft)">
            {addingType === "liability" ? "Cancel" : "+ Add"}
          </button>
        </div>
        <div className="border border-(--color-line) rounded-xl bg-(--color-card)">
          {liabilityAccounts.map((a) => (
            <AccountRow key={a.id} account={a} isLiability={true} />
          ))}
          {liabilityAccounts.length === 0 && addingType !== "liability" && (
            <p className="py-5 text-sm text-(--color-ink-faint) text-center">No liabilities added yet.</p>
          )}
          {addingType === "liability" && (
            <AddAccountForm type="liability" users={users} onAdd={addAccount} onClose={() => setAddingType(null)} />
          )}
        </div>
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-wider text-(--color-ink-faint) font-mono mb-1.5">
          Forecast — {cycle.label}
        </h3>
        <div className="border rounded-xl p-3.5 space-y-2.5" style={{ background: "var(--color-gold-soft)", borderColor: "#E3D6AE" }}>
          {alerts.length === 0 && (
            <p className="text-xs" style={{ color: "var(--color-gold)" }}>
              No categories on pace to overspend right now.
            </p>
          )}
          {alerts.slice(0, 3).map((a) => (
            <p key={a.id} className="text-xs" style={{ color: "var(--color-gold)" }}>
              On pace to overspend <strong>{a.name}</strong> by {formatMoney(a.overBy)}
            </p>
          ))}
          <div className="h-px" style={{ background: "#E3D6AE" }} />
          <div className="flex justify-between text-[11px]" style={{ color: "var(--color-gold)" }}>
            <span>Projected month-end spend</span>
            <span className="font-mono">{formatMoney(projectedSpend)}</span>
          </div>
          <div className="flex justify-between text-[11px]" style={{ color: "var(--color-gold)" }}>
            <span>Projected combined balance, month end</span>
            <span className="font-mono">{formatMoney(projectedBalance)}</span>
          </div>
        </div>
      </div>

      {recurring.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-wider text-(--color-ink-faint) font-mono mb-1.5">
            Recurring expenses detected
          </h3>
          <div className="border border-(--color-line) rounded-xl bg-(--color-card) px-4 py-1">
            {recurring.map((r) => (
              <div key={r.categoryId} className="flex items-center justify-between py-2 ledger-rule">
                <span className="text-sm text-(--color-ink)">{r.name}</span>
                <span className="text-[10px] text-(--color-ink-faint) font-mono">{r.monthsPresent}/3 months</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
