/* GPENSC accessibility controls: independent, progressive enhancement. */
(function(){
'use strict';
const defaults={size:0,contrast:false,smart:false,motion:false,links:false,spacing:false,images:false,dyslexia:false,structure:false,lineHeight:false,align:false,saturation:false,readingGuide:false,largeCursor:false};
let state={...defaults};
try{const v=JSON.parse(localStorage.getItem('gp-access-preferences')||'{}');for(const k of Object.keys(defaults)){if(k==='size')state[k]=Math.max(0,Math.min(4,Number(v[k])||0));else state[k]=v[k]===true;}}catch(_){}
const controls=[
['smart','◐','Contraste inteligente'],['motion','Ⅱ','Pausar animações'],
['reader','◉','Leitor de texto'],['contrast','◑','Contraste +'],
['links','↗','Destacar links'],['increase','A+','Aumentar texto'],
['spacing','↔','Espaçamento do texto'],['images','▧','Ocultar imagens'],
['dyslexia','Df','Fonte legível'],['structure','▤','Estrutura da página'],
['lineHeight','↕','Altura das linhas'],['align','☷','Alinhar texto'],
['dictionary','Aa','Dicionário'],['saturation','◕','Saturação'],
['readingGuide','━','Guia de leitura'],['largeCursor','➤','Cursor ampliado']
];
const root=document.documentElement;
const persist=()=>{try{localStorage.setItem('gp-access-preferences',JSON.stringify(state));}catch(_){}};
function apply(){
  for(const k of Object.keys(defaults)){if(k!=='size')root.classList.toggle('gp-a11y-'+k,state[k]);}
  root.style.setProperty('--gp-a11y-scale',String(1+state.size*.125));
  document.querySelectorAll('#quarto-content main.content p,#quarto-content main.content li,#quarto-content main.content td,#quarto-content main.content h1,#quarto-content main.content h2,#quarto-content main.content h3').forEach(el=>{
    if(!el.dataset.gpA11yBase)el.dataset.gpA11yBase=getComputedStyle(el).fontSize;
    el.style.fontSize=state.size?'calc('+el.dataset.gpA11yBase+' * var(--gp-a11y-scale))':'';
  });
  document.querySelectorAll('#gp-access-panel [data-gp-tool]').forEach(b=>{
    const k=b.dataset.gpTool;
    if(Object.prototype.hasOwnProperty.call(state,k))b.setAttribute('aria-pressed',String(state[k]));
    if(k==='increase')b.querySelector('.gp-a11y-count').textContent=state.size?state.size+'/4':'';
  });
  persist();
}
function init(){
  const holder=document.getElementById('gp-access');
  if(!holder)return;
  const trigger=document.getElementById('gp-access-trigger');
  const panel=document.getElementById('gp-access-panel');
  const close=document.getElementById('gp-access-close');
  const grid=document.getElementById('gp-a11y-grid');
  const status=document.getElementById('gp-a11y-status');
  const setStatus=t=>{status.textContent=t;};
  const guide=document.createElement('div');guide.id='gp-a11y-reading-guide';guide.setAttribute('aria-hidden','true');document.body.append(guide);
  document.addEventListener('pointermove',e=>{if(state.readingGuide)guide.style.top=e.clientY+'px';});
  const stopSpeech=()=>{if('speechSynthesis' in window)window.speechSynthesis.cancel();};
  let speaking=false;
  grid.innerHTML=controls.map(([key,glyph,label])=>'<button type="button" class="gp-a11y-tile" data-gp-tool="'+key+'" '+(key in defaults?'aria-pressed="false"':'')+'><span class="gp-a11y-glyph" aria-hidden="true">'+glyph+'</span><span>'+label+'</span>'+(key==='increase'?'<small class="gp-a11y-count"></small>':'')+'</button>').join('');
  function toggle(open,focus){panel.hidden=!open;trigger.setAttribute('aria-expanded',String(open));if(open){close.focus();}else if(focus)trigger.focus();}
  trigger.addEventListener('click',()=>toggle(panel.hidden,true));
  close.addEventListener('click',()=>toggle(false,true));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)toggle(false,true);});
  document.addEventListener('pointerdown',e=>{if(!panel.hidden&&!holder.contains(e.target))toggle(false,false);});
  function speak(){
    if(!('speechSynthesis' in window)){setStatus('A leitura por voz não está disponível neste navegador.');return;}
    if(speaking){stopSpeech();speaking=false;setStatus('Leitura interrompida.');return;}
    const selected=String(window.getSelection()||'').trim();
    const content=document.querySelector('#quarto-content main')||document.querySelector('main');
    const value=selected||(content?content.innerText:'');
    if(!value){setStatus('Nenhum texto disponível para leitura.');return;}
    stopSpeech();
    const utterance=new SpeechSynthesisUtterance(value.slice(0,12000));
    utterance.lang=document.documentElement.lang||'pt-BR';
    utterance.rate=.95;
    utterance.onend=()=>{speaking=false;setStatus('Leitura concluída.');};
    utterance.onerror=()=>{speaking=false;setStatus('Não foi possível concluir a leitura.');};
    speaking=true;window.speechSynthesis.speak(utterance);
    setStatus('Lendo texto com a voz do navegador. Toque novamente para interromper.');
  }
  function dictionary(){
    const selected=String(window.getSelection()||'').trim().split(/\s+/).slice(0,3).join(' ');
    if(!selected){setStatus('Selecione uma palavra na página e depois toque em Dicionário.');return;}
    window.open('https://dicionario.priberam.org/'+encodeURIComponent(selected),'_blank','noopener,noreferrer');
    setStatus('Consulta aberta em outra aba.');
  }
  function structure(){
    const area=document.getElementById('gp-a11y-outline');
    area.replaceChildren();
    if(!state.structure){area.hidden=true;return;}
    const heads=[...document.querySelectorAll('#quarto-content main h1,#quarto-content main h2,#quarto-content main h3')].slice(0,45);
    if(!heads.length){area.textContent='Esta página não tem títulos identificados.';area.hidden=false;return;}
    const title=document.createElement('strong');title.textContent='Títulos da página';area.append(title);
    for(const h of heads){const a=document.createElement('button');a.type='button';a.textContent=h.textContent.trim();a.style.paddingLeft=(h.tagName==='H3'?'24px':h.tagName==='H2'?'12px':'0');a.addEventListener('click',()=>{toggle(false,false);h.scrollIntoView({behavior:'auto',block:'start'});h.setAttribute('tabindex','-1');h.focus({preventScroll:true});});area.append(a);}
    area.hidden=false;
  }
  grid.addEventListener('click',e=>{
    const b=e.target.closest('[data-gp-tool]');if(!b)return;
    const k=b.dataset.gpTool;
    if(k==='reader'){speak();return;}
    if(k==='dictionary'){dictionary();return;}
    if(k==='increase'){state.size=(state.size+1)%5;setStatus(state.size?'Texto ampliado: nível '+state.size+' de 4.':'Texto em tamanho padrão.');}
    else if(k in state){state[k]=!state[k];setStatus(b.innerText.trim()+': '+(state[k]?'ativado':'desativado')+'.');}
    apply();if(k==='structure')structure();
  });
  document.getElementById('gp-a11y-reset').addEventListener('click',()=>{state={...defaults};stopSpeech();speaking=false;apply();structure();setStatus('Configurações restauradas.');});
  document.querySelectorAll('#gp-a11y-lang button').forEach(b=>b.addEventListener('click',()=>{
    const lang=b.dataset.lang;
    if(typeof window.traduzirPagina==='function')window.traduzirPagina(lang);
    else setStatus('Use o seletor de idiomas no cabeçalho.');
  }));
  document.getElementById('gp-a11y-profile').addEventListener('change',e=>{
    const p=e.target.value;state={...defaults};
    if(p==='vision'){state.size=2;state.contrast=true;state.links=true;}
    if(p==='reading'){state.size=1;state.spacing=true;state.lineHeight=true;state.dyslexia=true;}
    if(p==='motion'){state.motion=true;}
    if(p==='focus'){state.images=true;state.links=true;}
    apply();structure();setStatus('Perfil de acessibilidade aplicado.');
  });
  apply();if(state.structure)structure();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
