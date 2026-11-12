# Integração de estatísticas do GPENSC (Umami)

O rastreador oficial do Umami já está incluído no cabeçalho do site em \`analytics.html\`, com o Website ID \`1591f591-4f93-4697-8457-60c32ded8eac\`. A configuração pública em \`data/analytics.json\` já mantém \`enabled: true\`. Portanto, **não é necessário instalar outro script nem alterar esse identificador para ativar a coleta**.

O site está preparado para enviar os eventos ao Umami Cloud. A etapa pendente é publicar o Worker que consulta a API e ligar sua URL ao painel. A chave privada da API **não pode** ficar no JavaScript nem em \`data/analytics.json\`; o Worker consulta o Umami no servidor e devolve somente métricas agregadas.

## 1. Conferir a propriedade no Umami

1. Acesse [Umami Cloud](https://cloud.umami.is/).
2. Confirme que a propriedade corresponde ao domínio \`maiconcarlospng.github.io\`.
3. Confirme o Website ID \`1591f591-4f93-4697-8457-60c32ded8eac\`.
4. Gere uma API key nas configurações da conta. Ela será cadastrada somente como Secret no Cloudflare.

A coleta começa após o rastreador estar publicado no site. Não há recuperação retroativa de visitas anteriores. A instalação do script, por si só, não confirma que os eventos já estão chegando à propriedade: confira o painel do Umami após acessar o site.

## 2. Publicar o Worker no Cloudflare

1. Em **Workers & Pages**, crie um Worker chamado \`gpensc-analytics\`.
2. Cole o conteúdo de \`worker.js\` no editor de código (módulo ES).
3. Em **Settings → Variables and Secrets**, configure:
   - Secret \`UMAMI_API_KEY\`: a API key do Umami.
   - Secret \`UMAMI_WEBSITE_ID\`: \`1591f591-4f93-4697-8457-60c32ded8eac\`.
   - Variable \`ALLOWED_ORIGIN\`: \`https://maiconcarlospng.github.io\`.
   - Variable \`UMAMI_API_BASE_URL\`: \`https://api.umami.is/v1\`.
4. Publique e copie a URL efetiva do Worker (formato \`https://...workers.dev\`).

A alternativa é usar Wrangler com \`wrangler.toml\`, definindo os dois Secrets com \`npx wrangler secret put UMAMI_API_KEY\` e \`npx wrangler secret put UMAMI_WEBSITE_ID\`.

## 3. Conectar as estatísticas ao painel

Depois da publicação, atualize \`apiUrl\` em \`data/analytics.json\` com a URL base do Worker, sem acrescentar \`/summary\`. Mantenha \`enabled: true\`, o provedor \`umami\` e o Website ID existente. Exemplo:

\`\`\`json
{
  "enabled": true,
  "provider": "umami",
  "websiteId": "1591f591-4f93-4697-8457-60c32ded8eac",
  "trackerUrl": "https://cloud.umami.is/script.js",
  "apiUrl": "https://URL-EFETIVA-DO-WORKER"
}
\`\`\`

O painel consulta \`GET /summary?days=7|30|90\`. **Nunca** coloque a API key em \`analytics.html\`, \`data/analytics.json\`, JavaScript do painel ou no README. Ela deve existir somente como Secret no Cloudflare.

## 4. Verificar o funcionamento

1. Abra o site público e navegue por algumas páginas.
2. Confira no Umami se as visitas aparecem na propriedade correta.
3. Abra o painel administrativo e confira os períodos de 7, 30 e 90 dias.
4. Se a coleta aparecer no Umami, mas não no painel, revise a URL do Worker, os Secrets e \`ALLOWED_ORIGIN\`.

As estatísticas disponíveis começam a ser coletadas depois da instalação do rastreador e não incluem visitas anteriores.
