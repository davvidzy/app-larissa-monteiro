/* Modelos 1 a 50: Apresentação, Serviços, Agendamento, Cuidados e Dúvidas frequentes.
   Regras do conteúdo: informativo, sem promessas de resultado/duração/segurança absoluta,
   sem depoimentos, clientes ou formações inventados. Marcadores entre colchetes são
   preenchidos com o perfil da profissional. */

import { defineCategory } from "./build";

export const introTemplates = defineCategory("intro", [
  {
    title: "Apresentando meu espaço profissional",
    headline: "Bem-vinda ao meu cantinho Lash ✨",
    supportingText: "Um espaço pensado para atender com organização, higiene e atenção aos detalhes.\n[NOME_ESTUDIO]",
    caption:
      "Este é o espaço onde organizo meus atendimentos e materiais. Cada detalhe foi pensado para receber você com conforto e cuidado com a higiene. Quer saber mais sobre os serviços? Me chama! 💕",
    cta: "Informações: [WHATSAPP]",
    hashtags: ["#lashdesigner", "#extensaodecilios", "#espacodebeleza", "#cilios"],
    guidance: "Use se você já tem um espaço de atendimento. Uma foto do ambiente combina bem com este modelo.",
  },
  {
    title: "Quem está por trás do meu trabalho",
    headline: "Prazer, eu sou [NOME_PROFISSIONAL]! 💖",
    supportingText: "Seja bem-vinda ao meu perfil dedicado ao universo dos cílios.",
    caption:
      "Por aqui vou compartilhar novidades, informações e conteúdos sobre o universo Lash. Acompanhe minha jornada e fique por dentro das próximas novidades! ✨",
    cta: "Acompanhe meu perfil: [INSTAGRAM]",
    hashtags: ["#lashdesigner", "#prazereusou", "#universolash", "#cilios"],
  },
  {
    title: "Minha jornada na área da beleza",
    headline: "Minha jornada na beleza começou com uma decisão: aprender de verdade.",
    supportingText: "Cada etapa está sendo construída com estudo, organização e dedicação.",
    caption:
      "Toda profissional tem um começo, e eu quero compartilhar o meu com você. Aqui você vai acompanhar o que estou aprendendo, meus objetivos e cada passo dessa caminhada no universo dos cílios. Conta pra mim: você também está começando algo novo? 💬",
    cta: "Acompanhe a jornada: [INSTAGRAM]",
    hashtags: ["#jornadalash", "#areadabeleza", "#lashiniciante", "#extensaodecilios"],
  },
  {
    title: "Conheça os serviços disponíveis",
    headline: "Conheça os serviços disponíveis ✨",
    supportingText: "Destaque: [SERVICO]\nPergunte pelas outras opções no WhatsApp.",
    caption:
      "Quer saber quais serviços estão disponíveis e qual pode combinar com o seu estilo? Antes de qualquer atendimento, faço uma consulta para entender suas preferências. Envie uma mensagem e tire suas dúvidas! 💕",
    cta: "Informações: [WHATSAPP]",
    hashtags: ["#extensaodecilios", "#servicosdebeleza", "#lashdesigner", "#olharmarcante"],
  },
  {
    title: "Minha proposta de atendimento",
    headline: "Atendimento com calma, escuta e cuidado em cada detalhe.",
    supportingText: "Suas preferências e o seu conforto vêm em primeiro lugar.",
    caption:
      "Minha proposta é simples: entender o que você deseja, explicar cada etapa com clareza e respeitar o seu tempo. Acredito que um bom atendimento começa por uma boa conversa. 💖",
    cta: "Converse comigo: [WHATSAPP]",
    hashtags: ["#atendimentohumanizado", "#lashdesigner", "#cuidadoemcadadetalhe", "#cilios"],
  },
  {
    title: "O que estou estudando sobre cílios",
    headline: "O que estou estudando agora sobre cílios 📚",
    supportingText: "Tipos de fios, curvaturas, higiene e cuidados: os fundamentos vêm primeiro.",
    caption:
      "Estudar faz parte da rotina de quem leva a profissão a sério. Nesta fase, estou me dedicando aos fundamentos: materiais, tipos de fios e cuidados com a higiene. Quer acompanhar o que vou aprendendo? Fica por aqui! ✨",
    cta: "Siga: [INSTAGRAM]",
    hashtags: ["#estudandocilios", "#lashiniciante", "#rotinadeestudos", "#universolash"],
  },
  {
    title: "Minhas metas na profissão",
    headline: "Minhas metas para esta nova fase 🎯",
    supportingText: "Estudar com constância, investir em formação prática e construir um trabalho de confiança.",
    caption:
      "Colocar metas no papel ajuda a transformar sonhos em passos concretos. As minhas envolvem estudo, formação e organização. E você, tem alguma meta para este ano? Me conta nos comentários! 💬",
    cta: "Acompanhe: [INSTAGRAM]",
    hashtags: ["#metas", "#lashdesigner", "#novafase", "#empreendedorismofeminino"],
  },
  {
    title: "Meu compromisso com o aprendizado",
    headline: "Meu compromisso: nunca parar de aprender.",
    supportingText: "A área da beleza muda o tempo todo, e eu quero evoluir junto com ela.",
    caption:
      "Novas técnicas, novos produtos, novas formas de cuidar. Por isso, estudar não é uma etapa que acaba: é parte do meu trabalho. Aqui você vai ver um pouco desse processo. 📖✨",
    cta: "Siga o perfil: [INSTAGRAM]",
    hashtags: ["#aprendizadoconstante", "#lashdesigner", "#profissionaldabeleza", "#cilios"],
  },
  {
    title: "Perguntas que recebo sobre meu trabalho",
    headline: "As perguntas que mais recebo por aqui 💭",
    supportingText: "Como funciona? Como agendar? Quais cuidados ter? Pode perguntar!",
    caption:
      "Algumas dúvidas aparecem com frequência, e elas são sempre bem-vindas! Nos próximos posts vou responder as principais. Enquanto isso, se você tiver uma pergunta, é só mandar mensagem. 💕",
    cta: "Mande sua dúvida: [WHATSAPP]",
    hashtags: ["#duvidasfrequentes", "#extensaodecilios", "#lashdesigner", "#perguntas"],
  },
  {
    title: "Como entrar em contato comigo",
    headline: "Quer falar comigo? É fácil! 📲",
    supportingText: "WhatsApp: [WHATSAPP]\nInstagram: [INSTAGRAM]\nAtendimento em [CIDADE]",
    caption: "Para informações sobre serviços, valores e disponibilidade, fale comigo pelos canais da arte. Respondo assim que possível! 💖",
    cta: "Salve este post 📌",
    hashtags: ["#contato", "#lashdesigner", "#extensaodecilios", "#agendeseuhorario"],
  },
]);

