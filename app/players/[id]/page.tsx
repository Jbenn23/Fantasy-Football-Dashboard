import { notFound } from "next/navigation";
import Link from "next/link";
import { Avail, Injury, Signals } from "@/components/Badges";
import WeekChart from "@/components/WeekChart";
import { getMeta, getPlayers, getWeekly } from "@/lib/data";
import { fmt, type Fmt } from "@/lib/format";
import type { Player, Row } from "@/lib/types";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPlayers().filter((p) => p.games >= 1).map((p) => ({ id: p.gsis_id }));
}

type M = [key: string, label: string, f: Fmt, help?: string];
const METRICS: Record<string, M[]> = {
  WR: [["route_share", "Route share (est)", "pct"], ["tprr", "TPRR (est)", "num3"], ["yprr", "YPRR (est)", "num2"],
    ["target_share", "Target share", "pct"], ["first_read_share", "First-read target share", "pct"], ["air_yards_share", "Air-yard share", "pct"],
    ["adot", "aDOT", "num1"], ["wopr", "WOPR", "num2"], ["epa_per_target", "EPA / target", "num2"], ["catchable_rate", "Catchable target %", "pct"],
    ["separation", "Separation (NGS)", "num1"], ["yacoe", "YAC over expected (NGS)", "num1"], ["rz_targets", "Red-zone targets", "int"], ["ez_targets", "End-zone targets", "int"]],
  TE: [["route_share", "Route share (est)", "pct"], ["tprr", "TPRR (est)", "num3"], ["yprr", "YPRR (est)", "num2"],
    ["target_share", "Target share", "pct"], ["first_read_share", "First-read target share", "pct"], ["wopr", "WOPR", "num2"],
    ["epa_per_target", "EPA / target", "num2"], ["adot", "aDOT", "num1"], ["rz_targets", "Red-zone targets", "int"], ["ez_targets", "End-zone targets", "int"]],
  RB: [["snap_pct", "Snap share", "pct"], ["rush_share", "Rush share", "pct"], ["rz_carry_share", "Red-zone carry share", "pct"], ["i10_carry_share", "Inside-10 carry share", "pct"],
    ["hv_touches_g", "High-value touches / g", "num1"], ["route_share", "Route share (est)", "pct"], ["tprr", "TPRR (est)", "num3"], ["target_share", "Target share", "pct"],
    ["epa_per_rush", "EPA / rush", "num2"], ["rush_success_rate", "Rush success rate", "pct"], ["ryoe_att", "RYOE / att (NGS)", "num2"],
    ["ybc_att", "Yards before contact / att", "num2"], ["yac_att", "Yards after contact / att", "num2"], ["box8_rate", "8+ in box % (NGS)", "num1"]],
  QB: [["dropbacks_g", "Dropbacks / g", "num1"], ["epa_db", "EPA / dropback", "num2"], ["db_success_rate", "Dropback success rate", "pct"], ["cpoe", "CPOE", "num1"],
    ["qb_adot", "aDOT", "num1"], ["sack_rate", "Sack rate", "pct1"], ["scramble_rate", "Scramble rate", "pct1"], ["iw_rate", "INT-worthy throw rate", "pct1"],
    ["designed_rush_g", "Designed rushes / g", "num1"], ["rush_yds_g", "Rush yards / g", "num1"], ["time_to_throw", "Time to throw (NGS)", "num2"], ["aggressiveness", "Aggressiveness (NGS)", "num1"]],
};

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getPlayers().find((x) => x.gsis_id === id) as Player | undefined;
  if (!p) notFound();
  const meta = getMeta();
  const wk = getWeekly().filter((w) => w.gsis_id === id).sort((a, b) => a.week - b.week);
  const weeks = wk.map((w) => w.week);
  const col = (k: string) => wk.map((w: Row) => (w[k] === null || w[k] === undefined ? null : Number(w[k])));
  const reasons = (p.reasons ?? "").split(";").map((s) => s.trim()).filter(Boolean);
  const k = meta.advanced?.reg_k?.[p.position] ?? 10;

  return (
    <>
      <div className="pagehead">
        <div className="phead">
          {p.headshot_url && <img src={p.headshot_url} alt="" width={64} height={64} />}
          <div>
            <h1>{p.name}</h1>
            <div className="chips" style={{ alignItems: "center", gap: 8 }}>
              <span className="pos">{p.position}</span>
              <span className="sub">{p.team}</span>
              <Avail status={p.status} team={p.fantasy_team} />
              <Injury status={p.injury_status} />
              <Signals value={p.signals} />
            </div>
          </div>
        </div>
        {reasons.length > 0 && <ul className="reason-list">{reasons.map((r) => <li key={r}>{r}</li>)}</ul>}
      </div>

      <div className="grid g5">
        <Tile label="Rest-of-season" value={fmt(p.ros_proj_g)} note={`pts / game · ${fmt(p.proj_fp_g)} when playing × ${fmt(p.avail_ros, "pct")} available`} />
        <Tile label="Actual" value={fmt(p.fp_g)} note={`FP / game · ${p.games} G`} />
        <Tile label="Expected (xFP)" value={fmt(p.xfp_g)} note={p.games_recent ? `last 2 wks ${fmt(p.xfp_g_recent)} / g` : "no games last 2 wks"} />
        <Tile label="Value gap" value={fmt(p.value_gap, "signed1")} note="proj − actual" />
        <Tile label="TDs vs expected" value={`${fmt(p.tds, "int")} / ${fmt(p.xtds)}`} note={p.position === "QB" ? `pass TD ${fmt(p.passing_tds, "int")} / ${fmt(p.pass_touchdown_exp)}` : "actual / xTD"} />
      </div>

      <div className="grid g3 section">
        <WeekChart title="Fantasy points vs expected" weeks={weeks} series={[
          { label: "Actual FP", color: "var(--s-fa)", values: col("fp") },
          { label: "Expected (xFP)", color: "var(--s-rostered)", values: col("xfp") },
        ]} />
        {p.position === "QB" ? (
          <>
            <WeekChart title="EPA per dropback" weeks={weeks} format="num2" series={[{ label: "EPA/db", color: "var(--s-fa)", values: col("epa_db") }]} />
            <WeekChart title="Dropbacks" weeks={weeks} format="int" series={[{ label: "Dropbacks", color: "var(--s-fa)", values: col("dropbacks") }]} />
          </>
        ) : p.position === "RB" ? (
          <>
            <WeekChart title="Rush share vs route share (est)" weeks={weeks} format="pct" minMax={0.5} series={[
              { label: "Rush share", color: "var(--s-fa)", values: col("rush_share") },
              { label: "Route share (est)", color: "var(--s-rostered)", values: col("route_share") },
            ]} />
            <WeekChart title="Snap share" weeks={weeks} format="pct" minMax={1} series={[{ label: "Snap %", color: "var(--s-fa)", values: col("snap_pct") }]} />
          </>
        ) : (
          <>
            <WeekChart title="Route share (est) vs target share" weeks={weeks} format="pct" minMax={0.5} series={[
              { label: "Route share (est)", color: "var(--s-fa)", values: col("route_share") },
              { label: "Target share", color: "var(--s-rostered)", values: col("target_share") },
            ]} />
            <WeekChart title="Yards per route run (est)" weeks={weeks} format="num2" series={[{ label: "YPRR", color: "var(--s-fa)", values: col("yprr") }]} />
          </>
        )}
      </div>

      <div className="grid g2 section">
        <div className="card">
          <div className="card-head"><h2>Advanced profile</h2><span className="small muted">value · {p.position} percentile{p.qualified ? "" : " (small sample)"}</span></div>
          <div className="kv">
            {(METRICS[p.position] ?? []).map(([key, label, f]) => {
              const pct = p[`pct_${key}`];
              return (
                <Kv key={key} label={label} value={fmt(p[key], f)} pct={pct} />
              );
            })}
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h2>How the projection is built</h2></div>
          <div className="kv">
            <Kv label="Usage (xFP/g, 60% last 2 wks + 40% season)" value={fmt(p.usage_xfp_g)} />
            <Kv label={`Efficiency this season (FPOE/g, ${p.games} G)`} value={fmt(p.fpoe_g, "signed1")} />
            <Kv label={`Last season FPOE/g (${fmt(p.prev_games, "int")} G)`} value={fmt(p.prev_fpoe_g, "signed1")} />
            <Kv label={`Regressed efficiency (K = ${k} games)`} value={fmt(p.eff_reg_g, "signed1")} />
            <Kv label="+ Usage inherited from injured teammates" value={fmt(p.injury_boost_g, "signed1")} />
            <Kv label="= Projection / game when playing" value={fmt(p.proj_fp_g)} />
            <Kv label={`× Availability (${p.avail_status ?? "ACTIVE"}${p.avail_source ? `, ${p.avail_source}` : ""})`} value={fmt(p.avail_ros, "pct")} />
            <Kv label="= Rest-of-season / game" value={fmt(p.ros_proj_g)} />
            <Kv label="ESPN projected avg / game" value={fmt(p.proj_avg)} />
            <Kv label="Model edge vs ESPN" value={fmt(p.market_gap, "signed1")} />
          </div>
          <div className="card-head section"><h2>This week&apos;s matchup</h2></div>
          <div className="kv">
            <Kv label={`Grade vs ${p.wk_opp ?? "–"}`} value={p.bye ? "BYE" : `${p.matchup_grade ?? "–"} (×${fmt(p.matchup_mult, "num2")})`} />
            <Kv label="Vegas environment" value={fmt(p.m_env, "signedpct")} />
            <Kv label="Game script (RB)" value={fmt(p.m_spread, "signedpct")} />
            <Kv label="Opponent pts allowed to position (adj.)" value={fmt(p.m_dvp, "signedpct")} />
            <Kv label="Week projection (model)" value={fmt(p.wk_proj)} />
            <Kv label="Schedule: next 4 / weeks 15–17" value={`${fmt(p.sos_next4, "num2")} / ${fmt(p.sos_playoffs, "num2")}`} />
          </div>
          <div className="card-head section"><h2>Next game</h2></div>
          <div className="kv">
            <Kv label="Opponent" value={p.next_opp ? `${p.home ? "vs" : "@"} ${p.next_opp}` : "–"} />
            <Kv label="Kickoff" value={p.kickoff ? `${p.kickoff} ET` : "–"} />
            <Kv label="Team implied total" value={fmt(p.implied_total)} />
            <Kv label="Opp pass defense (EPA/db rank, 1 = best)" value={fmt(p.opp_rank_def_epa_db, "rank")} />
            <Kv label="Opp run defense (EPA/rush rank)" value={fmt(p.opp_rank_def_epa_rush, "rank")} />
            <Kv label="Team neutral PROE" value={fmt(p.neutral_proe, "pct1")} />
          </div>
          <p className="small muted section"><Link className="link" href="/method">How these are calculated →</Link></p>
        </div>
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

function Kv({ label, value, pct }: { label: string; value: string; pct?: number | null }) {
  return (
    <>
      <span className="k">{label}</span>
      <span className="num" style={{ textAlign: "right" }}>{value}</span>
      <span className="pctcell" style={{ minWidth: 70 }}>
        {pct !== undefined && pct !== null ? (
          <>
            <span className="small muted num">{Math.round(pct)}</span>
            <span className="pctbar" aria-label={`${Math.round(pct)}th percentile`}><span style={{ width: `${Math.max(3, pct)}%` }} /></span>
          </>
        ) : null}
      </span>
    </>
  );
}
