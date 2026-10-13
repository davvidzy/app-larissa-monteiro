/* Conteúdo fixo do Pack Primeiras Clientes: 30 mensagens e 30 atividades de divulgação.
   IDs estáveis (msg_01…msg_30, dia 1…30): favoritos, versões e progresso salvos dependem deles. */

export type CategoryId = "apresentacao" | "servicos" | "agendamento" | "pos" | "indicacoes" | "reativacao";

export const categories: { id: CategoryId; label: string }[] = [
  { id: "apresentacao", label: "Apresentação profissional" },
  { id: "servicos", label: "Informações sobre serviços" },
  { id: "agendamento", label: "Agendamento e confirmação" },
  { id: "pos", label: "Pós-atendimento e relacionamento" },
  { id: "indicacoes", label: "Indicações e divulgação" },
  { id: "reativacao", label: "Reativação e comunicação" },
];

export type LibraryMessage = {
  id: string;
  category: CategoryId;
  title: string;
  text: string;
  /** Para que serve. */
  purpose: string;
  /** Quando e como usar. */
  guidance: string;
};

const m = (n: number, category: CategoryId, title: string, text: string, purpose: string, guidance: string): LibraryMessage => ({
  id: `msg_${String(n).padStart(2, "0")}`,
  category,
  title,
  text,
  purpose,
  guidance,
});

