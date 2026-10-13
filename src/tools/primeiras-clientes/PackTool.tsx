import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronDown, Copy, CopyPlus, Download, MessageCircle, Plus, RotateCcw, Save, Search, Star, Trash2, Upload } from "lucide-react";
import { Warning } from "../precificacao/ui/fields";
import { categories, type CategoryId, limits, plan, texts } from "./content";
import {
  type AnyMessage,
  allMessages,
  browserStore,
  checkPhone,
  createCustom,
  dateForDay,
  deleteCustom,
  EXPORT_FILE_NAME,
  exportState,
  type Filter,
  importState,
  isProfileToken,
  loadState,
  MESSAGE_TOKENS,
  type MessageToken,
  type MessageValues,
  type PackState,
  planProgress,
  type Profile,
  profileServices,
  removeToken,
  resetPlan,
  resolveText,
  restoreOriginal,
  saveState,
  saveVersion,
  searchMessages,
  setDayNote,
  setStartDate,
  toggleDay,
  toggleFavorite,
  tokenLabel,
  tokensIn,
  tokenValues,
  unresolved,
  updateCustom,
  whatsappUrl,
} from "./state";

type Tab = "mensagens" | "plano" | "perfil";
type Update = (fn: (s: PackState) => PackState) => void;

const inputClass =
  "w-full rounded-[10px] border border-[#B7A7AF] bg-surface px-3 py-2.5 text-[16px] text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary-light";
