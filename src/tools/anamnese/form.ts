/* Ficha de Consulta e Anamnese: estrutura, validação, alertas e o rascunho EM MEMÓRIA.
   Nada aqui usa localStorage, sessionStorage, IndexedDB, cookies, URL ou rede. */

import { alertTexts, allQuestions, type Answer, limits, type OrientationId, orientationItems, type QuestionId, services } from "./content";

export type Service = (typeof services)[number];

export type ReferralStatus = "" | "nao" | "adiado" | "encaminhada" | "adiado_encaminhada";

export const referralLabels: Record<Exclude<ReferralStatus, "">, string> = {
  nao: "Não houve adiamento nem encaminhamento",
  adiado: "Atendimento adiado",
  encaminhada: "Cliente orientada a buscar avaliação de profissional de saúde",
  adiado_encaminhada: "Atendimento adiado e cliente orientada a buscar avaliação de profissional de saúde",
};

export type FichaForm = {
  // 1. Identificação
  clientName: string;
  phone: string;
  /** AAAA-MM-DD */
  date: string;
  professional: string;
  service: Service | "";
  serviceDescription: string;
  adminNotes: string;
  // 2. Questionário (ausente = não respondida; nunca vira "Não")
  answers: Partial<Record<QuestionId, Answer>>;
  notesB: string;
  notesC: string;
  // 3. Preferências, observações e orientações
  effect: string;
  expectations: string;
  otherInfo: string;
  consultationNotes: string;
  orientationsGiven: string;
  referral: ReferralStatus;
  referralNotes: string;
  orientations: Partial<Record<OrientationId, boolean>>;
  finalNotes: string;
};

export function todayIso(now = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function createEmptyForm(now = new Date()): FichaForm {
  return {
    clientName: "",
    phone: "",
    date: todayIso(now),
    professional: "",
    service: "",
    serviceDescription: "",
    adminNotes: "",
    answers: {},
    notesB: "",
    notesC: "",
    effect: "",
    expectations: "",
    otherInfo: "",
    consultationNotes: "",
    orientationsGiven: "",
    referral: "",
    referralNotes: "",
    orientations: {},
    finalNotes: "",
  };
}

/** Há algo preenchido além da data padrão? (para avisar antes de perder dados) */
export function hasData(form: FichaForm) {
  const empty = createEmptyForm();
  return (Object.keys(form) as (keyof FichaForm)[]).some((key) => {
    if (key === "date") return false;
    const value = form[key];
    if (typeof value === "string") return value.trim() !== "";
    if (value && typeof value === "object") return Object.values(value).some(Boolean);
    return value !== empty[key];
  });
}

/* -------------------------------------------------------------------------- */
/* Validação                                                                  */
/* -------------------------------------------------------------------------- */

/** Data AAAA-MM-DD que existe de verdade (rejeita 31/02 etc.). */
export function isValidDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [y, m, d] = match.slice(1).map(Number);
  const date = new Date(y, m - 1, d);
  return y >= 1900 && y <= 2100 && date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

/** Telefone brasileiro: 10 ou 11 dígitos (com DDD), opcionalmente com +55. */
export function isValidPhone(value: string) {
  if (!/^[\d\s()+\-.]*$/.test(value)) return false;
  const digits = value.replace(/\D/g, "");
  const local = digits.length > 11 && digits.startsWith("55") ? digits.slice(2) : digits;
  return local.length === 10 || local.length === 11;
}

export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  const local = digits.length > 11 && digits.startsWith("55") ? digits.slice(2) : digits;
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return value.trim();
}

export type FieldErrors = Partial<Record<keyof FichaForm, string>>;

const textLimits: Partial<Record<keyof FichaForm, number>> = {
  clientName: limits.name,
  professional: limits.name,
  phone: limits.phone,
  serviceDescription: limits.shortText,
  effect: limits.shortText,
  adminNotes: limits.longText,
  notesB: limits.longText,
  notesC: limits.longText,
  expectations: limits.longText,
  otherInfo: limits.longText,
  consultationNotes: limits.longText,
  orientationsGiven: limits.longText,
  referralNotes: limits.longText,
  finalNotes: limits.longText,
};

export function validate(form: FichaForm): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.clientName.trim()) errors.clientName = "Informe o nome da cliente.";
  if (!form.professional.trim()) errors.professional = "Informe o nome da profissional responsável.";
  if (!form.date) errors.date = "Informe a data da consulta.";
  else if (!isValidDate(form.date)) errors.date = "Data inválida.";
  if (form.phone.trim() && !isValidPhone(form.phone)) errors.phone = "Telefone inválido. Use DDD + número, ex.: (11) 98765-4321.";
  for (const [key, max] of Object.entries(textLimits) as [keyof FichaForm, number][]) {
    const value = form[key];
    if (typeof value === "string" && value.length > max && !errors[key]) errors[key] = `Use no máximo ${max} caracteres.`;
  }
  return errors;
}

export const unansweredQuestions = (form: FichaForm) => allQuestions.filter((q) => !form.answers[q.id]);

/* -------------------------------------------------------------------------- */
/* Alertas informativos                                                       */
/* -------------------------------------------------------------------------- */

export type FichaAlert = { id: "symptoms" | "reaction" | "surgery" | "conversar"; text: string; questions: number[] };

const num = (id: QuestionId) => Number(id.slice(1));

/** Alertas conforme as respostas. Não há (nem haverá) indicador de "apta" ou "sem riscos". */
export function computeAlerts(answers: FichaForm["answers"]): FichaAlert[] {
  const yes = (ids: QuestionId[]) => ids.filter((id) => answers[id] === "sim");
  const alerts: FichaAlert[] = [];
  const symptoms = yes(["q6"]);
  if (symptoms.length) alerts.push({ id: "symptoms", text: alertTexts.symptoms, questions: symptoms.map(num) });
  const reaction = yes(["q2", "q3", "q4", "q5"]);
  if (reaction.length) alerts.push({ id: "reaction", text: alertTexts.reaction, questions: reaction.map(num) });
  const surgery = yes(["q9"]);
  if (surgery.length) alerts.push({ id: "surgery", text: alertTexts.surgery, questions: surgery.map(num) });
  const talk = allQuestions.filter((q) => answers[q.id] === "conversar").map((q) => num(q.id));
  if (talk.length) alerts.push({ id: "conversar", text: alertTexts.conversar, questions: talk });
  return alerts;
}

export const checkedOrientations = (form: FichaForm) => orientationItems.filter((o) => form.orientations[o.id]);

/* -------------------------------------------------------------------------- */
/* Rascunho em memória                                                        */
/* -------------------------------------------------------------------------- */

/* Mantém a ficha enquanto a aba estiver aberta, mesmo se a profissional for a
   outra seção do portal e voltar. Fica só na memória do JavaScript: some ao
   recarregar ou fechar a página. NUNCA gravar isto em armazenamento do navegador. */
let draft: FichaForm | null = null;

export const readDraft = () => draft;
export const writeDraft = (form: FichaForm) => {
  draft = form;
};
export const clearDraft = () => {
  draft = null;
};
