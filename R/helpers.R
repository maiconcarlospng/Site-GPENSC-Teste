# =====================================================================
# R/helpers.R – "CAIXA DE FERRAMENTAS" DO SITE
# Toda página .qmd começa com:  source("R/helpers.R")
# Este arquivo faz 3 coisas:
#   1) carrega os pacotes
#   2) lê os CSVs da pasta data/ (cada CSV vira uma "tabela" no R)
#   3) define funções que desenham pedaços de página (cartões, galeria...)
# Comentários em R começam com #
# =====================================================================

# ---- 1) PACOTES --------------------------------------------------------
suppressPackageStartupMessages({
  library(readr)      # ler CSV
  library(dplyr)      # filtrar/ordenar tabelas (filter, arrange, count...)
  library(htmltools)  # montar HTML pelo R (div, p, h4, tags$a...)
  library(DT)         # tabelas com busca e filtro (datatable)
  library(plotly)     # gráficos interativos
  library(yaml)       # ler o _variables.yml
})

# Lê _variables.yml. Uso: cfg$email, cfg$instagram ...
cfg <- yaml::read_yaml("_variables.yml")

# ---- 2) LEITURA DOS DADOS ---------------------------------------------
# ler("arquivo.csv") lê data/arquivo.csv em UTF-8 (acentos corretos).
ler <- function(arq) {
  readr::read_csv(file.path("data", arq), show_col_types = FALSE,
                  locale = readr::locale(encoding = "UTF-8"))
}

# >>> PARA CRIAR UMA TABELA NOVA: crie data/minha.csv e adicione:  minha <- ler("minha.csv")
linhas      <- ler("linhas.csv")        # linhas de pesquisa
equipe      <- ler("equipe.csv")        # integrantes
projetos    <- ler("projetos.csv")      # projetos de pesquisa e extensão
pubs        <- ler("publicacoes.csv")   # produção científica
eventos     <- ler("eventos.csv")       # agenda
noticias    <- ler("noticias.csv")      # notícias
defesas     <- ler("defesas.csv")       # defesas e qualificações
noar        <- ler("noar.csv")          # episódios do GPENSC no Ar
apoio       <- ler("apoio.csv")         # logos de apoio e vínculos
disciplinas <- ler("disciplinas.csv")   # disciplinas
livros      <- ler("livros.csv")        # livros
videos      <- ler("videos.csv")        # vídeos
sites       <- ler("sites.csv")         # sites recomendados
galeria     <- ler("galeria.csv")       # fotos da faixa do topo da home

# Cria a coluna "referencia" (texto da referência bibliográfica) automaticamente.
pubs <- pubs |>
  mutate(referencia = paste0(autores, ". ", titulo, ". ", veiculo, ", ", ano, "."))

# ---- 3) FUNÇÕES AUXILIARES --------------------------------------------

# tem(x): TRUE se o campo está preenchido (não vazio e não NA).
tem <- function(x) !is.na(x) && nzchar(x)

# link_pub(): "DOI" se houver DOI; senão "Acessar" se houver URL.
link_pub <- function(doi, url) {
  if (tem(doi)) tags$a("DOI", href = paste0("https://doi.org/", doi), target = "_blank")
  else if (tem(url)) tags$a("Acessar", href = url, target = "_blank")
}

# Tradução da tabela DT (busca, paginação) para português.
DT_PT <- list(url = "https://cdn.datatables.net/plug-ins/1.13.6/i18n/pt-BR.json")

# cor_de(i): alterna a cor (cor-1 verde, cor-2 laranja, cor-3 vermelho). Visual no styles.css.
cor_de <- function(i) paste0("cor-", ((i - 1) %% 3) + 1)

# cartoes(tabela, funcao): percorre cada linha da tabela e chama funcao(linha, i)
# para desenhar um cartão. Exemplo:
#   cartoes(linhas, function(l, i) div(class = "cartao", h4(l$nome), p(l$descricao)))
cartoes <- function(df, fn) {
  div(class = "cartoes", lapply(seq_len(nrow(df)), function(i) fn(df[i, ], i)))
}

# grade(tabela, funcao): igual a cartoes(), mas em grade de 5 colunas (pesquisadores).
grade <- function(df, fn) {
  div(class = "grade", lapply(seq_len(nrow(df)), function(i) fn(df[i, ], i)))
}

# ---------- FAIXA DO TOPO DA HOME (estilo Bertha) ----------
# Se houver fotos em data/galeria.csv: mostra as fotos lado a lado (rolagem horizontal).
# Se não houver: mostra o bloco verde com a sigla, o nome do grupo e a LENTE DA LUPA.
# A classe "lupa-area" liga a lente que segue o mouse (veja lupa.html).
faixa_galeria <- function() {
  fotos <- galeria[!is.na(galeria$arquivo) & nzchar(galeria$arquivo), ]
  if (nrow(fotos) > 0) {
    div(class = "galeria lupa-area",
      div(class = "galeria-faixa",
        lapply(seq_len(nrow(fotos)), function(i)
          tags$img(src = file.path("img", "galeria", fotos$arquivo[i]),
                   alt = if (tem(fotos$legenda[i])) fotos$legenda[i] else "Foto do grupo"))))
  } else {
    div(class = "hero lupa-area",
      div(class = "hero-texto",
        span(class = "hero-sigla", cfg$sigla),
        div(class = "hero-titulo", cfg$nome_completo),
        div(class = "hero-inst", cfg$instituicao)),
      tags$img(src = "img/logo_gpensc.png", class = "hero-logo", alt = "Logo do GPENSC"))
  }
}

