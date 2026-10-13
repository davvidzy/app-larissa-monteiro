/* Cálculos da Calculadora de Precificação — funções puras, sem interface.
   Dinheiro em centavos inteiros; percentuais como números de 0 a 100 (5 = 5%). */

import { ceilCents, percentOf, roundCents } from "./money";
import type { Cents, Material, NamedCost, PricingData, Service, Settings } from "./types";

const valid = (n: number | null | undefined): n is number => typeof n === "number" && Number.isFinite(n);

/* -------------------------------------------------------------------------- */
/* Materiais                                                                  */
/* -------------------------------------------------------------------------- */

/** Custo de 1 unidade do material, em centavos (com frações). null = dados inválidos. */
export function materialUnitCost(material: Material): number | null {
  const { packagePriceCents: price, packageQty: qty } = material;
  if (!valid(price) || !valid(qty) || price < 0 || qty <= 0) return null;
  return price / qty;
}

/** custo_atendimento = custo_unitario × quantidade_consumida × (1 + desperdicio/100) */
export function materialUseCost(material: Material, qty: number | null): Cents | null {
  const unit = materialUnitCost(material);
  if (unit === null || !valid(qty) || qty < 0 || !valid(material.wastePct) || material.wastePct < 0) return null;
  return roundCents(unit * qty * (1 + material.wastePct / 100));
}

/** Motivo de um material não poder entrar no cálculo (para orientar a usuária). */
export function materialIssue(material: Material): string | null {
  const { packagePriceCents: price, packageQty: qty } = material;
  if (price === null || qty === null) return `Preencha o preço e a quantidade da embalagem de "${material.name}".`;
  if (!valid(price) || price < 0) return `O preço de "${material.name}" não pode ser negativo.`;
  if (!valid(qty) || qty <= 0) return `A quantidade da embalagem de "${material.name}" precisa ser maior que zero.`;
  if (!valid(material.wastePct) || material.wastePct < 0) return `O desperdício de "${material.name}" não pode ser negativo.`;
  return null;
}

/* -------------------------------------------------------------------------- */
/* Custos fixos, tempo e outros custos                                        */
/* -------------------------------------------------------------------------- */

/** Soma de valores em centavos; campos vazios contam como zero. null = há valor negativo/inválido. */
export function sumCosts(items: NamedCost[]): Cents | null {
  let total = 0;
  for (const item of items) {
    if (item.cents === null) continue;
    if (!valid(item.cents) || item.cents < 0) return null;
    total += item.cents;
  }
  return total;
}

/** rateio_por_atendimento = custos_fixos_mensais / atendimentos_previstos. null = não dá para calcular. */
export function fixedCostShare(fixedMonthly: Cents, appointments: number | null): Cents | null {
  if (!valid(appointments) || appointments <= 0) return fixedMonthly === 0 ? 0 : null;
  return roundCents(fixedMonthly / appointments);
}

/** remuneracao_tempo = (duracao_minutos / 60) × valor_hora */
export function timePay(minutes: number | null, hourRateCents: Cents | null): Cents | null {
  if (!valid(minutes) || !valid(hourRateCents) || minutes < 0 || hourRateCents < 0) return null;
  return roundCents((minutes / 60) * hourRateCents);
}

/* -------------------------------------------------------------------------- */
/* Taxas, impostos e preço                                                    */
/* -------------------------------------------------------------------------- */

export type Rates = Pick<Settings, "paymentFeePct" | "paymentFeeFixedCents" | "taxPct">;

export function ratesIssue(rates: Rates): string | null {
  const { paymentFeePct: tp, paymentFeeFixedCents: tf, taxPct: i } = rates;
  if (![tp, tf, i].every(valid) || tp < 0 || tf < 0 || i < 0) return "Taxas e impostos não podem ser negativos.";
  if (tp + i >= 100) return "A soma da taxa de pagamento com os impostos precisa ser menor que 100%.";
  return null;
}

/** Taxas e impostos cobrados sobre um preço de venda. */
export function feesAt(price: Cents, rates: Rates) {
  const payment = percentOf(price, rates.paymentFeePct);
  const tax = percentOf(price, rates.taxPct);
  const fixed = rates.paymentFeeFixedCents;
  return { payment, tax, fixed, total: payment + tax + fixed };
}

/** preco_minimo = (CB + TF) / (1 - TP - I) — arredondado para cima. */
export function minimumPrice(baseCost: Cents, rates: Rates): Cents | null {
  if (ratesIssue(rates)) return null;
  const denominator = 1 - rates.paymentFeePct / 100 - rates.taxPct / 100;
  if (denominator <= 0) return null;
  return ceilCents((baseCost + rates.paymentFeeFixedCents) / denominator);
}

