import { AlertTriangle } from "lucide-react";

export default function RiskWarning() {
  return (
    <div className="border-b border-border bg-surface-2/60">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-2 flex items-start gap-2 text-[11px] sm:text-xs text-fg-subtle">
        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-warning" aria-hidden />
        <p className="leading-snug">
          <span className="font-medium text-fg">Crypto is highly volatile.</span> Cryptoassets are largely unregulated. You may lose all of your invested capital, and there is limited consumer protection. Past performance is not a guarantee of future results. Crypto Flow Compass is a research tool, not financial advice.
        </p>
      </div>
    </div>
  );
}
