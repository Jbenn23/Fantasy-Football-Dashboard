import "server-only";
import type { Col } from "@/components/DataTable";
import { getFallout } from "@/lib/data";
import type { Row } from "@/lib/types";

export const fallCols: Col[] = [
  { key: "name", label: "Inherits the work", kind: "player" },
  { key: "status", label: "Availability", kind: "avail" },
  { key: "injured", label: "Replacing", fmt: "text" },
  { key: "injured_status", label: "Status", fmt: "text" },
  { key: "horizon", label: "For", fmt: "text" },
  { key: "vacated_xfp_g", label: "Vacated xFP/g", help: "Injured player's expected points per game when healthy" },
  { key: "depth_rank", label: "Depth", fmt: "int", help: "Current ESPN depth chart rank at his position" },
  { key: "boost_xfp_g", label: "+xFP/g", help: "Added expected points per game while the starter is out" },
  { key: "new_usage_xfp_g", label: "New usage/g", help: "Projected xFP/g in the new role (blends observed games without the starter, depth chart and current share)" },
  { key: "adds_24h", label: "Sleeper adds", fmt: "int" },
  { key: "method", label: "Evidence", kind: "reasons" },
];

export function falloutRows(): Row[] {
  return getFallout().map((f: Row) => ({
    ...f, name: f.beneficiary, gsis_id: f.beneficiary_gsis, position: f.beneficiary_pos,
    status: f.beneficiary_status, fantasy_team: f.beneficiary_team,
  }));
}

