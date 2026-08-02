import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  users as seedUsers,
  accounts as seedAccounts,
  vehicles as seedVehicles,
  categories as seedCategories,
  transactions as seedTransactions,
  budgets as seedBudgets,
  openingBalances as seedOpeningBalances,
  fuelLogs as seedFuelLogs,
  subscriptions as seedSubscriptions,
  quickTiles as seedQuickTiles,
} from "../lib/mockData";
import { isSupabaseConfigured } from "../lib/supabaseClient";
import { fetchAllTables, insertRow, updateRow, deleteRow, upsertOpeningBalance } from "../lib/db";
import { monthKey, hasBeenPaidThisMonth, previousMonthKey } from "../lib/payPeriod";

const DataContext = createContext(null);

// Only used in demo mode — Supabase mode gets real uuids back from insertRow.
let nextTxId = 1000;
const genTxId = () => `t${nextTxId++}`;
let nextLocalId = 1000;
const genLocalId = () => `local${nextLocalId++}`;

export function DataProvider({ children }) {
  const usingSupabase = isSupabaseConfigured;

  const [users, setUsers] = useState(usingSupabase ? [] : seedUsers);
  const [accounts, setAccounts] = useState(usingSupabase ? [] : seedAccounts);
  const [vehicles, setVehicles] = useState(usingSupabase ? [] : seedVehicles);
  const [categories, setCategories] = useState(usingSupabase ? [] : seedCategories);
  const [transactions, setTransactions] = useState(usingSupabase ? [] : seedTransactions);
  const [budgets, setBudgets] = useState(usingSupabase ? [] : seedBudgets);
  const [openingBalances, setOpeningBalances] = useState(usingSupabase ? [] : seedOpeningBalances);
  const [fuelLogs, setFuelLogs] = useState(usingSupabase ? [] : seedFuelLogs);
  const [subscriptions, setSubscriptions] = useState(usingSupabase ? [] : seedSubscriptions);
  const [quickTiles, setQuickTiles] = useState(usingSupabase ? [] : seedQuickTiles);
  const [isLoading, setIsLoading] = useState(usingSupabase);
  const [loadError, setLoadError] = useState(null);

  // Real data mode: pull every table once on load.
  useEffect(() => {
    if (!usingSupabase) return;
    let cancelled = false;
    fetchAllTables()
      .then((t) => {
        if (cancelled) return;
        // Supabase doesn't guarantee row order without an explicit ORDER BY,
        // and several places (default payer fallback, subscription auto-post)
        // rely on users[0] being a stable, predictable person. Sort by pay_day
        // so that's always true instead of flipping between page loads.
        setUsers((t.users ?? []).slice().sort((a, b) => a.pay_day - b.pay_day));
        setAccounts(t.accounts ?? []);
        setVehicles(t.vehicles ?? []);
        setCategories(t.categories ?? []);
        setTransactions(t.transactions ?? []);
        setBudgets(t.budgets ?? []);
        setOpeningBalances(t.opening_balances ?? []);
        setFuelLogs(t.fuel_logs ?? []);
        setSubscriptions(t.subscriptions ?? []);
        setQuickTiles(t.quick_tiles ?? []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load from Supabase:", err);
        if (!cancelled) {
          setLoadError(err.message);
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [usingSupabase]);

  const addTransaction = (tx) => {
    if (!usingSupabase) {
      setTransactions((prev) => [{ id: genTxId(), ...tx }, ...prev]);
      return;
    }
    const tempId = genLocalId();
    setTransactions((prev) => [{ id: tempId, ...tx }, ...prev]);
    insertRow("transactions", tx).then((row) => {
      setTransactions((prev) => (row ? prev.map((t) => (t.id === tempId ? row : t)) : prev.filter((t) => t.id !== tempId)));
    });
  };

  const updateTransaction = (id, patch) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    if (usingSupabase) updateRow("transactions", id, patch);
  };

  const deleteTransaction = (id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setFuelLogs((prev) => prev.filter((f) => f.transaction_id !== id));
    if (usingSupabase) deleteRow("transactions", id); // fuel_logs cascades server-side
  };

  const updateFuelLog = (id, patch) => {
    setFuelLogs((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
    if (usingSupabase) updateRow("fuel_logs", id, patch);
  };

  // Fuel log linked to a given transaction, if that transaction is a fill-up.
  const fuelLogByTransaction = (transactionId) => fuelLogs.find((f) => f.transaction_id === transactionId) ?? null;

  // Most recent fill-up for a vehicle (by odometer, falls back to date).
  const lastFuelLog = (vehicleId) => {
    const logs = fuelLogs.filter((f) => f.vehicle_id === vehicleId);
    if (logs.length === 0) return null;
    return [...logs].sort((a, b) => b.odometer - a.odometer)[0];
  };

  const categoryIdByName = useMemo(() => Object.fromEntries(categories.map((c) => [c.name, c.id])), [categories]);

  // Logs both the transaction (so it shows up in spend/budgets/Ledger like
  // any other expense) and the fuel_logs row (so Vehicles can chart km/l).
  const addFuelEntry = ({ vehicleId, fuelType, amount, liters, odometer, payerId, date, notes }) => {
    const fuelCategoryId = categoryIdByName["Fuel"];
    const txPayload = {
      date,
      amount,
      payer_id: payerId,
      category_id: fuelCategoryId,
      account_id: accounts.find((a) => a.type === "bank")?.id ?? accounts[0]?.id,
      vehicle_id: vehicleId,
      shared: false,
      notes: notes || `Fuel — ${fuelType === "super" ? "Super" : "Regular"}`,
      receipt_url: null,
    };

    if (!usingSupabase) {
      const txId = genTxId();
      setTransactions((prev) => [{ id: txId, ...txPayload }, ...prev]);
      setFuelLogs((prev) => [
        { id: genLocalId(), transaction_id: txId, vehicle_id: vehicleId, date, fuel_type: fuelType, amount, liters, odometer },
        ...prev,
      ]);
      return;
    }

    const tempTxId = genLocalId();
    const tempFuelId = genLocalId();
    setTransactions((prev) => [{ id: tempTxId, ...txPayload }, ...prev]);
    setFuelLogs((prev) => [
      { id: tempFuelId, transaction_id: tempTxId, vehicle_id: vehicleId, date, fuel_type: fuelType, amount, liters, odometer },
      ...prev,
    ]);

    insertRow("transactions", txPayload).then((txRow) => {
      if (!txRow) {
        setTransactions((prev) => prev.filter((t) => t.id !== tempTxId));
        setFuelLogs((prev) => prev.filter((f) => f.id !== tempFuelId));
        return;
      }
      setTransactions((prev) => prev.map((t) => (t.id === tempTxId ? txRow : t)));
      insertRow("fuel_logs", {
        transaction_id: txRow.id,
        vehicle_id: vehicleId,
        date,
        fuel_type: fuelType,
        amount,
        liters,
        odometer,
      }).then((fuelRow) => {
        setFuelLogs((prev) => (fuelRow ? prev.map((f) => (f.id === tempFuelId ? fuelRow : f)) : prev.filter((f) => f.id !== tempFuelId)));
      });
    });
  };

  const updateSubscription = (id, patch) => {
    setSubscriptions((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    if (usingSupabase) updateRow("subscriptions", id, patch);
  };

  const updateBudget = (id, patch) => {
    setBudgets((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    if (usingSupabase) updateRow("budgets", id, patch);
  };

  const updateQuickTile = (id, patch) => {
    setQuickTiles((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    if (usingSupabase) updateRow("quick_tiles", id, patch);
  };

  const updateUser = (id, patch) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
    if (usingSupabase) updateRow("users", id, patch);
  };

  const addAccount = (account) => {
    if (!usingSupabase) {
      setAccounts((prev) => [...prev, { id: genLocalId(), ...account }]);
      return;
    }
    const tempId = genLocalId();
    setAccounts((prev) => [...prev, { id: tempId, ...account }]);
    insertRow("accounts", account).then((row) => {
      setAccounts((prev) => (row ? prev.map((a) => (a.id === tempId ? row : a)) : prev.filter((a) => a.id !== tempId)));
    });
  };

  const updateAccount = (id, patch) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    if (usingSupabase) updateRow("accounts", id, patch);
  };

  // Auto-post any subscription whose billing day has passed this month and
  // hasn't been posted yet. Runs once the data is loaded — catches up even if
  // you weren't in the app on the exact billing day, but never double-posts
  // within the same month thanks to last_posted_month.
  useEffect(() => {
    if (isLoading) return;
    if (subscriptions.length === 0 || users.length === 0) return;

    const today = new Date();
    const key = monthKey(today);
    const bankAccountId = accounts.find((a) => a.type === "bank")?.id ?? accounts[0]?.id;
    const defaultPayerId = users[0]?.id;
    if (!bankAccountId || !defaultPayerId) return;

    subscriptions.forEach((s) => {
      if (s.last_posted_month === key) return;
      if (today.getDate() < s.billing_day) return;

      const txPayload = {
        date: today.toISOString().slice(0, 10),
        amount: s.amount,
        payer_id: defaultPayerId,
        category_id: s.category_id,
        account_id: bankAccountId,
        vehicle_id: null,
        shared: true,
        notes: `${s.name} (auto-posted subscription)`,
        receipt_url: null,
      };

      if (!usingSupabase) {
        setTransactions((prev) => [{ id: genTxId(), ...txPayload }, ...prev]);
        setSubscriptions((prev) => prev.map((sub) => (sub.id === s.id ? { ...sub, last_posted_month: key } : sub)));
      } else {
        const tempId = genLocalId();
        setTransactions((prev) => [{ id: tempId, ...txPayload }, ...prev]);
        setSubscriptions((prev) => prev.map((sub) => (sub.id === s.id ? { ...sub, last_posted_month: key } : sub)));
        insertRow("transactions", txPayload).then((row) => {
          setTransactions((prev) => (row ? prev.map((t) => (t.id === tempId ? row : t)) : prev.filter((t) => t.id !== tempId)));
        });
        updateRow("subscriptions", s.id, { last_posted_month: key });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const categoryById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);
  const userById = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users]);
  const vehicleById = useMemo(() => Object.fromEntries(vehicles.map((v) => [v.id, v])), [vehicles]);
  const accountById = useMemo(() => Object.fromEntries(accounts.map((a) => [a.id, a])), [accounts]);

  // Spend logged by a given user within a given month (money actually leaving
  // their pocket, regardless of whether the purchase was shared or personal).
  const spendByUserInMonth = (userId, key) => {
    return transactions
      .filter((t) => {
        if (t.payer_id !== userId) return false;
        if (categoryById[t.category_id]?.type !== "expense") return false;
        return t.date.slice(0, 7) === key;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

  // Explicit opening balance for a user+month, if one has been confirmed/edited.
  const explicitOpeningBalance = (userId, key) => {
    const entry = openingBalances.find((o) => o.user_id === userId && o.month === key);
    return entry ? entry.amount : null;
  };

  // Suggested opening balance: last month's confirmed opening balance, plus
  // salary received last month, minus spend logged last month. Falls back to 0
  // if there's nothing to carry from (e.g. very first month using the app).
  const suggestedOpeningBalance = (userId, key) => {
    const prevKey = previousMonthKey(new Date(`${key}-01`));
    const prevOpening = explicitOpeningBalance(userId, prevKey) ?? 0;
    const user = userById[userId];
    const prevSalary = user?.salary ?? 0;
    const prevSpend = spendByUserInMonth(userId, prevKey);
    return Math.max(prevOpening + prevSalary - prevSpend, 0);
  };

  const getOpeningBalance = (userId, key = monthKey()) => {
    const explicit = explicitOpeningBalance(userId, key);
    return explicit !== null ? explicit : suggestedOpeningBalance(userId, key);
  };

  const isOpeningBalanceConfirmed = (userId, key = monthKey()) => explicitOpeningBalance(userId, key) !== null;

  const setOpeningBalanceValue = (userId, key, amount) => {
    setOpeningBalances((prev) => {
      const existing = prev.find((o) => o.user_id === userId && o.month === key);
      if (existing) {
        return prev.map((o) => (o === existing ? { ...o, amount } : o));
      }
      return [...prev, { id: genLocalId(), user_id: userId, month: key, amount }];
    });
    if (usingSupabase) upsertOpeningBalance({ user_id: userId, month: key, amount });
  };

  // Remaining = opening balance + salary received so far this month - spend logged this month.
  const remainingForUser = (userId, key = monthKey()) => {
    const user = userById[userId];
    if (!user) return 0;
    const opening = getOpeningBalance(userId, key);
    const paid = hasBeenPaidThisMonth(user.pay_day) ? user.salary : 0;
    const spend = spendByUserInMonth(userId, key);
    return opening + paid - spend;
  };

  const value = {
    users,
    accounts,
    vehicles,
    categories,
    transactions,
    budgets,
    openingBalances,
    fuelLogs,
    subscriptions,
    quickTiles,
    isLoading,
    loadError,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addFuelEntry,
    updateFuelLog,
    fuelLogByTransaction,
    lastFuelLog,
    updateSubscription,
    updateBudget,
    updateQuickTile,
    updateUser,
    addAccount,
    updateAccount,
    getOpeningBalance,
    isOpeningBalanceConfirmed,
    setOpeningBalanceValue,
    remainingForUser,
    spendByUserInMonth,
    categoryById,
    userById,
    vehicleById,
    accountById,
    isDemoMode: !usingSupabase,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}
