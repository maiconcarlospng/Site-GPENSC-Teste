# Como editar o site do GPENSC

Guia para quem está começando. A regra central:

> **O conteúdo mora nos CSVs (`data/`). O visual mora em `styles.css` e `custom.scss`. As páginas `.qmd` só juntam os dois.**

Na maior parte do tempo você só mexe nos CSVs e no `_variables.yml`.

> ⚠️ Este projeto **ainda não foi renderizado**: o R e o Quarto não existem no ambiente onde ele foi escrito. O primeiro `quarto preview` é o teste de verdade. Se aparecer erro, copie a mensagem e peça ajuda: quase sempre é uma coluna de CSV com nome diferente ou um pacote faltando.

---

## 1. Instalar (uma vez só)

1. **R**: https://cran.r-project.org
2. **RStudio**: https://posit.co/download/rstudio-desktop (já traz o Quarto) ou o Quarto avulso: https://quarto.org/docs/get-started
3. No console do R:

```r
install.packages(c("readr", "dplyr", "htmltools", "DT", "plotly", "yaml", "knitr", "rmarkdown"))
```

## 2. Ver o site no seu computador

Abra a pasta do projeto no RStudio e, no **Terminal** do RStudio:

```bash
quarto preview
```

O site abre no navegador e **atualiza sozinho** quando você salva um arquivo. Para parar: `Ctrl + C`.

Para gerar a versão final: `quarto render` (o site pronto fica na pasta `docs/`).

---

## 3. Mapa dos arquivos

| Arquivo | Para que serve | Mexo sempre? |
|---|---|---|
| `data/*.csv` | **Todo o conteúdo** (linhas, equipe, projetos, publicações, agenda, notícias, defesas, disciplinas, livros, vídeos, sites, episódios, apoio) | **Sim** |
| `img/galeria/`, `img/noticias/`, `img/pesquisas/` | Fotos da faixa do topo, das notícias e dos 3 cartões "Pesquisas" (cada pasta tem um LEIA-ME.txt) | Sim |
| `img/equipe/` | **Fotos das pessoas** (nome do arquivo vai na coluna `foto` de `equipe.csv`) | Sim |
| `_variables.yml` | Textos curtos: nome do grupo, resumo, missão, e-mail, Instagram, links | Às vezes |
| `img/` | Logos e fotos | Às vezes |
| `_quarto.yml` | Menu, rodapé, tema | Raramente |
| `custom.scss` | **Cores e fontes** | Para mudar o visual |
| `styles.css` | Aparência de cartões, hero, linha do tempo etc. | Para mudar o visual |
| `*.qmd` | Uma página cada (`index.qmd` = início) | Raramente |
| `R/helpers.R` | Lê os CSVs e define funções (`cartoes`, `tem`...) | Só para criar coisas novas |
| `topo.html` | Faixa do topo com logo e nome do grupo (texto fixo: edite aqui para mudar) | Raramente |
| `lupa.html` | Animações e lente da lupa (para dar a lente a outro bloco, acrescente a classe `lupa-area`) | Quase nunca |

Todos os arquivos de código têm **comentários explicando cada bloco**. Em R/CSV-in-code: `#`; em YAML: `#`; em SCSS: `//`; em CSS: `/* */`; em `.qmd`/HTML: `<!-- -->`.

---

## 4. Regras para qualquer CSV

0. **Texto com vírgula SEMPRE entre aspas**: `"SILVA, A.; SOUZA, B."`. É o erro mais comum.

1. A **primeira linha é o cabeçalho**. Nunca mude os nomes das colunas.
2. Para adicionar algo, **copie uma linha existente**, cole embaixo e troque os valores.
3. Texto com vírgula precisa de aspas: `"SILVA, A.; SOUZA, B."`.
4. Salve como **CSV UTF-8** (no Excel: *Salvar como → CSV UTF-8*), senão `ç`, `ã`, `é` quebram.
5. Datas no formato `AAAA-MM-DD` (ex.: `2025-10-25`).
6. Campos opcionais podem ficar vazios: o site só mostra o link/foto se houver conteúdo.

---

## 5. Tarefas do dia a dia

