/* Geração do PDF no próprio navegador com jsPDF (vai junto no build, sem serviço externo).
   A biblioteca só é carregada quando a profissional pede o PDF. */

import type { jsPDF as JsPDF } from "jspdf";
import type { DocBlock, FichaDocument } from "./document";

/* As fontes padrão do PDF (Helvetica) usam a codificação WinAnsi: cobre todos os acentos
   do português. Caracteres fora dela (emoji, por exemplo) viram "?" em vez de quebrar o texto. */
const WIN_ANSI_EXTRA = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";

export function toPdfText(text: string) {
  return Array.from(text.normalize("NFC"))
    .map((ch) => {
      const code = ch.codePointAt(0)!;
      if (ch === "\n" || (code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff) || WIN_ANSI_EXTRA.includes(ch)) return ch;
      if (ch === "\t") return " ";
      if (ch === "\r") return "";
      return "?";
    })
    .join("");
}

const PAGE = { width: 210, height: 297, margin: 18 };
const CONTENT_W = PAGE.width - PAGE.margin * 2;
const BOTTOM = PAGE.height - 20; // espaço do rodapé
const COLORS = {
  wine: [134, 45, 89] as const,
  ink: [35, 29, 33] as const,
  soft: [80, 69, 75] as const,
  muted: [108, 94, 102] as const,
  line: [220, 207, 213] as const,
  amber: [135, 81, 13] as const,
  amberBg: [255, 250, 235] as const,
};

