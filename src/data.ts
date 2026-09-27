import type { BoardOrder, Brush, HistoryRecord, TempZone, WaxType } from "./types";

export const ZONE_LABEL: Record<TempZone, string> = {
  cold: "低温区",
  mid: "中温区",
  warm: "高温区",
};

export const WAX_TYPES: WaxType[] = [
  { id: "wax-ch4", name: "低温硬蜡 CH-4", zone: "cold", range: "-12℃ ~ -6℃" },
  { id: "wax-ch8", name: "中温通用蜡 CH-8", zone: "mid", range: "-6℃ ~ -1℃" },
  { id: "wax-ch10", name: "高温软蜡 CH-10", zone: "warm", range: "-1℃ ~ +5℃" },
  { id: "wax-hf2", name: "粉雪氟蜡 HF-2", zone: "cold", range: "-15℃ ~ -8℃" },
];

export const BOARD_TYPES = ["全能板", "公园板", "竞速板", "粉雪板"];

export const EDGE_ANGLES = [
  "侧刃87° / 底刃1°",
  "侧刃88° / 底刃1°",
  "侧刃89° / 底刃1°",
  "侧刃90° / 底刃0.5°",
];

export const DAMAGE_OPTIONS = ["板底划痕", "板头磕边", "板尾磕边", "烧底(白化)", "板底凹陷"];

export const INITIAL_BRUSHES: Brush[] = [
  { id: "BR-01", name: "黄铜刷", residueZone: "cold", occupiedBy: "ORD-201", lastCleanedAt: null },
  { id: "BR-02", name: "尼龙刷", residueZone: "mid", occupiedBy: null, lastCleanedAt: null },
  { id: "BR-03", name: "马毛刷", residueZone: "warm", occupiedBy: "ORD-203", lastCleanedAt: null },
  { id: "BR-04", name: "铜丝刷", residueZone: "cold", occupiedBy: null, lastCleanedAt: null },
];

export const INITIAL_ORDERS: BoardOrder[] = [
  {
    id: "ORD-201",
    customer: "林雪",
    brand: "Burton",
    length: 165,
    boardType: "竞速板",
    edgeAngle: "侧刃89° / 底刃1°",
    waxTypeId: "wax-ch4",
    brushId: "BR-01",
    baseDamage: "板底划痕",
    repairSpots: "",
    status: "prep",
    createdAt: "09-27 09:02",
    finishedAt: null,
  },
  {
    id: "ORD-202",
    customer: "周野",
    brand: "Jones",
    length: 158,
    boardType: "粉雪板",
    edgeAngle: "侧刃88° / 底刃1°",
    waxTypeId: "wax-ch10",
    brushId: null,
    baseDamage: "",
    repairSpots: "",
    status: "prep",
    createdAt: "09-27 09:15",
    finishedAt: null,
  },
  {
    id: "ORD-203",
    customer: "陈竞",
    brand: "Salomon",
    length: 162,
    boardType: "全能板",
    edgeAngle: "侧刃88° / 底刃1°",
    waxTypeId: "wax-ch10",
    brushId: "BR-03",
    baseDamage: "板头磕边",
    repairSpots: "板头左侧 4cm 已补 P-Tex",
    status: "waxing",
    createdAt: "09-27 08:47",
    finishedAt: null,
  },
];

export const INITIAL_HISTORY: HistoryRecord[] = [
  {
    id: "HIS-01",
    orderId: "ORD-188",
    customer: "林雪",
    board: "Burton 165cm · 竞速板",
    waxName: "中温通用蜡 CH-8",
    brushLabel: "BR-04 铜丝刷",
    edgeAngle: "侧刃88° / 底刃1°",
    finishedAt: "09-19 14:20",
  },
  {
    id: "HIS-02",
    orderId: "ORD-193",
    customer: "陈竞",
    board: "Salomon 162cm · 全能板",
    waxName: "低温硬蜡 CH-4",
    brushLabel: "BR-01 黄铜刷",
    edgeAngle: "侧刃90° / 底刃0.5°",
    finishedAt: "09-24 11:05",
  },
];
