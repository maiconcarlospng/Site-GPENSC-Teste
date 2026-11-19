# Funções R

Esta pasta reúne funções auxiliares executadas **durante a renderização do Quarto**, não a cada visita ao site. Elas leem dados YAML, organizam registros e geram componentes das páginas.

- `helpers.R`: rotinas compartilhadas e estruturas auxiliares para conteúdo.

Ao alterar campos de `data/*.yml`, confira os leitores R e as páginas `.qmd` correspondentes. Evite renomear funções sem atualizar as chamadas. Teste com `quarto render`.
