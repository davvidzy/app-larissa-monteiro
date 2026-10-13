import { describe, expect, it } from "vitest";
import { limits, recommendations, stages } from "./content";
import {
  addCustomTask,
  addNote,
  createEmptyState,
  editCustomTask,
  editNote,
  exportState,
  importState,
  ImportError,
  isStageComplete,
  type KeyValueStore,
  loadState,
  overallProgress,
  parseState,
  recommendation,
  removeCustomTask,
  removeNote,
  saveState,
  stageProgress,
  STORAGE_KEY,
  toggleCustomTask,
  toggleFixedTask,
} from "./state";

const TOTAL_FIXED = stages.reduce((n, s) => n + s.tasks.length, 0); // 32

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

function completeStage(state = createEmptyState(), stageId: number) {
  return stages.find((s) => s.id === stageId)!.tasks.reduce((st, t) => toggleFixedTask(st, t.id), state);
}

describe("conteúdo", () => {
  it("tem as 5 etapas com 32 tarefas e IDs estáveis únicos", () => {
    expect(stages.map((s) => s.tasks.length)).toEqual([5, 7, 7, 6, 7]);
    const ids = stages.flatMap((s) => s.tasks.map((t) => t.id));
    expect(new Set(ids).size).toBe(TOTAL_FIXED);
    expect(ids[0]).toBe("etapa1_tarefa1");
  });
});

describe("1 e 2. marcar e desmarcar", () => {
  it("marca, registra a data e desmarca", () => {
    let s = toggleFixedTask(createEmptyState(), "etapa1_tarefa1", "2026-10-12T12:00:00.000Z");
    expect(s.completedTaskIds).toEqual(["etapa1_tarefa1"]);
    expect(s.taskUpdatedAt.etapa1_tarefa1).toBe("2026-10-12T12:00:00.000Z");
    s = toggleFixedTask(s, "etapa1_tarefa1");
    expect(s.completedTaskIds).toEqual([]);
  });
  it("ignora IDs que não existem", () => {
    const s = createEmptyState();
    expect(toggleFixedTask(s, "etapa9_tarefa1")).toBe(s);
  });
});

describe("3. concluir etapa", () => {
  it("etapa 1 completa a 100%", () => {
    const s = completeStage(undefined, 1);
    expect(stageProgress(s, 1)).toEqual({ done: 5, total: 5, percent: 100 });
    expect(isStageComplete(s, 1)).toBe(true);
  });
  it("tarefa personalizada aberta impede a etapa de ficar completa", () => {
    const s = addCustomTask(completeStage(undefined, 1), 1, "Assistir aula extra");
    expect(isStageComplete(s, 1)).toBe(false);
    expect(stageProgress(s, 1).percent).toBe(83);
  });
});

describe("4. progresso geral", () => {
  it("conta tarefas, não a média das etapas", () => {
    const s = completeStage(undefined, 1); // 5 de 32
    expect(overallProgress(s)).toEqual({ done: 5, total: 32, percent: 16 });
    // média simples das etapas daria 20% — o cálculo correto é 16%
  });
  it("inclui personalizadas ativas e ignora excluídas", () => {
    let s = addCustomTask(createEmptyState(), 2, "Tarefa A");
    const id = s.customTasks[0].id;
    s = toggleCustomTask(s, id);
    expect(overallProgress(s)).toEqual({ done: 1, total: 33, percent: 3 });
    s = removeCustomTask(s, id);
    expect(overallProgress(s)).toEqual({ done: 0, total: 32, percent: 0 });
  });
  it("etapa sem tarefas não divide por zero", () => {
    expect(stageProgress(createEmptyState(), 99)).toEqual({ done: 0, total: 0, percent: 0 });
  });
});

