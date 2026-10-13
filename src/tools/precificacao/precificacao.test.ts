import { describe, expect, it } from "vitest";
import {
  applyDiscount,
  compareRow,
  computeService,
  effectiveMargin,
  feesAt,
  fixedCostShare,
  materialUnitCost,
  materialUseCost,
  minimumPrice,
  projectMonth,
  resultAt,
  simulateDiscount,
  suggestedPrice,
  sumCosts,
  timePay,
  type Rates,
} from "./calc";
import { createInitialData, newMaterial, newService } from "./defaults";
import { ceilCents, parseCents, parseDecimal, roundCents } from "./money";
import { buildReport } from "./report";
import { exportBackup, importBackup, loadData, saveData, type KeyValueStore } from "./storage";
import type { Material, PricingData } from "./types";

const noRates: Rates = { paymentFeePct: 0, paymentFeeFixedCents: 0, taxPct: 0 };

function material(price: number | null, qty: number | null, wastePct = 0): Material {
  return { ...newMaterial("Fio"), packagePriceCents: price, packageQty: qty, wastePct };
}

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

/** Cenário completo e conhecido para testar o serviço de ponta a ponta. */
function scenario(): PricingData {
  const data = createInitialData();
  const fio: Material = { ...newMaterial("Fios", "un"), packagePriceCents: 6000, packageQty: 3000 }; // R$ 0,02/fio
  const cola: Material = { ...newMaterial("Adesivo", "mL"), packagePriceCents: 9000, packageQty: 5, wastePct: 20 }; // R$ 18/mL
  data.materials = [fio, cola];
  data.expenses = [{ id: "a", name: "Aluguel", cents: 40000 }, { id: "b", name: "Internet", cents: 10000 }]; // R$ 500
  data.settings = { appointmentsPerMonth: 50, hourRateCents: 3000, paymentFeePct: 5, paymentFeeFixedCents: 0, taxPct: 0 };
  const service = {
    ...newService("Clássica"),
    minutes: 120,
    materials: [
      { materialId: fio.id, qty: 100 }, // R$ 2,00
      { materialId: cola.id, qty: 0.5 }, // 18 × 0,5 × 1,2 = R$ 10,80
    ],
    extraCosts: [{ id: "l", name: "Lavanderia", cents: 300 }],
    marginPct: 20,
  };
  data.services = [service];
  return data;
}

describe("1. custo unitário dos materiais", () => {
  it("divide o preço da embalagem pela quantidade", () => {
    expect(materialUnitCost(material(6000, 3000))).toBe(2);
    expect(materialUseCost(material(6000, 3000), 100)).toBe(200);
  });
  it("não calcula com embalagem zerada ou preço negativo", () => {
    expect(materialUnitCost(material(6000, 0))).toBeNull();
    expect(materialUnitCost(material(-1, 10))).toBeNull();
    expect(materialUseCost(material(6000, 3000), -1)).toBeNull();
  });
});

describe("2. desperdício", () => {
  it("acrescenta o percentual ao consumo", () => {
    expect(materialUseCost(material(9000, 5, 20), 0.5)).toBe(1080); // 18 × 0,5 × 1,2
    expect(materialUseCost(material(9000, 5, 0), 0.5)).toBe(900);
  });
});

describe("3. rateio dos custos fixos", () => {
  it("divide o total do mês pelos atendimentos previstos", () => {
    expect(fixedCostShare(50000, 50)).toBe(1000);
    expect(fixedCostShare(10000, 3)).toBe(3333);
  });
  it("não calcula com zero atendimentos (a não ser que não haja custo fixo)", () => {
    expect(fixedCostShare(50000, 0)).toBeNull();
    expect(fixedCostShare(50000, null)).toBeNull();
    expect(fixedCostShare(0, 0)).toBe(0);
  });
  it("soma as despesas ignorando campos vazios", () => {
    expect(sumCosts([{ id: "1", name: "a", cents: 100 }, { id: "2", name: "b", cents: null }])).toBe(100);
    expect(sumCosts([{ id: "1", name: "a", cents: -5 }])).toBeNull();
  });
});

describe("4. remuneração por hora", () => {
  it("(minutos / 60) × valor da hora", () => {
    expect(timePay(120, 3000)).toBe(6000);
    expect(timePay(90, 2500)).toBe(3750);
    expect(timePay(null, 2500)).toBeNull();
    expect(timePay(-10, 2500)).toBeNull();
  });
});

