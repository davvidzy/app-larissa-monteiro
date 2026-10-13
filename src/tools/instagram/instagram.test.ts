import { describe, expect, it } from "vitest";
import { strToU8, zipSync } from "fflate";
import { BackupError, createBackup, readBackup, withNewIds } from "./backup";
import { sniffImageType } from "./images";
import { computeLayout, type LayoutInput, type Measure, wrap } from "./layout";
import {
  canRemoveToken,
  emptyProfile,
  finalCaption,
  hashtagIssue,
  normalizeInstagram,
  removeTokenLines,
  resolveText,
  tokensIn,
  tokenValues,
  TOKENS,
  unresolvedTokens,
} from "./placeholders";
import { createProject, duplicateProject, fieldIssues, LIMITS, parseProject, restoreField } from "./projects";
import { categories, templateById, templates } from "./templates";
import type { Profile, StoredImage } from "./types";

/* Medida aproximada (sem navegador): ~0,55 da altura da fonte por caractere, um pouco folgada. */
const fakeMeasure: Measure = (text, font, tracking = 0) => {
  const size = Number(/(\d+)px/.exec(font)?.[1] ?? 16);
  const factor = font.includes("Cormorant") ? 0.5 : 0.56;
  return Array.from(text).length * (size * factor + tracking);
};

const profile: Profile = {
  ...emptyProfile(),
  professionalName: "Ana Paula Conceição",
  studioName: "Studio Olhar",
  instagram: "https://instagram.com/ana.lash/",
  whatsapp: "(11) 98765-4321",
  city: "São Paulo",
  services: ["Volume brasileiro", "Extensão clássica"],
};

const words = (s: string) => new Set(s.toLowerCase().normalize("NFD").replace(/[^\p{L}\s]/gu, "").split(/\s+/).filter((w) => w.length > 3));
const jaccard = (a: Set<string>, b: Set<string>) => {
  const inter = [...a].filter((w) => b.has(w)).length;
  return inter / (a.size + b.size - inter || 1);
};

describe("1, 2 e 3. biblioteca de 100 modelos", () => {
  it("tem exatamente 100 modelos, 10 por categoria, com IDs estáveis e únicos", () => {
    expect(templates).toHaveLength(100);
    for (const c of categories) expect(templates.filter((t) => t.category === c.id)).toHaveLength(10);
    expect(new Set(templates.map((t) => t.id)).size).toBe(100);
    expect(templates[0].id).toBe("intro_001");
    expect(templates[99].id).toBe("news_010");
  });
  it("nenhum modelo vazio ou com campos obrigatórios em branco", () => {
    for (const t of templates) {
      expect(t.title.trim(), t.id).not.toBe("");
      expect(t.headline.trim(), t.id).not.toBe("");
      expect(t.caption.trim().length, t.id).toBeGreaterThan(40);
      expect(t.cta?.trim(), t.id).toBeTruthy();
      expect(t.hashtags.length, t.id).toBeGreaterThanOrEqual(3);
      expect(t.editableFields, t.id).toContain("caption");
    }
  });
  it("sem textos repetidos: títulos, temas e legendas únicos", () => {
    const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
    for (const key of ["title", "headline", "caption"] as const) {
      expect(new Set(templates.map((t) => norm(t[key]))).size, key).toBe(100);
    }
  });
  it("sem duplicações substanciais (legendas e títulos pouco parecidos entre si)", () => {
    const texts = templates.map((t) => ({ id: t.id, w: words(`${t.headline} ${t.supportingText ?? ""} ${t.caption}`) }));
    const similar: string[] = [];
    for (let i = 0; i < texts.length; i++)
      for (let j = i + 1; j < texts.length; j++) if (jaccard(texts[i].w, texts[j].w) > 0.5) similar.push(`${texts[i].id}~${texts[j].id}`);
    expect(similar).toEqual([]);
  });
  it("enquetes têm de 2 a 4 opções e não aceitam foto", () => {
    const polls = templates.filter((t) => t.category === "poll");
    for (const p of polls) {
      expect(p.pollOptions!.length).toBeGreaterThanOrEqual(2);
      expect(p.pollOptions!.length).toBeLessThanOrEqual(4);
      expect(p.imageSlots).toBe(0);
    }
  });
  it("agendamento: frase de agenda aberta existe, mas começa desligada", () => {
    const booking = templates.filter((t) => t.availabilityLine);
    expect(booking.length).toBeGreaterThan(0);
    expect(booking.every((t) => t.category === "booking")).toBe(true);
    expect(createProject(booking[0], profile).showAvailability).toBe(false);
  });
  it("conteúdo respeita as regras (sem promessas, garantias ou depoimentos)", () => {
    const forbidden = /garant(ia|ido|imos)|100%|sem riscos|totalmente segur|resultado garantido|depoimento|dura \d+ (dias|semanas)|certificad[ao]/i;
    for (const t of templates) {
      const all = [t.headline, t.supportingText, t.caption, t.cta, t.availabilityLine, ...(t.pollOptions ?? [])].join(" ");
      expect(forbidden.test(all), `${t.id}: ${all.match(forbidden)?.[0]}`).toBe(false);
    }
  });
  it("só usa marcadores conhecidos e respeita os limites de caracteres", () => {
    for (const t of templates) {
      const all = [t.headline, t.supportingText ?? "", t.caption, t.cta ?? ""].join(" ");
      const unknown = (all.match(/\[[A-Z_]+\]/g) ?? []).filter((m) => !(m in TOKENS));
      expect(unknown, t.id).toEqual([]);
      expect(t.headline.length, t.id).toBeLessThanOrEqual(LIMITS.headline);
      expect((t.supportingText ?? "").length, t.id).toBeLessThanOrEqual(LIMITS.supportingText);
      expect((t.cta ?? "").length, t.id).toBeLessThanOrEqual(LIMITS.cta);
      expect(hashtagIssue(t.hashtags.join(" ")), t.id).toBeNull();
    }
  });
});

