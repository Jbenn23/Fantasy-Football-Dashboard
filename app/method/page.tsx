import { getMeta } from "@/lib/data";
import { timeAgo } from "@/lib/format";

export default function Method() {
  const m = getMeta();
  const a = m.advanced;
  return (
    <div className="prose">
      <div className="pagehead">
        <h1>Method</h1>
        <p className="sub">What every number means, where it comes from, and how much to trust it.</p>
      </div>

      <h2>The core idea</h2>
      <p>
        Fantasy points = <b>opportunity</b> × <b>efficiency</b> (+ touchdown luck). Opportunity (targets, air yards,
        carries, red-zone work, routes) is sticky week to week. Efficiency and touchdowns are mostly noise over a few
        games. The market (your leaguemates, ESPN) prices players on points scored. This model prices them on
        opportunity, and treats the difference as an edge.
      </p>

      <h2>Projection</h2>
      <ul>
        <li><b>xFP</b> (expected fantasy points): from ffverse <code>ffopportunity</code>, which projects an expected stat line (receptions, yards, TDs, INTs, 2-pt) for every target, carry and dropback from down, distance, field position, air yards and game situation. That expected stat line is scored with your league&apos;s exact rules — see Scoring below.</li>
        <li><b>Usage</b> = 60% × xFP/g over the last {a?.recent_weeks ?? 2} weeks + 40% × season xFP/g (roles change, so recent usage counts more).</li>
        <li><b>FPOE</b> = actual − expected points per game (efficiency + TD luck).</li>
        <li><b>Regressed efficiency</b> = (games × FPOE + K × prior) ÷ (games + K). The prior is {a?.prior_stability ?? 0.4} × last season&apos;s FPOE/g (when the player had at least 6 games), otherwise 0. K by position: {a ? Object.entries(a.reg_k).map(([k, v]) => `${k} ${v}`).join(", ") : "QB 8, RB 12, WR 10, TE 12"} games. Bigger K means the current sample is trusted less.</li>
        <li><b>Projection / game</b> = usage + regressed efficiency. <b>Value gap</b> = projection − actual FP/g.</li>
      </ul>

      <h2>Scoring</h2>
      <p>
        <b>{m.scoring?.label ?? "Half PPR"}</b>{" "}
        {m.scoring?.source === "league" ? "— read from your ESPN league settings on every run." : "— default ESPN half-PPR; your league's settings haven't been read yet (first live run will replace this)."}
        {" "}{m.scoring?.rec_pts ?? 0.5} pt/reception · {m.scoring?.pass_td_pts ?? 4} pt pass TD ·
        1 pt per {m.scoring?.pass_yds_per_pt ?? 25} pass yds / {m.scoring?.rush_yds_per_pt ?? 10} rush yds / {m.scoring?.rec_yds_per_pt ?? 10} rec yds.
      </p>
      <ul>
        <li>Every linear rule (per yard, per reception, per completion/attempt/carry/target, TDs, INTs, fumbles lost, 2-pt, &ldquo;every N yards&rdquo;) is applied to both actual and expected stat lines. Actual totals were checked against nflverse&apos;s half-PPR and PPR box-score points (exact match).</li>
        <li>Single-game yardage bonuses{m.scoring?.bonuses?.length ? ` (your league uses ESPN stat ids ${m.scoring.bonuses.join(", ")})` : ""} count in actual points only; they have no expected equivalent, so they fall into efficiency and get regressed.</li>
        <li>Fumbles, sacks and YAC have no expected version, so they also land in efficiency.</li>
        {m.scoring?.unmodeled?.length ? <li><b>Not modeled:</b> ESPN stat ids {m.scoring.unmodeled.join(", ")} (long-TD bonuses or per-game ratios that free data can&apos;t reproduce). These are excluded from both actual and expected.</li> : null}
      </ul>

      <h2>Signals</h2>
      <ul>
        <li><b>Buy low</b>: value gap ≥ +2.0 pts/g and the player is fantasy-relevant (usage or scoring above a position floor: QB 14, RB/WR 8, TE 6).</li>
        <li><b>Sell high</b>: value gap ≤ −2.5 pts/g, same relevance floor.</li>
        <li><b>Role rising / falling</b>: in the last {a?.recent_weeks ?? 2} weeks vs earlier, any of xFP/g ±3, route share ±15 pts, target share ±7 pts, RB rush share ±15 pts, with no move in the other direction.</li>
        <li>Touchdowns ±1.5 vs expected and QB pass TDs ±2 vs expected are listed as reasons.</li>
      </ul>

      <h2>Matchups</h2>
      <ul>
        <li><b>Multiplier</b> = Vegas environment × opponent-adjusted points allowed, capped 0.75–1.30. Vegas: (team implied total ÷ league average − 1) × QB 0.8 / RB 0.6 / WR 0.4 / TE 0.4, plus RB game script 0.4% per point of spread.</li>
        <li><b>Opponent-adjusted points allowed</b>: what each offense&apos;s position group scored against a defense minus what that offense scores in its other games, averaged and shrunk by games/(games+6); weight 0.25 for QB/RB/TE, 0 for WR.</li>
        <li><b>Evidence</b>: backtested weeks 5–18 of 2024 and 2025. Within-week rank correlation (start/sit ordering) improved overall 0.378→0.400 (2024) and 0.342→0.360 (2025); QB +0.05, TE +0.025, RB ±0.01, WR +0.003. Absolute error got ~0.2–0.5% worse. Coefficients fit freely on one season flipped sign on the other, so the &ldquo;matchup type&rdquo; terms (deep-ball vulnerability, RB/TE target funnels, pass/rush EPA allowed, sack rate) are shown as context with zero weight.</li>
        <li><b>Week projection</b> = projection when playing × matchup × chance he plays. Lineups use the average of that and ESPN&apos;s weekly projection. <b>ROS/g</b> also folds in the remaining schedule (defense only; Vegas lines don&apos;t exist yet) and byes.</li>
      </ul>

      <h2>Injuries override the model</h2>
      <ul>
        <li><b>Status sources</b>, strongest first: your <code>injury_overrides.csv</code> (on the Mac mini, in ff-pipeline) → ESPN player news (scanned for &ldquo;out for the season&rdquo;, torn ACL/Achilles, &ldquo;miss X weeks&rdquo;) → ESPN league status → Sleeper → NFL injury report.</li>
        <li><b>Out for season</b>: rest-of-season value is 0 and every buy/sell/trend signal is removed.</li>
        <li><b>IR / PUP / suspension</b>: value × share of remaining weeks he&apos;s expected to play (IR default 6 games out unless news or an override says otherwise); buy/sell signals removed.</li>
        <li><b>Out / doubtful</b>: buy-low survives only if he&apos;s expected for ≥75% of remaining weeks.</li>
        <li><b>Vacated work</b>: an injured player with a real role (QB 12, RB 6, WR 6, TE 5+ xFP/g when healthy) hands his usage to healthy teammates. Weights blend what actually happened in games he missed (who absorbed the work), the current depth chart, and current share; backups keep 85% of the starter&apos;s expected points (QB 80%). Teammates gaining ≥1.5 pts/g ROS get <b>Role opened</b>.</li>
        <li><b>ROS/g</b> everywhere = projection when playing × expected availability. &ldquo;Healthy/g&rdquo; is the per-game projection when he plays.</li>
      </ul>

      <h2>Routes, TPRR and YPRR are estimates</h2>
      <p>
        No free source has actual routes run for {m.season ?? "this season"} (nflverse participation data stops at 2025;
        true route counts are paid PFF / FTN data). Routes are estimated per game as:
      </p>
      <p><code>team dropbacks × player offensive snap % × position route rate</code></p>
      <p>
        Route rates: {a ? Object.entries(a.route_rate).filter(([, v]) => v > 0).map(([k, v]) => `${k} ${v}`).join(", ") : "WR 0.97, TE 0.78, RB 0.60"}.
        Every player at a position gets the same rate, so <b>rankings within a position are driven by real snap share,
        targets and yards</b>. The absolute level is off for players who block a lot (inline TEs, pass-pro backs) or who
        mostly play on pass downs (3rd-down backs, slot specialists). Targets, yards, shares, EPA and xFP are not estimated.
      </p>

      <h2>Other metrics</h2>
      <ul>
        <li><b>Target share / air-yard share / WOPR</b> (1.5 × target share + 0.7 × air-yard share): nflverse weekly stats.</li>
        <li><b>First-read share</b>: share of the team&apos;s first-read targets (FTN charting <code>read_thrown</code>). One of the stickiest receiver signals.</li>
        <li><b>Catchable %, contested %, drops, INT-worthy throws</b>: FTN charting.</li>
        <li><b>EPA, success rate, CPOE, aDOT, red-zone / end-zone / inside-10 usage, PROE, pace</b>: nflverse play-by-play.</li>
        <li><b>Separation, YAC over expected, RYOE, time to throw, aggressiveness, 8+ box %</b>: NFL Next Gen Stats (only qualifying players).</li>
        <li><b>Yards before / after contact</b>: Pro Football Reference advanced stats.</li>
        <li><b>Percentiles</b>: within position, against players with real volume (WR 30 / TE 25 estimated routes, RB 12 carries, QB 40 dropbacks).</li>
        <li><b>Sleeper adds</b>: Sleeper&apos;s public trending endpoint, used as a market-demand signal on the waiver board.</li>
      </ul>

      <h2>Known limits</h2>
      <ul>
        <li>Early-season samples are small: after 3 games, expect projections to miss by several points a game for individual players.</li>
        <li>xFP doesn&apos;t know about QB changes, coaching changes or injuries ahead of time. Read the signals together with the news.</li>
        <li>Kickers and defenses are only on the waiver board (ESPN projections), not in the model.</li>
        <li>Injury haircut for rest-of-season value: IR × 0.35, suspension × 0.5, Out × 0.85, Doubtful × 0.9. These are heuristics.</li>
      </ul>

      <h2>Freshness</h2>
      <p className="sub">
        Last pipeline run {timeAgo(m.run_ts)}. NFL data through week {m.nflverse_last_week ?? "–"}. Sources: nflverse
        (play-by-play, stats, snaps, schedules), ffverse ffopportunity, FTN charting, NGS, PFR, DynastyProcess IDs, ESPN
        league API, Sleeper.
      </p>
    </div>
  );
}