export const servicesTemplates = defineCategory("services", [
  {
    title: "Extensão clássica",
    headline: "Conheça a extensão clássica",
    supportingText: "Uma opção para quem busca um efeito visual delicado e definido.",
    caption:
      "Quer entender melhor os serviços disponíveis e qual efeito visual pode combinar com suas preferências? Entre em contato para receber informações sobre a consulta e os atendimentos.",
    cta: "Informações: [WHATSAPP]",
    hashtags: ["#extensaoclassica", "#fioafio", "#extensaodecilios", "#lashdesigner"],
  },
  {
    title: "Volume brasileiro",
    headline: "Volume brasileiro: mais preenchimento para o olhar",
    supportingText: "Uma técnica com fios em formato de Y, para quem gosta de um visual mais marcado.",
    caption:
      "Quer saber se o volume brasileiro combina com o que você procura? Na consulta, conversamos sobre suas preferências e as características dos seus cílios naturais. Mande uma mensagem para saber mais! ✨",
    cta: "Informações: [WHATSAPP]",
    hashtags: ["#volumebrasileiro", "#extensaodecilios", "#ciliosemy", "#lashdesigner"],
  },
  {
    title: "Volume híbrido",
    headline: "Volume híbrido: o equilíbrio entre clássico e volume",
    supportingText: "Combina técnicas para criar um efeito com textura e preenchimento.",
    caption:
      "O híbrido costuma agradar quem quer algo além do clássico, sem abrir mão da naturalidade. A escolha ideal depende da avaliação e do que você deseja. Vamos conversar? 💕",
    cta: "Saiba mais: [WHATSAPP]",
    hashtags: ["#volumehibrido", "#extensaodecilios", "#lashdesigner", "#olharmarcante"],
  },
  {
    title: "Manutenção",
    headline: "Manutenção: o cuidado que acompanha suas extensões",
    supportingText: "Os fios naturais se renovam, e a manutenção ajuda a manter o visual organizado.",
    caption:
      "Nossos cílios naturais passam por um ciclo de crescimento e queda, e as extensões acompanham esse processo. Por isso existe a manutenção. O intervalo varia de pessoa para pessoa: converse comigo para entender o seu caso. 💖",
    cta: "Informações: [WHATSAPP]",
    hashtags: ["#manutencaodecilios", "#extensaodecilios", "#lashdesigner", "#cuidados"],
  },
  {
    title: "Remoção profissional",
    headline: "Quer remover as extensões? Procure uma profissional",
    supportingText: "Tentar retirar em casa pode machucar os fios naturais e irritar a região dos olhos.",
    caption:
      "A remoção deve ser feita com produto adequado e técnica correta. Nunca puxe as extensões nem use produtos improvisados. Se você deseja remover, entre em contato para saber como funciona. 🤍",
    cta: "Informações: [WHATSAPP]",
    hashtags: ["#remocaodecilios", "#extensaodecilios", "#cuidadoscomoolhar", "#lashdesigner"],
  },
  {
    title: "Apresentação do catálogo",
    headline: "Conheça meu catálogo de serviços ✨",
    supportingText: "Destaque: [SERVICO]\nPeça o catálogo completo pelo WhatsApp.",
    caption:
      "Reuni os serviços disponíveis em um só lugar para facilitar sua escolha. Peça o catálogo pelo WhatsApp e tire suas dúvidas sobre cada opção. 💕",
    cta: "Peça o catálogo: [WHATSAPP]",
    hashtags: ["#catalogo", "#servicosdebeleza", "#extensaodecilios", "#lashdesigner"],
  },
  {
    title: "Como consultar valores",
    headline: "Quer saber os valores? 💬",
    supportingText: "Os valores são informados depois de uma conversa sobre o serviço que você procura.",
    caption:
      "Cada serviço tem características próprias, e por isso prefiro explicar tudo com calma antes de passar os valores. Mande uma mensagem dizendo qual efeito você procura que eu te respondo! ✨",
    cta: "Consulte: [WHATSAPP]",
    hashtags: ["#valores", "#extensaodecilios", "#lashdesigner", "#informacoes"],
  },
  {
    title: "Como escolher o efeito desejado",
    headline: "Clássico, volume ou híbrido? Como escolher o seu efeito",
    supportingText: "Leve suas referências para a consulta: juntas, avaliamos o que combina com você.",
    caption:
      "A escolha do efeito depende do resultado visual que você deseja, do formato dos seus olhos e das características dos seus cílios naturais. Por isso a consulta prévia é tão importante. Salve este post para lembrar! 📌",
    cta: "Tire suas dúvidas: [WHATSAPP]",
    hashtags: ["#efeitosdecilios", "#extensaodecilios", "#lashdesigner", "#consulta"],
  },
  {
    title: "Conheça minhas opções de atendimento",
    headline: "Conheça minhas opções de atendimento 💖",
    supportingText: "[SERVICO]\nAtendimento com horário marcado.",
    caption: "Quer saber como funcionam meus atendimentos, o que está disponível e como agendar uma conversa? Envie uma mensagem e eu explico tudo. ✨",
    cta: "Informações: [WHATSAPP]",
    hashtags: ["#atendimento", "#extensaodecilios", "#lashdesigner", "#horariomarcado"],
  },
  {
    title: "Como solicitar informações",
    headline: "Ficou com alguma dúvida sobre os serviços?",
    supportingText: "Envie uma mensagem contando o que você procura. Eu respondo com todas as informações.",
    caption: "Pode perguntar sem compromisso! Quanto mais você souber sobre o serviço, mais tranquila será a sua escolha. 💕",
    cta: "Fale comigo: [WHATSAPP]",
    hashtags: ["#informacoes", "#extensaodecilios", "#lashdesigner", "#tiresuasduvidas"],
  },
]);

