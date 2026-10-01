export type Row = Record<string, any>;

export interface Player extends Row {
  gsis_id: string;
  espn_id: string | null;
  name: string;
  position: "QB" | "RB" | "WR" | "TE";
  team: string;
  status: "FA" | "ROSTERED" | "MINE";
  fantasy_team: string | null;
  injury_status: string | null;
  games: number;
  fp_g: number;
  xfp_g: number;
  proj_fp_g: number;
  value_gap: number;
  signals: string;
  reasons: string;
}

export interface WeeklyRow extends Row {
  gsis_id: string;
  week: number;
}

export interface TeamCtx extends Row {
  team: string;
}

export interface Meta {
  run_ts?: string;
  league_id?: number;
  season?: number;
  week?: number;
  league_name?: string;
  slots?: Record<string, number>;
  my_team_id?: number | null;
  faab?: boolean;
  faab_budget?: number;
  scoring?: {
    source: string; label: string; rec_pts: number; pass_td_pts: number;
    pass_yds_per_pt: number | null; rush_yds_per_pt: number | null; rec_yds_per_pt: number | null;
    bonuses: number[]; unmodeled: number[]; rules: Record<string, number>;
  };
  errors: Record<string, string>;
  sample?: boolean;
  nflverse_last_week?: number;
  advanced?: {
    last_week: number;
    next_week: number;
    route_rate: Record<string, number>;
    reg_k: Record<string, number>;
    prior_stability: number;
    recent_weeks: number;
  };
  tables?: Record<string, number>;
}