export const library: LibraryMessage[] = [
  m(1, "apresentacao", "Apresentação inicial",
    "Oi! Tudo bem? 💖 Eu sou [NOME_PROFISSIONAL] e estou construindo meu trabalho no universo dos cílios. Vou compartilhar informações, novidades e conteúdos sobre essa área. Se você gosta do assunto, pode acompanhar meu perfil: [INSTAGRAM].",
    "Apresentar seu trabalho a quem você conhece.",
    "Envie para pessoas próximas que já falam com você, uma vez só. Funciona mesmo antes de atender."),
  m(2, "apresentacao", "Apresentação do estúdio",
    "Olá! Seja bem-vinda ao [NOME_ESTUDIO]. 💕 Por aqui você pode conhecer os serviços disponíveis, tirar dúvidas e consultar informações de atendimento. Meu contato é [WHATSAPP].",
    "Dar boas-vindas a quem chegou ao seu estúdio ou perfil.",
    "Use como resposta para quem entrou em contato pela primeira vez. Só faz sentido se você já tem um estúdio."),
  m(3, "apresentacao", "Divulgação do perfil profissional",
    "Oi! Estou organizando meu perfil profissional sobre extensão de cílios. ✨ Se você quiser acompanhar conteúdos, cuidados e novidades, será muito bem-vinda: [INSTAGRAM].",
    "Convidar conhecidas a seguirem o perfil profissional.",
    "Ideal para quando você acabou de criar ou reformular o perfil."),
  m(4, "apresentacao", "Apresentação dos serviços",
    "Olá! 💖 Trabalho com serviços na área de cílios e posso te passar mais informações sobre as opções disponíveis. Se tiver interesse, me chama por aqui.",
    "Contar que você oferece serviços, sem insistir.",
    "Use apenas se você já atende. Deixe a pessoa decidir se quer saber mais."),
  m(5, "apresentacao", "Apresentação sem agenda aberta",
    "Oi! Estou me preparando e aprofundando meus estudos na área de cílios. Quero compartilhar um pouco dessa jornada e conteúdos que estou aprendendo. Se gostar do assunto, acompanhe meu perfil: [INSTAGRAM].",
    "Divulgar sua jornada enquanto ainda estuda.",
    "Para quem ainda não atende: apresenta o perfil sem oferecer serviço."),

  m(6, "servicos", "Primeiro contato",
    "Oi, [NOME_CLIENTE]! Obrigada pelo contato. 💕 Você gostaria de receber informações sobre os serviços disponíveis e como funciona o atendimento?",
    "Responder quem mandou mensagem pela primeira vez.",
    "Responda rápido e pergunte antes de enviar valores e detalhes."),
  m(7, "servicos", "Envio de valores",
    "Olá, [NOME_CLIENTE]! O valor informado para [SERVICO] é [VALOR]. Posso te explicar como funciona o atendimento e como consultar a disponibilidade.",
    "Informar o valor de um serviço a quem perguntou.",
    "Confira o valor antes de enviar. A Calculadora de Precificação ajuda a definir esse número."),
  m(8, "servicos", "Dúvida sobre procedimento",
    "Oi! 💖 Posso te passar informações gerais sobre [SERVICO]. Antes de qualquer procedimento, é importante conversar sobre suas preferências e possíveis cuidados necessários.",
    "Responder dúvidas sobre um serviço, lembrando da consulta prévia.",
    "Dê informações gerais. Questões de saúde devem ser tratadas na consulta, nunca por mensagem."),
  m(9, "servicos", "Consulta de disponibilidade",
    "Olá! Você gostaria de consultar os horários disponíveis para [SERVICO]? Me informe os dias e períodos que prefere, e verificarei as opções.",
    "Começar a combinar um horário.",
    "Use depois que a pessoa demonstrou interesse no serviço."),
  m(10, "servicos", "Atendimento personalizado",
    "Oi, [NOME_CLIENTE]! Cada atendimento começa com uma conversa para compreender suas preferências. Se quiser conhecer as opções de serviços, estou à disposição para te explicar.",
    "Explicar como você conduz o atendimento.",
    "Boa para quem ainda está indecisa sobre qual serviço escolher."),

  m(11, "agendamento", "Confirmação",
    "Oi, [NOME_CLIENTE]! 💖 Estou entrando em contato para confirmar seu atendimento de [SERVICO], marcado para [DATA] às [HORARIO]. Você consegue confirmar sua presença?",
    "Confirmar um horário já combinado.",
    "Envie um ou dois dias antes do atendimento."),
  m(12, "agendamento", "Lembrete",
    "Olá, [NOME_CLIENTE]! Passando para lembrar do seu atendimento agendado para [DATA] às [HORARIO]. Se precisar conversar sobre o horário, me avise com antecedência.",
    "Lembrar a cliente do horário.",
    "Envie na véspera ou no dia, se a cliente já confirmou."),
  m(13, "agendamento", "Informações antes do atendimento",
    "Oi, [NOME_CLIENTE]! Seu atendimento está previsto para [DATA] às [HORARIO]. Caso tenha dúvidas ou alguma informação importante para conversar antes do procedimento, pode entrar em contato.",
    "Abrir espaço para dúvidas antes do procedimento.",
    "Útil para clientes de primeira vez. Use a Ficha de Anamnese na consulta."),
  m(14, "agendamento", "Reagendamento",
    "Olá, [NOME_CLIENTE]! Precisamos conversar sobre o horário do seu atendimento. Você teria disponibilidade para reagendar? Posso verificar outras opções.",
    "Propor uma nova data quando houver imprevisto.",
    "Avise o quanto antes e ofereça alternativas."),
  m(15, "agendamento", "Horário disponível",
    "Oi! 💕 Tenho disponibilidade para atendimento em [DATA] às [HORARIO]. Se quiser informações sobre o serviço e o agendamento, pode me chamar.",
    "Avisar sobre um horário livre.",
    "Envie só para quem pediu para ser avisada de horários, e só se o horário existir de verdade."),

  m(16, "pos", "Agradecimento",
    "Oi, [NOME_CLIENTE]! 💖 Obrigada pela confiança no meu trabalho. Foi um prazer te receber!",
    "Agradecer depois do atendimento.",
    "Envie no mesmo dia do atendimento."),
  m(17, "pos", "Acompanhamento",
    "Olá, [NOME_CLIENTE]! Passando para saber como você está após o atendimento. Se apresentar dor, irritação importante ou alterações na visão, procure avaliação oftalmológica.",
    "Acompanhar a cliente depois do procedimento.",
    "Envie um ou dois dias depois. Não dê orientação médica por mensagem."),
  m(18, "pos", "Orientações de cuidados",
    "Oi, [NOME_CLIENTE]! Lembre-se de seguir as orientações de cuidados fornecidas após o procedimento, especialmente em relação à higiene e ao uso dos produtos indicados.",
    "Reforçar as orientações de cuidados.",
    "Complementa as orientações dadas no atendimento. Nunca sugira remoção caseira ou remédios."),
  m(19, "pos", "Dúvidas posteriores",
    "Olá! 💕 Caso tenha dúvidas sobre os cuidados explicados durante seu atendimento, pode entrar em contato. Se houver sintomas oculares importantes, busque avaliação de um oftalmologista.",
    "Deixar o canal aberto para dúvidas.",
    "Pode ser enviada junto com o agradecimento."),
  m(20, "pos", "Manutenção",
    "Oi, [NOME_CLIENTE]! Tudo bem? Se quiser conversar sobre a necessidade de manutenção das suas extensões, podemos avaliar as opções e a disponibilidade.",
    "Lembrar da manutenção, sem pressão.",
    "Envie uma vez, perto do período que vocês combinaram."),

  m(21, "indicacoes", "Pedido de indicação",
    "Oi, [NOME_CLIENTE]! 💕 Se conhecer alguém que gostaria de receber informações sobre meus serviços de cílios, fique à vontade para compartilhar meu contato. Obrigada pela confiança!",
    "Pedir indicações a clientes satisfeitas.",
    "Peça só para quem já foi atendida e uma única vez."),
  m(22, "indicacoes", "Compartilhamento do perfil",
    "Olá! Estou compartilhando conteúdos e informações sobre o universo Lash. Se conhecer alguém que goste desse assunto, pode indicar meu perfil: [INSTAGRAM].",
    "Pedir que conhecidas indiquem o perfil.",
    "Funciona mesmo para quem ainda não atende."),
  m(23, "indicacoes", "Divulgação para contatos interessados",
    "Oi! 💖 Você comentou que tinha interesse em conhecer meus serviços. Se ainda quiser informações, posso te enviar as opções disponíveis.",
    "Retomar com quem disse ter interesse.",
    "Use só se a pessoa realmente demonstrou interesse antes."),
  m(24, "indicacoes", "Novidade de serviço",
    "Olá! Temos uma novidade por aqui: [SERVICO]. ✨ Se quiser conhecer as informações e a disponibilidade, entre em contato.",
    "Anunciar um serviço novo.",
    "Só se o serviço estiver realmente disponível. Envie para quem acompanha seu trabalho."),
  m(25, "indicacoes", "Agradecimento por indicação",
    "Oi, [NOME_CLIENTE]! Muito obrigada por compartilhar meu trabalho com outras pessoas. 💖 Fico feliz pela sua confiança!",
    "Agradecer quem indicou você.",
    "Envie quando souber que alguém chegou por indicação."),

  m(26, "reativacao", "Retomar uma conversa",
    "Oi, [NOME_CLIENTE]! Tudo bem? Estou retomando nosso contato sobre [SERVICO]. Caso ainda queira informações, fico à disposição.",
    "Retomar uma conversa que ficou parada.",
    "Envie uma vez. Se não houver resposta, não insista."),
  m(27, "reativacao", "Novo período de agenda",
    "Olá! 💕 Estou organizando os horários de atendimento para os próximos dias. Se quiser consultar disponibilidade, pode me chamar.",
    "Avisar que a agenda foi organizada.",
    "Para clientes que já atendeu ou que pediram para ser avisadas."),
  m(28, "reativacao", "Comunicado de alteração",
    "Oi, [NOME_CLIENTE]! Passando para informar uma atualização importante sobre seu atendimento: [INFORMACOES_ADICIONAIS]. Se tiver dúvidas, estou à disposição.",
    "Avisar sobre mudança (endereço, horário, forma de pagamento…).",
    "Descreva a mudança em \"Informações adicionais\". Não inclua dados de saúde."),
  m(29, "reativacao", "Retorno após ausência de resposta",
    "Oi, [NOME_CLIENTE]! Tudo bem? Estou encerrando nosso contato anterior para não te incomodar. Caso queira retomar a conversa futuramente, será um prazer te atender.",
    "Encerrar com educação uma conversa sem resposta.",
    "É a última mensagem para essa pessoa: depois dela, não envie outras."),
  m(30, "reativacao", "Mensagem de disponibilidade",
    "Olá! 💖 Se precisar de informações sobre os serviços ou quiser consultar os próximos horários, estou à disposição pelo [WHATSAPP].",
    "Deixar o contato à disposição.",
    "Boa para status do WhatsApp ou resposta para quem pediu contato."),
];

