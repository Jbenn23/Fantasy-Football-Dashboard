import DataTable from "@/components/DataTable";
import { getDefProfiles, getMeta, getPlayers, getRosters, getWaivers, pick } from "@/lib/data";
import type { Row } from "@/lib/types";

export default function Matchups() {
  const meta = getMeta();
  const espnWk = new Map<string, number>([...getWaivers(), ...getRosters()].map((r: Row) => [String(r.espn_id), Number(r.proj_week)]));
  const players = getPlayers()
    .filter((p) => p.games >= 1 && (p.avail_ros ?? 1) > 0 && ((p.proj_fp_g ?? 0) >= 4 || p.status !== "FA"))
    .map((p) => {
      const e = espnWk.get(String(p.espn_id));
      const blend = e !== undefined && Number.isFinite(e) && p.wk_proj != null ? (e + p.wk_proj) / 2 : p.wk_proj;
      return { ...p, espn_wk: e ?? null, wk_blend: blend };
    });
  const rows = pick(players, ["gsis_id", "name", "position", "team", "status", "fantasy_team", "injury_status", "wk_opp",
    "matchup_grade", "matchup_mult", "m_env", "m_spread", "m_dvp", "proj_fp_g", "wk_proj", "espn_wk", "wk_blend",
    "sos_next4", "sos_playoffs", "games"]);
  const prof = getDefProfiles().map((d: Row) => ({ ...d, name: d.team, position: "" }));
  return (
    <>
      <div className="pagehead">
        <h1>Matchups — week {meta.week ?? ""}</h1>
        <p className="sub">
          Matchup multiplier = Vegas game environment (team implied total; point spread for RBs) × opponent-adjusted
          points allowed to the position. Backtested on 2024 and 2025: it improved start/sit ordering at QB (+0.05 rank
          correlation), TE (+0.025) and overall (+0.02); it adds ~nothing at WR, so WRs get only the Vegas term.
          Pass/rush efficiency allowed, deep-ball vulnerability, RB/TE target funnels and sack rate are shown below as
          context — they did not predict better out of sample, so they carry no weight. Usage still dominates: the
          multiplier is capped at 0.75–1.30.
        </p>
      </div>
      <div className="card">
        <div className="card-head"><h2>This week</h2><span className="small muted">Blend = average of our projection and ESPN&apos;s</span></div>
        <DataTable rows={rows} search availability positions={["QB", "RB", "WR", "TE"]} limit={60}
          initialSort={{ key: "wk_blend", dir: "desc" }}
          columns={[
            { key: "name", label: "Player", kind: "player" },
            { key: "status", label: "Availability", kind: "avail" },
            { key: "wk_opp", label: "Opp", fmt: "text" },
            { key: "matchup_grade", label: "Grade", fmt: "text", help: "A ≥ +10%, B +4–10%, C ±4%, D −4–10%, F ≤ −10%" },
            { key: "matchup_mult", label: "Mult", fmt: "num2" },
            { key: "m_env", label: "Vegas", kind: "delta", fmt: "signedpct", help: "Implied team total vs league average" },
            { key: "m_spread", label: "Script", kind: "delta", fmt: "signedpct", help: "RBs: favorites run more" },
            { key: "m_dvp", label: "Defense", kind: "delta", fmt: "signedpct", help: "Opponent-adjusted points allowed to the position (shrunk)" },
            { key: "proj_fp_g", label: "Neutral/g" },
            { key: "wk_proj", label: "Model wk" },
            { key: "espn_wk", label: "ESPN wk" },
            { key: "wk_blend", label: "Blend" },
            { key: "sos_next4", label: "Next 4", fmt: "num2", help: "Average matchup multiplier, next 4 weeks (defense only)" },
            { key: "sos_playoffs", label: "Wk 15–17", fmt: "num2", help: "Fantasy playoff schedule" },
          ]} />
      </div>
      <div className="card section">
        <div className="card-head"><h2>Defense profiles</h2><span className="small muted">Shrunk toward average by sample size · + = worse defense for the offense facing it</span></div>
        <DataTable rows={prof} initialSort={{ key: "dvp_fp_WR", dir: "desc" }}
          columns={[
            { key: "team", label: "Defense", fmt: "text" },
            { key: "games", label: "G", fmt: "int" },
            { key: "dvp_fp_QB", label: "QB pts +/-", kind: "delta", help: "Points allowed vs what those offenses usually score (per game, shrunk)" },
            { key: "dvp_fp_RB", label: "RB pts +/-", kind: "delta" },
            { key: "dvp_fp_WR", label: "WR pts +/-", kind: "delta" },
            { key: "dvp_fp_TE", label: "TE pts +/-", kind: "delta" },
            { key: "pass_epa_adj", label: "Pass EPA adj", kind: "delta", fmt: "num3" },
            { key: "rush_epa_adj", label: "Rush EPA adj", kind: "delta", fmt: "num3" },
            { key: "deep_epa_adj", label: "Deep EPA adj", kind: "delta", fmt: "num3", help: "EPA per 15+ air-yard target vs league (context only)" },
            { key: "rb_tgt_adj", label: "RB tgt funnel", kind: "delta", fmt: "signedpct", help: "Share of targets to RBs vs those offenses' norm (context only)" },
            { key: "te_tgt_adj", label: "TE tgt funnel", kind: "delta", fmt: "signedpct" },
            { key: "sack_rate_adj", label: "Sack rate adj", kind: "delta", fmt: "signedpct" },
          ]} />
      </div>
    </>
  );
}
