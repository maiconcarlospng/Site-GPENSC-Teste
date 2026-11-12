# Worker de acesso por código ao painel GPENSC

Este Worker habilita uma segunda forma de entrada no painel próprio: a pessoa informa um código fornecido pela coordenação e não precisa autenticar sua conta pessoal no GitHub.

O navegador **não recebe o token do GitHub**. O Worker mantém a credencial em Secret e faz a ponte com a API do GitHub, limitada ao repositório do site, aos arquivos de conteúdo/imagens e aos métodos usados pelo painel.

## Antes de publicar

A integração usa uma credencial GitHub de serviço. Prefira uma conta institucional ou de serviço controlada pelo GPENSC. Enquanto o repositório permanecer sob a conta pessoal de desenvolvimento, a credencial precisa ter acesso ao repositório atual.

Crie um Fine-grained personal access token no GitHub, limitado ao repositório \`maiconcarlospng/Site-GPENSC-Teste\`, com:
- **Contents: Read and write**;
- **Metadata: Read-only**.

Não habilite acesso a outros repositórios ou permissões desnecessárias. A credencial fica somente como Secret no Cloudflare.

## Publicar no Cloudflare

1. Em **Workers & Pages**, crie um Worker chamado \`gpensc-admin-access\`.
2. Cole o conteúdo de \`worker.js\` no editor (formato Module) e salve.
3. Em **Settings → Variables and Secrets**, adicione:
   - Secret \`GITHUB_TOKEN\`: o Fine-grained token descrito acima.
   - Secret \`ACCESS_CODE\`: código forte a ser compartilhado com os colaboradores autorizados.
   - Secret \`SESSION_SECRET\`: chave aleatória de assinatura de sessões.
   - Variable \`ALLOWED_ORIGIN\`: \`https://maiconcarlospng.github.io\`.
4. Gere os dois segredos aleatórios localmente, sem enviá-los por mensagem. Exemplo com OpenSSL:
   \`\`\`bash
   openssl rand -base64 32
   openssl rand -hex 32
   \`\`\`
   Use a primeira saída como \`ACCESS_CODE\` e a segunda como \`SESSION_SECRET\`.
5. Publique o Worker e confirme a URL. Com a conta Cloudflare que já hospeda o Worker OAuth atual, o endereço esperado é \`https://gpensc-admin-access.maicon-carlos.workers.dev\`. Caso o Cloudflare mostre outro subdomínio, atualize \`ACCESS_WORKER\` em \`admin/app.js\` para a URL efetiva.
6. A entrada por código do painel usa essa URL automaticamente após a publicação do Worker.

O arquivo \`wrangler.toml\` contém as variáveis públicas. **Não** adicione os três Secrets ao arquivo nem ao GitHub.

## Como funciona e limites

- O código compartilhado é validado no Worker.
- Após a validação, o Worker emite uma sessão assinada, válida por 8 horas.
- A sessão é guardada apenas no \`sessionStorage\` do navegador e expira automaticamente.
- A troca do Secret \`ACCESS_CODE\` invalida sessões emitidas com o código anterior.
- O Worker só aceita chamadas da origem pública configurada.
- O proxy permite leitura da configuração e dos YAML, leitura do histórico de commits, atualização de YAML em \`data/\` e envio de arquivos para \`img/\`. Outras rotas, repositórios, métodos e branches são bloqueados.

**Atenção:** todos que usarem o mesmo código compartilham as permissões da credencial GitHub configurada no Worker. As alterações aparecerão no GitHub sob a conta proprietária dessa credencial, não sob a identidade individual de quem digitou o código. Para revogar o acesso, troque o Secret \`ACCESS_CODE\`; para interromper todas as sessões, altere também \`SESSION_SECRET\`.

Configure uma regra de rate limiting no Cloudflare para limitar tentativas de \`POST /token/login\`. Compartilhe o código por um canal privado e somente com pessoas autorizadas a editar o site.

## Rotas

- \`POST /token/login\`: valida o código e emite uma sessão temporária.
- \`GET /github?path=...\`: faz leituras permitidas no GitHub.
- \`PUT /github?path=...\`: grava YAML/imagens nas pastas permitidas.
