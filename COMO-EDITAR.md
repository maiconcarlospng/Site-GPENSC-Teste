# Como editar o site do GPENSC

Guia para quem está começando. A regra central:

> **O conteúdo mora nos arquivos `.yml` da pasta `data/`, e você os edita pelo painel `/admin/`. O visual mora em `styles.css` e `custom.scss`. As páginas `.qmd` só juntam os dois.**

Na maior parte do tempo você só usa o **painel** e, de vez em quando, o `_variables.yml`. Para a explicação técnica completa, veja o `README.md`.

---

## 1. Editar pelo painel (o jeito do dia a dia)

1. Abra: **https://maiconcarlospng.github.io/Site-GPENSC-Teste/admin/**
2. **Estado do protótipo:** o login OAuth individual ainda não está configurado nem testado. Se o site for aprovado para uso, siga o passo a passo “Login com GitHub” no README para configurar autenticação, permissões e testes antes de liberar o painel. Se o painel pedir token, não compartilhe tokens nem os coloque em arquivos ou mensagens.
3. O painel está apontado para o repositório do protótipo e para a branch `main`; salvar pode gravar diretamente nessa branch.
4. Só faça alterações se tiver autorização do responsável pelo repositório. O fluxo de aprovação editorial ainda não está implementado.
5. Após uma edição autorizada, espere de **2 a 5 minutos**. O site é recompilado automaticamente quando a publicação é acionada.
5. Para conferir: no GitHub, aba **Actions**. Círculo amarelo = compilando; ✅ verde = no ar. Abra o site em **janela anônima** para não ver a versão guardada no navegador.

> O site só muda depois do ✅ verde. Se aparecer ❌, veja a seção 8.

### Regras ao preencher

1. **Datas** sempre no formato `AAAA-MM-DD` (ex.: `2026-10-25`).
2. **Campos opcionais** podem ficar vazios: o site só mostra o link ou a foto se houver conteúdo.
3. **Imagens enviadas pelo painel** ficam na pasta `img/` e já funcionam sozinhas.
4. **Não mude o `ID`** de uma linha de pesquisa depois de criado, porque projetos e publicações usam esse código para se ligar a ela.

---

## 2. Mapa dos arquivos

| Arquivo | Para que serve | Mexo sempre? |
|---|---|---|
| `data/*.yml` | **Todo o conteúdo** (notícias, agenda, equipe, projetos, publicações, etc.). Editado pelo painel | **Sim (pelo painel)** |
| `img/` | Imagens enviadas pelo painel, logos e fotos | Sim |
| `img/galeria/`, `img/noticias/`, `img/pesquisas/`, `img/equipe/` | Pastas de imagens organizadas manualmente (cada uma pode ter um LEIA-ME.txt) | Às vezes |
| `admin/config.yml` | Define as seções e os campos do painel | Raramente |
| `_variables.yml` | Textos curtos: nome do grupo, resumo, missão, e-mail, Instagram, links | Às vezes |
| `_quarto.yml` | Menu, rodapé, tema | Raramente |
| `custom.scss` | **Cores e fontes** | Para mudar o visual |
| `styles.css` | Aparência de cartões, topo, linha do tempo etc. | Para mudar o visual |
| `*.qmd` | Uma página cada (`index.qmd` = início) | Raramente |
| `R/helpers.R` | Lê os `.yml` e define funções (`cartoes`, `tem`...) | Só para criar coisas novas |
| `topo.html` | Faixa do topo com logo e nome do grupo (texto fixo) | Raramente |
| `lupa.html` | Animações e lente da lupa (para dar a lente a outro bloco, acrescente a classe `lupa-area`) | Quase nunca |
| `.github/workflows/publish.yml` | Receita que compila e publica o site sozinha | Quase nunca |

Os arquivos de código têm **comentários explicando cada bloco**. Em R e YAML: `#`; em SCSS: `//`; em CSS: `/* */`; em `.qmd` e HTML: `<!-- -->`.

---

## 3. Tarefas do dia a dia

