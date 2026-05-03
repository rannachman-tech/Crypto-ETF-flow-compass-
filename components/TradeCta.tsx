"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ShieldAlert } from "lucide-react";
import type { Basket } from "@/lib/baskets";
import type { AccumulationReading, ThemeReading } from "@/lib/types";
import { phaseLabel } from "@/lib/conviction";
import { loadEtoroSession, subscribeEtoroSession } from "@/lib/etoro-session";
import TradeModal from "./TradeModal";

interface Props {
  basket: Basket;
  accum: AccumulationReading;
  headlineTheme: ThemeReading;
}

export default function TradeCta({ basket, accum, headlineTheme }: Props) {
  const [open, setOpen] = useState(false);
  const [env, setEnv] = useState<"real" | "demo" | null>(null);

  useEffect(() => {
    function sync() {
      const s = loadEtoroSession();
      setEnv(s?.env ?? null);
    }
    sync();
    return subscribeEtoroSession(sync);
  }, []);

  return (
    <article className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-subtle">
          Trade the regime
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">
          {phaseLabel(accum.phase)}
        </span>
      </div>

      <h3 className="mt-2 text-base sm:text-lg font-semibold leading-tight">{basket.title}</h3>
      <p className="mt-1 text-xs text-fg-subtle leading-snug">
        Aligned with the strongest flow signal: <span className="font-medium text-fg">{headlineTheme.label}</span>.
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {basket.holdings.map((h) => (
          <span
            key={h.ticker}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-2/60 px-2 py-1 text-[11px] font-mono text-fg-subtle"
          >
            <span className="text-fg font-medium">{h.ticker}</span>
            <span className="text-fg-muted tabular-nums">{h.weight}%</span>
          </span>
        ))}
      </div>

      {env === "real" && (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-negative/40 bg-negative/5 px-3 py-2 text-xs text-negative">
          <ShieldAlert className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" aria-hidden />
          <p>
            <span className="font-medium">Real-money mode active.</span> Trades you confirm here will execute against your live eToro account.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex items-center justify-between gap-2 w-full px-4 py-2.5 rounded-lg bg-fg text-bg font-medium text-sm hover:opacity-90 transition-opacity"
      >
        <span>Trade on eToro</span>
        <ArrowRight className="w-4 h-4" aria-hidden />
      </button>

      <p className="mt-2 text-[10px] text-fg-muted leading-snug">eToro Connect required to execute. Capital at risk.</p>

      <TradeModal open={open} onClose={() => setOpen(false)} basket={basket} />
    </article>
  );
}
