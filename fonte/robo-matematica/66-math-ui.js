/* ===== Matemática do Bip: cenários, ícones, placas e números no tabuleiro (só aparecem nas fases de matemática) ===== */
Object.assign(ICONS,{
 calc:'<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8h3M9.5 6.5v3M13 8h3M8 14.5l3 3M11 14.5l-3 3M13 15h3M13 18h3"/>',
 axes:'<path d="M12 3v18M3 12h18M9 6l3-3 3 3M18 9l3 3-3 3"/><circle cx="16" cy="7" r="1.6"/>',
 pow:'<path d="M4 19l6-12 6 12M6.5 14h7"/><path d="M16 5.5a2 2 0 1 1 3.4 1.5L16 10h4"/>',
 func:'<path d="M3 20h18M4 3v17"/><path d="M5 17c4 0 5-11 9-11 3 0 4 4 6 4"/>'});
/* Cenários novos (variações dos que já existem) */
Object.assign(THEMES,{
 caderno:{...THEMES.oficina,tint:[0xf4f6fb,0xe6ebf5],rim:0x2f6db5,label:"#1f3a63",bg:0xd9cdb6},
 quadro:{...THEMES.lousa,tint:[0x35506e,0x2e4762],rim:0x6b4a2e,bg:0xcdbfa6},
 lab:{...THEMES.fabrica,tint:[0x7d6bc4,0x6f5db6],rim:0x3e3a5a,bg:0xc9c3dd},
 observatorio:{...THEMES.torre,tint:[0x2f8f88,0x287e78],rim:0x1d4f5a,bg:0x14284a}});
const MCOL={op:"#ffffff",ini:"#fff7d6",anota:"#e8fff1"};
const enc=t=>encodeURIComponent(t);
/* Desenhos das casas: plaquinha com a conta, número anotado e placa da porta */
Object.assign(DRAW,{
 mop(g,s,txt,kind){txt=decodeURIComponent(txt);const pad=s*.12,w=s-pad*2;g.fillStyle=kind=="anota"?"rgba(31,157,85,.92)":"rgba(28,40,64,.9)";
  g.beginPath();g.roundRect(pad,pad+s*.12,w,w-s*.24,s*.1);g.fill();g.strokeStyle="rgba(255,255,255,.85)";g.lineWidth=s*.025;g.stroke();
  g.fillStyle="#fff";g.textAlign="center";g.textBaseline="middle";let f=s*.36;g.font=`800 ${f}px 'Baloo 2', system-ui, sans-serif`;
  while(g.measureText(txt).width>w*.86&&f>s*.12){f-=4;g.font=`800 ${f}px 'Baloo 2', system-ui, sans-serif`}g.fillText(txt,s/2,s/2+f*.06)},
 msign(g,s,txt,ok){txt=decodeURIComponent(txt);const words=txt.split(" "),lines=[];let cur="";g.font=`700 ${s*.12}px 'Baloo 2', system-ui, sans-serif`;
  for(const w of words){const t=cur?cur+" "+w:w;if(g.measureText(t).width>s*.84&&cur){lines.push(cur);cur=w}else cur=t}lines.push(cur);
  const lh=s*.13,h=lines.length*lh+s*.1,y0=s/2-h/2;g.fillStyle=ok=="1"?"rgba(31,140,80,.95)":"rgba(150,40,40,.95)";g.beginPath();g.roundRect(s*.04,y0,s*.92,h,s*.05);g.fill();
  g.fillStyle="#fff";g.textAlign="center";g.textBaseline="middle";lines.forEach((l,i)=>g.fillText(l,s/2,y0+s*.05+lh*(i+.5)))}});
