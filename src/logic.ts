import { WAX_TYPES } from "./data";
import type { BoardOrder, Brush, TempZone } from "./types";

export function waxOf(order: BoardOrder) {
  const wax = WAX_TYPES.find((w) => w.id === order.waxTypeId);
  if (!wax) throw new Error(`未知蜡型: ${order.waxTypeId}`);
  return wax;
}

export function now(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * 在空闲刷具中挑选一支：优先刷毛残留同温区蜡的（可直接复用），
 * 其次是已清洁（residueZone 为 null）的。残留其他温区蜡的刷具不可用。
 */
export function pickBrush(brushes: Brush[], zone: TempZone): Brush | null {
  const free = brushes.filter((b) => !b.occupiedBy);
  return (
    free.find((b) => b.residueZone === zone) ??
    free.find((b) => b.residueZone === null) ??
    null
  );
}

/**
 * 依次为还没拿到刷具的待准备工单占用刷具（先登记的工单优先）。
 * 每次状态变化后都跑一遍：刷具清洁或完工释放后，等待的工单自动占用。
 */
export function assignBrushes(
  orders: BoardOrder[],
  brushes: Brush[]
): { orders: BoardOrder[]; brushes: Brush[] } {
  const nextBrushes = brushes.map((b) => ({ ...b }));
  let changed = false;
  const nextOrders = orders.map((order) => {
    if (order.status !== "prep" || order.brushId) return order;
    const brush = pickBrush(nextBrushes, waxOf(order).zone);
    if (!brush) return order;
    brush.occupiedBy = order.id;
    changed = true;
    return { ...order, brushId: brush.id };
  });
  return changed ? { orders: nextOrders, brushes: nextBrushes } : { orders, brushes };
}

/** 待准备工单的阻塞原因；返回空数组表示可以开始打蜡 */
export function blockersOf(order: BoardOrder, brushes: Brush[]): string[] {
  if (order.status !== "prep") return [];
  const reasons: string[] = [];

  if (order.baseDamage !== "" && order.repairSpots.trim() === "") {
    reasons.push("底板损伤未登记修补位置，不能开始打蜡");
  }

  if (!order.brushId) {
    const zone = waxOf(order).zone;
    const dirty = brushes.filter(
      (b) => !b.occupiedBy && b.residueZone !== null && b.residueZone !== zone
    );
    reasons.push(
      dirty.length > 0
        ? `刷具残留其他温区蜡，换温区前需先登记清洁：${dirty.map((b) => b.id).join("、")}`
        : "对应温区刷具全部被占用，等待完工释放"
    );
  }

  return reasons;
}
