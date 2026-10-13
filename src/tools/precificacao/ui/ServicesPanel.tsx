import { useId } from "react";
import { Copy, FileDown, Plus, RotateCcw, Trash2 } from "lucide-react";
import { computeService } from "../calc";
import { newService, nowIso, uid } from "../defaults";
import { glossary } from "../glossary";
import { formatBRL, formatPct } from "../money";
import type { PricingData, Service } from "../types";
import { CostList } from "./CostsPanel";
import { Help, NumInput, Panel, Row, SmallButton, TextInput, Warning } from "./fields";

type Update = (fn: (d: PricingData) => PricingData) => void;

const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

/** Escolha do serviço (usada também nas abas de simulação). */
export function ServicePicker({ services, selectedId, onSelect, label = "Serviço" }: {
  services: Service[];
  selectedId: string;
  onSelect: (id: string) => void;
  label?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-[14px] font-bold text-ink">
        {label}
      </label>
      <select
        id={id}
        value={selectedId}
        onChange={(event) => onSelect(event.target.value)}
        className="mt-1.5 min-h-11 w-full rounded-[10px] border border-[#B7A7AF] bg-surface px-3 text-[16px] text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
      >
        {services.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name || "Sem nome"}
          </option>
        ))}
      </select>
    </div>
  );
}

