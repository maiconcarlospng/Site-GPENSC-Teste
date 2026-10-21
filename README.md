# Site do GPENSC – UFOP (Quarto + Painel de Edição)

Site estático e responsivo do **Grupo de Pesquisa e Ensino em Nutrição e Saúde Coletiva (GPENSC/UFOP)**, feito em **Quarto** e **R**, editado por um **painel online (Sveltia CMS)** e publicado automaticamente no **GitHub Pages** pelo **GitHub Actions**.

> **Regra central:** o conteúdo mora nos arquivos `.yml` da pasta `data/`, e você edita esses arquivos pelo **painel `/admin/`**, sem mexer em código. O visual mora em `styles.css` e `custom.scss`. As páginas `.qmd` só juntam os dois.

---

## 1. Como tudo funciona (visão geral)

```
Você edita no painel (/admin/)
        │  salva
        ▼
Painel faz um commit em data/*.yml (e imagens em img/) na branch main
        │  dispara
        ▼
GitHub Actions (.github/workflows/publish.yml)
   instala o R → roda "quarto render" → gera a pasta _site
        │
        ▼
GitHub Pages publica o site   (leva cerca de 2 a 5 minutos)
```

| Peça | O que faz |
|---|---|
| **Painel `/admin/`** | Formulário online para editar notícias, agenda, equipe etc. Grava nos arquivos `data/*.yml` |
| **`data/*.yml`** | Os dados do site (um arquivo por tipo de conteúdo) |
| **`R/helpers.R`** | Lê os `.yml` e monta os cartões, galeria e listas na tela |
| **`*.qmd`** | Páginas do site (usam as funções do `helpers.R`) |
| **GitHub Actions** | Compila o site automaticamente a cada alteração |
| **GitHub Pages** | Hospeda o site compilado |

---

## 2. Como editar o conteúdo pelo painel (uso diário)

1. Abra o painel: **`https://maiconcarlospng.github.io/Site-GPENSC-Teste/admin/`**
2. Entre com a conta do GitHub que tem acesso ao repositório.
3. Escolha a seção (Notícias, Eventos, Equipe...), edite ou adicione um item e clique em **Salvar / Publicar**.
4. Acompanhe em **GitHub → aba Actions**: círculo amarelo = compilando; ✅ verde = no ar.
5. Abra o site (de preferência em **janela anônima**, para evitar cache do navegador).

> O site só muda **depois** do ✅ verde. Isso costuma levar de 2 a 5 minutos.

### O que cada seção do painel edita

| Seção do painel | Arquivo | Campos | Observações |
|---|---|---|---|
| Notícias | `data/noticias.yml` | data, categoria, título, resumo, link, imagem | `categoria` agrupa as notícias. Sem imagem, usa `noticia_padrao.jpg` |
| Eventos | `data/eventos.yml` | data, tipo, título, local, link | `tipo`: Aula aberta, Workshop, Curso etc. |
| Equipe | `data/equipe.yml` | nome, papel, formação, foto, Lattes, ORCID | `papel`: Coordenação, Docente, Doutorando(a), Mestrando(a), Graduando(a) ou Egresso(a). Sem foto, aparecem as iniciais |
| Linhas de pesquisa | `data/linhas.yml` | id, nome, descrição, palavras-chave | O `id` (ex.: L1, L2) liga projetos e publicações à linha. **Não mude depois de criado** |
| Projetos | `data/projetos.yml` | título, tipo, situação, coordenador, início, fim, ID da linha, financiamento | `tipo` = Pesquisa ou Extensão. `situacao` = `Em andamento` entra na contagem da página inicial |
| Publicações | `data/publicacoes.yml` | ano, tipo, autores, título, veículo, DOI, link, ID da linha | A referência é montada sozinha. O DOI gera link direto |
| Livros | `data/livros.yml` | ano, título, autores, editora, link | |
| Defesas | `data/defesas.yml` | data, nível, etapa, autor, título, orientador, link | `nivel` = Mestrado/Doutorado. `etapa` = Defesa/Qualificação |
| Disciplinas | `data/disciplinas.yml` | nível, código, nome, docente, período, ementa | `nivel` separa Graduação e Pós-graduação |
| NOAR (episódios) | `data/noar.yml` | episódio, título, convidado, data, link, observação | A `obs` é interna e **não** aparece no site |
| Vídeos | `data/videos.yml` | data, título, descrição, link | |
| Sites úteis | `data/sites.yml` | nome, descrição, link | |
| Apoio e parceiros | `data/apoio.yml` | nome, logo, link | Use PNG com fundo transparente |
| Galeria | `data/galeria.yml` | arquivo (imagem), legenda | Sem fotos, o topo mostra o bloco verde institucional |

