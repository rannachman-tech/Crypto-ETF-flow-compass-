"use client";

import type { AccumulationReading } from "@/lib/types";
import { phaseDescription, phaseLabel } from "@/lib/conviction";
import { fmtScore, fmtUsdM } from "@/lib/format";
import CompassNeedle from "./CompassNeedle";

interface Props {
  accum: AccumulationReading;
}

export default function CompassHero({ accum }: Props) {
  const phaseTextClass =
    accum.phase === "strong_accumulation"
      ? "text-positive"
      : accum.phase === "strong_distribution"
      ? "text-negative"
      : accum.phase === "mild_accumulation"
      ? "text-positive"
      : "text-negative";

  const totalToday = Math.abs(accum.inflowsUsdM) + Math.abs(accum.outflowsUsdM);
  const inPct = totalToday === 0 ? 0 : (Math.max(0, accum.inflowsUsdM) / totalToday) * 100;
  const outPct = totalToday === 0 ? 0 : (Math.abs(Math.min(0, accum.outflowsUsdM)) / totalToday) * 100;

  return (
    <div className="flex flex-col items-center text-center w-full">
      <CompassNeedle score={accum.smoothedScore} history={accum.history} />

      <div className="-mt-1">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg-subtle">
          {phaseLabel(accum.phase)}
        </div>
        <div
          className={`mt-1 font-semibold tracking-tight tabular-nums text-[44px] sm:text-[52px] leading-none ${phaseTextClass}`}
        >
          {fmtScore(accum.smoothedScore)}
        </div>
        <p className="mt-2.5 text-sm text-fg-subtle max-w-[400px] mx-auto leading-snug">
          {phaseDescription(accum.phase)}
        </p>
      </div>

      <div className="mt-5 w-full max-w-[420px] rounded-xl border border-border bg-surface-2/40 px-4 py-3">
        <div className="flex items-baseline justify-between text-[10px] font-mono uppercase tracking-[0.18em] text-fg-subtle">
          <span>Today's flows</span>
          <span className="text-fg-muted">{totalToday > 0 ? fmtUsdM(totalToday) : "—"}</span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <div className="text-left">
            <div className="text-[10px] font-mono uppercase tracking-wider text-fg-subtle">Gross inflow</div>
            <div className={"mt-0.5 text-base font-semibold tabular-nums " + (accum.inflowsUsdM > 0 ? "text-positive" : "text-fg-muted")}>
              {accum.inflowsUsdM > 0 ? "+" + fmtUsdM(accum.inflowsUsdM).replace("+", "") : fmtUsdM(0)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-mono uppercase tracking-wider text-fg-subtle">Gross outflow</div>
            <div className={"mt-0.5 text-base font-semibold tabular-nums " + (accum.outflowsUsdM < 0 ? "text-negative" : "text-fg-muted")}>
              {accum.outflowsUsdM < 0 ? fmtUsdM(accum.outflowsUsdM, { signed: true }) : fmtUsdM(0)}
            </div>
          </div>
        </div>
        <div className="mt-3 flex h-1 rounded-full overflow-hidden bg-surface-2">
          <div className="bg-positive transition-all" style={{ width: `${inPct}%`, opacity: inPct === 0 ? 0 : 0.85 }} aria-hidden />
          <div className="flex-1" aria-hidden />
          <div className="bg-negative transition-all" style={{ width: `${outPct}%`, opacity: outPct === 0 ? 0 : 0.85 }} aria-hidden />
        </div>
      </div>
    </div>
  );
}
