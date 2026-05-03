import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE = "https://public-api.etoro.com/api/v1";

interface BasketLeg {
  ticker: string;
  amount: number;
  instrumentId: number;
}

interface TradeBody {
  apiKey?: string;
  userKey?: string;
  env?: "real" | "demo";
  basket?: BasketLeg[];
}

function authHeaders(apiKey: string, userKey: string) {
  return {
    "x-request-id": crypto.randomUUID(),
    "x-api-key": apiKey,
    "x-user-key": userKey,
    "Content-Type": "application/json",
    accept: "application/json",
  } as Record<string, string>;
}

async function placeLeg(
  apiKey: string,
  userKey: string,
  env: "real" | "demo",
  leg: BasketLeg
): Promise<{ ticker: string; ok: boolean; orderId?: number; error?: string }> {
  const path = env === "demo" ? "/trading/execution/demo/market-open-orders/by-amount" : "/trading/execution/market-open-orders/by-amount";
  const body = {
    InstrumentID: leg.instrumentId,
    IsBuy: true,
    Leverage: 1,
    Amount: Math.round(leg.amount * 100) / 100,
    IsNoStopLoss: true,
    IsNoTakeProfit: true,
    IsTslEnabled: true,
  };
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: authHeaders(apiKey, userKey),
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return { ticker: leg.ticker, ok: false, error: "Network error reaching eToro" };
  }
  let parsed: any = null;
  const text = await res.text();
  try { parsed = JSON.parse(text); } catch {}
  if (!res.ok) {
    const errMsg = parsed?.message ?? parsed?.error ?? text?.slice(0, 200) ?? `HTTP ${res.status}`;
    return { ticker: leg.ticker, ok: false, error: String(errMsg) };
  }
  // Working response shape: { orderForOpen: { orderID } }
  const orderId: number | undefined = parsed?.orderForOpen?.orderID ?? parsed?.OrderID ?? parsed?.orderID;
  return { ticker: leg.ticker, ok: true, orderId };
}

export async function POST(request: Request) {
  let body: TradeBody;
  try {
    body = (await request.json()) as TradeBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  const apiKey = (body.apiKey || "").trim();
  const userKey = (body.userKey || "").trim();
  const env = body.env === "real" ? "real" : "demo";
  const basket = (body.basket || []).filter((l) => l && l.instrumentId > 0 && l.amount > 0);
  if (!apiKey || !userKey) {
    return NextResponse.json({ ok: false, error: "Missing eToro credentials" }, { status: 400 });
  }
  if (!basket.length) {
    return NextResponse.json({ ok: false, error: "Empty basket" }, { status: 400 });
  }

  const results: Awaited<ReturnType<typeof placeLeg>>[] = [];
  for (const leg of basket) {
    // Place sequentially so per-leg errors are clean. Also, eToro recommends one-at-a-time.
    const r = await placeLeg(apiKey, userKey, env, leg);
    results.push(r);
  }

  const allOk = results.every((r) => r.ok);
  return NextResponse.json({ ok: allOk, results });
}
