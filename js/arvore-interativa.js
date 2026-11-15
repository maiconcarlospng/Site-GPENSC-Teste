/* Árvore do GPENSC — cria SVG sobre dados reais renderizados pelo Quarto. */
(function () {
  "use strict";
  function start() {
    var list=document.getElementById("gp-tree-branches");
    var canvas=document.getElementById("gp-tree-canvas");
    var detail=document.getElementById("gp-tree-detail");
    if (!list || !canvas || !detail) return;
    var branches=Array.from(list.querySelectorAll(".gp-tree-branch"));
    if (!branches.length) return;
    var ns="http://www.w3.org/2000/svg", scale=1, active=0;
    var nodes=[], twigs=[], limbs=[], positions=[], scene;
    function el(tag,attrs,text) {
      var e=document.createElementNS(ns,tag);
      Object.keys(attrs||{}).forEach(function(k){e.setAttribute(k,String(attrs[k]));});
      if (text!==undefined) e.textContent=text;
      return e;
    }
    function put(parent,tag,attrs,text) {
      var e=el(tag,attrs,text);parent.appendChild(e);return e;
    }
    var svg=el("svg",{viewBox:"0 0 1200 750",class:"gp-tree-svg",
      role:"group","aria-label":"Árvore com "+branches.length+" linhas de pesquisa"});
    scene=put(svg,"g",{class:"gp-tree-scene"});
    put(scene,"path",{d:"M600 680 C565 566 575 478 600 409 C627 475 640 573 600 680 Z",class:"gp-tree-trunk"});
    put(scene,"path",{d:"M595 680 C534 703 466 702 422 729 M605 680 C668 704 735 700 783 729 M600 683 L600 738",
      class:"gp-tree-ground-roots"});
    var clusters=Math.min(5,Math.ceil(branches.length/3));
    var base=Math.floor(branches.length/clusters), extra=branches.length%clusters;
    for(var c=0;c<clusters;c++){
      var count=base+(c<extra?1:0);
      var hx=clusters===1?600:130+c*940/(clusters-1),hy=385+Math.abs(c-(clusters-1)/2)*12;
      put(scene,"ellipse",{cx:hx,cy:218,rx:count>=4?146:132,ry:155,class:"gp-tree-canopy canopy-"+(c%3)});
      var limb=put(scene,"path",{d:"M600 448 C"+(600+(hx-600)*.28)+" 365 "+(hx+(600-hx)*.18)+" 466 "+hx+" "+hy,class:"gp-tree-limb"});
      limbs.push(limb);
      for(var j=0;j<count;j++){
        var x=hx+(j-(count-1)/2)*74;
        var y=150+(j%2===0?67:0)+(c%2)*10;
        positions.push({x:x,y:y,hx:hx,hy:hy,cluster:c});
      }
    }
    positions.forEach(function(p){
      twigs.push(put(scene,"path",{d:"M"+p.hx+" "+p.hy+" C"+p.hx+" "+(p.hy-125)+" "+p.x+" "+(p.y+110)+" "+p.x+" "+p.y,class:"gp-tree-twig"}));
    });
    positions.forEach(function(p,i){
      var name=branches[i].querySelector(".gp-tree-name").textContent;
      var g=put(scene,"g",{class:"gp-tree-node",role:"button",tabindex:0,
        "aria-label":"Ramo "+(i+1)+": "+name,"aria-pressed":"false"});
      put(g,"title",{},name);
      put(g,"circle",{cx:p.x,cy:p.y,r:35,class:"gp-tree-halo"});
      put(g,"path",{d:"M"+(p.x-21)+" "+(p.y+14)+" C"+(p.x-39)+" "+(p.y-16)+" "+(p.x-10)+" "+(p.y-32)+" "+p.x+" "+(p.y-23)+
        " C"+(p.x+26)+" "+(p.y-35)+" "+(p.x+39)+" "+(p.y-5)+" "+(p.x+20)+" "+(p.y+15)+
        " Q"+p.x+" "+(p.y+31)+" "+(p.x-21)+" "+(p.y+14),class:"gp-tree-leaf"});
      put(g,"text",{x:p.x,y:p.y+6,"text-anchor":"middle",class:"gp-tree-leaf-text"},String(i+1).padStart(2,"0"));
      g.addEventListener("click",function(){select(i);});
      g.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();select(i);}});
      nodes.push(g);
    });
    put(scene,"text",{x:600,y:628,"text-anchor":"middle",class:"gp-tree-trunk-text"},"GPENSC");
    put(scene,"text",{x:600,y:650,"text-anchor":"middle",class:"gp-tree-trunk-caption"},"PESQUISA · ENSINO · EXTENSÃO");
    put(scene,"text",{x:387,y:730,"text-anchor":"middle",class:"gp-tree-root-text"},"PESQUISA");
    put(scene,"text",{x:600,y:730,"text-anchor":"middle",class:"gp-tree-root-text"},"ENSINO");
    put(scene,"text",{x:813,y:730,"text-anchor":"middle",class:"gp-tree-root-text"},"EXTENSÃO");
    canvas.appendChild(svg);
    function select(i){
      if(i<0||i>=branches.length)return;
      active=i;
      branches.forEach(function(b,j){
        b.classList.toggle("is-active",i===j);
        b.querySelector("button").setAttribute("aria-expanded",i===j?"true":"false");
      });
      nodes.forEach(function(n,j){n.classList.toggle("is-active",i===j);n.setAttribute("aria-pressed",i===j?"true":"false");});
      twigs.forEach(function(t,j){t.classList.toggle("is-active",i===j);});
      limbs.forEach(function(l,j){l.classList.toggle("is-active",j===positions[i].cluster);});
      var eyebrow=document.createElement("span");eyebrow.className="gp-tree-eyebrow";eyebrow.textContent="LINHA "+String(i+1).padStart(2,"0");
      var heading=document.createElement("h2");heading.textContent=branches[i].querySelector(".gp-tree-name").textContent;
      var body=branches[i].querySelector(".gp-tree-body").cloneNode(true);body.className="gp-tree-detail-body";
      detail.replaceChildren(eyebrow,heading,body);
    }
    function zoom(delta){
      scale=Math.min(2.2,Math.max(1,Math.round((scale+delta)*10)/10));
      scene.setAttribute("transform","translate("+(600-600*scale)+","+(450-450*scale)+") scale("+scale+")");
    }
    document.getElementById("gp-tree-plus").addEventListener("click",function(){zoom(.2);});
    document.getElementById("gp-tree-minus").addEventListener("click",function(){zoom(-.2);});
    document.getElementById("gp-tree-reset").addEventListener("click",function(){zoom(1-scale);});
    branches.forEach(function(b,i){b.querySelector("button").addEventListener("click",function(){select(i);});});
    var search=document.getElementById("gp-tree-filter"),empty=document.getElementById("gp-tree-no-results");
    function normal(text){return String(text||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();}
    search.addEventListener("input",function(){
      var query=normal(search.value.trim()),first=-1;
      branches.forEach(function(b,i){
        var found=!query||normal(b.querySelector(".gp-tree-name").textContent).indexOf(query)!==-1;
        b.hidden=!found;
        nodes[i].classList.toggle("is-dimmed",!found);
        if(found&&first===-1)first=i;
      });
      empty.hidden=first!==-1;
      if(first!==-1&&branches[active].hidden)select(first);
    });
    list.closest(".gp-tree-shell").classList.add("is-ready");
    select(0);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();
