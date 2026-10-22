# Manual de Administração do Site do GPENSC — UFOP

> **Objetivo:** registrar a configuração atual do site de testes, o funcionamento do Sveltia CMS e do OAuth, a gestão de usuários, as opções de personalização do painel e o plano para migrar o projeto para um GitHub institucional do GPENSC.
>
> **Segurança:** este documento não contém Client Secret, tokens ou senhas. Não coloque esses valores neste repositório.

## 1. Arquitetura atual

O projeto utiliza quatro componentes:

- **Quarto:** ferramenta de geração e organização do site.
- **GitHub e GitHub Pages:** armazenam o código e publicam o site.
- **Sveltia CMS:** fornece a interface de edição de conteúdo.
- **Cloudflare Workers:** intermedeia a autenticação OAuth entre o CMS e o GitHub.

Fluxo simplificado: a pessoa abre o painel, autentica-se pelo GitHub, o Worker participa do fluxo OAuth e o GitHub aplica as permissões da conta no repositório. Se o usuário tiver permissão de escrita suficiente, poderá editar conteúdo pelo CMS.

**Visualizar o site público não concede permissão para editá-lo.** A edição depende das permissões da conta GitHub e da autorização usada pelo CMS.

## 2. Endereços e configuração atuais

| Componente | Valor atual |
|---|---|
| Site de testes | https://maiconcarlospng.github.io/Site-GPENSC-Teste/ |
| Repositório do site | `maiconcarlospng/Site-GPENSC-Teste` |
| Branch principal | `main` |
| Painel administrativo | https://maiconcarlospng.github.io/Site-GPENSC-Teste/admin/ |
| Worker OAuth | https://sveltia-cms-auth.maicon-carlos.workers.dev |
| Repositório do Worker | `maiconcarlospng/sveltia-cms-auth` |
| Configuração do CMS | `admin/config.yml` |
| Código principal do Worker | `src/index.js` |
| Configuração do Wrangler | `wrangler.toml` |

Esses valores correspondem à estrutura de testes existente em outubro de 2026. Atualize a tabela após a migração institucional.

## 3. Configuração do Sveltia CMS

O arquivo `admin/config.yml` contém a configuração atual do backend:

```yaml
backend:
  name: github
  repo: maiconcarlospng/Site-GPENSC-Teste
  branch: main
  base_url: https://sveltia-cms-auth.maicon-carlos.workers.dev
```

- `name: github`: indica que o conteúdo é armazenado no GitHub.
- `repo`: proprietário e nome do repositório.
- `branch`: branch utilizada pelo CMS.
- `base_url`: endereço do Worker que intermedeia a autenticação.

Ao mudar para uma organização, substitua `repo` pelo identificador real no formato `ORGANIZACAO/REPOSITORIO`. Mantenha `base_url` somente se o Worker continuar no mesmo endereço.

Exemplo ilustrativo, não uma configuração já existente:

```yaml
backend:
  name: github
  repo: ORGANIZACAO/REPOSITORIO
  branch: main
  base_url: https://NOME-DO-WORKER.workers.dev
```

## 4. Aplicação OAuth do GitHub

O Client ID público da aplicação OAuth atual é:

```text
Ov23liLz0U2FQC0maAJ9
```

O **Client Secret é confidencial**. Deve ficar somente no armazenamento de segredos do ambiente de execução, nunca neste manual, em `config.yml`, em JavaScript público, em URLs ou no repositório.

Configuração atual:

- Homepage URL: `https://maiconcarlospng.github.io/Site-GPENSC-Teste/`
- Authorization callback URL: `https://sveltia-cms-auth.maicon-carlos.workers.dev/callback`

A callback configurada no GitHub deve coincidir exatamente com o endereço esperado pelo Worker.

Para revisar a aplicação, entre no GitHub com a conta proprietária e abra **Settings → Developer settings → OAuth Apps**. A localização dos menus pode variar.

Ao criar uma nova aplicação OAuth para o GPENSC, será necessário configurar o Client ID e o Client Secret correspondentes no Worker, além da callback correta. Transferir o repositório não transfere automaticamente as credenciais OAuth nem as configurações do Cloudflare.

## 5. Cloudflare Workers: variáveis e segredos

