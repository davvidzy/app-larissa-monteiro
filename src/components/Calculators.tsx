import { type ReactNode, useState } from "react";
import { formatPrice, parseNumber } from "../lib/format";
import { NumberField } from "./ui/NumberField";

/** Moldura das calculadoras (o título fica na página da ferramenta). */
function CalculatorCard({ children }: { children: ReactNode }) {
  return <section className="rounded-card border border-line bg-surface p-5 shadow-soft md:p-7">{children}</section>;
}

function ResultRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 py-2 ${strong ? "" : "border-b border-line"}`}>
      <dt className={strong ? "font-bold text-ink" : "text-[14px] text-ink-soft"}>{label}</dt>
      <dd className={strong ? "text-[30px] leading-none font-bold tracking-[-0.03em] text-primary" : "font-medium text-ink"}>
        {value}
      </dd>
    </div>
  );
}

/** Quantas clientes são necessárias para chegar numa meta de ganho mensal. */
export function GoalCalculator() {
  const [goal, setGoal] = useState("3000");
  const [price, setPrice] = useState("120");
  const [materials, setMaterials] = useState("25");
  const [days, setDays] = useState("5");

  const profitPerClient = parseNumber(price) - parseNumber(materials);
  const perMonth = profitPerClient > 0 ? Math.ceil(parseNumber(goal) / profitPerClient) : 0;
  const perWeek = perMonth / 4.33;
  const workDays = parseNumber(days);
  const perDay = workDays > 0 ? perWeek / workDays : 0;
  const round = (value: number) => value.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

  return (
    <CalculatorCard>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField label="Quanto quer ganhar no mês" prefix="R$" value={goal} onChange={setGoal} />
          <NumberField label="Preço do atendimento" prefix="R$" value={price} onChange={setPrice} />
          <NumberField label="Materiais por atendimento" prefix="R$" value={materials} onChange={setMaterials} />
          <NumberField label="Dias de trabalho por semana" suffix="dias" value={days} onChange={setDays} />
        </div>

        <dl className="self-start rounded-[14px] bg-blush p-5" aria-live="polite">
          {profitPerClient > 0 ? (
            <>
              <ResultRow label="Sobra por cliente" value={formatPrice(profitPerClient)} />
              <ResultRow label="Por semana" value={`${round(perWeek)} clientes`} />
              <ResultRow label="Por dia de trabalho" value={`${round(perDay)} clientes`} />
              <div className="mt-3">
                <ResultRow label="Clientes no mês" value={String(perMonth)} strong />
              </div>
            </>
          ) : (
            <p className="text-[14px] font-medium text-error">O preço precisa ser maior que o custo dos materiais.</p>
          )}
        </dl>
      </div>
    </CalculatorCard>
  );
}
