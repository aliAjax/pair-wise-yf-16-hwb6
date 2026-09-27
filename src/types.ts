export type TempZone = "cold" | "mid" | "warm";

export interface WaxType {
  id: string;
  name: string;
  zone: TempZone;
  range: string;
}

export interface Brush {
  id: string;
  name: string;
  /** 刷毛上残留的蜡所属温区；null 表示已清洁 */
  residueZone: TempZone | null;
  /** 占用该刷具的工单号 */
  occupiedBy: string | null;
  lastCleanedAt: string | null;
}

export type OrderStatus = "prep" | "waxing" | "done";

export interface OrderDraft {
  customer: string;
  brand: string;
  length: number;
  boardType: string;
  edgeAngle: string;
  waxTypeId: string;
  /** 底板损伤，空串表示无损伤 */
  baseDamage: string;
  /** 修补位置；有损伤时开工前必填 */
  repairSpots: string;
}

export interface BoardOrder extends OrderDraft {
  id: string;
  brushId: string | null;
  status: OrderStatus;
  createdAt: string;
  finishedAt: string | null;
}

export interface HistoryRecord {
  id: string;
  orderId: string;
  customer: string;
  board: string;
  waxName: string;
  brushLabel: string;
  edgeAngle: string;
  finishedAt: string;
}
