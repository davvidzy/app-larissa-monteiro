# Portal da aluna — Kit Lash do Zero

Área de entrega do produto: PDFs para baixar, calculadoras e modelos de post editáveis.
Projeto independente da landing: tem o próprio `package.json` e pode virar um repositório separado
só movendo esta pasta.

## Rodar no computador

```bash
cd portal
npm install
npm run dev
```

## Onde mexer

| O quê | Onde |
|---|---|
| Lista de PDFs, textos, modelos de post | `src/config/portal.ts` |
| PDF em destaque no Início ("Comece estudando") | `featured: true` no material, em `portal.ts` |
| Arquivos PDF | `public/materiais/` (depois aponte o `file` em `portal.ts`) |
| Lista de ferramentas | `tools` em `src/components/Tools.tsx` |
| Calculadora de Precificação | `src/tools/precificacao/` (cálculos em `calc.ts`, telas em `ui/`) |
| Calculadora de meta | `src/components/Calculators.tsx` |

## Seções

- **Início** (`#inicio`): o PDF principal com capa (1ª página do próprio arquivo) e o passo a passo.
- **Estudar** (`#estudar`): todos os PDFs. "Ler agora" abre o leitor (`#estudar/<id>`), com as
  páginas em rolagem e o botão de baixar. O leitor é o pdf.js, que vai junto no build e só é
  carregado quando um PDF é aberto.
- **Ferramentas** (`#ferramentas`): `/checklist`, `/anamnese`, `/agenda`, `/precificacao`, `/meta`, `/instagram`, `/primeiras-clientes`.
  Cada ferramenta é carregada só quando aberta (`lazy` em `src/components/Tools.tsx`).

## Calculadora de Precificação

- Dinheiro em centavos inteiros; preços mínimo e sugerido arredondados para cima (nunca abaixo do necessário).
- Testes: `npm test` (cálculos, salvamento, relatório, separação por e-mail).
- Salvamento no navegador, separado por e-mail de acesso, com backup em arquivo (.json) para trocar de aparelho.
- Relatório em PDF pela janela de impressão do navegador ("Salvar como PDF"), sem biblioteca externa.

## Checklist da Lash Iniciante

- Conteúdo fixo (etapas, tarefas, mensagens) em `src/tools/checklist/content.ts`. Os IDs
  `etapaN_tarefaM` são estáveis: mude o texto à vontade, mas não reaproveite IDs.
- Lógica (progresso, recomendações, validação, migração, salvamento) em `state.ts`, com testes.
- Salvo no `localStorage` na chave `bellash_checklist_v1`; cópia/restauração em
  `bellash_checklist_progresso.json`. Para mudar o formato no futuro, suba a versão e adicione o
  passo em `migrate()`.

## Ficha de Consulta e Anamnese

- Perguntas, alertas e avisos em `src/tools/anamnese/content.ts`; validação e alertas em `form.ts`;
  conteúdo do documento em `document.ts` (o mesmo para PDF e impressão); PDF em `pdf.ts` (jsPDF,
  carregado só ao gerar).
- **Nenhum dado da ficha é salvo**: nada de localStorage, sessionStorage, IndexedDB, cookies, URL ou
  rede. O rascunho fica só na memória da página (some ao recarregar). Não adicione analytics,
  gravação de sessão ou monitoramento de erros que capture campos desta ferramenta.

## Assistente de Agendamentos Lash

- `src/tools/agenda/calendar.ts`: término, conversão de fuso (Intl, sem bibliotecas) e link
  `calendar.google.com/calendar/render?action=TEMPLATE` (text, dates, details, location, stz, etz, ctz).
- Sem API, OAuth ou armazenamento: o formulário fica só na memória da página.

## Kit Instagram Lash Profissional

- Disponível para todas as alunas na lista de Ferramentas (`#ferramentas/instagram`).
- 100 modelos em `src/tools/instagram/templates/` (`content-a.ts` e `content-b.ts`); IDs estáveis
  `intro_001` … `news_010`. Composição por formato em `layout.ts`, desenho em `render.ts`.
- Perfil no `localStorage` (`bellash_instagram_profile_v1`); projetos e fotos no IndexedDB
  (`bellash_instagram_projects_v1`). Backup em ZIP (`backup.ts`, com fflate).

## Pack Primeiras Clientes

- 30 mensagens e 30 atividades em `src/tools/primeiras-clientes/content.ts` (IDs `msg_01`… estáveis).
- Variáveis, WhatsApp (`api.whatsapp.com/send`), progresso e backup em `state.ts`, com testes.
- Salvo no `localStorage` (`bellash_primeiras_clientes_v1`). Variáveis de cada mensagem (nome da
  cliente, data, valor…) e o número de destino nunca são salvos.

## Acesso

Sem senha. A aluna digita o e-mail e o acesso fica salvo no navegador (`localStorage`).
Só é conferido o formato do e-mail. O portal não aparece no Google (`robots.txt`, meta `noindex`
e cabeçalho `X-Robots-Tag` no `.htaccess`).

## Publicar (quando virar repositório próprio)

1. Mova o conteúdo desta pasta para a raiz do novo repositório e faça o push na `main`.
2. O workflow `.github/workflows/deploy.yml` gera o build e publica na branch `deploy`.
3. No hPanel: crie o subdomínio (ex.: `membros`), ative o SSL e, em **Avançado → Git**,
   ligue o repositório, branch `deploy`, na pasta do subdomínio.
