import DataTable from "@/components/DataTable";
import { getTeamCtx } from "@/lib/data";

export default function Teams() {
  const rows = getTeamCtx().map((t) => ({ ...t, name: t.team, position: "" }));
  return (
    <>
      <div className="pagehead">
        <h1>Team context</h1>
        <p className="sub">
          Volume and environment drive fantasy ceilings. Neutral = 1st/2nd down, win prob 20-80%, outside the last two
          minutes of a half. PROE = pass rate over expected (nflverse xpass). Defensive EPA: lower is better (rank 1 = best).
        </p>
      </div>
      <div className="card">
        <DataTable
          rows={rows}
          initialSort={{ key: "implied_total", dir: "desc" }}
          columns={[
            { key: "team", label: "Team", fmt: "text" },
            { key: "next_opp", label: "Next", fmt: "text" },
            { key: "spread", label: "Spread", fmt: "num1", help: "Negative = favored" },
            { key: "implied_total", label: "Implied pts" },
            { key: "plays_pg", label: "Plays/g" },
            { key: "neutral_pass_rate", label: "Neutral pass %", fmt: "pct" },
            { key: "neutral_proe", label: "PROE", fmt: "pct1" },
            { key: "neutral_sec_per_play", label: "Sec/play (neutral)", help: "Mean game-clock seconds between snaps, neutral situations. Lower = faster" },
            { key: "off_epa_play", label: "Off EPA/play", fmt: "num3" },
            { key: "off_epa_db", label: "Off EPA/db", fmt: "num3" },
            { key: "off_epa_rush", label: "Off EPA/rush", fmt: "num3" },
            { key: "def_epa_db", label: "Def EPA/db", fmt: "num3" },
            { key: "def_epa_rush", label: "Def EPA/rush", fmt: "num3" },
            { key: "fp_allowed_QB", label: "QB pts allowed/g" },
            { key: "fp_allowed_RB", label: "RB pts allowed/g" },
            { key: "fp_allowed_WR", label: "WR pts allowed/g" },
            { key: "fp_allowed_TE", label: "TE pts allowed/g" },
          ]}
        />
      </div>
    </>
  );
}
