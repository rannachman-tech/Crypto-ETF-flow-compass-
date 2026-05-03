import type { TrackedTicker, TradeableInstrument, ThemeId } from "./types";

/**
 * The flow tracking universe — 20 tickers, all sourced LIVE from Farside Investors.
 *
 * BTC spot ETFs: 11 tickers covering ~$110bn AUM
 * ETH spot ETFs: 9 tickers covering ~$10bn AUM
 *
 * GBTC and ETHE drive the "Grayscale Drag" theme — both have structural outflows
 * since their conversion from trusts. Their flow data is real but represents a
 * different story than organic accumulation.
 */
export const TRACKED_TICKERS: TrackedTicker[] = [
  // ───── BTC SPOT ETFs (Farside columns) ─────
  { ticker: "IBIT", sourceFamily: "farside_btc", name: "iShares Bitcoin Trust",                side: "btc", themes: ["btc_conviction"],  aumHintUsdM: 50000 },
  { ticker: "FBTC", sourceFamily: "farside_btc", name: "Fidelity Wise Origin Bitcoin Fund",   side: "btc", themes: ["btc_conviction"],  aumHintUsdM: 14000 },
  { ticker: "BITB", sourceFamily: "farside_btc", name: "Bitwise Bitcoin ETF",                  side: "btc", themes: ["btc_conviction"],  aumHintUsdM: 3200 },
  { ticker: "ARKB", sourceFamily: "farside_btc", name: "ARK 21Shares Bitcoin ETF",            side: "btc", themes: ["btc_conviction"],  aumHintUsdM: 3500 },
  { ticker: "BTCO", sourceFamily: "farside_btc", name: "Invesco Galaxy Bitcoin ETF",          side: "btc", themes: ["btc_conviction"],  aumHintUsdM: 800 },
  { ticker: "EZBC", sourceFamily: "farside_btc", name: "Franklin Bitcoin ETF",                side: "btc", themes: ["btc_conviction"],  aumHintUsdM: 600 },
  { ticker: "BRRR", sourceFamily: "farside_btc", name: "Valkyrie Bitcoin Fund",               side: "btc", themes: ["btc_conviction"],  aumHintUsdM: 500 },
  { ticker: "HODL", sourceFamily: "farside_btc", name: "VanEck Bitcoin Trust",                side: "btc", themes: ["btc_conviction"],  aumHintUsdM: 700 },
  { ticker: "BTCW", sourceFamily: "farside_btc", name: "WisdomTree Bitcoin Fund",             side: "btc", themes: ["btc_conviction"],  aumHintUsdM: 200 },
  { ticker: "MSBT", sourceFamily: "farside_btc", name: "Schwab Crypto Thematic ETF (Bitcoin)", side: "btc", themes: ["btc_conviction"],  aumHintUsdM: 100 },
  { ticker: "GBTC", sourceFamily: "farside_btc", name: "Grayscale Bitcoin Trust",             side: "grayscale_drag", themes: ["grayscale_drag"], aumHintUsdM: 18000 },

  // ───── ETH SPOT ETFs (Farside columns) ─────
  { ticker: "ETHA", sourceFamily: "farside_eth", name: "iShares Ethereum Trust",              side: "eth", themes: ["eth_conviction"],  aumHintUsdM: 4200 },
  { ticker: "ETHB", sourceFamily: "farside_eth", name: "Bitwise Ethereum ETF",                side: "eth", themes: ["eth_conviction"],  aumHintUsdM: 250 },
  { ticker: "FETH", sourceFamily: "farside_eth", name: "Fidelity Ethereum Fund",              side: "eth", themes: ["eth_conviction"],  aumHintUsdM: 1100 },
  { ticker: "ETHW", sourceFamily: "farside_eth", name: "Bitwise Ethereum ETF (alt)",          side: "eth", themes: ["eth_conviction"],  aumHintUsdM: 200 },
  { ticker: "TETH", sourceFamily: "farside_eth", name: "21Shares Core Ethereum ETF",          side: "eth", themes: ["eth_conviction"],  aumHintUsdM: 100 },
  { ticker: "ETHV", sourceFamily: "farside_eth", name: "VanEck Ethereum ETF",                 side: "eth", themes: ["eth_conviction"],  aumHintUsdM: 150 },
  { ticker: "QETH", sourceFamily: "farside_eth", name: "Invesco Galaxy Ethereum ETF",         side: "eth", themes: ["eth_conviction"],  aumHintUsdM: 80 },
  { ticker: "EZET", sourceFamily: "farside_eth", name: "Franklin Ethereum ETF",               side: "eth", themes: ["eth_conviction"],  aumHintUsdM: 100 },
  { ticker: "ETHE", sourceFamily: "farside_eth", name: "Grayscale Ethereum Trust",            side: "grayscale_drag", themes: ["grayscale_drag"], aumHintUsdM: 4500 },
];

export function tickerByDisplay(t: string): TrackedTicker | undefined {
  return TRACKED_TICKERS.find((x) => x.ticker === t);
}

export function tickersByTheme(themeId: ThemeId): TrackedTicker[] {
  return TRACKED_TICKERS.filter((t) => t.themes.includes(themeId));
}

/**
 * eToro-tradeable instruments referenced by trade baskets.
 * Every instrumentId verified against the live eToro public catalog at
 * https://api.etorostatic.com/sapi/instrumentsmetadata/V1.1/instruments
 */
export const TRADEABLE_INSTRUMENTS: Record<string, TradeableInstrument> = {
  // Crypto — direct on eToro
  BTC:  { ticker: "BTC",  symbolFull: "BTC",  instrumentId: 100000, name: "Bitcoin",  kind: "crypto" },
  ETH:  { ticker: "ETH",  symbolFull: "ETH",  instrumentId: 100001, name: "Ethereum", kind: "crypto" },
  SOL:  { ticker: "SOL",  symbolFull: "SOL",  instrumentId: 100063, name: "Solana",   kind: "crypto" },
  XRP:  { ticker: "XRP",  symbolFull: "XRP",  instrumentId: 100003, name: "XRP",      kind: "crypto" },
  ADA:  { ticker: "ADA",  symbolFull: "ADA",  instrumentId: 100017, name: "Cardano",  kind: "crypto" },
  LINK: { ticker: "LINK", symbolFull: "LINK", instrumentId: 100040, name: "Chainlink", kind: "crypto" },
  LTC:  { ticker: "LTC",  symbolFull: "LTC",  instrumentId: 100005, name: "Litecoin", kind: "crypto" },
  DOGE: { ticker: "DOGE", symbolFull: "DOGE", instrumentId: 100043, name: "Dogecoin", kind: "crypto" },

  // Defensive ETFs — for distribution-phase baskets
  GLD:  { ticker: "GLD",  symbolFull: "GLD",  instrumentId: 3025,  name: "SPDR Gold Shares",                  kind: "etf" },
  BIL:  { ticker: "BIL",  symbolFull: "BIL",  instrumentId: 4407,  name: "SPDR Bloomberg 1-3 Month T-Bill ETF", kind: "etf" },
  TLT:  { ticker: "TLT",  symbolFull: "TLT",  instrumentId: 3020,  name: "iShares 20+ Year Treasury Bond ETF", kind: "etf" },
  IGLN: { ticker: "IGLN.L", symbolFull: "IGLN.L", instrumentId: 15440, name: "iShares Physical Gold ETC",      kind: "etf" },
  IB01: { ticker: "IB01.L", symbolFull: "IB01.L", instrumentId: 1442,  name: "iShares $ Treasury Bond 0-1yr UCITS ETF", kind: "etf" },
};
