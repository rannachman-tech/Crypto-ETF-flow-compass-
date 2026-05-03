/* eslint-disable no-console */
// Crypto Flow Compass scraper — Farside Investors only.
// 100% real data, no synthetic fallback.
//
// BTC table: 11 columns (IBIT, FBTC, BITB, ARKB, BTCO, EZBC, BRRR, HODL, BTCW, MSBT, GBTC)
// ETH table:  9 columns (ETHA, ETHB, FETH, ETHW, TETH, ETHV, QETH, EZET, ETHE)
//
// CoinShares Weekly is a Phase 2 source — code stub at the bottom of this file
// for when the scraper is moved to a runtime that can reach blog.coinshares.com.
//
// Run: npm run scrape:flows

import fs from "node:fs/promises";
import path from "node:path";
import type { FlowSnapshot, DailyFlow, SourceHealth } from "../lib/types";
import { TRACKED_TICKERS } from "../lib/tickers";

const FARSIDE_BTC = "https://farside.co.uk/bitcoin-etf-flow-all-data/";
const FARSIDE_ETH = "https://farside.co.uk/ethereum-etf-flow-all-data/";

const TRACKED = new Set(TRACKED_TICKERS.map((t) => t.ticker));

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface ParseResult {
  rows: DailyFlow[];
  lastDate: string | null;
  cols: string[];
  parsedRowCount: number;
}

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, "").trim();
}

function parseDateLike(s: string): string | null {
  const m = s.match(/^(\d{1,2}) (\w{3}) (\d{4})$/);
  if (!m) return null;
  const day = m[1].padStart(2, "0");
  const monthIdx = MONTHS.indexOf(m[2]);
  if (monthIdx < 0) return null;
  return `${m[3]}-${String(monthIdx + 1).padStart(2, "0")}-${day}`;
}

function parseFlowValue(s: string): number | null {
  s = s.trim();
  if (!s || s === "-") return null;
  const negM = s.match(/^\(([\d.,]+)\)$/);
  if (negM) return -parseFloat(negM[1].replace(/,/g, ""));
  const num = parseFloat(s.replace(/,/g, ""));
  return Number.isFinite(num) ? num : null;
}

function parseFarsideHtml(html: string, ourTickers: Set<string>): ParseResult {
  const tableMatch = html.match(/<table class="etf">([\s\S]*?)<\/table>/);
  if (!tableMatch) throw new Error("Could not locate <table class=\"etf\">");
  const table = tableMatch[1];

  const theadMatch = table.match(/<thead>([\s\S]*?)<\/thead>/);
  if (!theadMatch) throw new Error("Could not locate <thead>");
  const headers: string[] = [];
  for (const m of theadMatch[1].matchAll(/<span class="tabletext">([^<]+)<\/span>/g)) {
    headers.push(m[1].trim());
  }
  if (headers.length < 3) throw new Error(`Header row too short: ${headers.length} cells`);
  const tickerCols = headers.slice(1, -1);

  const tbodyMatch = table.match(/<tbody>([\s\S]*?)<\/tbody>/);
  if (!tbodyMatch) throw new Error("Could not locate <tbody>");
  const tbody = tbodyMatch[1];

  const rows: DailyFlow[] = [];
  let lastDate: string | null = null;
  let parsedRowCount = 0;

  for (const trM of tbody.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const tds: string[] = [];
    for (const tdM of trM[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)) tds.push(tdM[1]);
    if (!tds.length) continue;

    const isoDate = parseDateLike(stripTags(tds[0]));
    if (!isoDate) continue;
    parsedRowCount++;
    if (!lastDate || isoDate > lastDate) lastDate = isoDate;

    for (let i = 1; i < tds.length - 1; i++) {
      const tickerName = tickerCols[i - 1];
      if (!tickerName || !ourTickers.has(tickerName)) continue;
      const val = parseFlowValue(stripTags(tds[i]));
      if (val === null) continue;
      rows.push({ date: isoDate, ticker: tickerName, netFlowUsdM: val });
    }
  }

  return { rows, lastDate, cols: tickerCols, parsedRowCount };
}

