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

# Listagem em tabela nas páginas Pesquisa e Extensão.
# O nome histórico da função permanece para preservar os includes do Quarto.
cartoes_projetos <- function(tipo_cartoes_projetos) {
  extensao <- identical(tipo_cartoes_projetos, "Extensão")
  projetos_publicados <- registros_reais(projetos, "titulo")
  tipo <- trimws(as.character(projetos_publicados$tipo))
  selecionados <- projetos_publicados[
    !is.na(tipo) & tolower(tipo) == tolower(tipo_cartoes_projetos),
    , drop = FALSE
  ]
  chave_alfabetica <- function(valores) {
    texto <- enc2utf8(as.character(valores))
    simples <- iconv(texto, from="UTF-8", to="ASCII//TRANSLIT", sub="")
    simples[is.na(simples)] <- texto[is.na(simples)]
    tolower(simples)
  }
  if (nrow(selecionados)) {
    selecionados <- selecionados[order(chave_alfabetica(selecionados$titulo)), , drop=FALSE]
  }
  linhas_publicadas <- registros_reais(linhas, "nome")
  obter_linha <- function(id) {
    if (is.null(id) || !nrow(linhas_publicadas)) return(NULL)
    indice <- which(as.character(linhas_publicadas$id)==as.character(id))
    if (!length(indice)) return(NULL)
    list(id=as.character(linhas_publicadas$id[indice[1]]),
         nome=as.character(linhas_publicadas$nome[indice[1]]))
  }
  auxiliar <- function(texto) span(class="gp-tabela-auxiliar",texto)

  if (extensao || secao_ativa("mostrar_projetos")) {
    div(class="pagina-projetos gp-listagem-tabela",
      if (nrow(selecionados) > 0) tagList(
        div(class="gp-tabela-introducao",
          p(if (extensao)
              "Projetos de extensão em ordem alfabética, com coordenação e acesso às informações disponíveis."
            else
              "Projetos de pesquisa em ordem alfabética, com linhas vinculadas e informações cadastradas.")
        ),
        div(class="gp-tabela-rolagem", role="region", tabindex="0",
          `aria-label`=paste("Tabela de projetos de",tolower(tipo_cartoes_projetos),"com rolagem horizontal em telas menores"),
          tags$table(class="gp-tabela-dados gp-tabela-projetos",
            tags$caption(paste("Projetos de",tolower(tipo_cartoes_projetos),"do GPENSC")),
            tags$thead(tags$tr(
              tags$th(scope="col","Projeto"),
              tags$th(scope="col","Linha de pesquisa"),
              tags$th(scope="col","Coordenação"),
              tags$th(scope="col","Informações e acesso")
            )),
            tags$tbody(lapply(seq_len(nrow(selecionados)),function(i) {
              projeto <- selecionados[i,,drop=FALSE]
              titulo <- as.character(projeto$titulo[1])
              resumo <- valor_publico(projeto$resumo)
              coordenador <- valor_publico(projeto$coordenador)
              situacao <- valor_publico(projeto$situacao)
              if (!is.null(situacao) && tolower(situacao) %in% c("não informado","nao informado")) situacao <- NULL
              inicio <- valor_publico(projeto$inicio)
              fim <- valor_publico(projeto$fim)
              financiamento <- valor_publico(projeto$financiamento)
              url <- valor_publico(projeto$url)
              id <- valor_publico(projeto$id)
              linha <- obter_linha(valor_publico(projeto$linha_id))
              periodo <- paste(c(if (!is.null(inicio)) paste0("Início: ",inicio),
                                 if (!is.null(fim)) paste0("Fim: ",fim)),collapse=" · ")
              tags$tr(
                id=if (!is.null(id)) paste0("projeto-",id) else NULL,
                tags$td(class="gp-tabela-principal",
                  tags$strong(titulo),
                  if (!is.null(resumo)) p(class="gp-tabela-resumo",resumo)
                ),
                tags$td(if (!is.null(linha)) {
                  tags$a(linha$nome,href=paste0("linhas.html#linha-",linha$id))
                } else auxiliar("Sem vínculo informado")),
                tags$td(
                  if (!is.null(coordenador)) tags$span(coordenador) else auxiliar("Não informada"),
                  if (!is.null(financiamento)) p(class="gp-tabela-temas",
                    tags$strong("Financiamento: "),financiamento)
                ),
                tags$td(
                  if (!is.null(situacao)) span(class="gp-tabela-situacao",situacao),
                  if (nzchar(periodo)) p(class="gp-tabela-periodo",periodo),
                  if (!is.null(url) && grepl("^https?://",url)) tags$a(
                    class="gp-tabela-fonte",
                    if (grepl("instagram.com",url,fixed=TRUE)) "Ver divulgação do projeto" else "Acessar fonte do projeto",
                    href=url,target="_blank",rel="noopener noreferrer"
                  )
                )
              )
            }))
          )
        ),
        p(class="gp-tabela-nota","No celular, deslize a tabela lateralmente para visualizar todas as colunas.")
      ) else {
        estado_vazio(if (extensao) "Projetos de extensão em atualização" else "Projetos de pesquisa em atualização",NULL)
      }
    )
  } else {
    estado_vazio("Seção temporariamente indisponível","Esta seção está desativada nas configurações do site.")
  }
}
