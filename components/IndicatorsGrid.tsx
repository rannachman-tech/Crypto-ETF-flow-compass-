"use client";

import { Info } from "lucide-react";
import type { AccumulationReading, ThemeReading } from "@/lib/types";

interface Props {
  accum: AccumulationReading;
  themes: ThemeReading[];
}

interface Cell {
  label: string;
  value: string;
  sub: string;
  tone: "positive" | "negative" | "neutral";
  /** Plain-English explanation surfaced on hover/tap. */
  tooltip: string;
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

  const cells: Cell[] = [
    {
      label: "Needle now",
      value: accum.smoothedScore.toFixed(0),
      sub: "7-day smoothed",
      tone: accum.smoothedScore >= 0 ? "positive" : "negative",
      tooltip:
        "The compass needle's current position on a -100..+100 scale. +100 = every dollar of organic crypto ETF flow today is an inflow (pure accumulation). -100 = pure distribution. 0 = balanced. Smoothed over 7 days so a single big day doesn't flip the read.",
    },
    {
      label: "30-day range",
      value: `${lo.toFixed(0)} ↔ ${hi.toFixed(0)}`,
      sub: `band of ${(hi - lo).toFixed(0)} pts`,
      tone: "neutral",
      tooltip:
        "The lowest and highest the smoothed needle has been over the last 30 days. A wide band (>60pts) means flows have swung between accumulation and distribution. A narrow band means the regime has been stable.",
    },
    {
      label: "Acceleration",
      value: (accel >= 0 ? "+" : "") + accel.toFixed(0),
      sub: "vs 7d ago",
      tone: accel >= 0 ? "positive" : "negative",
      tooltip:
        "How much the smoothed needle has moved in the last 7 days. Positive = regime is strengthening toward accumulation. Negative = weakening. Big absolute values (>30pts in either direction) mean the regime is changing fast.",
    },
    {
      label: "Avg theme streak",
      value: avgStreak.toFixed(1) + "d",
      sub: "across 3 themes",
      tone: "neutral",
      tooltip:
        "Average consecutive days of same-direction flow across BTC Conviction, ETH Conviction, and Grayscale Drag. Long streaks (>5d) signal real conviction; short streaks (<2d) are likely noise.",
    },
    {
      label: "Avg conviction",
      value: avgConviction.toFixed(0) + "/100",
      sub: "weighted",
      tone: "neutral",
      tooltip:
        "Average conviction score across the 3 themes. Each theme's score combines streak length (40%), magnitude vs 30-day average (40%), and breadth across funds (20%). Calm = <18, weak = <38, building = <60, strong = <80, extreme = 80+.",
    },
    {
      label: "Inflow 7d",
      value: fmtCompact(accum.inflowsUsdM7d),
      sub: "USD, gross",
      tone: accum.inflowsUsdM7d >= 0 ? "positive" : "negative",
      tooltip:
        "Sum of all positive net-flow days across the 10 organic Bitcoin spot ETFs and 8 organic Ethereum spot ETFs over the last 7 calendar days. 'Gross' means we don't net inflows against outflows — this is just the buying pressure.",
    },
    {
      label: "Outflow 7d",
      value: fmtCompact(accum.outflowsUsdM7d),
      sub: "USD, gross",
      tone: accum.outflowsUsdM7d <= 0 ? "negative" : "positive",
      tooltip:
        "Sum of all negative net-flow days across the same organic ETFs over the last 7 days. The bigger this is (in absolute terms), the more selling pressure institutions have applied. Compare to Inflow 7d — that ratio drives the needle.",
    },
    {
      label: "Phase",
      value: accum.phase.replace(/_/g, " "),
      sub: "current regime",
      tone:
        accum.phase === "strong_accumulation" || accum.phase === "mild_accumulation"
          ? "positive"
          : "negative",
      tooltip:
        "The current regime label, derived from the smoothed needle position. Strong accumulation = ≥+30. Mild accumulation = 0 to +30. Mild distribution = -30 to 0. Strong distribution = ≤-30. The trade basket on the right is selected based on this phase.",
    },
  ];

  return (
    <section className="mt-8 sm:mt-10">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-subtle">Indicators</h2>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cells.map((c) => (
          <div
            key={c.label}
            className="group relative rounded-xl border border-border bg-surface p-3.5"
          >
            <div className="flex items-center gap-1.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-fg-subtle">{c.label}</div>
              <button
                type="button"
                className="text-fg-muted/70 hover:text-fg-subtle transition-colors"
                aria-label={`What does ${c.label} mean?`}
                tabIndex={0}
              >
                <Info className="w-3 h-3" aria-hidden />
              </button>
            </div>
            <div
              className={
                "mt-1 text-lg sm:text-xl font-semibold tabular-nums leading-tight " +
                (c.tone === "positive" ? "text-positive" : c.tone === "negative" ? "text-negative" : "text-fg")
              }
            >
              {c.value}
            </div>
            <div className="text-[10px] text-fg-muted mt-0.5">{c.sub}</div>

            {/* Tooltip — positioned below the cell, revealed on hover or focus-within */}
            <div
              role="tooltip"
              className="absolute left-1/2 top-full mt-1.5 z-30 w-[min(calc(100vw-2rem),280px)] -translate-x-1/2 rounded-lg border border-border bg-surface shadow-xl p-3 text-[11px] leading-relaxed text-fg-subtle opacity-0 pointer-events-none translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0"
            >
              <span className="block font-medium text-fg mb-1">{c.label}</span>
              {c.tooltip}
            </div>
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
