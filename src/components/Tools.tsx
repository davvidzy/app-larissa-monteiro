import { type ComponentType, lazy, Suspense } from "react";
import { ArrowLeft, ArrowRight, Calculator, CalendarPlus, ClipboardList, ListChecks, MessageCircleHeart, Sparkles, type LucideIcon, Target } from "lucide-react";

/* Cada ferramenta é baixada só quando aberta: a abertura do portal fica leve no celular. */
const AgendaTool = lazy(() => import("../tools/agenda/AgendaTool").then((m) => ({ default: m.AgendaTool })));
const AnamneseTool = lazy(() => import("../tools/anamnese/AnamneseTool").then((m) => ({ default: m.AnamneseTool })));
const ChecklistTool = lazy(() => import("../tools/checklist/ChecklistTool").then((m) => ({ default: m.ChecklistTool })));
const InstagramTool = lazy(() => import("../tools/instagram/InstagramTool").then((m) => ({ default: m.InstagramTool })));
const PackTool = lazy(() => import("../tools/primeiras-clientes/PackTool").then((m) => ({ default: m.PackTool })));
const PricingTool = lazy(() => import("../tools/precificacao/PricingTool").then((m) => ({ default: m.PricingTool })));
const GoalCalculator = lazy(() => import("./Calculators").then((m) => ({ default: m.GoalCalculator })));

export type Tool = {
  /** Usado no endereço da ferramenta (#ferramentas/<id>). */
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  component: ComponentType;
};

/** Ferramentas, na ordem em que aparecem. */
export const tools: Tool[] = [
  {
    id: "checklist",
    icon: ListChecks,
    title: "Checklist da Lash Iniciante",
    description: "Organize seus estudos em 5 etapas, acompanhe o progresso e faça suas anotações.",
    component: ChecklistTool,
  },
  {
    id: "anamnese",
    icon: ClipboardList,
    title: "Ficha de Consulta e Anamnese Lash",
    description: "Preencha a ficha da consulta, revise e gere o PDF ou imprima. Nada fica salvo no portal.",
    component: AnamneseTool,
  },
  {
    id: "agenda",
    icon: CalendarPlus,
    title: "Assistente de Agendamentos Lash",
    description: "Monte o atendimento e adicione ao seu Google Calendar em um clique, sem guardar dados no portal.",
    component: AgendaTool,
  },
  {
    id: "precificacao",
    icon: Calculator,
    title: "Calculadora de Precificação Lash",
    description: "Descubra quanto custa cada atendimento, quanto cobrar e simule descontos e o resultado do mês.",
    component: PricingTool,
  },
  {
    id: "meta",
    icon: Target,
    title: "Calculadora de meta do mês",
    description: "Veja quantas clientes precisa atender para chegar no valor que quer ganhar.",
    component: GoalCalculator,
  },
  {
    id: "instagram",
    icon: Sparkles,
    title: "Kit Instagram Lash Profissional",
    description: "100 modelos de posts para personalizar com seus dados e fotos, exportar em PNG e copiar a legenda.",
    component: InstagramTool,
  },
  {
    id: "primeiras-clientes",
    icon: MessageCircleHeart,
    title: "Pack Primeiras Clientes",
    description: "30 mensagens prontas para personalizar, copiar ou abrir no WhatsApp, e um planejamento de divulgação em 30 atividades.",
    component: PackTool,
  },
];

const headingClass = "font-display text-[30px] leading-tight font-semibold text-[#301827]";

export function Tools({ item }: { item?: string }) {
  const tool = tools.find((t) => t.id === item);

  if (tool) {
    const Tool = tool.component;
    return (
      <div>
        <a href="#ferramentas" className="inline-flex min-h-11 items-center gap-1.5 text-[14px] font-bold text-primary hover:underline">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Ferramentas
        </a>
        <h2 className={`mt-1 ${headingClass}`}>{tool.title}</h2>
        <p className="mt-1 text-ink-soft">{tool.description}</p>
        <div className="mt-5">
          <Suspense fallback={<p className="py-8 text-ink-soft">Carregando ferramenta…</p>}>
            <Tool />
          </Suspense>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className={headingClass}>Ferramentas</h2>
      <p className="mt-1 text-ink-soft">Ferramentas para organizar e divulgar o seu trabalho.</p>
      <ul className="mt-5 grid gap-4 md:grid-cols-2">
        {tools.map(({ id, icon: Icon, title, description }) => (
          <li key={id}>
            <a
              href={`#ferramentas/${id}`}
              className="group flex h-full flex-col rounded-card border border-line bg-surface p-5 shadow-soft transition-colors hover:border-primary-light"
            >
              <span className="flex size-12 items-center justify-center rounded-[14px] bg-soft-pink text-primary">
                <Icon aria-hidden="true" className="size-6" strokeWidth={1.75} />
              </span>
              <h3 className="mt-4 text-[17px] leading-snug font-bold text-ink">{title}</h3>
              <p className="mt-1 flex-1 text-[14px] text-ink-soft">{description}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-bold text-primary">
                Abrir
                <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
