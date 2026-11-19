<p align="center">
  <img src="img/logo_gpensc.png" alt="Marca institucional do GPENSC" width="120">
</p>

<h1 align="center">GPENSC · Site institucional</h1>

<p align="center">
  <strong>Grupo de Pesquisa e Ensino em Nutrição e Saúde Coletiva</strong><br>
  Escola de Nutrição · Universidade Federal de Ouro Preto
</p>

<p align="center">
  <a href="https://maiconcarlospng.github.io/Site-GPENSC-Teste/"><strong>Acessar o site</strong></a>
  &nbsp;·&nbsp;
  <a href="https://maiconcarlospng.github.io/Site-GPENSC-Teste/admin/"><strong>Abrir o painel</strong></a>
  &nbsp;·&nbsp;
  <a href="COMO-EDITAR.md"><strong>Manual de edição</strong></a>
</p>

<p align="center">
  <img alt="Quarto" src="https://img.shields.io/badge/Quarto-site-1F4D2B?style=flat-square">
  <img alt="R" src="https://img.shields.io/badge/R-componentes-5F9A3E?style=flat-square">
  <img alt="GitHub Pages" src="https://img.shields.io/badge/GitHub%20Pages-publica%C3%A7%C3%A3o-D9731F?style=flat-square">
</p>

