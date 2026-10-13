import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Download, FolderOpen, Search, Trash2, Upload, Copy, LoaderCircle } from "lucide-react";
import { Warning } from "../precificacao/ui/fields";
import { BACKUP_FILE_NAME, BACKUP_LIMITS, BackupError, createBackup, readBackup, withNewIds } from "./backup";
import { type LoadedImage, loadImage } from "./images";
import { FORMAT_LABELS } from "./layout";
import { createProject, duplicateProject, uid } from "./projects";
import { loadFonts } from "./render";
import { allImages, deleteProject, getImage, listProjects, loadProfile, putImage, putMany, putProject, saveProfile, StorageError } from "./storage";
import { categories } from "./templates";
import type { CategoryId, PostTemplate, Profile, Project } from "./types";
import { Editor, type SaveState } from "./ui/Editor";
import { Gallery } from "./ui/Gallery";

type View = "projects" | "gallery" | "profile" | "editor";

const STORAGE_NOTICE =
  "Seus projetos ficam armazenados neste navegador. Ao trocar de aparelho, limpar os dados do site ou usar outro navegador, você poderá perder os arquivos salvos.";

const dateFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
const inputClass =
  "w-full rounded-[10px] border border-[#B7A7AF] bg-surface px-3 py-2.5 text-[16px] text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary-light";

function ProfileForm({ profile, onSave }: { profile: Profile; onSave: (p: Profile) => boolean }) {
  const [draft, setDraft] = useState(profile);
  const [services, setServices] = useState(profile.services.join("\n"));
  const [result, setResult] = useState<"" | "ok" | "error">("");
  const base = useId();
  const field = (key: keyof Omit<Profile, "services">, label: string, max: number, hint?: string, placeholder?: string) => (
    <div>
      <label htmlFor={`${base}-${key}`} className="text-[14px] font-bold text-ink">
        {label}
      </label>
      {hint && <p className="text-[12px] text-ink-soft">{hint}</p>}
      <input
        id={`${base}-${key}`}
        maxLength={max}
        placeholder={placeholder}
        value={draft[key]}
        onChange={(e) => {
          setDraft({ ...draft, [key]: e.target.value });
          setResult("");
        }}
        className={`${inputClass} mt-1.5 min-h-11`}
      />
    </div>
  );
  return (
    <form
      className="space-y-4 rounded-card border border-line bg-surface p-4 shadow-soft md:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        const next = { ...draft, services: services.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 20) };
        setResult(onSave(next) ? "ok" : "error");
      }}
    >
      <p className="text-[14px] text-ink-soft">Esses dados preenchem automaticamente os modelos. Ficam salvos só neste navegador.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {field("professionalName", "Nome profissional", 80, "Usado em [NOME_PROFISSIONAL]")}
        {field("studioName", "Nome do estúdio", 80, "Usado em [NOME_ESTUDIO] (opcional)")}
        {field("instagram", "Instagram", 80, "Usado em [INSTAGRAM]", "@seuperfil")}
        {field("whatsapp", "WhatsApp comercial", 40, "Usado em [WHATSAPP]", "(11) 90000-0000")}
        {field("city", "Cidade", 60, "Usado em [CIDADE]")}
        {field("preferredCta", "Chamada para ação preferida", 80, "Atalho no campo CTA", "Ex.: Agende pelo WhatsApp")}
      </div>
      <div>
        <label htmlFor={`${base}-services`} className="text-[14px] font-bold text-ink">
          Serviços (um por linha)
        </label>
        <p className="text-[12px] text-ink-soft">Usado em [SERVICO]: você escolhe qual em cada projeto.</p>
        <textarea id={`${base}-services`} rows={4} value={services} onChange={(e) => { setServices(e.target.value); setResult(""); }} className={`${inputClass} mt-1.5 resize-y`} />
      </div>
      <div>
        <label htmlFor={`${base}-intro`} className="text-[14px] font-bold text-ink">
          Frase de apresentação
        </label>
        <p className="text-[12px] text-ink-soft">Atalho no campo "Texto complementar".</p>
        <textarea id={`${base}-intro`} rows={2} maxLength={280} value={draft.intro} onChange={(e) => { setDraft({ ...draft, intro: e.target.value }); setResult(""); }} className={`${inputClass} mt-1.5 resize-y`} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="inline-flex min-h-11 items-center rounded-button bg-primary px-5 text-[14px] font-bold text-white hover:bg-primary-hover">
          Salvar perfil
        </button>
        {result === "ok" && <p role="status" className="text-[13px] font-medium text-[#166C47]">Perfil salvo neste navegador.</p>}
        {result === "error" && <p role="alert" className="text-[13px] font-medium text-error">Não foi possível salvar o perfil neste navegador.</p>}
      </div>
    </form>
  );
}

