import { Plus, Trash2 } from "lucide-react";
import { fixedCostShare, sumCosts } from "../calc";
import { newCost } from "../defaults";
import { glossary } from "../glossary";
import { formatBRL } from "../money";
import type { NamedCost, PricingData, Settings } from "../types";
import { Help, NumInput, Panel, SmallButton, TextInput, Warning } from "./fields";

/** Lista editável de custos com nome e valor (usada também nos serviços). */
export function CostList({ items, onChange, addLabel, nameLabel }: {
  items: NamedCost[];
  onChange: (items: NamedCost[]) => void;
  addLabel: string;
  nameLabel: string;
}) {
  const set = (id: string, patch: Partial<NamedCost>) => onChange(items.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  return (
    <div>
      <ul className="space-y-2">
        {items.map((cost) => (
          <li key={cost.id} className="flex items-start gap-2">
            <TextInput label={nameLabel} hideLabel value={cost.name} onChange={(name) => set(cost.id, { name })} className="min-w-0 flex-[3]" />
            <NumInput label={`Valor de ${cost.name}`} hideLabel kind="money" value={cost.cents} onChange={(cents) => set(cost.id, { cents })} className="min-w-0 flex-[2]" />
            <SmallButton tone="danger" label={`Excluir ${cost.name}`} onClick={() => onChange(items.filter((c) => c.id !== cost.id))}>
              <Trash2 aria-hidden="true" className="size-4" />
            </SmallButton>
          </li>
        ))}
      </ul>
      <div className="mt-2">
        <SmallButton onClick={() => onChange([...items, newCost("")])}>
          <Plus aria-hidden="true" className="size-4" />
          {addLabel}
        </SmallButton>
      </div>
    </div>
  );
}

export function CostsPanel({ data, update }: { data: PricingData; update: (fn: (d: PricingData) => PricingData) => void }) {
  const { settings } = data;
  const setSettings = (patch: Partial<Settings>) => update((d) => ({ ...d, settings: { ...d.settings, ...patch } }));

  const fixedTotal = sumCosts(data.expenses);
  const share = fixedTotal === null ? null : fixedCostShare(fixedTotal, settings.appointmentsPerMonth);

  return (
    <div className="space-y-4">
      <Panel title="Despesas fixas do mês" description={<Help>{glossary.fixed}</Help>}>
        <CostList
          items={data.expenses}
          onChange={(expenses) => update((d) => ({ ...d, expenses }))}
          addLabel="Adicionar despesa"
          nameLabel="Nome da despesa"
        />

        <div className="mt-5 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
          <div>
            <p className="text-[14px] text-ink-soft">Total de despesas fixas</p>
            <p className="text-[22px] font-bold text-ink tabular-nums">{fixedTotal === null ? "—" : formatBRL(fixedTotal)}</p>
          </div>
          <NumInput
            label="Atendimentos previstos no mês"
            kind="integer"
            suffix="atendimentos"
            value={settings.appointmentsPerMonth}
            onChange={(v) => setSettings({ appointmentsPerMonth: v })}
            hint="Mude o número e veja o custo por atendimento mudar."
          />
        </div>

        <div className="mt-4 rounded-[12px] bg-blush p-4">
          {share !== null ? (
            <p className="text-[15px] text-ink">
              Cada atendimento carrega <strong className="text-primary">{formatBRL(share)}</strong> dos custos fixos.
            </p>
          ) : fixedTotal !== null ? (
            <p className="text-[14px] font-medium text-[#87510D]">
              Informe quantos atendimentos você prevê no mês: sem isso, o rateio não pode ser calculado.
            </p>
          ) : (
            <p className="text-[14px] font-medium text-error">As despesas não podem ser negativas.</p>
          )}
          <p className="mt-1.5 text-[13px] text-ink-soft">{glossary.fixedShare}</p>
        </div>
      </Panel>

      <Panel title="Valor do seu tempo" description={<Help>{glossary.hourRate}</Help>}>
        <NumInput
          label="Quanto deseja receber por hora de trabalho"
          kind="money"
          value={settings.hourRateCents}
          onChange={(v) => setSettings({ hourRateCents: v })}
          className="max-w-[320px]"
        />
        <p className="mt-3 text-[13px] text-ink-soft">
          {glossary.timePay} A duração de cada atendimento você informa em cada serviço. Esse valor não é o lucro do
          negócio: a margem é calculada à parte.
        </p>
      </Panel>

      <Panel
        title="Taxas e impostos"
        description={<Help>Todos opcionais. Configure conforme a sua maquininha e a sua situação fiscal; nada é presumido.</Help>}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <NumInput
            label="Taxa do meio de pagamento"
            kind="percent"
            maxExclusive={100}
            value={settings.paymentFeePct}
            onChange={(v) => setSettings({ paymentFeePct: v ?? 0 })}
            hint="Ex.: taxa da maquininha"
          />
          <NumInput
            label="Taxa fixa por transação"
            kind="money"
            value={settings.paymentFeeFixedCents}
            onChange={(v) => setSettings({ paymentFeeFixedCents: v ?? 0 })}
            hint="Se houver"
          />
          <NumInput
            label="Impostos sobre a receita"
            kind="percent"
            maxExclusive={100}
            value={settings.taxPct}
            onChange={(v) => setSettings({ taxPct: v ?? 0 })}
            hint="Conforme sua situação fiscal"
          />
        </div>
        {settings.paymentFeePct + settings.taxPct >= 100 && (
          <div className="mt-3">
            <Warning tone="error">A soma da taxa de pagamento com os impostos precisa ser menor que 100%.</Warning>
          </div>
        )}
      </Panel>
    </div>
  );
}
