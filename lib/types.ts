// Core domain types for Crypto Flow Compass.
// All flow data is real — sourced from Farside Investors daily.

export type RegionId = "us";
export type FlowPhase = "strong_accumulation" | "mild_accumulation" | "mild_distribution" | "strong_distribution";
export type FlowSide = "btc" | "eth" | "grayscale_drag";
export type ThemeId = "btc_conviction" | "eth_conviction" | "grayscale_drag";

/** A tracked ETF — every entry has live data from a real source. */
export interface TrackedTicker {
  ticker: string;
  /** Source family — drives which scraper handles it. */
  sourceFamily: "farside_btc" | "farside_eth";
  name: string;
  side: FlowSide;
  themes: ThemeId[];
  /** Approximate AUM in USD millions, used for breadth weighting. */
  aumHintUsdM: number;
}

/** An eToro-tradeable instrument referenced by trade baskets. */
export interface TradeableInstrument {
  ticker: string;
  symbolFull: string;
  instrumentId: number;
  name: string;
  /** "crypto" instruments live on eToro as direct crypto, "etf" are listed ETFs. */
  kind: "crypto" | "etf";
}

/** Daily net flow in USD millions for one ticker. */
export interface DailyFlow {
  date: string;
  ticker: string;
  netFlowUsdM: number;
}

export interface FlowSnapshot {
  generatedAt: string;
  asOf: string;
  windowDays: number;
  flows: DailyFlow[];
  sourceHealth: SourceHealth[];
}

export interface SourceHealth {
  source: string;
  status: "ok" | "stale" | "down";
  lastSeen: string | null;
  note?: string;
}

export interface ConvictionReading {
  direction: number;
  streakDays: number;
  magnitudeRatio: number;
  breadth: number;
  score: number;
  label: "calm" | "weak" | "building" | "strong" | "extreme";
}

/** The master compass needle reading. */
export interface AccumulationReading {
  /** -100..100 — pure accumulation at +100, pure distribution at -100. */
  score: number;
  smoothedScore: number;
  phase: FlowPhase;
  history: { date: string; score: number; smoothedScore: number }[];
  /** Today's gross inflows in USD millions (sum of positive net-flow entries). */
  inflowsUsdM: number;
  /** Today's gross outflows in USD millions (sum of negative net-flow entries, as negative number). */
  outflowsUsdM: number;
}

export interface ThemeReading {
  themeId: ThemeId;
  label: string;
  shortLabel: string;
  description: string;
  netFlowUsdM7d: number;
  netFlowUsdM30d: number;
  conviction: ConvictionReading;
  topTickers: { ticker: string; netFlowUsdM7d: number }[];
  spark: number[];
}

export interface LeaderboardEntry {
  ticker: string;
  name: string;
  side: FlowSide;
  netFlowUsdM7d: number;
  netFlowUsdM30d: number;
  conviction: ConvictionReading;
  spark: number[];
}
