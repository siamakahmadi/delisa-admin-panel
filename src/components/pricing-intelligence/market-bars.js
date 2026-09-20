export function MarketBars({ current, recommended, lowest, median, highest }) {
  const values = [current, recommended, lowest, median, highest].filter((v) => Number(v) > 0);
  const max = Math.max(...values, 1);
  const rows = [
    { label: "کمترین بازار", value: lowest, color: "bg-[var(--text-faint)]" },
    { label: "دلیسا (فعلی)", value: current, color: "bg-[var(--accent-blue)]" },
    { label: "میانه بازار", value: median, color: "bg-[var(--accent-amber)]" },
    { label: "بیشترین بازار", value: highest, color: "bg-[var(--text-muted)]" },
    { label: "پیشنهادی", value: recommended, color: "bg-[var(--brand-600)]" },
  ];

  return (
    <div className="space-y-2.5">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>{row.label}</span>
            <span className="tabular-nums">
              {row.value != null ? Number(row.value).toLocaleString("fa-IR") : "—"}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
            <div
              className={`h-full rounded-full ${row.color}`}
              style={{ width: `${row.value ? Math.max(6, (row.value / max) * 100) : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
