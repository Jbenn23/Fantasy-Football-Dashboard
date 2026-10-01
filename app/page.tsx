import Link from "next/link";
import DataTable, { type Col } from "@/components/DataTable";
import { Injury, Signals } from "@/components/Badges";
import { getLeagueTeams, getMeta, getPlayers, getRosters, pick, playerByEspn } from "@/lib/data";
import { fmt, isHurt } from "@/lib/format";
import { bestLineup, SLOT_ELIG } from "@/lib/lineup";
import type { Row } from "@/lib/types";

const BASE = ["gsis_id", "espn_id", "name", "position", "team", "status", "fantasy_team", "injury_status", "games",
  "fp_g", "xfp_g", "proj_fp_g", "value_gap", "signals", "reasons", "adds_24h", "proj_avg", "market_gap", "xfp_trend"];

const tradeCols: Col[] = [
  { key: "name", label: "Player", kind: "player" },
  { key: "fantasy_team", label: "Owner", fmt: "text" },
  { key: "proj_fp_g", label: "Proj/g", help: "Model projection per game: usage (xFP) + regressed efficiency" },
  { key: "fp_g", label: "FP/g" },
  { key: "xfp_g", label: "xFP/g" },
  { key: "value_gap", label: "Gap", kind: "delta", help: "Projection minus actual FP/g. + = should score more going forward" },
  { key: "signals", label: "Signals", kind: "signals", sortable: false },
  { key: "reasons", label: "Why", kind: "reasons" },
];

