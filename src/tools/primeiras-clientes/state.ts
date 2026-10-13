/* Pack Primeiras Clientes: variáveis, WhatsApp, progresso, validação e salvamento local.
   Nada de nomes/telefones de clientes é salvo: variáveis de cada mensagem ficam só na tela. */

import { categories, type CategoryId, library, limits, plan } from "./content";

export const STORAGE_KEY = "bellash_primeiras_clientes_v1";
export const EXPORT_FILE_NAME = "bellash_primeiras_clientes_backup.json";

export type Profile = {
  professionalName: string;
  studioName: string;
  instagram: string;
  whatsapp: string;
  city: string;
  /** Um serviço por linha. */
  services: string;
  bookingLink: string;
};

export type CustomMessage = { id: string; title: string; category: CategoryId; text: string; createdAt: string; updatedAt: string };

export type PackState = {
  version: 1;
  profile: Profile;
  /** IDs favoritos (msg_XX da biblioteca ou de mensagens próprias). */
  favorites: string[];
  customMessages: CustomMessage[];
  /** Versões personalizadas das mensagens da biblioteca (o original nunca é alterado). */
  versions: Record<string, { text: string; updatedAt: string }>;
  plan: { completed: number[]; notes: Record<string, string>; startDate: string | null };
  updatedAt: string;
};

export const emptyProfile = (): Profile => ({ professionalName: "", studioName: "", instagram: "", whatsapp: "", city: "", services: "", bookingLink: "" });

export function createEmptyState(now = new Date().toISOString()): PackState {
  return { version: 1, profile: emptyProfile(), favorites: [], customMessages: [], versions: {}, plan: { completed: [], notes: {}, startDate: null }, updatedAt: now };
}

export function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/* -------------------------------------------------------------------------- */
/* Variáveis                                                                  */
/* -------------------------------------------------------------------------- */

/** Vêm do perfil (salvo). */
export const PROFILE_TOKENS = {
  "[NOME_PROFISSIONAL]": { label: "Nome profissional", key: "professionalName" },
  "[NOME_ESTUDIO]": { label: "Nome do estúdio", key: "studioName" },
  "[INSTAGRAM]": { label: "Instagram profissional", key: "instagram" },
  "[WHATSAPP]": { label: "WhatsApp comercial", key: "whatsapp" },
  "[CIDADE]": { label: "Cidade de atuação", key: "city" },
  "[LINK_AGENDAMENTO]": { label: "Link de agendamento", key: "bookingLink" },
} as const;

/** Preenchidas a cada mensagem e NUNCA salvas. */
export const MESSAGE_TOKENS = {
  "[NOME_CLIENTE]": "Nome da destinatária",
  "[SERVICO]": "Serviço",
  "[DATA]": "Data",
  "[HORARIO]": "Horário",
  "[VALOR]": "Valor",
  "[INFORMACOES_ADICIONAIS]": "Informações adicionais",
} as const;

export type ProfileToken = keyof typeof PROFILE_TOKENS;
export type MessageToken = keyof typeof MESSAGE_TOKENS;
export type Token = ProfileToken | MessageToken;
export type MessageValues = Partial<Record<MessageToken, string>>;

const TOKEN_RE = /\[(NOME_PROFISSIONAL|NOME_ESTUDIO|INSTAGRAM|WHATSAPP|CIDADE|LINK_AGENDAMENTO|NOME_CLIENTE|SERVICO|DATA|HORARIO|VALOR|INFORMACOES_ADICIONAIS)\]/g;
export const isProfileToken = (t: Token): t is ProfileToken => t in PROFILE_TOKENS;
export const tokenLabel = (t: Token) => (isProfileToken(t) ? PROFILE_TOKENS[t].label : MESSAGE_TOKENS[t]);

export function tokensIn(text: string): Token[] {
  return [...new Set(text.match(TOKEN_RE) ?? [])] as Token[];
}

export const profileServices = (p: Profile) => p.services.split("\n").map((s) => s.trim()).filter(Boolean);

