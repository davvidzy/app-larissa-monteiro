/* Conteúdo do documento final, montado a partir da ficha. Usado tanto no PDF quanto
   na impressão, para que os dois tenham exatamente as mesmas informações. */

import { answerLabels, notices, orientationItems, questionGroups } from "./content";
import { checkedOrientations, computeAlerts, type FichaForm, formatPhone, referralLabels } from "./form";

export const EMPTY_FIELD = "Não informado";
export const UNANSWERED = "Não respondida";

export type DocBlock =
  | { kind: "field"; label: string; value: string; empty: boolean }
  | { kind: "qa"; number: number; question: string; answer: string; empty: boolean }
  | { kind: "subheading"; text: string }
  | { kind: "alert"; text: string; questions: number[] }
  | { kind: "check"; text: string; checked: boolean }
  | { kind: "paragraph"; text: string; muted?: boolean }
  | { kind: "signatures"; professional: string; date: string };

export type DocSection = { title: string; blocks: DocBlock[] };

export type FichaDocument = { title: string; subtitle: string; sections: DocSection[]; footer: string };

/** "2026-10-12" → "12/10/2026" */
export function formatDateBR(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

const field = (label: string, value: string): DocBlock => {
  const clean = value.trim();
  return { kind: "field", label, value: clean || EMPTY_FIELD, empty: !clean };
};

export function buildDocument(form: FichaForm): FichaDocument {
  const service = form.service
    ? form.serviceDescription.trim()
      ? `${form.service} — ${form.serviceDescription.trim()}`
      : form.service
    : form.serviceDescription;

  const questionnaire: DocBlock[] = [];
  for (const group of questionGroups) {
    questionnaire.push({ kind: "subheading", text: `Grupo ${group.id} — ${group.title}` });
    for (const q of group.questions) {
      const answer = form.answers[q.id];
      questionnaire.push({
        kind: "qa",
        number: Number(q.id.slice(1)),
        question: q.text,
        answer: answer ? answerLabels[answer] : UNANSWERED,
        empty: !answer,
      });
    }
    if (group.id === "B") questionnaire.push(field("Informações descritas", form.notesB));
    if (group.id === "C") questionnaire.push(field("Observações", form.notesC));
  }

  const alerts = computeAlerts(form.answers);
  const checked = new Set(checkedOrientations(form).map((o) => o.id));

  return {
    title: "Ficha de Consulta e Anamnese Lash",
    subtitle: `Consulta de ${formatDateBR(form.date)}`,
    sections: [
      {
        title: "1. Identificação da consulta",
        blocks: [
          field("Nome da cliente", form.clientName),
          field("Telefone", form.phone.trim() ? formatPhone(form.phone) : ""),
          field("Data da consulta", formatDateBR(form.date)),
          field("Profissional responsável", form.professional),
          field("Serviço pretendido", service),
          field("Observações administrativas", form.adminNotes),
        ],
      },
      { title: "2. Questionário de consulta prévia", blocks: questionnaire },
      {
        title: "3. Preferências da cliente",
        blocks: [
          field("Efeito visual de preferência", form.effect),
          field("Preferências e expectativas", form.expectations),
          field("Outras informações relevantes", form.otherInfo),
        ],
      },
      {
        title: "4. Observações da profissional",
        blocks: [
          field("Observações da consulta", form.consultationNotes),
          field("Orientações fornecidas", form.orientationsGiven),
          field("Encaminhamento ou adiamento", form.referral ? referralLabels[form.referral] : ""),
          field("Detalhes do encaminhamento ou adiamento", form.referralNotes),
        ],
      },
      {
        title: "5. Alertas registrados",
        blocks: [
          ...(alerts.length
            ? alerts.map((a): DocBlock => ({ kind: "alert", text: a.text, questions: a.questions }))
            : [{ kind: "paragraph", text: "Nenhum alerta gerado pelas respostas registradas." } as DocBlock]),
          { kind: "paragraph", text: notices.notMedical, muted: true },
          { kind: "paragraph", text: notices.urgent, muted: true },
        ],
      },
      {
        title: "6. Orientações registradas",
        blocks: [
          { kind: "paragraph", text: notices.orientationsNotConsent, muted: true },
          ...orientationItems.map((o): DocBlock => ({ kind: "check", text: o.text, checked: checked.has(o.id) })),
          field("Observações finais", form.finalNotes),
          { kind: "signatures", professional: form.professional.trim(), date: formatDateBR(form.date) },
        ],
      },
    ],
    footer: `Documento confidencial. ${notices.lgpd}`,
  };
}

export const pdfFileName = (form: FichaForm) => `bellash_ficha_consulta_${form.date}.pdf`;
