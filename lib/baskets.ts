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
    "The accumulation needle is deep in the green — institutional crypto ETF flows are running at conviction levels (long streaks, multi-issuer breadth, magnitude well above 30-day average). Position aggressively in the assets retail can actually trade on eToro: BTC, ETH, plus measured altcoin exposure for upside leverage.",
  holdings: [
    holding("BTC", 50, "Core BTC", "Bitcoin is the cleanest expression of institutional accumulation — when ETFs are inflowing, BTC is the trade. 50% sizing reflects 'core' conviction."),
    holding("ETH", 30, "Ethereum sleeve", "Ethereum spot ETF flows typically lag BTC but follow within days. 30% gets you ETH exposure without overconcentrating."),
    holding("SOL", 20, "Altcoin beta", "Solana is the highest-quality altcoin with eToro tradeable liquidity. 20% adds upside leverage if the accumulation regime broadens beyond just BTC + ETH."),
  ],
};

const MILD_ACCUMULATION: Basket = {
  phase: "mild_accumulation",
  region: "us",
  title: "Lean in",
  thesis:
    "The needle leans positive but conviction isn't at acceleration levels — flows are net positive but streaks are short or breadth is mixed. Stay long the core but don't chase altcoins yet. BTC-heavy with an ETH sleeve.",
  holdings: [
    holding("BTC", 60, "Core BTC", "When the accumulation lean is mild, the cleanest trade is BTC itself. 60% sizing reflects 'core long, no altcoin chase'."),
    holding("ETH", 30, "Ethereum sleeve", "Steady ETH allocation — captures the spillover when accumulation broadens."),
    holding("LINK", 10, "Quality altcoin", "Chainlink is a smaller satellite — institutional altcoin flows often pick LINK first as a 'real-utility' alt."),
  ],
};

const MILD_DISTRIBUTION: Basket = {
  phase: "mild_distribution",
  region: "us",
  title: "Quiet de-risk",
  thesis:
    "The needle has tipped negative but not at panic levels — institutions are quietly trimming. Reduce crypto exposure, add cash equivalents and gold as ballast. Keep a small BTC core for when the regime turns.",
  holdings: [
    holding("BTC", 30, "Reduced BTC core", "Don't go to zero — keep optionality for when accumulation resumes. 30% retains core exposure."),
    holding("GLD", 30, "Gold", "Gold is the textbook hedge when crypto distribution begins. Liquid, deep, eToro-tradeable."),
    holding("BIL", 30, "T-bills", "Short-duration USD Treasuries — yield while you wait for the regime to clarify."),
    holding("ETH", 10, "Small ETH residual", "Keep a small ETH position for asymmetric upside if accumulation resumes."),
  ],
};

const STRONG_DISTRIBUTION: Basket = {
  phase: "strong_distribution",
  region: "us",
  title: "Defense first",
  thesis:
    "Capital is fleeing crypto ETFs at conviction levels — long outflow streaks, multi-issuer breadth on the sell side, magnitude well above average. Move to capital preservation. Cash, gold, long Treasuries. No crypto exposure until the regime turns.",
  holdings: [
    holding("BIL", 40, "T-bills", "Short-duration USD Treasuries — preserve capital and earn the front-end yield."),
    holding("GLD", 30, "Gold", "Gold tends to outperform when crypto sells off and risk appetite collapses."),
    holding("TLT", 20, "Long Treasury", "Long-duration USD Treasuries — when crypto distribution accelerates, rates often fall, bond prices rise."),
    holding("IB01", 10, "USD T-bills (UCITS)", "UCITS-listed USD T-bill ETF — accessible alternative cash sleeve for EU/UK retail."),
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
