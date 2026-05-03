// Formatting helpers — keep numbers consistent across the app.

export function fmtUsdM(value: number, opts: { signed?: boolean } = {}): string {
  const sign = opts.signed && value > 0 ? "+" : value < 0 ? "−" : "";
  const v = Math.abs(value);
  if (v >= 1000) return `${sign}$${(v / 1000).toFixed(2)}bn`;
  return `${sign}$${v.toFixed(0)}M`;
}

export function fmtScore(value: number): string {
  if (value > 0) return `+${value.toFixed(0)}`;
  return value.toFixed(0);
}

export function fmtDate(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00Z" : ""));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function fmtRelative(iso: string, now = new Date()): string {
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

export function fmtMoney(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
