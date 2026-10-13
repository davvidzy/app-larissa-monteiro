import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { layoutFor } from "../render";
import { createProject } from "../projects";
import { categories, templates } from "../templates";
import type { CategoryId, PostTemplate, Profile } from "../types";
import { Preview } from "./Preview";

/** Miniatura que só é desenhada quando aparece na tela (a biblioteca tem 100 modelos). */
function TemplateCard({ template, profile, onUse }: { template: PostTemplate; profile: Profile; onUse: () => void }) {
  const ref = useRef<HTMLLIElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { rootMargin: "400px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const project = createProject(template, profile);
  // Verificação: o modelo cabe em todos os formatos dele com os dados atuais?
  const overflow = visible && template.formats.some((format) => layoutFor({ ...project, format }, profile, false).overflow);

  return (
    <li ref={ref} className="flex flex-col overflow-hidden rounded-[14px] border border-line bg-surface shadow-soft" data-template={template.id}>
      <div className="aspect-[4/5] bg-[#F7F3F5]">
        {visible && <Preview layout={layoutFor(project, profile, false)} theme={template.theme} scale={0.25} showOverflow={false} label={`Prévia: ${template.title}`} />}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="text-[12px] text-[#6C5E66]">{template.id}</p>
        <h4 className="text-[14px] leading-snug font-bold text-ink">{template.title}</h4>
        {overflow && (
          <p className="mt-1 text-[12px] font-medium text-error" data-overflow>
            Precisa de ajuste em algum formato
          </p>
        )}
        <button
          type="button"
          onClick={onUse}
          className="mt-auto inline-flex min-h-11 items-center justify-center gap-1.5 rounded-button pt-2 text-[14px] font-bold text-primary hover:bg-blush"
        >
          <Plus aria-hidden="true" className="size-4" />
          Usar este modelo
        </button>
      </div>
    </li>
  );
}

export function Gallery({ profile, onUse }: { profile: Profile; onUse: (template: PostTemplate) => void }) {
  const [category, setCategory] = useState<CategoryId>("intro");
  const list = templates.filter((t) => t.category === category);
  return (
    <div className="space-y-4">
      <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0" role="tablist" aria-label="Categorias">
        <div className="flex gap-1.5 md:flex-wrap">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={c.id === category}
              onClick={() => setCategory(c.id)}
              className={`min-h-11 shrink-0 rounded-full border px-3.5 text-[14px] font-bold transition-colors ${
                c.id === category ? "border-primary bg-primary text-white" : "border-line bg-surface text-ink-soft hover:border-primary-light"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-[14px] text-ink-soft">
        {list.length} modelos em "{categories.find((c) => c.id === category)!.label}". A prévia já usa os dados do seu perfil.
      </p>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {list.map((t) => (
          <TemplateCard key={t.id} template={t} profile={profile} onUse={() => onUse(t)} />
        ))}
      </ul>
    </div>
  );
}
