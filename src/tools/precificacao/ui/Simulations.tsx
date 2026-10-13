import { useState } from "react";
import { compareRow, computeService, type DiscountKind, type MonthProjection, projectMonth, simulateDiscount } from "../calc";
import { glossary } from "../glossary";
import { formatBRL, formatNumber, formatPct } from "../money";
import type { PricingData } from "../types";
import { Help, NumInput, Panel, Row, Warning } from "./fields";
import { ServicePicker } from "./ServicesPanel";

const money = (v: number | null) => (v === null ? "—" : formatBRL(v));

function NotReady({ issues }: { issues: string[] }) {
  return (
    <Warning>
      Complete o serviço na aba Serviços para simular.
      {issues[0] && <span className="mt-1 block font-normal">{issues[0]}</span>}
    </Warning>
  );
}

function Toggle<T extends string>({ value, options, onChange, label }: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full bg-[#F7F3F5] p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`min-h-10 rounded-full px-4 text-[14px] font-bold transition-colors ${
            o.value === value ? "bg-surface text-primary shadow-soft" : "text-ink-soft"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Descontos                                                                  */
/* -------------------------------------------------------------------------- */

export function DiscountPanel({ data, selectedId, onSelect }: { data: PricingData; selectedId: string; onSelect: (id: string) => void }) {
  const service = data.services.find((s) => s.id === selectedId) ?? data.services[0];
  const b = computeService(service, data);
  const [normalPrice, setNormalPrice] = useState<number | null>(null);
  const [kind, setKind] = useState<DiscountKind>("percent");
  const [value, setValue] = useState<number | null>(null);

  const price = normalPrice ?? b.salePrice;
  const sim = price !== null && b.base !== null && value !== null ? simulateDiscount(price, kind, value, b.base, data.settings, b.minPrice) : null;
  const invalid = price !== null && value !== null && sim === null;

  return (
    <Panel title="Simulador de descontos" description={<Help>Veja o que acontece com o seu resultado antes de oferecer um desconto.</Help>}>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_340px] [&>*]:min-w-0">
        <div className="space-y-4">
          <ServicePicker services={data.services} selectedId={service.id} onSelect={(id) => { onSelect(id); setNormalPrice(null); }} />
          {b.salePrice === null ? (
            <NotReady issues={b.issues} />
          ) : (
            <>
              <NumInput
                label="Preço normal"
                kind="money"
                value={price}
                onChange={setNormalPrice}
                hint="Começa com o preço do serviço; você pode mudar."
              />
              <div>
                <p className="text-[14px] font-bold text-ink">Tipo de desconto</p>
                <div className="mt-1.5">
                  <Toggle
                    label="Tipo de desconto"
                    value={kind}
                    onChange={(k) => { setKind(k); setValue(null); }}
                    options={[{ value: "percent", label: "Porcentagem" }, { value: "fixed", label: "Valor em R$" }]}
                  />
                </div>
              </div>
              <NumInput
                key={kind}
                label="Desconto"
                kind={kind === "percent" ? "percent" : "money"}
                value={value}
                onChange={setValue}
              />
            </>
          )}
        </div>

        {b.salePrice !== null && (
          <div className="self-start rounded-[14px] bg-blush p-4" aria-live="polite">
            {invalid ? (
              <Warning tone="error">O desconto não pode ser maior que o preço (o valor final ficaria negativo).</Warning>
            ) : sim ? (
              <>
                <dl>
                  <Row label="Preço final" value={formatBRL(sim.final)} strong />
                  <Row label="Economia da cliente" value={formatBRL(sim.savings)} />
                  <Row label="Resultado após o desconto" value={formatBRL(sim.result)} />
                  <Row label="Margem efetiva após o desconto" value={sim.margin === null ? "—" : formatPct(sim.margin)} />
                  <Row label="Preço mínimo estimado" value={money(b.minPrice)} muted />
                </dl>
                {sim.belowMinimum && (
                  <div className="mt-3">
                    <Warning>Com esse desconto, o preço fica abaixo do mínimo estimado e não cobre os custos e a remuneração informados.</Warning>
                  </div>
                )}
              </>
            ) : (
              <p className="text-[14px] text-ink-soft">Informe o desconto para ver o resultado.</p>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/* Faturamento do mês                                                         */
/* -------------------------------------------------------------------------- */

function MonthCard({ title, projection }: { title: string; projection: MonthProjection | null }) {
  return (
    <div className="rounded-[14px] border border-line bg-surface p-4">
      <p className="text-[15px] font-bold text-ink">{title}</p>
      {projection ? (
        <dl className="mt-1">
          <Row label="Receita bruta" value={formatBRL(projection.revenue)} />
          <Row label="Taxas e impostos" value={`− ${formatBRL(projection.feesAndTaxes)}`} />
          <Row label="Materiais e outros custos" value={`− ${formatBRL(projection.variableCosts)}`} />
          <Row label="Custos fixos do mês" value={`− ${formatBRL(projection.fixedMonthly)}`} />
          <Row label="Sua remuneração pelo tempo" value={`− ${formatBRL(projection.timePay)}`} />
          <div className="mt-1 flex items-baseline justify-between gap-3 pt-2">
            <dt className="font-bold text-ink">Resultado do mês</dt>
            <dd className={`text-[20px] font-bold whitespace-nowrap tabular-nums ${projection.result < 0 ? "text-error" : "text-primary"}`}>
              {formatBRL(projection.result)}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-2 text-[14px] text-ink-soft">Informe a quantidade.</p>
      )}
    </div>
  );
}

export function MonthPanel({ data, update, selectedId, onSelect }: {
  data: PricingData;
  update: (fn: (d: PricingData) => PricingData) => void;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [mode, setMode] = useState<"single" | "mix">("single");
  const [custom, setCustom] = useState<number | null>(null);
  const service = data.services.find((s) => s.id === selectedId) ?? data.services[0];
  const b = computeService(service, data);
  const fixed = b.fixedMonthly ?? 0;
  const one = (qty: number | null) => (qty === null ? null : projectMonth([{ breakdown: b, qty }], fixed, data.settings));

  const mix = data.monthMix ?? {};
  const mixItems = data.services.map((s) => ({ service: s, breakdown: computeService(s, data), qty: mix[s.id] ?? null }));
  const mixReady = mixItems.every((i) => !i.qty || i.breakdown.salePrice !== null);
  const mixProjection = mixReady
    ? projectMonth(mixItems.filter((i) => i.qty).map((i) => ({ breakdown: i.breakdown, qty: i.qty! })), fixed, data.settings)
    : null;

  return (
    <Panel
      title="Faturamento do mês"
      description={
        <div className="space-y-1.5">
          <Help>{glossary.revenue}</Help>
          <Help>{glossary.simulation} Os custos fixos entram uma vez, pelo valor do mês.</Help>
        </div>
      }
    >
      <Toggle
        label="Tipo de simulação"
        value={mode}
        onChange={setMode}
        options={[{ value: "single", label: "Um serviço" }, { value: "mix", label: "Vários serviços" }]}
      />

      {mode === "single" ? (
        <div className="mt-4 space-y-4">
          <ServicePicker services={data.services} selectedId={service.id} onSelect={onSelect} />
          {b.salePrice === null ? (
            <NotReady issues={b.issues} />
          ) : (
            <>
              <p className="text-[14px] text-ink-soft">
                Preço usado: <strong className="text-ink">{formatBRL(b.salePrice)}</strong> por atendimento.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {[10, 20, 40].map((qty) => (
                  <MonthCard key={qty} title={`${qty} atendimentos`} projection={one(qty)} />
                ))}
                <div className="space-y-2">
                  <NumInput label="Quantidade personalizada" kind="integer" suffix="atend." value={custom} onChange={setCustom} />
                  <MonthCard title={custom === null ? "Personalizado" : `${custom} atendimentos`} projection={one(custom)} />
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_360px] [&>*]:min-w-0">
          <ul className="space-y-2">
            {mixItems.map(({ service: s, breakdown, qty }) => (
              <li key={s.id} className="flex items-center gap-3 rounded-[12px] bg-[#FCFAFB] p-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold text-ink">{s.name || "Sem nome"}</p>
                  <p className="text-[13px] text-ink-soft">{breakdown.salePrice === null ? "Serviço incompleto" : `${formatBRL(breakdown.salePrice)} cada`}</p>
                </div>
                <NumInput
                  label={`Atendimentos de ${s.name} no mês`}
                  hideLabel
                  kind="integer"
                  placeholder="0"
                  value={qty}
                  onChange={(v) => update((d) => ({ ...d, monthMix: { ...(d.monthMix ?? {}), [s.id]: v } }))}
                  className="w-[110px] shrink-0"
                />
              </li>
            ))}
          </ul>
          <div className="self-start">
            {mixReady ? (
              <MonthCard title={`Composição do mês (${mixProjection?.qty ?? 0} atendimentos)`} projection={mixProjection} />
            ) : (
              <Warning>Algum serviço com quantidade ainda está incompleto. Complete-o na aba Serviços.</Warning>
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/* Comparador                                                                 */
/* -------------------------------------------------------------------------- */

const MAX_COMPARE = 5;

export function ComparePanel({ data }: { data: PricingData }) {
  const [selected, setSelected] = useState<string[]>(() => data.services.slice(0, MAX_COMPARE).map((s) => s.id));
  const chosen = data.services.filter((s) => selected.includes(s.id));
  const rows = chosen.map((s) => ({ service: s, b: computeService(s, data) })).map(({ service, b }) => ({ service, row: compareRow(service, b, data.settings) }));

  const metrics: { label: string; get: (r: (typeof rows)[number]["row"]) => string }[] = [
    { label: "Tempo do atendimento", get: (r) => (r.minutes === null ? "—" : `${formatNumber(r.minutes, 0)} min`) },
    { label: "Custo dos materiais", get: (r) => money(r.materials) },
    { label: "Custo total estimado", get: (r) => money(r.totalCost) },
    { label: "Preço de venda", get: (r) => money(r.price) },
    { label: "Resultado por atendimento", get: (r) => money(r.result) },
    { label: "Margem efetiva", get: (r) => (r.margin === null ? "—" : formatPct(r.margin)) },
    { label: "Resultado por hora", get: (r) => money(r.resultPerHour) },
  ];

  return (
    <Panel
      title="Comparador de serviços"
      description={
        <div className="space-y-1.5">
          <Help>Escolha até {MAX_COMPARE} serviços.</Help>
          <Help>
            O resultado por hora é o que sobra <strong>além</strong> da remuneração do seu tempo, que já está nos custos. Compare
            também tempo e custos: um resultado maior nem sempre significa o serviço mais vantajoso.
          </Help>
        </div>
      }
    >
      <fieldset>
        <legend className="sr-only">Serviços para comparar</legend>
        <div className="flex flex-wrap gap-2">
          {data.services.map((s) => {
            const checked = selected.includes(s.id);
            const disabled = !checked && selected.length >= MAX_COMPARE;
            return (
              <label
                key={s.id}
                className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-[14px] font-medium ${
                  checked ? "border-primary bg-blush text-primary" : "border-line text-ink-soft"
                } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => setSelected((cur) => (checked ? cur.filter((id) => id !== s.id) : [...cur, s.id]))}
                  className="accent-primary"
                />
                {s.name || "Sem nome"}
              </label>
            );
          })}
        </div>
      </fieldset>

      {rows.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-[12px] border border-line">
          <table className="w-full min-w-[560px] border-collapse text-[14px]">
            <thead>
              <tr className="bg-[#FCFAFB]">
                <th scope="col" className="sticky left-0 bg-[#FCFAFB] px-3 py-2.5 text-left font-bold text-ink-soft">
                  <span className="sr-only">Indicador</span>
                </th>
                {rows.map(({ service }) => (
                  <th key={service.id} scope="col" className="px-3 py-2.5 text-right font-bold text-ink">
                    {service.name || "Sem nome"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.label} className="border-t border-line">
                  <th scope="row" className="sticky left-0 bg-surface px-3 py-2.5 text-left font-medium text-ink-soft">
                    {m.label}
                  </th>
                  {rows.map(({ service, row }) => (
                    <td key={service.id} className="px-3 py-2.5 text-right text-ink tabular-nums">
                      {m.get(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
