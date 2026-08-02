import { formatMoney } from "../lib/format";

export default function CategoryBar({ name, spent, limit }) {
  const pct = limit ? Math.min(Math.round((spent / limit) * 100), 100) : 0;
  const over = limit ? spent > limit : false;

  return (
    <div className="py-2.5 ledger-rule">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-(--color-ink)">{name}</span>
        <span className="font-mono text-sm text-(--color-ink-soft)">
          {formatMoney(spent)}
          {limit ? <span className="text-(--color-ink-faint)"> / {formatMoney(limit)}</span> : null}
        </span>
      </div>
      {limit ? (
        <div className="mt-1.5 h-1.5 w-full rounded-full bg-(--color-line) overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: over ? "var(--color-expense)" : "var(--color-gold)",
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
