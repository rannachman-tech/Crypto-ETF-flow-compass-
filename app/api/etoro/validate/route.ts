import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE = "https://public-api.etoro.com/api/v1";

interface ValidateBody {
  apiKey?: string;
  userKey?: string;
}

function reqId() {
  return crypto.randomUUID();
}

function authHeaders(apiKey: string, userKey: string) {
  return {
    "x-request-id": reqId(),
    "x-api-key": apiKey,
    "x-user-key": userKey,
    accept: "application/json",
  } as Record<string, string>;
}

export async function POST(request: Request) {
  let body: ValidateBody;
  try {
    body = (await request.json()) as ValidateBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  const apiKey = (body.apiKey || "").trim();
  const userKey = (body.userKey || "").trim();
  if (!apiKey || !userKey) {
    return NextResponse.json({ ok: false, error: "Both API key and Private Key are required" }, { status: 400 });
  }

  // Step 1 — /me
  let meRes: Response;
  try {
    meRes = await fetch(`${BASE}/me`, {
      headers: authHeaders(apiKey, userKey),
      cache: "no-store",
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "Could not reach eToro. Try again in a moment." },
      { status: 502 }
    );
  }
  if (!meRes.ok) {
    return NextResponse.json(
      { ok: false, error: `eToro rejected the credentials (${meRes.status}). Check the keys.` },
      { status: 401 }
    );
  }
  const me = (await meRes.json()) as any;
  const realCid: number | undefined = me?.realCid ?? me?.RealCid;
  if (!realCid) {
    return NextResponse.json(
      { ok: false, error: "Couldn't resolve your eToro user from /me. Try regenerating the key." },
      { status: 500 }
    );
  }

  // Step 2 — /user-info/people?cidList=
  const peopleRes = await fetch(`${BASE}/user-info/people?cidList=${realCid}`, {
    headers: authHeaders(apiKey, userKey),
    cache: "no-store",
  });
  if (!peopleRes.ok) {
    return NextResponse.json(
      { ok: false, error: `eToro user lookup failed (${peopleRes.status}).` },
      { status: 502 }
    );
  }
  const ppl = (await peopleRes.json()) as any;
  // Probe shape variations.
  const profile =
    (Array.isArray(ppl) ? ppl[0] : null) ??
    ppl?.users?.[0] ??
    ppl?.people?.[0] ??
    ppl?.data?.[0] ??
    ppl?.ppl?.[0] ??
    null;
  const username: string | undefined = profile?.username ?? profile?.userName ?? profile?.UserName;
  if (!username) {
    return NextResponse.json(
      { ok: false, error: "Couldn't resolve username from eToro response." },
      { status: 500 }
    );
  }

  // Step 3 — environment auto-detect via /trading/info/portfolio.
  const portfolioRes = await fetch(`${BASE}/trading/info/portfolio`, {
    headers: authHeaders(apiKey, userKey),
    cache: "no-store",
  });
  let env: "real" | "demo" = "demo";
  if (portfolioRes.status === 200) env = "real";
  else if (portfolioRes.status === 401 || portfolioRes.status === 403) env = "demo";

  return NextResponse.json({
    ok: true,
    env,
    username,
    cid: realCid,
  });
}
