# =====================================================================
# R/helpers.R – "CAIXA DE FERRAMENTAS" DO SITE
# Toda página .qmd começa com:  source("R/helpers.R")
# Este arquivo faz 3 coisas:
#   1) carrega os pacotes
#   2) lê os dados da pasta data/ (arquivos .yml editados pelo painel /admin/)
#   3) define funções que desenham pedaços de página (cartões, galeria...)
# Comentários em R começam com #
# =====================================================================

# ---- 1) PACOTES --------------------------------------------------------
suppressPackageStartupMessages({
  library(readr)      # (mantido por compatibilidade com as páginas)
  library(dplyr)      # filtrar/ordenar tabelas (filter, arrange, count...)
  library(htmltools)  # montar HTML pelo R (div, p, h4, tags$a...)
  library(DT)         # tabelas com busca e filtro (datatable)
  library(plotly)     # gráficos interativos
  library(yaml)       # ler o _variables.yml e os dados em data/*.yml
})

# Lê _variables.yml. Uso: cfg$email, cfg$instagram ...
cfg <- yaml::read_yaml("_variables.yml")

# ---- 2) LEITURA DOS DADOS ---------------------------------------------
# COLUNAS: lista de campos de cada tabela. Tem que bater com os campos do
# painel (admin/config.yml). Se você criar um campo novo lá, acrescente aqui.
COLUNAS <- list(
  noticias    = c("data", "categoria", "titulo", "resumo", "url", "imagem"),
  eventos     = c("data", "tipo", "titulo", "local", "url"),
  equipe      = c("nome", "papel", "formacao", "foto", "lattes", "orcid"),
  linhas      = c("id", "nome", "descricao", "palavras_chave"),
  projetos    = c("titulo", "tipo", "situacao", "coordenador", "inicio", "fim",
                  "linha_id", "financiamento"),
  publicacoes = c("ano", "tipo", "autores", "titulo", "veiculo", "doi", "url", "linha_id"),
  livros      = c("ano", "titulo", "autores", "editora", "url"),
  defesas     = c("data", "nivel", "etapa", "autor", "titulo", "orientador", "url"),
  disciplinas = c("nivel", "codigo", "nome", "docente", "periodo", "ementa"),
  noar        = c("episodio", "titulo", "convidado", "data", "link", "obs"),
  videos      = c("data", "titulo", "descricao", "url"),
  sites       = c("nome", "descricao", "url"),
  apoio       = c("nome", "logo", "url"),
  galeria     = c("arquivo", "legenda")
)

# ler("noticias.csv") ou ler("noticias") -> lê data/noticias.yml
# (aceito o nome com .csv só para as páginas antigas continuarem funcionando)
ler <- function(arq) {
  nome    <- sub("\\.(csv|yml)$", "", arq)
  caminho <- file.path("data", paste0(nome, ".yml"))
  colunas <- COLUNAS[[nome]]

  # Falha ALTO (o build fica vermelho) em vez de mostrar dado antigo sem avisar
  if (!file.exists(caminho)) stop("Não encontrei o arquivo: ", caminho)
  if (is.null(colunas)) stop("A tabela '", nome, "' não está na lista COLUNAS (helpers.R).")

  itens <- yaml::read_yaml(caminho)$itens

  # Tabela vazia (nenhum item cadastrado ainda): devolve só os cabeçalhos
  if (is.null(itens) || length(itens) == 0) {
    df <- dplyr::as_tibble(setNames(rep(list(character()), length(colunas)), colunas))
  } else {
    # Cada item do YAML vira uma linha; campo ausente ou vazio vira NA
    linhas_df <- lapply(itens, function(x) {
      vals <- lapply(colunas, function(col) {
        v <- x[[col]]
        if (is.null(v) || length(v) == 0 || is.na(v[1])) return(NA_character_)
        v <- trimws(as.character(v[1]))
        if (nzchar(v)) v else NA_character_
      })
      names(vals) <- colunas
      dplyr::as_tibble(vals)
    })
    df <- dplyr::bind_rows(linhas_df)
  }

  # Ajustes de tipo: data vira Date, ano vira número
  if ("data" %in% names(df)) df$data <- as.Date(substr(df$data, 1, 10), format = "%Y-%m-%d")
  if ("ano"  %in% names(df)) df$ano  <- suppressWarnings(as.integer(df$ano))

  message("[ler] ", nome, ": ", nrow(df), " registro(s)")  # aparece no log do Actions
  df
}

# >>> PARA CRIAR UMA TABELA NOVA: crie o campo no admin/config.yml, acrescente
#     o nome e as colunas em COLUNAS (acima) e adicione:  minha <- ler("minha")
linhas      <- ler("linhas")        # linhas de pesquisa
equipe      <- ler("equipe")        # integrantes
projetos    <- ler("projetos")      # projetos de pesquisa e extensão
pubs        <- ler("publicacoes")   # produção científica
eventos     <- ler("eventos")       # agenda
noticias    <- ler("noticias")      # notícias
defesas     <- ler("defesas")       # defesas e qualificações
noar        <- ler("noar")          # episódios do GPENSC no Ar
apoio       <- ler("apoio")         # logos de apoio e vínculos
disciplinas <- ler("disciplinas")   # disciplinas
livros      <- ler("livros")        # livros
videos      <- ler("videos")        # vídeos
sites       <- ler("sites")         # sites recomendados
galeria     <- ler("galeria")       # fotos da faixa do topo da home

# Cria a coluna "referencia" (texto da referência bibliográfica) automaticamente.
pubs <- pubs |>
  mutate(referencia = paste0(autores, ". ", titulo, ". ", veiculo, ", ", ano, "."))

