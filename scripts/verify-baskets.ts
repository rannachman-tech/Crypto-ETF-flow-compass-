/* eslint-disable no-console */
// Verify every basket holding's instrumentId resolves in the eToro public catalog
// and SymbolFull matches. No API keys needed — public catalog endpoint.
//
// Run: npm run verify:baskets

import { allHoldings } from "../lib/baskets";

const CATALOG_URL = "https://api.etorostatic.com/sapi/instrumentsmetadata/V1.1/instruments";

interface CatalogEntry {
  InstrumentID: number;
  SymbolFull: string;
  InstrumentDisplayName: string;
  InstrumentTypeID: number;
  IsInternalInstrument?: boolean;
  HasExpirationDate?: boolean;
  ExchangeID?: number;
}

async function main() {
  console.log(`Fetching eToro public catalog…`);
  const res = await fetch(CATALOG_URL);
  if (!res.ok) {
    console.error(`HTTP ${res.status} fetching catalog`);
    process.exit(1);
  }
  const json = (await res.json()) as { InstrumentDisplayDatas: CatalogEntry[] };
  const cat = new Map(json.InstrumentDisplayDatas.map((it) => [it.InstrumentID, it]));
  console.log(`Catalog has ${cat.size} instruments.\n`);

  const fails: string[] = [];
  const warns: string[] = [];
  const seen = new Set<number>();

  for (const h of allHoldings()) {
    if (seen.has(h.instrumentId)) continue;
    seen.add(h.instrumentId);
    const e = cat.get(h.instrumentId);
    if (!e) {
      fails.push(`X ${h.ticker} id=${h.instrumentId} not in catalog`);
      continue;
    }
    if ((e.SymbolFull ?? "").toUpperCase() !== h.symbolFull.toUpperCase()) {
      fails.push(`X ${h.ticker} symbol drift: catalog="${e.SymbolFull}" basket="${h.symbolFull}"`);
      continue;
    }
    if (e.IsInternalInstrument) {
      warns.push(`! ${h.ticker} is flagged IsInternalInstrument — may not be tradeable for retail`);
    }
    if (e.HasExpirationDate) {
      warns.push(`! ${h.ticker} has expiration — review`);
    }
    console.log(`OK ${h.ticker.padEnd(10)} id=${e.InstrumentID} (${e.InstrumentDisplayName})`);
  }

  if (warns.length) {
    console.log(`\n${warns.length} warning(s):`);
    warns.forEach((w) => console.log(w));
  }
  if (fails.length) {
    console.log(`\n${fails.length} failure(s):`);
    fails.forEach((f) => console.log(f));
    process.exit(1);
  }
  console.log(`\nAll baskets verified — ${seen.size} unique instruments.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