export function normalizeInstagram(value: string) {
  const v = value.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/\/.*$/, "").replace(/^@+/, "");
  return v ? `@${v}` : "";
}

/** "2026-10-15" → "15/10/2026" */
export function formatDate(value: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  return m ? `${m[3]}/${m[2]}/${m[1]}` : value.trim();
}

/** "14:00" → "14h", "14:30" → "14h30" */
export function formatTime(value: string) {
  const m = /^(\d{2}):(\d{2})$/.exec(value.trim());
  return m ? `${Number(m[1])}h${m[2] === "00" ? "" : m[2]}` : value.trim();
}

/** "120" ou "120,5" → "R$ 120,00" / "R$ 120,50"; texto livre fica como está. */
export function formatValue(value: string) {
  const t = value.trim();
  const n = /^(R\$\s*)?\d{1,3}(\.?\d{3})*(,\d{1,2})?$|^(R\$\s*)?\d+([.,]\d{1,2})?$/.test(t)
    ? Number(t.replace(/R\$\s*/, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."))
    : NaN;
  return Number.isFinite(n) ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }).replace(/ /g, " ") : t;
}

export function tokenValues(profile: Profile, values: MessageValues): Record<Token, string> {
  return {
    "[NOME_PROFISSIONAL]": profile.professionalName.trim(),
    "[NOME_ESTUDIO]": profile.studioName.trim(),
    "[INSTAGRAM]": normalizeInstagram(profile.instagram),
    "[WHATSAPP]": profile.whatsapp.trim(),
    "[CIDADE]": profile.city.trim(),
    "[LINK_AGENDAMENTO]": profile.bookingLink.trim(),
    "[NOME_CLIENTE]": (values["[NOME_CLIENTE]"] ?? "").trim(),
    "[SERVICO]": (values["[SERVICO]"] ?? "").trim(),
    "[DATA]": formatDate(values["[DATA]"] ?? ""),
    "[HORARIO]": formatTime(values["[HORARIO]"] ?? ""),
    "[VALOR]": formatValue(values["[VALOR]"] ?? ""),
    "[INFORMACOES_ADICIONAIS]": (values["[INFORMACOES_ADICIONAIS]"] ?? "").trim(),
  };
}

/** Texto final: variáveis preenchidas trocadas; as vazias continuam marcadas (para bloquear a cópia). */
export function resolveText(text: string, values: Record<Token, string>) {
  return text.replace(TOKEN_RE, (t) => values[t as Token] || t);
}

export function unresolved(text: string, values: Record<Token, string>): Token[] {
  return tokensIn(text).filter((t) => !values[t]);
}

/**
 * Remove o trecho que depende de uma variável:
 * - "Oi, [NOME_CLIENTE]!" → "Oi!" (vocativo)
 * - senão, remove a frase inteira que contém a variável.
 */
export function removeToken(text: string, token: Token) {
  const esc = token.replace(/[[\]]/g, "\\$&");
  let out = text.replace(new RegExp(`,\\s*${esc}(?=\\s*[!?.,])`, "g"), "");
  out = out
    .split("\n")
    .map((line) => {
      if (!line.includes(token)) return line;
      const sentences = line.match(/[^.!?…]+[.!?…]+[^\S\n]*(?:\p{Extended_Pictographic}️?\s*)*|[^.!?…]+$/gu) ?? [line];
      return sentences.filter((s) => !s.includes(token)).join("").trim();
    })
    .join("\n");
  return out.replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

/* -------------------------------------------------------------------------- */
/* WhatsApp                                                                   */
/* -------------------------------------------------------------------------- */

export type PhoneCheck = { ok: true; digits: string } | { ok: false; error: string };

/** Número no formato internacional (código do país + DDD + número), ex.: +55 11 98765-4321. */
export function checkPhone(input: string): PhoneCheck {
  const raw = input.trim();
  if (!/^\+?[\d\s().-]+$/.test(raw)) return { ok: false, error: "Use só números (ex.: +55 11 98765-4321)." };
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) return { ok: false, error: "Inclua o código do país: 55 para o Brasil (ex.: +55 11 98765-4321)." };
  if (digits.length < 8 || digits.length > 15 || digits.startsWith("0")) return { ok: false, error: "Número inválido. Use o formato internacional: +55 11 98765-4321." };
  if (digits.startsWith("55") && !(digits.length === 12 || digits.length === 13)) return { ok: false, error: "Número brasileiro deve ter DDD + 8 ou 9 dígitos." };
  return { ok: true, digits };
}

