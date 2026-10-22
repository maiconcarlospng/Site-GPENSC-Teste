# Como editar o site do GPENSC

Guia para quem está começando. A regra central:

> **O conteúdo mora nos arquivos `.yml` da pasta `data/`, e você os edita pelo painel `/admin/`. O visual mora em `styles.css` e `custom.scss`. As páginas `.qmd` só juntam os dois.**

Na maior parte do tempo você só usa o **painel** e, de vez em quando, o `_variables.yml`. Para a explicação técnica completa, veja o `README.md`.

---

## 1. Editar pelo painel (o jeito do dia a dia)

1. Abra: **https://maiconcarlospng.github.io/Site-GPENSC-Teste/admin/**
2. **Aviso:** o login OAuth individual pelo GitHub ainda precisa ser configurado. Se o painel pedir token, não compartilhe tokens entre pessoas nem os coloque em arquivos ou mensagens.
3. O painel está apontado para o repositório do protótipo e para a branch `main`; salvar pode gravar diretamente nessa branch.
4. Só faça alterações se tiver autorização do responsável pelo repositório. O fluxo de aprovação editorial ainda não está implementado.
5. Após uma edição autorizada, espere de **2 a 5 minutos**. O site é recompilado automaticamente quando a publicação é acionada.
5. Para conferir: no GitHub, aba **Actions**. Círculo amarelo = compilando; ✅ verde = no ar. Abra o site em **janela anônima** para não ver a versão guardada no navegador.

> O site só muda depois do ✅ verde. Se aparecer ❌, veja a seção 8.

### Regras ao preencher

1. **Datas** sempre no formato `AAAA-MM-DD` (ex.: `2026-10-25`).
2. **Campos opcionais** podem ficar vazios: o site só mostra o link ou a foto se houver conteúdo.
3. **Imagens enviadas pelo painel** ficam na pasta `img/` e já funcionam sozinhas.
4. **Não mude o `ID`** de uma linha de pesquisa depois de criado, porque projetos e publicações usam esse código para se ligar a ela.

---

## 2. Mapa dos arquivos

| Arquivo | Para que serve | Mexo sempre? |
|---|---|---|
| `data/*.yml` | **Todo o conteúdo** (notícias, agenda, equipe, projetos, publicações, etc.). Editado pelo painel | **Sim (pelo painel)** |
| `img/` | Imagens enviadas pelo painel, logos e fotos | Sim |
| `img/galeria/`, `img/noticias/`, `img/pesquisas/`, `img/equipe/` | Pastas de imagens organizadas manualmente (cada uma pode ter um LEIA-ME.txt) | Às vezes |
| `admin/config.yml` | Define as seções e os campos do painel | Raramente |
| `_variables.yml` | Textos curtos: nome do grupo, resumo, missão, e-mail, Instagram, links | Às vezes |
| `_quarto.yml` | Menu, rodapé, tema | Raramente |
| `custom.scss` | **Cores e fontes** | Para mudar o visual |
| `styles.css` | Aparência de cartões, topo, linha do tempo etc. | Para mudar o visual |
| `*.qmd` | Uma página cada (`index.qmd` = início) | Raramente |
| `R/helpers.R` | Lê os `.yml` e define funções (`cartoes`, `tem`...) | Só para criar coisas novas |
| `topo.html` | Faixa do topo com logo e nome do grupo (texto fixo) | Raramente |
| `lupa.html` | Animações e lente da lupa (para dar a lente a outro bloco, acrescente a classe `lupa-area`) | Quase nunca |
| `.github/workflows/publish.yml` | Receita que compila e publica o site sozinha | Quase nunca |

Os arquivos de código têm **comentários explicando cada bloco**. Em R e YAML: `#`; em SCSS: `//`; em CSS: `/* */`; em `.qmd` e HTML: `<!-- -->`.

---

## 3. Tarefas do dia a dia

