import { ZONE_LABEL } from "../data";
import { waxOf } from "../logic";
import type { BoardOrder, Brush } from "../types";

interface BrushRackProps {
  brushes: Brush[];
  orders: BoardOrder[];
  onClean: (brushId: string) => void;
}

export function BrushRack({ brushes, orders, onClean }: BrushRackProps) {
  return (
    <div className="brush-list">
      {brushes.map((brush) => {
        const order = orders.find((o) => o.id === brush.occupiedBy) ?? null;
        const inUseZone = order ? waxOf(order).zone : null;
        const dirty = !brush.occupiedBy && brush.residueZone !== null;

        return (
          <div
            key={brush.id}
            className={`brush-card${dirty ? " dirty" : ""}${order ? " occupied" : ""}`}
          >
            <div className="row">
              <strong>
                {brush.id} {brush.name}
              </strong>
              {order && inUseZone && (
                <span className={`badge ${inUseZone}`}>占用中 · {ZONE_LABEL[inUseZone]}</span>
              )}
              {!order && brush.residueZone && (
                <span className={`badge ${brush.residueZone}`}>
                  残留{ZONE_LABEL[brush.residueZone]}蜡
                </span>
              )}
              {!order && !brush.residueZone && <span className="badge clean">已清洁</span>}
            </div>
            <p className="meta">
              {order && `工单 ${order.id} 打蜡中，完工后释放`}
              {!order &&
                brush.residueZone &&
                "换温区前必须登记清洁，否则软蜡残留会带进下一块板"}
              {!order &&
                !brush.residueZone &&
                `可分配任意温区${brush.lastCleanedAt ? ` · 清洁于 ${brush.lastCleanedAt}` : ""}`}
            </p>
            {dirty && (
              <button onClick={() => onClean(brush.id)}>登记清洁完成</button>
            )}
          </div>
        );
      })}
    </div>
  );
}
