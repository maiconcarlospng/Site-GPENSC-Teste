/* GPENSC — visualizador fractal original com geometria recursiva em espiral.
   Dados preservados do Quarto/CMS; sem dependências do código OneZoom. */
(()=>{'use strict';
const root=document.getElementById('gp49');if(!root)return;
const map=root.querySelector('#gp49-map'),rows=[...root.querySelectorAll('.gp49-line')];if(!map||!rows.length)return;
const names=rows.map(r=>r.querySelector('.gp49-line-name')?.textContent.trim()||'Registro');
const NS='http://www.w3.org/2000/svg',W=1200,H=900;
const svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 1200 900');svg.setAttribute('role','group');svg.setAttribute('aria-label','Árvore fractal interativa do conhecimento GPENSC');svg.style.cssText='width:100%;height:100%;display:block;touch-action:none;background:#fbfcf8';map.replaceChildren(svg);
const el=(tag,attrs={},parent=svg)=>{const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);parent.appendChild(e);return e;};
const limbs=el('g'),nodes=el('g');
const reveal=[];let zoomAnimation=0;
const tips=[];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const camera={x:0,y:0,w:W,h:H};
function paint(){svg.setAttribute('viewBox',[camera.x,camera.y,camera.w,camera.h].join(' '));const visibleWidth=camera.w;for(const item of reveal){const pixelSize=item.size*map.clientWidth/Math.max(1,visibleWidth);const opacity=clamp((pixelSize-item.threshold)/Math.max(1,item.threshold*.75),0,1);item.element.style.opacity=opacity;item.element.style.pointerEvents=opacity>.35?'auto':'none';}}
function animate(to){const animation=++zoomAnimation;const start={...camera},t0=performance.now(),duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:420;function frame(now){if(animation!==zoomAnimation)return;const t=duration?clamp((now-t0)/duration,0,1):1,k=t*t*(3-2*t);for(const key of ['x','y','w','h'])camera[key]=start[key]+(to[key]-start[key])*k;paint();if(t<1)requestAnimationFrame(frame);}requestAnimationFrame(frame);}
function focus(p,w=350){const h=w*map.clientHeight/Math.max(1,map.clientWidth);animate({x:p.x-w/2,y:p.y-h/2,w,h});}
function show(i){const row=rows[i],panel=root.querySelector('#gp49-detail');if(!panel)return;panel.replaceChildren();const close=document.createElement('button');close.textContent='Fechar';close.className='gp49-close';close.onclick=()=>panel.hidden=true;const h=document.createElement('h2');h.textContent=names[i];const body=row.querySelector('.gp49-line-body')?.cloneNode(true);panel.append(close,h);if(body)panel.append(body);panel.hidden=false;rows.forEach((r,j)=>r.querySelector('button')?.setAttribute('aria-pressed',String(i===j)));}
// World-space form of OneZoom's spiral projection (OZtree, spiral_pre_calc.js).
const point = (p, angle, distance) => ({
  x: p.x + distance * Math.cos(angle),
  y: p.y + distance * Math.sin(angle)
});
function branch(start, first, second, end, scale) {
  const coords = p => p.x + ' ' + p.y;
  el('path', {d: 'M' + coords(start) + ' C' + [first, second, end].map(coords).join(' '),
    fill:'none', stroke:'#75634e', 'stroke-width':scale*.55, 'stroke-linecap':'round'}, limbs);
}
function leaf(origin, angle, scale, index) {
  const p = point(origin, angle, scale*1.9), r = scale*1.28;
  tips[index] = p;
  const g = el('g',{transform:'translate('+p.x+' '+p.y+') scale('+r+')',
    role:'button',tabindex:0,'aria-label':names[index]},nodes);
  el('path',{d:'M -1 0 C -.85 -1 .45 -1.35 1.16 0 C .45 1.35 -.85 1 -1 0 Z',
    transform:'rotate('+(angle*180/Math.PI)+')',fill:rows[index].dataset.branchType==='projeto'?'#5d803e':'#416d43'},g);
  const words=names[index].split(/\s+/), lines=[''];
  const limit=Math.max(11,Math.ceil(Math.sqrt(names[index].length*2)));
  for(const word of words){
    const last=lines.length-1;
    if(lines[last] && lines[last].length+1+word.length>limit) lines.push(word);
    else lines[last]+=(lines[last]?' ':'')+word;
  }
  const font=Math.min(.33,1.98/Math.max(...lines.map(line=>line.length)),1.1/lines.length);
  const title=el('text',{'text-anchor':'middle','font-size':font, fill:'white','pointer-events':'none'},g);
  lines.forEach((line,i)=>el('tspan',{x:0,y:(i-(lines.length-1)/2+.3)*font*1.12},title).textContent=line);
  el('title',{},g).textContent=names[index];
  reveal.push({element:g,size:r*2,threshold:rows[index].dataset.branchType==='projeto'?92:38});
  const select=()=>{show(index);focus(p,Math.max(40,r*5));};
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
 const n=Math.min(unique.length,24),radius=Math.max(4,scale*.27);
 unique.slice(0,n).forEach((item,j)=>{
  const a=angle+(j-(n-1)/2)*Math.min(.48,2.7/Math.max(n,1));
  const d=scale*(1.8+.24*(j%3));
  const p=point(origin,a,d),tone=item.tipo==='pessoa'?'#d9731f':item.tipo==='defesa'?'#d43a2f':'#5f9a3e';
  const g=el('g',{role:'button',tabindex:0,'aria-label':item.tipo+': '+item.nome},nodes);
  el('circle',{cx:p.x,cy:p.y,r:radius,fill:tone,stroke:'#fffdf5','stroke-width':Math.max(1,radius*.16)},g);
  el('title',{},g).textContent=item.nome;
  reveal.push({element:g,size:radius*2,threshold:15});
  const select=()=>{show(index);focus(p,Math.max(35,scale*3));};
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
   growTree(item.children,base,angle+.34,scale*.36);
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
branch(origin,point(origin,heading,.05*scale),point(origin,heading,.95*scale),point(origin,heading,scale),scale);
growTree(forest,origin,heading,scale);
// Identidade do grupo acompanha a orientação natural do tronco.
const trunkLabel=el('text',{'x':scale*.48*Math.cos(heading)-15*Math.sin(heading),'y':scale*.48*Math.sin(heading)+15*Math.cos(heading),'transform':'rotate('+(heading*180/Math.PI)+' '+(scale*.48*Math.cos(heading))+' '+(scale*.48*Math.sin(heading))+')','text-anchor':'middle','font-size':'26','font-weight':'750','letter-spacing':'2','fill':'#fff8e8','stroke':'#463b2e','stroke-width':'3','paint-order':'stroke','pointer-events':'none'},nodes);
trunkLabel.textContent='GPENSC';
function fit(){
  const boxes=[limbs,nodes].map(layer=>layer.getBBox());
  const x=Math.min(...boxes.map(b=>b.x))-65,y=Math.min(...boxes.map(b=>b.y))-35;
  const width=Math.max(...boxes.map(b=>b.x+b.width))-x+35;
  const height=Math.max(...boxes.map(b=>b.y+b.height))-y+65;
  const aspect=map.clientWidth/Math.max(1,map.clientHeight);
  camera.w=Math.max(width,height*aspect);camera.h=camera.w/aspect;
  camera.x=x;camera.y=y+height-camera.h;paint();
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
const search=root.querySelector('#gp49-search');if(search){const floating=document.createElement('input');floating.type='search';floating.className='gp49-search-float';floating.placeholder='Buscar linha ou projeto…';floating.setAttribute('aria-label','Buscar na árvore');map.parentElement.appendChild(floating);floating.addEventListener('input',()=>{search.value=floating.value;const q=floating.value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const i=names.findIndex(n=>n.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(q));if(q&&i>=0&&tips[i])focus(tips[i],270);});}
rows.forEach((r,i)=>r.querySelector('button')?.addEventListener('click',()=>show(i)));
map.addEventListener('keydown',e=>{if(e.target!==map)return;if(e.key==='+'||e.key==='=')zoom(.75);else if(e.key==='-')zoom(1.3);else if(e.key==='Home')fit();else return;e.preventDefault();});
window.addEventListener('resize',()=>{const center={x:camera.x+camera.w/2,y:camera.y+camera.h/2};const h=camera.w*map.clientHeight/Math.max(1,map.clientWidth);camera.x=center.x-camera.w/2;camera.y=center.y-h/2;camera.h=h;paint();},{passive:true});requestAnimationFrame(()=>{fit();const target={x:scale*.8*Math.cos(heading),y:scale*.8*Math.sin(heading)};const width=Math.min(camera.w*.24,420);const h=width*map.clientHeight/Math.max(1,map.clientWidth);camera.w=width;camera.h=h;camera.x=target.x-width*.38;camera.y=target.y-h*.54;paint();});root.classList.add('gp49-ready');
})();