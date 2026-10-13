/* Composição da arte: calcula a posição de cada texto/forma para o formato escolhido.
   Função pura (recebe a função de medir texto), para poder testar sem navegador.
   Cada formato tem regras próprias, não é só redimensionar. */

import type { PostFormat } from "./types";

export const SIZES: Record<PostFormat, { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
};

export const FORMAT_LABELS: Record<PostFormat, string> = {
  square: "Quadrado 1080 × 1080",
  portrait: "Vertical 1080 × 1350",
  story: "Story 1080 × 1920",
};

export const DISPLAY = '"Cormorant Garamond", Georgia, serif';
export const SANS = '"DM Sans", Arial, sans-serif';

export type Measure = (text: string, font: string, tracking?: number) => number;
export type ColorRole = "title" | "text" | "accent" | "button" | "buttonText" | "panel";

export type Rect = { x: number; y: number; w: number; h: number };

export type Op =
  | { kind: "text"; text: string; x: number; y: number; font: string; color: ColorRole; tracking?: number }
  | { kind: "pill"; x: number; y: number; w: number; h: number; fill?: ColorRole; stroke?: ColorRole }
  | { kind: "icon"; x: number; y: number; size: number };

export type LayoutInput = {
  format: PostFormat;
  hasPhoto: boolean;
  eyebrow: string;
  headline: string;
  supportingText: string;
  pollOptions: string[];
  availability: string;
  cta: string;
  footer: string;
};

export type Layout = {
  width: number;
  height: number;
  photo: (Rect & { radius: number }) | null;
  ops: Op[];
  /** true = o texto não coube nem no menor tamanho de fonte: a exportação deve ser bloqueada. */
  overflow: boolean;
  headlineSize: number;
};

type Frame = { text: Rect; photo: (Rect & { radius: number }) | null; footerY: number; head: [number, number]; body: [number, number] };

/* Áreas de cada formato. No story, as faixas de ~250px no topo e na base ficam livres
   porque o Instagram sobrepõe nome do perfil e campo de resposta. */
function frameFor(format: PostFormat, hasPhoto: boolean): Frame {
  if (format === "square") {
    return hasPhoto
      ? { photo: { x: 0, y: 0, w: 1080, h: 470, radius: 0 }, text: { x: 96, y: 510, w: 888, h: 470 }, footerY: 1030, head: [64, 36], body: [30, 22] }
      : { photo: null, text: { x: 110, y: 110, w: 860, h: 800 }, footerY: 1010, head: [96, 46], body: [38, 26] };
  }
  if (format === "portrait") {
    return hasPhoto
      ? { photo: { x: 0, y: 0, w: 1080, h: 620, radius: 0 }, text: { x: 96, y: 664, w: 888, h: 576 }, footerY: 1294, head: [74, 40], body: [32, 24] }
      : { photo: null, text: { x: 110, y: 140, w: 860, h: 1000 }, footerY: 1270, head: [108, 50], body: [40, 28] };
  }
  return hasPhoto
    ? { photo: { x: 80, y: 250, w: 920, h: 800, radius: 40 }, text: { x: 110, y: 1090, w: 860, h: 500 }, footerY: 1640, head: [74, 42], body: [34, 26] }
    : { photo: null, text: { x: 110, y: 290, w: 860, h: 1290 }, footerY: 1640, head: [118, 56], body: [44, 30] };
}