/** Link que abre o WhatsApp com o texto preparado; a pessoa escolhe a conversa e envia manualmente. */
export function whatsappUrl(text: string, phoneDigits?: string) {
  const phone = phoneDigits ? `phone=${phoneDigits}&` : "";
  return `https://api.whatsapp.com/send?${phone}text=${encodeURIComponent(text)}`;
}

/* -------------------------------------------------------------------------- */
/* Mensagens (biblioteca + próprias)                                          */
/* -------------------------------------------------------------------------- */

export type AnyMessage = { id: string; title: string; category: CategoryId; text: string; custom: boolean; purpose?: string; guidance?: string };

export function allMessages(state: PackState): AnyMessage[] {
  return [
    ...library.map((m) => ({ ...m, text: state.versions[m.id]?.text ?? m.text, custom: false })),
    ...state.customMessages.map((m) => ({ ...m, custom: true })),
  ];
}

export type Filter = "todas" | "favoritas" | "minhas";

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function searchMessages(state: PackState, query: string, filter: Filter, category: CategoryId | "") {
  const q = fold(query.trim());
  return allMessages(state).filter((m) => {
    if (filter === "favoritas" && !state.favorites.includes(m.id)) return false;
    if (filter === "minhas" && !m.custom) return false;
    if (category && m.category !== category) return false;
    if (!q) return true;
    const label = categories.find((c) => c.id === m.category)?.label ?? "";
    return fold(`${m.title} ${m.text} ${label}`).includes(q);
  });
}

const touch = (s: PackState, now: string): PackState => ({ ...s, updatedAt: now });

export function toggleFavorite(s: PackState, id: string, now = new Date().toISOString()) {
  return touch({ ...s, favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [...s.favorites, id] }, now);
}

export const cleanText = (t: string, max: number) => t.trim().slice(0, max);

/** Salva uma versão personalizada de uma mensagem da biblioteca (com variáveis, sem dados de clientes). */
export function saveVersion(s: PackState, id: string, text: string, now = new Date().toISOString()) {
  const clean = cleanText(text, limits.messageText);
  if (!clean || !library.some((m) => m.id === id)) return s;
  const original = library.find((m) => m.id === id)!.text;
  const versions = { ...s.versions };
  if (clean === original) delete versions[id];
  else versions[id] = { text: clean, updatedAt: now };
  return touch({ ...s, versions }, now);
}

export function restoreOriginal(s: PackState, id: string, now = new Date().toISOString()) {
  const versions = { ...s.versions };
  delete versions[id];
  return touch({ ...s, versions }, now);
}

export function createCustom(s: PackState, input: { title: string; category: CategoryId; text: string }, now = new Date().toISOString()): { state: PackState; id: string | null } {
  const title = cleanText(input.title, limits.title);
  const text = cleanText(input.text, limits.messageText);
  if (!title || !text || s.customMessages.length >= limits.customMessages) return { state: s, id: null };
  const msg: CustomMessage = { id: `custom_${uid()}`, title, category: input.category, text, createdAt: now, updatedAt: now };
  return { state: touch({ ...s, customMessages: [...s.customMessages, msg] }, now), id: msg.id };
}

export function updateCustom(s: PackState, id: string, input: { title: string; category: CategoryId; text: string }, now = new Date().toISOString()) {
  const title = cleanText(input.title, limits.title);
  const text = cleanText(input.text, limits.messageText);
  if (!title || !text) return s;
  return touch({ ...s, customMessages: s.customMessages.map((m) => (m.id === id ? { ...m, title, category: input.category, text, updatedAt: now } : m)) }, now);
}

