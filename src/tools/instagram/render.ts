/* Desenho da arte no canvas (prévia e exportação PNG usam o mesmo código). */

import { computeLayout, DISPLAY, type Layout, type LayoutInput, SANS } from "./layout";
import { resolveText, tokenValues } from "./placeholders";
import type { Profile, Project, ProjectImage, ThemeId } from "./types";

export const THEMES: Record<ThemeId, { label: string; bg: [string, string]; title: string; text: string; accent: string; button: string; buttonText: string; panel: string; frame?: boolean }> = {
  blush: { label: "Rosa claro", bg: ["#FFF6FA", "#F6D0E0"], title: "#301827", text: "#50454B", accent: "#A44B74", button: "#862D59", buttonText: "#FFFFFF", panel: "rgba(255,255,255,0.75)" },
  wine: { label: "Vinho", bg: ["#482239", "#21101C"], title: "#FFFFFF", text: "#EDE6E9", accent: "#E9D4AC", button: "#D8B77E", buttonText: "#21101C", panel: "rgba(255,255,255,0.08)", frame: true },
  cream: { label: "Creme", bg: ["#FFFFFF", "#FBF5E9"], title: "#301827", text: "#50454B", accent: "#967445", button: "#F6D0E0", buttonText: "#672443", panel: "rgba(255,255,255,0.9)", frame: true },
  rose: { label: "Rosa intenso", bg: ["#862D59", "#BD5687"], title: "#FFFFFF", text: "#FCEAF2", accent: "#F6D0E0", button: "#FFFFFF", buttonText: "#862D59", panel: "rgba(255,255,255,0.12)" },
};

const EMOJI_FALLBACK = ', "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"';
const withEmoji = (font: string) => font + EMOJI_FALLBACK;

let fontsReady: Promise<unknown> | null = null;
/** As fontes da marca precisam estar carregadas antes de medir/desenhar. */
export function loadFonts() {
  fontsReady ??= Promise.all([
    document.fonts.load(`600 100px ${DISPLAY}`),
    document.fonts.load(`400 40px ${SANS}`),
    document.fonts.load(`500 40px ${SANS}`),
    document.fonts.load(`600 40px ${SANS}`),
    document.fonts.load(`700 40px ${SANS}`),
  ]).catch(() => undefined);
  return fontsReady;
}

let measureCtx: CanvasRenderingContext2D | null = null;
export function canvasMeasure(text: string, font: string, tracking = 0) {
  measureCtx ??= document.createElement("canvas").getContext("2d");
  const ctx = measureCtx!;
  ctx.font = withEmoji(font);
  ctx.letterSpacing = `${tracking}px`;
  return ctx.measureText(text).width;
}

/** Textos finais do projeto (marcadores resolvidos) prontos para a composição. */
export function layoutInputFor(project: Project, profile: Profile, hasPhoto: boolean): LayoutInput {
  const values = tokenValues(profile, project);
  const r = (t: string) => resolveText(t, values);
  return {
    format: project.format,
    hasPhoto,
    eyebrow: r(project.fields.eyebrow),
    headline: r(project.fields.headline),
    supportingText: r(project.fields.supportingText),
    pollOptions: project.fields.pollOptions.map(r),
    availability: project.showAvailability ? r(project.fields.availabilityLine) : "",
    cta: r(project.fields.cta),
    footer: values["[INSTAGRAM]"] || values["[NOME_ESTUDIO]"] || values["[NOME_PROFISSIONAL]"],
  };
}

export function layoutFor(project: Project, profile: Profile, hasPhoto: boolean): Layout {
  return computeLayout(layoutInputFor(project, profile, hasPhoto), canvasMeasure);
}

/* Ícone do cílio da logo (120×60) */
const LASH_EYE = typeof Path2D !== "undefined" ? new Path2D("M32 28 Q60 0 88 28 Q60 46 32 28Z") : null;
const LASH_HAIRS = typeof Path2D !== "undefined" ? new Path2D("M37 22 L31 12 M48 17 L46 6 M61 17 L62 4 M74 18 L79 7 M85 22 L92 13") : null;