# ---------- BLOCO "SOBRE" DA HOME: logo à esquerda, texto à direita ----------
bloco_intro <- function() {
  div(class = "intro reveal",
    tags$img(src = "img/logo_gpensc.png", alt = "Logo do GPENSC", class = "intro-logo"),
    div(class = "intro-texto",
      p(cfg$resumo),
      tags$a(class = "btn btn-secondary", href = "sobre.html", "Sobre nós")))
}

# ---------- CARTÕES "PESQUISAS" (foto tingida com cor + título) ----------
# card_pesq("Título", "pagina.html", "arquivo.jpg", "cor-1")
# Se a foto existir em img/pesquisas/, ela aparece por baixo da tinta colorida.
card_pesq <- function(titulo, href, arquivo, classe) {
  caminho <- file.path("img", "pesquisas", arquivo)
  estilo <- if (file.exists(caminho)) paste0("background-image:url(", caminho, ");") else NULL
  tags$a(class = paste("pq", classe), href = href, style = estilo,
         div(class = "pq-tinta"),
         span(class = "pq-titulo", titulo))
}

# ---------- NOTÍCIAS ----------
# Cartão no estilo Bertha: imagem no alto, selo de categoria, logo redonda sobreposta,
# título, "LEIA MAIS »" e data no rodapé do cartão.
cartao_noticia <- function(n, i) {
  img_estilo <- if (tem(n$imagem)) paste0("background-image:url(img/noticias/", n$imagem, ");") else NULL
  div(class = paste("nt reveal", cor_de(i)),
    div(class = "nt-img", style = img_estilo,
      span(class = "nt-cat", n$categoria),
      tags$img(class = "nt-avatar", src = "img/logo_gpensc.png", alt = "")),
    div(class = "nt-corpo",
      h4(n$titulo),
      if (tem(n$url)) tags$a(class = "nt-mais", href = n$url, target = "_blank", "LEIA MAIS »")),
    div(class = "nt-data", format(n$data, "%d/%m/%Y")))
}

# ---------- LOGOS DE APOIO ----------
faixa_apoio <- function(titulo = "Apoio e vínculos institucionais") {
  div(class = "parceiros reveal",
    tags$small(titulo),
    lapply(seq_len(nrow(apoio)), function(i)
      tags$a(href = apoio$url[i], target = "_blank", title = apoio$nome[i],
             tags$img(src = file.path("img", apoio$logo[i]), alt = paste("Logo:", apoio$nome[i])))))
}

# ---------- PESSOAS ----------
# iniciais("Maria da Silva") -> "MS"  (usado quando a pessoa não tem foto)
iniciais <- function(nome) {
  p <- strsplit(trimws(gsub("\\[[^]]*\\]", "", nome)), "\\s+")[[1]]
  p <- p[nzchar(p)]
  if (length(p) == 0) return("?")
  toupper(paste0(substr(p[1], 1, 1), if (length(p) > 1) substr(p[length(p)], 1, 1)))
}

# foto_pessoa(): foto redonda (img/equipe/arquivo) ou círculo com as iniciais.
foto_pessoa <- function(nome, foto) {
  if (tem(foto)) tags$img(class = "foto", src = file.path("img", "equipe", foto),
                          alt = paste("Foto de", nome))
  else div(class = "foto avatar", iniciais(nome))
}

# cartao_coord(): coordenação (estilo Espaço e Poder): foto grande à esquerda,
# nome, mini-bio e botão "SAIBA MAIS" (leva ao Lattes).
cartao_coord <- function(e, i) {
  div(class = "coord reveal",
    foto_pessoa(e$nome, e$foto),
    div(class = "coord-texto",
      h4(e$nome),
      p(e$formacao),
      if (tem(e$lattes)) tags$a(class = "btn btn-secondary btn-sm", href = e$lattes,
                                target = "_blank", "Saiba mais")))
}

# cartao_pesq(): pesquisador (foto redonda grande + nome em negrito + links).
cartao_pesq <- function(e, i) {
  div(class = "pesq reveal",
    foto_pessoa(e$nome, e$foto),
    h5(e$nome),
    if (tem(e$lattes)) tags$a("Lattes", href = e$lattes, target = "_blank"),
    if (tem(e$orcid)) tags$a("ORCID", href = paste0("https://orcid.org/", e$orcid),
                             target = "_blank", style = "margin-left:.6rem"))
}
