import { useEffect, useMemo, useState } from "react";
import "./styles.css";

const project = {
  sourceNo: 6,
  id: "hxyfront-62004",
  port: 62004,
  title: "滑雪板打蜡准备台",
  domain: "滑雪装备调校",
};

/* ---------------- 领域模型：温区 / 蜡型 / 刷具 / 工单 ---------------- */

type ZoneId = "cold" | "mid" | "warm";
type BoardType = "全地域" | "公园板" | "竞速板" | "粉雪板";
type JobStatus = "waiting" | "waxing" | "done";

interface Zone {
  id: ZoneId;
  label: string;
  range: string;
  wax: string;
  note: string;
}

const ZONES: Zone[] = [
  {
    id: "cold",
    label: "低温区",
    range: "雪温 -10℃ 以下",
    wax: "低温软蜡 HF-Cold",
    note: "软蜡残留最易串味，换温区前必须清洁刷具",
  },
  {
    id: "mid",
    label: "中温区",
    range: "雪温 -10℃ ~ -4℃",
    wax: "中温雪蜡 MF-Mid",
    note: "通用温区，跨区刷具仍需先登记清洁",
  },
  {
    id: "warm",
    label: "暖温区",
    range: "雪温 -4℃ 以上",
    wax: "高温硬蜡 HF-Warm",
    note: "硬蜡颗粒残留，清洁后再进低温区",
  },
];

const ZONE_MAP = Object.fromEntries(ZONES.map((z) => [z.id, z])) as Record<
  ZoneId,
  Zone
>;

const BOARD_TYPES: BoardType[] = ["全地域", "公园板", "竞速板", "粉雪板"];
const STATUS_LABEL: Record<JobStatus, string> = {
  waiting: "待准备",
  waxing: "打蜡中",
  done: "已完工",
};

interface Brush {
  code: string;
  busy: boolean;
  jobId?: string;
  /** 上一次打蜡的温区；清洁登记后仍保留作信息展示 */
  lastZone?: ZoneId;
  /** 是否已登记清洁完成 */
  clean: boolean;
}

interface Job {
  id: string;
  customer: string;
  brand: string;
  length: number;
  boardType: BoardType;
  zone: ZoneId;
  brushCode: string;
  damage: string;
  repairSpot: string;
  sideAngle: number;
  baseAngle: number;
  preference: string;
  status: JobStatus;
  createdAt: number;
  finishedAt?: number;
}

/** 刷具面向某温区时的可用性：clean 后通用；同温区残留可直接用；跨温区脏刷必须先清洁 */
type BrushFit = "ready" | "same-zone-dirty" | "blocked";

function brushFit(brush: Brush, zone: ZoneId): BrushFit {
  if (brush.clean || !brush.lastZone) return "ready";
  return brush.lastZone === zone ? "same-zone-dirty" : "blocked";
}

interface BlockCheck {
  canStart: boolean;
  reasons: string[];
  brushBlocked: boolean;
}

function evaluateJob(job: Job, brush: Brush | undefined): BlockCheck {
  const reasons: string[] = [];
  let brushBlocked = false;

  if (!brush) {
    reasons.push("未找到占用的刷具，请重新登记");
    brushBlocked = true;
  } else if (brushFit(brush, job.zone) === "blocked") {
    brushBlocked = true;
    reasons.push(
      `刷具 ${brush.code} 残留${ZONE_MAP[brush.lastZone!].label}软蜡，换到${
        ZONE_MAP[job.zone].label
      }前需先登记清洁完成`,
    );
  }

  if (job.damage.trim() !== "" && job.repairSpot.trim() === "") {
    reasons.push("底板有损伤但未填写修补位置，不能开始打蜡");
  }

  return { canStart: reasons.length === 0, reasons, brushBlocked };
}

/* ---------------- 初始数据 ---------------- */

const DAY = 24 * 60 * 60 * 1000;