describe("5, 6 e 7. tarefas personalizadas", () => {
  it("cria, edita, marca e exclui", () => {
    let s = addCustomTask(createEmptyState(), 3, "  Ler sobre alergias  ");
    expect(s.customTasks[0]).toMatchObject({ stageId: 3, text: "Ler sobre alergias", completed: false });
    const id = s.customTasks[0].id;
    s = editCustomTask(s, id, "Ler sobre reações alérgicas");
    expect(s.customTasks[0].text).toBe("Ler sobre reações alérgicas");
    s = toggleCustomTask(s, id);
    expect(s.customTasks[0].completed).toBe(true);
    s = removeCustomTask(s, id);
    expect(s.customTasks).toEqual([]);
  });
  it("não cria nem salva texto vazio e respeita o limite", () => {
    const s = createEmptyState();
    expect(addCustomTask(s, 1, "   ")).toBe(s);
    const withTask = addCustomTask(s, 1, "x".repeat(500));
    expect(withTask.customTasks[0].text).toHaveLength(limits.taskText);
    expect(editCustomTask(withTask, withTask.customTasks[0].id, "")).toBe(withTask);
  });
});

describe("8. anotações", () => {
  it("cria, edita e exclui por etapa", () => {
    let s = addNote(createEmptyState(), 2, "Comparar preços de pinças");
    const id = s.notes[2][0].id;
    s = editNote(s, 2, id, "Comparar pinças retas e curvas");
    expect(s.notes[2][0].text).toBe("Comparar pinças retas e curvas");
    s = removeNote(s, 2, id);
    expect(s.notes[2]).toEqual([]);
  });
  it("limita o tamanho", () => {
    const s = addNote(createEmptyState(), 1, "a".repeat(5000));
    expect(s.notes[1][0].text).toHaveLength(limits.noteText);
  });
});

describe("9 e 10. recarregar mantendo o progresso", () => {
  it("salva e recupera do armazenamento", () => {
    const store = memoryStore();
    let s = completeStage(undefined, 1);
    s = addCustomTask(s, 2, "Minha tarefa");
    s = addNote(s, 1, "Minha nota");
    s = { ...s, lastVisitedStage: 2 };
    expect(saveState(store, s)).toBe(true);
    const loaded = loadState(store);
    expect(loaded.status).toBe("ok");
    expect(loaded.state).toEqual(s);
  });
  it("primeira visita começa vazia", () => {
    expect(loadState(memoryStore()).status).toBe("empty");
  });
});

describe("11. exportar", () => {
  it("gera JSON só com dados do checklist", () => {
    const s = addNote(completeStage(undefined, 1), 1, "nota");
    const json = JSON.parse(exportState(s, "2026-10-12T12:00:00.000Z"));
    expect(json).toMatchObject({ app: "bellash_checklist", version: 1, exportedAt: "2026-10-12T12:00:00.000Z", lastVisitedStage: 1 });
    expect(json.completedTaskIds).toHaveLength(5);
    expect(Object.keys(json).sort()).toEqual(
      ["app", "completedTaskIds", "customTasks", "exportedAt", "lastVisitedStage", "notes", "taskUpdatedAt", "updatedAt", "version"].sort(),
    );
  });
});

