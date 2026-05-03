import type { ThemeId } from "./types";

export interface ThemeMeta {
  id: ThemeId;
  label: string;
  shortLabel: string;
  description: string;
  /** Direction that constitutes "bullish for this theme". */
  bullishSide: "inflow" | "outflow_slowing";
  accent: string;
}

export const THEMES: ThemeMeta[] = [
  {
    id: "btc_conviction",
    label: "BTC Conviction",
    shortLabel: "BTC",
    description:
      "Net flows into the 10 organic Bitcoin spot ETFs (excludes Grayscale GBTC, which has structural outflows since its trust conversion). The cleanest institutional accumulation signal — refreshed daily from Farside Investors.",
    bullishSide: "inflow",
    accent: "amber",
  },
  {
    id: "eth_conviction",
    label: "ETH Conviction",
    shortLabel: "ETH",
    description:
      "Net flows into the 8 organic Ethereum spot ETFs (excludes Grayscale ETHE). Spot ETH ETFs launched in mid-2024 — flows here track institutional demand for ether at a smaller scale than BTC.",
    bullishSide: "inflow",
    accent: "violet",
  },
  {
    id: "grayscale_drag",
    label: "Grayscale Drag",
    shortLabel: "Grayscale",
    description:
      "GBTC + ETHE outflows. Both have hemorrhaged AUM since converting from trusts — the outflow rate is a structural drag on the headline ETF flow numbers. When this slows, it's bullish for BTC/ETH because the persistent selling pressure eases.",
    bullishSide: "outflow_slowing",
    accent: "rose",
  },
];

export function themeMeta(id: ThemeId): ThemeMeta {
  const found = THEMES.find((t) => t.id === id);
  if (!found) throw new Error(`Unknown theme ${id}`);
  return found;
}
