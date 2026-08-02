import { useData } from "../context/DataContext";
import { daysUntil, getNextPayday } from "../lib/payPeriod";
import { formatMoney } from "../lib/format";

function Card({ user, colorVar, softVar }) {
  const { remainingForUser } = useData();
  if (!user) return null;
  const remaining = remainingForUser(user.id);
  const pct = user.salary ? Math.min(Math.max((remaining / user.salary) * 100, 0), 100) : 0;
  const next = getNextPayday(user.pay_day);
  const days = daysUntil(next);

  return (
    <div
      className="flex-1 rounded-lg px-3 py-2.5 border"
      style={{ borderColor: "var(--color-line)", background: `var(${softVar})` }}
    >
      <div className="flex items-baseline justify-between">
        <span className="font-display text-sm" style={{ color: `var(${colorVar})` }}>
          {user.name}
        </span>
        <span className="font-mono text-[10px] text-(--color-ink-faint)">paid {user.pay_day}th</span>
      </div>
      <div className="font-mono text-[15px] text-(--color-ink) mt-1.5">
        {formatMoney(remaining)} <span className="text-[9px] text-(--color-ink-faint)">left</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full rounded-full bg-(--color-line) overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: `var(${colorVar})` }}
        />
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="font-mono text-[10px] text-(--color-ink-soft)">of {formatMoney(user.salary)}</span>
        <span className="font-mono text-[10px] text-(--color-ink-soft)">
          {days === 0 ? "payday today" : `${days}d left`}
        </span>
      </div>
    </div>
  );
}

export default function PayPeriodLedger() {
  const { users } = useData();
  const husband = users[0];
  const wife = users[1];

  return (
    <div>
      <div className="flex gap-2">
        <Card user={husband} colorVar="--color-mine" softVar="--color-mine-soft" />
        <Card user={wife} colorVar="--color-hers" softVar="--color-hers-soft" />
      </div>
      <p className="text-[10px] text-(--color-ink-faint) mt-1.5">
        Salary and pay dates are editable in Budgets.
      </p>
    </div>
  );
}
