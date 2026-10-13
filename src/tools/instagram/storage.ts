/* Salvamento local do Kit Instagram.
   - Perfil (pequeno): localStorage, chave bellash_instagram_profile_v1.
   - Projetos e fotos: IndexedDB, banco bellash_instagram_projects_v1 (fotos como Blob, nunca base64).
   Toda operação retorna erro de verdade quando falha: nada de "salvo" falso. */

import { emptyProfile } from "./placeholders";
import { parseProfile, parseProject } from "./projects";
import type { Profile, Project, StoredImage } from "./types";

export const PROFILE_KEY = "bellash_instagram_profile_v1";
export const DB_NAME = "bellash_instagram_projects_v1";
const DB_VERSION = 1;

export class StorageError extends Error {}

function friendly(error: unknown): StorageError {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "QuotaExceededError") return new StorageError("O navegador está sem espaço para salvar. Exclua projetos ou fotos que não usa e baixe um backup.");
  return new StorageError("Não foi possível salvar neste navegador (ele pode estar bloqueando o armazenamento, como em abas anônimas).");
}

/* -------------------------------------------------------------------------- */
/* Perfil                                                                     */
/* -------------------------------------------------------------------------- */

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return (raw && parseProfile(JSON.parse(raw))) || emptyProfile();
  } catch {
    return emptyProfile();
  }
}

/** Retorna false se não conseguiu salvar. */
export function saveProfile(profile: Profile): boolean {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    return true;
  } catch {
    return false;
  }
}

/* -------------------------------------------------------------------------- */
/* IndexedDB                                                                  */
/* -------------------------------------------------------------------------- */

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (error) {
      reject(friendly(error));
      return;
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("projects")) db.createObjectStore("projects", { keyPath: "id" });
      if (!db.objectStoreNames.contains("images")) db.createObjectStore("images", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(friendly(request.error));
    request.onblocked = () => reject(new StorageError("Feche outras abas do portal e tente de novo."));
  }).catch((error) => {
    dbPromise = null; // permite tentar de novo
    throw error;
  });
  return dbPromise;
}

/** Executa operações numa transação e só resolve quando ela é gravada de fato. */
async function tx<T>(stores: ("projects" | "images")[], mode: IDBTransactionMode, work: (t: IDBTransaction) => IDBRequest<T> | void): Promise<T | undefined> {
  const db = await openDb();
  return new Promise<T | undefined>((resolve, reject) => {
    let t: IDBTransaction;
    try {
      t = db.transaction(stores, mode);
    } catch (error) {
      reject(friendly(error));
      return;
    }
    let result: T | undefined;
    const req = work(t);
    if (req) req.onsuccess = () => (result = req.result);
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(friendly(t.error));
    t.onabort = () => reject(friendly(t.error));
  });
}

export async function listProjects(): Promise<Project[]> {
  const raw = (await tx<unknown[]>(["projects"], "readonly", (t) => t.objectStore("projects").getAll())) ?? [];
  return raw.map(parseProject).filter((p): p is Project => !!p).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function putProject(project: Project) {
  await tx(["projects"], "readwrite", (t) => t.objectStore("projects").put(project));
}

/** Exclui o projeto e a foto dele. */
export async function deleteProject(project: Project) {
  await tx(["projects", "images"], "readwrite", (t) => {
    t.objectStore("projects").delete(project.id);
    if (project.image) t.objectStore("images").delete(project.image.imageId);
  });
}

export async function getImage(id: string): Promise<StoredImage | undefined> {
  return tx<StoredImage>(["images"], "readonly", (t) => t.objectStore("images").get(id));
}

export async function putImage(image: StoredImage) {
  await tx(["images"], "readwrite", (t) => t.objectStore("images").put(image));
}

export async function deleteImage(id: string) {
  await tx(["images"], "readwrite", (t) => t.objectStore("images").delete(id));
}

export async function allImages(ids: string[]): Promise<StoredImage[]> {
  const out: StoredImage[] = [];
  for (const id of ids) {
    const img = await getImage(id);
    if (img) out.push(img);
  }
  return out;
}

/** Grava vários projetos e fotos de uma vez (restauração de backup). Tudo ou nada. */
export async function putMany(projects: Project[], images: StoredImage[], replaceAll: boolean) {
  await tx(["projects", "images"], "readwrite", (t) => {
    const ps = t.objectStore("projects");
    const is = t.objectStore("images");
    if (replaceAll) {
      ps.clear();
      is.clear();
    }
    images.forEach((i) => is.put(i));
    projects.forEach((p) => ps.put(p));
  });
}
