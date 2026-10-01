import { INJURY_LABEL, SIGNAL_META, signalList } from "@/lib/format";

export function Signals({ value }: { value?: string | null }) {
  const list = signalList(value);
  if (!list.length) return <span className="muted">–</span>;
  return (
    <span className="chips">
      {list.map((s) => {
        const m = SIGNAL_META[s];
        if (!m) return null;
        return (
          <span key={s} className={`chip ${m.tone}`} title={m.help}>
            <span aria-hidden>{m.icon}</span>
            {m.label}
          </span>
        );
      })}
    </span>
  );
}

export function Injury({ status }: { status?: string | null }) {
  if (!status || status === "ACTIVE" || status === "NORMAL") return null;
  const m = INJURY_LABEL[status] ?? { label: status, level: "warning" as const };
  return <span className={`inj ${m.level}`} title={status}>{m.label}</span>;
}

const AVAIL_LABEL: Record<string, string> = { FA: "Free agent", ROSTERED: "Rostered", MINE: "My team" };

export function Avail({ status, team }: { status?: string | null; team?: string | null }) {
  if (!status) return null;
  return (
    <span className={`avail ${status}`} title={team ?? undefined}>
      <i aria-hidden />
      {status === "ROSTERED" && team ? team : AVAIL_LABEL[status] ?? status}
    </span>
  );
}
