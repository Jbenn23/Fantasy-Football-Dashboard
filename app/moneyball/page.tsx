import DataTable, { type Col } from "@/components/DataTable";
import Scatter, { type Pt } from "@/components/Scatter";
import { getPlayers, pick } from "@/lib/data";

const KEYS = ["gsis_id", "espn_id", "name", "position", "team", "status", "fantasy_team", "injury_status", "games",
  "fp_g", "xfp_g", "usage_xfp_g", "eff_reg_g", "proj_fp_g", "ros_proj_g", "avail_ros", "avail_status", "value_gap", "td_diff", "tds", "xtds", "signals", "reasons",
  "proj_avg", "market_gap", "xfp_trend", "route_share_trend", "target_share_trend", "rush_share_trend", "tprr", "yprr",
  "route_share", "target_share", "rush_share", "pct_tprr", "pct_yprr", "pct_route_share", "pct_target_share", "pct_rush_share",
  "first_read_share", "pct_first_read_share", "adds_24h"];

const gapCols: Col[] = [
  { key: "name", label: "Player", kind: "player" },
  { key: "status", label: "Availability", kind: "avail", fmt: "text" },
  { key: "proj_fp_g", label: "Proj/g", help: "When playing: usage xFP (recency-weighted) + regressed efficiency + inherited usage" },
  { key: "fp_g", label: "FP/g" },
  { key: "xfp_g", label: "xFP/g" },
  { key: "value_gap", label: "Gap", kind: "delta", help: "Proj/g − FP/g" },
  { key: "td_diff", label: "TD − xTD", fmt: "signed1", help: "Touchdowns above (+) or below (−) expectation" },
  { key: "games", label: "G", fmt: "int" },
  { key: "reasons", label: "Why", kind: "reasons" },
];

export default function Moneyball() {
  const all = getPlayers();
  const pts: Pt[] = all
    .filter((p) => p.games >= 1 && (p.xfp_g >= 3 || p.fp_g >= 5) && (p.avail_ros ?? 1) >= 0.5)
    .map((p) => ({
      id: p.gsis_id, name: p.name, team: p.team, position: p.position, status: p.status, fantasy_team: p.fantasy_team,
      x: +p.xfp_g.toFixed(2), y: +p.fp_g.toFixed(2), proj: +p.proj_fp_g.toFixed(2), gap: +p.value_gap.toFixed(2), games: p.games,
    }));
  const buys = all.filter((p) => p.signals?.includes("BUY_LOW"));
  const sells = all.filter((p) => p.signals?.includes("SELL_HIGH"));
  const risers = all.filter((p) => p.signals?.includes("RISING") || p.signals?.includes("FALLING"));
  const market = all.filter((p) => p.market_gap !== null && p.market_gap !== undefined && p.games >= 1);

  return (
    <>
      <div className="pagehead">
        <h1>Moneyball board</h1>
        <p className="sub">
          Fantasy points are noisy; opportunity is sticky. xFP prices every target and carry by down, distance, field
          position and air yards. Players far below the line are getting paid in usage but not in points yet — that&apos;s
          where the market misprices them.
        </p>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Usage vs production</h2>
          <span className="small muted">Click a dot to open the player · labels mark the largest gaps in view</span>
        </div>
        <Scatter points={pts} />
      </div>

      <div className="grid g2 section">
        <div className="card">
          <div className="card-head"><h2>Buy low</h2><span className="small muted">Positive regression candidates</span></div>
          <DataTable rows={pick(buys, KEYS)} columns={gapCols} initialSort={{ key: "value_gap", dir: "desc" }}
            availability positions={["QB", "RB", "WR", "TE"]} limit={15} />
        </div>
        <div className="card">
          <div className="card-head"><h2>Sell high</h2><span className="small muted">Negative regression candidates</span></div>
          <DataTable rows={pick(sells, KEYS)} columns={gapCols} initialSort={{ key: "value_gap", dir: "asc" }}
            availability positions={["QB", "RB", "WR", "TE"]} limit={15} />
        </div>
      </div>

      <div className="card section">
        <div className="card-head">
          <h2>Role changes</h2>
          <span className="small muted">Last {2} weeks vs earlier — the earliest tell for breakouts and busts</span>
        </div>
        <DataTable
          rows={pick(risers, KEYS)}
          availability
          positions={["QB", "RB", "WR", "TE"]}
          initialSort={{ key: "xfp_trend", dir: "desc" }}
          limit={20}
          columns={[
            { key: "name", label: "Player", kind: "player" },
            { key: "status", label: "Availability", kind: "avail" },
            { key: "signals", label: "Signal", kind: "signals", sortable: false },
            { key: "xfp_trend", label: "xFP/g Δ", kind: "delta" },
            { key: "route_share_trend", label: "Route share Δ", kind: "delta", fmt: "signedpct", help: "Estimated route participation change" },
            { key: "target_share_trend", label: "Target share Δ", kind: "delta", fmt: "signedpct" },
            { key: "rush_share_trend", label: "Rush share Δ", kind: "delta", fmt: "signedpct" },
            { key: "ros_proj_g", label: "ROS/g", help: "Rest-of-season points per game: model projection × expected availability (injuries), incl. usage inherited from injured teammates" },
            { key: "adds_24h", label: "Sleeper adds", fmt: "int" },
          ]}
        />
      </div>

      <div className="card section">
        <div className="card-head">
          <h2>Where ESPN disagrees with the model</h2>
          <span className="small muted">Model proj/g − ESPN projected avg. Leaguemates trade off ESPN&apos;s numbers.</span>
        </div>
        <DataTable
          rows={pick(market, KEYS)}
          availability
          positions={["QB", "RB", "WR", "TE"]}
          initialSort={{ key: "market_gap", dir: "desc" }}
          limit={20}
          columns={[
            { key: "name", label: "Player", kind: "player" },
            { key: "status", label: "Availability", kind: "avail" },
            { key: "ros_proj_g", label: "Model ROS/g", help: "Rest-of-season points per game: model projection × expected availability (injuries), incl. usage inherited from injured teammates" },
            { key: "proj_avg", label: "ESPN/g" },
            { key: "market_gap", label: "Edge", kind: "delta" },
            { key: "tprr", label: "TPRR (est)", fmt: "num3", pct: "pct_tprr" },
            { key: "target_share", label: "Tgt share", fmt: "pct", pct: "pct_target_share" },
            { key: "rush_share", label: "Rush share", fmt: "pct", pct: "pct_rush_share" },
            { key: "signals", label: "Signals", kind: "signals", sortable: false },
          ]}
        />
      </div>
    </>
  );
}
