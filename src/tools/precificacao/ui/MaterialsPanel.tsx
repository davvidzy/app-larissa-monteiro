import { useId } from "react";
import { Plus, Trash2 } from "lucide-react";
import { materialIssue, materialUnitCost } from "../calc";
import { newMaterial } from "../defaults";
import { glossary } from "../glossary";
import { formatBRLPrecise } from "../money";
import type { Material, PricingData } from "../types";
import { Help, NumInput, Panel, SmallButton, TextInput } from "./fields";

const UNITS = ["un", "mL", "g"];

function UnitField({ value, onChange }: { value: string; onChange: (unit: string) => void }) {
  const id = useId();
  const custom = !UNITS.includes(value);
  return (
    <div>
      <label htmlFor={id} className="block text-[14px] font-bold text-ink">
        Unidade
      </label>
      <div className="mt-1.5 flex gap-2">
        <select
          id={id}
          value={custom ? "outra" : value}
          onChange={(event) => onChange(event.target.value === "outra" ? "" : event.target.value)}
          className="min-h-11 rounded-[10px] border border-[#B7A7AF] bg-surface px-2 text-[16px] text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
        >
          <option value="un">unidade</option>
          <option value="mL">mL</option>
          <option value="g">g</option>
          <option value="outra">outra…</option>
        </select>
        {custom && <TextInput label="Nome da unidade" hideLabel value={value} onChange={onChange} className="min-w-0 flex-1" />}
      </div>
    </div>
  );
}

function MaterialCard({ material, usedIn, onChange, onRemove }: {
  material: Material;
  usedIn: number;
  onChange: (patch: Partial<Material>) => void;
  onRemove: () => void;
}) {
  const unitCost = materialUnitCost(material);
  const issue = materialIssue(material);
  const unit = material.unit || "unidade";
  return (
    <li className="rounded-[14px] border border-line p-4">
      <div className="flex items-end gap-2">
        <TextInput label="Nome do material" value={material.name} onChange={(name) => onChange({ name })} className="flex-1" />
        <SmallButton tone="danger" label={`Excluir ${material.name}`} onClick={onRemove}>
          <Trash2 aria-hidden="true" className="size-4" />
        </SmallButton>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <NumInput label="Preço da embalagem" kind="money" value={material.packagePriceCents} onChange={(v) => onChange({ packagePriceCents: v })} />
        <NumInput label="Quantidade na embalagem" suffix={unit} value={material.packageQty} onChange={(v) => onChange({ packageQty: v })} />
        <UnitField value={material.unit} onChange={(u) => onChange({ unit: u })} />
        <NumInput
          label="Desperdício estimado"
          kind="percent"
          value={material.wastePct}
          onChange={(v) => onChange({ wastePct: v ?? 0 })}
          hint="Opcional"
        />
      </div>
      <p className="mt-3 text-[14px] text-ink-soft">
        {unitCost !== null ? (
          <>
            Custo: <strong className="text-ink">{formatBRLPrecise(unitCost)}</strong> por {unit}
          </>
        ) : (
          (material.packagePriceCents !== null || material.packageQty !== null) && issue
        )}
        {usedIn > 0 && <span className="block text-[13px]">Usado em {usedIn} serviço(s).</span>}
      </p>
    </li>
  );
}

export function MaterialsPanel({ data, update }: { data: PricingData; update: (fn: (d: PricingData) => PricingData) => void }) {
  const setMaterial = (id: string, patch: Partial<Material>) =>
    update((d) => ({ ...d, materials: d.materials.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));

  function remove(material: Material) {
    const usedIn = data.services.filter((s) => s.materials.some((sm) => sm.materialId === material.id)).length;
    const message = usedIn
      ? `"${material.name}" é usado em ${usedIn} serviço(s) e será retirado deles. Excluir mesmo assim?`
      : `Excluir "${material.name}"?`;
    if (!window.confirm(message)) return;
    update((d) => ({
      ...d,
      materials: d.materials.filter((m) => m.id !== material.id),
      services: d.services.map((s) => ({ ...s, materials: s.materials.filter((sm) => sm.materialId !== material.id) })),
    }));
  }

  return (
    <Panel
      title="Catálogo de materiais"
      description={
        <div className="space-y-1.5">
          <Help>{glossary.materials}</Help>
          <Help>
            Informe o preço e o conteúdo de cada embalagem. A quantidade usada em cada atendimento você informa na aba
            Serviços, porque muda de um serviço para outro.
          </Help>
        </div>
      }
    >
      <ul className="space-y-3">
        {data.materials.map((material) => (
          <MaterialCard
            key={material.id}
            material={material}
            usedIn={data.services.filter((s) => s.materials.some((sm) => sm.materialId === material.id)).length}
            onChange={(patch) => setMaterial(material.id, patch)}
            onRemove={() => remove(material)}
          />
        ))}
      </ul>
      <div className="mt-3">
        <SmallButton onClick={() => update((d) => ({ ...d, materials: [...d.materials, newMaterial()] }))}>
          <Plus aria-hidden="true" className="size-4" />
          Adicionar material
        </SmallButton>
      </div>
    </Panel>
  );
}