export function deleteCustom(s: PackState, id: string, now = new Date().toISOString()) {
  return touch({ ...s, customMessages: s.customMessages.filter((m) => m.id !== id), favorites: s.favorites.filter((f) => f !== id) }, now);
}

/* -------------------------------------------------------------------------- */
/* Planejamento de 30 dias                                                    */
/* -------------------------------------------------------------------------- */

export const TOTAL_DAYS = plan.length;

/** progresso = atividades_concluidas / 30 × 100, arredondado. */
export function planProgress(s: PackState) {
  const done = s.plan.completed.filter((d) => d >= 1 && d <= TOTAL_DAYS).length;
  return { done, total: TOTAL_DAYS, percent: Math.round((done / TOTAL_DAYS) * 100) };
}

export function toggleDay(s: PackState, day: number, now = new Date().toISOString()) {
  if (day < 1 || day > TOTAL_DAYS) return s;
  const completed = s.plan.completed.includes(day) ? s.plan.completed.filter((d) => d !== day) : [...s.plan.completed, day].sort((a, b) => a - b);
  return touch({ ...s, plan: { ...s.plan, completed } }, now);
}

export function setDayNote(s: PackState, day: number, note: string, now = new Date().toISOString()) {
  const notes = { ...s.plan.notes };
  const clean = note.slice(0, limits.note);
  if (clean.trim()) notes[day] = clean;
  else delete notes[day];
  return touch({ ...s, plan: { ...s.plan, notes } }, now);
}

export function setStartDate(s: PackState, date: string | null, now = new Date().toISOString()) {
  return touch({ ...s, plan: { ...s.plan, startDate: date && isValidDate(date) ? date : null } }, now);
}

export function resetPlan(s: PackState, now = new Date().toISOString()) {
  return touch({ ...s, plan: { completed: [], notes: {}, startDate: s.plan.startDate } }, now);
}

export function isValidDate(value: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return false;
  const [y, mo, d] = m.slice(1).map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return y >= 2000 && y <= 2100 && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

/** Data sugerida para o dia N, a partir da data inicial (opcional). */
export function dateForDay(startDate: string | null, day: number) {
  if (!startDate || !isValidDate(startDate)) return null;
  const [y, m, d] = startDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + day - 1));
  return dt.toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit" });
}

/* -------------------------------------------------------------------------- */
/* Validação, salvamento e backup                                             */
/* -------------------------------------------------------------------------- */

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
const isDateTime = (v: unknown): v is string => typeof v === "string" && v.length <= 40 && !Number.isNaN(Date.parse(v));
const CATEGORY_IDS = new Set(categories.map((c) => c.id));
const LIBRARY_IDS = new Set(library.map((m) => m.id));

