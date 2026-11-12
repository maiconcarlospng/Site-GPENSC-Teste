# Integração de estatísticas do GPENSC (Umami)

O site é estático no GitHub Pages. A chave privada da API do Umami **não pode** ficar no JavaScript nem em \`data/analytics.json\`. Este Worker consulta o Umami no servidor e devolve somente métricas agregadas.

## 1. Criar a propriedade no Umami

1. Acesse [Umami Cloud](https://cloud.umami.is/).
2. Cadastre o site com o domínio \`maiconcarlospng.github.io\`.
3. Copie o Website ID.
4. Gere uma API key nas configurações da conta.

A coleta começa depois que o rastreador estiver ativo. Não há recuperação retroativa de visitas anteriores.

## 2. Publicar o Worker no Cloudflare

1. Em **Workers & Pages**, crie um Worker chamado \`gpensc-analytics\`.
2. Cole o conteúdo de \`worker.js\` no editor de código (módulo ES).
3. Em **Settings → Variables and Secrets**, configure:
   - Secret \`UMAMI_API_KEY\`: a API key do Umami.
   - Secret \`UMAMI_WEBSITE_ID\`: o Website ID.
   - Variable \`ALLOWED_ORIGIN\`: \`https://maiconcarlospng.github.io\`.
   - (Opcional) Variable \`UMAMI_API_BASE_URL\`: \`https://api.umami.is/v1\`.
4. Publique e copie a URL \`https://...workers.dev\`.

A alternativa é usar Wrangler com \`wrangler.toml\`, definindo os dois Secrets com \`npx wrangler secret put UMAMI_API_KEY\` e \`npx wrangler secret put UMAMI_WEBSITE_ID\`.

## 3. Ativar o rastreamento e o painel

Edite \`data/analytics.json\` no repositório:
- \`enabled\`: altere para \`true\`.
- \`websiteId\`: informe o Website ID.
- \`apiUrl\`: informe a URL do Worker, sem acrescentar \`/summary\`.

O rastreador usa o script oficial do Umami Cloud. O Website ID é um identificador público; a API key permanece somente como Secret no Cloudflare.

## 4. Endpoint e dados

O painel consulta \`GET /summary?days=7|30|90\`. O Worker valida a origem e o período e retorna visualizações, visitantes, sessões, duração média, evolução diária, páginas mais acessadas e referências. Se o Umami responder com erro, o painel mostra uma mensagem em vez de inventar números.
