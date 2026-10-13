import { ArrowRight, BookOpenText, Calculator, Download, Image as ImageIcon, type LucideIcon, BookOpen } from "lucide-react";
import { materials } from "../config/portal";
import { PdfCover } from "./PdfCover";
import { buttonClass } from "./ui/Button";

const steps: { icon: LucideIcon; title: string; description: string; href: string }[] = [
  { icon: BookOpen, title: "Estude o conteúdo", description: "Comece pelo manual e siga para os outros materiais.", href: "#estudar" },
  { icon: Calculator, title: "Calcule seu preço", description: "Descubra quanto cobrar sem esquecer nenhum custo.", href: "#ferramentas/precificacao" },
  { icon: ImageIcon, title: "Divulgue seu trabalho", description: "Escolha entre 100 modelos de post e personalize com seus dados.", href: "#ferramentas/instagram" },
];

export function Home() {
  const featured = materials.find((m) => m.featured && m.file);

  return (
    <div className="space-y-10">
      {featured && (
        <section
          aria-labelledby="comece-title"
          className="grid gap-6 rounded-card border border-line bg-surface p-5 shadow-soft sm:grid-cols-[180px_1fr] sm:items-center md:grid-cols-[220px_1fr] md:gap-8 md:p-7"
        >
          <a
            href={`#estudar/${featured.id}`}
            aria-label={`Ler ${featured.title}`}
            className="mx-auto block w-[160px] sm:w-full"
          >
            <PdfCover
              file={featured.file}
              icon={featured.icon}
              width={220}
              className="aspect-[210/297] rounded-[8px] border border-line shadow-card transition-transform hover:-translate-y-0.5"
            />
          </a>
          <div className="text-center sm:text-left">
            <p className="text-[12px] font-bold tracking-[0.14em] text-primary">COMECE ESTUDANDO</p>
            <h2 id="comece-title" className="mt-1 font-display text-[32px] leading-[1.1] font-semibold text-[#301827]">
              {featured.title}
            </h2>
            <p className="mt-2 text-ink-soft">{featured.description}</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <a href={`#estudar/${featured.id}`} className={buttonClass({ size: "md" })}>
                <BookOpenText aria-hidden="true" className="size-4" />
                Ler agora
              </a>
              <a href={featured.file} download className={buttonClass({ variant: "outline", size: "md" })}>
                <Download aria-hidden="true" className="size-4" />
                Baixar PDF
              </a>
            </div>
          </div>
        </section>
      )}

      <section aria-labelledby="caminho-title">
        <h2 id="caminho-title" className="font-display text-[30px] leading-tight font-semibold text-[#301827]">
          Seu caminho
        </h2>
        <ol className="mt-5 grid gap-4 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, description, href }, index) => (
            <li key={title}>
              <a
                href={href}
                className="group flex h-full gap-4 rounded-card border border-line bg-surface p-5 shadow-soft transition-colors hover:border-primary-light"
              >
                <span className="relative flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-soft-pink text-primary">
                  <Icon aria-hidden="true" className="size-6" strokeWidth={1.75} />
                  <span className="absolute -top-1.5 -left-1.5 flex size-6 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-white">
                    {index + 1}
                  </span>
                </span>
                <div className="min-w-0">
                  <h3 className="text-[16px] leading-snug font-bold text-ink">{title}</h3>
                  <p className="mt-1 text-[14px] text-ink-soft">{description}</p>
                </div>
                <ArrowRight aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
              </a>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