describe("4. substituição dos dados profissionais", () => {
  it("preenche todos os marcadores com o perfil", () => {
    const values = tokenValues(profile);
    expect(values["[INSTAGRAM]"]).toBe("@ana.lash");
    expect(values["[SERVICO]"]).toBe("Volume brasileiro");
    expect(resolveText("Prazer, eu sou [NOME_PROFISSIONAL]! [CIDADE]", values)).toBe("Prazer, eu sou Ana Paula Conceição! São Paulo");
  });
  it("normaliza o Instagram", () => {
    expect(normalizeInstagram("ana.lash")).toBe("@ana.lash");
    expect(normalizeInstagram("@@ana.lash")).toBe("@ana.lash");
    expect(normalizeInstagram("https://www.instagram.com/ana.lash/?hl=pt")).toBe("@ana.lash");
    expect(normalizeInstagram("  ")).toBe("");
  });
  it("detecta marcadores sem valor e permite remover o trecho (exceto no título)", () => {
    const p = createProject(templateById.get("intro_002")!, emptyProfile());
    const missing = unresolvedTokens(p, emptyProfile());
    expect(missing.map((m) => m.token).sort()).toEqual(["[INSTAGRAM]", "[NOME_PROFISSIONAL]"]);
    const name = missing.find((m) => m.token === "[NOME_PROFISSIONAL]")!;
    expect(canRemoveToken(name.fields)).toBe(false); // está no título
    const insta = missing.find((m) => m.token === "[INSTAGRAM]")!;
    expect(canRemoveToken(insta.fields)).toBe(true);
    expect(removeTokenLines("Acompanhe meu perfil: [INSTAGRAM]", "[INSTAGRAM]")).toBe("");
    expect(removeTokenLines("WhatsApp: [WHATSAPP]\nInstagram: [INSTAGRAM]\nAtendimento", "[INSTAGRAM]")).toBe("WhatsApp: [WHATSAPP]\nAtendimento");
  });
  it("nenhum modelo fica com marcadores pendentes quando o perfil está completo", () => {
    for (const t of templates) {
      const p = { ...createProject(t, profile), showAvailability: true };
      expect(unresolvedTokens(p, profile), t.id).toEqual([]);
    }
  });
});

