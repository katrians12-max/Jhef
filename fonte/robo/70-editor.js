/* ===== Editor de peças de encaixar ===== */
const PIECE={F:{k:"go",i:"up",n:"Frente"},J:{k:"go",i:"jump",n:"Pular"},L:{k:"turn",i:"turnL",n:"Esquerda"},R:{k:"turn",i:"turnR",n:"Direita"},P:{k:"paint",i:"brush",n:"Pintar"},
 loop:{k:"loop",i:"repeat",n:"Repetir"},until:{k:"loop",i:"until",n:"Repetir até"},if:{k:"cond",i:"split",n:"Se"},fa:{k:"fn",l:"A",n:"Peça A"},fb:{k:"fn",l:"B",n:"Peça B"}};
const ORDER=["F","J","L","R","P","loop","until","if","fa","fb"];
const CONDS={front:"caixa na frente",left:"caixa à esquerda",right:"caixa à direita",hole:"buraco na frente",goal:"chegar na bandeira"};
const condList=b=>b.t=="until"?["goal","front"]:["front","left","right"].concat(hasHoles?["hole"]:[]);
const icoOf=t=>{const p=PIECE[t];return p.l?`<span class="ico let">${p.l}</span>`:`<span class="ico">${ic(p.i)}</span>`};
const palettePiece=t=>`<div class="pc k-${PIECE[t].k}" data-t="${t}" tabindex="0" role="button" aria-label="Adicionar a peça ${PIECE[t].n}"><div class="bar">${icoOf(t)}${PIECE[t].n}</div></div>`;

function drawPalette(){const L=LEVELS[lvl],kit=kitOf(L),el=$("palette"),quiz=L.type=="quiz";
 el.hidden=quiz;el.parentNode.classList.toggle("solo",quiz);
 const list=ORDER.filter(t=>kit.includes(t));el.innerHTML=list.map(palettePiece).join("");
 const n=quiz?0:list.length;el.style.setProperty("--cols",n<=4?Math.max(1,n):Math.ceil(n/2));document.body.classList.toggle("many",n>4)}

function pieceHTML(b){const p=PIECE[b.t],nw=b.id==fresh?" new":"",x=`<button class="x" data-del="${b.id}" aria-label="Remover peça">${ic("x")}</button>`;
 const mouth=(list,key,txt)=>`<div class="mouth"><div class="list" data-list="${key}">${list.length?list.map(pieceHTML).join(""):`<div class="slot">${txt}</div>`}</div></div>`;
 const chip=()=>`<button class="cnd" data-cond="${b.id}" aria-label="Trocar a condição">${CONDS[b.c]}${ic("down")}</button>`;
 if(b.t=="loop")return `<div class="pc cblock k-loop${nw}" data-id="${b.id}"><div class="bar cap" id="b${b.id}">${icoOf("loop")}Repetir<span class="st"><button data-dec="${b.id}" aria-label="Repetir menos vezes">−</button><span class="cnt">${b.n}</span><button data-inc="${b.id}" aria-label="Repetir mais vezes">+</button></span>vezes${x}</div>${mouth(b.body,b.id,"encaixe peças aqui")}<div class="foot"></div></div>`;
 if(b.t=="until")return `<div class="pc cblock k-loop${nw}" data-id="${b.id}"><div class="bar cap" id="b${b.id}">${icoOf("until")}Repetir até${chip()}${x}</div>${mouth(b.body,b.id,"encaixe peças aqui")}<div class="foot"></div></div>`;
 if(b.t=="if")return `<div class="pc cblock k-cond${nw}" data-id="${b.id}"><div class="bar cap" id="b${b.id}">${icoOf("if")}Se${chip()}então${x}</div>${mouth(b.body,b.id,"se sim, faça isto")}<div class="bar mid">senão</div>${mouth(b.els,b.id+":e","se não, faça isto")}<div class="foot"></div></div>`;
 return `<div class="pc k-${p.k}${nw}" data-id="${b.id}"><div class="bar" id="b${b.id}">${icoOf(b.t)}${p.n}${x}</div></div>`}

