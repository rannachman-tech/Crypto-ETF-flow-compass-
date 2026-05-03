/* eslint-disable no-console */
// Audit script — beyond verify. Per-instrument metadata dump, exchange landscape,
// IsInternalInstrument flag, type check, and substitute suggestions.
// Captures the lessons from Stock Cycle Compass.
//
// Run: npm run audit:baskets

import { allHoldings } from "../lib/baskets";

const CATALOG_URL = "https://api.etorostatic.com/sapi/instrumentsmetadata/V1.1/instruments";

// Exchange IDs verified empirically against the live eToro catalog.
//   4  = NASDAQ
//   5  = NYSE / NYSE Arca
//   7  = LSE main (the .L tickers — confirmed working in Stock Cycle Compass)
//   8  = eToro crypto venue (BTC, ETH, SOL, XRP, etc.)
//   18 = Euronext Paris (.PA)
//   30 = Euronext Amsterdam (VUSA.NV — has shipped in production)
const SAFE_EXCHANGES = new Set([4, 5, 7, 8, 18, 30]);

interface CatalogEntry {
  InstrumentID: number;
  SymbolFull: string;
  InstrumentDisplayName: string;
  InstrumentTypeID: number;
  IsInternalInstrument?: boolean;
  HasExpirationDate?: boolean;
  ExchangeID?: number;
}

// InstrumentTypeID 6 = ETF, 10 = Crypto. Crypto-aware baskets (Crypto Flow Compass)
// reference both — BTC/ETH are type 10, defensive sleeves (GLD, BIL, TLT, IB01.L) are type 6.
const ALLOWED_TYPES = new Set([6, 10]);

async function main() {
  const res = await fetch(CATALOG_URL);
  if (!res.ok) { console.error(`HTTP ${res.status}`); process.exit(1); }
  const json = (await res.json()) as { InstrumentDisplayDatas: CatalogEntry[] };
  const cat = new Map(json.InstrumentDisplayDatas.map((it) => [it.InstrumentID, it]));

  const seen = new Set<number>();
  const rows: any[] = [];
  for (const h of allHoldings()) {
    if (seen.has(h.instrumentId)) continue;
    seen.add(h.instrumentId);
    const e = cat.get(h.instrumentId);
    if (!e) {
      rows.push({ ticker: h.ticker, status: "MISSING", id: h.instrumentId });
      continue;
    }
    const flags: string[] = [];
    if (!ALLOWED_TYPES.has(e.InstrumentTypeID)) flags.push(`type=${e.InstrumentTypeID}(unsupported)`);
    if (e.IsInternalInstrument) flags.push("internal");
    if (e.HasExpirationDate) flags.push("hasExpiry");
    if (e.ExchangeID && !SAFE_EXCHANGES.has(e.ExchangeID)) flags.push(`exchange=${e.ExchangeID}(unsafe?)`);
    rows.push({
      ticker: h.ticker,
      status: flags.length ? "WARN" : "OK",
      id: h.instrumentId,
      symbol: e.SymbolFull,
      name: e.InstrumentDisplayName,
      typeId: e.InstrumentTypeID,
      exchangeId: e.ExchangeID ?? "-",
      flags: flags.join(",") || "-",
    });
  }

  // Print as a fixed-width table.
  const headers = ["ticker", "status", "id", "symbol", "exchange", "type", "flags", "name"];
  const widths = [10, 8, 8, 12, 8, 6, 30, 60];
  function row(vals: (string | number)[]) {
    return vals.map((v, i) => String(v).padEnd(widths[i]).slice(0, widths[i])).join(" ");
  }
  console.log(row(headers));
  console.log(row(headers.map((_, i) => "─".repeat(widths[i]))));
  for (const r of rows) {
    console.log(
      row([
        r.ticker,
        r.status,
        String(r.id),
        r.symbol ?? "-",
        String(r.exchangeId ?? "-"),
        String(r.typeId ?? "-"),
        r.flags ?? "-",
        r.name ?? "-",
      ])
    );
  }

  const warns = rows.filter((r) => r.status === "WARN").length;
  const missing = rows.filter((r) => r.status === "MISSING").length;
  console.log(`\nTotal: ${rows.length}, OK: ${rows.length - warns - missing}, WARN: ${warns}, MISSING: ${missing}`);
  process.exit(missing > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
