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
    const NS="http://www.w3.org/2000/svg";
    const SVG=(tag,attrs={},text)=>{const e=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,String(v)));if(text!==undefined)e.textContent=text;return e};
    const put=(parent,tag,attrs={},text)=>{const e=SVG(tag,attrs,text);parent.appendChild(e);return e};
    const svg=SVG("svg",{viewBox:"0 0 1200 820",class:"gp-tree-svg gp-tree-v35",role:"group","aria-label":"Árvore interativa do GPENSC com "+branches.length+" linhas de pesquisa"});
    const defs=put(svg,"defs");
    const grad=put(defs,"linearGradient",{id:"gt35-bark",x1:"0",y1:"0",x2:"1",y2:"0"});
    [["0%","#67391f"],["42%","#a96b36"],["72%","#82502a"],["100%","#59371f"]].forEach(([offset,color])=>put(grad,"stop",{offset,"stop-color":color}));
    const land=put(defs,"linearGradient",{id:"gt35-earth",x1:"0",y1:"0",x2:"0",y2:"1"});
    [["0%","#b57744"],["100%","#714327"]].forEach(([offset,color])=>put(land,"stop",{offset,"stop-color":color}));
    const halo=put(defs,"filter",{id:"gt35-soft",x:"-60%",y:"-65%",width:"220%",height:"230%"});
    put(halo,"feDropShadow",{dx:0,dy:5,stdDeviation:7,"flood-color":"#23472a","flood-opacity":".17"});
    const scene=put(svg,"g",{class:"gp-tree-scene"});
    put(scene,"rect",{x:0,y:0,width:1200,height:820,fill:"#f9fbf3"});
    put(scene,"circle",{cx:1024,cy:145,r:102,fill:"#eaf2d3",opacity:.5});
    put(scene,"path",{d:"M0 647 Q180 575 357 651 Q557 558 751 644 Q950 565 1200 629 V820 H0 Z",fill:"#e3efdc"});
    put(scene,"path",{d:"M0 709 Q240 650 417 699 Q640 650 838 700 Q1010 663 1200 710 V820 H0 Z",fill:"#c9dfbd"});
    put(scene,"path",{d:"M0 747 Q250 714 479 736 Q756 698 1200 736 V820 H0 Z",fill:"#a6ca98",opacity:.68});
    const skyline=put(scene,"g",{opacity:.22,stroke:"#639868","stroke-width":3,fill:"none"});
    put(skyline,"path",{d:"M86 654V585H116V654 M100 585V553H111V585M81 585H121M85 605h32M85 624h32M165 650V566H188V650M177 566v-32M161 566h31M976 647V582H1006V647M994 582v-31M970 582h42M1037 649V596H1066V649M1053 596v-24"});
    put(scene,"ellipse",{cx:605,cy:734,rx:340,ry:46,fill:"#a0b78b",opacity:.29});
    // Wood first, behind the canopy: a broad grown trunk and asymmetric branches.
    const branchLayer=put(scene,"g",{class:"gp-tree-wood"});
    const limbTips=[
      {x:222,y:340},{x:398,y:250},{x:600,y:186},
      {x:802,y:250},{x:982,y:340}
    ];
    limbTips.forEach((tip,i)=>{
      const mid=590+(tip.x-600)*.31;
      put(branchLayer,"path",{d:"M598 568 C"+mid+" 445 "+(tip.x+(600-tip.x)*.24)+" "+(tip.y+104)+" "+tip.x+" "+tip.y,
        fill:"none",stroke:"#794b28","stroke-width":i===2?33:27,"stroke-linecap":"round",class:"gp-tree-limb"});
      put(branchLayer,"path",{d:"M600 561 C"+mid+" 449 "+(tip.x+(600-tip.x)*.24)+" "+(tip.y+104)+" "+tip.x+" "+tip.y,
        fill:"none",stroke:"#b57d47","stroke-width":i===2?10:8,"stroke-linecap":"round",opacity:.75});
    });
    put(branchLayer,"path",{d:"M551 724 C558 655 567 579 569 498 Q589 482 604 501 Q630 482 642 503 C635 569 647 651 667 724 Z",fill:"url(#gt35-bark)",stroke:"#704325","stroke-width":5});
    put(branchLayer,"path",{d:"M592 529 C586 602 581 663 594 714 M619 531 C610 600 624 673 626 718 M563 620 Q592 645 603 621",fill:"none",stroke:"#d09b63","stroke-width":6,"stroke-linecap":"round",opacity:.52});
    // Each canopy is irregular: distinct layered foliage, not five solid circles.
    const canopy=put(scene,"g",{class:"gp-tree-canopies"});
    const colors=["#3f7f35","#569d45","#77b550","#8ac45d","#a4cc6a","#669e46","#b5d77c","#4f913d"];
    const rnd=(n)=>((Math.sin(n*173.93+41.27)*44593.137)%1+1)%1;
    limbTips.forEach((tip,k)=>{
      const group=put(canopy,"g",{"data-canopy":k});
      for(let i=0;i<24;i++){
        const angle=2*Math.PI*i/24;
        const radial=68+40*rnd(k*200+i+2);
        const x=tip.x+Math.cos(angle)*radial;
        const y=tip.y-55+Math.sin(angle)*radial*.68;
        put(group,"ellipse",{cx:x.toFixed(1),cy:y.toFixed(1),rx:(45+15*rnd(i*5+k)).toFixed(1),ry:(31+18*rnd(i*7+k)).toFixed(1),fill:colors[(i+k*3)%colors.length],opacity:.89,
          transform:"rotate("+((i*17+k*9)%75-35)+" "+x+" "+y+")"});
      }
      for(let i=0;i<19;i++){
        const a=2*Math.PI*rnd(k*100+i+300),radius=25+110*rnd(k*90+i+150);
        const x=tip.x+Math.cos(a)*radius,y=tip.y-55+Math.sin(a)*radius*.75;
        const rad=8+7*rnd(i+k*29);
        put(group,"path",{d:"M"+(x-rad)+" "+y+" Q"+x+" "+(y-rad*2)+" "+(x+rad)+" "+y+" Q"+x+" "+(y+rad*1.5)+" "+(x-rad)+" "+y+"Z",
          fill:colors[(i+3*k+2)%colors.length],stroke:"#387036","stroke-width":.8,opacity:.77,
          transform:"rotate("+((i*39)%120-60)+" "+x+" "+y+")"});
      }
      for(let i=0;i<5;i++){
        const a=2*Math.PI*rnd(k*15+i+52),rr=36+85*rnd(k*17+i+92);
        put(group,"circle",{cx:(tip.x+Math.cos(a)*rr).toFixed(1),cy:(tip.y-55+Math.sin(a)*rr*.7).toFixed(1),r:(8+4*rnd(i+k*9)).toFixed(1),
          fill:i%3===0?"#e79d27":"#f0b34b",stroke:"#f6df9e","stroke-width":2,class:"gp-tree-fruit"});
      }
    });
    // The root network is visible below the soil line.
    put(scene,"path",{d:"M0 742 Q325 701 605 728 Q895 700 1200 739 V820 H0Z",fill:"url(#gt35-earth)"});
    const roots=[
      "M592 712 C525 733 450 760 343 807",
      "M600 712 C548 752 529 773 512 820",
      "M605 714 C626 763 653 788 685 820",
      "M625 710 C704 738 791 758 858 815",
      "M573 722 C512 735 470 741 430 744",
      "M642 720 C706 729 764 732 803 746"
    ];
    roots.forEach((d,i)=>put(scene,"path",{d,fill:"none",stroke:i%2?"#d19a61":"#85512b","stroke-width":i<4?15:8,"stroke-linecap":"round",opacity:.89}));
    put(scene,"path",{d:"M0 743 Q319 701 603 731 Q901 699 1200 744",fill:"none",stroke:"#7eaf65","stroke-width":12});
    for(let i=0;i<50;i++){
      const x=26+i*24,y=735+11*Math.sin(i*1.9);
      put(scene,"path",{d:"M"+x+" "+y+" q-7 -12 -8 -18 M"+x+" "+y+" q8 -12 10 -18",stroke:i%2?"#598849":"#6eaa58","stroke-width":3,fill:"none","stroke-linecap":"round",opacity:.75});
    }
    // Logo at the base: group as trunk, linked to research, teaching and extension.
    const plaque=put(scene,"g",{filter:"url(#gt35-soft)"});
    put(plaque,"rect",{x:510,y:587,width:185,height:85,rx:22,fill:"#17492d",stroke:"#f5dfb9","stroke-width":5});
    put(plaque,"text",{x:602,y:621,"text-anchor":"middle",class:"gp-tree-plaque-main"},"GPENSC");
    put(plaque,"text",{x:602,y:643,"text-anchor":"middle",class:"gp-tree-plaque-caption"},"PESQUISA · ENSINO");
    put(plaque,"text",{x:602,y:660,"text-anchor":"middle",class:"gp-tree-plaque-caption"},"EXTENSÃO");
    put(scene,"text",{x:170,y:786,"text-anchor":"middle",class:"gp-tree-root-label"},"FUNDAMENTOS");
    put(scene,"text",{x:602,y:800,"text-anchor":"middle",class:"gp-tree-root-label"},"TRABALHO COLETIVO");
    put(scene,"text",{x:1010,y:786,"text-anchor":"middle",class:"gp-tree-root-label"},"COMPROMISSO SOCIAL");
    // All real research lines become selectable leaves with numbered fruit badges.
    const nodes=[],stems=[],positions=[];
    const grouping=Math.min(5,Math.ceil(branches.length/4));
    const centers=grouping===5?limbTips:grouping===4?[limbTips[0],limbTips[1],limbTips[3],limbTips[4]]:grouping===3?[limbTips[0],limbTips[2],limbTips[4]]:grouping===2?[limbTips[1],limbTips[3]]:[limbTips[2]];
    const quantities=Array.from({length:grouping},(_,k)=>Math.floor(branches.length/grouping)+(k<branches.length%grouping?1:0));
    let globalIndex=0;
    centers.forEach((center,k)=>{
      const count=quantities[k];
      for(let j=0;j<count;j++){
        // Nodes spread across the top and sides without overlapping their fruit neighbors.
        const angle=(-140+(280*(j+.5)/count))*Math.PI/180;
        const x=center.x+Math.sin(angle)*109;
        const y=center.y-55-Math.cos(angle)*75;
        const idx=globalIndex++;
        positions[idx]={x,y,cluster:k};
        const stem=put(scene,"path",{d:"M"+center.x+" "+(center.y+5)+" Q"+((center.x+x)/2)+" "+(y+54)+" "+x+" "+y,
          class:"gp-tree-twig",fill:"none",stroke:"#467d38","stroke-width":5,"stroke-linecap":"round",opacity:.9});
        stems.push(stem);
      }
    });
    positions.forEach((pos,i)=>{
      const name=branches[i].querySelector(".gp-tree-name")?.textContent?.trim()||"Linha "+(i+1);
      const g=put(scene,"g",{class:"gp-tree-node",role:"button",tabindex:0,"aria-label":"Linha "+(i+1)+": "+name,"aria-pressed":"false"});
      put(g,"title",{},name);
      put(g,"circle",{cx:pos.x,cy:pos.y,r:32,class:"gp-tree-node-ring",filter:"url(#gt35-soft)"});
      put(g,"circle",{cx:pos.x,cy:pos.y,r:25,class:"gp-tree-node-center"});
      put(g,"text",{x:pos.x,y:pos.y+6,"text-anchor":"middle",class:"gp-tree-node-number"},String(i+1).padStart(2,"0"));
      g.addEventListener("click",()=>select(i,true));
      g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();select(i,true)}});
      nodes.push(g);
    });
    canvas.replaceChildren(svg);
    let active=0,scale=1,filter="all";
    const status=document.getElementById("gp-tree-count");
    const empty=document.getElementById("gp-tree-no-results");
    const search=document.getElementById("gp-tree-filter");
    const panelHeading=document.createElement("span");
    panelHeading.className="gp-tree-eyebrow";
    function visible(i){
      const line=branches[i];
      const matchesQuery=!search?.value||normal(line.querySelector(".gp-tree-name")?.textContent||"").includes(normal(search.value));
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
    function zoom(delta){
      scale=Math.max(1,Math.min(1.8,Math.round((scale+delta)*10)/10));
      scene.setAttribute("transform","translate("+(600-600*scale)+","+(420-420*scale)+") scale("+scale+")");
      document.getElementById("gp-tree-plus")?.toggleAttribute("disabled",scale>=1.8);
      document.getElementById("gp-tree-minus")?.toggleAttribute("disabled",scale<=1);
    }
    document.getElementById("gp-tree-plus")?.addEventListener("click",()=>zoom(.2));
    document.getElementById("gp-tree-minus")?.addEventListener("click",()=>zoom(-.2));
    document.getElementById("gp-tree-reset")?.addEventListener("click",()=>zoom(1-scale));
    list.closest(".gp-tree-shell")?.classList.add("is-ready");
    filterList();select(0,false);zoom(0);
    const scrollArea=canvas.closest(".gp-tree-scroll");
    if(scrollArea&&window.matchMedia("(max-width:900px)").matches){
      scrollArea.scrollLeft=(scrollArea.scrollWidth-scrollArea.clientWidth)/2;
    }
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ready);else ready();
})();