### Regras ao preencher

1. **Datas** sempre no formato `AAAA-MM-DD` (ex.: `2026-10-25`).
2. **Campos opcionais** podem ficar vazios: o site esconde sozinho o que não existe (link, imagem...).
3. **Imagens enviadas pelo painel** vão para a pasta `img/` e funcionam automaticamente.
4. Os textos de **e-mail, redes sociais, resumo e missão** ficam em `_variables.yml` (e e-mail/rodapé também em `_quarto.yml`). Esses dois **não** são editados pelo painel.

---

## 3. Mapa de arquivos

| Arquivo / Pasta | Para que serve | Frequência de edição |
|---|---|---|
| `admin/` | Painel de edição (`index.html` e `config.yml`) | Rara |
| `admin/config.yml` | Define as seções e os campos do painel | Baixa |
| `data/*.yml` | **Todo o conteúdo dinâmico** do site | Alta (pelo painel) |
| `img/` | Logos, fotos enviadas pelo painel e imagens do site | Alta |
| `img/equipe/`, `img/noticias/`, `img/galeria/`, `img/pesquisas/` | Pastas de imagens organizadas manualmente | Média |
| `_variables.yml` | Nome do grupo, resumo, missão, e-mail, Instagram, links | Média |
| `_quarto.yml` | Menu, rodapé e estrutura do site | Baixa |
| `custom.scss` | Cores principais e tipografia | Baixa |
| `styles.css` | Layout (cartões, topo, celular, logos) | Baixa |
| `*.qmd` | Páginas do site (`index.qmd` = página inicial) | Baixa |
| `R/helpers.R` | Lê os `.yml` e gera os componentes (cartões, galeria etc.) | Baixa |
| `topo.html` / `lupa.html` | Faixa do topo e animação da lupa | Rara |
| `.github/workflows/publish.yml` | Receita que compila e publica o site | Rara |

---

## 4. Publicação automática (GitHub Actions + Pages)

O arquivo `.github/workflows/publish.yml` roda **sempre que**:
- há um commit na branch `main` (inclusive os feitos pelo painel);
- alguém clica em **Run workflow** (aba Actions);
- todo dia às 6h (horário de Brasília), para manter itens dependentes de data atualizados.

**Configuração obrigatória (feita uma vez):** no GitHub, vá em **Settings → Pages → Source** e escolha **GitHub Actions**. Se estiver em "Deploy from a branch", o site publicado **não** reflete o resultado da compilação.

A pasta `_site/` é criada pelo Actions durante a compilação e **não** fica no repositório.

---

## 5. Trabalhando no seu computador (opcional)

### Requisitos (uma vez só)
1. **R**: https://cran.r-project.org
2. **RStudio** (já traz o Quarto) ou o Quarto CLI avulso: https://quarto.org/docs/get-started
3. Pacotes R:

```r
install.packages(c("readr", "dplyr", "htmltools", "DT", "plotly", "yaml", "knitr", "rmarkdown"))
```

### Visualizar o site
```bash
quarto preview
```
Abre no navegador e recarrega a cada alteração. Para parar: `Ctrl + C`.

### ⚠️ Atenção: o painel também faz commits
Como o painel grava direto no GitHub, **o repositório pode estar à frente do seu computador**. **Antes de começar a editar localmente e antes de enviar**, sempre rode:

```bash
git pull --rebase
```

Para enviar alterações:

```bash
git add .
git commit -m "Descreva a alteração"
git pull --rebase
git push
```

Se aparecer `rejected ... fetch first`, o `git pull --rebase` resolve. Se aparecer `unstaged changes`, faça `git stash`, depois `git pull --rebase`, `git push` e, se precisar, `git stash pop`.

---

## 6. Como o site lê os dados (para quem for mexer no código)

O `R/helpers.R` tem uma lista chamada `COLUNAS`, com os campos de cada tabela, e a função `ler("nome")`, que lê `data/nome.yml`. Cada item do `.yml` vira uma linha; campo ausente ou vazio vira `NA`.

