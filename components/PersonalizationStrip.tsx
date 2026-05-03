"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles, Plug } from "lucide-react";
import type { LeaderboardEntry } from "@/lib/types";
import { TRADEABLE_INSTRUMENTS } from "@/lib/tickers";
import { fmtUsdM } from "@/lib/format";
import { loadEtoroSession, subscribeEtoroSession, type EtoroSession } from "@/lib/etoro-session";
import Sparkline from "./Sparkline";

interface Props {
  leaderboard: LeaderboardEntry[];
}

interface Position {
  instrumentId: number;
  units: number;
}

/**
 * Personalization strip — shows the user's eToro positions in flow context.
 * Crypto Flow Compass tracks BTC/ETH ETFs but the user holds direct crypto (BTC, ETH).
 * We map: if user holds BTC (id 100000), show BTC Conviction theme context.
 *         If user holds ETH (id 100001), show ETH Conviction theme context.
 */
const ID_TO_THEME: Record<number, "btc" | "eth"> = {
  100000: "btc",
  100001: "eth",
};

export default function PersonalizationStrip({ leaderboard }: Props) {
  const [session, setSession] = useState<EtoroSession | null>(null);
  const [positions, setPositions] = useState<Position[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function sync() {
      setSession(loadEtoroSession());
      setPositions(null);
    }
    sync();
    return subscribeEtoroSession(sync);
  }, []);

  useEffect(() => {
    if (!session || positions !== null) return;
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        if (!session) return;
        const res = await fetch("/api/etoro/portfolio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey: session.apiKey, userKey: session.userKey, env: session.env }),
        });
        const data = await res.json();
        if (!cancelled && data.ok) setPositions(data.positions || []);
        else if (!cancelled) setPositions([]);
      } catch {
        if (!cancelled) setPositions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [session, positions]);

  // Match positions to crypto themes via instrumentId.
  const matched = useMemo(() => {
    if (!positions) return [];
    const byInstrument = Object.values(TRADEABLE_INSTRUMENTS).reduce<Record<number, typeof TRADEABLE_INSTRUMENTS[string]>>(
      (acc, t) => { acc[t.instrumentId] = t; return acc; }, {}
    );
    return positions
      .map((p) => {
        const inst = byInstrument[p.instrumentId];
        if (!inst) return null;
        const themeSide = ID_TO_THEME[p.instrumentId];
        let signal: LeaderboardEntry | undefined;
        if (themeSide === "btc") signal = leaderboard.find((l) => l.ticker === "IBIT");
        else if (themeSide === "eth") signal = leaderboard.find((l) => l.ticker === "ETHA");
        return { instrument: inst, units: p.units, signal };
      })
      .filter((x): x is { instrument: typeof TRADEABLE_INSTRUMENTS[string]; units: number; signal: LeaderboardEntry | undefined } => !!x);
  }, [positions, leaderboard]);

  if (!session) {
    return (
      <section className="mt-6">
        <div className="rounded-2xl border border-dashed border-border bg-surface-2/40 p-4 sm:p-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-accent" aria-hidden />
            </div>
            <div>
              <h2 className="text-sm font-semibold">See your crypto holdings in flow context</h2>
              <p className="mt-0.5 text-xs text-fg-subtle leading-snug max-w-xl">
                Connect eToro to overlay your BTC and ETH positions with live ETF flow signals — see if institutions are buying or selling what you already own.
              </p>
            </div>
          </div>
          <Plug className="w-3.5 h-3.5 hidden" aria-hidden />
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="mt-6">
        <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-fg-subtle">
          Loading your portfolio…
        </div>
      </section>
    );
  }

  if (matched.length === 0) return null;

  return (
    <section className="mt-6">
      <div className="rounded-2xl border border-accent/30 bg-accent/5 overflow-hidden">
        <header className="px-4 py-2.5 border-b border-accent/20 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-accent" aria-hidden />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-fg">
            Your holdings · in flow context
          </h2>
          <span className="text-[10px] text-fg-subtle ml-auto">
            {matched.length} matched · @{session.username}
          </span>
        </header>
        <ul className="divide-y divide-border">
          {matched.map(({ instrument, signal }) => (
            <li key={instrument.ticker} className="px-4 py-3 flex items-center gap-3 text-sm">
              <div className="font-mono font-medium min-w-[60px]">{instrument.ticker}</div>
              <div className="flex-1 min-w-0 truncate text-fg-subtle text-xs">
                {instrument.name}
                {signal && <span className="ml-2 text-[10px] text-fg-muted">via {signal.ticker} ETF flow</span>}
              </div>
              {signal && <Sparkline values={signal.spark} color="auto" />}
              {signal && (
                <div className="text-right">
                  <div className={"text-sm font-semibold tabular-nums " + (signal.netFlowUsdM7d >= 0 ? "text-positive" : "text-negative")}>
                    {fmtUsdM(signal.netFlowUsdM7d, { signed: true })}
                  </div>
                  <div className="text-[10px] text-fg-muted">
                    Streak {signal.conviction.streakDays}d · {signal.conviction.label}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
