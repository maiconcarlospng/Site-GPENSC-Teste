/* GPENSC — visualizador fractal original com geometria recursiva em espiral.
   Dados preservados do Quarto/CMS; sem dependências do código OneZoom. */
(()=>{'use strict';
const root=document.getElementById('gp49');if(!root)return;
const map=root.querySelector('#gp49-map'),rows=[...root.querySelectorAll('.gp49-line')];if(!map||!rows.length)return;
const names=rows.map(r=>r.querySelector('.gp49-line-name')?.textContent.trim()||'Registro');
const NS='http://www.w3.org/2000/svg',W=1200,H=900;
const svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 1200 900');svg.setAttribute('role','group');svg.setAttribute('aria-label','Árvore fractal interativa do conhecimento GPENSC');svg.style.cssText='width:100%;height:100%;display:block;touch-action:none;background:#fbfcf8';map.replaceChildren(svg);
const el=(tag,attrs={},parent=svg)=>{const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);parent.appendChild(e);return e;};
// Materiais SVG leves: sem imagens raster, filtros pesados ou alterações na geometria.
const defs=el('defs');
const linear=(id,stops,attrs={})=>{
 const gradient=el('linearGradient',{id,x1:'0%',y1:'0%',x2:'100%',y2:'70%',...attrs},defs);
 stops.forEach(([offset,color])=>el('stop',{offset,'stop-color':color},gradient));
};
// Um único campo de cor atravessa o tronco e os galhos, evitando "pedaços" de textura.
linear('gp49-bark-tone',[['0%','#78624e'],['48%','#806b55'],['100%','#715e4a']],
 {gradientUnits:'userSpaceOnUse',x1:'-500',y1:'-650',x2:'1100',y2:'700'});
linear('gp49-leaf-tone',[['0%','#5a885b'],['53%','#467449'],['100%','#3d6743']]);
linear('gp49-project-tone',[['0%','#829b68'],['53%','#708a55'],['100%','#597649']]);
for(const [id,bright,dark] of [
 ['gp49-fruit-person','#efb46c','#bd641f'],
 ['gp49-fruit-defense','#ed8c77','#b93832'],
 ['gp49-fruit-work','#a6cb74','#4e803f']
]){
 const gradient=el('radialGradient',{id,cx:'32%',cy:'28%',r:'78%'},defs);
 el('stop',{offset:'0%','stop-color':bright},gradient);
 el('stop',{offset:'100%','stop-color':dark},gradient);
}
// Sem padrões repetidos sobrepostos: o acabamento é parte do preenchimento SVG.
const limbs=el('g'),nodes=el('g');
let zoomAnimation=0;
const tips=[];
// Legenda contextual no desktop: revela o nome completo sem recortar as folhas.
const hoverName=document.createElement('div');
hoverName.className='gp49-hover-name';
hoverName.hidden=true;
hoverName.setAttribute('aria-hidden','true');
map.parentElement.appendChild(hoverName);
const canHover=matchMedia('(hover:hover) and (pointer:fine)');
function hideLeafHover(){hoverName.hidden=true;}
function placeLeafHover(event){
 const rect=map.parentElement.getBoundingClientRect();
 const x=event.clientX-rect.left,y=event.clientY-rect.top;
 const width=hoverName.offsetWidth||240;
 hoverName.style.left=Math.max(12,Math.min(x+17,rect.width-width-12))+'px';
 hoverName.style.top=Math.max(14,Math.min(y-51,rect.height-68))+'px';
}
function attachLeafHover(group,index){
 if(!canHover.matches)return;
 group.addEventListener('pointerenter',event=>{
   if(event.pointerType&&event.pointerType!=='mouse')return;
   hoverName.textContent=names[index];
   hoverName.hidden=false;placeLeafHover(event);
 });
 group.addEventListener('pointermove',event=>{
   if(!hoverName.hidden)placeLeafHover(event);
 });
 group.addEventListener('pointerleave',hideLeafHover);
 group.addEventListener('focus',()=>{
   hoverName.textContent=names[index];
   hoverName.hidden=false;
   const rect=group.getBoundingClientRect();
   placeLeafHover({clientX:rect.left+rect.width/2,clientY:rect.top});
 });
 group.addEventListener('blur',hideLeafHover);
}
// Visibilidade integral desde a primeira renderização, sem alterar nenhum desenho ou ramo.
const leafVisuals=new Map();
const openedLines=new Set(),openedFruits=new Set();
let trunkOpen=true;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const camera={x:0,y:0,w:W,h:H};
// Tudo permanece desenhado e interativo em qualquer nível de zoom. O zoom altera apenas a câmera.
function paint(){svg.setAttribute('viewBox',[camera.x,camera.y,camera.w,camera.h].join(' '));}
function animate(to){const animation=++zoomAnimation;const start={...camera},t0=performance.now(),duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:420;function frame(now){if(animation!==zoomAnimation)return;const t=duration?clamp((now-t0)/duration,0,1):1,k=t*t*(3-2*t);for(const key of ['x','y','w','h'])camera[key]=start[key]+(to[key]-start[key])*k;paint();if(t<1)requestAnimationFrame(frame);}requestAnimationFrame(frame);}
function focus(p,w=350){const h=w*map.clientHeight/Math.max(1,map.clientWidth);const panel=root.querySelector('#gp49-detail');const mobile=map.clientWidth<768;const obscured=panel&&!panel.hidden?Math.min(panel.offsetHeight/map.clientHeight,.65):0;const visibleCenterY=mobile?(1-obscured)*.5:.5;const visibleCenterX=mobile?.5:panel&&!panel.hidden?.37:.5;animate({x:p.x-w*visibleCenterX,y:p.y-h*visibleCenterY,w,h});}
function show(i, options={}){
 const row=rows[i],panel=root.querySelector('#gp49-detail');if(!panel)return;
 hideLeafHover();
 const header=document.createElement('div');header.className='gp49-detail-header';
 const heading=document.createElement('div');heading.className='gp49-detail-heading';
 const kind=document.createElement('p');kind.className='gp49-detail-kind';
 kind.textContent=options.kind||(row.dataset.branchType==='projeto'?'Projeto':'Linha de pesquisa');
 const title=document.createElement('h2');title.textContent=options.title||names[i];
 heading.append(kind,title);
 const close=document.createElement('button');
 close.type='button';close.textContent='Fechar';close.className='gp49-close';
 close.setAttribute('aria-label','Fechar detalhes da árvore');
 close.onclick=()=>{panel.hidden=true;row.querySelector('button')?.focus({preventScroll:true});};
 header.append(heading,close);
 const content=document.createElement('div');content.className='gp49-detail-content';
 const body=row.querySelector('.gp49-line-body')?.cloneNode(true);
 if(body)content.append(body);
 panel.replaceChildren(header,content);
 panel.hidden=false;
 panel.scrollTop=0;
 rows.forEach((r,j)=>r.querySelector('button')?.setAttribute('aria-pressed',String(i===j)));
}
// World-space form of OneZoom's spiral projection (OZtree, spiral_pre_calc.js).
const point = (p, angle, distance) => ({
  x: p.x + distance * Math.cos(angle),
  y: p.y + distance * Math.sin(angle)
});
function branch(start, first, second, end, scale) {
  const coords = p => p.x + ' ' + p.y;
  const d='M' + coords(start) + ' C' + [first, second, end].map(coords).join(' ');
  const base=el('path',{d,fill:'none',stroke:'url(#gp49-bark-tone)',
    'stroke-width':scale*.55,'stroke-linecap':'round'},limbs);
  // Uma única pincelada por ramo: sem uma segunda camada que pareça colada.
  return base;
}
function leaf(origin, angle, scale, index) {
  const p = point(origin, angle, scale*1.9), r = scale*1.28;
  tips[index] = p;
  const g = el('g',{transform:'translate('+p.x+' '+p.y+') scale('+r+')',
    role:'button',tabindex:0,'aria-label':names[index], 'aria-expanded':'false'},nodes);
  g.dataset.gpNodeIndex=String(index);
  g.style.cursor='pointer';
  leafVisuals.set(index,g);
  const rotation='rotate('+(angle*180/Math.PI)+')';
  el('path',{d:'M -1 0 C -.85 -1 .45 -1.35 1.16 0 C .45 1.35 -.85 1 -1 0 Z',
    transform:rotation,fill:rows[index].dataset.branchType==='projeto'?
      'url(#gp49-project-tone)':'url(#gp49-leaf-tone)'},g);
  // Apenas a nervura central, fundida à cor da folha.
  el('path',{d:'M -.62 0 Q 0 -.05 .72 0',transform:rotation,fill:'none',
    stroke:'#dce9d3','stroke-width':'.019','stroke-linecap':'round',
    opacity:'.14','pointer-events':'none','aria-hidden':'true'},g);
  // Ponto integrado à extremidade da folha, não uma bolinha solta no mapa.
  const marker=el('g',{transform:rotation,'pointer-events':'none','aria-hidden':'true'},g);
  el('circle',{cx:'.74',cy:'-.17',r:'.065',fill:'#e5ab65',
    stroke:'#e6f1dc','stroke-width':'.018',class:'gp49-interaction-dot'},marker);
  // Texto sempre horizontal, calculado conforme a inclinação e a área da folha.
  const normalized=((angle+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
  const span=1.6/Math.sqrt(Math.cos(normalized)**2+(Math.sin(normalized)/.66)**2);
  const maxChars=Math.max(8,Math.min(19,Math.floor(span/.135)));
  const words=names[index].trim().split(/\s+/);
  const lines=[''];
  for(const word of words){
    const last=lines.length-1;
    if(lines[last] && lines[last].length+1+word.length>maxChars)lines.push(word);
    else lines[last]+=(lines[last]?' ':'')+word;
  }
  if(lines.length>4){
    const remaining=lines.slice(3).join(' ');
    lines.length=3;
    lines.push(remaining.length>maxChars
      ?remaining.slice(0,Math.max(3,maxChars-1)).trimEnd()+'…':remaining);
  }
  const longest=Math.max(...lines.map(line=>line.length),1);
  const font=Math.min(.32,span/(longest*.57+1),.91/(lines.length*1.19));
  const title=el('text',{'text-anchor':'middle','font-size':font,
    'font-weight':'720','font-family':'system-ui,sans-serif',
    fill:'#fffef7','pointer-events':'none','dominant-baseline':'middle',
    'paint-order':'stroke',stroke:'#244b31','stroke-opacity':'.28',
    'stroke-width':'.013',class:'gp49-leaf-text'},g);
  lines.forEach((line,i)=>el('tspan',{x:0,
    y:(i-(lines.length-1)/2)*font*1.18,'dominant-baseline':'middle'},title).textContent=line);
  el('title',{},g).textContent=names[index]+' — selecionar para consultar detalhes';
  attachLeafHover(g,index);
  const select=()=>openNode(index);
  g.addEventListener('click',select);
  g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select();}});
}
// Hierarquia editorial: linhas -> projetos associados -> frutos cadastrados.
// A geometria espiral, os controles e a apresentação das folhas são preservados.
const lines=rows.map((r,i)=>({r,i})).filter(o=>o.r.dataset.branchType==='linha');
const projects=rows.map((r,i)=>({r,i})).filter(o=>o.r.dataset.branchType==='projeto');
const linked=new Set();
const forest=lines.map(o=>{
 const id=o.r.dataset.lineId||o.r.dataset.branchId;
 const children=projects.filter(p=>(p.r.dataset.lineId||'')===id);
 children.forEach(p=>linked.add(p.i));
 return {index:o.i,children:children.map(p=>({index:p.i,children:[]}))};
});
projects.filter(p=>!linked.has(p.i)).forEach(p=>forest.push({index:p.i,children:[]}));
function fruits(index,origin,angle,scale){
 const raw=rows[index].dataset.fruits;
 if(!raw)return;
 let items;try{items=JSON.parse(raw);}catch{return;}
 if(!Array.isArray(items)||!items.length)return;
 // Pequenos frutos clicáveis, distribuídos ao redor da extremidade do ramo.
 const unique=[...new Map(items.filter(x=>x&&x.nome).map(x=>[(x.tipo||'')+'|'+x.nome,x])).values()];
 const n=Math.min(unique.length,48),radius=Math.max(2.5,scale*.22);
 unique.slice(0,n).forEach((item,j)=>{
  const a=angle+(j-(n-1)/2)*Math.min(.48,2.7/Math.max(n,1));
  const d=scale*(1.8+.24*(j%3));
  const p=point(origin,a,d),tone=item.tipo==='pessoa'?'gp49-fruit-person':
    item.tipo==='defesa'?'gp49-fruit-defense':'gp49-fruit-work';
  const fruitStem=branch(point(origin,angle,scale*.25),point(origin,angle,scale*.52),point(origin,a,d*.78),p,Math.max(1,scale*.065));
  fruitStem.dataset.gpFruitOwner=String(index);
  const g=el('g',{role:'button',tabindex:0,'aria-label':item.tipo+': '+item.nome},nodes);
  g.dataset.gpFruitOwner=String(index);
  g.style.cursor='pointer';
  el('circle',{cx:p.x,cy:p.y,r:radius,fill:'url(#'+tone+')',
    stroke:'#fffdf5','stroke-width':Math.max(1,radius*.16)},g);
  // O degradê interno já fornece o volume; sem reflexo sobreposto.
  el('title',{},g).textContent=item.nome;
  const select=()=>show(index,{title:item.nome,kind:item.tipo==='pessoa'?'Integrante':item.tipo==='defesa'?'Tese, dissertação ou defesa':'Produção científica'});
  g.addEventListener('click',select);
  g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select();}});
 });
}
function growTree(items,origin,angle,scale){
 if(!items.length)return;
 if(items.length===1){
  const item=items[0];
  leaf(origin,angle,scale,item.index);
  const tip=point(origin,angle,scale*1.9);
  fruits(item.index,tip,angle,scale*.6);
  if(item.children.length){
   const base=point(origin,angle,scale*1.45);
   const childAngle=angle+.34,childScale=scale*.36;
   const beforeChildPaths=limbs.children.length;
   branch(point(origin,angle,scale*.95),point(origin,angle,scale*1.18),
     point(base,childAngle,childScale*.35),point(base,childAngle,childScale),childScale);
   growTree(item.children,base,childAngle,childScale);
   // Os caminhos existentes para os projetos mantêm os vínculos com a linha.
   [...limbs.children].slice(beforeChildPaths).forEach(path=>{
     if(!path.dataset.gpFruitOwner)path.dataset.gpProjectParent=String(item.index);
   });
  }
  return;
 }
 const larger=Math.ceil(items.length/2);
 for(const main of [true,false]){
  const ratio=main?1/1.3:1/2.25;
  const nextAngle=angle+Math.PI*(main?.22:-.46);
  const nextScale=scale*ratio;
  const base=point(point(origin,angle,1.3*scale),angle+Math.PI/2,(main?1:-1)*.275*(scale-nextScale));
  const start=point(base,angle,-.3*scale);
  branch(start,main?start:point(base,angle,.1*scale),
    main?point(base,angle,.15*scale):point(base,nextAngle,.9*nextScale),
    point(base,nextAngle,nextScale),nextScale);
  growTree(main?items.slice(0,larger):items.slice(larger),base,nextAngle,nextScale);
 }
}
const origin={x:0,y:0},heading=-Math.PI*.38,scale=230;
const trunkPath=branch(origin,point(origin,heading,.05*scale),point(origin,heading,.95*scale),point(origin,heading,scale),scale);
trunkPath.setAttribute('role','button');
trunkPath.setAttribute('tabindex','0');
trunkPath.setAttribute('aria-label','GPENSC: reenquadrar a árvore inteira');
trunkPath.setAttribute('aria-expanded','false');
trunkPath.style.cursor='pointer';
growTree(forest,origin,heading,scale);
// Linhas, projetos e frutos começam abertos: nada é revelado por etapas.
for(const {i} of lines)openedLines.add(i);
for(let i=0;i<rows.length;i++)openedFruits.add(i);
// Identidade do grupo acompanha a orientação natural do tronco.
const trunkLabel=el('text',{'x':scale*.48*Math.cos(heading)-15*Math.sin(heading),'y':scale*.48*Math.sin(heading)+15*Math.cos(heading),'transform':'rotate('+(heading*180/Math.PI)+' '+(scale*.48*Math.cos(heading))+' '+(scale*.48*Math.sin(heading))+')','text-anchor':'middle','font-size':'26','font-weight':'750','letter-spacing':'2','fill':'#fff8e8','stroke':'#463b2e','stroke-width':'3','paint-order':'stroke','pointer-events':'auto','role':'button','tabindex':'0','aria-label':'GPENSC: abrir ou fechar os galhos','aria-expanded':'false'},nodes);
trunkLabel.textContent='GPENSC';
trunkLabel.setAttribute('aria-label','GPENSC: reenquadrar a árvore inteira');
trunkLabel.style.cursor='pointer';

