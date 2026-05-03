"use client";

import type { AccumulationReading, ThemeReading } from "@/lib/types";

interface Props {
  accum: AccumulationReading;
  themes: ThemeReading[];
}

export default function IndicatorsGrid({ accum, themes }: Props) {
  const avgStreak = themes.reduce((s, t) => s + t.conviction.streakDays, 0) / Math.max(1, themes.length);
  const avgConviction = themes.reduce((s, t) => s + t.conviction.score, 0) / Math.max(1, themes.length);

  const now = accum.smoothedScore;
  const prev = accum.history[Math.max(0, accum.history.length - 8)]?.smoothedScore ?? now;
  const accel = now - prev;

  const scores = accum.history.map((h) => h.smoothedScore);
  const lo = Math.min(...scores);
  const hi = Math.max(...scores);

  const cells = [
    {
      label: "Needle now",
      value: accum.smoothedScore.toFixed(0),
      sub: "7-day smoothed",
      tone: accum.smoothedScore >= 0 ? "positive" : "negative",
    },
    {
      label: "30-day range",
      value: `${lo.toFixed(0)} ↔ ${hi.toFixed(0)}`,
      sub: `band of ${(hi - lo).toFixed(0)} pts`,
      tone: "neutral" as const,
    },
    {
      label: "Acceleration",
      value: (accel >= 0 ? "+" : "") + accel.toFixed(0),
      sub: "vs 7d ago",
      tone: accel >= 0 ? "positive" : "negative",
    },
    {
      label: "Avg theme streak",
      value: avgStreak.toFixed(1) + "d",
      sub: "across 3 themes",
      tone: "neutral" as const,
    },
    {
      label: "Avg conviction",
      value: avgConviction.toFixed(0) + "/100",
      sub: "weighted",
      tone: "neutral" as const,
    },
    {
      label: "Inflow 7d",
      value: fmtCompact(accum.inflowsUsdM7d),
      sub: "USD, gross",
      tone: accum.inflowsUsdM7d >= 0 ? "positive" : "negative",
    },
    {
      label: "Outflow 7d",
      value: fmtCompact(accum.outflowsUsdM7d),
      sub: "USD, gross",
      tone: accum.outflowsUsdM7d <= 0 ? "negative" : "positive",
    },
    {
      label: "Phase",
      value: accum.phase.replace(/_/g, " "),
      sub: "current regime",
      tone:
        accum.phase === "strong_accumulation" || accum.phase === "mild_accumulation"
          ? "positive"
          : "negative",
    },
  ];

  return (
    <section className="mt-8 sm:mt-10">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-subtle">Indicators</h2>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cells.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-surface p-3.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-fg-subtle">{c.label}</div>
            <div className={"mt-1 text-lg sm:text-xl font-semibold tabular-nums leading-tight " + (c.tone === "positive" ? "text-positive" : c.tone === "negative" ? "text-negative" : "text-fg")}>
              {c.value}
            </div>
            <div className="text-[10px] text-fg-muted mt-0.5">{c.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function fmtCompact(usdm: number) {
  const sign = usdm > 0 ? "+" : usdm < 0 ? "−" : "";
  const v = Math.abs(usdm);
  if (v >= 1000) return `${sign}${(v / 1000).toFixed(2)}bn`;
  return `${sign}${v.toFixed(0)}M`;
}
