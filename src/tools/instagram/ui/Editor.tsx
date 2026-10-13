import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, Copy, CopyPlus, Download, ImagePlus, Info, RotateCcw, Trash2, TriangleAlert } from "lucide-react";
import { ACCEPTED, ImageError, type LoadedImage, prepareImage } from "../images";
import { FORMAT_LABELS } from "../layout";
import { canRemoveToken, finalCaption, hashtagIssue, removeTokenLines, tokensIn, TOKENS, unresolvedTokens } from "../placeholders";
import { fieldIssues, LIMITS, NAME_LIMIT, POLL_MAX, POLL_MIN, restoreField } from "../projects";
import { canvasToPng, drawLayout, layoutFor, THEMES } from "../render";
import { deleteImage, putImage, StorageError } from "../storage";
import { categories, templateById } from "../templates";
import type { Profile, Project, ProjectFields, ThemeId } from "../types";
import { Preview } from "./Preview";

export type SaveState = "saved" | "saving" | "error";

const inputClass =
  "w-full rounded-[10px] border border-[#B7A7AF] bg-surface px-3 py-2.5 text-[16px] text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary-light";

function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="rounded-card border border-line bg-surface p-4 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-[15px] font-bold text-ink">{title}</h4>
        {aside}
      </div>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function TextField({ label, value, onChange, max, multiline, rows = 3, onRestore, extra }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
  multiline?: boolean;
  rows?: number;
  onRestore?: () => void;
  extra?: ReactNode;
}) {
  const id = useId();
  const over = value.length > max;
  return (
    <div>
      <div className="flex items-end justify-between gap-2">
        <label htmlFor={id} className="text-[14px] font-bold text-ink">
          {label}
        </label>
        {onRestore && (
          <button type="button" onClick={onRestore} className="inline-flex min-h-9 items-center gap-1 text-[13px] font-medium text-primary hover:underline">
            <RotateCcw aria-hidden="true" className="size-3.5" />
            Restaurar original
          </button>
        )}
      </div>
      {multiline ? (
        <textarea id={id} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass} mt-1.5 resize-y`} />
      ) : (
        <input id={id} value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass} mt-1.5 min-h-11`} />
      )}
      <div className="mt-1 flex items-start justify-between gap-2">
        <div>{extra}</div>
        <span className={`shrink-0 text-[12px] ${over ? "font-bold text-error" : "text-[#6C5E66]"}`}>
          {value.length}/{max}
        </span>
      </div>
    </div>
  );
}

