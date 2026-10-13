/* Estado do Checklist da Lash Iniciante: estrutura, progresso, recomendações,
   ações, validação/migração e salvamento local. Sem interface (testável). */

import { limits, recommendations, stages } from "./content";

export const STORAGE_KEY = "bellash_checklist_v1";
export const CURRENT_VERSION = 1;

export type CustomTask = {
  id: string;
  stageId: number;
  text: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Note = { id: string; text: string; createdAt: string; updatedAt: string };

export type ChecklistState = {
  version: 1;
  /** IDs das tarefas FIXAS concluídas. */
  completedTaskIds: string[];
  /** Data da última alteração de cada tarefa fixa (marcar ou desmarcar). */
  taskUpdatedAt: Record<string, string>;
  customTasks: CustomTask[];
  /** Anotações por etapa (chave = número da etapa). */
  notes: Record<string, Note[]>;
  lastVisitedStage: number;
  updatedAt: string;
};

const fixedTaskIds = new Set(stages.flatMap((s) => s.tasks.map((t) => t.id)));
const stageIds = new Set(stages.map((s) => s.id));

export function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyState(now = new Date().toISOString()): ChecklistState {
  return { version: 1, completedTaskIds: [], taskUpdatedAt: {}, customTasks: [], notes: {}, lastVisitedStage: 1, updatedAt: now };
}

/* -------------------------------------------------------------------------- */
/* Progresso                                                                  */
/* -------------------------------------------------------------------------- */

export type Progress = { done: number; total: number; percent: number };

const toProgress = (done: number, total: number): Progress => ({
  done,
  total,
  percent: total > 0 ? Math.round((done / total) * 100) : 0,
});

/** progresso_etapa = concluídas_etapa / total_etapa × 100 (fixas + personalizadas ativas). */
export function stageProgress(state: ChecklistState, stageId: number): Progress {
  const stage = stages.find((s) => s.id === stageId);
  const fixed = stage?.tasks ?? [];
  const custom = state.customTasks.filter((t) => t.stageId === stageId);
  const done = fixed.filter((t) => state.completedTaskIds.includes(t.id)).length + custom.filter((t) => t.completed).length;
  return toProgress(done, fixed.length + custom.length);
}

/** progresso_geral = total concluídas / total existentes × 100 (não é a média das etapas). */
export function overallProgress(state: ChecklistState): Progress {
  const total = fixedTaskIds.size + state.customTasks.length;
  const done = state.completedTaskIds.filter((id) => fixedTaskIds.has(id)).length + state.customTasks.filter((t) => t.completed).length;
  return toProgress(done, total);
}

export const isStageComplete = (state: ChecklistState, stageId: number) => {
  const p = stageProgress(state, stageId);
  return p.total > 0 && p.done === p.total;
};

/** Recomendação por regras fixas, seguindo a ordem das etapas. */
export function recommendation(state: ChecklistState): string {
  const overall = overallProgress(state);
  if (overall.total > 0 && overall.done === overall.total) return recommendations.allDone;
  if (overall.done === 0) return recommendations.start;
  const firstIncomplete = stages.find((s) => !isStageComplete(state, s.id))!;
  if (firstIncomplete.id === stages[0].id) return recommendations.continueFirst;
  return recommendations.afterStage[firstIncomplete.id - 1] ?? recommendations.continueFirst;
}

/* -------------------------------------------------------------------------- */
/* Ações (sempre retornam um estado novo)                                     */
/* -------------------------------------------------------------------------- */

const touch = (state: ChecklistState, now: string): ChecklistState => ({ ...state, updatedAt: now });

export function toggleFixedTask(state: ChecklistState, taskId: string, now = new Date().toISOString()): ChecklistState {
  if (!fixedTaskIds.has(taskId)) return state;
  const done = state.completedTaskIds.includes(taskId);
  return touch(
    {
      ...state,
      completedTaskIds: done ? state.completedTaskIds.filter((id) => id !== taskId) : [...state.completedTaskIds, taskId],
      taskUpdatedAt: { ...state.taskUpdatedAt, [taskId]: now },
    },
    now,
  );
}

/** Normaliza o texto digitado: sem espaços nas pontas e dentro do limite. Vazio = null. */
export function cleanText(text: string, max: number) {
  const clean = text.trim().slice(0, max);
  return clean || null;
}

export function addCustomTask(state: ChecklistState, stageId: number, text: string, now = new Date().toISOString()): ChecklistState {
  const clean = cleanText(text, limits.taskText);
  if (!clean || !stageIds.has(stageId)) return state;
  if (state.customTasks.filter((t) => t.stageId === stageId).length >= limits.customTasksPerStage) return state;
  const task: CustomTask = { id: uid(), stageId, text: clean, completed: false, createdAt: now, updatedAt: now };
  return touch({ ...state, customTasks: [...state.customTasks, task] }, now);
}

export function editCustomTask(state: ChecklistState, id: string, text: string, now = new Date().toISOString()): ChecklistState {
  const clean = cleanText(text, limits.taskText);
  if (!clean) return state;
  return touch({ ...state, customTasks: state.customTasks.map((t) => (t.id === id ? { ...t, text: clean, updatedAt: now } : t)) }, now);
}

export function toggleCustomTask(state: ChecklistState, id: string, now = new Date().toISOString()): ChecklistState {
  return touch({ ...state, customTasks: state.customTasks.map((t) => (t.id === id ? { ...t, completed: !t.completed, updatedAt: now } : t)) }, now);
}

export function removeCustomTask(state: ChecklistState, id: string, now = new Date().toISOString()): ChecklistState {
  return touch({ ...state, customTasks: state.customTasks.filter((t) => t.id !== id) }, now);
}

export function addNote(state: ChecklistState, stageId: number, text: string, now = new Date().toISOString()): ChecklistState {
  const clean = cleanText(text, limits.noteText);
  if (!clean || !stageIds.has(stageId)) return state;
  const list = state.notes[stageId] ?? [];
  if (list.length >= limits.notesPerStage) return state;
  return touch({ ...state, notes: { ...state.notes, [stageId]: [...list, { id: uid(), text: clean, createdAt: now, updatedAt: now }] } }, now);
}

export function editNote(state: ChecklistState, stageId: number, id: string, text: string, now = new Date().toISOString()): ChecklistState {
  const clean = cleanText(text, limits.noteText);
  if (!clean) return state;
  const list = (state.notes[stageId] ?? []).map((n) => (n.id === id ? { ...n, text: clean, updatedAt: now } : n));
  return touch({ ...state, notes: { ...state.notes, [stageId]: list } }, now);
}

export function removeNote(state: ChecklistState, stageId: number, id: string, now = new Date().toISOString()): ChecklistState {
  const list = (state.notes[stageId] ?? []).filter((n) => n.id !== id);
  return touch({ ...state, notes: { ...state.notes, [stageId]: list } }, now);
}

export function visitStage(state: ChecklistState, stageId: number): ChecklistState {
  // Não altera updatedAt: trocar de etapa não é uma edição do conteúdo
  return stageIds.has(stageId) && state.lastVisitedStage !== stageId ? { ...state, lastVisitedStage: stageId } : state;
}

/* -------------------------------------------------------------------------- */
/* Validação e migração                                                       */
/* -------------------------------------------------------------------------- */

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string";
const isDate = (v: unknown): v is string => isStr(v) && v.length <= 40 && !Number.isNaN(Date.parse(v));

/**
 * Atualiza dados de versões anteriores para a atual. Hoje só existe a v1;
 * quando o formato mudar, adicione aqui os passos (ex.: `if (v === 1) { …; v = 2 }`).
 */
function migrate(raw: Record<string, unknown>): Record<string, unknown> | null {
  const version = raw.version;
  if (version === CURRENT_VERSION) return raw;
  return null; // versão desconhecida ou mais nova que este portal
}

/**
 * Valida dados vindos do armazenamento ou de um arquivo e devolve um estado limpo.
 * Itens inválidos são descartados individualmente (o resto do progresso é mantido);
 * estrutura irreconhecível retorna null.
 */
export function parseState(input: unknown, now = new Date().toISOString()): ChecklistState | null {
  if (!isObj(input)) return null;
  const raw = migrate(input);
  if (!raw || !Array.isArray(raw.completedTaskIds)) return null;

  // Só IDs de tarefas fixas que ainda existem (tarefas removidas do checklist são descartadas)
  const completedTaskIds = [...new Set(raw.completedTaskIds.filter((id): id is string => isStr(id) && fixedTaskIds.has(id)))];

  const taskUpdatedAt: Record<string, string> = {};
  if (isObj(raw.taskUpdatedAt)) {
    for (const [id, date] of Object.entries(raw.taskUpdatedAt)) if (fixedTaskIds.has(id) && isDate(date)) taskUpdatedAt[id] = date;
  }

  const customTasks: CustomTask[] = [];
  const perStage = new Map<number, number>();
  for (const t of Array.isArray(raw.customTasks) ? raw.customTasks : []) {
    if (!isObj(t) || !isStr(t.id) || t.id.length > 64 || !isStr(t.text) || typeof t.stageId !== "number" || !stageIds.has(t.stageId)) continue;
    const text = cleanText(t.text, limits.taskText);
    const count = perStage.get(t.stageId) ?? 0;
    if (!text || count >= limits.customTasksPerStage || customTasks.some((c) => c.id === t.id)) continue;
    perStage.set(t.stageId, count + 1);
    customTasks.push({
      id: t.id,
      stageId: t.stageId,
      text,
      completed: t.completed === true,
      createdAt: isDate(t.createdAt) ? t.createdAt : now,
      updatedAt: isDate(t.updatedAt) ? t.updatedAt : now,
    });
  }

  const notes: Record<string, Note[]> = {};
  if (isObj(raw.notes)) {
    for (const [key, list] of Object.entries(raw.notes)) {
      if (!stageIds.has(Number(key)) || !Array.isArray(list)) continue;
      const clean: Note[] = [];
      for (const n of list) {
        if (!isObj(n) || !isStr(n.id) || n.id.length > 64 || !isStr(n.text) || clean.length >= limits.notesPerStage) continue;
        const text = cleanText(n.text, limits.noteText);
        if (!text) continue;
        clean.push({ id: n.id, text, createdAt: isDate(n.createdAt) ? n.createdAt : now, updatedAt: isDate(n.updatedAt) ? n.updatedAt : now });
      }
      if (clean.length) notes[String(Number(key))] = clean;
    }
  }

  return {
    version: 1,
    completedTaskIds,
    taskUpdatedAt,
    customTasks,
    notes,
    lastVisitedStage: typeof raw.lastVisitedStage === "number" && stageIds.has(raw.lastVisitedStage) ? raw.lastVisitedStage : 1,
    updatedAt: isDate(raw.updatedAt) ? raw.updatedAt : now,
  };
}

/* -------------------------------------------------------------------------- */
/* Armazenamento local                                                        */
/* -------------------------------------------------------------------------- */

export type KeyValueStore = Pick<Storage, "getItem" | "setItem">;

export function browserStore(): KeyValueStore | null {
  try {
    const store = window.localStorage;
    // Safari em modo privado antigo expõe localStorage mas falha ao gravar
    const probe = "__bellash_probe__";
    store.setItem(probe, "1");
    store.removeItem(probe);
    return store;
  } catch {
    return null;
  }
}

export type LoadResult = {
  state: ChecklistState;
  /** ok = dados recuperados; empty = primeira visita; corrupt = dados ilegíveis; unavailable = navegador bloqueia. */
  status: "ok" | "empty" | "corrupt" | "unavailable";
};

export function loadState(store: KeyValueStore | null): LoadResult {
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
  // Guarda o conteúdo ilegível à parte antes que um novo salvamento o substitua
  try {
    store.setItem(`${STORAGE_KEY}_ilegivel`, raw);
  } catch {
    /* sem espaço: segue */
  }
  return { state: createEmptyState(), status: "corrupt" };
}

/** Salva. Retorna false em falha (sem permissão ou sem espaço). */
export function saveState(store: KeyValueStore | null, state: ChecklistState): boolean {
  if (!store) return false;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/* -------------------------------------------------------------------------- */
/* Exportar / importar                                                        */
/* -------------------------------------------------------------------------- */

export const EXPORT_FILE_NAME = "bellash_checklist_progresso.json";

/** Conteúdo do arquivo de cópia: só dados do checklist (nada de outras ferramentas). */
export function exportState(state: ChecklistState, now = new Date().toISOString()) {
  const { version, completedTaskIds, taskUpdatedAt, customTasks, notes, lastVisitedStage, updatedAt } = state;
  return JSON.stringify(
    { app: "bellash_checklist", version, exportedAt: now, completedTaskIds, taskUpdatedAt, customTasks, notes, lastVisitedStage, updatedAt },
    null,
    2,
  );
}

export class ImportError extends Error {}

/** Lê o texto de um arquivo de cópia. Só interpreta JSON; nada do arquivo é executado. */
export function importState(text: string, sizeInBytes = new Blob([text]).size): ChecklistState {
  if (sizeInBytes > limits.importBytes) throw new ImportError("O arquivo é grande demais para ser uma cópia do checklist.");
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ImportError("Este arquivo não é uma cópia do checklist.");
  }
  if (isObj(data) && typeof data.version === "number" && data.version > CURRENT_VERSION) {
    throw new ImportError("Esta cópia foi feita em uma versão mais nova do checklist e não pode ser restaurada aqui.");
  }
  const state = parseState(data);
  if (!state) throw new ImportError("Este arquivo não é uma cópia do checklist ou está danificado.");
  return state;
}
