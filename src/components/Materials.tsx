import { ArrowRight, BookOpenText, Clock, Download } from "lucide-react";
import { type Material, materials } from "../config/portal";
import { buttonClass } from "./ui/Button";

function MaterialCard({ material }: { material: Material }) {
  const { id, icon: Icon, title, description, file, tool, meta, bonus } = material;
  return (
    <li className="flex flex-col rounded-card border border-line bg-surface p-5 shadow-soft">
      <div className="flex gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-soft-pink text-primary">
          <Icon aria-hidden="true" className="size-6" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          {bonus && (
            <span className="mb-1 inline-block rounded-full bg-primary-light/60 px-2 py-0.5 text-[11px] leading-tight font-bold tracking-[0.08em] text-primary">
              BÔNUS
            </span>
          )}
          <h3 className="text-[17px] leading-snug font-bold text-ink">{title}</h3>
          <p className="mt-1 text-[14px] text-ink-soft">{description}</p>
          {meta && <p className="mt-1.5 text-[13px] font-medium text-[#6C5E66]">{meta}</p>}
        </div>
      </div>

      <div className="mt-auto pt-4">
        {file ? (
          <div className="flex gap-2">
            <a href={`#estudar/${id}`} className={`flex-1 ${buttonClass({ size: "md" })}`}>
              <BookOpenText aria-hidden="true" className="size-4" />
              Ler agora
            </a>
            <a
              href={file}
              download
              aria-label={`Baixar ${title} em PDF`}
              title="Baixar PDF"
              className={`${buttonClass({ variant: "outline", size: "md" })} w-11 px-0`}
            >
              <Download aria-hidden="true" className="size-4" />
            </a>
          </div>
        ) : tool ? (
          <a href={`#ferramentas/${tool}`} className={buttonClass({ variant: "outline", size: "md", fullWidth: true })}>
            Abrir ferramenta
            <ArrowRight aria-hidden="true" className="size-4" />
          </a>
        ) : (
          <span className="flex min-h-11 w-full items-center justify-center gap-2 rounded-button bg-[#F7F3F5] text-[14px] font-medium text-[#6C5E66]">
            <Clock aria-hidden="true" className="size-4" />
            Em breve
          </span>
        )}
      </div>
    </li>
  );
}

export function Materials() {
  const main = materials.filter((m) => !m.bonus);
  const bonus = materials.filter((m) => m.bonus);

  return (
    <div className="space-y-10">
      <section aria-labelledby="materiais-title">
        <h2 id="materiais-title" className="font-display text-[30px] leading-tight font-semibold text-[#301827]">
          Estudar
        </h2>
        <p className="mt-1 text-ink-soft">Leia aqui mesmo ou baixe para o seu celular ou computador.</p>
        <ul className={`mt-5 grid gap-4 ${main.length > 1 ? "md:grid-cols-2" : ""}`}>
          {main.map((material) => (
            <MaterialCard key={material.id} material={material} />
          ))}
        </ul>
      </section>

      {bonus.length > 0 && (
        <section aria-labelledby="bonus-title">
          <h2 id="bonus-title" className="font-display text-[30px] leading-tight font-semibold text-[#301827]">
            Bônus
          </h2>
          <ul className="mt-5 grid gap-4 md:grid-cols-2">
            {bonus.map((material) => (
              <MaterialCard key={material.id} material={material} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
