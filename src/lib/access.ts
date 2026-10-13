import { access } from "../config/portal";

/** Formato básico de e-mail (algo@dominio.ext). Não confere se a pessoa comprou. */
export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/* localStorage pode falhar (aba anônima, cookies bloqueados): nesse caso o
   acesso vale só enquanto a página estiver aberta. */

export function readAccess(): string | null {
  try {
    return localStorage.getItem(access.storageKey);
  } catch {
    return null;
  }
}

export function saveAccess(email: string) {
  try {
    localStorage.setItem(access.storageKey, email.trim().toLowerCase());
  } catch {
    /* segue sem salvar */
  }
}

export function clearAccess() {
  try {
    localStorage.removeItem(access.storageKey);
  } catch {
    /* nada a limpar */
  }
}