/** Desenha o documento num jsPDF. Separado para poder testar sem o navegador. */
export function renderDocument(doc: JsPDF, content: FichaDocument) {
  let y = PAGE.margin;
  const lh = (size: number) => size * 0.42; // altura de linha em mm para um tamanho de fonte em pt

  const setText = (size: number, style: "normal" | "bold", color: readonly [number, number, number]) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
  };
  const newPage = () => {
    doc.addPage();
    y = PAGE.margin;
  };
  const ensure = (height: number) => {
    if (y + height > BOTTOM) newPage();
  };
  /** Escreve texto quebrando linhas e, se preciso, continuando na página seguinte (nunca corta). */
  const write = (text: string, opts: { size: number; style?: "normal" | "bold"; color?: readonly [number, number, number]; indent?: number; after?: number; bar?: readonly [number, number, number] }) => {
    const { size, style = "normal", color = COLORS.ink, indent = 0, after = 0, bar } = opts;
    setText(size, style, color);
    const lines: string[] = doc.splitTextToSize(toPdfText(text), CONTENT_W - indent);
    for (const line of lines) {
      ensure(lh(size));
      if (bar) {
        doc.setFillColor(bar[0], bar[1], bar[2]);
        doc.rect(PAGE.margin, y - 0.4, 1, lh(size), "F");
      }
      doc.text(line, PAGE.margin + indent, y + lh(size) * 0.78);
      y += lh(size);
    }
    y += after;
  };

  // Cabeçalho
  write("BELLASH ACADEMY", { size: 8, style: "bold", color: COLORS.wine, after: 1.5 });
  write(content.title, { size: 18, style: "bold", color: COLORS.ink, after: 1 });
  write(content.subtitle, { size: 10, color: COLORS.soft, after: 3 });
  doc.setDrawColor(COLORS.wine[0], COLORS.wine[1], COLORS.wine[2]);
  doc.setLineWidth(0.6);
  doc.line(PAGE.margin, y, PAGE.width - PAGE.margin, y);
  y += 6;

  const block = (b: DocBlock) => {
    switch (b.kind) {
      case "subheading":
        ensure(12);
        write(b.text, { size: 10.5, style: "bold", color: COLORS.soft, after: 1.5 });
        break;
      case "field":
        ensure(lh(8.5) + lh(10.5) + 2); // rótulo nunca fica sozinho no fim da página
        write(b.label, { size: 8.5, style: "bold", color: COLORS.muted, after: 0.6 });
        write(b.value, { size: 10.5, color: b.empty ? COLORS.muted : COLORS.ink, after: 3 });
        break;
      case "qa":
        ensure(lh(10) * 2 + lh(10.5) + 2);
        write(`${b.number}. ${b.question}`, { size: 10, color: COLORS.ink, after: 0.6 });
        write(`Resposta: ${b.answer}`, { size: 10.5, style: "bold", color: b.empty ? COLORS.muted : COLORS.wine, indent: 4, after: 3 });
        break;
      case "alert":
        ensure(lh(10) * 3);
        write(`${b.text} (pergunta${b.questions.length > 1 ? "s" : ""} ${b.questions.join(", ")})`, {
          size: 10,
          style: "bold",
          color: COLORS.amber,
          indent: 4,
          after: 3,
          bar: COLORS.amber,
        });
        break;
      case "check": {
        setText(10.5, "normal", COLORS.ink);
        const lines: string[] = doc.splitTextToSize(toPdfText(b.text), CONTENT_W - 8);
        ensure(lh(10.5) * lines.length);
        doc.setDrawColor(COLORS.soft[0], COLORS.soft[1], COLORS.soft[2]);
        doc.setLineWidth(0.3);
        doc.rect(PAGE.margin, y + 0.6, 3.6, 3.6);
        if (b.checked) {
          doc.setLineWidth(0.5);
          doc.line(PAGE.margin + 0.7, y + 2.5, PAGE.margin + 1.5, y + 3.5);
          doc.line(PAGE.margin + 1.5, y + 3.5, PAGE.margin + 3, y + 1.3);
        }
        write(`${b.text}${b.checked ? "" : " (não registrada)"}`, { size: 10.5, color: b.checked ? COLORS.ink : COLORS.muted, indent: 7, after: 2 });
        break;
      }
      case "paragraph":
        write(b.text, { size: b.muted ? 9 : 10.5, color: b.muted ? COLORS.muted : COLORS.ink, after: 2.5 });
        break;
      case "signatures": {
        ensure(42);
        y += 14;
        const half = (CONTENT_W - 12) / 2;
        doc.setDrawColor(COLORS.ink[0], COLORS.ink[1], COLORS.ink[2]);
        doc.setLineWidth(0.3);
        doc.line(PAGE.margin, y, PAGE.margin + half, y);
        doc.line(PAGE.margin + half + 12, y, PAGE.width - PAGE.margin, y);
        setText(9, "normal", COLORS.soft);
        doc.text("Assinatura da cliente", PAGE.margin, y + 4.5);
        doc.text(toPdfText(`Assinatura da profissional${b.professional ? ` — ${b.professional}` : ""}`), PAGE.margin + half + 12, y + 4.5, {
          maxWidth: half,
        });
        y += 12;
        write(`Local e data: ____________________________, ${b.date}`, { size: 9, color: COLORS.soft });
        break;
      }
    }
  };

  for (const section of content.sections) {
    ensure(22); // título da seção não fica sozinho no fim da página
    y += 2;
    write(section.title, { size: 12.5, style: "bold", color: COLORS.wine, after: 1.2 });
    doc.setDrawColor(COLORS.line[0], COLORS.line[1], COLORS.line[2]);
    doc.setLineWidth(0.3);
    doc.line(PAGE.margin, y, PAGE.width - PAGE.margin, y);
    y += 4;
    section.blocks.forEach(block);
  }

  // Rodapé em todas as páginas
  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page++) {
    doc.setPage(page);
    setText(7.5, "normal", COLORS.muted);
    const footer: string[] = doc.splitTextToSize(toPdfText(content.footer), CONTENT_W - 25);
    doc.text(footer, PAGE.margin, PAGE.height - 12);
    doc.text(`Página ${page} de ${total}`, PAGE.width - PAGE.margin, PAGE.height - 12, { align: "right" });
  }
  return doc;
}

/** Cria o PDF (carregando o jsPDF sob demanda) e devolve o arquivo. */
export async function createPdf(content: FichaDocument): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  doc.setProperties({ title: content.title, creator: "Bellash Academy" });
  renderDocument(doc, content);
  return doc.output("blob");
}

/** Entrega o arquivo para a profissional salvar no aparelho. */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Tempo folgado: o Safari do iPhone abre o arquivo antes de concluir o download
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
