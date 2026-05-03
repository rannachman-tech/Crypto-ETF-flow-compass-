"use client";

interface Props {
  values: number[];
  width?: number;
  height?: number;
  /** "auto" picks color by net direction */
  color?: "auto" | "positive" | "negative" | "neutral";
  className?: string;
}

export default function Sparkline({ values, width = 96, height = 28, color = "auto", className }: Props) {
  if (!values.length) return <div className={className} style={{ width, height }} />;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / Math.max(1, values.length - 1);

  let strokeVar = "rgb(var(--neutral))";
  if (color === "auto") {
    const last = values[values.length - 1];
    const first = values[0];
    if (last > first) strokeVar = "rgb(var(--positive))";
    else if (last < first) strokeVar = "rgb(var(--negative))";
  } else if (color === "positive") strokeVar = "rgb(var(--positive))";
  else if (color === "negative") strokeVar = "rgb(var(--negative))";

  const path = values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * height;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      preserveAspectRatio="none"
      role="presentation"
    >
      <path d={path} stroke={strokeVar} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
