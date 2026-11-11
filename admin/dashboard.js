(() => {
'use strict';
if (window.__GPEN_DASH__) return;
window.__GPEN_DASH__ = true;

const collections = {
  equipe: 'equipe.yml',
  linhas: 'linhas.yml',
  projetos: 'projetos.yml',
  publicacoes: 'publicacoes.yml',
  noticias: 'noticias.yml',
  eventos: 'eventos.yml',
  livros: 'livros.yml',
  defesas: 'defesas.yml',
  disciplinas: 'disciplinas.yml',
  linha_tempo: 'linha_tempo.yml',
  galeria: 'galeria.yml',
  videos: 'videos.yml',
  sites: 'sites.yml',
  apoio: 'apoio.yml',
  parcerias: 'parcerias.yml'
};
const base = new URL('../data/', window.location.href);
const data = {};
let root;
const labels = {
  noticias: 'Notícias',
  eventos: 'Agenda e eventos',
  linhas: 'Linhas de pesquisa',
  projetos: 'Projetos',
  publicacoes: 'Publicações',
  livros: 'Livros',
  defesas: 'Defesas e bancas',
  equipe: 'Equipe e integrantes',
  disciplinas: 'Disciplinas e ensino',
  linha_tempo: 'Linha do tempo',
  galeria: 'Galeria de fotos',
  videos: 'Vídeos publicados',
  sites: 'Sites recomendados',
  apoio: 'Instituições parceiras',
  parcerias: 'Parcerias registradas no CNPq'
};
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));
const valid = value => value !== null && value !== undefined && String(value).trim() !== '';
const isExample = item => Object.values(item || {}).some(value =>
  typeof value === 'string' && /\[EXEMPLO\]|\[NOME\]|\[SOBRENOME|\[PERIÓDICO\]|\[EVENTO\]|\[Agência\/Edital\]|\[Nome\]/i.test(value)
);
const records = key => (Array.isArray(data[key]) ? data[key] : []).filter(item => item && !isExample(item));
const total = key => records(key).length;
const dateValue = value => {
  if (!valid(value)) return 0;
  const raw = String(value);
  const normalized = /^\d{4}$/.test(raw) ? raw + '-01-01' : raw;
  const time = Date.parse(normalized);
  return Number.isNaN(time) ? 0 : time;
};
const formatDate = value => {
  if (!valid(value)) return 'Data não informada';
  const raw = String(value);
  if (/^\d{4}$/.test(raw)) return raw;
  const date = new Date(raw + (raw.length === 10 ? 'T12:00:00' : ''));
  return Number.isNaN(date.getTime()) ? raw : new Intl.DateTimeFormat('pt-BR').format(date);
};
const icon = name => {
  const paths = {
    overview:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    content:'<path d="M4 5h16M4 12h16M4 19h10"/>',
    research:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5M8 10h5M10.5 7.5v5"/>',
    team:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.5-3.5 2.7-5.5 6.5-5.5s6 2 6.5 5.5M16 5.5a3 3 0 0 1 0 5.8M17 15c2.5.5 4 2.1 4.5 4.5"/>',
    media:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 20"/>',
    external:'<path d="M14 4h6v6M20 4 10 14"/><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/>',
    arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
    book:'<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22z"/><path d="M4 5.5v14A2.5 2.5 0 0 1 6.5 17H20"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>'
  };
  return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+(paths[name] || paths.overview)+'</svg>';
};

async function load() {
  const parser = window.jsyaml || window.jsYaml;
  await Promise.all(Object.entries(collections).map(async ([key, file]) => {
    try {
      const response = await fetch(new URL(file, base), { cache: 'no-store' });
      if (!response.ok || !parser || typeof parser.load !== 'function') {
        data[key] = [];
        return;
      }
      const parsed = parser.load(await response.text()) || {};
      data[key] = Array.isArray(parsed.itens) ? parsed.itens : [];
    } catch (error) {
      data[key] = [];
    }
  }));
  render();
}

const collectionRoutes = {
  noticias: { collection: 'comunicacao', file: 'noticias', label: 'Notícias' },
  eventos: { collection: 'comunicacao', file: 'eventos', label: 'Agenda e eventos' },
  linhas: { collection: 'pesquisa', file: 'linhas', label: 'Linhas de pesquisa' },
  projetos: { collection: 'pesquisa', file: 'projetos', label: 'Projetos' },
  publicacoes: { collection: 'pesquisa', file: 'publicacoes', label: 'Publicações' },
  livros: { collection: 'pesquisa', file: 'livros', label: 'Livros' },
  defesas: { collection: 'pesquisa', file: 'defesas', label: 'Defesas e bancas' },
  equipe: { collection: 'ensino_equipe', file: 'equipe', label: 'Equipe e integrantes' },
  disciplinas: { collection: 'ensino_equipe', file: 'disciplinas', label: 'Disciplinas e ensino' },
  linha_tempo: { collection: 'midia_parcerias', file: 'linha_tempo', label: 'Linha do tempo · Quem somos' },
  galeria: { collection: 'midia_parcerias', file: 'galeria', label: 'Galeria de fotos' },
  videos: { collection: 'midia_parcerias', file: 'videos', label: 'Vídeos publicados' },
  sites: { collection: 'midia_parcerias', file: 'sites', label: 'Sites recomendados' },
  apoio: { collection: 'midia_parcerias', file: 'apoio', label: 'Instituições parceiras' },
  parcerias: { collection: 'midia_parcerias', file: 'parcerias', label: 'Parcerias registradas no CNPq' }
};

function normalizeLabel(value) {
  return String(value || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/\\s+/g, ' ').trim().toLocaleLowerCase('pt-BR');
}
function findVisibleTextElement(label) {
  const wanted = normalizeLabel(label);
  const sidebar = document.querySelector('.primary-sidebar');
  if (!sidebar) return null;
  const candidates = [...sidebar.querySelectorAll('button, a, [role="button"], [role="option"]')];
  return candidates.find(element => {
    if (!element.isConnected || root?.contains(element)) return false;
    const text = normalizeLabel(element.innerText || element.getAttribute('aria-label') || element.textContent);
    const rect = element.getBoundingClientRect();
    return text === wanted && rect.width > 0 && rect.height > 0;
  }) || null;
}

function navigate(key) {
  if (key === 'config') {
    hide();
    window.location.hash = '/collections/configuracoes';
    return;
  }
  const route = collectionRoutes[key];
  if (!route) return;
  hide();
  const targetHash = '/collections/' + route.collection;
  if (window.location.hash !== '#' + targetHash) {
    window.location.hash = targetHash;
  } else {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }
  let attempts = 0;
  const openFile = () => {
    const target = findVisibleTextElement(route.label);
    if (target) {
      target.click();
      return;
    }
    attempts += 1;
    if (attempts < 60) window.setTimeout(openFile, 150);
  };
  window.setTimeout(openFile, 150);
}
function hide() {
  if (!root) return;
  root.hidden = true;
  document.body.classList.remove('gpen-dashboard-open');
  const launcher = document.getElementById('gpen-dashboard-launcher');
  if (launcher) launcher.hidden = false;
}
function show() {
  if (!root) return;
  root.hidden = false;
  document.body.classList.add('gpen-dashboard-open');
  const launcher = document.getElementById('gpen-dashboard-launcher');
  if (launcher) launcher.hidden = true;
  render();
}

function publicationChart(items) {
  const years = {};
  items.forEach(item => {
    const year = String(item.ano || '').slice(0, 4);
    if (/^\d{4}$/.test(year)) years[year] = (years[year] || 0) + 1;
  });
  const values = Object.entries(years).sort((a,b) => a[0].localeCompare(b[0])).slice(-7);
  if (!values.length) return '<div class="gpd-empty">As publicações cadastradas com dados válidos aparecerão neste gráfico.</div>';
  const max = Math.max(1, ...values.map(item => item[1]));
  return '<div class="gpd-chart" role="img" aria-label="Publicações por ano">'+
    '<div class="gpd-chart-y"><span>'+max+'</span><span>'+Math.ceil(max/2)+'</span><span>0</span></div>'+
    '<div class="gpd-bars">'+values.map(([year,count]) =>
      '<div class="gpd-bar"><div class="gpd-bar-track"><span style="height:'+Math.max(4,count/max*100)+'%"></span></div><b>'+count+'</b><small>'+esc(year)+'</small></div>'
    ).join('')+'</div></div>';
}

function projectStatus(items) {
  const statuses = ['Em andamento','Em planejamento','Concluído','Suspenso'];
  const colors = ['#356b49','#8eaf94','#792d43','#c5a0aa'];
  const counts = statuses.map(status => items.filter(item => String(item.situacao || '').toLocaleLowerCase('pt-BR') === status.toLocaleLowerCase('pt-BR')).length);
  const sum = counts.reduce((a,b) => a+b,0);
  if (!sum) return '<div class="gpd-empty">Cadastre projetos com situação definida para visualizar a distribuição.</div>';
  let cursor = 0;
  const stops = counts.map((count,index) => {
    const start = cursor;
    cursor += count / sum * 100;
    return colors[index]+' '+start+'% '+cursor+'%';
  }).join(', ');
  return '<div class="gpd-donut-wrap"><div class="gpd-donut" style="background:conic-gradient('+stops+')"><div><strong>'+items.length+'</strong><small>projetos</small></div></div><div class="gpd-legend">'+statuses.map((status,index) =>
    '<div><i style="background:'+colors[index]+'"></i><span>'+status+'</span><b>'+counts[index]+'</b></div>'
  ).join('')+'</div></div>';
}

function activityList() {
  const types = [
    ['noticias','Notícia','data','titulo'],
    ['eventos','Evento','data','titulo'],
    ['projetos','Projeto','inicio','titulo'],
    ['publicacoes','Publicação','ano','titulo'],
    ['defesas','Defesa/banca','data','titulo'],
    ['videos','Vídeo','data','titulo'],
    ['linha_tempo','Linha do tempo','ano','titulo']
  ];
  const items = [];
  types.forEach(([key,type,dateField,titleField]) => records(key).forEach(item => {
    const title = item[titleField] || item.nome;
    if (valid(title)) items.push({title,type,date:item[dateField],time:dateValue(item[dateField])});
  }));
  items.sort((a,b) => b.time-a.time);
  return items.slice(0,6);
}

function render() {
  if (!root) return;
  const team = records('equipe');
  const lines = records('linhas');
  const projects = records('projetos');
  const pubs = records('publicacoes');
  const news = records('noticias');
  const events = records('eventos');
  const examplesFound = Object.values(data).some(items => (items || []).some(isExample));
  const metrics = [
    ['Integrantes',team.length,'Pessoas vinculadas ao grupo','equipe','team'],
    ['Linhas de pesquisa',lines.length,'Frentes de investigação','linhas','research'],
    ['Projetos',projects.length,'Pesquisa e extensão','projetos','research'],
    ['Publicações',pubs.length,'Produção científica cadastrada','publicacoes','book'],
    ['Notícias',news.length,'Comunicados publicados','noticias','content'],
    ['Eventos',events.length,'Atividades na agenda','eventos','calendar']
  ];
  const activity = activityList();
  const now = new Intl.DateTimeFormat('pt-BR',{dateStyle:'full'}).format(new Date());
  const groups = [
    {title:'VISÃO GERAL',items:[['Visão geral','overview',null]]},
    {title:'CONTEÚDO E COMUNICAÇÃO',items:[['Notícias','content','noticias'],['Agenda e eventos','calendar','eventos']]},
    {title:'PESQUISA E PRODUÇÃO',items:[['Linhas de pesquisa','research','linhas'],['Projetos','research','projetos'],['Publicações','book','publicacoes'],['Livros','book','livros'],['Defesas e bancas','calendar','defesas']]},
    {title:'ENSINO E EQUIPE',items:[['Equipe e integrantes','team','equipe'],['Disciplinas e ensino','book','disciplinas']]},
    {title:'MÍDIA E INSTITUIÇÕES',items:[['Linha do tempo','calendar','linha_tempo'],['Galeria de fotos','media','galeria'],['Vídeos publicados','media','videos'],['Sites recomendados','external','sites'],['Instituições parceiras','team','apoio'],['Parcerias registradas no CNPq','team','parcerias']]}
  ];
  root.innerHTML = '<div class="gpd-layout">'+
    '<aside class="gpd-side">'+
      '<div class="gpd-brand"><img src="../img/logo_gpensc.png" alt=""><span>GPENSC<small>Painel administrativo</small></span></div>'+
      '<nav class="gpd-nav" aria-label="Navegação administrativa">'+groups.map(group =>
        '<section class="gpd-nav-group"><label>'+group.title+'</label>'+group.items.map(([label,ico,key]) =>
          '<button class="'+(!key?'selected':'')+'" '+(key?'data-go="'+key+'"':'data-home="true"')+'>'+icon(ico)+'<span>'+label+'</span></button>'
        ).join('')+'</section>'
      ).join('')+'</nav>'+
      '<div class="gpd-side-bottom"><a href="../" target="_blank" rel="noopener">'+icon('external')+'<span>Visualizar site público</span></a><small>Grupo de Pesquisa · UFOP</small></div>'+
    '</aside>'+
    '<main class="gpd-main">'+
      '<header class="gpd-top"><div class="gpd-breadcrumb"><span>Administração</span><i>/</i><b>Visão geral</b></div><div class="gpd-top-actions"><span class="gpd-date">'+esc(now)+'</span><button data-editor>Entrar no editor</button></div></header>'+
      '<div class="gpd-content">'+
        '<section class="gpd-hero"><div><small>PAINEL DE CONTROLE</small><h1>Visão geral</h1><p>Acompanhe a estrutura, a produção e as atualizações do GPENSC.</p></div><div class="gpd-hero-mark">GP</div></section>'+
        '<section class="gpd-section-head"><div><h2>Indicadores do grupo</h2><p>Totais calculados com base nos registros publicados nos arquivos de conteúdo.</p></div><span class="gpd-live"><i></i> Dados carregados</span></section>'+
        '<section class="gpd-stats">'+metrics.map((metric,index) =>
          '<button class="gpd-stat gpd-stat-'+index+'" data-go="'+metric[3]+'"><span class="gpd-stat-top">'+icon(metric[4])+'<small>'+metric[0]+'</small></span><strong>'+metric[1]+'</strong><span class="gpd-stat-foot">'+metric[2]+'</span></button>'
        ).join('')+'</section>'+
        (examplesFound?'<div class="gpd-warning"><b>Registros de demonstração identificados</b><span>Itens marcados como exemplo ou com campos de preenchimento fictícios foram excluídos das estatísticas. Substitua-os por informações reais para atualizar os indicadores.</span></div>':'')+
        '<section class="gpd-section-head gpd-section-spaced"><div><h2>Produção e projetos</h2><p>Leitura da produção científica e da carteira de projetos.</p></div></section>'+
        '<section class="gpd-panels gpd-analytics"><article class="gpd-panel"><div class="gpd-panel-head"><div><h3>Produção científica</h3><p>Publicações registradas por ano</p></div><button data-go="publicacoes">Ver publicações</button></div>'+publicationChart(pubs)+'</article>'+
        '<article class="gpd-panel"><div class="gpd-panel-head"><div><h3>Situação dos projetos</h3><p>Distribuição por status cadastrado</p></div><button data-go="projetos">Ver projetos</button></div>'+projectStatus(projects)+'</article></section>'+
        '<section class="gpd-panels gpd-lower"><article class="gpd-panel"><div class="gpd-panel-head"><div><h3>Atividade recente</h3><p>Registros mais recentes entre as seções acompanhadas</p></div></div>'+
        (activity.length?'<div class="gpd-activity">'+activity.map(item=>'<div class="gpd-activity-row"><span class="gpd-activity-dot"></span><div><b>'+esc(item.title)+'</b><small>'+esc(item.type)+'</small></div><time>'+esc(formatDate(item.date))+'</time></div>').join('')+'</div>':'<div class="gpd-empty">As notícias, eventos, projetos e publicações cadastrados aparecerão aqui.</div>')+
        '</article><article class="gpd-panel"><div class="gpd-panel-head"><div><h3>Estrutura do grupo</h3><p>Distribuição dos registros institucionais</p></div></div>'+
        '<div class="gpd-structure">'+[['Equipe',team.length,'equipe'],['Linhas de pesquisa',lines.length,'linhas'],['Disciplinas',total('disciplinas'),'disciplinas'],['Defesas e bancas',total('defesas'),'defesas'],['Livros',total('livros'),'livros'],['Galeria de fotos',total('galeria'),'galeria']].map(item=>'<button data-go="'+item[2]+'"><span>'+item[0]+'</span><b>'+item[1]+'</b></button>').join('')+'</div></article></section>'+
        '<section class="gpd-panel gpd-quick"><div class="gpd-panel-head"><div><h3>Acesso rápido</h3><p>Abra diretamente as áreas de atualização mais utilizadas.</p></div></div><div class="gpd-quick-grid">'+[['Notícias','noticias','Publicar comunicados e novidades'],['Agenda e eventos','eventos','Atualizar atividades e datas'],['Projetos','projetos','Gerenciar pesquisa e extensão'],['Equipe e integrantes','equipe','Atualizar perfis e vínculos'],['Galeria de fotos','galeria','Organizar imagens e legendas'],['Configurações avançadas','config','Editar textos e informações institucionais']].map(item=>'<button data-go="'+item[1]+'"><span>'+item[0]+'</span><small>'+item[2]+'</small>'+icon('arrow')+'</button>').join('')+'</div></section>'+
        '<footer><span>GPENSC · Grupo de Pesquisa e Ensino em Nutrição e Saúde Coletiva</span><span>Universidade Federal de Ouro Preto</span></footer>'+
      '</div></main></div>';
  root.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.go === 'config') navigate('config');
    else navigate(button.dataset.go);
  }));
  root.querySelectorAll('[data-editor]').forEach(button => button.addEventListener('click', hide));
  root.querySelectorAll('[data-home]').forEach(button => button.addEventListener('click', show));
}

function mount() {
  if (root || document.body.classList.contains('gpen-login-active')) return;
  root = document.createElement('div');
  root.id = 'gpen-dashboard';
  root.hidden = true;
  document.body.append(root);
  const launcher = document.createElement('button');
  launcher.id = 'gpen-dashboard-launcher';
  launcher.textContent = 'Visão geral';
  launcher.hidden = true;
  launcher.addEventListener('click', show);
  document.body.append(launcher);
  load();
  show();
}
function check() {
  const login = document.querySelector('.container > .inner .buttons');
  if (login) {
    if (root) hide();
    return;
  }
  if (document.querySelector('.primary-sidebar, #page-container') && !root) mount();
}
new MutationObserver(check).observe(document.documentElement, {
  childList:true, subtree:true, attributes:true, attributeFilter:['class','hidden']
});
document.addEventListener('DOMContentLoaded', check);
check();
})();