/** preco_sugerido = (CB + TF) / (1 - TP - I - M) — arredondado para cima, preservando a margem. */
export function suggestedPrice(baseCost: Cents, rates: Rates, marginPct: number | null): Cents | null {
  if (ratesIssue(rates) || !valid(marginPct) || marginPct < 0) return null;
  const denominator = 1 - rates.paymentFeePct / 100 - rates.taxPct / 100 - marginPct / 100;
  if (denominator <= 0) return null;
  return ceilCents((baseCost + rates.paymentFeeFixedCents) / denominator);
}

/** resultado = preco_venda × (1 - TP - I) - TF - CB */
export function resultAt(price: Cents, baseCost: Cents, rates: Rates): Cents {
  return price - feesAt(price, rates).total - baseCost;
}

/** margem_efetiva = resultado / preco_venda × 100. null quando o preço é zero. */
export function effectiveMargin(price: Cents, result: Cents): number | null {
  if (!valid(price) || price <= 0) return null;
  return (result / price) * 100;
}

/* -------------------------------------------------------------------------- */
/* Serviço completo                                                           */
/* -------------------------------------------------------------------------- */

export type MaterialLine = { material: Material; qty: number | null; cost: Cents | null };

export type ServiceBreakdown = {
  /** Problemas que impedem o cálculo do preço (vazio = tudo certo). */
  issues: string[];
  materialLines: MaterialLine[];
  materials: Cents | null;
  variable: Cents | null;
  fixedMonthly: Cents | null;
  fixedShare: Cents | null;
  time: Cents | null;
  /** custo_base = materiais + custos_variaveis + rateio_fixo + remuneracao_tempo */
  base: Cents | null;
  minPrice: Cents | null;
  suggested: Cents | null;
  /** Preço usado nos resultados: o escolhido pela usuária ou, se vazio, o sugerido. */
  salePrice: Cents | null;
  result: Cents | null;
  margin: number | null;
  belowMinimum: boolean;
};

export function computeService(service: Service, data: Pick<PricingData, "materials" | "expenses" | "settings">): ServiceBreakdown {
  const issues: string[] = [];
  const { settings } = data;

  // Materiais
  const materialLines: MaterialLine[] = [];
  let materials: Cents | null = 0;
  for (const item of service.materials) {
    const material = data.materials.find((m) => m.id === item.materialId);
    if (!material) continue; // material excluído do catálogo
    const cost = materialUseCost(material, item.qty);
    materialLines.push({ material, qty: item.qty, cost });
    if (cost === null) {
      issues.push(
        materialIssue(material) ??
          (item.qty === null
            ? `Informe a quantidade de "${material.name}" usada neste serviço.`
            : `A quantidade de "${material.name}" não pode ser negativa.`),
      );
      materials = null;
    } else if (materials !== null) {
      materials += cost;
    }
  }

  // Outros custos por atendimento
  const variable = sumCosts(service.extraCosts);
  if (variable === null) issues.push("Os outros custos por atendimento não podem ser negativos.");

  // Rateio dos custos fixos
  const fixedMonthly = sumCosts(data.expenses);
  if (fixedMonthly === null) issues.push("As despesas fixas não podem ser negativas.");
  const fixedShare = fixedMonthly === null ? null : fixedCostShare(fixedMonthly, settings.appointmentsPerMonth);
  if (fixedMonthly !== null && fixedShare === null) {
    issues.push("Informe quantos atendimentos você prevê no mês para dividir os custos fixos.");
  }

  // Tempo
  if (service.minutes === null) issues.push("Informe a duração do atendimento em minutos.");
  if (settings.hourRateCents === null) issues.push("Informe quanto deseja receber por hora de trabalho.");
  const time = timePay(service.minutes, settings.hourRateCents);
  if (time === null && service.minutes !== null && settings.hourRateCents !== null) {
    issues.push("Duração e valor da hora não podem ser negativos.");
  }

  const rateProblem = ratesIssue(settings);
  if (rateProblem) issues.push(rateProblem);

  const margin = service.marginPct;
  if (margin === null) issues.push("Escolha a margem desejada (pode ser 0%).");
  else if (!valid(margin) || margin < 0) issues.push("A margem não pode ser negativa.");
  else if (!rateProblem && settings.paymentFeePct + settings.taxPct + margin >= 100) {
    issues.push("Taxas, impostos e margem somados precisam ficar abaixo de 100%.");
  }

  const base =
    materials !== null && variable !== null && fixedShare !== null && time !== null
      ? materials + variable + fixedShare + time
      : null;

  const ok = issues.length === 0 && base !== null;
  const minPrice = ok ? minimumPrice(base, settings) : null;
  const suggested = ok ? suggestedPrice(base, settings, margin) : null;

  const chosen = valid(service.chosenPriceCents) && service.chosenPriceCents >= 0 ? service.chosenPriceCents : null;
  const salePrice = ok ? (chosen ?? suggested) : null;
  const result = salePrice !== null && base !== null ? resultAt(salePrice, base, settings) : null;

  return {
    issues,
    materialLines,
    materials,
    variable,
    fixedMonthly,
    fixedShare,
    time,
    base,
    minPrice,
    suggested,
    salePrice,
    result,
    margin: salePrice !== null && result !== null ? effectiveMargin(salePrice, result) : null,
    belowMinimum: salePrice !== null && minPrice !== null && salePrice < minPrice,
  };
}

