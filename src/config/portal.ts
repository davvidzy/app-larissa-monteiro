/* ==========================================================================
   Configuração central do portal da aluna.
   Para adicionar ou trocar conteúdo, edite só este arquivo:
   os componentes apenas leem estes valores.
   ========================================================================== */

import type { LucideIcon } from "lucide-react";
import { BookOpen, Calculator, ClipboardList, HeartHandshake, Lightbulb, ListChecks } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Marca                                                                      */
/* -------------------------------------------------------------------------- */

export const brand = {
  name: "Bellash Academy",
  product: "Kit Lash do Zero",
  logo: "img/logo.svg",
  /** Contato de suporte exibido no rodapé (WhatsApp, e-mail…). Vazio = oculto. */
  support: "",
};

/* -------------------------------------------------------------------------- */
/* Acesso                                                                     */
/* Sem senha: a aluna informa o e-mail usado na compra e o acesso fica salvo  */
/* no navegador dela. Só é verificado se o e-mail tem formato válido.         */
/* -------------------------------------------------------------------------- */

export const access = {
  storageKey: "bellash_portal_email_v1",
};

/* -------------------------------------------------------------------------- */
/* Materiais (aba Estudar)                                                    */
/* PDFs ficam em public/materiais/ (nomes sem acentos nem espaços).            */
/* Bônus que são ferramentas do portal usam `tool` em vez de `file`.           */
/* `file: ""` e sem `tool` = mostra "Em breve".                                */
/* -------------------------------------------------------------------------- */

export type Material = {
  /** Usado no endereço da leitura (#estudar/<id>). Sem acentos nem espaços. */
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  file: string;
  /** Bônus que é uma ferramenta: id da ferramenta (abre #ferramentas/<tool>). */
  tool?: string;
  /** Texto curto exibido no card, ex.: "PDF · 48 páginas". */
  meta?: string;
  bonus?: boolean;
  /** Material em destaque no "Comece estudando" da tela inicial (marque só um). */
  featured?: boolean;
};

export const materials: Material[] = [
  {
    id: "kit-completo",
    icon: BookOpen,
    title: "Kit Lash do Zero Completo",
    description:
      "Manual visual com fundamentos, materiais, tipos de fios, biossegurança, 30 mapeamentos ilustrados, precificação e preparação para as primeiras clientes.",
    file: "materiais/kit-lash-do-zero-completo.pdf",
    meta: "PDF · 49 páginas · sumário clicável",
    featured: true,
  },
  // Bônus, na mesma ordem da página de vendas
  {
    id: "calculadora",
    icon: Calculator,
    title: "Calculadora de Precificação",
    description: "Calcule custos e simule preços.",
    file: "",
    tool: "precificacao",
    meta: "Ferramenta do portal",
    bonus: true,
  },
  {
    id: "checklist",
    icon: ListChecks,
    title: "Checklist Lash Iniciante",
    description: "Organize seus estudos e acompanhe seu progresso.",
    file: "",
    tool: "checklist",
    meta: "Ferramenta do portal",
    bonus: true,
  },
  {
    id: "anamnese",
    icon: ClipboardList,
    title: "Ficha de Anamnese Digital",
    description: "Preencha e exporte fichas em PDF.",
    file: "",
    tool: "anamnese",
    meta: "Ferramenta do portal",
    bonus: true,
  },
  {
    id: "ideias-de-posts",
    icon: Lightbulb,
    title: "50 Ideias de Posts",
    description: "Sugestões para planejar sua divulgação.",
    file: "materiais/50-ideias-de-posts-instagram.pdf",
    meta: "PDF · 3 páginas",
    bonus: true,
  },
  {
    id: "cuidados",
    icon: HeartHandshake,
    title: "Guia Pós-Procedimento",
    description: "Orientações sobre cuidados com extensões.",
    file: "materiais/guia-cuidados-pos-procedimento.pdf",
    meta: "PDF · 5 páginas",
    bonus: true,
  },
];