describe("5 e 6. preço mínimo e preço com margem", () => {
  it("cenário conhecido: CB 80, TP 5%, M 20% → R$ 106,67 preservando a margem", () => {
    const rates = { ...noRates, paymentFeePct: 5 };
    const price = suggestedPrice(8000, rates, 20)!;
    expect(price).toBe(10667);
    expect(effectiveMargin(price, resultAt(price, 8000, rates))!).toBeGreaterThanOrEqual(20);
  });
  it("preço mínimo cobre os custos (resultado nunca negativo)", () => {
    const rates = { paymentFeePct: 4.99, paymentFeeFixedCents: 49, taxPct: 6 };
    const min = minimumPrice(8000, rates)!;
    expect(resultAt(min, 8000, rates)).toBeGreaterThanOrEqual(0);
    expect(resultAt(min - 1, 8000, rates)).toBeLessThan(0);
  });
  it("recusa margens negativas e somas de 100% ou mais", () => {
    expect(suggestedPrice(8000, noRates, -1)).toBeNull();
    expect(suggestedPrice(8000, { ...noRates, paymentFeePct: 30, taxPct: 20 }, 50)).toBeNull();
    expect(minimumPrice(8000, { ...noRates, taxPct: 100 })).toBeNull();
  });
});

describe("7 e 8. taxas percentuais, fixas e impostos", () => {
  it("separa taxa de pagamento, taxa fixa e impostos", () => {
    const fees = feesAt(10000, { paymentFeePct: 5, paymentFeeFixedCents: 50, taxPct: 6 });
    expect(fees).toEqual({ payment: 500, tax: 600, fixed: 50, total: 1150 });
  });
  it("taxa fixa entra no preço mínimo", () => {
    expect(minimumPrice(8000, { ...noRates, paymentFeeFixedCents: 100 })).toBe(8100);
  });
  it("impostos entram no denominador", () => {
    expect(minimumPrice(9000, { ...noRates, taxPct: 10 })).toBe(10000);
  });
});

describe("9. simulação de descontos", () => {
  it("percentual e valor fixo", () => {
    expect(applyDiscount(10000, "percent", 10)).toEqual({ final: 9000, savings: 1000 });
    expect(applyDiscount(10000, "fixed", 1500)).toEqual({ final: 8500, savings: 1500 });
  });
  it("impede preço final negativo", () => {
    expect(applyDiscount(10000, "percent", 120)).toBeNull();
    expect(applyDiscount(10000, "fixed", 10001)).toBeNull();
    expect(applyDiscount(10000, "fixed", -1)).toBeNull();
  });
  it("calcula resultado e alerta abaixo do mínimo", () => {
    const sim = simulateDiscount(10000, "percent", 30, 8000, noRates, 8000)!;
    expect(sim.final).toBe(7000);
    expect(sim.result).toBe(-1000);
    expect(sim.belowMinimum).toBe(true);
  });
});

describe("10. projeção mensal sem dupla contabilização", () => {
  it("usa a despesa fixa do mês uma única vez (sem o rateio por atendimento)", () => {
    const data = scenario();
    const b = computeService(data.services[0], data);
    const month = projectMonth([{ breakdown: b, qty: 50 }], b.fixedMonthly!, data.settings)!;
    // Com exatamente os atendimentos previstos, o resultado do mês ≈ resultado por atendimento × quantidade
    // (diferença só de arredondamento do rateio), provando que o fixo não foi descontado duas vezes.
    expect(Math.abs(month.result - b.result! * 50)).toBeLessThanOrEqual(50);
    expect(month.fixedMonthly).toBe(50000);
    expect(month.variableCosts).toBe(50 * (b.materials! + b.variable!));
  });
  it("soma vários serviços com quantidades diferentes", () => {
    const data = scenario();
    const b = computeService(data.services[0], data);
    const m = projectMonth([{ breakdown: b, qty: 10 }, { breakdown: b, qty: 5 }], 50000, data.settings)!;
    expect(m.qty).toBe(15);
    expect(m.revenue).toBe(15 * b.salePrice!);
  });
  it("recusa quantidade fracionada ou negativa", () => {
    const data = scenario();
    const b = computeService(data.services[0], data);
    expect(projectMonth([{ breakdown: b, qty: 2.5 }], 0, noRates)).toBeNull();
    expect(projectMonth([{ breakdown: b, qty: -1 }], 0, noRates)).toBeNull();
  });
});

