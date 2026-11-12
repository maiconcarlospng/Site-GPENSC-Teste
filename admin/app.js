(() => {
'use strict';
const REPO='maiconcarlospng/Site-GPENSC-Teste';
const BRANCH='main';
const WORKER='https://sveltia-cms-auth.maicon-carlos.workers.dev';
const ACCESS_WORKER='https://gpensc-admin-access.maicon-carlos.workers.dev';
const API='https://api.github.com';
const $=s=>document.querySelector(s);
const state={token:sessionStorage.getItem('gpen_admin_token')||'',authMode:sessionStorage.getItem('gpen_admin_auth_mode')||'github',user:null,config:null,collections:[],active:null,contents:{},sha:{},editing:null,activity:[],activityLoaded:false,activityPromise:null,activityError:'',analyticsConfig:null,analyticsData:null,analyticsLoading:false,analyticsError:'',analyticsDays:30};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast=(message,error=false)=>{const el=document.createElement('div');el.className='toast'+(error?' error':'');el.textContent=message;$('#toast-root').append(el);setTimeout(()=>el.remove(),3800)};
const apiHeaders=()=>({'Authorization':'Bearer '+state.token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'});
async function api(path,options={}){
  const viaAccessCode=state.authMode==='access-code';
  const url=viaAccessCode?ACCESS_WORKER+'/github?path='+encodeURIComponent(path):API+path;
  const headers=viaAccessCode
    ?{'Authorization':'Bearer '+state.token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(options.headers||{})}
    :{...apiHeaders(),...(options.headers||{})};
  const r=await fetch(url,{...options,headers});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(data.message||data.error||'Falha ao comunicar com o GitHub.');
  return data;
}
async function loginWithCode(){
  const code=$('#access-code').value.trim();
  const button=$('#token-login-button');
  if(!code){$('#login-status').textContent='Informe o código de acesso.';$('#access-code').focus();return}
  button.disabled=true;button.textContent='Verificando…';
  $('#login-status').textContent='Validando o código de acesso…';
  try{
    const response=await fetch(ACCESS_WORKER+'/token/login',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({code})});
    const data=await response.json().catch(()=>({}));
    if(!response.ok||!data.token)throw new Error(data.error||'Não foi possível validar o código.');
    state.token=data.token;state.authMode='access-code';
    sessionStorage.setItem('gpen_admin_token',state.token);
    sessionStorage.setItem('gpen_admin_auth_mode',state.authMode);
    $('#access-code').value='';
    await initialize();
  }catch(error){
    $('#login-status').textContent=error.message||'Falha ao validar o código.';
    toast(error.message||'Falha ao validar o código.',true);
  }finally{button.disabled=false;button.textContent='Entrar com código'}
}
function login(){
  const workerOrigin=new URL(WORKER).origin;
  const url=WORKER+'/auth?provider=github&site_id='+encodeURIComponent(location.hostname)+'&scope=repo';
  const popup=window.open(url,'gpen-github-auth','width=620,height=720,menubar=no,toolbar=no');
  if(!popup){toast('Permita a abertura da janela de autenticação.',true);return}
  $('#login-status').textContent='Aguardando autorização do GitHub…';
  let finished=false;
  const finish=()=>{if(finished)return;finished=true;clearTimeout(timeout);window.removeEventListener('message',listener)};
  const timeout=setTimeout(()=>{
    finish();
    $('#login-status').textContent='A autenticação não foi concluída. Feche a janela de autorização e tente novamente.';
  },180000);
  function listener(event){
    if(event.origin!==workerOrigin||event.source!==popup)return;
    const msg=String(event.data||'');
    // O Worker inicia um handshake: a janela principal precisa responder
    // para que o callback envie o token de volta com segurança.
    if(msg==='authorizing:github'){
      popup.postMessage('authorizing:github',workerOrigin);
      return;
    }
    if(!msg.startsWith('authorization:github:'))return;
    finish();
    try{
      const parts=msg.split(':');
      const result=JSON.parse(parts.slice(3).join(':'));
      if(parts[2]!=='success'||!result.token)throw new Error(result.error||'Autorização não concluída.');
      state.token=result.token;
      state.authMode='github';
      sessionStorage.setItem('gpen_admin_token',state.token);
      sessionStorage.setItem('gpen_admin_auth_mode',state.authMode);
      popup.close();
      initialize();
    }catch(e){
      $('#login-status').textContent=e.message;
      toast(e.message,true);
    }
  }
  window.addEventListener('message',listener);
}
async function initialize(){try{const user=state.authMode==='access-code'?{name:'Acesso por código',login:'Colaborador'}:await api('/user');state.user=user;$('#user-name').textContent=user.name||user.login;$('#login-view').hidden=true;$('#workspace').hidden=false;await loadConfig();await loadAnalyticsConfig();await loadAll();renderNav();renderHome()}catch(e){state.token='';state.authMode='github';sessionStorage.removeItem('gpen_admin_token');sessionStorage.removeItem('gpen_admin_auth_mode');$('#workspace').hidden=true;$('#login-view').hidden=false;$('#login-status').textContent=e.message;toast('Não foi possível conectar ao repositório.',true)}}
async function loadConfig(){const r=await api('/repos/'+REPO+'/contents/admin/config.yml?ref='+BRANCH);state.sha['admin/config.yml']=r.sha;const raw=decodeURIComponent(escape(atob(r.content.replace(/\n/g,''))));state.config=jsyaml.load(raw);state.collections=(state.config.collections||[]).flatMap(group=>(group.files||[]).map(file=>({...file,groupName:group.label,group:group.name})))}
async function readFile(path){const r=await api('/repos/'+REPO+'/contents/'+path+'?ref='+BRANCH);state.sha[path]=r.sha;return jsyaml.load(decodeURIComponent(escape(atob(r.content.replace(/\n/g,'')))))||{itens:[]}}
async function loadAll(){await Promise.all(state.collections.map(async item=>{try{state.contents[item.file]=await readFile(item.file)}catch(e){state.contents[item.file]={itens:[]}}}))}
function entryList(entry){return Array.isArray(state.contents[entry.file]?.itens)?state.contents[entry.file].itens:[]}
function isExampleRecord(item){
  return Object.values(item||{}).some(value=>typeof value==='string'&&/\[EXEMPLO\]|\[NOME\]|\[SOBRENOME|\[PERIÓDICO\]|\[EVENTO\]|\[Agência\/Edital\]|\[Nome\]/i.test(value));
}
function summaryRecords(entry){return entryList(entry).filter(item=>item&&!isExampleRecord(item))}
function isConfigCollection(entry){return entry?.group==='configuracoes'||String(entry?.file||'').startsWith('data/configuracoes/')}
function isGalleryCollection(entry){return entry?.name==='galeria'||entry?.file==='data/galeria.yml'}
function collectionSummary(entry){return isConfigCollection(entry)?'Configuração institucional':entryList(entry).length+' registros cadastrados'}
function titleOf(item){return item.titulo||item.nome||item.episodio||item.codigo||item.autor||'Registro sem título'}
function renderNav(){
  const nav=$('#collection-nav');
  const content=state.collections.map((c,i)=>({c,i})).filter(({c})=>!isConfigCollection(c));
  const settings=state.collections.map((c,i)=>({c,i})).filter(({c})=>isConfigCollection(c));
  const button=({c,i})=>'<button type="button" data-index="'+i+'" class="'+(state.active===i?'active':'')+'">'+
    '<span>'+esc(c.label)+'</span><span class="nav-count">'+(isConfigCollection(c)?'Editar':entryList(c).length)+'</span></button>';
  nav.innerHTML=
    '<button type="button" data-summary class="summary-nav-item '+(state.active===null?'active':'')+'"><span>Painel de resumo</span><span class="nav-count">Resumo</span></button>'+
    '<section class="menu-section menu-section-content" aria-label="Conteúdo do site">'+
      '<div class="menu-section-title">CONTEÚDO DO SITE</div>'+
      '<div class="menu-section-items">'+content.map(button).join('')+'</div>'+
    '</section>'+
    '<section class="menu-section menu-section-settings" aria-label="Configurações">'+
      '<div class="menu-section-title">CONFIGURAÇÕES</div>'+
      '<div class="menu-section-items">'+settings.map(button).join('')+'</div>'+
    '</section>';
  nav.querySelector('[data-summary]').addEventListener('click',()=>{renderHome();closeMobileMenu()});
  nav.querySelectorAll('[data-index]').forEach(b=>b.addEventListener('click',()=>{openCollection(Number(b.dataset.index));closeMobileMenu()}));
}
function donutSegment(items){
  const total=items.reduce((sum,item)=>sum+item.value,0);
  const colors=['#315d40','#79a66a','#d08a42','#7795a8','#a88ab2','#b8a47a'];
  const radius=35,circumference=2*Math.PI*radius;
  let offset=0;
  const segments=items.filter(item=>item.value>0).map((item,index)=>{
    const length=total?circumference*item.value/total:0;
    const circle='<circle cx="50" cy="50" r="'+radius+'" fill="none" stroke="'+colors[index%colors.length]+'" stroke-width="13" stroke-dasharray="'+length+' '+(circumference-length)+'" stroke-dashoffset="'+(-offset)+'" transform="rotate(-90 50 50)"/>';
    offset+=length;
    return circle;
  }).join('');
  const chart='<svg class="donut-chart" viewBox="0 0 100 100" role="img" aria-label="Gráfico de distribuição">'+
    '<circle cx="50" cy="50" r="'+radius+'" fill="none" stroke="#e8eee8" stroke-width="13"/>'+segments+
    '<text x="50" y="47" text-anchor="middle" class="donut-total">'+total+'</text>'+
    '<text x="50" y="59" text-anchor="middle" class="donut-caption">registros</text></svg>';
  const legend=items.map((item,index)=>'<div class="chart-legend-item"><span class="chart-legend-dot" style="background:'+(item.value?colors[index%colors.length]:'#dfe6df')+'"></span><span class="chart-legend-label">'+esc(item.label)+'</span><strong>'+item.value+'</strong></div>').join('');
  return '<div class="donut-layout">'+chart+'<div class="chart-legend">'+legend+'</div></div>';
}
function activityDate(value){
  const date=new Date(value);
  if(Number.isNaN(date.getTime()))return 'Data não informada';
  return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(date);
}
function renderRecentActivity(){
  const host=$('#recent-activity');
  if(!host)return;
  if(state.activityError){
    host.innerHTML='<div class="activity-empty">Não foi possível carregar o histórico agora. Use “Atualizar dados” para tentar novamente.</div>';
    return;
  }
  if(!state.activityLoaded){
    host.innerHTML='<div class="activity-empty"><span class="activity-loader"></span> Consultando o histórico do repositório…</div>';
    return;
  }
  if(!state.activity.length){
    host.innerHTML='<div class="activity-empty">Ainda não há adições recentes de registros no histórico do repositório.</div>';
    return;
  }
  host.innerHTML='<ol class="activity-list">'+state.activity.map(item=>
    '<li class="activity-entry"><span class="activity-marker" aria-hidden="true"></span><div class="activity-entry-main">'+
    '<div class="activity-entry-top"><strong>'+esc(item.title)+'</strong><time datetime="'+esc(item.date)+'">'+esc(activityDate(item.date))+'</time></div>'+
    '<p>'+esc(item.collections.join(', '))+'</p>'+
    '<div class="activity-entry-meta"><span class="activity-added">+'+item.added+' '+(item.added===1?'registro':'registros')+'</span><span>por '+esc(item.author||'Colaborador')+'</span></div>'+
    '</div><a class="activity-commit-link" href="'+esc(item.url)+'" target="_blank" rel="noopener" aria-label="Ver alteração no GitHub">Ver commit ↗</a></li>'
  ).join('')+'</ol>';
}
async function loadRecentActivity(force=false){
  if(state.activityPromise)return state.activityPromise;
  if(state.activityLoaded&&!force){renderRecentActivity();return}
  state.activityError='';
  state.activityLoaded=false;
  renderRecentActivity();
  state.activityPromise=(async()=>{
    try{
      const commits=await api('/repos/'+REPO+'/commits?path=data&per_page=15');
      const details=await Promise.all((Array.isArray(commits)?commits:[]).slice(0,12).map(async commit=>{
        try{return await api('/repos/'+REPO+'/commits/'+commit.sha)}
        catch(error){return null}
      }));
      const activity=[];
      for(const detail of details){
        if(!detail?.files?.length)continue;
        const additionsByFile=[];
        for(const file of detail.files){
          if(!file.filename.startsWith('data/')||!/\.(yml|yaml)$/i.test(file.filename))continue;
          const patch=String(file.patch||'').split('\n');
          const addedRecords=patch.filter(line=>/^\+\s+-\s+/.test(line)).length;
          const removedRecords=patch.filter(line=>/^-\s+-\s+/.test(line)).length;
          const netAdds=Math.max(0,addedRecords-removedRecords);
          if(netAdds>0){
            const collection=state.collections.find(item=>item.file===file.filename);
            additionsByFile.push({label:collection?.label||file.filename.replace(/^data\//,''),count:netAdds});
          }
        }
        const added=additionsByFile.reduce((sum,item)=>sum+item.count,0);
        if(!added)continue;
        activity.push({
          title:String(detail.commit?.message||'Novos registros adicionados').split('\n')[0],
          added,
          collections:additionsByFile.map(item=>item.label),
          author:detail.author?.login||detail.commit?.author?.name||'Colaborador',
          date:detail.commit?.author?.date||detail.commit?.committer?.date||'',
          url:detail.html_url||'#'
        });
      }
      state.activity=activity.slice(0,6);
      state.activityLoaded=true;
    }catch(error){
      state.activityError=error.message||'Erro ao consultar commits';
    }finally{
      state.activityPromise=null;
      renderRecentActivity();
    }
  })();
  return state.activityPromise;
}
function dashboardCharts(){
  const areas=new Map();
  const types=[];
  state.collections.filter(item=>!isConfigCollection(item)).forEach(item=>{
    const count=summaryRecords(item).length;
    const area=String(item.groupName||item.group||'Outras áreas').replace(/^\d+\s*[·.-]\s*/,'');
    areas.set(area,(areas.get(area)||0)+count);
    if(count)types.push({label:item.label,value:count});
  });
  const areaData=[...areas.entries()].map(([label,value])=>({label,value})).filter(item=>item.value>0);
  const sortedTypes=types.sort((a,b)=>b.value-a.value);
  const typeData=sortedTypes.slice(0,6);
  if(sortedTypes.length>6){
    typeData.push({label:'Outros conteúdos',value:sortedTypes.slice(6).reduce((sum,item)=>sum+item.value,0)});
  }
  return {areaData,typeData};
}

async function loadAnalyticsConfig(){
  try{
    const response=await fetch(new URL('../data/analytics.json',location.href),{cache:'no-store'});
    if(!response.ok)throw new Error('Configuração indisponível');
    state.analyticsConfig=await response.json();
  }catch(error){state.analyticsConfig={enabled:false,websiteId:'',apiUrl:''}}
}
function analyticsNumber(value){
  if(value&&typeof value==='object')value=value.value;
  const number=Number(value);
  return Number.isFinite(number)?new Intl.NumberFormat('pt-BR').format(number):'—';
}
function analyticsDuration(value){
  const seconds=Number(value);
  if(!Number.isFinite(seconds)||seconds<0)return '—';
  const minutes=Math.floor(seconds/60),rest=Math.floor(seconds%60);
  return minutes?minutes+' min '+String(rest).padStart(2,'0')+' s':rest+' s';
}
function analyticsTrendChart(series){
  const values=(Array.isArray(series)?series:[]).map(item=>({label:String(item.label||item.x||''),value:Number(item.value??item.y??0)})).filter(item=>Number.isFinite(item.value));
  if(values.length<2)return '<div class="analytics-empty-chart">Ainda não há dados suficientes para montar a evolução diária.</div>';
  const width=640,height=180,padX=18,padY=18,max=Math.max(1,...values.map(item=>item.value));
  const points=values.map((item,index)=>({x:padX+(width-padX*2)*index/(values.length-1),y:height-padY-(height-padY*2)*item.value/max,value:item.value}));
  const polyline=points.map(point=>point.x.toFixed(1)+','+point.y.toFixed(1)).join(' ');
  const circles=points.map(point=>'<circle cx="'+point.x.toFixed(1)+'" cy="'+point.y.toFixed(1)+'" r="3" fill="#477d55"><title>'+analyticsNumber(point.value)+'</title></circle>').join('');
  const grid=[0,1,2,3].map(index=>{const y=padY+(height-padY*2)*index/3;return '<line x1="'+padX+'" y1="'+y.toFixed(1)+'" x2="'+(width-padX)+'" y2="'+y.toFixed(1)+'" stroke="#edf1ed" stroke-width="1"/>'}).join('');
  return '<div class="analytics-trend-chart"><svg viewBox="0 0 '+width+' '+height+'" role="img" aria-label="Evolução diária das visualizações">'+grid+'<polyline points="'+polyline+'" fill="none" stroke="#477d55" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'+circles+'</svg><div class="analytics-chart-axis"><span>'+esc(values[0].label)+'</span><span>'+esc(values[values.length-1].label)+'</span></div></div>';
}
function analyticsList(items,empty){
  if(!Array.isArray(items)||!items.length)return '<div class="analytics-list-empty">'+esc(empty)+'</div>';
  return '<ol class="analytics-rank-list">'+items.slice(0,5).map(item=>{const label=String(item.label||item.x||'Não identificado');return '<li><span title="'+esc(label)+'">'+esc(label)+'</span><strong>'+analyticsNumber(item.value??item.y)+'</strong></li>'}).join('')+'</ol>';
}
function analyticsContentMarkup(){
  const config=state.analyticsConfig||{};
  if(!config.enabled||!config.websiteId){
    return '<div class="analytics-setup"><div class="analytics-setup-icon" aria-hidden="true">↗</div><div><strong>Rastreamento ainda não ativado</strong><p>Ative o rastreador do Umami para começar a contabilizar as visitas ao site.</p><a href="https://cloud.umami.is/" target="_blank" rel="noopener">Abrir Umami Cloud ↗</a></div></div>';
  }
  if(!config.apiUrl){
    return '<div class="analytics-setup"><div class="analytics-setup-icon" aria-hidden="true">✓</div><div><strong>Coleta de acessos ativada no site</strong><p>O rastreador do Umami já está instalado. Para exibir os indicadores aqui no painel, falta publicar o proxy protegido no Cloudflare e informar a URL dele em <code>data/analytics.json</code>. A chave da API deve ficar somente como Secret no Cloudflare.</p><a href="https://github.com/maiconcarlospng/Site-GPENSC-Teste/blob/main/analytics-worker/README.md" target="_blank" rel="noopener">Ver instruções da integração ↗</a></div></div>';
  }
  if(state.analyticsLoading)return '<div class="analytics-loading"><span class="activity-loader"></span> Consultando os dados de acesso…</div>';
  if(state.analyticsError)return '<div class="analytics-error"><strong>Não foi possível consultar as estatísticas.</strong><span>'+esc(state.analyticsError)+'</span><button type="button" class="secondary-button" id="analytics-retry">Tentar novamente</button></div>';
  const data=state.analyticsData||{},stats=data.stats||{};
  return '<div class="analytics-metrics-grid">'+
    '<article class="analytics-metric"><span>Visualizações de páginas</span><strong>'+analyticsNumber(stats.pageviews)+'</strong><small>Total de páginas visualizadas</small></article>'+
    '<article class="analytics-metric"><span>Visitantes únicos</span><strong>'+analyticsNumber(stats.visitors)+'</strong><small>Pessoas estimadas no período</small></article>'+
    '<article class="analytics-metric"><span>Sessões</span><strong>'+analyticsNumber(stats.visits)+'</strong><small>Visitas iniciadas</small></article>'+
    '<article class="analytics-metric"><span>Duração média</span><strong>'+analyticsDuration(stats.avgDurationSeconds)+'</strong><small>Tempo médio por sessão</small></article></div>'+
    '<div class="analytics-detail-grid"><article class="analytics-detail-card analytics-trend-card"><div class="analytics-detail-heading"><h3>Evolução das visualizações</h3><span>Por dia</span></div>'+analyticsTrendChart(data.series)+'</article>'+
    '<article class="analytics-detail-card"><div class="analytics-detail-heading"><h3>Páginas mais acessadas</h3><span>Top 5</span></div>'+analyticsList(data.topPages,'Nenhuma página registrada neste período.')+'</article>'+
    '<article class="analytics-detail-card"><div class="analytics-detail-heading"><h3>Origem dos acessos</h3><span>Referências</span></div>'+analyticsList(data.referrers,'Ainda não há referências identificadas.')+'</article></div>'+
    '<p class="analytics-data-note">Dados fornecidos pelo Umami. Os números começam a ser coletados após a ativação do rastreador.</p>';
}
function analyticsMarkup(){
  const config=state.analyticsConfig||{},active=Boolean(config.enabled&&config.websiteId&&config.apiUrl);
  return '<section class="dashboard-analytics-card" aria-label="Estatísticas de acesso"><div class="dashboard-analytics-heading"><div><span class="eyebrow">ALCANCE E AUDIÊNCIA</span><h2>Estatísticas de acesso</h2><p>Acompanhe as visitas, os conteúdos mais consultados e a origem dos visitantes.</p></div>'+
    (active?'<div class="analytics-controls"><label for="analytics-period">Período</label><select id="analytics-period"><option value="7" '+(state.analyticsDays===7?'selected':'')+'>7 dias</option><option value="30" '+(state.analyticsDays===30?'selected':'')+'>30 dias</option><option value="90" '+(state.analyticsDays===90?'selected':'')+'>90 dias</option></select><button type="button" class="secondary-button" id="analytics-refresh">Atualizar</button></div>':'')+
    '</div><div id="analytics-content">'+analyticsContentMarkup()+'</div></section>';
}
function renderAnalytics(){
  const host=$('#analytics-panel-root');if(!host)return;
  host.innerHTML=analyticsMarkup();
  const period=$('#analytics-period');
  if(period)period.addEventListener('change',()=>loadAnalytics(Number(period.value)));
  const refresh=$('#analytics-refresh'),retry=$('#analytics-retry');
  if(refresh)refresh.addEventListener('click',()=>loadAnalytics(state.analyticsDays));
  if(retry)retry.addEventListener('click',()=>loadAnalytics(state.analyticsDays));
}
async function loadAnalytics(days=state.analyticsDays){
  const config=state.analyticsConfig||{};
  if(!config.enabled||!config.websiteId||!config.apiUrl){renderAnalytics();return}
  state.analyticsDays=[7,30,90].includes(Number(days))?Number(days):30;
  state.analyticsLoading=true;state.analyticsError='';renderAnalytics();
  try{
    const base=String(config.apiUrl).replace(/\/+$/,'');
    const response=await fetch(base+'/summary?days='+state.analyticsDays,{headers:{'Accept':'application/json'},cache:'no-store'});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||'O serviço de estatísticas respondeu com erro ('+response.status+').');
    if(data.ok===false)throw new Error(data.error||'O serviço de estatísticas não conseguiu consultar o Umami.');
    state.analyticsData=data;
  }catch(error){state.analyticsError=error.message||'Falha na conexão com o serviço de estatísticas.'}
  finally{state.analyticsLoading=false;renderAnalytics()}
}

function renderHome(){
  state.active=null;
  updateMobileTabs();
  $('#page-crumb').textContent='Painel de resumo';
  $('#collection-nav').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.hasAttribute('data-summary')));
  const count=names=>state.collections.filter(c=>names.includes(c.name)).reduce((n,c)=>n+summaryRecords(c).length,0);
  const stats=[
    ['Registros cadastrados',state.collections.filter(c=>!isConfigCollection(c)).reduce((n,c)=>n+summaryRecords(c).length,0),'Conteúdos reais, sem exemplos'],
    ['Integrantes',count(['equipe']),'Equipe e colaboradores'],
    ['Projetos',count(['projetos']),'Pesquisa e extensão'],
    ['Notícias e eventos',count(['noticias','eventos']),'Comunicação do grupo']
  ];
  const charts=dashboardCharts();
  $('#page-content').innerHTML=
    '<div class="page-heading"><div><span class="eyebrow">RESUMO DO REPOSITÓRIO</span><h1>Painel de resumo</h1><p>Acompanhe a composição dos conteúdos e as novas inclusões no GPENSC.</p></div><button class="secondary-button" id="refresh-button">Atualizar dados</button></div>'+
    '<div class="stats-grid">'+stats.map(item=>'<article class="stat-card"><span>'+esc(item[0])+'</span><strong>'+item[1]+'</strong><small>'+esc(item[2])+'</small></article>').join('')+'</div>'+
    '<div id="analytics-panel-root"></div>'+
    '<section class="dashboard-chart-grid" aria-label="Indicadores gráficos">'+
      '<article class="dashboard-chart-card"><div class="dashboard-chart-heading"><div><span class="eyebrow">DISTRIBUIÇÃO</span><h2>Conteúdos por frente de atuação</h2><p>Distribuição dos registros entre comunicação, pesquisa, ensino e equipe, e mídia e parcerias.</p></div></div>'+donutSegment(charts.areaData)+'</article>'+
      '<article class="dashboard-chart-card"><div class="dashboard-chart-heading"><div><span class="eyebrow">COMPOSIÇÃO</span><h2>Registros por tipo de conteúdo</h2><p>Quais seções concentram mais registros cadastrados.</p></div></div>'+donutSegment(charts.typeData)+'</article>'+
    '</section>'+
    '<section class="dashboard-activity-card"><div class="dashboard-activity-heading"><div><span class="eyebrow">MOVIMENTAÇÕES RECENTES</span><h2>Histórico de adições</h2><p>Novos registros identificados nas alterações dos arquivos de conteúdo do repositório.</p></div><button type="button" class="secondary-button" id="refresh-activity">Atualizar histórico</button></div><div id="recent-activity" aria-live="polite"></div></section>';
  $('#refresh-button').onclick=async()=>{
    const button=$('#refresh-button');
    button.disabled=true;button.textContent='Atualizando…';
    try{
      await loadAll();
      state.activityLoaded=false;state.activityError='';state.activity=[];
      renderNav();renderHome();
      toast('Resumo e histórico atualizados.');
    }catch(error){toast(error.message,true)}
    finally{button.disabled=false;button.textContent='Atualizar dados'}
  };
  $('#refresh-activity').onclick=async()=>{
    const button=$('#refresh-activity');
    button.disabled=true;button.textContent='Consultando…';
    await loadRecentActivity(true);
    button.disabled=false;button.textContent='Atualizar histórico';
  };
  renderRecentActivity();
  renderAnalytics();
  loadRecentActivity();
  loadAnalytics();
}
function openCollection(index){state.active=index;updateMobileTabs();const c=state.collections[index];if(isConfigCollection(c)){openConfigCollection(index);return}if(isGalleryCollection(c)){openGalleryCollection(index);return}renderNav();$('#page-crumb').textContent=c.label;const items=entryList(c);const fields=(c.fields||[]).find(f=>f.name==='itens')?.fields||[];const columns=fields.filter(f=>!['object','list'].includes(f.widget)).slice(0,3);const table=items.length?'<div class="table-wrap"><table class="data-table"><thead><tr>'+columns.map(f=>'<th>'+esc(f.label||f.name)+'</th>').join('')+'<th></th></tr></thead><tbody>'+items.map((item,i)=>'<tr>'+columns.map(f=>'<td>'+esc(String(item[f.name]??'—').slice(0,120))+'</td>').join('')+'<td><div class="row-actions"><button class="small-button" data-edit="'+i+'">Editar</button><button class="small-button danger-button" data-delete="'+i+'">Excluir</button></div></td></tr>').join('')+'</tbody></table></div>':'<div class="panel-card empty-state">Nenhum registro cadastrado nesta seção. Você pode começar adicionando o primeiro.</div>';const mobile=items.length?'<div class="mobile-record-list">'+items.map((item,i)=>'<article class="record-card"><div class="record-card-heading"><strong>'+esc(titleOf(item))+'</strong><span>Registro '+(i+1)+'</span></div><div class="record-card-meta">'+columns.filter(f=>f.name!=='titulo'&&f.name!=='nome').slice(0,2).map(f=>'<div><small>'+esc(f.label||f.name)+'</small><span>'+esc(String(item[f.name]??'—').slice(0,150))+'</span></div>').join('')+'</div><div class="record-card-actions"><button class="small-button" data-edit="'+i+'" aria-label="Editar '+esc(titleOf(item))+'">Editar</button><button class="small-button danger-button" data-delete="'+i+'" aria-label="Excluir '+esc(titleOf(item))+'">Excluir</button></div></article>').join('')+'</div>':'';const canBatch=Array.isArray(fields)&&fields.length>0;$('#page-content').innerHTML='<div class="page-heading collection-heading"><div><span class="eyebrow">'+esc(c.groupName||'GERENCIAMENTO')+'</span><h1>'+esc(c.label)+'</h1><p>'+items.length+' registros cadastrados nesta seção.</p></div><div class="collection-tools">'+(canBatch?'<button class="secondary-button" id="export-xlsx">Exportar Excel</button><button class="secondary-button" id="import-xlsx">Importar planilha</button>':'')+'<button class="primary-button" id="new-item">Adicionar registro</button></div></div>'+table+mobile;$('#new-item').onclick=()=>editItem(null);if(canBatch){$('#export-xlsx').onclick=()=>exportExcel(c,fields);$('#import-xlsx').onclick=()=>openExcelImport(c,fields)}$('#page-content').querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editItem(Number(b.dataset.edit)));$('#page-content').querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deleteItem(Number(b.dataset.delete)))}

function renderConfigControl(field,value,attribute='data-config-field'){
  const name=esc(field.name),label=esc(field.label||field.name),hint=field.hint?'<small>'+esc(field.hint)+'</small>':'';
  const required=field.required?'required':'';
  let control='';
  if(field.widget==='boolean'){
    control='<label class="config-toggle"><input type="checkbox" '+attribute+'="'+name+'" '+(value?'checked':'')+'><span>'+(value?'Ativado':'Desativado')+'</span></label>';
  }else if(field.widget==='text'||field.widget==='markdown'){
    control='<textarea '+attribute+'="'+name+'" '+required+'>'+esc(value??'')+'</textarea>';
  }else if(field.widget==='select'){
    const options=(field.options||[]).map(option=>'<option value="'+esc(option)+'" '+(String(option)===String(value??'')?'selected':'')+'>'+esc(option)+'</option>').join('');
    control='<select '+attribute+'="'+name+'" '+required+'><option value="">Selecione…</option>'+options+'</select>';
  }else{
    const type=field.widget==='number'?'number':field.widget==='date'?'date':'text';
    const pattern=Array.isArray(field.pattern)&&field.pattern[0]?' pattern="'+esc(field.pattern[0])+'"':'';
    control='<input type="'+type+'" '+attribute+'="'+name+'" value="'+esc(value??'')+'" '+required+pattern+'>';
  }
  return '<div class="field'+(['text','markdown'].includes(field.widget)?' full':'')+'"><label>'+label+(field.required?' *':'')+'</label>'+control+hint+'</div>';
}
function renderConfigListRow(field,item={}){
  const controls=(field.fields||[]).map(child=>renderConfigControl(child,item[child.name],'data-config-subfield')).join('');
  return '<div class="config-list-row" data-config-list-row><div class="config-list-row-fields">'+controls+'</div><button type="button" class="small-button danger-button" data-remove-config-row>Remover</button></div>';
}
function renderConfigField(field,value){
  if(field.widget!=='list'||!Array.isArray(field.fields))return renderConfigControl(field,value);
  const rows=Array.isArray(value)?value:[];
  return '<div class="field full config-list-field"><div class="config-list-heading"><label>'+esc(field.label||field.name)+'</label><button type="button" class="secondary-button" data-add-config-row="'+esc(field.name)+'">Adicionar item</button></div><div class="config-list-rows" data-config-list="'+esc(field.name)+'">'+rows.map(item=>renderConfigListRow(field,item)).join('')+'</div>'+(field.hint?'<small>'+esc(field.hint)+'</small>':'')+'</div>';
}
function openConfigCollection(index){
  state.active=index;
  const c=state.collections[index];
  const fields=Array.isArray(c.fields)?c.fields:[];
  const current=state.contents[c.file]&&typeof state.contents[c.file]==='object'?state.contents[c.file]:{};
  renderNav();
  $('#page-crumb').textContent=c.label;
  if(!fields.length){
    $('#page-content').innerHTML='<div class="panel-card empty-state">Esta configuração ainda não possui campos definidos no esquema do painel.</div>';
    return;
  }
  $('#page-content').innerHTML=
    '<div class="page-heading collection-heading"><div><span class="eyebrow">CONFIGURAÇÕES DO SITE</span><h1>'+esc(c.label)+'</h1><p>Edite os textos e opções desta área. As alterações serão gravadas no arquivo correspondente do site.</p></div><button type="button" class="secondary-button" id="back-to-summary">Painel de resumo</button></div>'+
    '<form id="config-form" class="config-form"><div class="panel-card"><div class="config-fields">'+fields.map(field=>renderConfigField(field,current[field.name]??field.default)).join('')+'</div></div>'+
    '<div class="config-actions"><span>As alterações só entram no site após salvar e publicar.</span><button type="submit" class="primary-button" id="save-config">Salvar configurações</button></div></form>';
  $('#back-to-summary').onclick=renderHome;
  const form=$('#config-form');
  form.addEventListener('click',event=>{
    const add=event.target.closest('[data-add-config-row]');
    if(add){
      const field=fields.find(item=>item.name===add.dataset.addConfigRow);
      const list=form.querySelector('[data-config-list="'+add.dataset.addConfigRow+'"]');
      if(field&&list)list.insertAdjacentHTML('beforeend',renderConfigListRow(field,{}));
      return;
    }
    const remove=event.target.closest('[data-remove-config-row]');
    if(remove)remove.closest('[data-config-list-row]')?.remove();
  });
  form.onsubmit=event=>saveConfigCollection(event,index,fields);
}
async function saveConfigCollection(event,index,fields){
  event.preventDefault();
  const form=event.currentTarget;
  const c=state.collections[index];
  const updated={...(state.contents[c.file]||{})};
  for(const field of fields){
    if(field.widget==='list'&&Array.isArray(field.fields)){
      const list=form.querySelector('[data-config-list="'+field.name+'"]');
      const rows=list?[...list.querySelectorAll('[data-config-list-row]')]:[];
      const values=[];
      for(const row of rows){
        const item={};
        for(const child of field.fields){
          const input=row.querySelector('[data-config-subfield="'+child.name+'"]');
          const value=!input?'':child.widget==='boolean'?input.checked:input.value;
          if(child.required&&(value===''||value===null||value===undefined)){
            toast('Preencha '+(child.label||child.name)+' em todos os itens.',true);
            input?.focus();
            return;
          }
          if(Array.isArray(child.pattern)&&child.pattern[0]&&value!==''&&!new RegExp(child.pattern[0]).test(String(value))){
            toast('Confira o formato de '+(child.label||child.name)+' em um dos itens.',true);
            input?.focus();
            return;
          }
          item[child.name]=value;
        }
        values.push(item);
      }
      updated[field.name]=values;
      continue;
    }
    const input=form.querySelector('[data-config-field="'+field.name+'"]');
    if(!input)continue;
    let value=field.widget==='boolean'?input.checked:input.value;
    if(field.widget==='number'&&value!=='')value=Number(value);
    if(field.required&&(value===''||value===null||value===undefined)){
      toast('Preencha o campo '+(field.label||field.name)+'.',true);
      input.focus();
      return;
    }
    if(Array.isArray(field.pattern)&&field.pattern[0]&&value!==''&&!new RegExp(field.pattern[0]).test(String(value))){
      toast('Confira o formato do campo '+(field.label||field.name)+'.',true);
      input.focus();
      return;
    }
    updated[field.name]=value;
  }
  const button=form.querySelector('#save-config');
  button.disabled=true;
  button.textContent='Salvando…';
  try{
    await saveCollection(c,updated);
    openConfigCollection(index);
    toast('Configuração salva no repositório.');
  }catch(error){
    button.disabled=false;
    button.textContent='Tentar novamente';
    toast(error.message,true);
  }
}


function galleryPreviewUrl(path){
  const value=String(path||'');
  if(/^https?:\/\//i.test(value))return value;
  return '../'+value.replace(/^\/+/,'');
}
function openGalleryCollection(index){
  state.active=index;
  const c=state.collections[index];
  const items=entryList(c);
  renderNav();
  $('#page-crumb').textContent=c.label;
  $('#page-content').innerHTML=
    '<div class="page-heading collection-heading"><div><span class="eyebrow">'+esc(c.groupName||'MÍDIA E INSTITUIÇÕES')+'</span><h1>'+esc(c.label)+'</h1><p>'+items.length+' fotos cadastradas. Gerencie as imagens, legendas e pontos de foco.</p></div><button type="button" class="secondary-button" id="gallery-back">Painel de resumo</button></div>'+
    '<form id="gallery-form" class="gallery-form"><div class="gallery-photo-grid">'+items.map((item,i)=>
      '<article class="gallery-photo-card" data-gallery-row data-index="'+i+'"><div class="gallery-photo-preview"><img src="'+esc(galleryPreviewUrl(item.arquivo))+'" alt="'+esc(item.legenda||'Foto da galeria')+'" loading="lazy"><span>Foto '+(i+1)+'</span></div>'+
      '<div class="gallery-photo-fields"><div class="field full"><label>Legenda</label><input type="text" data-gallery-caption value="'+esc(item.legenda||'')+'" placeholder="Descreva a foto (opcional)"></div>'+
      '<div class="field"><label>Foco horizontal (%)</label><input type="number" data-gallery-focus-x min="0" max="100" step="1" value="'+esc(item.foco_x??'')+'" placeholder="50"></div>'+
      '<div class="field"><label>Foco vertical (%)</label><input type="number" data-gallery-focus-y min="0" max="100" step="1" value="'+esc(item.foco_y??'')+'" placeholder="50"></div>'+
      '<div class="field full"><label>Substituir imagem</label><input type="file" data-gallery-replace accept="image/*"></div></div>'+
      '<button type="button" class="small-button danger-button" data-gallery-remove>Remover foto</button></article>'
    ).join('')+'</div>'+
    '<div class="panel-card gallery-add-card"><div><h2>Adicionar novas fotos</h2><p>Selecione uma ou várias imagens. Elas serão enviadas para a pasta de imagens do site.</p></div><div class="field full"><label for="gallery-add-files">Selecionar imagens</label><input id="gallery-add-files" type="file" accept="image/*" multiple></div></div>'+
    '<div class="config-actions"><span>As imagens e legendas serão gravadas no repositório após salvar.</span><button type="submit" class="primary-button" id="save-gallery">Salvar galeria</button></div></form>';
  $('#gallery-back').onclick=renderHome;
  const form=$('#gallery-form');
  form.addEventListener('click',event=>{
    const remove=event.target.closest('[data-gallery-remove]');
    if(remove)remove.closest('[data-gallery-row]')?.remove();
  });
  form.onsubmit=event=>saveGalleryCollection(event,index);
}
async function saveGalleryCollection(event,index){
  event.preventDefault();
  const form=event.currentTarget;
  const c=state.collections[index];
  const button=form.querySelector('#save-gallery');
  const originals=entryList(c);
  const updated=[];
  button.disabled=true;
  button.textContent='Enviando imagens…';
  try{
    for(const row of form.querySelectorAll('[data-gallery-row]')){
      const old=originals[Number(row.dataset.index)]||{};
      const item={...old};
      const replacement=row.querySelector('[data-gallery-replace]')?.files?.[0];
      if(replacement)item.arquivo='/'+await uploadImage(replacement);
      const caption=row.querySelector('[data-gallery-caption]')?.value??'';
      item.legenda=caption;
      const focusX=row.querySelector('[data-gallery-focus-x]')?.value??'';
      const focusY=row.querySelector('[data-gallery-focus-y]')?.value??'';
      for(const [key,value] of [['foco_x',focusX],['foco_y',focusY]]){
        if(value==='')delete item[key];
        else{
          const number=Number(value);
          if(!Number.isFinite(number)||number<0||number>100)throw new Error('Os pontos de foco devem estar entre 0 e 100.');
          item[key]=number;
        }
      }
      updated.push(item);
    }
    const additions=[...(form.querySelector('#gallery-add-files')?.files||[])];
    for(const file of additions){
      const path=await uploadImage(file);
      updated.push({arquivo:'/'+path,legenda:''});
    }
    button.textContent='Salvando galeria…';
    await saveCollection(c,{...state.contents[c.file],itens:updated});
    openGalleryCollection(index);
    toast('Galeria atualizada com '+updated.length+' foto(s).');
  }catch(error){
    button.disabled=false;
    button.textContent='Tentar novamente';
    toast(error.message,true);
  }
}

function defaultItem(fields){const item={};fields.forEach(f=>{if(f.widget==='list')item[f.name]=[];else if(f.widget==='object')item[f.name]=defaultItem(f.fields||[]);else if(f.widget==='boolean')item[f.name]=false;else item[f.name]=''});return item}
function editItem(index){const c=state.collections[state.active];const schema=(c.fields||[]).find(f=>f.name==='itens')?.fields||[];const original=index===null?defaultItem(schema):structuredClone(entryList(c)[index]);state.editing={index,original};const fields=schema.map(f=>renderField(f,original[f.name])).join('');$('#modal-root').innerHTML='<div class="modal-backdrop"><form class="modal" id="entry-form"><div class="modal-head"><h2>'+(index===null?'Novo registro':'Editar registro')+'</h2><button type="button" class="small-button" id="close-modal">Fechar</button></div><div class="modal-body">'+fields+'</div><div class="modal-foot"><span class="eyebrow">ALTERAÇÕES SALVAS NO GITHUB</span><div><button type="button" class="secondary-button" id="cancel-modal">Cancelar</button><button type="submit" class="primary-button" id="save-entry">Salvar alterações</button></div></div></form></div>';$('#close-modal').onclick=$('#cancel-modal').onclick=closeModal;$('#entry-form').onsubmit=e=>saveEntry(e,schema)}
function renderField(f,value){const name=esc(f.name),label=esc(f.label||f.name),full=['text','list','object','markdown'].includes(f.widget)?' full':'';let input='';if(f.widget==='select'||f.widget==='relation'){let options=f.options||[];if(f.widget==='relation'){const rel=state.collections.find(c=>c.group===f.collection&&c.name===f.file);const relFields=(rel?.fields||[]).find(x=>x.name==='itens')?.fields||[];const idField=f.value_field?.split('.').pop()||'id',displayField=f.display_fields?.[0]?.split('.').pop()||'nome';options=entryList(rel||{file:''}).map(item=>({label:item[displayField],value:item[idField]}))}input='<select name="'+name+'"><option value="">Selecione…</option>'+options.map(o=>{const v=typeof o==='object'?o.value:o;const l=typeof o==='object'?o.label:o;return '<option value="'+esc(v)+'" '+(String(v)===String(value??'')?'selected':'')+'>'+esc(l)+'</option>'}).join('')+'</select>'}else if(['text','markdown','list','object'].includes(f.widget)){const v=['list','object'].includes(f.widget)?JSON.stringify(value??(f.widget==='list'?[]:{}),null,2):value??'';input='<textarea name="'+name+'" '+(['list','object'].includes(f.widget)?'data-json="true"':'')+'>'+esc(v)+'</textarea>'}else if(f.widget==='boolean'){input='<select name="'+name+'"><option value="false" '+(!value?'selected':'')+'>Não</option><option value="true" '+(value?'selected':'')+'>Sim</option></select>'}else if(f.widget==='image'||f.widget==='file'){input='<input type="text" name="'+name+'" value="'+esc(value||'')+'" placeholder="Caminho do arquivo (ex.: img/foto.jpg)"><input type="file" data-upload-for="'+name+'" accept="image/*">'}else{const type=['date','datetime'].includes(f.widget)?'date':f.widget==='number'?'number':'text';input='<input type="'+type+'" name="'+name+'" value="'+esc(value??'')+'" '+(f.required?'required':'')+'>'}return '<div class="field'+full+'"><label>'+label+(f.required?' *':'')+'</label>'+input+(f.hint?'<small>'+esc(f.hint)+'</small>':'')+'</div>'}
async function saveEntry(event,schema){event.preventDefault();const form=event.currentTarget;const item={...state.editing.original};for(const f of schema){const el=form.elements.namedItem(f.name);if(!el)continue;let value=el.value;if(f.widget==='boolean')value=value==='true';if(['list','object'].includes(f.widget)){try{value=JSON.parse(value)}catch(e){toast('O campo '+(f.label||f.name)+' precisa conter JSON válido.',true);return}}if(value!==''||f.required||Object.prototype.hasOwnProperty.call(item,f.name))item[f.name]=value}const uploads=form.querySelectorAll('[data-upload-for]');for(const input of uploads){if(!input.files?.[0])continue;try{const path=await uploadImage(input.files[0]);item[input.dataset.uploadFor]=path}catch(e){toast(e.message,true);return}}const c=state.collections[state.active];const list=entryList(c).slice();if(state.editing.index===null)list.push(item);else list[state.editing.index]=item;try{await saveCollection(c,{...state.contents[c.file],itens:list});closeModal();openCollection(state.active);renderNav();toast('Registro salvo no repositório.')}catch(error){toast(error.message,true)}}

function normalizeHeader(value){return String(value??'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'')}
function excelCell(value){if(value instanceof Date&&!isNaN(value))return value.toISOString().slice(0,10);return value??''}
function exportExcel(c,fields){if(!window.XLSX){toast('A biblioteca de planilhas ainda não carregou. Atualize a página.',true);return}const rows=entryList(c).map(item=>Object.fromEntries(fields.map(f=>[f.label||f.name,(['list','object'].includes(f.widget)&&item[f.name]!=null)?JSON.stringify(item[f.name]):(item[f.name]??'')])));const ws=XLSX.utils.json_to_sheet(rows.length?rows:[Object.fromEntries(fields.map(f=>[f.label||f.name,'']))]);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Registros');XLSX.writeFile(wb,'GPENSC-'+c.name+'.xlsx');toast('Planilha exportada.')}
function openExcelImport(c,fields){if(!window.XLSX){toast('A biblioteca de planilhas ainda não carregou. Atualize a página.',true);return}$('#modal-root').innerHTML='<div class="modal-backdrop"><section class="modal excel-modal"><div class="modal-head"><div><span class="eyebrow">IMPORTAÇÃO EM LOTE</span><h2>Adicionar registros por Excel</h2></div><button type="button" class="small-button" id="close-excel">Fechar</button></div><div class="modal-body excel-body"><div class="excel-intro"><strong>Importe vários registros de uma só vez.</strong><p>Use uma planilha .xlsx, .xls ou .csv. A primeira linha deve conter os nomes dos campos. Os registros serão adicionados aos atuais, sem apagar o que já existe.</p></div><div class="field full"><label for="excel-file">Selecionar planilha</label><input id="excel-file" type="file" accept=".xlsx,.xls,.csv"></div><div id="excel-preview" class="excel-preview"><p>Depois de selecionar o arquivo, confira a prévia antes de salvar.</p></div></div><div class="modal-foot"><span class="eyebrow">A IMPORTAÇÃO SÓ É GRAVADA APÓS SUA CONFIRMAÇÃO</span><div><button type="button" class="secondary-button" id="cancel-excel">Cancelar</button><button type="button" class="primary-button" id="confirm-excel" disabled>Adicionar registros</button></div></div></section></div>';$('#close-excel').onclick=$('#cancel-excel').onclick=closeModal;let pending=[];const fileInput=$('#excel-file');fileInput.onchange=async()=>{pending=[];$('#confirm-excel').disabled=true;const file=fileInput.files?.[0];if(!file)return;try{const data=await file.arrayBuffer();const wb=XLSX.read(data,{type:'array',cellDates:true});const sheet=wb.Sheets[wb.SheetNames[0]];const rows=XLSX.utils.sheet_to_json(sheet,{defval:'',raw:false});if(!rows.length)throw new Error('A planilha está vazia ou não possui cabeçalho.');const headers=Object.keys(rows[0]);const mapping={};for(const f of fields){const candidates=[normalizeHeader(f.name),normalizeHeader(f.label)];mapping[f.name]=headers.find(h=>candidates.includes(normalizeHeader(h)))||null}const missing=fields.filter(f=>f.required&&!mapping[f.name]).map(f=>f.label||f.name);if(missing.length)throw new Error('Colunas obrigatórias não encontradas: '+missing.join(', ')+'. Use os nomes dos campos exibidos no painel.');const issues=[];pending=rows.map((row,i)=>{const item=defaultItem(fields);for(const f of fields){const h=mapping[f.name];if(!h)continue;let v=excelCell(row[h]);if(typeof v==='string')v=v.trim();if(['list','object'].includes(f.widget)&&v){try{v=JSON.parse(v)}catch{issues.push('Linha '+(i+2)+': '+(f.label||f.name)+' deve estar em JSON válido.')}}else if(f.widget==='boolean'){v=String(v).toLowerCase()==='true'||String(v).toLowerCase()==='sim'||String(v)==='1'}else if(f.widget==='number'&&v!==''){v=Number(String(v).replace(',','.'));if(!Number.isFinite(v))issues.push('Linha '+(i+2)+': valor numérico inválido em '+(f.label||f.name)+'.')}if(v!==''&&v!==undefined)item[f.name]=v}for(const f of fields.filter(x=>x.required)){if(item[f.name]===''||item[f.name]===undefined)issues.push('Linha '+(i+2)+': falta preencher '+(f.label||f.name)+'.')}return item});const preview=$('#excel-preview');preview.innerHTML='<div class="excel-summary"><strong>'+pending.length+' linhas encontradas</strong><span>'+Object.values(mapping).filter(Boolean).length+' de '+fields.length+' colunas reconhecidas</span></div><div class="excel-columns">'+fields.map(f=>'<span class="'+(mapping[f.name]?'mapped':'unmapped')+'">'+esc(f.label||f.name)+(mapping[f.name]?' · '+esc(mapping[f.name]):' · não encontrada')+'</span>').join('')+'</div>'+(issues.length?'<div class="excel-errors"><strong>Corrija antes de importar:</strong><ul>'+issues.slice(0,12).map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>'+(issues.length>12?'<small>e mais '+(issues.length-12)+' ocorrência(s).</small>':'')+'</div>':'<p class="excel-ready">Prévia validada. Os registros serão acrescentados ao final da lista.</p>');$('#confirm-excel').disabled=issues.length>0||!pending.length; }catch(e){$('#excel-preview').innerHTML='<div class="excel-errors">'+esc(e.message)+'</div>';pending=[]}};$('#confirm-excel').onclick=async()=>{if(!pending.length)return;const button=$('#confirm-excel');button.disabled=true;button.textContent='Salvando…';try{await saveCollection(c,{...state.contents[c.file],itens:[...entryList(c),...pending]});const count=pending.length;closeModal();openCollection(state.active);renderNav();toast(count+' registro(s) importado(s) com sucesso.')}catch(e){button.disabled=false;button.textContent='Tentar novamente';toast(e.message,true)}}}
async function saveCollection(c,content){const path=c.file;const text=jsyaml.dump(content,{noRefs:true,lineWidth:120,quotingType:'"',forceQuotes:false});const body={message:'Atualiza '+c.label+' pelo painel GPENSC',content:btoa(unescape(encodeURIComponent(text))),branch:BRANCH};if(state.sha[path])body.sha=state.sha[path];const r=await api('/repos/'+REPO+'/contents/'+path,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});state.sha[path]=r.content.sha;state.contents[path]=content;state.activityLoaded=false;state.activity=[];state.activityError=''}
async function uploadImage(file){const safe=file.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]/g,'-');const path='img/'+Date.now()+'-'+safe;const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file)});await api('/repos/'+REPO+'/contents/'+path,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Adiciona mídia pelo painel GPENSC',content:base64,branch:BRANCH})});return path}
async function deleteItem(index){if(!confirm('Deseja excluir este registro? A alteração será salva no repositório.'))return;const c=state.collections[state.active];const items=entryList(c).slice();items.splice(index,1);try{await saveCollection(c,{...state.contents[c.file],itens:items});openCollection(state.active);renderNav();toast('Registro excluído.')}catch(e){toast(e.message,true)}}
function closeModal(){$('#modal-root').innerHTML=''}
$('#login-button').addEventListener('click',login);
$('#token-login-button').addEventListener('click',loginWithCode);
$('#access-code').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();loginWithCode()}});
function updateMobileTabs(){
  const menuOpen=$('.sidebar').classList.contains('mobile-open');
  $('#mobile-home').classList.toggle('active',state.active===null&&!menuOpen);
  $('#mobile-sections').classList.toggle('active',state.active!==null||menuOpen);
}
function closeMobileMenu(){
  const side=$('.sidebar');
  side.classList.remove('mobile-open');
  document.body.classList.remove('mobile-menu-open');
  $('#mobile-sections').setAttribute('aria-expanded','false');
  updateMobileTabs();
}
$('#mobile-home').addEventListener('click',()=>{
  closeMobileMenu();renderHome();window.scrollTo({top:0,behavior:'smooth'});
});
$('#mobile-sections').addEventListener('click',()=>{
  const side=$('.sidebar');
  const open=!side.classList.contains('mobile-open');
  side.classList.toggle('mobile-open',open);
  document.body.classList.toggle('mobile-menu-open',open);
  $('#mobile-sections').setAttribute('aria-expanded',String(open));
  updateMobileTabs();
});
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMobileMenu()});
$('#mobile-logout').addEventListener('click',()=>$('#logout-button').click());
$('#logout-button').addEventListener('click',()=>{sessionStorage.removeItem('gpen_admin_token');sessionStorage.removeItem('gpen_admin_auth_mode');state.token='';state.authMode='github';state.user=null;$('#workspace').hidden=true;$('#login-view').hidden=false;$('#login-status').textContent='Sessão encerrada.'});
if(state.token)initialize();
})();