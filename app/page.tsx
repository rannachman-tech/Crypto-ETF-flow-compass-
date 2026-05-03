import fs from "node:fs/promises";
import path from "node:path";
import HomeClient from "@/components/HomeClient";
import type { FlowSnapshot } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function loadSnapshot(): Promise<FlowSnapshot> {
  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
  const file = path.join(dataDir, "etf-flows.json");
  const raw = await fs.readFile(file, "utf8");
  return JSON.parse(raw) as FlowSnapshot;
}

export default async function Page() {
  const snapshot = await loadSnapshot();
  return <HomeClient snapshot={snapshot} />;
}
