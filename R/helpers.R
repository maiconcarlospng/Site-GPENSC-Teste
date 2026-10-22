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

# Controles do painel: uma chave ausente mantém a seção visível por compatibilidade.
secao_ativa <- function(chave) {
  valor <- cfg[[chave]]
  is.null(valor) || isTRUE(valor)
}

# ---- 2) LEITURA DOS DADOS ---------------------------------------------
# COLUNAS: lista de campos de cada tabela. Tem que bater com os campos do
# painel (admin/config.yml). Se você criar um campo novo lá, acrescente aqui.
COLUNAS <- list(
  noticias    = c("data", "categoria", "titulo", "resumo", "conteudo", "url", "imagem"),
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

# Aceita datas atuais em ISO e formatos legados comuns no painel.
# A saída é sempre Date; entradas inválidas ficam como NA sem interromper o site.
parse_data_site <- function(x) {
  valores <- substr(trimws(as.character(x)), 1, 10)
  resultado <- as.Date(rep(NA_character_, length(valores)))

  for (formato in c("%Y-%m-%d", "%Y/%m/%d", "%d/%m/%Y")) {
    pendentes <- which(is.na(resultado) & !is.na(valores) & nzchar(valores))
    if (length(pendentes)) {
      resultado[pendentes] <- suppressWarnings(
        as.Date(valores[pendentes], format = formato)
      )
    }
  }

  resultado
}

# ler("noticias.csv") ou ler("noticias") -> lê data/noticias.yml
# (aceito o nome com .csv só para as páginas antigas continuarem funcionando)
ler <- function(arq) {
  nome    <- sub("\\.(csv|yml)$", "", arq)
  caminho <- file.path("data", paste0(nome, ".yml"))
  colunas <- COLUNAS[[nome]]

  # Falha no build em vez de mostrar dados antigos sem avisar.
  if (!file.exists(caminho)) stop("Não encontrei o arquivo: ", caminho)
  if (is.null(colunas)) stop("A tabela '", nome, "' não está na lista COLUNAS (helpers.R).")

  itens <- yaml::read_yaml(caminho)$itens

  # Tabela vazia (nenhum item cadastrado ainda): devolve só os cabeçalhos.
  if (is.null(itens) || length(itens) == 0) {
    df <- dplyr::as_tibble(setNames(rep(list(character()), length(colunas)), colunas))
  } else {
    # Cada item do YAML vira uma linha; campo ausente ou vazio vira NA.
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

  # Ajustes de tipo: data vira Date, ano vira número.
  if ("data" %in% names(df)) df$data <- parse_data_site(df$data)
  if ("ano"  %in% names(df)) df$ano  <- suppressWarnings(as.integer(df$ano))

  message("[ler] ", nome, ": ", nrow(df), " registro(s)")
  df
}

# >>> PARA CRIAR UMA TABELA NOVA: crie o campo no admin/config.yml, acrescente
#     o nome e as colunas em COLUNAS (acima) e adicione: minha <- ler("minha")
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
tem <- function(x) length(x) > 0 && !is.na(x[1]) && nzchar(trimws(as.character(x[1])))

# Remove registros de demonstração da exibição pública sem apagar os dados do CMS.
# As linhas continuam editáveis no painel; ao trocar o título por um real, aparecem no site.
registros_reais <- function(df, campo = "titulo") {
  if (is.null(df) || nrow(df) == 0 || !campo %in% names(df)) return(df)

  texto <- trimws(as.character(df[[campo]]))
  valido <- !is.na(texto) & nzchar(texto)
  demonstracao <- grepl(
    "^(\\[EXEMPLO\\]|EXEMPLO\\s*:|TESTE\\b|___)",
    texto,
    ignore.case = TRUE,
    perl = TRUE
  )

  df[valido & !demonstracao, , drop = FALSE]
}

# Devolve NULL para campos vazios ou com marcadores de preenchimento.
valor_publico <- function(x) {
  if (length(x) == 0 || is.null(x) || is.na(x[1])) return(NULL)
  valor <- trimws(as.character(x[1]))
  if (!nzchar(valor) || grepl("^(\\[.*\\]|TESTE\\b|___)", valor, ignore.case = TRUE, perl = TRUE)) {
    return(NULL)
  }
  valor
}

# Cartão neutro de estado vazio, reutilizado nas páginas que ainda não têm conteúdo real.
estado_vazio <- function(titulo, descricao, link_texto = NULL, link_href = NULL) {
  link <- NULL
  if (tem(link_texto) && tem(link_href)) {
    href <- as.character(link_href[1])
    if (grepl("^https?://", href, ignore.case = TRUE)) {
      link <- tags$a(
        class = "btn btn-secondary",
        href = href,
        target = "_blank",
        rel = "noopener noreferrer",
        link_texto
      )
    } else {
      link <- tags$a(class = "btn btn-secondary", href = href, link_texto)
    }
  }

  div(
    class = "estado-vazio",
    div(class = "estado-vazio-icone", tags$i(class = "bi bi-info-circle", `aria-hidden` = "true")),
    div(
      class = "estado-vazio-texto",
      h3(titulo),
      p(descricao),
      link
    )
  )
}

# caminho_img(valor, pasta): devolve o caminho certo de uma imagem.
# Aceita caminho salvo pelo CMS como "img/foto.jpg", caminho relativo como
# "foto.jpg" e URL externa. Para nomes simples, procura em img/<pasta>/.
caminho_img <- function(valor, pasta = "") {
  if (is.null(valor) || length(valor) == 0 || is.na(valor[1]) || !nzchar(trimws(as.character(valor[1])))) {
    return("")
  }
  valor <- trimws(as.character(valor[1]))
  if (grepl("^/?img/|^https?://", valor)) sub("^/", "", valor)
  else if (nzchar(pasta)) file.path("img", pasta, valor)
  else file.path("img", valor)
}

# link_pub(): "DOI" se houver DOI; senão "Acessar" se houver URL.
link_pub <- function(doi, url) {
  if (tem(doi)) tags$a("DOI", href = paste0("https://doi.org/", doi), target = "_blank", rel = "noopener")
  else if (tem(url)) tags$a("Acessar", href = url, target = "_blank", rel = "noopener")
}

# Tradução da tabela DT (busca, paginação) para português.
DT_PT <- list(url = "https://cdn.datatables.net/plug-ins/1.13.6/i18n/pt-BR.json")

# cor_de(i): alterna a cor (cor-1 verde, cor-2 laranja, cor-3 vermelho). Visual no styles.css.
cor_de <- function(i) paste0("cor-", ((i - 1) %% 3) + 1)

# cartoes(tabela, funcao): percorre cada linha da tabela e chama funcao(linha, i).
cartoes <- function(df, fn) {
  div(class = "cartoes", lapply(seq_len(nrow(df)), function(i) fn(df[i, ], i)))
}

# grade(tabela, funcao): igual a cartoes(), mas em grade de pesquisadores.
grade <- function(df, fn) {
  div(class = "grade", lapply(seq_len(nrow(df)), function(i) fn(df[i, ], i)))
}

# ---------- FAIXA DO TOPO DA HOME / GALERIA DE FOTOS ----------
# A galeria continua sendo controlada por data/galeria.yml no Sveltia CMS.
# Cada item tem os campos "arquivo" e "legenda".
# Se não houver fotos cadastradas, mostra o bloco verde institucional.
faixa_galeria <- function() {
  fotos <- galeria[
    !is.na(galeria$arquivo) & nzchar(trimws(galeria$arquivo)),
    , drop = FALSE
  ]

  # A faixa verde institucional permanece na página inicial mesmo quando
  # a galeria contém fotos; a sequência de imagens fica logo abaixo dela.
  hero <- div(
    class = "hero lupa-area",
    div(
      class = "hero-texto",
      span(class = "hero-sigla", cfg$sigla),
      div(class = "hero-titulo", cfg$nome_completo),
      div(class = "hero-inst", cfg$instituicao)
    ),
    tags$img(
      src = "img/logo_gpensc.png",
      class = "hero-logo",
      alt = "Logo do GPENSC"
    )
  )

  if (nrow(fotos) > 0) {
    faixa_fotos <- div(
      class = "galeria lupa-area",
      div(
        class = "galeria-faixa",
        lapply(seq_len(nrow(fotos)), function(i) {
          arquivo <- caminho_img(fotos$arquivo[i], "galeria")
          legenda <- fotos$legenda[i]
          alt_texto <- if (tem(legenda)) as.character(legenda) else "Foto do grupo GPENSC"

          tags$img(
            src = arquivo,
            alt = alt_texto,
            loading = "lazy"
          )
        })
      )
    )

    htmltools::tagList(hero, faixa_fotos)
  } else {
    hero
  }
}

bloco_intro <- function() {
  # O texto de apresentação e o botão continuam, mas a foto grande da equipe
  # foi removida daqui; as fotos ficam na faixa/carrossel acima.
  div(
    class = "intro reveal",
    div(
      class = "intro-texto",
      p(cfg$resumo),
      tags$a(class = "btn btn-secondary", href = "sobre.html", cfg$botao_sobre)
    )
  )
}


# ---------- CARTÕES "PESQUISAS" ----------
card_pesq <- function(titulo, href, arquivo, classe, icone = NULL) {
  # Os cartões usam ícones Bootstrap em vez de imagens de fundo.
  # O argumento 'arquivo' é mantido para preservar as chamadas existentes.
  tags$a(
    class = paste("pq", classe),
    href = href,
    `aria-label` = titulo,
    div(class = "pq-tinta", `aria-hidden` = "true"),
    div(
      class = "pq-conteudo",
      if (!is.null(icone)) tags$i(
        class = paste("bi", icone, "pq-icone"),
        `aria-hidden` = "true"
      ),
      span(class = "pq-titulo", titulo)
    )
  )
}

# ---------- NOTÍCIAS ----------
# O link "LEIA MAIS" só aparece se a notícia tiver o campo Link preenchido.
id_noticia <- function(titulo) {
  valor <- as.character(titulo[1])
  if (is.na(valor) || !nzchar(trimws(valor))) valor <- "noticia"

  valor_ascii <- iconv(valor, from = "", to = "ASCII//TRANSLIT")
  if (is.na(valor_ascii) || !nzchar(trimws(valor_ascii))) valor_ascii <- valor

  slug <- tolower(gsub("[^a-z0-9]+", "-", valor_ascii))
  slug <- gsub("(^-+|-+$)", "", slug)
  if (!nzchar(slug)) slug <- "noticia"

  paste0("noticia-", slug)
}

cartao_noticia <- function(n, i) {
  img_src <- if (tem(n$imagem)) caminho_img(n$imagem, "noticias") else "img/noticias/noticia_padrao.jpg"
  img_estilo <- paste0("background-image: url('", img_src, "');")
  detalhe_href <- paste0("noticia.html#", id_noticia(n$titulo))

  div(
    class = paste("nt reveal", cor_de(i)),
    div(
      class = "nt-img",
      style = img_estilo,
      if (tem(n$categoria)) span(
        class = "nt-cat",
        style = "background-color: rgba(0, 0, 0, 0.75); color: #ffffff !important; padding: 4px 10px; border-radius: 6px; margin: 8px; display: inline-block; font-weight: bold; font-size: 0.8rem;",
        n$categoria
      )
    ),
    div(
      class = "nt-corpo",
      h4(tags$a(class = "nt-titulo-link", href = detalhe_href, n$titulo)),
      if (tem(n$resumo)) p(class = "nt-resumo", n$resumo),
      tags$a(
        class = "nt-mais",
        href = detalhe_href,
        "VER DETALHAMENTO »"
      )
    ),
    div(class = "nt-data", if (!is.na(n$data)) format(n$data, "%d/%m/%Y"))
  )
}

# ---------- LOGOS DE APOIO ----------
faixa_apoio <- function(titulo = "Apoio e vínculos institucionais") {
  div(
    class = "parceiros reveal",
    tags$small(titulo),
    lapply(seq_len(nrow(apoio)), function(i) {
      tags$a(
        href = if (tem(apoio$url[i])) apoio$url[i] else NULL,
        target = "_blank",
        rel = "noopener",
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
# iniciais("Maria da Silva") -> "MS" (usado quando a pessoa não tem foto).
iniciais <- function(nome) {
  p <- strsplit(trimws(gsub("\\[[^]]*\\]", "", nome)), "\\s+")[[1]]
  p <- p[nzchar(p)]
  if (length(p) == 0) return("?")
  toupper(paste0(substr(p[1], 1, 1), if (length(p) > 1) substr(p[length(p)], 1, 1)))
}

# foto_pessoa(): foto redonda ou círculo com as iniciais.
foto_pessoa <- function(nome, foto) {
  if (tem(foto)) {
    tags$img(class = "foto", src = caminho_img(foto, "equipe"), alt = paste("Foto de", nome))
  } else {
    div(class = "foto avatar", iniciais(nome))
  }
}

# cartao_coord(): coordenação (foto grande à esquerda, nome, mini-bio e botão Saiba mais).
cartao_coord <- function(e, i) {
  div(
    class = "coord reveal",
    foto_pessoa(e$nome, e$foto),
    div(
      class = "coord-texto",
      h4(e$nome),
      p(e$formacao),
      if (tem(e$lattes)) tags$a(
        class = "btn btn-secondary btn-sm", href = e$lattes,
        target = "_blank", rel = "noopener", "Saiba mais"
      )
    )
  )
}

# cartao_pesq(): pesquisador (foto redonda grande + nome em negrito + links).
cartao_pesq <- function(e, i) {
  div(
    class = "pesq reveal",
    foto_pessoa(e$nome, e$foto),
    h5(e$nome),
    if (tem(e$lattes)) tags$a("Lattes", href = e$lattes, target = "_blank", rel = "noopener"),
    if (tem(e$orcid)) tags$a(
      "ORCID", href = paste0("https://orcid.org/", e$orcid),
      target = "_blank", rel = "noopener", style = "margin-left:.6rem"
    )
  )
}
