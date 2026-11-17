/* GPENSC accessibility controls: independent, progressive enhancement. */
(function(){
'use strict';
const defaults={size:0,contrast:false,smart:false,motion:false,links:false,spacing:false,images:false,dyslexia:false,structure:false,lineHeight:false,align:0,saturation:false,readingGuide:false,largeCursor:false};
let state={...defaults};
try{const v=JSON.parse(localStorage.getItem('gp-access-preferences')||'{}');for(const k of Object.keys(defaults)){if(k==='size')state[k]=Math.max(0,Math.min(4,Number(v[k])||0));else if(k==='align')state[k]=Math.max(0,Math.min(4,Number(v[k])||0));else state[k]=v[k]===true;}}catch(_){}
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
const fontBase=new WeakMap();
const fontTargets='#quarto-content main.content :is(h1,h2,h3,h4,h5,h6,p,li,td,th,dt,dd,blockquote,figcaption)';
const persist=()=>{try{localStorage.setItem('gp-access-preferences',JSON.stringify(state));}catch(_){}};
const alignValues=['','left','center','right','justify'];
function apply(){
  for(const k of Object.keys(defaults)){
    if(k!=='size')root.classList.toggle('gp-a11y-'+k,Boolean(state[k]));
  }
  root.style.setProperty('--gp-a11y-scale',String(1+state.size*.125));
  root.style.setProperty('--gp-a11y-alignment',alignValues[state.align]||'left');
  // Os estilos do site usam !important: aplicar ampliação também com essa prioridade.
  document.querySelectorAll(fontTargets).forEach(el=>{
    if(!fontBase.has(el)){
      fontBase.set(el,{
        size:getComputedStyle(el).fontSize,
        original:el.style.getPropertyValue('font-size'),
        priority:el.style.getPropertyPriority('font-size')
      });
    }
    const base=fontBase.get(el);
    if(state.size){
      el.style.setProperty('font-size','calc('+base.size+' * var(--gp-a11y-scale))','important');
    }else if(base.original){
      el.style.setProperty('font-size',base.original,base.priority);
    }else{
      el.style.removeProperty('font-size');
    }
  });
  document.querySelectorAll('#gp-access-panel [data-gp-tool]').forEach(b=>{
    const k=b.dataset.gpTool;
    if(Object.prototype.hasOwnProperty.call(state,k))b.setAttribute('aria-pressed',String(Boolean(state[k])));
    if(k==='increase'){
      const count=b.querySelector('.gp-a11y-count');
      if(count)count.textContent=state.size?state.size+'/4':'';
      b.setAttribute('aria-pressed',String(state.size>0));
    }
    if(k==='align')b.setAttribute('aria-label','Alinhar texto: '+(alignValues[state.align]||'original'));
  });
  persist();
  document.dispatchEvent(new Event('gp:a11y-change'));
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
  guide.style.top='50vh';
  const moveGuide=y=>{if(state.readingGuide&&Number.isFinite(y))guide.style.top=Math.max(18,Math.min(window.innerHeight-18,y))+'px';};
  document.addEventListener('pointermove',e=>moveGuide(e.clientY),{passive:true});
  document.addEventListener('pointerdown',e=>moveGuide(e.clientY),{passive:true});
  document.addEventListener('touchmove',e=>{if(e.touches.length)moveGuide(e.touches[0].clientY);},{passive:true});
  document.addEventListener('touchstart',e=>{if(e.touches.length)moveGuide(e.touches[0].clientY);},{passive:true});
  let savedSelection='';
  document.addEventListener('selectionchange',()=>{
    const selection=window.getSelection();
    const active=document.activeElement;
    if(active&&holder.contains(active))return;
    const selected=String(selection||'').trim();
    if(selected)savedSelection=selected.slice(0,20000);
  });
  const stopSpeech=()=>{if('speechSynthesis' in window)window.speechSynthesis.cancel();};
  let speaking=false;
  grid.innerHTML=controls.map(([key,glyph,label])=>'<button type="button" class="gp-a11y-tile" data-gp-tool="'+key+'" '+(key in defaults?'aria-pressed="false"':'')+'><span class="gp-a11y-glyph" aria-hidden="true">'+glyph+'</span><span>'+label+'</span>'+(key==='increase'?'<small class="gp-a11y-count"></small>':'')+'</button>').join('');
  function toggle(open,focus){panel.hidden=!open;trigger.setAttribute('aria-expanded',String(open));if(open){close.focus();}else if(focus)trigger.focus();}
  trigger.addEventListener('click',()=>toggle(panel.hidden,true));
  close.addEventListener('click',()=>toggle(false,true));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)toggle(false,true);});
  document.addEventListener('pointerdown',e=>{if(!panel.hidden&&!holder.contains(e.target))toggle(false,false);});
  let activeSpeech=0;
  function speak(){
    if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window)){
      setStatus('A leitura por voz não está disponível neste navegador.');
      return;
    }
    if(speaking){
      activeSpeech++;
      stopSpeech();
      speaking=false;
      setStatus('Leitura interrompida.');
      return;
    }
    const selected=String(window.getSelection()||'').trim()||savedSelection;
    const content=document.querySelector('#quarto-content main.content')||document.querySelector('#quarto-content main')||document.querySelector('main');
    const value=(selected||(content?content.innerText:'')).replace(/\s+/g,' ').trim().slice(0,30000);
    if(!value){setStatus('Nenhum texto disponível para leitura.');return;}
    // Frases curtas contornam cortes de leitura de blocos longos no Chrome/Safari.
    const parts=value.match(/.{1,180}(?:[.!?;,:]\s|$)|.{1,180}/g)||[];
    const chunks=[];
    let buffer='';
    for(const part of parts){
      if((buffer+part).length>420&&buffer){chunks.push(buffer);buffer='';}
      buffer+=part;
    }
    if(buffer)chunks.push(buffer);
    if(!chunks.length){setStatus('Nenhum texto disponível para leitura.');return;}
    activeSpeech++;
    const session=activeSpeech;
    stopSpeech();
    speaking=true;
    let index=0;
    const readNext=()=>{
      if(session!==activeSpeech)return;
      if(index>=chunks.length){
        speaking=false;
        setStatus('Leitura concluída.');
        return;
      }
      const u=new SpeechSynthesisUtterance(chunks[index++]);
      u.lang=root.lang||'pt-BR';
      u.rate=.95;
      u.onend=()=>{if(session===activeSpeech)readNext();};
      u.onerror=()=>{if(session===activeSpeech){speaking=false;setStatus('A leitura foi interrompida ou não está disponível.');}};
      window.speechSynthesis.speak(u);
    };
    readNext();
    setStatus('Lendo texto em voz alta. Toque novamente para interromper.');
  }
  function dictionary(){
    const raw=String(window.getSelection()||'').trim()||savedSelection;
    const selected=(raw.match(/[\p{L}\p{M}-]+/u)||[])[0]||'';
    if(!selected){setStatus('Selecione uma palavra na página e depois toque em Dicionário.');return;}
    window.open('https://dicionario.priberam.org/'+encodeURIComponent(selected),'_blank','noopener,noreferrer');
    setStatus('Abrindo o significado de "'+selected+'" em outra aba.');
  }
  function structure(){
    const area=document.getElementById('gp-a11y-outline');
    area.replaceChildren();
    if(!state.structure){area.hidden=true;return;}
    const heads=[...document.querySelectorAll('#quarto-content main :is(h1,h2,h3,h4,h5,h6)')].filter(h=>h.textContent.trim()).slice(0,75);
    if(!heads.length){area.textContent='Esta página não tem títulos identificados.';area.hidden=false;return;}
    const title=document.createElement('strong');title.textContent='Títulos da página';area.append(title);
    for(const h of heads){const a=document.createElement('button');a.type='button';a.textContent=h.textContent.trim();a.style.paddingLeft=Math.min(40,(Number(h.tagName.slice(1))-1)*8)+'px';a.addEventListener('click',()=>{toggle(false,false);h.scrollIntoView({behavior:'auto',block:'start'});h.setAttribute('tabindex','-1');h.focus({preventScroll:true});});area.append(a);}
    area.hidden=false;
  }
  grid.addEventListener('click',e=>{
    const b=e.target.closest('[data-gp-tool]');if(!b)return;
    const k=b.dataset.gpTool;
    if(k==='reader'){speak();return;}
    if(k==='dictionary'){dictionary();return;}
    if(k==='increase'){
      state.size=(state.size+1)%5;
      setStatus(state.size?'Texto ampliado: nível '+state.size+' de 4.':'Texto em tamanho padrão.');
    }else if(k==='align'){
      state.align=(state.align+1)%5;
      setStatus('Alinhamento: '+(['original','à esquerda','centralizado','à direita','justificado'][state.align])+'.');
    }else if(k in state){
      state[k]=!state[k];
      if(k==='contrast'&&state.contrast)state.smart=false;
      if(k==='smart'&&state.smart)state.contrast=false;
      if(k==='largeCursor'&&matchMedia('(pointer:coarse)').matches)setStatus('Cursor ampliado funciona ao utilizar mouse ou trackpad.');
      else setStatus(b.innerText.trim()+': '+(state[k]?'ativado':'desativado')+'.');
    }
    document.getElementById('gp-a11y-profile').value='';
    apply();if(k==='structure')structure();
  });
  document.getElementById('gp-a11y-reset').addEventListener('click',()=>{state={...defaults};activeSpeech++;stopSpeech();speaking=false;document.getElementById('gp-a11y-profile').value='';apply();structure();setStatus('Configurações restauradas.');});
  document.querySelectorAll('#gp-a11y-lang button').forEach(b=>b.addEventListener('click',()=>{
    const lang=b.dataset.lang;
    if(typeof window.traduzirPagina==='function')window.traduzirPagina(lang);
    else setStatus('Use o seletor de idiomas no cabeçalho.');
  }));
  document.getElementById('gp-a11y-profile').addEventListener('change',e=>{
    const p=e.target.value;state={...defaults};activeSpeech++;stopSpeech();speaking=false;
    if(p==='vision'){state.size=2;state.contrast=true;state.links=true;}
    if(p==='reading'){state.size=1;state.spacing=true;state.lineHeight=true;state.dyslexia=true;}
    if(p==='motion'){state.motion=true;}
    if(p==='focus'){state.images=true;state.links=true;}
    apply();structure();setStatus('Perfil de acessibilidade aplicado.');
  });
  apply();if(state.structure)structure();
  // Reaplicar ampliação a conteúdo criado após o carregamento (galerias, traduções).
  let scheduled=false;
  const observer=new MutationObserver(records=>{
    if(!state.size||scheduled||!records.some(r=>r.addedNodes.length))return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;apply();});
  });
  observer.observe(document.querySelector('#quarto-content')||document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