/* Monta as peças de matemática no tabuleiro (chamado em buildStatic) */
function mathScene(S,th){const L=LEVELS[lvl];G.mdoors=[];
 const tile=(k,txt,kind)=>{const [r,c]=k.split(",").map(Number);mesh(new T.PlaneGeometry(.92,.92),MB({map:canvasTex("mop:"+enc(txt)+":"+kind),transparent:true,depthWrite:false}),X(c),.009,Z(r),{rx:-Math.PI/2,cast:false})};
 state.ops.forEach((op,k)=>tile(k,opLabel(op),"op"));
 state.anota.forEach((n,k)=>tile(k,String(n),"anota"));
 state.mreg.forEach(k=>{const [r,c]=k.split(",").map(Number);mesh(new T.PlaneGeometry(.96,.96),MB({map:tex("frame"),transparent:true,depthWrite:false}),X(c),.006,Z(r),{rx:-Math.PI/2,cast:false})});
 state.mlock.forEach(k=>{const [r,c]=k.split(",").map(Number),x=X(c),z=Z(r),txt=L.portaTxt||doorTxt(L.porta);
  const post=M({color:0x3b4250,metalness:.4,roughness:.5});mesh(box(.1,1,.1),post,x-.42,.5,z);mesh(box(.1,1,.1),post,x+.42,.5,z);
  const bar=M({color:0xc0392b,emissive:0xc0392b,emissiveIntensity:.35});const b=mesh(box(.84,.08,.08),bar,x,.62,z);
  const sp=new T.Sprite(new T.SpriteMaterial({map:canvasTex("msign:"+enc(txt)+":0"),transparent:true,depthWrite:false}));sp.scale.set(1.7,1.7,1);sp.position.set(x,1.45,z);S.add(sp);
  G.mdoors.push({k,bar,b,sp,txt})});
 if(state.plano){const [or,oc]=state.plano,ax=M({color:0xffc83d,emissive:0x7a5200,roughness:.6});
  mesh(box(BW-.1,.02,.07),ax,0,.004,Z(or),{cast:false});mesh(box(.07,.02,BH-.1),ax,X(oc),.004,0,{cast:false});
  mesh(cyl(.09,.09,.03,16),M({color:0xe8642c}),X(oc),.01,Z(or),{cast:false})}
 mathDoors()}
/* Porta verde quando o número do Bip cumpre a regra, vermelha quando não cumpre */
function mathDoors(){if(!G||!G.mdoors||!state.m)return;const ok=doorOk(state.porta,state.val);
 G.mdoors.forEach(d=>{const c=ok?0x23a55a:0xc0392b;d.bar.color.setHex(c);d.bar.emissive.setHex(c);d.b.position.y=ok?.95:.62;d.sp.material.map=canvasTex("msign:"+enc(d.txt)+":"+(ok?1:0))})}
/* Plaquinhas da tela: número do Bip, meta, pintura por fração e números anotados */
function mathHud(){if(!state.m)return "";let s="";
 if(state.val)s+=`<span class="chip mval" id="mval">${ic("calc")}Bip: <b>${Qtxt(state.val)}</b>${state.alvo?` <small>meta ${Qtxt(state.alvo)}</small>`:""}</span>`;
 if(state.frac)s+=`<span class="chip">${ic("brush")}<b>${[...state.painted].filter(k=>state.mreg.has(k)).length}</b> de ${state.mreg.size} <small>pintar ${state.fracTxt}</small></span>`;
 if(state.nums.length)s+=`<span class="chip">${ic("pin")}anotou: <b>${state.nums.join(", ")}</b></span>`;
 return s}
/* Conta acontecendo: aparece um balãozinho sobre o tabuleiro */
function mathPop(e){if(!e||!e.mops)return;const el=document.createElement("div");el.className="mpop";
 el.innerHTML=e.mops.map(o=>`${Qtxt(o.from)} <i>${opLabel(o.op)}</i> → <b>${Qtxt(o.to)}</b>`).join("<br>");$("board").appendChild(el);setTimeout(()=>el.remove(),1500);
 const v=$("mval");if(v){v.classList.remove("flash");void v.offsetWidth;v.classList.add("flash")}}
/* Repetir com conta (fases com "expr") */
const exprVal=src=>{const v=mathEval(src);return v&&v[1]==1?v[0]:NaN};
function exprChip(b){const L=LEVELS[lvl];return `<button class="cnd ex" data-ex="${b.id}" aria-label="Trocar a conta do Repetir">${minus(L.expr[b.ex||0])}${ic("down")}</button>`}
