/* Conteúdo fixo da Ficha de Consulta e Anamnese Lash: perguntas, opções, alertas e avisos.
   Questionário NÃO médico: os alertas são informativos e nunca indicam "apta" ou "sem riscos". */

export type Answer = "sim" | "nao" | "conversar";

export const answerLabels: Record<Answer, string> = {
  sim: "Sim",
  nao: "Não",
  conversar: "Prefiro conversar pessoalmente",
};

export type QuestionId = "q1" | "q2" | "q3" | "q4" | "q5" | "q6" | "q7" | "q8" | "q9";

export type QuestionGroup = {
  id: "A" | "B" | "C";
  title: string;
  questions: { id: QuestionId; text: string }[];
  /** Campo opcional de texto do grupo. */
  notesLabel?: string;
};

export const questionGroups: QuestionGroup[] = [
  {
    id: "A",
    title: "Histórico de procedimentos",
    questions: [
      { id: "q1", text: "Você já realizou extensão de cílios anteriormente?" },
      { id: "q2", text: "Já apresentou irritação, inchaço, coceira ou desconforto após algum procedimento na região dos olhos?" },
      { id: "q3", text: "Já precisou interromper um procedimento na região dos olhos por causa de alguma reação?" },
    ],
  },
  {
    id: "B",
    title: "Sensibilidades e produtos",
    questions: [
      { id: "q4", text: "Você conhece alguma sensibilidade ou reação anterior a cosméticos, adesivos ou produtos utilizados próximo aos olhos?" },
      { id: "q5", text: "Já apresentou desconforto após utilizar maquiagem, removedores ou outros produtos na região dos olhos?" },
    ],
    notesLabel: "Se desejar, descreva informações relevantes para a profissional.",
  },
  {
    id: "C",
    title: "Condição ocular atual",
    questions: [
      { id: "q6", text: "Você está apresentando vermelhidão, dor, secreção, inchaço ou irritação nos olhos neste momento?" },
      {
        id: "q7",
        text: "Está utilizando algum tratamento ou seguindo alguma orientação médica que envolva a região dos olhos e que possa ser relevante para o procedimento?",
      },
      { id: "q8", text: "Utiliza lentes de contato?" },
      { id: "q9", text: "Passou recentemente por algum procedimento ou cirurgia na região dos olhos que ainda esteja em acompanhamento ou recuperação?" },
    ],
    notesLabel: "Observações (opcional)",
  },
];

export const allQuestions = questionGroups.flatMap((g) => g.questions);

export const services = ["Extensão clássica", "Volume brasileiro", "Volume híbrido", "Manutenção", "Remoção", "Outro"] as const;

export const orientationItems = [
  { id: "o1", text: "Qual serviço está sendo considerado." },
  { id: "o2", text: "Cuidados básicos relacionados ao procedimento." },
  { id: "o3", text: "Possíveis irritações e reações adversas." },
  { id: "o4", text: "Importância da higiene e cuidados posteriores." },
  { id: "o5", text: "Necessidade de procurar avaliação oftalmológica se houver sintomas preocupantes." },
  { id: "o6", text: "Como entrar em contato com a profissional para dúvidas administrativas." },
] as const;

export type OrientationId = (typeof orientationItems)[number]["id"];

export const alertTexts = {
  symptoms:
    "Atenção: a cliente relatou sintomas na região dos olhos. Não prossiga com o procedimento enquanto houver sinais que possam indicar um problema ocular. Oriente avaliação por um profissional de saúde habilitado.",
  reaction:
    "Atenção: há relato de reação ou sensibilidade anterior. A profissional deve avaliar as informações antes de qualquer atendimento. A ficha não determina segurança do procedimento.",
  surgery:
    "Atenção: foi relatado um procedimento ocular recente ou recuperação em andamento. Considere adiar o atendimento e solicitar orientação do profissional de saúde responsável.",
  conversar: "Esta informação precisa ser esclarecida diretamente com a cliente antes de decidir sobre o atendimento.",
};

export const notices = {
  notMedical:
    "Esta ficha é um questionário de consulta, não uma avaliação médica. Os alertas são informativos e não constituem triagem médica automatizada. A ausência de respostas positivas não garante a segurança do procedimento.",
  urgent:
    "Em caso de perda súbita de visão, dor ocular intensa ou outros sintomas graves, a cliente deve procurar atendimento médico de urgência imediatamente.",
  adults: "Esta versão da ficha é destinada a clientes adultas.",
  temporary:
    "Os dados preenchidos não são salvos pelo Portal Bellash Academy. Gere o documento antes de sair desta ferramenta, pois as informações podem ser perdidas ao fechar ou atualizar a página.",
  lgpd:
    "Os dados desta ficha devem ser tratados com confidencialidade. A profissional responsável deve utilizar, guardar e compartilhar essas informações conforme a legislação aplicável, inclusive a LGPD.",
  lgpdDetail:
    "Cabe à profissional definir a finalidade da coleta, o fundamento jurídico adequado e as regras de acesso, guarda e descarte. Marcar itens nesta ficha não resolve, sozinho, as obrigações da LGPD.",
  orientationsNotConsent:
    "Os itens abaixo registram orientações dadas pela profissional. A marcação não é prova automática de consentimento juridicamente válido.",
  storageResponsibility:
    "O arquivo gerado fica no seu aparelho ou onde você escolher guardá-lo, sob sua responsabilidade. Ele não é armazenado pela Bellash Academy.",
  clearConfirm:
    "Você deseja apagar os dados preenchidos nesta ficha? Se ainda não gerou ou imprimiu o documento, essas informações serão perdidas.",
};

/** Limites de tamanho dos campos de texto. */
export const limits = {
  name: 120,
  phone: 25,
  shortText: 160,
  longText: 2000,
};
