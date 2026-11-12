const json = (body, status, origin, extraHeaders = {}) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin",
    ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    ...extraHeaders
  }
});
function number(value) {
  if (value && typeof value === "object") value = value.value;
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}
function rows(payload, key) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload[key])) return payload[key];
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}
function normalizeRows(payload, key) {
  return rows(payload, key).map((item) => ({
    label: String(item.x ?? item.label ?? item.name ?? "Não identificado"),
    value: number(item.y ?? item.value ?? item.count)
  }));
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = env.ALLOWED_ORIGIN || "";
    if (!allowedOrigin || origin !== allowedOrigin) return json({ ok: false, error: "Origem não autorizada." }, 403);
    if (request.method === "OPTIONS") {
      return new Response(null, {status:204,headers:{
        "Access-Control-Allow-Origin":allowedOrigin,
        "Access-Control-Allow-Methods":"GET, OPTIONS",
        "Access-Control-Allow-Headers":"Content-Type",
        "Access-Control-Max-Age":"86400",
        "Vary":"Origin"
      }});
    }
    const url = new URL(request.url);
    if (request.method !== "GET" || url.pathname !== "/summary") return json({ok:false,error:"Rota não encontrada."},404,allowedOrigin);
    if (!env.UMAMI_API_KEY || !env.UMAMI_WEBSITE_ID) return json({ok:false,error:"O Umami ainda não foi configurado no serviço de estatísticas."},503,allowedOrigin);

    const requestedDays=Number(url.searchParams.get("days")||30);
    const days=[7,30,90].includes(requestedDays)?requestedDays:30;
    const endAt=Date.now(),startAt=endAt-days*24*60*60*1000;
    const apiBase=(env.UMAMI_API_BASE_URL||"https://api.umami.is/v1").replace(/\/+$/,"");
    const websiteId=encodeURIComponent(env.UMAMI_WEBSITE_ID);
    const common=new URLSearchParams({startAt:String(startAt),endAt:String(endAt)});
    async function umami(path,extra={}) {
      const params=new URLSearchParams(common);
      for(const [key,value] of Object.entries(extra))params.set(key,String(value));
      const response=await fetch(apiBase+"/websites/"+websiteId+"/"+path+"?"+params.toString(),{
        headers:{"x-umami-api-key":env.UMAMI_API_KEY,"Accept":"application/json"}
      });
      const payload=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(String(payload.message||payload.error||("Erro "+response.status+" na API do Umami.")));
      return payload;
    }
    try {
      const results=await Promise.all([
        umami("stats"),
        umami("pageviews",{unit:"day"}).catch(()=>null),
        umami("metrics",{type:"path",limit:5}).catch(()=>null),
        umami("metrics",{type:"referrer",limit:5}).catch(()=>null)
      ]);
      const rawStats=results[0]&&(results[0].data||results[0]);
      const pageviews=number(rawStats.pageviews),visitors=number(rawStats.visitors);
      const visits=number(rawStats.visits),bounces=number(rawStats.bounces);
      const totalTime=number(rawStats.totaltime??rawStats.totalTime);
      return json({
        ok:true,days,
        stats:{pageviews,visitors,visits,bounceRate:visits?(bounces/visits)*100:0,avgDurationSeconds:visits?totalTime/visits/1000:0},
        series:normalizeRows(results[1],"pageviews"),
        topPages:normalizeRows(results[2],"metrics"),
        referrers:normalizeRows(results[3],"metrics")
      },200,allowedOrigin,{"Cache-Control":"public, max-age=60"});
    } catch(error) {
      return json({ok:false,error:error.message||"Falha ao consultar a API do Umami."},502,allowedOrigin);
    }
  }
};
