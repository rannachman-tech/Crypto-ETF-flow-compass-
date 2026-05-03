// RegionTabs is reserved for v2 when UCITS / EU crypto-product flows are wired.
// v1 is US-only (Farside data is US-listed BTC + ETH spot ETFs), so this component
// is intentionally not rendered today.
"use client";

import type { RegionId } from "@/lib/types";

interface Props {
  region: RegionId;
  onChange: (r: RegionId) => void;
}

export default function RegionTabs(_props: Props) {
  return null;
}