export const bookingTemplates = defineCategory("booking", [
  {
    title: "Consulte meus horários",
    headline: "Quer consultar os horários disponíveis? 💕",
    supportingText: "Entre em contato e saiba como funciona o agendamento.",
    availabilityLine: "Agenda aberta para novos atendimentos",
    caption: "Para informações sobre serviços, valores e disponibilidade, envie uma mensagem para [WHATSAPP].",
    cta: "Consulte: [WHATSAPP]",
    hashtags: ["#agenda", "#extensaodecilios", "#lashdesigner", "#agendamento"],
  },
  {
    title: "Como agendar",
    headline: "Como agendar em 3 passos ✨",
    supportingText: "1. Envie uma mensagem\n2. Conte qual serviço deseja\n3. Combine o melhor horário",
    availabilityLine: "Novos horários disponíveis",
    caption:
      "Agendar é simples! Me chama no WhatsApp, conta o que você procura e a gente encontra juntas um horário que funcione para as duas. 💖",
    cta: "WhatsApp: [WHATSAPP]",
    hashtags: ["#comoagendar", "#agendamento", "#extensaodecilios", "#lashdesigner"],
  },
  {
    title: "Agenda da semana",
    headline: "Agenda da semana 🗓️",
    supportingText: "Consulte os horários antes de se programar.",
    availabilityLine: "Ainda há horários livres nesta semana",
    caption: "Gosta de se organizar com antecedência? Me chama para conferir a disponibilidade desta semana e combinar o melhor dia para você. 💕",
    cta: "Consulte: [WHATSAPP]",
    hashtags: ["#agendadasemana", "#lashdesigner", "#extensaodecilios", "#horarios"],
  },
  {
    title: "Horários do mês",
    headline: "Planejando o mês? Consulte a agenda 📅",
    supportingText: "Agendar com antecedência ajuda você a encontrar o melhor dia.",
    availabilityLine: "Agenda do mês aberta",
    caption: "Se você gosta de deixar tudo organizado, consulte a disponibilidade do mês e reserve seu horário com tranquilidade. ✨",
    cta: "Informações: [WHATSAPP]",
    hashtags: ["#agendadomes", "#planejamento", "#extensaodecilios", "#lashdesigner"],
  },
  {
    title: "Agendamento com antecedência",
    headline: "Tem um evento chegando? Agende com antecedência ⏰",
    supportingText: "Assim fica mais fácil conciliar sua rotina com os horários disponíveis.",
    availabilityLine: "Horários disponíveis para as próximas semanas",
    caption:
      "Datas especiais e fins de semana costumam ser mais procurados. Se você tem um evento em vista, entre em contato com antecedência para consultar a disponibilidade. 💖",
    cta: "Agende pelo WhatsApp: [WHATSAPP]",
    hashtags: ["#antecedencia", "#eventos", "#extensaodecilios", "#lashdesigner"],
  },
  {
    title: "Como confirmar seu horário",
    headline: "Já agendou? Não esqueça de confirmar ✅",
    supportingText: "A confirmação ajuda a organizar a agenda e a preparar tudo para o seu atendimento.",
    caption:
      "Antes do atendimento, envio uma mensagem de confirmação. Responder ajuda muito na organização e permite remanejar horários quando necessário. Obrigada pela parceria! 🤍",
    cta: "Dúvidas: [WHATSAPP]",
    hashtags: ["#confirmacao", "#organizacao", "#extensaodecilios", "#lashdesigner"],
  },
  {
    title: "Política de reagendamento",
    headline: "Precisa reagendar? Avise com antecedência 🙏",
    supportingText: "Assim consigo reorganizar a agenda e oferecer o horário para outra pessoa.",
    caption:
      "Imprevistos acontecem, e tudo bem! Peço apenas que avise o quanto antes, para que possamos encontrar uma nova data. Consulte as condições de reagendamento pelo WhatsApp. 💕",
    cta: "Reagende: [WHATSAPP]",
    hashtags: ["#reagendamento", "#agenda", "#extensaodecilios", "#lashdesigner"],
    guidance: "Se você tem regras específicas (prazo de aviso, taxas), escreva-as na legenda.",
  },
  {
    title: "Organização dos atendimentos",
    headline: "Como organizo meus atendimentos 📋",
    supportingText: "Horário marcado, tempo dedicado e atenção exclusiva para cada cliente.",
    caption: "Trabalho com horário marcado para que cada atendimento aconteça com calma, sem pressa e com toda a atenção que você merece. ✨",
    cta: "Informações: [WHATSAPP]",
    hashtags: ["#organizacao", "#horariomarcado", "#extensaodecilios", "#lashdesigner"],
  },
  {
    title: "Atendimento mediante consulta",
    headline: "Todo atendimento começa com uma conversa 💬",
    supportingText: "Antes do procedimento, conversamos sobre suas preferências e informações importantes.",
    caption:
      "A consulta prévia é o momento de alinhar expectativas, tirar dúvidas e verificar informações relevantes antes de qualquer procedimento. Ela faz parte de um atendimento responsável. 💖",
    cta: "Agende sua consulta: [WHATSAPP]",
    hashtags: ["#consultaprevia", "#atendimentoresponsavel", "#extensaodecilios", "#lashdesigner"],
  },
  {
    title: "Como solicitar disponibilidade",
    headline: "Quer saber se tem horário para você?",
    supportingText: "Envie o dia e o período de sua preferência pelo WhatsApp.",
    availabilityLine: "Horários disponíveis: consulte!",
    caption:
      "Para agilizar, me conte qual serviço deseja e quais dias e períodos ficam melhores para você. Assim já consigo verificar a disponibilidade. 📲",
    cta: "WhatsApp: [WHATSAPP]",
    hashtags: ["#disponibilidade", "#agendamento", "#extensaodecilios", "#lashdesigner"],
  },
]);

