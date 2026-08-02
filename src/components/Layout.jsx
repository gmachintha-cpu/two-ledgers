import PayPeriodLedger from "./PayPeriodLedger";
import { useData } from "../context/DataContext";

const TABS = [
  { id: "home", label: "Home" },
  { id: "ledger", label: "Ledger" },
  { id: "vehicles", label: "Vehicles" },
  { id: "networth", label: "Net worth" },
  { id: "budgets", label: "Budgets" },
];

function Icon({ id }) {
  const common = "w-5 h-5";
  switch (id) {
    case "home":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none" />
        </svg>
      );
    case "ledger":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="4" y="3.5" width="16" height="17" rx="1.5" />
          <path d="M7.5 8h9M7.5 12h9M7.5 16h5.5" strokeLinecap="round" />
        </svg>
      );
    case "vehicles":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 13l1.5-4.5A2 2 0 0 1 6.4 7h11.2a2 2 0 0 1 1.9 1.5L21 13" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="2.5" y="13" width="19" height="5" rx="1.5" />
          <circle cx="7" cy="18.5" r="1.5" />
          <circle cx="17" cy="18.5" r="1.5" />
        </svg>
      );
    case "networth":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 3v16M8 21h8" strokeLinecap="round" />
          <path d="M4 8h8M16 8h4" strokeLinecap="round" />
          <path d="M4 8 1.5 13a3 3 0 0 0 5 0Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 8l-2.5 5a3 3 0 0 0 5 0Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "budgets":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3.5" y="4" width="17" height="16" rx="2" />
          <path d="M8 2.5v3M16 2.5v3M3.5 9.5h17" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Layout({ view, setView, children }) {
  const { isDemoMode } = useData();

  return (
    <div className="min-h-screen flex flex-col bg-(--color-paper)">
      <header className="sticky top-0 z-10 bg-(--color-paper)/95 backdrop-blur border-b border-(--color-line)">
        <div className="max-w-md mx-auto px-4 pt-5 pb-3">
          <div className="flex items-baseline justify-between">
            <h1 className="font-display text-xl text-(--color-ink)">Two Ledgers</h1>
            <div className="flex items-center gap-2.5">
              {isDemoMode && (
                <span className="text-[10px] uppercase tracking-wider font-mono text-(--color-gold) bg-(--color-gold-soft) px-2 py-0.5 rounded-full">
                  demo data
                </span>
              )}
              <button onClick={() => setView("budgets")} aria-label="Settings" className="text-(--color-ink-soft)">
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82A1.65 1.65 0 0 0 3 13.09H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
          <div className="mt-4">
            <PayPeriodLedger />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-md w-full mx-auto px-4 pb-24 pt-4">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 bg-(--color-card) border-t border-(--color-line)">
        <div className="max-w-md mx-auto grid grid-cols-5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className="flex flex-col items-center gap-1 py-2.5 text-[11px]"
              style={{ color: view === t.id ? "var(--color-ink)" : "var(--color-ink-faint)" }}
            >
              <Icon id={t.id} />
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
