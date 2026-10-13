import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { jsPDF } from "jspdf";
import { allQuestions, alertTexts, limits } from "./content";
import { buildDocument, EMPTY_FIELD, pdfFileName, UNANSWERED } from "./document";
import {
  clearDraft,
  computeAlerts,
  createEmptyForm,
  type FichaForm,
  hasData,
  isValidDate,
  isValidPhone,
  readDraft,
  unansweredQuestions,
  validate,
  writeDraft,
} from "./form";
import { renderDocument, toPdfText } from "./pdf";

const NOW = new Date(2026, 9, 12);

function filled(overrides: Partial<FichaForm> = {}): FichaForm {
  return {
    ...createEmptyForm(NOW),
    clientName: "Maria da Conceição",
    professional: "Larissa Monteiro",
    phone: "(11) 98765-4321",
    service: "Volume brasileiro",
    ...overrides,
  };
}

/* Garante que nada do fluxo usa armazenamento do navegador */
const touched: string[] = [];
const spyStorage = (name: string) =>
  new Proxy({}, { get: (_t, prop) => { touched.push(`${name}.${String(prop)}`); return () => null; } });

beforeEach(() => {
  touched.length = 0;
  Object.assign(globalThis, { localStorage: spyStorage("localStorage"), sessionStorage: spyStorage("sessionStorage") });
});
afterEach(() => {
  delete (globalThis as Record<string, unknown>).localStorage;
  delete (globalThis as Record<string, unknown>).sessionStorage;
  clearDraft();
});

function pdfOf(form: FichaForm) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  renderDocument(doc, buildDocument(form));
  return doc;
}

describe("1. dados básicos e validação", () => {
  it("exige nome, data e profissional", () => {
    const errors = validate({ ...createEmptyForm(NOW), date: "" });
    expect(Object.keys(errors).sort()).toEqual(["clientName", "date", "professional"]);
    expect(validate(filled())).toEqual({});
  });
  it("data precisa existir", () => {
    expect(isValidDate("2026-10-12")).toBe(true);
    expect(isValidDate("2026-02-31")).toBe(false);
    expect(isValidDate("12/10/2026")).toBe(false);
    expect(validate(filled({ date: "2026-02-30" })).date).toBe("Data inválida.");
  });
  it("telefone é opcional, mas validado quando preenchido", () => {
    expect(isValidPhone("(11) 98765-4321")).toBe(true);
    expect(isValidPhone("+55 11 3456-7890")).toBe(true);
    expect(isValidPhone("1234")).toBe(false);
    expect(isValidPhone("11 9abc")).toBe(false);
    expect(validate(filled({ phone: "" })).phone).toBeUndefined();
    expect(validate(filled({ phone: "999" })).phone).toBeDefined();
  });
  it("5. limita textos longos", () => {
    expect(validate(filled({ consultationNotes: "a".repeat(limits.longText + 1) })).consultationNotes).toMatch(/no máximo/);
  });
});

describe("2 e 3. respostas e perguntas não respondidas", () => {
  it("tem as 9 perguntas", () => {
    expect(allQuestions.map((q) => q.id)).toEqual(["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9"]);
  });
  it("ausência de resposta não vira 'Não'", () => {
    const form = filled({ answers: { q1: "sim", q2: "nao", q3: "conversar" } });
    expect(unansweredQuestions(form).map((q) => q.id)).toEqual(["q4", "q5", "q6", "q7", "q8", "q9"]);
    const qa = buildDocument(form).sections[1].blocks.filter((b) => b.kind === "qa");
    expect(qa.map((b) => (b.kind === "qa" ? b.answer : ""))).toEqual([
      "Sim", "Não", "Prefiro conversar pessoalmente", UNANSWERED, UNANSWERED, UNANSWERED, UNANSWERED, UNANSWERED, UNANSWERED,
    ]);
  });
});

