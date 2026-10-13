import type { Material, NamedCost, PricingData, Service } from "./types";

/** Identificador único (randomUUID só existe em https/localhost; o fallback cobre o resto). */
export function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const nowIso = () => new Date().toISOString();

export function newMaterial(name = "Novo material", unit = "un"): Material {
  return { id: uid(), name, packagePriceCents: null, packageQty: null, unit, wastePct: 0 };
}

export function newCost(name: string): NamedCost {
  return { id: uid(), name, cents: null };
}

export function newService(name = "Novo serviço"): Service {
  const now = nowIso();
  return {
    id: uid(),
    name,
    minutes: null,
    materials: [],
    extraCosts: [],
    marginPct: null,
    chosenPriceCents: null,
    createdAt: now,
    updatedAt: now,
  };
}

/** Ponto de partida: só nomes. Nenhum preço ou valor é pré-preenchido. */
export function createInitialData(): PricingData {
  return {
    version: 1,
    materials: [
      newMaterial("Fios para extensão", "un"),
      newMaterial("Adesivo para extensões", "mL"),
      newMaterial("Pads", "un"),
      newMaterial("Fita micropore", "un"),
      newMaterial("Escovinhas descartáveis", "un"),
      newMaterial("Microbrush", "un"),
      newMaterial("Produtos de higienização", "mL"),
      newMaterial("Outros consumíveis", "un"),
    ],
    expenses: [
      newCost("Aluguel"),
      newCost("Energia"),
      newCost("Água"),
      newCost("Internet"),
      newCost("Limpeza"),
      newCost("Sistemas e ferramentas"),
      newCost("Outras despesas fixas"),
    ],
    services: [
      newService("Extensão clássica"),
      newService("Volume brasileiro"),
      newService("Volume híbrido"),
      newService("Manutenção de extensão"),
      newService("Remoção"),
    ],
    settings: {
      appointmentsPerMonth: null,
      hourRateCents: null,
      paymentFeePct: 0,
      paymentFeeFixedCents: 0,
      taxPct: 0,
    },
    updatedAt: nowIso(),
  };
}