| Quero... | No painel, seção | Observações |
|---|---|---|
| Colocar **fotos do grupo no topo da home** | Galeria | Sem fotos, o topo mostra o bloco verde com a lupa |
| Adicionar **notícia** | Notícias | `imagem` é opcional (sem ela usa a imagem padrão). `categoria` cria uma seção nova sozinha (ex.: Defesa, GPENSC no Ar). `link` é opcional ("Leia mais »") |
| Adicionar **evento** na agenda | Eventos | `tipo` ex.: Aula aberta, Workshop, Curso |
| Registrar **defesa ou qualificação** | Defesas | `nível`: Mestrado/Doutorado. `etapa`: Defesa/Qualificação. `link` (opcional) vira "Acessar" na página Teses e dissertações |
| Adicionar **episódio do GPENSC no Ar** | NOAR (episódios) | `link` opcional. A `observação` é só sua e **não** aparece no site |
| Adicionar **linha de pesquisa** | Linhas de pesquisa | O `ID` (L1, L2...) é usado em projetos e publicações |
| Adicionar **integrante** | Equipe | `papel` = Coordenação (cartão grande, com mini-bio em `formação`) ou Docente, Doutorando(a), Mestrando(a), Graduando(a), Egresso(a). Sem foto, aparecem as iniciais |
| Adicionar **disciplina** | Disciplinas | `nível` cria a seção (Graduação, Pós-graduação) |
| Adicionar **livro** | Livros | |
| Adicionar **vídeo** | Vídeos | Cole o link no campo `Link` |
| Adicionar **site recomendado** | Sites úteis | |
| Adicionar **projeto** | Projetos | `tipo` = Pesquisa ou Extensão (os de Extensão aparecem em "Ensino e extensão") |
| Adicionar **publicação** | Publicações | A referência é montada sozinha. O `DOI` vira link |
| Adicionar **logo de apoio** (UFOP, CNPq, FAPEMIG...) | Apoio e parceiros | Use PNG com fundo transparente |

### O que NÃO é editado pelo painel

| Quero... | Edite | Observações |
|---|---|---|
| Mudar **nome, resumo, missão, e-mail, Instagram** | `_variables.yml` | Aparecem nas páginas com `{{< var nome >}}` |
| Trocar uma **logo do site** | arquivo em `img/` | Mantenha o mesmo nome do arquivo |
| Mudar uma **cor** | `custom.scss` (e as variáveis `--gp-*` no topo do `styles.css`) | Troque o código `#RRGGBB` |
| Mexer no **menu** | `_quarto.yml` | Cada item = `href` + `text`; o bloco `menu:` cria o suspenso |
| Mudar **e-mail, endereço ou Instagram do rodapé** | `_quarto.yml` (bloco `page-footer`) | O rodapé não lê o `_variables.yml`: mude nos dois lugares |

> **Atenção (atalhos):** nunca escreva as chaves duplas do atalho `var` dentro de comentário em `.qmd`. O Quarto executa mesmo assim e dá erro.

> **Atenção:** em Projetos, a `situação` precisa ser exatamente `Em andamento` para o projeto entrar na contagem da página inicial. Em Publicações, o `tipo` precisa ser exatamente `Artigo` para contar como artigo.

---

## 4. Editar no seu computador (opcional)

Só é necessário para mexer em código, visual ou páginas. Para o conteúdo, use o painel.

### Instalar (uma vez só)
1. **R**: https://cran.r-project.org
2. **RStudio** (já traz o Quarto): https://posit.co/download/rstudio-desktop, ou o Quarto avulso: https://quarto.org/docs/get-started
3. No console do R:

```r
install.packages(c("readr", "dplyr", "htmltools", "DT", "plotly", "yaml", "knitr", "rmarkdown"))
```

### Ver o site
No **Terminal** do RStudio, dentro da pasta do projeto:

```bash
quarto preview
```

O site abre no navegador e atualiza sozinho quando você salva um arquivo. Para parar: `Ctrl + C`.

### ⚠️ Antes de enviar alterações ao GitHub
O painel também faz alterações no repositório, então o seu computador pode estar desatualizado. **Sempre rode `git pull --rebase` antes de começar e antes de enviar:**

```bash
git pull --rebase
git add .
git commit -m "Descreva a alteração"
git pull --rebase
git push
```

Se aparecer `rejected ... fetch first`, é o `git pull --rebase` que resolve. Se aparecer `unstaged changes`, rode `git stash`, depois `git pull --rebase`, `git push` e, se precisar, `git stash pop`.

---

## 5. Criar uma página nova (passo a passo)

1. Crie `minhapagina.qmd`:

````markdown
---
title: "Título da página"
---

```{r}
#| echo: false
source("R/helpers.R")
```

Texto normal em Markdown. Use `##` para subtítulos.
````

2. Coloque no menu (`_quarto.yml`):

```yaml
      - href: minhapagina.qmd
        text: Minha página
```

3. Para listar dados de uma tabela nova:
   - crie `data/minha.yml`:

