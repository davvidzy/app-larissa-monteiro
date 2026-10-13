import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { openPdf, renderPage } from "../lib/pdf";

type Props = { file: string; icon: LucideIcon; width: number; className?: string };

/** Capa do material: a 1ª página do próprio PDF, desenhada direto do arquivo.
    Defina a proporção pelo `className` (ex.: aspect-[210/297], de uma folha A4). */
export function PdfCover({ file, icon: Icon, width, className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    let cancelled = false;
    let task: Awaited<ReturnType<typeof renderPage>> | null = null;
    openPdf(file)
      .then((doc) => (canvasRef.current ? renderPage(doc, 1, canvasRef.current, width) : null))
      .then((t) => {
        task = t;
        return t?.promise;
      })
      .then(() => !cancelled && setState("ready"))
      .catch(() => !cancelled && setState("failed"));
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [file, width]);

  return (
    <div className={`relative overflow-hidden bg-white ${className}`}>
      <canvas ref={canvasRef} className={`block size-full object-cover object-top ${state === "ready" ? "" : "invisible"}`} aria-hidden="true" />
      {state !== "ready" && (
        <span className="absolute inset-0 flex items-center justify-center bg-soft-pink text-primary">
          <Icon aria-hidden="true" className={`size-10 ${state === "loading" ? "animate-pulse" : ""}`} strokeWidth={1.5} />
        </span>
      )}
    </div>
  );
}
