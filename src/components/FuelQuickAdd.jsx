import { useState, useEffect } from "react";
import { useData } from "../context/DataContext";
import { getDefaultPayerId } from "../lib/devicePrefs";

export default function FuelQuickAdd({ tile, onClose }) {
  const { vehicles, users, addFuelEntry, lastFuelLog } = useData();
  const [vehicleId, setVehicleId] = useState(tile.default_vehicle_id);
  const [amount, setAmount] = useState("");
  const [liters, setLiters] = useState("");
  const [odometer, setOdometer] = useState("");
  const [payerId, setPayerId] = useState(getDefaultPayerId() ?? tile.payer_id);
  const [saved, setSaved] = useState(false);

  const previous = lastFuelLog(vehicleId);

  // Auto-suggest odometer from the last fill for whichever vehicle is selected.
  useEffect(() => {
    setOdometer(previous ? String(previous.odometer) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId]);

  const kmDriven = previous && odometer ? Number(odometer) - previous.odometer : null;
  const kml = kmDriven && kmDriven > 0 && liters ? (kmDriven / Number(liters)).toFixed(1) : null;

  const inputClass =
    "w-full bg-white border border-(--color-line) rounded-lg px-3 py-2.5 text-sm text-(--color-ink) font-mono focus:outline-none focus:border-(--color-ink-soft)";
  const labelClass = "text-[10px] uppercase tracking-wider text-(--color-ink-faint) font-mono mb-1 block";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !liters || !odometer) return;
    addFuelEntry({
      vehicleId,
      fuelType: tile.fuel_type,
      amount: Number(amount),
      liters: Number(liters),
      odometer: Number(odometer),
      payerId,
      date: new Date().toISOString().slice(0, 10),
      notes: `${tile.label}${previous ? "" : " (first fill logged for this vehicle)"}`,
    });
    setSaved(true);
    setTimeout(onClose, 700);
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/30" onClick={onClose}>
      <div
        className="w-full max-w-md bg-(--color-paper) rounded-t-2xl px-5 pt-4 pb-6 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display text-lg text-(--color-ink)">
            Fuel · {tile.fuel_type === "super" ? "Super" : "Regular"}
          </h2>
          <button onClick={onClose} className="text-(--color-ink-faint) text-lg leading-none">
            ✕
          </button>
        </div>
        <p className="text-xs text-(--color-ink-faint) mb-4">From Home · pick the vehicle if it's not Car</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Vehicle</label>
            <div className="flex gap-2">
              {vehicles.map((v) => (
                <button
                  type="button"
                  key={v.id}
                  onClick={() => setVehicleId(v.id)}
                  className="flex-1 py-2 rounded-lg border text-sm transition-colors"
                  style={{
                    borderColor: vehicleId === v.id ? "var(--color-ink)" : "var(--color-line)",
                    background: vehicleId === v.id ? "var(--color-ink)" : "white",
                    color: vehicleId === v.id ? "var(--color-paper)" : "var(--color-ink)",
                  }}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Paid by</label>
            <div className="flex gap-2">
              {users.map((u) => (
                <button
                  type="button"
                  key={u.id}
                  onClick={() => setPayerId(u.id)}
                  className="flex-1 py-2 rounded-lg border text-sm transition-colors"
                  style={{
                    borderColor: payerId === u.id ? "var(--color-ink)" : "var(--color-line)",
                    background: payerId === u.id ? "var(--color-ink)" : "white",
                    color: payerId === u.id ? "var(--color-paper)" : "var(--color-ink)",
                  }}
                >
                  {u.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-ink-faint) text-sm">Rs.</span>
              <input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={`${inputClass} pl-9 text-base`}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Liters</label>
              <input
                type="number"
                step="0.1"
                inputMode="decimal"
                value={liters}
                onChange={(e) => setLiters(e.target.value)}
                placeholder="0.0"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Odometer</label>
              <input
                type="number"
                inputMode="numeric"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                className={inputClass}
                required
              />
            </div>
          </div>

          {previous ? (
            kml ? (
              <div className="bg-(--color-gold-soft) rounded-lg px-3 py-2 text-xs text-(--color-gold)">
                {kmDriven} km since last fill · <span className="font-mono font-medium">{kml} km/l</span>
              </div>
            ) : (
              <p className="text-[11px] text-(--color-ink-faint)">
                Enter liters and an odometer reading higher than {previous.odometer.toLocaleString()} to see km/l.
              </p>
            )
          ) : (
            <p className="text-[11px] text-(--color-ink-faint)">
              First fill logged for this vehicle — km/l will show from the next one.
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-lg font-medium text-sm"
            style={{ background: saved ? "var(--color-income)" : "var(--color-ink)", color: "var(--color-paper)" }}
          >
            {saved ? "Saved ✓" : "Save entry"}
          </button>
        </form>
      </div>
    </div>
  );
}
