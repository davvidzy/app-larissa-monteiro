/* Estrutura dos dados salvos da Calculadora de Precificação.
   Valores em dinheiro são sempre CENTAVOS INTEIROS (ex.: R$ 25,90 = 2590).
   `null` = campo ainda não preenchido. */

export type Cents = number;

export type Material = {
  id: string;
  name: string;
  /** Preço total da embalagem. */
  packagePriceCents: Cents | null;
  /** Quantidade total na embalagem, na unidade abaixo. */
  packageQty: number | null;
  /** "un", "mL", "g" ou outra unidade digitada. O consumo nos serviços usa a mesma unidade. */
  unit: string;
  /** Desperdício estimado (%), opcional. */
  wastePct: number;
};

export type ServiceMaterial = { materialId: string; qty: number | null };

export type NamedCost = { id: string; name: string; cents: Cents | null };

export type Service = {
  id: string;
  name: string;
  minutes: number | null;
  materials: ServiceMaterial[];
  /** Outros custos por atendimento (lavanderia, transporte…). */
  extraCosts: NamedCost[];
  /** Margem desejada sobre o preço de venda (%). */
  marginPct: number | null;
  /** Preço que a usuária decidiu cobrar. `null` = usar o preço sugerido. */
  chosenPriceCents: Cents | null;
  createdAt: string;
  updatedAt: string;
};

export type Settings = {
  /** Atendimentos previstos no mês (para ratear os custos fixos). */
  appointmentsPerMonth: number | null;
  /** Quanto deseja receber por hora de trabalho. */
  hourRateCents: Cents | null;
  /** Taxa percentual do meio de pagamento (%). */
  paymentFeePct: number;
  /** Taxa fixa por transação. */
  paymentFeeFixedCents: Cents;
  /** Impostos estimados sobre a receita (%), conforme a situação fiscal da usuária. */
  taxPct: number;
};

export type PricingData = {
  version: 1;
  materials: Material[];
  /** Despesas fixas mensais. */
  expenses: NamedCost[];
  services: Service[];
  settings: Settings;
  /** Composição do mês no simulador: quantidade de atendimentos por serviço (id → quantidade). */
  monthMix?: Record<string, number | null>;
  updatedAt: string;
};
