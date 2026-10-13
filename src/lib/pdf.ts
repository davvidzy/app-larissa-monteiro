import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";

/* O pdf.js (leitor de PDF da Mozilla, o mesmo do Firefox) vai junto no build e é
   servido pela própria hospedagem. Só é baixado quando a aluna abre um PDF,
   para não pesar a abertura do portal. */

let pdfjs: Promise<typeof import("pdfjs-dist")> | null = null;

function loadPdfJs() {
  pdfjs ??= Promise.all([import("pdfjs-dist"), import("pdfjs-dist/build/pdf.worker.min.mjs?url")]).then(
    ([lib, worker]) => {
      lib.GlobalWorkerOptions.workerSrc = worker.default;
      return lib;
    },
  );
  return pdfjs;
}

const documents = new Map<string, Promise<PDFDocumentProxy>>();

/** Abre o PDF (uma vez por arquivo; os próximos usos reaproveitam o mesmo documento). */
export function openPdf(url: string) {
  let doc = documents.get(url);
  if (!doc) {
    doc = loadPdfJs().then((lib) => lib.getDocument({ url }).promise);
    doc.catch(() => documents.delete(url));
    documents.set(url, doc);
  }
  return doc;
}

/** Proporção altura/largura da primeira página (para reservar o espaço antes de desenhar). */
export async function pageRatio(doc: PDFDocumentProxy) {
  const viewport = (await doc.getPage(1)).getViewport({ scale: 1 });
  return viewport.height / viewport.width;
}

export type PageLink = {
  /** Posição em pixels de tela, relativa ao canto superior esquerdo da página. */
  x: number;
  y: number;
  w: number;
  h: number;
} & ({ kind: "page"; page: number } | { kind: "url"; url: string });

/** Só endereços seguros viram link clicável (nada de javascript: ou file:). */
const SAFE_URL = /^(https?:|mailto:)/i;

/**
 * Links da página (sumário clicável, referências externas), já posicionados para a largura
 * em que a página está desenhada. Links internos são resolvidos para o número da página.
 */
export async function pageLinks(doc: PDFDocumentProxy, pageNumber: number, cssWidth: number): Promise<PageLink[]> {
  const page = await doc.getPage(pageNumber);
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: cssWidth / base.width });
  const links: PageLink[] = [];
  for (const a of await page.getAnnotations({ intent: "display" })) {
    if (a.subtype !== "Link" || !Array.isArray(a.rect)) continue;
    const [x1, y1] = viewport.convertToViewportPoint(a.rect[0], a.rect[1]) as number[];
    const [x2, y2] = viewport.convertToViewportPoint(a.rect[2], a.rect[3]) as number[];
    const box = { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) };
    if (typeof a.url === "string" && SAFE_URL.test(a.url)) {
      links.push({ ...box, kind: "url", url: a.url });
      continue;
    }
    if (!a.dest) continue;
    try {
      const explicit = typeof a.dest === "string" ? await doc.getDestination(a.dest) : a.dest;
      const ref = Array.isArray(explicit) ? explicit[0] : null;
      const index = typeof ref === "number" ? ref : ref && typeof ref === "object" ? await doc.getPageIndex(ref) : null;
      if (index !== null && index >= 0 && index < doc.numPages) links.push({ ...box, kind: "page", page: index + 1 });
    } catch {
      /* destino quebrado no PDF: ignora o link */
    }
  }
  return links;
}

/** Desenha uma página no canvas, na largura em pixels de tela informada. */
export async function renderPage(doc: PDFDocumentProxy, pageNumber: number, canvas: HTMLCanvasElement, cssWidth: number) {
  const page = await doc.getPage(pageNumber);
  const base = page.getViewport({ scale: 1 });
  // Nitidez em telas retina, limitada a 2× para não estourar a memória do celular
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const viewport = page.getViewport({ scale: (cssWidth / base.width) * pixelRatio });
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  return page.render({ canvas, viewport }) as RenderTask;
}
