(() => {
'use strict';
const REPO='maiconcarlospng/Site-GPENSC-Teste';
const BRANCH='main';
const WORKER='https://sveltia-cms-auth.maicon-carlos.workers.dev';
const ACCESS_WORKER='https://gpensc-admin-access.maicon-carlos.workers.dev';
const API='https://api.github.com';
const $=s=>document.querySelector(s);
const state={token:sessionStorage.getItem('gpen_admin_token')||'',authMode:sessionStorage.getItem('gpen_admin_auth_mode')||'github',user:null,config:null,collections:[],active:null,contents:{},sha:{},editing:null,activity:[],activityLoaded:false,activityPromise:null,activityError:'',analyticsConfig:null,analyticsData:null,analyticsLoading:false,analyticsError:'',analyticsDays:30,view:'summary',mediaFiles:[],mediaLoading:false,mediaError:''};
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
  if(!r.ok){const error=new Error(data.message||data.error||'Falha ao comunicar com o GitHub.');error.status=r.status;throw error;}
  return data;
}
const batch=window.GPENSCBatchQueue.create({state,api,repo:REPO,branch:BRANCH,toast});
async function loginWithCode(){
  const code=$('#access-code').value.trim();
  const button=$('#token-login-button');
  if(button.disabled||loadingSession||$('#login-button').disabled)return;
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
  if(loadingSession||$('#login-button').disabled||$('#token-login-button').disabled)return;
  const workerOrigin=new URL(WORKER).origin;
  const url=WORKER+'/auth?provider=github&site_id='+encodeURIComponent(location.hostname)+'&scope=repo';
  const popup=window.open(url,'gpen-github-auth','width=620,height=720,menubar=no,toolbar=no');
  if(!popup){toast('Permita a abertura da janela de autenticação.',true);return}
  $('#login-status').textContent='Aguardando autorização do GitHub…';
  const button=$('#login-button');
  button.disabled=true;
  let finished=false;
  const finish=()=>{if(finished)return;finished=true;button.disabled=false;clearTimeout(timeout);clearInterval(watch);window.removeEventListener('message',listener)};
  const watch=setInterval(()=>{if(popup.closed){finish();$('#login-status').textContent='Janela de autenticação fechada. Tente novamente.'}},1000);
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
let loadingSession=false;
async function initialize(){
  if(loadingSession)return;
  loadingSession=true;
  const retry=$('#retry-loading');
  if(retry)retry.hidden=true;
  $('#login-status').textContent='Carregando o painel e os conteúdos…';
  try{
    const user=state.authMode==='access-code'
      ?{name:'Acesso por código',login:'Colaborador'}
      :await api('/user');
    state.user=user;
    await loadConfig();
    await loadAnalyticsConfig();
    await loadAll();
    $('#user-name').textContent=user.name||user.login||'Colaborador';
    $('#login-view').hidden=true;
    $('#workspace').hidden=false;
    renderNav();
    renderHome();
    loadMediaFiles();
  }catch(error){
    const expired=error.status===401;
    if(expired){
      state.token='';
      state.authMode='github';
      sessionStorage.removeItem('gpen_admin_token');
      sessionStorage.removeItem('gpen_admin_auth_mode');
    }
    $('#workspace').hidden=true;
    $('#login-view').hidden=false;
    $('#login-status').textContent=expired
      ?'Sua sessão expirou. Entre novamente.'
      :'Não foi possível carregar os dados: '+(error.message||'falha de conexão')+'.';
    if(retry)retry.hidden=expired||!state.token;
    toast(expired?'Entre novamente para continuar.':'Falha no carregamento. Sua sessão foi preservada.',true);
  }finally{
    loadingSession=false;
  }
}
async function loadConfig(){const r=await api('/repos/'+REPO+'/contents/admin/config.yml?ref='+BRANCH);state.sha['admin/config.yml']=r.sha;const raw=decodeURIComponent(escape(atob(r.content.replace(/\n/g,''))));state.config=jsyaml.load(raw);state.collections=(state.config.collections||[]).flatMap(group=>(group.files||[]).map(file=>({...file,groupName:group.label,group:group.name})))}
async function readFile(path){const r=await api('/repos/'+REPO+'/contents/'+path+'?ref='+BRANCH);state.sha[path]=r.sha;return jsyaml.load(decodeURIComponent(escape(atob(r.content.replace(/\n/g,'')))))||{itens:[]}}
async function loadAll(){
  // Carrega até quatro arquivos simultâneos para reduzir falhas de API.
  const list=state.collections;
  const results=new Array(list.length);
  let cursor=0;
  async function loadNext(){
    while(cursor<list.length){
      const index=cursor++;
      const item=list[index];
      try{results[index]={file:item.file,data:await readFile(item.file)}}
      catch(error){throw Object.assign(new Error('Falha ao carregar '+item.label+': '+error.message),{status:error.status})}
    }
  }
  await Promise.all(Array.from({length:Math.min(4,list.length)},()=>loadNext()));
  for(const result of results)state.contents[result.file]=result.data;
  batch.afterLoad();
}
function listField(entry){return (entry?.fields||[]).find(field=>field.widget==='list'&&Array.isArray(field.fields))}
function listKey(entry){return listField(entry)?.name||'itens'}
function entryList(entry){const key=listKey(entry);return Array.isArray(state.contents[entry?.file]?.[key])?state.contents[entry.file][key]:[]}
function isExampleRecord(item){
  return Object.entries(item||{}).some(([key,value])=>{
    if(typeof value!=='string')return false;
    const text=value.trim();
    return /\[EXEMPLO\]|\[NOME\]|\[SOBRENOME|\[PERIÓDICO\]|\[EVENTO\]|\[Agência\/Edital\]|\[Nome\]|20XX/i.test(text)
      || (/^ano$/i.test(key)&&text!==''&&!/^\d{4}$/.test(text))
      || /^(Conte aqui|Registre encontros|Destaque projetos|Acrescente aqui)/i.test(text);
  });
}
function summaryRecords(entry){return entryList(entry).filter(item=>item&&!isExampleRecord(item))}
function isConfigCollection(entry){return entry?.group==='configuracoes'||String(entry?.file||'').startsWith('data/configuracoes/')}
function isGalleryCollection(entry){return entry?.name==='galeria'||entry?.file==='data/galeria.yml'}
function collectionSummary(entry){const count=summaryRecords(entry).length,examples=entryList(entry).length-count;return isConfigCollection(entry)?'Configuração institucional':count+' registros de conteúdo'+(examples?' · '+examples+' exemplos para revisão':'')}
function titleOf(item){return item.titulo||item.nome||item.episodio||item.codigo||item.autor||'Registro sem título'}
const SITE_AREAS=[
  {title:'Quem somos',names:['equipe']},
  {title:'Nossa história',names:['linha_tempo','galeria']},
  {title:'Parcerias',names:['parcerias','apoio','sites']},
  {title:'Pesquisa',names:['linhas','projetos','publicacoes','defesas','metodos']},
  {title:'Extensão',names:['conteudos_vi_no_rotulo','equipe_vi_no_rotulo','capacitacao_atividades']},
  {title:'Ensino',names:['disciplinas']},
  {title:'Divulgação científica',names:['materiais','videos','livros','noar','impactos']},
  {title:'Agenda',names:['eventos']},
  {title:'Notícias',names:['noticias']},
  {title:'Gestão editorial',names:['planejamento','pautas_instagram']}
];
function siteArea(entry){
  if(isConfigCollection(entry))return 'Configurações';
  return SITE_AREAS.find(area=>area.names.includes(entry?.name))?.title||'Outros conteúdos';
}
const SITE_PAGES={
  equipe:'grupo.html#equipe',linha_tempo:'historia.html#historia',galeria:'index.html',
  parcerias:'parcerias.html',apoio:'parcerias.html',
  linhas:'linhas.html',projetos:'projetos.html',publicacoes:'publicacoes.html',defesas:'teses.html',
  metodos:'metodos.html',conteudos_vi_no_rotulo:'extensao.html#projeto-PR-VR',
  equipe_vi_no_rotulo:'extensao.html#projeto-PR-VR',
  capacitacao_atividades:'extensao.html#projeto-PR-CEP',disciplinas:'ensino.html',
  impactos:'ciencia-sociedade.html#impacto',materiais:'biblioteca.html#materiais',
  videos:'multimidia.html#videos',livros:'biblioteca.html#livros',
  noar:'multimidia.html#podcasts',sites:'parcerias.html',noticias:'noticias.html',
  eventos:'agenda.html',planejamento:'index.html',pautas_instagram:'acervo-instagram.html'
};
function sitePage(entry){return '../'+(SITE_PAGES[entry?.name]||'index.html')}
function renderNav(){
  const nav=$('#collection-nav');
  const scroll=nav.scrollTop;
  const focused=document.activeElement;
  const key=nav.contains(focused)?[...focused.attributes].find(attribute=>attribute.name.startsWith('data-')):null;
  const button=({c,i})=>'<button type="button" data-index="'+i+'" class="'+(state.active===i?'active':'')+'">'+
    '<span>'+esc(c.label)+'</span>'+(isConfigCollection(c)?'':'<span class="nav-count">'+summaryRecords(c).length+'</span>')+'</button>';
  const entries=state.collections.map((c,i)=>({c,i}));
  const content=SITE_AREAS.concat([{title:'Outros conteúdos',names:[]}]).map(area=>{
    const matches=entries.filter(({c})=>!isConfigCollection(c)&&siteArea(c)===area.title);
    if(!matches.length)return '';
    return '<section class="menu-section menu-section-content" aria-label="'+esc(area.title)+'">'+
      '<div class="menu-section-title">'+esc(area.title.toUpperCase())+'</div>'+
      '<div class="menu-section-items">'+matches.map(button).join('')+'</div></section>';
  }).join('');
  const settings=entries.filter(({c})=>isConfigCollection(c));
  nav.innerHTML='<button type="button" data-summary class="summary-nav-item '+(state.view==='summary'?'active':'')+'"><span>Visão geral</span></button>'+ 
    '<button type="button" data-review class="summary-nav-item batch-sidebar-link '+(state.view==='review'?'active':'')+'"><span>Revisar e publicar</span><span class="nav-count" data-batch-count>0</span></button>'+
    '<button type="button" data-settings-home class="summary-nav-item '+(state.view==='settings'?'active':'')+'"><span>Configurações do site</span></button>'+
    '<button type="button" data-media-home class="summary-nav-item '+(state.view==='media'?'active':'')+'"><span>Materiais do site</span><span class="nav-count">'+(state.mediaLoading?'…':state.mediaError?'—':state.mediaFiles.length)+'</span></button>'+
    content+
    '<section class="menu-section menu-section-settings" aria-label="Configurações">'+
      '<div class="menu-section-title">CONFIGURAÇÕES DO SITE</div>'+
      '<div class="menu-section-items">'+settings.map(button).join('')+'</div></section>';
  nav.querySelector('[data-summary]').addEventListener('click',()=>{renderHome();closeMobileMenu()});
  nav.querySelector('[data-review]').addEventListener('click',()=>{openPendingReview();closeMobileMenu()});
  nav.querySelector('[data-settings-home]').addEventListener('click',()=>{openSettingsHub();closeMobileMenu()});
  nav.querySelector('[data-media-home]').addEventListener('click',()=>{openMediaLibrary();closeMobileMenu()});
  nav.querySelectorAll('[data-index]').forEach(b=>b.addEventListener('click',()=>{openCollection(Number(b.dataset.index));closeMobileMenu()}));
  $('#mobile-collection-search').dispatchEvent(new Event('input'));
  if(key)[...nav.querySelectorAll('button')].find(button=>button.getAttribute(key.name)===key.value)?.focus({preventScroll:true});
  nav.scrollTop=scroll;
  nav.querySelectorAll('button.active').forEach(button=>button.setAttribute('aria-current','page'));
  batch.updateUI();
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
    const area=siteArea(item);
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
    return '<div class="analytics-setup"><div class="analytics-setup-icon" aria-hidden="true">✓</div><div><strong>Rastreamento instalado; painel aguardando integração</strong><p>O rastreador do Umami já está instalado. Para exibir os indicadores aqui no painel, falta publicar o proxy protegido no Cloudflare e informar a URL dele em <code>data/analytics.json</code>. A chave da API deve ficar somente como Secret no Cloudflare.</p><a href="https://github.com/maiconcarlospng/Site-GPENSC-Teste/blob/main/analytics-worker/README.md" target="_blank" rel="noopener">Ver instruções da integração ↗</a></div></div>';
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

function renderEditorialReview(){
  const team=state.collections.find(c=>c.name==='equipe');
  const people=team?summaryRecords(team):[];
  const now=new Date(),threshold=new Date(now);threshold.setFullYear(now.getFullYear()-1);
  const pending=people.filter(person=>{const date=new Date(String(person.revisado_em||'')+'T12:00:00');return Number.isNaN(date.getTime())||date<threshold});
  const plans=state.collections.find(c=>c.name==='planejamento');
  const actions=plans?summaryRecords(plans).filter(p=>p.situacao!=='Publicado'):[];
  return '<section class="editorial-review"><div><span class="eyebrow">CUIDADO COM O CONTEÚDO</span><h2>Revisão e planejamento</h2><p><strong>'+pending.length+'</strong> perfis sem revisão registrada nos últimos 12 meses. <strong>'+actions.length+'</strong> ações editoriais em preparação.</p></div><div class="editorial-links"><button class="secondary-button" data-editorial="equipe">Revisar equipe</button><button class="secondary-button" data-editorial="planejamento">Planejar semestre</button><button class="secondary-button" data-editorial="materiais">Materiais educativos</button></div></section>';
}
function quickActionsMarkup(){
  const actions=[
    ['eventos','Agenda','Atualizar próximas atividades'],
    ['noticias','Notícias','Preparar atualizações do grupo'],
    ['projetos','Projetos','Pesquisa e extensão'],
    ['linhas','Linhas de pesquisa','Projetos e conhecimento'],
    ['equipe','Equipe','Integrantes e pesquisadores']
  ];
  return '<section class="admin-shortcuts" aria-label="Acesso rápido"><div class="dashboard-shortcut-heading"><span class="eyebrow">ACESSO RÁPIDO</span><h2>Editar o que aparece no site</h2><p>Escolha uma área para cadastrar, revisar ou atualizar conteúdos.</p></div>'+
    '<div class="admin-shortcut-grid">'+actions.filter(([name])=>state.collections.some(c=>c.name===name)).map(([name,title,description])=>
      '<button type="button" class="admin-shortcut" data-quick="'+esc(name)+'"><strong>'+esc(title)+'</strong><small>'+esc(description)+'</small></button>').join('')+'</div>'+
    '<div class="admin-tool-shortcuts"><button type="button" class="admin-tool-shortcut" id="admin-settings-open"><strong>Configurações do site</strong><small>Identidade, páginas, contato, visibilidade e rodapé</small></button><button type="button" class="admin-tool-shortcut" id="admin-media-open"><strong>Materiais do site</strong><small>Visualize e substitua imagens e arquivos publicados</small></button></div></section>';
}
function renderHome(){
  if(!canLeaveCurrentEditor())return;
  state.view='summary';
  state.active=null;
  updateMobileTabs();
  $('#page-crumb').textContent='Painel de resumo';
  renderNav();
  const count=names=>state.collections.filter(c=>names.includes(c.name)).reduce((n,c)=>n+summaryRecords(c).length,0);
  const stats=[
    [batch.count()?'Registros na prévia':'Registros cadastrados',state.collections.filter(c=>!isConfigCollection(c)).reduce((n,c)=>n+summaryRecords(c).length,0),batch.count()?'Inclui rascunhos locais, ainda não publicados':'Conteúdos reais, sem exemplos'],
    ['Integrantes',count(['equipe']),'Equipe e colaboradores'],
    ['Projetos',count(['projetos']),'Pesquisa e extensão'],
    ['Notícias e eventos',count(['noticias','eventos']),'Comunicação do grupo']
  ];
  const charts=dashboardCharts();
  $('#page-content').innerHTML=
    '<div class="page-heading"><div><span class="eyebrow">RESUMO DO REPOSITÓRIO</span><h1>Painel de resumo</h1><p>Acompanhe a composição dos conteúdos e as novas inclusões no GPENSC.</p></div><button class="secondary-button" id="refresh-button">Atualizar dados</button></div>'+
    '<div class="stats-grid">'+stats.map(item=>'<article class="stat-card"><span>'+esc(item[0])+'</span><strong>'+item[1]+'</strong><small>'+esc(item[2])+'</small></article>').join('')+'</div>'+batch.banner()+
    renderEditorialReview()+quickActionsMarkup()+'<div id="analytics-panel-root"></div>'+
    '<section class="dashboard-chart-grid" aria-label="Indicadores gráficos">'+
      '<article class="dashboard-chart-card"><div class="dashboard-chart-heading"><div><span class="eyebrow">DISTRIBUIÇÃO</span><h2>Conteúdos por frente de atuação</h2><p>Registros agrupados conforme as áreas atuais do site.</p></div></div>'+donutSegment(charts.areaData)+'</article>'+
      '<article class="dashboard-chart-card"><div class="dashboard-chart-heading"><div><span class="eyebrow">COMPOSIÇÃO</span><h2>Registros por tipo de conteúdo</h2><p>Quais seções concentram mais registros cadastrados.</p></div></div>'+donutSegment(charts.typeData)+'</article>'+
    '</section>'+
    '<section class="dashboard-activity-card"><div class="dashboard-activity-heading"><div><span class="eyebrow">MOVIMENTAÇÕES RECENTES</span><h2>Histórico de adições</h2><p>Novos registros identificados nas alterações dos arquivos de conteúdo do repositório.</p></div><button type="button" class="secondary-button" id="refresh-activity">Atualizar histórico</button></div><div id="recent-activity" aria-live="polite"></div></section>';
  document.querySelectorAll('[data-editorial]').forEach(button=>button.onclick=()=>{const index=state.collections.findIndex(c=>c.name===button.dataset.editorial);if(index>=0)openCollection(index)});
   document.querySelectorAll('[data-quick]').forEach(button=>button.onclick=()=>{const index=state.collections.findIndex(c=>c.name===button.dataset.quick);if(index>=0)openCollection(index)});
  $('#admin-settings-open')?.addEventListener('click',openSettingsHub);
  $('#admin-media-open')?.addEventListener('click',()=>openMediaLibrary());
  $('#page-content').querySelector('[data-batch-review]')?.addEventListener('click',openPendingReview);
  batch.updateUI();
  $('#refresh-button').onclick=async()=>{
    const button=$('#refresh-button');
    const originalView=state.view;
    button.disabled=true;button.textContent='Atualizando…';
    try{
      await loadAll();
      state.activityLoaded=false;state.activityError='';state.activity=[];
      renderNav();if(state.view===originalView)renderHome();
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
function openPendingReview(){
  if(!canLeaveCurrentEditor())return;
  state.view='review';state.active=null;updateMobileTabs();renderNav();
  $('#page-crumb').textContent='Revisar e publicar';
  batch.renderReview($('#page-content'),{
    changed:()=>{renderNav();batch.updateUI()},
    finished:async()=>{
      try{await loadAll()}catch(error){toast('Alterações enviadas. Falha ao recarregar os dados: '+error.message,true);openPendingReview();return}
      state.activityLoaded=false;state.activity=[];state.activityError='';
      renderNav();renderHome();
    }
  });
  batch.updateUI();
}
function openCollection(index){if(!canLeaveCurrentEditor())return;state.view='collection';state.active=index;updateMobileTabs();const c=state.collections[index];if(isConfigCollection(c)){openConfigCollection(index);return}if(isGalleryCollection(c)){openGalleryCollection(index);return}renderNav();$('#page-crumb').textContent=c.label;const items=entryList(c);const real=summaryRecords(c).length;const examples=items.length-real;const fields=(c.fields||[]).find(f=>f.widget==='list'&&Array.isArray(f.fields))?.fields||[];const columns=fields.filter(f=>!['object','list'].includes(f.widget)).slice(0,3);const table=items.length?'<div class="table-wrap"><table class="data-table"><thead><tr>'+columns.map(f=>'<th>'+esc(f.label||f.name)+'</th>').join('')+'<th></th></tr></thead><tbody>'+items.map((item,i)=>'<tr>'+columns.map(f=>'<td>'+esc(String(item[f.name]??'—').slice(0,120))+'</td>').join('')+'<td><div class="row-actions"><button class="small-button" data-edit="'+i+'">Editar</button><button class="small-button danger-button" data-delete="'+i+'">Excluir</button></div></td></tr>').join('')+'</tbody></table></div>':'<div class="panel-card empty-state">Nenhum registro cadastrado nesta seção. Você pode começar adicionando o primeiro.</div>';const mobile=items.length?'<div class="mobile-record-list">'+items.map((item,i)=>'<article class="record-card"><div class="record-card-heading"><strong>'+esc(titleOf(item))+'</strong><span>'+(isExampleRecord(item)?'Exemplo para revisão':'Registro '+(i+1))+'</span></div><div class="record-card-meta">'+columns.filter(f=>f.name!=='titulo'&&f.name!=='nome').slice(0,2).map(f=>'<div><small>'+esc(f.label||f.name)+'</small><span>'+esc(String(item[f.name]??'—').slice(0,150))+'</span></div>').join('')+'</div><div class="record-card-actions"><button class="small-button" data-edit="'+i+'" aria-label="Editar '+esc(titleOf(item))+'">Editar</button><button class="small-button danger-button" data-delete="'+i+'" aria-label="Excluir '+esc(titleOf(item))+'">Excluir</button></div></article>').join('')+'</div>':'';const canBatch=Array.isArray(fields)&&fields.length>0;$('#page-content').innerHTML='<div class="page-heading collection-heading"><div><span class="eyebrow">'+esc(siteArea(c))+'</span><h1>'+esc(c.label)+'</h1><p>'+real+' registros de conteúdo'+(examples?' · '+examples+' exemplos para revisão':'')+'.</p></div><div class="collection-tools">'+(canBatch?'<button class="secondary-button" id="export-xlsx">Exportar Excel</button><button class="secondary-button" id="import-xlsx">Importar planilha</button>':'')+'<a class="secondary-button collection-site-link" href="'+esc(sitePage(c))+'" target="_blank" rel="noopener noreferrer">Ver página no site</a><button class="primary-button" id="new-item">Adicionar registro</button></div></div>'+'<div class="collection-search"><label for="record-search">Buscar nesta seção</label><input id="record-search" type="search" placeholder="Título, nome ou conteúdo…"><p id="search-count" role="status"></p></div>'+table+mobile;$('#record-search').oninput=event=>{const term=event.target.value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();let count=0;items.forEach((item,i)=>{const match=JSON.stringify(item).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(term);if(match)count++;$('#page-content').querySelectorAll('[data-edit="'+i+'"]').forEach(b=>{b.closest('tr,.record-card').hidden=!match})});$('#search-count').textContent=count+' registros encontrados'};$('#new-item').onclick=()=>editItem(null);if(canBatch){$('#export-xlsx').onclick=()=>exportExcel(c,fields);$('#import-xlsx').onclick=()=>openExcelImport(c,fields)}$('#page-content').querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editItem(Number(b.dataset.edit)));$('#page-content').querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deleteItem(Number(b.dataset.delete)))}

function openSettingsHub(){
  if(!canLeaveCurrentEditor())return;
  state.view='settings';
  state.active=null;
  updateMobileTabs();
  renderNav();
  $('#page-crumb').textContent='Configurações do site';
  const descriptions={
    cfg_identidade:'Nome do grupo, instituição e unidade.',
    cfg_vinculos:'Links para UFOP, Escola de Nutrição, PPGSN e CNPq.',
    cfg_institucional:'Resumo, histórico, missão, visão e objetivos.',
    cfg_home:'Títulos, avisos e chamadas da página inicial.',
    cfg_quem_somos:'Títulos e chamadas da apresentação do grupo.',
    cfg_pesquisa_extensao:'Textos introdutórios de pesquisa, ensino e extensão.',
    cfg_agenda:'Apresentação e rótulos da agenda.',
    cfg_contato:'E-mail, telefone e redes sociais.',
    cfg_endereco:'Endereço e tópicos exibidos na página de contato.',
    cfg_visibilidade:'Controle das seções exibidas no site.',
    cfg_rodape:'Texto de direitos autorais e informações do rodapé.'
  };
  const cards=state.collections.map((c,i)=>({c,i})).filter(({c})=>isConfigCollection(c));
  $('#page-content').innerHTML=
    '<div class="page-heading"><div><span class="eyebrow">PREFERÊNCIAS E CONTEÚDO INSTITUCIONAL</span><h1>Configurações do site</h1><p>Edite a identidade do GPENSC, os textos institucionais, as redes e as seções visíveis no site.</p></div></div>'+
    '<div class="settings-hub-grid">'+cards.map(({c,i})=>'<button type="button" class="settings-hub-card" data-setting-index="'+i+'"><span class="settings-hub-number">'+esc((c.label.match(/^\d+/)||[''])[0])+'</span><span class="settings-hub-copy"><strong>'+esc(c.label.replace(/^\d+\s*[·.-]\s*/,''))+'</strong><small>'+esc(descriptions[c.name]||'Preferências e informações do site.')+'</small></span><span class="settings-hub-arrow" aria-hidden="true">→</span></button>').join('')+'</div>';
  $('#page-content').querySelectorAll('[data-setting-index]').forEach(button=>button.addEventListener('click',()=>openCollection(Number(button.dataset.settingIndex))));
}
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
  state.view='config';
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
    '<div class="config-actions"><span>As alterações ficam guardadas neste dispositivo até a revisão e publicação.</span><button type="submit" class="primary-button" id="save-config">Adicionar à fila</button></div></form>';
  $('#back-to-summary').onclick=renderHome;
  const form=$('#config-form');
  form.addEventListener('input',()=>{form.dataset.dirty='true'});
  form.addEventListener('change',()=>{form.dataset.dirty='true'});
  form.addEventListener('click',event=>{
    const add=event.target.closest('[data-add-config-row]');
    if(add){
      const field=fields.find(item=>item.name===add.dataset.addConfigRow);
      const list=form.querySelector('[data-config-list="'+add.dataset.addConfigRow+'"]');
      if(field&&list){list.insertAdjacentHTML('beforeend',renderConfigListRow(field,{}));form.dataset.dirty='true';}
      return;
    }
    const remove=event.target.closest('[data-remove-config-row]');
    if(remove){remove.closest('[data-config-list-row]')?.remove();form.dataset.dirty='true';}
  });
  form.onsubmit=event=>saveConfigCollection(event,index,fields);
}
async function saveConfigCollection(event,index,fields){
  event.preventDefault();
  const form=event.currentTarget;
  if(form.dataset.saving==='true')return;
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
  button.textContent='Preparando rascunho…';
  form.dataset.saving='true';
  try{
    await saveCollection(c,updated);
    openConfigCollection(index);
    toast('Configuração adicionada à fila de revisão.');
  }catch(error){
    delete form.dataset.saving;
    button.disabled=false;
    button.textContent='Tentar novamente';
    toast(error.message,true);
  }
}


function galleryPreviewUrl(path){
  const value=String(path||'');
  if(batch.assets()[value.replace(/^\/+/, '')])return '../img/ilustracoes/gestao.svg';
  if(/^https?:\/\//i.test(value))return value;
  return '../'+value.replace(/^\/+/,'');
}
function openGalleryCollection(index){
  state.view='collection';
  state.active=index;
  const c=state.collections[index];
  const items=entryList(c);
  renderNav();
  $('#page-crumb').textContent=c.label;
  $('#page-content').innerHTML=
    '<div class="page-heading collection-heading"><div><span class="eyebrow">'+esc(siteArea(c))+'</span><h1>'+esc(c.label)+'</h1><p>'+items.length+' fotos cadastradas. Gerencie as imagens, legendas e pontos de foco.</p></div><button type="button" class="secondary-button" id="gallery-back">Painel de resumo</button></div>'+
    '<form id="gallery-form" class="gallery-form"><div class="gallery-photo-grid">'+items.map((item,i)=>
      '<article class="gallery-photo-card" data-gallery-row data-index="'+i+'"><div class="gallery-photo-preview"><img src="'+esc(galleryPreviewUrl(item.arquivo))+'" alt="'+esc(item.legenda||'Foto da galeria')+'" loading="lazy"><span>Foto '+(i+1)+'</span></div>'+
      '<div class="gallery-photo-fields"><div class="field full"><label>Legenda</label><input type="text" data-gallery-caption value="'+esc(item.legenda||'')+'" placeholder="Descreva a foto (opcional)"></div>'+
      '<div class="field"><label>Foco horizontal (%)</label><input type="number" data-gallery-focus-x min="0" max="100" step="1" value="'+esc(item.foco_x??'')+'" placeholder="50"></div>'+
      '<div class="field"><label>Foco vertical (%)</label><input type="number" data-gallery-focus-y min="0" max="100" step="1" value="'+esc(item.foco_y??'')+'" placeholder="50"></div>'+
      '<div class="field full"><label>Substituir imagem</label><input type="file" data-gallery-replace accept="image/*"><button type="button" class="small-button photo-crop-action" data-photo-crop="gallery" data-photo-source="'+esc(item.arquivo||'')+'">Recortar foto</button></div></div>'+
      '<button type="button" class="small-button danger-button" data-gallery-remove>Remover foto</button></article>'
    ).join('')+'</div>'+
    '<div class="panel-card gallery-add-card"><div><h2>Adicionar novas fotos</h2><p>Selecione uma ou várias imagens. Elas ficarão na fila e serão enviadas apenas quando você publicar.</p></div><div class="field full"><label for="gallery-add-files">Selecionar imagens</label><input id="gallery-add-files" type="file" accept="image/*" multiple><div class="gallery-crop-files"></div></div></div>'+
    '<div class="config-actions"><span>As imagens e legendas serão publicadas apenas depois da revisão da fila.</span><button type="submit" class="primary-button" id="save-gallery">Adicionar galeria à fila</button></div></form>';
  $('#gallery-back').onclick=renderHome;
  const form=$('#gallery-form');
  form.addEventListener('input',()=>{form.dataset.dirty='true'});
  form.addEventListener('change',()=>{form.dataset.dirty='true'});
  form.addEventListener('click',event=>{
    const remove=event.target.closest('[data-gallery-remove]');
    if(remove){remove.closest('[data-gallery-row]')?.remove();form.dataset.dirty='true';}
  });
  const galleryFiles=$('#gallery-add-files');
  galleryFiles.addEventListener('change',()=>{
    form.querySelector('.gallery-crop-files').innerHTML=[...galleryFiles.files].map((file,i)=>
      '<button type="button" class="small-button photo-crop-action" data-photo-crop="gallery" data-photo-index="'+i+'">Recortar '+esc(file.name)+'</button>'
    ).join('');
  });
  form.onsubmit=event=>saveGalleryCollection(event,index);
}
async function saveGalleryCollection(event,index){
  event.preventDefault();
  const form=event.currentTarget;
  if(form.dataset.saving==='true')return;
  const c=state.collections[index];
  const button=form.querySelector('#save-gallery');
  const originals=entryList(c);
  const updated=[];
  button.disabled=true;
  button.textContent='Preparando imagens…';
  form.dataset.saving='true';
  try{
    for(const row of form.querySelectorAll('[data-gallery-row]')){
      const old=originals[Number(row.dataset.index)]||{};
      const item={...old};
      const replacement=selectedPhotos(row.querySelector('[data-gallery-replace]'))[0];
      if(replacement){item.arquivo='/'+await uploadImage(replacement);if(/-recorte\.(webp|png)$/i.test(replacement.name))delete item.zoom;}
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
    const additions=selectedPhotos(form.querySelector('#gallery-add-files'));
    for(const file of additions){
      const path=await uploadImage(file);
      updated.push({arquivo:'/'+path,legenda:''});
    }
    button.textContent='Preparando galeria…';
    await saveCollection(c,{...state.contents[c.file],itens:updated});
    openGalleryCollection(index);
    toast('Galeria preparada com '+updated.length+' foto(s).');
  }catch(error){
    delete form.dataset.saving;
    button.disabled=false;
    button.textContent='Tentar novamente';
    toast(error.message,true);
  }
}

document.addEventListener('keydown',event=>{
  const modal=document.querySelector('#modal-root .modal');if(!modal)return;
  if(event.key==='Escape'&&!$('.photo-crop-dialog[open]')&&!modal.dataset.saving){closeModal();return}
  if(event.key!=='Tab')return;
  if(modal.id==='entry-form'&&window.matchMedia('(min-width:1450px)').matches)return;
  const nodes=[...modal.querySelectorAll('button,input,select,textarea,a[href]')].filter(n=>!n.disabled&&n.offsetParent!==null);
  const first=nodes[0],last=nodes[nodes.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
});
const MEDIA_EXTENSIONS=new Set(['png','jpg','jpeg','webp','gif','svg','avif','ico','pdf','mp4','webm','mov','mp3','wav','ogg','doc','docx','ppt','pptx','xls','xlsx']);
const MEDIA_ACCEPT='.png,.jpg,.jpeg,.webp,.gif,.svg,.avif,.ico,.pdf,.mp4,.webm,.mov,.mp3,.wav,.ogg,.doc,.docx,.ppt,.pptx,.xls,.xlsx';
function mediaExtension(path){return String(path||'').split('.').pop().toLowerCase()}
function mediaCategory(path){
  const ext=mediaExtension(path);
  if(['png','jpg','jpeg','webp','gif','svg','avif','ico'].includes(ext))return 'image';
  if(['mp4','webm','mov','mp3','wav','ogg'].includes(ext))return 'audiovisual';
  return 'document';
}
function mediaSize(bytes){
  const value=Number(bytes||0);
  if(value<1024)return value+' B';
  if(value<1024*1024)return (value/1024).toFixed(1)+' KB';
  return (value/(1024*1024)).toFixed(1)+' MB';
}
function mediaFileUrl(path){return 'https://maiconcarlospng.github.io/Site-GPENSC-Teste/'+String(path).split('/').map(encodeURIComponent).join('/')}
function openMediaLibrary(){
  if(!canLeaveCurrentEditor())return;
  state.view='media';state.active=null;updateMobileTabs();renderNav();
  $('#page-crumb').textContent='Materiais do site';
  $('#page-content').innerHTML=
    '<div class="page-heading"><div><span class="eyebrow">ARQUIVOS PÚBLICOS DO SITE</span><h1>Materiais do site</h1><p>Consulte as imagens e arquivos da pasta pública. Ao substituir um material, o caminho permanece igual. Os arquivos ficam pendentes até confirmar a publicação.</p></div><div class="media-page-actions"><input id="media-upload-new" type="file" multiple accept="'+MEDIA_ACCEPT+'" hidden><button type="button" class="secondary-button" id="media-refresh">Atualizar lista</button><button type="button" class="primary-button" id="media-add">Adicionar materiais</button></div></div>'+
    '<div class="media-toolbar"><label for="media-search">Buscar arquivo</label><input id="media-search" type="search" placeholder="Nome ou caminho do arquivo"><label for="media-type">Tipo</label><select id="media-type"><option value="all">Todos</option><option value="image">Imagens</option><option value="document">Documentos</option><option value="audiovisual">Áudio e vídeo</option></select><span id="media-status" role="status"></span></div>'+
    '<div class="media-bulk-bar"><span id="media-select-status">Selecione materiais para remover da biblioteca.</span><button type="button" class="secondary-button media-danger-action" id="media-delete-selected" disabled>Remover selecionados</button></div>'+
    '<div id="media-grid" class="media-grid" aria-live="polite"></div>';
  state.mediaSelection=state.mediaSelection||new Set();
  $('#media-delete-selected').onclick=async()=>{
    const paths=[...state.mediaSelection];
    if(!paths.length)return;
    await queueMaterialsRemoval(paths);
  };
  $('#media-search').addEventListener('input',renderMediaFiles);
  $('#media-type').addEventListener('change',renderMediaFiles);
  $('#media-refresh').addEventListener('click',()=>loadMediaFiles());
  $('#media-add').addEventListener('click',()=>$('#media-upload-new').click());
  $('#media-upload-new').addEventListener('change',async event=>{
    const input=event.currentTarget;
    const files=[...input.files];
    if(!files.length)return;
    const button=$('#media-add');
    button.disabled=true;
    input.disabled=true;
    let added=0;
    const errors=[];
    try{
      for(const [index,file] of files.entries()){
        button.textContent='Preparando '+(index+1)+' de '+files.length+'…';
        try{
          await stageNewMaterial(file);
          added++;
        }catch(error){errors.push(file.name+': '+error.message)}
      }
      if(added)toast(added+' material(is) na fila de revisão.');
      if(errors.length)alert('Alguns arquivos não foram adicionados à fila:\n\n'+errors.join('\n'));
    }finally{
      input.value='';
      input.disabled=false;
      button.disabled=false;
      button.textContent='Adicionar materiais';
    }
  });
  if(!state.mediaFiles.length)loadMediaFiles();else renderMediaFiles();
}
async function loadMediaFiles(){
  if(state.mediaLoading)return;
  state.mediaLoading=true;state.mediaError='';
  renderNav();
  const status=$('#media-status'),grid=$('#media-grid');
  if(status)status.textContent='Atualizando a lista…';
  if(grid)grid.innerHTML='<div class="panel-card empty-state">Lendo os materiais do repositório…</div>';
  try{
    // A relação de arquivos é pública. O proxy por código restringe a API de escrita;
    // use leitura pública sem credenciais para exibir a biblioteca em ambos os logins.
    const mediaApi=state.authMode==='access-code'?async path=>{
      const response=await fetch(API+path,{headers:{'Accept':'application/vnd.github+json'}});
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(result.message||'Falha ao listar arquivos públicos.');
      return result;
    }:api;
    const branch=await mediaApi('/repos/'+REPO+'/branches/'+encodeURIComponent(BRANCH));
    const treeSha=branch.commit?.commit?.tree?.sha;
    if(!treeSha)throw new Error('Não foi possível localizar a árvore atual do repositório.');
    const tree=await mediaApi('/repos/'+REPO+'/git/trees/'+treeSha+'?recursive=1');
    if(tree.truncated)throw new Error('A lista de arquivos do repositório foi truncada; atualize a página e tente novamente.');
    state.mediaFiles=(tree.tree||[]).filter(file=>{
      if(file.type!=='blob'||!String(file.path).startsWith('img/'))return false;
      return MEDIA_EXTENSIONS.has(mediaExtension(file.path));
    }).map(file=>({path:file.path,sha:file.sha,size:file.size||0,category:mediaCategory(file.path)}))
      .sort((a,b)=>a.path.localeCompare(b.path,'pt-BR',{sensitivity:'base'}));
  }catch(error){state.mediaError=error.message||'Falha ao listar materiais.'}
  finally{state.mediaLoading=false}
  const statusEl=$('#media-status');
  if(statusEl)statusEl.textContent=state.mediaError?state.mediaError:state.mediaFiles.length+' arquivos em img/';
  renderMediaFiles();
  renderNav();
}
function renderMediaFiles(){
  const grid=$('#media-grid');if(!grid)return;
  if(state.mediaLoading){grid.innerHTML='<div class="panel-card empty-state">Lendo os materiais do repositório…</div>';return}
  if(state.mediaError){grid.innerHTML='<div class="panel-card empty-state">'+esc(state.mediaError)+'</div>';return}
  const term=String($('#media-search')?.value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const type=$('#media-type')?.value||'all';
  if(!state.mediaSelection)state.mediaSelection=new Set();
  const pendingAssets=batch.assets();
  const bulkButton=$('#media-delete-selected');
  if(bulkButton){bulkButton.disabled=state.mediaSelection.size===0;bulkButton.textContent='Remover selecionados ('+state.mediaSelection.size+')'}
  const selectionText=$('#media-select-status');
  if(selectionText)selectionText.textContent=state.mediaSelection.size?state.mediaSelection.size+' material(is) selecionado(s) para revisão.':'Selecione materiais para remover da biblioteca.';
  const files=state.mediaFiles.filter(file=>{
    const matchesName=file.path.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(term);
    return matchesName&&(type==='all'||file.category===type);
  });
  if(!files.length){grid.innerHTML='<div class="panel-card empty-state">Nenhum material encontrado com esses filtros.</div>';return}
  grid.innerHTML=files.map(file=>{
    const name=file.path.split('/').pop(),ext=mediaExtension(name).toUpperCase(),kind=file.category;
    const preview=kind==='image'?'<img src="'+esc(mediaFileUrl(file.path))+'" alt="'+esc(name)+'" loading="lazy">':'<div class="media-file-placeholder"><strong>'+esc(ext)+'</strong><small>'+(kind==='audiovisual'?'Áudio ou vídeo':'Arquivo para consulta')+'</small></div>';
    const accept='.'+mediaExtension(name);
    const removing=pendingAssets[file.path]?.action==='remover';
    const canRemove=!/^img\/(?:ilustracoes\/|logo|hero|tree-|favicon)/i.test(file.path);
    return '<article class="media-card'+(removing?' media-card-removing':'')+'"><div class="media-card-preview">'+preview+(removing?'<span class="media-removal-badge">Exclusão pendente</span>':'')+'</div><div class="media-card-body"><strong class="media-name" title="'+esc(file.path)+'">'+esc(name)+'</strong><small class="media-path">'+esc(file.path)+'</small><small class="media-size">'+mediaSize(file.size)+'</small><div class="media-card-actions"><a href="'+esc(mediaFileUrl(file.path))+'" target="_blank" rel="noopener noreferrer">Visualizar</a><button type="button" data-media-copy="'+esc(file.path)+'">Copiar caminho</button>'+(kind==='image'&&!removing?'<button type="button" data-media-crop="'+esc(file.path)+'">Recortar cópia</button>':'')+'</div><div class="media-remove-actions">'+(removing?'<button type="button" class="secondary-button" data-media-undo-delete="'+esc(file.path)+'">Desfazer exclusão</button>':'<label class="media-select"><input type="checkbox" data-media-select="'+esc(file.path)+'"'+(state.mediaSelection.has(file.path)?' checked':'')+(canRemove?'':' disabled')+'><span>Selecionar</span></label><button type="button" class="small-button danger-button" data-media-delete="'+esc(file.path)+'"'+(canRemove?'':' disabled title="Arquivo estrutural protegido"')+'>Remover</button>')+'</div>'+(removing?'':'<label class="media-replace">Substituir arquivo<input type="file" accept="'+accept+'" data-media-replace="'+esc(file.path)+'"></label>')+'</div></article>';
  }).join('');
  grid.querySelectorAll('[data-media-select]').forEach(check=>check.addEventListener('change',()=>{
    if(check.checked)state.mediaSelection.add(check.dataset.mediaSelect);
    else state.mediaSelection.delete(check.dataset.mediaSelect);
    const selected=state.mediaSelection.size;
    const button=$('#media-delete-selected');
    if(button){button.disabled=!selected;button.textContent='Remover selecionados ('+selected+')'}
    const text=$('#media-select-status');
    if(text)text.textContent=selected?selected+' material(is) selecionado(s) para revisão.':'Selecione materiais para remover da biblioteca.';
  }));
  grid.querySelectorAll('[data-media-delete]').forEach(btn=>btn.onclick=()=>queueMaterialsRemoval([btn.dataset.mediaDelete]));
  grid.querySelectorAll('[data-media-undo-delete]').forEach(btn=>btn.onclick=async()=>{
    if(await batch.deleteAsset(btn.dataset.mediaUndoDelete)){
      state.mediaSelection.delete(btn.dataset.mediaUndoDelete);
      renderMediaFiles();toast('Exclusão retirada da fila.');
    }
  });
  grid.querySelectorAll('[data-media-copy]').forEach(button=>button.addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(button.dataset.mediaCopy);toast('Caminho copiado.')}catch(error){toast('Não foi possível copiar o caminho neste navegador.',true)}
  }));
  grid.querySelectorAll('[data-media-crop]').forEach(button=>button.onclick=async()=>{
    try{
      const result=await window.GPENSCPhotoCrop.edit(mediaFileUrl(button.dataset.mediaCrop),'wide');
      if(result&&button.isConnected)await saveMediaFile(result,null,button);
    }catch(error){toast(error.message,true)}
  });
  grid.querySelectorAll('[data-media-replace]').forEach(input=>input.addEventListener('change',async event=>{
    const file=event.target.files?.[0];if(!file)return;
    await saveMediaFile(file,input.dataset.mediaReplace,event.target);event.target.value='';
  }));
}
async function queueMaterialsRemoval(paths){
  if(!Array.isArray(paths)||!paths.length)return;
  const selected=[...new Set(paths)].map(path=>state.mediaFiles.find(file=>file.path===path)).filter(Boolean);
  if(!selected.length)return;
  const sample=selected.slice(0,4).map(item=>'• '+item.path).join('\n');
  const details=sample+(selected.length>4?'\n... e mais '+(selected.length-4)+' arquivo(s)':'');
  if(!confirm('Preparar para exclusão '+selected.length+' material(is)?\n\n'+details+
    '\n\nEles só serão removidos após você clicar em “Revisar e publicar”. Confira antes se são usados nas páginas.'))return;
  let success=0,errors=[];
  for(const file of selected){
    try{
      await batch.stageDeletion(file.path,file.sha,file.size);
      state.mediaSelection?.delete(file.path);success++;
    }catch(error){errors.push(file.path+': '+(error.message||'falha ao preparar exclusão'))}
  }
  renderMediaFiles();
  if(success)toast(success+' material(is) preparado(s) para exclusão. Revise a fila.');
  if(errors.length){
    toast(errors.length+' material(is) não puderam ser removidos. Confira os vínculos e as proteções.',true);
    const msg=errors.slice(0,6).join('\n')+(errors.length>6?'\n...':'');
    alert('Algumas exclusões foram impedidas por segurança:\n'+msg);
  }
}
function validateMaterial(file){
  if(!MEDIA_EXTENSIONS.has(mediaExtension(file.name)))throw new Error('Formato de arquivo não permitido.');
  if(!file.size)throw new Error('O arquivo está vazio.');
  if(file.size>20*1024*1024)throw new Error('O arquivo deve ter até 20 MB.');
}
async function stageNewMaterial(file){
  validateMaterial(file);
  const safe=file.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9._-]/g,'-');
  return batch.stageMedia(file,'img/materiais/'+crypto.randomUUID()+'-'+safe);
}
async function saveMediaFile(file,replacePath,sourceElement){
  const extension=mediaExtension(file.name);
  try{validateMaterial(file)}catch(error){toast(error.message,true);return}
  if(replacePath&&extension!==mediaExtension(replacePath)){toast('Para manter os vínculos do site, use a mesma extensão do arquivo original.',true);return}
  if(replacePath&&!confirm('Preparar a substituição do material “'+replacePath+'” sem publicar agora?'))return;
  const current=replacePath?state.mediaFiles.find(item=>item.path===replacePath):null;
  const button=sourceElement||$('#media-add');
  if(button){button.disabled=true;button.dataset.originalLabel=button.tagName==='INPUT'?'':button.textContent;if(button.tagName!=='INPUT')button.textContent='Preparando…'}
  try{
    if(replacePath)await batch.stageMedia(file,replacePath,current?.sha);
    else await stageNewMaterial(file);
    toast('Material adicionado à fila. Nenhuma mídia foi publicada.');
    batch.updateUI();
  }catch(error){toast(error.message||'Falha ao preparar o material.',true)}
  finally{if(button){button.disabled=false;if(button.tagName!=='INPUT')button.textContent=button.dataset.originalLabel||'Adicionar materiais'}}
}
function defaultItem(fields){const item={};fields.forEach(f=>{if(f.widget==='list')item[f.name]=[];else if(f.widget==='object')item[f.name]=defaultItem(f.fields||[]);else if(f.widget==='boolean')item[f.name]=false;else item[f.name]=''});return item}
function editItem(index){if(!canLeaveCurrentEditor())return;const c=state.collections[state.active];const schema=(c.fields||[]).find(f=>f.widget==='list'&&Array.isArray(f.fields))?.fields||[];const original=index===null?defaultItem(schema):structuredClone(entryList(c)[index]);state.editing={index,original};const fields=schema.map(f=>renderField(f,original[f.name])).join('');$('#modal-root').innerHTML='<div class="modal-backdrop"><form class="modal" id="entry-form" role="dialog" aria-modal="true" aria-label="Editar conteúdo"><div class="modal-head"><h2>'+(index===null?'Novo registro':'Editar registro')+'</h2><button type="button" class="small-button" id="close-modal">Fechar</button></div><div class="modal-body">'+fields+'</div><div class="modal-foot"><span class="eyebrow">RASCUNHO LOCAL · AINDA NÃO PUBLICADO</span><div><button type="button" class="secondary-button" id="cancel-modal">Cancelar</button><button type="submit" class="primary-button" id="save-entry">Adicionar à fila</button></div></div></form></div>';$('#close-modal').onclick=$('#cancel-modal').onclick=()=>closeModal();$('#entry-form').onsubmit=e=>saveEntry(e,schema);const form=$('#entry-form');form.setAttribute('aria-modal',String(window.matchMedia('(max-width:1449px)').matches));form.dataset.dirty='false';form.addEventListener('input',()=>{form.dataset.dirty='true'});form.addEventListener('change',()=>{form.dataset.dirty='true'});document.body.classList.add('editor-open');form.querySelector('input,select,textarea,button')?.focus()}
function photoCropFormat(field){
  const collection=state.collections[state.active]?.name;
  return field.name==='foto'?'portrait':collection==='livros'?'book':collection==='videos'?'video':'wide';
}
function publicPhotoSource(path){
  if(!path)return '';
  try{
    const value=/^https?:\/\//i.test(path)?path:'../'+path.replace(/^\/+/,'');
    const url=new URL(value,location.href);
    return ['http:','https:'].includes(url.protocol)?url.href:'';
  }catch{return ''}
}
async function cropInputPhoto(input,index,original,format){
  const crop=window.GPENSCPhotoCrop;
  if(!crop){toast('A ferramenta de recorte não carregou. Atualize a página e tente novamente.',true);return}
  const source=input.files[index]||crop.files(input)[index]||publicPhotoSource(original);
  if(!source){toast('Selecione uma imagem primeiro.',true);input.focus();return}
  try{
    const result=await crop.edit(source,format);
    if(result&&input.isConnected){crop.replace(input,index,result);toast('Recorte aplicado ao formulário.')}
  }catch(error){toast(error.message,true)}
}
function selectedPhotos(input){return window.GPENSCPhotoCrop?.files(input)||[...(input?.files||[])]}
document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-photo-crop]');
  if(!button)return;
  const field=button.closest('.field');
  const input=field?.querySelector('input[type=file]');
  if(!input||input.disabled||input.closest('form')?.dataset.saving==='true')return;
  const original=field.querySelector('input[type=text]')?.value??button.dataset.photoSource;
  await cropInputPhoto(input,Number(button.dataset.photoIndex||0),original,button.dataset.photoCrop);
});
document.addEventListener('imagecropped',event=>{
  const form=event.target.closest('form');
  if(form)form.dataset.dirty='true';
  const row=event.target.closest('[data-gallery-row]');
  if(!row)return;
  row.querySelectorAll('[data-gallery-focus-x],[data-gallery-focus-y]').forEach(control=>control.value='');
  const image=row.querySelector('.gallery-photo-preview img');
  const url=URL.createObjectURL(selectedPhotos(event.target)[0]);
  image.addEventListener('load',()=>URL.revokeObjectURL(url),{once:true});
  image.src=url;
});
function renderField(f,value){
  const name=esc(f.name),label=esc(f.label||f.name),full=['text','list','object','markdown'].includes(f.widget)?' full':'';
  const required=f.required!==false?' required':'',id='entry-'+name;
  let input='';
  if(f.widget==='select'||f.widget==='relation'){
    let options=f.options||[];
    if(f.widget==='relation'){
      const rel=state.collections.find(c=>c.group===f.collection&&c.name===f.file);
      const key=f.value_field?.split('.').pop()||'id',display=f.display_fields?.[0]?.split('.').pop()||'nome';
      options=entryList(rel||{file:''}).map(item=>({label:item[display],value:item[key]}));
    }
    const selected=f.multiple?(Array.isArray(value)?value:String(value||'').split(/[|,;]/).map(x=>x.trim()).filter(Boolean)):[String(value??'')];
    const known=options.map(o=>String(typeof o==='object'?o.value:o));
    selected.filter(v=>v&&!known.includes(String(v))).forEach(v=>options=[...options,{value:v,label:v+' (valor existente)'}]);
    input='<select id="'+id+'" name="'+name+'"'+required+(f.multiple?' multiple size="6"':'')+'>'+(!f.multiple?'<option value="">Selecione…</option>':'')+options.map(o=>{const v=typeof o==='object'?o.value:o,l=typeof o==='object'?o.label:o;return '<option value="'+esc(v)+'" '+(selected.map(String).includes(String(v))?'selected':'')+'>'+esc(l)+'</option>'}).join('')+'</select>';
  }else if(['text','markdown','list','object'].includes(f.widget)){
    const v=['list','object'].includes(f.widget)?JSON.stringify(value??(f.widget==='list'?[]:{}),null,2):value??'';
    input='<textarea id="'+id+'" name="'+name+'"'+required+'>'+esc(v)+'</textarea>';
  }else if(f.widget==='boolean'){
    input='<select id="'+id+'" name="'+name+'"><option value="false" '+(!value?'selected':'')+'>Não</option><option value="true" '+(value?'selected':'')+'>Sim</option></select>';
  }else if(f.widget==='image'||f.widget==='file'){
    input='<input id="'+id+'" type="text" name="'+name+'" value="'+esc(value||'')+'" placeholder="Caminho ou URL do arquivo"><input type="file" aria-label="Enviar '+label+'" data-upload-for="'+name+'"'+(f.widget==='image'?' accept="image/*"':'')+'>'+(f.widget==='image'?'<button type="button" class="small-button photo-crop-action" data-photo-crop="'+photoCropFormat(f)+'">Recortar foto</button>':'');
  }else{
    const type=['date','datetime'].includes(f.widget)?'date':f.widget==='number'?'number':'text';
    input='<input id="'+id+'" type="'+type+'" name="'+name+'" value="'+esc(value??'')+'"'+required+'>';
  }
  return '<div class="field'+full+'"><label for="'+id+'">'+label+(f.required!==false?' *':'')+'</label>'+input+(f.hint?'<small>'+esc(f.hint)+'</small>':'')+'</div>';
}
async function saveEntry(event,schema){event.preventDefault();const form=event.currentTarget;if(form.dataset.saving)return;const item={...state.editing.original};for(const f of schema){const el=form.elements.namedItem(f.name);if(!el)continue;let value=f.multiple?[...el.selectedOptions].map(o=>o.value):el.value;if(Array.isArray(f.pattern)&&value&&!new RegExp(f.pattern[0]).test(String(value))){toast(f.pattern[1]||'Confira '+f.label,true);el.focus();return}if(f.widget==='number'&&value!=='')value=Number(value);if(f.widget==='boolean')value=value==='true';if(['list','object'].includes(f.widget)){try{value=JSON.parse(value);if(f.widget==='list'?!Array.isArray(value):!value||typeof value!=='object'||Array.isArray(value))throw new Error('Tipo inválido')}catch(e){toast('O campo '+(f.label||f.name)+' precisa conter JSON válido.',true);return}}if((f.widget==='image'||f.widget==='file')&&f.required!==false&&!value&&!selectedPhotos(form.querySelector('[data-upload-for="'+f.name+'"]')).length){toast('Selecione um arquivo ou preencha '+f.label+'.',true);el.focus();return}if(value!==''||f.required||Object.prototype.hasOwnProperty.call(item,f.name))item[f.name]=value}form.dataset.saving='true';const saveButton=form.querySelector('[type=submit]');saveButton.disabled=true;saveButton.textContent='Preparando…';const unlock=()=>{delete form.dataset.saving;saveButton.disabled=false;saveButton.textContent='Adicionar à fila'};const uploads=form.querySelectorAll('[data-upload-for]');for(const input of uploads){const file=selectedPhotos(input)[0];if(!file)continue;try{const path=await uploadImage(file);item[input.dataset.uploadFor]=path}catch(e){unlock();toast(e.message,true);return}}const c=state.collections[state.active];const list=entryList(c).slice();if(state.editing.index===null)list.push(item);else list[state.editing.index]=item;try{await saveCollection(c,{...state.contents[c.file],[listKey(c)]:list});closeModal(true);openCollection(state.active);renderNav();toast('Registro adicionado à fila de revisão.')}catch(error){unlock();toast(error.message,true)}}