function seedState(): { jobs: Job[]; brushes: Brush[] } {
  const now = Date.now();
  const jobs: Job[] = [
    {
      id: "ORD-118",
      customer: "赵女士",
      brand: "Nitro Team",
      length: 152,
      boardType: "全地域",
      zone: "mid",
      brushCode: "S-03",
      damage: "板尾左侧边缘磨损",
      repairSpot: "板尾左侧 3cm 磨痕",
      sideAngle: 88,
      baseAngle: 1,
      preference: "常规维护，偏好弱咬雪",
      status: "waxing",
      createdAt: now - 2 * 60 * 60 * 1000,
    },
    {
      id: "ORD-112",
      customer: "张先生",
      brand: "Salomon Huck Knife",
      length: 158,
      boardType: "公园板",
      zone: "warm",
      brushCode: "S-02",
      damage: "底板深划痕约 3cm",
      repairSpot: "",
      sideAngle: 88,
      baseAngle: 1,
      preference: "道具多，底刃别太利",
      status: "waiting",
      createdAt: now - 40 * 60 * 1000,
    },
    {
      id: "ORD-106",
      customer: "李先生",
      brand: "Burton Custom",
      length: 156,
      boardType: "全地域",
      zone: "cold",
      brushCode: "S-02",
      damage: "固定器前方划痕约 2cm",
      repairSpot: "前脚固定器前方划痕点",
      sideAngle: 88,
      baseAngle: 1,
      preference: "无",
      status: "done",
      createdAt: now - 9 * DAY,
      finishedAt: now - 8 * DAY,
    },
    {
      id: "ORD-104",
      customer: "王女士",
      brand: "Head Worldcup Rebels",
      length: 165,
      boardType: "竞速板",
      zone: "mid",
      brushCode: "S-03",
      damage: "",
      repairSpot: "",
      sideAngle: 87,
      baseAngle: 0.5,
      preference: "刻滑，侧刃要锋利",
      status: "done",
      createdAt: now - 16 * DAY,
      finishedAt: now - 15 * DAY,
    },
  ];

  const brushes: Brush[] = [
    { code: "S-01", busy: false, clean: true },
    // ORD-106 低温区完工后未清洁，现被 ORD-112 占用去暖温区 → 跨温区闸口
    { code: "S-02", busy: true, jobId: "ORD-112", lastZone: "cold", clean: false },
    // ORD-104 中温区完工未清洁，现被 ORD-118 同温区继续使用
    { code: "S-03", busy: true, jobId: "ORD-118", lastZone: "mid", clean: false },
    { code: "S-04", busy: false, clean: true },
    { code: "S-05", busy: false, lastZone: "warm", clean: false },
    { code: "S-06", busy: false, clean: true },
  ];

  return { jobs, brushes };
}

const STORAGE_KEY = "wax-bench-state-v1";

function loadState(): { jobs: Job[]; brushes: Brush[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { jobs: Job[]; brushes: Brush[] };
      if (Array.isArray(parsed.jobs) && Array.isArray(parsed.brushes)) {
        return parsed;
      }
    }
  } catch {
    /* 损坏的缓存直接回落到种子数据 */
  }
  return seedState();
}

/* ---------------- 表单 ---------------- */

interface FormState {
  customer: string;
  brand: string;
  length: string;
  boardType: BoardType;
  zone: ZoneId;
  brushCode: string;
  damage: string;
  repairSpot: string;
  sideAngle: string;
  baseAngle: string;
  preference: string;
}

function emptyForm(brushes: Brush[], zone: ZoneId = "cold"): FormState {
  return {
    customer: "",
    brand: "",
    length: "",
    boardType: "全地域",
    zone,
    brushCode: pickDefaultBrush(brushes, zone),
    damage: "",
    repairSpot: "",
    sideAngle: "88",
    baseAngle: "1",
    preference: "",
  };
}

