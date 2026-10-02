import DataTable from "@/components/DataTable";
import { getMeta, getPlayers, pick } from "@/lib/data";
import { fallCols, falloutRows } from "@/lib/fallout";

export default function Injuries() {
  const meta = getMeta();
  const hurt = getPlayers().filter((p) => p.avail_status && p.avail_status !== "ACTIVE" &&
    ((p.xfp_g ?? 0) >= 3 || p.status !== "FA"));
  const rows = pick(hurt, ["gsis_id", "name", "position", "team", "status", "fantasy_team", "injury_status", "avail_status",
    "avail_source", "injury_detail", "games_out_est", "return_week_est", "avail_ros", "proj_fp_g", "ros_proj_g", "signals"]);
  const fo = falloutRows();
  return (
    <>
      <div className="pagehead">
        <h1>Injuries &amp; opened roles</h1>
        <p className="sub">
          Injury status overrides the usage model. Out-for-season players are worth zero, long-term injuries are
          discounted by the games they&apos;ll miss, and the work they leave behind is reassigned to healthy teammates.
          Sources, strongest first: your overrides file, ESPN news, ESPN league status, Sleeper, the NFL injury report.
          {meta.injury_sources ? ` (${meta.injury_sources.overrides} manual overrides, ${meta.injury_sources.news_players} players' news checked)` : ""}
        </p>
      </div>
      <div className="card">
        <div className="card-head"><h2>Who inherits the work</h2><span className="small muted">Free agents here are your cheapest upgrades</span></div>
        <DataTable rows={fo} columns={fallCols} availability positions={["QB", "RB", "WR", "TE"]}
          initialSort={{ key: "boost_xfp_g", dir: "desc" }} limit={40} empty="No meaningful vacated roles right now." />
      </div>
      <div className="card section">
        <div className="card-head"><h2>Injured players</h2><span className="small muted">Fantasy-relevant or rostered</span></div>
        <DataTable rows={rows} availability positions={["QB", "RB", "WR", "TE"]} search
          initialSort={{ key: "proj_fp_g", dir: "desc" }} limit={60}
          columns={[
            { key: "name", label: "Player", kind: "player" },
            { key: "status", label: "Availability", kind: "avail" },
            { key: "avail_status", label: "Status", fmt: "text" },
            { key: "avail_source", label: "Source", fmt: "text" },
            { key: "games_out_est", label: "Games out (est)" },
            { key: "return_week_est", label: "Back ~W", fmt: "int" },
            { key: "avail_ros", label: "ROS avail", fmt: "pct" },
            { key: "proj_fp_g", label: "Healthy/g" },
            { key: "ros_proj_g", label: "ROS/g" },
            { key: "injury_detail", label: "Detail", kind: "reasons" },
          ]} />
      </div>
    </>
  );
}
