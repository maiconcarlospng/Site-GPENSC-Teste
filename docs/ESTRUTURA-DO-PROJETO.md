# Estrutura técnica do GPENSC

Este documento descreve a responsabilidade das pastas e os cuidados para manutenção. **Não representa uma mudança de caminho dos arquivos em produção.**

| Local | Conteúdo e responsabilidade | Cuidados |
| --- | --- | --- |
| `_quarto.yml` | Configuração global de renderização, recursos, menus e tema | Verificar todos os caminhos antes de editar |
| `_variables.yml` | Variáveis compartilhadas do Quarto | Verificar referências nas páginas |
| `*.qmd` | Fontes das páginas públicas | Não mover sem alterar navegação e links |
| `R/` | Helpers e geração de conteúdo a partir dos dados | Manter compatibilidade com os esquemas YAML |
| `data/` | Conteúdos editáveis e configurações institucionais | Painel e CMS dependem dos caminhos |
| `admin/` | Painel próprio, editor Sveltia, validações e mídia administrativa | Não alterar URLs públicas sem teste |
| `js/` | Comportamento das páginas, galerias e árvore | Conferir imports, referências e cache |
| `img/` | Imagens e logotipos utilizados no site | Preservar links existentes |
| `partials/` | Fragmentos reutilizados pelas páginas | Não renderizar como páginas independentes |
| `scripts/` | Importações, geração de inventário e tarefas auxiliares | Alguns scripts são chamados pelos workflows |
| `.github/workflows/` | Validação, compilação e automações | Mudanças exigem revisão de gatilhos e permissões |
| `admin-access-worker/` | Worker Cloudflare para acesso administrativo por código | Segredos ficam fora do Git |
| `analytics-worker/` | Worker Cloudflare de integração de métricas | Revisar origens e credenciais no deploy |
| `docs/` | Documentação técnica e orientações de manutenção | Não é diretório de saída do Quarto |
| `README.md` | Visão geral, instalação e portabilidade | Manter links atualizados |

## Princípio da reorganização conservadora

1. Preservar caminhos públicos e estrutura de dados usados pelo painel.
2. Organizar primeiro a **documentação** e descrever a responsabilidade de cada área.
3. Não mover, renomear ou excluir scripts de produção sem inventário de referências, atualização dos consumidores e teste de build.
4. Separar alterações de organização das mudanças de comportamento.
5. Validar `Actions`, site público, login, gravação e publicação antes de integrar uma reorganização à `main`.

## Extensões de arquivo

- `.yml`: configuração (Quarto, CMS, workflows) ou dados editoriais, dependendo da pasta.
- `.qmd`: páginas-fonte renderizadas pelo Quarto.
- `.R`: processamento e geração de conteúdo durante a compilação.
- `.js`: interatividade do navegador ou scripts de automação/Workers.
- `.css` e `.scss`: apresentação visual.
- `.py`: importações, auditorias, validação e inventários.
- `.html`: componentes e entradas do painel.
- `.md`: documentação.

Consulte o [README principal](../README.md) para o fluxo completo de compilação e portabilidade.