/* Pilhas do programa: "Ao executar" e, quando a fase permite, as receitas das Peças A e B. */
function stacksOf(){const kit=kitOf(LEVELS[lvl]);return ["m"].concat(kit.includes("fa")||P.A.length?["A"]:[],kit.includes("fb")||P.B.length?["B"]:[])}
const isLocked=key=>key=="A"&&!!LEVELS[lvl].lockFn;
function stackHTML(key){const fn=key!="m",locked=isLocked(key),list=P[key],quiz=LEVELS[lvl].type=="quiz";
 const hat=fn?`<div class="pc hat k-fn"><div class="bar"><span class="ico let">${key}</span>Para fazer a Peça ${key}${locked?`<span class="lockn">${ic("lock")}pronta</span>`:""}</div></div>`
  :`<div class="pc hat k-run"><div class="bar"><span class="ico">${ic("play")}</span>Ao executar</div></div>`;
 const empty=list.length||quiz?"":fn?`<p class="empty">Monte aqui a receita da Peça ${key}. Depois use a Peça ${key} no programa.</p>`
  :`<p class="empty"><span class="dsk">Arraste as peças e encaixe aqui embaixo. Para apagar uma peça, arraste de volta para a coluna de peças.</span><span class="mob">Toque numa peça acima para começar. Para mudar uma peça de lugar, segure e arraste.</span></p>`;
 return `<div class="stack${fn?" fn":""}${locked?" locked":""}${multi&&!locked&&!quiz?" pick":""}${multi&&key==active&&!quiz?" active":""}" data-stack="${key}">${hat}<div class="list" data-list="${key}">${list.map(pieceHTML).join("")}</div>${empty}</div>`}
function drawProg(){const L=LEVELS[lvl],ws=$("ws"),ks=stacksOf();multi=ks.filter(k=>!isLocked(k)).length>1;if(!ks.includes(active)||isLocked(active))active="m";
 ws.classList.toggle("ro",L.type=="quiz");ws.innerHTML=ks.map(stackHTML).join("");fresh=null;drawMeter()}
function drawMeter(){const L=LEVELS[lvl],n=countBlocks(P),m=$("meter");
 if(L.type=="quiz"){m.innerHTML=`<span>${ic("eye")}só leitura</span>`;return}
 m.innerHTML=`<span class="${L.max&&n>L.max?"over":""}"><b>${n}</b> ${n==1?"peça":"peças"}${L.max?` · limite <b>${L.max}</b>`:""}</span>`+(L.par?`<span class="par">${ic("star")}${ic("star")}${ic("star")} até <b>${L.par}</b></span>`:"")}

function find(id,lists=[P.m,P.A,P.B]){for(const list of lists)for(const b of list){if(b.id==id)return [b,list];for(const sub of[b.body,b.els])if(sub){const f=find(id,[sub]);if(f)return f}}}
function listOf(key){if(key=="m"||key=="A"||key=="B")return P[key];const [id,e]=String(key).split(":"),f=find(id);return f?(e?f[0].els:f[0].body):P.m}
function callsIn(b,acc=new Set()){if(b.t=="fa"||b.t=="fb")acc.add(b.t);for(const sub of[b.body,b.els])if(sub)sub.forEach(x=>callsIn(x,acc));return acc}
const editable=()=>!running&&LEVELS[lvl].type!="quiz";

/* Desfazer: guarda uma cópia do programa antes de cada mudança */
let undoStack=[];
function snap(){undoStack.push(JSON.stringify(P));if(undoStack.length>60)undoStack.shift();$("undo").disabled=false}
function undo(){if(!editable()||!undoStack.length)return;P=JSON.parse(undoStack.pop());$("undo").disabled=!undoStack.length;Snd.click();changed()}
function changed(){const t=LEVELS[lvl].t;drafts[t]=P;save.draft={t,p:P};persist();if(state.moved)resetBoard();showMission();drawProg()}
/* Programa guardado (ao recarregar a página): confere as peças e dá números novos a elas. */
function reviveProg(p){try{const ok=l=>Array.isArray(l)&&l.every(b=>b&&PIECE[b.t]&&(b.t!="loop"||(b.n>=2&&b.n<=9))&&(!("c" in b)||CONDS[b.c])&&(b.body?ok(b.body):!["loop","until","if"].includes(b.t))&&(b.t!="if"||ok(b.els)));
  if(!p||!ok(p.m)||!ok(p.A)||!ok(p.B))return null;const q=JSON.parse(JSON.stringify(p)),re=l=>l.forEach(b=>{b.id=++uid;if(b.body)re(b.body);if(b.els)re(b.els)});re(q.m);re(q.A);re(q.B);return q}catch(e){return null}}

