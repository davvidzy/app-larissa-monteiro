import type { CategoryId, EditableField, PostFormat, PostTemplate, ThemeId } from "../types";

export const categories: { id: CategoryId; label: string; eyebrow: string }[] = [
  { id: "intro", label: "Apresentação profissional", eyebrow: "APRESENTAÇÃO" },
  { id: "services", label: "Divulgação de serviços", eyebrow: "SERVIÇOS" },
  { id: "booking", label: "Agendamento e disponibilidade", eyebrow: "AGENDAMENTO" },
  { id: "care", label: "Cuidados com as extensões", eyebrow: "CUIDADOS" },
  { id: "faq", label: "Dúvidas frequentes", eyebrow: "DÚVIDAS FREQUENTES" },
  { id: "edu", label: "Conteúdo educativo sobre cílios", eyebrow: "VOCÊ SABIA?" },
  { id: "relationship", label: "Relacionamento com clientes", eyebrow: "PARA VOCÊ" },
  { id: "backstage", label: "Bastidores do trabalho", eyebrow: "BASTIDORES" },
  { id: "poll", label: "Enquetes e interação", eyebrow: "ENQUETE" },
  { id: "news", label: "Novidades e comunicados", eyebrow: "COMUNICADO" },
];

const THEMES: ThemeId[] = ["blush", "wine", "cream", "rose"];
const ALL_FORMATS: PostFormat[] = ["portrait", "square", "story"];

type Input = Omit<PostTemplate, "id" | "category" | "formats" | "theme" | "eyebrow" | "editableFields" | "imageSlots"> & {
  formats?: PostFormat[];
  theme?: ThemeId;
  eyebrow?: string;
  imageSlots?: 0 | 1;
};

/** Monta os modelos de uma categoria: IDs estáveis (categoria_001…), tema alternado e campos editáveis. */
export function defineCategory(category: CategoryId, items: Input[]): PostTemplate[] {
  const meta = categories.find((c) => c.id === category)!;
  return items.map((item, index) => {
    const editableFields: EditableField[] = ["eyebrow", "headline"];
    if (item.supportingText !== undefined) editableFields.push("supportingText");
    if (item.cta !== undefined) editableFields.push("cta");
    if (item.pollOptions) editableFields.push("pollOptions");
    if (item.availabilityLine) editableFields.push("availabilityLine");
    editableFields.push("caption", "hashtags");
    return {
      ...item,
      id: `${category}_${String(index + 1).padStart(3, "0")}`,
      category,
      formats: item.formats ?? ALL_FORMATS,
      theme: item.theme ?? THEMES[(index + categories.indexOf(meta)) % THEMES.length],
      eyebrow: item.eyebrow ?? meta.eyebrow,
      editableFields,
      imageSlots: item.imageSlots ?? (item.pollOptions ? 0 : 1),
    };
  });
}
