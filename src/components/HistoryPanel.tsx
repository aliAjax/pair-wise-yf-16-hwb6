import type { HistoryRecord } from "../types";

export function HistoryPanel({ history }: { history: HistoryRecord[] }) {
  const groups = new Map<string, HistoryRecord[]>();
  for (const rec of history) {
    const list = groups.get(rec.customer) ?? [];
    list.push(rec);
    groups.set(rec.customer, list);
  }

  return (
    <div className="history-list">
      {[...groups.entries()].map(([customer, records]) => (
        <div key={customer} className="history-group">
          <h3>
            {customer}
            <span className="hint">{records.length} 次维护</span>
          </h3>
          <ul>
            {records.map((rec) => (
              <li key={rec.id}>
                <span className="hint">
                  {rec.finishedAt} · {rec.orderId}
                </span>
                <strong>{rec.board}</strong>
                <span className="line">
                  蜡型 {rec.waxName} · 刷具 {rec.brushLabel} · 刃角 {rec.edgeAngle}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
