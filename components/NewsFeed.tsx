"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Avail, Injury } from "@/components/Badges";
import { fmt } from "@/lib/format";
import type { Row } from "@/lib/types";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "mine", label: "My team" },
  { key: "rb", label: "RB injuries" },
  { key: "inj", label: "All injuries" },
  { key: "fa", label: "Free agents" },
] as const;
type F = (typeof FILTERS)[number]["key"];

const TAG_TONE: Record<string, string> = {
  "MY TEAM": "mine", "RB INJURY": "bad", SEVERE: "bad", "HANDCUFF AVAILABLE": "good",
  "ROLE UP · FREE AGENT": "good", "YOUR RB'S TEAMMATE": "neutral", CLEARED: "good",
};

function when(iso: string) {
  return new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "2-digit" }) + " ET";
}

export function NewsItem({ n, validIds }: { n: Row; validIds: string[] }) {
  const hasPage = n.gsis_id && validIds.includes(n.gsis_id);
  return (
    <article className={`newsitem${n.tags?.includes("MY TEAM") ? " mine" : n.tags?.includes("RB INJURY") ? " rbinj" : ""}`}>
      <div className="newshead">
        <span className="prio num" title="Priority score 0–100">{Math.round(n.priority)}</span>
        <span className="newsname">
          {hasPage ? <Link className="plink" href={`/players/${n.gsis_id}`}><b>{n.player || n.headline}</b></Link> : <b>{n.player || n.headline}</b>}{" "}
          <span className="pos">{n.position}</span> <span className="muted small">{n.team}</span>{" "}
          <Injury status={n.injury_status} /> {n.status && <Avail status={n.status} team={n.fantasy_team} />}
        </span>
        <span className="small muted newstime">{when(n.published)}</span>
      </div>
      <div className="newsheadline">{n.player ? n.headline : ""}</div>
      <p className="newsblurb">{n.blurb}</p>
      {n.tags?.length > 0 && (
        <div className="chips">{n.tags.map((t: string) => <span key={t} className={`chip ${TAG_TONE[t] ?? "neutral"}`}>{t}</span>)}</div>
      )}
      {n.handcuffs?.length > 0 && (
        <div className="cuffs">
          <div className="small sub">
            Handcuffs (healthy {n.team} RBs){n.vacated_xfp_g ? ` · ${n.player?.split(" ").slice(-1)[0]} has been worth ${fmt(n.vacated_xfp_g)} xFP/g` : ""}
          </div>
          {n.handcuffs.map((h: Row) => (
            <div className="cuffrow" key={h.gsis_id}>
              <span>
                {validIds.includes(h.gsis_id) ? <Link className="plink" href={`/players/${h.gsis_id}`}>{h.name}</Link> : h.name}{" "}
                <Injury status={h.injury_status} />
              </span>
              <Avail status={h.status} team={h.fantasy_team} />
              <span className="small muted num">
                {h.depth_rank != null ? `RB${Math.round(h.depth_rank)}` : "–"} · {fmt(h.xfp_g)} xFP/g · rush {fmt(h.rush_share, "pct")}
                {h.boost_xfp_g != null ? ` · +${fmt(h.boost_xfp_g)} if out` : ""}
                {h.adds_24h ? ` · ${fmt(h.adds_24h, "int")} Sleeper adds` : ""}
              </span>
            </div>
          ))}
        </div>
      )}
      <a className="link small" href={n.link} target="_blank" rel="noopener noreferrer">Full update on RotoWire ↗</a>
    </article>
  );
}

export default function NewsFeed({ rows, validIds }: { rows: Row[]; validIds: string[] }) {
  const [f, setF] = useState<F>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"priority" | "recent">("priority");
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    const out = rows.filter((n) =>
      (f === "all" || (f === "mine" && n.tags?.includes("MY TEAM")) || (f === "rb" && n.tags?.includes("RB INJURY")) ||
        (f === "inj" && (n.injury || n.severe)) || (f === "fa" && n.status === "FA")) &&
      (!s || `${n.title} ${n.blurb} ${n.team}`.toLowerCase().includes(s)));
    return sort === "recent" ? [...out].sort((a, b) => String(b.published).localeCompare(String(a.published))) : out;
  }, [rows, f, q, sort]);
  return (
    <>
      <div className="controls">
        <div className="seg" role="group" aria-label="Filter">
          {FILTERS.map((x) => <button key={x.key} aria-pressed={f === x.key} onClick={() => setF(x.key)}>{x.label}</button>)}
        </div>
        <div className="seg" role="group" aria-label="Sort">
          <button aria-pressed={sort === "priority"} onClick={() => setSort("priority")}>Priority</button>
          <button aria-pressed={sort === "recent"} onClick={() => setSort("recent")}>Newest</button>
        </div>
        <input className="search" placeholder="Search player, team, injury…" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="small muted">{shown.length} stories</span>
      </div>
      {shown.length ? <div className="newslist">{shown.slice(0, 150).map((n) => <NewsItem key={n.guid} n={n} validIds={validIds} />)}</div>
        : <div className="empty">No stories match.</div>}
    </>
  );
}
