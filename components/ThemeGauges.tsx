"use client";

import type { ThemeReading } from "@/lib/types";
import { themeMeta } from "@/lib/themes";
import { fmtUsdM } from "@/lib/format";
import Sparkline from "./Sparkline";

interface Props {
  themes: ThemeReading[];
}

export default function ThemeGauges({ themes }: Props) {
  return (
    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {themes.map((t) => {
        const meta = themeMeta(t.themeId);
        const direction = t.conviction.direction;
        const bullishForTheme =
          (meta.bullishSide === "inflow" && direction >= 0) ||
          (meta.bullishSide === "outflow_slowing" && direction >= 0);
        const dirColor = bullishForTheme ? "text-positive" : "text-negative";
        const fillColor = bullishForTheme ? "rgb(var(--positive))" : "rgb(var(--negative))";
        const score = t.conviction.score;

        return (
          <article key={t.themeId} className="rounded-xl border border-border bg-surface p-4 flex flex-col">
            <header className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-fg">{meta.label}</h3>
              <span className={"font-mono text-[10px] uppercase tracking-wider " + dirColor}>
                {t.conviction.label}
              </span>
            </header>

            <div className="mt-3">
              <div className="relative h-1.5 rounded-full bg-surface-2 overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full transition-all"
                  style={{ width: `${score}%`, backgroundColor: fillColor, opacity: 0.85 }}
                />
              </div>
              <div className="mt-1.5 flex items-baseline justify-between text-[10px] font-mono text-fg-muted">
                <span>conviction</span>
                <span className="tabular-nums text-fg">{score}/100</span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-fg-subtle">
                  7d net · {t.contributorCount} fund{t.contributorCount === 1 ? "" : "s"}
                </div>
                <div className={"text-sm font-semibold tabular-nums " + (t.netFlowUsdM7d >= 0 ? "text-positive" : "text-negative")}>
                  {fmtUsdM(t.netFlowUsdM7d, { signed: true })}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-fg-subtle">streak</div>
                <div className="text-sm font-semibold tabular-nums">{t.conviction.streakDays}d</div>
              </div>
            </div>

            <div className="mt-3">
              <Sparkline values={t.spark} width={200} height={28} className="w-full" />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1">
              {t.topTickers.slice(0, 4).map((tt) => (
                <span
                  key={tt.ticker}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] font-mono text-fg"
                  title={`7d net: ${fmtUsdM(tt.netFlowUsdM7d, { signed: true })}`}
                >
                  {tt.ticker}
                </span>
              ))}
              {t.contributorCount > t.topTickers.length && (
                <span className="text-[10px] text-fg-muted ml-0.5">
                  + {t.contributorCount - t.topTickers.length} more
                </span>
              )}
            </div>

            <p className="mt-2 text-[10px] text-fg-muted leading-snug italic">
              Top contributors by absolute flow shown. Headline number is net across all {t.contributorCount} funds.
            </p>

            <p className="mt-2 text-[11px] text-fg-subtle leading-snug">{meta.description}</p>
          </article>
        );
      })}
    </div>
  );
}
