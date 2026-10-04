import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Meta, Player, Row, TeamCtx, WeeklyRow } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

function readTable<T = Row>(name: string): { run_ts: string | null; rows: T[] } {
  const file = path.join(DATA_DIR, `${name}.json`);
  if (!fs.existsSync(file)) return { run_ts: null, rows: [] };
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const cache = new Map<string, unknown>();
function memo<T>(key: string, fn: () => T): T {
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key) as T;
}

export function getMeta(): Meta {
  return memo("meta", () => {
    const file = path.join(DATA_DIR, "meta.json");
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : { errors: {}, sample: true };
  });
}

export const getPlayers = () => memo("players", () => readTable<Player>("adv_players").rows);
export const getWeekly = () => memo("weekly", () => readTable<WeeklyRow>("adv_weekly").rows);
export const getTeamCtx = () => memo("teamctx", () => readTable<TeamCtx>("team_ctx").rows);
export const getLeagueTeams = () => memo("teams", () => readTable("teams").rows);
export const getRosters = () => memo("rosters", () => readTable("rosters").rows);
export const getWaivers = () => memo("waivers", () => readTable("waiver_board").rows);
export const getMyTeam = () => memo("myteam", () => readTable("my_team").rows);
export const getActivity = () => memo("activity", () => readTable("activity").rows);
export const getDefProfiles = () => memo("defprof", () => readTable("def_profiles").rows);
export function getNews(): { run_ts: string | null; source?: string; rows: Row[] } {
  return memo("news", () => readTable("news"));
}
export const getFallout = () => memo("fallout", () => readTable("injury_fallout").rows);

/** Keep only the listed keys (to keep client payloads small). */
export function pick<T extends Row>(rows: T[], keys: string[]): Row[] {
  return rows.map((r) => {
    const o: Row = {};
    for (const k of keys) if (k in r) o[k] = r[k];
    return o;
  });
}

export function playerByEspn(): Map<string, Player> {
  return memo("byEspn", () => {
    const m = new Map<string, Player>();
    for (const p of getPlayers()) if (p.espn_id) m.set(String(p.espn_id), p);
    return m;
  });
}
