/* GPENSC — visualizador fractal original com geometria recursiva em espiral.
   Dados preservados do Quarto/CMS; sem dependências do código OneZoom. */
(()=>{'use strict';
const root=document.getElementById('gp49');if(!root)return;
const map=root.querySelector('#gp49-map'),rows=[...root.querySelectorAll('.gp49-line')];if(!map||!rows.length)return;
const names=rows.map(r=>r.querySelector('.gp49-line-name')?.textContent.trim()||'Registro');
const NS='http://www.w3.org/2000/svg',W=1200,H=900;
const svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 1200 900');svg.setAttribute('role','img');svg.setAttribute('aria-label','Árvore fractal interativa do conhecimento GPENSC');svg.style.cssText='width:100%;height:100%;display:block;touch-action:none;background:#fbfcf8';map.replaceChildren(svg);
const el=(tag,attrs={},parent=svg)=>{const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);parent.appendChild(e);return e;};
const limbs=el('g'),nodes=el('g'),labels=el('g');
const tips=[],groups=[];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const camera={x:0,y:0,w:W,h:H};
function paint(){svg.setAttribute('viewBox',[camera.x,camera.y,camera.w,camera.h].join(' '));const detail=camera.w<670;labels.style.display=detail?'':'none';}
function animate(to){const start={...camera},t0=performance.now(),duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:420;function frame(now){const t=duration?clamp((now-t0)/duration,0,1):1,k=t*t*(3-2*t);for(const key of ['x','y','w','h'])camera[key]=start[key]+(to[key]-start[key])*k;paint();if(t<1)requestAnimationFrame(frame);}requestAnimationFrame(frame);}
function focus(p,w=350){const h=w*H/W;animate({x:p.x-w/2,y:p.y-h/2,w,h});}
function bezier(p,q,heading,endAngle,widthA,widthB,color){
 const dist=Math.hypot(q.x-p.x,q.y-p.y),t=dist*.48;
 const c1={x:p.x+Math.cos(heading)*t,y:p.y+Math.sin(heading)*t};
 const c2={x:q.x-Math.cos(endAngle)*t,y:q.y-Math.sin(endAngle)*t};
 const d='M'+p.x+' '+p.y+' C'+c1.x+' '+c1.y+' '+c2.x+' '+c2.y+' '+q.x+' '+q.y;
 el('path',{d,fill:'none',stroke:color,'stroke-width':widthA,'stroke-linecap':'round'},limbs);
 if(widthA>widthB*1.2)el('path',{d,fill:'none',stroke:'#788775','stroke-width':widthB,'stroke-linecap':'round'},limbs);
}
function label(p,text){const g=el('g',{transform:'translate('+p.x+' '+p.y+')'},labels);const t=el('text',{'text-anchor':'middle',y:35,fill:'#254c32','font-size':16,'font-weight':650,'font-family':'system-ui, sans-serif'},g);t.textContent=text.length>45?text.slice(0,43)+'…':text;return g;}
function show(i){const row=rows[i],panel=root.querySelector('#gp49-detail');if(!panel)return;panel.replaceChildren();const close=document.createElement('button');close.textContent='Fechar';close.className='gp49-close';close.onclick=()=>panel.hidden=true;const h=document.createElement('h2');h.textContent=names[i];const body=row.querySelector('.gp49-line-body')?.cloneNode(true);panel.append(close,h);if(body)panel.append(body);panel.hidden=false;rows.forEach((r,j)=>r.querySelector('button')?.setAttribute('aria-pressed',String(i===j)));}
function disc(p,r,text,click,color='#667e65'){const g=el('g',{role:'button',tabindex:'0','aria-label':text},nodes);el('circle',{cx:p.x,cy:p.y,r,fill:color,stroke:'#e0e7d8','stroke-width':Math.max(1,r*.09)},g);el('circle',{cx:p.x,cy:p.y,r:r*.68,fill:'none',stroke:'#c8d8c3','stroke-width':Math.max(.6,r*.055),opacity:.75},g);const hit=el('circle',{cx:p.x,cy:p.y,r:Math.max(18,r),fill:'transparent','pointer-events':'all'},g);g.addEventListener('click',e=>{e.stopPropagation();click();});g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();click();}});el('title',{},g).textContent=text;return g;}
function leaf(p,i,r){const color=rows[i].dataset.branchType==='projeto'?'#bc804b':'#638b64';disc(p,r,names[i],()=>{show(i);focus(p,260);},color);label(p,names[i]);tips[i]=p;}
function grow(start,count,p,angle,len,width,depth,turn){
 if(count===1){const q={x:p.x+Math.cos(angle)*len,y:p.y+Math.sin(angle)*len};bezier(p,q,angle,angle,width,Math.max(1.4,width*.28),'#687c6b');leaf(q,start,Math.max(7,width*.48));return;}
 const q={x:p.x+Math.cos(angle)*len,y:p.y+Math.sin(angle)*len};
 bezier(p,q,angle,angle+turn*.13,width,width*.72,'#687c6b');
 const left=Math.ceil(count/2),right=count-left;
 const spread=depth===0?.92:1.08;
 const a=angle-turn*spread*.55,b=angle+turn*spread*.91;
 const baseLen=len*(depth===0?.85:.76);
 const leftWidth=Math.max(2,width*.71*Math.sqrt(left/count)),rightWidth=Math.max(2,width*.71*Math.sqrt(right/count));
 const center={x:q.x,y:q.y};
 disc(center,Math.max(5,width*.31),depth===0?'GPENSC':'Explorar ramificação',()=>focus(center,clamp(580/(depth+1),155,530)));
 grow(start,left,center,a,baseLen,leftWidth,depth+1,-turn);
 grow(start+left,right,center,b,baseLen,rightWidth,depth+1,turn);
}
const origin={x:570,y:850},trunkEnd={x:565,y:610};
bezier(origin,trunkEnd,-Math.PI/2,-Math.PI/2,122,100,'#687c6b');
disc({x:565,y:700},65,'GPENSC',()=>focus({x:565,y:700},530));
const rootText=el('text',{x:565,y:710,'text-anchor':'middle',fill:'#fff','font-size':20,'font-weight':750,'font-family':'system-ui'},nodes);rootText.textContent='GPENSC';
grow(0,rows.length,trunkEnd,-Math.PI/2,165,92,0,1);
function fit(){const bounds=limbs.getBBox(),pad=110;const aspect=map.clientWidth/Math.max(1,map.clientHeight);let w=Math.max(bounds.width+pad*2,(bounds.height+pad*2)*aspect),h=w/aspect;camera.x=bounds.x+bounds.width/2-w/2;camera.y=bounds.y+bounds.height/2-h/2;camera.w=w;camera.h=h;paint();}
function zoom(f,pt){const w=clamp(camera.w*f,90,3500),scale=w/camera.w,h=camera.h*scale;const a=pt||{x:camera.x+camera.w/2,y:camera.y+camera.h/2};animate({x:a.x-(a.x-camera.x)*scale,y:a.y-(a.y-camera.y)*scale,w,h});}
const world=(x,y)=>{const p=svg.createSVGPoint();p.x=x;p.y=y;return p.matrixTransform(svg.getScreenCTM().inverse());};
svg.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(clamp(e.deltaY,-180,180)*.0018),world(e.clientX,e.clientY));},{passive:false});
const pointers=new Map();let gesture=null;
svg.addEventListener('pointerdown',e=>{if(e.target.closest('[role=button]'))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});svg.setPointerCapture(e.pointerId);gesture={camera:{...camera},points:[...pointers.values()]};});
svg.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const ps=[...pointers.values()];if(ps.length===1&&gesture){const s=camera.w/map.clientWidth;camera.x=gesture.camera.x-(ps[0].x-gesture.points[0].x)*s;camera.y=gesture.camera.y-(ps[0].y-gesture.points[0].y)*s;paint();}else if(ps.length===2){const d=Math.hypot(ps[0].x-ps[1].x,ps[0].y-ps[1].y),old=gesture.points.length===2?Math.hypot(gesture.points[0].x-gesture.points[1].x,gesture.points[0].y-gesture.points[1].y):d;const w=clamp(gesture.camera.w*old/d,90,3500),h=w*H/W;camera.w=w;camera.h=h;camera.x=gesture.camera.x+(gesture.camera.w-w)/2;camera.y=gesture.camera.y+(gesture.camera.h-h)/2;paint();}});
for(const ev of ['pointerup','pointercancel','lostpointercapture'])svg.addEventListener(ev,e=>{pointers.delete(e.pointerId);gesture=null;});
root.querySelector('#gp49-home')?.addEventListener('click',fit);
root.querySelector('#gp49-in')?.addEventListener('click',()=>zoom(.72));
root.querySelector('#gp49-out')?.addEventListener('click',()=>zoom(1.38));
const search=root.querySelector('#gp49-search');if(search){const floating=document.createElement('input');floating.type='search';floating.className='gp49-search-float';floating.placeholder='Buscar linha ou projeto…';floating.setAttribute('aria-label','Buscar na árvore');map.parentElement.appendChild(floating);floating.addEventListener('input',()=>{search.value=floating.value;const q=floating.value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const i=names.findIndex(n=>n.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(q));if(q&&i>=0&&tips[i])focus(tips[i],270);});}
rows.forEach((r,i)=>r.querySelector('button')?.addEventListener('click',()=>show(i)));
map.addEventListener('keydown',e=>{if(e.target!==map)return;if(e.key==='+'||e.key==='=')zoom(.75);else if(e.key==='-')zoom(1.3);else if(e.key==='Home')fit();else return;e.preventDefault();});
window.addEventListener('resize',fit,{passive:true});requestAnimationFrame(fit);root.classList.add('gp49-ready');
})();