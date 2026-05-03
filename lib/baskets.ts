import type { FlowPhase, RegionId } from "./types";
import { TRADEABLE_INSTRUMENTS } from "./tickers";

export interface BasketHolding {
  ticker: string;
  symbolFull: string;
  instrumentId: number;
  name: string;
  weight: number;
  shortRationale: string;
  longRationale: string;
}

export interface Basket {
  phase: FlowPhase;
  region: RegionId;
  title: string;
  thesis: string;
  holdings: BasketHolding[];
}

const I = TRADEABLE_INSTRUMENTS;

function holding(key: keyof typeof TRADEABLE_INSTRUMENTS, weight: number, shortRationale: string, longRationale: string): BasketHolding {
  const t = I[key];
  return {
    ticker: t.ticker,
    symbolFull: t.symbolFull,
    instrumentId: t.instrumentId,
    name: t.name,
    weight,
    shortRationale,
    longRationale,
  };
}

// ─────────────────────────────────────────────────────────────
// Crypto Flow Compass — phase baskets driven by accumulation/distribution signal
// ─────────────────────────────────────────────────────────────

const STRONG_ACCUMULATION: Basket = {
  phase: "strong_accumulation",
  region: "us",
  title: "Press the accelerator",
  thesis:
    "The accumulation needle is deep in the green — institutional flows into BTC and ETH spot ETFs are running at conviction levels (long streaks, multi-issuer breadth, magnitude well above 30-day average). We only recommend the assets we have direct flow signal for: BTC and ETH. Altcoins are deliberately excluded — without flow data on Solana, XRP, ADA or LINK we won't pretend to have conviction on them.",
  holdings: [
    holding("BTC", 60, "Core BTC", "Bitcoin is the cleanest expression of institutional accumulation — when ETFs are inflowing, BTC is the trade. 60% sizing reflects strongest conviction in the asset our data covers most reliably."),
    holding("ETH", 40, "Ethereum sleeve", "Ethereum spot ETF flows typically lag BTC but follow within days. 40% captures the broadening of the accumulation regime."),
  ],
};

const MILD_ACCUMULATION: Basket = {
  phase: "mild_accumulation",
  region: "us",
  title: "Lean in",
  thesis:
    "The needle leans positive but conviction isn't at acceleration levels — flows are net positive but streaks are short or breadth is mixed. BTC-heavier weighting (vs strong-accumulation's balanced split) reflects the mild signal: when conviction is partial, lean to the asset our flow data covers most reliably. Altcoins and cash sleeves deliberately excluded — we only recommend assets we have direct flow signal for.",
  holdings: [
    holding("BTC", 70, "Core BTC", "When accumulation is mild, BTC is where the cleanest signal lives. 70% sizing reflects 'core long' on the asset our Farside data covers with most depth."),
    holding("ETH", 30, "Ethereum sleeve", "Smaller ETH allocation than the strong-accumulation basket — captures the spillover when accumulation broadens, sized for partial conviction."),
  ],
};

const MILD_DISTRIBUTION: Basket = {
  phase: "mild_distribution",
  region: "us",
  title: "Quiet de-risk",
  thesis:
    "The needle has tipped negative but not at panic levels — institutions are quietly trimming. The crypto-flow signal says trim. The defensive sleeve (gold + T-bills) is the standard macro-defensive playbook for crypto sell-offs — these picks are based on how those assets behave in crypto stress, NOT on flow data we don't have for them. The BTC + ETH residuals retain optionality for when the regime turns.",
  holdings: [
    holding("BTC", 30, "Reduced BTC core", "Flow signal is mildly negative but not panicked — keep BTC core exposure for when accumulation resumes."),
    holding("GLD", 30, "Gold (macro hedge)", "Standard macro-defensive pick when crypto enters distribution. Not flow-signal backed."),
    holding("BIL", 30, "T-bills (cash)", "Short-duration USD Treasuries — capital preservation + front-end yield. Standard cash equivalent, not flow-signal backed."),
    holding("ETH", 10, "Small ETH residual", "Keep a small ETH position for asymmetric upside if accumulation resumes."),
  ],
};

const STRONG_DISTRIBUTION: Basket = {
  phase: "strong_distribution",
  region: "us",
  title: "Defense first",
  thesis:
    "Capital is fleeing crypto ETFs at conviction levels. The crypto-flow signal says EXIT. The defensive picks below (T-bills, gold, long Treasuries) are the standard macro-defensive playbook for risk-off — based on how those assets behave when crypto sells off, NOT on flow data for them specifically. We don't have flow data on traditional defensive ETFs; these are macro picks, transparently labeled.",
  holdings: [
    holding("BIL", 40, "T-bills (cash, macro)", "Short-duration USD Treasuries — capital preservation. Standard cash equivalent, not flow-signal backed."),
    holding("GLD", 30, "Gold (macro hedge)", "Standard macro defensive pick when crypto enters strong distribution. Not flow-signal backed."),
    holding("TLT", 20, "Long Treasury (macro)", "Long-duration USD Treasuries tend to rally when crypto distribution coincides with risk-off rate moves. Macro pick, not flow-signal backed."),
    holding("IB01", 10, "USD T-bills UCITS (macro)", "UCITS-listed T-bill ETF for EU/UK retail accessibility."),
  ],
};

export const BASKETS: Record<RegionId, Record<FlowPhase, Basket>> = {
  us: {
    strong_accumulation: STRONG_ACCUMULATION,
    mild_accumulation: MILD_ACCUMULATION,
    mild_distribution: MILD_DISTRIBUTION,
    strong_distribution: STRONG_DISTRIBUTION,
  },
};

export function basketFor(phase: FlowPhase, region: RegionId = "us"): Basket {
  return BASKETS[region][phase];
}

export function allocate(basket: Basket, amount: number) {
  return basket.holdings.map((h) => ({
    ...h,
    dollars: Math.round((h.weight / 100) * amount * 100) / 100,
  }));
}

export function allHoldings(): BasketHolding[] {
  const out: BasketHolding[] = [];
  for (const region of Object.keys(BASKETS) as RegionId[]) {
    for (const phase of Object.keys(BASKETS[region]) as FlowPhase[]) {
      out.push(...BASKETS[region][phase].holdings);
    }
  }
  return out;
}
