# Estilos auxiliares do site

Esta pasta guarda folhas CSS auxiliares carregadas pelo Quarto a partir de `_quarto.yml`.

- `site-ajustes.css`: correções e refinamentos gerais de layout.
- `site-escala.css`: ajustes de escala e proporções.

**Atenção:** os estilos principais que utilizam caminhos relativos para imagens continuam na raiz. Ao mover um CSS com `url(...)`, é preciso corrigir os caminhos internos e validar o HTML publicado. Não altere a ordem de carregamento no `_quarto.yml` sem verificar a cascata CSS.

A publicação rápida do workflow permanece restrita a recursos nos caminhos já previstos. Mudanças em `_quarto.yml` exigem compilação completa.