// Os mesmos caminhos, folhas e frutos são reutilizados; apenas a visibilidade muda.
// Não se altera growTree, a posição dos nós, a espessura dos galhos ou a copa.
const projectParent=new Map();
for(const part of forest)for(const child of part.children)projectParent.set(child.index,part.index);
const instruction=document.createElement('div');
instruction.className='gp49-step-hint';
instruction.setAttribute('role','status');
instruction.textContent='Explore os galhos e frutos. Selecione um elemento para consultar seus vínculos.';
map.parentElement.append(instruction);
function branchVisible(index){
  return trunkOpen&&(!projectParent.has(index)||openedLines.has(projectParent.get(index)));
}
function refreshVisibility(){
  for(const path of limbs.children){
    let visible=path===trunkPath;
    if(!visible&&trunkOpen){
      const owner=path.dataset.gpFruitOwner;
      const parent=path.dataset.gpProjectParent;
      visible=owner!==undefined?(openedFruits.has(Number(owner))&&branchVisible(Number(owner))):
        parent!==undefined?openedLines.has(Number(parent)):true;
    }
    path.style.visibility=visible?'visible':'hidden';
    path.style.pointerEvents=path.dataset.gpDecoration==='true'?'none':(visible?'auto':'none');
  }
  for(const child of nodes.children){
    let visible=child===trunkLabel;
    if(!visible&&trunkOpen){
      const owner=child.dataset.gpFruitOwner;
      const branchIndex=child.dataset.gpNodeIndex;
      visible=owner!==undefined?(openedFruits.has(Number(owner))&&branchVisible(Number(owner))):
        branchIndex!==undefined?branchVisible(Number(branchIndex)):true;
    }
    child.style.visibility=visible?'visible':'hidden';
    child.style.pointerEvents=visible?'auto':'none';
  }
  const expanded=String(trunkOpen);
  trunkPath.setAttribute('aria-expanded',expanded);
  trunkLabel.setAttribute('aria-expanded',expanded);
  for(const [i,g] of leafVisuals){
    g.setAttribute('aria-expanded',String(openedFruits.has(i)||openedLines.has(i)));
  }
  instruction.textContent='Selecione uma linha, projeto ou fruto para consultar integrantes e produções vinculados.';
}
function openTrunk(){
  // O tronco reenquadra a visualização sem esconder partes da árvore.
  fit();
  refreshVisibility();
}
function revealBranch(index){
  trunkOpen=true;
  const parent=projectParent.get(index);
  if(parent!==undefined)openedLines.add(parent);
  refreshVisibility();
}
function openNode(index){
  // A seleção abre detalhes, nunca recolhe ramos já desenhados.
  revealBranch(index);
  show(index);
}
for(const target of [trunkPath,trunkLabel]){
  target.addEventListener('click',openTrunk);
  target.addEventListener('keydown',event=>{
    if(event.key==='Enter'||event.key===' '){event.preventDefault();openTrunk();}
  });
}
function fit(){
 const boxes=[limbs,nodes].map(layer=>layer.getBBox());
 const minX=Math.min(...boxes.map(b=>b.x)),minY=Math.min(...boxes.map(b=>b.y));
 const maxX=Math.max(...boxes.map(b=>b.x+b.width)),maxY=Math.max(...boxes.map(b=>b.y+b.height));
 const aspect=map.clientWidth/Math.max(1,map.clientHeight);
 const width=(maxX-minX)*1.12,height=(maxY-minY)*1.12;
 camera.w=Math.max(width,height*aspect,120);
 camera.h=camera.w/aspect;
 camera.x=(minX+maxX-camera.w)/2;
 camera.y=(minY+maxY-camera.h)/2;
 paint();
}
function zoom(f,pt){const w=clamp(camera.w*f,90,3500),scale=w/camera.w,h=camera.h*scale;const a=pt||{x:camera.x+camera.w/2,y:camera.y+camera.h/2};animate({x:a.x-(a.x-camera.x)*scale,y:a.y-(a.y-camera.y)*scale,w,h});}
const world=(x,y)=>{const p=svg.createSVGPoint();p.x=x;p.y=y;return p.matrixTransform(svg.getScreenCTM().inverse());};
svg.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(clamp(e.deltaY,-180,180)*.0018),world(e.clientX,e.clientY));},{passive:false});
const pointers=new Map();let gesture=null;
svg.addEventListener('pointerdown',e=>{if(e.target.closest('[role=button]'))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});svg.setPointerCapture(e.pointerId);gesture={camera:{...camera},points:[...pointers.values()]};});
svg.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const ps=[...pointers.values()];if(ps.length===1&&gesture){zoomAnimation++;const s=camera.w/map.clientWidth;camera.x=gesture.camera.x-(ps[0].x-gesture.points[0].x)*s;camera.y=gesture.camera.y-(ps[0].y-gesture.points[0].y)*s;paint();}else if(ps.length===2){const d=Math.hypot(ps[0].x-ps[1].x,ps[0].y-ps[1].y),old=gesture.points.length===2?Math.hypot(gesture.points[0].x-gesture.points[1].x,gesture.points[0].y-gesture.points[1].y):d;zoomAnimation++;const w=clamp(gesture.camera.w*old/d,90,3500),h=w*map.clientHeight/Math.max(1,map.clientWidth);camera.w=w;camera.h=h;camera.x=gesture.camera.x+(gesture.camera.w-w)/2;camera.y=gesture.camera.y+(gesture.camera.h-h)/2;paint();}});
for(const ev of ['pointerup','pointercancel','lostpointercapture'])svg.addEventListener(ev,e=>{pointers.delete(e.pointerId);gesture=null;});
root.querySelector('#gp49-home')?.addEventListener('click',fit);
root.querySelector('#gp49-in')?.addEventListener('click',()=>zoom(.72));
root.querySelector('#gp49-out')?.addEventListener('click',()=>zoom(1.38));
const search=root.querySelector('#gp49-search');if(search){const floating=document.createElement('input');floating.type='search';floating.className='gp49-search-float';floating.placeholder='Buscar linha ou projeto…';floating.setAttribute('aria-label','Buscar na árvore');map.parentElement.appendChild(floating);floating.addEventListener('input',()=>{search.value=floating.value;const q=floating.value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const i=names.findIndex(n=>n.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(q));if(q&&i>=0&&tips[i]){revealBranch(i);focus(tips[i],270);}});}
rows.forEach((r,i)=>r.querySelector('button')?.addEventListener('click',()=>openNode(i)));
map.addEventListener('keydown',e=>{if(e.target!==map)return;if(e.key==='+'||e.key==='=')zoom(.75);else if(e.key==='-')zoom(1.3);else if(e.key==='Home')fit();else return;e.preventDefault();});
function sizeViewport(){const header=document.querySelector('#quarto-header,header.navbar,nav.navbar');const top=Math.max(0,root.getBoundingClientRect().top);root.style.setProperty('--gp49-measured-top',top+'px');}sizeViewport();window.addEventListener('resize',sizeViewport,{passive:true});window.addEventListener('resize',()=>{const center={x:camera.x+camera.w/2,y:camera.y+camera.h/2};const h=camera.w*map.clientHeight/Math.max(1,map.clientWidth);camera.x=center.x-camera.w/2;camera.y=center.y-h/2;camera.h=h;paint();},{passive:true});function focusTrunk(){
 const aspect=map.clientWidth/Math.max(1,map.clientHeight);
 const w=map.clientWidth<768?Math.max(410,aspect*650):Math.max(620,aspect*500);
 const h=w/aspect;
 const center=point(origin,heading,scale*.48);
 camera.x=center.x-w*.5;camera.y=center.y-h*.5;camera.w=w;camera.h=h;
 paint();
}
// Inicialização integral num único quadro: os mesmos elementos já estão montados.
focusTrunk();refreshVisibility();root.classList.add('gp49-ready');
})();