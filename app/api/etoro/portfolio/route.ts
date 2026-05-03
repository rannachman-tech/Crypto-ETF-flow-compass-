import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE = "https://public-api.etoro.com/api/v1";

interface Body {
  apiKey?: string;
  userKey?: string;
  env?: "real" | "demo";
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const apiKey = (body.apiKey || "").trim();
  const userKey = (body.userKey || "").trim();
  const env = body.env === "real" ? "real" : "demo";
  if (!apiKey || !userKey) {
    return NextResponse.json({ ok: false, error: "Missing credentials" }, { status: 400 });
  }
  const path = env === "demo" ? "/trading/info/demo/portfolio" : "/trading/info/portfolio";
  const reqId = crypto.randomUUID();
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: {
        "x-request-id": reqId,
        "x-api-key": apiKey,
        "x-user-key": userKey,
        accept: "application/json",
      },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not reach eToro" }, { status: 502 });
  }
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: `eToro returned ${res.status}` }, { status: 502 });
  }
  const data = (await res.json()) as any;
  // Shape varies — probe common fields. Positions array keyed by InstrumentID typically.
  const positions: any[] =
    data?.aggregatedPositions ??
    data?.AggregatedPositions ??
    data?.positions ??
    data?.Positions ??
    [];
  const out = positions
    .map((p) => ({
      instrumentId: p.InstrumentID ?? p.instrumentID ?? p.instrumentId,
      direction: p.Direction ?? p.direction,
      amount: p.Amount ?? p.amount ?? p.NetProfit ?? 0,
      units: p.Units ?? p.units ?? 0,
    }))
    .filter((x) => Number.isFinite(x.instrumentId));
  return NextResponse.json({ ok: true, positions: out });
}
