import DataTable, { type Col } from "@/components/DataTable";
import { getPlayers, pick } from "@/lib/data";

const COLS: Col[] = [
  { key: "name", label: "Player", kind: "player" },
  { key: "status", label: "Availability", kind: "avail" },
  { key: "games", label: "G", fmt: "int" },
  // model
  { key: "proj_fp_g", label: "Proj/g", pct: "pct_proj_fp_g" },
  { key: "fp_g", label: "FP/g" },
  { key: "xfp_g", label: "xFP/g", pct: "pct_xfp_g" },
  { key: "fpoe_g", label: "FPOE/g", fmt: "signed1", help: "Fantasy points over expected per game" },
  { key: "value_gap", label: "Gap", kind: "delta" },
  { key: "td_diff", label: "TD−xTD", fmt: "signed1", help: "Touchdowns above (+) or below (−) expectation" },
  { key: "signals", label: "Signals", kind: "signals", sortable: false },
  // receiving
  { key: "snap_pct", label: "Snap %", fmt: "pct" },
  { key: "route_share", label: "Route % (est)", fmt: "pct", pct: "pct_route_share", help: "Estimated routes / team dropbacks" },
  { key: "tprr", label: "TPRR (est)", fmt: "num3", pct: "pct_tprr", help: "Targets per (estimated) route run" },
  { key: "yprr", label: "YPRR (est)", fmt: "num2", pct: "pct_yprr", help: "Receiving yards per (estimated) route run" },
  { key: "target_share", label: "Tgt share", fmt: "pct", pct: "pct_target_share" },
  { key: "first_read_share", label: "1st-read share", fmt: "pct", pct: "pct_first_read_share", help: "Share of team's first-read targets (FTN charting)" },
  { key: "air_yards_share", label: "Air yd share", fmt: "pct", pct: "pct_air_yards_share" },
  { key: "adot", label: "aDOT", pct: "pct_adot" },
  { key: "wopr", label: "WOPR", fmt: "num2", pct: "pct_wopr" },
  { key: "epa_per_target", label: "EPA/tgt", fmt: "num2", pct: "pct_epa_per_target" },
  { key: "catchable_rate", label: "Catchable %", fmt: "pct", help: "Share of targets charted catchable (QB quality)" },
  { key: "rz_targets", label: "RZ tgts", fmt: "int" },
  { key: "ez_targets", label: "EZ tgts", fmt: "int" },
  { key: "separation", label: "Sep (NGS)", pct: "pct_separation" },
  { key: "yacoe", label: "YACOE (NGS)", pct: "pct_yacoe" },
  // rushing
  { key: "rush_share", label: "Rush share", fmt: "pct", pct: "pct_rush_share" },
  { key: "rz_carry_share", label: "RZ carry %", fmt: "pct", pct: "pct_rz_carry_share" },
  { key: "i10_carry_share", label: "Inside-10 %", fmt: "pct", pct: "pct_i10_carry_share" },
  { key: "hv_touches_g", label: "HV touches/g", pct: "pct_hv_touches_g", help: "Receptions + carries inside the 10, per game" },
  { key: "epa_per_rush", label: "EPA/rush", fmt: "num2", pct: "pct_epa_per_rush" },
  { key: "rush_success_rate", label: "Success %", fmt: "pct", pct: "pct_rush_success_rate" },
  { key: "ryoe_att", label: "RYOE/att", fmt: "num2", pct: "pct_ryoe_att", help: "NGS rush yards over expected per attempt" },
  { key: "ybc_att", label: "YBC/att", fmt: "num2", help: "Yards before contact per attempt (blocking)" },
  { key: "yac_att", label: "YAC/att", fmt: "num2", pct: "pct_yac_att", help: "Yards after contact per attempt (runner)" },
  { key: "box8_rate", label: "8+ box %", fmt: "num1" },
  // passing
  { key: "dropbacks_g", label: "DB/g" },
  { key: "epa_db", label: "EPA/db", fmt: "num2", pct: "pct_epa_db" },
  { key: "cpoe", label: "CPOE", fmt: "num1", pct: "pct_cpoe" },
  { key: "db_success_rate", label: "Success %", fmt: "pct", pct: "pct_db_success_rate" },
  { key: "qb_adot", label: "aDOT", pct: "pct_qb_adot" },
  { key: "sack_rate", label: "Sack %", fmt: "pct1" },
  { key: "iw_rate", label: "INT-worthy %", fmt: "pct1" },
  { key: "designed_rush_g", label: "Designed rush/g", pct: "pct_designed_rush_g" },
  { key: "rush_yds_g", label: "Rush yd/g", pct: "pct_rush_yds_g" },
  { key: "time_to_throw", label: "TTT", fmt: "num2" },
  { key: "pass_td_diff", label: "PassTD−exp", kind: "delta" },
  // context
  { key: "next_opp", label: "Next", fmt: "text" },
  { key: "implied_total", label: "Implied", help: "Vegas implied team total next game" },
  { key: "neutral_proe", label: "Team PROE", fmt: "pct1", help: "Team neutral-situation pass rate over expected" },
  { key: "reasons", label: "Why", kind: "reasons" },
];

const PRESETS = [
  { name: "Model", keys: ["status", "games", "proj_fp_g", "fp_g", "xfp_g", "fpoe_g", "value_gap", "td_diff", "signals", "reasons"] },
  { name: "Receiving", keys: ["games", "snap_pct", "route_share", "tprr", "yprr", "target_share", "first_read_share", "air_yards_share", "adot", "wopr", "epa_per_target", "catchable_rate", "rz_targets", "ez_targets", "separation", "yacoe"] },
  { name: "Rushing", keys: ["games", "snap_pct", "rush_share", "rz_carry_share", "i10_carry_share", "hv_touches_g", "epa_per_rush", "rush_success_rate", "ryoe_att", "ybc_att", "yac_att", "box8_rate", "route_share", "tprr"] },
  { name: "Passing", keys: ["games", "dropbacks_g", "epa_db", "cpoe", "db_success_rate", "qb_adot", "sack_rate", "iw_rate", "designed_rush_g", "rush_yds_g", "time_to_throw", "pass_td_diff"] },
  { name: "Matchup", keys: ["status", "proj_fp_g", "next_opp", "implied_total", "neutral_proe", "signals"] },
];

export default function Players() {
  const keys = ["gsis_id", "team", "position", "injury_status", "fantasy_team", ...COLS.map((c) => c.key), ...COLS.filter((c) => c.pct).map((c) => c.pct!)];
  const rows = pick(getPlayers().filter((p) => p.games >= 1), keys);
  return (
    <>
      <div className="pagehead">
        <h1>Player explorer</h1>
        <p className="sub">Bars show position percentile among qualified players. Routes (and so TPRR / YPRR / route %) are estimated — see Method.</p>
      </div>
      <div className="card">
        <DataTable rows={rows} columns={COLS} presets={PRESETS} search availability minGames
          positions={["QB", "RB", "WR", "TE"]} initialSort={{ key: "proj_fp_g", dir: "desc" }} limit={100} />
      </div>
    </>
  );
}
