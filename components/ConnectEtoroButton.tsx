"use client";

import { useEffect, useState } from "react";
import { Plug, CheckCircle2 } from "lucide-react";
import {
  loadEtoroSession,
  subscribeEtoroSession,
  clearEtoroSession,
  type EtoroSession,
} from "@/lib/etoro-session";
import ConnectEtoroModal from "./ConnectEtoroModal";

interface Props {
  variant?: "header" | "contextual";
}

export default function ConnectEtoroButton({ variant = "header" }: Props) {
  const [session, setSession] = useState<EtoroSession | null>(null);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setSession(loadEtoroSession());
    return subscribeEtoroSession(() => setSession(loadEtoroSession()));
  }, []);

  if (session) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="inline-flex items-center gap-2 px-3 h-9 rounded-md border border-border bg-surface text-xs font-medium hover:border-border-strong transition-colors"
        >
          <span className="relative inline-block w-1.5 h-1.5 rounded-full bg-positive" />
          <span className="text-fg">@{session.username}</span>
          {session.env === "demo" && (
            <span className="rounded-sm bg-warning/15 text-warning px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider">
              Virtual
            </span>
          )}
        </button>
        {menuOpen && (
          <div
            className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-border bg-surface shadow-lg p-2 z-40"
            onMouseLeave={() => setMenuOpen(false)}
          >
            <div className="px-2 py-1.5">
              <div className="text-xs font-medium text-fg">@{session.username}</div>
              <div className="text-[10px] text-fg-subtle">
                Connected · {session.env === "real" ? "Real portfolio" : "Virtual portfolio"}
              </div>
            </div>
            <button
              className="w-full text-left px-2 py-1.5 text-xs text-fg-subtle hover:text-fg hover:bg-surface-2 rounded-md"
              onClick={() => {
                clearEtoroSession();
                setMenuOpen(false);
              }}
            >
              Disconnect
            </button>
          </div>
        )}
        <ConnectEtoroModal open={open} onClose={() => setOpen(false)} />
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          variant === "header"
            ? "inline-flex items-center gap-2 px-3 h-9 rounded-md border border-border bg-surface text-xs font-medium hover:border-border-strong transition-colors"
            : "inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border border-border bg-surface text-sm font-medium hover:border-border-strong transition-colors"
        }
      >
        {session ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-positive" aria-hidden />
        ) : (
          <Plug className="w-3.5 h-3.5" aria-hidden />
        )}
        <span>Connect eToro</span>
      </button>
      <ConnectEtoroModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