async function fetchFarside(url: string, ourTickers: Set<string>): Promise<ParseResult> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "etf-flow-compass/1.0 (+https://etf-flow-compass.vercel.app)",
      Accept: "text/html,application/xhtml+xml",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  const html = await res.text();
  return parseFarsideHtml(html, ourTickers);
}

async function main() {
  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
  const file = path.join(dataDir, "etf-flows.json");

  const sourceHealth: SourceHealth[] = [];
  const allRows: DailyFlow[] = [];
  let asOf = "1970-01-01";
  const now = new Date().toISOString();

  // ── Farside BTC ──
  try {
    const r = await fetchFarside(FARSIDE_BTC, TRACKED);
    allRows.push(...r.rows);
    if (r.lastDate && r.lastDate > asOf) asOf = r.lastDate;
    sourceHealth.push({
      source: "Farside Investors — BTC spot ETF flows",
      status: "ok",
      lastSeen: now,
      note: `Parsed ${r.parsedRowCount} dates × ${r.cols.length} tickers; kept ${r.rows.length} rows.`,
    });
    console.log(`BTC: ${r.parsedRowCount} dates × ${r.cols.length} cols; ${r.rows.length} rows extracted; lastDate=${r.lastDate}`);
  } catch (e: any) {
    sourceHealth.push({
      source: "Farside Investors — BTC spot ETF flows",
      status: "down",
      lastSeen: null,
      note: `Scrape failed: ${e?.message?.slice(0, 140)}`,
    });
    console.error(`BTC scrape failed: ${e?.message}`);
  }

  // ── Farside ETH ──
  try {
    const r = await fetchFarside(FARSIDE_ETH, TRACKED);
    allRows.push(...r.rows);
    if (r.lastDate && r.lastDate > asOf) asOf = r.lastDate;
    sourceHealth.push({
      source: "Farside Investors — ETH spot ETF flows",
      status: "ok",
      lastSeen: now,
      note: `Parsed ${r.parsedRowCount} dates × ${r.cols.length} tickers; kept ${r.rows.length} rows.`,
    });
    console.log(`ETH: ${r.parsedRowCount} dates × ${r.cols.length} cols; ${r.rows.length} rows extracted; lastDate=${r.lastDate}`);
  } catch (e: any) {
    sourceHealth.push({
      source: "Farside Investors — ETH spot ETF flows",
      status: "down",
      lastSeen: null,
      note: `Scrape failed: ${e?.message?.slice(0, 140)}`,
    });
    console.error(`ETH scrape failed: ${e?.message}`);
  }

  // Phase 2 — CoinShares Weekly Asset Flows. Status surfaced honestly.
  sourceHealth.push({
    source: "CoinShares Weekly Asset Flows (altcoins + global)",
    status: "down",
    lastSeen: null,
    note: "Phase 2 source — scraper not yet wired. Will add Solana, XRP, ADA, LINK flow data + multi-region crypto ETP coverage when wired.",
  });

  if (!allRows.length) {
    console.error("No rows scraped from any source — aborting write to avoid clobbering prior data.");
    process.exit(1);
    return;
  }

  // 90-day window trim.
  const dates = Array.from(new Set(allRows.map((f) => f.date))).sort();
  const last90 = new Set(dates.slice(-90));
  const trimmed = allRows.filter((f) => last90.has(f.date));

  const updated: FlowSnapshot = {
    generatedAt: now,
    asOf,
    windowDays: last90.size,
    flows: trimmed,
    sourceHealth,
  };

  await fs.writeFile(file, JSON.stringify(updated, null, 2));
  console.log(`\nWrote ${file}`);
  console.log(`  asOf:    ${asOf}`);
  console.log(`  rows:    ${trimmed.length} (across ${last90.size} dates)`);
  console.log(`  health:  ${sourceHealth.map((s) => `${s.source.split("—")[0].trim()}=${s.status}`).join(" · ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