/** Kit Instagram Lash Profissional (Ferramentas → Kit Instagram). */
export function InstagramTool() {
  const [fontsReady, setFontsReady] = useState(false);
  const [profile, setProfile] = useState<Profile>(loadProfile);
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [view, setView] = useState<View>("projects");
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [saveError, setSaveError] = useState("");
  const [photo, setPhoto] = useState<LoadedImage | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CategoryId | "">("");
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [working, setWorking] = useState(false);
  const pendingSave = useRef<{ timer: number; project: Project } | null>(null);
  const backupRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void loadFonts().then(() => setFontsReady(true));
    listProjects()
      .then(setProjects)
      .catch((e) => {
        setProjects([]);
        setLoadError(e instanceof StorageError ? e.message : "Não foi possível abrir os projetos salvos.");
      });
  }, []);

  const current = projects?.find((p) => p.id === currentId) ?? null;

  // Foto do projeto aberto
  const imageId = current?.image?.imageId ?? null;
  useEffect(() => {
    let alive = true;
    let loaded: LoadedImage | null = null;
    setPhoto(null);
    if (imageId) {
      getImage(imageId)
        .then(async (img) => {
          if (!img || !alive) return;
          loaded = await loadImage(img.blob);
          if (alive) setPhoto(loaded);
          else loaded.close();
        })
        .catch(() => undefined);
    }
    return () => {
      alive = false;
      loaded?.close();
    };
  }, [imageId]);

  const write = useCallback(async (project: Project) => {
    setSaveState("saving");
    try {
      await putProject(project);
      setSaveState("saved");
      return true;
    } catch (e) {
      setSaveState("error");
      setSaveError(e instanceof StorageError ? e.message : "Não foi possível salvar.");
      return false;
    }
  }, []);

  const flush = useCallback(async () => {
    const pending = pendingSave.current;
    if (!pending) return true;
    window.clearTimeout(pending.timer);
    pendingSave.current = null;
    return write(pending.project);
  }, [write]);

  useEffect(() => () => void flush(), [flush]);

  /** Atualiza na tela na hora e grava (agrupando digitação; imediato para fotos). */
  const change = useCallback(
    async (project: Project, immediate = false) => {
      setProjects((list) => list?.map((p) => (p.id === project.id ? project : p)) ?? list);
      if (pendingSave.current) window.clearTimeout(pendingSave.current.timer);
      if (immediate) {
        pendingSave.current = null;
        return write(project);
      }
      setSaveState("saving");
      pendingSave.current = { project, timer: window.setTimeout(() => void flush(), 600) };
      return true;
    },
    [write, flush],
  );

  async function openNew(template: PostTemplate) {
    const project = createProject(template, profile);
    if (!(await write(project))) {
      setMessage({ kind: "error", text: saveError || "Não foi possível criar o projeto neste navegador." });
    }
    setProjects((list) => [project, ...(list ?? [])]);
    setCurrentId(project.id);
    setView("editor");
  }

  async function duplicate(project: Project, suffix: string) {
    await flush();
    try {
      let newImageId: string | null = null;
      if (project.image) {
        const img = await getImage(project.image.imageId);
        if (img) {
          newImageId = uid();
          await putImage({ ...img, id: newImageId });
        }
      }
      const copy = duplicateProject(project, suffix, newImageId);
      await putProject(copy);
      setProjects((list) => [copy, ...(list ?? [])]);
      setCurrentId(copy.id);
      setView("editor");
    } catch (e) {
      setMessage({ kind: "error", text: e instanceof StorageError ? e.message : "Não foi possível duplicar." });
    }
  }

  async function remove(project: Project) {
    if (!window.confirm(`Excluir o projeto "${project.name}"? Essa ação não pode ser desfeita.`)) return;
    if (pendingSave.current?.project.id === project.id) {
      window.clearTimeout(pendingSave.current.timer);
      pendingSave.current = null;
    }
    try {
      await deleteProject(project);
      setProjects((list) => list?.filter((p) => p.id !== project.id) ?? list);
      setCurrentId(null);
      setView("projects");
      setMessage({ kind: "ok", text: "Projeto excluído." });
    } catch (e) {
      setMessage({ kind: "error", text: e instanceof StorageError ? e.message : "Não foi possível excluir." });
    }
  }

  async function exportBackup() {
    await flush();
    setWorking(true);
    try {
      const list = projects ?? [];
      const images = await allImages(list.flatMap((p) => (p.image ? [p.image.imageId] : [])));
      const zip = await createBackup(list, images, profile);
      const url = URL.createObjectURL(new Blob([zip.slice()], { type: "application/zip" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = BACKUP_FILE_NAME;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setMessage({ kind: "ok", text: `Backup gerado com ${list.length} projeto(s) e ${images.length} foto(s).` });
    } catch {
      setMessage({ kind: "error", text: "Não foi possível gerar o backup." });
    } finally {
      setWorking(false);
    }
  }

  async function importBackup(file: File) {
    if (file.size > BACKUP_LIMITS.zipBytes) {
      setMessage({ kind: "error", text: "O arquivo é grande demais para ser um backup." });
      return;
    }
    setWorking(true);
    try {
      const backup = readBackup(new Uint8Array(await file.arrayBuffer()));
      const existing = projects?.length ?? 0;
      const replace =
        existing > 0 &&
        window.confirm(
          `O backup tem ${backup.projects.length} projeto(s).\n\nOK = SUBSTITUIR os ${existing} projeto(s) atuais deste navegador.\nCancelar = apenas ADICIONAR os projetos do backup aos atuais.`,
        );
      if (replace && !window.confirm("Tem certeza? Os projetos atuais deste navegador serão apagados.")) return;
      const data = replace ? backup : withNewIds(backup);
      await putMany(data.projects, data.images, replace);
      if (backup.profile && (!profile.professionalName.trim() || replace)) {
        saveProfile(backup.profile);
        setProfile(backup.profile);
      }
      setProjects(await listProjects());
      setMessage({ kind: "ok", text: `${data.projects.length} projeto(s) ${replace ? "restaurado(s)" : "adicionado(s)"}.` });
    } catch (e) {
      setMessage({ kind: "error", text: e instanceof BackupError || e instanceof StorageError ? e.message : "Não foi possível restaurar o backup." });
    } finally {
      setWorking(false);
    }
  }

  const tabs: { id: View; label: string }[] = [
    { id: "projects", label: `Meus projetos${projects ? ` (${projects.length})` : ""}` },
    { id: "gallery", label: "Modelos (100)" },
    { id: "profile", label: "Meu perfil" },
  ];

  if (!fontsReady || projects === null) {
    return (
      <div className="flex items-center gap-2 py-10 text-ink-soft">
        <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-primary" /> Carregando…
      </div>
    );
  }

  const filtered = projects.filter((p) => (!filter || p.category === filter) && p.name.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <div className="space-y-4">
      {loadError && <Warning tone="error">{loadError} Você ainda pode criar artes, mas elas não serão salvas.</Warning>}

      {view !== "editor" && (
        <nav aria-label="Kit Instagram" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <div className="flex gap-1.5">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-current={view === t.id ? "page" : undefined}
                onClick={() => {
                  setView(t.id);
                  setMessage(null);
                }}
                className={`min-h-11 shrink-0 rounded-[12px] px-3.5 text-[14px] font-bold ${view === t.id ? "bg-primary text-white" : "bg-surface text-ink-soft shadow-soft hover:text-primary"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </nav>
      )}

      {message && view !== "editor" && (
        <p role="status" className={`rounded-[12px] p-3 text-[14px] font-medium ${message.kind === "ok" ? "bg-[#F0FBF5] text-[#166C47]" : "bg-[#FFF2F3] text-[#AA2841]"}`}>
          {message.text}
        </p>
      )}

      {view === "editor" && current && (
        <Editor
          project={current}
          profile={profile}
          photo={photo}
          saveState={saveState}
          saveError={saveError}
          onChange={change}
          onBack={() => {
            void flush();
            setView("projects");
          }}
          onDuplicate={() => void duplicate(current, "cópia")}
          onVariation={() => void duplicate(current, "variação")}
          onDelete={() => void remove(current)}
          onEditProfile={() => {
            void flush();
            setView("profile");
          }}
        />
      )}

      {view === "gallery" && <Gallery profile={profile} onUse={(t) => void openNew(t)} />}

      {view === "profile" && (
        <ProfileForm
          profile={profile}
          onSave={(p) => {
            const ok = saveProfile(p);
            if (ok) setProfile(p);
            return ok;
          }}
        />
      )}

      {view === "projects" && (
        <div className="space-y-4">
          {projects.length === 0 ? (
            <div className="rounded-card border border-dashed border-[#DCCFD5] p-6 text-center">
              <p className="font-bold text-ink">Você ainda não tem projetos.</p>
              <p className="mt-1 text-[14px] text-ink-soft">Comece preenchendo seu perfil e escolha um dos 100 modelos.</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <button type="button" onClick={() => setView("profile")} className="min-h-11 rounded-button border border-primary px-4 text-[14px] font-bold text-primary hover:bg-blush">
                  Preencher perfil
                </button>
                <button type="button" onClick={() => setView("gallery")} className="min-h-11 rounded-button bg-primary px-4 text-[14px] font-bold text-white hover:bg-primary-hover">
                  Ver modelos
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <label className="relative min-w-[200px] flex-1">
                  <span className="sr-only">Pesquisar pelo nome</span>
                  <Search aria-hidden="true" className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar pelo nome" className={`${inputClass} min-h-11 pl-9`} />
                </label>
                <label>
                  <span className="sr-only">Filtrar por categoria</span>
                  <select value={filter} onChange={(e) => setFilter(e.target.value as CategoryId | "")} className={`${inputClass} min-h-11`}>
                    <option value="">Todas as categorias</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {filtered.length === 0 ? (
                <p className="text-[14px] text-ink-soft">Nenhum projeto encontrado.</p>
              ) : (
                <ul className="space-y-2">
                  {filtered.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center gap-2 rounded-[14px] border border-line bg-surface p-3 shadow-soft">
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentId(p.id);
                          setView("editor");
                          setMessage(null);
                        }}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="block truncate text-[15px] font-bold text-ink">{p.name}</span>
                        <span className="block text-[12px] text-ink-soft">
                          {categories.find((c) => c.id === p.category)?.label} · {FORMAT_LABELS[p.format]} · {p.image ? "com foto · " : ""}alterado em{" "}
                          {dateFmt.format(new Date(p.updatedAt))}
                        </span>
                      </button>
                      <div className="flex">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentId(p.id);
                            setView("editor");
                          }}
                          aria-label={`Abrir ${p.name}`}
                          className="inline-flex min-h-11 items-center rounded-button px-2.5 text-primary hover:bg-blush"
                        >
                          <FolderOpen aria-hidden="true" className="size-4" />
                        </button>
                        <button type="button" onClick={() => void duplicate(p, "cópia")} aria-label={`Duplicar ${p.name}`} className="inline-flex min-h-11 items-center rounded-button px-2.5 text-primary hover:bg-blush">
                          <Copy aria-hidden="true" className="size-4" />
                        </button>
                        <button type="button" onClick={() => void remove(p)} aria-label={`Excluir ${p.name}`} className="inline-flex min-h-11 items-center rounded-button px-2.5 text-[#AA2841] hover:bg-[#FFF2F3]">
                          <Trash2 aria-hidden="true" className="size-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          <section className="rounded-card border border-dashed border-[#DCCFD5] p-4 text-[14px] text-ink-soft">
            <p>{STORAGE_NOTICE}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              <button type="button" disabled={working} onClick={() => void exportBackup()} className="inline-flex min-h-11 items-center gap-1.5 rounded-button px-3 text-[14px] font-bold text-primary hover:bg-blush disabled:opacity-50">
                <Download aria-hidden="true" className="size-4" />
                Baixar backup (.zip)
              </button>
              <button type="button" disabled={working} onClick={() => backupRef.current?.click()} className="inline-flex min-h-11 items-center gap-1.5 rounded-button px-3 text-[14px] font-bold text-primary hover:bg-blush disabled:opacity-50">
                <Upload aria-hidden="true" className="size-4" />
                Restaurar backup
              </button>
              <input
                ref={backupRef}
                type="file"
                accept=".zip,application/zip"
                className="hidden"
                data-testid="backup-input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void importBackup(file);
                  e.target.value = "";
                }}
              />
            </div>
            <p className="mt-1 text-[12px]">O backup inclui projetos, fotos e perfil. Ao restaurar, você escolhe entre adicionar aos projetos atuais ou substituí-los.</p>
          </section>
        </div>
      )}
    </div>
  );
}
