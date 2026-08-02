import { useState } from "react";
import { DataProvider, useData } from "./context/DataContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Ledger from "./pages/Ledger";
import AddTransaction from "./pages/AddTransaction";
import Vehicles from "./pages/Vehicles";
import NetWorth from "./pages/NetWorth";
import Budgets from "./pages/Budgets";

function Router({ view, setView, editingTx, setEditingTx, viewDate, setViewDate }) {
  const backTo = editingTx ? "ledger" : "home";
  const closeEditor = () => {
    setEditingTx(null);
    setView(backTo);
  };

  switch (view) {
    case "add":
      return (
        <div>
          <h2 className="font-display text-lg text-(--color-ink) mb-4">
            {editingTx ? "Edit entry" : "Add an entry"}
          </h2>
          <AddTransaction existing={editingTx} onSaved={closeEditor} onCancel={closeEditor} />
        </div>
      );
    case "ledger":
      return (
        <Ledger
          viewDate={viewDate}
          onChangeMonth={setViewDate}
          onEdit={(t) => {
            setEditingTx(t);
            setView("add");
          }}
        />
      );
    case "vehicles":
      return <Vehicles viewDate={viewDate} onChangeMonth={setViewDate} />;
    case "networth":
      return <NetWorth viewDate={viewDate} onChangeMonth={setViewDate} />;
    case "budgets":
      return <Budgets />;
    default:
      return <Home onAddExpense={() => setView("add")} viewDate={viewDate} onChangeMonth={setViewDate} />;
  }
}

function AppShell() {
  const [view, setView] = useState("home");
  const [editingTx, setEditingTx] = useState(null);
  const [viewDate, setViewDate] = useState(new Date());
  const { isLoading, loadError, users } = useData();

  const navigate = (next) => {
    if (next !== "add") setEditingTx(null);
    setView(next);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--color-paper)">
        <p className="font-display text-(--color-ink-faint)">Loading your ledger…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--color-paper) px-6 text-center">
        <div>
          <p className="font-display text-(--color-expense) mb-2">Couldn't load from Supabase</p>
          <p className="text-sm text-(--color-ink-faint)">{loadError}</p>
          <p className="text-xs text-(--color-ink-faint) mt-3">Check .env.local and that schema.sql + seed.sql have been run.</p>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--color-paper) px-6 text-center">
        <div>
          <p className="font-display text-(--color-expense) mb-2">Connected, but no data found</p>
          <p className="text-sm text-(--color-ink-faint)">
            The Supabase connection worked, but the "users" table is empty. Make sure you ran{" "}
            <code className="font-mono">supabase/seed.sql</code> in the SQL editor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Layout view={view} setView={navigate}>
      <Router
        view={view}
        setView={setView}
        editingTx={editingTx}
        setEditingTx={setEditingTx}
        viewDate={viewDate}
        setViewDate={setViewDate}
      />
    </Layout>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AppShell />
    </DataProvider>
  );
}
