(() => {
  "use strict";
  const screen = document.getElementById("strategyScreen");
  const canvas = document.getElementById("strategyCanvas");
  const ctx = canvas.getContext("2d");
  const title = document.getElementById("strategyTitle");
  const subtitle = document.getElementById("strategySubtitle");
  const selection = document.getElementById("strategySelection");
  const action = document.getElementById("strategyActionBtn");
  const notice = document.getElementById("strategyNotice");
  const worldBtn = document.getElementById("strategyWorldBtn");
  const baseBtn = document.getElementById("strategyBaseBtn");
  const arenaBtn = document.getElementById("strategyArenaBtn");
  const heroesBtn = document.getElementById("strategyHeroesBtn");
  const view = { mode: "world", zoom: 1, panX: 0, panY: 0, dpr: 1, width: 0, height: 0, drag: null, moved: false, selected: null, lastFrame: 0 };
  const sites = [
    { id:"home", type:"base", name:"Seu Abrigo", tag:"Você · Nv. 1", x:9, y:9, color:"#e5a64c" },
    { id:"ally-a", type:"base", name:"Posto da Aliança", tag:"Aliado · Nv. 4", x:6, y:7, color:"#54b9a7" },
    { id:"ally-b", type:"base", name:"Fortaleza do Norte", tag:"Aliado · Nv. 3", x:12, y:6, color:"#6c9fe8" },
    { id:"enemy-a", type:"enemy", name:"Colosso Mutante", tag:"Ameaça · Nv. 23", x:15, y:12, color:"#d95b56" },
    { id:"enemy-b", type:"enemy", name:"Rastreador Cinzento", tag:"Ameaça · Nv. 18", x:5, y:13, color:"#c97853" },
    { id:"resource-a", type:"resource", name:"Bosque de Madeira", tag:"Recurso · Madeira", x:3, y:5, color:"#80bf70" },
    { id:"resource-b", type:"resource", name:"Veio de Minério", tag:"Recurso · Minério", x:17, y:5, color:"#b6c3d1" },
    { id:"capital", type:"capital", name:"Capital Central", tag:"Território estratégico", x:10, y:3, color:"#d6bb70" }
  ];
  const buildings = [
    {id:"hq",name:"Centro de Comando",x:0,y:0,w:1.8,h:1.8,color:"#d5a45a",desc:"Núcleo do abrigo e evolução da base."},
    {id:"barracks",name:"Quartel",x:-2.2,y:1.1,w:1.35,h:1.3,color:"#769cc4",desc:"Local de preparação das tropas."},
    {id:"workshop",name:"Oficina",x:2.1,y:1.15,w:1.4,h:1.35,color:"#b88b62",desc:"Construções e equipamentos."},
    {id:"farm",name:"Estação de Suprimentos",x:-2.1,y:-1.45,w:1.35,h:1.2,color:"#83b778",desc:"Produção de recursos."},
    {id:"radar",name:"Radar",x:2.15,y:-1.5,w:1.2,h:1.2,color:"#71c4c2",desc:"Exploração e alertas."},
    {id:"hospital",name:"Enfermaria",x:0,y:2.65,w:1.4,h:1.3,color:"#d17d79",desc:"Recuperação e suporte."}
  ];
  let hitTargets = [];
  function resize() {
    const rect = canvas.getBoundingClientRect();
    view.dpr = Math.min(window.devicePixelRatio || 1, 2);
    view.width = Math.max(1, rect.width); view.height = Math.max(1, rect.height);
    canvas.width = Math.round(view.width * view.dpr); canvas.height = Math.round(view.height * view.dpr);
    ctx.setTransform(view.dpr,0,0,view.dpr,0,0);
    draw();
  }
  function project(x,y,z=0) {
    if (view.mode === "base") {
      const scale = Math.min(view.width/760, view.height/570) * view.zoom;
      return {x:view.width*.5 + (x-y)*39*scale + view.panX,y:view.height*.47 + (x+y)*21*scale - z*scale + view.panY,scale};
    }
    const scale = Math.min(view.width/900,view.height/650)*view.zoom;
    return {x:view.width*.5+(x-y)*26*scale+view.panX,y:view.height*.42+(x+y)*14*scale+view.panY,scale};
  }
  function polygon(points,fill,stroke) {
    ctx.beginPath(); points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)); ctx.closePath();
    ctx.fillStyle=fill; ctx.fill(); if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}
  }
  function drawIsoTile(x,y,fill) {
    const p=project(x,y); const s=p.scale;
    polygon([{x:p.x,y:p.y},{x:p.x+26*s,y:p.y+14*s},{x:p.x,y:p.y+28*s},{x:p.x-26*s,y:p.y+14*s}],fill,"#12251d55");
  }
  function drawTree(x,y,seed=0) {
    const p=project(x,y); const s=p.scale; const h=(16+(seed%4)*3)*s;
    ctx.fillStyle="#493d2d";ctx.fillRect(p.x-2*s,p.y-h*.25,4*s,h*.5);
    polygon([{x:p.x,y:p.y-h},{x:p.x+9*s,y:p.y-h*.42},{x:p.x+5*s,y:p.y-h*.25},{x:p.x+11*s,y:p.y},{x:p.x-11*s,y:p.y},{x:p.x-5*s,y:p.y-h*.25},{x:p.x-9*s,y:p.y-h*.42}],"#286348","#173f32");
    ctx.fillStyle="#4e9460";ctx.beginPath();ctx.arc(p.x-3*s,p.y-h*.62,4*s,0,Math.PI*2);ctx.fill();
  }
  function drawRock(x,y,seed=0) {
    const p=project(x,y); const s=p.scale;
    polygon([{x:p.x-11*s,y:p.y},{x:p.x-7*s,y:p.y-12*s},{x:p.x+1*s,y:p.y-17*s},{x:p.x+11*s,y:p.y-5*s},{x:p.x+10*s,y:p.y+2*s}],seed%2?"#697b7d":"#68717c","#35424b");
    polygon([{x:p.x-7*s,y:p.y-12*s},{x:p.x+1*s,y:p.y-17*s},{x:p.x+4*s,y:p.y-7*s}], "#a1afb0");
  }
  function drawMarch(a,b,color,offset) {
    const p1=project(a.x,a.y),p2=project(b.x,b.y);
    ctx.save();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.setLineDash([5,5]);ctx.lineDashOffset=-offset;
    ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.stroke();ctx.restore();
    const t=(offset%80)/80; const x=p1.x+(p2.x-p1.x)*t,y=p1.y+(p2.y-p1.y)*t;
    ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,3.5,0,Math.PI*2);ctx.fill();
  }
  function drawSite(site,now) {
    const p=project(site.x,site.y);const s=p.scale;hitTargets.push({x:p.x,y:p.y,r:25*s,site});
    if(site.type==="base"||site.type==="capital"){
      polygon([{x:p.x,y:p.y-18*s},{x:p.x+22*s,y:p.y-6*s},{x:p.x+22*s,y:p.y+14*s},{x:p.x,y:p.y+26*s},{x:p.x-22*s,y:p.y+14*s},{x:p.x-22*s,y:p.y-6*s}],site.type==="capital"?"#9b7442":"#4d6470","#c8d5d8");
      polygon([{x:p.x-23*s,y:p.y-7*s},{x:p.x,y:p.y-20*s},{x:p.x+23*s,y:p.y-7*s},{x:p.x,y:p.y+6*s}],site.color,"#f0dfb3");
      ctx.fillStyle="#f6f1dc";ctx.fillRect(p.x-4*s,p.y+1*s,8*s,12*s);
      if(site.id==="home"){ctx.strokeStyle="#f4c56c";ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,29*s,0,Math.PI*2);ctx.stroke();}
    } else if(site.type==="enemy") {
      ctx.fillStyle=site.color;ctx.beginPath();ctx.arc(p.x,p.y,15*s,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#ffd7c5";ctx.stroke();
      ctx.fillStyle="#fff";ctx.font=`bold ${Math.max(9,11*s)}px system-ui`;ctx.textAlign="center";ctx.fillText("!",p.x,p.y+4*s);
      ctx.fillStyle="#df4d48";ctx.fillRect(p.x-18*s,p.y-23*s,36*s,4*s);ctx.fillStyle="#6d292b";ctx.fillRect(p.x-18*s,p.y-23*s,27*s,4*s);
    } else {
      ctx.fillStyle=site.color;ctx.beginPath();ctx.arc(p.x,p.y,12*s,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#eaf2df";ctx.stroke();
      ctx.fillStyle="#12211b";ctx.font=`bold ${Math.max(10,14*s)}px system-ui`;ctx.textAlign="center";ctx.fillText(site.type==="resource"?"＋":"★",p.x,p.y+5*s);
    }
    if(view.selected?.id===site.id){ctx.strokeStyle="#f5d785";ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,31*s,0,Math.PI*2);ctx.stroke();}
    ctx.textAlign="center";ctx.font=`600 ${Math.max(9,11*s)}px system-ui`;ctx.fillStyle="#f6f8ed";ctx.strokeStyle="#17241f";ctx.lineWidth=3;
    ctx.strokeText(site.name,p.x,p.y+38*s);ctx.fillText(site.name,p.x,p.y+38*s);
  }
  function drawWorld(now) {
    const bg=ctx.createLinearGradient(0,0,0,view.height);bg.addColorStop(0,"#244a3a");bg.addColorStop(1,"#122b25");ctx.fillStyle=bg;ctx.fillRect(0,0,view.width,view.height);
    for(let y=0;y<20;y++)for(let x=0;x<20;x++){
      const v=(x*7+y*11)%9;drawIsoTile(x,y,v<2?"#315b43":v<6?"#2b533e":"#356448");
    }
    for(let i=0;i<75;i++){const x=(i*7+3)%20,y=(i*11+2)%20;if(!sites.some(s=>Math.abs(s.x-x)<1&&Math.abs(s.y-y)<1))drawTree(x,y,i);}
    [[2,2],[4,11],[8,2],[13,3],[18,9],[18,15],[2,16],[10,16]].forEach((p,i)=>drawRock(p[0],p[1],i));
    drawMarch(sites[0],sites[1],"#53d7a1",now/85);drawMarch(sites[0],sites[3],"#66b9ff",now/100);drawMarch(sites[1],sites[7],"#53d7a1",now/115);
    sites.forEach(site=>drawSite(site,now));
    ctx.textAlign="left";ctx.fillStyle="#e5f1df";ctx.font="700 12px system-ui";ctx.fillText("SETOR NORTE · REGIÃO 01",16,view.height-20);
  }
  function drawBuilding(b) {
    const p=project(b.x,b.y);const s=p.scale;const w=b.w*18*s,h=b.h*15*s;
    hitTargets.push({x:p.x,y:p.y-9*s,r:Math.max(w,h)*.7,b});
    polygon([{x:p.x-w/2,y:p.y},{x:p.x,y:p.y+10*s},{x:p.x+w/2,y:p.y},{x:p.x,y:p.y-10*s}], "#566b62","#a4b6a7");
    polygon([{x:p.x-w/2,y:p.y-1*s},{x:p.x-w/2,y:p.y-h},{x:p.x,y:p.y-h+10*s},{x:p.x,y:p.y+10*s}], b.color,"#d8c9a7");
    polygon([{x:p.x,y:p.y-h+10*s},{x:p.x+w/2,y:p.y-h},{x:p.x+w/2,y:p.y-1*s},{x:p.x,y:p.y+10*s}], "#475b58","#c6d1c0");
    polygon([{x:p.x-w/2,y:p.y-h},{x:p.x,y:p.y-h-12*s},{x:p.x+w/2,y:p.y-h}], "#b6a27b","#f0dfbd");
    ctx.fillStyle="#fff7df";ctx.font=`600 ${Math.max(9,11*s)}px system-ui`;ctx.textAlign="center";ctx.fillText(b.name,p.x,p.y+23*s);
    if(view.selected?.id===b.id){ctx.strokeStyle="#f5d785";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y,Math.max(w,h)*.65,Math.max(w,h)*.28,0,0,Math.PI*2);ctx.stroke();}
  }
  function drawBase() {
    const bg=ctx.createLinearGradient(0,0,0,view.height);bg.addColorStop(0,"#345844");bg.addColorStop(1,"#182e28");ctx.fillStyle=bg;ctx.fillRect(0,0,view.width,view.height);
    for(let y=-5;y<=5;y++)for(let x=-5;x<=5;x++)drawIsoTile(x,y,(x+y)%3===0?"#496d4c":"#3c6045");
    for(let i=0;i<22;i++)drawTree((i%7)-3,Math.floor(i/7)-3,i+2);
    // Main roads through the shelter.
    const roadA=project(-4,0),roadB=project(4,0),roadC=project(0,-4),roadD=project(0,4);
    ctx.strokeStyle="#bba77a";ctx.lineWidth=Math.max(8,13*roadA.scale);ctx.beginPath();ctx.moveTo(roadA.x,roadA.y);ctx.lineTo(roadB.x,roadB.y);ctx.moveTo(roadC.x,roadC.y);ctx.lineTo(roadD.x,roadD.y);ctx.stroke();
    buildings.forEach(drawBuilding);
    ctx.textAlign="left";ctx.fillStyle="#edf6e6";ctx.font="700 12px system-ui";ctx.fillText("ABRIGO · ZONA SEGURA",16,view.height-20);
  }
  function draw(now=0) {
    if(!view.width||!view.height)return;
    ctx.setTransform(view.dpr,0,0,view.dpr,0,0);hitTargets=[];
    if(view.mode==="world")drawWorld(now);else drawBase();
  }
  function setMode(mode) {
    view.mode=mode;view.selected=null;view.zoom=1;view.panX=0;view.panY=0;
    screen.hidden=false;screen.dataset.mode=mode;
    title.textContent=mode==="world"?"Mapa do Mundo":"Seu Abrigo";
    subtitle.textContent=mode==="world"?"Territórios · recursos · ameaças":"Toque em uma construção para ver detalhes";
    selection.textContent=mode==="world"?"Toque em uma base, recurso ou ameaça. Arraste para explorar o mapa.":"Toque em um edifício para selecionar.";
    action.textContent=mode==="world"?"Preparar marcha":"Ver detalhes";
    worldBtn.classList.toggle("active",mode==="world");baseBtn.classList.toggle("active",mode==="base");
    draw(performance.now());
  }
  function show(mode) { setMode(mode); }
  function hide() { screen.hidden=true; view.mode="world"; }
  function selectTarget(target) {
    if(target.site){view.selected=target.site;selection.textContent=target.site.name+" — "+target.site.tag;action.textContent=target.site.type==="base"||target.site.type==="capital"?"Ver território":"Preparar marcha";}
    else if(target.b){view.selected=target.b;selection.textContent=target.b.name+" — "+target.b.desc;action.textContent="Ver detalhes";}
    draw(performance.now());
  }
  canvas.addEventListener("pointerdown",e=>{canvas.setPointerCapture(e.pointerId);view.drag={x:e.clientX,y:e.clientY,px:view.panX,py:view.panY};view.moved=false;});
  canvas.addEventListener("pointermove",e=>{if(!view.drag)return;const dx=e.clientX-view.drag.x,dy=e.clientY-view.drag.y;if(Math.abs(dx)+Math.abs(dy)>6)view.moved=true;if(view.moved){view.panX=view.drag.px+dx;view.panY=view.drag.py+dy;draw(performance.now());}});
  canvas.addEventListener("pointerup",e=>{if(!view.drag)return;const moved=view.moved;view.drag=null;if(moved)return;const rect=canvas.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;let nearest=null,dist=Infinity;for(const t of hitTargets){const d=Math.hypot(t.x-x,t.y-y);if(d<t.r&&d<dist){nearest=t;dist=d;}}if(nearest)selectTarget(nearest);});
  canvas.addEventListener("pointercancel",()=>{view.drag=null;});
  canvas.addEventListener("wheel",e=>{e.preventDefault();view.zoom=Math.max(.65,Math.min(1.8,view.zoom*(e.deltaY<0?1.08:.92)));draw(performance.now());},{passive:false});
  worldBtn.addEventListener("click",()=>show("world"));baseBtn.addEventListener("click",()=>show("base"));arenaBtn.addEventListener("click",hide);
  heroesBtn.addEventListener("click",()=>{notice.textContent="Painel de heróis: use o botão Herói da arena após retornar. Integração com esta tela será feita em uma etapa própria.";});
  action.addEventListener("click",()=>{if(!view.selected){notice.textContent="Selecione primeiro um ponto no mapa.";return;}notice.textContent=view.mode==="world"?"Destino selecionado: "+(view.selected.name||"local")+". A marcha visual é demonstrativa; ainda não envia tropas ao servidor.":"Edifício selecionado: "+view.selected.name+". Melhorias e custos serão conectados numa próxima etapa.";});
  function frame(now){if(!screen.hidden&&view.mode==="world"){draw(now);view.lastFrame=now;}requestAnimationFrame(frame);}
  window.addEventListener("resize",resize);
  window.addEventListener("keydown",e=>{if(e.key==="Escape"&&!screen.hidden)hide();});
  window.IWStrategyMap={openWorld:()=>show("world"),openBase:()=>show("base"),close:hide};
  resize();requestAnimationFrame(frame);
})();