O Worker atual está disponível em:

`https://sveltia-cms-auth.maicon-carlos.workers.dev`

O repositório do código é `maiconcarlospng/sveltia-cms-auth`. O arquivo `wrangler.toml` atual contém:

```toml
name = "sveltia-cms-auth"
main = "src/index.js"
compatibility_date = "2023-03-24"
```

O código do Worker espera estas variáveis:

| Nome | Tipo | Valor/finalidade |
|---|---|---|
| `GITHUB_CLIENT_ID` | Variable | Client ID da aplicação OAuth |
| `GITHUB_CLIENT_SECRET` | Secret | Client Secret correspondente; não registrar seu valor em arquivos |
| `ALLOWED_DOMAINS` | Variable | `maiconcarlospng.github.io` para o site atual |

A variável `ALLOWED_DOMAINS` participa da validação do domínio informado no fluxo de autenticação. Antes de mudar de domínio, examine como ela é lida em `src/index.js` e configure o valor compatível com o novo endereço.

### Onde configurar as variáveis

1. No painel Cloudflare, abra **Workers & Pages**.
2. Selecione `sveltia-cms-auth`.
3. Acesse as configurações do Worker.
4. Localize **Runtime variables and secrets**.
5. Selecione o ambiente **Production**.
6. Configure `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` e `ALLOWED_DOMAINS`.
7. Salve e publique/reimplante, se solicitado.

### Erro encontrado e solução

O serviço retornava:

```text
OAuth app client ID or secret is not configured.
```

As variáveis estavam em **Builds → Variables and secrets**, mas o código precisava delas durante a execução do Worker. A solução foi adicionar as três entradas também em **Runtime variables and secrets**, no ambiente **Production**.

- **Runtime variables and secrets:** valores disponíveis ao código executado pelo Worker.
- **Builds → Variables and secrets:** valores disponíveis ao processo de build/deploy; não substituem necessariamente as variáveis de execução.

Não remova variáveis de build sem confirmar se o processo de implantação as utiliza. Para esse erro, a configuração crítica é a de Runtime.

### Teste de autenticação

URL de teste atual:

https://sveltia-cms-auth.maicon-carlos.workers.dev/auth?provider=github&site_id=maiconcarlospng.github.io&scope=repo%2Cuser

O comportamento esperado é iniciar o fluxo de autenticação do GitHub sem a mensagem de variável ausente. Depois, teste também pelo painel `/admin/` e confirme que o CMS consegue acessar o repositório.

A URL de teste não deve conter Client Secret.

## 6. Como liberar acesso a integrantes

Cada integrante deve usar sua própria conta GitHub. Não compartilhe uma conta ou senha entre membros.

Para editar conteúdo pelo CMS, a conta normalmente precisa de permissão de escrita no repositório. A permissão de leitura, sozinha, não permite gravar alterações.

### Repositório em uma conta pessoal

1. Abra o repositório do site.
2. Entre em **Settings → Collaborators** ou na seção equivalente de acesso.
3. Convide o nome de usuário GitHub do integrante.
4. Conceda a menor permissão suficiente. Para editores de conteúdo, comece avaliando a função **Write**.
5. A pessoa deve aceitar o convite.
6. Ela poderá acessar `/admin/` e fazer login com sua própria conta GitHub.

### Repositório em uma organização do GPENSC

É preferível administrar o acesso por equipes de uma organização GitHub em vez de conceder permissões individuais sem padrão.

Divisão possível:

- **Owners/administradores:** poucas pessoas responsáveis pela organização e segurança.
- **Equipe de manutenção:** pessoas que cuidam do código, configuração e publicação.
- **Equipe de conteúdo:** pessoas que editam páginas e notícias pelo CMS.

Atribua a cada equipe somente o acesso necessário. Não conceda **Admin** a todos os editores.

Organizações podem restringir aplicações OAuth. Se o login funcionar, mas o CMS não conseguir acessar o repositório, confira os convites, a permissão de escrita, as políticas da organização e as permissões efetivamente concedidas à aplicação.

### Retirar acesso

1. Remova o acesso direto ao repositório ou retire a pessoa da equipe que o concede.
2. Verifique se outra equipe ou convite ainda dá acesso.
3. Revise separadamente os acessos ao Cloudflare e à administração da aplicação OAuth.
4. Nunca peça nem transfira a senha pessoal de um integrante.