describe("5, 6 e 7. edição e legenda", () => {
  it("restaura o texto original e valida limites", () => {
    const p = createProject(templateById.get("care_001")!, profile);
    p.fields.headline = "Meu título editado";
    expect(restoreField(p, "headline")).toBe(templateById.get("care_001")!.headline);
    p.fields.headline = "x".repeat(LIMITS.headline + 1);
    expect(fieldIssues(p).headline).toMatch(/no máximo/);
    p.fields.headline = "  ";
    expect(fieldIssues(p).headline).toMatch(/vazio/);
  });
  it("legenda final = legenda personalizada + hashtags, sem marcadores", () => {
    const p = createProject(templateById.get("booking_001")!, profile);
    p.fields.caption = "Fale comigo: [WHATSAPP]";
    const caption = finalCaption(p, profile);
    expect(caption).toBe(`Fale comigo: (11) 98765-4321\n\n${templateById.get("booking_001")!.hashtags.join(" ")}`);
    expect(tokensIn(caption)).toEqual([]);
  });
  it("valida hashtags", () => {
    expect(hashtagIssue("#cilios #lash_designer #extensão")).toBeNull();
    expect(hashtagIssue("#ok semcerquilha")).toMatch(/não é uma hashtag/);
    expect(hashtagIssue(Array.from({ length: 31 }, (_, i) => `#t${i}`).join(" "))).toMatch(/30/);
  });
  it("enquete exige 2 a 4 opções", () => {
    const p = createProject(templateById.get("poll_001")!, profile);
    p.fields.pollOptions = ["Só uma"];
    expect(fieldIssues(p).pollOptions).toBeDefined();
    p.fields.pollOptions = ["A", "B"];
    expect(fieldIssues(p).pollOptions).toBeUndefined();
  });
  it("17. duplicar cria outro projeto com novo ID", () => {
    const p = createProject(templateById.get("edu_001")!, profile);
    const copy = duplicateProject(p, "cópia", null);
    expect(copy.id).not.toBe(p.id);
    expect(copy.name).toBe(`${p.name} (cópia)`);
    expect(copy.fields).toEqual(p.fields);
  });
});

describe("10, 11, 12 e 14. composição por formato", () => {
  const base = (t = templateById.get("intro_002")!): LayoutInput => ({
    format: "portrait",
    hasPhoto: false,
    eyebrow: t.eyebrow,
    headline: resolveText(t.headline, tokenValues(profile)),
    supportingText: t.supportingText ?? "",
    pollOptions: t.pollOptions ?? [],
    availability: "",
    cta: resolveText(t.cta ?? "", tokenValues(profile)),
    footer: "@ana.lash",
  });
  it("tamanhos exatos de cada formato", () => {
    expect(computeLayout({ ...base(), format: "square" }, fakeMeasure)).toMatchObject({ width: 1080, height: 1080 });
    expect(computeLayout({ ...base(), format: "portrait" }, fakeMeasure)).toMatchObject({ width: 1080, height: 1350 });
    expect(computeLayout({ ...base(), format: "story" }, fakeMeasure)).toMatchObject({ width: 1080, height: 1920 });
  });
  it("cada formato tem composição própria (área da foto diferente)", () => {
    const photos = (["square", "portrait", "story"] as const).map((format) => computeLayout({ ...base(), format, hasPhoto: true }, fakeMeasure).photo);
    expect(new Set(photos.map((p) => JSON.stringify(p))).size).toBe(3);
    // Story deixa livres as faixas de topo/base que o Instagram cobre
    const story = computeLayout({ ...base(), format: "story" }, fakeMeasure);
    const ys = story.ops.filter((o) => o.kind === "text").map((o) => (o as { y: number }).y);
    expect(Math.min(...ys)).toBeGreaterThan(250);
    expect(Math.max(...ys)).toBeLessThan(1920 - 250);
  });
  it("todos os 100 modelos cabem em todos os formatos, com e sem foto", () => {
    const failures: string[] = [];
    for (const t of templates)
      for (const format of t.formats)
        for (const hasPhoto of t.imageSlots ? [false, true] : [false]) {
          const values = tokenValues(profile);
          const input: LayoutInput = {
            format,
            hasPhoto,
            eyebrow: t.eyebrow,
            headline: resolveText(t.headline, values),
            supportingText: resolveText(t.supportingText ?? "", values),
            pollOptions: t.pollOptions ?? [],
            availability: t.availabilityLine ?? "",
            cta: resolveText(t.cta ?? "", values),
            footer: "@ana.lash",
          };
          if (computeLayout(input, fakeMeasure).overflow) failures.push(`${t.id}/${format}/${hasPhoto ? "foto" : "sem foto"}`);
        }
    expect(failures).toEqual([]);
  });
  it("14. texto longo demais é sinalizado (nunca cortado em silêncio)", () => {
    const layout = computeLayout({ ...base(), format: "square", hasPhoto: true, supportingText: "Texto muito comprido. ".repeat(60) }, fakeMeasure);
    expect(layout.overflow).toBe(true);
    const all = layout.ops.filter((o) => o.kind === "text").map((o) => (o as { text: string }).text).join(" ");
    expect(all).toContain("comprido"); // o texto continua presente na composição
  });
  it("quebra palavras grandes demais em vez de passar da borda", () => {
    const lines = wrap("@" + "a".repeat(80), "400 40px DM Sans", 400, fakeMeasure);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.every((l) => fakeMeasure(l, "400 40px DM Sans") <= 400)).toBe(true);
  });
});

