import { useState } from "react";
import "./styles.css";
import { BrushRack } from "./components/BrushRack";
import { HistoryPanel } from "./components/HistoryPanel";
import { OrderCard } from "./components/OrderCard";
import { OrderForm } from "./components/OrderForm";
import {
  BOARD_TYPES,
  INITIAL_BRUSHES,
  INITIAL_HISTORY,
  INITIAL_ORDERS,
  WAX_TYPES,
  ZONE_LABEL,
} from "./data";
import { assignBrushes, blockersOf, now, waxOf } from "./logic";
import type { BoardOrder, Brush, HistoryRecord, OrderDraft, OrderStatus } from "./types";

const STATUS_FILTERS: { key: "all" | OrderStatus; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "prep", label: "待准备" },
  { key: "waxing", label: "打蜡中" },
  { key: "done", label: "已完工" },
];

const STATUS_RANK: Record<OrderStatus, number> = { prep: 0, waxing: 1, done: 2 };

function App() {
  const [orders, setOrders] = useState<BoardOrder[]>(INITIAL_ORDERS);
  const [brushes, setBrushes] = useState<Brush[]>(INITIAL_BRUSHES);
  const [history, setHistory] = useState<HistoryRecord[]>(INITIAL_HISTORY);
  const [nextNo, setNextNo] = useState(204);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [typeFilter, setTypeFilter] = useState("全部");

  // 每次状态变化后，为仍在待准备且没有刷具的工单尝试占用刷具
  function commit(nextOrders: BoardOrder[], nextBrushes: Brush[]) {
    const assigned = assignBrushes(nextOrders, nextBrushes);
    setOrders(assigned.orders);
    setBrushes(assigned.brushes);
  }

  function registerOrder(draft: OrderDraft) {
    const order: BoardOrder = {
      ...draft,
      id: `ORD-${nextNo}`,
      brushId: null,
      status: "prep",
      createdAt: now(),
      finishedAt: null,
    };
    setNextNo((n) => n + 1);
    commit([...orders, order], brushes);
  }

  // 刷具换温区前登记清洁：清掉刷毛上的蜡残留
  function cleanBrush(brushId: string) {
    commit(
      orders,
      brushes.map((b) =>
        b.id === brushId ? { ...b, residueZone: null, lastCleanedAt: now() } : b
      )
    );
  }

  function startWaxing(orderId: string) {
    const order = orders.find((o) => o.id === orderId);
    if (!order || blockersOf(order, brushes).length > 0) return;
    commit(
      orders.map((o) => (o.id === orderId ? { ...o, status: "waxing" } : o)),
      brushes
    );
  }

  function saveRepair(orderId: string, spots: string) {
    commit(
      orders.map((o) => (o.id === orderId ? { ...o, repairSpots: spots } : o)),
      brushes
    );
  }

  function changeEdge(orderId: string, edgeAngle: string) {
    commit(
      orders.map((o) => (o.id === orderId ? { ...o, edgeAngle } : o)),
      brushes
    );
  }

  function finishOrder(orderId: string) {
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.status !== "waxing" || !order.brushId) return;
    const brush = brushes.find((b) => b.id === order.brushId);
    if (!brush) return;
    const wax = waxOf(order);
    const finishedAt = now();

    // 客户历史保留当次蜡型、刷具与刃角结果
    const record: HistoryRecord = {
      id: `HIS-${String(history.length + 1).padStart(2, "0")}`,
      orderId: order.id,
      customer: order.customer,
      board: `${order.brand} ${order.length}cm · ${order.boardType}`,
      waxName: wax.name,
      brushLabel: `${brush.id} ${brush.name}`,
      edgeAngle: order.edgeAngle,
      finishedAt,
    };
    setHistory((h) => [record, ...h]);

    // 完工释放刷具，刷毛上留下当次蜡的温区残留
    commit(
      orders.map((o) => (o.id === orderId ? { ...o, status: "done", finishedAt } : o)),
      brushes.map((b) =>
        b.id === brush.id ? { ...b, occupiedBy: null, residueZone: wax.zone } : b
      )
    );
  }

  const visible = orders
    .filter((o) => statusFilter === "all" || o.status === statusFilter)
    .filter((o) => typeFilter === "全部" || o.boardType === typeFilter)
    .slice()
    .sort(
      (a, b) =>
        STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
        a.createdAt.localeCompare(b.createdAt)
    );

  const metrics = [
    { label: "待准备工单", value: orders.filter((o) => o.status === "prep").length },
    { label: "打蜡中", value: orders.filter((o) => o.status === "waxing").length },
    { label: "今日完工", value: orders.filter((o) => o.status === "done").length },
    {
      label: "待清洁刷具",
      value: brushes.filter((b) => !b.occupiedBy && b.residueZone !== null).length,
    },
  ];

  return (
    <main className="app">
      <section className="hero">
        <p>hxyfront-62004 · 源提示词6 · Port 62004</p>
        <h1>滑雪板调校 · 打蜡准备台</h1>
        <span>
          按雪温温区调度蜡与刷具：登记雪板品牌、长度、板型、刃角与底板损伤，选定蜡型即占用对应温区刷具；
          刷具换温区前必须登记清洁完成，否则下一块板停在待准备；底板损伤未登记修补位置不得开工；
          完工释放刷具，客户历史保留当次蜡型、刷具与刃角结果。
        </span>
      </section>

      <section className="metrics">
        {metrics.map((m) => (
          <article key={m.label}>
            <small>{m.label}</small>
            <strong>{m.value}</strong>
          </article>
        ))}
      </section>

      <section className="workspace">
        <aside className="side">
          <section className="panel">
            <div className="heading">
              <div>
                <p>刷具架</p>
                <h2>温区占用与清洁</h2>
              </div>
            </div>
            <BrushRack brushes={brushes} orders={orders} onClean={cleanBrush} />
          </section>

          <section className="panel">
            <div className="heading">
              <div>
                <p>蜡型温区</p>
                <h2>本季蜡谱</h2>
              </div>
            </div>
            <div className="wax-list">
              {WAX_TYPES.map((w) => (
                <div key={w.id} className="wax-item">
                  <strong>{w.name}</strong>
                  <span className={`badge ${w.zone}`}>{ZONE_LABEL[w.zone]}</span>
                  <span className="hint">{w.range}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <section className="panel form-panel">
          <div className="heading">
            <div>
              <p>登记新板</p>
              <h2>打蜡准备登记</h2>
            </div>
          </div>
          <OrderForm brushes={brushes} onSubmit={registerOrder} />
        </section>
      </section>

      <section className="panel">
        <div className="heading">
          <div>
            <p>工单队列</p>
            <h2>打蜡准备流程</h2>
          </div>
        </div>
        <div className="filter-rows">
          <div className="filter-row">
            <span className="filter-label">状态</span>
            <div className="chips">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.key}
                  className={statusFilter === f.key ? "active" : ""}
                  onClick={() => setStatusFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-row">
            <span className="filter-label">板型</span>
            <div className="chips">
              {["全部", ...BOARD_TYPES].map((t) => (
                <button
                  key={t}
                  className={typeFilter === t ? "active" : ""}
                  onClick={() => setTypeFilter(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="queue-grid">
          {visible.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              brushes={brushes}
              onStart={startWaxing}
              onFinish={finishOrder}
              onSaveRepair={saveRepair}
              onEdgeChange={changeEdge}
            />
          ))}
          {visible.length === 0 && <p className="empty">当前筛选条件下没有工单</p>}
        </div>
      </section>

      <section className="panel">
        <div className="heading">
          <div>
            <p>客户历史</p>
            <h2>维护记录</h2>
          </div>
          <span className="hint">每单保留当次蜡型、刷具与刃角结果</span>
        </div>
        <HistoryPanel history={history} />
      </section>
    </main>
  );
}

export default App;
