import type { Cents } from "./types";

/* Regras de arredondamento (iguais em toda a ferramenta):
   - Custos e valores intermediários: arredondamento comercial (meio centavo para cima).
   - Preços calculados (mínimo e sugerido): sempre para CIMA, para nunca ficar abaixo do necessário. */

// Tolerância para ruído de ponto flutuante (ex.: 10666.000000001 não deve virar 10667)
const EPS = 1e-7;

/** Arredonda para o centavo mais próximo (0,5 sobe; simétrico para negativos). */
export function roundCents(value: number): Cents {
  const rounded = Math.sign(value) * Math.round(Math.abs(value) + EPS);
  return rounded === 0 ? 0 : rounded; // evita -0
}

/** Arredonda para cima até o próximo centavo inteiro. */
export function ceilCents(value: number): Cents {
  return Math.ceil(value - EPS);
}

/** Aplica um percentual a um valor em centavos, arredondando para o centavo. */
export function percentOf(cents: Cents, pct: number): Cents {
  return roundCents((cents * pct) / 100);
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatBRL(cents: Cents) {
  return brl.format(cents / 100);
}

const brlPrecise = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 4 });

/** Para custos unitários pequenos (ex.: R$ 0,0035 por fio), mostra até 4 casas. */
export function formatBRLPrecise(cents: number) {
  return brlPrecise.format(cents / 100);
}

export function formatPct(value: number, digits = 1) {
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: digits })}%`;
}

export function formatNumber(value: number, digits = 2) {
  return value.toLocaleString("pt-BR", { maximumFractionDigits: digits });
}

/**
 * Lê um número digitado no jeito brasileiro: "25,90", "1.250,50", "1250.5", "40".
 * Vazio → null. Texto inválido → NaN.
 */
export function parseDecimal(text: string): number | null {
  let t = text.replace(/R\$|\s|%/g, "");
  if (t === "") return null;
  if (t.includes(",")) {
    t = t.replace(/\./g, "").replace(",", ".");
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) {
    t = t.replace(/\./g, ""); // "1.250" = mil duzentos e cinquenta
  }
  if (!/^-?\d*\.?\d+$|^-?\d+\.$/.test(t)) return NaN;
  return Number(t);
}

/** Texto digitado em reais → centavos inteiros (null = vazio, NaN = inválido). */
export function parseCents(text: string): Cents | null {
  const value = parseDecimal(text);
  if (value === null || Number.isNaN(value)) return value;
  return roundCents(value * 100);
}

/** Centavos → texto para editar no campo ("25,90"). */
export function centsToInput(cents: Cents | null) {
  if (cents === null) return "";
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false });
}

export function numberToInput(value: number | null) {
  if (value === null) return "";
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 4, useGrouping: false });
}