/** Valida dados salvos ou importados. Itens inválidos são descartados; estrutura irreconhecível → null. */
export function parseState(input: unknown, now = new Date().toISOString()): PackState | null {
  if (!isObj(input) || input.version !== 1) return null;
  const p = isObj(input.profile) ? input.profile : {};
  const profile: Profile = {
    professionalName: str(p.professionalName, 80),
    studioName: str(p.studioName, 80),
    instagram: str(p.instagram, 80),
    whatsapp: str(p.whatsapp, 40),
    city: str(p.city, 60),
    services: str(p.services, 1000),
    bookingLink: str(p.bookingLink, 200),
  };

  const customMessages: CustomMessage[] = [];
  for (const c of Array.isArray(input.customMessages) ? input.customMessages : []) {
    if (!isObj(c) || typeof c.id !== "string" || !/^custom_[A-Za-z0-9-]{1,64}$/.test(c.id) || customMessages.length >= limits.customMessages) continue;
    const title = cleanText(str(c.title, limits.title), limits.title);
    const text = cleanText(str(c.text, limits.messageText), limits.messageText);
    if (!title || !text || customMessages.some((x) => x.id === c.id)) continue;
    customMessages.push({
      id: c.id,
      title,
      text,
      category: CATEGORY_IDS.has(c.category as CategoryId) ? (c.category as CategoryId) : "apresentacao",
      createdAt: isDateTime(c.createdAt) ? c.createdAt : now,
      updatedAt: isDateTime(c.updatedAt) ? c.updatedAt : now,
    });
  }
  const customIds = new Set(customMessages.map((c) => c.id));

  const versions: PackState["versions"] = {};
  if (isObj(input.versions)) {
    for (const [id, v] of Object.entries(input.versions)) {
      if (!LIBRARY_IDS.has(id) || !isObj(v)) continue;
      const text = cleanText(str(v.text, limits.messageText), limits.messageText);
      if (text) versions[id] = { text, updatedAt: isDateTime(v.updatedAt) ? v.updatedAt : now };
    }
  }

  const favorites = Array.isArray(input.favorites)
    ? [...new Set(input.favorites.filter((f): f is string => typeof f === "string" && (LIBRARY_IDS.has(f) || customIds.has(f))))]
    : [];

  const planIn = isObj(input.plan) ? input.plan : {};
  const completed = Array.isArray(planIn.completed)
    ? [...new Set(planIn.completed.filter((d): d is number => Number.isInteger(d) && (d as number) >= 1 && (d as number) <= TOTAL_DAYS))].sort((a, b) => a - b)
    : [];
  const notes: Record<string, string> = {};
  if (isObj(planIn.notes)) {
    for (const [k, v] of Object.entries(planIn.notes)) {
      const day = Number(k);
      if (Number.isInteger(day) && day >= 1 && day <= TOTAL_DAYS && typeof v === "string" && v.trim()) notes[day] = v.slice(0, limits.note);
    }
  }
  const startDate = typeof planIn.startDate === "string" && isValidDate(planIn.startDate) ? planIn.startDate : null;

  return { version: 1, profile, favorites, customMessages, versions, plan: { completed, notes, startDate }, updatedAt: isDateTime(input.updatedAt) ? input.updatedAt : now };
}

export type KeyValueStore = Pick<Storage, "getItem" | "setItem">;

export function browserStore(): KeyValueStore | null {
  try {
    const s = window.localStorage;
    s.setItem("__bellash_probe__", "1");
    s.removeItem("__bellash_probe__");
    return s;
  } catch {
    return null;
  }
}

export function loadState(store: KeyValueStore | null): { state: PackState; status: "ok" | "empty" | "corrupt" | "unavailable" } {
  if (!store) return { state: createEmptyState(), status: "unavailable" };
  let raw: string | null;
  try {
    raw = store.getItem(STORAGE_KEY);
  } catch {
    return { state: createEmptyState(), status: "unavailable" };
  }
  if (raw === null) return { state: createEmptyState(), status: "empty" };
  try {
    const parsed = parseState(JSON.parse(raw));
    if (parsed) return { state: parsed, status: "ok" };
  } catch {
    /* JSON inválido */
  }
  try {
    store.setItem(`${STORAGE_KEY}_ilegivel`, raw);
  } catch {
    /* sem espaço */
  }
  return { state: createEmptyState(), status: "corrupt" };
}

export function saveState(store: KeyValueStore | null, state: PackState) {
  if (!store) return false;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function exportState(state: PackState, now = new Date().toISOString()) {
  return JSON.stringify({ app: "bellash_primeiras_clientes", exportedAt: now, ...state }, null, 2);
}

export class ImportError extends Error {}

export function importState(text: string, size = new Blob([text]).size): PackState {
  if (size > limits.importBytes) throw new ImportError("O arquivo é grande demais para ser um backup do Pack Primeiras Clientes.");
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ImportError("Este arquivo não é um backup do Pack Primeiras Clientes.");
  }
  if (!isObj(data) || data.app !== "bellash_primeiras_clientes") throw new ImportError("Este arquivo não é um backup do Pack Primeiras Clientes.");
  if (typeof data.version === "number" && data.version > 1) throw new ImportError("Este backup foi feito em uma versão mais nova da ferramenta.");
  const state = parseState(data);
  if (!state) throw new ImportError("O backup está danificado ou incompleto.");
  return state;
}
