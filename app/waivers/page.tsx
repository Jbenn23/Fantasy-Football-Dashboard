import { timeAgo } from "@/lib/format";
import DataTable from "@/components/DataTable";
import { getMeta, getWaivers, playerByEspn } from "@/lib/data";
import type { Row } from "@/lib/types";

export default function Waivers() {
  const meta = getMeta();
  const by = playerByEspn();
  const rows: Row[] = getWaivers().map((w: Row) => {
    const p = by.get(String(w.espn_id));
    return {
      espn_id: String(w.espn_id), gsis_id: p?.gsis_id ?? null, name: w.name, position: w.position, team: w.pro_team,
      injury_status: p?.injury_status ?? w.injury_status, waiver_score: w.waiver_score, week_gain: w.week_gain, ros_gain: w.ros_gain,
      proj_fp_g: p?.proj_fp_g ?? null, ros_proj_g: p?.ros_proj_g ?? null, proj_avg: w.proj_avg, proj_week: w.proj_week, xfp_g: p?.xfp_g ?? null,
      fp_g: p?.fp_g ?? null, tprr: p?.tprr ?? null, pct_tprr: p?.pct_tprr ?? null, route_share: p?.route_share ?? null,
      pct_route_share: p?.pct_route_share ?? null, rush_share: p?.rush_share ?? null, pct_rush_share: p?.pct_rush_share ?? null,
      xfp_trend: p?.xfp_trend ?? null, adds_24h: w.adds_24h, pct_owned: w.pct_owned, signals: p?.signals ?? w.signals ?? "",
      reasons: p?.reasons ?? "", games: p?.games ?? 0, fills_need: w.fills_need,
    };
  });

  return (
    <>
      <div className="pagehead">
        <h1>Waiver board</h1>
        <p className="sub">
          Every free agent ESPN lists, scored by what they add to <b>your</b> lineup. <b>Wk gain</b> = points your best
          lineup gains this week (ESPN projection, injuries/byes zeroed). <b>ROS gain</b> = same using the model&apos;s
          projection with an injury haircut. Score blends both with usage, role trend and Sleeper market demand.
          {meta.faab ? ` FAAB league (budget ${meta.faab_budget}).` : ""}
          {" "}<b>Free agents as of {timeAgo(meta.run_ts)}</b> (live from ESPN at each run).
        </p>
      </div>
      <div className="card">
        <DataTable
          rows={rows}
          search
          positions={["QB", "RB", "WR", "TE", "FLEX", "K", "D/ST"]}
          initialSort={{ key: "waiver_score", dir: "desc" }}
          limit={60}
          columns={[
            { key: "name", label: "Player", kind: "player" },
            { key: "waiver_score", label: "Score", help: "0-100, percentile-weighted within this free-agent pool" },
            { key: "week_gain", label: "Wk gain", help: "Lineup points added this week" },
            { key: "ros_gain", label: "ROS gain", help: "Lineup points/game added rest of season (model)" },
            { key: "ros_proj_g", label: "Model ROS/g", help: "Rest-of-season points per game: model projection × expected availability (injuries), incl. usage inherited from injured teammates" },
            { key: "proj_avg", label: "ESPN/g" },
            { key: "xfp_g", label: "xFP/g" },
            { key: "xfp_trend", label: "xFP Δ", kind: "delta" },
            { key: "tprr", label: "TPRR (est)", fmt: "num3", pct: "pct_tprr" },
            { key: "route_share", label: "Route %", fmt: "pct", pct: "pct_route_share" },
            { key: "rush_share", label: "Rush %", fmt: "pct", pct: "pct_rush_share" },
            { key: "adds_24h", label: "Sleeper adds", fmt: "int" },
            { key: "pct_owned", label: "ESPN own%", fmt: "num1" },
            { key: "signals", label: "Signals", kind: "signals", sortable: false },
            { key: "reasons", label: "Why", kind: "reasons" },
          ]}
        />
      </div>
    </>
  );
}
