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
  2. escolhe o caminho rápido do painel ou a compilação Quarto/R
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
| **Umami** | Recebe os eventos de navegação do site e fornece estatísticas de acesso. |
| **Cloudflare Worker de analytics** | Proxy planejado para consultar a API do Umami sem expor a chave no navegador. |
| **GitHub Actions** | Valida, compila e publica o site. |
| **GitHub Pages** | Hospeda a versão estática publicada. |

**Regra importante:** salvar no painel não altera diretamente o HTML já publicado. O painel cria um commit no repositório. A mudança pública só aparece depois que a execução do GitHub Actions publicar com sucesso.

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
- Se não houver eventos futuros, a home mostra uma mensagem de ausência de atividades futuras.
- O destaque inclui data, tipo, título e local; o link “Mais informações” aparece quando o cadastro contém uma URL.

A página `agenda.qmd` continua apresentando os próximos eventos em ordem cronológica, registros sem data em uma seção própria e eventos passados em uma área recolhível. A atualização depende da compilação do site; não é uma consulta dinâmica a cada visita.

O arquivo `styles-agenda-v18.css` controla o cartão e os ajustes responsivos dessa chamada. A inclusão está declarada em `_quarto.yml`.

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
| `analytics-worker/wrangler.toml` | Configuração de publicação do Worker de estatísticas. |
| `admin/index.html` | Redireciona `/admin/` para o painel próprio. |
| `admin/app.html`, `admin/app.js`, `admin/app.css` | Painel principal personalizado. |
| `admin/cms.html` | Entrada alternativa do Sveltia CMS. |
| `admin/config.yml` | Backend, 15 coleções de conteúdo, 11 configurações e campos/widgets. |
| `admin/galeria-multipla.js` | Widget de galeria para o Sveltia. |
| `admin/excel-button.js`, `admin/planilhas.js` | Recursos relacionados a planilhas/importação e exportação. |
| `_quarto.yml` | Recursos, navegação, estilos, inclusão do rastreador e rodapé. |
| `_variables.yml` | Variáveis gerais legadas e compatibilidade. |
| `styles.css`, `styles-*.css`, `custom.scss` | Estilo geral, responsividade e identidade visual. |
| `topo.html`, `lupa.html` | Elementos auxiliares do site. |
| `.github/workflows/publish.yml` | Validação, compilação e publicação. |
| `README.md` | Documentação de arquitetura, operação e migração. |
| `COMO-EDITAR.md` | Guia complementar de edição. |

### Onde alterar cada parte

| Alteração desejada | Arquivos para consultar |
|---|---|
| Conteúdo de notícias, eventos, equipe etc. | Painel e YAML correspondente em `data/`. |
| Campos e coleções do CMS | `admin/config.yml`. |
| Formulários e funções do painel próprio | `admin/app.js` e `admin/app.css`. |
| Login do painel | `admin/app.js`, `admin/config.yml` e configuração do Worker OAuth. |
| Como os dados são lidos ou apresentados | `R/helpers.R` e página `.qmd` relacionada. |
| Estrutura da página inicial | `index.qmd`. |
| Menu, recursos e rodapé | `_quarto.yml`. |
| Estilos da home e agenda | `styles-home-v17.css`, `styles-agenda-v18.css`. |
| Rastreamento e relatórios de acesso | `analytics.html`, `data/analytics.json`, `analytics-worker/`. |
| Compilação e publicação | `.github/workflows/publish.yml`. |

---

## Publicação, validação e GitHub Actions

O repositório possui um workflow principal: [Publicar site Quarto](.github/workflows/publish.yml).

### Como o workflow decide o que fazer

1. **Identificar a alteração:** compara os arquivos modificados.
2. **Validar painel e conteúdo:** verifica configuração do Sveltia, caminhos de arquivos, YAML, campos, regras de conteúdo e CSS selecionados; também verifica a sintaxe do widget de galeria.
3. **Alterações só em `admin/`:** usa o caminho rápido, restaura o último site compilado e substitui somente os arquivos do painel. Essa etapa não precisa reinstalar R nem recompilar o Quarto.
4. **Alterações em páginas, R, dados, imagens, estilos ou Quarto:** executa o caminho de compilação do site. O workflow pode renderizar apenas páginas mapeadas para determinados YAML; alterações não mapeadas ou estruturais exigem renderização completa.
5. **Publicar:** envia o artefato para o GitHub Pages.

O workflow usa cache para acelerar o processo e `concurrency` para cancelar uma publicação anterior quando uma nova alteração chega. O resultado que interessa é a execução correspondente ao commit mais recente.

**Não existe agendamento diário configurado.** A publicação é acionada por alterações relevantes na branch `main` ou manualmente em **Actions → Publicar site Quarto → Run workflow**.

### Configuração necessária no GitHub

No repositório atual, confirme:

- **Settings → Pages → Build and deployment → Source:** GitHub Actions.
- A branch principal utilizada pelo fluxo é `main`.
- Actions tem permissão para publicar no GitHub Pages.
- O ambiente `github-pages` está disponível.

### Sobre o cache e os estilos

Os arquivos CSS carregados em `_quarto.yml` também precisam constar nos filtros de caminhos e nas chaves de cache de `.github/workflows/publish.yml`. Os estilos mais recentes da home e agenda (`styles-home-v17.css` e `styles-agenda-v18.css`) foram adicionados a essa lista para que futuras alterações sejam detectadas e recompiladas.

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

### Objetivo da portabilidade

Levar o código, o conteúdo, o histórico, a publicação, o painel e os serviços externos para contas sob controle institucional, reduzindo a dependência da conta pessoal de desenvolvimento.

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
git clone https://github.com/maiconcarlospng/Site-GPENSC-Teste.git
cd Site-GPENSC-Teste
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
| Login do painel não conclui | OAuth App, callback do Worker, domínio permitido e segredos de produção no Cloudflare. |
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
