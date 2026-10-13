import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, Check, FileDown, LoaderCircle, Pencil, Printer, RotateCcw, ShieldAlert, TriangleAlert } from "lucide-react";
import { Warning } from "../precificacao/ui/fields";
import { answerLabels, type Answer, limits, notices, orientationItems, questionGroups, services } from "./content";
import { buildDocument, type DocBlock, type FichaDocument, pdfFileName } from "./document";
import {
  clearDraft,
  computeAlerts,
  createEmptyForm,
  type FichaForm,
  type FieldErrors,
  hasData,
  readDraft,
  referralLabels,
  type ReferralStatus,
  unansweredQuestions,
  validate,
  writeDraft,
} from "./form";
import { createPdf, downloadBlob } from "./pdf";

/* Fase atual também só em memória (volta à mesma fase se a profissional sair e voltar à ferramenta). */
let draftStep = 1;

const steps = ["Identificação", "Questionário", "Serviço e observações", "Revisão", "Documento"];

/* -------------------------------------------------------------------------- */
/* Campos                                                                     */
/* -------------------------------------------------------------------------- */

// Sem autocompletar e sem corretor ortográfico: o corretor "aprimorado" de alguns
// navegadores envia o texto para um servidor externo.
const privateInput = { autoComplete: "off", spellCheck: false, autoCorrect: "off", autoCapitalize: "sentences" } as const;
const inputClass =
  "w-full rounded-[10px] border bg-surface px-3 py-2.5 text-[16px] text-ink outline-none focus:ring-2 focus:ring-primary-light";

function Field({ label, value, onChange, error, required, multiline, max, type = "text", hint, inputMode }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  multiline?: boolean;
  max: number;
  type?: "text" | "date" | "tel";
  hint?: string;
  inputMode?: "text" | "tel";
}) {
  const id = useId();
  const border = error ? "border-error" : "border-[#B7A7AF] focus:border-primary";
  return (
    <div>
      <label htmlFor={id} className="block text-[14px] font-bold text-ink">
        {label} {required ? <span className="text-error">*</span> : <span className="font-normal text-ink-soft">(opcional)</span>}
      </label>
      {hint && <p className="mt-0.5 text-[13px] text-ink-soft">{hint}</p>}
      {multiline ? (
        <textarea id={id} rows={3} maxLength={max} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} {...privateInput} className={`${inputClass} ${border} mt-1.5 resize-y`} />
      ) : (
        <input id={id} type={type} inputMode={inputMode} maxLength={max} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} {...privateInput} className={`${inputClass} ${border} mt-1.5 min-h-12`} />
      )}
      <div className="mt-1 flex justify-between gap-2">
        {error ? <p role="alert" className="text-[13px] font-medium text-error">{error}</p> : <span />}
        {multiline && <span className="shrink-0 text-[12px] text-[#6C5E66]">{value.length}/{max}</span>}
      </div>
    </div>
  );
}

