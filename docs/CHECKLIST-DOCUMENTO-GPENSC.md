# Adequação ao documento de sugestões do GPENSC

Checklist editorial baseado nas sugestões do encontro de 19/10 e no estado do repositório em 15/11/2026. **Implementado no código** não significa que a página já possua dados completos, nem que o GitHub Pages tenha concluído a publicação.

## Decisões contempladas pelo site

- [x] Site institucional único, com conteúdo para diferentes públicos (sem duplicar portais).
- [x] Páginas independentes de Pesquisa, Ensino, Extensão, História, Quem somos e Contato.
- [x] Árvore do conhecimento com navegação de ramificações, busca, zoom e seleção por teclado.
- [x] Relações entre linhas de pesquisa, projetos, pessoas, produções e defesas quando cadastradas.
- [x] Proteção contra publicação de registros marcados como exemplo.
- [x] Projetos destacados Vi no Rótulo e Capacitação em Epidemiologia e Análise de Dados.
- [x] Página de publicações com gráficos condicionais por ano e periódico.
- [x] Agenda de atividades e defesas, com estados vazios reais.
- [x] Diretório de integrantes, com categorias e campos de Lattes, ORCID, fotos e revisão anual.
- [x] Parcerias com mapa condicionado a coordenadas cadastradas.
- [x] Seções de divulgação, podcasts, materiais educativos, metodologias e impacto social.
- [x] Área Ciência para a sociedade, ligada às publicações e ao painel, sem sínteses inventadas.
- [x] Estrutura de tradução automática PT / EN / ES (tradução humana ainda depende de revisão).
- [x] Sveltia CMS com coleções e planejamento editorial semestral.

## Pendências de conteúdo, a serem preenchidas com dados confirmados

- [ ] **17 linhas de pesquisa:** escrever descrição e palavras-chave em `data/linhas.yml` via painel.
- [ ] **Integrantes:** conferir autorização de divulgação, funções, fotos, contatos, Lattes e ORCID; preencher `linhas_ids` para representar a atuação em cada linha. O cadastro atual não traz os vínculos.
- [ ] **Egressos:** cadastrar a categoria correta e manter apenas nome e link Lattes na exibição pública.
- [ ] **Projetos científicos:** trocar os itens de demonstração de `data/projetos.yml` por projetos verificados, com coordenação e linha associada.
- [ ] **Publicações:** registrar artigos, capítulos e trabalhos reais com autoria, periódico, ano, DOI/URL e linha de pesquisa; exemplos existentes não são publicados.
- [ ] **Tradução dos resultados:** usar os novos campos `resumo_publico`, `aplicacao` e `fonte_divulgacao`, com revisão científica e fonte original, para alimentar `resultados.qmd`.
- [ ] **Teses e dissertações:** adicionar trabalhos confirmados com `linha_id` e URL quando disponível.
- [ ] **Bibliometria:** levantar citações reais com fonte, método e data de consulta antes de adicionar gráficos de citação.
- [ ] **Nossa história:** substituir marcos provisórios por eventos, datas e fotografias confirmados.
- [ ] **Impacto social:** registrar intervenções, resultados, parceiros, fontes e limites em `data/impactos.yml`.
- [ ] **Materiais educativos e metodologias:** incluir arquivos, links e sínteses reais em `data/materiais.yml` e `data/metodos.yml`.
- [ ] **Notícias e agenda:** publicar apenas acontecimentos com fonte e data confirmadas; listas vazias são preferíveis a conteúdo genérico.
- [ ] **Legendas da galeria:** descrever fotografias autorizadas e conferir enquadramento, identificação e contexto.
- [ ] **Edição/tradução:** revisar manualmente a exibição em inglês e espanhol, sobretudo títulos, termos científicos e nomes próprios.

## Decisões de gestão a serem tomadas pelo grupo

- [ ] Designar a comissão responsável e aprovar a rotina de revisão semestral.
- [ ] Definir responsáveis pelo recebimento e checagem dos materiais enviados pelos integrantes.
- [ ] Revisar fichas de integrantes pelo menos a cada 12 meses.
- [ ] Definir a política de consentimento de fotos, contato pessoal e resultados em divulgação.
- [ ] Decidir se haverá chat/personagem do grupo (ideia sugerida, **não** decisão obrigatória).
- [ ] Confirmar datas, fonte e escopo do anuário previsto a partir de 2027.

## Verificação técnica antes de institucionalizar

- [ ] Confirmar sucesso do Quarto/GitHub Actions após cada conjunto de alterações.
- [ ] Testar navegação, zoom e interação da árvore em navegador desktop, Android e iPhone.
- [ ] Verificar se links e traduções funcionam em todas as páginas.
- [ ] Fazer testes de acessibilidade com teclado e leitores de tela.
- [ ] Fazer auditoria de performance e consolidar folhas CSS antigas sem quebrar componentes.
- [ ] Revisar GitHub Pages, autenticação Sveltia CMS, Cloudflare e Umami na futura migração para a conta institucional.

**Regra editorial:** o CMS prepara a publicação; não cria evidências. Nunca preencher uma lacuna com resultados, nomes ou vínculos presumidos.
