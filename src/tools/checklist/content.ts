/* Conteúdo fixo do Checklist da Lash Iniciante.
   Os IDs (etapaN_tarefaM) são ESTÁVEIS: o progresso salvo depende deles.
   Para mudar um texto, mantenha o ID. Para tirar uma tarefa, apague a linha
   (o progresso dela é descartado ao carregar). Para incluir, use um ID novo. */

export type Stage = {
  id: number;
  title: string;
  tasks: { id: string; title: string }[];
  /** Exibida quando a etapa chega a 100%. */
  doneMessage: string;
};

const tasks = (stage: number, titles: string[]) => titles.map((title, i) => ({ id: `etapa${stage}_tarefa${i + 1}`, title }));

export const stages: Stage[] = [
  {
    id: 1,
    title: "Conhecendo a profissão",
    tasks: tasks(1, [
      "Entendi o que faz uma Lash Designer.",
      "Pesquisei como funciona o mercado de extensão de cílios.",
      "Conheci as principais técnicas e efeitos visuais.",
      "Identifiquei as habilidades necessárias para trabalhar na área.",
      "Pesquisei opções de formação prática e supervisionada.",
    ]),
    doneMessage:
      "Ótimo! Você já organizou os primeiros conhecimentos sobre a profissão. Continue estudando e conhecendo as exigências práticas da atividade.",
  },
  {
    id: 2,
    title: "Materiais e equipamentos",
    tasks: tasks(2, [
      "Conheci os principais tipos de fios para extensão.",
      "Estudei diferenças entre curvaturas, comprimentos e espessuras.",
      "Pesquisei as funções das pinças utilizadas na profissão.",
      "Identifiquei os materiais descartáveis mais comuns.",
      "Entendi a importância dos produtos adequados para higienização.",
      "Pesquisei informações de segurança dos adesivos específicos.",
      "Fiz uma estimativa dos custos iniciais dos materiais.",
    ]),
    doneMessage:
      "Você já tem uma visão inicial dos materiais utilizados. O próximo passo é compreender os cuidados, riscos e limites de cada produto.",
  },
  {
    id: 3,
    title: "Fundamentos e segurança",
    tasks: tasks(3, [
      "Estudei noções básicas da anatomia dos cílios e das pálpebras.",
      "Entendi a importância da higiene das mãos, dos materiais e do ambiente.",
      "Pesquisei possíveis contraindicações ao procedimento.",
      "Conheci sinais de irritação e reações adversas.",
      "Entendi a importância da avaliação prévia da cliente.",
      "Li orientações gerais de cuidados pós-procedimento.",
      "Reconheci que um manual digital não substitui treinamento prático supervisionado.",
    ]),
    doneMessage:
      "Conhecer os cuidados de segurança é fundamental. Continue aprofundando seus estudos antes de realizar qualquer procedimento.",
  },
  {
    id: 4,
    title: "Preparação profissional",
    tasks: tasks(4, [
      "Pesquisei as exigências locais para exercer a atividade.",
      "Organizei meu plano de formação prática.",
      "Listei os equipamentos necessários para um futuro espaço de atendimento.",
      "Estudei princípios básicos de precificação.",
      "Fiz uma estimativa de despesas mensais e custos por serviço.",
      "Conheci boas práticas de atendimento e consentimento.",
    ]),
    doneMessage:
      "Seu planejamento profissional está mais organizado. Continue avaliando custos, formação e requisitos antes de iniciar os atendimentos.",
  },
  {
    id: 5,
    title: "Divulgação e organização",
    tasks: tasks(5, [
      "Pensei em um nome para meu futuro negócio.",
      "Identifiquei o público que gostaria de atender.",
      "Organizei ideias de conteúdos para Instagram.",
      "Preparei uma mensagem de apresentação profissional.",
      "Estudei formas de organizar uma agenda de atendimentos.",
      "Criei metas realistas para os primeiros meses.",
      "Preparei uma lista de próximos passos.",
    ]),
    doneMessage: "Parabéns por organizar seu planejamento! Use o que aprendeu para definir seus próximos estudos e ações.",
  },
];

export const recommendations = {
  start: "Comece pela primeira etapa e organize seus estudos sobre a profissão.",
  /** Ainda na etapa N (já começou, mas não terminou a etapa 1). */
  continueFirst: "Continue a primeira etapa: conhecer bem a profissão ajuda a planejar todo o resto.",
  /** Chave = etapa que acabou de ser concluída (em ordem). */
  afterStage: {
    1: "Agora vale conhecer melhor os materiais e equipamentos utilizados na área.",
    2: "Seu próximo foco pode ser segurança, higiene e fundamentos do atendimento.",
    3: "Continue com o planejamento profissional, formação prática e estudo de custos.",
    4: "Você pode começar a organizar suas ideias de divulgação e rotina profissional.",
  } as Record<number, string>,
  allDone:
    "Você concluiu seu checklist de organização! Revise suas anotações e continue sua formação prática. Este checklist não representa uma certificação profissional.",
};

export const disclaimer =
  "Concluir o checklist não significa estar tecnicamente habilitada para realizar procedimentos. Ele organiza seus estudos; a formação prática supervisionada continua indispensável.";

export const storageNotice =
  "Seu progresso fica salvo neste navegador. Se você trocar de aparelho, usar outro navegador ou apagar os dados do site, ele poderá ser perdido. Faça uma cópia de segurança para não perder suas informações.";

export const resetWarning =
  "Essa ação apagará o progresso, as tarefas personalizadas e as anotações deste navegador. Deseja continuar?";

/** Limites (evitam arquivos e armazenamento enormes). */
export const limits = {
  taskText: 140,
  noteText: 1000,
  customTasksPerStage: 30,
  notesPerStage: 30,
  importBytes: 512 * 1024,
};
