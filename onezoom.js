(() => {
  "use strict";
  const svgNS = "http://www.w3.org/2000/svg";
  const $ = (id) => document.getElementById(id);
  const data = {
    id:"gpensc", title:"GPENSC", short:"GP", description:"O Grupo de Pesquisa e Ensino em Nutrição e Saúde Coletiva da UFOP reúne diferentes caminhos de produção e compartilhamento do conhecimento. Escolha um dos seis grandes galhos para começar a explorar.", eyebrow:"RAÍZES DO CONHECIMENTO", x:110, y:450, href:"sobre.html",
    children:[
      {id:"grupo",title:"O grupo",short:"01",description:"Conheça a identidade, a história, as pessoas e a organização do GPENSC.",eyebrow:"PESSOAS E IDENTIDADE",x:430,y:105,children:[
        {id:"historia",title:"Identidade e história",description:"A trajetória, os princípios e a identidade coletiva do grupo.",x:770,y:48,children:[{id:"conheca",title:"Conheça o GPENSC",description:"Apresentação institucional, missão e objetivos do grupo.",href:"sobre.html"},{id:"historia-gpensc",title:"Nossa história",description:"A construção e os caminhos do GPENSC.",href:"sobre.html"}]},
        {id:"pessoas",title:"Pessoas e organização",description:"Quem constrói o grupo e como suas atividades se organizam.",x:770,y:105,children:[{id:"equipe",title:"Equipe e integrantes",description:"Conheça docentes, estudantes, pesquisadores e colaboradores.",href:"sobre.html"},{id:"organizacao",title:"Organização do grupo",description:"Estrutura e organização das atividades coletivas.",href:"sobre.html"}]},
        {id:"contato",title:"Contato",description:"Canais de comunicação e localização do grupo.",x:770,y:162,children:[{id:"fale",title:"Fale com o GPENSC",description:"Entre em contato com o grupo.",href:"contato.html"}]}
      ]},
      {id:"pesquisa",title:"Pesquisa",short:"02",description:"Investigar questões relevantes para a Nutrição e a Saúde Coletiva e produzir conhecimento científico.",eyebrow:"INVESTIGAÇÃO E CIÊNCIA",x:430,y:245,children:[
        {id:"linhas",title:"Linhas de pesquisa",description:"Temas e frentes que orientam a produção científica do grupo.",x:770,y:177,children:[{id:"linhas-lista",title:"Conheça nossas linhas",description:"Explore as linhas de pesquisa e seus temas.",href:"linhas.html"}]},
        {id:"projetos-pesquisa",title:"Projetos",description:"Projetos em andamento e concluídos.",x:770,y:245,children:[{id:"projetos-lista",title:"Projetos de pesquisa",description:"Conheça os projetos desenvolvidos pelo grupo.",href:"projetos.html"}]},
        {id:"producao",title:"Produção científica",description:"Resultados e contribuições acadêmicas.",x:770,y:313,children:[{id:"artigos",title:"Artigos e publicações",description:"Produção científica publicada pelo grupo.",href:"publicacoes.html"},{id:"teses",title:"Teses e dissertações",description:"Trabalhos acadêmicos, defesas e orientações.",href:"teses.html"}]}
      ]},
      {id:"ensino",title:"Ensino",short:"03",description:"Formação acadêmica, orientação e aprendizagem conectadas à realidade social.",eyebrow:"FORMAÇÃO E APRENDIZAGEM",x:430,y:385,children:[
        {id:"graduacao",title:"Graduação",description:"Atividades de ensino e formação na graduação.",x:770,y:317,children:[{id:"disciplinas",title:"Disciplinas",description:"Disciplinas e atividades formativas relacionadas ao grupo.",href:"disciplinas.html"}]},
        {id:"orientacao",title:"Orientação acadêmica",description:"Acompanhamento de trajetórias e trabalhos acadêmicos.",x:770,y:385,children:[{id:"orientacoes",title:"Orientações e defesas",description:"Trabalhos orientados, qualificações e defesas.",href:"teses.html"}]},
        {id:"didatica",title:"Produção didática",description:"Materiais que apoiam o ensino e a aprendizagem.",x:770,y:453,children:[{id:"livros",title:"Livros e capítulos",description:"Materiais bibliográficos e produção didática.",href:"livros.html"}]}
      ]},
      {id:"extensao",title:"Extensão",short:"04",description:"Diálogo entre universidade e sociedade por meio de projetos, ações e comunicação pública.",eyebrow:"DIÁLOGO COM A SOCIEDADE",x:430,y:525,children:[
        {id:"acoes",title:"Projetos e ações",description:"Iniciativas que aproximam a universidade das comunidades.",x:770,y:457,children:[{id:"extensao-projetos",title:"Projetos de extensão",description:"Ações extensionistas e experiências do grupo.",href:"extensao.html"}]},
        {id:"comunicacao",title:"Comunicação e divulgação",description:"Conteúdos que compartilham conhecimento com diferentes públicos.",x:770,y:525,children:[{id:"podcasts",title:"Podcasts",description:"Conteúdos em áudio e conversas sobre Nutrição e Saúde Coletiva.",href:"podcasts.html"},{id:"noar",title:"GPENSC no Ar",description:"Episódios e produções de divulgação.",href:"noar.html"},{id:"videos",title:"Vídeos",description:"Conteúdos audiovisuais do grupo.",href:"videos.html"}]}
      ]},
      {id:"biblioteca",title:"Biblioteca",short:"05",description:"Um espaço para encontrar publicações, materiais, referências e recursos de aprendizagem.",eyebrow:"LEITURAS E DESCOBERTAS",x:430,y:665,children:[
        {id:"leituras",title:"Leituras",description:"Materiais para aprofundamento e consulta.",x:770,y:597,children:[{id:"publicacoes-bib",title:"Publicações do grupo",description:"Artigos, trabalhos e resultados de pesquisa.",href:"publicacoes.html"},{id:"livros-bib",title:"Livros e capítulos",description:"Livros e materiais bibliográficos.",href:"livros.html"}]},
        {id:"audiovisual",title:"Audiovisual",description:"Materiais em vídeo para consulta e divulgação.",x:770,y:665,children:[{id:"videos-bib",title:"Vídeos",description:"Assista às produções audiovisuais.",href:"videos.html"}]},
        {id:"recursos",title:"Fontes e recursos",description:"Referências e ferramentas úteis para pesquisa e formação.",x:770,y:733,children:[{id:"sites",title:"Sites recomendados",description:"Fontes, instituições e recursos externos.",href:"sites.html"}]}
      ]},
      {id:"vida",title:"Vida do grupo",short:"06",description:"Acompanhe o cotidiano, as notícias, os encontros e as atividades compartilhadas.",eyebrow:"ENCONTROS E CAMINHOS",x:430,y:805,children:[
        {id:"novidades",title:"Novidades",description:"Notícias, registros e acontecimentos do GPENSC.",x:770,y:737,children:[{id:"noticias",title:"Notícias do GPENSC",description:"Acompanhe as novidades e os acontecimentos do grupo.",href:"noticias.html"}]},
        {id:"encontros",title:"Encontros e atividades",description:"Eventos, reuniões e compromissos coletivos.",x:770,y:805,children:[{id:"agenda",title:"Agenda do grupo",description:"Confira os próximos eventos e atividades.",href:"agenda.html"}]}
      ]}
    ]
  };

  const world=$("oz-world"), tree=$("oz-tree"), stage=$("oz-stage");
  if(!world||!tree||!stage)return;
  const nodes=new Map(), opened=new Set(["gpensc"]), selected="gpensc";
  let activeId=selected, camera={x:0,y:0,w:900,h:900}, pointer=null, pinch=null, dragMoved=false;
  const width=1400,height=900;
  const el=(name,attrs={},parent=world)=>{const n=document.createElementNS(svgNS,name);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,String(v)));parent.appendChild(n);return n};
  function allNodes(node=data,parent=null,depth=0){
    node.parent=parent;node.depth=depth;nodes.set(node.id,node);
    (node.children||[]).forEach(child=>allNodes(child,node,depth+1));
  }
  allNodes();
  function parentPosition(node){
    if(node.id==="gpensc")return;
    if(node.depth===1)return;
    if(node.depth===2){
      const i=node.parent.children.indexOf(node);
      node.x=770;node.y=node.parent.y+(i-(node.parent.children.length-1)/2)*68;
    }else{
      const i=node.parent.children.indexOf(node);
      node.x=1120;node.y=node.parent.y+(i-(node.parent.children.length-1)/2)*34;
    }
  }
  function positionAll(node=data){(node.children||[]).forEach(child=>{parentPosition(child);positionAll(child)})}
  positionAll();
  const visible=(node)=>node.depth===0||opened.has(node.parent?.id);
  function pathFor(a,b){const sx=a.x+ (a.depth===0?28:24), sy=a.y, ex=b.x-22,ey=b.y,dx=(ex-sx)*.48;return `M ${sx} ${sy} C ${sx+dx} ${sy}, ${ex-dx} ${ey}, ${ex} ${ey}`}
  function draw(){
    world.replaceChildren();
    // Soft roots and trunk establish a recognizable tree silhouette.
    el("path",{d:"M105 450 C72 420 65 385 42 350 M105 450 C72 480 62 515 38 550 M105 450 C130 420 132 385 158 350 M105 450 C130 480 135 520 165 550",class:"oz-root-glow",opacity:".55"});
    el("path",{d:"M110 450 C110 370 105 285 110 205 C112 125 105 65 118 18 M110 450 C105 530 115 620 108 700 C104 785 112 840 125 885",class:"oz-trunk",stroke:"url(#oz-bark)"});
    el("path",{d:"M102 445 C102 350 99 275 103 205 M104 700 C103 775 109 820 116 858",class:"oz-root-glow"});
    // A few fine twigs make the trunk feel organic without competing with navigation.
    for(let i=0;i<7;i++){const y=105+i*112;el("path",{d:`M110 ${y+80} C165 ${y+45} 180 ${y+8} 205 ${y-20}`,class:"oz-branch oz-branch-main",stroke:"url(#oz-bark)","stroke-width":i%2?8:5,opacity:".55"})}
    const visibleNodes=[...nodes.values()].filter(n=>n.id==="gpensc"||visible(n));
    visibleNodes.forEach(n=>{
      if(n.parent&&visible(n.parent)){
        const p=n.parent;
        el("path",{d:pathFor(p,n),class:"oz-branch oz-branch-shadow","stroke-width":n.depth===1?25:n.depth===2?12:6});
        el("path",{d:pathFor(p,n),class:"oz-branch oz-branch-main","stroke-width":n.depth===1?18:n.depth===2?8:4});
      }
    });
    visibleNodes.forEach(n=>{
      const g=el("g",{class:`oz-node level-${n.depth}${n.id===activeId?" is-selected":""}${n.children?.length&&!opened.has(n.id)?" is-collapsed":""}`,tabindex:"0",role:"button","data-node-id":n.id,"aria-label":n.title+(n.children?.length?", expandir galho":", abrir conteúdo"),"aria-expanded":n.children?.length?opened.has(n.id):"false"});
      const r=n.depth===0?28:n.depth===1?19:n.depth===2?13:9;
      const fill=n.depth===0?"#244e32":n.depth===1?"#6f9a5e":n.depth===2?"#9bbd7e":"#c0d4a4";
      el("circle",{cx:n.x,cy:n.y,r,fill},g);
      if(n.children?.length&&!opened.has(n.id))el("text",{x:n.x,y:n.y+5,"text-anchor":"middle",class:"node-indicator"},g).textContent="+";
      if(n.depth===0){
        el("text",{x:n.x+43,y:n.y-3,class:"oz-root-label"}).textContent="GPENSC";
        el("text",{x:n.x+43,y:n.y+17,class:"oz-root-sub"}).textContent="UFOP · NUTRIÇÃO E SAÚDE COLETIVA";
      }else{
        const label=el("text",{x:n.x+ (n.depth===1?32:25),y:n.y+5});
        label.textContent=n.title;
        if(n.depth===1){const meta=el("text",{x:n.x+32,y:n.y+24,class:"node-meta"});meta.textContent=n.children?.length? `${n.children.length} caminhos para explorar`:""; }
      }
      g.addEventListener("click",()=>{if(dragMoved){dragMoved=false;return}activate(n.id)});
      g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();activate(n.id)}});
    });
    // Leaf and twig tips.
    visibleNodes.filter(n=>n.depth>1).forEach(n=>{
      el("circle",{cx:n.x-2,cy:n.y,r:n.depth===2?3.5:2.5,fill:"#c69d62",class:"oz-bloom"});
    });
  }
  function activate(id){
    const n=nodes.get(id);if(!n)return;
    activeId=id;
    if(n.children?.length){if(opened.has(id))opened.delete(id);else opened.add(id)}
    draw();updateDetail(n);updateBreadcrumb(n);
    if(n.depth===0){resetCamera()}else focusNode(n);
    $("oz-hint-text").textContent=n.children?.length?(opened.has(id)?"Galho aberto · selecione outro ramo ou aproxime-se dos brotos":"Galho recolhido · selecione para expandir"):"Conteúdo selecionado · use o botão para abrir a página";
  }
  function updateDetail(n){
    $("oz-detail-symbol").textContent=n.short||n.title.split(/\s+/).slice(0,2).map(s=>s[0]).join("").toUpperCase();
    $("oz-detail-eyebrow").textContent=n.eyebrow||(n.depth===0?"RAÍZES DO CONHECIMENTO":n.depth===1?"RAMO DO CONHECIMENTO":n.depth===2?"BROTO DE CONHECIMENTO":"FOLHA");
    $("oz-detail-title").textContent=n.title;
    $("oz-detail-description").textContent=n.description||"Explore este conteúdo do GPENSC.";
    const link=$("oz-detail-link");
    if(n.href){link.href=n.href;link.hidden=false;link.innerHTML=`Abrir conteúdo <span aria-hidden="true">↗</span>`}
    else if(n.children?.length){link.hidden=false;link.href="#oz-tree";link.innerHTML=`Explorar este galho <span aria-hidden="true">→</span>`;link.onclick=e=>{e.preventDefault();if(!opened.has(n.id))activate(n.id)}}
    else link.hidden=true;
  }
  function updateBreadcrumb(n){
    const nav=$("oz-breadcrumb");nav.replaceChildren();
    const home=document.createElement("button");home.type="button";home.textContent="Raízes";home.dataset.ozHome="";nav.appendChild(home);
    let chain=[];for(let p=n;p&&p.id!=="gpensc";p=p.parent)chain.unshift(p);
    chain.forEach((part,i)=>{const sep=document.createElement("span");sep.textContent="/";sep.setAttribute("aria-hidden","true");nav.appendChild(sep);const label=document.createElement(i===chain.length-1?"span":"button");label.textContent=part.title;if(label.tagName==="BUTTON"){label.type="button";label.addEventListener("click",()=>{activeId=part.id;draw();updateDetail(part);updateBreadcrumb(part);focusNode(part)})}else label.className="oz-crumb-current";nav.appendChild(label)});
    home.addEventListener("click",resetAll);
  }
  function setCamera(c,animate=true){
    const start={...camera},end={x:c.x,y:c.y,w:c.w,h:c.h};
    if(!animate){camera=end;tree.setAttribute("viewBox",`${end.x} ${end.y} ${end.w} ${end.h}`);return}
    const t0=performance.now(),duration=420;
    const ease=t=>1-Math.pow(1-t,3);
    function step(now){const t=Math.min(1,(now-t0)/duration),e=ease(t);camera={x:start.x+(end.x-start.x)*e,y:start.y+(end.y-start.y)*e,w:start.w+(end.w-start.w)*e,h:start.h+(end.h-start.h)*e};tree.setAttribute("viewBox",`${camera.x} ${camera.y} ${camera.w} ${camera.h}`);if(t<1)requestAnimationFrame(step)}
    requestAnimationFrame(step);
  }
  function focusNode(n){
    const w=n.depth===1?950:n.depth===2?690:570,h=n.depth===1?Math.min(620,stage.clientHeight*1.05):Math.min(420,stage.clientHeight*.8);
    const x=Math.max(0,Math.min(width-w,n.x-(n.depth===1?210:n.depth===2?250:310)));
    const y=Math.max(0,Math.min(height-h,n.y-h/2));
    setCamera({x,y,w,h});
  }
  function resetCamera(){setCamera({x:0,y:0,w:900,h:900})}
  function resetAll(){opened.clear();opened.add("gpensc");activeId="gpensc";draw();updateDetail(data);updateBreadcrumb(data);resetCamera();$("oz-hint-text").textContent="Selecione um galho para explorar · Arraste para mover · Use a roda ou pinça para aproximar"}
  function zoom(factor,centerX,centerY){
    const box=tree.viewBox.baseVal, w=Math.max(300,Math.min(1800,box.width/factor)),h=Math.max(300,Math.min(1400,box.height/factor));
    const cx=centerX??(box.x+box.width/2),cy=centerY??(box.y+box.height/2),ratio=w/box.width;
    setCamera({x:cx-(cx-box.x)*ratio,y:cy-(cy-box.y)*ratio,w,h},false);
  }
  $("oz-home").addEventListener("click",resetAll);
  $("oz-zoom-in").addEventListener("click",()=>zoom(1.25));
  $("oz-zoom-out").addEventListener("click",()=>zoom(.8));
  document.querySelectorAll("[data-oz-home]").forEach(b=>b.addEventListener("click",resetAll));
  const search=$("oz-search");
  search.addEventListener("input",()=>{
    const q=search.value.trim().toLocaleLowerCase("pt-BR");
    document.querySelectorAll(".oz-node").forEach(g=>g.classList.remove("oz-search-result"));
    if(!q)return;
    const match=[...nodes.values()].find(n=>(n.title+" "+(n.description||"")).toLocaleLowerCase("pt-BR").includes(q));
    if(match){let p=match.parent;while(p){opened.add(p.id);p=p.parent}activeId=match.id;draw();world.querySelector(`[data-node-id="${match.id}"]`)?.classList.add("oz-search-result");updateDetail(match);updateBreadcrumb(match);focusNode(match)}
  });
  document.addEventListener("keydown",e=>{if(e.key==="/"&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName)){e.preventDefault();search.focus()}if(e.key==="Escape"&&document.activeElement===search){search.value="";search.blur();resetAll()}});
  // Wheel zoom and pointer drag; Pointer Events also cover touch and stylus.
  tree.addEventListener("wheel",e=>{e.preventDefault();zoom(e.deltaY<0?1.12:.89)}, {passive:false});
  tree.addEventListener("pointerdown",e=>{if(e.target.closest(".oz-node"))return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY,box:{...camera}};dragMoved=false;tree.setPointerCapture(e.pointerId);tree.classList.add("is-dragging")});
  tree.addEventListener("pointermove",e=>{if(!pointer||pointer.id!==e.pointerId)return;const rect=tree.getBoundingClientRect(),dx=(e.clientX-pointer.x)*pointer.box.w/rect.width,dy=(e.clientY-pointer.y)*pointer.box.h/rect.height;if(Math.abs(dx)+Math.abs(dy)>4)dragMoved=true;setCamera({x:pointer.box.x-dx,y:pointer.box.y-dy,w:pointer.box.w,h:pointer.box.h},false)});
  const endDrag=()=>{pointer=null;tree.classList.remove("is-dragging")};
  tree.addEventListener("pointerup",endDrag);tree.addEventListener("pointercancel",endDrag);tree.addEventListener("lostpointercapture",endDrag);
  // Double tap/click on empty space returns to the overview.
  tree.addEventListener("dblclick",e=>{if(!e.target.closest(".oz-node"))resetCamera()});
  draw();updateDetail(data);updateBreadcrumb(data);resetCamera();
  // Fit the first view to the actual device width without shrinking the labels excessively.
  if(window.matchMedia("(max-width: 700px)").matches)setCamera({x:0,y:0,w:560,h:900},false);
})();