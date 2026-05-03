"use client";

import { Compass } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import ConnectEtoroButton from "./ConnectEtoroButton";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-7 h-7 rounded-full bg-gradient-to-br from-accent/30 to-accent/10 border border-accent/40 flex items-center justify-center flex-shrink-0">
            <Compass className="w-4 h-4 text-accent" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold leading-tight truncate">Crypto Flow Compass</div>
            <div className="text-[11px] text-fg-subtle leading-tight truncate hidden sm:block">
              Where is institutional crypto money flowing?
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ConnectEtoroButton variant="header" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
