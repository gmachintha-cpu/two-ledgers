import { useMemo } from "react";
import { useData } from "../context/DataContext";
import { getOverspendAlerts } from "../lib/forecast";
import { formatMoney } from "../lib/format";

export default function OverspendBanner() {
  const { transactions, categoryById, budgets } = useData();

  const worst = useMemo(() => {
    const alerts = getOverspendAlerts({ transactions, categoryById, budgets });
    return alerts[0] ?? null;
  }, [transactions, categoryById, budgets]);

  if (!worst) return null;

  return (
    <div
      className="rounded-lg px-3 py-2.5 flex items-start gap-2 border"
      style={{ background: "var(--color-gold-soft)", borderColor: "#E3D6AE" }}
    >
      <span style={{ color: "var(--color-gold)" }} className="mt-0.5">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" />
          <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" />
        </svg>
      </span>
      <span className="text-xs" style={{ color: "var(--color-gold)" }}>
        On pace to overspend <strong>{worst.name}</strong> by {formatMoney(worst.overBy)} this month
      </span>
    </div>
  );
}
