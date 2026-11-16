/* GPENSC — Árvore viva do conhecimento
   Os ramos são gerados exclusivamente a partir dos registros públicos em arvore.qmd.
   Sem contagens inventadas; teclado, busca, filtros, zoom e leitura acessível. */
(() => {
  "use strict";
  function ready(){
    const list=document.getElementById("gp-tree-branches");
    const canvas=document.getElementById("gp-tree-canvas");
    const detail=document.getElementById("gp-tree-detail");
    if(!list||!canvas||!detail)return;
    const branches=Array.from(list.querySelectorAll(".gp-tree-branch"));
    if(!branches.length)return;
    // A copa orgânica vem do SVG autoral. Os pontos são uma camada acessível
    // e recebem seus rótulos a partir dos dados reais gerados pelo Quarto.
    const NS="http://www.w3.org/2000/svg";
    const SVG=(tag,attrs={},label)=>{const e=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,String(v)));if(label!==undefined)e.textContent=label;return e;};
    const put=(parent,tag,attrs={},label)=>{const el=SVG(tag,attrs,label);parent.appendChild(el);return el;};
    const svg=SVG("svg",{viewBox:"0 0 1000 820",class:"gp-tree-svg gp-tree-v38",role:"group",
      "aria-label":"Árvore interativa do GPENSC com "+branches.length+" linhas de pesquisa"});
    const scene=put(svg,"g",{class:"gp-tree-scene"});
    put(scene,"image",{href:"img/ilustracoes/arvore-gpensc.svg",x:0,y:0,width:1000,height:820,
      preserveAspectRatio:"xMidYMid meet","pointer-events":"none"});
    // Um único tronco identificável, sem ilustrar novamente a árvore.
    const trunkLabel=put(scene,"g",{class:"gp-tree-trunk-badge","aria-hidden":"true"});
    put(trunkLabel,"rect",{x:428,y:610,width:144,height:53,rx:12,fill:"#214d30",stroke:"#f8f5e9","stroke-width":3});
    put(trunkLabel,"text",{x:500,y:643,"text-anchor":"middle",class:"gp-tree-trunk-label"},"GPENSC");
    const nodes=[],stems=[];
    // Distribuição responsiva ao número REAL de linhas, sem pontos fixos
    // ou elementos de demonstração. Mantém cada ponto dentro da copa.
    const columns=Math.max(1,Math.ceil(Math.sqrt(branches.length*1.6)));
    const rows=Math.ceil(branches.length/columns);
    const stepX=columns>1?480/(columns-1):0;
    const positions=branches.map((_,i)=>{
      const row=Math.floor(i/columns);
      const col=i%columns;
      const rowCount=Math.min(columns,branches.length-row*columns);
      const x=500+(col-(rowCount-1)/2)*stepX+(row%2?12:-12);
      const y=rows===1?285:165+row*(275/(rows-1));
      return [Math.round(x),Math.round(y)];
    });
    const badges=put(scene,"g",{class:"gp-tree-markers"});
    branches.forEach((branch,i)=>{
      const point=positions[i];
      const [x,y]=point;
      const name=branch.querySelector(".gp-tree-name")?.textContent?.trim()||"Linha "+(i+1);
      const g=put(badges,"g",{class:"gp-tree-node",role:"button",tabindex:0,
        "aria-label":"Linha "+(i+1)+": "+name,"aria-pressed":"false"});
      put(g,"title",{},name);
      put(g,"circle",{cx:x,cy:y,r:29,class:"gp-tree-node-hit"});
      put(g,"circle",{cx:x,cy:y,r:23,class:"gp-tree-node-ring"});
      put(g,"circle",{cx:x,cy:y,r:18,class:"gp-tree-node-center"});
      put(g,"text",{x,y:y+5,"text-anchor":"middle",class:"gp-tree-node-number"},String(i+1).padStart(2,"0"));
      g.addEventListener("click",()=>select(i,true));
      g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();select(i,true);}});
      nodes.push(g);
    });
    // Frutos visíveis somente para vínculos reais da linha selecionada.
    const fruitLayer=put(scene,"g",{class:"gp-tree-fruits","aria-hidden":"true"});
    function desenharVinculos(i){
      fruitLayer.replaceChildren();
      const dados=branches[i]?.dataset;
      if(!dados)return;
      const categorias=[
        ["projects","P","#d9731f","projetos"],
        ["people","I","#5f9a3e","integrantes"],
        ["publications","C","#be7643","produções"],
        ["theses","T","#51776b","teses e dissertações"]
      ].filter(([id])=>Number(dados[id]||0)>0);
      const [x,y]=positions[i];
      const esquerda=x>570;
      categorias.forEach(([id,letra,cor,nome],j)=>{
        const cx=x+(esquerda?-1:1)*(48+(j%2)*45);
        const cy=y-35+Math.floor(j/2)*49;
        const grupo=put(fruitLayer,"g",{class:"gp-tree-fruit-item"});
        put(grupo,"title",{},dados[id]+" "+nome+" vinculados");
        put(grupo,"circle",{cx,cy,r:18,fill:cor,stroke:"#fff","stroke-width":4});
        put(grupo,"text",{x:cx,y:cy+5,"text-anchor":"middle",class:"gp-tree-fruit-text"},letra);
      });
    }
    canvas.replaceChildren(svg);
    let active=0,scale=1,filter="all";
    const status=document.getElementById("gp-tree-count");
    const empty=document.getElementById("gp-tree-no-results");
    const search=document.getElementById("gp-tree-filter");
    const panelHeading=document.createElement("span");
    panelHeading.className="gp-tree-eyebrow";
    function visible(i){
      const line=branches[i];
      const buscavel=[line.querySelector(".gp-tree-name")?.textContent||"",
        line.querySelector(".gp-tree-body")?.textContent||""].join(" ");
      const matchesQuery=!search?.value||normal(buscavel).includes(normal(search.value));
      const matchesKind=filter!=="linked"||line.dataset.hasLinks==="1";
      return matchesQuery&&matchesKind;
    }
    const normal=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
    function select(i,scroll){
      if(i<0||i>=branches.length||!visible(i))return;
      active=i;
      branches.forEach((line,k)=>{
        const selected=k===i;line.classList.toggle("is-active",selected);
        line.querySelector("button")?.setAttribute("aria-expanded",String(selected));
      });
      nodes.forEach((node,k)=>{node.classList.toggle("is-active",k===i);node.setAttribute("aria-pressed",String(k===i))});
      desenharVinculos(i);
      stems.forEach((stem,k)=>stem.classList.toggle("is-active",k===i));
      const title=document.createElement("h2");title.textContent=branches[i].querySelector(".gp-tree-name")?.textContent||"Linha de pesquisa";
      panelHeading.textContent="GALHO "+String(i+1).padStart(2,"0")+" · PESQUISA";
      const body=branches[i].querySelector(".gp-tree-body")?.cloneNode(true);
      if(body)body.className="gp-tree-detail-body";
      detail.replaceChildren(panelHeading,title,...(body?[body]:[]));
      if(scroll&&window.matchMedia("(max-width:900px)").matches){
        detail.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion:reduce)").matches?"auto":"smooth",block:"nearest"});
      }
    }
    function filterList(){
      let num=0,first=-1;
      branches.forEach((line,i)=>{
        const show=visible(i);
        line.hidden=!show;nodes[i].classList.toggle("is-dimmed",!show);
        if(show){num++;if(first===-1)first=i;}
      });
      if(status)status.textContent=num+" de "+branches.length+" linhas";
      if(empty)empty.hidden=num>0;
      if(first===-1){
        const h=document.createElement("h2");h.textContent="Sem resultados";
        const p=document.createElement("p");p.textContent="Experimente outro tema ou remova o filtro.";
        detail.replaceChildren(h,p);
      }else if(!visible(active))select(first,false);
    }
    const chips=Array.from(document.querySelectorAll("[data-tree-filter]"));
    chips.forEach(chip=>chip.addEventListener("click",()=>{
      filter=chip.dataset.treeFilter||"all";
      chips.forEach(b=>{const chosen=b===chip;b.classList.toggle("is-active",chosen);b.setAttribute("aria-pressed",String(chosen))});
      filterList();
    }));
    search?.addEventListener("input",filterList);
    branches.forEach((b,i)=>b.querySelector("button")?.addEventListener("click",()=>select(i,true)));
    // Ampliação com deslocamento limitado às bordas da imagem.
    // Ao ampliar, o usuário pode arrastar o desenho sem perder os nós laterais.
    let panX=0,panY=0,drag=null;
    function renderZoom(){
      const maxX=(scale-1)*500,maxY=(scale-1)*410;
      panX=Math.max(-maxX,Math.min(maxX,panX));
      panY=Math.max(-maxY,Math.min(maxY,panY));
      scene.setAttribute("transform","translate("+(500-500*scale+panX)+","+(410-410*scale+panY)+") scale("+scale+")");
      svg.classList.toggle("is-zoomed",scale>1);
      document.getElementById("gp-tree-plus")?.toggleAttribute("disabled",scale>=1.6);
      document.getElementById("gp-tree-minus")?.toggleAttribute("disabled",scale<=1);
    }
    function zoom(delta){
      scale=Math.max(1,Math.min(1.6,Math.round((scale+delta)*10)/10));
      if(scale===1){panX=0;panY=0;}
      renderZoom();
    }
    svg.addEventListener("pointerdown",event=>{
      if(scale<=1||event.button!==0||event.target.closest(".gp-tree-node"))return;
      drag={id:event.pointerId,x:event.clientX,y:event.clientY,panX,panY};
      svg.setPointerCapture(event.pointerId);
    });
    svg.addEventListener("pointermove",event=>{
      if(!drag||drag.id!==event.pointerId)return;
      const box=svg.getBoundingClientRect();
      if(!box.width||!box.height)return;
      panX=drag.panX+(event.clientX-drag.x)*1000/box.width;
      panY=drag.panY+(event.clientY-drag.y)*820/box.height;
      renderZoom();
    });
    const stopDrag=event=>{
      if(!drag||drag.id!==event.pointerId)return;
      drag=null;
      if(svg.hasPointerCapture(event.pointerId))svg.releasePointerCapture(event.pointerId);
    };
    svg.addEventListener("pointerup",stopDrag);
    svg.addEventListener("pointercancel",stopDrag);
    document.getElementById("gp-tree-plus")?.addEventListener("click",()=>zoom(.2));
    document.getElementById("gp-tree-minus")?.addEventListener("click",()=>zoom(-.2));
    document.getElementById("gp-tree-reset")?.addEventListener("click",()=>zoom(1-scale));
    list.closest(".gp-tree-shell")?.classList.add("is-ready");
    filterList();select(0,false);zoom(0);

  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ready);else ready();
})();