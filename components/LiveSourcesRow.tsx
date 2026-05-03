"use client";

import { useEffect, useState } from "react";
import type { SourceHealth } from "@/lib/types";
import { fmtRelative } from "@/lib/format";

interface Props {
  generatedAt: string;
  health: SourceHealth[];
}

export default function LiveSourcesRow({ generatedAt, health }: Props) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const anyDown = health.some((h) => h.status === "down");
  const anyStale = health.some((h) => h.status === "stale");
  const overall: "ok" | "stale" | "down" = anyDown ? "down" : anyStale ? "stale" : "ok";

  const dotClass =
    overall === "ok"
      ? "bg-positive text-positive"
      : overall === "stale"
      ? "bg-warning text-warning"
      : "bg-negative text-negative";

  return (
    <div className="group relative flex items-center gap-2 text-[11px] text-fg-subtle">
      <span className="relative inline-block w-2 h-2">
        <span className={`absolute inset-0 rounded-full pulse-dot ${dotClass}`} />
      </span>
      <span className="font-mono uppercase tracking-wider">
        {overall === "ok" ? "Live" : overall === "stale" ? "Partial" : "Degraded"}
      </span>
      <span aria-hidden>·</span>
      <span className="tabular-nums">updated {fmtRelative(generatedAt)}</span>
      <div
        role="tooltip"
        className="absolute right-0 top-full mt-2 w-[280px] sm:w-[320px] rounded-lg border border-border bg-surface shadow-lg p-3 text-xs opacity-0 pointer-events-none translate-y-1 transition-all group-hover:opacity-100 group-hover:translate-y-0 z-40"
      >
        <div className="font-medium text-fg mb-2">Source health</div>
        <ul className="space-y-1.5">
          {health.map((h) => (
            <li key={h.source} className="flex items-start gap-2">
              <span
                className={
                  "mt-1 inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 " +
                  (h.status === "ok"
                    ? "bg-positive"
                    : h.status === "stale"
                    ? "bg-warning"
                    : "bg-negative")
                }
              />
              <span className="flex-1">
                <span className="block text-fg">{h.source}</span>
                {h.note && <span className="block text-fg-muted text-[10px]">{h.note}</span>}
                <span className="block text-fg-subtle text-[10px]">
                  {h.lastSeen ? fmtRelative(h.lastSeen) : "never"}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
