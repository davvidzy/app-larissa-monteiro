const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatPrice(value: number) {
  return brl.format(Number.isFinite(value) ? value : 0);
}

/** Converte o texto digitado ("1.250,50", "25,9", "40") em número. Vazio ou inválido = 0. */
export function parseNumber(text: string) {
  const normalized = text.replace(/\s|R\$/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) ? value : 0;
}
