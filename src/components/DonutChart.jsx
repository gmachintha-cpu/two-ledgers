export default function DonutChart({ segments, centerLabel, centerValue, size = 200 }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);

  let cursor = 0;
  const stops = segments.map((seg) => {
    const pct = total ? (seg.value / total) * 100 : 0;
    const from = cursor;
    const to = cursor + pct;
    cursor = to;
    return `${seg.color} ${from}% ${to}%`;
  });

  const gradient = total ? `conic-gradient(${stops.join(", ")})` : "var(--color-line)";
  const hole = Math.round(size * 0.59);

  return (
    <div
      style={{ width: size, height: size, borderRadius: "50%", background: gradient }}
      className="flex items-center justify-center shrink-0"
      role="img"
      aria-label={`${centerLabel}: ${centerValue}`}
    >
      <div
        style={{ width: hole, height: hole }}
        className="rounded-full bg-(--color-paper) flex flex-col items-center justify-center"
      >
        <span className="text-[10px] tracking-wide font-mono text-(--color-ink-faint)">{centerLabel}</span>
        <span className="font-display text-xl text-(--color-ink) mt-0.5">{centerValue}</span>
      </div>
    </div>
  );
}
