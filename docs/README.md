# Documentação do projeto GPENSC

Esta pasta reúne os manuais e documentos de referência. **Os arquivos de produção permanecem em seus caminhos atuais** para não quebrar o site.

| Documento | Para que serve |
| --- | --- |
| [Manual de edição](COMO-EDITAR.md) | Orienta o cadastro e a manutenção de conteúdos pelo painel |
| [Organização editorial](ORGANIZACAO-EDITORIAL.md) | Propõe responsabilidades, curadoria e rotinas de atualização |
| [Checklist do documento GPENSC](CHECKLIST-DOCUMENTO-GPENSC.md) | Acompanha requisitos solicitados e pontos que precisam de validação |
| [Manual de administração](MANUAL_ADMINISTRACAO_GPENSC.md) | Orientações operacionais para a administração |
| [Curadoria reversível do Instagram](instagram-curadoria-reversivel.md) | Procedimentos e cuidados para conteúdos importados |

Para arquitetura, configuração, implantação e portabilidade, consulte o [README principal](../README.md).

## Cuidados ao reorganizar

As páginas `.qmd`, `_quarto.yml`, arquivos CSS, JS e dados YAML possuem referências cruzadas. Não devem ser movidos apenas para reduzir a lista da raiz: é necessário corrigir as referências e testar a publicação e o painel. O histórico dos documentos movidos permanece recuperável pelo Git.
