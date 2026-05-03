export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface-2/40 mt-auto">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-6">
        <p className="text-xs text-fg-subtle leading-relaxed max-w-3xl">
          ETF Flow Compass shows institutional ETF net flows. Flows are an indicator, not a recommendation —
          a 12-day inflow streak signals conviction, not certainty. <span className="font-medium text-fg">Not financial advice.</span>{" "}
          Trades placed via the eToro Connect flow execute against your eToro account using the API keys you provide.
          Make sure you have available funds before confirming any trade.
        </p>
      </div>
    </footer>
  );
}
