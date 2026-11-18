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

# As configurações são editadas em arquivos temáticos pelo painel.
# _variables.yml continua como base de compatibilidade; os arquivos separados
# substituem suas chaves correspondentes sem mudar o formato usado pelas páginas.
diretorio_cfg <- file.path("data", "configuracoes")
arquivos_cfg <- if (dir.exists(diretorio_cfg)) {
  sort(list.files(diretorio_cfg, pattern = "\\.yml$", full.names = TRUE))
} else {
  character()
}

for (arquivo_cfg in arquivos_cfg) {
  valores_cfg <- yaml::read_yaml(arquivo_cfg)
  if (is.list(valores_cfg)) {
    for (chave_cfg in names(valores_cfg)) {
      cfg[[chave_cfg]] <- valores_cfg[[chave_cfg]]
    }
  }
}

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
  equipe      = c("nome", "categoria", "papel", "formacao", "email", "foto", "lattes", "orcid", "linhas_ids", "projetos_ids", "revisado_em"),
  linhas      = c("id", "nome", "descricao", "palavras_chave"),
  projetos    = c("id", "titulo", "tipo", "situacao", "coordenador", "inicio", "fim",
                  "linha_id", "financiamento", "url", "resumo", "imagem"),
  publicacoes = c("ano", "tipo", "autores", "titulo", "veiculo", "doi", "url", "linha_id", "projeto_id",
                  "resumo_publico", "aplicacao", "fonte_divulgacao"),
  livros      = c("ano", "titulo", "autores", "editora", "url"),
  defesas     = c("data", "nivel", "etapa", "autor", "titulo", "orientador", "url", "linha_id", "projeto_id"),
  disciplinas = c("nivel", "codigo", "nome", "docente", "periodo", "ementa"),
  videos      = c("data", "titulo", "descricao", "url", "imagem"),
  sites       = c("nome", "descricao", "url"),
  apoio       = c("nome", "logo", "url"),
  parcerias   = c("nome", "sigla", "uf", "cidade", "pais", "latitude", "longitude", "grupo", "logo", "url"),
  galeria     = c("arquivo", "legenda", "foco_x", "foco_y", "zoom")
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
        if (is.null(v) || length(v) == 0) return(NA_character_)

        # Relações múltiplas do CMS chegam como lista; são normalizadas
        # para IDs separados por "|" sem perder a associação dos registros.
        if (is.list(v)) v <- unlist(v, recursive = TRUE, use.names = FALSE)
        if (length(v) == 0 || all(is.na(v))) return(NA_character_)

        v <- trimws(as.character(v))
        v <- v[!is.na(v) & nzchar(v)]
        if (length(v) == 0) return(NA_character_)

        paste(unique(v), collapse = "|")
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
apoio       <- ler("apoio")         # logos de apoio e vínculos
parcerias   <- ler("parcerias")       # instituições parceiras registradas no CNPq
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
    "^(\\[EXEMPLO\\]|EXEMPLO\\s*:|NOME\\s+DE\\s+EXEMPLO\\b|TESTE\\b|___)",
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
      p(class = "estado-vazio-titulo", titulo),
      if (tem(descricao)) p(descricao),
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
faixa_galeria <- function(exibir = c("ambos", "hero", "fotos")) {
  exibir <- match.arg(exibir)
  fotos <- galeria[
    !is.na(galeria$arquivo) & nzchar(trimws(galeria$arquivo)),
    , drop = FALSE
  ]

  # A apresentação abre a home; as fotos podem ser exibidas mais abaixo.
  hero <- div(
    class = "hero lupa-area",
    div(
      class = "hero-texto",
      span(class = "hero-sigla", cfg$sigla),
      div(class = "hero-titulo", cfg$nome_completo),
      div(class = "hero-inst", cfg$instituicao),
      div(
        class = "hero-botoes",
        tags$a(
          href = "grupo.html#sobre",
          class = "btn hero-quem-somos",
          "Quem somos"
        )
      )
    )
  )

  if (exibir == "hero") return(hero)
  if (nrow(fotos) > 0) {
    faixa_fotos <- div(
      class = "galeria galeria--faixa lupa-area",
      `aria-label` = "Galeria de fotografias do GPENSC",
      div(
        class = "galeria-faixa",
        id = "gp-home-galeria-faixa",
        tabindex = "0",
        lapply(seq_len(nrow(fotos)), function(i) {
          arquivo <- caminho_img(fotos$arquivo[i], "galeria")
          legenda <- fotos$legenda[i]
          alt_texto <- if (tem(legenda)) as.character(legenda) else paste("Fotografia", i, "do GPENSC")

          # O painel salva o ponto focal (0–100) e o zoom (100–200%).
          # Fotos antigas sem esses campos continuam centralizadas por padrão.
          foco_x <- suppressWarnings(as.numeric(fotos$foco_x[i]))
          foco_y <- suppressWarnings(as.numeric(fotos$foco_y[i]))
          zoom <- suppressWarnings(as.numeric(fotos$zoom[i]))
          if (!length(foco_x) || is.na(foco_x)) foco_x <- 50
          if (!length(foco_y) || is.na(foco_y)) foco_y <- 50
          if (!length(zoom) || is.na(zoom)) zoom <- 100
          foco_x <- min(100, max(0, foco_x))
          foco_y <- min(100, max(0, foco_y))
          zoom <- min(200, max(100, zoom))

          div(
            class = "galeria-item",
            tags$img(
              src = arquivo,
              alt = alt_texto,
              style = paste0(
                "object-position: ", foco_x, "% ", foco_y, "%; ",
                "transform: scale(", zoom / 100, "); ",
                "transform-origin: ", foco_x, "% ", foco_y, "%;"
              ),
              loading = if (i == 1) "eager" else "lazy",
              decoding = "async"
            )
          )
        })
      )
    )

    if (exibir == "fotos") return(faixa_fotos)
    htmltools::tagList(hero, faixa_fotos)
  } else {
    if (exibir == "fotos") return(NULL)
    hero
  }
}

