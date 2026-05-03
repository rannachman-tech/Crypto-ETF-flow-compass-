"use client";

import { useId } from "react";

interface Props {
  /** -100..+100 */
  score: number;
  /** 30-day history (oldest first), used for the breadcrumb trail along the arc. */
  history: { date: string; smoothedScore: number }[];
}

// Padded viewBox — extra bottom room for the position labels below the arc.
const W = 460;
const H = 300;
const CX = 230;
const CY = 240;
const R = 175;
const NEEDLE_LEN = 158;

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/** score -100..+100 → angle in radians from straight up. ±π/2. */
function scoreToAngle(score: number) {
  const s = clamp(score, -100, 100) / 100;
  return s * (Math.PI / 2);
}

function pointOnArc(angle: number, radius: number) {
  return {
    x: CX + Math.sin(angle) * radius,
    y: CY - Math.cos(angle) * radius,
  };
}

export default function CompassNeedle({ score, history }: Props) {
  const id = useId().replace(/:/g, "");
  const angle = scoreToAngle(score);

  // Arc spans -π/2 to +π/2 (full semicircle).
  const arcStart = pointOnArc(-Math.PI / 2, R);
  const arcEnd = pointOnArc(Math.PI / 2, R);
  const arcPath = `M ${arcStart.x} ${arcStart.y} A ${R} ${R} 0 0 1 ${arcEnd.x} ${arcEnd.y}`;

  // Inner arc (subtle reference).
  const innerR = R - 14;
  const innerStart = pointOnArc(-Math.PI / 2, innerR);
  const innerEnd = pointOnArc(Math.PI / 2, innerR);
  const innerArcPath = `M ${innerStart.x} ${innerStart.y} A ${innerR} ${innerR} 0 0 1 ${innerEnd.x} ${innerEnd.y}`;

  // Tick marks every 25 pts. No text on ticks — labels go around the perimeter.
  const tickScores = [-100, -75, -50, -25, 0, 25, 50, 75, 100];

  // Needle.
  const tip = pointOnArc(angle, NEEDLE_LEN);
  const baseLeft = pointOnArc(angle - Math.PI / 2, 7);
  const baseRight = pointOnArc(angle + Math.PI / 2, 7);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto compass-needle-shadow"
      role="img"
      aria-label={`Risk-on / risk-off compass at ${score.toFixed(0)}`}
    >
      <defs>
        <linearGradient id={`arc-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="rgb(var(--safe))" stopOpacity="0.95" />
          <stop offset="30%"  stopColor="rgb(var(--safe))" stopOpacity="0.30" />
          <stop offset="50%"  stopColor="rgb(var(--neutral))" stopOpacity="0.28" />
          <stop offset="70%"  stopColor="rgb(var(--risk))" stopOpacity="0.30" />
          <stop offset="100%" stopColor="rgb(var(--risk))" stopOpacity="0.95" />
        </linearGradient>
        <radialGradient id={`hub-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgb(var(--surface))" />
          <stop offset="100%" stopColor="rgb(var(--surface-2))" />
        </radialGradient>
        <radialGradient id={`field-${id}`} cx="50%" cy="100%" r="100%">
          <stop offset="0%"   stopColor="rgb(var(--surface-2))" stopOpacity="0.55" />
          <stop offset="100%" stopColor="rgb(var(--surface-2))" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Subtle radial wash beneath the arc */}
      <path
        d={`${arcPath} L ${CX} ${CY} Z`}
        fill={`url(#field-${id})`}
      />

      {/* Outer colored arc */}
      <path
        d={arcPath}
        fill="none"
        stroke={`url(#arc-${id})`}
        strokeWidth="14"
        strokeLinecap="round"
      />

      {/* Inner reference arc */}
      <path
        d={innerArcPath}
        fill="none"
        stroke="rgb(var(--border))"
        strokeWidth="1"
        opacity={0.55}
      />

      {/* Tick marks — no inline text labels */}
      {tickScores.map((s) => {
        const a = scoreToAngle(s);
        const isMajor = s % 50 === 0;
        const outer = pointOnArc(a, R + 5);
        const inner = pointOnArc(a, isMajor ? R - 22 : R - 16);
        return (
          <line
            key={s}
            x1={outer.x}
            y1={outer.y}
            x2={inner.x}
            y2={inner.y}
            stroke={isMajor ? "rgb(var(--fg-subtle))" : "rgb(var(--border-strong))"}
            strokeWidth={isMajor ? 1.4 : 1}
            opacity={isMajor ? 0.85 : 0.55}
          />
        );
      })}

      {/* 30-day breadcrumb trail */}
      {history.map((h, i) => {
        const a = scoreToAngle(h.smoothedScore);
        const p = pointOnArc(a, R - 28);
        const fade = (i + 1) / history.length;
        const isToday = i === history.length - 1;
        if (isToday) return null;
        return (
          <circle
            key={h.date + i}
            cx={p.x}
            cy={p.y}
            r={1.5 + fade * 0.7}
            fill="rgb(var(--fg))"
            opacity={0.04 + fade * 0.18}
          />
        );
      })}

      {/* Needle */}
      <polygon
        points={`${tip.x},${tip.y} ${baseLeft.x},${baseLeft.y} ${baseRight.x},${baseRight.y}`}
        fill="rgb(var(--fg))"
        stroke="rgb(var(--fg))"
        strokeLinejoin="round"
        strokeWidth="0.5"
        style={{ transition: "all 600ms cubic-bezier(0.16, 1, 0.3, 1)" }}
      />

      {/* Hub */}
      <circle cx={CX} cy={CY} r="13" fill={`url(#hub-${id})`} stroke="rgb(var(--border-strong))" strokeWidth="1" />
      <circle cx={CX} cy={CY} r="3.5" fill="rgb(var(--fg))" />

      {/* Position labels — three clean labels, no overlap */}
      {/* Top: NEUTRAL */}
      <text
        x={CX}
        y={CY - R - 14}
        textAnchor="middle"
        className="fill-fg-muted"
        style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", fontFamily: "ui-monospace, monospace" }}
      >
        Neutral
      </text>

      {/* Bottom-left: DISTRIBUTION */}
      <text
        x={arcStart.x - 6}
        y={CY + 24}
        textAnchor="start"
        className="fill-safe"
        style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", fontFamily: "ui-monospace, monospace", fontWeight: 600 }}
      >
        Distribution
      </text>

      {/* Bottom-right: ACCUMULATION */}
      <text
        x={arcEnd.x + 6}
        y={CY + 24}
        textAnchor="end"
        className="fill-risk"
        style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", fontFamily: "ui-monospace, monospace", fontWeight: 600 }}
      >
        Accumulation
      </text>
    </svg>
  );
}