```yaml
itens:
  - titulo: Primeiro item
    descricao: Texto do item
```

   - em `admin/config.yml`, crie a seção do painel apontando para `data/minha.yml` (copie uma seção existente e troque os nomes);
   - em `R/helpers.R`, acrescente `minha = c("titulo", "descricao")` na lista `COLUNAS` e depois `minha <- ler("minha")`;
   - na página, mostre como cartões:

````markdown
```{r}
cartoes(minha, function(x, i)
  div(class = paste("cartao reveal", cor_de(i)),
    h4(x$titulo),
    p(x$descricao)))
```
````

Ou como tabela com busca: `datatable(minha, rownames = FALSE, filter = "top")`.

### Escolher uma URL personalizada para uma página

A URL de uma página normalmente acompanha o nome do arquivo `.qmd`. Por exemplo, `equipe.qmd` gera uma página acessada como `equipe.html`. Para escolher um endereço mais claro, você pode definir o nome do arquivo antes de publicar.

**Exemplo: criar uma página chamada “O grupo” com endereço `o-grupo.html`:**

1. Dê à página o nome `o-grupo.qmd` (use letras minúsculas, sem acentos, espaços ou caracteres especiais; separe palavras com hífen).
2. No arquivo `_quarto.yml`, atualize o item do menu para apontar ao novo nome:
   ```yaml
         - href: o-grupo.qmd
           text: O grupo
   ```
3. Procure no projeto links internos que apontem para o nome antigo e atualize-os também.
4. Salve e envie as alterações. Aguarde o GitHub Actions terminar com ✅ verde e teste o endereço publicado.

Neste projeto, o site está em um subcaminho do GitHub Pages. Assim, o endereço completo terá este formato:

```text
https://maiconcarlospng.github.io/Site-GPENSC-Teste/o-grupo.html
```

**Importante:**
- Renomear o arquivo pode quebrar links antigos que outras pessoas já salvaram ou compartilharam. Se a página já estiver publicada, atualize também os links internos e avise quem usa o endereço antigo.
- Alterar apenas o texto `text:` no menu muda o nome exibido, não a URL. É o `href:`/nome do arquivo que determina o destino.
### Usar um domínio institucional próprio (por exemplo, `www.gpensc.ufop.br`)

Se, no futuro, o grupo quiser acessar o site diretamente por **`https://www.gpensc.ufop.br`**, sem aparecer `github.io` no endereço, será necessário configurar um **domínio personalizado no GitHub Pages** e solicitar uma alteração no DNS institucional da UFOP. Isso não é feito pelo painel de edição de conteúdo.

**Passos gerais para quando a UFOP autorizar o endereço:**

1. **Confirmar com a equipe de TI responsável pelos domínios da UFOP** que `www.gpensc.ufop.br` pode ser destinado ao site do GPENSC e pedir a criação do registro DNS indicado pela documentação do GitHub Pages. Para um subdomínio `www`, normalmente é usado um registro **CNAME** apontando para `maiconcarlospng.github.io`; a equipe de TI deve confirmar e aplicar o registro correto conforme as regras institucionais.
2. No GitHub, abrir o repositório `maiconcarlospng/Site-GPENSC-Teste` e ir a **Settings → Pages → Custom domain**. Informar `www.gpensc.ufop.br` e salvar. É necessário ter permissão administrativa no repositório.
3. Garantir que a publicação do Quarto preserve o arquivo `CNAME` com o domínio na raiz do site publicado. Como este projeto publica por GitHub Actions, conferir o workflow de publicação e a documentação atual do Quarto/GitHub Pages antes de alterar arquivos; não basta criar o arquivo em uma pasta que não seja publicada.
4. Aguardar a propagação do DNS e a validação do domínio no GitHub Pages. Quando a opção estiver disponível, ativar **Enforce HTTPS** nas configurações de Pages.
5. Testar `https://www.gpensc.ufop.br`, conferir se todas as páginas, imagens e links funcionam e verificar se o HTTPS está válido.

**Atenção:**
- O domínio pertence à estrutura institucional da UFOP; não presuma que podemos configurar o DNS por conta própria. A autorização e a alteração do DNS dependem da equipe responsável.
- Não remova nem substitua o endereço atual do GitHub Pages antes de o domínio novo funcionar e ser testado.
- Se a intenção for usar também `gpensc.ufop.br` sem `www`, esse é outro nome DNS e precisa ser tratado separadamente com a TI. Redirecionamento entre as duas versões também deve ser planejado.
- O endereço personalizado muda o endereço principal do site, não os nomes das páginas. As URLs internas e a configuração do Quarto precisam continuar coerentes com o domínio novo.
- Não altere o nome de um arquivo de página sem conferir e atualizar as referências no `_quarto.yml` e nos links do restante do site.

