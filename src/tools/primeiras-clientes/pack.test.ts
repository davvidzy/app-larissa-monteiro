import { describe, expect, it } from "vitest";
import { categories, library, limits, plan } from "./content";
import {
  allMessages,
  checkPhone,
  createCustom,
  createEmptyState,
  dateForDay,
  deleteCustom,
  emptyProfile,
  exportState,
  importState,
  ImportError,
  type KeyValueStore,
  loadState,
  parseState,
  planProgress,
  type Profile,
  removeToken,
  resetPlan,
  resolveText,
  restoreOriginal,
  saveState,
  saveVersion,
  searchMessages,
  setDayNote,
  STORAGE_KEY,
  toggleDay,
  toggleFavorite,
  tokenValues,
  unresolved,
  updateCustom,
  whatsappUrl,
} from "./state";

const profile: Profile = { ...emptyProfile(), professionalName: "Ana Conceição", instagram: "ana.lash", whatsapp: "(11) 98765-4321", services: "Volume brasileiro\nClássica" };
const store = (): KeyValueStore & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
};
const text = (id: string) => library.find((m) => m.id === id)!.text;

describe("1 e 2. biblioteca", () => {
  it("30 mensagens, 5 por categoria, IDs únicos, sem textos repetidos", () => {
    expect(library).toHaveLength(30);
    for (const c of categories) expect(library.filter((m) => m.category === c.id)).toHaveLength(5);
    expect(new Set(library.map((m) => m.id)).size).toBe(30);
    expect(new Set(library.map((m) => m.text)).size).toBe(30);
    expect(new Set(library.map((m) => m.title)).size).toBe(30);
    for (const m of library) {
      expect(m.purpose.length, m.id).toBeGreaterThan(10);
      expect(m.guidance.length, m.id).toBeGreaterThan(10);
      expect(m.text.length, m.id).toBeLessThanOrEqual(limits.messageText);
    }
  });
  it("sem promessas de resultado", () => {
    const forbidden = /garant|100%|resultado certo|clientes certas|vai lotar/i;
    for (const m of library) expect(forbidden.test(`${m.text} ${m.guidance}`), m.id).toBe(false);
  });
});

describe("3 e 4. variáveis", () => {
  it("preenche perfil e variáveis da mensagem com formatos brasileiros", () => {
    const v = tokenValues(profile, { "[NOME_CLIENTE]": "Bia", "[SERVICO]": "Volume brasileiro", "[DATA]": "2026-10-15", "[HORARIO]": "14:30", "[VALOR]": "150" });
    expect(resolveText(text("msg_11"), v)).toBe(
      "Oi, Bia! 💖 Estou entrando em contato para confirmar seu atendimento de Volume brasileiro, marcado para 15/10/2026 às 14h30. Você consegue confirmar sua presença?",
    );
    expect(resolveText(text("msg_07"), v)).toContain("é R$ 150,00.");
    expect(tokenValues(profile, { "[HORARIO]": "09:00" })["[HORARIO]"]).toBe("9h");
    expect(tokenValues(profile, {})["[INSTAGRAM]"]).toBe("@ana.lash");
  });
  it("variáveis vazias são detectadas (nunca vão para o texto final)", () => {
    const v = tokenValues(profile, {});
    expect(unresolved(text("msg_11"), v)).toEqual(["[NOME_CLIENTE]", "[SERVICO]", "[DATA]", "[HORARIO]"]);
    expect(unresolved(text("msg_01"), v)).toEqual([]);
  });
  it("remover trecho: vocativo e frase inteira", () => {
    expect(removeToken(text("msg_06"), "[NOME_CLIENTE]")).toBe(
      "Oi! Obrigada pelo contato. 💕 Você gostaria de receber informações sobre os serviços disponíveis e como funciona o atendimento?",
    );
    expect(removeToken(text("msg_01"), "[INSTAGRAM]")).toBe(
      "Oi! Tudo bem? 💖 Eu sou [NOME_PROFISSIONAL] e estou construindo meu trabalho no universo dos cílios. Vou compartilhar informações, novidades e conteúdos sobre essa área.",
    );
    expect(removeToken(text("msg_30"), "[WHATSAPP]")).toBe("Olá! 💖");
    expect(removeToken("Linha 1\nContato: [WHATSAPP]\nLinha 3", "[WHATSAPP]")).toBe("Linha 1\n\nLinha 3");
  });
});