export type PlanDay = {
  day: number;
  objective: string;
  activity: string;
  suggestion: string;
  /** Atalhos relacionados (mensagens da biblioteca ou ferramentas do portal). */
  links?: { label: string; href?: string; messageId?: string }[];
};

const KIT = "#ferramentas/instagram";
const PRECO = "#ferramentas/precificacao";

export const plan: PlanDay[] = [
  { day: 1, objective: "Definir posicionamento", activity: "Escrever uma frase explicando o que pretende compartilhar ou oferecer na área de cílios.", suggestion: "Complete: \"Meu perfil é para quem quer…\". Use essa frase na bio e na sua apresentação." },
  { day: 2, objective: "Organizar informações profissionais", activity: "Revisar nome profissional, descrição do perfil e meios de contato.", suggestion: "Preencha a aba \"Meu perfil\" deste pack: os dados entram automaticamente nas mensagens." },
  { day: 3, objective: "Preparar apresentação", activity: "Criar uma publicação de apresentação profissional.", suggestion: "Use o modelo \"Quem está por trás do meu trabalho\" do Kit Instagram.", links: [{ label: "Abrir o Kit Instagram", href: KIT }] },
  { day: 4, objective: "Pesquisar dúvidas comuns", activity: "Listar cinco dúvidas que o público pode ter sobre extensão de cílios.", suggestion: "Pense em manutenção, cuidados, duração do atendimento e diferença entre efeitos. Anote aqui." },
  { day: 5, objective: "Produzir conteúdo educativo", activity: "Preparar um post explicando o que é extensão de cílios.", suggestion: "Modelo \"O que é extensão de cílios?\" na categoria Dúvidas frequentes do Kit Instagram.", links: [{ label: "Abrir o Kit Instagram", href: KIT }] },
  { day: 6, objective: "Planejar serviços", activity: "Organizar as informações dos serviços que pretende disponibilizar.", suggestion: "Liste nome, duração e o que inclui cada serviço. A Calculadora de Precificação ajuda com os custos.", links: [{ label: "Abrir a Calculadora", href: PRECO }] },
  { day: 7, objective: "Revisar a primeira semana", activity: "Revisar conteúdos criados e anotar melhorias.", suggestion: "O que foi fácil de fazer? O que ficou para depois? Anote abaixo." },
  { day: 8, objective: "Conteúdo sobre cuidados", activity: "Preparar um post sobre higiene e cuidados com extensões.", suggestion: "Categoria \"Cuidados com as extensões\" do Kit Instagram.", links: [{ label: "Abrir o Kit Instagram", href: KIT }] },
  { day: 9, objective: "Apresentar uma técnica", activity: "Explicar de forma introdutória um tipo de efeito visual.", suggestion: "Modelo \"O que significa efeito clássico\" na categoria Conteúdo educativo do Kit Instagram.", links: [{ label: "Abrir o Kit Instagram", href: KIT }] },
  { day: 10, objective: "Criar perguntas frequentes", activity: "Produzir uma publicação respondendo uma dúvida comum.", suggestion: "Escolha uma das cinco dúvidas que você listou no dia 4." },
  { day: 11, objective: "Organizar fotos autorizadas", activity: "Selecionar imagens próprias ou autorizadas para futuras publicações.", suggestion: "Crie uma pasta no celular só com fotos suas ou com autorização por escrito de quem aparece." },
  { day: 12, objective: "Preparar uma legenda", activity: "Criar uma legenda de apresentação utilizando o Pack Primeiras Clientes.", suggestion: "Adapte a mensagem \"Apresentação inicial\" para virar legenda.", links: [{ label: "Ver mensagem", messageId: "msg_01" }] },
  { day: 13, objective: "Interação com o público", activity: "Publicar uma pergunta relacionada às preferências de cílios.", suggestion: "Modelo \"Efeito delicado ou marcante?\" na categoria Enquetes do Kit Instagram.", links: [{ label: "Abrir o Kit Instagram", href: KIT }] },
  { day: 14, objective: "Revisão semanal", activity: "Avaliar quais conteúdos foram produzidos e quais precisam de ajustes.", suggestion: "Anote o que publicou e o que quer melhorar." },
  { day: 15, objective: "Divulgar informações profissionais", activity: "Preparar uma publicação com os canais de contato.", suggestion: "Modelo \"Como entrar em contato comigo\" do Kit Instagram.", links: [{ label: "Abrir o Kit Instagram", href: KIT }] },
  { day: 16, objective: "Conteúdo sobre consulta prévia", activity: "Explicar a importância de conversar com a profissional antes do procedimento.", suggestion: "Modelo \"Por que existe consulta prévia?\" do Kit Instagram.", links: [{ label: "Abrir o Kit Instagram", href: KIT }] },
  { day: 17, objective: "Organização de agendamento", activity: "Preparar uma mensagem explicando como consultar horários, caso já esteja atendendo.", suggestion: "Personalize a mensagem \"Consulta de disponibilidade\". Se ainda não atende, pule sem culpa.", links: [{ label: "Ver mensagem", messageId: "msg_09" }] },
  { day: 18, objective: "Conteúdo sobre manutenção", activity: "Explicar o que é manutenção de extensões.", suggestion: "Modelo \"O que é manutenção?\" do Kit Instagram.", links: [{ label: "Abrir o Kit Instagram", href: KIT }] },
  { day: 19, objective: "Preparar mensagem de atendimento", activity: "Personalizar um texto para responder dúvidas de pessoas interessadas.", suggestion: "Comece pela mensagem \"Primeiro contato\" e salve sua versão.", links: [{ label: "Ver mensagem", messageId: "msg_06" }] },
  { day: 20, objective: "Bastidores reais", activity: "Compartilhar algum aspecto verdadeiro da própria rotina de estudos ou trabalho.", suggestion: "Categoria \"Bastidores\" do Kit Instagram. Mostre só o que é real.", links: [{ label: "Abrir o Kit Instagram", href: KIT }] },
  { day: 21, objective: "Revisar conteúdos publicados", activity: "Registrar os assuntos que geraram dúvidas ou interações.", suggestion: "Anote quais posts tiveram comentários ou perguntas." },
  { day: 22, objective: "Planejar próxima semana", activity: "Escolher três assuntos para futuras publicações.", suggestion: "Use as dúvidas que apareceram nas interações como ponto de partida." },
  { day: 23, objective: "Conteúdo sobre segurança", activity: "Preparar uma publicação sobre a importância da avaliação profissional e dos cuidados oculares.", suggestion: "Modelo \"Quando procurar avaliação oftalmológica\" do Kit Instagram.", links: [{ label: "Abrir o Kit Instagram", href: KIT }] },
  { day: 24, objective: "Apresentação de serviços", activity: "Organizar informações sobre serviços efetivamente disponíveis.", suggestion: "Liste só o que você já oferece de verdade. Se ainda não atende, anote o que pretende oferecer." },
  { day: 25, objective: "Preparar respostas rápidas", activity: "Personalizar três mensagens da biblioteca para situações frequentes.", suggestion: "Sugestões: Primeiro contato, Envio de valores e Confirmação. Salve suas versões.", links: [{ label: "Primeiro contato", messageId: "msg_06" }, { label: "Envio de valores", messageId: "msg_07" }, { label: "Confirmação", messageId: "msg_11" }] },
  { day: 26, objective: "Incentivar dúvidas", activity: "Publicar um convite para que o público envie perguntas.", suggestion: "Modelo \"Envie sua pergunta sobre cílios\" do Kit Instagram.", links: [{ label: "Abrir o Kit Instagram", href: KIT }] },
  { day: 27, objective: "Organizar canais de contato", activity: "Verificar se Instagram, WhatsApp e eventuais links profissionais estão corretos.", suggestion: "Teste cada link do seu perfil e confira os dados em \"Meu perfil\"." },
  { day: 28, objective: "Revisar materiais de divulgação", activity: "Atualizar textos e informações que ficaram desatualizados.", suggestion: "Revise a bio, as mensagens salvas e os destaques do Instagram." },
  { day: 29, objective: "Avaliar o mês", activity: "Registrar quais ações foram concluídas e quais precisam de continuidade.", suggestion: "Releia suas anotações dos dias anteriores." },
  { day: 30, objective: "Criar próximo planejamento", activity: "Selecionar as atividades mais úteis e planejar novos conteúdos para os próximos 30 dias.", suggestion: "Escolha as atividades que mais ajudaram e repita o ciclo com novos temas." },
];

export const texts = {
  storage:
    "Suas preferências e seu progresso ficam armazenados neste navegador. Se você trocar de dispositivo ou apagar os dados do site, poderá perder essas informações.",
  usage:
    "Utilize as mensagens com contatos apropriados, respeitando a privacidade, as preferências e o interesse das pessoas. Evite envios não solicitados ou insistentes.",
  planDone:
    "Parabéns por concluir seu planejamento de 30 atividades! Agora você pode revisar os resultados das suas ações e organizar uma nova sequência de divulgação.",
  noPromise: "As mensagens e o planejamento ajudam a organizar sua divulgação, mas não garantem clientes, vendas ou faturamento.",
};

export const limits = { messageText: 1000, title: 80, note: 1000, customMessages: 100, importBytes: 1024 * 1024, variable: 120 };
