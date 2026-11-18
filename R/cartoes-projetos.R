imagem_projeto <- function(imagem, url) {
  if (tem(url) && tem(imagem) && grepl("^https://[^/]+\\.(cdninstagram\\.com|fbcdn\\.net)/", imagem)) {
    correspondencia <- regmatches(url, regexec("^https://(www\\.)?instagram\\.com/(p|reels?)/([A-Za-z0-9_-]+)/?([?#].*)?$", url))[[1]]
    if (length(correspondencia)) {
      arquivos <- file.path("img", "instagram", paste0(correspondencia[4], c(".jpg", ".png", ".webp")))
      if (any(file.exists(arquivos))) return(arquivos[file.exists(arquivos)][1])
    }
  }
  imagem
}

cartoes_projetos <- function(tipo_cartoes_projetos) {
  extensao <- identical(tipo_cartoes_projetos, "Extensão")
  projetos_publicados <- registros_reais(projetos, "titulo")
  tipo <- trimws(as.character(projetos_publicados$tipo))
  selecionados <- projetos_publicados[!is.na(tipo) & tolower(tipo) == tolower(tipo_cartoes_projetos), , drop = FALSE]

  if (extensao || secao_ativa("mostrar_projetos")) {
    div(
      class = "pagina-projetos",
      if (nrow(selecionados) > 0) {
        div(
          class = "gp-projetos-grade",
          lapply(seq_len(nrow(selecionados)), function(i) {
            projeto <- selecionados[i, , drop = FALSE]
            titulo <- as.character(projeto$titulo[1])
            resumo <- valor_publico(projeto$resumo)
            coordenador <- valor_publico(projeto$coordenador)
            situacao <- valor_publico(projeto$situacao)
            if (identical(situacao, "Não informado")) situacao <- NULL
            inicio <- valor_publico(projeto$inicio)
            fim <- valor_publico(projeto$fim)
            financiamento <- valor_publico(projeto$financiamento)
            url <- valor_publico(projeto$url)
            tags$article(
              id = if (tem(projeto$id)) paste0("projeto-", projeto$id[1]) else NULL,
              class = "gp-projeto-card",
              capa_conteudo(imagem_projeto(projeto$imagem, url), titulo, "pesquisa"),
              h3(titulo),
              if (!is.null(resumo)) p(class = "gp-projeto-resumo", resumo),
              if (!is.null(coordenador)) p(tags$strong("Coordenação: "), coordenador),
              if (!is.null(situacao)) p(tags$strong("Situação: "), situacao),
              if (!is.null(inicio)) p(tags$strong("Início: "), inicio),
              if (!is.null(fim)) p(tags$strong("Fim: "), fim),
              if (!is.null(financiamento)) p(tags$strong("Financiamento: "), financiamento),
              if (!is.null(url) && grepl("^https?://", url))
                tags$a(
                  if (grepl("instagram.com", url, fixed = TRUE)) "Ver divulgação do projeto" else "Acessar fonte do projeto",
                  href = url, target = "_blank", rel = "noopener noreferrer"
                )
            )
          })
        )
      } else {
        estado_vazio(if (extensao) "Projetos de extensão em atualização" else "Projetos de pesquisa em atualização", NULL)
      }
    )
  } else {
    estado_vazio("Seção temporariamente indisponível", "Esta seção está desativada nas configurações do site.")
  }
}