function MaterialsOfService({ service, data, onChange }: {
  service: Service;
  data: PricingData;
  onChange: (materials: Service["materials"]) => void;
}) {
  const addId = useId();
  const breakdown = computeService(service, data);
  const available = data.materials.filter((m) => !service.materials.some((sm) => sm.materialId === m.id));

  return (
    <div>
      {breakdown.materialLines.length === 0 ? (
        <p className="text-[14px] text-ink-soft">Nenhum material adicionado a este serviço.</p>
      ) : (
        <ul className="space-y-2">
          {breakdown.materialLines.map(({ material, qty, cost }) => (
            <li key={material.id} className="flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-[12px] bg-[#FCFAFB] p-2.5">
              <span className="min-w-0 basis-full text-[14px] font-medium text-ink sm:flex-1 sm:basis-auto">{material.name}</span>
              <NumInput
                label={`Quantidade de ${material.name} por atendimento`}
                hideLabel
                suffix={material.unit || "un"}
                value={qty}
                onChange={(v) => onChange(service.materials.map((sm) => (sm.materialId === material.id ? { ...sm, qty: v } : sm)))}
                className="w-[130px] shrink-0"
              />
              <span className="ml-auto w-[78px] shrink-0 text-right sm:ml-0 text-[14px] font-medium text-ink tabular-nums">
                {cost === null ? "—" : formatBRL(cost)}
              </span>
              <SmallButton tone="danger" label={`Tirar ${material.name}`} onClick={() => onChange(service.materials.filter((sm) => sm.materialId !== material.id))}>
                <Trash2 aria-hidden="true" className="size-4" />
              </SmallButton>
            </li>
          ))}
        </ul>
      )}

      {available.length > 0 && (
        <div className="mt-3">
          <label htmlFor={addId} className="sr-only">
            Adicionar material do catálogo
          </label>
          <select
            id={addId}
            value=""
            onChange={(event) => event.target.value && onChange([...service.materials, { materialId: event.target.value, qty: null }])}
            className="min-h-11 w-full rounded-[10px] border border-dashed border-primary bg-surface px-3 text-[15px] font-bold text-primary outline-none focus:ring-2 focus:ring-primary-light sm:w-auto"
          >
            <option value="">+ Adicionar material do catálogo</option>
            {available.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

function Results({ service, data, onChoosePrice }: { service: Service; data: PricingData; onChoosePrice: (cents: number | null) => void }) {
  const b = computeService(service, data);
  const money = (v: number | null) => (v === null ? "—" : formatBRL(v));

  return (
    <div className="rounded-[14px] bg-blush p-4 md:p-5" aria-live="polite">
      <h4 className="text-[16px] font-bold text-ink">Resultado</h4>
      <dl className="mt-2">
        <Row label="1. Custo dos materiais" value={money(b.materials)} />
        <Row label="2. Outros custos variáveis" value={money(b.variable)} />
        <Row label="3. Rateio dos custos fixos" value={money(b.fixedShare)} />
        <Row label="4. Remuneração do seu tempo" value={money(b.time)} />
        <Row label="5. Custo base total" value={money(b.base)} />
      </dl>

      {b.issues.length > 0 ? (
        <div className="mt-3">
          <Warning>
            <p>Para calcular o preço, falta:</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 font-normal">
              {b.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </Warning>
        </div>
      ) : (
        <>
          <dl className="mt-3 rounded-[12px] bg-surface px-3.5 py-1">
            <Row label="6. Preço mínimo estimado" value={money(b.minPrice)} help={glossary.minPrice} />
            <Row label="7. Preço sugerido" value={money(b.suggested)} strong help={`Com margem de ${formatPct(service.marginPct ?? 0)} sobre o preço de venda.`} />
          </dl>

          <div className="mt-4 flex items-end gap-2">
            <NumInput
              label="Preço que você vai cobrar"
              kind="money"
              value={service.chosenPriceCents}
              onChange={onChoosePrice}
              placeholder={b.suggested !== null ? (b.suggested / 100).toFixed(2).replace(".", ",") : ""}
              hint="Deixe vazio para usar o preço sugerido."
              className="flex-1"
            />
            {service.chosenPriceCents !== null && (
              <SmallButton label="Usar o preço sugerido" onClick={() => onChoosePrice(null)}>
                <RotateCcw aria-hidden="true" className="size-4" />
              </SmallButton>
            )}
          </div>

          {b.belowMinimum && (
            <div className="mt-3">
              <Warning>{glossary.belowMinimum}</Warning>
            </div>
          )}

          <dl className="mt-3">
            <Row
              label={`8. Resultado por atendimento${service.chosenPriceCents !== null ? " (preço escolhido)" : ""}`}
              value={money(b.result)}
              help={`${glossary.result} ${glossary.resultIncludesTime}`}
            />
            <Row label="9. Margem efetiva" value={b.margin === null ? "—" : formatPct(b.margin)} help={glossary.margin} />
          </dl>
        </>
      )}
    </div>
  );
}

export function ServicesPanel({ data, update, selectedId, onSelect, onPrint }: {
  data: PricingData;
  update: Update;
  selectedId: string;
  onSelect: (id: string) => void;
  onPrint: (service: Service) => void;
}) {
  const service = data.services.find((s) => s.id === selectedId) ?? data.services[0];

  const patch = (changes: Partial<Service>) =>
    update((d) => ({
      ...d,
      services: d.services.map((s) => (s.id === service.id ? { ...s, ...changes, updatedAt: nowIso() } : s)),
    }));

  function add() {
    const created = newService(`Serviço ${data.services.length + 1}`);
    update((d) => ({ ...d, services: [...d.services, created] }));
    onSelect(created.id);
  }

  function duplicate() {
    const now = nowIso();
    const copy: Service = {
      ...structuredClone(service),
      id: uid(),
      name: `${service.name} (cópia)`,
      extraCosts: service.extraCosts.map((c) => ({ ...c, id: uid() })),
      createdAt: now,
      updatedAt: now,
    };
    update((d) => ({ ...d, services: [...d.services, copy] }));
    onSelect(copy.id);
  }

  function remove() {
    if (data.services.length <= 1) return;
    if (!window.confirm(`Excluir o serviço "${service.name}"? Essa ação não pode ser desfeita.`)) return;
    const next = data.services.find((s) => s.id !== service.id)!;
    update((d) => ({ ...d, services: d.services.filter((s) => s.id !== service.id) }));
    onSelect(next.id);
  }

  if (!service) {
    return (
      <Panel title="Serviços">
        <SmallButton onClick={add}>
          <Plus aria-hidden="true" className="size-4" /> Criar serviço
        </SmallButton>
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      {/* Lista de serviços */}
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Seus serviços">
        {data.services.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={s.id === service.id}
            onClick={() => onSelect(s.id)}
            className={`min-h-11 shrink-0 rounded-full border px-4 text-[14px] font-bold transition-colors ${
              s.id === service.id ? "border-primary bg-primary text-white" : "border-line bg-surface text-ink-soft hover:border-primary-light"
            }`}
          >
            {s.name || "Sem nome"}
          </button>
        ))}
        <button
          type="button"
          onClick={add}
          className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full border border-dashed border-primary px-4 text-[14px] font-bold text-primary hover:bg-blush"
        >
          <Plus aria-hidden="true" className="size-4" />
          Novo
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px] [&>*]:min-w-0">
        <Panel
          title="Dados do serviço"
          description={<p className="text-[13px] text-ink-soft">Atualizado em {dateFormat.format(new Date(service.updatedAt))}</p>}
          actions={
            <div className="flex flex-wrap gap-1">
              <SmallButton onClick={duplicate} label="Duplicar serviço">
                <Copy aria-hidden="true" className="size-4" />
                <span className="hidden sm:inline">Duplicar</span>
              </SmallButton>
              <SmallButton onClick={() => onPrint(service)} label="Gerar relatório em PDF">
                <FileDown aria-hidden="true" className="size-4" />
                <span className="hidden sm:inline">PDF</span>
              </SmallButton>
              <SmallButton tone="danger" onClick={remove} label="Excluir serviço" disabled={data.services.length <= 1}>
                <Trash2 aria-hidden="true" className="size-4" />
              </SmallButton>
            </div>
          }
        >
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
              <TextInput label="Nome do serviço" value={service.name} onChange={(name) => patch({ name })} />
              <NumInput label="Duração" kind="decimal" suffix="minutos" value={service.minutes} onChange={(minutes) => patch({ minutes })} />
            </div>

            <div>
              <h4 className="text-[15px] font-bold text-ink">Materiais usados por atendimento</h4>
              <div className="mt-1 mb-3">
                <Help>Os preços vêm da aba Materiais. Aqui você informa só quanto usa em um atendimento.</Help>
              </div>
              <MaterialsOfService service={service} data={data} onChange={(materials) => patch({ materials })} />
            </div>

            <div>
              <h4 className="text-[15px] font-bold text-ink">Outros custos por atendimento</h4>
              <div className="mt-1 mb-3">
                <Help>
                  Lavanderia, transporte, descartáveis extras… Não repita aqui o que já está nos materiais ou nas despesas
                  fixas, para não contar duas vezes.
                </Help>
              </div>
              <CostList
                items={service.extraCosts}
                onChange={(extraCosts) => patch({ extraCosts })}
                addLabel="Adicionar custo"
                nameLabel="Nome do custo"
              />
            </div>

            <div>
              <NumInput
                label="Margem desejada"
                kind="percent"
                maxExclusive={100}
                value={service.marginPct}
                onChange={(marginPct) => patch({ marginPct })}
                hint="Porcentagem do preço de venda que você quer que sobre depois de todos os custos. Pode ser 0%."
                className="max-w-[320px]"
              />
            </div>
          </div>
        </Panel>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <Results service={service} data={data} onChoosePrice={(chosenPriceCents) => patch({ chosenPriceCents })} />
        </div>
      </div>
    </div>
  );
}
