import { useState } from "react";
import { useData } from "../context/DataContext";
import { formatMoney } from "../lib/format";
import FuelQuickAdd from "./FuelQuickAdd";

function TileIcon({ icon }) {
  const common = "w-5 h-5";
  switch (icon) {
    case "parking":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="4" y="3" width="16" height="18" rx="2.5" />
          <path d="M10 16V8h2.6a2.4 2.4 0 0 1 0 4.8H10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "gas-station":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 21V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v15" strokeLinecap="round" />
          <path d="M4 21h10M4 11h10" strokeLinecap="round" />
          <path d="M14 8h2.2L19 10.8V17a1.5 1.5 0 0 1-3 0v-2.5a1 1 0 0 0-1-1H14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "bottle":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M10 2h4v3.2c0 .5.2 1 .6 1.3.9.9 1.4 2 1.4 3.3V20a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V9.8c0-1.3.5-2.4 1.4-3.3.4-.4.6-.8.6-1.3V2Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 13h6" strokeLinecap="round" />
        </svg>
      );
    case "car":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 13l1.5-4.5A2 2 0 0 1 6.4 7h11.2a2 2 0 0 1 1.9 1.5L21 13" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="2.5" y="13" width="19" height="5" rx="1.5" />
          <circle cx="7" cy="18.5" r="1.5" />
          <circle cx="17" cy="18.5" r="1.5" />
        </svg>
      );
    case "bus":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="4" width="18" height="13" rx="2" />
          <path d="M3 11h18M7 17v2M17 17v2" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

export default function QuickTiles() {
  const { quickTiles, addTransaction, accounts } = useData();
  const [flash, setFlash] = useState(null);
  const [fuelTile, setFuelTile] = useState(null);

  const handleTap = (tile) => {
    if (tile.kind === "fuel") {
      setFuelTile(tile);
      return;
    }
    addTransaction({
      date: new Date().toISOString().slice(0, 10),
      amount: tile.default_amount,
      payer_id: tile.payer_id,
      category_id: tile.category_id,
      account_id: accounts.find((a) => a.type === "bank")?.id ?? accounts[0].id,
      vehicle_id: tile.vehicle_id ?? null,
      shared: tile.shared,
      notes: tile.notes,
      receipt_url: null,
    });
    setFlash(tile.id);
    setTimeout(() => setFlash((f) => (f === tile.id ? null : f)), 900);
  };

  return (
    <div>
      <h3 className="text-xs uppercase tracking-wider text-(--color-ink-faint) font-mono mb-2">Quick add</h3>
      <div className="grid grid-cols-3 gap-2">
        {quickTiles.map((tile) => {
          const isFuel = tile.kind === "fuel";
          const isFlashing = flash === tile.id;
          return (
            <button
              key={tile.id}
              onClick={() => handleTap(tile)}
              className="rounded-xl border px-2 py-3 flex flex-col items-center gap-1.5 transition-transform active:scale-95"
              style={{
                borderColor: isFlashing ? "var(--color-income)" : "var(--color-line)",
                background: isFlashing ? "var(--color-income-soft)" : "var(--color-card)",
              }}
            >
              <span style={{ color: isFlashing ? "var(--color-income)" : "var(--color-ink-soft)" }}>
                <TileIcon icon={tile.icon} />
              </span>
              <span className="text-[11px] text-(--color-ink) leading-tight text-center">{tile.label}</span>
              <span className="text-[10px] font-mono text-(--color-ink-faint)">
                {isFlashing ? "Added ✓" : isFuel ? "enter amount" : formatMoney(tile.default_amount)}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-(--color-ink-faint) mt-2">
        Tap a tile to log instantly. Tiles and defaults are editable in Budgets.
      </p>

      {fuelTile && <FuelQuickAdd tile={fuelTile} onClose={() => setFuelTile(null)} />}
    </div>
  );
}
