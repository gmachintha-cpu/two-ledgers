import { useMemo } from "react";
import { useData } from "../context/DataContext";
import { formatMoney, formatDate } from "../lib/format";

export default function Vehicles() {
  const { vehicles, transactions, categoryById, fuelLogs } = useData();

  const withTotals = useMemo(() => {
    return vehicles.map((v) => {
      const txs = transactions
        .filter((t) => t.vehicle_id === v.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      const total = txs.reduce((sum, t) => sum + t.amount, 0);
      const byType = {};
      txs.forEach((t) => {
        const name = categoryById[t.category_id]?.name ?? "Other";
        byType[name] = (byType[name] || 0) + t.amount;
      });

      const fills = fuelLogs
        .filter((f) => f.vehicle_id === v.id)
        .sort((a, b) => a.odometer - b.odometer)
        .map((f, i, arr) => {
          const prev = arr[i - 1];
          const km = prev ? f.odometer - prev.odometer : null;
          const kml = km && km > 0 ? +(km / f.liters).toFixed(1) : null;
          return { ...f, km, kml };
        })
        .reverse();

      const avgKml = (() => {
        const withKml = fills.filter((f) => f.kml);
        if (withKml.length === 0) return null;
        return (withKml.reduce((s, f) => s + f.kml, 0) / withKml.length).toFixed(1);
      })();

      return { ...v, txs, total, byType, fills, avgKml };
    });
  }, [vehicles, transactions, categoryById, fuelLogs]);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-lg text-(--color-ink)">Vehicles</h2>
      {withTotals.map((v) => (
        <div key={v.id} className="border border-(--color-line) rounded-xl bg-(--color-card) overflow-hidden">
          <div className="px-4 py-3.5 flex items-baseline justify-between ledger-rule">
            <span className="font-display text-base text-(--color-ink)">{v.name}</span>
            <span className="font-mono text-sm text-(--color-expense)">{formatMoney(v.total)}</span>
          </div>

          {Object.keys(v.byType).length > 0 && (
            <div className="px-4 py-3 flex flex-wrap gap-2 ledger-rule">
              {Object.entries(v.byType).map(([name, amt]) => (
                <span
                  key={name}
                  className="text-[11px] font-mono px-2 py-1 rounded-full"
                  style={{ background: "var(--color-gold-soft)", color: "var(--color-gold)" }}
                >
                  {name}: {formatMoney(amt)}
                </span>
              ))}
            </div>
          )}

          {v.fills.length > 0 && (
            <div className="px-4 py-3 ledger-rule">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xs uppercase tracking-wider text-(--color-ink-faint) font-mono">
                  Fuel efficiency
                </span>
                {v.avgKml && (
                  <span className="font-mono text-xs text-(--color-ink)">avg {v.avgKml} km/l</span>
                )}
              </div>
              <div className="space-y-1.5">
                {v.fills.slice(0, 5).map((f) => (
                  <div key={f.id} className="flex items-center justify-between text-xs">
                    <span className="text-(--color-ink-soft)">
                      {formatDate(f.date)} · {f.fuel_type === "super" ? "Super" : "Regular"} · {f.liters}L
                      <span className="text-(--color-ink-faint)"> @ {f.odometer.toLocaleString()}km</span>
                    </span>
                    <span className="font-mono" style={{ color: f.kml ? "var(--color-gold)" : "var(--color-ink-faint)" }}>
                      {f.kml ? `${f.kml} km/l` : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="divide-y divide-(--color-line)">
            {v.txs.length === 0 && (
              <p className="px-4 py-5 text-sm text-(--color-ink-faint) text-center">No expenses logged for this vehicle yet.</p>
            )}
            {v.txs.map((t) => (
              <div key={t.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-(--color-ink)">{categoryById[t.category_id]?.name}</p>
                  <p className="text-xs text-(--color-ink-faint) mt-0.5">
                    {formatDate(t.date)}
                    {t.notes ? ` · ${t.notes}` : ""}
                  </p>
                </div>
                <span className="font-mono text-sm text-(--color-ink-soft)">{formatMoney(t.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