Se o arquivo não existir, o build **falha de propósito** (✅ vira ❌) em vez de mostrar dados antigos em silêncio.

### Adicionar um campo novo a uma seção existente
1. Em `admin/config.yml`, acrescente o campo na seção.
2. Em `R/helpers.R`, acrescente o nome do campo no vetor correspondente de `COLUNAS`.
3. Use o campo na página `.qmd` ou na função de cartão (`x$novo_campo`).

### Criar uma tabela nova
1. Crie o arquivo `data/minha.yml` com esta forma:

```yaml
itens:
  - titulo: Primeiro item
    descricao: Texto do item
```

2. Em `admin/config.yml`, crie a seção do painel apontando para `data/minha.yml`.
3. Em `R/helpers.R`, acrescente em `COLUNAS`: `minha = c("titulo", "descricao")` e depois `minha <- ler("minha")`.
4. Na página `.qmd`:

````markdown
```{r}
cartoes(minha, function(x, i)
  div(class = paste("cartao reveal", cor_de(i)),
    h4(x$titulo),
    p(x$descricao)))
```
````

### Imagens: como os caminhos funcionam
A função `caminho_img()` aceita os dois formatos: `foto.jpg` (procura na pasta da seção, como `img/equipe/`) e `img/foto.jpg` (como o painel grava). Os logos de apoio ficam direto em `img/`.

---

## 7. Criar uma nova página

1. Crie `minhapagina.qmd`:

````markdown
---
title: "Título da Página"
---

```{r}
#| echo: false
source("R/helpers.R")
```

Texto em Markdown aqui. Use `##` para subtítulos.
````

2. Adicione ao menu em `_quarto.yml`:

```yaml
      - href: minhapagina.qmd
        text: Minha Página
```

### Sintaxe rápida
- `# Título 1`, `## Título 2`, `**negrito**`, `*itálico*`, `[texto](https://url.com)`
- Blocos R: abrem com ` ```{r} ` e fecham com ` ``` `
- Blocos estilizados: `::: {.classe-css}` ... `:::`
- Classe `reveal`: faz o elemento aparecer suavemente na rolagem

---

## 8. Diagnóstico de erros

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| Editei no painel e o site **não mudou** | Workflow ainda rodando, falhou ou cache do navegador | Veja a aba **Actions** (✅?). Abra o site em janela anônima |
| Workflow ❌ vermelho | Erro na compilação | Clique no run → passo **Renderizar o site** → leia as últimas linhas do erro |
| `Não encontrei o arquivo: data/xxx.yml` | Falta o arquivo da tabela | Crie `data/xxx.yml` com `itens:` (ver seção 6) |
| `A tabela 'xxx' não está na lista COLUNAS` | Tabela nova sem cadastro | Adicione em `COLUNAS` no `R/helpers.R` |
| `object 'xxx' not found` | Campo usado na página não existe na tabela | Confira os nomes em `COLUNAS` e em `admin/config.yml` |
| `there is no package called 'xxx'` | Pacote R ausente | Local: `install.packages("xxx")`. No Actions: acrescente em `publish.yml` |
| Imagem ou logo quebrado | Nome ou caminho do arquivo diferente | Confira o arquivo em `img/` (maiúsculas e minúsculas importam!) |
| Campo novo do painel não aparece no site | Falta em `COLUNAS` | Ver "Adicionar um campo novo" na seção 6 |
| Erro de YAML | Indentação com TAB ou errada | Use exatamente **2 espaços** (nunca TAB) |
| Site publicado sem o conteúdo novo, mas Actions ✅ | **Settings → Pages → Source** fora de "GitHub Actions" | Corrija a opção e rode o workflow de novo |
| `git push` rejeitado (`fetch first`) | O painel fez commits que você não tem | `git pull --rebase` e depois `git push` |

---

## 9. Checklist antes de divulgar o site

- [ ] Substituir dados demonstrativos ou marcadores `[EXEMPLO]` por textos definitivos.
- [ ] Confirmar links das redes sociais, e-mail institucional e endereço no rodapé.
- [ ] Testar no celular (logos, bandeiras e menu).
- [ ] Otimizar imagens grandes na pasta `img/`.
- [ ] Fazer uma edição de teste pelo painel e confirmar que ela chega ao site.
