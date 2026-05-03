"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, ExternalLink, ShieldCheck } from "lucide-react";
import { saveEtoroSession } from "@/lib/etoro-session";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ConnectEtoroModal({ open, onClose }: Props) {
  const [apiKey, setApiKey] = useState("");
  const [userKey, setUserKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, busy]);

  if (!open || !mounted) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/etoro/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim(), userKey: userKey.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Validation failed");
      }
      saveEtoroSession({
        apiKey: apiKey.trim(),
        userKey: userKey.trim(),
        env: data.env,
        username: data.username,
        cid: data.cid,
        connectedAt: new Date().toISOString(),
      });
      setApiKey("");
      setUserKey("");
      onClose();
    } catch (err: any) {
      setError(err?.message || "Could not validate credentials. Double-check the keys and try again.");
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-fg/40 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="connect-etoro-title"
        className="relative w-full max-w-md rounded-2xl border border-border bg-surface shadow-2xl"
      >
        <button
          type="button"
          onClick={() => !busy && onClose()}
          aria-label="Close"
          className="absolute top-3 right-3 p-1.5 rounded-md text-fg-subtle hover:text-fg hover:bg-surface-2 transition-colors"
        >
          <X className="w-4 h-4" aria-hidden />
        </button>

        <div className="p-5 sm:p-6">
          <h2 id="connect-etoro-title" className="text-lg font-semibold">
            Connect eToro
          </h2>
          <p className="mt-1 text-sm text-fg-subtle leading-snug">
            Paste your Public API Key + Private Key. We auto-detect Real vs Virtual portfolio — no environment toggle needed.
          </p>

          <form onSubmit={submit} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-fg-subtle mb-1.5">
                Public API Key
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={busy}
                autoComplete="off"
                spellCheck={false}
                className="w-full px-3 py-2 rounded-md border border-border bg-surface-2 text-sm font-mono focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-fg-subtle mb-1.5">
                Private Key
              </label>
              <input
                type="password"
                value={userKey}
                onChange={(e) => setUserKey(e.target.value)}
                disabled={busy}
                autoComplete="off"
                spellCheck={false}
                className="w-full px-3 py-2 rounded-md border border-border bg-surface-2 text-sm font-mono focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            {error && (
              <div className="rounded-md border border-negative/40 bg-negative/5 px-3 py-2 text-xs text-negative">
                {error}
              </div>
            )}

            <div className="flex items-center gap-2 text-[11px] text-fg-subtle">
              <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />
              Keys are stored only in your browser (localStorage). They never leave your device except to call the eToro API.
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end pt-1">
              <button
                type="button"
                onClick={() => !busy && onClose()}
                disabled={busy}
                className="px-4 py-2 text-sm rounded-md border border-border text-fg-subtle hover:text-fg hover:border-border-strong transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy || !apiKey || !userKey}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-md bg-fg text-bg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />}
                {busy ? "Validating…" : "Test connection"}
              </button>
            </div>
          </form>

          <details className="mt-5 group">
            <summary className="cursor-pointer text-xs font-medium text-fg-subtle hover:text-fg transition-colors list-none flex items-center gap-1.5">
              <span className="group-open:rotate-90 transition-transform">›</span>
              Where do I get these?
            </summary>
            <div className="mt-3 text-xs text-fg-subtle space-y-2 leading-relaxed">
              <p>
                In eToro, go to <span className="font-medium text-fg">Settings → Trading</span> → Create New Key. Choose Virtual or Real and Read+Write permissions.
              </p>
              <a
                href="https://www.etoro.com/settings/trading"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-accent hover:underline"
              >
                Open eToro settings
                <ExternalLink className="w-3 h-3" aria-hidden />
              </a>
            </div>
          </details>
        </div>
      </div>
    </div>,
    document.body
  );
}