/* -------------------------------------------------------------------------- */
/* Simulador de descontos                                                     */
/* -------------------------------------------------------------------------- */

export type DiscountKind = "percent" | "fixed";

export function applyDiscount(price: Cents, kind: DiscountKind, value: number | null): { final: Cents; savings: Cents } | null {
  if (!valid(price) || price < 0 || !valid(value) || value < 0) return null;
  const savings = kind === "percent" ? (value > 100 ? null : percentOf(price, value)) : value > price ? null : roundCents(value);
  if (savings === null) return null;
  return { final: price - savings, savings };
}

export function simulateDiscount(price: Cents, kind: DiscountKind, value: number | null, baseCost: Cents, rates: Rates, minPrice: Cents | null) {
  const discount = applyDiscount(price, kind, value);
  if (!discount) return null;
  const result = resultAt(discount.final, baseCost, rates);
  return {
    ...discount,
    result,
    margin: effectiveMargin(discount.final, result),
    belowMinimum: minPrice !== null && discount.final < minPrice,
  };
}

/* -------------------------------------------------------------------------- */
/* Projeção mensal                                                            */
/* -------------------------------------------------------------------------- */

export type MonthItem = { breakdown: ServiceBreakdown; qty: number };

export type MonthProjection = {
  qty: number;
  revenue: Cents;
  feesAndTaxes: Cents;
  /** Materiais + outros custos por atendimento. NÃO inclui o rateio dos fixos. */
  variableCosts: Cents;
  fixedMonthly: Cents;
  timePay: Cents;
  result: Cents;
};

/**
 * resultado_mensal = receita - taxas_impostos - custos_variaveis - remuneracao_tempo - custos_fixos_mensais
 * Os custos fixos entram UMA vez, pelo valor do mês (o rateio por atendimento não é usado aqui).
 */
export function projectMonth(items: MonthItem[], fixedMonthly: Cents, rates: Rates): MonthProjection | null {
  let qty = 0, revenue = 0, feesAndTaxes = 0, variableCosts = 0, time = 0;
  for (const { breakdown: b, qty: n } of items) {
    if (!valid(n) || n < 0 || !Number.isInteger(n)) return null;
    if (n === 0) continue;
    if (b.salePrice === null || b.materials === null || b.variable === null || b.time === null) return null;
    qty += n;
    revenue += n * b.salePrice;
    feesAndTaxes += n * feesAt(b.salePrice, rates).total;
    variableCosts += n * (b.materials + b.variable);
    time += n * b.time;
  }
  return {
    qty,
    revenue,
    feesAndTaxes,
    variableCosts,
    fixedMonthly,
    timePay: time,
    result: revenue - feesAndTaxes - variableCosts - time - fixedMonthly,
  };
}

/* -------------------------------------------------------------------------- */
/* Comparador                                                                 */
/* -------------------------------------------------------------------------- */

export function compareRow(service: Service, b: ServiceBreakdown, rates: Rates) {
  const totalCost = b.base !== null && b.salePrice !== null ? b.base + feesAt(b.salePrice, rates).total : null;
  const hours = valid(service.minutes) ? service.minutes / 60 : 0;
  return {
    minutes: service.minutes,
    materials: b.materials,
    totalCost,
    price: b.salePrice,
    result: b.result,
    margin: b.margin,
    /** resultado_por_hora = resultado_atendimento / (duracao_minutos / 60) */
    resultPerHour: b.result !== null && hours > 0 ? roundCents(b.result / hours) : null,
  };
}