export default function WarRoom() {
  const meta = getMeta();
  const players = getPlayers();
  const byEspn = playerByEspn();
  const myId = meta.my_team_id;
  const rosters = getRosters();
  const teams = getLeagueTeams();
  const me = teams.find((t: Row) => t.team_id === myId);

  // My roster: ESPN is source of truth; enrich with model output
  const mine: Row[] = rosters
    .filter((r: Row) => r.team_id === myId)
    .map((r: Row) => ({ ...r, ...(byEspn.get(String(r.espn_id)) ?? {}), injury_status: r.injury_status, espn_id: String(r.espn_id), team: r.pro_team }));
  const slots = meta.slots ?? { QB: 1, RB: 2, WR: 2, TE: 1, "RB/WR/TE": 1 };
  const weekVal = (r: Row) => (isHurt(r.injury_status) || r.on_bye ? 0 : Number(r.proj_week) || Number(r.proj_fp_g) || 0);
  const lineup = bestLineup(mine, slots, weekVal);
  const fas = players.filter((p) => p.status === "FA" && !isHurt(p.injury_status) && p.games >= 1);
  const bestFA = (slot: string) =>
    fas.filter((p) => SLOT_ELIG[slot]?.includes(p.position)).sort((a, b) => b.proj_fp_g - a.proj_fp_g)[0];
  const hurtStarters = mine.filter((r) => isHurt(r.injury_status) && (Number(r.proj_fp_g) || Number(r.proj_avg) || 0) >= 10).length;
  const lineupProj = lineup.reduce((s, l) => s + (l.player ? weekVal(l.player) : 0), 0);

  const holeRows = ["QB", "RB", "WR", "TE"].flatMap((pos) =>
    fas.filter((p) => p.position === pos).sort((a, b) => b.proj_fp_g - a.proj_fp_g).slice(0, 5));
  const buyTargets = players.filter((p) => p.status === "ROSTERED" && p.signals?.includes("BUY_LOW"));
  const sellChips = players.filter((p) => p.status === "MINE" && p.signals?.includes("SELL_HIGH"));
  const holdLows = players.filter((p) => p.status === "MINE" && p.signals?.includes("BUY_LOW"));

  if (myId == null) {
    return (
      <div className="pagehead">
        <h1>War Room</h1>
        <p className="sub">Your team wasn't identified. Set <code>MY_TEAM_ID</code> (or <code>SWID</code>) in the pipeline&apos;s .env and rerun.</p>
      </div>
    );
  }

  return (
    <>
      <div className="pagehead">
        <h1>War Room</h1>
        <p className="sub">Where your lineup is bleeding points, and the cheapest ways to patch it — waivers first, then trades priced off regression.</p>
      </div>

      <div className="grid g5">
        <Tile label="Record" value={me ? `${me.wins}-${me.losses}${me.ties ? `-${me.ties}` : ""}` : "–"} note={me ? `#${me.standing} in league` : ""} />
        <Tile label="Points for" value={me ? fmt(me.points_for, "num1") : "–"} note={me ? `${fmt(me.points_against, "num1")} against` : ""} />
        <Tile label="Playoff odds (ESPN)" value={me ? `${fmt(me.playoff_pct, "int")}%` : "–"} />
        <Tile label="Key players out" value={String(hurtStarters)} note="Out / IR / Doubtful, ≥10 proj pts/g" />
        <Tile label="Best healthy lineup" value={fmt(lineupProj)} note={`ESPN wk ${meta.week ?? ""} projection`} />
      </div>

      <div className="grid g2 section">
        <div className="card">
          <div className="card-head">
            <h2>This week&apos;s best healthy lineup</h2>
            <span className="small muted">ESPN wk proj · model proj/g · best FA at slot</span>
          </div>
          {lineup.map((l, i) => {
            const fa = bestFA(l.slot);
            const pv = l.player ? Number(l.player.proj_fp_g ?? l.player.proj_avg ?? 0) : 0;
            const upgrade = fa && fa.proj_fp_g - pv >= 1.5;
            return (
              <div className="slotrow" key={l.slot + i}>
                <span className="slotlabel">{l.slot}</span>
                <span className="slotname">
                  {l.player ? (
                    <>
                      {l.player.gsis_id ? <Link className="plink" href={`/players/${l.player.gsis_id}`}><b>{l.player.name}</b></Link> : <b>{l.player.name}</b>}{" "}
                      <span className="muted small">{l.player.team}</span> <Injury status={l.player.injury_status} />{" "}
                      <span className="small sub num">{fmt(l.player.proj_week)} · {fmt(l.player.proj_fp_g)}</span>
                    </>
                  ) : <span className="weak">Empty — no healthy eligible player</span>}
                  {upgrade && (
                    <div className="small">
                      <span className="pos-delta">FA upgrade:</span>{" "}
                      <Link className="link" href={`/players/${fa.gsis_id}`}>{fa.name}</Link>{" "}
                      <span className="muted">({fa.team}) {fmt(fa.proj_fp_g)}/g, {fmt(fa.proj_fp_g - pv, "signed1")}</span>
                    </div>
                  )}
                </span>
                <span>{l.player ? <Signals value={l.player.signals} /> : null}</span>
              </div>
            );
          })}
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Sell-high chips on your roster</h2>
            <span className="small muted">Scoring above what usage supports</span>
          </div>
          <DataTable rows={pick(sellChips, BASE)} columns={tradeCols.filter((c) => c.key !== "fantasy_team")}
            initialSort={{ key: "value_gap", dir: "asc" }} empty="No sell-high candidates on your roster right now." />
          <div className="card-head section"><h2>Don&apos;t sell these (your buy-lows)</h2></div>
          <DataTable rows={pick(holdLows, BASE)} columns={tradeCols.filter((c) => c.key !== "fantasy_team")}
            initialSort={{ key: "value_gap", dir: "desc" }} empty="None of your players are flagged as buy-low." />
        </div>
      </div>

      <div className="card section">
        <div className="card-head">
          <h2>Fix the holes — best available free agents</h2>
          <Link className="link small" href="/waivers">Full waiver board →</Link>
        </div>
        <DataTable
          rows={pick(holeRows, BASE)}
          positions={["QB", "RB", "WR", "TE"]}
          initialSort={{ key: "proj_fp_g", dir: "desc" }}
          columns={[
            { key: "name", label: "Player", kind: "player" },
            { key: "proj_fp_g", label: "Proj/g", help: "Model projection per game" },
            { key: "xfp_g", label: "xFP/g", help: "Expected fantasy points per game from usage" },
            { key: "fp_g", label: "FP/g" },
            { key: "xfp_trend", label: "xFP trend", kind: "delta", help: "Recent xFP/g minus earlier xFP/g" },
            { key: "adds_24h", label: "Sleeper adds 24h", fmt: "int" },
            { key: "signals", label: "Signals", kind: "signals", sortable: false },
            { key: "reasons", label: "Why", kind: "reasons" },
          ]}
        />
      </div>

      <div className="card section">
        <div className="card-head">
          <h2>Trade targets — buy-low players on other rosters</h2>
          <span className="small muted">Owners see the box score; you see the usage</span>
        </div>
        <DataTable rows={pick(buyTargets, BASE)} columns={tradeCols} initialSort={{ key: "value_gap", dir: "desc" }} limit={12}
          positions={["QB", "RB", "WR", "TE"]} empty="No buy-low targets on other rosters." />
      </div>

      <div className="card section">
        <div className="card-head"><h2>Your roster</h2></div>
        <DataTable
          rows={pick(mine, [...BASE, "proj_week", "on_bye"])}
          initialSort={{ key: "proj_fp_g", dir: "desc" }}
          columns={[
            { key: "name", label: "Player", kind: "player" },
            { key: "proj_week", label: "ESPN wk", help: "ESPN projection this week" },
            { key: "proj_fp_g", label: "Proj/g" },
            { key: "fp_g", label: "FP/g" },
            { key: "xfp_g", label: "xFP/g" },
            { key: "value_gap", label: "Gap", kind: "delta" },
            { key: "market_gap", label: "vs ESPN", kind: "delta", help: "Model proj/g minus ESPN projected avg — + = ESPN undervalues" },
            { key: "signals", label: "Signals", kind: "signals", sortable: false },
            { key: "reasons", label: "Why", kind: "reasons" },
          ]}
        />
      </div>
    </>
  );
}

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="card tile">
      <div className="label">{label}</div>
      <div className="value num">{value}</div>
      {note && <div className="note">{note}</div>}
    </div>
  );
}
