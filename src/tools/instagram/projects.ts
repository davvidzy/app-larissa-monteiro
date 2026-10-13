/* Projetos: criação a partir de um modelo, limites, restauração e validação. */

import { categories, templateById } from "./templates";
import type { CategoryId, PostFormat, PostTemplate, Profile, Project, ProjectFields, ThemeId } from "./types";

export const LIMITS: Record<keyof ProjectFields, number> = {
  eyebrow: 40,
  headline: 140,
  supportingText: 280,
  cta: 80,
  caption: 2200, // limite do Instagram
  hashtags: 900,
  pollOptions: 40, // por opção
  availabilityLine: 60,
};
export const NAME_LIMIT = 80;
export const POLL_MIN = 2;
export const POLL_MAX = 4;

export function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function templateFields(t: PostTemplate): ProjectFields {
  return {
    eyebrow: t.eyebrow,
    headline: t.headline,
    supportingText: t.supportingText ?? "",
    cta: t.cta ?? "",
    caption: t.caption,
    hashtags: t.hashtags.join(" "),
    pollOptions: [...(t.pollOptions ?? [])],
    availabilityLine: t.availabilityLine ?? "",
  };
}

export function createProject(t: PostTemplate, profile: Profile, now = new Date().toISOString()): Project {
  return {
    version: 1,
    id: uid(),
    name: t.title,
    templateId: t.id,
    category: t.category,
    format: t.formats[0],
    theme: t.theme,
    fields: templateFields(t),
    service: profile.services[0] ?? "",
    showAvailability: false, // agenda aberta só se a usuária ativar
    image: null,
    createdAt: now,
    updatedAt: now,
  };
}

/** Restaura um campo ao texto original do modelo. */
export function restoreField<K extends keyof ProjectFields>(project: Project, field: K): ProjectFields[K] {
  const t = templateById.get(project.templateId);
  return t ? templateFields(t)[field] : project.fields[field];
}

export function duplicateProject(p: Project, nameSuffix: string, newImageId: string | null, now = new Date().toISOString()): Project {
  return {
    ...structuredClone(p),
    id: uid(),
    name: `${p.name} (${nameSuffix})`.slice(0, NAME_LIMIT),
    image: p.image && newImageId ? { ...p.image, imageId: newImageId } : null,
    createdAt: now,
    updatedAt: now,
  };
}

/** Problemas de tamanho/estrutura dos textos (para avisar no editor). */
export function fieldIssues(p: Project): Partial<Record<keyof ProjectFields, string>> {
  const issues: Partial<Record<keyof ProjectFields, string>> = {};
  for (const key of Object.keys(LIMITS) as (keyof ProjectFields)[]) {
    if (key === "pollOptions") continue;
    const value = p.fields[key] as string;
    if (value.length > LIMITS[key]) issues[key] = `Use no máximo ${LIMITS[key]} caracteres.`;
  }
  if (!p.fields.headline.trim()) issues.headline = "O título principal não pode ficar vazio.";
  const t = templateById.get(p.templateId);
  if (t?.pollOptions) {
    const options = p.fields.pollOptions.filter((o) => o.trim());
    if (options.length < POLL_MIN || options.length > POLL_MAX) issues.pollOptions = `A enquete precisa de ${POLL_MIN} a ${POLL_MAX} opções.`;
    else if (p.fields.pollOptions.some((o) => o.length > LIMITS.pollOptions)) issues.pollOptions = `Cada opção pode ter até ${LIMITS.pollOptions} caracteres.`;
  }
  return issues;
}

/* -------------------------------------------------------------------------- */
/* Validação de dados salvos ou importados                                    */
/* -------------------------------------------------------------------------- */

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : null);
const date = (v: unknown) => (typeof v === "string" && v.length <= 40 && !Number.isNaN(Date.parse(v)) ? v : null);
const FORMATS: PostFormat[] = ["square", "portrait", "story"];
const THEME_IDS: ThemeId[] = ["blush", "wine", "cream", "rose"];
export const ID_RE = /^[A-Za-z0-9-]{1,64}$/;

/** Valida e limpa um projeto vindo de armazenamento ou backup. null = inválido. */
export function parseProject(v: unknown): Project | null {
  if (!isObj(v) || v.version !== 1) return null;
  const id = str(v.id, 64);
  const templateId = str(v.templateId, 32);
  if (!id || !ID_RE.test(id) || !templateId) return null;
  const template = templateById.get(templateId);
  if (!template) return null;
  const f = isObj(v.fields) ? v.fields : null;
  if (!f) return null;

  const fields: ProjectFields = {
    eyebrow: str(f.eyebrow, LIMITS.eyebrow * 2) ?? "",
    headline: str(f.headline, LIMITS.headline * 2) ?? "",
    supportingText: str(f.supportingText, LIMITS.supportingText * 2) ?? "",
    cta: str(f.cta, LIMITS.cta * 2) ?? "",
    caption: str(f.caption, LIMITS.caption) ?? "",
    hashtags: str(f.hashtags, LIMITS.hashtags) ?? "",
    pollOptions: Array.isArray(f.pollOptions)
      ? f.pollOptions.slice(0, POLL_MAX).map((o) => str(o, LIMITS.pollOptions * 2) ?? "")
      : [],
    availabilityLine: str(f.availabilityLine, LIMITS.availabilityLine * 2) ?? "",
  };

  let image: Project["image"] = null;
  if (isObj(v.image)) {
    const imageId = str(v.image.imageId, 64);
    const num = (n: unknown, min: number, max: number, def: number) => (typeof n === "number" && Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def);
    if (imageId && ID_RE.test(imageId)) image = { imageId, zoom: num(v.image.zoom, 1, 3, 1), offsetX: num(v.image.offsetX, -1, 1, 0), offsetY: num(v.image.offsetY, -1, 1, 0) };
  }

  const format = FORMATS.includes(v.format as PostFormat) && template.formats.includes(v.format as PostFormat) ? (v.format as PostFormat) : template.formats[0];
  const now = new Date().toISOString();
  return {
    version: 1,
    id,
    name: (str(v.name, NAME_LIMIT) ?? template.title).trim() || template.title,
    templateId,
    category: categories.some((c) => c.id === v.category) ? (v.category as CategoryId) : template.category,
    format,
    theme: THEME_IDS.includes(v.theme as ThemeId) ? (v.theme as ThemeId) : template.theme,
    fields,
    service: str(v.service, 80) ?? "",
    showAvailability: v.showAvailability === true,
    image: template.imageSlots ? image : null,
    createdAt: date(v.createdAt) ?? now,
    updatedAt: date(v.updatedAt) ?? now,
  };
}

/** Valida o perfil profissional salvo. */
export function parseProfile(v: unknown): Profile | null {
  if (!isObj(v)) return null;
  const s = (key: string, max: number) => str(v[key], max) ?? "";
  return {
    professionalName: s("professionalName", 80),
    studioName: s("studioName", 80),
    instagram: s("instagram", 80),
    whatsapp: s("whatsapp", 40),
    city: s("city", 60),
    services: Array.isArray(v.services) ? v.services.filter((x): x is string => typeof x === "string").slice(0, 20).map((x) => x.slice(0, 80)) : [],
    intro: s("intro", 280),
    preferredCta: s("preferredCta", 80),
  };
}