bloco_intro <- function() {
  # Apresentação única na home; as frentes de atuação ficam nas páginas internas.
  div(
    class = "intro intro--simples reveal",
    div(
      class = "intro-texto",
      p(class = "intro-resumo", cfg$resumo),
      div(
        class = "intro-acoes",
        tags$a(class = "btn btn-secondary", href = "grupo.html#sobre", "Conheça o GPENSC")
      )
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
id_noticia <- function(titulo, imagem = NULL) {
  if (tem(imagem) && grepl("^/?img/instagram-acervo/[A-Za-z0-9_-]+[.]webp$", imagem[1])) {
    return(paste0("registro-", tools::file_path_sans_ext(basename(imagem[1]))))
  }
  valor <- as.character(titulo[1])
  if (is.na(valor) || !nzchar(trimws(valor))) valor <- "noticia"

  valor_ascii <- iconv(valor, from = "", to = "ASCII//TRANSLIT")
  if (is.na(valor_ascii) || !nzchar(trimws(valor_ascii))) valor_ascii <- valor

  slug <- tolower(gsub("[^a-z0-9]+", "-", valor_ascii))
  slug <- gsub("(^-+|-+$)", "", slug)
  if (!nzchar(slug)) slug <- "noticia"

  paste0("noticia-", slug)
}

# Capas de notícias com imagem original e fallback por assunto.
# Não reutiliza fotografia genérica para registros distintos.
noticia_visual_categoria <- function(categoria) {
  categoria <- tolower(iconv(as.character(categoria)[1], to = "ASCII//TRANSLIT", sub = ""))
  if (is.na(categoria)) categoria <- ""
  if (grepl("internacion", categoria)) return(list(classe = "internacionalizacao", nome = "Internacionalização", icone = "globo"))
  if (grepl("ensino|curso|formacao", categoria)) return(list(classe = "ensino", nome = "Ensino", icone = "livro"))
  if (grepl("extens", categoria)) return(list(classe = "extensao", nome = "Extensão", icone = "comunidade"))
  if (grepl("pesquis", categoria)) return(list(classe = "pesquisa", nome = "Pesquisa", icone = "pesquisa"))
  if (grepl("divulg", categoria)) return(list(classe = "divulgacao", nome = "Divulgação científica", icone = "microfone"))
  if (grepl("institucional|histor", categoria)) return(list(classe = "institucional", nome = "GPENSC", icone = "folha"))
  list(classe = "geral", nome = "GPENSC", icone = "folha")
}

noticia_icone_svg <- function(icone) {
  paths <- switch(icone,
    livro = '<path d="M24 39V12M24 14C17 9 10 9 6 11v27c6-2 12-1 18 3M24 14c7-5 14-5 18-3v27c-6-2-12-1-18 3"/>',
    pesquisa = '<circle cx="22" cy="21" r="12"/><path d="M31 30l11 11M22 14v14M15 21h14"/>',
    comunidade = '<circle cx="16" cy="16" r="5"/><circle cx="33" cy="17" r="4"/><path d="M5 39v-5a11 11 0 0 1 22 0v5M29 28a9 9 0 0 1 14 8v3"/>',
    globo = '<circle cx="24" cy="24" r="18"/><path d="M6 24h36M24 6c-9 9-9 27 0 36M24 6c9 9 9 27 0 36"/>',
    microfone = '<rect x="17" y="6" width="14" height="25" rx="7"/><path d="M11 23c0 18 26 18 26 0M24 37v6m-8 0h16"/>',
    folha = '<path d="M8 36c-3-18 8-29 31-29 1 23-10 34-27 31M9 39c7-12 16-19 27-24"/>',
    '<path d="M8 36c-3-18 8-29 31-29 1 23-10 34-27 31M9 39c7-12 16-19 27-24"/>'
  )
  htmltools::HTML(paste0(
    '<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">',
    paths, '</svg>'
  ))
}

capa_noticia <- function(imagem, categoria, titulo, classe = "nt-img") {
  visual <- noticia_visual_categoria(categoria)
  src <- if (tem(imagem)) caminho_img(imagem, "noticias") else ""
  div(
    class = paste(classe, paste0("nt-img--", visual$classe)),
    div(class = "nt-fallback", `aria-hidden` = "true",
      div(class = "nt-fallback-icone", noticia_icone_svg(visual$icone)),
      span(class = "nt-fallback-label", visual$nome)),
    if (nzchar(src)) tags$img(
      class = "nt-photo", src = src, loading = "lazy", decoding = "async",
      alt = paste("Imagem da publicação:", as.character(titulo)[1]),
      onerror = "this.remove()"
    ),
    if (tem(categoria)) span(
      class = "nt-cat",
      style = "background-color: rgba(14, 31, 19, .82); color: #ffffff !important; padding: 4px 10px; border-radius: 5px; margin: 8px; display: inline-block; font-weight: 650; font-size: .78rem;",
      categoria
    )
  )
}

cartao_noticia <- function(n, i) {
  detalhe_href <- paste0("noticia.html#", id_noticia(n$titulo, n$imagem))
  div(
    class = paste("nt reveal", cor_de(i)),
    capa_noticia(n$imagem, n$categoria, n$titulo),
    div(
      class = "nt-corpo",
      h4(tags$a(class = "nt-titulo-link", href = detalhe_href, n$titulo)),
      if (tem(n$resumo)) p(class = "nt-resumo", n$resumo),
      tags$a(class = "nt-mais", href = detalhe_href, "Ler notícia")
    ),
    div(class = "nt-data", if (!is.na(n$data)) format(n$data, "%d/%m/%Y"))
  )
}



# Capa compacta de materiais e conteúdo audiovisual, com alternativa sem foto.
capa_conteudo <- function(imagem, titulo, tipo = "material") {
  tipo <- if (tipo %in% c("livro", "video", "material", "pesquisa")) tipo else "material"
  simbolo <- if (tipo == "video") "microfone" else if (tipo == "pesquisa") "pesquisa" else "livro"
  src <- if (tem(imagem)) caminho_img(imagem) else ""
  div(
    class = paste("gp-conteudo-capa", paste0("gp-conteudo-capa--", tipo)),
    span(class = "gp-conteudo-simbolo", `aria-hidden` = "true", noticia_icone_svg(simbolo)),
    if (nzchar(src)) tags$img(
      src = src, alt = paste("Imagem da publicação:", as.character(titulo)[1]),
      loading = "lazy", decoding = "async", onerror = "this.remove()"
    )
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


# Acervos editoriais: texto escapado e links HTTP(S).
renderizar_acervo <- function(nome, vazio) {
  itens <- yaml::read_yaml(file.path("data", paste0(nome, ".yml")))$itens
  if (is.null(itens) || !length(itens)) return(estado_vazio(vazio, NULL))
  div(class = "gp-acervo", lapply(itens, function(item) {
    tags$article(class = "gp-acervo-card",
      if (identical(nome, "materiais")) capa_conteudo(item$imagem, item$titulo, "material"),
      if (tem(item$tipo)) span(class = "gp-acervo-tipo", item$tipo),
      h3(item$titulo), p(item$resumo),
      if (tem(item$publico)) p(class = "gp-acervo-publico", paste("Para:", item$publico)),
      if (tem(item$resultado)) p(item$resultado),
      if (tem(item$aplicacao)) p(item$aplicacao),
      if (tem(item$parceiros)) p(paste("Parcerias:", item$parceiros)),
      if (tem(item$url) && grepl("^https?://", item$url)) tags$a(if (grepl("instagram.com", item$url, fixed = TRUE)) "Ver publicação do material" else "Acessar material", href = item$url, target = "_blank", rel = "noopener noreferrer")
    )
  }))
}

# A mesma coleção editorial alimenta Notícias e as páginas temáticas.
lista_noticias_area <- function(itens) {
  limite <- 9L
  tagList(cartoes(head(itens, limite), cartao_noticia),
    if (nrow(itens) > limite) tags$details(
      tags$summary(paste("Ver mais", nrow(itens) - limite, "notícias")),
      cartoes(itens[-seq_len(limite), , drop = FALSE], cartao_noticia)))
}

noticias_da_area <- function(area) {
  if (!secao_ativa("mostrar_noticias")) return(NULL)
  itens <- registros_reais(noticias, "titulo") |>
    dplyr::filter(categoria == area) |>
    dplyr::arrange(desc(data))
  if (nrow(itens)) tagList(h2(paste("Notícias de", area)), lista_noticias_area(itens))
}
