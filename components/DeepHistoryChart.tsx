"use client";

interface Props {
  history: { date: string; score: number; smoothedScore: number }[];
}

const W = 1200;
const H = 260;
const PADDING = { top: 16, right: 96, bottom: 28, left: 56 };

export default function DeepHistoryChart({ history }: Props) {
  if (!history.length) return null;

  const innerW = W - PADDING.left - PADDING.right;
  const innerH = H - PADDING.top - PADDING.bottom;

  const stepX = innerW / Math.max(1, history.length - 1);
  function yFor(score: number) {
    const t = (score + 100) / 200;
    return PADDING.top + (1 - t) * innerH;
  }

  const rawPath = history
    .map((h, i) => {
      const x = PADDING.left + i * stepX;
      const y = yFor(h.score);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  const smoothedPath = history
    .map((h, i) => {
      const x = PADDING.left + i * stepX;
      const y = yFor(h.smoothedScore);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  const zeroY = yFor(0);

  // Calibration bands with explicit zone labels in the right gutter.
  const bands: { y0: number; y1: number; color: string; opacity: number; label: string; mid: number }[] = [
    { y0: yFor(100), y1: yFor(30),   color: "rgb(var(--positive))", opacity: 0.07, label: "Risk-on",      mid: 65 },
    { y0: yFor(30),  y1: yFor(0),    color: "rgb(var(--positive))", opacity: 0.03, label: "Leaning risk", mid: 15 },
    { y0: yFor(0),   y1: yFor(-30),  color: "rgb(var(--negative))", opacity: 0.03, label: "Leaning safe", mid: -15 },
    { y0: yFor(-30), y1: yFor(-100), color: "rgb(var(--negative))", opacity: 0.07, label: "Risk-off",     mid: -65 },
  ];

  const xTicks = history.filter((_, i) => i % 5 === 0 || i === history.length - 1);

  return (
    <section className="mt-8 sm:mt-10">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-subtle">
            Needle history · 30 days
          </h2>
          <p className="mt-1 text-sm text-fg-subtle max-w-2xl">
            Daily Risk-On / Risk-Off score. The score is a unitless index from <span className="tabular-nums font-medium text-fg">−100</span> (every dollar going to safety) to <span className="tabular-nums font-medium text-fg">+100</span> (every dollar going to risk). It's the net tilt of today's flows: <span className="font-mono text-[11px]">(risk inflows − safe inflows) ÷ (|risk| + |safe|) × 100</span>.
        </p>
        </div>
        <Legend />
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-surface p-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="30-day Risk-On / Risk-Off needle history with calibration zones">
          {bands.map((b, i) => (
            <g key={i}>
              <rect
                x={PADDING.left}
                y={b.y0}
                width={innerW}
                height={b.y1 - b.y0}
                fill={b.color}
                opacity={b.opacity}
              />
              {/* Zone label in the right gutter */}
              <text
                x={PADDING.left + innerW + 8}
                y={yFor(b.mid)}
                textAnchor="start"
                dominantBaseline="middle"
                className="fill-fg-muted"
                style={{ fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "ui-monospace, monospace" }}
              >
                {b.label}
              </text>
            </g>
          ))}

          {/* Zero line */}
          <line
            x1={PADDING.left}
            x2={PADDING.left + innerW}
            y1={zeroY}
            y2={zeroY}
            stroke="rgb(var(--border-strong))"
            strokeWidth={1}
            strokeDasharray="3 3"
          />

          {/* Y axis title (rotated) */}
          <text
            x={-H / 2}
            y={16}
            transform="rotate(-90)"
            textAnchor="middle"
            className="fill-fg-muted"
            style={{ fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "ui-monospace, monospace" }}
          >
            RoRo score · index
          </text>

          {/* Y axis labels */}
          {[100, 50, 0, -50, -100].map((s) => (
            <g key={s}>
              <line
                x1={PADDING.left - 4}
                x2={PADDING.left}
                y1={yFor(s)}
                y2={yFor(s)}
                stroke="rgb(var(--border-strong))"
                strokeWidth={1}
              />
              <text
                x={PADDING.left - 8}
                y={yFor(s)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-fg-muted tabular-nums"
                style={{ fontSize: "10px", fontFamily: "ui-monospace, monospace" }}
              >
                {s > 0 ? `+${s}` : s}
              </text>
            </g>
          ))}

          {/* X axis labels */}
          {xTicks.map((t, i) => {
            const trueIdx = history.indexOf(t);
            const x = PADDING.left + trueIdx * stepX;
            const d = new Date(t.date + "T00:00:00Z");
            const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
            return (
              <g key={i}>
                <line
                  x1={x}
                  x2={x}
                  y1={H - PADDING.bottom}
                  y2={H - PADDING.bottom + 4}
                  stroke="rgb(var(--border-strong))"
                />
                <text
                  x={x}
                  y={H - PADDING.bottom + 16}
                  textAnchor="middle"
                  className="fill-fg-muted"
                  style={{ fontSize: "10px", fontFamily: "ui-monospace, monospace" }}
                >
                  {label}
                </text>
              </g>
            );
          })}

          <path d={rawPath} fill="none" stroke="rgb(var(--fg-muted))" strokeWidth={1} opacity={0.45} />
          <path
            d={smoothedPath}
            fill="none"
            stroke="rgb(var(--accent))"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Latest point dot */}
          <circle
            cx={PADDING.left + (history.length - 1) * stepX}
            cy={yFor(history[history.length - 1].smoothedScore)}
            r={3.5}
            fill="rgb(var(--accent))"
            stroke="rgb(var(--bg))"
            strokeWidth={1.5}
          />
        </svg>
      </div>

      <p className="mt-2 text-[11px] text-fg-muted leading-relaxed max-w-3xl">
        Calibration: zones are derived from the score's sign and magnitude — <span className="tabular-nums">±30</span> separates "leaning" from conviction, and the 7-day smoothing dampens single-day rebalances that don't represent regime change.
      </p>
    </section>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-3 text-[11px] text-fg-subtle">
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block w-4 h-0.5 bg-accent rounded" /> 7d smoothed
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block w-4 h-0.5 bg-fg-muted rounded opacity-60" /> daily
      </span>
    </div>
  );
}
