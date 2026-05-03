/* eslint-disable no-console */
// Comprehensive basket simulator — 9 sections.
// Run: npm run simulate:baskets

import { BASKETS, basketFor, allocate, allHoldings, type Basket } from "../lib/baskets";
import type { FlowPhase, RegionId } from "../lib/types";
import { phaseFromScore } from "../lib/conviction";

const REGIONS: RegionId[] = ["us"];
const PHASES: FlowPhase[] = ["strong_accumulation", "mild_accumulation", "mild_distribution", "strong_distribution"];

const CATALOG_URL = "https://api.etorostatic.com/sapi/instrumentsmetadata/V1.1/instruments";

let failures = 0;
function fail(msg: string) { console.log(`  X  ${msg}`); failures++; }
function ok(msg: string) { console.log(`  OK ${msg}`); }
function section(n: number, title: string) { console.log(`\n[${n}] ${title}`); }

async function main() {
  // 1. coverage
  section(1, "Coverage — every (region × phase) has a basket");
  for (const r of REGIONS) {
    for (const p of PHASES) {
      const b = BASKETS[r][p];
      if (!b) fail(`Missing basket for ${r}/${p}`);
      else ok(`${r}/${p} present (${b.holdings.length} holdings)`);
    }
  }

  // 2. invariants
  section(2, "Invariants — weights sum to 100, IDs > 0, no dups, no empties");
  for (const r of REGIONS) {
    for (const p of PHASES) {
      const b = BASKETS[r][p];
      const sum = b.holdings.reduce((s, h) => s + h.weight, 0);
      if (Math.abs(sum - 100) > 0.01) fail(`${r}/${p} weights sum to ${sum} (≠100)`);
      // Crypto-only universe — strong accumulation is intentionally just BTC + ETH (we don't
      // have flow data on altcoins yet so we won't recommend them). 2 is the floor.
      if (b.holdings.length < 2) fail(`${r}/${p} has <2 holdings`);
      if (b.holdings.length > 10) fail(`${r}/${p} has >10 holdings`);
      const ids = b.holdings.map((h) => h.instrumentId);
      if (new Set(ids).size !== ids.length) fail(`${r}/${p} has duplicate instrumentId`);
      if (b.holdings.some((h) => h.instrumentId <= 0)) fail(`${r}/${p} has zero/negative instrumentId`);
      if (b.holdings.some((h) => h.weight > 60)) fail(`${r}/${p} has a holding >60% (concentration)`);
      ok(`${r}/${p} weights=100, n=${b.holdings.length}`);
    }
  }

  // 3. field consistency
  section(3, "Field consistency — basket.region/phase match BASKETS keys");
  for (const r of REGIONS) {
    for (const p of PHASES) {
      const b = BASKETS[r][p];
      if (b.region !== r) fail(`${r}/${p} basket.region=${b.region}`);
      if (b.phase !== p) fail(`${r}/${p} basket.phase=${b.phase}`);
      ok(`${r}/${p} consistent`);
    }
  }

  // 4. phaseFromScore edge cases
  section(4, "phaseFromScore edge cases");
  const cases: Array<[number, FlowPhase]> = [
    [-200, "strong_distribution"], [-100, "strong_distribution"], [-31, "strong_distribution"], [-30.001, "strong_distribution"],
    [-30, "mild_distribution"], [-15, "mild_distribution"], [-0.0001, "mild_distribution"],
    [0, "mild_accumulation"], [0.0001, "mild_accumulation"], [15, "mild_accumulation"], [29.999, "mild_accumulation"],
    [30, "strong_accumulation"], [50, "strong_accumulation"], [99.99, "strong_accumulation"], [100, "strong_accumulation"], [200, "strong_accumulation"],
    [Number.NaN, "mild_distribution"],
  ];
  for (const [score, expected] of cases) {
    const actual = phaseFromScore(score);
    if (actual !== expected) fail(`phaseFromScore(${score}) = ${actual}, expected ${expected}`);
    else ok(`phaseFromScore(${score}) → ${actual}`);
  }

  // 5. routing matrix
  section(5, "Routing matrix — phaseFromScore(score) → basketFor(phase, region)");
  for (const r of REGIONS) {
    for (const score of [-95, -45, -15, 5, 25, 55, 95]) {
      const p = phaseFromScore(score);
      const b = basketFor(p, r);
      if (b.region !== r || b.phase !== p) fail(`Routing mismatch r=${r} score=${score}`);
      else ok(`r=${r} score=${score} → ${p} basket present`);
    }
  }

  // 6. allocation math
  section(6, "Allocation math");
  const amounts = [50, 100, 333, 999.99, 1000, 10000, 100000];
  for (const r of REGIONS) {
    for (const p of PHASES) {
      for (const a of amounts) {
        const alloc = allocate(BASKETS[r][p], a);
        const total = alloc.reduce((s, h) => s + h.dollars, 0);
        if (Math.abs(total - a) > 0.5) fail(`${r}/${p} amount=${a} → total=${total} (drift)`);
      }
    }
  }
  ok(`All ${REGIONS.length * PHASES.length * amounts.length} allocation cases within $0.50`);

  // 7. cross-basket consistency
  section(7, "Cross-basket consistency — instrumentId ↔ symbolFull is 1:1");
  const idToSym = new Map<number, string>();
  const symToId = new Map<string, number>();
  for (const h of allHoldings()) {
    if (idToSym.has(h.instrumentId) && idToSym.get(h.instrumentId) !== h.symbolFull) {
      fail(`InstrumentID ${h.instrumentId} maps to multiple symbols`);
    } else idToSym.set(h.instrumentId, h.symbolFull);
    if (symToId.has(h.symbolFull) && symToId.get(h.symbolFull) !== h.instrumentId) {
      fail(`Symbol ${h.symbolFull} maps to multiple IDs`);
    } else symToId.set(h.symbolFull, h.instrumentId);
  }
  ok(`No id↔symbol drift across baskets (${idToSym.size} unique instruments)`);

  // 8. live catalog cross-check
  section(8, "Live catalog cross-check — every instrumentId resolves on eToro public catalog");
  try {
    const res = await fetch(CATALOG_URL);
    if (!res.ok) fail(`Catalog HTTP ${res.status}`);
    else {
      const json = (await res.json()) as { InstrumentDisplayDatas: { InstrumentID: number; SymbolFull: string }[] };
      const cat = new Map(json.InstrumentDisplayDatas.map((e) => [e.InstrumentID, e]));
      let unresolved = 0;
      for (const [id, sym] of idToSym.entries()) {
        const e = cat.get(id);
        if (!e) { fail(`id=${id} (${sym}) not in catalog`); unresolved++; }
        else if (e.SymbolFull.toUpperCase() !== sym.toUpperCase()) {
          fail(`id=${id} catalog symbol drift: catalog="${e.SymbolFull}" basket="${sym}"`);
          unresolved++;
        }
      }
      if (unresolved === 0) ok(`All ${idToSym.size} instruments resolve in catalog`);
    }
  } catch (e: any) {
    fail(`Catalog fetch error: ${e?.message}`);
  }

  // 9. defensive properties
  section(9, "Defensive properties — concentration, sane sizes");
  for (const r of REGIONS) {
    for (const p of PHASES) {
      const b: Basket = BASKETS[r][p];
      const max = Math.max(...b.holdings.map((h) => h.weight));
      const min = Math.min(...b.holdings.map((h) => h.weight));
      if (min < 5) fail(`${r}/${p} has a holding with weight <5% (${min}%)`);
      // For 2-holding crypto baskets, single-asset weight up to 60% is acceptable.
      // For larger baskets, no single asset >55%.
      const concentrationLimit = b.holdings.length <= 2 ? 60 : 55;
      if (max > concentrationLimit) fail(`${r}/${p} concentration breach: ${max}% (limit ${concentrationLimit}% for n=${b.holdings.length})`);
      if (b.holdings.length > 8) fail(`${r}/${p} has >8 holdings — basket too sprawling`);
      ok(`${r}/${p} weights ${min}%..${max}%, n=${b.holdings.length}`);
    }
  }

  console.log(`\n${failures === 0 ? "✓ All checks passed" : `✗ ${failures} failures`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => { console.error(err); process.exit(1); });
