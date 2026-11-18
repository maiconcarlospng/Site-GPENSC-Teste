# GPENSC — Site institucional e painel de gestão

> **Estado do projeto:** ambiente de desenvolvimento e validação do site do Grupo de Pesquisa e Ensino em Nutrição e Saúde Coletiva (GPENSC), vinculado à Universidade Federal de Ouro Preto (UFOP). Este repositório ainda está na conta pessoal de desenvolvimento e **a portabilidade para a conta/organização institucional do GPENSC está planejada, mas não foi realizada**. A aprovação institucional, o endereço definitivo e os responsáveis pela infraestrutura devem ser confirmados antes da migração.

O site é responsivo e construído com **Quarto, R, HTML, CSS/SCSS e YAML**. Os dados são versionados no GitHub. O conteúdo público é gerado como site estático pelo **GitHub Actions + GitHub Pages**. A administração possui um painel próprio conectado à API do GitHub e uma rota separada para o **Sveltia CMS**.

## Acessos e repositório atual

- **Site de desenvolvimento:** https://maiconcarlospng.github.io/Site-GPENSC-Teste/
- **Painel principal:** https://maiconcarlospng.github.io/Site-GPENSC-Teste/admin/
- **Painel próprio (rota direta):** https://maiconcarlospng.github.io/Site-GPENSC-Teste/admin/app.html
- **Editor Sveltia alternativo:** https://maiconcarlospng.github.io/Site-GPENSC-Teste/admin/cms.html
- **Repositório:** https://github.com/maiconcarlospng/Site-GPENSC-Teste
- **Publicações e validações:** https://github.com/maiconcarlospng/Site-GPENSC-Teste/actions
- **Guia operacional complementar:** [COMO-EDITAR.md](COMO-EDITAR.md)
- **Configuração do rastreamento:** [analytics.html](analytics.html), [data/analytics.json](data/analytics.json)
- **Worker de estatísticas:** [analytics-worker/](analytics-worker/) e [instruções de ativação](analytics-worker/README.md)

---

## Índice

