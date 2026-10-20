# Site do GPENSC – UFOP (Quarto)

**Comece por `COMO-EDITAR.md`** (guia passo a passo, para iniciantes).

Site estático feito em Quarto + R. Não precisa de servidor.

## Requisitos
- [Quarto](https://quarto.org/docs/get-started/) (1.4 ou superior)
- R com os pacotes: `readr dplyr htmltools DT plotly yaml knitr rmarkdown`

```r
install.packages(c("readr", "dplyr", "htmltools", "DT", "plotly", "yaml", "knitr", "rmarkdown"))
```

## Usar
```bash
quarto preview     # abre o site local, atualiza ao salvar
quarto render      # gera o site final na pasta docs/
```

## Publicar (grátis, GitHub Pages)
```bash
quarto publish gh-pages
```

## Onde editar
| Arquivo | Conteúdo |
|---|---|
| `_variables.yml` | Nome completo, resumo, histórico, missão, objetivos, contato, links |
| `data/linhas.csv` | Linhas de pesquisa |
| `data/equipe.csv` | Integrantes (Lattes, ORCID) |
| `data/projetos.csv` | Projetos |
| `data/publicacoes.csv` | Produção científica (DOI/URL opcionais) |
| `data/eventos.csv` | Agenda (aulas abertas, workshops, cursos) |
| `data/defesas.csv` | Defesas e qualificações |
| `data/noar.csv` | Episódios do GPENSC no Ar |
| `data/apoio.csv` | Logos de apoio e vínculos |
| `data/noticias.csv` | Notícias (com categoria e link) |
| `custom.scss` e `styles.css` | Cores, fontes e identidade visual |
| `img/` | Logos (troque por versões em alta resolução, mantendo os nomes) |

Tudo marcado como `[EXEMPLO]` ou `[preencher]` é placeholder.
Salve os CSVs em UTF-8 e use aspas em campos com vírgula (ex.: `"SILVA, A.; SOUZA, B."`).
O `linha_id` de projetos e publicações deve bater com o `id` em `linhas.csv`.

## Estrutura do site
Inspirada nos sites do Grupo Bertha (PUC Minas) e do Grupo Espaço e Poder (IPPUR/UFRJ), com a identidade visual e a lupa do GPENSC: Quem somos (coordenação e pesquisadores), Linhas, Pesquisa, Extensão, Disciplinas, Biblioteca virtual (teses, livros, vídeos, sites), Notícias, Agenda e Contato.
"# Site-teste-gpensc" 
