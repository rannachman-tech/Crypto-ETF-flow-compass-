"use client";

const KEY = "efc-etoro:v1";
const EVENT = "efc-etoro-changed";

export type EtoroEnv = "real" | "demo";

export interface EtoroSession {
  apiKey: string;
  userKey: string;
  env: EtoroEnv;
  username: string;
  cid: number;
  connectedAt: string;
}

export function loadEtoroSession(): EtoroSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EtoroSession;
    if (!parsed.apiKey || !parsed.userKey || !parsed.cid) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveEtoroSession(session: EtoroSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(EVENT));
}

export function clearEtoroSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeEtoroSession(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
