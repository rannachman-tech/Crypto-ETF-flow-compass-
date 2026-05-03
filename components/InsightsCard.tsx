"use client";

import { ArrowDownRight, ArrowUpRight, Flame, Snowflake } from "lucide-react";
import type { AccumulationReading, ThemeReading } from "@/lib/types";
import { fmtUsdM } from "@/lib/format";
import { phaseLabel } from "@/lib/conviction";
import { themeMeta } from "@/lib/themes";

interface Props {
  accum: AccumulationReading;
  themes: ThemeReading[];
  headlineTheme: ThemeReading;
  className?: string;
}

export default function InsightsCard({ accum, themes, headlineTheme, className }: Props) {
  const others = themes
    .filter((t) => t.themeId !== headlineTheme.themeId)
    .sort((a, b) => b.conviction.score - a.conviction.score);
  const counterTheme = others.find((t) => Math.sign(t.conviction.direction) !== Math.sign(headlineTheme.conviction.direction)) ?? others[0];

  const headlineMeta = themeMeta(headlineTheme.themeId);
  const headlineDirection = headlineTheme.conviction.direction >= 0 ? "inflow" : "outflow";
  const headlineIsBullish =
    (headlineMeta.bullishSide === "inflow" && headlineDirection === "inflow") ||
    (headlineMeta.bullishSide === "outflow_slowing" && headlineDirection === "inflow");

  const counterMeta = counterTheme ? themeMeta(counterTheme.themeId) : null;
  const counterDirection = counterTheme ? (counterTheme.conviction.direction >= 0 ? "inflow" : "outflow") : "";

  return (
    <article className={"rounded-2xl border border-border bg-surface p-4 sm:p-5 flex flex-col " + (className ?? "")}>
      <header className="flex items-baseline justify-between">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-subtle">
          Worth flagging
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">Live · Farside</span>
      </header>

      <div className="mt-3 sm:mt-4">
        <div className="flex items-center gap-2">
          {headlineIsBullish ? (
            <Flame className="w-4 h-4 text-positive flex-shrink-0" aria-hidden />
          ) : (
            <Snowflake className="w-4 h-4 text-negative flex-shrink-0" aria-hidden />
          )}
          <h3 className="text-base sm:text-lg font-semibold leading-tight">
            {headlineMeta.label}: {headlineDirection === "inflow" ? "inflow" : "outflow"} streak{" "}
            <span className="tabular-nums text-fg-subtle">{headlineTheme.conviction.streakDays}d</span>
          </h3>
        </div>
        <p className="mt-2 text-sm text-fg-subtle leading-relaxed">
          7-day net{" "}
          <span className={"tabular-nums font-medium " + (headlineTheme.netFlowUsdM7d >= 0 ? "text-positive" : "text-negative")}>
            {fmtUsdM(headlineTheme.netFlowUsdM7d, { signed: true })}
          </span>{" "}
          across {headlineTheme.topTickers.length} funds — running at{" "}
          <span className="font-medium text-fg">{headlineTheme.conviction.magnitudeRatio.toFixed(1)}×</span>{" "}
          its 30-day average. Conviction:{" "}
          <span className="font-medium text-fg uppercase tracking-wider text-[10px]">{headlineTheme.conviction.label}</span>.
        </p>
      </div>

      {counterTheme && counterMeta && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            {counterTheme.conviction.direction >= 0 ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-fg-subtle flex-shrink-0" aria-hidden />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 text-fg-subtle flex-shrink-0" aria-hidden />
            )}
            <h4 className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">Underneath</h4>
          </div>
          <p className="mt-1.5 text-sm text-fg-subtle leading-snug">
            <span className="font-medium text-fg">{counterMeta.label}</span> showing {counterDirection}{" "}
            <span className={"tabular-nums " + (counterTheme.netFlowUsdM7d >= 0 ? "text-positive" : "text-negative")}>
              {fmtUsdM(counterTheme.netFlowUsdM7d, { signed: true })}
            </span>{" "}
            over the past week.{" "}
            {counterTheme.conviction.streakDays >= 5
              ? `${counterTheme.conviction.streakDays}-day streak — worth watching.`
              : "Mixed signal underneath the headline."}
          </p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-fg-muted leading-snug">
          The accumulation needle reads <span className="font-medium text-fg">{phaseLabel(accum.phase)}</span>.
          {accum.phase === "strong_accumulation" || accum.phase === "mild_accumulation"
            ? " Smart money is leaning into crypto — the basket on the right reflects that bias."
            : " Smart money is leaning out of crypto — the basket on the right reflects that bias."}
        </p>
      </div>
    </article>
  );
}
