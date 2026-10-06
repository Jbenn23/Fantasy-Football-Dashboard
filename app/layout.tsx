import type { Metadata, Viewport } from "next";
import Nav from "@/components/Nav";
import { getMeta } from "@/lib/data";
import { timeAgo } from "@/lib/format";
import "./globals.css";

export const metadata: Metadata = {
  title: "Moneyball FF",
  description: "Usage-based fantasy football decision dashboard",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const meta = getMeta();
  const errs = Object.keys(meta.errors ?? {}).filter((k) => k !== "publish");
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <div className="topbar-inner">
            <div className="brand">Moneyball FF <span>· {meta.league_name ?? "ESPN league"}</span></div>
            <Nav />
            <div className="freshness" title="Last pipeline run">
              {meta.scoring?.label ?? ""}{meta.scoring?.source === "league" ? "" : meta.scoring ? " (default)" : ""} · Week {meta.week ?? "–"} · data thru W{meta.nflverse_last_week ?? "–"} · {timeAgo(meta.run_ts)}
            </div>
          </div>
        </header>
        <main className="shell">
          {meta.sample && (
            <div className="banner" role="status">
              <b>Sample data.</b> NFL metrics are real (nflverse, through week {meta.nflverse_last_week}), but league
              ownership, injuries and Sleeper trends are synthetic until the pipeline's first live ESPN run publishes.
            </div>
          )}
          {errs.length > 0 && (
            <div className="banner err" role="alert">
              <b>Last run had errors:</b> {errs.join(", ")}. Affected sections may be stale — see data/meta.json on the Mac mini.
            </div>
          )}
          {Object.keys(meta.advanced?.stale_sources ?? {}).length > 0 && (
            <div className="banner" role="status">
              <b>Week {meta.advanced?.completed_week} still loading:</b>{" "}
              {Object.entries(meta.advanced?.stale_sources ?? {}).map(([k, v]) => `${k} (thru W${v})`).join(", ")}.
              These usually post 1–2 days after Monday night; the Mac re-runs everything every 90 minutes until they land.
            </div>
          )}
          {children}
        </main>
      </body>
    </html>
  );
}