describe("6. alertas de segurança", () => {
  it("sem respostas positivas não há alerta (e nem indicador de 'apta')", () => {
    expect(computeAlerts({ q1: "nao", q6: "nao" })).toEqual([]);
  });
  it("sintomas atuais, reação anterior, cirurgia e conversar", () => {
    const alerts = computeAlerts({ q6: "sim", q2: "sim", q4: "sim", q9: "sim", q7: "conversar", q8: "conversar" });
    expect(alerts.map((a) => a.id)).toEqual(["symptoms", "reaction", "surgery", "conversar"]);
    expect(alerts[0].text).toBe(alertTexts.symptoms);
    expect(alerts[1].questions).toEqual([2, 4]);
    expect(alerts[3].questions).toEqual([7, 8]);
  });
  it("respostas 'Sim' não impedem gerar o documento", () => {
    const form = filled({ answers: { q6: "sim" } });
    expect(validate(form)).toEqual({});
    expect(pdfOf(form).getNumberOfPages()).toBeGreaterThan(0);
  });
});

describe("7. revisão / documento", () => {
  it("mostra campos vazios como 'Não informado' e mantém acentos", () => {
    const form = filled({ consultationNotes: "Observação: cílios naturais finos, pálpebra sensível." });
    const doc = buildDocument(form);
    const fields = doc.sections.flatMap((s) => s.blocks).filter((b) => b.kind === "field");
    expect(fields.find((b) => b.kind === "field" && b.label === "Observações administrativas")).toMatchObject({ value: EMPTY_FIELD, empty: true });
    expect(fields.find((b) => b.kind === "field" && b.label === "Observações da consulta")).toMatchObject({
      value: "Observação: cílios naturais finos, pálpebra sensível.",
    });
  });
  it("nome do arquivo usa a data, não o nome da cliente", () => {
    expect(pdfFileName(filled())).toBe("bellash_ficha_consulta_2026-10-12.pdf");
  });
});

describe("4, 8, 9 e 19. PDF", () => {
  it("4. preserva os acentos do português", () => {
    expect(toPdfText("Conceição, pálpebra, ação, você, à, ü")).toBe("Conceição, pálpebra, ação, você, à, ü");
    expect(toPdfText("“aspas” — travessão…")).toBe("“aspas” — travessão…");
  });
  it("19. caracteres fora da fonte do PDF não quebram a geração", () => {
    expect(toPdfText("Ótimo 😊 ✓")).toBe("Ótimo ? ?");
    const form = filled({ otherInfo: "Emoji 😊 e símbolos ✓ ★ 中文" });
    expect(() => pdfOf(form)).not.toThrow();
  });
  it("8. gera uma ficha simples", () => {
    const doc = pdfOf(filled());
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(2); // a ficha completa já ocupa mais de uma página A4
  });
  it("9. textos longos continuam em novas páginas sem erro", () => {
    const long = "Texto longo com acentuação — ".repeat(70);
    const short = pdfOf(filled()).getNumberOfPages();
    const big = pdfOf(filled({ consultationNotes: long, expectations: long, otherInfo: long, notesB: long })).getNumberOfPages();
    expect(big).toBeGreaterThan(short);
  });
});

describe("11, 12 e 13. limpeza, reutilização e ausência de persistência", () => {
  it("rascunho fica só em memória e é apagado ao limpar", () => {
    const form = filled({ answers: { q6: "sim" }, consultationNotes: "nota" });
    writeDraft(form);
    expect(readDraft()).toBe(form);
    clearDraft();
    expect(readDraft()).toBeNull();
    const fresh = createEmptyForm(NOW);
    expect(hasData(fresh)).toBe(false);
    expect(buildDocument(fresh).sections[0].blocks[0]).toMatchObject({ value: EMPTY_FIELD });
    expect(computeAlerts(fresh.answers)).toEqual([]);
  });
  it("nada no fluxo toca localStorage ou sessionStorage", () => {
    const form = filled({ answers: { q2: "sim" } });
    writeDraft(form);
    validate(form);
    pdfOf(form);
    clearDraft();
    expect(touched).toEqual([]);
  });
  it("detecta quando há dados preenchidos (para avisar antes de perder)", () => {
    expect(hasData(createEmptyForm(NOW))).toBe(false);
    expect(hasData({ ...createEmptyForm(NOW), answers: { q1: "nao" } })).toBe(true);
    expect(hasData({ ...createEmptyForm(NOW), clientName: "Ana" })).toBe(true);
  });
});
