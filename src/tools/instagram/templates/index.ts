import type { PostTemplate } from "../types";
import { bookingTemplates, careTemplates, faqTemplates, introTemplates, servicesTemplates } from "./content-a";
import { backstageTemplates, eduTemplates, newsTemplates, pollTemplates, relationshipTemplates } from "./content-b";

export { categories } from "./build";

/** Os 100 modelos, na ordem das categorias. */
export const templates: PostTemplate[] = [
  ...introTemplates,
  ...servicesTemplates,
  ...bookingTemplates,
  ...careTemplates,
  ...faqTemplates,
  ...eduTemplates,
  ...relationshipTemplates,
  ...backstageTemplates,
  ...pollTemplates,
  ...newsTemplates,
];

export const templateById = new Map(templates.map((t) => [t.id, t]));
