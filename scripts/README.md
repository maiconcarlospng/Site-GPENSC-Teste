# Scripts de automação e manutenção

Esta pasta contém rotinas auxiliares para importação e organização de conteúdos e preparação de artefatos.

- `gerar-inventario-materiais.py`: constrói o inventário de referências aos materiais do site; é chamado no workflow de publicação.
- `importar-instagram.py`: rotina de importação de conteúdo do Instagram utilizada pelo processo de sincronização.

Não mova estes arquivos sem revisar `.github/workflows/` e as chamadas que dependem de seus caminhos. A execução pode requerer bibliotecas e credenciais externas; nunca grave tokens no repositório.