describe("5, 6 e 12. edição, original e favoritos", () => {
  it("versão personalizada não altera o original e pode ser restaurada", () => {
    let s = saveVersion(createEmptyState(), "msg_16", "Oi, [NOME_CLIENTE]! Obrigada demais! 💖");
    expect(allMessages(s).find((m) => m.id === "msg_16")!.text).toBe("Oi, [NOME_CLIENTE]! Obrigada demais! 💖");
    expect(text("msg_16")).toContain("Foi um prazer te receber!");
    s = restoreOriginal(s, "msg_16");
    expect(allMessages(s).find((m) => m.id === "msg_16")!.text).toBe(text("msg_16"));
    expect(saveVersion(s, "msg_16", "   ")).toBe(s);
  });
  it("favoritar e desfavoritar", () => {
    let s = toggleFavorite(createEmptyState(), "msg_03");
    expect(s.favorites).toEqual(["msg_03"]);
    s = toggleFavorite(s, "msg_03");
    expect(s.favorites).toEqual([]);
  });
});

describe("10 e 11. mensagens próprias", () => {
  it("cria, edita, exclui (e tira dos favoritos); recusa vazias", () => {
    let { state, id } = createCustom(createEmptyState(), { title: "Promo aniversário", category: "indicacoes", text: "Oi, [NOME_CLIENTE]! 🎉" });
    expect(id).toMatch(/^custom_/);
    state = toggleFavorite(state, id!);
    state = updateCustom(state, id!, { title: "Aniversário", category: "indicacoes", text: "Parabéns, [NOME_CLIENTE]! 🎉" });
    expect(state.customMessages[0]).toMatchObject({ title: "Aniversário", text: "Parabéns, [NOME_CLIENTE]! 🎉" });
    state = deleteCustom(state, id!);
    expect(state.customMessages).toEqual([]);
    expect(state.favorites).toEqual([]);
    expect(createCustom(createEmptyState(), { title: "x", category: "pos", text: " " }).id).toBeNull();
    expect(createCustom(createEmptyState(), { title: "", category: "pos", text: "texto" }).id).toBeNull();
  });
});

describe("13. pesquisa e filtros", () => {
  it("por palavra (sem acento), categoria, favoritas e minhas", () => {
    let s = toggleFavorite(createEmptyState(), "msg_20");
    s = createCustom(s, { title: "Minha mensagem", category: "pos", text: "Texto meu" }).state;
    expect(searchMessages(s, "manutencao", "todas", "").map((m) => m.id)).toContain("msg_20");
    expect(searchMessages(s, "", "todas", "agendamento")).toHaveLength(5);
    expect(searchMessages(s, "", "favoritas", "").map((m) => m.id)).toEqual(["msg_20"]);
    expect(searchMessages(s, "", "minhas", "").map((m) => m.title)).toEqual(["Minha mensagem"]);
    expect(searchMessages(s, "Confirmação", "todas", "").map((m) => m.id)).toContain("msg_11");
  });
});