export const careTemplates = defineCategory("care", [
  {
    title: "Importância da higiene",
    headline: "Cuidados com suas extensões 💖",
    supportingText: "A higiene adequada da região dos olhos faz parte da rotina de cuidados.",
    caption:
      "Siga as orientações específicas fornecidas pela profissional responsável e as instruções dos produtos utilizados. Caso apresente irritação importante, dor ou alterações na visão, procure avaliação oftalmológica.",
    cta: "Dúvidas: [WHATSAPP]",
    hashtags: ["#higiene", "#cuidadoscomcilios", "#extensaodecilios", "#lashdesigner"],
  },
  {
    title: "Cuidados na região dos olhos",
    headline: "A região dos olhos é sensível. Trate com carinho 🤍",
    supportingText: "Evite esfregar os olhos e siga as orientações recebidas após o atendimento.",
    caption:
      "Gestos do dia a dia, como coçar ou esfregar os olhos, podem incomodar a região e afetar as extensões. Em caso de dúvida, fale com a profissional que fez o seu atendimento. Se sentir dor ou desconforto persistente, procure avaliação oftalmológica.",
    cta: "Dúvidas: [WHATSAPP]",
    hashtags: ["#cuidadoscomoolhar", "#extensaodecilios", "#dicadecuidado", "#lashdesigner"],
  },
  {
    title: "Evitar puxar os fios",
    headline: "Não puxe os fios! 🚫",
    supportingText: "Puxar as extensões pode levar junto os fios naturais.",
    caption:
      "Quando um fio parecer solto ou fora do lugar, resista à tentação de puxar. Converse com a profissional responsável para avaliar e orientar o melhor caminho. Seus cílios naturais agradecem! 💕",
    cta: "Fale comigo: [WHATSAPP]",
    hashtags: ["#naopuxeoscilios", "#cuidadoscomcilios", "#extensaodecilios", "#lashdesigner"],
  },
  {
    title: "Não tentar remover extensões em casa",
    headline: "Remover extensões em casa? Melhor não",
    supportingText: "A remoção deve ser feita por uma profissional, com produto adequado.",
    caption:
      "Óleos, pinças ou produtos improvisados podem irritar os olhos e danificar os fios naturais. Se você deseja remover suas extensões, procure uma profissional. 🤍",
    cta: "Informações: [WHATSAPP]",
    hashtags: ["#remocaoprofissional", "#extensaodecilios", "#cuidadoscomcilios", "#lashdesigner"],
  },
  {
    title: "Atenção a sinais de irritação",
    headline: "Fique atenta aos sinais de irritação ⚠️",
    supportingText: "Vermelhidão, coceira intensa, inchaço ou dor merecem atenção.",
    caption:
      "Se você notar desconforto após o procedimento, entre em contato com a profissional responsável. Em caso de dor, irritação importante ou alterações na visão, procure avaliação oftalmológica sem demora.",
    cta: "Contato: [WHATSAPP]",
    hashtags: ["#saudedosolhos", "#cuidadoscomcilios", "#extensaodecilios", "#informacao"],
  },
  {
    title: "Como seguir orientações pós-procedimento",
    headline: "As orientações pós-atendimento fazem diferença 📝",
    supportingText: "Cada profissional e cada produto podem ter recomendações específicas.",
    caption:
      "Depois do atendimento, siga as orientações que você recebeu e guarde-as para consultar quando precisar. Se surgir alguma dúvida, pergunte: é melhor esclarecer do que adivinhar. 💖",
    cta: "Dúvidas: [WHATSAPP]",
    hashtags: ["#posprocedimento", "#cuidadoscomcilios", "#extensaodecilios", "#lashdesigner"],
  },
  {
    title: "Por que não compartilhar produtos de uso pessoal",
    headline: "Produtos de uso pessoal não se compartilham 🙅‍♀️",
    supportingText: "Escovinhas, máscara e lápis de olho são individuais.",
    caption:
      "Compartilhar produtos que entram em contato com a região dos olhos aumenta o risco de irritações e contaminações. Cada uma com o seu! ✨",
    cta: "Siga para mais dicas: [INSTAGRAM]",
    hashtags: ["#usopessoal", "#higiene", "#cuidadoscomoolhar", "#dicadebeleza"],
  },
  {
    title: "Cuidados ao utilizar maquiagem",
    headline: "Maquiagem e extensões: atenção aos produtos 💄",
    supportingText: "Prefira os produtos indicados pela profissional e remova a maquiagem com delicadeza.",
    caption:
      "Alguns produtos podem não ser adequados para quem usa extensões. Antes de mudar sua rotina de maquiagem, converse com a profissional que fez seu atendimento e siga as orientações recebidas.",
    cta: "Dúvidas: [WHATSAPP]",
    hashtags: ["#maquiagem", "#extensaodecilios", "#cuidadoscomcilios", "#lashdesigner"],
  },
  {
    title: "Como conversar sobre manutenção",
    headline: "Vamos conversar sobre a sua manutenção? 💬",
    supportingText: "O intervalo ideal varia de pessoa para pessoa.",
    caption:
      "Cada cliente tem um ciclo de crescimento dos fios e uma rotina diferente. Na conversa, avaliamos juntas o melhor momento para a manutenção. Me chama para combinar! 💕",
    cta: "Combine pelo WhatsApp: [WHATSAPP]",
    hashtags: ["#manutencao", "#extensaodecilios", "#lashdesigner", "#cuidados"],
  },
  {
    title: "Quando procurar avaliação oftalmológica",
    headline: "Quando procurar um oftalmologista 👁️",
    supportingText: "Dor, irritação que não melhora ou qualquer alteração na visão.",
    caption:
      "Extensão de cílios é um procedimento estético e não substitui os cuidados com a saúde dos olhos. Diante de sintomas preocupantes, procure um oftalmologista. Em caso de perda súbita de visão ou dor intensa, busque atendimento de urgência.",
    cta: "Salve esta informação 📌",
    hashtags: ["#saudeocular", "#oftalmologista", "#cuidadoscomoolhar", "#informacao"],
  },
]);