const btn = "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-button px-3.5 text-[14px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-45";
const btnPrimary = `${btn} bg-primary text-white hover:bg-primary-hover`;
const btnOutline = `${btn} border border-primary bg-surface text-primary hover:bg-blush`;
const btnGhost = `${btn} text-primary hover:bg-blush`;
const catLabel = (id: CategoryId) => categories.find((c) => c.id === id)?.label ?? "";

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-card border border-line bg-surface p-4 shadow-soft md:p-5 ${className}`}>{children}</section>;
}

/* -------------------------------------------------------------------------- */
/* Editor de mensagem                                                         */
/* -------------------------------------------------------------------------- */

function VariableInput({ token, value, onChange, services }: { token: MessageToken; value: string; onChange: (v: string) => void; services: string[] }) {
  const id = useId();
  const type = token === "[DATA]" ? "date" : token === "[HORARIO]" ? "time" : "text";
  return (
    <div className={token === "[INFORMACOES_ADICIONAIS]" ? "sm:col-span-2" : ""}>
      <label htmlFor={id} className="text-[13px] font-bold text-ink">
        {MESSAGE_TOKENS[token]}
      </label>
      {token === "[INFORMACOES_ADICIONAIS]" ? (
        <textarea id={id} rows={2} maxLength={limits.variable} value={value} onChange={(e) => onChange(e.target.value)} autoComplete="off" className={`${inputClass} mt-1 resize-y`} />
      ) : (
        <input
          id={id}
          type={type}
          maxLength={limits.variable}
          list={token === "[SERVICO]" ? `${id}-list` : undefined}
          placeholder={token === "[VALOR]" ? "Ex.: 150" : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          className={`${inputClass} mt-1 min-h-11`}
        />
      )}
      {token === "[SERVICO]" && (
        <datalist id={`${id}-list`}>
          {services.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      )}
    </div>
  );
}

function MessageEditor({ message, state, update, onBack, onSelect, onOpenProfile }: {
  message: AnyMessage | null;
  state: PackState;
  update: Update;
  onBack: () => void;
  onSelect: (id: string) => void;
  onOpenProfile: () => void;
}) {
  const isNew = message === null;
  const [title, setTitle] = useState(message?.title ?? "");
  const [category, setCategory] = useState<CategoryId>(message?.category ?? "apresentacao");
  const [draft, setDraft] = useState(message?.text ?? "");
  // Variáveis desta mensagem: só na memória, nunca salvas
  const [values, setValues] = useState<MessageValues>({});
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const textId = useId();

  const all = tokenValues(state.profile, values);
  const finalText = resolveText(draft, all).trim();
  const pending = unresolved(draft, all);
  const messageTokens = tokensIn(draft).filter((t): t is MessageToken => !isProfileToken(t));
  const changed = message ? draft !== message.text || (message.custom && (title !== message.title || category !== message.category)) : true;
  const phoneCheck = phone.trim() ? checkPhone(phone) : null;
  const ready = !!finalText && pending.length === 0;
  const favorite = message ? state.favorites.includes(message.id) : false;

  function save() {
    if (!draft.trim()) return setStatus({ kind: "error", text: "O texto não pode ficar vazio." });
    if (message?.custom || isNew) {
      if (!title.trim()) return setStatus({ kind: "error", text: "Dê um título para a mensagem." });
      if (isNew) {
        const { state: next, id } = createCustom(state, { title, category, text: draft });
        if (!id) return setStatus({ kind: "error", text: `Não foi possível criar (limite de ${limits.customMessages} mensagens próprias).` });
        update(() => next);
        onSelect(id);
        return;
      }
      update((s) => updateCustom(s, message!.id, { title, category, text: draft }));
    } else {
      update((s) => saveVersion(s, message!.id, draft));
    }
    setStatus({ kind: "ok", text: "Alterações salvas neste navegador." });
  }

  function restore() {
    if (!message || message.custom) return;
    if (!window.confirm("Voltar ao texto original desta mensagem? Sua versão personalizada será descartada.")) return;
    update((s) => restoreOriginal(s, message.id));
    setStatus({ kind: "ok", text: "Texto original restaurado." });
  }

  function duplicate() {
    const { state: next, id } = createCustom(state, { title: `${title || message?.title} (cópia)`, category, text: draft });
    if (!id) return setStatus({ kind: "error", text: `Limite de ${limits.customMessages} mensagens próprias atingido.` });
    update(() => next);
    onSelect(id);
  }

  function remove() {
    if (!message?.custom || !window.confirm(`Excluir a mensagem "${message.title}"?`)) return;
    update((s) => deleteCustom(s, message.id));
    onBack();
  }

  async function copy() {
    if (!ready) return;
    const ok = await copyText(finalText);
    setStatus(ok ? { kind: "ok", text: "Mensagem copiada. Cole na conversa e revise antes de enviar." } : { kind: "error", text: "Não foi possível copiar. Selecione o texto da prévia e copie manualmente." });
  }

  function openWhatsapp() {
    if (!ready) return;
    if (phoneCheck && !phoneCheck.ok) return setStatus({ kind: "error", text: phoneCheck.error });
    const win = window.open(whatsappUrl(finalText, phoneCheck?.ok ? phoneCheck.digits : undefined), "_blank");
    if (win) win.opener = null;
    setStatus({
      kind: "ok",
      text: phoneCheck?.ok
        ? "O WhatsApp foi aberto com a mensagem preparada. Revise e toque em enviar lá: nada é enviado automaticamente."
        : "O WhatsApp foi aberto com a mensagem preparada. Escolha a conversa, revise e envie: nada é enviado automaticamente.",
    });
  }

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-1.5 text-[14px] font-bold text-primary hover:underline lg:hidden">
        <ArrowLeft aria-hidden="true" className="size-4" /> Voltar às mensagens
      </button>

      <Card>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[12px] font-bold tracking-[0.08em] text-primary uppercase">
              {isNew ? "Nova mensagem" : message.custom ? `Minha mensagem · ${catLabel(message.category)}` : `${message.id.replace("msg_", "Mensagem ")} · ${catLabel(message.category)}`}
            </p>
            {!message || message.custom ? null : <h3 className="text-[19px] font-bold text-ink">{message.title}</h3>}
          </div>
          {message && (
            <button
              type="button"
              onClick={() => update((s) => toggleFavorite(s, message.id))}
              aria-pressed={favorite}
              aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              className={`${btn} shrink-0 ${favorite ? "text-[#967445]" : "text-ink-soft hover:bg-blush"}`}
            >
              <Star aria-hidden="true" className="size-5" fill={favorite ? "currentColor" : "none"} />
              <span className="hidden sm:inline">{favorite ? "Favorita" : "Favoritar"}</span>
            </button>
          )}
        </div>

        {message && !message.custom && (
          <div className="mt-2 space-y-1 text-[13px] text-ink-soft">
            <p>
              <strong className="text-ink">Finalidade:</strong> {message.purpose}
            </p>
            <p>
              <strong className="text-ink">Como usar:</strong> {message.guidance}
            </p>
          </div>
        )}

        {(isNew || message?.custom) && (
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_220px]">
            <div>
              <label htmlFor={`${textId}-t`} className="text-[13px] font-bold text-ink">
                Título
              </label>
              <input id={`${textId}-t`} maxLength={limits.title} value={title} onChange={(e) => setTitle(e.target.value)} className={`${inputClass} mt-1 min-h-11`} />
            </div>
            <div>
              <label htmlFor={`${textId}-c`} className="text-[13px] font-bold text-ink">
                Categoria
              </label>
              <select id={`${textId}-c`} value={category} onChange={(e) => setCategory(e.target.value as CategoryId)} className={`${inputClass} mt-1 min-h-11`}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="mt-3">
          <label htmlFor={textId} className="text-[13px] font-bold text-ink">
            Texto da mensagem
          </label>
          <textarea id={textId} rows={6} maxLength={limits.messageText} value={draft} onChange={(e) => { setDraft(e.target.value); setStatus(null); }} className={`${inputClass} mt-1 resize-y`} />
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[12px] text-ink-soft">
            <span>
              Variáveis disponíveis: [NOME_CLIENTE], [SERVICO], [DATA], [HORARIO], [VALOR], [INFORMACOES_ADICIONAIS] e as do perfil. Use-as em vez de escrever nomes ou telefones.
            </span>
            <span>
              {draft.length}/{limits.messageText}
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <button type="button" onClick={save} disabled={!changed} className={btnOutline}>
            <Save aria-hidden="true" className="size-4" /> {isNew ? "Criar mensagem" : message?.custom ? "Salvar alterações" : "Salvar minha versão"}
          </button>
          {message && !message.custom && (
            <button type="button" onClick={restore} disabled={!state.versions[message.id]} className={btnGhost}>
              <RotateCcw aria-hidden="true" className="size-4" /> Restaurar original
            </button>
          )}
          {message && (
            <button type="button" onClick={duplicate} className={btnGhost}>
              <CopyPlus aria-hidden="true" className="size-4" /> {message.custom ? "Duplicar" : "Criar mensagem própria a partir desta"}
            </button>
          )}
          {message?.custom && (
            <button type="button" onClick={remove} className={`${btn} text-[#AA2841] hover:bg-[#FFF2F3]`}>
              <Trash2 aria-hidden="true" className="size-4" /> Excluir
            </button>
          )}
        </div>
        {changed && message && <p className="mt-1 text-[12px] text-[#87510D]">Há alterações no texto que ainda não foram salvas.</p>}
      </Card>

      {!isNew && (
        <Card>
          <h4 className="text-[16px] font-bold text-ink">Personalizar para enviar</h4>
          {messageTokens.length > 0 && (
            <>
              <p className="mt-1 text-[13px] text-ink-soft">Estes dados servem só para esta mensagem e não são salvos.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {messageTokens.map((t) => (
                  <VariableInput key={t} token={t} value={values[t] ?? ""} onChange={(v) => setValues((cur) => ({ ...cur, [t]: v }))} services={profileServices(state.profile)} />
                ))}
              </div>
            </>
          )}

          {pending.length > 0 && (
            <div role="alert" className="mt-3 space-y-1.5 rounded-[12px] bg-[#FFFAEB] p-3 text-[13px] text-[#87510D]">
              <p className="font-bold">Falta preencher antes de copiar ou abrir no WhatsApp:</p>
              {pending.map((t) => (
                <div key={t} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>{tokenLabel(t)}</span>
                  {isProfileToken(t) && (
                    <button type="button" onClick={onOpenProfile} className="font-bold underline">
                      Preencher no perfil
                    </button>
                  )}
                  <button type="button" onClick={() => setDraft((d) => removeToken(d, t))} className="font-bold underline">
                    Remover este trecho
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 rounded-[12px] border border-line bg-[#FCFAFB] p-3">
            <p className="text-[12px] font-bold tracking-[0.06em] text-ink-soft uppercase">Prévia da mensagem final</p>
            <p className="mt-1 text-[15px] break-words whitespace-pre-wrap text-ink" data-testid="final-text">
              {finalText || "—"}
            </p>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
            <div>
              <label htmlFor={`${textId}-p`} className="text-[13px] font-bold text-ink">
                Número de destino <span className="font-normal text-ink-soft">(opcional, não é salvo)</span>
              </label>
              <input
                id={`${textId}-p`}
                type="tel"
                inputMode="tel"
                autoComplete="off"
                placeholder="+55 11 98765-4321"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`${inputClass} mt-1 min-h-11 ${phoneCheck && !phoneCheck.ok ? "border-error" : ""}`}
              />
              {phoneCheck && !phoneCheck.ok && <p className="mt-1 text-[12px] font-medium text-error">{phoneCheck.error}</p>}
              {!phone.trim() && <p className="mt-1 text-[12px] text-ink-soft">Sem número, o WhatsApp pede para você escolher a conversa.</p>}
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={copy} disabled={!ready} className={btnOutline}>
              <Copy aria-hidden="true" className="size-4" /> Copiar mensagem
            </button>
            <button type="button" onClick={openWhatsapp} disabled={!ready || (phoneCheck !== null && !phoneCheck.ok)} className={btnPrimary}>
              <MessageCircle aria-hidden="true" className="size-4" /> Abrir no WhatsApp
            </button>
          </div>
          <p className="mt-2 text-[12px] text-ink-soft">{texts.usage}</p>
        </Card>
      )}

      {status && (
        <p role="status" className={`rounded-[12px] p-3 text-[14px] font-medium ${status.kind === "ok" ? "bg-[#F0FBF5] text-[#166C47]" : "bg-[#FFF2F3] text-[#AA2841]"}`}>
          {status.text}
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Lista de mensagens                                                         */
/* -------------------------------------------------------------------------- */

function MessagesTab({ state, update, selected, setSelected, onOpenProfile }: {
  state: PackState;
  update: Update;
  selected: string | null;
  setSelected: (id: string | null) => void;
  onOpenProfile: () => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("todas");
  const [category, setCategory] = useState<CategoryId | "">("");
  const results = useMemo(() => searchMessages(state, query, filter, category), [state, query, filter, category]);
  const all = allMessages(state);
  const current = selected && selected !== "new" ? all.find((m) => m.id === selected) ?? null : null;
  const editing = selected === "new" || !!current;

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)] [&>*]:min-w-0">
      <div className={`space-y-3 ${editing ? "hidden lg:block" : ""}`}>
        <label className="relative block">
          <span className="sr-only">Pesquisar mensagens</span>
          <Search aria-hidden="true" className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar por palavra ou título" className={`${inputClass} min-h-11 pl-9`} />
        </label>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Filtro">
          {([["todas", "Todas"], ["favoritas", "Favoritas"], ["minhas", "Criadas por mim"]] as [Filter, string][]).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={filter === id}
              onClick={() => setFilter(id)}
              className={`min-h-10 rounded-full border px-3 text-[13px] font-bold ${filter === id ? "border-primary bg-primary text-white" : "border-line bg-surface text-ink-soft"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <select aria-label="Categoria" value={category} onChange={(e) => setCategory(e.target.value as CategoryId | "")} className={`${inputClass} min-h-11`}>
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => setSelected("new")} className={`${btnOutline} w-full`}>
          <Plus aria-hidden="true" className="size-4" /> Criar mensagem própria
        </button>
        <p className="text-[13px] text-ink-soft">{results.length} mensagem(ns)</p>
        <ul className="space-y-2" data-testid="message-list">
          {results.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => setSelected(m.id)}
                aria-current={selected === m.id ? "true" : undefined}
                className={`w-full rounded-[12px] border p-3 text-left transition-colors ${selected === m.id ? "border-primary bg-blush" : "border-line bg-surface hover:border-primary-light"}`}
              >
                <span className="flex items-center gap-1.5 text-[14px] font-bold text-ink">
                  {state.favorites.includes(m.id) && <Star aria-label="Favorita" className="size-3.5 text-[#967445]" fill="currentColor" />}
                  {m.title}
                  {!m.custom && state.versions[m.id] && <span className="rounded-full bg-primary-light/60 px-1.5 text-[10px] font-bold text-primary">EDITADA</span>}
                  {m.custom && <span className="rounded-full bg-[#FBF5E9] px-1.5 text-[10px] font-bold text-[#967445]">MINHA</span>}
                </span>
                <span className="mt-0.5 block text-[12px] text-ink-soft">{catLabel(m.category)}</span>
                <span className="mt-1 line-clamp-2 block text-[13px] text-ink-soft">{m.text}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className={editing ? "" : "hidden lg:block"}>
        {editing ? (
          <MessageEditor
            key={selected === "new" ? "new" : `${current!.id}:${current!.text}:${current!.title}`}
            message={current}
            state={state}
            update={update}
            onBack={() => setSelected(null)}
            onSelect={setSelected}
            onOpenProfile={onOpenProfile}
          />
        ) : (
          <Card>
            <p className="text-[15px] text-ink">Escolha uma mensagem na lista para personalizar, copiar ou abrir no WhatsApp.</p>
            <p className="mt-2 text-[13px] text-ink-soft">{texts.noPromise}</p>
          </Card>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Planejamento de 30 dias                                                    */
/* -------------------------------------------------------------------------- */

function PlanTab({ state, update, goToMessage }: { state: PackState; update: Update; goToMessage: (id: string) => void }) {
  const progress = planProgress(state);
  const [open, setOpen] = useState<number | null>(() => plan.find((d) => !state.plan.completed.includes(d.day))?.day ?? null);
  const dateId = useId();

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[15px] font-bold text-ink">
            {progress.done} de {progress.total} atividades concluídas
          </p>
          <p className="text-[28px] leading-none font-bold text-primary tabular-nums">{progress.percent}%</p>
        </div>
        <div role="progressbar" aria-label="Progresso do planejamento" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent} className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#F7F3F5]">
          <div className={`h-full rounded-full transition-[width] ${progress.percent === 100 ? "bg-success" : "bg-primary"}`} style={{ width: `${progress.percent}%` }} />
        </div>
        {progress.done === progress.total && (
          <p role="status" className="mt-3 rounded-[12px] bg-[#F0FBF5] p-3 text-[14px] font-medium text-[#166C47]">
            {texts.planDone}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor={dateId} className="text-[13px] font-bold text-ink">
              Data de início <span className="font-normal text-ink-soft">(opcional)</span>
            </label>
            <input id={dateId} type="date" value={state.plan.startDate ?? ""} onChange={(e) => update((s) => setStartDate(s, e.target.value || null))} className={`${inputClass} mt-1 min-h-11`} />
          </div>
          <p className="max-w-[420px] pb-1 text-[12px] text-ink-soft">
            É uma sequência, não um calendário rígido: faça as atividades no seu ritmo e em qualquer ordem. A data só ajuda a se organizar.
          </p>
        </div>
      </Card>

      <ol className="space-y-2">
        {plan.map((d) => {
          const done = state.plan.completed.includes(d.day);
          const expanded = open === d.day;
          const date = dateForDay(state.plan.startDate, d.day);
          return (
            <li key={d.day} className={`rounded-[14px] border ${done ? "border-success/25 bg-[#F0FBF5]" : "border-line bg-surface"}`} data-day={d.day}>
              <div className="flex items-center gap-2 p-2 pl-3">
                <label className="flex min-h-11 items-center">
                  <span className="sr-only">Concluir dia {d.day}</span>
                  <input type="checkbox" checked={done} onChange={() => update((s) => toggleDay(s, d.day))} className="size-5 cursor-pointer accent-[#166C47]" />
                </label>
                <button type="button" onClick={() => setOpen(expanded ? null : d.day)} aria-expanded={expanded} className="flex min-h-11 flex-1 items-center justify-between gap-2 text-left">
                  <span className="min-w-0">
                    <span className="text-[12px] font-bold tracking-[0.06em] text-primary">
                      DIA {d.day}
                      {date && <span className="font-medium text-ink-soft"> · {date}</span>}
                    </span>
                    <span className={`block text-[15px] font-bold ${done ? "text-ink-soft" : "text-ink"}`}>{d.objective}</span>
                  </span>
                  <ChevronDown aria-hidden="true" className={`size-5 shrink-0 text-ink-soft transition-transform ${expanded ? "rotate-180" : ""}`} />
                </button>
              </div>
              {expanded && (
                <div className="space-y-3 border-t border-line px-4 pt-3 pb-4">
                  <p className="text-[14px] text-ink">
                    <strong>Atividade:</strong> {d.activity}
                  </p>
                  <p className="text-[14px] text-ink-soft">
                    <strong className="text-ink">Sugestão:</strong> {d.suggestion}
                  </p>
                  {d.links && (
                    <div className="flex flex-wrap gap-1.5">
                      {d.links.map((l) =>
                        l.messageId ? (
                          <button key={l.label} type="button" onClick={() => goToMessage(l.messageId!)} className={btnOutline}>
                            {l.label}
                          </button>
                        ) : (
                          <a key={l.label} href={l.href} className={btnOutline}>
                            {l.label}
                          </a>
                        ),
                      )}
                    </div>
                  )}
                  <div>
                    <label htmlFor={`${dateId}-n${d.day}`} className="text-[13px] font-bold text-ink">
                      Minhas anotações
                    </label>
                    <textarea
                      id={`${dateId}-n${d.day}`}
                      rows={3}
                      maxLength={limits.note}
                      value={state.plan.notes[d.day] ?? ""}
                      onChange={(e) => update((s) => setDayNote(s, d.day, e.target.value))}
                      className={`${inputClass} mt-1 resize-y`}
                    />
                  </div>
                  <button type="button" onClick={() => update((s) => toggleDay(s, d.day))} className={done ? btnGhost : btnPrimary}>
                    <Check aria-hidden="true" className="size-4" /> {done ? "Desmarcar atividade" : "Marcar como concluída"}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        onClick={() => window.confirm("Reiniciar o planejamento? As marcações e anotações das 30 atividades serão apagadas.") && update(resetPlan)}
        className={`${btn} text-[#AA2841] hover:bg-[#FFF2F3]`}
      >
        <RotateCcw aria-hidden="true" className="size-4" /> Reiniciar planejamento
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Perfil                                                                     */
/* -------------------------------------------------------------------------- */

function ProfileTab({ profile, onChange }: { profile: Profile; onChange: (p: Profile) => void }) {
  const base = useId();
  const field = (key: keyof Profile, label: string, max: number, token?: string, placeholder?: string, multiline = false) => (
    <div className={multiline ? "md:col-span-2" : ""}>
      <label htmlFor={`${base}-${key}`} className="text-[14px] font-bold text-ink">
        {label} <span className="font-normal text-ink-soft">(opcional)</span>
      </label>
      {token && <p className="text-[12px] text-ink-soft">Usado em {token}</p>}
      {multiline ? (
        <textarea id={`${base}-${key}`} rows={3} maxLength={max} value={profile[key]} onChange={(e) => onChange({ ...profile, [key]: e.target.value })} className={`${inputClass} mt-1 resize-y`} />
      ) : (
        <input id={`${base}-${key}`} maxLength={max} placeholder={placeholder} value={profile[key]} onChange={(e) => onChange({ ...profile, [key]: e.target.value })} className={`${inputClass} mt-1 min-h-11`} />
      )}
    </div>
  );
  return (
    <Card>
      <p className="text-[14px] text-ink-soft">Seus dados profissionais preenchem as mensagens automaticamente. Ficam salvos neste navegador assim que você digita.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {field("professionalName", "Nome profissional", 80, "[NOME_PROFISSIONAL]")}
        {field("studioName", "Nome do estúdio", 80, "[NOME_ESTUDIO]")}
        {field("instagram", "Instagram profissional", 80, "[INSTAGRAM]", "@seuperfil")}
        {field("whatsapp", "WhatsApp comercial", 40, "[WHATSAPP]", "(11) 90000-0000")}
        {field("city", "Cidade de atuação", 60, "[CIDADE]")}
        {field("bookingLink", "Link de agendamento", 200, "[LINK_AGENDAMENTO]", "https://…")}
        {field("services", "Serviços disponíveis (um por linha)", 1000, "sugestões do campo Serviço", undefined, true)}
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Ferramenta                                                                 */
/* -------------------------------------------------------------------------- */

/** Pack Primeiras Clientes (Ferramentas → Pack Primeiras Clientes). */
export function PackTool() {
  const [store] = useState(browserStore);
  const [initial] = useState(() => loadState(store));
  const [state, setState] = useState<PackState>(initial.state);
  const [tab, setTab] = useState<Tab>("mensagens");
  const [selected, setSelected] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [message, setMessage] = useState("");
  const lastSaved = useRef(JSON.stringify(initial.state));
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const serialized = JSON.stringify(state);
    if (serialized === lastSaved.current || !store) return;
    const ok = saveState(store, state);
    setSaveFailed(!ok);
    if (ok) lastSaved.current = serialized;
  }, [state, store]);

  const update: Update = (fn) => setState((s) => fn(s));

  function exportFile() {
    const url = URL.createObjectURL(new Blob([exportState(state)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = EXPORT_FILE_NAME;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    setMessage("Backup salvo. Guarde o arquivo em um lugar seguro.");
  }

  async function importFile(file: File) {
    try {
      const restored = importState(await file.text(), file.size);
      if (!window.confirm("Restaurar este backup? Perfil, favoritos, mensagens próprias e progresso deste navegador serão substituídos.")) return;
      setState(restored);
      setSelected(null);
      setMessage("Backup restaurado.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Não foi possível ler o arquivo.");
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "mensagens", label: "Mensagens (30)" },
    { id: "plano", label: `Planejamento 30 dias (${planProgress(state).percent}%)` },
    { id: "perfil", label: "Meu perfil" },
  ];

  return (
    <div className="space-y-4">
      {initial.status === "unavailable" && (
        <Warning tone="error">Este navegador não está permitindo salvar (por exemplo, em aba anônima). Use "Exportar meu progresso" antes de sair.</Warning>
      )}
      {initial.status === "corrupt" && <Warning>Não foi possível ler os dados salvos neste navegador. Se tiver um backup, use "Importar meu progresso".</Warning>}
      {saveFailed && initial.status !== "unavailable" && <Warning tone="error">Não foi possível salvar a última alteração. Exporte seu progresso para não perder nada.</Warning>}

      <nav aria-label="Pack Primeiras Clientes" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <div className="flex gap-1.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-current={tab === t.id ? "page" : undefined}
              onClick={() => setTab(t.id)}
              className={`min-h-11 shrink-0 rounded-[12px] px-3.5 text-[14px] font-bold ${tab === t.id ? "bg-primary text-white" : "bg-surface text-ink-soft shadow-soft hover:text-primary"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {tab === "mensagens" && <MessagesTab state={state} update={update} selected={selected} setSelected={setSelected} onOpenProfile={() => setTab("perfil")} />}
      {tab === "plano" && (
        <PlanTab
          state={state}
          update={update}
          goToMessage={(id) => {
            setSelected(id);
            setTab("mensagens");
          }}
        />
      )}
      {tab === "perfil" && <ProfileTab profile={state.profile} onChange={(profile) => update((s) => ({ ...s, profile, updatedAt: new Date().toISOString() }))} />}

      <section className="rounded-card border border-dashed border-[#DCCFD5] p-4 text-[14px] text-ink-soft">
        <p>{texts.storage}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          <button type="button" onClick={exportFile} className={btnGhost}>
            <Download aria-hidden="true" className="size-4" /> Exportar meu progresso
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className={btnGhost}>
            <Upload aria-hidden="true" className="size-4" /> Importar meu progresso
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            data-testid="import-input"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importFile(file);
              e.target.value = "";
            }}
          />
        </div>
        {message && (
          <p role="status" className="mt-1 font-medium text-ink">
            {message}
          </p>
        )}
      </section>
    </div>
  );
}