| Quero... | No painel, seção | Observações |
|---|---|---|
| Colocar **fotos do grupo no topo da home** | Galeria | Sem fotos, o topo mostra o bloco verde com a lupa |
| Adicionar **notícia** | Notícias | `imagem` é opcional (sem ela usa a imagem padrão). `categoria` cria uma seção nova sozinha (ex.: Defesa, GPENSC no Ar). `link` é opcional ("Leia mais »") |
| Adicionar **evento** na agenda | Eventos | `tipo` ex.: Aula aberta, Workshop, Curso |
| Registrar **defesa ou qualificação** | Defesas | `nível`: Mestrado/Doutorado. `etapa`: Defesa/Qualificação. `link` (opcional) vira "Acessar" na página Teses e dissertações |
| Adicionar **episódio do GPENSC no Ar** | NOAR (episódios) | `link` opcional. A `observação` é só sua e **não** aparece no site |
| Adicionar **linha de pesquisa** | Linhas de pesquisa | O `ID` (L1, L2...) é usado em projetos e publicações |
| Adicionar **integrante** | Equipe | `papel` = Coordenação (cartão grande, com mini-bio em `formação`) ou Docente, Doutorando(a), Mestrando(a), Graduando(a), Egresso(a). Sem foto, aparecem as iniciais |
| Adicionar **disciplina** | Disciplinas | `nível` cria a seção (Graduação, Pós-graduação) |
| Adicionar **livro** | Livros | |
| Adicionar **vídeo** | Vídeos | Cole o link no campo `Link` |
| Adicionar **site recomendado** | Sites úteis | |
| Adicionar **projeto** | Projetos | `tipo` = Pesquisa ou Extensão (os de Extensão aparecem em "Ensino e extensão") |
| Adicionar **publicação** | Publicações | A referência é montada sozinha. O `DOI` vira link |
| Adicionar **logo de apoio** (UFOP, CNPq, FAPEMIG...) | Apoio e parceiros | Use PNG com fundo transparente |

### O que NÃO é editado pelo painel

| Quero... | Edite | Observações |
|---|---|---|
| Mudar **nome, resumo, missão, e-mail, Instagram** | `_variables.yml` | Aparecem nas páginas com `{{< var nome >}}` |
| Trocar uma **logo do site** | arquivo em `img/` | Mantenha o mesmo nome do arquivo |
| Mudar uma **cor** | `custom.scss` (e as variáveis `--gp-*` no topo do `styles.css`) | Troque o código `#RRGGBB` |
| Mexer no **menu** | `_quarto.yml` | Cada item = `href` + `text`; o bloco `menu:` cria o suspenso |
| Mudar **e-mail, endereço ou Instagram do rodapé** | `_quarto.yml` (bloco `page-footer`) | O rodapé não lê o `_variables.yml`: mude nos dois lugares |

> **Atenção (atalhos):** nunca escreva as chaves duplas do atalho `var` dentro de comentário em `.qmd`. O Quarto executa mesmo assim e dá erro.

> **Atenção:** em Projetos, a `situação` precisa ser exatamente `Em andamento` para o projeto entrar na contagem da página inicial. Em Publicações, o `tipo` precisa ser exatamente `Artigo` para contar como artigo.

---

## 4. Editar no seu computador (opcional)

Só é necessário para mexer em código, visual ou páginas. Para o conteúdo, use o painel.

### Instalar (uma vez só)
1. **R**: https://cran.r-project.org
2. **RStudio** (já traz o Quarto): https://posit.co/download/rstudio-desktop, ou o Quarto avulso: https://quarto.org/docs/get-started
3. No console do R:

```r
install.packages(c("readr", "dplyr", "htmltools", "DT", "plotly", "yaml", "knitr", "rmarkdown"))
```

### Ver o site
No **Terminal** do RStudio, dentro da pasta do projeto:

```bash
quarto preview
```

O site abre no navegador e atualiza sozinho quando você salva um arquivo. Para parar: `Ctrl + C`.

### ⚠️ Antes de enviar alterações ao GitHub
O painel também faz alterações no repositório, então o seu computador pode estar desatualizado. **Sempre rode `git pull --rebase` antes de começar e antes de enviar:**

```bash
git pull --rebase
git add .
git commit -m "Descreva a alteração"
git pull --rebase
git push
```

Se aparecer `rejected ... fetch first`, é o `git pull --rebase` que resolve. Se aparecer `unstaged changes`, rode `git stash`, depois `git pull --rebase`, `git push` e, se precisar, `git stash pop`.

---

## 5. Criar uma página nova (passo a passo)

1. Crie `minhapagina.qmd`:

````markdown
---
title: "Título da página"
---

```{r}
#| echo: false
source("R/helpers.R")
```

Texto normal em Markdown. Use `##` para subtítulos.
````

2. Coloque no menu (`_quarto.yml`):

```yaml
      - href: minhapagina.qmd
        text: Minha página
```

3. Para listar dados de uma tabela nova:
   - crie `data/minha.yml`:

```yaml
itens:
  - titulo: Primeiro item
    descricao: Texto do item
```

   - em `admin/config.yml`, crie a seção do painel apontando para `data/minha.yml` (copie uma seção existente e troque os nomes);
   - em `R/helpers.R`, acrescente `minha = c("titulo", "descricao")` na lista `COLUNAS` e depois `minha <- ler("minha")`;
   - na página, mostre como cartões:

````markdown
```{r}
cartoes(minha, function(x, i)
  div(class = paste("cartao reveal", cor_de(i)),
    h4(x$titulo),
    p(x$descricao)))
```
````

Ou como tabela com busca: `datatable(minha, rownames = FALSE, filter = "top")`.

### Criar um campo novo numa seção que já existe
1. Acrescente o campo em `admin/config.yml`.
2. Acrescente o nome dele na lista `COLUNAS` do `R/helpers.R`.
3. Use na página ou no cartão como `x$nome_do_campo`.

Se esquecer o passo 2, o campo aparece no painel, mas **não aparece no site**.

---

## 6. Noções rápidas

- **Markdown:** `# Título`, `**negrito**`, `*itálico*`, `[texto](https://link)`, `![descrição](img/foto.png)`.
- **Bloco de R:** começa com ` ```{r} ` e termina com ` ``` `. `echo: false` esconde o código e mostra só o resultado.
- **Caixas:** `::: {.nome}` ... `:::` cria uma `div` com a classe CSS `nome`. Várias classes: `{.faixa .reveal}`.
- **`reveal`:** classe que faz o elemento aparecer suavemente ao rolar.
- **`tem(x)`:** verdadeiro se o campo está preenchido.
- **YAML:** use 2 espaços de indentação, nunca TAB.

---

## 7. Como o site é publicado

Você não precisa publicar nada manualmente. A cada alteração (pelo painel ou por `git push`), o **GitHub Actions** compila o site e o **GitHub Pages** o publica.

Configuração feita uma vez só: em **Settings → Pages → Source**, a opção deve ser **GitHub Actions**. Se estiver em "Deploy from a branch", o site não reflete as alterações.

---

## 8. Erros comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Editei no painel e o site **não mudou** | Compilação ainda em andamento, falhou, ou cache do navegador | Veja a aba **Actions** (✅?). Abra o site em janela anônima |
| Workflow ❌ vermelho | Erro na compilação | Clique no run → passo **Renderizar o site** → leia as últimas linhas do erro |
| `Não encontrei o arquivo: data/xxx.yml` | Falta o arquivo da tabela | Crie `data/xxx.yml` com `itens:` (seção 5) |
| `A tabela 'xxx' não está na lista COLUNAS` | Tabela nova sem cadastro | Acrescente em `COLUNAS` no `R/helpers.R` |
| `object 'xxx' not found` / `Can't subset columns` | Nome de campo diferente ou com erro de digitação | Confira os nomes em `COLUNAS` e em `admin/config.yml` |
| `there is no package called 'xxx'` | Pacote não instalado | No computador: `install.packages("xxx")`. No Actions: acrescente em `publish.yml` |
| Imagem ou logo não aparece | Nome do arquivo diferente (maiúsculas contam!) | Confira `img/nome.png` |
| Campo novo do painel não aparece no site | Falta em `COLUNAS` | Seção 5, "Criar um campo novo" |
| Página nova não aparece no menu | Faltou incluir no `_quarto.yml` | Seção 5, passo 2 |
| Erro de YAML | Indentação errada ou TAB | Use 2 espaços |
| Número da home zerado | Valor de `situação` ou `tipo` diferente do esperado | Use `Em andamento` e `Artigo` exatamente assim |
| `git push` rejeitado (`fetch first`) | O painel fez alterações que o seu computador não tem | `git pull --rebase` e depois `git push` |
| Actions ✅, mas o site continua antigo | **Settings → Pages → Source** não está em "GitHub Actions" | Corrija a opção e rode o workflow de novo |

---

## 9. Antes de divulgar

- [ ] Trocar todos os `[preencher]` e `[EXEMPLO]` por dados reais
- [ ] Conferir e-mail, link do CNPq, Instagram e os links do PPGSN/Escola de Nutrição (alguns eram palpites)
- [ ] Confirmar os títulos da série "GPENSC no Ar" (foram lidos de um print de baixa resolução)
- [ ] Trocar as logos por versões em alta resolução
- [ ] Ter autorização das pessoas para fotos, Lattes e e-mail
- [ ] Fazer uma edição de teste pelo painel e confirmar que ela chega ao site

## 10. Para aprender mais

- Sites em Quarto: https://quarto.org/docs/websites
- Markdown no Quarto: https://quarto.org/docs/authoring/markdown-basics.html
- Tabelas interativas (DT): https://rstudio.github.io/DT
- Temas e cores: https://quarto.org/docs/output-formats/html-themes.html