/** Quebra o texto em linhas que cabem em maxW (respeita Enter; palavras longas demais são partidas). */
export function wrap(text: string, font: string, maxW: number, measure: Measure, tracking = 0): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (measure(candidate, font, tracking) <= maxW) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      // Palavra maior que a linha (ex.: e-mail ou @ enorme): parte por caracteres
      let chunk = "";
      for (const ch of Array.from(word)) {
        if (measure(chunk + ch, font, tracking) > maxW && chunk) {
          lines.push(chunk);
          chunk = ch;
        } else chunk += ch;
      }
      line = chunk;
    }
    lines.push(line);
  }
  // Remove linhas vazias do começo/fim (Enter sobrando)
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  return lines;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function computeLayout(input: LayoutInput, measure: Measure): Layout {
  const { width, height } = SIZES[input.format];
  const frame = frameFor(input.format, input.hasPhoto);
  const { text: area } = frame;
  const cx = area.x + area.w / 2;
  const [headMax, headMin] = frame.head;
  const [bodyMax, bodyMin] = frame.body;

  const build = (H: number) => {
    const S = clamp(Math.round(H * 0.42), bodyMin, bodyMax);
    const E = Math.round(S * 0.72);
    const C = Math.round(S * 0.9);
    const ops: Op[] = [];
    const parts: { height: number; draw: (y: number) => void }[] = [];
    const gap = Math.round(S * 1.1);

    const textBlock = (text: string, font: string, size: number, lh: number, color: ColorRole, tracking = 0, maxW = area.w) => {
      const lines = wrap(text, font, maxW, measure, tracking);
      if (!lines.length) return;
      parts.push({
        height: lines.length * size * lh,
        draw: (y) =>
          lines.forEach((line, i) =>
            ops.push({ kind: "text", text: line, x: cx, y: y + size * lh * i + size * lh * 0.78, font, color, tracking: tracking || undefined }),
          ),
      });
    };

    const pillBlock = (text: string, size: number, style: "button" | "outline") => {
      const font = `700 ${size}px ${SANS}`;
      const padX = size * 1.4;
      const lines = wrap(text, font, area.w - padX * 2, measure, 1);
      if (!lines.length) return;
      const lineH = size * 1.3;
      const h = lines.length * lineH + size * 1.3;
      const w = Math.min(area.w, Math.max(...lines.map((l) => measure(l, font, 1))) + padX * 2);
      parts.push({
        height: h,
        draw: (y) => {
          ops.push({ kind: "pill", x: cx - w / 2, y, w, h, ...(style === "button" ? { fill: "button" as const } : { stroke: "accent" as const }) });
          lines.forEach((line, i) =>
            ops.push({ kind: "text", text: line, x: cx, y: y + size * 0.65 + lineH * i + lineH * 0.78, font, color: style === "button" ? "buttonText" : "accent", tracking: 1 }),
          );
        },
      });
    };

    if (!input.hasPhoto) {
      const icon = Math.round(H * 0.62);
      parts.push({ height: icon * 0.55, draw: (y) => ops.push({ kind: "icon", x: cx, y, size: icon }) });
    }
    if (input.eyebrow.trim()) textBlock(input.eyebrow.toUpperCase(), `700 ${E}px ${SANS}`, E, 1.25, "accent", Math.round(E * 0.16));
    if (input.headline.trim()) textBlock(input.headline, `600 ${H}px ${DISPLAY}`, H, 1.08, "title");
    if (input.supportingText.trim()) textBlock(input.supportingText, `400 ${S}px ${SANS}`, S, 1.4, "text");

    const options = input.pollOptions.map((o) => o.trim()).filter(Boolean);
    if (options.length) {
      const P = Math.round(S * 1.05);
      const font = `600 ${P}px ${SANS}`;
      const boxW = Math.min(area.w, 820);
      const rows = options.map((o) => wrap(o, font, boxW - P * 2, measure));
      const boxH = rows.map((r) => r.length * P * 1.25 + P * 1.2);
      const spacing = Math.round(P * 0.55);
      parts.push({
        height: boxH.reduce((a, b) => a + b, 0) + spacing * (options.length - 1),
        draw: (y) => {
          let cy = y;
          rows.forEach((r, i) => {
            ops.push({ kind: "pill", x: cx - boxW / 2, y: cy, w: boxW, h: boxH[i], fill: "panel", stroke: "accent" });
            r.forEach((line, j) => ops.push({ kind: "text", text: line, x: cx, y: cy + P * 0.6 + P * 1.25 * j + P * 1.25 * 0.78, font, color: "title" }));
            cy += boxH[i] + spacing;
          });
        },
      });
    }

    if (input.availability.trim()) pillBlock(input.availability, E + 2, "outline");
    if (input.cta.trim()) pillBlock(input.cta, C, "button");

    const total = parts.reduce((sum, p) => sum + p.height, 0) + gap * Math.max(0, parts.length - 1);
    return { ops, parts, total, gap };
  };

  let H = headMax;
  let attempt = build(H);
  while (attempt.total > area.h && H > headMin) {
    H -= 2;
    attempt = build(H);
  }
  const overflow = attempt.total > area.h;

  // Centraliza o bloco de texto na área (se estourar, começa do topo para o problema ficar visível)
  let y = overflow ? area.y : area.y + (area.h - attempt.total) / 2;
  for (const part of attempt.parts) {
    part.draw(y);
    y += part.height + attempt.gap;
  }

  if (input.footer.trim()) {
    const font = `500 ${frame.body[1] + 4}px ${SANS}`;
    const footer = wrap(input.footer, font, area.w, measure)[0] ?? "";
    attempt.ops.push({ kind: "text", text: footer, x: width / 2, y: frame.footerY, font, color: "accent" });
  }

  return { width, height, photo: frame.photo, ops: attempt.ops, overflow, headlineSize: H };
}