### Opção gratuita ou domínio próprio pago (com hospedagem no GitHub)

Como o site continuará hospedado no **GitHub Pages**, há duas possibilidades diferentes:

| Opção | Exemplo de endereço | Custo do endereço | O que muda |
|---|---|---|---|
| **Gratuita** | `maiconcarlospng.github.io/Site-GPENSC-Teste/` | Gratuito | Mantém o endereço fornecido pelo GitHub, incluindo o nome de usuário e do repositório. |
| **Paga: domínio próprio** | `www.gpensc.com.br` | Pagamento e renovação do domínio | O público acessa um endereço curto e próprio, mas os arquivos continuam publicados pelo GitHub Pages. |

**Importante:** o GitHub Pages não oferece, normalmente, um endereço gratuito personalizado como `www.gpensc.com.br`. Para usar um domínio curto e próprio, é preciso registrar e renovar esse domínio. O que pode continuar gratuito é a hospedagem do site no GitHub Pages, desde que o projeto e o uso atendam às condições do serviço.

Se quiserem gastar **zero**, mantenham o endereço atual do GitHub Pages. Vocês podem usar um link curto de redirecionamento de terceiros, se encontrarem um serviço confiável, mas isso não transforma o endereço principal em um domínio próprio e o serviço pode ter limitações ou deixar de funcionar.