/** 优先选空闲已清洁刷具，其次同温区残留刷具，再退而求其次展示跨温区待清洁刷具 */
function pickDefaultBrush(brushes: Brush[], zone: ZoneId): string {
  const idle = brushes.filter((b) => !b.busy);
  const ready = idle.find((b) => brushFit(b, zone) === "ready");
  const same = idle.find((b) => brushFit(b, zone) === "same-zone-dirty");
  const fallback = idle[0];
  return (ready ?? same ?? fallback)?.code ?? "";
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ---------------- 主组件 ---------------- */

function App() {
  const initial = useMemo(loadState, []);
  const [jobs, setJobs] = useState<Job[]>(initial.jobs);
  const [brushes, setBrushes] = useState<Brush[]>(initial.brushes);
  const [form, setForm] = useState<FormState>(() =>
    emptyForm(initial.brushes),
  );
  const [boardFilter, setBoardFilter] = useState<BoardType | "全部">("全部");
  const [statusFilter, setStatusFilter] = useState<JobStatus | "全部">("全部");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ jobs, brushes }));
  }, [jobs, brushes]);

  const brushByCode = useMemo(
    () => Object.fromEntries(brushes.map((b) => [b.code, b])) as Record<string, Brush>,
    [brushes],
  );

  const waitingCount = jobs.filter((j) => j.status === "waiting").length;
  const waxingCount = jobs.filter((j) => j.status === "waxing").length;
  const doneCount = jobs.filter((j) => j.status === "done").length;
  const dirtyCount = brushes.filter((b) => !b.clean).length;

  /* ---------- 工单流转动作 ---------- */

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function changeZone(zone: ZoneId) {
    setForm((prev) => ({
      ...prev,
      zone,
      brushCode: pickDefaultBrush(brushes, zone),
    }));
  }

  function nextOrderId(): string {
    const max = jobs.reduce((acc, job) => {
      const n = Number(job.id.replace(/\D/g, ""));
      return Number.isFinite(n) ? Math.max(acc, n) : acc;
    }, 100);
    return `ORD-${max + 1}`;
  }

  function registerJob() {
    const length = Number(form.length);
    const side = Number(form.sideAngle);
    const base = Number(form.baseAngle);
    if (
      form.customer.trim() === "" ||
      form.brand.trim() === "" ||
      !Number.isFinite(length) ||
      length <= 0 ||
      form.brushCode === ""
    ) {
      return;
    }
    const job: Job = {
      id: nextOrderId(),
      customer: form.customer.trim(),
      brand: form.brand.trim(),
      length,
      boardType: form.boardType,
      zone: form.zone,
      brushCode: form.brushCode,
      damage: form.damage.trim(),
      repairSpot: form.repairSpot.trim(),
      sideAngle: Number.isFinite(side) && side > 0 ? side : 88,
      baseAngle: Number.isFinite(base) && base >= 0 ? base : 1,
      preference: form.preference.trim(),
      status: "waiting",
      createdAt: Date.now(),
    };
    setJobs((prev) => [job, ...prev]);
    // 选定蜡型即占用对应温区的刷具
    setBrushes((prev) =>
      prev.map((b) =>
        b.code === job.brushCode
          ? { ...b, busy: true, jobId: job.id }
          : b,
      ),
    );
    setForm(emptyForm(
      brushes.map((b) =>
        b.code === job.brushCode ? { ...b, busy: true, jobId: job.id } : b,
      ),
      form.zone,
    ));
  }

  /** 刷具换温区前登记清洁完成（可由刷具架或被闸住的工单触发） */
  function registerCleaning(code: string) {
    setBrushes((prev) =>
      prev.map((b) => (b.code === code ? { ...b, clean: true } : b)),
    );
  }

  function patchJob(id: string, patch: Partial<Job>) {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }

  function startWaxing(id: string) {
    const job = jobs.find((j) => j.id === id);
    if (!job) return;
    const check = evaluateJob(job, brushByCode[job.brushCode]);
    if (!check.canStart) return;
    patchJob(id, { status: "waxing" });
  }

  function finishJob(id: string) {
    const job = jobs.find((j) => j.id === id);
    if (!job) return;
    // 完工释放刷具：刷具回到空闲，但带有本次温区的软蜡残留
    setBrushes((prev) =>
      prev.map((b) =>
        b.code === job.brushCode
          ? { ...b, busy: false, jobId: undefined, clean: false, lastZone: job.zone }
          : b,
      ),
    );
    setJobs((prev) =>
      prev.map((j) =>
        j.id === id ? { ...j, status: "done", finishedAt: Date.now() } : j,
      ),
    );
  }

  function cancelWaiting(id: string) {
    const job = jobs.find((j) => j.id === id);
    if (!job || job.status !== "waiting") return;
    setBrushes((prev) =>
      prev.map((b) =>
        b.code === job.brushCode
          ? { ...b, busy: false, jobId: undefined }
          : b,
      ),
    );
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }

  const filteredJobs = jobs.filter((j) => {
    if (statusFilter !== "全部" && j.status !== statusFilter) return false;
    if (boardFilter !== "全部" && j.boardType !== boardFilter) return false;
    return true;
  });

  const historyGroups = useMemo(() => {
    const done = jobs
      .filter((j) => j.status === "done")
      .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0));
    const map = new Map<string, Job[]>();
    done.forEach((job) => {
      map.set(job.customer, [...(map.get(job.customer) ?? []), job]);
    });
    return [...map.entries()];
  }, [jobs]);

  function exportHistory() {
    const payload = jobs
      .filter((j) => j.status === "done")
      .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0))
      .map((j) => ({
        工单号: j.id,
        客户: j.customer,
        雪板: `${j.brand} ${j.length}cm ${j.boardType}`,
        蜡型: ZONE_MAP[j.zone].wax,
        温区: ZONE_MAP[j.zone].label,
        刷具编号: j.brushCode,
        刃角结果: `侧刃${j.sideAngle}° / 底刃${j.baseAngle}°`,
        底板损伤: j.damage || "无",
        修补位置: j.repairSpot || "无",
        完工时间: j.finishedAt ? formatTime(j.finishedAt) : "",
      }));
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "打蜡客户历史.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const selectedBrush = brushByCode[form.brushCode];
  const selectedFit = selectedBrush
    ? brushFit(selectedBrush, form.zone)
    : undefined;
  const formReady =
    form.customer.trim() !== "" &&
    form.brand.trim() !== "" &&
    Number(form.length) > 0 &&
    form.brushCode !== "";

  return (
    <main className="app">
      <section className="hero">
        <p>
          {project.id} · 源提示词{project.sourceNo} · Port {project.port}
        </p>
        <h1>{project.title}</h1>
        <span>
          每块板登记品牌、长度、板型、蜡型、刷具编号与底板损伤；选定蜡型即占用对应温区刷具。
          刷具换温区前必须登记清洁完成，未清洁或损伤未登记修补位置的板子停在待准备；
          完工释放刷具，客户历史保留当次蜡型、刷具和刃角结果。
        </span>
        <div className="rule-strip">
          <b>① 选蜡型占用刷具</b>
          <b>② 换温区先登记清洁</b>
          <b>③ 损伤写明修补位置</b>
          <b>④ 完工释放并归档</b>
        </div>
      </section>

      <section className="metrics">
        <article>
          <small>待准备</small>
          <strong>{waitingCount}</strong>
        </article>
        <article>
          <small>打蜡中</small>
          <strong>{waxingCount}</strong>
        </article>
        <article>
          <small>完工工单</small>
          <strong>{doneCount}</strong>
        </article>
        <article>
          <small>待清洁刷具</small>
          <strong>{dirtyCount}</strong>
        </article>
      </section>

      <section className="workspace">
        {/* 刷具架 */}
        <aside className="panel rack-panel">
          <h2>刷具架</h2>
          <div className="zone-legend">
            {ZONES.map((z) => (
              <div key={z.id} className={`zone-tag zone-${z.id}`}>
                <b>{z.label}</b>
                <span>{z.range}</span>
                <em>{z.wax}</em>
              </div>
            ))}
          </div>
          <p className="rack-hint">
            软蜡残留按温区追踪：跨温区使用前必须登记清洁，同温区可直接续用。
          </p>
          <div className="brush-list">
            {brushes.map((brush) => {
              const zoneLabel = brush.lastZone
                ? ZONE_MAP[brush.lastZone].label
                : "—";
              return (
                <div
                  key={brush.code}
                  className={`brush-card ${brush.busy ? "is-busy" : ""} ${
                    !brush.clean ? "is-dirty" : "is-clean"
                  }`}
                >
                  <div className="brush-head">
                    <b>{brush.code}</b>
                    {brush.busy ? (
                      <span className="tag tag-busy">
                        占用中 {brush.jobId}
                      </span>
                    ) : brush.clean ? (
                      <span className="tag tag-clean">空闲 · 已清洁</span>
                    ) : (
                      <span className="tag tag-dirty">
                        空闲 · 待清洁（{zoneLabel}残留）
                      </span>
                    )}
                  </div>
                  <div className="brush-meta">
                            上次温区：{zoneLabel}
                  </div>
                  {!brush.busy && !brush.clean && (
                    <button
                      className="mini"
                      onClick={() => registerCleaning(brush.code)}
                    >
                      登记清洁完成
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* 新板登记 */}
        <section className="panel form-panel">
          <div className="heading">
            <div>
              <p>{project.domain}</p>
              <h2>新板打蜡登记</h2>
            </div>
          </div>
          <div className="field-grid">
            <label>
              <span>客户 *</span>
              <input
                value={form.customer}
                placeholder="客户称呼，用于历史归档"
                onChange={(e) => updateForm("customer", e.target.value)}
              />
            </label>
            <label>
              <span>雪板品牌 *</span>
              <input
                value={form.brand}
                placeholder="如 Burton Custom"
                onChange={(e) => updateForm("brand", e.target.value)}
              />
            </label>
            <label>
              <span>长度 (cm) *</span>
              <input
                type="number"
                value={form.length}
                placeholder="如 156"
                onChange={(e) => updateForm("length", e.target.value)}
              />
            </label>
            <label>
              <span>板型</span>
              <select
                value={form.boardType}
                onChange={(e) =>
                  updateForm("boardType", e.target.value as BoardType)
                }
              >
                {BOARD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="span-2">
              <span>蜡型（选定后占用对应温区刷具）*</span>
              <select
                value={form.zone}
                onChange={(e) => changeZone(e.target.value as ZoneId)}
              >
                {ZONES.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.wax}（{z.label} · {z.range}）
                  </option>
                ))}
              </select>
              <small className="field-hint">{ZONE_MAP[form.zone].note}</small>
            </label>
            <label className="span-2">
              <span>刷具编号 *</span>
              <select
                value={form.brushCode}
                onChange={(e) => updateForm("brushCode", e.target.value)}
              >
                {brushes.map((b) => {
                  const fit = brushFit(b, form.zone);
                  const suffix = b.busy
                    ? `占用中 ${b.jobId ?? ""}`
                    : fit === "ready"
                      ? "空闲 · 可直接使用"
                      : fit === "same-zone-dirty"
                        ? `同温区残留 · 可续用`
                        : `残留${ZONE_MAP[b.lastZone!].label}蜡 · 需先清洁`;
                  return (
                    <option key={b.code} value={b.code} disabled={b.busy}>
                      {b.code} · {suffix}
                    </option>
                  );
                })}
              </select>
              {selectedBrush && selectedFit && (
                <small
                  className={`field-hint fit-${selectedFit}`}
                >
                  {selectedFit === "ready"
                    ? "刷具已清洁，可进任意温区。"
                    : selectedFit === "same-zone-dirty"
                      ? `刷具带${ZONE_MAP[selectedBrush.lastZone!].label}残留，与本次温区相同，可直接使用。`
                      : `注意：该刷具残留${ZONE_MAP[selectedBrush.lastZone!].label}软蜡，登记后板子会停在待准备，清洁完成才能开始。`}
                </small>
              )}
            </label>
            <label>
              <span>底板损伤</span>
              <input
                value={form.damage}
                placeholder="无损伤可留空"
                onChange={(e) => updateForm("damage", e.target.value)}
              />
            </label>
            <label>
              <span>修补位置{form.damage.trim() !== "" ? " *" : ""}</span>
              <input
                value={form.repairSpot}
                disabled={form.damage.trim() === ""}
                placeholder={
                  form.damage.trim() === ""
                    ? "先填写损伤后再标注位置"
                    : "如：板尾左侧 3cm 划痕"
                }
                onChange={(e) => updateForm("repairSpot", e.target.value)}
              />
            </label>
            <label>
              <span>侧刃角预设 (°)</span>
              <input
                type="number"
                step="1"
                value={form.sideAngle}
                onChange={(e) => updateForm("sideAngle", e.target.value)}
              />
            </label>
            <label>
              <span>底刃角预设 (°)</span>
              <input
                type="number"
                step="0.5"
                value={form.baseAngle}
                onChange={(e) => updateForm("baseAngle", e.target.value)}
              />
            </label>
            <label className="span-2">
              <span>客户偏好</span>
              <input
                value={form.preference}
                placeholder="如弱咬雪、刻滑要锋利"
                onChange={(e) => updateForm("preference", e.target.value)}
              />
            </label>
          </div>
          {form.damage.trim() !== "" && form.repairSpot.trim() === "" && (
            <p className="form-warn">
              已登记底板损伤，必须写明修补位置，否则完工前无法开始打蜡。
            </p>
          )}
          <div className="form-actions">
            <button className="primary" disabled={!formReady} onClick={registerJob}>
              登记并占用刷具
            </button>
            {!formReady && (
              <small className="field-hint">客户、品牌、长度和刷具为必填项。</small>
            )}
          </div>
        </section>
      </section>

      {/* 打蜡准备看板 */}
      <section className="panel board-panel">
        <div className="heading">
          <div>
            <p>准备看板</p>
            <h2>打蜡工单</h2>
          </div>
        </div>
        <div className="filters">
          <div className="chips">
            {(["全部", "waiting", "waxing", "done"] as const).map((s) => (
              <button
                key={s}
                className={statusFilter === s ? "chip-active" : ""}
                onClick={() => setStatusFilter(s)}
              >
                {s === "全部" ? "全部状态" : STATUS_LABEL[s]}
              </button>
            ))}
          </div>
          <div className="chips">
            {(["全部", ...BOARD_TYPES] as const).map((t) => (
              <button
                key={t}
                className={boardFilter === t ? "chip-active" : ""}
                onClick={() => setBoardFilter(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="job-list">
          {filteredJobs.length === 0 && (
            <p className="empty">当前筛选条件下没有工单。</p>
          )}
          {filteredJobs.map((job) => {
            const brush = brushByCode[job.brushCode];
            const check = evaluateJob(job, brush);
            const zone = ZONE_MAP[job.zone];
            return (
              <article key={job.id} className={`job-card status-${job.status}`}>
                <div className="job-head">
                  <div>
                    <h3>
                      {job.id} · {job.customer}
                    </h3>
                    <p className="job-sub">
                      登记于 {formatTime(job.createdAt)}
                    </p>
                  </div>
                  <span className={`status-badge badge-${job.status}`}>
                    {STATUS_LABEL[job.status]}
                  </span>
                </div>

                <div className="job-grid">
                  <div>
                    <small>雪板</small>
                    <p>
                      {job.brand} · {job.length}cm · {job.boardType}
                    </p>
                  </div>
                  <div>
                    <small>蜡型 / 温区</small>
                    <p>
                      {zone.wax} · {zone.label}
                    </p>
                  </div>
                  <div>
                    <small>占用刷具</small>
                    <p>
                      {job.brushCode}
                      {brush && !brush.clean && brush.lastZone && (
                        <em className="brush-residue">
                          {" "}
                          （{ZONE_MAP[brush.lastZone].label}残留
                          {brush.lastZone === job.zone ? "·同温区" : "·未清洁"}
                          ）
                        </em>
                      )}
                    </p>
                  </div>
                  <div>
                    <small>底板损伤 / 修补位置</small>
                    <p>
                      {job.damage === "" ? (
                        "无损伤"
                      ) : (
                        <>
                          {job.damage}
                          {job.repairSpot !== "" && (
                            <> → 修补：{job.repairSpot}</>
                          )}
                        </>
                      )}
                    </p>
                  </div>
                  <div>
                    <small>客户偏好</small>
                    <p>{job.preference || "—"}</p>
                  </div>
                  {job.status === "done" && (
                    <div>
                      <small>刃角结果</small>
                      <p>
                        侧刃 {job.sideAngle}° / 底刃 {job.baseAngle}°
                      </p>
                    </div>
                  )}
                </div>

                {job.status === "waiting" && check.reasons.length > 0 && (
                  <ul className="block-reasons">
                    {check.reasons.map((r) => (
                      <li key={r}>⛔ {r}</li>
                    ))}
                  </ul>
                )}

                {job.status === "waiting" &&
                  job.damage.trim() !== "" &&
                  job.repairSpot.trim() === "" && (
                    <div className="inline-edit">
                      <input
                        placeholder="登记修补位置后才能开始打蜡"
                        onBlur={(e) =>
                          e.target.value.trim() !== "" &&
                          patchJob(job.id, {
                            repairSpot: e.target.value.trim(),
                          })
                        }
                      />
                    </div>
                  )}

                <div className="job-actions">
                  {job.status === "waiting" && (
                    <>
                      {check.brushBlocked && brush && (
                        <button
                          className="warn"
                          onClick={() => registerCleaning(brush.code)}
                        >
                          登记 {brush.code} 清洁完成
                        </button>
                      )}
                      <button
                        className="primary"
                        disabled={!check.canStart}
                        onClick={() => startWaxing(job.id)}
                      >
                        开始打蜡
                      </button>
                      <button onClick={() => cancelWaiting(job.id)}>
                        撤单释放刷具
                      </button>
                    </>
                  )}
                  {job.status === "waxing" && (
                    <>
                      <label className="angle-input">
                        <span>侧刃结果 °</span>
                        <input
                          type="number"
                          value={job.sideAngle}
                          onChange={(e) =>
                            patchJob(job.id, {
                              sideAngle: Number(e.target.value),
                            })
                          }
                        />
                      </label>
                      <label className="angle-input">
                        <span>底刃结果 °</span>
                        <input
                          type="number"
                          step="0.5"
                          value={job.baseAngle}
                          onChange={(e) =>
                            patchJob(job.id, {
                              baseAngle: Number(e.target.value),
                            })
                          }
                        />
                      </label>
                      <button className="primary" onClick={() => finishJob(job.id)}>
                        完工并释放 {job.brushCode}
                      </button>
                    </>
                  )}
                  {job.status === "done" && job.finishedAt && (
                    <span className="done-time">
                      完工时间：{formatTime(job.finishedAt)}，刷具已释放
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* 客户历史 */}
      <section className="panel history-panel">
        <div className="heading">
          <div>
            <p>客户历史</p>
            <h2>打蜡维护记录</h2>
          </div>
          <button onClick={exportHistory}>导出历史摘要</button>
        </div>
        {historyGroups.length === 0 && <p className="empty">暂无完工记录。</p>}
        <div className="history-groups">
          {historyGroups.map(([customer, list]) => (
            <div key={customer} className="history-group">
              <h3>
                {customer} <em>{list.length} 次维护</em>
              </h3>
              {list.map((job) => (
                <article key={job.id} className="history-item">
                  <b>{job.finishedAt ? formatTime(job.finishedAt) : "—"}</b>
                  <div>
                    <h4>
                      {job.id} · {job.brand} {job.length}cm · {job.boardType}
                    </h4>
                    <p>
                      {ZONE_MAP[job.zone].wax}（{ZONE_MAP[job.zone].label}）
                      {" · "}刷具 {job.brushCode}
                      {" · "}刃角结果 侧刃{job.sideAngle}° / 底刃{job.baseAngle}°
                    </p>
                    <p className="history-sub">
                      {job.damage === ""
                        ? "底板无损伤"
                        : `${job.damage} · 修补位置：${job.repairSpot || "未登记"}`}
                      {job.preference !== "" && ` · 偏好：${job.preference}`}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