1. [Arquitetura e funcionamento](#arquitetura-e-funcionamento)
2. [Painel administrativo](#painel-administrativo)
3. [Coleções e configurações](#coleções-e-configurações)
4. [Agenda e destaque automático na página inicial](#agenda-e-destaque-automático-na-página-inicial)
5. [Painel de resumo e histórico](#painel-de-resumo-e-histórico)
6. [Estatísticas de acesso com Umami](#estatísticas-de-acesso-com-umami)
7. [Mapa dos principais arquivos](#mapa-dos-principais-arquivos)
8. [Publicação, validação e GitHub Actions](#publicação-validação-e-github-actions)
9. [Desenvolvimento local](#desenvolvimento-local)
10. [Cuidados de manutenção e segurança](#cuidados-de-manutenção-e-segurança)
11. [Portabilidade futura para a conta do GPENSC](#portabilidade-futura-para-a-conta-do-gpensc)
12. [Checklist antes da institucionalização](#checklist-antes-da-institucionalização)
13. [Solução de problemas](#solução-de-problemas)

---

## Arquitetura e funcionamento

O site público é estático. O navegador recebe arquivos HTML, CSS, JavaScript, imagens e dados públicos; não existe um servidor R executando a cada visita. R e Quarto são usados durante a compilação, no GitHub Actions ou no computador de desenvolvimento.

```text
Colaborador autorizado
        |
        v
/admin/  ->  painel administrativo próprio
        |
        | autenticação GitHub via Cloudflare Worker
        v
GitHub API  ->  grava conteúdo em data/*.yml e imagens em img/
        |
        v
GitHub Actions
  1. valida configuração e arquivos
  2. valida os arquivos e compila Quarto/R sempre a partir do mesmo commit
  3. gera/atualiza _site/
        |
        v
GitHub Pages  ->  site público atualizado
```

| Tecnologia/serviço | Função |
|---|---|
| **Quarto** | Compila páginas `.qmd`, navegação, tema e recursos do site. |
| **R** | Lê os YAML e produz cartões, listagens, galeria, agenda e componentes. |
| **YAML em `data/`** | Armazena notícias, eventos, equipe, projetos, publicações e demais conteúdos. |
| **Painel próprio (`admin/app.*`)** | Interface principal para resumo, edição, configuração, galeria e planilhas. |
| **Sveltia CMS (`admin/cms.html`)** | Editor alternativo, mantido para acesso às funções do CMS. |
| **Cloudflare Worker de autenticação** | Intermedeia o OAuth do GitHub; não deve expor Client Secret. |
| **Cloudflare Worker de acesso** | Valida o código de colaboradores e faz proxy restrito para a API do repositório, sem entregar o token GitHub ao navegador. |
| **Umami** | Recebe os eventos de navegação do site e fornece estatísticas de acesso. |
| **Cloudflare Worker de analytics** | Proxy planejado para consultar a API do Umami sem expor a chave no navegador. |
| **GitHub Actions** | Valida, compila e publica o site. |
| **GitHub Pages** | Hospeda a versão estática publicada. |

**Regra importante:** salvar no painel não altera diretamente o HTML já publicado. O painel cria um commit no repositório. A mudança pública só aparece depois que a execução do GitHub Actions publicar com sucesso.


### Organização das páginas públicas

A navegação principal é dividida entre **Grupo**, **Pesquisa**, **Extensão**, **Ensino**, **Divulgação**, **Agenda**, **Notícias** e **Contato**. Quem somos, história, árvore, parcerias e impacto social estão reunidos em Grupo; os acervos de pesquisa e de divulgação ficam em seus respectivos submenus.

A página inicial apresenta o grupo, oferece acesso direto às três frentes, destaca a árvore do conhecimento, pesquisas, iniciativas de extensão e a próxima atividade. As notícias só são exibidas na home quando houver registros reais. O índice completo de pesquisas aparece em `pesquisa.qmd` e os formatos de divulgação em `divulgacao.qmd`, evitando replicar o mesmo conjunto de atalhos.

As páginas de projetos mantêm sua identidade própria; os destaques de Extensão não devem ser repetidos na tabela de outros projetos. Se não houver projetos adicionais ou coordenadas de parcerias, essas seções não exibem um segundo aviso vazio. O conteúdo segue editável pelos dados YAML e pelo painel administrativo.

---

## Painel administrativo

### Endereços e modos

A rota `/admin/` redireciona para `admin/app.html`, que é a interface administrativa principal desenvolvida para o GPENSC.

- **Painel próprio:** `admin/app.html` + `admin/app.js` + `admin/app.css`.
- **Entrada curta:** `admin/index.html`, que redireciona para o painel próprio.
- **Editor Sveltia alternativo:** `admin/cms.html`, configurado por `admin/config.yml`.
- **Widgets e ferramentas do Sveltia:** arquivos como `galeria-multipla.js`, `excel-button.js`, `preview.js`, `dashboard.js` e seus estilos.

O painel próprio e o editor Sveltia são rotas distintas. A entrada pública `/admin/` deve continuar levando ao painel próprio, a menos que a equipe decida explicitamente alterar esse comportamento.

### Autenticação e permissões

O painel próprio usa autenticação OAuth do GitHub por meio do Worker atualmente configurado em:

`https://sveltia-cms-auth.maicon-carlos.workers.dev`

O fluxo abre a autorização do GitHub, recebe o token por comunicação entre janelas com validação de origem e janela de origem, guarda a sessão em `sessionStorage` e usa a API do GitHub para ler e gravar os arquivos. O botão de saída encerra a sessão local.

O backend atual trabalha com:

- Repositório: `maiconcarlospng/Site-GPENSC-Teste`
- Branch: `main`
- Escopo solicitado no fluxo do painel próprio: `repo`
- Worker de OAuth: `sveltia-cms-auth.maicon-carlos.workers.dev`

**Acesso não é concedido pelo layout do painel.** As permissões efetivas dependem da conta GitHub autenticada e do acesso dela ao repositório. O painel grava diretamente na branch `main`; não existe uma etapa de aprovação editorial por Pull Request configurada no fluxo principal.

No Worker de autenticação, mantenha as variáveis de runtime e segredos exigidos pela implementação OAuth, incluindo `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` e `ALLOWED_DOMAINS`. O Client Secret deve existir somente como Secret no Cloudflare. Nunca o coloque em YAML, HTML, JavaScript público, README ou commit.

### Como autorizar e remover editores do painel

**Acesso individual pelo GitHub.** A coordenação concede a permissão no repositório que publica o site. A aba **Equipe** do painel serve para cadastrar os integrantes apresentados na página pública.

1. No repositório atual, abra **Settings → Collaborators → Add people**. Informe o usuário GitHub ou o e-mail da pessoa e envie o convite.
2. Quando o repositório estiver na organização do GPENSC, use **Settings → Collaborators and teams** no repositório institucional. Conceda **Write** à pessoa ou a uma equipe de editores. Se usar uma equipe, inclua a pessoa nela e confira se a equipe tem **Write** nesse repositório. A publicação direta depende também das regras da branch `main`.
3. Peça à pessoa para aceitar o convite, abrir a rota `/admin/` do site e escolher **Entrar com GitHub**, usando a conta convidada. Para confirmar que ela pode publicar, use uma edição real aprovada pela coordenação e confira o commit. Abrir o painel ou preparar um rascunho local só confirma parte do fluxo.
4. Para retirar o acesso individual, remova a pessoa em **Collaborators** ou da equipe que concede a permissão. Confira se outra equipe ou permissão direta ainda permite a escrita.

**Acesso por código.** A coordenação pode fornecer o código compartilhado pelo canal privado do grupo. Nesse modo não há cadastro por e-mail nem revogação individual. Se alguém que conhece o código sair, altere o segredo `ACCESS_CODE` no Worker de acesso da Cloudflare, aplique a alteração e distribua o novo código somente às pessoas autorizadas. O Worker invalida as sessões vinculadas ao código anterior. Revise também as permissões GitHub dessa pessoa se ela utilizava os dois modos.

### Recursos do painel próprio

O painel foi personalizado para uso em desktop e celular e inclui:

- **Painel de resumo:** indicadores de conteúdo, gráficos de distribuição por frente de atuação e por tipo de conteúdo, além do histórico de adições.
- **Conteúdo do site:** navegação separada das configurações institucionais.
- **Edição de registros:** criação, edição e exclusão de itens das coleções.
- **Configurações institucionais:** formulários para editar arquivos YAML de campos únicos e listas aninhadas, como os tópicos adicionais do endereço.
- **Galeria:** seleção e envio de imagens, pré-visualização, edição de legenda e ajuste do ponto focal/recorte.
- **Planilhas:** exportação e importação Excel/CSV nas coleções compatíveis, com prévia e validação antes de gravar os novos registros.
- **Atualização de dados:** recarrega os YAML do repositório.
- **Histórico:** consulta commits do GitHub para identificar adições recentes.
- **Uso móvel:** menu adaptado, navegação inferior rápida, cartões e formulários reorganizados para telas menores.

Os arquivos centrais são `admin/app.js`, `admin/app.css` e `admin/app.html`. Ao alterar o JavaScript ou CSS do painel, atualize também o parâmetro de versão desses arquivos em `admin/app.html` quando necessário, para evitar que o navegador continue usando uma versão em cache.


### Entrada por código de acesso

A tela de login oferece duas alternativas: autenticação individual com GitHub ou código compartilhado pela coordenação. O acesso por código não exige conta GitHub de cada colaborador. O navegador recebe somente uma sessão temporária assinada; o token GitHub fica como Secret no Cloudflare e o Worker restringe as operações ao repositório atual.

O código é um segredo compartilhado, não uma identidade individual. Todos os usuários desse modo escrevem usando a conta vinculada ao token de serviço e as alterações do GitHub não identificam cada colaborador separadamente. A sessão dura 8 horas; trocar o Secret `ACCESS_CODE` invalida sessões anteriores. A publicação e os Secrets necessários estão descritos em [admin-access-worker/README.md](admin-access-worker/README.md).

---

## Coleções e configurações

O menu do painel próprio separa **CONTEÚDO DO SITE** de **CONFIGURAÇÕES**.

### Conteúdo do site — 15 coleções

| Seção | Arquivo | Conteúdo |
|---|---|---|
| Notícias | `data/noticias.yml` | Notícias, datas, categorias, resumos, textos, links e imagens. |
| Agenda e eventos | `data/eventos.yml` | Aulas abertas, palestras, oficinas, workshops, participações e outros eventos. |
| Linhas de pesquisa | `data/linhas.yml` | Identificadores, nomes, descrições e palavras-chave das linhas. |
| Projetos | `data/projetos.yml` | Projetos de pesquisa e extensão, situação, coordenação, período e linha associada. |
| Publicações | `data/publicacoes.yml` | Artigos e demais produções, autores, ano, veículo, DOI e linha associada. |
| Livros | `data/livros.yml` | Livros, autores, editora, ano e endereço de acesso. |
| Defesas e bancas | `data/defesas.yml` | Qualificações e defesas, nível, etapa, autor, título, data e orientador. |
| Equipe e integrantes | `data/equipe.yml` | Nome, categoria, papel, formação, foto, Lattes e ORCID. |
| Disciplinas e ensino | `data/disciplinas.yml` | Disciplinas, nível, código, docente, período e ementa. |
| Linha do tempo · Quem somos | `data/linha_tempo.yml` | Ano, título, descrição e imagem dos acontecimentos. |
| Galeria de fotos | `data/galeria.yml` | Arquivos de imagem, legendas e informações de recorte/foco. |
| Vídeos publicados | `data/videos.yml` | Títulos, datas, descrições e links de vídeos. |
| Sites recomendados | `data/sites.yml` | Nome, descrição e endereço de recursos externos. |
| Instituições parceiras | `data/apoio.yml` | Instituições de apoio, logotipos e links. |
| Parcerias registradas no CNPq | `data/parcerias.yml` | Instituições, siglas, UF, grupo de exibição, logos e sites. |

O arquivo `data/noar.yml` também existe no repositório e é usado pelo conteúdo relacionado ao GPENSC no Ar. Ele não aparece como uma das 15 coleções principais da configuração atual do painel próprio; confira a página e o fluxo correspondente antes de alterar sua estrutura.

### Configurações institucionais — 11 arquivos

| Seção no painel | Arquivo |
|---|---|
| 01 · Identidade | `data/configuracoes/01-identidade.yml` |
| 02 · Vínculos institucionais | `data/configuracoes/02-vinculos-institucionais.yml` |
| 03 · História, missão e objetivos | `data/configuracoes/03-institucional.yml` |
| 04 · Página inicial | `data/configuracoes/04-pagina-inicial.yml` |
| 05 · Página Quem somos | `data/configuracoes/05-quem-somos.yml` |
| 06 · Pesquisa, ensino e extensão | `data/configuracoes/06-pesquisa-extensao.yml` |
| 07 · Agenda | `data/configuracoes/07-agenda.yml` |
| 08 · Contato e redes | `data/configuracoes/09-contato-redes.yml` |
| 09 · Endereço | `data/configuracoes/10-endereco.yml` |
| 10 · Visibilidade das páginas | `data/configuracoes/11-visibilidade.yml` |
| 11 · Rodapé | `data/configuracoes/12-rodape.yml` |

Os números exibidos no menu são uma sequência editorial. Alguns nomes físicos de arquivos preservam numeração anterior; não renomeie arquivos sem atualizar todas as referências no painel e no código.

### Cuidados ao cadastrar conteúdos

- Prefira datas no formato ISO `AAAA-MM-DD`, por exemplo `2026-11-20`.
- Preencha o título e os campos obrigatórios indicados pelo painel.
- Use URLs completas, iniciadas por `https://`.
- Não altere o ID de uma linha de pesquisa depois que projetos ou publicações passarem a referenciá-la.
- Confira a correspondência entre os campos de `admin/config.yml`, os vetores `COLUNAS` em `R/helpers.R` e as funções das páginas.
- Otimize as imagens antes de enviá-las e use nomes de arquivo simples.
- Publique fotos, nomes, perfis e informações pessoais somente com autorização adequada.

---

## Agenda e destaque automático na página inicial

A seção da página inicial foi simplificada para reduzir repetição de texto. Ela utiliza o título **“Próximos eventos”**, mostra o evento futuro mais próximo e mantém um link para a agenda completa.

### Como cadastrar

1. Entre no painel e abra **Agenda e eventos**.
2. Adicione o evento e preencha data, tipo, título, local e link (os campos opcionais podem ficar vazios).
3. Salve o registro.
4. Aguarde o GitHub Actions concluir a publicação.

### Regra de seleção

A página inicial lê `data/eventos.yml`, remove registros de demonstração, considera somente eventos cuja data seja igual ou posterior à data atual, ordena por data crescente e apresenta o primeiro. Portanto:

- Se houver vários eventos futuros, aparece o que ocorrerá primeiro.
- Eventos passados não ocupam o destaque.
- Se não houver eventos futuros, a página inicial informa que não há atividades programadas no momento, mantendo o acesso à agenda completa.
- O destaque inclui data, tipo, título e local; o link “Mais informações” aparece quando o cadastro contém uma URL.

A página `agenda.qmd` continua apresentando os próximos eventos em ordem cronológica, registros sem data em uma seção própria e eventos passados em uma área recolhível. A atualização depende da compilação do site; não é uma consulta dinâmica a cada visita.

O arquivo `styles.css` controla o cartão e os ajustes responsivos dessa chamada. A inclusão está declarada em `_quarto.yml`.

---

## Painel de resumo e histórico

O painel administrativo mostra:

- quantidade de registros reais cadastrados;
- quantidade de integrantes;
- quantidade de projetos;
- total de notícias e eventos;
- gráfico de conteúdos por frente de atuação;
- gráfico de registros por tipo de conteúdo;
- histórico das adições mais recentes identificadas no repositório.

Os gráficos excluem registros reconhecidos como exemplos/demonstrações. O histórico consulta commits recentes do GitHub e tenta identificar novos itens pelas linhas adicionadas aos arquivos YAML.

**Limitação do histórico:** a quantidade de itens é estimada a partir dos trechos de diff fornecidos pelo GitHub. Alterações muito grandes, patches truncados ou reorganizações de listas podem fazer a contagem diferir do número exato de registros novos. Use o link do commit para conferir a alteração original.

---

## Estatísticas de acesso com Umami

O site foi preparado para receber estatísticas de navegação com **Umami Cloud**. O código de rastreamento já está inserido em `analytics.html`, incluído no cabeçalho das páginas pelo `_quarto.yml`.

O identificador público configurado é:

`1591f591-4f93-4697-8457-60c32ded8eac`

O trecho atualmente instalado é:

```html
<script defer src="https://cloud.umami.is/script.js" data-website-id="1591f591-4f93-4697-8457-60c32ded8eac"></script>
```

Esse identificador não é uma chave secreta. A coleta começa depois que a versão com o rastreador está publicada e recebe visitas; o Umami não recupera retroativamente acessos anteriores à instalação. A chegada dos eventos deve ser confirmada no painel da conta Umami.

### Estado atual da integração

| Parte | Estado |
|---|---|
| Script de rastreamento no site | Instalado e habilitado. |
| Website ID público | Configurado em `analytics.html` e `data/analytics.json`. |
| Cartão de estatísticas no painel próprio | Interface preparada. |
| Worker proxy da API Umami | Código versionado em `analytics-worker/worker.js`, mas precisa ser publicado no Cloudflare. |
| API URL no painel | Ainda vazia em `data/analytics.json`; por isso os números ainda não são carregados dentro do painel administrativo. |

Quando a API estiver conectada, o resumo poderá exibir visualizações de páginas, visitantes únicos, sessões, duração média, evolução diária, páginas mais acessadas e referências/origens, com períodos de 7, 30 e 90 dias.

### Ativar a integração da API no painel

Siga o procedimento atualizado em [analytics-worker/README.md](analytics-worker/README.md). Em resumo:

1. Publique `analytics-worker/worker.js` como um Worker separado, preferencialmente na conta Cloudflare administrada pelo GPENSC quando a infraestrutura institucional estiver pronta.
2. Cadastre no Cloudflare os segredos `UMAMI_API_KEY` e `UMAMI_WEBSITE_ID`.
3. Defina a variável `ALLOWED_ORIGIN` para a origem pública do site, atualmente `https://maiconcarlospng.github.io`.
4. Mantenha `UMAMI_API_BASE_URL` como `https://api.umami.is/v1`, salvo mudança documentada da API.
5. Depois de publicar, copie a URL base do Worker e informe-a em `apiUrl` no arquivo `data/analytics.json`, sem acrescentar `/summary`.
6. Preserve `enabled: true` e o Website ID já configurado.

O painel consulta a rota `GET /summary?days=7|30|90`. **Nunca** coloque a API key em `analytics.html`, `data/analytics.json`, JavaScript do painel ou no README. Ela deve existir somente como Secret no Cloudflare.

Para alterações de domínio ou portabilidade para o GPENSC, revise também o domínio cadastrado no Umami, o Website ID (se uma nova propriedade for criada) e a variável `ALLOWED_ORIGIN` do Worker.

---

## Mapa dos principais arquivos

| Caminho | Responsabilidade |
|---|---|
| `index.qmd` | Página inicial, apresentação, pesquisas, notícias e chamada da agenda. |
| `agenda.qmd` | Agenda completa, próximos eventos e anteriores. |
| Outros arquivos `*.qmd` | Páginas públicas: Quem somos, notícias, pesquisa, ensino, publicações, contato etc. |
| `R/helpers.R` | Leitura dos dados YAML e funções R reutilizadas. |
| `data/*.yml` | Registros e conteúdos públicos. |
| `data/configuracoes/*.yml` | Textos e controles institucionais editáveis. |
| `data/analytics.json` | Configuração pública do rastreador e URL do proxy; não guarda segredos. |
| `analytics.html` | Script de rastreamento Umami incluído no cabeçalho do site. |
| `analytics-worker/worker.js` | Proxy protegido para consultar a API do Umami. |
| `admin-access-worker/worker.js` | Validação do código de acesso, sessão temporária e proxy GitHub restrito. |
| `admin-access-worker/README.md` | Publicação do acesso por código e configuração segura dos Secrets. |
| `analytics-worker/wrangler.toml` | Configuração de publicação do Worker de estatísticas. |
| `admin/index.html` | Redireciona `/admin/` para o painel próprio. |
| `admin/app.html`, `admin/app.js`, `admin/app.css` | Painel principal personalizado. |
| `admin/cms.html` | Entrada alternativa do Sveltia CMS. |
| `admin/config.yml` | Backend, 15 coleções de conteúdo, 11 configurações e campos/widgets. |
| `admin/galeria-multipla.js` | Widget de galeria para o Sveltia. |
| `admin/excel-button.js`, `admin/planilhas.js` | Recursos relacionados a planilhas/importação e exportação. |
| `_quarto.yml` | Recursos, navegação, estilos, inclusão do rastreador e rodapé. |
| `_variables.yml` | Variáveis gerais legadas e compatibilidade. |
| `styles.css` | Folha principal consolidada do site, carregada diretamente pelo Quarto. |
| `custom.scss` | Paleta e tipografia do tema Quarto/Bootstrap. |
| `topo.html`, `lupa.html` | Elementos auxiliares do site. |
| `.github/workflows/publish.yml` | Validação, compilação e publicação. |
| `README.md` | Documentação de arquitetura, operação e migração. |
| `COMO-EDITAR.md` | Guia complementar de edição. |

A identidade visual do site está consolidada em `styles.css`. Não crie novos arquivos CSS com sufixos de versão: atualize as folhas existentes.

### Onde alterar cada parte

| Alteração desejada | Arquivos para consultar |
|---|---|
| Conteúdo de notícias, eventos, equipe etc. | Painel e YAML correspondente em `data/`. |
| Campos e coleções do CMS | `admin/config.yml`. |
| Formulários e funções do painel próprio | `admin/app.js` e `admin/app.css`. |
| Login do painel | `admin/app.js`, `admin/config.yml` e Worker OAuth. A entrada por código usa `admin-access-worker/`. |
| Como os dados são lidos ou apresentados | `R/helpers.R` e página `.qmd` relacionada. |
| Estrutura da página inicial | `index.qmd`. |
| Menu, recursos e rodapé | `_quarto.yml`. |
| Estilos da home e agenda | `styles.css`, `styles.css`. |
| Rastreamento e relatórios de acesso | `analytics.html`, `data/analytics.json`, `analytics-worker/`. |
| Compilação e publicação | `.github/workflows/publish.yml`. |

---

## Publicação, validação e GitHub Actions

O repositório possui um workflow principal: [Publicar site Quarto](.github/workflows/publish.yml).

### Como o workflow publica

1. **Validar painel e conteúdo:** verifica configuração, links, caminhos de arquivos, YAML, CSS e sintaxe de componentes JavaScript.
2. **Compilar todo o site:** recria os arquivos HTML, os dados de saída e o painel com Quarto/R, a partir do commit atual, sem reutilizar uma versão antiga de `_site` ou `_freeze`.
3. **Publicar:** envia o artefato recém-gerado ao GitHub Pages, se a validação e a compilação forem concluídas com sucesso.

A publicação sempre inclui as alterações do site e do painel no mesmo commit, inclusive quando apenas `admin/` mudou. Isso evita que uma execução anterior cancelada deixe páginas antigas publicadas. O workflow usa `concurrency` para priorizar a execução do commit mais recente.

**Não existe agendamento diário configurado.** A publicação é acionada por alterações relevantes na branch `main` ou manualmente em **Actions → Publicar site Quarto → Run workflow**.

### Configuração necessária no GitHub

No repositório atual, confirme:

- **Settings → Pages → Build and deployment → Source:** GitHub Actions.
- A branch principal utilizada pelo fluxo é `main`.
- Actions tem permissão para publicar no GitHub Pages.
- O ambiente `github-pages` está disponível.

### Sobre estilos e atualização

O Quarto recompila as páginas em toda publicação, portanto novas alterações em CSS, configurações e dados não devem depender de HTML armazenado em cache. Os arquivos relevantes ainda precisam constar em `on.push.paths` no workflow para disparar uma execução automática. O navegador pode manter CSS/JS em cache; após a publicação, recarregue a página caso veja uma versão antiga.

### Investigar uma falha

1. Abra [GitHub Actions](https://github.com/maiconcarlospng/Site-GPENSC-Teste/actions).
2. Escolha a execução correspondente ao último commit.
3. Confira o job **Validar painel e conteúdo** antes do job de compilação.
4. Abra o primeiro passo que falhou e leia a mensagem completa.
5. Corrija a causa, envie novo commit e confira a nova execução.

Um status verde de validação não significa, sozinho, que a publicação terminou: o job **Publicar no GitHub Pages** também precisa concluir com sucesso.

---

## Desenvolvimento local

### Requisitos

- Git;
- R;
- Quarto CLI;
- RStudio (opcional, recomendado);
- pacotes R utilizados pelo projeto.

Instale R em https://cran.r-project.org, RStudio em https://posit.co/download/rstudio-desktop e Quarto em https://quarto.org/docs/get-started/.

No console do R:

```r
install.packages(c(
  "readr", "dplyr", "htmltools", "DT", "plotly",
  "yaml", "knitr", "rmarkdown", "here", "purrr",
  "stringr", "lubridate"
))
```

### Clonar e visualizar

```bash
git clone https://github.com/maiconcarlospng/Site-GPENSC-Teste.git
cd Site-GPENSC-Teste
quarto preview
```

Para compilar sem iniciar a prévia:

```bash
quarto render
```

O resultado é gerado em `_site/`. Essa pasta é artefato de publicação; não edite os arquivos gerados como substitutos das fontes.

### Sincronizar trabalho local com o painel

Como o painel grava commits diretamente em `main`, atualize sua cópia antes de editar:

```bash
git pull --rebase
git status
```

Depois de alterar:

```bash
git add .
git commit -m "Descreva a alteração"
git pull --rebase
git push
```

Revise cuidadosamente `git status`. Não inclua tokens, chaves, segredos, arquivos temporários ou dados pessoais que não devam ser publicados.

---

## Cuidados de manutenção e segurança

- Não edite manualmente o HTML dentro de `_site/`; altere as fontes Quarto/R/CSS/YAML.
- Ao criar um campo no CMS, atualize `admin/config.yml`, a leitura correspondente em `R/helpers.R` e a apresentação da página.
- Ao adicionar um novo CSS ao `_quarto.yml`, adicione-o também ao filtro de caminhos e às chaves de cache do workflow, e à lista de CSS validada quando aplicável.
- Preserve os campos e a estrutura já usados pelos dados YAML.
- Não altere IDs de linhas de pesquisa já referenciados por projetos/publicações.
- Confira o comportamento de desktop e celular.
- Teste a galeria, upload de imagens, importação/exportação e formulários depois de alterações no painel.
- Não publique Client Secrets, API keys, tokens do GitHub ou credenciais do Cloudflare.
- O painel grava diretamente na branch `main`; combine permissões e revisão editorial antes de liberar o uso por uma equipe ampla.
- A publicação de fotos, nomes, Lattes, ORCID e demais dados pessoais depende das autorizações institucionais aplicáveis.

---

## Portabilidade futura para a conta do GPENSC

**A migração ainda não foi feita.** O repositório, os URLs e o Worker OAuth ainda usam a infraestrutura de desenvolvimento vinculada à conta pessoal. A portabilidade deve ser planejada com a coordenação do GPENSC e executada somente quando houver uma conta/organização institucional, responsáveis e permissões definidos.

### Destino definitivo e desligamento das contas de desenvolvimento

Ao concluir a migração, o GPENSC será responsável pela propriedade, recuperação de acesso, cobrança e operação de cada serviço. As contas pessoais de Maicon são a infraestrutura de origem. O grupo deverá conseguir editar uma notícia, importar um post, publicar o site, consultar as métricas e recuperar o acesso mesmo depois de Maicon sair das equipes.

| Serviço | O que fica sob controle do GPENSC | Como conferir a entrega |
|---|---|---|
| E-mail institucional | Caixa acompanhada pela coordenação para convites, recuperação, alertas de falhas e renovação. Guardar os códigos de recuperação no cofre do grupo. | Dois responsáveis designados conseguem acessar os avisos e localizar os meios de recuperação. |
| GitHub, Pages e Actions | Organização do grupo como proprietária, responsáveis com logins individuais, branches, histórico, imagens, permissões dos workflows e URL pública. | Um membro designado publica uma edição pelo painel e acompanha a execução em Actions. |
| Cloudflare e login do painel | Conta Cloudflare do grupo para os Workers de OAuth, acesso por código e métricas. OAuth App sob gestão do grupo, novos segredos de cliente e sessão, novo código de acesso e token GitHub emitido por uma identidade de serviço gerida pelo GPENSC. | Em janela privada, testar separadamente o login GitHub, o acesso por código e o editor Sveltia. Conferir a gravação no repositório definitivo. |
| Instagram e Apify | Coordenação com acesso e recuperação do perfil institucional. Workspace Apify, créditos, cobrança e token de coleta pertencentes ao grupo. Configurar o segredo `APIFY_TOKEN` no repositório de destino. | Executar **Sincronizar Instagram** no GitHub institucional. Conferir o log, depois a capa, o título, o resumo e a fonte do próximo post novo. A rotina roda pelo GitHub, independentemente da conta do ChatGPT usada no desenvolvimento. |
| Umami | Propriedade do site e chave de API administradas pelo grupo. Se o histórico precisar ser preservado, validar o acesso institucional à propriedade antiga antes de trocar o identificador. | Acessar o novo domínio e conferir a visita no Umami e o relatório no painel. |
| Spotify e UFOPCast | Para administrar o **GPENSC no Ar**, recuperar o programa com o responsável atual ou pelo suporte da plataforma e conceder acesso à equipe institucional. Registrar esse item como pendente até o grupo conseguir entrar. O UFOPCast é externo; o GPENSC mantém a seleção de episódios no site. | Testar o player público e os links. Separadamente, confirmar que um responsável do grupo consegue administrar o GPENSC no Ar. |
| Domínio e DNS, se houver | Titularidade, acesso ao registrador, contatos de renovação, cobrança, zona DNS e HTTPS sob responsabilidade institucional. | Abrir o endereço definitivo em janela privada e confirmar que os avisos de renovação chegam ao grupo. |

**Teste de saída de Maicon.** Registrem no cofre institucional os responsáveis e os identificadores dos serviços. No repositório, mantenham apenas os nomes das variáveis e os endereços públicos. Em uma sessão exclusiva da equipe, validem a publicação, o painel, as capas, a coleta e as métricas. Em seguida, removam os acessos pessoais substituídos, revoguem tokens antigos, troquem códigos compartilhados e retirem e-mail, telefone e forma de pagamento pessoais dos serviços migrados. No ciclo seguinte do agendamento, confiram em Actions que a coleta continua funcionando. Se um serviço ainda depende do antigo titular, registrem qual é, quem vai assumir e qual teste falta concluir.

### Roteiro de entrega ao e-mail e às contas do GPENSC

1. **Identidade e recuperação.** Definam o e-mail institucional que receberá convites, avisos de cobrança e recuperação. Criem a organização GitHub do grupo, convidem os responsáveis com contas individuais e confirmem o acesso de dois proprietários. Guardem os códigos de recuperação e as credenciais de serviço no cofre institucional.
2. **Repositório e acervo.** No repositório atual, abram **Settings → General → Danger Zone → Transfer ownership**, informem a organização e aceitem a transferência no destino quando solicitado. Confiram `main`, `render-published`, `inventario-instagram-2026-11`, tags e histórico. A branch de publicação contém capas históricas reaproveitadas pelo build. Se optarem por uma cópia, usem o procedimento alternativo abaixo.
3. **Endereço e publicação.** Ativem Actions e escolham **GitHub Actions** como origem em **Settings → Pages**. Confiram o ambiente `github-pages`, as permissões dos workflows e, se houver domínio próprio, DNS e HTTPS. Atualizem as referências da tabela abaixo. Executem **Publicar site Quarto → Run workflow** e abram home, agenda, notícias, arquivos de mídia e painel no novo endereço.
4. **Painel institucional.** Implantem os Workers na conta Cloudflare do grupo. No Worker de acesso por código, alterem também a constante `REPO` em `admin-access-worker/worker.js`, configurem a origem HTTPS e gerem os três segredos indicados abaixo. O token de serviço deve ter acesso ao repositório institucional e permissão de leitura e escrita de conteúdo. Atualizem `REPO`, `WORKER` e `ACCESS_WORKER` em `admin/app.js` e as URLs em `admin/config.yml`. Validem o login GitHub e o acesso por código, o envio de uma imagem e a publicação de um rascunho.
5. **Estatísticas e mídia.** Transfiram a administração da propriedade Umami ou cadastrem o novo domínio e configurem o Worker conforme as etapas abaixo. Verifiquem o player público do GPENSC no Ar, a lista curada do UFOPCast e os vídeos. A reprodução usa endereços públicos. A gestão editorial do podcast na plataforma exige acesso próprio ao programa; a transferência do site não concede esse acesso.
6. **Instagram.** Criem a conta Apify da equipe com o e-mail institucional, definam o responsável pelos créditos e adicionem um token dessa conta como `APIFY_TOKEN` no **repositório novo**. Sigam o teste manual da próxima seção. Se o histórico do scraper for necessário, exportem o dataset da conta anterior e arquivem a cópia com o grupo. Os registros e capas já incorporados ao site também estão no Git.
7. **Entrega.** Abram o painel com uma conta da equipe, publiquem uma alteração identificável e confiram o resultado no novo Pages. Registrem os responsáveis, endereços finais e onde renovar cada segredo. Depois da validação, revoguem os tokens pessoais substituídos e desativem agendamentos duplicados no repositório antigo, se existir.

### Novos posts do Instagram

O workflow **Sincronizar Instagram** consulta diariamente às **07h23 de Brasília** (10h23 UTC) as 50 publicações recentes de `@gpenscufop` via Apify. O horário de execução pode variar. Para cada código inédito, salva a capa original em WebP, acrescenta a notícia à coleção editável, classifica por assunto e solicita uma publicação do Quarto. O importador usa a legenda para identificar o tema, o nome do trabalho ou a pessoa envolvida e extrair um resumo complementar. Quando faltam detalhes, o log em **Actions → Sincronizar Instagram → Coletar publicações e capas** mostra um aviso com o link do post para cadastro manual em **Painel → Notícias**. Notícias cadastradas com a URL original são reconhecidas nas próximas coletas. O link da fonte conduz ao carrossel ou vídeo completo. A sincronização acrescenta posts novos e preserva as revisões do painel.

- Em **Settings → Secrets and variables → Actions → New repository secret**, criem `APIFY_TOKEN` com o token Apify do grupo. A integração do chat não fornece esse segredo ao GitHub.
- Em **Actions → Sincronizar Instagram → Run workflow**, executem o primeiro teste na `main`. O log informa quantos registros entraram. Zero é esperado quando a janela consultada já estiver no acervo. Com novidades, confirmem o commit e a execução de **Publicar site Quarto**. O consumo do scraper segue o plano Apify da equipe.
- Em caso de falha, consultem o log, o saldo Apify, a visibilidade do perfil e as regras de escrita da `main`. Corrijam a causa e repitam a execução. Após uma interrupção longa com mais de 50 posts, aumentem temporariamente `POST_LIMIT` no ambiente do passo de coleta para alcançar os posts do período.
- Para pausar a coleta, abram o workflow em Actions e escolham **Disable workflow**. As notícias já publicadas continuam disponíveis.

### Objetivo da portabilidade

Levar o código, o conteúdo, o histórico, a publicação, o painel e os serviços externos para contas sob controle institucional, encerrando a dependência das contas pessoais de desenvolvimento.

A migração não consiste apenas em trocar o nome do proprietário do GitHub. O site depende também de Pages, Actions, OAuth, Cloudflare e Umami. Cada integração precisa ser revisada e testada.

### Opção preferencial: transferir a propriedade do repositório

Se o GPENSC tiver uma organização GitHub ou uma conta institucional apropriada, a opção mais direta costuma ser transferir a propriedade do repositório existente, preservando o histórico Git. A transferência deve ser aceita pelo destino e respeitar as regras da organização.

Mesmo quando o histórico é preservado, **não presuma que Pages, URL pública, OAuth, permissões, Workers e estatísticas funcionarão sem atualização**.

### Alternativa: criar o repositório institucional e copiar o histórico

Se a transferência de propriedade não for apropriada:

1. Crie um repositório vazio na organização/conta do GPENSC.
2. Clone o repositório atual com o histórico.
3. Troque o remote para o repositório institucional.
4. Envie todas as branches e tags que precisem ser preservadas.
5. Mantenha o repositório atual disponível até validar a nova implantação.

Exemplo (substitua o destino pelo nome real definido pelo grupo):

```bash
git clone --bare https://github.com/maiconcarlospng/Site-GPENSC-Teste.git
cd Site-GPENSC-Teste.git
git remote rename origin prototipo
git remote add origin https://github.com/GPENSC/REPOSITORIO-DEFINITIVO.git
git push -u origin main
git push origin --all
git push origin --tags
```

Não use o nome fictício `GPENSC/REPOSITORIO-DEFINITIVO` literalmente: confirme primeiro o proprietário e o nome oficiais.

### Referências que precisam ser atualizadas

Após definir o novo endereço, faça uma busca no repositório por `maiconcarlospng`, `Site-GPENSC-Teste` e pelo domínio antigo. Revise pelo menos:

| Arquivo/serviço | Alteração necessária |
|---|---|
| `admin/app.js` | Atualizar a constante `REPO` para o novo proprietário/repositório; revisar o endereço do Worker OAuth. |
| `admin/config.yml` | Atualizar `backend.repo`, `site_url`, `display_url` e `backend.base_url`, mantendo as coleções e campos. |
| `_quarto.yml` | Atualizar o link administrativo do rodapé e quaisquer URLs absolutas para o site/repositório. |
| `admin/cms.html` | Atualizar preconnect e URL de configuração se o serviço OAuth ou o caminho mudarem. |
| `analytics.html` e `data/analytics.json` | Confirmar o Website ID e o domínio/site registrado no Umami. Se for criada outra propriedade, trocar o ID nos dois lugares. |
| `analytics-worker/wrangler.toml` | Atualizar `ALLOWED_ORIGIN` para a nova origem pública do site. |
| Cloudflare Worker de analytics | Atualizar a variável `ALLOWED_ORIGIN` e manter a API key do Umami como Secret. |
| Cloudflare Worker de OAuth | Recriar ou transferir o Worker para uma conta institucional, ajustar domínios permitidos e configurar novamente os segredos. |
| `admin-access-worker` | Migrar o Worker de acesso por código e recriar `GITHUB_TOKEN`, `ACCESS_CODE` e `SESSION_SECRET` como Secrets institucionais. |
| GitHub OAuth App | Atualizar Homepage URL e Authorization callback URL para os endereços definitivos; usar o callback exato do Worker implantado. |
| GitHub Pages e Actions | Habilitar Pages por GitHub Actions, conferir permissões e executar a primeira publicação completa. |
| Documentação | Atualizar links do README, `COMO-EDITAR.md` e demais guias. |

### Portar o login OAuth

O Worker OAuth atual usa o endereço pessoal `sveltia-cms-auth.maicon-carlos.workers.dev`. Para a versão institucional:

1. Defina quem administrará a conta Cloudflare institucional.
2. Publique o código/serviço OAuth escolhido dentro dessa conta ou transfira formalmente a gestão do Worker.
3. Configure os segredos de produção necessários, incluindo Client Secret, somente no Cloudflare.
4. Atualize o domínio permitido para o site novo.
5. Atualize o endereço do Worker em `admin/app.js` e `admin/config.yml`.
6. Atualize Homepage URL e callback URL da OAuth App do GitHub conforme o serviço implantado.
7. Teste login, logout, conta sem permissão, leitura, criação, edição, exclusão e upload de imagens.

Não presuma que o callback continuará igual se o Worker for recriado ou receber outro domínio. Copie a URL indicada pela configuração efetiva.

### Portar o Umami e os relatórios

- Defina se a propriedade Umami atual será mantida ou se o GPENSC criará uma propriedade própria.
- Se o domínio público mudar, atualize a configuração de domínio no Umami ou crie uma propriedade nova e use seu novo Website ID.
- Atualize o identificador público em `analytics.html` e `data/analytics.json`.
- Publique o Worker de analytics na conta Cloudflare institucional.
- Cadastre `UMAMI_API_KEY` e `UMAMI_WEBSITE_ID` como Secrets, nunca no repositório.
- Atualize `ALLOWED_ORIGIN` para o novo domínio.
- Informe a URL base do Worker em `apiUrl` dentro de `data/analytics.json`.
- Teste a coleta no Umami e os indicadores de 7, 30 e 90 dias dentro do painel administrativo.

As estatísticas históricas dependem da propriedade Umami escolhida e da continuidade da coleta. Não prometa migração automática de histórico entre propriedades diferentes.

### Ordem recomendada da migração

1. Aprovação institucional e definição de proprietários.
2. Transferência/cópia do repositório e preservação do histórico.
3. Configuração de Pages e Actions no novo repositório.
4. Atualização dos caminhos e URLs fixos no código.
5. Portabilidade do Worker OAuth e da OAuth App.
6. Portabilidade do Worker de analytics e validação do Umami.
7. Publicação do site e teste completo do painel.
8. Teste com pelo menos duas contas autorizadas, incluindo edição e upload.
9. Confirmação de que a equipe institucional tem acesso administrativo aos serviços.
10. Divulgação do endereço definitivo e arquivamento do protótipo somente depois da validação.

### Checklist de portabilidade

- [ ] Conta ou organização GitHub do GPENSC definida.
- [ ] Responsáveis institucionais e administradores definidos.
- [ ] Repositório transferido ou histórico copiado e conferido.
- [ ] Branch principal e permissões definidas.
- [ ] GitHub Pages configurado com Source = GitHub Actions.
- [ ] Primeira compilação completa concluída com sucesso.
- [ ] URLs e referências antigas revisadas.
- [ ] Worker OAuth sob gestão institucional.
- [ ] OAuth App e callback atualizados.
- [ ] Login, logout e permissões testados.
- [ ] Upload, galeria e edição de conteúdo testados.
- [ ] Umami e domínio revisados.
- [ ] Worker de analytics publicado e protegido por Secrets.
- [ ] Estatísticas verificadas no Umami e no painel próprio.
- [ ] README e guias atualizados com os endereços definitivos.
- [ ] Protótipo antigo mantido até a conclusão da validação.

---

## Checklist antes da institucionalização

- [ ] Substituir textos e registros de demonstração por conteúdo revisado.
- [ ] Conferir links, e-mail, redes sociais e endereço institucional.
- [ ] Confirmar autorização para fotos e informações pessoais.
- [ ] Revisar acessibilidade, contraste, navegação por teclado e textos alternativos.
- [ ] Testar todas as páginas e a navegação em celular e desktop.
- [ ] Testar o painel, autenticação, permissões e upload.
- [ ] Definir responsáveis por conteúdo, infraestrutura e recuperação de acesso.
- [ ] Definir domínio público definitivo.
- [ ] Concluir a portabilidade descrita acima antes de declarar a versão como institucional.

---

## Solução de problemas

| Problema | O que verificar |
|---|---|
| O site não atualiza após salvar | Execução mais recente do Actions, conclusão do deploy e cache do navegador (`Ctrl + F5`). |
| Actions falha na validação | Configuração em `admin/config.yml`, arquivos YAML, campos, caminhos e CSS. |
| Actions falha na compilação | Primeiro passo com erro no job **Compilar site (Quarto + R)**; confira logs do Quarto/R. |
| Login do painel não conclui | OAuth App, callback do Worker, domínio permitido e segredos de produção no Cloudflare. No acesso por código, confira também `ACCESS_CODE`, `SESSION_SECRET`, `GITHUB_TOKEN` e a URL do Worker. |
| Painel abre em branco | Console do navegador, carregamento de `app.js`/ `app.css`, cache e mensagens de rede. |
| Não é possível salvar | Conta GitHub autenticada, permissão de escrita no repositório, branch e resposta da API. |
| Galeria não salva ou não exibe imagens | Caminhos dos arquivos, upload, campos de recorte e estrutura de `data/galeria.yml`. |
| Importação de planilha falha | Cabeçalhos das colunas, campos obrigatórios, formatos e prévia de validação. |
| Próximo evento não aparece | Data no formato `AAAA-MM-DD`, data futura e publicação concluída. |
| Umami não mostra acessos | Rastreador publicado, Website ID, domínio da propriedade e visitas posteriores à instalação. |
| Estatísticas não aparecem no painel | Worker de analytics publicado, `apiUrl`, Secrets, `ALLOWED_ORIGIN` e API do Umami. |
| Uma página não aparece no menu | Navegação em `_quarto.yml` e controles de visibilidade nas configurações. |
| `git push` é rejeitado | Outra alteração pode ter sido gravada pelo painel; faça `git pull --rebase` e resolva conflitos. |

---

## Licença e uso

Este repositório foi desenvolvido como ambiente de trabalho para o GPENSC. Antes de definir uma licença pública ou permitir reutilização, o grupo deve decidir quem detém os direitos do código, dos textos, das fotografias, dos logotipos e dos demais materiais. A disponibilidade pública do repositório não significa que todas as imagens e marcas possam ser reutilizadas livremente.


## Fluxo editorial do portfólio

As sugestões do grupo sobre curadoria, atualização e divisão de responsabilidades estão organizadas em [ORGANIZACAO-EDITORIAL.md](ORGANIZACAO-EDITORIAL.md). Trata-se de uma proposta operacional, não de uma comissão já constituída.

A conferência requisito por requisito, incluindo os dados que ainda precisam ser aprovados pelo grupo, está em [CHECKLIST-DOCUMENTO-GPENSC.md](CHECKLIST-DOCUMENTO-GPENSC.md).

A Árvore do Conhecimento utiliza agora o explorador de ramificações em `js/arvore-explorador.js`, com foco parcial em vez de exibir a copa inteira. A página [Ciência para a sociedade](resultados.qmd) recebe apenas sínteses de publicações com fonte e revisão, cadastradas no painel.


### Organização institucional — novembro de 2026

O menu público reúne Sobre, Pesquisa, Extensão e formação, Conteúdos, Atualizações e Contato. As páginas consolidadas usam trechos em `partials/`, mantendo os mesmos dados e coleções do painel. URLs antigas redirecionam para a seção correspondente; edite os trechos, não as páginas de redirecionamento. A árvore mantém busca, teclado, arraste e zoom, com galhos SVG afilados e veios longitudinais. `styles.css` centraliza o acabamento compartilhado e as adaptações para telas pequenas.


## Minissite Vi no Rótulo

A página `vi-no-rotulo.qmd` atualmente redireciona para o projeto Vi no Rótulo na página de Extensão; o antigo CSS do minissite foi descontinuado. A área de publicações é editável no painel administrativo, em **Vi no Rótulo · Minissite**, salvando em `data/vi-no-rotulo.yml`. Os conteúdos não são importados automaticamente do Instagram: somente registros cadastrados e autorizados aparecem no site. O canal oficial permanece em https://www.instagram.com/vinorotulo/.
