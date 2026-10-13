/* Dados do relatório em PDF de um serviço (separados da tela de impressão para poder testar). */

import { computeService, feesAt } from "./calc";
import type { Cents, PricingData, Service } from "./types";

export type ServiceReport = {
  serviceName: string;
  date: Date;
  minutes: number | null;
  materials: { name: string; qty: number | null; unit: string; cost: Cents | null }[];
  materialsTotal: Cents | null;
  variable: Cents | null;
  fixedMonthly: Cents | null;
  appointmentsPerMonth: number | null;
  fixedShare: Cents | null;
  hourRate: Cents | null;
  timePay: Cents | null;
  base: Cents | null;
  paymentFeePct: number;
  paymentFeeFixed: Cents;
  taxPct: number;
  /** Taxas e impostos no preço de venda. */
  feesAtSale: Cents | null;
  marginTargetPct: number | null;
  minPrice: Cents | null;
  suggested: Cents | null;
  chosen: Cents | null;
  salePrice: Cents | null;
  result: Cents | null;
  effectiveMargin: number | null;
  belowMinimum: boolean;
  issues: string[];
};

export function buildReport(service: Service, data: PricingData, date = new Date()): ServiceReport {
  const b = computeService(service, data);
  return {
    serviceName: service.name,
    date,
    minutes: service.minutes,
    materials: b.materialLines.map((l) => ({ name: l.material.name, qty: l.qty, unit: l.material.unit, cost: l.cost })),
    materialsTotal: b.materials,
    variable: b.variable,
    fixedMonthly: b.fixedMonthly,
    appointmentsPerMonth: data.settings.appointmentsPerMonth,
    fixedShare: b.fixedShare,
    hourRate: data.settings.hourRateCents,
    timePay: b.time,
    base: b.base,
    paymentFeePct: data.settings.paymentFeePct,
    paymentFeeFixed: data.settings.paymentFeeFixedCents,
    taxPct: data.settings.taxPct,
    feesAtSale: b.salePrice !== null ? feesAt(b.salePrice, data.settings).total : null,
    marginTargetPct: service.marginPct,
    minPrice: b.minPrice,
    suggested: b.suggested,
    chosen: service.chosenPriceCents,
    salePrice: b.salePrice,
    result: b.result,
    effectiveMargin: b.margin,
    belowMinimum: b.belowMinimum,
    issues: b.issues,
  };
}