O OAuth não concede edição a qualquer usuário automaticamente. Acesso ao repositório também não concede, por si só, acesso administrativo ao Cloudflare.

## 7. Personalização visual do painel administrativo

É possível melhorar a experiência de edição mantendo o Sveltia CMS como motor. A opção mais segura é personalizar e organizar a interface que ele já fornece, sem substituir seu fluxo central de autenticação e gravação no GitHub.

### O que pode ser melhorado

- **Identidade visual:** logotipo, nome do projeto e elementos de marca que sejam suportados pela configuração do CMS.
- **Organização do conteúdo:** nomes claros nas coleções, descrições, grupos e ordem dos campos.
- **Formulários de edição:** rótulos compreensíveis, campos obrigatórios bem definidos, instruções curtas, campos agrupados e widgets adequados para textos, imagens, datas e categorias.
- **Pré-visualização:** melhorar os templates de preview para que textos e notícias se pareçam com as páginas publicadas.
- **Ajuda aos editores:** instruções dentro dos formulários e documentação rápida para tarefas frequentes.
- **Ajustes de CSS:** avaliar a possibilidade de aplicar uma folha de estilos personalizada compatível com a versão do Sveltia instalada, depois de testar a abordagem. Alterações que dependam de classes internas podem quebrar em atualizações.

### “Painel personalizado com Sveltia como motor”: abordagem recomendada

Há dois níveis diferentes de personalização:

**Nível 1 — Sveltia personalizado (recomendado para começar).** Mantém o painel e os componentes de edição do Sveltia; ajusta marca, coleções, campos, descrições, preview e, se a instalação permitir de modo estável, alguns estilos. O usuário continua editando por meio da interface do Sveltia. É a opção de menor complexidade e manutenção.

**Nível 2 — Interface própria integrada ao Sveltia.** Um portal com visual personalizado pode oferecer uma tela inicial de tarefas, links diretos para as coleções e instruções contextualizadas, e direcionar o usuário ao Sveltia para editar. Isso dá uma aparência mais própria, mas a tela inicial não substitui os formulários do CMS. Não se deve presumir que o Sveltia exponha uma API pública e estável para que outra aplicação controle internamente todos os seus componentes de edição.

Criar formulários próprios que gravem diretamente no GitHub enquanto “usam Sveltia como motor” seria uma integração mais complexa e precisa de desenho técnico específico. Não deve ser tratada como uma simples troca de tema. É preciso definir autenticação, permissões, validação do conteúdo, tratamento de imagens, conflitos de edição e gravações no repositório.

### Plano sugerido para o GPENSC

1. Começar pela organização das coleções e dos campos em `admin/config.yml`.
2. Definir tarefas usuais dos editores (por exemplo: editar integrantes, publicar notícias ou atualizar projetos) e desenhar os formulários para essas tarefas.
3. Configurar marca e pré-visualizações permitidas pelo CMS.
4. Criar uma página de orientação visual em `admin/`, caso seja útil, com atalhos para o painel e explicações para os editores.
5. Testar qualquer CSS adicional em ambiente de teste e após atualizações do Sveltia.
6. Somente se isso não atender às necessidades, avaliar uma interface externa ou fork próprio.

Não é recomendável alterar arquivos internos do pacote do Sveltia sem uma estratégia para manter essas mudanças ao atualizar a dependência.

## 8. Transferência para GitHub institucional do GPENSC

Planeje a migração para não interromper a publicação. Recomenda-se que pelo menos duas pessoas de confiança tenham acesso administrativo à estrutura institucional.

### Antes de começar

- Definir a conta ou organização institucional.
- Definir o nome final do repositório.
- Definir responsáveis por repositório, Cloudflare e OAuth.
- Confirmar acesso administrativo ao Cloudflare que hospeda o Worker.
- Fazer backup do repositório atual.
- Registrar os endereços e configurações sem guardar segredos.
- Decidir se o endereço final será GitHub Pages ou domínio próprio.

### Etapa A — Migrar o repositório do site

