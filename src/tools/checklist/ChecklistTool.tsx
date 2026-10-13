import { type FormEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Download, Pencil, RotateCcw, Trash2, Upload } from "lucide-react";
import { Help, SmallButton, Warning } from "../precificacao/ui/fields";
import { disclaimer, limits, resetWarning, type Stage, stages, storageNotice } from "./content";
import {
  addCustomTask,
  addNote,
  browserStore,
  type ChecklistState,
  createEmptyState,
  type CustomTask,
  editCustomTask,
  editNote,
  EXPORT_FILE_NAME,
  exportState,
  importState,
  isStageComplete,
  loadState,
  type Note,
  overallProgress,
  type Progress,
  recommendation,
  removeCustomTask,
  removeNote,
  saveState,
  stageProgress,
  toggleCustomTask,
  toggleFixedTask,
  visitStage,
} from "./state";

const shortDate = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
const fmtDate = (iso?: string) => (iso ? shortDate.format(new Date(iso)) : "");

function ProgressBar({ progress, label, size = "md" }: { progress: Progress; label: string; size?: "sm" | "md" }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress.percent}
      className={`overflow-hidden rounded-full bg-[#F7F3F5] ${size === "sm" ? "h-1.5" : "h-2.5"}`}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-300 ${progress.percent === 100 ? "bg-success" : "bg-primary"}`}
        style={{ width: `${progress.percent}%` }}
      />
    </div>
  );
}

/** Linha de tarefa com caixa de marcação nativa (área de toque inteira). */
function TaskRow({ checked, onToggle, children, meta, actions }: {
  checked: boolean;
  onToggle: () => void;
  children: string;
  meta?: string;
  actions?: ReactNode;
}) {
  const id = useId();
  return (
    <li className={`flex items-start gap-1 rounded-[12px] border transition-colors ${checked ? "border-success/25 bg-[#F0FBF5]" : "border-line bg-surface"}`}>
      <label htmlFor={id} className="flex min-h-12 flex-1 cursor-pointer items-start gap-3 py-3 pl-3.5">
        <input id={id} type="checkbox" checked={checked} onChange={onToggle} className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[#166C47]" />
        <span className="min-w-0">
          <span className={`block text-[15px] leading-snug ${checked ? "text-ink-soft" : "text-ink"}`}>{children}</span>
          {meta && <span className="mt-0.5 block text-[12px] text-[#6C5E66]">{meta}</span>}
        </span>
      </label>
      {actions && <div className="flex shrink-0 py-0.5 pr-1">{actions}</div>}
    </li>
  );
}

function TextForm({ initial = "", max, placeholder, submitLabel, multiline, onSubmit, onCancel, label }: {
  initial?: string;
  max: number;
  placeholder: string;
  submitLabel: string;
  multiline?: boolean;
  onSubmit: (text: string) => void;
  onCancel?: () => void;
  label: string;
}) {
  const id = useId();
  const [text, setText] = useState(initial);
  const empty = !text.trim();

  function submit(event: FormEvent) {
    event.preventDefault();
    if (empty) return;
    onSubmit(text);
    if (!onCancel) setText("");
  }

  const fieldClass =
    "w-full rounded-[10px] border border-[#B7A7AF] bg-surface px-3 py-2.5 text-[16px] text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary-light";
  return (
    <form onSubmit={submit} className="space-y-2">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      {multiline ? (
        <textarea id={id} rows={3} maxLength={max} value={text} placeholder={placeholder} onChange={(e) => setText(e.target.value)} className={`${fieldClass} resize-y`} />
      ) : (
        <input id={id} maxLength={max} value={text} placeholder={placeholder} onChange={(e) => setText(e.target.value)} className={`${fieldClass} min-h-11`} />
      )}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] text-[#6C5E66]">
          {text.length}/{max}
        </span>
        <div className="flex gap-1">
          {onCancel && (
            <SmallButton onClick={onCancel}>Cancelar</SmallButton>
          )}
          <button
            type="submit"
            disabled={empty}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-button bg-primary px-4 text-[14px] font-bold text-white hover:bg-primary-hover disabled:opacity-40"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

function CustomTaskRow({ task, onToggle, onEdit, onRemove }: {
  task: CustomTask;
  onToggle: () => void;
  onEdit: (text: string) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <li className="rounded-[12px] border border-primary-light bg-blush p-3">
        <TextForm
          label="Editar tarefa"
          initial={task.text}
          max={limits.taskText}
          placeholder="Texto da tarefa"
          submitLabel="Salvar"
          onSubmit={(text) => { onEdit(text); setEditing(false); }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }
  return (
    <TaskRow
      checked={task.completed}
      onToggle={onToggle}
      meta={`Minha tarefa · criada em ${fmtDate(task.createdAt)}`}
      actions={
        <>
          <SmallButton label="Editar tarefa" onClick={() => setEditing(true)}>
            <Pencil aria-hidden="true" className="size-4" />
          </SmallButton>
          <SmallButton tone="danger" label="Excluir tarefa" onClick={onRemove}>
            <Trash2 aria-hidden="true" className="size-4" />
          </SmallButton>
        </>
      }
    >
      {task.text}
    </TaskRow>
  );
}

function NoteCard({ note, onEdit, onRemove }: { note: Note; onEdit: (text: string) => void; onRemove: () => void }) {
  const [editing, setEditing] = useState(false);
  return (
    <li className="rounded-[12px] border border-line bg-[#FFFDF8] p-3">
      {editing ? (
        <TextForm
          label="Editar anotação"
          multiline
          initial={note.text}
          max={limits.noteText}
          placeholder="Sua anotação"
          submitLabel="Salvar"
          onSubmit={(text) => { onEdit(text); setEditing(false); }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <>
          {/* Texto puro: o React escapa o conteúdo, nada é interpretado como HTML */}
          <p className="text-[15px] break-words whitespace-pre-wrap text-ink">{note.text}</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="text-[12px] text-[#6C5E66]">Atualizada em {fmtDate(note.updatedAt)}</span>
            <div className="flex">
              <SmallButton label="Editar anotação" onClick={() => setEditing(true)}>
                <Pencil aria-hidden="true" className="size-4" />
              </SmallButton>
              <SmallButton tone="danger" label="Excluir anotação" onClick={onRemove}>
                <Trash2 aria-hidden="true" className="size-4" />
              </SmallButton>
            </div>
          </div>
        </>
      )}
    </li>
  );
}

function StagePanel({ stage, state, update }: { stage: Stage; state: ChecklistState; update: (fn: (s: ChecklistState) => ChecklistState) => void }) {
  const progress = stageProgress(state, stage.id);
  const custom = state.customTasks.filter((t) => t.stageId === stage.id);
  const notes = state.notes[stage.id] ?? [];
  const complete = isStageComplete(state, stage.id);

  return (
    <section aria-labelledby={`etapa-${stage.id}`} className="rounded-card border border-line bg-surface p-4 shadow-soft md:p-6">
      <p className="text-[12px] font-bold tracking-[0.14em] text-primary">ETAPA {stage.id} DE {stages.length}</p>
      <h3 id={`etapa-${stage.id}`} className="mt-0.5 font-display text-[28px] leading-tight font-semibold text-[#301827]">
        {stage.title}
      </h3>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex-1">
          <ProgressBar progress={progress} label={`Progresso da etapa ${stage.id}`} />
        </div>
        <span className="text-[14px] font-bold text-ink tabular-nums">
          {progress.done}/{progress.total} · {progress.percent}%
        </span>
      </div>

      {complete && (
        <div role="status" className="mt-4 flex gap-2.5 rounded-[12px] bg-[#F0FBF5] p-3.5 text-[14px] font-medium text-[#166C47]">
          <Check aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <p>{stage.doneMessage}</p>
        </div>
      )}

      <ul className="mt-4 space-y-2">
        {stage.tasks.map((task) => {
          const done = state.completedTaskIds.includes(task.id);
          const changed = state.taskUpdatedAt[task.id];
          return (
            <TaskRow
              key={task.id}
              checked={done}
              onToggle={() => update((s) => toggleFixedTask(s, task.id))}
              meta={done && changed ? `Concluída em ${fmtDate(changed)}` : undefined}
            >
              {task.title}
            </TaskRow>
          );
        })}
        {custom.map((task) => (
          <CustomTaskRow
            key={task.id}
            task={task}
            onToggle={() => update((s) => toggleCustomTask(s, task.id))}
            onEdit={(text) => update((s) => editCustomTask(s, task.id, text))}
            onRemove={() => window.confirm(`Excluir a tarefa "${task.text}"?`) && update((s) => removeCustomTask(s, task.id))}
          />
        ))}
      </ul>

      <div className="mt-4">
        <h4 className="text-[14px] font-bold text-ink">Adicionar uma tarefa sua</h4>
        <div className="mt-2">
          {custom.length >= limits.customTasksPerStage ? (
            <p className="text-[13px] text-ink-soft">Você chegou ao limite de {limits.customTasksPerStage} tarefas nesta etapa.</p>
          ) : (
            <TextForm
              label={`Nova tarefa na etapa ${stage.id}`}
              max={limits.taskText}
              placeholder="Ex.: Comparar dois cursos presenciais"
              submitLabel="Adicionar"
              onSubmit={(text) => update((s) => addCustomTask(s, stage.id, text))}
            />
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <h4 className="text-[16px] font-bold text-ink">Minhas anotações desta etapa</h4>
        <div className="mt-1">
          <Help>Dúvidas, cursos para comparar, metas de estudo, ideias… Não registre dados pessoais de clientes.</Help>
        </div>
        {notes.length > 0 && (
          <ul className="mt-3 space-y-2">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={(text) => update((s) => editNote(s, stage.id, note.id, text))}
                onRemove={() => window.confirm("Excluir esta anotação?") && update((s) => removeNote(s, stage.id, note.id))}
              />
            ))}
          </ul>
        )}
        <div className="mt-3">
          {notes.length >= limits.notesPerStage ? (
            <p className="text-[13px] text-ink-soft">Você chegou ao limite de {limits.notesPerStage} anotações nesta etapa.</p>
          ) : (
            <TextForm
              label={`Nova anotação na etapa ${stage.id}`}
              multiline
              max={limits.noteText}
              placeholder="Escreva sua anotação…"
              submitLabel="Salvar anotação"
              onSubmit={(text) => update((s) => addNote(s, stage.id, text))}
            />
          )}
        </div>
      </div>
    </section>
  );
}

/** Checklist da Lash Iniciante (Ferramentas → Checklist). */
export function ChecklistTool() {
  const [store] = useState(browserStore);
  // Leitura inicial síncrona: o estado só existe depois de ler o que estava salvo,
  // então nunca sobrescreve o progresso com valores padrão.
  const [initial] = useState(() => loadState(store));
  const [state, setState] = useState<ChecklistState>(initial.state);
  const [saveFailed, setSaveFailed] = useState(false);
  const [message, setMessage] = useState("");
  // Só grava depois da primeira alteração real (abrir a ferramenta não escreve nada)
  const lastSaved = useRef(JSON.stringify(initial.state));
  const fileRef = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // Salva só quando algo mudou de verdade (evita gravações desnecessárias)
  useEffect(() => {
    const serialized = JSON.stringify(state);
    if (serialized === lastSaved.current) return;
    if (!store) return;
    const ok = saveState(store, state);
    setSaveFailed(!ok);
    if (ok) lastSaved.current = serialized;
  }, [state, store]);

  const update = (fn: (s: ChecklistState) => ChecklistState) => setState(fn);

  const stage = stages.find((s) => s.id === state.lastVisitedStage) ?? stages[0];
  const overall = overallProgress(state);
  const nextStage = stages.find((s) => !isStageComplete(state, s.id));

  function goTo(stageId: number) {
    update((s) => visitStage(s, stageId));
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function exportFile() {
    const blob = new Blob([exportState(state)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = EXPORT_FILE_NAME;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Cópia salva. Guarde o arquivo em um lugar seguro (e-mail, nuvem ou computador).");
  }

  async function importFile(file: File) {
    if (file.size > limits.importBytes) {
      setMessage("O arquivo é grande demais para ser uma cópia do checklist.");
      return;
    }
    try {
      const restored = importState(await file.text(), file.size);
      if (!window.confirm("Restaurar esta cópia? O progresso atual deste navegador será substituído.")) return;
      setState(restored);
      setMessage("Progresso restaurado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível ler o arquivo.");
    }
  }

  function reset() {
    if (!window.confirm(resetWarning)) return;
    setState(createEmptyState());
    setMessage("Checklist reiniciado.");
  }

  return (
    <div className="space-y-4">
      {initial.status === "unavailable" && (
        <Warning tone="error">
          Este navegador não está permitindo salvar o progresso (por exemplo, em aba anônima). Você pode usar o checklist, mas
          ao fechar a página ele será perdido. Use "Salvar cópia do meu progresso" antes de sair.
        </Warning>
      )}
      {initial.status === "corrupt" && (
        <Warning>
          Não foi possível ler o progresso salvo neste navegador, então o checklist começou do zero. Se você tiver uma cópia,
          use "Restaurar meu progresso".
        </Warning>
      )}
      {saveFailed && initial.status !== "unavailable" && (
        <Warning tone="error">Não foi possível salvar a última alteração (o navegador pode estar sem espaço). Salve uma cópia do seu progresso.</Warning>
      )}

      {/* Progresso geral e recomendação */}
      <section className="rounded-card border border-line bg-surface p-4 shadow-soft md:p-6" aria-label="Seu progresso">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[15px] font-bold text-ink">Seu progresso geral</p>
          <p className="text-[28px] leading-none font-bold text-primary tabular-nums">{overall.percent}%</p>
        </div>
        <div className="mt-3">
          <ProgressBar progress={overall} label="Progresso geral" />
        </div>
        <p className="mt-2 text-[13px] text-ink-soft">
          {overall.done} de {overall.total} tarefas concluídas
        </p>
        <div className="mt-4 rounded-[12px] bg-blush p-3.5">
          <p className="text-[15px] text-ink">{recommendation(state)}</p>
          {nextStage && nextStage.id !== stage.id && (
            <button type="button" onClick={() => goTo(nextStage.id)} className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-[14px] font-bold text-primary hover:underline">
              Ir para a etapa {nextStage.id}
              <ArrowRight aria-hidden="true" className="size-4" />
            </button>
          )}
        </div>
      </section>

      {/* Etapas */}
      <div ref={topRef} className="scroll-mt-4">
        <nav aria-label="Etapas do checklist" className="-mx-4 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
          <ol className="flex gap-2 md:grid md:grid-cols-5">
            {stages.map((s) => {
              const p = stageProgress(state, s.id);
              const active = s.id === stage.id;
              return (
                <li key={s.id} className="w-[150px] shrink-0 md:w-auto">
                  <button
                    type="button"
                    onClick={() => goTo(s.id)}
                    aria-current={active ? "step" : undefined}
                    className={`flex h-full w-full flex-col gap-2 rounded-[14px] border p-3 text-left transition-colors ${
                      active ? "border-primary bg-surface shadow-soft" : "border-line bg-surface/60 hover:border-primary-light"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className={`text-[12px] font-bold tracking-[0.08em] ${active ? "text-primary" : "text-ink-soft"}`}>ETAPA {s.id}</span>
                      {p.percent === 100 ? (
                        <Check aria-label="Concluída" className="size-4 text-success" />
                      ) : (
                        <span className="text-[12px] font-bold text-ink-soft tabular-nums">{p.percent}%</span>
                      )}
                    </span>
                    <span className="text-[14px] leading-snug font-bold text-ink">{s.title}</span>
                    <span className="mt-auto">
                      <ProgressBar progress={p} label={`Progresso da etapa ${s.id}`} size="sm" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      <StagePanel key={stage.id} stage={stage} state={state} update={update} />

      <div className="flex justify-between gap-2">
        {stage.id > 1 ? (
          <SmallButton onClick={() => goTo(stage.id - 1)}>
            <ArrowLeft aria-hidden="true" className="size-4" />
            Etapa {stage.id - 1}
          </SmallButton>
        ) : (
          <span />
        )}
        {stage.id < stages.length && (
          <SmallButton onClick={() => goTo(stage.id + 1)}>
            Etapa {stage.id + 1}
            <ArrowRight aria-hidden="true" className="size-4" />
          </SmallButton>
        )}
      </div>

      <p className="rounded-[12px] bg-[#FFFAEB] p-3.5 text-[13px] font-medium text-[#87510D]">{disclaimer}</p>

      {/* Cópia de segurança */}
      <section className="rounded-card border border-dashed border-[#DCCFD5] p-4 text-[14px] text-ink-soft">
        <p>{storageNotice}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          <SmallButton onClick={exportFile}>
            <Download aria-hidden="true" className="size-4" />
            Salvar cópia do meu progresso
          </SmallButton>
          <SmallButton onClick={() => fileRef.current?.click()}>
            <Upload aria-hidden="true" className="size-4" />
            Restaurar meu progresso
          </SmallButton>
          <SmallButton tone="danger" onClick={reset}>
            <RotateCcw aria-hidden="true" className="size-4" />
            Recomeçar meu checklist
          </SmallButton>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importFile(file);
              event.target.value = "";
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