> **Situação atual — protótipo em desenvolvimento.** O repositório permanece em `maiconcarlospng/Site-GPENSC-Teste`. **A portabilidade para uma conta ou organização institucional do GPENSC ainda não foi realizada.** O plano está documentado [mais abaixo](#portabilidade-futura-para-a-conta-do-gpensc), para execução somente após a coordenação definir os responsáveis e o endereço oficial.

## Visão geral

Este repositório contém o site do **GPENSC**, os dados públicos, os recursos visuais, os workflows de publicação e o painel de gestão de conteúdo. É um projeto estático desenvolvido com **Quarto, R, HTML, CSS/SCSS, JavaScript e YAML**, publicado pelo **GitHub Actions + GitHub Pages**.

O portal reúne informações institucionais e conteúdo de **pesquisa, extensão, ensino, divulgação científica, notícias e agenda**, além da Árvore do Conhecimento. O conteúdo é versionado no GitHub e pode ser atualizado pelo painel administrativo.

### Acessos principais

| Recurso | Endereço |
| --- | --- |
| Site de desenvolvimento | [Abrir site](https://maiconcarlospng.github.io/Site-GPENSC-Teste/) |
| Painel administrativo | [Abrir painel](https://maiconcarlospng.github.io/Site-GPENSC-Teste/admin/) |
| Editor Sveltia alternativo | [Abrir editor](https://maiconcarlospng.github.io/Site-GPENSC-Teste/admin/cms.html) |
| Publicação e validação | [GitHub Actions](https://github.com/maiconcarlospng/Site-GPENSC-Teste/actions) |
| Instruções para editar conteúdos | [COMO-EDITAR.md](COMO-EDITAR.md) |
| Plano de transferência para o GPENSC | [Portabilidade futura](#portabilidade-futura-para-a-conta-do-gpensc) |

### Parcerias

<div align="center">
  <a href="https://ufop.br/" title="Universidade Federal de Ouro Preto"><img src="img/ufop-logo.jpg" alt="UFOP" height="40"></a>
  &nbsp;&nbsp;&nbsp;
  <a href="https://enut.ufop.br/" title="Escola de Nutrição da UFOP"><img src="img/logo_nutricao.png" alt="Escola de Nutrição" height="40"></a>
  &nbsp;&nbsp;&nbsp;
  <a href="https://posnutricao.ufop.br/" title="Programa de Pós-Graduação em Saúde e Nutrição"><img src="img/logo_ppgsn.png" alt="PPGSN" height="40"></a>
</div>

<sub>As marcas são carregadas dos arquivos do próprio repositório, sem duplicações. Seus usos devem respeitar as orientações institucionais.</sub>

---

## Navegação desta documentação

- [Arquitetura e funcionamento](#arquitetura-e-funcionamento)
- [Mapa documentado das pastas e arquivos](docs/ESTRUTURA-DO-PROJETO.md)
- [Guia técnico dos scripts e arquivos de configuração](#guia-técnico-dos-scripts-e-arquivos-de-configuração)
- [Painel administrativo, login e permissões](#painel-administrativo)
- [Coleções e configurações](#coleções-e-configurações)
- [Agenda e destaque automático](#agenda-e-destaque-automático-na-página-inicial)
- [Painel de resumo e histórico](#painel-de-resumo-e-histórico)
- [Estatísticas com Umami](#estatísticas-de-acesso-com-umami)
- [Mapa dos principais arquivos](#mapa-dos-principais-arquivos)
- [Publicação e GitHub Actions](#publicação-validação-e-github-actions)
- [Desenvolvimento local](#desenvolvimento-local)
- [Manutenção e segurança](#cuidados-de-manutenção-e-segurança)
- **[Guia completo de portabilidade futura](#portabilidade-futura-para-a-conta-do-gpensc)**
- [Checklist antes da institucionalização](#checklist-antes-da-institucionalização)
- [Solução de problemas](#solução-de-problemas)
- [Licença e uso](#licença-e-uso)

---

## Organização dos arquivos e responsabilidades

A estrutura do projeto está descrita no [mapa técnico das pastas e extensões](docs/ESTRUTURA-DO-PROJETO.md). As pastas `R/`, `js/`, `data/` e `scripts/` possuem README próprio, com a função dos arquivos principais e os cuidados para manutenção. Nesta etapa conservadora, **os caminhos de produção não foram alterados**; reorganizações físicas futuras exigem auditoria de referências e validação antes da incorporação à branch principal.

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
| 02 · Parcerias | `data/configuracoes/02-vinculos-institucionais.yml` |
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

> **Plano para executar depois — não iniciado.** Nenhum repositório, domínio, token ou serviço foi transferido por esta documentação. Até a migração ser aprovada e testada, os links e a configuração de produção continuam apontando para a infraestrutura de desenvolvimento.

**Objetivo:** que o próprio GPENSC seja capaz de administrar o código, editar conteúdo, publicar o site, acessar o Instagram e as métricas, renovar serviços e recuperar contas **sem depender das credenciais pessoais utilizadas na criação do protótipo**.

### Cenários de renomeação e troca de domínio (sem migração imediata)

O endereço atual é provisório. A coordenação poderá escolher **uma ou mais** das opções abaixo, em momentos diferentes:

| Cenário | O que muda | O que deve ser conferido |
| --- | --- | --- |
| **Renomear somente o repositório** | `maiconcarlospng/Site-GPENSC-Teste` passa a ter outro nome, mas continua na mesma conta | URL do Pages, caminhos com o nome antigo, `REPO` no painel e no Worker, `backend.repo` no Sveltia, links externos e Actions |
| **Transferir para a conta/organização GPENSC** | Muda o proprietário GitHub; o repositório pode manter o nome ou ser renomeado depois | Permissões de colaboradores, Pages, Actions, tokens, OAuth, Workers, links, URLs e controle institucional dos serviços |
| **Usar domínio próprio** | O público acessa um endereço institucional escolhido posteriormente | DNS, domínio personalizado no Pages, HTTPS, `CNAME` quando aplicável, URLs públicas, origens autorizadas, links absolutos, Umami e OAuth |
| **Usar Pages da conta GPENSC** | O site pode usar `CONTA.github.io/REPOSITORIO/` ou `CONTA.github.io`, conforme o tipo de repositório | Caminho-base, URLs internas, links da galeria, imagens, scripts, páginas de idiomas e painel |

**Não confundir nome do repositório com domínio:** renomear o repositório não cria um domínio próprio. Um repositório comum no GitHub Pages normalmente usa `USUARIO.github.io/REPOSITORIO/`; o formato `USUARIO.github.io` é reservado ao repositório de site do usuário/organização com esse nome. Um domínio personalizado pode ser configurado separadamente.

O GitHub pode redirecionar URLs antigas de repositórios após renomeação ou transferência, mas **não se deve depender desses redirecionamentos para o site, o GitHub Pages, a API, o OAuth ou o painel**. Os endereços definitivos devem ser configurados e testados explicitamente. Se a mudança envolver a conta pessoal, também deve ser decidido quem será o proprietário institucional de cada serviço.

#### Checklist de referências antes de trocar o nome ou endereço

1. Pesquisar no repositório por `maiconcarlospng`, `Site-GPENSC-Teste`, `github.io`, `workers.dev`, `site_url`, `display_url`, `base_url`, `ALLOWED_ORIGIN`, `REPO` e URLs absolutas. **Não substituir cegamente**: distinguir endereço público, identificador GitHub, nome de Worker, identificador de analytics e exemplo histórico.
2. Revisar `_quarto.yml`, `_variables.yml`, páginas `.qmd`, scripts em `js/`, `admin/app.js`, `admin/config.yml`, `admin/cms.html`, os arquivos `wrangler.toml` e os Workers de autenticação, acesso e analytics.
3. Revisar `.github/workflows/`, Secrets e permissões do repositório; conferir também os endereços em `README.md` e `COMO-EDITAR.md`.
4. Configurar primeiro o novo endereço, autenticação e permissões; depois validar login GitHub, acesso por código, edição e publicação, galeria, árvore, navegação, imagens, idiomas, Instagram e métricas.
5. Atualizar links públicos e comunicar a mudança **somente depois dos testes**. Manter cópia de segurança e plano de retorno durante a transição.

**Importante:** o nome definitivo da conta, o nome do repositório e o domínio **ainda não foram definidos**. Não substituir as configurações atuais por nomes hipotéticos, nem desativar os serviços existentes antes de confirmar a alternativa escolhida.

### 1. Definir o destino e os responsáveis

Antes de mudar qualquer configuração:

1. A coordenação aprova a institucionalização do site e define quem responde pela administração técnica e editorial.
2. Definir um **e-mail de referência institucional**, acessível à coordenação, para convites, notificações, recuperação de conta e cobrança. Evitar depender de uma caixa pessoal.
3. Criar ou identificar a **organização GitHub** do grupo; confirmar o nome disponível. Usar contas individuais para os responsáveis, com **pelo menos dois administradores** e autenticação em dois fatores.
4. Definir se o endereço será um **GitHub Pages de projeto** (por exemplo, `ORGANIZACAO.github.io/NOME-DO-REPOSITORIO/`), um **site de organização** (que exige repositório específico para esse formato) ou um **domínio próprio**. Nenhum desses nomes de exemplo é um endereço já reservado.
5. Registrar proprietários e responsáveis por GitHub, Cloudflare, OAuth, Apify, Umami, domínio e acervos de mídia. Documentar também onde ficam as credenciais, os meios de recuperação e os custos recorrentes, **fora do repositório público**.

**Critério de conclusão:** pelo menos duas pessoas designadas conseguem administrar o conjunto essencial de serviços e recuperar os acessos sem o desenvolvedor original.

### 2. Fazer inventário e cópias de segurança

- Guardar um backup Git com todas as branches e tags relevantes, especialmente `main` (fontes, YAML e painel) e `render-published` (saída publicada e capas de publicações históricas). Conferir também as branches experimentais que a equipe deseja preservar.
- Conferir `data/`, `img/`, `admin/`, `.github/workflows/`, `R/`, `js/`, os arquivos `.qmd` e os guias antes de migrar. Imagens externas vinculadas ao Instagram podem expirar; revisar o acervo publicado e as capas arquivadas.
- Inventariar variáveis, segredos, URLs dos Workers, aplicativo OAuth, propriedade Umami e conta Apify **sem copiar valores de segredos para o Git**.
- Anotar o estado inicial: último commit da `main`, última publicação bem-sucedida, URL pública, acesso ao painel, coleta do Instagram e disponibilidade das métricas.
- Combinar um período de transição para evitar edições simultâneas no protótipo e no destino. Não excluir ou arquivar a origem antes dos testes.

### 3. Transferir o repositório (caminho preferencial)

Para manter o histórico e a identidade do projeto:

1. Na origem, abrir **Settings → General → Danger Zone → Transfer ownership**.
2. Escolher a **organização institucional confirmada** e seguir as validações exigidas pelo GitHub; o destino deve aceitar a transferência quando solicitado.
3. Conferir no destino a `main`, `render-published`, branches adicionais, tags, histórico, imagens e permissões dos colaboradores.
4. Revisar **Settings → Actions** e **Settings → Pages**, porque as permissões e a publicação podem exigir nova autorização após a transferência.

**Alternativa quando não for possível transferir:** criar um repositório vazio no destino e copiar o histórico. O exemplo abaixo deve ser adaptado aos nomes reais e executado por alguém com autorização de escrita:

```bash
git clone --bare https://github.com/maiconcarlospng/Site-GPENSC-Teste.git
cd Site-GPENSC-Teste.git
git remote add institucional https://github.com/ORGANIZACAO/REPOSITORIO.git
git push institucional --all
git push institucional --tags
```

O comando `--all` inclui as branches locais existentes nesse clone, inclusive `render-published` quando disponível. Validar as branches e os tags recebidos antes de prosseguir. Esse procedimento **não transfere** automaticamente segredos, administradores, GitHub Pages, Workers, domínio, configurações organizacionais ou outros serviços externos.

### 4. Preparar GitHub Actions, Pages e endereço definitivo

O repositório usa `.github/workflows/publish.yml` para validar, compilar Quarto/R, atualizar a branch `render-published` e publicar o artefato no GitHub Pages.

1. Em **Settings → Actions**, habilitar os workflows autorizados e garantir a permissão de gravação necessária para o workflow que atualiza `render-published`.
2. Em **Settings → Pages**, selecionar **GitHub Actions** como origem de publicação e verificar o ambiente `github-pages` e suas regras.
3. Executar manualmente **Actions → Publicar site Quarto → Run workflow** na `main`. Conferir os jobs de validação, compilação e implantação.
4. Abrir no endereço novo: home, páginas internas, agenda, Árvore do Conhecimento, galeria, arquivos de mídia, notícias, navegação de idiomas e `/admin/`. Verificar também no celular.
5. Se houver domínio próprio, registrar a titularidade institucional e configurar DNS, domínio personalizado em Pages, certificado HTTPS e, quando aplicável, o arquivo `CNAME` na saída publicada. Não pressupor que a URL antiga continuará válida sem redirecionamentos.
6. Atualizar a comunicação externa e links internos **apenas depois** de o endereço definitivo estar funcionando.

**Atenção ao caminho:** mudar de `USUARIO.github.io/REPOSITORIO/` para um domínio raiz ou outro nome de repositório pode alterar caminhos absolutos de imagens, scripts e links. Testar essas referências na instalação final.

### 5. Reconfigurar o painel e os dois modos de login

O painel próprio está em `admin/app.html` e `admin/app.js`; o editor Sveltia alternativo está em `admin/cms.html`. Na configuração atual o painel grava na branch `main`. **A transferência GitHub não migra automaticamente os serviços de autenticação da Cloudflare.**

**Login individual com GitHub (OAuth):**

1. Colocar o aplicativo GitHub OAuth e o **Worker de autenticação** sob responsabilidade institucional (criar novos, se necessário, ou transferir formalmente a gestão quando possível).
2. Configurar na Cloudflare os segredos exigidos pelo Worker, como `GITHUB_CLIENT_ID` e `GITHUB_CLIENT_SECRET`, e as origens/domínios permitidos. O callback deve corresponder **exatamente** à URL do Worker efetivamente publicado.
3. Atualizar `WORKER` em `admin/app.js`, `backend.base_url` em `admin/config.yml` e a referência ao serviço em `admin/cms.html`. Atualizar também as URLs permitidas no OAuth App.
4. Conceder permissões de escrita no repositório de destino apenas às contas editoras autorizadas. Validar login, logout, conta sem acesso, leitura, edição e upload.

**Entrada por código compartilhado:**

1. Publicar `admin-access-worker/worker.js` na conta Cloudflare do grupo (consulte [o guia desse Worker](admin-access-worker/README.md)).
2. Atualizar o `REPO` em `admin-access-worker/worker.js` e o `ALLOWED_ORIGIN` em `admin-access-worker/wrangler.toml` para a **origem exata** do novo site, sem caminho.
3. Configurar na Cloudflare, como **Secrets**, `GITHUB_TOKEN` (token restrito ao repositório institucional, com permissão de conteúdo necessária), `ACCESS_CODE` e `SESSION_SECRET`. Gerar valores novos e limitar as permissões; não copiar segredos pessoais de desenvolvimento.
4. Atualizar `ACCESS_WORKER` em `admin/app.js`. Testar o código em janela privada, a criação de sessão, a gravação de dados e a revogação do código antigo.
5. Aplicar controle de tentativas no endpoint de login. O código é compartilhado: ele **não identifica individualmente** quem editou um registro; para rastreabilidade, preferir acessos GitHub individuais.

**Em ambos os modos:** atualizar `REPO` em `admin/app.js`, `backend.repo`, `site_url` e `display_url` em `admin/config.yml`. Preservar a estrutura das coleções YAML. Não liberar edição geral antes de testar permissões, erros de concorrência, importação de planilhas e publicação.

### 6. Migrar coleta do Instagram e Apify

O workflow `.github/workflows/instagram.yml` executa **Sincronizar Instagram**, atualmente agendado para `10:23 UTC` (07h23 em Brasília), além da execução manual. O importador `scripts/importar-instagram.py` consulta o perfil `@gpenscufop` pelo Apify, registra notícias e links de mídia; a rotina de publicação pode arquivar capas históricas na saída publicada.

1. Criar um workspace/conta Apify controlado pelo GPENSC e definir o responsável por créditos, custos e recuperação.
2. Cadastrar o token do Apify institucional como Secret **`APIFY_TOKEN`** em **Settings → Secrets and variables → Actions** do repositório definitivo.
3. Executar manualmente **Sincronizar Instagram → Run workflow** na `main`. Conferir logs, alterações em `data/noticias.yml` e `data/instagram/carrosseis-recentes.json`, links originais, capas e publicação.
4. Conferir o acervo anterior, inclusive o que depende de mídias externas; se necessário, salvar uma cópia dos datasets relevantes mantidos na antiga conta Apify.
5. Evitar **dois agendamentos em paralelo**: após validar o workflow institucional, desativar o agendamento do protótipo antigo. Rever o consumo de créditos e a janela de coleta (`POST_LIMIT`, normalmente 50).
6. No primeiro ciclo automático seguinte, confirmar que a rotina continua funcionando sem a conta de desenvolvimento.

A conexão Apify usada no ChatGPT não substitui o Secret do GitHub Actions; as duas integrações são independentes.

### 7. Migrar Umami, Workers de métricas e mídias externas

**Umami e estatísticas:**

1. Definir com a coordenação se a propriedade Umami atual será administrada pelo grupo ou se será criada outra. **O histórico não é transferido automaticamente entre propriedades diferentes.**
2. Conferir o domínio no Umami e atualizar o Website ID em `analytics.html` e `data/analytics.json` **somente se houver mudança de propriedade**.
3. Publicar `analytics-worker/worker.js` na Cloudflare institucional, com `ALLOWED_ORIGIN` atualizado no `analytics-worker/wrangler.toml`.
4. Cadastrar `UMAMI_API_KEY` e `UMAMI_WEBSITE_ID` como Secrets do Worker, ajustar a URL em `apiUrl` de `data/analytics.json` e testar as estatísticas públicas e os períodos de 7, 30 e 90 dias no painel. Ver [guia de analytics](analytics-worker/README.md).

**Outras integrações e conteúdos:**

- Conferir logotipos, imagens e direitos de uso, links Lattes, redes sociais, vídeos e mídias externas; arquivos no Git não concedem direitos sobre conteúdos de terceiros.
- Se o grupo assumir a administração de canais como **GPENSC no Ar**, Spotify e serviços de podcasts, a equipe precisa receber acesso editorial **nessas plataformas**. O repositório guarda apenas a integração pública.
- Se adotar domínio próprio, confirmar o titular, a renovação, os registros DNS e o acesso ao registrador em nome da equipe institucional.

### 8. Arquivos e configurações que exigem revisão

Após conhecer o destino definitivo, buscar no código por `maiconcarlospng`, `Site-GPENSC-Teste`, `maicon-carlos.workers.dev`, pela URL antiga do Pages e por caminhos absolutos. Conferir pelo menos:

| Local | Revisar na migração |
| --- | --- |
| `admin/app.js` | `REPO`, `WORKER` e `ACCESS_WORKER` |
| `admin/config.yml` | `backend.repo`, `backend.base_url`, `site_url`, `display_url` |
| `admin/cms.html` | Preconnect e referência do editor ao Worker OAuth |
| `admin-access-worker/worker.js` e `wrangler.toml` | `REPO`, `ALLOWED_ORIGIN` e Secrets na Cloudflare |
| `analytics-worker/wrangler.toml` e configuração do Worker | Origem, API Umami e Secrets |
| `analytics.html` e `data/analytics.json` | Website ID, domínio e URL da API quando necessário |
| `_quarto.yml`, arquivos `.qmd`, `js/` e estilos | Links absolutos e caminhos afetados pelo novo endereço |
| `.github/workflows/publish.yml` | Permissões, publicação, `render-published` e GitHub Pages |
| `.github/workflows/instagram.yml` e `scripts/importar-instagram.py` | Secret do Apify, rotina e destino de commits |
| `README.md`, `COMO-EDITAR.md` e demais guias | URLs, nomes, responsáveis e instruções definitivas |

### 9. Testes de aceite e desativação da infraestrutura pessoal

A migração estará concluída **apenas depois** de a equipe testar, usando suas próprias contas:

- [ ] A organização institucional tem pelo menos dois administradores e recuperação configurada.
- [ ] O histórico Git, `main`, `render-published`, tags e imagens foram preservados.
- [ ] O novo Pages publica por Actions sem erros; links, idiomas e mídia funcionam no celular e no computador.
- [ ] O login GitHub individual e o acesso por código funcionam, com permissões apropriadas.
- [ ] É possível criar, editar e excluir um registro de teste, enviar imagem e publicar a alteração.
- [ ] O GitHub Actions confirma a atualização no endereço definitivo.
- [ ] O Apify executa a coleta manual e automática com a conta institucional.
- [ ] Umami recebe visitas e o painel consulta métricas sem expor a API key.
- [ ] As credenciais, recuperação, pagamentos e renovações estão sob responsabilidade institucional.
- [ ] README e guias mostram endereços e responsáveis oficiais, não placeholders.
- [ ] Foram revogados os tokens e códigos antigos, removidos acessos pessoais desnecessários e desligados workflows duplicados, **somente depois dos testes**.
- [ ] O repositório antigo foi arquivado ou mantido apenas como histórico, conforme decisão da coordenação.

**Teste final de independência:** alguém da coordenação entra no painel, publica uma alteração, acompanha o deploy, consulta as métricas e confirma a coleta automática **sem utilizar nenhuma conta, token ou código pessoal do desenvolvimento**. Se algum passo falhar, registrar a pendência e manter a infraestrutura de origem disponível até corrigir.

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

## Guia técnico dos scripts e arquivos de configuração

Esta seção explica **como o código-fonte se transforma no site publicado** e distingue configuração, dados, apresentação e automação. Ela complementa o [manual de edição](COMO-EDITAR.md): quem apenas cadastra conteúdo deve usar o painel; quem altera estrutura ou comportamento precisa entender os arquivos abaixo.

### O que é cada extensão?

| Extensão | Papel no GPENSC | Exemplo |
| --- | --- | --- |
| `.yml` / `.yaml` | Configuração ou dados estruturados, com chaves, listas e indentação | `_quarto.yml`, `data/equipe.yml` |
| `.qmd` | Página-fonte do Quarto, combinando texto, HTML e blocos executáveis | `pesquisa.qmd` |
| `.R` | Funções que leem dados e geram trechos de conteúdo na compilação | `R/helpers.R` |
| `.js` | Comportamento interativo no navegador ou scripts executados com Node | `js/arvore.js`, `admin/app.js` |
| `.css` / `.scss` | Estilos, cores, espaçamento e responsividade | `styles.css`, `custom.scss` |
| `.html` | Estruturas e entradas do painel, além de componentes HTML | `admin/app.html` |
| `.py` | Validação, auditoria, inventário e processamento de conteúdo | `admin/validar-painel.py` |
| `.md` | Documentação em Markdown | `README.md` |

### YAML: configuração não é a mesma coisa que conteúdo

**1. `_quarto.yml` — configuração central do site.** Define `project.type: website`, quais páginas `.qmd` são renderizadas, recursos copiados para o resultado (como `img/**`, `js/**`, `admin/**` e `data/**`), idioma, título, favicon e navegação. Mudar um caminho ou nome de página aqui exige conferir a existência do arquivo correspondente. Os caminhos do menu podem apontar para arquivos `.qmd`; o Quarto converte esses destinos para HTML durante a publicação.

**2. `_variables.yml` — variáveis reutilizáveis.** Centraliza valores que podem ser referenciados nas páginas Quarto, evitando repetir textos fixos. Antes de mudar uma chave, procure onde ela é utilizada.

**3. `data/*.yml` — conteúdo editorial.** Arquivos como `data/noticias.yml`, `data/eventos.yml`, `data/linhas.yml`, `data/projetos.yml` e `data/equipe.yml` armazenam registros que as páginas leem durante a compilação. Alterar um registro não significa alterar o layout.

**4. `data/configuracoes/*.yml` — preferências institucionais.** Guardam textos e opções das seções, como identidade, parcerias, página inicial, agenda, contato e rodapé. O nome do arquivo não é necessariamente o rótulo exibido no painel.

**5. `admin/config.yml` — esquema do Sveltia CMS.** Descreve coleções, campos, tipos de entrada, validações e relações do editor alternativo. Ele **não substitui** o código do painel próprio em `admin/app.js`. Ao criar um campo, confira também o formulário do painel principal, os leitores R e as páginas que o utilizam.

**6. `.github/workflows/publish.yml` — automação do GitHub Actions.** Apesar de também ser YAML, não é um arquivo de conteúdo: define quando e como validar, compilar e publicar o projeto.

Exemplo didático de YAML (não substituir diretamente um arquivo real por este exemplo):

```yaml
itens:
  - id: exemplo-01
    titulo: "Título de exemplo"
    ativo: true
    palavras_chave:
      - nutricao
      - saude-coletiva
```

A indentação define a hierarquia; `-` inicia um item de lista; valores entre aspas são textos; `true` é booleano. Use espaços, não tabulações. **Os nomes dos campos precisam seguir o esquema do arquivo real**: esse exemplo apenas demonstra a sintaxe.

### Como o código cria uma página

```text
_quarto.yml ───────────────┐
_variables.yml ────────────┤
páginas *.qmd ─────────────┤
data/*.yml ──> funções R ──┼──> quarto render ──> _site/
CSS / SCSS / JS / imagens ─┘                        │
                                                    └──> GitHub Pages
```

As páginas `.qmd` definem o conteúdo e invocam, quando necessário, funções de `R/` para transformar os registros YAML em componentes. O Quarto renderiza o conjunto para HTML e incorpora ou copia os recursos estáticos. O diretório `_site/` é **resultado gerado**, não a fonte preferencial para alterações permanentes. JavaScript de interações como a árvore, as galerias e o painel é executado no navegador; R não precisa ficar rodando no servidor público.

### O que acontece ao clicar em Publicar no painel?

1. O painel próprio (`admin/app.html`, `admin/app.js` e `admin/app.css`) prepara e grava mudanças no repositório GitHub, após autenticação e autorização.
2. Um commit em `main` que altera caminhos monitorados inicia o workflow `.github/workflows/publish.yml`; também existe execução manual (`workflow_dispatch`).
3. A etapa **validate-panel** gera o inventário de materiais e executa verificações em Python e Node, incluindo YAML, referências, arquivos estáticos e rotinas do Instagram.
4. A etapa **build** decide entre atualização rápida de CSS/JS estáticos e compilação completa. Na compilação completa, instala Quarto e dependências R, prepara as imagens e executa `quarto render`.
5. O resultado de `_site/` é sincronizado na branch `render-published`, enviado como artefato e implantado no **GitHub Pages** pela etapa **deploy**.
6. Se a validação ou a compilação falhar, a nova versão não deve ser considerada publicada. Consulte a aba **Actions** para identificar o erro.

O workflow monitora os caminhos indicados no próprio `on.push.paths`. **Alterar apenas o README não está entre os gatilhos listados atualmente**, portanto uma atualização de documentação não implica reconstrução automática do site.

### Outros scripts e integrações

| Caminho | Responsabilidade |
| --- | --- |
| `R/helpers.R` | Funções e estruturas auxiliares usadas na geração de conteúdo |
| `js/arvore.js` e `js/arvore-interativa.js` | Interação e apresentação da Árvore do Conhecimento |
| `js/galeria-home.js` e `js/galeria-sobre.js` | Galerias independentes da home e da página institucional |
| `admin/app.js` | Interface, leitura, edição e publicação pelo painel próprio |
| `admin/config.yml` | Campos e coleções do editor Sveltia |
| `admin/validar-painel.py` | Validação da configuração e dos arquivos do painel |
| `admin/auditar-site.py` | Auditoria de links, páginas e recursos |
| `scripts/gerar-inventario-materiais.py` | Inventário de referências aos materiais do site |
| `admin/validar-acervo-instagram.py` | Verificação de integridade do acervo Instagram |
| `admin/arquivar-capas-instagram.py` | Preparação das capas das publicações importadas |
| `admin-access-worker/worker.js` | Serviço Cloudflare para acesso por código e operações autorizadas |
| `analytics-worker/worker.js` | Código do serviço de consulta de analytics, sujeito à configuração/deploy do Worker |

Os Workers são serviços externos: publicar o Quarto no GitHub Pages **não configura automaticamente** os Secrets, rotas, permissões ou deploys do Cloudflare. O mesmo vale para a conta do Umami e para o OAuth do GitHub. Na transferência para o GPENSC, revise todas as URLs, contas, credenciais e variáveis de ambiente seguindo o guia de portabilidade.

### Onde alterar cada coisa, sem quebrar o site?

- **Texto, notícia, equipe, evento ou projeto:** preferencialmente pelo painel; os dados ficam em `data/`.
- **Campos disponíveis no editor:** revise `admin/config.yml` e a implementação do painel próprio.
- **Menu, páginas, favicon ou recursos incluídos:** `_quarto.yml` e páginas `.qmd`.
- **Cores, tipografia e responsividade:** CSS/SCSS; verifique a ordem de carregamento antes de criar outra regra.
- **Galeria, árvore ou comportamento interativo:** arquivos JavaScript correspondentes, preservando a estrutura de dados e os controles de acessibilidade.
- **Publicação e validação:** `.github/workflows/publish.yml`; teste antes de mudar permissões ou etapas.

Para uma mudança estrutural, faça um commit isolado, confira as validações em **Actions**, abra o site em desktop e celular e verifique se a edição pelo painel continua funcionando. Nunca publique tokens, Client Secrets, códigos de acesso ou credenciais em arquivos versionados.

---

## Licença e uso

Este repositório foi desenvolvido como ambiente de trabalho para o GPENSC. Antes de definir uma licença pública ou permitir reutilização, o grupo deve decidir quem detém os direitos do código, dos textos, das fotografias, dos logotipos e dos demais materiais. A disponibilidade pública do repositório não significa que todas as imagens e marcas possam ser reutilizadas livremente.


## Fluxo editorial do portfólio

As sugestões do grupo sobre curadoria, atualização e divisão de responsabilidades estão organizadas em [ORGANIZACAO-EDITORIAL.md](ORGANIZACAO-EDITORIAL.md). Trata-se de uma proposta operacional, não de uma comissão já constituída.

A conferência requisito por requisito, incluindo os dados que ainda precisam ser aprovados pelo grupo, está em [CHECKLIST-DOCUMENTO-GPENSC.md](CHECKLIST-DOCUMENTO-GPENSC.md).

A Árvore do Conhecimento utiliza agora o explorador de ramificações em `js/arvore-explorador.js`, com foco parcial em vez de exibir a copa inteira. A página [Ciência para a sociedade](resultados.qmd) recebe apenas sínteses de publicações com fonte e revisão, cadastradas no painel.


### Organização atual do menu

O menu definido em `_quarto.yml` apresenta **O GPENSC**, **Pesquisa**, **Extensão**, **Ensino**, **Divulgação**, **Notícias**, **Agenda** e **Contato**. As páginas e coleções editáveis devem ser conferidas nessa configuração ao mudar a estrutura de navegação. A Árvore do Conhecimento possui navegação interativa própria.

## Minissite Vi no Rótulo

A página `vi-no-rotulo.qmd` atualmente redireciona para o projeto Vi no Rótulo na página de Extensão; o antigo CSS do minissite foi descontinuado. A área de publicações é editável no painel administrativo, em **Vi no Rótulo · Minissite**, salvando em `data/vi-no-rotulo.yml`. Os conteúdos não são importados automaticamente do Instagram: somente registros cadastrados e autorizados aparecem no site. O canal oficial permanece em https://www.instagram.com/vinorotulo/.