| Quero... | Edite | Observações |
|---|---|---|
| Colocar **fotos do grupo no topo da home** | `data/galeria.csv` + imagens em `img/galeria/` | Sem fotos, o topo mostra o bloco verde com a lupa |
| Adicionar **notícia** | `data/noticias.csv` | `imagem` (opcional) = nome do arquivo em `img/noticias/`; `categoria` cria uma seção nova sozinha (ex.: Defesa, GPENSC no Ar). `url` é opcional ("Leia mais »") |
| Adicionar **evento** na agenda | `data/eventos.csv` | `tipo` ex.: Aula aberta, Workshop, Curso |
| Registrar **defesa/qualificação** | `data/defesas.csv` | `nivel`: Mestrado/Doutorado; `etapa`: Defesa/Qualificação; `url` (opcional) vira "Acessar" na página Teses e dissertações |
| Adicionar **episódio do GPENSC no Ar** | `data/noar.csv` | `link` opcional; a coluna `obs` é só sua, não aparece no site |
| Adicionar **linha de pesquisa** | `data/linhas.csv` | `id` (L1, L2...) é usado em projetos e publicações |
| Adicionar **integrante** | `data/equipe.csv` | `papel` = Coordenação (cartão grande com mini-bio em `formacao`) ou Docente, Doutorando(a), Mestrando(a), Graduando(a), Egresso(a). Foto em `img/equipe/`; sem foto aparecem as iniciais |
| Adicionar **disciplina** | `data/disciplinas.csv` | `nivel` cria a seção (Graduação, Pós-graduação) |
| Adicionar **livro** | `data/livros.csv` | |
| Adicionar **vídeo** | `data/videos.csv` | Cole o link em `url` |
| Adicionar **site recomendado** | `data/sites.csv` | |
| Adicionar **projeto** | `data/projetos.csv` | `tipo` = Pesquisa ou Extensão (os de Extensão aparecem em "Ensino e extensão") |
| Adicionar **publicação** | `data/publicacoes.csv` | A referência é montada sozinha. `doi` vira link |
| Adicionar **logo de apoio** (UFOP, CNPq, FAPEMIG...) | `data/apoio.csv` + imagem em `img/` | Use PNG com fundo transparente |
| Mudar **nome, resumo, missão, e-mail, Instagram** | `_variables.yml` | Aparecem nas páginas com `{{< var nome >}}` |
| Trocar uma **logo** | arquivo em `img/` | Mantenha o mesmo nome do arquivo |
| Mudar uma **cor** | `custom.scss` (e as variáveis `--gp-*` no topo do `styles.css`) | Troque o código `#RRGGBB` |
| Mexer no **menu** | `_quarto.yml` | Cada item = `href` + `text`; o bloco `menu:` cria o suspenso |
| Mudar **e-mail/endereço/Instagram do rodapé** | `_quarto.yml` (bloco `page-footer`) | O rodapé não lê o `_variables.yml`: mude nos dois lugares |

> **Atenção (atalhos):** nunca escreva as chaves duplas do atalho `var` dentro de comentário em `.qmd`: o Quarto executa mesmo assim e dá erro.

> **Atenção:** `projetos.csv` precisa ter a coluna `situacao` com o valor `Em andamento` para entrar na contagem da página inicial.

---

## 6. Criar uma página nova (passo a passo)

1. Crie `minhapagina.qmd`:

````markdown
---
title: "Título da página"
---

```{r}
source("R/helpers.R")
```

Texto normal em Markdown. Use `##` para subtítulos.
````

2. Coloque no menu (`_quarto.yml`):

```yaml
      - href: minhapagina.qmd
        text: Minha página
```

3. Para listar dados de um CSV novo:
   - crie `data/minha.csv` (primeira linha = cabeçalho);
   - em `R/helpers.R`, adicione `minha <- ler("minha.csv")`;
   - na página, mostre como cartões ou tabela:

````markdown
```{r}
cartoes(minha, function(x, i)
  div(class = paste("cartao reveal", cor_de(i)),
    h4(x$titulo),
    p(x$descricao)))
```
````

Ou como tabela com busca: `datatable(minha, rownames = FALSE, filter = "top")`.

---

## 7. Noções rápidas

- **Markdown:** `# Título`, `**negrito**`, `*itálico*`, `[texto](https://link)`, `![descrição](img/foto.png)`.
- **Bloco de R:** começa com ` ```{r} ` e termina com ` ``` `. `echo: false` (em `_quarto.yml`) esconde o código e mostra só o resultado.
- **Caixas:** `::: {.nome}` ... `:::` cria uma `div` com a classe CSS `nome`. Várias classes: `{.faixa .reveal}`.
- **`reveal`:** classe que faz o elemento aparecer suavemente ao rolar.
- **`tem(x)`:** verdadeiro se o campo do CSV está preenchido.
- **YAML:** use 2 espaços de indentação, nunca TAB.

---

## 8. Publicar de graça (GitHub Pages)

1. Crie conta em https://github.com e um repositório (ex.: `gpensc`).
2. Suba os arquivos do projeto.
3. No terminal, dentro do projeto: `quarto publish gh-pages`. O Quarto mostra o endereço do site.
4. Para atualizar, rode o mesmo comando.

---

## 9. Erros comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Acentos viraram `Ã§` | CSV não está em UTF-8 | Salvar como **CSV UTF-8** |
| Tabela "quebrou" depois de editar o CSV | Vírgula dentro do texto sem aspas | Colocar o texto entre aspas |
| `object 'xxx' not found` / `Can't subset columns` | Nome de coluna mudou ou tem erro de digitação | Conferir o cabeçalho do CSV |
| `there is no package called 'xxx'` | Pacote não instalado | `install.packages("xxx")` |
| Imagem não aparece | Nome do arquivo diferente (maiúsculas contam!) | Conferir `img/nome.png` |
| Página nova não aparece no menu | Faltou incluir no `_quarto.yml` | Ver item 6 |
| Erro de YAML | Indentação errada ou TAB | Usar 2 espaços |
| Número da home zerado | Valor de `situacao`/`tipo` diferente do esperado | Usar `Em andamento` e `Artigo` exatamente assim |

## 10. Antes de publicar

- [ ] Trocar todos os `[preencher]` e `[EXEMPLO]` por dados reais
- [ ] Conferir e-mail, link do CNPq, Instagram e os links do PPGSN/Escola de Nutrição (alguns eram palpites)
- [ ] Confirmar os títulos da série "GPENSC no Ar" (foram lidos de um print de baixa resolução)
- [ ] Trocar as logos por versões em alta resolução
- [ ] Ter autorização das pessoas para fotos, Lattes e e-mail

## 11. Para aprender mais

- Sites em Quarto: https://quarto.org/docs/websites
- Markdown no Quarto: https://quarto.org/docs/authoring/markdown-basics.html
- Tabelas interativas (DT): https://rstudio.github.io/DT
- Temas e cores: https://quarto.org/docs/output-formats/html-themes.html