export const faqTemplates = defineCategory("faq", [
  {
    title: "O que é extensão de cílios?",
    headline: "O que é extensão de cílios? 🤔",
    supportingText: "É a aplicação de fios sintéticos sobre os cílios naturais, feita por uma profissional.",
    caption:
      "A extensão de cílios é um procedimento estético que alonga e preenche o olhar. Ela pode ser feita fio a fio ou com técnicas de volume, sempre respeitando os cílios naturais. Ficou com dúvida? Pergunte nos comentários! 💬",
    cta: "Mais dúvidas: [WHATSAPP]",
    hashtags: ["#oqueeextensaodecilios", "#duvidasfrequentes", "#extensaodecilios", "#lashdesigner"],
  },
  {
    title: "Extensão x máscara de cílios",
    headline: "Extensão de cílios ou máscara: qual a diferença?",
    supportingText: "A máscara é maquiagem e sai na limpeza. A extensão é um procedimento feito por uma profissional.",
    caption:
      "Enquanto a máscara de cílios é aplicada e removida no dia a dia, a extensão acompanha o ciclo dos fios naturais e precisa de manutenção. São propostas diferentes para necessidades diferentes. ✨",
    cta: "Siga para mais respostas: [INSTAGRAM]",
    hashtags: ["#mascaradecilios", "#extensaodecilios", "#duvidasfrequentes", "#beleza"],
  },
  {
    title: "O que é manutenção?",
    headline: "O que é manutenção de extensão?",
    supportingText: "É o atendimento que repõe os fios que caíram junto com os cílios naturais.",
    caption:
      "Os cílios naturais caem e se renovam com o tempo, e as extensões presas a eles também. Na manutenção, a profissional avalia e repõe os fios para manter o visual. O intervalo varia para cada pessoa. 💖",
    cta: "Dúvidas: [WHATSAPP]",
    hashtags: ["#manutencaodecilios", "#duvidasfrequentes", "#extensaodecilios", "#lashdesigner"],
  },
  {
    title: "Por que existe consulta prévia?",
    headline: "Você sabe para que serve a consulta prévia?",
    supportingText:
      "Ela ajuda a profissional a compreender as preferências da cliente e verificar informações relevantes antes de considerar o procedimento.",
    caption:
      "Na consulta, conversamos sobre o efeito que você deseja, seu histórico com procedimentos e possíveis sensibilidades. É um cuidado que vem antes de qualquer decisão. 🤍",
    cta: "Agende uma conversa: [WHATSAPP]",
    hashtags: ["#consultaprevia", "#duvidasfrequentes", "#extensaodecilios", "#lashdesigner"],
    formats: ["portrait", "story", "square"],
  },
  {
    title: "Como funciona o agendamento?",
    headline: "Como funciona o agendamento?",
    supportingText: "Você entra em contato, conversamos sobre o serviço e combinamos data e horário.",
    caption: "Tudo começa com uma mensagem! A partir dela, explico como funciona o atendimento, passo os valores e verificamos juntas a disponibilidade. 📲",
    cta: "Comece por aqui: [WHATSAPP]",
    hashtags: ["#agendamento", "#duvidasfrequentes", "#extensaodecilios", "#lashdesigner"],
  },
  {
    title: "Posso escolher diferentes efeitos?",
    headline: "Posso escolher o efeito das minhas extensões?",
    supportingText: "Sim! Suas preferências são o ponto de partida da conversa.",
    caption:
      "Você pode trazer referências e contar o que deseja. A profissional avalia suas características e explica quais opções são possíveis no seu caso. A decisão é construída em conjunto. 💕",
    cta: "Converse comigo: [WHATSAPP]",
    hashtags: ["#efeitosdecilios", "#duvidasfrequentes", "#extensaodecilios", "#lashdesigner"],
  },
  {
    title: "Qual a importância da higiene?",
    headline: "Por que a higiene é tão importante?",
    supportingText: "Ela faz parte dos cuidados com a região dos olhos e com as extensões.",
    caption:
      "Manter a região limpa, seguindo as orientações recebidas, contribui para o conforto e para os cuidados com os olhos. Na dúvida sobre como fazer, pergunte à profissional responsável. ✨",
    cta: "Dúvidas: [WHATSAPP]",
    hashtags: ["#higiene", "#duvidasfrequentes", "#cuidadoscomcilios", "#lashdesigner"],
  },
  {
    title: "O que fazer se houver irritação?",
    headline: "E se eu sentir irritação?",
    supportingText: "Fale com a profissional. Em caso de dor ou alteração na visão, procure um oftalmologista.",
    caption:
      "Não ignore sinais de desconforto. Relate o que está sentindo à profissional que fez o atendimento. Sintomas importantes devem ser avaliados por um profissional de saúde.",
    cta: "Contato: [WHATSAPP]",
    hashtags: ["#irritacao", "#saudedosolhos", "#duvidasfrequentes", "#extensaodecilios"],
  },
  {
    title: "Como funciona uma remoção profissional?",
    headline: "Como funciona a remoção profissional?",
    supportingText: "A profissional utiliza um produto específico para soltar as extensões com cuidado.",
    caption:
      "A remoção é feita com produto adequado, sem puxar os fios. É a forma indicada para retirar as extensões preservando os cílios naturais. Quer saber mais? Me chama! 💖",
    cta: "Informações: [WHATSAPP]",
    hashtags: ["#remocaodecilios", "#duvidasfrequentes", "#extensaodecilios", "#lashdesigner"],
  },
  {
    title: "Como obter informações sobre serviços?",
    headline: "Onde tiro minhas dúvidas sobre os serviços?",
    supportingText: "Pelo WhatsApp: [WHATSAPP]",
    caption: "Ficou com alguma pergunta que não foi respondida por aqui? Envie uma mensagem e eu respondo com atenção. 💬",
    cta: "Instagram: [INSTAGRAM]",
    hashtags: ["#informacoes", "#duvidasfrequentes", "#extensaodecilios", "#lashdesigner"],
  },
]);
