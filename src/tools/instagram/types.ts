/* Tipos do Kit Instagram Lash Profissional. */

export type CategoryId = "intro" | "services" | "booking" | "care" | "faq" | "edu" | "relationship" | "backstage" | "poll" | "news";

export type PostFormat = "square" | "portrait" | "story";

export type ThemeId = "blush" | "wine" | "cream" | "rose";

export type EditableField = "eyebrow" | "headline" | "supportingText" | "cta" | "caption" | "hashtags" | "pollOptions" | "availabilityLine";

export type PostTemplate = {
  /** Estável: intro_001 … news_010. Projetos salvos apontam para ele. */
  id: string;
  category: CategoryId;
  /** Tema do post (nome exibido na biblioteca). */
  title: string;
  /** Formatos com composição própria para este modelo (o primeiro é o padrão). */
  formats: PostFormat[];
  theme: ThemeId;
  /** Linha curta acima do título ("subtítulo"). */
  eyebrow: string;
  headline: string;
  supportingText?: string;
  caption: string;
  cta?: string;
  hashtags: string[];
  /** Enquetes: 2 a 4 opções desenhadas na arte. */
  pollOptions?: string[];
  /** Agendamento: frase de "agenda aberta", exibida só se a usuária ativar. */
  availabilityLine?: string;
  /** Orientação de uso mostrada no editor (nunca vai para a arte). */
  guidance?: string;
  editableFields: EditableField[];
  /** 0 = sem foto; 1 = aceita uma foto opcional. */
  imageSlots: 0 | 1;
};

export type Profile = {
  professionalName: string;
  studioName: string;
  instagram: string;
  whatsapp: string;
  city: string;
  /** Um serviço por linha. */
  services: string[];
  intro: string;
  preferredCta: string;
};

export type ProjectImage = {
  /** Chave do arquivo no IndexedDB. */
  imageId: string;
  /** 1 = preenche a área; até 3 = aproxima. */
  zoom: number;
  /** -1 a 1: posição horizontal/vertical do recorte. */
  offsetX: number;
  offsetY: number;
};

export type ProjectFields = {
  eyebrow: string;
  headline: string;
  supportingText: string;
  cta: string;
  caption: string;
  hashtags: string;
  pollOptions: string[];
  availabilityLine: string;
};

export type Project = {
  version: 1;
  id: string;
  name: string;
  templateId: string;
  category: CategoryId;
  format: PostFormat;
  theme: ThemeId;
  /** Textos com marcadores ([NOME_PROFISSIONAL]…), resolvidos com o perfil na hora de desenhar. */
  fields: ProjectFields;
  /** Serviço usado em [SERVICO]. */
  service: string;
  showAvailability: boolean;
  image: ProjectImage | null;
  createdAt: string;
  updatedAt: string;
};

export type StoredImage = { id: string; blob: Blob; type: string; width: number; height: number; createdAt: string };
