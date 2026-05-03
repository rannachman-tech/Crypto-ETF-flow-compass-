import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crypto Flow Compass — Where is institutional crypto money flowing?",
  description:
    "Track real institutional flows into BTC and ETH spot ETFs daily. See whether smart money is accumulating or distributing. Built for retail traders. Real data only.",
  metadataBase: new URL("https://etf-flow-compass.vercel.app"),
  openGraph: {
    title: "Crypto Flow Compass",
    description: "Real institutional crypto ETF flow data, daily — accumulation / distribution compass for retail traders.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#08080b" },
  ],
  width: "device-width",
  initialScale: 1,
};

// Theme bootstrap script — must avoid the same-branch ternary trap (gotcha #1).
// On first paint, honor saved preference, otherwise OS prefers-color-scheme.
const themeBootstrap = `
(function () {
  try {
    var saved = localStorage.getItem('efc-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var mode = saved === 'dark' || saved === 'light'
      ? saved
      : (prefersDark ? 'dark' : 'light');
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-screen antialiased font-sans">{children}</body>
    </html>
  );
}
