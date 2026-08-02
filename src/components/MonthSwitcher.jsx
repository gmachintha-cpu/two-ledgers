import { useRef } from "react";
import { monthKey } from "../lib/payPeriod";

function shiftMonth(date, delta) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export default function MonthSwitcher({ viewDate, onChange, label }) {
  const touchStartX = useRef(null);
  const isCurrentMonth = monthKey(viewDate) === monthKey(new Date());

  const goPrev = () => onChange(shiftMonth(viewDate, -1));
  const goNext = () => {
    if (isCurrentMonth) return;
    onChange(shiftMonth(viewDate, 1));
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const threshold = 50;
    if (deltaX > threshold) goPrev();
    else if (deltaX < -threshold) goNext();
    touchStartX.current = null;
  };

  return (
    <div
      className="flex items-center justify-between select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button
        onClick={goPrev}
        aria-label="Previous month"
        className="w-8 h-8 flex items-center justify-center rounded-full text-(--color-ink-soft) active:bg-(--color-line)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="flex items-center gap-2">
        <span className="font-display text-base text-(--color-ink)">{label}</span>
        {!isCurrentMonth && (
          <button
            onClick={() => onChange(new Date())}
            className="text-[10px] uppercase tracking-wider font-mono text-(--color-gold) bg-(--color-gold-soft) px-2 py-0.5 rounded-full"
          >
            back to today
          </button>
        )}
      </div>

      <button
        onClick={goNext}
        disabled={isCurrentMonth}
        aria-label="Next month"
        className="w-8 h-8 flex items-center justify-center rounded-full active:bg-(--color-line)"
        style={{ color: isCurrentMonth ? "var(--color-line-strong)" : "var(--color-ink-soft)" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