describe("8. tipos de imagem pelo conteúdo", () => {
  it("reconhece JPEG, PNG e WebP e recusa o resto", () => {
    expect(sniffImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(sniffImageType(strToU8("RIFF\0\0\0\0WEBPVP8 "))).toBe("image/webp");
    expect(sniffImageType(strToU8("<svg onload=alert(1)>"))).toBeNull();
    expect(sniffImageType(strToU8("GIF89a"))).toBeNull();
  });
});

describe("18, 19 e 20. backup", () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]);
  const image: StoredImage = { id: "img-1", blob: new Blob([jpeg], { type: "image/jpeg" }), type: "image/jpeg", width: 10, height: 10, createdAt: "2026-10-12T12:00:00.000Z" };
  const project = () => ({ ...createProject(templateById.get("intro_001")!, profile), image: { imageId: "img-1", zoom: 1.5, offsetX: 0.2, offsetY: -0.3 } });

  it("exporta e importa de volta projetos, fotos e perfil", async () => {
    const p = project();
    const zip = await createBackup([p], [image], profile);
    const restored = readBackup(zip);
    expect(restored.projects).toEqual([p]);
    expect(restored.images).toHaveLength(1);
    expect(new Uint8Array(await restored.images[0].blob.arrayBuffer())).toEqual(jpeg);
    expect(restored.profile?.professionalName).toBe(profile.professionalName);
  });
  it("importação adicional usa novos IDs (não sobrescreve o que existe)", async () => {
    const p = project();
    const restored = withNewIds(readBackup(await createBackup([p], [image], profile)));
    expect(restored.projects[0].id).not.toBe(p.id);
    expect(restored.projects[0].image!.imageId).toBe(restored.images[0].id);
    expect(restored.images[0].id).not.toBe("img-1");
  });
  it("recusa arquivos inválidos, inesperados ou maliciosos", async () => {
    expect(() => readBackup(strToU8("não é zip"))).toThrow(BackupError);
    expect(() => readBackup(zipSync({ "outro.txt": strToU8("x") }))).toThrow(/inesperado/);
    expect(() => readBackup(zipSync({ "../../etc/passwd": strToU8("x") }))).toThrow(/inesperado/);
    expect(() => readBackup(zipSync({ "manifest.json": strToU8("{quebrado") }))).toThrow(/danificado/);
    expect(() => readBackup(zipSync({ "manifest.json": strToU8(JSON.stringify({ app: "outro" })) }))).toThrow(/não é um backup/);
    // Foto declarada como JPEG mas que é outro arquivo
    const p = project();
    const fake = zipSync({
      "manifest.json": strToU8(JSON.stringify({ app: "bellash_instagram", formatVersion: 1, exportedAt: "", profile, projects: [p], images: [{ id: "img-1", file: "images/img-1.jpg", type: "image/jpeg" }] })),
      "images/img-1.jpg": strToU8("<script>alert(1)</script>"),
    });
    expect(() => readBackup(fake)).toThrow(/não é uma imagem válida/);
  });
  it("projeto com modelo inexistente é recusado", () => {
    expect(parseProject({ ...project(), templateId: "nao_existe" })).toBeNull();
    expect(parseProject({ ...project(), id: "<script>" })).toBeNull();
  });
});