Se quiserem um endereço como `www.gpensc.com.br`, sigam os passos da seção abaixo. Antes de escolher, consultem a disponibilidade e o preço atual no [Registro.br](https://registro.br/) para domínios `.br`; para outras extensões, consultem o registrador correspondente. O custo exato pode mudar, então não fixem um valor no planejamento sem conferir o preço vigente.

### Usar um domínio independente da UFOP (por exemplo, `www.gpensc.com.br`)

Se o grupo preferir um endereço que não dependa do domínio institucional da Universidade, pode registrar um domínio próprio, como **`gpensc.com.br`** ou **`gpensc.org.br`**, caso estejam disponíveis e o grupo cumpra os requisitos de registro. Esses são apenas exemplos: a disponibilidade precisa ser consultada antes de escolher.

**Como funciona:**

1. **Escolher e consultar o domínio.** Para endereços brasileiros terminados em `.br`, consulte o [Registro.br](https://registro.br/). Verifique a disponibilidade, as regras para a extensão escolhida e o custo vigente.
2. **Definir quem será o titular.** O ideal é que o domínio fique registrado em nome de uma pessoa ou entidade responsável e que os dados de acesso e renovação sejam guardados de forma segura pelo grupo. O domínio normalmente exige pagamento e renovação periódica.
3. **Configurar o DNS.** No serviço em que o domínio for administrado, criar os registros exigidos pelo GitHub Pages. Para o endereço `www.gpensc.com.br`, normalmente se configura um registro **CNAME** apontando para `maiconcarlospng.github.io`. Para o endereço sem `www` (`gpensc.com.br`), são necessários registros DNS diferentes. Siga a documentação atual do GitHub Pages e as instruções do provedor.
4. **Configurar o GitHub Pages.** No repositório, abra **Settings → Pages → Custom domain**, informe o domínio escolhido e salve.
5. **Conferir a publicação do Quarto.** Garanta que o arquivo `CNAME` com o domínio seja incluído na raiz do site publicado pelo workflow do GitHub Actions.
6. **Validar o endereço e o HTTPS.** Aguarde a propagação do DNS, confirme a validação no GitHub Pages, habilite **Enforce HTTPS** quando estiver disponível e teste páginas, imagens e links.

**Vantagens e cuidados:**
- O endereço fica independente de `ufop.br`, mas o site ainda pode continuar hospedado gratuitamente no GitHub Pages. Registrar o domínio não exige contratar outra hospedagem.
- O domínio próprio tem custo e precisa ser renovado; o valor depende da extensão e das regras vigentes.
- Antes de divulgar, decidam quem será responsável pela titularidade, pagamentos, renovação e recuperação da conta.
- Não cancele nem altere o endereço atual até que o domínio novo esteja configurado e testado.
- Ter um domínio independente não significa que o nome está automaticamente disponível ou que o grupo tem direito a qualquer nome; verifique a disponibilidade e as condições de registro.

### Criar um campo novo numa seção que já existe
1. Acrescente o campo em `admin/config.yml`.
2. Acrescente o nome dele na lista `COLUNAS` do `R/helpers.R`.
3. Use na página ou no cartão como `x$nome_do_campo`.

Se esquecer o passo 2, o campo aparece no painel, mas **não aparece no site**.

---

## 6. Noções rápidas

- **Markdown:** `# Título`, `**negrito**`, `*itálico*`, `[texto](https://link)`, `![descrição](img/foto.png)`.
- **Bloco de R:** começa com ` ```{r} ` e termina com ` ``` `. `echo: false` esconde o código e mostra só o resultado.
- **Caixas:** `::: {.nome}` ... `:::` cria uma `div` com a classe CSS `nome`. Várias classes: `{.faixa .reveal}`.
- **`reveal`:** classe que faz o elemento aparecer suavemente ao rolar.
- **`tem(x)`:** verdadeiro se o campo está preenchido.
- **YAML:** use 2 espaços de indentação, nunca TAB.

---

## 7. Como o site é publicado

Você não precisa publicar nada manualmente. A cada alteração (pelo painel ou por `git push`), o **GitHub Actions** compila o site e o **GitHub Pages** o publica.

Configuração feita uma vez só: em **Settings → Pages → Source**, a opção deve ser **GitHub Actions**. Se estiver em "Deploy from a branch", o site não reflete as alterações.

---

## 8. Erros comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Editei no painel e o site **não mudou** | Compilação ainda em andamento, falhou, ou cache do navegador | Veja a aba **Actions** (✅?). Abra o site em janela anônima |
| Workflow ❌ vermelho | Erro na compilação | Clique no run → passo **Renderizar o site** → leia as últimas linhas do erro |
| `Não encontrei o arquivo: data/xxx.yml` | Falta o arquivo da tabela | Crie `data/xxx.yml` com `itens:` (seção 5) |
| `A tabela 'xxx' não está na lista COLUNAS` | Tabela nova sem cadastro | Acrescente em `COLUNAS` no `R/helpers.R` |
| `object 'xxx' not found` / `Can't subset columns` | Nome de campo diferente ou com erro de digitação | Confira os nomes em `COLUNAS` e em `admin/config.yml` |
| `there is no package called 'xxx'` | Pacote não instalado | No computador: `install.packages("xxx")`. No Actions: acrescente em `publish.yml` |
| Imagem ou logo não aparece | Nome do arquivo diferente (maiúsculas contam!) | Confira `img/nome.png` |
| Campo novo do painel não aparece no site | Falta em `COLUNAS` | Seção 5, "Criar um campo novo" |
| Página nova não aparece no menu | Faltou incluir no `_quarto.yml` | Seção 5, passo 2 |
| Erro de YAML | Indentação errada ou TAB | Use 2 espaços |
| Número da home zerado | Valor de `situação` ou `tipo` diferente do esperado | Use `Em andamento` e `Artigo` exatamente assim |
| `git push` rejeitado (`fetch first`) | O painel fez alterações que o seu computador não tem | `git pull --rebase` e depois `git push` |
| Actions ✅, mas o site continua antigo | **Settings → Pages → Source** não está em "GitHub Actions" | Corrija a opção e rode o workflow de novo |

---

## 9. Antes de divulgar

- [ ] Trocar todos os `[preencher]` e `[EXEMPLO]` por dados reais
- [ ] Conferir e-mail, link do CNPq, Instagram e os links do PPGSN/Escola de Nutrição (alguns eram palpites)
- [ ] Confirmar os títulos da série "GPENSC no Ar" (foram lidos de um print de baixa resolução)
- [ ] Trocar as logos por versões em alta resolução
- [ ] Ter autorização das pessoas para fotos, Lattes e e-mail
- [ ] Fazer uma edição de teste pelo painel e confirmar que ela chega ao site

## 10. Para aprender mais

- Sites em Quarto: https://quarto.org/docs/websites
- Markdown no Quarto: https://quarto.org/docs/authoring/markdown-basics.html
- Tabelas interativas (DT): https://rstudio.github.io/DT
- Temas e cores: https://quarto.org/docs/output-formats/html-themes.html


## Configurações gerais, textos e seções

No painel, abra **Configurações e textos do site** para editar os dados institucionais, missão, visão, objetivos, contatos, links, alguns títulos, textos introdutórios e rótulos de botões. Os valores iniciais foram mantidos iguais aos textos atuais para evitar mudanças visuais inesperadas.

Os controles **Ativar conteúdo da página ...** permitem mostrar o conteúdo ou substituí-lo por um aviso de seção temporariamente indisponível. Eles não apagam registros e não removem automaticamente o item correspondente do menu. Para alterar o menu, é necessário editar `_quarto.yml`.

Antes de desativar uma seção, salve e publique, depois confira o site e a aba **Actions**. Todos os controles de visibilidade começam ativados.
