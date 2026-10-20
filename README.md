# Site do GPENSC – UFOP (Quarto Website)

Site estático e responsivo do Grupo de Pesquisa e Ensino em Nutrição e Saúde Coletiva (GPENSC/UFOP), desenvolvido em **Quarto** e **R**. O projeto compila as páginas para a pasta `docs/`, permitindo hospedagem gratuita diretamente via **GitHub Pages**.

---

## 🚀 Requisitos de Desenvolvimento

- **[Quarto CLI](https://quarto.org/docs/get-started/)** (versão 1.4 ou superior)
- **R** (versão 4.0 ou superior) com os pacotes instalados:

```r
install.packages(c("readr", "dplyr", "htmltools", "DT", "plotly", "yaml", "knitr", "rmarkdown"))
```

---

## 📂 Estrutura do Projeto

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

## ⚠️ Regra Crítica: Codificação de Arquivos CSV (UTF-8)

A maioria das informações dinâmicas do site fica na pasta **`data/`** em arquivos `.csv`.

> **ATENÇÃO AO USAR O EXCEL NO WINDOWS:**  
> O Excel costuma salvar arquivos `.csv` na codificação antiga (ANSI/Latin-1), o que quebra a compilação do site gerando erros de acentuação (`Pós-Graduação` vira `P<f3>s-Gradua<e7><e3>o`).  
> 
> **Como salvar corretamente no Excel:**  
> Vá em **Arquivo > Salvar como** e selecione explicitamente o tipo **CSV UTF-8 (delimitado por vírgulas) (*.csv)**.

---

## 📖 Como Alimentar e Atualizar o Conteúdo do Site

### 1. Logos de Apoio e Parceiros (`data/apoio.csv`)

1. Salve a imagem da logo na pasta **`img/`** (ou `img/apoio/`).
2. Abra **`data/apoio.csv`** e adicione uma nova linha seguindo a estrutura:

| nome | url | logo |
| :--- | :--- | :--- |
| UFOP | https://ufop.br | ufop.png |
| CNPq | https://www.gov.br/cnpq | cnpq.png |
| CAPES | https://www.gov.br/capes | capes.png |

> **Nota:** Na coluna `logo`, informe apenas o nome do arquivo salvo na pasta `img/` (ex: `cnpq.png`).

---

### 2. Notícias e Eventos (`data/noticias.csv`)

1. Salve a imagem da notícia na pasta **`img/noticias/`**.
2. Abra **`data/noticias.csv`** e adicione a nova linha no formato:

| titulo | categoria | data | resumo | link | imagem |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I Simpósio de Nutrição | Evento | 15/05/2026 | Inscrições abertas para o evento. | https://... | simposio.jpg |
| Publicação de Artigo | Pesquisa | 20/10/2026 | Novo estudo publicado sobre saúde coletiva. | https://... | |

> **Nota:** Se a coluna `imagem` for deixada em branco, o site aplicará automaticamente a imagem padrão (`noticia_padrao.jpg`).

---

### 3. Membros da Equipe (`data/equipe.csv`)

1. Adicione a foto do membro na pasta **`img/equipe/`** (formato quadrado recomendado, ex: `300x300px`).
2. Abra **`data/equipe.csv`** e preencha os dados:

| nome | categoria | lattes | foto | bio |
| :--- | :--- | :--- | :--- | :--- |
| Maria Silva | Docente | http://lattes.cnpq.br/xxx | maria.jpg | Professora Adjunta do DEPEA/UFOP. |
| João Santos | Discente | http://lattes.cnpq.br/yyy | joao.jpg | Mestrando do PPGSN/UFOP. |

---

### 4. Textos das Páginas Institucionais (`.qmd`)

Para alterar textos fixos de páginas como *Sobre*, *Contato* ou *Página Inicial*:
1. Abra o arquivo correspondente (`sobre.qmd`, `index.qmd`, `contato.qmd`) no RStudio ou VS Code.
2. Edite o conteúdo usando formatação em **Markdown**:
   * `# Título Principal`
   * `## Subtítulo`
   * `**Texto em negrito**`
   * `*Texto em itálico*`
   * `[Texto do link](https://link.com)`

---

## 💻 Como Visualizar as Alterações Localmente

Antes de publicar no GitHub, você pode testar e visualizar o site no navegador em tempo real:

1. Abra o terminal na pasta do projeto.
2. Execute:
   ```cmd
   quarto preview
   ```
3. O navegador abrirá automaticamente em `http://localhost:6971`.
4. Pressione **`Ctrl + C`** no terminal para encerrar a visualização.

---

## 🌐 Como Compilar e Publicar no GitHub

Após finalizar e revisar suas alterações:

### Passo 1: Compilar a versão final
Gere os arquivos atualizados dentro da pasta `docs/`:
```cmd
quarto render
```

### Passo 2: Enviar para o GitHub
Execute a sequência de comandos do Git:

```cmd
git add .
git commit -m "Atualiza conteúdo do site e documentação do README"
git push
```

> ⏳ O **GitHub Pages** atualizará o site público dentro de **1 a 2 minutos**.

---

## 🔍 Como Confirmar a Atualização

1. Acesse o repositório no GitHub: [github.com/maiconcarlospng/Site-GPENSC-Teste](https://github.com/maiconcarlospng/Site-GPENSC-Teste)
2. Confira se a mensagem do seu último commit aparece no topo da lista de arquivos.
3. Se as mudanças não aparecerem imediatamente no site publicado, **limpe o cache do navegador**:
   * No computador: Pressione **`Ctrl + F5`** (Windows) ou **`Cmd + Shift + R`** (Mac).
   * No celular: Abra em uma aba anônima.

---

## 🛠️ Resolução de Problemas Comuns

* **Erro `invalid input string` / `<f3>` / `<e7>` no `quarto render`:**  
  O arquivo CSV foi salvo em formato ANSI/Latin-1. Abra o CSV no Bloco de Notas ou VS Code e salve-o explicitamente em **UTF-8**.

* **Rejeição ao dar `git push` (`[rejected] main -> main`):**  
  O repositório no GitHub possui commits mais recentes que o seu computador. Baixe as mudanças antes de enviar:
  ```cmd
  git pull origin main --rebase
  git push
  ```