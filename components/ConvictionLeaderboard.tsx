"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { LeaderboardEntry } from "@/lib/types";
import { fmtUsdM } from "@/lib/format";
import Sparkline from "./Sparkline";

interface Props {
  leaderboard: LeaderboardEntry[];
}

type SortKey = "conviction" | "flow7d" | "flow30d";

export default function ConvictionLeaderboard({ leaderboard }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("conviction");

  const { topInflows, topOutflows } = useMemo(() => {
    // Sign comes from 7-day flow (the time scale users see in the rows), not today's direction.
    // Without this, a ticker with +flow today but −7d net could land in the inflow column.
    const enriched = leaderboard.map((l) => ({
      ...l,
      signedConviction: Math.sign(l.netFlowUsdM7d) * l.conviction.score,
    }));

    // Inflow column: only tickers with net positive 7d flow.
    const inflowsOnly = enriched.filter((e) => e.netFlowUsdM7d > 0);
    const outflowsOnly = enriched.filter((e) => e.netFlowUsdM7d < 0);

    function sortFn(side: "in" | "out") {
      if (sortKey === "flow7d") return (a: any, b: any) => (side === "in" ? b.netFlowUsdM7d - a.netFlowUsdM7d : a.netFlowUsdM7d - b.netFlowUsdM7d);
      if (sortKey === "flow30d") return (a: any, b: any) => (side === "in" ? b.netFlowUsdM30d - a.netFlowUsdM30d : a.netFlowUsdM30d - b.netFlowUsdM30d);
      // Conviction: sort by absolute conviction within each side.
      return (a: any, b: any) => b.conviction.score - a.conviction.score;
    }

    return {
      topInflows: [...inflowsOnly].sort(sortFn("in")).slice(0, 6),
      topOutflows: [...outflowsOnly].sort(sortFn("out")).slice(0, 6),
    };
  }, [leaderboard, sortKey]);

  return (
    <section className="mt-8 sm:mt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-subtle">
            Conviction leaderboard
          </h2>
          <p className="mt-1 text-sm text-fg-subtle leading-snug max-w-xl">
            Sorted by signal strength — streak length, magnitude vs 30-day average, and breadth — not raw dollars.
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-border bg-surface p-1 text-xs">
          <SortBtn label="Conviction" active={sortKey === "conviction"} onClick={() => setSortKey("conviction")} />
          <SortBtn label="7d flow" active={sortKey === "flow7d"} onClick={() => setSortKey("flow7d")} />
          <SortBtn label="30d flow" active={sortKey === "flow30d"} onClick={() => setSortKey("flow30d")} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Column title="Strongest inflow conviction" Icon={ArrowUp} accent="positive" rows={topInflows} />
        <Column title="Strongest outflow conviction" Icon={ArrowDown} accent="negative" rows={topOutflows} />
      </div>
    </section>
  );
}

function SortBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={"px-2.5 py-1 rounded-md font-medium transition-colors " + (active ? "bg-surface-2 text-fg" : "text-fg-subtle hover:text-fg")}
    >
      {label}
    </button>
  );
}

function Column({
  title,
  Icon,
  accent,
  rows,
}: {
  title: string;
  Icon: typeof ArrowUp;
  accent: "positive" | "negative";
  rows: (LeaderboardEntry & { signedConviction: number })[];
}) {
  const accentClass = accent === "positive" ? "text-positive" : "text-negative";
  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-2 border-b border-border">
        <Icon className={`w-3.5 h-3.5 ${accentClass}`} aria-hidden />
        <h3 className="text-xs font-medium uppercase tracking-wider text-fg-subtle">{title}</h3>
      </div>
      <ul>
        {rows.map((r, i) => (
          <li
            key={r.ticker}
            className={"flex items-center gap-3 px-4 py-3 " + (i < rows.length - 1 ? "border-b border-border" : "")}
          >
            <div className="w-6 font-mono text-[10px] text-fg-muted tabular-nums">{i + 1}</div>
            <div className="flex-shrink-0 min-w-[60px]">
              <div className="font-mono text-sm font-medium">{r.ticker}</div>
              <div className="text-[10px] text-fg-muted uppercase tracking-wider">
                {r.side === "btc" ? "Bitcoin" : r.side === "eth" ? "Ethereum" : "Grayscale"}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-fg truncate">{r.name}</div>
              <div className="mt-0.5 text-[10px] text-fg-subtle">
                Streak <span className="tabular-nums font-medium text-fg">{r.conviction.streakDays}d</span>{" "}
                · {r.conviction.magnitudeRatio.toFixed(1)}× avg · {r.conviction.label}
              </div>
            </div>
            <Sparkline values={r.spark} color="auto" />
            <div className="text-right">
              <div className={"text-sm font-semibold tabular-nums " + (r.netFlowUsdM7d >= 0 ? "text-positive" : "text-negative")}>
                {fmtUsdM(r.netFlowUsdM7d, { signed: true })}
              </div>
              <div className="text-[10px] text-fg-muted">7d net</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
