# Site do GPENSC – UFOP (Quarto Website)

> **Início rápido:** Consulte o arquivo `COMO-EDITAR.md` para um guia detalhado passo a passo voltado a colaboradores e editores de conteúdo.

Site estático e responsivo do Grupo de Pesquisa e Ensino em Nutrição e Saúde Coletiva (GPENSC/UFOP), desenvolvido em **Quarto** e **R**. O projeto compila as páginas para a pasta `docs/`, permitindo hospedagem gratuita diretamente via **GitHub Pages**.

---

## 🚀 Requisitos de Desenvolvimento

- **[Quarto CLI](https://quarto.org/docs/get-started/)** (versão 1.4 ou superior)
- **R** (versão 4.0 ou superior) com os pacotes necessários instalados:

```r
install.packages(c("readr", "dplyr", "htmltools", "DT", "plotly", "yaml", "knitr", "rmarkdown"))
```

---

## 📂 Estrutura do Projeto

Para facilitar a manutenção, o site é estruturado da seguinte forma:

```text
gpensc-quarto/
├── data/              # Arquivos de dados (.csv) com o conteúdo do site
├── img/               # Imagens e arquivos de mídia
│   ├── apoio/         # Logos de parceiros e apoiadores
│   ├── noticias/      # Imagens das notícias
│   ├── pesquisas/     # Imagens dos cartões de pesquisa
│   └── equipe/        # Fotos dos membros
├── R/                 # Funções auxiliares R (ex: R/helpers.R)
├── docs/              # Site final compilado (gerado pelo Quarto)
├── styles.css         # Estilização visual (CSS do site)
├── _quarto.yml        # Configurações globais do Quarto (menus, cabeçalho)
└── *.qmd              # Páginas do site (index.qmd, sobre.qmd, noticias.qmd, etc.)
```

---

## ✍️ Como Alimentar e Atualizar o Conteúdo

A maior parte do conteúdo dinâmico (notícias, parceiros, publicações) é gerenciada por **arquivos `.csv`** na pasta `data/`.

> ⚠️ **REGRA DE OURO PARA ARQUIVOS CSV:**  
> Sempre salve os arquivos `.csv` com a codificação **UTF-8**. Se editar via Excel no Windows, use a opção **"Salvar como" > "CSV UTF-8 (delimitado por vírgulas) (*.csv)"**. Isso evita erros de acentuação (`ç`, `ã`, `ó`) na compilação.

---

### 1. Adicionar ou Alterar Logos de Apoio (`data/apoio.csv`)

1. Salve a imagem da logo na pasta `img/` (ou `img/apoio/`).
2. Abra o arquivo `data/apoio.csv`.
3. Adicione uma nova linha preenchendo as colunas:

| nome | url | logo |
| :--- | :--- | :--- |
| UFOP | https://ufop.br | ufop.png |
| CNPq | https://cnpq.br | cnpq.png |
| Nome do Parceiro | https://site-do-parceiro.org | nome_da_logo.png |

---

### 2. Adicionar Novas Notícias (`data/noticias.csv`)

1. Salve a imagem da notícia na pasta `img/noticias/`.
2. Abra `data/noticias.csv` e adicione uma nova linha:
   * **`titulo`**: Título da notícia.
   * **`categoria`**: Categoria da notícia (ex: *Evento*, *Publicação*, *Aviso*).
   * **`data`**: Data de publicação (ex: `20/10/2026`).
   * **`resumo`**: Breve descrição ou resumo da notícia.
   * **`link`**: Link interno ou externo para ler mais.
   * **`imagem`**: Nome do arquivo na pasta `img/noticias/` (ex: `evento1.jpg`). Se deixado em branco, o site usará a imagem padrão (`noticia_padrao.jpg`).

---

### 3. Modificar Textos das Páginas (`.qmd`)

Para alterar textos institucionais ou páginas estáticas (ex: `index.qmd`, `sobre.qmd`, `contato.qmd`):
1. Abra o arquivo `.qmd` correspondente no RStudio ou VS Code.
2. Faça as alterações no texto em formato **Markdown**.
3. Salve o arquivo.

---

## 💻 Como Visualizar as Mudanças Localmente

Antes de publicar no GitHub, você pode visualizar o site no seu navegador em tempo real:

1. Abra o terminal na pasta do projeto.
2. Execute o comando:
   ```cmd
   quarto preview
   ```
3. O navegador abrirá automaticamente em `http://localhost:XXXX`. Sempre que você salvar um arquivo, o site será atualizado na hora.
4. Para fechar a visualização, pressione **`Ctrl + C`** no terminal.

---

## 🌐 Como Compilar e Publicar no GitHub

Após fazer todas as alterações necessárias e confirmar que tudo está correto no `preview`, siga estes passos para colocar as atualizações no ar:

### Passo 1: Gerar os arquivos finais do site
Execute no terminal para gerar a pasta `docs/` atualizada:
```cmd
quarto render
```

### Passo 2: Enviar as alterações para o GitHub
Execute a sequência de comandos do Git:

```cmd
git add .
git commit -m "Atualiza conteúdos do site"
git push
```

> ⏱️ O **GitHub Pages** atualizará o site público dentro de **1 a 2 minutos**.

---

## 🔍 Como Confirmar se o Site Foi Atualizado

1. **Acesse o repositório:** [github.com/maiconcarlospng/Site-GPENSC-Teste](https://github.com/maiconcarlospng/Site-GPENSC-Teste)
2. Veja se a sua última mensagem de commit aparece no topo da lista.
3. Se as alterações não aparecerem imediatamente no seu celular ou computador, **limpe o cache do navegador**:
   * No computador: Pressione **`Ctrl + F5`** (Windows) ou **`Cmd + Shift + R`** (Mac).
   * No celular: Abra uma aba anônima.

---

## 🛠️ Resolução de Problemas Comuns

* **Erro de encoding (`invalid input string` / `<f3>` / `<e7>`):**  
  Ocorre quando um CSV é salvo em formato ANSI/Latin-1. Abra o arquivo no Bloco de Notas ou VS Code e salve-o como **UTF-8**.

* **Rejeição ao dar `git push` (`[rejected] main -> main`):**  
  Alguém atualizou o GitHub antes de você. Baixe as mudanças primeiro executando:
  ```cmd
  git pull origin main --rebase
  git push
  ```

* **Imagens tortas ou desproporcionais:**  
  Todas as logos de apoio são padronizadas via `styles.css`. Certifique-se de que a imagem não possui bordas brancas muito grandes integradas ao arquivo de imagem.