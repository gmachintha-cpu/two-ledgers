import { useState } from "react";
import { useData } from "../context/DataContext";
import { getDefaultPayerId } from "../lib/devicePrefs";

export default function AddTransaction({ existing, onSaved, onCancel }) {
  const {
    users,
    categories,
    vehicles,
    accounts,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    categoryById,
    fuelLogByTransaction,
    updateFuelLog,
  } = useData();

  const isEditing = Boolean(existing);
  const existingCategory = existing ? categoryById[existing.category_id] : null;
  const existingTopCategoryId = existing ? existingCategory?.parent_id ?? existing.category_id : null;
  const existingSubCategoryId = existing && existingCategory?.parent_id ? existing.category_id : "";
  const linkedFuelLog = existing ? fuelLogByTransaction(existing.id) : null;

  const [kind, setKind] = useState(existing ? existingCategory?.type ?? "expense" : "expense");
  const topCategories = categories.filter((c) => c.type === kind && !c.parent_id);
  const subCategoriesOf = (parentId) => categories.filter((c) => c.parent_id === parentId);

  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [categoryId, setCategoryId] = useState(existingTopCategoryId ?? topCategories[0]?.id ?? "");
  const [subCategoryId, setSubCategoryId] = useState(existingSubCategoryId);
  const [vehicleId, setVehicleId] = useState(existing?.vehicle_id ?? "");
  const [payerId, setPayerId] = useState(existing?.payer_id ?? getDefaultPayerId() ?? users[0].id);
  const [shared, setShared] = useState(existing ? existing.shared : true);
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [date, setDate] = useState(existing?.date ?? new Date().toISOString().slice(0, 10));
  const [liters, setLiters] = useState(linkedFuelLog?.liters ?? "");
  const [odometer, setOdometer] = useState(linkedFuelLog?.odometer ?? "");
  const [saved, setSaved] = useState(false);

  const switchKind = (next) => {
    setKind(next);
    const first = categories.find((c) => c.type === next && !c.parent_id);
    setCategoryId(first?.id ?? "");
    setSubCategoryId("");
    setVehicleId("");
  };

  const subs = subCategoriesOf(categoryId);
  const isVehicleCategory = kind === "expense" && categoryById[categoryId]?.name === "Vehicles";
  const effectiveCategoryId = subCategoryId || categoryId;
  const showFuelFields = Boolean(linkedFuelLog);

  const reset = () => {
    setAmount("");
    setNotes("");
    setVehicleId("");
    setSubCategoryId("");
    setSaved(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !categoryId) return;

    const payload = {
      date,
      amount: Number(amount),
      payer_id: payerId,
      category_id: effectiveCategoryId,
      account_id: existing?.account_id ?? accounts.find((a) => a.type === "bank")?.id ?? accounts[0].id,
      vehicle_id: isVehicleCategory && vehicleId ? vehicleId : null,
      shared: kind === "expense" ? shared : true,
      notes,
      receipt_url: existing?.receipt_url ?? null,
    };

    if (isEditing) {
      updateTransaction(existing.id, payload);
      if (linkedFuelLog) {
        updateFuelLog(linkedFuelLog.id, {
          liters: Number(liters) || linkedFuelLog.liters,
          odometer: Number(odometer) || linkedFuelLog.odometer,
          amount: Number(amount),
        });
      }
    } else {
      addTransaction(payload);
    }

    setSaved(true);
    setTimeout(() => {
      reset();
      onSaved?.();
    }, 700);
  };

  const handleDelete = () => {
    if (!existing) return;
    deleteTransaction(existing.id);
    onSaved?.();
  };

  const inputClass =
    "w-full bg-(--color-card) border border-(--color-line) rounded-lg px-3.5 py-2.5 text-sm text-(--color-ink) focus:outline-none focus:border-(--color-ink-soft) focus:ring-1 focus:ring-(--color-ink-soft)";
  const labelClass = "text-xs uppercase tracking-wider text-(--color-ink-faint) font-mono mb-1.5 block";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => switchKind("expense")}
          className="flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors"
          style={{
            borderColor: kind === "expense" ? "var(--color-expense)" : "var(--color-line)",
            background: kind === "expense" ? "var(--color-expense-soft)" : "var(--color-card)",
            color: kind === "expense" ? "var(--color-expense)" : "var(--color-ink-soft)",
          }}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => switchKind("income")}
          className="flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors"
          style={{
            borderColor: kind === "income" ? "var(--color-income)" : "var(--color-line)",
            background: kind === "income" ? "var(--color-income-soft)" : "var(--color-card)",
            color: kind === "income" ? "var(--color-income)" : "var(--color-ink-soft)",
          }}
        >
          Income
        </button>
      </div>

      <div>
        <label className={labelClass}>Amount</label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--color-ink-faint) font-mono text-sm">
            Rs.
          </span>
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className={`${inputClass} pl-11 font-mono text-lg`}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Category</label>
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setSubCategoryId("");
              setVehicleId("");
            }}
            className={inputClass}
          >
            {topCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </div>
      </div>

      {subs.length > 0 && (
        <div>
          <label className={labelClass}>Sub-category</label>
          <select value={subCategoryId} onChange={(e) => setSubCategoryId(e.target.value)} className={inputClass}>
            <option value="">General {categories.find((c) => c.id === categoryId)?.name}</option>
            {subs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {isVehicleCategory && (
        <div>
          <label className={labelClass}>Vehicle</label>
          <div className="flex gap-2">
            {vehicles.map((v) => (
              <button
                type="button"
                key={v.id}
                onClick={() => setVehicleId(v.id)}
                className="flex-1 py-2.5 rounded-lg border text-sm transition-colors"
                style={{
                  borderColor: vehicleId === v.id ? "var(--color-ink)" : "var(--color-line)",
                  background: vehicleId === v.id ? "var(--color-ink)" : "var(--color-card)",
                  color: vehicleId === v.id ? "var(--color-paper)" : "var(--color-ink)",
                }}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {showFuelFields && (
        <div className="border border-(--color-line) rounded-lg p-3 bg-(--color-gold-soft)">
          <p className="text-[10px] uppercase tracking-wider font-mono mb-2" style={{ color: "var(--color-gold)" }}>
            Linked fuel log
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Liters</label>
              <input
                type="number"
                step="0.1"
                value={liters}
                onChange={(e) => setLiters(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Odometer</label>
              <input
                type="number"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>{kind === "income" ? "Received by" : "Paid by"}</label>
          <div className="flex gap-2">
            {users.map((u) => (
              <button
                type="button"
                key={u.id}
                onClick={() => setPayerId(u.id)}
                className="flex-1 py-2.5 rounded-lg border text-sm transition-colors"
                style={{
                  borderColor: payerId === u.id ? "var(--color-ink)" : "var(--color-line)",
                  background: payerId === u.id ? "var(--color-ink)" : "var(--color-card)",
                  color: payerId === u.id ? "var(--color-paper)" : "var(--color-ink)",
                }}
              >
                {u.name}
              </button>
            ))}
          </div>
        </div>
        {kind === "expense" && (
          <div>
            <label className={labelClass}>Household or personal</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShared(true)}
                className="flex-1 py-2.5 rounded-lg border text-sm transition-colors"
                style={{
                  borderColor: shared ? "var(--color-ink)" : "var(--color-line)",
                  background: shared ? "var(--color-ink)" : "var(--color-card)",
                  color: shared ? "var(--color-paper)" : "var(--color-ink)",
                }}
              >
                Shared
              </button>
              <button
                type="button"
                onClick={() => setShared(false)}
                className="flex-1 py-2.5 rounded-lg border text-sm transition-colors"
                style={{
                  borderColor: !shared ? "var(--color-ink)" : "var(--color-line)",
                  background: !shared ? "var(--color-ink)" : "var(--color-card)",
                  color: !shared ? "var(--color-paper)" : "var(--color-ink)",
                }}
              >
                Personal
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        <label className={labelClass}>Note</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. weekly groceries"
          className={inputClass}
        />
      </div>

      {kind === "expense" && !isEditing && (
        <button
          type="button"
          disabled
          className="w-full py-2.5 rounded-lg border border-dashed border-(--color-line) text-sm text-(--color-ink-faint) flex items-center justify-center gap-2"
        >
          📷 Attach receipt — coming later
        </button>
      )}

      <div className="flex gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-lg font-medium text-sm border border-(--color-line) text-(--color-ink-soft)"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="flex-[2] py-3 rounded-lg font-medium text-sm transition-colors"
          style={{
            background: saved ? "var(--color-income)" : "var(--color-ink)",
            color: "var(--color-paper)",
          }}
        >
          {saved ? "Saved ✓" : isEditing ? "Save changes" : "Save entry"}
        </button>
      </div>

      {isEditing && (
        <button
          type="button"
          onClick={handleDelete}
          className="w-full py-2 text-xs text-(--color-expense)"
        >
          Delete this entry
        </button>
      )}
    </form>
  );
}
