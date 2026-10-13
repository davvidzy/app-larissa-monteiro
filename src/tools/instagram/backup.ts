/* Backup em ZIP: manifest.json (dados + versão) e a pasta images/ com as fotos.
   A importação só lê os nomes esperados, confere tamanho e tipo real de cada arquivo
   e nunca executa nada: o JSON é só lido e validado. */

import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { sniffImageType } from "./images";
import { ID_RE, parseProfile, parseProject, uid } from "./projects";
import type { Profile, Project, StoredImage } from "./types";

export const BACKUP_FORMAT = 1;
export const BACKUP_FILE_NAME = "bellash_instagram_backup.zip";
export const BACKUP_LIMITS = { zipBytes: 200 * 1024 * 1024, imageBytes: 15 * 1024 * 1024, manifestBytes: 5 * 1024 * 1024, projects: 1000 };

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const IMAGE_NAME = /^images\/([A-Za-z0-9-]{1,64})\.(jpg|png|webp)$/;

type Manifest = {
  app: "bellash_instagram";
  formatVersion: number;
  exportedAt: string;
  profile: Profile;
  projects: Project[];
  images: { id: string; file: string; type: string; width: number; height: number; createdAt: string }[];
};

export async function createBackup(projects: Project[], images: StoredImage[], profile: Profile, now = new Date().toISOString()): Promise<Uint8Array> {
  const files: Record<string, Uint8Array> = {};
  const manifest: Manifest = {
    app: "bellash_instagram",
    formatVersion: BACKUP_FORMAT,
    exportedAt: now,
    profile,
    projects,
    images: images.map((img) => ({ id: img.id, file: `images/${img.id}.${EXT[img.type] ?? "jpg"}`, type: img.type, width: img.width, height: img.height, createdAt: img.createdAt })),
  };
  for (const [i, img] of images.entries()) files[manifest.images[i].file] = new Uint8Array(await img.blob.arrayBuffer());
  files["manifest.json"] = strToU8(JSON.stringify(manifest, null, 2));
  // Fotos já são comprimidas: guardar sem recomprimir (mais rápido)
  return zipSync(files, { level: 0 });
}

export class BackupError extends Error {}

export type RestoredBackup = { profile: Profile | null; projects: Project[]; images: StoredImage[] };

/**
 * Lê e valida um backup. Arquivos com nomes inesperados, grandes demais ou de tipo
 * diferente do declarado fazem o backup inteiro ser recusado.
 */
export function readBackup(data: Uint8Array): RestoredBackup {
  if (data.byteLength > BACKUP_LIMITS.zipBytes) throw new BackupError("O arquivo é grande demais para ser um backup.");
  if (!(data[0] === 0x50 && data[1] === 0x4b)) throw new BackupError("Este arquivo não é um backup do Kit Instagram (.zip).");

  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(data, {
      filter: (file) => {
        if (file.name.endsWith("/")) return false; // pastas
        const ok = file.name === "manifest.json" || IMAGE_NAME.test(file.name);
        if (!ok) throw new BackupError(`O backup contém um arquivo inesperado: ${file.name.slice(0, 60)}`);
        const max = file.name === "manifest.json" ? BACKUP_LIMITS.manifestBytes : BACKUP_LIMITS.imageBytes;
        if (file.originalSize > max) throw new BackupError("O backup contém um arquivo grande demais.");
        return true;
      },
    });
  } catch (error) {
    if (error instanceof BackupError) throw error;
    throw new BackupError("Não foi possível abrir o arquivo. Ele pode estar danificado.");
  }

  const raw = entries["manifest.json"];
  if (!raw) throw new BackupError("Este arquivo não é um backup do Kit Instagram.");
  let manifest: unknown;
  try {
    manifest = JSON.parse(strFromU8(raw));
  } catch {
    throw new BackupError("O backup está danificado (dados ilegíveis).");
  }
  const m = manifest as Partial<Manifest>;
  if (!m || typeof m !== "object" || m.app !== "bellash_instagram") throw new BackupError("Este arquivo não é um backup do Kit Instagram.");
  if (m.formatVersion !== BACKUP_FORMAT) throw new BackupError("Este backup foi feito em uma versão diferente da ferramenta.");
  if (!Array.isArray(m.projects) || !Array.isArray(m.images) || m.projects.length > BACKUP_LIMITS.projects) throw new BackupError("O backup está incompleto ou danificado.");

  const images: StoredImage[] = [];
  for (const info of m.images) {
    if (!info || typeof info !== "object" || typeof info.id !== "string" || !ID_RE.test(info.id) || typeof info.file !== "string") throw new BackupError("O backup contém uma foto inválida.");
    const bytes = entries[info.file];
    const match = IMAGE_NAME.exec(info.file);
    if (!bytes || !match || match[1] !== info.id) throw new BackupError("Falta uma foto no backup.");
    const type = sniffImageType(bytes);
    if (!type || type !== info.type) throw new BackupError("Uma das fotos do backup não é uma imagem válida.");
    images.push({
      id: info.id,
      blob: new Blob([bytes.slice()], { type }),
      type,
      width: Number.isFinite(info.width) ? info.width : 0,
      height: Number.isFinite(info.height) ? info.height : 0,
      createdAt: typeof info.createdAt === "string" ? info.createdAt : new Date().toISOString(),
    });
  }

  const projects = m.projects.map(parseProject);
  if (projects.some((p) => !p)) throw new BackupError("O backup contém projetos inválidos.");
  const valid = projects as Project[];
  const imageIds = new Set(images.map((i) => i.id));
  // Projeto que aponta para foto ausente fica sem foto (em vez de quebrar)
  for (const p of valid) if (p.image && !imageIds.has(p.image.imageId)) p.image = null;

  return { profile: m.profile ? parseProfile(m.profile) : null, projects: valid, images };
}

/** Para importação ADICIONAL: novos IDs, para nunca sobrescrever projetos existentes. */
export function withNewIds(backup: RestoredBackup): RestoredBackup {
  const imageMap = new Map(backup.images.map((i) => [i.id, uid()]));
  return {
    profile: backup.profile,
    images: backup.images.map((i) => ({ ...i, id: imageMap.get(i.id)! })),
    projects: backup.projects.map((p) => ({
      ...p,
      id: uid(),
      image: p.image ? { ...p.image, imageId: imageMap.get(p.image.imageId) ?? p.image.imageId } : null,
    })),
  };
}
