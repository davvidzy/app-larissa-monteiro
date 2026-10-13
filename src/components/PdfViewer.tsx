import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Download, LoaderCircle, X } from "lucide-react";
import type { Material } from "../config/portal";
import { openPdf, type PageLink, pageLinks, pageRatio, renderPage } from "../lib/pdf";
import { buttonClass } from "./ui/Button";

const PAGE_GAP = 16;

/** Uma página: reserva o espaço e só desenha quando chega perto da área visível. */
function PdfPage({ doc, pageNumber, width, ratio, onNavigate, scrollRoot }: {
  doc: PDFDocumentProxy;
  /** Área que rola: a antecipação (rootMargin) precisa ser medida nela, não na janela. */
  scrollRoot: HTMLElement | null;
  pageNumber: number;
  width: number;
  ratio: number;
  onNavigate: (page: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  const [drawn, setDrawn] = useState(false);
  const [links, setLinks] = useState<PageLink[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setVisible(true), {
      root: scrollRoot,
      rootMargin: "1200px 0px",
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [scrollRoot]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!visible || !canvas || width <= 0) return;
    let cancelled = false;
    let task: Awaited<ReturnType<typeof renderPage>> | null = null;
    renderPage(doc, pageNumber, canvas, width)
      .then((t) => {
        task = t;
        if (cancelled) t.cancel();
        return t.promise;
      })
      .then(() => !cancelled && setDrawn(true))
      .catch(() => undefined); // cancelamento ao fechar ou redimensionar
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [doc, pageNumber, width, visible]);

  // Links do PDF (sumário clicável, referências) por cima da página desenhada
  useEffect(() => {
    if (!visible || width <= 0) return;
    let active = true;
    pageLinks(doc, pageNumber, width)
      .then((l) => active && setLinks(l))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [doc, pageNumber, width, visible]);

  return (
    <div className="relative mx-auto overflow-hidden rounded-[6px] bg-white shadow-card" style={{ width, height: width * ratio }}>
      <canvas ref={canvasRef} role="img" aria-label={`Página ${pageNumber}`} className="block size-full" />
      {!drawn && (
        <span className="absolute inset-0 flex items-center justify-center text-[13px] text-[#B7A7AF]">{pageNumber}</span>
      )}
      {drawn &&
        links.map((link, i) => {
          const style = { left: link.x, top: link.y, width: link.w, height: link.h };
          const cls = "absolute rounded-[3px] hover:bg-primary/10 focus-visible:bg-primary/10";
          return link.kind === "url" ? (
            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" aria-label={`Abrir link externo: ${link.url}`} className={cls} style={style} />
          ) : (
            <button key={i} type="button" onClick={() => onNavigate(link.page)} aria-label={`Ir para a página ${link.page}`} className={`${cls} cursor-pointer`} style={style} data-goto={link.page} />
          );
        })}
    </div>
  );
}

type Props = { material: Material; onClose: () => void };

/** Leitura do PDF em tela cheia: páginas em rolagem e o botão de baixar sempre à mão. */
export function PdfViewer({ material, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [ratio, setRatio] = useState(Math.SQRT2);
  const [failed, setFailed] = useState(false);
  const [width, setWidth] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dialogRef.current?.showModal();
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    let active = true;
    openPdf(material.file)
      .then(async (loaded) => {
        const r = await pageRatio(loaded);
        if (!active) return;
        setRatio(r);
        setDoc(loaded);
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [material.file]);

  // Largura das páginas acompanha a tela (até 820px no computador)
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.min(entry.contentRect.width - 24, 820)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  /** Rola até a página (links do sumário). */
  function goToPage(page: number) {
    const element = scrollRef.current;
    if (!element || width <= 0) return;
    element.scrollTo({ top: (page - 1) * (width * ratio + PAGE_GAP), behavior: "smooth" });
    setCurrentPage(page);
  }

  function handleScroll() {
    const element = scrollRef.current;
    if (!element || !doc || width <= 0) return;
    const pageHeight = width * ratio + PAGE_GAP;
    const page = Math.floor((element.scrollTop + element.clientHeight / 3) / pageHeight) + 1;
    setCurrentPage(Math.min(Math.max(page, 1), doc.numPages));
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      aria-label={material.title}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-[#EDE6E9] p-0 text-ink backdrop:bg-[#161216]/60"
    >
      <div className="flex h-full flex-col">
        {/* Topo */}
        <div className="flex items-center gap-3 border-b border-line bg-surface px-3 py-2 md:px-6">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-ink-soft hover:bg-blush hover:text-primary"
          >
            <X aria-hidden="true" className="size-6" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold text-ink">{material.title}</p>
            {doc && (
              <p className="text-[13px] text-ink-soft" aria-live="polite">
                Página {currentPage} de {doc.numPages}
              </p>
            )}
          </div>
          {/* No celular o botão fica fixo embaixo */}
          <div className="hidden md:block">
            <a href={material.file} download className={buttonClass({ variant: "outline", size: "md" })}>
              <Download aria-hidden="true" className="size-4" />
              Baixar PDF
            </a>
          </div>
        </div>

        {/* Páginas */}
        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
          {failed ? (
            <div className="mx-auto mt-16 max-w-[360px] text-center">
              <p className="font-bold text-ink">Não foi possível abrir a prévia.</p>
              <p className="mt-1 text-[14px] text-ink-soft">Você ainda pode baixar o PDF pelo botão abaixo.</p>
            </div>
          ) : !doc ? (
            <div className="mt-24 flex flex-col items-center gap-3 text-ink-soft">
              <LoaderCircle aria-hidden="true" className="size-8 animate-spin text-primary" />
              <p className="text-[14px]">Abrindo material…</p>
            </div>
          ) : (
            <div className="flex flex-col" style={{ gap: PAGE_GAP }}>
              {Array.from({ length: doc.numPages }, (_, index) => (
                <PdfPage key={index} doc={doc} pageNumber={index + 1} width={width} ratio={ratio} onNavigate={goToPage} scrollRoot={scrollRef.current} />
              ))}
            </div>
          )}
        </div>

        {/* Baixar (celular): fixo embaixo, sempre visível */}
        <div className="border-t border-line bg-surface p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
          <a href={material.file} download className={buttonClass({ fullWidth: true })}>
            <Download aria-hidden="true" className="size-5" />
            Baixar PDF
          </a>
        </div>
      </div>
    </dialog>
  );
}