describe("12 e 13. importar", () => {
  it("restaura uma cópia válida", () => {
    const s = addCustomTask(completeStage(undefined, 2), 4, "Visitar um estúdio");
    expect(importState(exportState(s))).toEqual(s);
  });
  it("rejeita arquivos inválidos, incompatíveis ou grandes", () => {
    expect(() => importState("não é json")).toThrow(ImportError);
    expect(() => importState("{}")).toThrow(ImportError);
    expect(() => importState(JSON.stringify({ version: 2, completedTaskIds: [] }))).toThrow(/versão mais nova/);
    expect(() => importState("[]")).toThrow(ImportError);
    expect(() => importState("{}", limits.importBytes + 1)).toThrow(/grande demais/);
  });
  it("descarta itens maliciosos ou malformados e mantém o resto", () => {
    const s = parseState({
      version: 1,
      completedTaskIds: ["etapa1_tarefa1", "<script>alert(1)</script>", 42],
      customTasks: [
        { id: "a", stageId: 1, text: "<img src=x onerror=alert(1)>", completed: true },
        { id: "b", stageId: 99, text: "etapa inexistente" },
        { id: "c", stageId: 2, text: "" },
      ],
      notes: { 1: [{ id: "n", text: "ok" }], 7: [{ id: "x", text: "etapa inexistente" }] },
      lastVisitedStage: 42,
    })!;
    expect(s.completedTaskIds).toEqual(["etapa1_tarefa1"]);
    // Texto fica como texto (o React exibe escapado; nada é executado)
    expect(s.customTasks.map((t) => t.id)).toEqual(["a"]);
    expect(Object.keys(s.notes)).toEqual(["1"]);
    expect(s.lastVisitedStage).toBe(1);
  });
});

describe("14 e 15. substituir e recomeçar", () => {
  it("recomeçar volta ao estado vazio sem tocar outras chaves", () => {
    const store = memoryStore();
    store.setItem("bellash_precificacao_v1:aluna@email.com", "dados da calculadora");
    saveState(store, completeStage(undefined, 1));
    saveState(store, createEmptyState());
    expect(overallProgress(loadState(store).state).done).toBe(0);
    expect(store.getItem("bellash_precificacao_v1:aluna@email.com")).toBe("dados da calculadora");
  });
});

describe("16. armazenamento indisponível", () => {
  it("funciona sem salvar e avisa", () => {
    expect(loadState(null).status).toBe("unavailable");
    expect(saveState(null, createEmptyState())).toBe(false);
    const full: KeyValueStore = { getItem: () => null, setItem: () => { throw new Error("QuotaExceededError"); } };
    expect(saveState(full, createEmptyState())).toBe(false);
  });
  it("JSON corrompido não quebra e é guardado à parte", () => {
    const store = memoryStore();
    store.setItem(STORAGE_KEY, "{quebrado");
    const r = loadState(store);
    expect(r.status).toBe("corrupt");
    expect(store.getItem(`${STORAGE_KEY}_ilegivel`)).toBe("{quebrado");
  });
});

describe("17. atualização do checklist sem perder dados compatíveis", () => {
  it("mantém tarefas que existem e descarta as removidas", () => {
    const store = memoryStore();
    store.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, completedTaskIds: ["etapa1_tarefa1", "etapa1_tarefa99"], notes: { 1: [{ id: "n", text: "nota antiga" }] } }),
    );
    const r = loadState(store);
    expect(r.status).toBe("ok");
    expect(r.state.completedTaskIds).toEqual(["etapa1_tarefa1"]);
    expect(r.state.notes[1][0].text).toBe("nota antiga");
    expect(r.state.customTasks).toEqual([]); // campo ausente vira lista vazia
  });
});

describe("recomendações", () => {
  it("seguem a ordem das etapas", () => {
    let s = createEmptyState();
    expect(recommendation(s)).toBe(recommendations.start);
    s = toggleFixedTask(s, "etapa1_tarefa1");
    expect(recommendation(s)).toBe(recommendations.continueFirst);
    s = completeStage(createEmptyState(), 1);
    expect(recommendation(s)).toBe(recommendations.afterStage[1]);
    // Etapa 3 completa, mas a 2 não: a recomendação continua na ordem (etapa 2)
    s = completeStage(completeStage(createEmptyState(), 1), 3);
    expect(recommendation(s)).toBe(recommendations.afterStage[1]);
    s = [1, 2, 3, 4].reduce((st, id) => completeStage(st, id), createEmptyState());
    expect(recommendation(s)).toBe(recommendations.afterStage[4]);
    s = completeStage(s, 5);
    expect(recommendation(s)).toBe(recommendations.allDone);
  });
});
