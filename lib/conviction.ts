import type { ConvictionReading, FlowPhase } from "./types";

/**
 * Conviction scoring — converts raw flow noise into a signal a retail user can act on.
 *
 * Three components, each 0..1:
 *   streak    — days of consecutive same-direction flow (cap at 14d for max)
 *   magnitude — today's flow magnitude vs 30-day avg (cap at 3x)
 *   breadth   — fraction of contributing tickers flowing the same direction
 *
 * Composite: streak * 0.4 + magnitude * 0.4 + breadth * 0.2, scaled to 0..100.
 * Direction sign preserved separately so themes flowing OUT are scored too.
 */
export function convictionFromSeries(series: number[]): ConvictionReading {
  if (!series.length) return zeroReading();
  const today = series[series.length - 1];
  const last30 = series.slice(-30);
  const absAvg30 = last30.reduce((s, v) => s + Math.abs(v), 0) / Math.max(1, last30.length);

  let streakDays = 0;
  if (today === 0) {
    streakDays = 0;
  } else {
    const sign = Math.sign(today);
    for (let i = series.length - 1; i >= 0; i--) {
      if (Math.sign(series[i]) === sign) streakDays++;
      else break;
    }
  }

  const direction = absAvg30 === 0 ? 0 : Math.tanh(today / Math.max(absAvg30, 1));
  const streakNorm = Math.min(streakDays / 14, 1);
  const magnitudeRatio = absAvg30 === 0 ? 0 : Math.abs(today) / absAvg30;
  const magNorm = Math.min(magnitudeRatio / 3, 1);

  const score = Math.round((streakNorm * 0.4 + magNorm * 0.4 + 0.2) * 100);
  return { direction, streakDays, magnitudeRatio, breadth: 1, score, label: labelFor(score) };
}

export function convictionFromTickerMatrix(
  rows: { series: number[]; weight: number }[]
): ConvictionReading {
  if (!rows.length) return zeroReading();
  const weightSum = rows.reduce((s, r) => s + r.weight, 0) || 1;

  const length = Math.max(...rows.map((r) => r.series.length));
  const agg: number[] = new Array(length).fill(0);
  rows.forEach((r) => {
    const offset = length - r.series.length;
    r.series.forEach((v, i) => {
      agg[offset + i] += v * (r.weight / weightSum);
    });
  });

  const base = convictionFromSeries(agg);
  const todaySign = Math.sign(agg[agg.length - 1] || 0);
  const sameSign = rows.filter((r) => {
    const last = r.series[r.series.length - 1] ?? 0;
    return todaySign !== 0 && Math.sign(last) === todaySign;
  }).length;
  const breadth = todaySign === 0 ? 0 : sameSign / rows.length;

  const streakNorm = Math.min(base.streakDays / 14, 1);
  const magNorm = Math.min(base.magnitudeRatio / 3, 1);
  const score = Math.round((streakNorm * 0.4 + magNorm * 0.4 + breadth * 0.2) * 100);
  return {
    direction: base.direction,
    streakDays: base.streakDays,
    magnitudeRatio: base.magnitudeRatio,
    breadth,
    score,
    label: labelFor(score),
  };
}

export function labelFor(score: number): ConvictionReading["label"] {
  if (score < 18) return "calm";
  if (score < 38) return "weak";
  if (score < 60) return "building";
  if (score < 80) return "strong";
  return "extreme";
}

function zeroReading(): ConvictionReading {
  return { direction: 0, streakDays: 0, magnitudeRatio: 0, breadth: 0, score: 0, label: "calm" };
}

/** Accumulation/Distribution score boundaries → phase. */
export function phaseFromScore(score: number): FlowPhase {
  if (!Number.isFinite(score)) return "mild_distribution";
  if (score >= 30) return "strong_accumulation";
  if (score >= 0) return "mild_accumulation";
  if (score >= -30) return "mild_distribution";
  return "strong_distribution";
}

export function phaseLabel(phase: FlowPhase): string {
  switch (phase) {
    case "strong_accumulation": return "Strong accumulation";
    case "mild_accumulation":   return "Mild accumulation";
    case "mild_distribution":   return "Mild distribution";
    case "strong_distribution": return "Strong distribution";
  }
}

export function phaseDescription(phase: FlowPhase): string {
  switch (phase) {
    case "strong_accumulation":
      return "Capital is piling into crypto ETFs. Institutions are pressing the accumulation accelerator.";
    case "mild_accumulation":
      return "Mild accumulation bias. Inflows outpacing outflows but not at conviction levels.";
    case "mild_distribution":
      return "Mild distribution bias. Outflows edging out inflows — quiet de-risking.";
    case "strong_distribution":
      return "Capital is exiting crypto ETFs. Institutions are reducing exposure.";
  }
}