# ---- 3) FUNÇÕES AUXILIARES --------------------------------------------

# tem(x): TRUE se o campo está preenchido (não vazio e não NA).
tem <- function(x) !is.na(x) && nzchar(x)

# caminho_img(valor, pasta): devolve o caminho certo de uma imagem.
# O painel salva "img/foto.jpg"; planilhas antigas tinham só "foto.jpg".
# Os dois funcionam: se já começa com "img/", usa como está;
# senão procura dentro de img/<pasta>/.
caminho_img <- function(valor, pasta = "") {
  if (grepl("^/?img/|^https?://", valor)) sub("^/", "", valor)
  else if (nzchar(pasta)) file.path("img", pasta, valor)
  else file.path("img", valor)
}

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

# ---------- FAIXA DO TOPO DA HOME  ----------
# Se houver fotos em data/galeria.yml: mostra as fotos lado a lado (rolagem horizontal).
# Se não houver: mostra o bloco verde com a sigla, o nome do grupo e a LENTE DA LUPA.
# A classe "lupa-area" liga a lente que segue o mouse (veja lupa.html).
faixa_galeria <- function() {
  fotos <- galeria[!is.na(galeria$arquivo) & nzchar(galeria$arquivo), ]
  if (nrow(fotos) > 0) {
    div(class = "galeria lupa-area",
      div(class = "galeria-faixa",
        lapply(seq_len(nrow(fotos)), function(i)
          tags$img(src = caminho_img(fotos$arquivo[i], "galeria"),
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

# ---------- BLOCO "SOBRE" DA HOME: foto à esquerda, texto à direita ----------
bloco_intro <- function() {
  div(class = "intro reveal",
      tags$img(
        src = "img/equipe/equipe.jpg",
        alt = "Foto da Equipe GPENSC",
        style = "width: 100%; aspect-ratio: 16 / 9; object-fit: cover; object-position: center 60%; border-radius: 10px;"
      ),
      div(class = "intro-texto",
          p(cfg$resumo),
          tags$a(class = "btn btn-secondary", href = "sobre.html", "Sobre nós")
      )
  )
}

# ---------- CARTÕES "PESQUISAS" ----------
card_pesq <- function(titulo, href, arquivo, classe, icone = NULL) {
  caminho <- file.path("img", "pesquisas", arquivo)
  estilo <- if (!is.null(arquivo) && file.exists(caminho)) paste0("background-image:url(", caminho, ");") else NULL

  tags$a(
    class = paste("pq", classe),
    href = href,
    style = estilo,
    div(class = "pq-tinta"),
    div(
      class = "pq-conteudo",
      if (!is.null(icone)) tags$i(class = paste("bi", icone, "pq-icone")),
      span(class = "pq-titulo", titulo)
    )
  )
}

# ---------- NOTÍCIAS ----------
# O link "LEIA MAIS" só aparece se a notícia tiver o campo Link preenchido.
# No styles.css, a regra .nt-mais::after estende esse link sobre o cartão
# inteiro, então clicar em qualquer parte do cartão abre a notícia.
cartao_noticia <- function(n, i) {
  # Se a notícia tiver foto, usa ela. Senão, usa 'noticia_padrao.jpg'
  img_src <- if (tem(n$imagem)) caminho_img(n$imagem, "noticias") else "img/noticias/noticia_padrao.jpg"
  img_estilo <- paste0("background-image: url('", img_src, "');")

  div(class = paste("nt reveal", cor_de(i)),
      div(class = "nt-img", style = img_estilo,
          if (tem(n$categoria)) span(
            class = "nt-cat",
            style = "background-color: rgba(0, 0, 0, 0.75); color: #ffffff !important; padding: 4px 10px; border-radius: 6px; margin: 8px; display: inline-block; font-weight: bold; font-size: 0.8rem;",
            n$categoria
          )
      ),
      div(class = "nt-corpo",
          h4(n$titulo),
          if (tem(n$resumo)) p(class = "nt-resumo", n$resumo),
          if (tem(n$url)) tags$a(class = "nt-mais", href = n$url, target = "_blank",
                                 rel = "noopener", "LEIA MAIS »")
      ),
      div(class = "nt-data", if (!is.na(n$data)) format(n$data, "%d/%m/%Y"))
  )
}

# ---------- LOGOS DE APOIO ----------
faixa_apoio <- function(titulo = "Apoio e vínculos institucionais") {
  div(class = "parceiros reveal",
      tags$small(titulo),
      lapply(seq_len(nrow(apoio)), function(i) {
        tags$a(
          href = if (tem(apoio$url[i])) apoio$url[i] else NULL,
          target = "_blank",
          title = apoio$nome[i],
          tags$img(
            src = caminho_img(apoio$logo[i]),
            alt = paste("Logo:", apoio$nome[i]),
            style = "max-height: 70px; max-width: 180px; object-fit: contain;"
          )
        )
      })
  )
}

# ---------- PESSOAS ----------
# iniciais("Maria da Silva") -> "MS"  (usado quando a pessoa não tem foto)
iniciais <- function(nome) {
  p <- strsplit(trimws(gsub("\\[[^]]*\\]", "", nome)), "\\s+")[[1]]
  p <- p[nzchar(p)]
  if (length(p) == 0) return("?")
  toupper(paste0(substr(p[1], 1, 1), if (length(p) > 1) substr(p[length(p)], 1, 1)))
}

# foto_pessoa(): foto redonda ou círculo com as iniciais.
foto_pessoa <- function(nome, foto) {
  if (tem(foto)) tags$img(class = "foto", src = caminho_img(foto, "equipe"),
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
