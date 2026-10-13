import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { glossary } from "../glossary";
import { formatBRL, formatNumber, formatPct } from "../money";
import type { ServiceReport } from "../report";

const money = (v: number | null) => (v === null ? "—" : formatBRL(v));
const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" });

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <tr>
      <td style={{ padding: "5px 0", borderBottom: "1px solid #EDE6E9", fontWeight: strong ? 700 : 400 }}>{label}</td>
      <td style={{ padding: "5px 0", borderBottom: "1px solid #EDE6E9", textAlign: "right", fontWeight: strong ? 700 : 500 }}>{value}</td>
    </tr>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginTop: 18, breakInside: "avoid" }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: "#862D59", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>
        {title}
      </h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
        <tbody>{children}</tbody>
      </table>
    </section>
  );
}

/**
 * Relatório de um serviço, visível só na impressão (o resto do portal some no papel).
 * O navegador gera o PDF pela opção "Salvar como PDF" da janela de impressão.
 */
export function PrintReport({ report }: { report: ServiceReport }) {
  const r = report;
  return createPortal(
    <div className="print-only" style={{ fontFamily: '"DM Sans", Arial, sans-serif', color: "#231D21" }}>
      <header style={{ borderBottom: "2px solid #862D59", paddingBottom: 10 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.14em", color: "#862D59", fontWeight: 700, margin: 0 }}>
          BELLASH ACADEMY · CALCULADORA DE PRECIFICAÇÃO LASH
        </p>
        <h1 style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 30, fontWeight: 600, margin: "6px 0 2px", color: "#301827" }}>
          {r.serviceName || "Serviço sem nome"}
        </h1>
        <p style={{ fontSize: 12, margin: 0, color: "#50454B" }}>
          Calculado em {dateFormat.format(r.date)}
          {r.minutes !== null && ` · Duração: ${formatNumber(r.minutes, 0)} minutos`}
        </p>
      </header>

      <Section title="Materiais por atendimento">
        {r.materials.length === 0 && <Line label="Nenhum material informado" value="—" />}
        {r.materials.map((m) => (
          <Line key={m.name} label={`${m.name} — ${m.qty === null ? "?" : formatNumber(m.qty, 4)} ${m.unit}`} value={money(m.cost)} />
        ))}
        <Line label="Total de materiais" value={money(r.materialsTotal)} strong />
      </Section>

      <Section title="Custos do atendimento">
        <Line label="Outros custos variáveis" value={money(r.variable)} />
        <Line
          label={`Custos fixos rateados (${money(r.fixedMonthly)} ÷ ${r.appointmentsPerMonth ?? "?"} atendimentos)`}
          value={money(r.fixedShare)}
        />
        <Line label={`Remuneração desejada (${money(r.hourRate)} por hora)`} value={money(r.timePay)} />
        <Line label="Custo base total" value={money(r.base)} strong />
      </Section>

      <Section title="Taxas e impostos configurados">
        <Line label="Taxa do meio de pagamento" value={formatPct(r.paymentFeePct, 2)} />
        <Line label="Taxa fixa por transação" value={formatBRL(r.paymentFeeFixed)} />
        <Line label="Impostos estimados sobre a receita" value={formatPct(r.taxPct, 2)} />
        <Line label="Taxas e impostos no preço de venda" value={money(r.feesAtSale)} />
      </Section>

      <Section title="Preço e resultado">
        <Line label="Preço mínimo estimado" value={money(r.minPrice)} />
        <Line label={`Preço sugerido (margem desejada de ${r.marginTargetPct === null ? "—" : formatPct(r.marginTargetPct)})`} value={money(r.suggested)} />
        <Line label="Preço escolhido" value={r.chosen === null ? "Usando o preço sugerido" : formatBRL(r.chosen)} strong />
        <Line label="Resultado estimado por atendimento" value={money(r.result)} />
        <Line label="Margem efetiva" value={r.effectiveMargin === null ? "—" : formatPct(r.effectiveMargin)} />
      </Section>

      {r.belowMinimum && <p style={{ marginTop: 12, fontSize: 12.5, fontWeight: 700, color: "#87510D" }}>{glossary.belowMinimum}</p>}
      {r.issues.length > 0 && (
        <p style={{ marginTop: 12, fontSize: 12.5, color: "#AA2841" }}>Cálculo incompleto: {r.issues.join(" ")}</p>
      )}

      <p style={{ marginTop: 22, fontSize: 10.5, color: "#6C5E66" }}>
        Estimativa com base nos valores informados pela usuária. Não é uma garantia de resultado ou de renda. {glossary.resultIncludesTime}
      </p>
    </div>,
    document.body,
  );
}