describe("serviço completo", () => {
  it("discrimina o custo base por categoria", () => {
    const data = scenario();
    const b = computeService(data.services[0], data);
    expect(b.issues).toEqual([]);
    expect(b.materials).toBe(200 + 1080);
    expect(b.variable).toBe(300);
    expect(b.fixedShare).toBe(1000);
    expect(b.time).toBe(6000);
    expect(b.base).toBe(8580);
    expect(b.suggested).toBe(ceilCents(8580 / 0.75));
    expect(b.margin!).toBeGreaterThanOrEqual(20);
  });
  it("preço escolhido abaixo do mínimo é sinalizado, não bloqueado", () => {
    const data = scenario();
    data.services[0].chosenPriceCents = 5000;
    const b = computeService(data.services[0], data);
    expect(b.salePrice).toBe(5000);
    expect(b.belowMinimum).toBe(true);
    expect(b.result).toBeLessThan(0);
  });
});

describe("11. comparação de serviços", () => {
  it("calcula resultado por hora e não divide por zero", () => {
    const data = scenario();
    const s = data.services[0];
    const row = compareRow(s, computeService(s, data), data.settings);
    expect(row.resultPerHour).toBe(roundCents(row.result! / 2));
    expect(row.totalCost! + row.result!).toBe(row.price);
    const zero = { ...s, minutes: 0 };
    expect(compareRow(zero, computeService(zero, data), data.settings).resultPerHour).toBeNull();
  });
});

describe("12. salvamento e recuperação", () => {
  it("salva e recupera os mesmos dados", () => {
    const store = memoryStore();
    const data = scenario();
    expect(saveData("aluna@email.com", data, store)).toBe(true);
    expect(loadData("aluna@email.com", store)).toEqual(data);
  });
  it("backup exportado pode ser importado de volta", () => {
    const data = scenario();
    expect(importBackup(exportBackup(data))).toEqual(data);
    expect(() => importBackup("{}")).toThrow();
    expect(() => importBackup("não é json")).toThrow();
  });
  it("dado corrompido volta para o estado inicial sem quebrar", () => {
    const store = memoryStore();
    store.setItem("bellash_precificacao_v1:aluna@email.com", "{quebrado");
    expect(loadData("aluna@email.com", store).services).toHaveLength(5);
  });
});

describe("13. relatório para PDF", () => {
  it("traz os valores do serviço calculado", () => {
    const data = scenario();
    const r = buildReport(data.services[0], data, new Date("2026-10-12T12:00:00Z"));
    expect(r.serviceName).toBe("Clássica");
    expect(r.materials).toHaveLength(2);
    expect(r.base).toBe(8580);
    expect(r.suggested).toBe(r.salePrice);
    expect(r.feesAtSale).toBe(feesAt(r.salePrice!, data.settings).total);
    expect(r.issues).toEqual([]);
  });
});

describe("14. valores zerados ou inválidos", () => {
  it("dados iniciais não geram preço (nada é inventado)", () => {
    const data = createInitialData();
    const b = computeService(data.services[0], data);
    expect(b.suggested).toBeNull();
    expect(b.issues.length).toBeGreaterThan(0);
  });
  it("material sem embalagem preenchida bloqueia o preço", () => {
    const data = scenario();
    data.materials[0].packageQty = 0;
    expect(computeService(data.services[0], data).suggested).toBeNull();
  });
  it("lê números no formato brasileiro", () => {
    expect(parseDecimal("1.250,50")).toBe(1250.5);
    expect(parseDecimal("25,9")).toBe(25.9);
    expect(parseDecimal("1.250")).toBe(1250);
    expect(parseDecimal("")).toBeNull();
    expect(parseDecimal("abc")).toBeNaN();
    expect(parseCents("0,1")).toBe(10);
    expect(parseCents("19,99")).toBe(1999);
  });
});

describe("15. separação de dados entre usuárias", () => {
  it("cada e-mail tem os próprios dados", () => {
    const store = memoryStore();
    const a = scenario();
    saveData("ana@email.com", a, store);
    const b = loadData("bia@email.com", store);
    expect(b).not.toEqual(a);
    expect(b.services[0].minutes).toBeNull();
    expect(loadData("ANA@email.com ", store)).toEqual(a); // mesmo e-mail, maiúsculas/espaços
  });
});
