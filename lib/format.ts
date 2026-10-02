export type Fmt = "num1" | "num2" | "num3" | "int" | "pct" | "pct1" | "signed1" | "signedpct" | "text" | "rank";

export function fmt(v: unknown, f: Fmt = "num1"): string {
  if (v === null || v === undefined || v === "" || (typeof v === "number" && !Number.isFinite(v))) return "–";
  if (f === "text") return String(v);
  let n = Number(v);
  if (Number.isNaN(n)) return String(v);
  if ((f === "signed1" && Math.abs(n) < 0.05) || (f === "signedpct" && Math.abs(n) < 0.005)) n = 0;
  switch (f) {
    case "int":
      return Math.round(n).toLocaleString("en-US");
    case "num2":
      return n.toFixed(2);
    case "num3":
      return n.toFixed(3).replace(/^0\./, ".").replace(/^-0\./, "-.");
    case "pct":
      return `${Math.round(n * 100)}%`;
    case "pct1":
      return `${(n * 100).toFixed(1)}%`;
    case "signed1":
      return `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(1)}`;
    case "signedpct":
      return `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(Math.round(n * 100))}pp`;
    case "rank":
      return `#${Math.round(n)}`;
    default:
      return n.toFixed(1);
  }
}

export const SIGNAL_META: Record<string, { label: string; tone: "good" | "bad"; icon: string; help: string }> = {
  BUY_LOW: { label: "Buy low", tone: "good", icon: "▲", help: "Usage-based projection well above actual scoring — positive regression expected" },
  SELL_HIGH: { label: "Sell high", tone: "bad", icon: "▼", help: "Scoring well above what usage supports — negative regression expected" },
  RISING: { label: "Role rising", tone: "good", icon: "↗", help: "Snap share +15pp and xFP/g +2 over the last 2 weeks" },
  FALLING: { label: "Role falling", tone: "bad", icon: "↘", help: "Snap share −15pp and xFP/g −2 over the last 2 weeks" },
  OUT_FOR_SEASON: { label: "Out for season", tone: "bad", icon: "✕", help: "Season-ending injury: zero rest-of-season value" },
  INJURED: { label: "Injured", tone: "bad", icon: "✚", help: "Out / IR / doubtful: value scaled by expected games available" },
  ROLE_OPENED: { label: "Role opened", tone: "good", icon: "⤴", help: "Inherits usage vacated by an injured teammate" },
};

export function signalList(s: string | null | undefined): string[] {
  return (s ?? "").split(",").map((x) => x.trim()).filter(Boolean);
}

export const INJURY_LABEL: Record<string, { label: string; level: "critical" | "serious" | "warning" }> = {
  SEASON_ENDING: { label: "Season", level: "critical" },
  INJURY_RESERVE: { label: "IR", level: "critical" },
  PUP: { label: "PUP", level: "critical" },
  OUT: { label: "Out", level: "critical" },
  SUSPENSION: { label: "Susp", level: "critical" },
  DOUBTFUL: { label: "Doubtful", level: "serious" },
  QUESTIONABLE: { label: "Q", level: "warning" },
  DAY_TO_DAY: { label: "DTD", level: "warning" },
};

export function isHurt(status: string | null | undefined): boolean {
  return !!status && ["SEASON_ENDING", "INJURY_RESERVE", "PUP", "OUT", "SUSPENSION", "DOUBTFUL"].includes(status);
}

export function timeAgo(iso?: string | null): string {
  if (!iso) return "never";
  const d = new Date(iso);
  return d.toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) + " ET";
}
