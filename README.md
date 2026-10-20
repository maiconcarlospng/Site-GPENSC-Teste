# Site do GPENSC – UFOP (Quarto Website)

Site estático e responsivo do Grupo de Pesquisa e Ensino em Nutrição e Saúde Coletiva (GPENSC/UFOP), desenvolvido em **Quarto** e **R**. O projeto compila as páginas para a pasta `docs/`, permitindo hospedagem gratuita diretamente via **GitHub Pages**.

> **Regra central:** O conteúdo mora nos CSVs (`data/`). O visual mora em `styles.css` e `custom.scss`. As páginas `.qmd` só juntam os dois. Na maior parte do tempo você só mexe nos CSVs e no `_variables.yml`.

---

## ⚠️ Aviso de Renderização
Este projeto utiliza compilação dinâmica em R e Quarto. O comando `quarto preview` é o teste de validação local. Se aparecer erro durante o render, verifique se há incompatibilidade no nome de colunas dos arquivos CSV ou falta de pacotes no ambiente R.

---

## 1. Instalação de Requisitos (uma vez só)

1. **R**: [https://cran.r-project.org](https://cran.r-project.org)
2. **RStudio**: [https://posit.co/download/rstudio-desktop](https://posit.co/download/rstudio-desktop) (já traz o Quarto embutido) ou o [Quarto CLI](https://quarto.org/docs/get-started) avulso.
3. No console do R, instale as dependências executando:

```r
install.packages(c("readr", "dplyr", "htmltools", "DT", "plotly", "yaml", "knitr", "rmarkdown"))
```

---

## 2. Visualização Local (Preview)

Abra o projeto no RStudio ou VS Code e execute no **Terminal**:

```bash
quarto preview
```

O site abrirá automaticamente no navegador em `http://localhost:6971` e **recarregará sozinho** a cada alteração salva. Para encerrar a visualização: pressione **`Ctrl + C`** no terminal.

Para compilar a versão final antes da publicação:
```bash
quarto render
```
> Os arquivos finais gerados para publicação ficam na pasta `docs/`.

---

## 3. Mapa de Arquivos da Estrutura

| Arquivo / Pasta | Para que serve | Frequência de edição |
|---|---|---|
| `data/*.csv` | **Todo o conteúdo dinâmico** (linhas, equipe, projetos, publicações, agenda, notícias, defesas, disciplinas, livros, vídeos, sites, episódios, apoio) | **Alta (Sempre)** |
| `img/galeria/`, `img/noticias/`, `img/pesquisas/` | Fotos da faixa do topo, das notícias e dos cartões "Pesquisas" | Alta |
| `img/equipe/` | Fotos dos integrantes (o nome do arquivo é referenciado na coluna `foto` do `equipe.csv`) | Alta |
| `_variables.yml` | Textos curtos e globais: nome do grupo, resumo, missão, e-mail, Instagram, links | Média |
| `img/` | Logos gerais e fotos institucionais | Média |
| `_quarto.yml` | Configuração de menu, rodapé e estrutura temática | Baixa |
| `custom.scss` | Definições de cores principais e tipografia | Baixa |
| `styles.css` | Regras CSS de layout (cartões, hero, responsividade para celular, logos) | Baixa |
| `*.qmd` | Páginas estruturais do site (`index.qmd` = página inicial) | Baixa |
| `R/helpers.R` | Script R que lê os CSVs e gera os componentes HTML (`cartoes`, `tem`...) | Baixa (apenas para novas funções) |
| `topo.html` | Faixa do topo com logo e nome do grupo | Baixa |
| `lupa.html` | Script visual da animação da lente | Rara |

---

## 4. Regras Fundamentais para Arquivos CSV (`data/`)

1. **Texto com vírgula SEMPRE entre aspas:** Exemplo: `"SILVA, A.; SOUZA, B."`.
2. **Cabeçalho intocável:** A primeira linha do CSV contém os nomes das colunas. Nunca os renomeie.
3. **Novos registros:** Para adicionar itens, copie uma linha existente, cole no final e substitua os dados.
4. **Codificação UTF-8 Obrigatória:** Salve sempre como **CSV UTF-8** (No Excel: *Salvar como → CSV UTF-8 (delimitado por vírgulas) (*.csv)*).
5. **Formato de Datas:** Utilize sempre o padrão ISO `AAAA-MM-DD` (ex.: `2026-10-25`).
6. **Campos Opcionais:** Podem ficar em branco. O site oculta automaticamente links ou imagens inexistentes.

---

## 5. Guia Prático de Tarefas

| O que você deseja fazer? | O que editar | Observações |
|---|---|---|
| Inserir **fotos na galeria do topo** | `data/galeria.csv` + arquivos em `img/galeria/` | Caso fique sem fotos, o topo exibe o padrão verde institucional |
| Adicionar uma **notícia** | `data/noticias.csv` | A coluna `imagem` recebe o nome do arquivo na pasta `img/noticias/`. A `categoria` agrupa os conteúdos automaticamente |
| Adicionar um **evento** na agenda | `data/eventos.csv` | Definir o `tipo` (ex: Aula aberta, Workshop, Curso) |
| Registrar **defesa ou qualificação** | `data/defesas.csv` | Preencher `nivel` (Mestrado/Doutorado) e `etapa` (Defesa/Qualificação) |
| Incluir episódio do **GPENSC no Ar** | `data/noar.csv` | A coluna `obs` é de controle interno e não aparece no site público |
| Cadastrar **linha de pesquisa** | `data/linhas.csv` | O `id` (ex: L1, L2) faz a vinculação com projetos e artigos |
| Adicionar **membro da equipe** | `data/equipe.csv` | `papel` pode ser: Coordenação, Docente, Doutorando(a), Mestrando(a), Graduando(a) ou Egresso(a). Fotos vão em `img/equipe/` |
| Cadastrar **disciplina** | `data/disciplinas.csv` | `nivel` separa Graduação e Pós-graduação em seções distintas |
| Inserir **projeto de pesquisa ou extensão** | `data/projetos.csv` | `tipo` = Pesquisa ou Extensão. Projetos com `situacao` = `Em andamento` entram na contagem automática da página inicial |
| Inserir **publicação/artigo** | `data/publicacoes.csv` | A referência bibliográfica é formatada automaticamente. O campo `doi` gera link direto |
| Adicionar **logo de parceiro/apoio** | `data/apoio.csv` + imagem em `img/` | Utilize imagens PNG com fundo transparente |
| Alterar **e-mail, redes ou missão** | `_variables.yml` e `_quarto.yml` | Atualizar e-mail/rodapé em ambos os arquivos YAML quando alterado |

---

## 6. Criar uma Nova Página Passo a Passo

1. Crie um arquivo com extensão `.qmd` (ex: `minhapagina.qmd`):

```markdown
---
title: "Título da Página"
---

```{r}
source("R/helpers.R")
```

Texto institucional ou em Markdown aqui. Use `##` para subtítulos.
```

2. Adicione a página ao menu no `_quarto.yml`:

```yaml
      - href: minhapagina.qmd
        text: Minha Página
```

3. Para exibir dados de um CSV novo:
   - Crie `data/minha.csv` com cabeçalho na linha 1;
   - Em `R/helpers.R`, inclua `minha <- ler("minha.csv")`;
   - Na página `.qmd`, renderize o conteúdo:

```markdown
```{r}
cartoes(minha, function(x, i)
  div(class = paste("cartao reveal", cor_de(i)),
    h4(x$titulo),
    p(x$descricao)))
```
```

---

## 7. Sintaxe Rápida de Markdown e Quarto

- **Formatos:** `# Título 1`, `## Título 2`, `**negrito**`, `*itálico*`, `[Link](https://url.com)`.
- **Blocos R:** Iniciados com ` ```{r} ` e finalizados com ` ``` `.
- **Containers CSS (Divs):** `::: {.classe-css}` ... `:::` cria blocos estilizados.
- **Efeito Reveal:** A classe `reveal` faz elementos aparecerem de forma suave na rolagem.

---

## 8. Publicação e Deploy (GitHub Pages)

Após realizar as alterações locais e validar no `quarto preview`:

1. Gere o build final:
   ```cmd
   quarto render
   ```
2. Envie os arquivos atualizados para o repositório remoto:
   ```cmd
   git add .
   git commit -m "Atualiza dados e páginas do site"
   git push
   ```

---

## 9. Diagnóstico e Resolução de Erros

| Sintoma de Erro | Causa Provável | Ação de Correção |
|---|---|---|
| Acentos quebrados (`Ã§`, `<f3>`) | CSV salvo na codificação ANSI/Latin-1 | Abra no Bloco de Notas ou VS Code e salve explicitamente como **CSV UTF-8** |
| Erro de parse no `quarto render` | Texto com vírgula fora de aspas no CSV | Adicione aspas no texto (ex: `"Autor, A.; Autor, B."`) |
| `object 'xxx' not found` | Nome de coluna incorreto no CSV | Compare o cabeçalho do arquivo CSV com as chamadas no script R |
| `there is no package called 'xxx'` | Pacote R ausente | Rode `install.packages("nome_do_pacote")` no console do R |
| Imagem quebrada no site | Divergência no nome do arquivo | Verifique maiúsculas/minúsculas e extensão da imagem em `img/` |
| Erro de compilação YAML | Indentação com TAB ou incorreta | Utilize exatamente 2 espaços para indentação em arquivos `.yml` |

---

## 10. Checklist Antes de Publicar

- [ ] Substituir dados demonstrativos ou marcadores `[EXEMPLO]` por textos definitivos.
- [ ] Confirmar links das redes sociais, e-mail institucional e endereço no rodapé.
- [ ] Validar a exibição em dispositivos móveis (responsividade de logos e bandeiras).
- [ ] Otimizar imagens grandes na pasta `img/` para rápido carregamento da página.