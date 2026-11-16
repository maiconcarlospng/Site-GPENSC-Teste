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
  const fmt=n=>n.toFixed(2);
  const W = 1400, H = 920, total = rows.length;
  const nodeNames = rows.map(row => row.querySelector('.gp49-line-name').textContent.trim());
  const branchRange=(start,count)=>String(start+1).padStart(2,'0')+(count>1?'–'+String(start+count).padStart(2,'0'):'');
  const make = (tag, attrs, parent) => {
    const item = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([name, value]) => item.setAttribute(name, String(value)));
    if (parent) parent.appendChild(item);
    return item;
  };
  const svg = make('svg', {
    viewBox: '0 0 1400 920', preserveAspectRatio: 'xMidYMid meet',
    role: 'group', 'aria-label': 'Árvore do GPENSC com linhas, projetos, pessoas e produções'
  }, map);
  // No celular, a tela se comporta como um mapa explorável, sem miniaturizar a árvore.
  function adaptViewport() {
    svg.setAttribute('preserveAspectRatio',
      window.matchMedia('(max-width: 767px)').matches ? 'xMidYMid slice' : 'xMidYMid meet');
  }
  window.addEventListener('resize', adaptViewport, {passive:true});
  adaptViewport();
  const defs = make('defs', {}, svg);
  // Gradiente com coordenadas globais: a textura não reinicia a cada galho.
  const bark=make('linearGradient',{id:'gp49-bark',gradientUnits:'userSpaceOnUse',
    x1:120,y1:0,x2:1260,y2:110},defs);
  [['0','#3b241b'],['.24','#5b3525'],['.5','#75452d'],['.76','#583221'],['1','#35241d']]
    .forEach(([offset,color])=>make('stop',{offset,'stop-color':color},bark));
  // A copa é composta de transparências radiais sobrepostas: sem bordas de
  // elipses recortadas ou placas de cor que pareçam peças coladas.
  const canopyLayer=make('g',{class:'gp49-canopy-layer','pointer-events':'none','aria-hidden':'true'},svg);
  // Copa aberta, formada por ramos e folhas individuais; sem uma placa oval.
  const leafPalette=['#2f7833','#438b3a','#5d9b42','#77a84b','#8fb654','#356f32'];
  const leafTexture=make('g',{class:'gp49-canopy-texture','pointer-events':'none','aria-hidden':'true'},canopyLayer);
  const foliageNoise=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
  function canopyLeaf(x,y,angle,size,tone,parent){
    const leaf=make('g',{transform:'translate('+fmt(x)+' '+fmt(y)+') rotate('+fmt(angle*180/Math.PI)+') scale('+fmt(size)+')'},parent);
    make('path',{d:'M0,0 C5,-7 13,-10 19,-5 C22,-2 21,2 17,5 C10,9 3,5 0,0 Z',
      fill:tone,stroke:'#214b27','stroke-width':'.5',opacity:.98},leaf);
    make('path',{d:'M1,0 Q9,-1 18,-5',fill:'none',stroke:'#d9eaa7','stroke-width':.9,
      'stroke-linecap':'round',opacity:.72},leaf);
  }
  function smallBranchLeaf(x,y,angle,tone,parent){
    const leaf=make('g',{transform:'translate('+fmt(x)+' '+fmt(y)+') rotate('+fmt(angle*180/Math.PI)+')'},parent);
    make('path',{d:'M0,0 C3,-5 8,-7 13,-4 C16,-1 14,3 10,5 C6,7 2,4 0,0 Z',
      fill:tone,stroke:'#1d4824','stroke-width':'.55','stroke-linejoin':'round'},leaf);
    make('path',{d:'M1,0 Q7,-1 13,-4',fill:'none',stroke:'#d7e7a1','stroke-width':'.7',
      'stroke-linecap':'round',opacity:.8},leaf);
  }
  function canopyBranch(x,y,angle,length,width,depth,key){
    const bend=(foliageNoise(key)-.5)*.42;
    const c1={x:x+Math.cos(angle+bend)*length*.34,y:y+Math.sin(angle+bend)*length*.34};
    const c2={x:x+Math.cos(angle-bend*.55)*length*.72,y:y+Math.sin(angle-bend*.55)*length*.72};
    const end={x:x+Math.cos(angle+bend*.08)*length,y:y+Math.sin(angle+bend*.08)*length};
    const d='M'+fmt(x)+','+fmt(y)+' C'+fmt(c1.x)+','+fmt(c1.y)+' '+fmt(c2.x)+','+fmt(c2.y)+' '+fmt(end.x)+','+fmt(end.y);
    make('path',{d,fill:'none',stroke:depth>1?'#624329':'#5b4529',
      'stroke-width':fmt(width),'stroke-linecap':'round','stroke-linejoin':'round',
      'stroke-opacity':depth>1?'.78':'.66'},leafTexture);
    for(let j=0;j<4;j++){
      const t=.20+j*.19, u=1-t;
      const px=u*u*u*x+3*u*u*t*c1.x+3*u*t*t*c2.x+t*t*t*end.x;
      const py=u*u*u*y+3*u*u*t*c1.y+3*u*t*t*c2.y+t*t*t*end.y;
      const tangent=Math.atan2(
        3*u*u*(c1.y-y)+6*u*t*(c2.y-c1.y)+3*t*t*(end.y-c2.y),
        3*u*u*(c1.x-x)+6*u*t*(c2.x-c1.x)+3*t*t*(end.x-c2.x)
      );
      for(const side of [-1,1]){
        const offset=(side*1.02)+(foliageNoise(key+j*9+side)*.16-.08);
        const size=.64+foliageNoise(key+j*13+side*5)*.42;
        const tone=leafPalette[Math.floor(foliageNoise(key+j*19+side*7)*leafPalette.length)];
        canopyLeaf(px,py,tangent+offset,size,tone,leafTexture);
      }
    }
    if(depth<=0)return;
    const fork=.34+foliageNoise(key+31)*.29;
    const next=length*(.69+foliageNoise(key+17)*.06);
    canopyBranch(end.x,end.y,angle-fork,next,width*.68,depth-1,key*2+1);
    canopyBranch(end.x,end.y,angle+fork,next,width*.68,depth-1,key*2+2);
  }
  const canopyRoots=[
    [390,392,-2.48],[535,410,-2.05],[700,420,-1.57],[865,410,-1.08],[1010,392,-.66]
  ];
  canopyRoots.forEach(([x,y,angle],i)=>canopyBranch(x,y,angle,178+(i%3)*14,2.35,2,41+i*23));
  const woodLayer = make('g', {class: 'gp49-wood-layer'}, svg);
  const foliageLayer = make('g', {class: 'gp49-foliage-layer', 'pointer-events': 'none'}, svg);
  const nodeLayer = make('g', {class: 'gp49-node-layer'}, svg);
  // Uma única legenda flutuante substitui os títulos longos sobrepostos.
  const tooltip=document.createElement('div');
  tooltip.className='gp49-map-tooltip';
  tooltip.setAttribute('role','tooltip');
  tooltip.hidden=true;
  map.appendChild(tooltip);
  function showTip(node,label){
    if(window.matchMedia('(hover: none)').matches)return;
    const area=map.getBoundingClientRect(),at=node.getBoundingClientRect();
    const x=at.left+at.width/2-area.left;
    tooltip.textContent=label;
    tooltip.hidden=false;
    const half=Math.min(tooltip.offsetWidth/2,area.width/2-10);
    tooltip.style.left=Math.min(Math.max(x,half+10),area.width-half-10)+'px';
    const upper=at.top-area.top-12;
    const below=upper<Math.max(90,tooltip.offsetHeight+12);
    tooltip.dataset.side=below?'below':'above';
    tooltip.style.top=(below?at.bottom-area.top+12:upper)+'px';
  }
  function hideTip(){tooltip.hidden=true;}
  let camera = {x: 0, y: 0, w: W, h: H};
  let animation = 0;
  const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
  const ease = t => 1-Math.pow(1-t,3);
  function paint() {
    svg.setAttribute('viewBox', camera.x+' '+camera.y+' '+camera.w+' '+camera.h);
    svg.classList.toggle('gp49-detailed',camera.w < 740);
    svg.classList.toggle('gp49-very-detailed',camera.w < 430);
    const labelSize=camera.w/(map.clientWidth||W)*12;
    svg.querySelectorAll('.gp49-branch-label-text,.gp49-branch-name-label,.gp49-terminal-index').forEach(label=>{
      label.style.fontSize=labelSize+'px';
      label.style.strokeWidth=Math.max(.7,labelSize*.22)+'px';
    });
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
  // A madeira usa tangentes compartilhadas: os filhos nascem na direção do
  // galho anterior, sem quinas ou emendas retas no ponto de bifurcação.
  const direction=(x,y)=>{
    const size=Math.hypot(x,y)||1;
    return {x:x/size,y:y/size};
  };
  function limb(from,to,begin,end,incoming) {
    const group=make('g',{class:'gp49-limb'},woodLayer);
    const dx=to.x-from.x,dy=to.y-from.y,reach=Math.hypot(dx,dy)||1;
    const entry=incoming||direction(dx,dy);
    const exit=direction(dx*.70,dy);
    // O início fica parcialmente dentro do galho-mãe; isso integra as
    // silhuetas antes de aplicar a sombra única à madeira inteira.
    const overlap=Math.min(begin*.22,reach*.17,25);
    const base={x:from.x-entry.x*overlap,y:from.y-entry.y*overlap};
    const c1={x:from.x+entry.x*reach*.34,y:from.y+entry.y*reach*.34};
    const c2={x:to.x-exit.x*reach*.32,y:to.y-exit.y*reach*.32};
    const curve='M'+fmt(base.x)+','+fmt(base.y)+' C'+fmt(c1.x)+','+fmt(c1.y)+
      ' '+fmt(c2.x)+','+fmt(c2.y)+' '+fmt(to.x)+','+fmt(to.y);
    const guide=make('path',{d:curve,fill:'none'},group);
    const len=guide.getTotalLength(),left=[],right=[];
    function offset(t,sign,factor=1) {
      const at=guide.getPointAtLength(len*t);
      const before=guide.getPointAtLength(Math.max(0,len*t-.65));
      const after=guide.getPointAtLength(Math.min(len,len*t+.65));
      const vx=after.x-before.x,vy=after.y-before.y,dist=Math.hypot(vx,vy)||1;
      const smooth=t*t*(3-2*t);
      const width=(begin+(end-begin)*smooth)*factor*.5;
      return [at.x-vy/dist*width*sign,at.y+vx/dist*width*sign];
    }
    for(let i=0;i<=40;i++)left.push(offset(i/40,1));
    for(let i=40;i>=0;i--)right.push(offset(i/40,-1));
    const pointString=p=>fmt(p[0])+','+fmt(p[1]);
    // Pontas arredondadas substituem as terminações planas dos polígonos.
    const endCap=[to.x+exit.x*end*.20,to.y+exit.y*end*.20];
    const baseCap=[base.x-entry.x*begin*.10,base.y-entry.y*begin*.10];
    const outline='M'+pointString(left[0])+' L'+left.slice(1).map(pointString).join(' L')+
      ' Q'+pointString(endCap)+' '+pointString(right[0])+
      ' L'+right.slice(1).map(pointString).join(' L')+
      ' Q'+pointString(baseCap)+' '+pointString(left[0])+' Z';
    make('path',{d:outline,class:'gp49-wood-body',fill:'url(#gp49-bark)'},group);
    // Veios discretos seguem a curva, em vez de parecerem faixas coladas.
    for(let k=-2;k<=2;k++){
      const grain=[];
      for(let i=4;i<=36;i++){
        const t=i/40;
        grain.push(pointString(offset(t,k/3+Math.sin(i*.32+k)*.023,.87)));
      }
      make('path',{d:'M'+grain.join(' L'),class:'gp49-wood-grain',
        fill:'none',stroke:k%2?'#41392a':'#e0bc8a',
        'stroke-width':begin>70?1.6:.9,'stroke-opacity':.19,'stroke-linecap':'round'},group);
    }
    // Pequenas folhas nas próprias bifurcações do desenho de dados.
    if(begin<100 && reach>68){
      const sprigs=make('g',{class:'gp49-limb-sprigs','pointer-events':'none','aria-hidden':'true'},group);
      const sprigTones=['#1d5426','#347a32','#5b9639','#8eae43'];
      for(let j=0;j<3;j++){
        const t=.25+j*.24, at=guide.getPointAtLength(len*t);
        const before=guide.getPointAtLength(Math.max(0,len*t-.8));
        const after=guide.getPointAtLength(Math.min(len,len*t+.8));
        const tangent=Math.atan2(after.y-before.y,after.x-before.x);
        const distance=(begin+(end-begin)*t)*.32+5;
        for(const side of [-1,1]){
          const nx=Math.cos(tangent+Math.PI/2),ny=Math.sin(tangent+Math.PI/2);
          const bx=at.x+nx*distance*side,by=at.y+ny*distance*side;
          make('path',{d:'M'+fmt(at.x)+','+fmt(at.y)+' Q'+fmt((at.x+bx)/2)+','+fmt((at.y+by)/2)+' '+fmt(bx)+','+fmt(by),
            fill:'none',stroke:'#68452b','stroke-width':1.25,'stroke-linecap':'round'},sprigs);
          const tone=sprigTones[(j+(side===1?1:0))%sprigTones.length];
          smallBranchLeaf(bx,by,tangent+side*.88,tone,sprigs);
        }
      }
    }
    guide.remove();
    if(!reduced){
      try{group.animate([{opacity:0},{opacity:1}],{duration:520,easing:'ease-out'});}catch(_){}
    }
    return {group,heading:exit};
  }
  // Folhas com pecíolo e ponta afinada, ligadas ao ramo (não discos soltos).
  function leaves(p,index){
    const group=make('g',{class:'gp49-leaf-spray',
      transform:'translate('+p.x+' '+p.y+')'},foliageLayer);
    const shades=['#557e48','#73975b','#88a970','#49724d','#a0b884'];
    for(let i=0;i<7;i++){
      const angle=i*2.399963+index*.69;
      const dx=Math.cos(angle),dy=Math.sin(angle)*.78;
      const len=23+(i%3)*8;
      const x=dx*len,y=dy*len;
      make('path',{d:'M0,0 Q'+fmt(x*.36)+','+fmt(y*.62)+' '+fmt(x)+','+fmt(y),
        fill:'none',stroke:'#667c50','stroke-width':1.25,'stroke-linecap':'round',opacity:.78},group);
      const b=[x-dx*9,y-dy*9],tip=[x+dx*10,y+dy*10];
      const side=[-dy,dx],span=5+(i%3)*1.3;
      const left=[x+side[0]*span,y+side[1]*span];
      const right=[x-side[0]*span,y-side[1]*span];
      make('path',{
        d:'M'+fmt(b[0])+','+fmt(b[1])+
          ' Q'+fmt(left[0])+','+fmt(left[1])+' '+fmt(tip[0])+','+fmt(tip[1])+
          ' Q'+fmt(right[0])+','+fmt(right[1])+' '+fmt(b[0])+','+fmt(b[1])+' Z',
        fill:shades[(i+index)%shades.length],opacity:.85+(i%2)*.08
      },group);
    }
    return group;
  }
  // Galhos secundários representam projetos; frutos representam pessoas e produtos.
  // Apenas contagens positivas que vieram do CMS geram elementos.
  function linkedLife(point,index) {
    let frutos=[];
    try { frutos=JSON.parse(rows[index].dataset.fruits||'[]'); } catch (_) {}
    if(!Array.isArray(frutos)||!frutos.length)return null;
    const life=make('g',{class:'gp49-linked-life','pointer-events':'none','aria-hidden':'true'},foliageLayer);
    const visible=frutos.slice(0,5);
    visible.forEach((fruto,k)=>{
      const angle=-Math.PI/2+k*2.399963;
      const x=point.x+Math.cos(angle)*35;
      const y=point.y+Math.sin(angle)*25-8;
      const color=fruto.tipo==='pessoa'?'#66934c':fruto.tipo==='defesa'?'#b9560f':'#d9731f';
      make('path',{d:'M'+x+','+(y-6)+' q-4 -6 0 -10',class:'gp49-fruit-stem',
        fill:'none',stroke:'#68734c','stroke-width':2},life);
      const berry=make('ellipse',{cx:x,cy:y,rx:7.2,ry:9.2,fill:color,class:'gp49-fruit'},life);
      make('title',{},berry).textContent=(fruto.tipo||'Fruto')+': '+(fruto.nome||'');
      make('ellipse',{cx:x-2,cy:y-3,rx:1.6,ry:3,fill:'#fff',opacity:.34},life);
    });
    if(frutos.length>visible.length){
      const x=point.x+30,y=point.y+29;
      const more=make('g',{class:'gp49-fruit-more'},life);
      make('circle',{cx:x,cy:y,r:11,fill:'#f7f4e9',stroke:'#8b815e','stroke-width':1.5},more);
      make('text',{x,y:y+3,'text-anchor':'middle'},more).textContent='+'+(frutos.length-visible.length);
    }
    return life;
  }
  function focusOn(start,count,depth) {
    const center=point(start,count,depth);
    const width=clamp(210+count/total*1310,290,1400);
    const h=width*H/W;
    move({x:center.x-width/2,y:center.y-h*.72,w:width,h},850);
  }
  function branch(start,count,depth,parent,fromWidth,toWidth,incoming) {
    const p=point(start,count,depth);
    const drawn=limb(parent,p,fromWidth,toWidth,incoming);
    const stem=drawn.group;
    const terminal=count===1;
    const spray=terminal?leaves(p,start):null;
    const linked=terminal?linkedLife(p,start):null;
    const bubble=make('g',{
      class:'gp49-node'+(terminal?' gp49-terminal':' gp49-fork'),
      transform:'translate('+p.x+' '+p.y+')',
      ...(terminal?{
        role:'button',tabindex:0,
        'aria-label':(rows[start].dataset.branchType==='projeto'?'Projeto: ':'Linha de pesquisa: ')+nodeNames[start],
        'aria-pressed':'false'
      }:{'aria-hidden':'true'})
    },nodeLayer);
    const radius=terminal?17:clamp(12+count/total*9,13,21);
    // Área de toque invisível e acessível, independente das folhas decorativas.
    make('circle',{r:radius+9,fill:'transparent','pointer-events':'all',class:'gp49-hit-target'},bubble);
    make('circle',{r:radius+9,class:'gp49-node-halo'},bubble);
    make('circle',{r:radius,class:'gp49-node-disc'},bubble);
    make('circle',{r:radius*.72,class:'gp49-node-ring'},bubble);
    // Os nomes e números individuais ficam na lista, evitando texto amontoado nos nós.
    if (!terminal) {
      make('path',{d:'M-2,4 Q-14,-3 -9,-11 Q1,-9 2,2 Q10,-13 14,-8 Q16,2 4,6 Z',class:'gp49-bud',fill:'#d8e9b9'},bubble);
      make('title',{},bubble).textContent=count+' frentes de pesquisa ou projeto — clique para expandir ou recolher';
    } else {
      make('circle',{r:5,class:'gp49-node-seed'},bubble);
      const indexLabel=make('text',{x:0,y:radius+23,'text-anchor':'middle',
        class:'gp49-terminal-index','aria-hidden':'true'},bubble);
      indexLabel.textContent=String(start+1).padStart(2,'0');
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
        kids=[branch(start,left,depth+1,p,toWidth,Math.max(4,toWidth*.57),drawn.heading)];
        if(right)kids.push(branch(start+left,right,depth+1,p,toWidth,Math.max(4,toWidth*.57),drawn.heading));
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
      if(linked)linked.remove();
    }
    const tipLabel=terminal?nodeNames[start]:'Frentes '+branchRange(start,count)+': '+nodeNames.slice(start,start+count).join('; ');
    if(terminal){
      bubble.addEventListener('pointerenter',()=>showTip(bubble,tipLabel));
      bubble.addEventListener('pointerleave',hideTip);
      bubble.addEventListener('focus',()=>showTip(bubble,tipLabel));
      bubble.addEventListener('blur',hideTip);
      bubble.addEventListener('click',event=>{hideTip();event.stopPropagation();select(start);});
      bubble.addEventListener('keydown',event=>{
        if(event.key==='Enter'||event.key===' ') {
          event.preventDefault();event.stopPropagation();select(start);
        }
      });
    }
    // Toda a estrutura fica visível; não há galhos que precisem ser abertos.
    if(!terminal)expand(true);
    return {destroy};
  }
  branch(0,total,0,{x:700,y:970},112,52,{x:0,y:-1});
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
    const eyebrow=document.createElement('p');
    eyebrow.className='gp49-detail-kind';
    eyebrow.textContent=row.dataset.branchType==='projeto'?'PROJETO':'LINHA DE PESQUISA';
    const heading=document.createElement('h2');
    heading.textContent=nodeNames[i];
    const detail=row.querySelector('.gp49-line-body').cloneNode(true);
    detail.classList.add('gp49-detail-body');
    panel.append(close,eyebrow,heading,detail);
    panel.hidden=false;
    if (!reduced) [...panel.children].forEach((item,index)=>{
      if(item.animate)item.animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],
        {duration:350,delay:index*60,easing:'ease-out'});
    });
    panel.scrollIntoView({behavior:reduced?'auto':'smooth',block:'nearest'});
  }
  rows.forEach((row,index)=>{
    const button=row.querySelector('button');
    const indexTag=document.createElement('span');
    indexTag.className='gp49-directory-index';
    indexTag.setAttribute('aria-hidden','true');
    indexTag.textContent=String(index+1).padStart(2,'0');
    button.prepend(indexTag);
    button.addEventListener('click',()=>select(index));
  });
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