/** Posição da foto dentro da área: cobre a área, com zoom e deslocamento (-1 a 1). */
export function photoPlacement(area: { x: number; y: number; w: number; h: number }, imgW: number, imgH: number, crop: Pick<ProjectImage, "zoom" | "offsetX" | "offsetY">) {
  const scale = Math.max(area.w / imgW, area.h / imgH) * Math.min(3, Math.max(1, crop.zoom));
  const w = imgW * scale;
  const h = imgH * scale;
  const ox = Math.min(1, Math.max(-1, crop.offsetX));
  const oy = Math.min(1, Math.max(-1, crop.offsetY));
  return { x: area.x - (w - area.w) * ((ox + 1) / 2), y: area.y - (h - area.h) * ((oy + 1) / 2), w, h };
}

export type DrawOptions = { photo?: { source: CanvasImageSource; width: number; height: number; crop: ProjectImage } | null; scale?: number; showOverflow?: boolean };

export function drawLayout(canvas: HTMLCanvasElement, layout: Layout, themeId: ThemeId, opts: DrawOptions = {}) {
  const scale = opts.scale ?? 1;
  const theme = THEMES[themeId];
  canvas.width = Math.round(layout.width * scale);
  canvas.height = Math.round(layout.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  const g = ctx.createLinearGradient(0, 0, layout.width, layout.height);
  g.addColorStop(0, theme.bg[0]);
  g.addColorStop(1, theme.bg[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, layout.width, layout.height);

  if (theme.frame && !layout.photo) {
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 3;
    ctx.strokeRect(44, 44, layout.width - 88, layout.height - 88);
  }

  if (layout.photo) {
    const area = layout.photo;
    ctx.save();
    ctx.beginPath();
    if (area.radius) ctx.roundRect(area.x, area.y, area.w, area.h, area.radius);
    else ctx.rect(area.x, area.y, area.w, area.h);
    ctx.clip();
    if (opts.photo) {
      const p = photoPlacement(area, opts.photo.width, opts.photo.height, opts.photo.crop);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(opts.photo.source, p.x, p.y, p.w, p.h);
    } else {
      ctx.fillStyle = theme.panel;
      ctx.fillRect(area.x, area.y, area.w, area.h);
    }
    ctx.restore();
  }

  const color = (role: keyof typeof theme) => theme[role] as string;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  for (const op of layout.ops) {
    if (op.kind === "pill") {
      ctx.beginPath();
      ctx.roundRect(op.x, op.y, op.w, op.h, Math.min(op.h / 2, 60));
      if (op.fill) {
        ctx.fillStyle = color(op.fill);
        ctx.fill();
      }
      if (op.stroke) {
        ctx.strokeStyle = color(op.stroke);
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    } else if (op.kind === "icon") {
      if (!LASH_EYE || !LASH_HAIRS) continue;
      const s = op.size / 120;
      ctx.save();
      ctx.translate(op.x - 60 * s, op.y - 4 * s);
      ctx.scale(s, s);
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 2.3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke(LASH_EYE);
      ctx.stroke(LASH_HAIRS);
      ctx.restore();
    } else {
      ctx.font = withEmoji(op.font);
      ctx.letterSpacing = `${op.tracking ?? 0}px`;
      ctx.fillStyle = color(op.color);
      ctx.fillText(op.text, op.x, op.y);
    }
  }
  ctx.letterSpacing = "0px";

  if (opts.showOverflow && layout.overflow) {
    ctx.strokeStyle = "#C83E55";
    ctx.lineWidth = 10;
    ctx.setLineDash([30, 20]);
    ctx.strokeRect(5, 5, layout.width - 10, layout.height - 10);
    ctx.setLineDash([]);
  }
}

/** Gera o PNG final no tamanho exato do formato. */
export function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Falha ao gerar a imagem"))), "image/png"));
}
