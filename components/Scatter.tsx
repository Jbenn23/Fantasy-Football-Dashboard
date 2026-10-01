"use client";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { fmt } from "@/lib/format";

export interface Pt {
  id: string;
  name: string;
  team: string;
  position: string;
  status: "FA" | "ROSTERED" | "MINE";
  fantasy_team?: string | null;
  x: number; // xFP/g
  y: number; // FP/g
  proj: number;
  gap: number;
  games: number;
}

const W = 900, H = 520, M = { t: 16, r: 18, b: 44, l: 48 };
const STATUS = [
  { k: "FA", label: "Free agent", color: "var(--s-fa)" },
  { k: "ROSTERED", label: "Rostered (other team)", color: "var(--s-rostered)" },
  { k: "MINE", label: "My team", color: "var(--s-mine)" },
] as const;

function niceMax(v: number) {
  const step = v > 30 ? 10 : 5;
  return Math.ceil(v / step) * step;
}

export default function Scatter({ points }: { points: Pt[] }) {
  const router = useRouter();
  const [pos, setPos] = useState("ALL");
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const [hover, setHover] = useState<Pt | null>(null);
  const ref = useRef<SVGSVGElement>(null);

  const pts = useMemo(
    () => points.filter((p) => (pos === "ALL" || p.position === pos) && !hidden[p.status]),
    [points, pos, hidden],
  );
  const max = niceMax(Math.max(10, ...points.map((p) => Math.max(p.x, p.y))));
  const sx = (v: number) => M.l + (v / max) * (W - M.l - M.r);
  const sy = (v: number) => H - M.b - (Math.max(0, v) / max) * (H - M.t - M.b);
  const ticks = Array.from({ length: max / 5 + 1 }, (_, i) => i * 5).filter((t) => max <= 30 || t % 10 === 0);

  // Selective labels: the 3 biggest buy and 3 biggest sell gaps in view
  const labeled = useMemo(() => {
    const s = [...pts].sort((a, b) => b.gap - a.gap);
    return new Set([...s.slice(0, 3), ...s.slice(-3)].filter((p) => Math.abs(p.gap) >= 2).map((p) => p.id));
  }, [pts]);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = ref.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * W;
    const my = ((e.clientY - rect.top) / rect.height) * H;
    let best: Pt | null = null, bd = 18 * 18;
    for (const p of pts) {
      const dx = sx(p.x) - mx, dy = sy(p.y) - my, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = p; }
    }
    setHover(best);
  };

  // draw order: FA first, mine last (on top)
  const order = { FA: 0, ROSTERED: 1, MINE: 2 } as const;
  const sorted = [...pts].sort((a, b) => order[a.status] - order[b.status]);

  return (
    <div>
      <div className="controls">
        <div className="seg" role="group" aria-label="Position">
          {["ALL", "QB", "RB", "WR", "TE"].map((p) => (
            <button key={p} aria-pressed={pos === p} onClick={() => setPos(p)}>{p === "ALL" ? "All" : p}</button>
          ))}
        </div>
        <div className="legend" style={{ margin: 0 }}>
          {STATUS.map((s) => (
            <button
              key={s.k}
              onClick={() => setHidden((h) => ({ ...h, [s.k]: !h[s.k] }))}
              aria-pressed={!hidden[s.k]}
              style={{ all: "unset", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, opacity: hidden[s.k] ? 0.4 : 1 }}
              title="Show / hide"
            >
              <i style={{ background: s.color, width: 10, height: 10, borderRadius: "50%", display: "inline-block" }} />
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="chart">
        <svg
          ref={ref}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Scatter of expected fantasy points per game versus actual fantasy points per game"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          onClick={() => hover && router.push(`/players/${hover.id}`)}
          style={{ cursor: hover ? "pointer" : "default" }}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line className="gridline" x1={sx(0)} x2={sx(max)} y1={sy(t)} y2={sy(t)} />
              <line className="gridline" x1={sx(t)} x2={sx(t)} y1={sy(0)} y2={sy(max)} />
              <text className="tick" x={M.l - 8} y={sy(t) + 4} textAnchor="end">{t}</text>
              <text className="tick" x={sx(t)} y={H - M.b + 16} textAnchor="middle">{t}</text>
            </g>
          ))}
          <line className="axisline" x1={sx(0)} x2={sx(max)} y1={sy(0)} y2={sy(0)} />
          <line className="ref" x1={sx(0)} y1={sy(0)} x2={sx(max)} y2={sy(max)} />
          <text className="quad" x={sx(max * 0.04)} y={sy(max * 0.93)}>Above line: scoring beats usage → regression risk (sell)</text>
          <text className="quad" x={sx(max * 0.98)} y={sy(max * 0.06)} textAnchor="end">Below line: usage beats scoring → bounce-back (buy)</text>
          <text className="axis-title" x={(M.l + W - M.r) / 2} y={H - 6} textAnchor="middle">Expected fantasy points / game (xFP, usage-based)</text>
          <text className="axis-title" transform={`translate(13 ${(M.t + H - M.b) / 2}) rotate(-90)`} textAnchor="middle">Actual fantasy points / game</text>
          {sorted.map((p) => (
            <circle
              key={p.id}
              cx={sx(p.x)}
              cy={sy(p.y)}
              r={hover?.id === p.id ? 7 : 4.5}
              fill={STATUS.find((s) => s.k === p.status)!.color}
              stroke="var(--surface)"
              strokeWidth={2}
              opacity={hover && hover.id !== p.id ? 0.55 : 0.95}
            />
          ))}
          {sorted.filter((p) => labeled.has(p.id)).map((p) => (
            <text key={"l" + p.id} x={sx(p.x) + 8} y={sy(p.y) - 7} fontSize={11} fill="var(--ink-2)" style={{ paintOrder: "stroke", stroke: "var(--surface)", strokeWidth: 3 }}>
              {p.name.split(" ").slice(-1)[0]}
            </text>
          ))}
        </svg>
        {hover && (
          <div
            className="tooltip"
            style={{
              left: `${(sx(hover.x) / W) * 100}%`,
              top: `${(sy(hover.y) / H) * 100}%`,
              transform: `translate(${sx(hover.x) > W * 0.65 ? "calc(-100% - 12px)" : "12px"}, -50%)`,
            }}
          >
            <div className="tt-title">{hover.name} <span className="muted">{hover.position} · {hover.team}</span></div>
            <div className="tt-row">FP/g <b>{fmt(hover.y)}</b></div>
            <div className="tt-row">xFP/g <b>{fmt(hover.x)}</b></div>
            <div className="tt-row">Model proj/g <b>{fmt(hover.proj)}</b></div>
            <div className="tt-row">Value gap <b>{fmt(hover.gap, "signed1")}</b></div>
            <div className="tt-row">Games <b>{hover.games}</b></div>
            <div className="tt-row">{hover.status === "ROSTERED" ? hover.fantasy_team : hover.status === "MINE" ? "My team" : "Free agent"}</div>
          </div>
        )}
      </div>
    </div>
  );
}
