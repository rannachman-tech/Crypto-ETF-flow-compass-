"use client";

import { useMemo } from "react";
import type { FlowSnapshot } from "@/lib/types";
import { computeLeaderboard, computeAccumulation, computeThemes, topConvictionTheme } from "@/lib/compute";
import { phaseFromScore } from "@/lib/conviction";
import { basketFor } from "@/lib/baskets";
import RiskWarning from "./RiskWarning";
import Header from "./Header";
import LiveSourcesRow from "./LiveSourcesRow";
import CompassHero from "./CompassHero";
import InsightsCard from "./InsightsCard";
import TradeCta from "./TradeCta";
import IndicatorsGrid from "./IndicatorsGrid";
import ConvictionLeaderboard from "./ConvictionLeaderboard";
import ThemeGauges from "./ThemeGauges";
import PersonalizationStrip from "./PersonalizationStrip";
import DeepHistoryChart from "./DeepHistoryChart";
import Footer from "./Footer";

interface Props {
  snapshot: FlowSnapshot;
}

export default function HomeClient({ snapshot }: Props) {
  const { accum, themes, leaderboard, headlineTheme, basket } = useMemo(() => {
    const accum = computeAccumulation(snapshot);
    const themes = computeThemes(snapshot);
    const leaderboard = computeLeaderboard(snapshot);
    const headlineTheme = topConvictionTheme(themes);
    const phase = phaseFromScore(accum.smoothedScore);
    const basket = basketFor(phase, "us");
    return { accum, themes, leaderboard, headlineTheme, basket };
  }, [snapshot]);

  return (
    <div className="min-h-screen flex flex-col bg-bg text-fg">
      <RiskWarning />
      <Header />
      <main className="flex-1 mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg-subtle">
            Crypto ETF flows · live
          </div>
          <LiveSourcesRow generatedAt={snapshot.generatedAt} health={snapshot.sourceHealth} />
        </div>

        <section className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-4 lg:gap-6 items-stretch">
          <div className="rounded-2xl border border-border bg-surface px-4 sm:px-6 pt-4 sm:pt-5 pb-5 sm:pb-6 flex flex-col">
            <div className="flex items-center justify-between gap-2">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg-subtle">
                Accumulation / Distribution
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2/60 px-2 py-0.5 font-mono text-[10px] text-fg-muted">
                <span className="inline-block w-1 h-1 rounded-full bg-accent" aria-hidden />
                7-day smoothed
              </div>
            </div>
            <div className="mt-3 sm:mt-4 w-full max-w-[460px] mx-auto">
              <CompassHero accum={accum} />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <InsightsCard
              accum={accum}
              themes={themes}
              headlineTheme={headlineTheme}
              className="flex-1"
            />
            <TradeCta basket={basket} accum={accum} headlineTheme={headlineTheme} />
          </div>
        </section>

        <PersonalizationStrip leaderboard={leaderboard} />

        <section className="mt-8 sm:mt-10">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-subtle">
            Themes — what's gaining conviction
          </h2>
          <ThemeGauges themes={themes} />
        </section>

        <IndicatorsGrid accum={accum} themes={themes} />

        <ConvictionLeaderboard leaderboard={leaderboard} />

        <DeepHistoryChart history={accum.history} />
      </main>
      <Footer />
    </div>
  );
}