document.addEventListener("click",e=>{const t=e.target.closest("button");
 if(!t){const h=e.target.closest(".stack.pick>.pc.hat");if(h&&editable()){active=h.parentNode.dataset.stack;Snd.click();drawProg();const st=document.querySelector(`#ws .stack[data-stack="${active}"]`);if(st)st.scrollIntoView({block:"nearest"})}return}
 const d=t.dataset;
 if(d.l!=null){closeModals();return loadLevel(+d.l)}
 if(d.v!=null){if(!running){curVar=+d.v;varSt=null;resetBoard();showMission()}return}
 if(d.ans)return answer(d.ans);
 if(!editable()||t.closest(".stack.locked"))return;
 if(d.del){snap();const[b,l]=find(d.del);l.splice(l.indexOf(b),1);Snd.del();return changed()}
 if(d.inc||d.dec){const[b]=find(d.inc||d.dec),n=clamp(b.n+(d.inc?1:-1),2,9);if(n!=b.n){snap();b.n=n;Snd.click();changed()}return}
 if(d.cond){snap();const[b]=find(d.cond),ks=condList(b);b.c=ks[(ks.indexOf(b.c)+1)%ks.length];Snd.click();return changed()}});

/* ---- Arrastar e soltar ---- */
const newBlock=t=>t=="loop"?{id:++uid,t,n:2,body:[]}:t=="until"?{id:++uid,t,c:"goal",body:[]}:t=="if"?{id:++uid,t,c:"front",body:[],els:[]}:{id:++uid,t};
let D=null;
/* Uma peça não pode entrar na própria receita (a Peça A dentro de "Para fazer a Peça A"). */
function canDrop(listEl){const st=listEl.closest(".stack");if(!st||st.classList.contains("locked"))return false;const key=st.dataset.stack;
 return !((key=="A"&&D.calls.has("fa"))||(key=="B"&&D.calls.has("fb")))}
function activate(x,y){D.on=true;const r=D.pc.getBoundingClientRect();D.ox=D.sx-r.left;D.oy=D.sy-r.top;
 D.g=D.pc.cloneNode(true);D.g.classList.add("ghost");D.g.classList.remove("lift");D.g.style.width=r.width+"px";document.body.appendChild(D.g);
 if(!D.pal){D.pc.classList.add("dragging");$("palette").classList.add("trash")}
 D.ph=document.createElement("div");D.ph.className="ph";track(x,y);requestAnimationFrame(autoScroll)}
/* Enquanto arrasta perto da borda de cima ou de baixo (ou além dela), a área do programa rola sozinha. */
function autoScroll(){if(!D||!D.on)return;const ws=$("ws"),r=ws.getBoundingClientRect(),x=D.x,y=D.y;
 if(x>r.left-20&&x<r.right+20){const dn=y-(r.bottom-46),up=(r.top+46)-y,v=dn>0?Math.min(16,2+dn*.3):up>0&&y>r.top-60?-Math.min(16,2+up*.3):0;
  if(v){const b=ws.scrollTop;ws.scrollTop+=v;if(ws.scrollTop!=b)track(x,y)}}
 requestAnimationFrame(autoScroll)}
document.addEventListener("pointerdown",e=>{if(!editable()||e.button>0||e.target.closest("button"))return;
 const pc=e.target.closest(".pc");if(!pc||pc.classList.contains("hat")||pc.closest(".ghost")||pc.closest(".stack.locked"))return;
 const pal=pc.closest("#palette");if(!pal&&!pc.closest("#ws"))return;
 const t=pc.dataset.t,calls=pal?new Set(t=="fa"||t=="fb"?[t]:[]):callsIn(find(pc.dataset.id)[0]);
 D={pc,pal:!!pal,id:pc.dataset.id,t,calls,sx:e.clientX,sy:e.clientY,x:e.clientX,y:e.clientY,on:false,drop:null};
 if(e.pointerType=="touch"&&!pal){D.hold=true;pc.classList.add("lift");const d=D;
  d.timer=setTimeout(()=>{if(D!==d)return;d.hold=false;try{navigator.vibrate&&navigator.vibrate(15)}catch(_){}activate(d.x,d.y)},260)}
 else e.preventDefault()});
