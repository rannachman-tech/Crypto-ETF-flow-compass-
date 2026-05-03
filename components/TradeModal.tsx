"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, ArrowLeft, CheckCircle2, XCircle, ShieldAlert, Plug } from "lucide-react";
import type { Basket } from "@/lib/baskets";
import { allocate } from "@/lib/baskets";
import { fmtMoney } from "@/lib/format";
import { loadEtoroSession, type EtoroSession } from "@/lib/etoro-session";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";

interface Props {
  open: boolean;
  onClose: () => void;
  basket: Basket;
}

type Step = "review" | "confirm" | "executing" | "result" | "needs_connect";

const QUICK_AMOUNTS = [100, 500, 1000, 2500];

export default function TradeModal({ open, onClose, basket }: Props) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>("review");
  const [amount, setAmount] = useState(500);
  const [session, setSession] = useState<EtoroSession | null>(null);
  const [results, setResults] = useState<{ ticker: string; ok: boolean; error?: string }[]>([]);
  const [busyError, setBusyError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    setSession(loadEtoroSession());
    setStep(loadEtoroSession() ? "review" : "needs_connect");
    setResults([]);
    setBusyError(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && step !== "executing") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const allocation = useMemo(() => allocate(basket, amount), [basket, amount]);

  if (!open || !mounted) return null;

  async function execute() {
    if (!session) {
      setStep("needs_connect");
      return;
    }
    setStep("executing");
    setBusyError(null);
    try {
      const res = await fetch("/api/etoro/trade-basket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: session.apiKey,
          userKey: session.userKey,
          env: session.env,
          basket: allocation.map((h) => ({
            ticker: h.ticker,
            amount: h.dollars,
            instrumentId: h.instrumentId,
          })),
        }),
      });
      const data = await res.json();
      setResults(data.results || []);
      if (!res.ok && data.error) setBusyError(data.error);
      setStep("result");
    } catch (e: any) {
      setBusyError(e?.message || "Network error");
      setStep("result");
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-fg/40 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="trade-modal-title"
        className="relative w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl max-h-[90vh] flex flex-col"
      >
        <button
          type="button"
          onClick={() => step !== "executing" && onClose()}
          aria-label="Close"
          className="absolute top-3 right-3 p-1.5 rounded-md text-fg-subtle hover:text-fg hover:bg-surface-2 transition-colors"
          disabled={step === "executing"}
        >
          <X className="w-4 h-4" aria-hidden />
        </button>

        <div className="p-5 sm:p-6 overflow-y-auto">
          {step === "needs_connect" && <NeedsConnectStep onClose={onClose} />}

          {step === "review" && (
            <ReviewStep
              basket={basket}
              amount={amount}
              setAmount={setAmount}
              allocation={allocation}
              onNext={() => setStep("confirm")}
              session={session}
            />
          )}

          {step === "confirm" && (
            <ConfirmStep
              basket={basket}
              amount={amount}
              allocation={allocation}
              session={session}
              onBack={() => setStep("review")}
              onConfirm={execute}
            />
          )}

          {step === "executing" && <ExecutingStep />}

          {step === "result" && (
            <ResultStep
              results={results}
              error={busyError}
              onClose={onClose}
              onRetry={() => setStep("review")}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function NeedsConnectStep({ onClose }: { onClose: () => void }) {
  return (
    <div className="text-center py-4">
      <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center">
        <Plug className="w-5 h-5 text-accent" aria-hidden />
      </div>
      <h2 id="trade-modal-title" className="mt-4 text-lg font-semibold">Connect eToro to continue</h2>
      <p className="mt-1 text-sm text-fg-subtle leading-snug max-w-sm mx-auto">
        You need to link your eToro Public API Key + Private Key before placing trades. Click the Connect button in the header.
      </p>
      <button
        type="button"
        onClick={onClose}
        className="mt-5 px-4 py-2 text-sm rounded-md border border-border text-fg-subtle hover:text-fg hover:border-border-strong transition-colors"
      >
        Got it
      </button>
    </div>
  );
}

function ReviewStep({
  basket,
  amount,
  setAmount,
  allocation,
  onNext,
  session,
}: {
  basket: Basket;
  amount: number;
  setAmount: (n: number) => void;
  allocation: ReturnType<typeof allocate>;
  onNext: () => void;
  session: EtoroSession | null;
}) {
  return (
    <>
      <h2 id="trade-modal-title" className="text-lg font-semibold">{basket.title}</h2>
      <p className="mt-1 text-sm text-fg-subtle leading-relaxed">{basket.thesis}</p>

      <div className="mt-5">
        <label className="block text-xs font-mono uppercase tracking-wider text-fg-subtle mb-2">
          Amount (USD)
        </label>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-semibold tabular-nums">$</span>
          <input
            type="number"
            min={50}
            step={50}
            value={amount}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
            className="flex-1 px-3 py-2 rounded-md border border-border bg-surface-2 text-2xl font-semibold tabular-nums focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {QUICK_AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAmount(a)}
              className={
                "px-2.5 py-1 text-xs rounded-md border transition-colors " +
                (amount === a
                  ? "border-fg bg-fg text-bg"
                  : "border-border text-fg-subtle hover:text-fg hover:border-border-strong")
              }
            >
              {fmtMoney(a)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-xs font-mono uppercase tracking-wider text-fg-subtle mb-2">Allocation</h3>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-[10px] font-mono uppercase tracking-wider text-fg-subtle">
              <tr>
                <th className="text-left px-3 py-2">Ticker</th>
                <th className="text-left px-3 py-2 hidden sm:table-cell">Name</th>
                <th className="text-right px-3 py-2">Weight</th>
                <th className="text-right px-3 py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {allocation.map((h) => (
                <tr key={h.ticker} className="border-t border-border">
                  <td className="px-3 py-2 font-mono font-medium">{h.ticker}</td>
                  <td className="px-3 py-2 text-fg-subtle text-xs hidden sm:table-cell">{h.name}</td>
                  <td className="px-3 py-2 text-right text-fg-subtle tabular-nums">{h.weight}%</td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums">{fmtMoney(h.dollars)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {session?.env === "real" && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-negative/40 bg-negative/5 px-3 py-2 text-xs text-negative">
          <ShieldAlert className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" aria-hidden />
          <p>
            <span className="font-medium">Real-money mode.</span> Confirming will execute live trades on your eToro account.
          </p>
        </div>
      )}

      <button
        type="button"
        disabled={amount < 50}
        onClick={onNext}
        className="mt-5 w-full px-4 py-2.5 rounded-md bg-fg text-bg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        Continue
      </button>
      <p className="mt-2 text-[10px] text-fg-muted leading-snug text-center">
        Minimum $50. Make sure you have the required funds available in your account.
      </p>
    </>
  );
}

function ConfirmStep({
  basket,
  amount,
  allocation,
  session,
  onBack,
  onConfirm,
}: {
  basket: Basket;
  amount: number;
  allocation: ReturnType<typeof allocate>;
  session: EtoroSession | null;
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <>
      <h2 id="trade-modal-title" className="text-lg font-semibold">Confirm trade</h2>
      <p className="mt-1 text-sm text-fg-subtle">
        {basket.title} · {fmtMoney(amount)} total
      </p>

      <div className="mt-4 rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {allocation.map((h) => (
              <tr key={h.ticker} className="border-b last:border-b-0 border-border">
                <td className="px-3 py-2 font-mono font-medium">{h.ticker}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmtMoney(h.dollars)}</td>
              </tr>
            ))}
            <tr className="bg-surface-2 font-medium">
              <td className="px-3 py-2">Total</td>
              <td className="px-3 py-2 text-right tabular-nums">{fmtMoney(amount)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-fg-subtle leading-snug">
        Make sure you have the required funds available in your account. eToro will reject any leg without sufficient balance.
      </p>

      {session?.env === "real" && (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-negative/40 bg-negative/5 px-3 py-2 text-xs text-negative">
          <ShieldAlert className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" aria-hidden />
          <p>
            <span className="font-medium">Real-money mode.</span> This will execute against @{session.username}'s live account.
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-md border border-border text-fg-subtle hover:text-fg hover:border-border-strong transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
          Back
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="px-4 py-2 text-sm rounded-md bg-fg text-bg font-medium hover:opacity-90 transition-opacity"
        >
          Execute trade
        </button>
      </div>
    </>
  );
}

function ExecutingStep() {
  return (
    <div className="text-center py-8">
      <Loader2 className="w-6 h-6 mx-auto animate-spin text-accent" aria-hidden />
      <p className="mt-3 text-sm font-medium">Placing your trades…</p>
      <p className="mt-1 text-xs text-fg-subtle">Don't close this window.</p>
    </div>
  );
}

function ResultStep({
  results,
  error,
  onClose,
  onRetry,
}: {
  results: { ticker: string; ok: boolean; error?: string }[];
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
}) {
  const allOk = results.length > 0 && results.every((r) => r.ok);
  const anyOk = results.some((r) => r.ok);
  return (
    <>
      <h2 id="trade-modal-title" className="text-lg font-semibold">
        {allOk ? "Trades placed" : anyOk ? "Partially placed" : "Trade failed"}
      </h2>
      <p className="mt-1 text-sm text-fg-subtle">
        {allOk
          ? "All legs accepted by eToro. Positions will appear in your portfolio shortly."
          : anyOk
          ? "Some legs failed — see the breakdown below."
          : error || "eToro rejected the order."}
      </p>

      {results.length > 0 && (
        <div className="mt-4 rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {results.map((r) => (
                <tr key={r.ticker} className="border-b last:border-b-0 border-border">
                  <td className="px-3 py-2 font-mono font-medium">{r.ticker}</td>
                  <td className="px-3 py-2">
                    {r.ok ? (
                      <span className="inline-flex items-center gap-1.5 text-positive text-xs font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden /> Accepted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-negative text-xs font-medium">
                        <XCircle className="w-3.5 h-3.5" aria-hidden /> Failed
                      </span>
                    )}
                  </td>
                  {r.error && (
                    <td className="px-3 py-2 text-right text-[10px] text-fg-muted truncate max-w-[200px]">
                      {r.error}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-fg-subtle leading-snug">
        Funds must be available in your eToro account for these orders to fill. If your balance is insufficient, eToro will reject the trades.
      </p>

      <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
        {!allOk && (
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 text-sm rounded-md border border-border text-fg-subtle hover:text-fg hover:border-border-strong transition-colors"
          >
            Try again
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm rounded-md bg-fg text-bg font-medium hover:opacity-90 transition-opacity"
        >
          Close
        </button>
      </div>
    </>
  );
}
