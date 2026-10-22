# GPENSC — Site institucional (protótipo)

> **Status:** protótipo desenvolvido para o Grupo de Pesquisa e Ensino em Nutrição e Saúde Coletiva (GPENSC), da Universidade Federal de Ouro Preto (UFOP). O site ainda precisa ser revisado e aprovado pelo grupo antes de ser considerado a versão institucional definitiva.

O projeto é um site responsivo construído com **Quarto, R, HTML, CSS/SCSS e YAML**. O conteúdo é armazenado em arquivos versionados no GitHub; o site é renderizado e publicado pelo **GitHub Actions + GitHub Pages**. O painel administrativo usa **Sveltia CMS**.

- **Site de demonstração:** https://maiconcarlospng.github.io/Site-GPENSC-Teste/
- **Painel administrativo:** https://maiconcarlospng.github.io/Site-GPENSC-Teste/admin/
- **Repositório:** https://github.com/maiconcarlospng/Site-GPENSC-Teste
- **Guia de edição:** [COMO-EDITAR.md](COMO-EDITAR.md)
- **Publicação e histórico dos builds:** [GitHub Actions](https://github.com/maiconcarlospng/Site-GPENSC-Teste/actions)

---

## Índice

1. [Como o projeto funciona](#como-o-projeto-funciona)
2. [Editar o conteúdo pelo painel](#editar-o-conteúdo-pelo-painel)
3. [Mapa do repositório](#mapa-do-repositório)
4. [Onde alterar cada parte do site](#onde-alterar-cada-parte-do-site)
5. [Publicação e workflows](#publicação-e-workflows)
6. [Executar localmente](#executar-localmente)
7. [Alterar código e dados com segurança](#alterar-código-e-dados-com-segurança)
8. [Transferir o projeto para o GitHub do GPENSC](#transferir-o-projeto-para-o-github-do-gpensc)
9. [Configurar novamente o painel Sveltia CMS](#configurar-novamente-o-painel-sveltia-cms)
10. [Antes de transformar o protótipo em site oficial](#antes-de-transformar-o-protótipo-em-site-oficial)
11. [Problemas frequentes](#problemas-frequentes)

---

## Como o projeto funciona

O site publicado é gerado a partir dos arquivos-fonte deste repositório. Em geral, não se edita diretamente o HTML gerado.

```text
Pessoa autorizada edita o conteúdo no /admin/
                  |
                  v
       Sveltia CMS grava no GitHub
       dados/*.yml e arquivos de img/
                  |
                  v
       GitHub Actions executa publish.yml
       prepara R e Quarto e renderiza o site
                  |
                  v
       O resultado (_site/) é enviado ao GitHub Pages
```

| Componente | Responsabilidade |
|---|---|
| **Quarto** | Converte páginas `.qmd` em HTML e reúne os recursos do site. |
| **R** | Lê os dados YAML e gera cartões, listagens, galeria e outros componentes. |
| **`data/*.yml`** | Armazena notícias, equipe, eventos, projetos, publicações e demais registros. |
| **Sveltia CMS (`admin/`)** | Interface web para editar dados sem editar YAML manualmente. |
| **`R/helpers.R`** | Funções compartilhadas, leitura dos dados e componentes reutilizados pelas páginas. |
| **`styles.css` e `custom.scss`** | Layout, responsividade, cores, tipografia e detalhes visuais. |
| **GitHub Actions** | Executa a compilação e publica o resultado quando há mudanças relevantes. |
| **GitHub Pages** | Hospeda a versão estática gerada pelo processo de publicação. |

**Importante:** o painel não publica HTML diretamente. Ao salvar conteúdo, ele cria um commit no repositório; esse commit aciona o workflow de publicação. O site só deve ser considerado atualizado quando a execução correspondente terminar com sucesso.

## Editar o conteúdo pelo painel

1. Abra o [painel administrativo](https://maiconcarlospng.github.io/Site-GPENSC-Teste/admin/).
2. **Atenção: o login OAuth pelo GitHub ainda não está configurado como fluxo próprio do projeto.** Se o painel pedir token, não cole nem compartilhe um token em documentos, mensagens ou arquivos do site. Use somente uma credencial individual, se já tiver sido orientado a isso pelo responsável técnico.
3. O backend atual aponta para `maiconcarlospng/Site-GPENSC-Teste), branch `main`. Salvar no painel pode gravar diretamente nessa branch; ainda não há um fluxo editorial de aprovação configurado.
4. Depois de uma edição autorizada, confira a execução correspondente em **Actions**.
5. Aguarde o status **Success** e recarregue o site. Se necessário, use `Ctrl + F5`.

**Não considere o painel pronto para uso amplo pelo grupo enquanto o login individual e as permissões não forem configurados e testados.**

### Seções e arquivos de dados

| Seção do painel | Arquivo | Para que serve |
|---|---|---|
| Notícias | `data/noticias.yml` | Título, data, categoria, resumo, conteúdo, link e imagem. |
| Eventos / agenda | `data/eventos.yml` | Atividades, datas, locais e links. |
| Equipe | `data/equipe.yml` | Nome, função, formação, foto, Lattes e ORCID. Sem foto, o layout pode usar as iniciais do nome. |
| Linhas de pesquisa | `data/linhas.yml` | Nome, descrição, palavras-chave e identificador de cada linha. |
| Projetos | `data/projetos.yml` | Projetos de pesquisa e extensão, situação, coordenação, período e linha associada. |
| Publicações | `data/publicacoes.yml` | Produção científica, autores, ano, veículo, DOI e linha associada. |
| Livros | `data/livros.yml` | Livros, autores, editora, ano e link. |
| Defesas | `data/defesas.yml` | Defesas e qualificações, autor, título, nível, data e orientador. |
| Disciplinas | `data/disciplinas.yml` | Disciplinas, nível, código, docente, período e ementa. |
| GPENSC no Ar | `data/noar.yml` | Episódios, convidados, datas, links e observações internas. |
| Vídeos | `data/videos.yml` | Vídeos, datas, descrições e links. |
| Sites úteis | `data/sites.yml` | Recursos e sites recomendados. |
| Apoio e parceiros | `data/apoio.yml` | Instituições, logos e links. |
| Galeria | `data/galeria.yml` | Fotos e legendas usadas na faixa de imagens da página inicial. |

### Cuidados ao preencher

- Prefira datas no formato `AAAA-MM-DD`, por exemplo `2026-10-21`.
- Respeite os nomes de campos já existentes; eles precisam corresponder ao que é lido por `R/helpers.R`.
- Não altere o `id` de uma linha de pesquisa depois de associá-la a projetos ou publicações.
- O campo `situacao` usado para contar projetos em andamento deve corresponder ao valor esperado pelo código (`Em andamento`).
- Confira se links externos estão completos, incluindo `https://`.
- Use nomes de arquivos de imagem simples, sem caracteres especiais, e confira maiúsculas/minúsculas.
- Faça upload de imagens otimizadas para a web, sem resolução excessiva.

### Observação importante sobre a galeria

A configuração atual do painel contém o tipo personalizado `galeria-multipla-v2`. O Sveltia CMS exibiu a mensagem **“Tipo de campo não suportado”** quando esse tipo não estava registrado/carregado. Isso significa que a seleção múltipla não deve ser considerada funcional apenas por estar declarada em `admin/config.yml`. Antes da entrega oficial, é necessário implementar e carregar o widget personalizado corretamente ou voltar temporariamente a um campo de lista compatível com o CMS. Não apague nem converta manualmente `data/galeria.yml` sem preservar a estrutura `itens: - arquivo: ... - legenda: ...`.

## Mapa do repositório

| Caminho | Função |
|---|---|
| `index.qmd` | Página inicial: galeria, apresentação, cartões de pesquisa, notícias, agenda, podcast e apoio institucional. |
| `*.qmd` | Páginas de conteúdo, como Quem somos, agenda, notícias, linhas de pesquisa, publicações e disciplinas. |
| `R/helpers.R` | Funções R compartilhadas e leitura dos arquivos de dados. |
| `data/` | Conteúdo dinâmico em arquivos YAML. |
| `img/` | Fotos, ícones, logos e imagens usadas pelo site e pelo painel. |
| `admin/index.html` | Entrada do painel Sveltia CMS. |
| `admin/config.yml` | Backend, coleções, campos e widgets do painel. |
| `_quarto.yml` | Configurações gerais do Quarto, navegação e rodapé. |
| `_variables.yml` | Variáveis de texto e links reutilizadas nas páginas. |
| `styles.css` | Estilos do site, componentes, espaçamentos e regras responsivas. |
| `custom.scss` | Tema, cores e tipografia do Quarto. |
| `topo.html`, `lupa.html` | Elementos de identidade visual e efeitos reutilizados no site. |
| `.github/workflows/publish.yml` | Único workflow ativo de compilação e publicação do site. |
| `COMO-EDITAR.md` | Guia operacional de edição e manutenção. |

## Onde alterar cada parte do site

| Quero alterar... | Comece por... |
|---|---|
| Textos e dados de notícias, agenda, equipe etc. | Painel `/admin/` e arquivos correspondentes em `data/`. |
| Campos que aparecem no painel | `admin/config.yml`. |
| Como os dados são interpretados ou apresentados | `R/helpers.R`. |
| Texto fixo ou estrutura de uma página | Arquivo `.qmd` correspondente. |
| Menu, links de navegação e rodapé | `_quarto.yml`. |
| Nome, resumo, missão ou links reutilizados | `_variables.yml`; confira também `_quarto.yml` quando o mesmo dado estiver fixado no rodapé. |
| Cores e tipografia | `custom.scss` e variáveis CSS no começo de `styles.css`. |
| Cartões, galeria, espaçamento, mobile e ícones | `styles.css` e funções relacionadas em `R/helpers.R`. |
| Coleções ou autenticação do CMS | `admin/config.yml` e configurações de autenticação do GitHub. |
| Compilação e publicação | `.github/workflows/publish.yml`. |

### Adicionar um campo a uma coleção existente

1. Adicione o campo à coleção correspondente em `admin/config.yml`.
2. Acrescente o nome do campo ao vetor correspondente na lista `COLUNAS` de `R/helpers.R`.
3. Ajuste a função ou página que deve exibir o campo.
4. Teste com um registro que tenha e outro que não tenha o campo preenchido.
5. Execute `quarto render` localmente antes de enviar a alteração.

### Adicionar uma página

1. Crie uma página `.qmd` seguindo o padrão das páginas existentes.
2. Carregue `R/helpers.R` se a página usar dados ou componentes R.
3. Adicione a página à navegação em `_quarto.yml`, caso deva aparecer no menu.
4. Confira links relativos e renderize o site.

## Publicação e workflows

### Workflow ativo

O repositório tem **um arquivo de workflow ativo**: `.github/workflows/publish.yml`, chamado **“Publicar site Quarto”**. As várias execuções que aparecem na aba Actions são o histórico de tentativas desse workflow; não são necessariamente workflows separados.

O workflow atual:

1. é acionado por alterações na branch `main` em arquivos relevantes ao site;
2. permite execução manual pela opção **Run workflow**;
3. prepara Quarto e R;
4. instala as dependências R declaradas no workflow;
5. executa `quarto render`;
6. envia `_site/` como artefato do GitHub Pages;
7. publica o artefato no ambiente `github-pages`.

O workflow também usa cache para acelerar a renderização e cancela execuções anteriores quando chega uma nova publicação, evitando que builds antigos terminem depois dos mais recentes.

**Não há agendamento diário configurado no workflow atual.** A publicação acontece por alterações relevantes na branch `main` ou por execução manual.

### Como investigar uma falha

1. Abra [Actions](https://github.com/maiconcarlospng/Site-GPENSC-Teste/actions).
2. Selecione a execução mais recente.
3. Abra o job `build` e identifique o primeiro passo que falhou.
4. Se falhou em **Renderizar o site**, procure o erro nas últimas linhas do log.
5. Depois de corrigir a causa, envie um novo commit ou use **Re-run jobs** quando a falha tiver sido transitória.

A configuração do repositório deve usar **Settings → Pages → Build and deployment → Source: GitHub Actions**.

### Organização do histórico

O histórico de execuções do GitHub Actions é mantido pelo GitHub. Renomear ou documentar o workflow melhora as execuções futuras, mas não reescreve os nomes das execuções antigas. Para tornar o histórico claro, use mensagens de commit que descrevam uma mudança real e específica, por exemplo `Corrige alinhamento dos logos institucionais`, em vez de mensagens genéricas como `update`.

## Executar localmente

### Requisitos

- Git
- R
- RStudio (opcional, recomendado para trabalhar com R)
- Quarto CLI

Instale R em https://cran.r-project.org, RStudio em https://posit.co/download/rstudio-desktop e Quarto em https://quarto.org/docs/get-started/.

No console do R, instale os pacotes usados pelo projeto:

```r
install.packages(c(
  "readr", "dplyr", "htmltools", "DT", "plotly",
  "yaml", "knitr", "rmarkdown", "here", "purrr",
  "stringr", "lubridate"
))
```

### Baixar e visualizar

```bash
git clone https://github.com/maiconcarlospng/Site-GPENSC-Teste.git
cd Site-GPENSC-Teste
quarto preview
```

O comando abre uma prévia local e atualiza a página conforme os arquivos são salvos. Para interromper, use `Ctrl + C`.

Para gerar o site sem iniciar o servidor de prévia:

```bash
quarto render
```

O resultado é escrito em `_site/`.

### Trabalhar com alterações feitas pelo painel

O painel grava commits diretamente no GitHub. Antes de editar localmente, atualize sua cópia:

```bash
git pull --rebase
```

Depois de editar:

```bash
git status
git add .
git commit -m "Descreva a alteração"
git pull --rebase
git push
```

Revise a saída de `git status` antes de adicionar arquivos. Não inclua arquivos temporários do RStudio, credenciais, tokens ou dados pessoais que não devam ser públicos.

## Transferir o projeto para o GitHub do GPENSC

A transferência deve ocorrer **somente depois da aprovação do grupo** e com uma pessoa responsável pelo repositório institucional. O objetivo é transferir o código, o conteúdo e a configuração, e não depender para sempre da conta pessoal que mantém este protótipo.

### Opção recomendada: transferir o repositório existente

Se o grupo tiver uma organização GitHub ou uma conta institucional adequada, o proprietário atual pode usar **Settings → General → Danger Zone → Transfer ownership** e informar o novo proprietário. O GitHub exige que o proprietário de destino aceite a transferência. Verifique as permissões e as políticas da organização antes de escolher essa opção.

Vantagem: mantém o histórico de commits e, em geral, preserva referências ao repositório antigo. Ainda assim, **não presuma que Pages, domínio, permissões do CMS e autenticação continuarão funcionando sem ajustes**.

### Alternativa: criar um repositório novo e enviar uma cópia

1. Crie o repositório de destino no GitHub do grupo.
2. Faça uma cópia completa do repositório atual, incluindo a branch `main` e o histórico Git.
3. Envie o código para o novo repositório.
4. Configure Pages e Actions no destino.
5. Atualize as referências ao nome antigo do repositório, especialmente a configuração do CMS e eventuais URLs absolutas.
6. Teste o site e o painel no endereço novo antes de divulgar.

Exemplo para enviar o histórico a um repositório vazio de destino (substitua o endereço pelo real):

```bash
git clone https://github.com/maiconcarlospng/Site-GPENSC-Teste.git
cd Site-GPENSC-Teste
git remote rename origin prototipo
git remote add origin https://github.com/ORGANIZACAO-DO-GPENSC/NOME-DO-REPOSITORIO.git
git push -u origin main
```

Se houver outras branches ou tags que precisem ser preservadas, elas também devem ser enviadas. Não apague o repositório de protótipo antes de validar a cópia e combinar a transição.

### Lista de migração

- [ ] Definir quem será o proprietário e administrador do repositório institucional.
- [ ] Escolher o nome definitivo do repositório.
- [ ] Transferir ou copiar o histórico e conferir se todos os arquivos estão presentes.
- [ ] Ativar **Settings → Pages → Source: GitHub Actions** no destino.
- [ ] Conferir permissões de Actions e Pages.
- [ ] Revisar `admin/config.yml` e reconfigurar a autenticação do CMS para o novo repositório.
- [ ] Conferir URLs, links absolutos, caminhos de imagens e configurações do Quarto.
- [ ] Testar uma alteração de conteúdo pelo painel e confirmar que o site é publicado.
- [ ] Confirmar que o grupo tem acesso de administrador e documentar quem mantém as credenciais.
- [ ] Só então divulgar o endereço oficial e decidir o destino do protótipo.

## Configurar novamente o painel Sveltia CMS

O painel fica em `admin/`. O arquivo `admin/index.html` carrega a aplicação Sveltia CMS e `admin/config.yml` declara o backend e as coleções.

### O que precisa mudar ao trocar de repositório

No início de `admin/config.yml`, confira a configuração do backend. O valor `repo` deve apontar para o novo repositório, no formato `PROPRIETARIO/NOME-DO-REPOSITORIO`, e `branch` deve corresponder à branch usada para publicar o site, normalmente `main`.

```yaml
backend:
  name: github
  repo: ORGANIZACAO-DO-GPENSC/NOME-DO-REPOSITORIO
  branch: main
```

Esse trecho é um exemplo: substitua pelo nome real do repositório de destino. Não mude o restante da configuração sem necessidade, pois as coleções precisam continuar apontando para os arquivos existentes em `data/`.

### Login com GitHub: opção gratuita e configuração pendente

A autenticação precisa ser configurada antes de liberar o painel para o grupo. O backend `github` sozinho não cria usuários nem configura o OAuth.

**Opção sem custo de hospedagem para o protótipo:** usar o fluxo OAuth do Sveltia CMS com um serviço OAuth compatível hospedado em um plano gratuito. O código público do site não pode guardar o segredo OAuth. O serviço precisa trocar o código de autorização por um token e devolver o resultado ao CMS no formato esperado pelo Sveltia.

Referências oficiais:
- [Documentação do Sveltia CMS — backends e autenticação](https://sveltiacms.app/en/docs/backends)
- [Código-fonte oficial do backend GitHub](https://github.com/sveltia/sveltia-cms/tree/main/src/lib/services/backends/git/github)
- [GitHub Docs — criar uma OAuth App](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)

**Importante:** ainda não está ativado o login OAuth no protótipo. Não altere `auth_methods`, `app_id`, `base_url` ou `auth_endpoint` para valores de exemplo: sem o cadastro e a configuração do serviço, isso pode deixar o painel sem uma forma de entrar.

#### O que é necessário para ativar

1. Escolher o serviço OAuth gratuito e criar uma conta nele. O GitHub Pages não executa código de servidor.
2. Registrar uma OAuth App no GitHub. A URL inicial será o endereço do painel publicado; a URL de callback deverá ser exatamente a fornecida pela documentação do serviço OAuth escolhido.
3. Configurar o Client ID no `admin/config.yml` e guardar o Client Secret **somente** como segredo no serviço OAuth, nunca no repositório.
4. Configurar o CMS para oferecer OAuth e testar com uma conta autorizada, incluindo leitura, gravação e upload de imagens.
5. Confirmar como o serviço restringe quem pode entrar. OAuth autentica a conta, mas não garante, sozinho, que a pessoa tenha permissão no repositório nem implementa aprovação editorial.

#### Estado atual e segurança

- O backend aponta para `maiconcarlospng/Site-GPENSC-Teste`, branch `main`.
- O CMS pode oferecer autenticação por token pessoal (PAT). Token é uma credencial individual; nunca compartilhe tokens entre integrantes, não os coloque no README e não os salve em arquivos versionados.
- O login OAuth individual não está concluído nem testado neste protótipo.
- As alterações ainda podem ser gravadas diretamente em `main`; aprovação editorial obrigatória não está configurada.
- Antes de liberar o painel para várias pessoas, teste o processo completo e defina quem tem acesso de escrita ao repositório.

### URL do painel

Com GitHub Pages, o caminho depende do endereço final do site. Para um projeto publicado como `https://organizacao.github.io/nome-do-repositorio/`, o painel normalmente estará em `https://organizacao.github.io/nome-do-repositorio/admin/`. Se o grupo usar domínio próprio ou um repositório especial `organizacao.github.io`, confirme os caminhos e os URLs gerados pelo Quarto.

### Atenção à galeria com seleção múltipla

O tipo `galeria-multipla-v2` é um widget personalizado, não um widget nativo garantido pelo Sveltia CMS. A mensagem “Tipo de campo não suportado” indica que o widget não foi registrado/carregado naquela versão publicada do painel. Antes de entregar o site, implemente e teste esse widget no destino ou use temporariamente uma configuração compatível com widgets nativos. Preserve o formato de dados esperado por `R/helpers.R`: lista `itens`, cada item com `arquivo` e `legenda`.

## Antes de transformar o protótipo em site oficial

O protótipo pode conter textos, notícias, links, fotos e outros dados demonstrativos. Antes de aprovação:

- substituir exemplos e testes por conteúdo revisado pelo grupo;
- conferir todos os links institucionais e contatos;
- confirmar autorização para publicar fotos, nomes, perfis Lattes/ORCID e informações de integrantes;
- revisar acessibilidade, uso por celular, contraste e textos alternativos de imagens;
- validar a navegação de todas as páginas e os botões de detalhamento de notícias;
- testar o painel, a galeria, upload de imagens e publicação automática;
- definir política de atualização, responsável institucional e procedimento de recuperação;
- definir domínio definitivo e redirecionamentos, se aplicável.

## Problemas frequentes

| Problema | O que verificar |
|---|---|
| O site não mudou depois de salvar | A execução mais recente em Actions, o resultado do build e o cache do navegador. |
| Actions falhou | Abra o job `build` e leia o primeiro passo com erro; o passo de renderização costuma mostrar erros de Quarto/R. |
| O painel informa que a configuração não pode ser recuperada | Confirme se `admin/config.yml` está acessível no endereço publicado e se o caminho/branch estão corretos. |
| O painel diz “Tipo de campo não suportado” | Um widget personalizado está declarado, mas não está registrado/carregado. |
| Uma foto não aparece | Confira o caminho, o nome e a existência do arquivo no repositório; maiúsculas e minúsculas importam. |
| Campo do painel não aparece no site | Confira o nome no YAML, em `COLUNAS` no `R/helpers.R` e no componente que exibe o conteúdo. |
| Uma página não aparece no menu | Confira a navegação em `_quarto.yml`. |
| `git push` é rejeitado | O painel ou outra pessoa pode ter enviado commits; execute `git pull --rebase` e resolva conflitos antes de tentar novamente. |
| Build verde, mas site antigo | Confira a configuração de Pages, a URL visitada e faça recarga forçada. |

---

## Licença e uso

Este repositório é um protótipo acadêmico/institucional. Antes de definir uma licença pública ou permitir reutilização, combine com o grupo quem detém os direitos do conteúdo, das fotos, dos logos e do código. A publicação pública do código não significa que todas as imagens e marcas possam ser reutilizadas livremente.