document.addEventListener("touchmove",e=>{if(D&&(D.pal||D.on||!D.hold))e.preventDefault()},{passive:false});
window.addEventListener("pointermove",e=>{if(!D)return;D.x=e.clientX;D.y=e.clientY;
 if(D.hold){if(Math.hypot(e.clientX-D.sx,e.clientY-D.sy)>8){clearTimeout(D.timer);D.pc.classList.remove("lift");D=null}return}
 if(!D.on){if(Math.hypot(e.clientX-D.sx,e.clientY-D.sy)<6)return;activate(e.clientX,e.clientY);return}
 track(e.clientX,e.clientY)});
function track(x,y){D.g.style.transform=`translate(${x-D.ox}px,${y-D.oy}px) rotate(2deg)`;D.g.classList.remove("nope");
 D.ph.remove();   // decide o destino olhando o programa sem o espaço reservado (ele empurra as peças e confundia o alvo)
 const el=document.elementFromPoint(x,y);D.drop=null;
 if(el&&el.closest("#palette")&&!D.pal){D.ph.remove();D.drop={trash:1};return}
 // a "boca" de um Repetir/Se mais próxima vale como alvo, mesmo soltando ao lado do espaço tracejado
 let hit=el&&el.closest("#ws .list,#ws .mouth"),list=hit&&(hit.classList.contains("mouth")?hit.querySelector(":scope>.list"):hit);
 if(!list&&el&&el.closest("#ws")){let bd=1e9;document.querySelectorAll("#ws .stack").forEach(st=>{const r=st.getBoundingClientRect(),dy=y<r.top?r.top-y:y>r.bottom?y-r.bottom:0,dx=x<r.left?r.left-x:x>r.right?x-r.right:0,d=Math.hypot(dx,dy);if(d<bd){bd=d;list=st.querySelector(":scope>.list")}})}
 if(!list){D.ph.remove();return}
 if(!canDrop(list)){D.ph.remove();D.g.classList.add("nope");return}
 const kids=[...list.children].filter(c=>c.classList.contains("pc")&&!c.classList.contains("dragging"));
 let idx=kids.length;for(let i=0;i<kids.length;i++){const br=kids[i].firstElementChild.getBoundingClientRect();if(y<br.top+br.height/2){idx=i;break}}
 const before=kids[idx]||null;before?list.insertBefore(D.ph,before):list.appendChild(D.ph);
 D.drop={list:list.dataset.list,idx}}
function endDrag(ok){if(!D)return;const d=D;D=null;clearTimeout(d.timer);d.pc.classList.remove("lift");$("palette").classList.remove("trash");
 if(!d.on){if(ok&&d.pal)addTap(d.t);return}
 d.g.remove();d.ph.remove();
 if(!ok||!d.drop){d.pc.classList.remove("dragging");return}
 snap();let b;if(d.pal)b=newBlock(d.t);else{const[o,l]=find(d.id);l.splice(l.indexOf(o),1);b=o}
 if(d.drop.trash)Snd.del();else{const tgt=listOf(d.drop.list);tgt.splice(Math.min(d.drop.idx,tgt.length),0,b);fresh=b.id;Snd.snap()}
 changed()}
/* Toque (ou Enter) numa peça da coluna: entra no fim da pilha que está selecionada */
function addTap(t){if(!editable())return;let key=active;if(isLocked(key)||(key=="A"&&t=="fa")||(key=="B"&&t=="fb"))key="m";
 snap();const b=newBlock(t);P[key].push(b);fresh=b.id;Snd.snap();changed();const el=$("b"+b.id);if(el)el.scrollIntoView({block:"nearest"})}
document.addEventListener("keydown",e=>{const pc=e.target.closest&&e.target.closest("#palette .pc");if(!pc||(e.key!="Enter"&&e.key!=" "))return;e.preventDefault();addTap(pc.dataset.t)});
window.addEventListener("pointerup",()=>endDrag(true));window.addEventListener("pointercancel",()=>endDrag(false));