describe("8 e 9. WhatsApp", () => {
  it("codifica acentos, emojis, & e quebras de linha", () => {
    const msg = "Olá, Bia! 💖 Ação & cuidado\nLinha 2 #1";
    const url = whatsappUrl(msg);
    expect(url.startsWith("https://api.whatsapp.com/send?text=")).toBe(true);
    expect(decodeURIComponent(new URL(url).searchParams.get("text")!)).toBe(msg);
    expect(url).not.toMatch(/\s|💖|#/u); // tudo codificado
    expect(url.split("&")).toHaveLength(1); // o "&" do texto não virou outro parâmetro
    expect(new URL(whatsappUrl("Oi", "5511987654321")).searchParams.get("phone")).toBe("5511987654321");
  });
  it("valida número internacional", () => {
    expect(checkPhone("+55 11 98765-4321")).toEqual({ ok: true, digits: "5511987654321" });
    expect(checkPhone("+351 912 345 678")).toEqual({ ok: true, digits: "351912345678" });
    expect(checkPhone("(11) 98765-4321").ok).toBe(false); // sem código do país
    expect(checkPhone("+55 11 9876").ok).toBe(false);
    expect(checkPhone("abc").ok).toBe(false);
  });
});

describe("14, 15 e 16. planejamento", () => {
  it("30 atividades com objetivo, atividade e sugestão", () => {
    expect(plan).toHaveLength(30);
    expect(plan.map((d) => d.day)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
    for (const d of plan) expect(d.objective && d.activity && d.suggestion, String(d.day)).toBeTruthy();
    const ids = new Set(library.map((m) => m.id));
    for (const d of plan) for (const l of d.links ?? []) if (l.messageId) expect(ids.has(l.messageId)).toBe(true);
  });
  it("marca, desmarca, calcula e não bloqueia atividades futuras", () => {
    let s = toggleDay(createEmptyState(), 30); // pode começar por qualquer dia
    s = toggleDay(s, 1);
    expect(planProgress(s)).toEqual({ done: 2, total: 30, percent: 7 });
    s = toggleDay(s, 1);
    expect(planProgress(s).done).toBe(1);
    s = Array.from({ length: 30 }, (_, i) => i + 1).reduce((st, d) => (st.plan.completed.includes(d) ? st : toggleDay(st, d)), s);
    expect(planProgress(s)).toEqual({ done: 30, total: 30, percent: 100 });
  });
  it("anotações, data inicial opcional e reinício", () => {
    let s = setDayNote(createEmptyState(), 4, "Dúvidas: manutenção, cuidados");
    expect(s.plan.notes[4]).toContain("manutenção");
    expect(dateForDay("2026-10-01", 1)).toBe("01/10");
    expect(dateForDay("2026-10-01", 31)).toBe("31/10");
    expect(dateForDay(null, 3)).toBeNull();
    s = resetPlan(toggleDay(s, 2));
    expect(s.plan.completed).toEqual([]);
    expect(s.plan.notes).toEqual({});
  });
});

describe("17 a 21. salvamento e backup", () => {
  it("salva e recupera", () => {
    const st = store();
    let s = { ...createEmptyState(), profile };
    s = toggleDay(toggleFavorite(s, "msg_01"), 3);
    expect(saveState(st, s)).toBe(true);
    expect(loadState(st)).toEqual({ state: s, status: "ok" });
  });
  it("exporta e importa; recusa inválidos", () => {
    const s = toggleDay(saveVersion({ ...createEmptyState(), profile }, "msg_01", "Oi! [INSTAGRAM]"), 5);
    expect(importState(exportState(s))).toEqual(s);
    expect(() => importState("{quebrado")).toThrow(ImportError);
    expect(() => importState(JSON.stringify({ version: 1 }))).toThrow(/não é um backup/);
    expect(() => importState(JSON.stringify({ app: "bellash_primeiras_clientes", version: 2 }))).toThrow(/mais nova/);
    expect(() => importState("{}", limits.importBytes + 1)).toThrow(/grande demais/);
  });
  it("descarta itens maliciosos ou estranhos", () => {
    const s = parseState({
      version: 1,
      favorites: ["msg_01", "<script>", "msg_99"],
      versions: { msg_02: { text: "<img onerror=alert(1)>" }, hack: { text: "x" } },
      customMessages: [{ id: "custom_ok", title: "T", category: "pos", text: "Oi" }, { id: "../x", title: "T", text: "x" }],
      plan: { completed: [1, 2, 99, "3"], notes: { 1: "ok", 50: "fora" } },
    })!;
    expect(s.favorites).toEqual(["msg_01"]);
    expect(Object.keys(s.versions)).toEqual(["msg_02"]); // texto guardado como texto, nunca executado
    expect(s.customMessages.map((c) => c.id)).toEqual(["custom_ok"]);
    expect(s.plan.completed).toEqual([1, 2]);
    expect(Object.keys(s.plan.notes)).toEqual(["1"]);
  });
  it("armazenamento indisponível ou corrompido não quebra", () => {
    expect(loadState(null).status).toBe("unavailable");
    const st = store();
    st.setItem(STORAGE_KEY, "{x");
    expect(loadState(st).status).toBe("corrupt");
    expect(st.getItem(`${STORAGE_KEY}_ilegivel`)).toBe("{x");
  });
});

describe("25. sem armazenamento de destinatárias", () => {
  it("o estado salvo não tem campos para nome, telefone ou variáveis da mensagem", () => {
    const s = createEmptyState();
    const keys = JSON.stringify(Object.keys(s)) + JSON.stringify(Object.keys(s.profile));
    expect(keys).not.toMatch(/cliente|destinat|phone|telefoneDestino|recipients|contacts/i);
  });
});
