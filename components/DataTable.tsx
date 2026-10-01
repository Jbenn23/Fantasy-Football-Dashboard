"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { fmt, type Fmt } from "@/lib/format";
import type { Row } from "@/lib/types";
import { Avail, Injury, Signals } from "./Badges";

export interface Col {
  key: string;
  label: string;
  fmt?: Fmt;
  kind?: "player" | "signals" | "injury" | "avail" | "reasons" | "delta" | "pos";
  pct?: string;          // key holding the 0-100 position percentile, rendered as a bar
  help?: string;         // header tooltip
  sortable?: boolean;
}

export interface Preset {
  name: string;
  keys: string[];
}

interface Props {
  rows: Row[];
  columns: Col[];
  presets?: Preset[];
  initialSort?: { key: string; dir: "asc" | "desc" };
  search?: boolean;
  positions?: string[];          // show position filter with these options
  availability?: boolean;        // show FA / Rostered / Mine filter
  minGames?: boolean;
  limit?: number;
  empty?: string;
}

const AV = [
  { v: "ALL", l: "All" },
  { v: "FA", l: "Free agents" },
  { v: "ROSTERED", l: "Rostered" },
  { v: "MINE", l: "Mine" },
];

export default function DataTable({
  rows, columns, presets, initialSort, search, positions, availability, minGames, limit, empty,
}: Props) {
  const [sort, setSort] = useState(initialSort ?? { key: columns[1]?.key ?? columns[0].key, dir: "desc" as const });
  const [q, setQ] = useState("");
  const [pos, setPos] = useState("ALL");
  const [av, setAv] = useState("ALL");
  const [mg, setMg] = useState(1);
  const [preset, setPreset] = useState(presets?.[0]?.name ?? "");
  const [showAll, setShowAll] = useState(false);

  const visibleCols = useMemo(() => {
    const p = presets?.find((x) => x.name === preset);
    if (!p) return columns;
    return columns.filter((c) => c.kind === "player" || p.keys.includes(c.key));
  }, [columns, presets, preset]);

  const data = useMemo(() => {
    let r = rows;
    if (q) {
      const s = q.toLowerCase();
      r = r.filter((x) => `${x.name ?? ""} ${x.team ?? ""} ${x.fantasy_team ?? ""}`.toLowerCase().includes(s));
    }
    if (pos !== "ALL") r = r.filter((x) => (pos === "FLEX" ? ["RB", "WR", "TE"].includes(x.position) : x.position === pos));
    if (av !== "ALL") r = r.filter((x) => x.status === av);
    if (minGames && mg > 1) r = r.filter((x) => (x.games ?? 0) >= mg);
    const { key, dir } = sort;
    const m = dir === "asc" ? 1 : -1;
    return [...r].sort((a, b) => {
      const va = a[key], vb = b[key];
      const na = va === null || va === undefined || va === "", nb = vb === null || vb === undefined || vb === "";
      if (na && nb) return 0;
      if (na) return 1;
      if (nb) return -1;
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * m;
      return String(va).localeCompare(String(vb)) * m;
    });
  }, [rows, q, pos, av, mg, minGames, sort]);

  const shown = limit && !showAll ? data.slice(0, limit) : data;
  const onSort = (c: Col) => {
    if (c.sortable === false || c.kind === "reasons") return;
    setSort((s) => (s.key === c.key ? { key: c.key, dir: s.dir === "desc" ? "asc" : "desc" } : { key: c.key, dir: c.fmt === "text" ? "asc" : "desc" }));
  };

  return (
    <div>
      {(search || positions || availability || presets || minGames) && (
        <div className="controls">
          {search && <input className="search" placeholder="Search player / team" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />}
          {positions && (
            <div className="seg" role="group" aria-label="Position">
              {["ALL", ...positions].map((p) => (
                <button key={p} aria-pressed={pos === p} onClick={() => setPos(p)}>{p === "ALL" ? "All" : p}</button>
              ))}
            </div>
          )}
          {availability && (
            <div className="seg" role="group" aria-label="Availability">
              {AV.map((a) => (
                <button key={a.v} aria-pressed={av === a.v} onClick={() => setAv(a.v)}>{a.l}</button>
              ))}
            </div>
          )}
          {presets && presets.length > 1 && (
            <div className="seg" role="group" aria-label="Column set">
              {presets.map((p) => (
                <button key={p.name} aria-pressed={preset === p.name} onClick={() => setPreset(p.name)}>{p.name}</button>
              ))}
            </div>
          )}
          {minGames && (
            <label className="small sub">
              Min games{" "}
              <select value={mg} onChange={(e) => setMg(Number(e.target.value))}>
                {[1, 2, 3, 4, 6, 8].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          )}
          <span className="small muted">{data.length} players</span>
        </div>
      )}
      <div className="tablewrap">
        <table className="dt">
          <thead>
            <tr>
              {visibleCols.map((c, i) => (
                <th
                  key={c.key}
                  className={`${c.kind === "player" ? "sticky" : ""} ${isRight(c) ? "r" : ""} ${c.sortable === false || c.kind === "reasons" ? "" : "sortable"}`}
                  title={c.help}
                  onClick={() => onSort(c)}
                  aria-sort={sort.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                  style={i === 0 ? { zIndex: 3 } : undefined}
                >
                  {c.label}
                  {sort.key === c.key && <span className="arrow">{sort.dir === "asc" ? "↑" : "↓"}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr><td colSpan={visibleCols.length} className="empty">{empty ?? "No players match."}</td></tr>
            )}
            {shown.map((r, i) => (
              <tr key={(r.gsis_id ?? r.espn_id ?? i) + ":" + i}>
                {visibleCols.map((c) => (
                  <td key={c.key} className={`${c.kind === "player" ? "sticky" : ""} ${isRight(c) ? "r" : ""} ${c.kind === "reasons" ? "wrap" : ""}`}>
                    <Cell c={c} r={r} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {limit && data.length > limit && (
        <button className="seg" style={{ marginTop: 8, padding: "5px 10px", cursor: "pointer", color: "var(--ink-2)" }} onClick={() => setShowAll((s) => !s)}>
          {showAll ? "Show fewer" : `Show all ${data.length}`}
        </button>
      )}
    </div>
  );
}

function isRight(c: Col) {
  return !c.kind || c.kind === "delta";
}

function Cell({ c, r }: { c: Col; r: Row }) {
  const v = r[c.key];
  switch (c.kind) {
    case "player":
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span className="pos">{r.position}</span>
          {r.gsis_id ? <Link className="plink" href={`/players/${r.gsis_id}`}><b>{r.name}</b></Link> : <b>{r.name}</b>}
          <span className="muted small">{r.team ?? r.pro_team}</span>
          <Injury status={r.injury_status} />
        </span>
      );
    case "signals":
      return <Signals value={v} />;
    case "injury":
      return <Injury status={v} />;
    case "avail":
      return <Avail status={r.status} team={r.fantasy_team} />;
    case "reasons":
      return <>{v || "–"}</>;
    case "pos":
      return <span className="pos">{v}</span>;
    case "delta": {
      const n = Number(v);
      const cls = v == null ? "" : n > 0 ? "pos-delta" : n < 0 ? "neg-delta" : "";
      return <span className={cls}>{fmt(v, c.fmt ?? "signed1")}</span>;
    }
    default: {
      const p = c.pct ? r[c.pct] : undefined;
      if (p === undefined || p === null) return <>{fmt(v, c.fmt)}</>;
      return (
        <span className="pctcell" title={`${Math.round(p)}th percentile at position`}>
          {fmt(v, c.fmt)}
          <span className="pctbar" aria-hidden><span style={{ width: `${Math.max(3, Math.min(100, p))}%` }} /></span>
        </span>
      );
    }
  }
}
