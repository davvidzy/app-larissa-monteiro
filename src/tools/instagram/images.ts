/* Fotos da usuária: validação, redução de tamanho e leitura. Tudo no navegador. */

import { uid } from "./projects";
import type { StoredImage } from "./types";

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
/** Lado maior da foto guardada: suficiente para 1080px com zoom, sem pesar o armazenamento. */
const MAX_SIDE = 2160;
export const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

/** Confere o tipo pelo conteúdo do arquivo (não só pela extensão). */
export function sniffImageType(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b)) return "image/png";
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "image/webp";
  return null;
}

export class ImageError extends Error {}

export type LoadedImage = { source: CanvasImageSource; width: number; height: number; close: () => void };

/** Decodifica uma imagem (Blob) para desenhar no canvas. */
export async function loadImage(blob: Blob): Promise<LoadedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(blob);
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch {
      /* alguns Safari antigos: cai no <img> abaixo */
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch {
    URL.revokeObjectURL(url);
    throw new ImageError("Não foi possível abrir esta imagem.");
  }
}

/** Valida o arquivo escolhido e prepara a versão que será guardada. */
export async function prepareImage(file: File): Promise<StoredImage> {
  if (file.size > MAX_UPLOAD_BYTES) throw new ImageError("A foto é maior que 15 MB. Escolha uma imagem menor.");
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const type = sniffImageType(head);
  if (!type) throw new ImageError("Formato não aceito. Use JPEG, PNG ou WebP.");

  const loaded = await loadImage(file);
  try {
    const ratio = Math.min(1, MAX_SIDE / Math.max(loaded.width, loaded.height));
    const width = Math.round(loaded.width * ratio);
    const height = Math.round(loaded.height * ratio);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new ImageError("Não foi possível processar a imagem.");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(loaded.source, 0, 0, width, height);
    const outType = type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, outType, 0.9));
    if (!blob) throw new ImageError("Não foi possível processar a imagem.");
    return { id: uid(), blob, type: outType, width, height, createdAt: new Date().toISOString() };
  } finally {
    loaded.close();
  }
}