function normalizeHeader(value){return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'')}
function excelCell(value){if(value instanceof Date&&!isNaN(value))return value.toISOString().slice(0,10);return value??''}
function exportExcel(c,fields){if(!window.XLSX){toast('A biblioteca de planilhas ainda não carregou. Atualize a página.',true);return}const rows=entryList(c).map(item=>Object.fromEntries(fields.map(f=>[f.label||f.name,((f.multiple||['list','object'].includes(f.widget))&&item[f.name]!=null)?JSON.stringify(item[f.name]):(item[f.name]??'')])));const ws=XLSX.utils.json_to_sheet(rows.length?rows:[Object.fromEntries(fields.map(f=>[f.label||f.name,'']))]);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Registros');XLSX.writeFile(wb,'GPENSC-'+c.name+'.xlsx');toast('Planilha exportada.')}
function openExcelImport(c,fields){if(!canLeaveCurrentEditor())return;if(!window.XLSX){toast('A biblioteca de planilhas ainda não carregou. Atualize a página.',true);return}$('#modal-root').innerHTML='<div class="modal-backdrop"><section class="modal excel-modal"><div class="modal-head"><div><span class="eyebrow">IMPORTAÇÃO EM LOTE</span><h2>Adicionar registros por Excel</h2></div><button type="button" class="small-button" id="close-excel">Fechar</button></div><div class="modal-body excel-body"><div class="excel-intro"><strong>Importe vários registros de uma só vez.</strong><p>Use uma planilha .xlsx, .xls ou .csv. A primeira linha deve conter os nomes dos campos. Os registros serão adicionados aos atuais, sem apagar o que já existe.</p></div><div class="field full"><label for="excel-file">Selecionar planilha</label><input id="excel-file" type="file" accept=".xlsx,.xls,.csv"></div><div id="excel-preview" class="excel-preview"><p>Depois de selecionar o arquivo, confira a prévia antes de adicionar os registros à fila.</p></div></div><div class="modal-foot"><span class="eyebrow">IMPORTAÇÃO LOCAL: REVISE ANTES DE PUBLICAR</span><div><button type="button" class="secondary-button" id="cancel-excel">Cancelar</button><button type="button" class="primary-button" id="confirm-excel" disabled>Adicionar registros</button></div></div></section></div>';$('#close-excel').onclick=$('#cancel-excel').onclick=()=>closeModal();let pending=[];const fileInput=$('#excel-file');fileInput.onchange=async()=>{pending=[];$('#confirm-excel').disabled=true;const file=fileInput.files?.[0];if(!file)return;try{const data=await file.arrayBuffer();if(!fileInput.isConnected||fileInput.files?.[0]!==file)return;const wb=XLSX.read(data,{type:'array',cellDates:true});const sheet=wb.Sheets[wb.SheetNames[0]];const rows=XLSX.utils.sheet_to_json(sheet,{defval:'',raw:true});if(!rows.length)throw new Error('A planilha está vazia ou não possui cabeçalho.');const headers=Object.keys(rows[0]);const mapping={};for(const f of fields){const candidates=[normalizeHeader(f.name),normalizeHeader(f.label)];mapping[f.name]=headers.find(h=>candidates.includes(normalizeHeader(h)))||null}const missing=fields.filter(f=>f.required!==false&&!mapping[f.name]).map(f=>f.label||f.name);if(missing.length)throw new Error('Colunas obrigatórias não encontradas: '+missing.join(', ')+'. Use os nomes dos campos exibidos no painel.');const issues=[];pending=rows.map((row,i)=>{const item=defaultItem(fields);for(const f of fields){const h=mapping[f.name];if(!h)continue;let v=excelCell(row[h]);if(typeof v==='string')v=v.trim();if(['date','datetime'].includes(f.widget)&&typeof v==='number'){const d=XLSX.SSF.parse_date_code(v);if(d)v=[d.y,String(d.m).padStart(2,'0'),String(d.d).padStart(2,'0')].join('-');}if((f.multiple||['list','object'].includes(f.widget))&&v){
  try{
    const list=f.multiple||f.widget==='list';
    if(f.multiple&&typeof v==='string'&&!v.startsWith('[')&&!v.startsWith('"')){
      v=v.split(/[|,;]/).map(value=>value.trim()).filter(Boolean);
    }else{
      v=JSON.parse(v);
      if(f.multiple&&typeof v==='string')v=v.split(/[|,;]/).map(value=>value.trim()).filter(Boolean);
    }
    if(list?!Array.isArray(v):!v||typeof v!=='object'||Array.isArray(v))throw new Error('Tipo inválido');
  }catch{issues.push('Linha '+(i+2)+': '+(f.label||f.name)+' deve conter '+(f.multiple||f.widget==='list'?'uma lista':'um objeto')+' em formato válido.')}
}else if(f.widget==='boolean'){v=String(v).toLowerCase()==='true'||String(v).toLowerCase()==='sim'||String(v)==='1'}else if(f.widget==='number'&&v!==''){v=Number(String(v).replace(',','.'));if(!Number.isFinite(v))issues.push('Linha '+(i+2)+': valor numérico inválido em '+(f.label||f.name)+'.')}if(v!==''&&v!==undefined&&Array.isArray(f.pattern)&&f.pattern[0]&&!new RegExp(f.pattern[0]).test(String(v)))issues.push('Linha '+(i+2)+': '+(f.pattern[1]||'formato inválido em '+(f.label||f.name)));if(v!==''&&v!==undefined)item[f.name]=v}for(const f of fields.filter(x=>x.required!==false)){if(item[f.name]===''||item[f.name]===undefined)issues.push('Linha '+(i+2)+': falta preencher '+(f.label||f.name)+'.')}return item});const preview=$('#excel-preview');preview.innerHTML='<div class="excel-summary"><strong>'+pending.length+' linhas encontradas</strong><span>'+Object.values(mapping).filter(Boolean).length+' de '+fields.length+' colunas reconhecidas</span></div><div class="excel-columns">'+fields.map(f=>'<span class="'+(mapping[f.name]?'mapped':'unmapped')+'">'+esc(f.label||f.name)+(mapping[f.name]?' · '+esc(mapping[f.name]):' · não encontrada')+'</span>').join('')+'</div>'+(issues.length?'<div class="excel-errors"><strong>Corrija antes de importar:</strong><ul>'+issues.slice(0,12).map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>'+(issues.length>12?'<small>e mais '+(issues.length-12)+' ocorrência(s).</small>':'')+'</div>':'<p class="excel-ready">Prévia validada. Os registros serão acrescentados ao final da lista.</p>');$('#confirm-excel').disabled=issues.length>0||!pending.length; }catch(e){if(!fileInput.isConnected||fileInput.files?.[0]!==file)return;$('#excel-preview').innerHTML='<div class="excel-errors">'+esc(e.message)+'</div>';pending=[]}};$('#confirm-excel').onclick=async()=>{if(!pending.length)return;const button=$('#confirm-excel');button.disabled=true;button.textContent='Preparando…';const modal=button.closest('.modal');if(modal)modal.dataset.saving='true';try{await saveCollection(c,{...state.contents[c.file],[listKey(c)]:[...entryList(c),...pending]});const count=pending.length;closeModal(true);openCollection(state.active);renderNav();toast(count+' registro(s) adicionados à fila para revisão.')}catch(e){if(modal)delete modal.dataset.saving;button.disabled=false;button.textContent='Tentar novamente';toast(e.message,true)}}}
async function saveCollection(c,content){return batch.stage(c,content)}
async function uploadImage(file){return batch.stageMedia(file)}
async function deleteItem(index){if(!canLeaveCurrentEditor())return;if(!confirm('Mover esta exclusão para a fila? O site não mudará até você publicar.'))return;const c=state.collections[state.active];const items=entryList(c).slice();items.splice(index,1);try{await saveCollection(c,{...state.contents[c.file],[listKey(c)]:items});openCollection(state.active);renderNav();toast('Exclusão adicionada à fila de revisão.')}catch(e){toast(e.message,true)}}
function closeModal(force=false){
  const form=$('#entry-form');
  const modal=$('#modal-root .modal');
  if(!force&&modal?.dataset.saving==='true'){toast('A importação ainda está sendo gravada.',true);return false;}
  if(!force&&form?.dataset.saving==='true')return false;
  if(!force&&form?.dataset.dirty==='true'&&!confirm('Existem alterações não salvas. Deseja descartá-las?'))return false;
  $('#modal-root').innerHTML='';
  document.body.classList.remove('editor-open');
  $('#new-item')?.focus();
  return true;
}
function canLeaveCurrentEditor(){
  if(batch.isPublishing()){toast('Aguarde o envio das alterações.',true);return false;}
  if($('#entry-form'))return closeModal();
  if($('#modal-root .excel-modal'))return closeModal();
  const form=$('#config-form')||$('#gallery-form');
  if(form?.dataset.saving==='true'){toast('O salvamento ainda está em andamento.',true);return false;}
  if(form?.dataset.dirty==='true'&&!confirm('Existem alterações não salvas. Deseja descartá-las?'))return false;
  return true;
}
window.addEventListener('beforeunload',event=>{
  const form=$('#entry-form')||$('#config-form')||$('#gallery-form');
  if(batch.isPublishing()||form?.dataset.dirty==='true'){event.preventDefault();event.returnValue='';}
});
$('#login-button').addEventListener('click',login);
$('#pending-trigger').addEventListener('click',openPendingReview);
$('#token-login-button').addEventListener('click',loginWithCode);
$('#retry-loading')?.addEventListener('click',()=>initialize());
$('#access-code').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();loginWithCode()}});
function updateMobileTabs(){
  const menuOpen=$('.sidebar').classList.contains('mobile-open');
  $('#mobile-home').classList.toggle('active',state.view==='summary'&&!menuOpen);
  $('#mobile-sections').classList.toggle('active',(state.view!=='summary'&&state.view!=='review')||menuOpen);
  $('#mobile-review').classList.toggle('active',state.view==='review'&&!menuOpen);
}
function closeMobileMenu(){
  const side=$('.sidebar');
  side.classList.remove('mobile-open');
  document.body.classList.remove('mobile-menu-open');
  $('#mobile-sections').setAttribute('aria-expanded','false');
  const filter=$('#mobile-collection-search');if(filter){filter.value='';filter.dispatchEvent(new Event('input'))}
  updateMobileTabs();
}
$('.brand').addEventListener('click',event=>{event.preventDefault();renderHome();closeMobileMenu()});
$('#mobile-menu-close').addEventListener('click',closeMobileMenu);
$('#mobile-collection-search').addEventListener('input',event=>{
  const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const term=normalize(event.target.value.trim());
  $('#collection-nav').querySelectorAll('button').forEach(button=>{
    button.hidden=!!term&&!normalize(button.textContent).includes(term);
  });
  $('#collection-nav').querySelectorAll('.menu-section').forEach(section=>{
    const buttons=[...section.querySelectorAll('button[data-index]')];
    section.hidden=!!term&&!buttons.some(button=>!button.hidden);
  });
});
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
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('.photo-crop-dialog[open]'))closeMobileMenu()});
$('#mobile-review').addEventListener('click',()=>{closeMobileMenu();openPendingReview();window.scrollTo({top:0,behavior:'smooth'})});
$('#logout-button').addEventListener('click',()=>{if(!canLeaveCurrentEditor())return;sessionStorage.removeItem('gpen_admin_token');sessionStorage.removeItem('gpen_admin_auth_mode');state.token='';state.authMode='github';state.user=null;closeMobileMenu();$('#workspace').hidden=true;$('#login-view').hidden=false;$('#login-status').textContent='Sessão encerrada.'});
// Keep full-screen editors inside the visible area when the mobile keyboard opens.
function updateVisibleViewport(){
  const viewport=window.visualViewport;
  document.documentElement.style.setProperty('--admin-visible-height',(viewport?viewport.height:window.innerHeight)+'px');
  document.documentElement.style.setProperty('--admin-visible-top',(viewport?viewport.offsetTop:0)+'px');
}
updateVisibleViewport();
window.visualViewport?.addEventListener('resize',updateVisibleViewport);
window.visualViewport?.addEventListener('scroll',updateVisibleViewport);
window.addEventListener('resize',()=>{
  updateVisibleViewport();
  if(window.innerWidth>700&&document.body.classList.contains('mobile-menu-open'))closeMobileMenu();
});
if(state.token)initialize();
})();