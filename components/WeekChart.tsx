"use client";
import { useState } from "react";
import { fmt, type Fmt } from "@/lib/format";

export interface Series {
  label: string;
  color: string;
  values: (number | null)[];
}

const W = 420, H = 190, M = { t: 12, r: 14, b: 28, l: 40 };

export default function WeekChart({
  title, weeks, series, format = "num1", minMax,
}: { title: string; weeks: number[]; series: Series[]; format?: Fmt; minMax?: number }) {
  const [hi, setHi] = useState<number | null>(null);
  const all = series.flatMap((s) => s.values.filter((v): v is number => v !== null && Number.isFinite(v)));
  const rawMax = Math.max(minMax ?? 0, ...all, 0.0001);
  const max = niceCeil(rawMax);
  const min = Math.min(0, ...all);
  const n = weeks.length;
  const sx = (i: number) => (n <= 1 ? (M.l + W - M.r) / 2 : M.l + (i / (n - 1)) * (W - M.l - M.r));
  const sy = (v: number) => H - M.b - ((v - min) / (max - min || 1)) * (H - M.t - M.b);
  const ticks = [min, min + (max - min) / 2, max];

  return (
    <div className="card">
      <div className="card-head"><h3 style={{ margin: 0 }}>{title}</h3></div>
      {series.length > 1 && (
        <div className="legend">
          {series.map((s) => (
            <span key={s.label}><i className="line" style={{ background: s.color }} />{s.label}</span>
          ))}
        </div>
      )}
      <div className="chart">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} onPointerLeave={() => setHi(null)}>
          {ticks.map((t, i) => (
            <g key={i}>
              <line className="gridline" x1={M.l} x2={W - M.r} y1={sy(t)} y2={sy(t)} />
              <text className="tick" x={M.l - 6} y={sy(t) + 4} textAnchor="end">{fmt(t, format)}</text>
            </g>
          ))}
          {weeks.map((w, i) => (
            <text key={w} className="tick" x={sx(i)} y={H - 8} textAnchor="middle">W{w}</text>
          ))}
          {hi !== null && <line className="axisline" x1={sx(hi)} x2={sx(hi)} y1={M.t} y2={H - M.b} />}
          {series.map((s) => {
            const pts = s.values.map((v, i) => (v === null || !Number.isFinite(v) ? null : [sx(i), sy(v)] as const));
            const d = pts.reduce((acc, p, i) => (p ? acc + `${acc && pts[i - 1] ? "L" : "M"}${p[0]},${p[1]}` : acc), "");
            return (
              <g key={s.label}>
                <path d={d} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                {pts.map((p, i) => p && (
                  <circle key={i} cx={p[0]} cy={p[1]} r={hi === i ? 5.5 : 4} fill={s.color} stroke="var(--surface)" strokeWidth={2} />
                ))}
              </g>
            );
          })}
          {weeks.map((w, i) => (
            <rect key={"h" + w} x={sx(i) - (W - M.l - M.r) / Math.max(1, n - 1) / 2} y={0} width={(W - M.l - M.r) / Math.max(1, n - 1)} height={H}
              fill="transparent" onPointerEnter={() => setHi(i)} />
          ))}
        </svg>
        {hi !== null && (
          <div className="tooltip" style={{ left: `${(sx(hi) / W) * 100}%`, top: 8, transform: `translateX(${sx(hi) > W * 0.6 ? "calc(-100% - 10px)" : "10px"})` }}>
            <div className="tt-title">Week {weeks[hi]}</div>
            {series.map((s) => (
              <div className="tt-row" key={s.label}>
                <span><i style={{ display: "inline-block", width: 8, height: 2, background: s.color, marginRight: 6, verticalAlign: "middle" }} />{s.label}</span>
                <b>{fmt(s.values[hi], format)}</b>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function niceCeil(v: number) {
  if (v <= 1) return Math.ceil(v * 10) / 10;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const m = v / p;
  const nice = m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10;
  return nice * p;
}
