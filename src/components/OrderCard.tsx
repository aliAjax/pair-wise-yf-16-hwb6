import { useState } from "react";
import { EDGE_ANGLES, ZONE_LABEL } from "../data";
import { blockersOf, waxOf } from "../logic";
import type { BoardOrder, Brush, OrderStatus } from "../types";

const STATUS_LABEL: Record<OrderStatus, string> = {
  prep: "待准备",
  waxing: "打蜡中",
  done: "工单已完工",
};

interface OrderCardProps {
  order: BoardOrder;
  brushes: Brush[];
  onStart: (orderId: string) => void;
  onFinish: (orderId: string) => void;
  onSaveRepair: (orderId: string, spots: string) => void;
  onEdgeChange: (orderId: string, edgeAngle: string) => void;
}

export function OrderCard({
  order,
  brushes,
  onStart,
  onFinish,
  onSaveRepair,
  onEdgeChange,
}: OrderCardProps) {
  const wax = waxOf(order);
  const brush = brushes.find((b) => b.id === order.brushId) ?? null;
  const blockers = blockersOf(order, brushes);
  const [spots, setSpots] = useState("");
  const needRepair =
    order.status === "prep" && order.baseDamage !== "" && order.repairSpots.trim() === "";

  function submitRepair() {
    if (spots.trim() === "") return;
    onSaveRepair(order.id, spots.trim());
    setSpots("");
  }

  return (
    <article className={`order-card ${order.status}`}>
      <div className="head">
        <div>
          <h3>
            {order.id} · {order.customer}
          </h3>
          <p className="sub">
            {order.brand} {order.length}cm · {order.boardType} · 登记 {order.createdAt}
          </p>
        </div>
        <span className={`pill ${order.status}`}>{STATUS_LABEL[order.status]}</span>
      </div>

      <dl className="kv">
        <dt>蜡型</dt>
        <dd>
          {wax.name}
          <span className={`badge ${wax.zone}`}>{ZONE_LABEL[wax.zone]}</span>
          <span className="hint">{wax.range}</span>
        </dd>
        <dt>刷具</dt>
        <dd>
          {brush ? `${brush.id} ${brush.name}` : "待分配"}
          {order.status === "done" && brush && <span className="hint">已释放</span>}
        </dd>
        <dt>刃角</dt>
        <dd>
          {order.status === "waxing" ? (
            <select
              value={order.edgeAngle}
              onChange={(e) => onEdgeChange(order.id, e.target.value)}
            >
              {EDGE_ANGLES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          ) : (
            order.edgeAngle
          )}
        </dd>
        <dt>底板损伤</dt>
        <dd>
          {order.baseDamage || "无损伤"}
          {order.repairSpots && <span className="hint">修补：{order.repairSpots}</span>}
        </dd>
      </dl>

      {needRepair && (
        <div className="repair-row">
          <input
            placeholder="登记修补位置，如：板底中部 12cm 补 P-Tex"
            value={spots}
            onChange={(e) => setSpots(e.target.value)}
          />
          <button onClick={submitRepair}>登记修补位置</button>
        </div>
      )}

      {blockers.length > 0 && (
        <ul className="blockers">
          {blockers.map((b) => (
            <li key={b}>⚠ {b}</li>
          ))}
        </ul>
      )}

      <div className="actions">
        {order.status === "prep" && (
          <button
            className="primary"
            disabled={blockers.length > 0}
            onClick={() => onStart(order.id)}
          >
            开始打蜡
          </button>
        )}
        {order.status === "waxing" && (
          <button className="primary" onClick={() => onFinish(order.id)}>
            完工并释放刷具
          </button>
        )}
        {order.status === "done" && (
          <span className="hint">
            完工 {order.finishedAt} · 刷具已释放，残留{ZONE_LABEL[wax.zone]}蜡
          </span>
        )}
      </div>
    </article>
  );
}