function AnswerChoice({ question, number, value, onChange }: { question: string; number: number; value?: Answer; onChange: (a: Answer | undefined) => void }) {
  const name = useId();
  return (
    <fieldset className="rounded-[14px] border border-line bg-surface p-3.5">
      <legend className="sr-only">Pergunta {number}</legend>
      <p className="text-[15px] leading-snug text-ink" aria-hidden="true">
        <span className="font-bold text-primary">{number}.</span> {question}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {(Object.keys(answerLabels) as Answer[]).map((a) => (
          <label
            key={a}
            className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-[14px] font-medium transition-colors ${
              value === a ? "border-primary bg-primary text-white" : "border-[#B7A7AF] text-ink hover:border-primary"
            }`}
          >
            <input type="radio" name={name} value={a} checked={value === a} onChange={() => onChange(a)} className="sr-only" />
            {answerLabels[a]}
          </label>
        ))}
      </div>
      <div className="mt-1.5 flex min-h-6 items-center justify-between">
        <span className="text-[12px] text-[#6C5E66]">{value ? "" : "Ainda não respondida"}</span>
        {value && (
          <button type="button" onClick={() => onChange(undefined)} className="text-[12px] font-medium text-ink-soft underline-offset-2 hover:underline">
            Limpar resposta
          </button>
        )}
      </div>
    </fieldset>
  );
}

function AlertList({ form }: { form: FichaForm }) {
  const alerts = computeAlerts(form.answers);
  if (!alerts.length) return null;
  return (
    <div className="space-y-2" aria-live="polite">
      {alerts.map((a) => (
        <div key={a.id} role="status" className="flex gap-2.5 rounded-[12px] border border-[#87510D]/20 bg-[#FFFAEB] p-3.5 text-[14px] text-[#87510D]">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <p>
            <strong>{a.text}</strong>{" "}
            <span className="font-normal">(pergunta{a.questions.length > 1 ? "s" : ""} {a.questions.join(", ")})</span>
          </p>
        </div>
      ))}
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-card border border-line bg-surface p-4 shadow-soft md:p-6">
      <h3 className="text-[18px] font-bold text-ink">{title}</h3>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Documento (revisão na tela e impressão usam o mesmo componente)            */
/* -------------------------------------------------------------------------- */

function DocBlockView({ block }: { block: DocBlock }) {
  switch (block.kind) {
    case "subheading":
      return <p className="pt-1 text-[14px] font-bold text-ink-soft">{block.text}</p>;
    case "field":
      return (
        <div className="break-inside-avoid">
          <p className="text-[12px] font-bold tracking-[0.04em] text-[#6C5E66] uppercase">{block.label}</p>
          <p className={`text-[15px] break-words whitespace-pre-wrap ${block.empty ? "text-[#6C5E66] italic" : "text-ink"}`}>{block.value}</p>
        </div>
      );
    case "qa":
      return (
        <div className="break-inside-avoid">
          <p className="text-[14px] text-ink">
            {block.number}. {block.question}
          </p>
          <p className={`mt-0.5 pl-3 text-[15px] font-bold ${block.empty ? "text-[#6C5E66] italic" : "text-primary"}`}>Resposta: {block.answer}</p>
        </div>
      );
    case "alert":
      return (
        <p className="break-inside-avoid border-l-4 border-[#87510D] bg-[#FFFAEB] px-3 py-2 text-[14px] font-bold text-[#87510D]">
          {block.text} <span className="font-normal">(pergunta{block.questions.length > 1 ? "s" : ""} {block.questions.join(", ")})</span>
        </p>
      );
    case "check":
      return (
        <p className={`flex gap-2 text-[15px] ${block.checked ? "text-ink" : "text-[#6C5E66]"}`}>
          <span aria-hidden="true" className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[3px] border border-ink-soft">
            {block.checked && <Check className="size-3.5" strokeWidth={3} />}
          </span>
          <span>
            {block.text}
            {!block.checked && " (não registrada)"}
          </span>
        </p>
      );
    case "paragraph":
      return <p className={block.muted ? "text-[13px] text-[#6C5E66]" : "text-[15px] text-ink"}>{block.text}</p>;
    case "signatures":
      return (
        <div className="break-inside-avoid pt-10">
          <div className="grid grid-cols-2 gap-8">
            <div className="border-t border-ink pt-1 text-[13px] text-ink-soft">Assinatura da cliente</div>
            <div className="border-t border-ink pt-1 text-[13px] text-ink-soft">
              Assinatura da profissional{block.professional && ` — ${block.professional}`}
            </div>
          </div>
          <p className="mt-6 text-[13px] text-ink-soft">Local e data: ____________________________, {block.date}</p>
        </div>
      );
  }
}

function DocumentView({ doc, onEdit }: { doc: FichaDocument; onEdit?: (step: number) => void }) {
  // Seção do documento → fase do formulário onde se edita
  const stepOf = [1, 2, 3, 3, 2, 3];
  return (
    <div className="space-y-6">
      <header className="border-b-2 border-primary pb-3">
        <p className="text-[11px] font-bold tracking-[0.14em] text-primary">BELLASH ACADEMY</p>
        <h2 className="font-display text-[28px] leading-tight font-semibold text-[#301827]">{doc.title}</h2>
        <p className="text-[14px] text-ink-soft">{doc.subtitle}</p>
      </header>
      {doc.sections.map((section, i) => (
        <section key={section.title} className="space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-line pb-1">
            <h3 className="text-[16px] font-bold text-primary">{section.title}</h3>
            {onEdit && (
              <button type="button" onClick={() => onEdit(stepOf[i])} className="inline-flex min-h-11 items-center gap-1 px-2 text-[13px] font-bold text-primary hover:underline print:hidden">
                <Pencil aria-hidden="true" className="size-3.5" />
                Corrigir
              </button>
            )}
          </div>
          {section.blocks.map((block, j) => (
            <DocBlockView key={j} block={block} />
          ))}
        </section>
      ))}
      <p className="border-t border-line pt-3 text-[12px] text-[#6C5E66]">{doc.footer}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Ferramenta                                                                 */
/* -------------------------------------------------------------------------- */

export function AnamneseTool() {
  const [form, setForm] = useState<FichaForm>(() => readDraft() ?? createEmptyForm());
  const [step, setStepState] = useState(draftStep);
  const [showErrors, setShowErrors] = useState(false);
  const [pdfState, setPdfState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [printing, setPrinting] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const filledIn = hasData(form);
  const errors: FieldErrors = validate(form);
  const visibleErrors = showErrors ? errors : {};
  const requiredMissing = Object.keys(errors).length > 0;

  // Rascunho só na memória da página
  useEffect(() => {
    if (filledIn) writeDraft(form);
    else clearDraft();
  }, [form, filledIn]);

  // Aviso nativo do navegador ao recarregar/fechar com dados preenchidos (quando o navegador permitir)
  useEffect(() => {
    if (!filledIn) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [filledIn]);

  // Impressão: mostra a ficha no papel e usa o nome padrão como sugestão de arquivo
  useEffect(() => {
    if (!printing) return;
    const previousTitle = document.title;
    document.title = pdfFileName(form).replace(/\.pdf$/, "");
    const done = () => setPrinting(false);
    window.addEventListener("afterprint", done);
    const timer = window.setTimeout(() => window.print(), 50);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", done);
      document.title = previousTitle;
    };
  }, [printing, form]);

  const set = <K extends keyof FichaForm>(key: K, value: FichaForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setPdfState("idle");
  };

  /** `fromContinue`: botão "Continuar" da fase 1 não avança com obrigatórios faltando (as abas navegam livremente). */
  function goTo(next: number, fromContinue = false) {
    const step1Invalid = !!(errors.clientName || errors.professional || errors.date || errors.phone);
    if (step === 1 && next > 1 && step1Invalid) {
      setShowErrors(true);
      if (fromContinue) return;
    }
    if (next >= 4) setShowErrors(true);
    draftStep = next;
    setStepState(next);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function clearAll() {
    if (filledIn && !window.confirm(notices.clearConfirm)) return;
    clearDraft();
    draftStep = 1;
    setForm(createEmptyForm());
    setStepState(1);
    setShowErrors(false);
    setPdfState("idle");
  }

  async function generatePdf() {
    setShowErrors(true);
    if (requiredMissing) return;
    setPdfState("working");
    try {
      const blob = await createPdf(buildDocument(form));
      downloadBlob(blob, pdfFileName(form));
      setPdfState("done");
    } catch {
      setPdfState("error");
    }
  }

  const doc = buildDocument(form);
  const unanswered = unansweredQuestions(form);

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-[14px] border border-line bg-surface p-4 text-[14px] text-ink-soft">
        <p className="flex gap-2 font-medium text-ink">
          <ShieldAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
          {notices.temporary}
        </p>
        <p>
          {notices.adults} {notices.lgpd}
        </p>
      </div>

      {/* Fases */}
      <div ref={topRef} className="scroll-mt-4">
        <nav aria-label="Fases da ficha" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <ol className="flex gap-1.5">
            {steps.map((label, i) => {
              const n = i + 1;
              const active = n === step;
              return (
                <li key={label} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => goTo(n)}
                    aria-current={active ? "step" : undefined}
                    className={`inline-flex min-h-11 items-center gap-2 rounded-[12px] px-3.5 text-[14px] font-bold transition-colors ${
                      active ? "bg-primary text-white" : "bg-surface text-ink-soft shadow-soft hover:text-primary"
                    }`}
                  >
                    <span className={`flex size-5 items-center justify-center rounded-full text-[11px] ${active ? "bg-white text-primary" : "bg-[#F7F3F5]"}`}>{n}</span>
                    {label}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {step === 1 && (
        <Card title="Identificação da consulta">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome da cliente" required max={limits.name} value={form.clientName} onChange={(v) => set("clientName", v)} error={visibleErrors.clientName} />
            <Field label="Telefone para contato" type="tel" inputMode="tel" max={limits.phone} value={form.phone} onChange={(v) => set("phone", v)} error={visibleErrors.phone} hint="Com DDD" />
            <Field label="Data da consulta" required type="date" max={10} value={form.date} onChange={(v) => set("date", v)} error={visibleErrors.date} />
            <Field label="Profissional responsável" required max={limits.name} value={form.professional} onChange={(v) => set("professional", v)} error={visibleErrors.professional} />
          </div>
          <fieldset>
            <legend className="text-[14px] font-bold text-ink">
              Serviço pretendido <span className="font-normal text-ink-soft">(opcional)</span>
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {services.map((s) => (
                <label
                  key={s}
                  className={`inline-flex min-h-11 cursor-pointer items-center rounded-full border px-3.5 text-[14px] font-medium ${
                    form.service === s ? "border-primary bg-primary text-white" : "border-[#B7A7AF] text-ink hover:border-primary"
                  }`}
                >
                  <input type="radio" name="servico" className="sr-only" checked={form.service === s} onChange={() => set("service", s)} />
                  {s}
                </label>
              ))}
            </div>
          </fieldset>
          <Field
            label="Descrição do serviço"
            max={limits.shortText}
            value={form.serviceDescription}
            onChange={(v) => set("serviceDescription", v)}
            hint="Edite como preferir. A ficha não sugere curvatura, espessura ou comprimento: isso depende da avaliação presencial."
          />
          <Field label="Observações administrativas" multiline max={limits.longText} value={form.adminNotes} onChange={(v) => set("adminNotes", v)} />
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <Warning>{notices.urgent}</Warning>
          {questionGroups.map((group) => (
            <Card key={group.id} title={`Grupo ${group.id} — ${group.title}`}>
              {group.questions.map((q) => (
                <AnswerChoice
                  key={q.id}
                  number={Number(q.id.slice(1))}
                  question={q.text}
                  value={form.answers[q.id]}
                  onChange={(a) => set("answers", { ...form.answers, [q.id]: a })}
                />
              ))}
              {group.id === "B" && <Field label={group.notesLabel!} multiline max={limits.longText} value={form.notesB} onChange={(v) => set("notesB", v)} />}
              {group.id === "C" && <Field label="Observações" multiline max={limits.longText} value={form.notesC} onChange={(v) => set("notesC", v)} />}
            </Card>
          ))}
          <AlertList form={form} />
          <p className="text-[13px] text-ink-soft">{notices.notMedical}</p>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <Card title="Preferências da cliente">
            <p className="text-[14px] text-ink-soft">
              Serviço: <strong className="text-ink">{form.service || "não informado"}</strong>
              {form.answers.q1 && <> · Já fez extensão antes: <strong className="text-ink">{answerLabels[form.answers.q1]}</strong></>}
              <span className="block text-[13px]">Esses dados vêm das fases 1 e 2 (não precisa repetir).</span>
            </p>
            <Field label="Efeito visual de preferência" max={limits.shortText} value={form.effect} onChange={(v) => set("effect", v)} />
            <Field label="Preferências e expectativas" multiline max={limits.longText} value={form.expectations} onChange={(v) => set("expectations", v)} />
            <Field label="Outras informações relevantes para a consulta" multiline max={limits.longText} value={form.otherInfo} onChange={(v) => set("otherInfo", v)} />
          </Card>

          <Card title="Observações da profissional">
            <p className="text-[13px] text-ink-soft">Registros da consulta, não diagnósticos médicos.</p>
            <Field label="Observações da consulta" multiline max={limits.longText} value={form.consultationNotes} onChange={(v) => set("consultationNotes", v)} />
            <Field label="Orientações fornecidas" multiline max={limits.longText} value={form.orientationsGiven} onChange={(v) => set("orientationsGiven", v)} hint="Descreva o que foi explicado à cliente." />
            <div>
              <label htmlFor="referral" className="block text-[14px] font-bold text-ink">
                Encaminhamento ou adiamento <span className="font-normal text-ink-soft">(opcional)</span>
              </label>
              <select
                id="referral"
                value={form.referral}
                onChange={(e) => set("referral", e.target.value as ReferralStatus)}
                className="mt-1.5 min-h-12 w-full rounded-[10px] border border-[#B7A7AF] bg-surface px-3 text-[16px] text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
              >
                <option value="">Não informado</option>
                {(Object.keys(referralLabels) as Exclude<ReferralStatus, "">[]).map((k) => (
                  <option key={k} value={k}>
                    {referralLabels[k]}
                  </option>
                ))}
              </select>
            </div>
            <Field label="Detalhes do encaminhamento ou adiamento" multiline max={limits.longText} value={form.referralNotes} onChange={(v) => set("referralNotes", v)} />
          </Card>

          <Card title="Registro das orientações">
            <p className="text-[13px] text-ink-soft">{notices.orientationsNotConsent}</p>
            <fieldset className="space-y-2">
              <legend className="text-[14px] font-bold text-ink">A profissional explicou à cliente:</legend>
              {orientationItems.map((o) => (
                <label key={o.id} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-[12px] border border-line p-3">
                  <input
                    type="checkbox"
                    checked={!!form.orientations[o.id]}
                    onChange={(e) => set("orientations", { ...form.orientations, [o.id]: e.target.checked })}
                    className="mt-0.5 size-5 shrink-0 accent-primary"
                  />
                  <span className="text-[15px] text-ink">{o.text}</span>
                </label>
              ))}
            </fieldset>
            <Field label="Observações finais" multiline max={limits.longText} value={form.finalNotes} onChange={(v) => set("finalNotes", v)} />
            <p className="text-[13px] text-ink-soft">
              Data e profissional do documento: {form.date ? doc.subtitle.replace("Consulta de ", "") : "—"} · {form.professional || "—"} (vêm da fase 1). O
              documento terá espaço para assinatura manual da cliente e da profissional.
            </p>
          </Card>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          {requiredMissing && (
            <Warning tone="error">
              Faltam campos obrigatórios:{" "}
              {[errors.clientName && "nome da cliente", errors.date && "data válida", errors.professional && "profissional responsável", errors.phone && "telefone válido"]
                .filter(Boolean)
                .join(", ")}
              .{" "}
              <button type="button" onClick={() => goTo(1)} className="font-bold underline">
                Corrigir na fase 1
              </button>
            </Warning>
          )}
          {unanswered.length > 0 && (
            <Warning>
              {unanswered.length === 1 ? "1 pergunta não foi respondida" : `${unanswered.length} perguntas não foram respondidas`} (
              {unanswered.map((q) => q.id.slice(1)).join(", ")}). Elas aparecerão como "Não respondida" no documento.
            </Warning>
          )}
          <div className="rounded-card border border-line bg-surface p-4 shadow-soft md:p-8">
            <DocumentView doc={doc} onEdit={goTo} />
          </div>
        </div>
      )}

      {step === 5 && (
        <Card title="Gerar documento">
          {requiredMissing ? (
            <Warning tone="error">
              Preencha os campos obrigatórios antes de gerar o documento.{" "}
              <button type="button" onClick={() => goTo(1)} className="font-bold underline">
                Ir para a fase 1
              </button>
            </Warning>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={generatePdf}
                  disabled={pdfState === "working"}
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-button bg-primary px-5 text-[15px] font-bold text-white shadow-soft hover:bg-primary-hover disabled:opacity-60"
                >
                  {pdfState === "working" ? <LoaderCircle aria-hidden="true" className="size-5 animate-spin" /> : <FileDown aria-hidden="true" className="size-5" />}
                  {pdfState === "working" ? "Gerando PDF…" : "Baixar PDF"}
                </button>
                <button
                  type="button"
                  onClick={() => setPrinting(true)}
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-button border border-primary bg-surface px-5 text-[15px] font-bold text-primary hover:bg-blush"
                >
                  <Printer aria-hidden="true" className="size-5" />
                  Imprimir ficha
                </button>
              </div>
              <p className="text-[13px] text-ink-soft">
                O PDF é gerado no seu próprio aparelho: nenhuma informação da ficha é enviada pela internet. Nome do arquivo:{" "}
                <strong className="text-ink">{pdfFileName(form)}</strong>. No celular, "Imprimir" abre as opções de impressão e
                compartilhamento do navegador.
              </p>
              {pdfState === "done" && (
                <p role="status" className="rounded-[12px] bg-[#F0FBF5] p-3 text-[14px] font-medium text-[#166C47]">
                  PDF gerado. Confira se o arquivo foi salvo antes de limpar a ficha.
                </p>
              )}
              {pdfState === "error" && (
                <Warning tone="error">Não foi possível gerar o PDF neste navegador. Use "Imprimir ficha" e escolha "Salvar como PDF".</Warning>
              )}
              <p className="text-[13px] text-ink-soft">{notices.storageResponsibility}</p>
              <p className="text-[13px] text-ink-soft">{notices.lgpdDetail}</p>
            </>
          )}
        </Card>
      )}

      <div className="flex items-center justify-between gap-2">
        {step > 1 ? (
          <button type="button" onClick={() => goTo(step - 1)} className="inline-flex min-h-11 items-center gap-1.5 rounded-button px-3 text-[14px] font-bold text-primary hover:bg-blush">
            <ArrowLeft aria-hidden="true" className="size-4" />
            Voltar
          </button>
        ) : (
          <span />
        )}
        {step < steps.length && (
          <button type="button" onClick={() => goTo(step + 1, true)} className="inline-flex min-h-11 items-center gap-1.5 rounded-button bg-primary px-4 text-[14px] font-bold text-white hover:bg-primary-hover">
            {step === 3 ? "Revisar" : step === 4 ? "Gerar documento" : "Continuar"}
            <ArrowRight aria-hidden="true" className="size-4" />
          </button>
        )}
      </div>

      <div className="border-t border-line pt-3">
        <button type="button" onClick={clearAll} className="inline-flex min-h-11 items-center gap-1.5 rounded-button px-3 text-[14px] font-bold text-[#AA2841] hover:bg-[#FFF2F3]">
          <RotateCcw aria-hidden="true" className="size-4" />
          Limpar informações e iniciar nova ficha
        </button>
      </div>

      {printing &&
        createPortal(
          <div className="print-only">
            <DocumentView doc={doc} />
          </div>,
          document.body,
        )}
    </div>
  );
}
