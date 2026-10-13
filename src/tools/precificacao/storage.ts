/* Salvamento da calculadora.
   O portal não tem servidor nem login: os dados ficam no navegador, separados pelo
   e-mail de acesso, e a usuária pode baixar/restaurar um arquivo de backup para
   não perder nada ao trocar de aparelho ou limpar o navegador. */

import { createInitialData } from "./defaults";
import type { PricingData } from "./types";

const KEY_PREFIX = "bellash_precificacao_v1:";

/** Interface mínima de armazenamento (localStorage no navegador, memória nos testes). */
export type KeyValueStore = Pick<Storage, "getItem" | "setItem">;

export function storageKey(email: string) {
  return KEY_PREFIX + email.trim().toLowerCase();
}

function defaultStore(): KeyValueStore | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Confere se um objeto tem o formato dos dados da calculadora (backup ou salvo). */
export function isPricingData(value: unknown): value is PricingData {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    v.version === 1 &&
    Array.isArray(v.materials) &&
    Array.isArray(v.expenses) &&
    Array.isArray(v.services) &&
    !!v.settings &&
    typeof v.settings === "object"
  );
}

export function loadData(email: string, store: KeyValueStore | null = defaultStore()): PricingData {
  try {
    const raw = store?.getItem(storageKey(email));
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isPricingData(parsed)) return parsed;
    }
  } catch {
    /* dado corrompido ou armazenamento bloqueado: começa do zero */
  }
  return createInitialData();
}

/** Salva os dados. Retorna false se o navegador não permitir (aba anônima, cota cheia). */
export function saveData(email: string, data: PricingData, store: KeyValueStore | null = defaultStore()) {
  try {
    if (!store) return false;
    store.setItem(storageKey(email), JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function exportBackup(data: PricingData) {
  return JSON.stringify(data, null, 2);
}

/** Lê um arquivo de backup. Lança erro com mensagem amigável se o arquivo não servir. */
export function importBackup(text: string): PricingData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Este arquivo não é um backup da calculadora.");
  }
  if (!isPricingData(parsed)) throw new Error("Este arquivo não é um backup da calculadora.");
  return parsed;
}