1. Crie ou prepare o repositório institucional, ou transfira o existente seguindo o procedimento do GitHub.
2. Preserve os arquivos do Quarto, conteúdo, pasta `admin/` e configurações.
3. Confirme a branch principal e os arquivos necessários à publicação.
4. Configure o GitHub Pages e o processo de publicação no destino.
5. Atualize `admin/config.yml` com o valor real `ORGANIZACAO/REPOSITORIO`.
6. Confirme o novo endereço publicado.
7. Teste as páginas, imagens, links internos, o CMS e a gravação de conteúdo.

Não presuma que a URL do GitHub Pages permanecerá igual após mudar o proprietário ou nome do repositório. Revise também os caminhos/base URL do Quarto.

### Etapa B — Atualizar o domínio autorizado

1. Confirme o domínio final do site publicado.
2. Examine `src/index.js` para entender como `ALLOWED_DOMAINS` é interpretada.
3. Atualize a variável em **Runtime variables and secrets → Production**.
4. Se o Worker mudar de endereço, atualize `base_url` em `admin/config.yml`.
5. Teste usando a URL, o domínio e o `site_id` reais do novo site.

### Etapa C — OAuth e Worker

1. Decida se o Worker existente continuará sendo usado ou será criado outro sob uma conta institucional do Cloudflare.
2. Decida se a aplicação OAuth atual continuará sendo administrada pela conta original ou será substituída por uma nova aplicação institucional.
3. Se criar outra aplicação OAuth, configure seu callback para o endereço final do Worker, coloque o novo Client ID e Client Secret em **Runtime variables and secrets → Production** e teste o fluxo.
4. Revise o acesso de administradores aos repositórios do site e do Worker.
5. Teste o login com uma conta de editor e confirme leitura e gravação no repositório.

### Etapa D — Validação final

- [ ] Site público carrega corretamente.
- [ ] Página `/admin/` abre.
- [ ] Login OAuth conclui sem erros.
- [ ] Um usuário sem acesso não consegue gravar conteúdo.
- [ ] Um editor autorizado consegue salvar uma mudança de teste.
- [ ] A mudança é publicada conforme o fluxo configurado.
- [ ] Imagens, links internos e pré-visualizações funcionam.
- [ ] Client Secret e demais segredos não aparecem em arquivos ou no histórico público.
- [ ] Pelo menos duas pessoas de confiança têm o acesso administrativo necessário.

Mantenha o site antigo disponível até validar o destino, quando isso for viável.

## 9. Manutenção e resolução de problemas

### Erro: `OAuth app client ID or secret is not configured.`

Confira se `GITHUB_CLIENT_ID` e `GITHUB_CLIENT_SECRET` estão configurados em **Runtime variables and secrets → Production**. A variável no ambiente de build, isoladamente, não basta.

### Login funciona, mas o CMS não acessa ou não grava no repositório

- Confirme que `repo` e `branch` em `admin/config.yml` estão corretos.
- Confirme que a conta autenticada tem permissão de escrita.
- Verifique convites pendentes e regras da organização.
- Confira se a aplicação OAuth tem as autorizações exigidas pelo fluxo.
- Confira logs do Worker sem registrar nem compartilhar segredos.

### O site abre, mas o painel ou os arquivos não

Confirme o URL de publicação, os caminhos relativos/base URL do Quarto, a presença da pasta `admin/` e se o GitHub Pages publicou a versão mais recente.

### Alterações no painel quebraram após uma atualização

Se foram adicionados estilos que dependem da estrutura interna do Sveltia, reverta temporariamente esses ajustes e teste novamente. Prefira as opções de configuração documentadas pelo CMS e mantenha um ambiente de teste.

## 10. Checklist periódico

- [ ] Confirmar que há pelo menos duas pessoas responsáveis.
- [ ] Revisar integrantes e equipes com acesso ao repositório.
- [ ] Revisar pessoas com acesso ao Cloudflare e à aplicação OAuth.
- [ ] Verificar se as variáveis do Worker permanecem em Runtime.
- [ ] Testar periodicamente o login e a gravação pelo CMS.
- [ ] Manter backup e registro das mudanças de configuração.
- [ ] Nunca salvar Client Secret ou tokens no repositório.
- [ ] Atualizar este manual quando URLs, contas, repositórios, domínios ou fluxos de publicação mudarem.
