import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { BOARD_TYPES, DAMAGE_OPTIONS, EDGE_ANGLES, WAX_TYPES, ZONE_LABEL } from "../data";
import { pickBrush } from "../logic";
import type { Brush, OrderDraft } from "../types";

interface OrderFormProps {
  brushes: Brush[];
  onSubmit: (draft: OrderDraft) => void;
}

const EMPTY_FORM = {
  customer: "",
  brand: "",
  length: "",
  boardType: BOARD_TYPES[0],
  edgeAngle: EDGE_ANGLES[1],
  waxTypeId: "",
  baseDamage: "",
  repairSpots: "",
};

export function OrderForm({ brushes, onSubmit }: OrderFormProps) {
  const [form, setForm] = useState(EMPTY_FORM);

  const update =
    (key: keyof typeof EMPTY_FORM) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const wax = WAX_TYPES.find((w) => w.id === form.waxTypeId) ?? null;
  const preview = wax ? pickBrush(brushes, wax.zone) : null;
  const damageNeedsSpot = form.baseDamage !== "" && form.repairSpots.trim() === "";
  const valid =
    form.customer.trim() !== "" &&
    form.brand.trim() !== "" &&
    Number(form.length) > 0 &&
    form.waxTypeId !== "";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    onSubmit({
      customer: form.customer.trim(),
      brand: form.brand.trim(),
      length: Number(form.length),
      boardType: form.boardType,
      edgeAngle: form.edgeAngle,
      waxTypeId: form.waxTypeId,
      baseDamage: form.baseDamage,
      repairSpots: form.repairSpots.trim(),
    });
    setForm(EMPTY_FORM);
  }

  return (
    <form className="field-grid" onSubmit={handleSubmit}>
      <label>
        <span>客户姓名</span>
        <input placeholder="如：林雪" value={form.customer} onChange={update("customer")} />
      </label>
      <label>
        <span>雪板品牌</span>
        <input placeholder="如：Burton" value={form.brand} onChange={update("brand")} />
      </label>
      <label>
        <span>长度 (cm)</span>
        <input
          type="number"
          min={100}
          max={200}
          placeholder="如：156"
          value={form.length}
          onChange={update("length")}
        />
      </label>
      <label>
        <span>板型</span>
        <select value={form.boardType} onChange={update("boardType")}>
          {BOARD_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>刃角</span>
        <select value={form.edgeAngle} onChange={update("edgeAngle")}>
          {EDGE_ANGLES.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>蜡型（选定后占用对应温区刷具）</span>
        <select value={form.waxTypeId} onChange={update("waxTypeId")}>
          <option value="" disabled>
            选择蜡型
          </option>
          {WAX_TYPES.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} · {ZONE_LABEL[w.zone]} {w.range}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>底板损伤</span>
        <select value={form.baseDamage} onChange={update("baseDamage")}>
          <option value="">无损伤</option>
          {DAMAGE_OPTIONS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>修补位置{form.baseDamage ? "（开工前必须登记）" : "（无损伤可留空）"}</span>
        <input
          placeholder="如：板底中部 12cm 补 P-Tex"
          value={form.repairSpots}
          onChange={update("repairSpots")}
        />
      </label>

      {wax && preview && (
        <p className="form-hint info">
          登记后占用刷具：{preview.id} {preview.name}（
          {preview.residueZone === null
            ? "已清洁，可直接上蜡"
            : `残留${ZONE_LABEL[preview.residueZone]}蜡，同温区直接使用`}
          ）
        </p>
      )}
      {wax && !preview && (
        <p className="form-hint warn">
          {ZONE_LABEL[wax.zone]}暂无可占用刷具：需等刷具完工释放或登记清洁，登记后工单将停在待准备。
        </p>
      )}
      {damageNeedsSpot && (
        <p className="form-hint warn">
          已登记底板损伤：开工前必须补登记修补位置，否则无法开始打蜡。
        </p>
      )}

      <div className="form-actions">
        <button className="primary" type="submit" disabled={!valid}>
          登记并占用刷具
        </button>
        {!valid && <span className="hint">客户、品牌、长度与蜡型为必填</span>}
      </div>
    </form>
  );
}
