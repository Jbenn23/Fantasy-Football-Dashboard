import type { Row } from "./types";

export const SLOT_ELIG: Record<string, string[]> = {
  QB: ["QB"], RB: ["RB"], WR: ["WR"], TE: ["TE"], K: ["K"], "D/ST": ["D/ST"],
  "RB/WR/TE": ["RB", "WR", "TE"], "WR/TE": ["WR", "TE"], "RB/WR": ["RB", "WR"],
  OP: ["QB", "RB", "WR", "TE"], "QB/RB/WR/TE": ["QB", "RB", "WR", "TE"],
};

export interface SlotPick {
  slot: string;
  player: Row | null;
}

/** Greedy optimal lineup by `value(row)`: single-position slots first, then flex (narrowest first). */
export function bestLineup(players: Row[], slots: Record<string, number>, value: (r: Row) => number): SlotPick[] {
  const used = new Set<string>();
  const out: SlotPick[] = [];
  const order = Object.entries(slots)
    .filter(([s]) => SLOT_ELIG[s])
    .sort((a, b) => SLOT_ELIG[a[0]].length - SLOT_ELIG[b[0]].length);
  const sorted = [...players].sort((a, b) => value(b) - value(a));
  for (const [slot, n] of order) {
    for (let i = 0; i < n; i++) {
      const p = sorted.find((r) => !used.has(String(r.espn_id)) && SLOT_ELIG[slot].includes(r.position) && value(r) > 0);
      if (p) used.add(String(p.espn_id));
      out.push({ slot, player: p ?? null });
    }
  }
  const rank = (s: string) => ["QB", "RB", "WR", "TE", "RB/WR/TE", "WR/TE", "RB/WR", "OP", "QB/RB/WR/TE", "K", "D/ST"].indexOf(s);
  return out.sort((a, b) => rank(a.slot) - rank(b.slot));
}
