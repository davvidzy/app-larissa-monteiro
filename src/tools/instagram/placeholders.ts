/* Marcadores [NOME_PROFISSIONAL], [INSTAGRAM]… preenchidos com o perfil profissional. */

import type { Profile, Project, ProjectFields } from "./types";

export const TOKENS = {
  "[NOME_PROFISSIONAL]": { label: "Nome profissional", profileKey: "professionalName" },
  "[NOME_ESTUDIO]": { label: "Nome do estúdio", profileKey: "studioName" },
  "[INSTAGRAM]": { label: "Instagram", profileKey: "instagram" },
  "[WHATSAPP]": { label: "WhatsApp comercial", profileKey: "whatsapp" },
  "[CIDADE]": { label: "Cidade", profileKey: "city" },
  "[SERVICO]": { label: "Serviço", profileKey: "services" },
} as const;

export type Token = keyof typeof TOKENS;
const TOKEN_RE = /\[(NOME_PROFISSIONAL|NOME_ESTUDIO|INSTAGRAM|WHATSAPP|CIDADE|SERVICO)\]/g;

export function emptyProfile(): Profile {
  return { professionalName: "", studioName: "", instagram: "", whatsapp: "", city: "", services: [], intro: "", preferredCta: "" };
}

/** "@ana.lash", "ana.lash" ou a URL do perfil → "@ana.lash". */
export function normalizeInstagram(value: string) {
  const v = value.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/\/.*$/, "").replace(/^@+/, "");
  return v ? `@${v}` : "";
}

/** Valor de cada marcador para este projeto (vazio = não preenchido). */
export function tokenValues(profile: Profile, project?: Pick<Project, "service">): Record<Token, string> {
  return {
    "[NOME_PROFISSIONAL]": profile.professionalName.trim(),
    "[NOME_ESTUDIO]": profile.studioName.trim(),
    "[INSTAGRAM]": normalizeInstagram(profile.instagram),
    "[WHATSAPP]": profile.whatsapp.trim(),
    "[CIDADE]": profile.city.trim(),
    "[SERVICO]": (project?.service || profile.services[0] || "").trim(),
  };
}

export function tokensIn(text: string): Token[] {
  return [...new Set(text.match(TOKEN_RE) ?? [])] as Token[];
}

/** Substitui os marcadores preenchidos; os vazios ficam como estão (para serem detectados). */
export function resolveText(text: string, values: Record<Token, string>) {
  return text.replace(TOKEN_RE, (token) => values[token as Token] || token);
}

/** Campos de texto que vão para a arte e para a legenda. */
export const TEXT_FIELDS: (keyof ProjectFields)[] = ["eyebrow", "headline", "supportingText", "cta", "caption", "hashtags", "availabilityLine"];

export function projectTexts(project: Project) {
  return [
    ...TEXT_FIELDS.filter((f) => f !== "availabilityLine" || project.showAvailability).map((f) => project.fields[f] as string),
    ...project.fields.pollOptions,
  ];
}

/** Marcadores sem valor no perfil, por campo do projeto. */
export function unresolvedTokens(project: Project, profile: Profile): { token: Token; fields: (keyof ProjectFields)[] }[] {
  const values = tokenValues(profile, project);
  const found = new Map<Token, (keyof ProjectFields)[]>();
  const check = (field: keyof ProjectFields, text: string) => {
    for (const token of tokensIn(text)) if (!values[token]) found.set(token, [...(found.get(token) ?? []), field]);
  };
  for (const f of TEXT_FIELDS) if (f !== "availabilityLine" || project.showAvailability) check(f, project.fields[f] as string);
  project.fields.pollOptions.forEach((o) => check("pollOptions", o));
  return [...found].map(([token, fields]) => ({ token, fields: [...new Set(fields)] }));
}

/**
 * Remove o trecho que depende de um marcador: as linhas que o contêm.
 * Ex.: "Informações: [WHATSAPP]" some inteiro, em vez de virar "Informações: ".
 * No título não é permitido (o título ficaria sem sentido): lá a usuária precisa preencher o perfil.
 */
export function removeTokenLines(text: string, token: Token) {
  return text
    .split("\n")
    .filter((line) => !line.includes(token))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function canRemoveToken(fields: (keyof ProjectFields)[]) {
  return !fields.includes("headline");
}

/** Legenda final (o que vai para a área de transferência): legenda + hashtags, com marcadores resolvidos. */
export function finalCaption(project: Project, profile: Profile) {
  const values = tokenValues(profile, project);
  const caption = resolveText(project.fields.caption, values).trim();
  const hashtags = project.fields.hashtags.trim();
  return hashtags ? `${caption}\n\n${hashtags}` : caption;
}

/* -------------------------------------------------------------------------- */
/* Hashtags                                                                   */
/* -------------------------------------------------------------------------- */

export const MAX_HASHTAGS = 30; // limite do Instagram

export function parseHashtags(text: string) {
  return text.split(/\s+/).filter(Boolean);
}

export function hashtagIssue(text: string): string | null {
  const tags = parseHashtags(text);
  if (tags.length > MAX_HASHTAGS) return `O Instagram aceita no máximo ${MAX_HASHTAGS} hashtags.`;
  const bad = tags.find((t) => !/^#[\p{L}\p{N}_]+$/u.test(t));
  if (bad) return `"${bad}" não é uma hashtag válida (comece com # e não use espaços ou pontuação).`;
  return null;
}
