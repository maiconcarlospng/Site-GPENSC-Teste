# Site do GPENSC – UFOP (Quarto Website)

> **Início rápido:** Consulte o arquivo `COMO-EDITAR.md` para um guia detalhado passo a passo voltado a colaboradores e editores de conteúdo.

Site estático e responsivo do Grupo de Pesquisa e Ensino em Nutrição e Saúde Coletiva (GPENSC/UFOP), desenvolvido em **Quarto** e **R**. O projeto compila as páginas para a pasta `docs/`, permitindo hospedagem gratuita diretamente via **GitHub Pages**.

---

## 🚀 Requisitos de Desenvolvimento

- **[Quarto CLI](https://quarto.org/docs/get-started/)** (versão 1.4 ou superior)
- **R** com os pacotes necessários instalados:

```r
install.packages(c("readr", "dplyr", "htmltools", "DT", "plotly", "yaml", "knitr", "rmarkdown"))