function Range({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="text-[13px] font-bold text-ink-soft">
        {label}
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full accent-primary" />
    </div>
  );
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Navegadores sem a API de área de transferência
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

const slug = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "post";

export function Editor({ project, profile, photo, saveState, saveError, onChange, onBack, onDuplicate, onVariation, onDelete, onEditProfile }: {
  project: Project;
  profile: Profile;
  photo: LoadedImage | null;
  saveState: SaveState;
  saveError: string;
  /** immediate = salvar agora (fotos); senão o salvamento é agrupado. Resolve com true se gravou. */
  onChange: (p: Project, immediate?: boolean) => Promise<boolean>;
  onBack: () => void;
  onDuplicate: () => void;
  onVariation: () => void;
  onDelete: () => void;
  onEditProfile: () => void;
}) {
  const template = templateById.get(project.templateId)!;
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setStatus(null), [project.id]);

  const set = <K extends keyof ProjectFields>(key: K, value: ProjectFields[K]) =>
    void onChange({ ...project, fields: { ...project.fields, [key]: value }, updatedAt: new Date().toISOString() });
  const patch = (changes: Partial<Project>, immediate = false) => onChange({ ...project, ...changes, updatedAt: new Date().toISOString() }, immediate);

  const hasPhoto = !!(template.imageSlots && project.image && photo);
  const layout = layoutFor(project, profile, !!(template.imageSlots && project.image));
  const unresolved = unresolvedTokens(project, profile);
  const issues = fieldIssues(project);
  const tagIssue = hashtagIssue(project.fields.hashtags);
  const blocked = layout.overflow || unresolved.length > 0 || Object.keys(issues).length > 0;
  const usesService = [...Object.values(project.fields).flat()].some((t) => typeof t === "string" && tokensIn(t).includes("[SERVICO]"));
  const captionPending = unresolved.filter((u) => u.fields.some((f) => f === "caption" || f === "hashtags"));

  function removeToken(token: keyof typeof TOKENS) {
    const fields = { ...project.fields };
    for (const key of ["eyebrow", "supportingText", "cta", "caption", "availabilityLine"] as const) fields[key] = removeTokenLines(fields[key], token);
    fields.pollOptions = fields.pollOptions.map((o) => (o.includes(token) ? o.replace(token, "").trim() : o));
    void onChange({ ...project, fields, updatedAt: new Date().toISOString() });
  }

  async function choosePhoto(file: File) {
    setBusy(true);
    setStatus(null);
    try {
      const image = await prepareImage(file);
      await putImage(image);
      const previous = project.image?.imageId;
      const saved = await patch({ image: { imageId: image.id, zoom: 1, offsetX: 0, offsetY: 0 } }, true);
      if (saved && previous) await deleteImage(previous).catch(() => undefined);
      if (!saved) await deleteImage(image.id).catch(() => undefined);
      setStatus(saved ? { kind: "ok", text: "Foto adicionada." } : { kind: "error", text: "A foto não pôde ser salva neste navegador." });
    } catch (error) {
      setStatus({ kind: "error", text: error instanceof ImageError || error instanceof StorageError ? error.message : "Não foi possível adicionar a foto." });
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto() {
    if (!project.image) return;
    const previous = project.image.imageId;
    if (await patch({ image: null }, true)) await deleteImage(previous).catch(() => undefined);
  }

  async function exportPng() {
    if (blocked) return;
    setBusy(true);
    try {
      const canvas = document.createElement("canvas");
      drawLayout(canvas, layout, project.theme, {
        scale: 1,
        photo: hasPhoto && photo && project.image ? { source: photo.source, width: photo.width, height: photo.height, crop: project.image } : null,
      });
      const blob = await canvasToPng(canvas);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${slug(project.name)}_${layout.width}x${layout.height}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setStatus({ kind: "ok", text: `Imagem ${layout.width} × ${layout.height} gerada.` });
    } catch {
      setStatus({ kind: "error", text: "Não foi possível gerar a imagem neste navegador." });
    } finally {
      setBusy(false);
    }
  }

  async function copyCaption() {
    if (captionPending.length) {
      setStatus({ kind: "error", text: "Preencha ou remova os dados pendentes da legenda antes de copiar." });
      return;
    }
    const ok = await copyText(finalCaption(project, profile));
    setStatus(ok ? { kind: "ok", text: "Legenda copiada! Cole no Instagram ao publicar." } : { kind: "error", text: "Não foi possível copiar. Selecione o texto e copie manualmente." });
  }

  const nameId = useId();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-1.5 text-[14px] font-bold text-primary hover:underline">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Meus projetos
        </button>
        <p role="status" className={`text-[13px] font-medium ${saveState === "error" ? "text-error" : "text-ink-soft"}`}>
          {saveState === "saving" ? "Salvando…" : saveState === "error" ? saveError || "Não foi possível salvar." : "Salvo neste navegador"}
        </p>
      </div>

      <div className="rounded-card border border-line bg-surface p-4 shadow-soft">
        <label htmlFor={nameId} className="text-[13px] font-bold text-ink-soft">
          Nome do projeto
        </label>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <input id={nameId} maxLength={NAME_LIMIT} value={project.name} onChange={(e) => void patch({ name: e.target.value })} className={`${inputClass} min-h-11 min-w-[240px] flex-1 font-bold`} />
          <div className="flex">
            <button type="button" onClick={onDuplicate} className="inline-flex min-h-11 items-center gap-1 rounded-button px-2.5 text-[13px] font-bold text-primary hover:bg-blush">
              <Copy aria-hidden="true" className="size-4" /> Duplicar
            </button>
            <button type="button" onClick={onVariation} className="inline-flex min-h-11 items-center gap-1 rounded-button px-2.5 text-[13px] font-bold text-primary hover:bg-blush">
              <CopyPlus aria-hidden="true" className="size-4" /> Criar variação
            </button>
            <button type="button" onClick={onDelete} aria-label="Excluir projeto" title="Excluir projeto" className="inline-flex min-h-11 items-center rounded-button px-2.5 text-[#AA2841] hover:bg-[#FFF2F3]">
              <Trash2 aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>
        <p className="mt-1.5 text-[13px] text-ink-soft">
          Modelo: {template.title} ({template.id}) · {categories.find((c) => c.id === project.category)?.label}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[400px_minmax(0,1fr)] [&>*]:min-w-0">
        {/* Prévia e exportação */}
        <div className="space-y-3 lg:sticky lg:top-4 lg:self-start">
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Formato">
            {template.formats.map((f) => (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={project.format === f}
                onClick={() => void patch({ format: f })}
                className={`min-h-10 rounded-full border px-3 text-[13px] font-bold ${project.format === f ? "border-primary bg-primary text-white" : "border-line bg-surface text-ink-soft"}`}
              >
                {FORMAT_LABELS[f]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2" role="radiogroup" aria-label="Cores">
            {(Object.keys(THEMES) as ThemeId[]).map((id) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={project.theme === id}
                aria-label={THEMES[id].label}
                title={THEMES[id].label}
                onClick={() => void patch({ theme: id })}
                className={`size-9 rounded-full border-2 ${project.theme === id ? "border-primary ring-2 ring-primary-light" : "border-line"}`}
                style={{ background: `linear-gradient(135deg, ${THEMES[id].bg[0]}, ${THEMES[id].bg[1]})` }}
              />
            ))}
          </div>

          <div className={`mx-auto overflow-hidden rounded-[12px] shadow-card ${project.format === "story" ? "max-w-[300px]" : "max-w-[400px]"}`}>
            <Preview layout={layout} theme={project.theme} photo={hasPhoto ? photo : null} crop={project.image} scale={0.5} label="Prévia da arte" />
          </div>

          {layout.overflow && (
            <p className="flex gap-2 rounded-[12px] bg-[#FFF2F3] p-3 text-[13px] font-medium text-[#AA2841]" role="alert">
              <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              O texto não cabe neste formato. Reduza o título ou o texto complementar, ou escolha outro formato.
            </p>
          )}
          {unresolved.length > 0 && (
            <div className="space-y-2 rounded-[12px] bg-[#FFFAEB] p-3 text-[13px] text-[#87510D]" role="alert">
              <p className="font-bold">Dados pendentes (não dá para exportar com marcadores em aberto):</p>
              {unresolved.map(({ token, fields }) => (
                <div key={token} className="flex flex-wrap items-center gap-2">
                  <span>{TOKENS[token].label}</span>
                  <button type="button" onClick={onEditProfile} className="font-bold underline">
                    Preencher no perfil
                  </button>
                  {canRemoveToken(fields) && (
                    <button type="button" onClick={() => removeToken(token)} className="font-bold underline">
                      Remover este trecho
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={exportPng}
            disabled={blocked || busy}
            className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-button bg-primary px-5 text-[15px] font-bold text-white shadow-soft hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download aria-hidden="true" className="size-5" />
            Baixar imagem PNG
          </button>
          {status && (
            <p role="status" className={`text-[13px] font-medium ${status.kind === "ok" ? "text-[#166C47]" : "text-error"}`}>
              {status.text}
            </p>
          )}
        </div>

        {/* Edição */}
        <div className="space-y-4">
          {template.guidance && (
            <p className="flex gap-2 rounded-[12px] bg-blush p-3 text-[13px] text-ink">
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
              {template.guidance}
            </p>
          )}

          <Section title="Textos da arte">
            <TextField label="Subtítulo" value={project.fields.eyebrow} max={LIMITS.eyebrow} onChange={(v) => set("eyebrow", v)} onRestore={() => set("eyebrow", restoreField(project, "eyebrow"))} />
            <TextField
              label="Título principal"
              multiline
              rows={2}
              value={project.fields.headline}
              max={LIMITS.headline}
              onChange={(v) => set("headline", v)}
              onRestore={() => set("headline", restoreField(project, "headline"))}
              extra={issues.headline && <span className="text-[12px] font-medium text-error">{issues.headline}</span>}
            />
            {template.editableFields.includes("supportingText") && (
              <TextField
                label="Texto complementar"
                multiline
                value={project.fields.supportingText}
                max={LIMITS.supportingText}
                onChange={(v) => set("supportingText", v)}
                onRestore={() => set("supportingText", restoreField(project, "supportingText"))}
                extra={
                  profile.intro.trim() && (
                    <button type="button" onClick={() => set("supportingText", profile.intro.trim())} className="text-[12px] font-bold text-primary hover:underline">
                      Usar minha frase de apresentação
                    </button>
                  )
                }
              />
            )}

            {template.editableFields.includes("pollOptions") && (
              <div>
                <p className="text-[14px] font-bold text-ink">
                  Opções da enquete ({POLL_MIN} a {POLL_MAX})
                </p>
                <p className="text-[12px] text-ink-soft">A arte mostra as opções; as respostas acontecem nos comentários (não é a enquete interativa do Instagram).</p>
                <ul className="mt-2 space-y-2">
                  {project.fields.pollOptions.map((option, i) => (
                    <li key={i} className="flex gap-2">
                      <input
                        aria-label={`Opção ${i + 1}`}
                        maxLength={LIMITS.pollOptions}
                        value={option}
                        onChange={(e) => set("pollOptions", project.fields.pollOptions.map((o, j) => (j === i ? e.target.value : o)))}
                        className={`${inputClass} min-h-11`}
                      />
                      <button
                        type="button"
                        aria-label={`Remover opção ${i + 1}`}
                        disabled={project.fields.pollOptions.length <= POLL_MIN}
                        onClick={() => set("pollOptions", project.fields.pollOptions.filter((_, j) => j !== i))}
                        className="inline-flex min-h-11 items-center rounded-button px-2.5 text-[#AA2841] hover:bg-[#FFF2F3] disabled:opacity-30"
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex gap-3">
                  {project.fields.pollOptions.length < POLL_MAX && (
                    <button type="button" onClick={() => set("pollOptions", [...project.fields.pollOptions, "Nova opção"])} className="text-[13px] font-bold text-primary hover:underline">
                      + Adicionar opção
                    </button>
                  )}
                  <button type="button" onClick={() => set("pollOptions", restoreField(project, "pollOptions"))} className="text-[13px] font-medium text-primary hover:underline">
                    Restaurar opções originais
                  </button>
                </div>
                {issues.pollOptions && <p className="mt-1 text-[12px] font-medium text-error">{issues.pollOptions}</p>}
              </div>
            )}

            {template.editableFields.includes("availabilityLine") && (
              <div className="rounded-[12px] border border-line p-3">
                <label className="flex min-h-11 cursor-pointer items-start gap-3">
                  <input type="checkbox" checked={project.showAvailability} onChange={(e) => void patch({ showAvailability: e.target.checked })} className="mt-1 size-5 accent-primary" />
                  <span>
                    <span className="block text-[14px] font-bold text-ink">Mostrar frase de agenda aberta</span>
                    <span className="block text-[12px] text-ink-soft">Ative só se você realmente tiver horários disponíveis.</span>
                  </span>
                </label>
                {project.showAvailability && (
                  <div className="mt-2">
                    <TextField label="Frase de disponibilidade" value={project.fields.availabilityLine} max={LIMITS.availabilityLine} onChange={(v) => set("availabilityLine", v)} />
                  </div>
                )}
              </div>
            )}

            {template.editableFields.includes("cta") && (
              <TextField
                label="Chamada para ação (CTA)"
                value={project.fields.cta}
                max={LIMITS.cta}
                onChange={(v) => set("cta", v)}
                onRestore={() => set("cta", restoreField(project, "cta"))}
                extra={
                  profile.preferredCta.trim() && (
                    <button type="button" onClick={() => set("cta", profile.preferredCta.trim())} className="text-[12px] font-bold text-primary hover:underline">
                      Usar minha chamada preferida
                    </button>
                  )
                }
              />
            )}

            {usesService && (
              <div>
                <label htmlFor="servico" className="text-[14px] font-bold text-ink">
                  Serviço usado em [SERVICO]
                </label>
                {profile.services.length ? (
                  <select id="servico" value={project.service} onChange={(e) => void patch({ service: e.target.value })} className={`${inputClass} mt-1.5 min-h-11`}>
                    {profile.services.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="mt-1 text-[13px] text-ink-soft">
                    Cadastre seus serviços no{" "}
                    <button type="button" onClick={onEditProfile} className="font-bold text-primary underline">
                      perfil
                    </button>
                    .
                  </p>
                )}
              </div>
            )}
            <p className="text-[12px] text-ink-soft">
              Marcadores como [NOME_PROFISSIONAL] e [WHATSAPP] são trocados pelos dados do seu perfil na arte e na legenda.
            </p>
          </Section>

          {template.imageSlots > 0 && (
            <Section title="Foto">
              <p className="text-[13px] text-ink-soft">
                Utilize apenas fotografias próprias ou imagens que você tenha autorização para publicar. Para fotos identificáveis de clientes, verifique as permissões necessárias.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-button border border-primary px-3.5 text-[14px] font-bold text-primary hover:bg-blush disabled:opacity-50"
                >
                  <ImagePlus aria-hidden="true" className="size-4" />
                  {project.image ? "Trocar foto" : "Adicionar foto"}
                </button>
                {project.image && (
                  <button type="button" onClick={removePhoto} className="inline-flex min-h-11 items-center gap-1.5 rounded-button px-3 text-[14px] font-bold text-[#AA2841] hover:bg-[#FFF2F3]">
                    <Trash2 aria-hidden="true" className="size-4" />
                    Remover foto
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept={ACCEPTED.join(",")}
                  className="hidden"
                  data-testid="photo-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void choosePhoto(file);
                    e.target.value = "";
                  }}
                />
              </div>
              <p className="text-[12px] text-ink-soft">JPEG, PNG ou WebP até 15 MB. A foto fica só neste aparelho.</p>
              {project.image && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <Range label="Aproximar" min={1} max={3} step={0.05} value={project.image.zoom} onChange={(zoom) => void patch({ image: { ...project.image!, zoom } })} />
                  <Range label="Posição horizontal" min={-1} max={1} step={0.02} value={project.image.offsetX} onChange={(offsetX) => void patch({ image: { ...project.image!, offsetX } })} />
                  <Range label="Posição vertical" min={-1} max={1} step={0.02} value={project.image.offsetY} onChange={(offsetY) => void patch({ image: { ...project.image!, offsetY } })} />
                </div>
              )}
              {project.image && !photo && <p className="text-[13px] text-error">A foto deste projeto não foi encontrada neste navegador. Adicione-a novamente.</p>}
            </Section>
          )}

          <Section
            title="Legenda"
            aside={
              <button type="button" onClick={copyCaption} className="inline-flex min-h-11 items-center gap-1.5 rounded-button bg-primary px-3.5 text-[14px] font-bold text-white hover:bg-primary-hover">
                <Copy aria-hidden="true" className="size-4" />
                Copiar legenda
              </button>
            }
          >
            <TextField label="Texto da legenda" multiline rows={6} value={project.fields.caption} max={LIMITS.caption} onChange={(v) => set("caption", v)} onRestore={() => set("caption", restoreField(project, "caption"))} />
            <TextField
              label="Hashtags (opcional)"
              multiline
              rows={2}
              value={project.fields.hashtags}
              max={LIMITS.hashtags}
              onChange={(v) => set("hashtags", v)}
              onRestore={() => set("hashtags", restoreField(project, "hashtags"))}
              extra={tagIssue && <span className="text-[12px] font-medium text-error">{tagIssue}</span>}
            />
            <details className="rounded-[10px] bg-[#FCFAFB] p-3 text-[13px]">
              <summary className="cursor-pointer font-bold text-ink">Ver como a legenda será copiada</summary>
              <p className="mt-2 break-words whitespace-pre-wrap text-ink">{finalCaption(project, profile)}</p>
            </details>
          </Section>
        </div>
      </div>
    </div>
  );
}
