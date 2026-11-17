# Acervo público do Instagram — importação reversível

**Perfil consultado:** @gpenscufop  
**Origem:** Apify Instagram Scraper, dataset `FOxCJXaQJFkuOIct6` (17/11/2026)  
**Situação:** arquivo histórico em revisão editorial, não cadastro institucional validado.

## Como está funcionando

- Foram extraídos **655 registros**, com **655 códigos de publicação distintos** (654 marcados como @gpenscufop e um registro publicado por @tvufop no conjunto coletado).
- As publicações estão em `data/instagram/registros-01.json` a `registros-07.json`, simplificadas para leitura no site. As legendas completas e metadados permanecem no dataset do Apify e no arquivo JSON da branch `inventario-instagram-2026-11`.
- A navegação `acervo-instagram.qmd` agrupa as postagens em **26 temas provisórios**. Cada tema permite conferir o registro original; a busca e os filtros de área e ano não alteram os cadastros existentes.
- `data/instagram/pautas.yml` reúne 26 **pautas editoriais**. Na administração, acesse **Gestão editorial → Instagram · pautas para revisão** para examinar, anotar, aprovar ou descartar. Marcar uma pauta como aprovada **não a publica automaticamente** em outras seções: a coordenação ainda deve cadastrar a informação revisada no campo oficial apropriado.
- Os arquivos originais `data/noticias.yml`, `data/projetos.yml`, `data/equipe.yml`, `data/eventos.yml` e outras coleções não foram substituídos por postagens.

## Voltar a um site preenchido do zero

1. Acesse `/admin/` e entre com GitHub ou código de acesso.
2. Abra **Configurações do site → 12 · Acervo Instagram (reversível)**.
3. **Desative** a opção **Exibir acervo importado do Instagram**.
4. Clique em **Salvar configurações** e aguarde a atualização do GitHub Pages.
5. A página de acervo deixa de mostrar as postagens; os atalhos importados das páginas Grupo, Pesquisa, Ensino, Extensão e Divulgação científica desaparecem. As coleções originais, que continuarão editáveis, não sofrem alteração.

Para reativar, basta marcar a mesma opção e salvar.

Essa configuração é gravada em `data/configuracoes/13-acervo-instagram.yml` com a chave `mostrar_acervo_instagram`. O valor `false` desliga a exibição; `true` a reativa.

## Backup integral anterior

O estado do repositório anterior à inclusão do acervo foi preservado em:

`backup-pre-acervo-instagram-2026-11-17`

Apenas se for necessário eliminar também a infraestrutura da importação, compare a branch de backup com a main e reverta os commits **específicos da importação**. Não force a main para a branch antiga: isso apagaria outras mudanças realizadas depois.

## Cuidados editoriais

- As categorizações, os agrupamentos e os títulos de triagem foram criados automaticamente e podem conter erros.
- Não presumir que toda menção a estudo seja artigo publicado, que toda defesa possua todos os dados bibliográficos, ou que toda atividade seja projeto de extensão formalmente cadastrado.
- Eventos antigos pertencem ao acervo histórico: **não** adicioná-los à agenda de próximos eventos.
- Não preencher automaticamente equipe, egressos, currículo Lattes, DOI ou coordenadores com informações incompletas das postagens.
- URLs das fotos e vídeos hospedados no Instagram podem expirar; os arquivos de mídia **não foram baixados permanentemente**.
- Um registro recuperado no conjunto tem autoria externa (@tvufop); confirmar o vínculo e a pertinência na revisão.
