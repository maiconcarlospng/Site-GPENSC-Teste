/* GPENSC — explorador orgânico de linhas de pesquisa.
   Navegação fractal original inspirada na experiência de exploração do OneZoom.
   Conteúdo: exclusivamente os registros renderizados por arvore.qmd. */
(() => {
  'use strict';
  const root = document.getElementById('gp49');
  if (!root) return;
  const map = root.querySelector('#gp49-map');
  const rows = Array.from(root.querySelectorAll('.gp49-line'));
  if (!map || !rows.length) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  const W = 1400, H = 920, total = rows.length;
  const nodeNames = rows.map(row => row.querySelector('.gp49-line-name').textContent.trim());
  const make = (tag, attrs, parent) => {
    const item = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([name, value]) => item.setAttribute(name, String(value)));
    if (parent) parent.appendChild(item);
    return item;
  };
  const svg = make('svg', {
    viewBox: '0 0 1400 920', preserveAspectRatio: 'xMidYMid meet',
    role: 'group', 'aria-label': 'Explorador da árvore do conhecimento do GPENSC'
  }, map);
  // No celular, a tela se comporta como um mapa explorável, sem miniaturizar a árvore.
  function adaptViewport() {
    svg.setAttribute('preserveAspectRatio',
      window.matchMedia('(max-width: 767px)').matches ? 'xMidYMid slice' : 'xMidYMid meet');
  }
  window.addEventListener('resize', adaptViewport, {passive:true});
  adaptViewport();
  const defs = make('defs', {}, svg);
  const bark = make('linearGradient', {id: 'gp49-bark', x1: '0', y1: '0', x2: '1', y2: '.28'}, defs);
  [['0','#4b4632'],['.30','#846647'],['.56','#a3835e'],['.78','#786347'],['1','#474c35']]
    .forEach(([offset,color]) => make('stop', {offset, 'stop-color': color}, bark));
  // Folhagem em camadas, sempre atrás do desenho dos galhos.
  const canopyLayer=make('g',{class:'gp49-canopy-layer','pointer-events':'none','aria-hidden':'true'},svg);
  const colors=['#679262','#93ae7c','#b8cda5','#47774d','#d3e2bd','#779c62'];
  for(let i=0;i<46;i++){
    const a=i*2.39996323,r=Math.sqrt((i+.5)/46);
    const x=700+Math.cos(a)*r*580,y=300+Math.sin(a)*r*235;
    make('ellipse',{cx:x.toFixed(2),cy:y.toFixed(2),rx:75+i%5*18,ry:51+i%4*14,
      transform:'rotate('+((i*41)%110-55)+' '+x+' '+y+')',
      fill:colors[i%colors.length],opacity:.17+(i%4)*.032},canopyLayer);
  }
  for(let i=0;i<160;i++){
    const a=i*2.39996323,r=Math.sqrt((i+.5)/160);
    const x=700+Math.cos(a)*r*577,y=300+Math.sin(a)*r*232;
    make('ellipse',{cx:x.toFixed(2),cy:y.toFixed(2),rx:8+i%5*2,ry:4+i%3*1.5,
      transform:'rotate('+((i*47)%170-85)+' '+x+' '+y+')',
      fill:colors[(i+2)%colors.length],opacity:.20+(i%3)*.055},canopyLayer);
  }
  const woodLayer = make('g', {class: 'gp49-wood-layer'}, svg);
  const foliageLayer = make('g', {class: 'gp49-foliage-layer', 'pointer-events': 'none'}, svg);
  const nodeLayer = make('g', {class: 'gp49-node-layer'}, svg);
  let camera = {x: 0, y: 0, w: W, h: H};
  let animation = 0;
  const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
  const ease = t => 1-Math.pow(1-t,3);
  function paint() {
    svg.setAttribute('viewBox', camera.x+' '+camera.y+' '+camera.w+' '+camera.h);
    svg.classList.toggle('gp49-detailed',camera.w < 740);
    svg.classList.toggle('gp49-very-detailed',camera.w < 430);
  }
  function move(target, duration=700) {
    cancelAnimationFrame(animation);
    const start={...camera}, began=performance.now();
    function frame(time) {
      const t = reduced ? 1 : clamp((time-began)/duration,0,1), k=ease(t);
      for (const prop of ['x','y','w','h']) camera[prop]=start[prop]+(target[prop]-start[prop])*k;
      paint();
      if (t<1) animation=requestAnimationFrame(frame);
    }
    animation=requestAnimationFrame(frame);
  }
  function point(start,count,depth) {
    const center=(start+count/2)/total;
    const heights=[725,540,366,205,89,25,15];
    return {x:100+1200*center, y:heights[Math.min(depth,heights.length-1)]};
  }
  function limb(from,to,begin,end) {
    const group=make('g',{class:'gp49-limb'},woodLayer);
    const dx=to.x-from.x,dy=to.y-from.y;
    const c1={x:from.x+dx*.22,y:from.y+dy*.47};
    const c2={x:to.x-dx*.31,y:to.y-dy*.27};
    const curve='M'+from.x+','+from.y+' C'+c1.x+','+c1.y+' '+c2.x+','+c2.y+' '+to.x+','+to.y;
    const guide=make('path',{d:curve,fill:'none'},group);
    const len=guide.getTotalLength(), left=[],right=[];
    function offset(t,sign,factor=1) {
      const at=guide.getPointAtLength(len*t);
      const before=guide.getPointAtLength(Math.max(0,len*t-1));
      const after=guide.getPointAtLength(Math.min(len,len*t+1));
      const vx=after.x-before.x,vy=after.y-before.y,dist=Math.hypot(vx,vy)||1;
      const width=(begin+(end-begin)*t)*factor*.5;
      return [at.x-vy/dist*width*sign,at.y+vx/dist*width*sign];
    }
    for (let i=0;i<=40;i++) left.push(offset(i/40,1));
    for (let i=40;i>=0;i--) right.push(offset(i/40,-1));
    const polygon='M'+left.concat(right).map(p=>p.map(x=>x.toFixed(2)).join(',')).join(' L')+' Z';
    make('path',{d:polygon,class:'gp49-wood-body',style:'fill:url(#gp49-bark)'},group);
    for (let k=-2;k<=2;k++) {
      const grain=[];
      for (let i=3;i<=36;i++) {
        const t=i/40,curvePos=offset(t,k/3+Math.sin(i*.46+k)*.045,.90);
        grain.push(curvePos.map(x=>x.toFixed(2)).join(','));
      }
      make('path',{d:'M'+grain.join(' L'),class:'gp49-wood-grain',
        style:'fill:none;stroke:'+(k%2?'#352d24':'#e3c29a')+';stroke-width:'+(begin>70?2:1)+';opacity:.29'},group);
    }
    guide.remove();
    if (!reduced) {
      try {group.animate([{opacity:0},{opacity:1}],{duration:420,easing:'ease-out'});} catch (_) {}
    }
    return group;
  }
  function leaves(p,index) {
    const group=make('g',{class:'gp49-leaf-spray',
      transform:'translate('+p.x+' '+p.y+')'},foliageLayer);
    const colors=['#547d48','#719759','#86a66a','#3f6e49','#adc18a'];
    for(let i=0;i<7;i++){
      const theta=(i*2.39996+index*.72),distance=24+8*(i%3);
      const x=Math.cos(theta)*distance,y=Math.sin(theta)*distance*.76;
      make('ellipse',{cx:x.toFixed(1),cy:y.toFixed(1),rx:12+(i%3)*3,ry:6+(i%2)*2,
        fill:colors[(i+index)%colors.length],opacity:'.88',
        transform:'rotate('+(theta*180/Math.PI+28).toFixed(2)+' '+x.toFixed(1)+' '+y.toFixed(1)+')'},group);
    }
    return group;
  }
  function focusOn(start,count,depth) {
    const center=point(start,count,depth);
    const width=clamp(210+count/total*1310,290,1400);
    const h=width*H/W;
    move({x:center.x-width/2,y:center.y-h*.48,w:width,h},850);
  }
  function branch(start,count,depth,parent,fromWidth,toWidth) {
    const p=point(start,count,depth);
    const stem=limb(parent,p,fromWidth,toWidth);
    const terminal=count===1;
    const spray=terminal?leaves(p,start):null;
    const bubble=make('g',{
      class:'gp49-node'+(terminal?' gp49-terminal':' gp49-fork'),
      transform:'translate('+p.x+' '+p.y+')',
      role:'button',tabindex:0,
      'aria-label':terminal?nodeNames[start]:'Explorar '+count+' linhas de pesquisa',
      ...(terminal?{'aria-pressed':'false'}:{'aria-expanded':'false'})
    },nodeLayer);
    const radius=terminal?17:clamp(12+count/total*9,13,21);
    make('circle',{r:radius+9,class:'gp49-node-halo'},bubble);
    make('circle',{r:radius,class:'gp49-node-disc'},bubble);
    make('circle',{r:radius*.72,class:'gp49-node-ring'},bubble);
    if (!terminal) {
      make('path',{d:'M-2,4 Q-14,-3 -9,-11 Q1,-9 2,2 Q10,-13 14,-8 Q16,2 4,6 Z',class:'gp49-bud',fill:'#d8e9b9'},bubble);
      make('title',{},bubble).textContent=count+' linhas de pesquisa — clique para expandir ou recolher';
    } else {
      make('circle',{r:5,class:'gp49-node-seed'},bubble);
      // Long labels appear only on demand, never together over the foliage.
      make('title',{},bubble).textContent=nodeNames[start];
    }
    let kids=[];
    function expand(auto=false) {
      if (terminal) {select(start);focusOn(start,1,depth);return;}
      if (kids.length) {
        kids.forEach(kid=>kid.destroy());
        kids=[];
        bubble.setAttribute('aria-expanded','false');
        bubble.classList.remove('is-open');
      } else {
        const left=Math.ceil(count/2),right=count-left;
        kids=[branch(start,left,depth+1,p,toWidth,Math.max(4,toWidth*.57))];
        if(right)kids.push(branch(start+left,right,depth+1,p,toWidth,Math.max(4,toWidth*.57)));
        bubble.setAttribute('aria-expanded','true');
        bubble.classList.add('is-open');
      }
      if(!auto)focusOn(start,count,depth);
    }
    function destroy() {
      kids.forEach(kid=>kid.destroy());
      stem.remove();
      bubble.remove();
      if(spray)spray.remove();
    }
    bubble.addEventListener('click',event=>{
      event.stopPropagation();
      expand();
    });
    bubble.addEventListener('keydown',event=>{
      if(event.key==='Enter'||event.key===' ') {
        event.preventDefault();event.stopPropagation();expand();
      }
    });
    // No panorama, as duas primeiras bifurcações já são visíveis.
    if (!terminal && depth<2) expand(true);
    return {destroy};
  }
  branch(0,total,0,{x:700,y:970},160,78);
  const trunkLabel=make('text',{x:700,y:860,'text-anchor':'middle',class:'gp49-trunk-label','aria-hidden':'true'},nodeLayer);
  trunkLabel.textContent='GPENSC';
  root.classList.add('gp49-ready');
  const panel=root.querySelector('#gp49-detail');
  let selected=-1;
  function select(i) {
    const row=rows[i];
    if (!row) return;
    selected=i;
    rows.forEach((r,k)=>r.querySelector('button').setAttribute('aria-pressed',String(k===i)));
    panel.replaceChildren();
    const close=document.createElement('button');
    close.type='button';close.className='gp49-close';close.textContent='Fechar';
    close.addEventListener('click',()=>{panel.hidden=true;row.querySelector('button').focus();});
    const heading=document.createElement('h2');
    heading.textContent=nodeNames[i];
    const detail=row.querySelector('.gp49-line-body').cloneNode(true);
    detail.classList.add('gp49-detail-body');
    panel.append(close,heading,detail);
    panel.hidden=false;
    if (!reduced) [...panel.children].forEach((item,index)=>{
      if(item.animate)item.animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],
        {duration:350,delay:index*60,easing:'ease-out'});
    });
    panel.scrollIntoView({behavior:reduced?'auto':'smooth',block:'nearest'});
  }
  rows.forEach((row,index)=>row.querySelector('button').addEventListener('click',()=>select(index)));
  const home=root.querySelector('#gp49-home');
  const plus=root.querySelector('#gp49-in'),minus=root.querySelector('#gp49-out');
  home.addEventListener('click',()=>move({x:0,y:0,w:W,h:H}));
  function zoomAt(factor,anchor) {
    const w=clamp(camera.w*factor,160,2300),scale=w/camera.w;
    const h=w*H/W;
    const x=anchor?anchor.x:camera.x+camera.w/2;
    const y=anchor?anchor.y:camera.y+camera.h/2;
    move({x:x-(x-camera.x)*scale,y:y-(y-camera.y)*scale,w,h},470);
  }
  plus.addEventListener('click',()=>zoomAt(.74));
  minus.addEventListener('click',()=>zoomAt(1.36));
  function worldPoint(clientX,clientY) {
    const matrix=svg.getScreenCTM();
    if (!matrix) return null;
    const point=svg.createSVGPoint();
    point.x=clientX;point.y=clientY;
    return point.matrixTransform(matrix.inverse());
  }
  svg.addEventListener('wheel',event=>{
    event.preventDefault();
    const f=Math.exp(clamp(event.deltaY,-240,240)*.0017);
    const anchor=worldPoint(event.clientX,event.clientY);
    zoomAt(f,anchor);
  },{passive:false});
  const pointers=new Map();
  let drag=null,pinch=null;
  svg.addEventListener('pointerdown',event=>{
    if(event.button!==0 && event.pointerType==='mouse')return;
    if(event.target.closest('.gp49-node'))return;
    cancelAnimationFrame(animation);
    pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(svg.setPointerCapture)svg.setPointerCapture(event.pointerId);
    if(pointers.size===1)drag={x:event.clientX,y:event.clientY,cam:{...camera}};
    if(pointers.size===2){
      const pts=[...pointers.values()];
      pinch={dist:Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y),cam:{...camera}};
      drag=null;
    }
  });
  svg.addEventListener('pointermove',event=>{
    if(!pointers.has(event.pointerId))return;
    pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(pointers.size===2 && pinch){
      const pts=[...pointers.values()];
      const dist=Math.max(10,Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y));
      const width=clamp(pinch.cam.w*pinch.dist/dist,160,2300);
      const center=worldPoint((pts[0].x+pts[1].x)/2,(pts[0].y+pts[1].y)/2);
      const w=width,h=w*H/W,scale=w/camera.w;
      camera={x:(center?center.x:camera.x+camera.w/2)-(center?center.x-camera.x:camera.w/2)*scale,
        y:(center?center.y:camera.y+camera.h/2)-(center?center.y-camera.y:camera.h/2)*scale,w,h};
      paint();
    } else if(drag){
      const rect=svg.getBoundingClientRect();
      const scale=camera.w/(rect.width||1);
      camera={...drag.cam,x:drag.cam.x-(event.clientX-drag.x)*scale,
        y:drag.cam.y-(event.clientY-drag.y)*scale};
      paint();
    }
  });
  function stopPointer(event){
    pointers.delete(event.pointerId);
    drag=null;pinch=null;
    if(svg.hasPointerCapture?.(event.pointerId))svg.releasePointerCapture(event.pointerId);
  }
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>svg.addEventListener(type,stopPointer));
  map.addEventListener('keydown',event=>{
    if(event.target!==map)return;
    const d=camera.w*.12;
    const shift={ArrowLeft:[-d,0],ArrowRight:[d,0],ArrowUp:[0,-d],ArrowDown:[0,d]}[event.key];
    if (shift) {event.preventDefault();move({...camera,x:camera.x+shift[0],y:camera.y+shift[1]},350);}
    else if(event.key==='+'||event.key==='=') {event.preventDefault();zoomAt(.74);}
    else if(event.key==='-') {event.preventDefault();zoomAt(1.36);}
    else if(event.key==='Home') {event.preventDefault();home.click();}
  });
  const normalize=text=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const search=root.querySelector('#gp49-search'),empty=root.querySelector('#gp49-empty');
  search.addEventListener('input',()=>{
    const query=normalize(search.value.trim());
    rows.forEach(row=>row.hidden=!normalize(row.textContent).includes(query));
    empty.hidden=rows.some(row=>!row.hidden);
  });
  paint();
})();