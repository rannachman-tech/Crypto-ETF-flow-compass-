// Pure pipeline: takes a FlowSnapshot, returns the derived readings the UI consumes.
// Side-effect-free.

import type {
  DailyFlow,
  FlowSnapshot,
  LeaderboardEntry,
  AccumulationReading,
  ThemeReading,
  ThemeId,
} from "./types";
import { TRACKED_TICKERS, tickerByDisplay, tickersByTheme } from "./tickers";
import { THEMES } from "./themes";
import { convictionFromTickerMatrix, phaseFromScore } from "./conviction";

function indexByTicker(flows: DailyFlow[]): Map<string, { dates: string[]; values: number[] }> {
  const map = new Map<string, { dates: string[]; values: number[] }>();
  const sorted = [...flows].sort((a, b) => (a.date < b.date ? -1 : 1));
  for (const f of sorted) {
    if (!map.has(f.ticker)) map.set(f.ticker, { dates: [], values: [] });
    const entry = map.get(f.ticker)!;
    entry.dates.push(f.date);
    entry.values.push(f.netFlowUsdM);
  }
  return map;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function ema(values: number[], periods: number): number[] {
  const k = 2 / (periods + 1);
  const out: number[] = [];
  let prev = values[0] ?? 0;
  for (const v of values) {
    prev = v * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

/**
 * Master accumulation/distribution score.
 * For each date, sum gross inflows (positive flows) and gross outflows (absolute value of
 * negative flows) across the universe ex-Grayscale (Grayscale outflows are structural,
 * not a real distribution signal — they get their own theme).
 *
 * Score = (inflows - outflows) / (inflows + outflows) × 100.
 *   +100 = pure accumulation (every dollar flowing IN)
 *   -100 = pure distribution (every dollar flowing OUT)
 *   0 = balanced
 */
export function computeAccumulation(snapshot: FlowSnapshot): AccumulationReading {
  const ORGANIC_TICKERS = new Set(
    TRACKED_TICKERS.filter((t) => t.side !== "grayscale_drag").map((t) => t.ticker)
  );

  const idx = indexByTicker(snapshot.flows);
  const datesSet = new Set<string>();
  snapshot.flows.forEach((f) => datesSet.add(f.date));
  const dates = Array.from(datesSet).sort();

  const dailyIn: number[] = [];
  const dailyOut: number[] = [];

  for (const d of dates) {
    let inflow = 0;
    let outflow = 0;
    for (const t of TRACKED_TICKERS) {
      if (!ORGANIC_TICKERS.has(t.ticker)) continue;
      const ent = idx.get(t.ticker);
      if (!ent) continue;
      const i = ent.dates.indexOf(d);
      if (i < 0) continue;
      const v = ent.values[i];
      if (v > 0) inflow += v;
      else if (v < 0) outflow += -v;
    }
    dailyIn.push(inflow);
    dailyOut.push(outflow);
  }

  const rawScores = dates.map((_, i) => {
    const total = dailyIn[i] + dailyOut[i];
    if (total === 0) return 0;
    return clamp(((dailyIn[i] - dailyOut[i]) / total) * 100, -100, 100);
  });

  const smoothed = ema(rawScores, 7);
  const last30dates = dates.slice(-30);
  const last30raw = rawScores.slice(-30);
  const last30sm = smoothed.slice(-30);
  const history = last30dates.map((d, i) => ({
    date: d,
    score: round1(last30raw[i]),
    smoothedScore: round1(last30sm[i]),
  }));

  const score = round1(rawScores[rawScores.length - 1] ?? 0);
  const smoothedScore = round1(smoothed[smoothed.length - 1] ?? 0);

  // 7-day rollups for the supporting cards (matches the smoothed needle's time scale).
  const last7In = dailyIn.slice(-7).reduce((s, v) => s + v, 0);
  const last7Out = dailyOut.slice(-7).reduce((s, v) => s + v, 0);

  return {
    score,
    smoothedScore,
    phase: phaseFromScore(smoothedScore),
    history,
    inflowsTodayUsdM: round1(dailyIn[dailyIn.length - 1] ?? 0),
    outflowsTodayUsdM: round1(-(dailyOut[dailyOut.length - 1] ?? 0)),
    inflowsUsdM7d: round1(last7In),
    outflowsUsdM7d: round1(-last7Out),
    asOf: dates[dates.length - 1] ?? "",
  };
}

export function computeThemes(snapshot: FlowSnapshot): ThemeReading[] {
  const idx = indexByTicker(snapshot.flows);
  return THEMES.map<ThemeReading>((theme) => {
    const tickers = tickersByTheme(theme.id);
    const rows = tickers
      .map((t) => idx.get(t.ticker))
      .filter((x): x is { dates: string[]; values: number[] } => !!x)
      .map((entry, i) => ({
        ticker: tickers[i].ticker,
        weight: tickers[i].aumHintUsdM,
        series: entry.values,
      }));

    const conviction = convictionFromTickerMatrix(rows.map((r) => ({ weight: r.weight, series: r.series })));

    const last7 = (vals: number[]) => sum(vals.slice(-7));
    const last30 = (vals: number[]) => sum(vals.slice(-30));
    const totals7 = sum(rows.map((r) => last7(r.series)));
    const totals30 = sum(rows.map((r) => last30(r.series)));

    const topTickers = rows
      .map((r) => ({ ticker: r.ticker, netFlowUsdM7d: round1(last7(r.series)) }))
      .sort((a, b) => Math.abs(b.netFlowUsdM7d) - Math.abs(a.netFlowUsdM7d))
      .slice(0, 4);

    const length = Math.max(...rows.map((r) => r.series.length), 0);
    const agg30: number[] = new Array(Math.min(length, 30)).fill(0);
    rows.forEach((r) => {
      const lastN = r.series.slice(-30);
      lastN.forEach((v, i) => {
        agg30[agg30.length - lastN.length + i] += v;
      });
    });
    let cum = 0;
    const spark = agg30.map((v) => (cum += v));

    return {
      themeId: theme.id,
      label: theme.label,
      shortLabel: theme.shortLabel,
      description: theme.description,
      netFlowUsdM7d: round1(totals7),
      netFlowUsdM30d: round1(totals30),
      conviction,
      topTickers,
      contributorCount: rows.length,
      spark,
    };
  });
}

export function computeLeaderboard(snapshot: FlowSnapshot): LeaderboardEntry[] {
  const idx = indexByTicker(snapshot.flows);
  return TRACKED_TICKERS.map<LeaderboardEntry>((t) => {
    const ent = idx.get(t.ticker) ?? { dates: [], values: [] };
    const series = ent.values;
    const conv = convictionFromTickerMatrix([{ weight: 1, series }]);
    const last7 = sum(series.slice(-7));
    const last30 = sum(series.slice(-30));
    let cum = 0;
    const spark = series.slice(-30).map((v) => (cum += v));
    return {
      ticker: t.ticker,
      name: t.name,
      side: t.side,
      netFlowUsdM7d: round1(last7),
      netFlowUsdM30d: round1(last30),
      conviction: conv,
      spark,
    };
  });
}

export function topConvictionTheme(themes: ThemeReading[]): ThemeReading {
  return [...themes].sort((a, b) => b.conviction.score - a.conviction.score)[0];
}

function sum(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0);
}
