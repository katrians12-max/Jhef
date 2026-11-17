/* ===== Jogo: progresso, fases, execução e janelas ===== */
const DIRS=["Norte","Leste","Sul","Oeste"],SPEEDS=[.75,.48,.3,.17];
let lvl=0,P={m:[],A:[],B:[]},state=null,curVar=0,varSt=null,running=false,stopReq=false,stepping=false,stepRes=null,active="m",multi=false,fresh=null,hasHoles=false,boardGen=0,bubbleMode="";
const drafts={},fails={},quizMiss={};
let save={v:1,stars:{},skip:{},lvl:null,snd:1,skin:"amarelo",seen:{},all:0,spd:1,draft:null};
/* Fases da versão anterior (47), na ordem antiga: quem já tinha progresso continua com ele. */
const OLD47="Um passo|Dois passos|Conte as casas|Girar à esquerda|Girar à direita|Andar e virar|Meia-volta|Pegue as estrelas|Estrela fora do caminho|Desvie da caixa|Caminho de estrelas|Carteiras espalhadas|Conheça o Repetir|Repetir, virar, repetir|A escada|A rampa|Volta no canteiro|O depósito escuro|Antes e depois|Ida e volta|Ronda pela cerca|Degraus largos|Arando a lavoura|Rosa dos ventos|O diamante|A antena|Primeira pincelada|Três casas|Linha com Repetir|A letra L|Quadrado 2 × 2|Contorno do quadrado|Retângulo cheio|Diagonal|A cruz|A moldura|Até a caixa|Ande e vire|Se tem caixa, vire|Esquerda ou direita?|O labirinto|Corrida com obstáculos|A pirâmide|Montanha-russa|Três quarteirões|A janela|A torre de rádio".split("|");
function loadSave(){try{const s=JSON.parse(localStorage.getItem("robo4")||"null");if(s&&s.v==1){Object.assign(save,s);return}
 const d3=JSON.parse(localStorage.getItem("robo-done3")||"null");if(d3){for(const k in d3)if(d3[k]&&OLD47[k])save.stars[OLD47[k]]=2;persist()}}catch(e){}}
function persist(){try{localStorage.setItem("robo4",JSON.stringify(save))}catch(e){}}
const isDone=i=>!!(save.stars[LEVELS[i].t]||save.skip[LEVELS[i].t]);
const unlocked=i=>!!save.all||i==0||isDone(i-1)||isDone(i);
const totalStars=()=>LEVELS.reduce((a,l)=>a+(save.stars[l.t]||0),0);
const pcs=k=>k==1?"1 peça":k+" peças";
/* Recompensas: cores do Bip e níveis do jogador, pelo total de estrelas */
const SKIN_NAME={amarelo:"Amarelo",laranja:"Laranja",verde:"Verde",azul:"Azul",roxo:"Roxo",rosa:"Rosa",vermelho:"Vermelho",branco:"Branco",dourado:"Dourado"};
const skinOpen=k=>!!save.all||totalStars()>=SKIN_AT[k];
const RANKS=[[0,"Aprendiz"],[30,"Estudante de robótica"],[80,"Especialista em peças"],[140,"Craque do código"],[200,"Gênio da programação"],[273,"Mestre do Bip"]];
const rankOf=n=>RANKS.filter(r=>n>=r[0]).pop();
const nextRank=n=>RANKS.find(r=>r[0]>n);
function setSkin(k){if(!SKINS[k]||!skinOpen(k))return;save.skin=k;persist();document.documentElement.style.setProperty("--skin",SKINS[k]);$("brandFace").innerHTML=bip("happy");$("face").innerHTML=bip("happy");if(G){buildRobot();placeRobot(true)}Snd.click()}

/* ---------- Topo, balão do Bip e painel sobre o tabuleiro ---------- */
function drawTop(){const L=LEVELS[lvl],W=WORLDS[L.w];$("lvBadge").textContent=L.w+1;$("lvWorld").textContent=`Mundo ${L.w+1} · ${W.n}`;$("lvName").innerHTML=`Fase ${L.n}<span class="ofl"> de ${W.lv.length}</span><span class="ofs">/${W.lv.length}</span>`;
 $("prevLv").disabled=lvl==0||!unlocked(lvl-1);$("nextLv").disabled=lvl==LEVELS.length-1||!unlocked(lvl+1);$("starTotal").textContent=totalStars();$("starMax").textContent="/"+LEVELS.length*3}
function drawSnd(){$("sndBtn").innerHTML=ic(save.snd?"sound":"mute");$("sndBtn").setAttribute("aria-pressed",!!save.snd)}
function drawSpd(){$("spdBtn").textContent=(save.spd+1)+"×"}
/* Celular baixo: a fala do Bip mostra até 4 linhas; tocar no texto mostra tudo */
$("say").addEventListener("click",()=>{const p=$("say"),b=$("bubble");if(b.classList.contains("open")||p.scrollHeight>p.clientHeight+2)b.classList.toggle("open")});
function say(html,mood="normal",cls="",links=[]){bubbleMode=cls;$("bubble").className="bubble"+(cls?" "+cls:"");$("say").innerHTML=html;$("face").innerHTML=bip(mood);
 $("blinks").innerHTML=links.map(([id,txt])=>`<button class="link" data-act="${id}">${txt}</button>`).join("")}
function skipLinks(){const t=LEVELS[lvl].t;return (fails[t]||0)>=4&&!save.stars[t]&&lvl<LEVELS.length-1?[["skip","Pular esta fase"]]:[]}
function showMission(){say(esc(LEVELS[lvl].h),"normal","",skipLinks())}
function fbFail(html){say(html,"sad","fail",[["mission","Ver a missão"],...skipLinks()]);const t=$("talk");t.classList.remove("shake");void t.offsetWidth;t.classList.add("shake")}
function fbWarn(html){say(html,"think","fail",[["mission","Ver a missão"]])}
function showTip(){const L=LEVELS[lvl];if(L.tip){Snd.click();say("<b>Dica:</b> "+esc(L.tip),"think","tip",[["mission","Ver a missão"]])}}
function varsHTML(){const n=mapsOf(LEVELS[lvl]).length;if(n<2)return "";
 return `<span class="vars">Mapas ${[...Array(n).keys()].map(i=>`<button class="vchip ${i==curVar?"on":""} ${varSt&&varSt[i]||""}" data-v="${i}" aria-label="Ver o mapa ${i+1}">${varSt&&varSt[i]=="ok"?"✓":i+1}</button>`).join("")}</span>`}
function hud(){if(!state)return;let s=`<span class="chip">${ic("pin")}<b>${state.m?coordTxt(state,state.r,state.c):`(${state.c}, ${state.H-1-state.r})`}</b></span><span class="chip">${ic("compass")}${DIRS[state.d]}</span>`;
 if(state.total)s+=`<span class="chip">${ic("star","gold")}<b>${state.got.size}/${state.total}</b></span>`;
 if(state.paint.size)s+=`<span class="chip">${ic("brush")}<b>${[...state.painted].filter(k=>state.paint.has(k)).length}/${state.paint.size}</b></span>`;
 for(const c of new Set(state.keys.values()))s+=`<span class="chip keyc${state.has.has(c)?"":" off"}" style="--kc:${KEYCSS[c]}">${ic("key")}${state.has.has(c)?"chave "+KEYNAME[c]:"sem a chave "+KEYNAME[c]}</span>`;
 if(state.m)s+=mathHud();   // [Matemática]
 $("hud").innerHTML=s+varsHTML()}
function setCtl(){const quiz=LEVELS[lvl].type=="quiz";$("ctrls").hidden=quiz;$("run").innerHTML=running?ic("stop")+"Parar":ic("play")+"Executar";$("run").classList.toggle("stop",running);
 $("step").disabled=running&&stepping&&!stepRes;$("reset").disabled=$("clear").disabled=running;$("undo").disabled=running||!undoStack.length}

/* ---------- Carregar fase ---------- */
function loadLevel(i,o={}){if(running||i<0||i>=LEVELS.length||(!unlocked(i)&&!o.force))return;
 lvl=i;const L=LEVELS[i],W=WORLDS[L.w],quiz=L.type=="quiz",fix=L.type=="fix";save.lvl=L.t;persist();
 P=quiz?PGP(L.pre):drafts[L.t]||(drafts[L.t]=(save.draft&&save.draft.t==L.t&&reviveProg(save.draft.p))||PGP(L.pre));undoStack=[];curVar=0;varSt=null;active="m";
 hasHoles=mapsOf(L).some(m=>m.join("").includes("x"));document.documentElement.style.setProperty("--w",W.ac);
 $("lvTag").textContent=L.t;const kd=$("lvKind"),nv=mapsOf(L).length;kd.hidden=!(quiz||fix||nv>1);
 kd.innerHTML=quiz?ic("eye")+"leitura":fix?ic("wrench")+"conserto":ic("map")+nv+" mapas";
 $("tipBtn").hidden=!L.tip;$("edTitle").textContent=quiz?"Leia o programa":fix?"Conserte o programa":"Meu programa";
 $("clear").title=fix?"Voltar ao programa original":"Apagar tudo";$("clear").setAttribute("aria-label",$("clear").title);
 drawTop();drawPalette();resetBoard();drawProg();showMission();$("answers").hidden=!quiz;setCtl();
 if(!save.seen[L.w]){save.seen[L.w]=1;persist();showIntro(L.w)}}
function resetBoard(){boardGen++;state=parse(LEVELS[lvl],curVar);BW=state.W;BH=state.H;state.rot=state.d*90;buildLevel();placeRobot(true);if(LEVELS[lvl].type=="quiz")drawAnswers()}
function drawAnswers(){const miss=quizMiss[LEVELS[lvl].t]||new Set(),A=LEVELS[lvl].ask;
 if(A)return $("answers").innerHTML=`<p>${esc(A.q)}</p><div class="ansrow">${A.resp.map((t,i)=>`<button class="ans mans" style="--oc:${OPTCOL[i+1]}" data-ans="${i+1}" ${miss.has(String(i+1))?"disabled":""}>${minus(t)}</button>`).join("")}</div>`;   // [Matemática]
 $("answers").innerHTML=`<p>Em qual casa o Bip vai parar?</p><div class="ansrow">${[...state.opts.keys()].sort().map(n=>`<button class="ans" style="--oc:${OPTCOL[n]}" data-ans="${n}" ${miss.has(n)?"disabled":""} aria-label="Casa ${n}">${n}</button>`).join("")}</div>`}

/* ---------- Executar ---------- */
const MSG={loop:"O Bip ficou repetindo sem parar. Confira a condição do <b>Repetir até</b>: ela nunca aconteceu.",
 recur:"Uma peça está chamando ela mesma sem parar. Confira as receitas das Peças A e B.",
 fall:"O Bip caiu no buraco! Use <b>Pular</b> para passar por cima, ou procure outro caminho.",fallW:"O Bip caiu na água! Use <b>Pular</b> para passar por cima do buraco, ou procure outro caminho."};
const BUMP={edge:"O Bip tentou sair do tabuleiro.",wall:"O Bip bateu numa caixa.",jedge:"O Bip pulou para fora do tabuleiro. Lembre: o pulo sempre anda 2 casas.",
 jwall:"O Bip pulou, mas a casa onde ele ia cair está ocupada. O pulo sempre cai 2 casas à frente.",jdoor:"Não dá para pular por cima de uma porta fechada."};
function bumpMsg(e){if(e.why=="mdoor"){const L=LEVELS[lvl];return `A porta não abriu. ${L.portaTxt?"Ela só abre com o número que resolve <b>"+minus(L.portaTxt)+"</b>":"Regra da porta: <b>"+doorTxt(L.porta)+"</b>"}. O Bip chegou com <b>${Qtxt(state.val)}</b>.`}   // [Matemática]
 if(e.why!="door")return BUMP[e.why];const c=KEYNAME[state.doors.get(e.at.join(","))];return `A porta ${c} está trancada. O Bip precisa pegar a chave ${c} antes.`}
function clearHi(){document.querySelectorAll("#ws .bar.run,#ws .bar.call,#ws .bar.err").forEach(x=>x.classList.remove("run","call","err"))}
function markErr(id){const el=$("b"+id);if(el){el.classList.add("err");el.scrollIntoView({block:"nearest"})}}
async function runOnce(dur){const env={n:0,fns:{A:P.A,B:P.B}},it=exec(P.m,state,env),paintLv=state.paint.size>0||!!(state.m&&state.frac),gen=boardGen;let carry=0,acts=0;
 const nextAct=()=>{const marks=[];for(;;){const r=it.next();if(r.done)return null;const v=r.value;if(v.over)return v;if(v.mark){marks.push(v);continue}v.marks=marks;return v}};
 const hi=v=>{clearHi();
  for(const m of v.marks){const el=$("b"+m.hl);if(!el)continue;
   if(m.cv!=null){el.dataset.res=m.cv?"sim":"não";el.classList.add(m.cv?"yes":"no");(m.cv?Snd.yes:Snd.no)();setTimeout(()=>{el.classList.remove("yes","no");delete el.dataset.res},Math.max(500,dur*1500))}
   else{el.classList.add("pulse");setTimeout(()=>el.classList.remove("pulse"),350)}}
  if(v.calls)for(const id of v.calls){const el=$("b"+id);if(el)el.classList.add("call")}
  const el=$("b"+v.hl);if(el){el.classList.add("run");el.scrollIntoView({block:"nearest"})}};
 const later=(ms,fn)=>setTimeout(()=>{if(gen==boardGen)fn()},ms);
 const finish=async()=>{emote("cheer");Snd.win();await animate({kind:"hop",dur:1.1});return {ok:1}};
 const pause=async()=>{if(stepping&&!stopReq){await new Promise(r=>{stepRes=r;setCtl()});stepRes=null;setCtl()}};
 let cur=nextAct();
 while(cur){if(stopReq)return {stopped:1};
  if(cur.over==3)return {fail:"Esse <b>Repetir</b> não tem um número de vezes válido: a conta precisa dar um número inteiro maior que zero.",at:cur.hl};   // [Matemática]
  if(cur.over||++acts>1500)return {fail:cur.over==2?MSG.recur:MSG.loop};
  hi(cur);const t=cur.t;let nxt;
  if(t=="L"||t=="R"){const fy=-state.rot*Math.PI/180;act(state,t);state.rot+=t=="L"?-90:90;Snd.turn();await animate({kind:"turn",fy,ty:-state.rot*Math.PI/180,dur:dur*.8});carry=0}
  else if(t=="P"){const e=act(state,"P");paintCell(e.paint,e.good);Snd.paint();if(e.good)emote("happy");await animate({kind:"stamp",dur:Math.max(.25,dur*.6)});carry=0}
  else{const e=act(state,t);
   if(e.bump){if(e.why=="door"||e.why=="jdoor")shakeDoor(e.at.join(","));Snd.bump();await animate({kind:"bump",bx:G&&G.pose?G.pose.x:0,bz:G&&G.pose?G.pose.z:0,dur:dur*1.6});return {fail:bumpMsg(e),at:cur.hl}}
   const fx=X(e.fc),fz=Z(e.fr),tx=X(e.to[1]),tz=Z(e.to[0]);
   if(e.mbad){Snd.step();await animate({kind:e.jump?"jump":"move",fx,fz,tx,tz,v0:carry,v1:0,dur});placeRobot();Snd.bump();return {fail:e.mbad,at:cur.hl}}   // [Matemática]
   if(e.door){sceneDoor(e.door);Snd.door();await wait(dur*450)}
   if(e.fall){Snd.fall();if(e.jump){await animate({kind:"jump",fx,fz,tx,tz,dur:dur*1.4});await animate({kind:"fall",fx:tx,fz:tz,tx,tz,dur:.8})}else await animate({kind:"fall",fx,fz,tx,tz,dur:.95});
    placeRobot();return {fail:themeOf(lvl).water?MSG.fallW:MSG.fall,at:cur.hl}}
   if(e.jump){Snd.jump();await animate({kind:"jump",fx,fz,tx,tz,dur:dur*1.4});Snd.land();carry=0;if(e.star){sceneStar(e.star);Snd.star()}if(e.key){sceneKey(e.key);Snd.key()}}
   else{if(!paintLv)addTrail(e.fr,e.fc);let goesOn=false;
    if(!stepping&&!e.tp&&(state.stop||!won(state))){nxt=nextAct();goesOn=!!nxt&&!nxt.over&&nxt.t=="F"&&!blocked(state,state.r+DR[state.d],state.c+DC[state.d])}
    Snd.step();const mv=animate({kind:"move",fx,fz,tx,tz,v0:carry,v1:goesOn?1:0,dur});carry=goesOn?1:0;
    if(e.star)later(dur*700,()=>{sceneStar(e.star);Snd.star()});if(e.key)later(dur*700,()=>{sceneKey(e.key);Snd.key()});
    await mv}
   if(state.m){mathPop(e);mathDoors();hud()}   // [Matemática]
   if(e.tp){Snd.portal();await animate({kind:"warpOut",dur:.3});const yaw=-state.rot*Math.PI/180;if(G&&G.pose){G.pose.x=X(state.c);G.pose.z=Z(state.r)}
    await animate({kind:"warpIn",dur:.32,yaw,col:PORTCOL[state.pcol.get(state.r+","+state.c)]});if(G&&G.pose){G.pose.s=1;G.pose.y=0;G.pose.yaw=yaw}carry=0}}
  placeRobot();
  if(!state.stop&&won(state))return finish();
  await pause();if(stopReq)return {stopped:1};
  cur=nxt!==undefined?nxt:nextAct()}
 if(won(state))return finish();
 return {end:1}}
function whyLost(){
 if(state.m){const w=mathWhy(state);if(w)return w}   // [Matemática]
 if(state.paint.size){const miss=[...state.paint].filter(c=>!state.painted.has(c)).length,extra=[...state.painted].filter(c=>!state.paint.has(c)).length;
  if(extra)return `O Bip pintou ${extra} ${extra==1?"casa":"casas"} fora do desenho (em vermelho).`;if(miss)return `Faltou pintar ${miss} ${miss==1?"casa":"casas"} do desenho.`}
 if(state.got.size<state.total){const f=state.total-state.got.size;return `${f==1?"Faltou 1 estrela":"Faltaram "+f+" estrelas"}.`}
 if(state.goal)return `O Bip parou em (${state.c}, ${state.H-1-state.r}), mas a bandeira está em outro lugar.`+(state.stop?" Nesta fase ele precisa <b>parar</b> em cima da bandeira.":"");
 return "O programa terminou, mas a missão ainda não foi cumprida."}
async function run(){if(running)return;const L=LEVELS[lvl],n=countBlocks(P);Snd.unlock();
 if(!P.m.length)return fbWarn("O programa está vazio. Encaixe peças embaixo de <b>Ao executar</b>.");
 if(L.max&&n>L.max)return fbWarn(`Seu programa tem ${pcs(n)}, mas o limite desta fase é <b>${L.max}</b>. Procure um pedaço que se repete.`);
 const mn=missingNeed(L,P);if(mn){const k=mn=="fa"?"A":"B";return fbWarn(P[k].length?`Nesta fase o programa precisa usar a <b>Peça ${k}</b>. Coloque a Peça ${k} embaixo de "Ao executar".`:`Monte a receita da <b>Peça ${k}</b> e depois use essa peça no programa.`)}
 running=true;stopReq=false;setCtl();showMission();
 const nv=mapsOf(L).length;varSt=nv>1?[]:null;let res,vi=0;
 for(vi=0;vi<nv;vi++){curVar=vi;resetBoard();state.moved=true;if(nv>1){varSt[vi]="run";hud();await wait(350)}
  res=await runOnce(SPEEDS[save.spd]);if(!res.ok)break;if(nv>1){varSt[vi]="ok";hud();if(vi<nv-1)await wait(650)}}
 clearHi();running=false;stepping=false;stepRes=null;setCtl();
 if(res.ok)return finishLevel(nv);
 if(nv>1&&!res.stopped){varSt[vi]="bad";hud()}
 if(res.stopped)return;
 fails[L.t]=(fails[L.t]||0)+1;Snd.fail();if(res.at)markErr(res.at);fbFail((nv>1?`No mapa ${vi+1}: `:"")+(res.fail||whyLost())+(res.at?" A peça onde isso aconteceu ficou marcada em vermelho.":""))}
async function answer(n){if(running)return;const L=LEVELS[lvl],r=simulate(L,P,0),end=r.s.r+","+r.s.c,miss=quizMiss[L.t]||(quizMiss[L.t]=new Set());Snd.unlock();
 if(L.ask){if(!sameAns(L.ask.resp[n-1],mathAnswer(L,r.s))){miss.add(String(n));fails[L.t]=(fails[L.t]||0)+1;Snd.fail();drawAnswers();   // [Matemática]
   return fbFail(`Não é <b>${minus(L.ask.resp[n-1])}</b>. Leia o programa de novo, uma peça de cada vez, e faça as contas junto com o Bip.`)}}
 else if(state.opts.get(n)!=end){miss.add(n);fails[L.t]=(fails[L.t]||0)+1;Snd.fail();drawAnswers();
  return fbFail(`Não é a casa <b>${n}</b>. Leia o programa de novo, uma peça de cada vez, acompanhando no tabuleiro.`)}
 running=true;stopReq=false;stepping=false;setCtl();resetBoard();state.moved=true;say("Isso mesmo! Veja o Bip seguindo o programa.","happy","ok");
 const res=await runOnce(SPEEDS[Math.max(1,save.spd)]);clearHi();running=false;setCtl();if(res.ok)finishLevel(1)}
function finishLevel(nv){const L=LEVELS[lvl],n=countBlocks(P),quiz=L.type=="quiz",before=totalStars();
 const st=quiz?3-Math.min(2,(quizMiss[L.t]||new Set()).size):!L.par||n<=L.par?3:n<=L.par+Math.max(2,Math.round(L.par*.3))?2:1;
 if(st>(save.stars[L.t]||0))save.stars[L.t]=st;delete save.skip[L.t];persist();drawTop();say("Missão cumprida!","happy","ok",[["mission","Ver a missão"]]);
 const after=totalStars(),skin=save.all?null:Object.keys(SKIN_AT).filter(k=>SKIN_AT[k]>before&&SKIN_AT[k]<=after).pop(),rank=rankOf(after)[0]>before?rankOf(after)[1]:null;showWin(st,n,nv,skin,rank)}
function skipLevel(){save.skip[LEVELS[lvl].t]=1;persist();Snd.click();loadLevel(lvl+1,{force:1})}

/* ---------- Janelas: vitória, novo mundo, mapa e opções ---------- */
function openModal(id){closeModals();const m=$(id);m.hidden=false;const f=m.querySelector("[data-focus]")||m.querySelector("button");if(f)f.focus({preventScroll:true})}
function closeModals(){document.querySelectorAll(".modal").forEach(m=>m.hidden=true)}
function showWin(st,n,nv,skin,rank){const L=LEVELS[lvl],last=lvl==LEVELS.length-1,quiz=L.type=="quiz",genius=!quiz&&L.par&&n<L.par;
 const title=last?"Você completou o jogo!":genius?"Genial!":st==3?"Perfeito!":st==2?"Muito bem!":"Conseguiu!";let txt;
 if(quiz)txt=st==3?"Você leu o programa com atenção e acertou de primeira.":"Você acertou! Nas fases de leitura, as 3 estrelas são para quem acerta na primeira tentativa.";
 else if(genius)txt=`Seu programa tem <b>${pcs(n)}</b>: menos do que as ${L.par} que valem 3 estrelas. Você achou um caminho mais curto que o do Bip!`;
 else if(st==3)txt=`Missão cumprida com <b>${pcs(n)}</b>${nv>1?`, e o mesmo programa funcionou nos ${nv} mapas`:""}.`;
 else txt=`Seu programa tem <b>${pcs(n)}</b>. Para ganhar 3 estrelas, use <b>${L.par} ou menos</b>. Será que dá para encurtar?`;
 if(last)txt+=" Todas as fases do Robô Programador foram vencidas. Parabéns!";else if(L.n==WORLDS[L.w].lv.length)txt+=` Você terminou o mundo <b>${WORLDS[L.w].n}</b>!`;
 $("winSheet").innerHTML=`<div class="confetti" id="confetti"></div>${bip("happy")}<div class="wstars">${ic("star")}${ic("star")}${ic("star")}</div><h2>${title}</h2><p>${txt}</p>`+
  (rank?`<div class="prize">${ic("bolt")}<span>Novo nível: <b>${rank}</b></span></div>`:"")+
  (skin?`<div class="prize"><i class="sw" style="--sc:${SKINS[skin]}"></i><span>Nova cor do Bip liberada: <b>${SKIN_NAME[skin]}</b></span><button class="link" data-wear="${skin}">Usar agora</button></div>`:"")+`<div class="wbtns">`+
  (st<3&&!quiz?`<button class="btn" data-act="close">Tentar com menos peças</button>`:"")+(last?`<button class="btn primary" data-act="map" data-focus>Ver o mapa</button>`:`<button class="btn primary" data-act="next" data-focus>Próxima fase${ic("right")}</button>`)+`</div>`;
 openModal("winModal");[...$("winSheet").querySelectorAll(".wstars .i")].forEach((s,i)=>{if(i<st)setTimeout(()=>{s.classList.add("on");Snd.pop(i)},350+i*320)});
 if(!reduce){const cols=["#f0ad00","#ee5f2b","#2f6fd6","#1b9a52","#d93a7f","#6b4fd8"];let h="";for(let i=0;i<40;i++)h+=`<i style="left:${Math.random()*100}%;background:${cols[i%6]};animation-delay:${Math.random()*.6}s;animation-duration:${1.4+Math.random()}s"></i>`;$("confetti").innerHTML=h}}
function showIntro(wi){const W=WORLDS[wi],sh=$("introSheet");sh.style.setProperty("--w",W.ac);
 sh.innerHTML=`<span class="wnum">${ic(W.ic)}Mundo ${wi+1}</span><h2>${W.n}</h2><p>${esc(W.txt)}</p><div class="newpcs">${(W.show||[]).map(palettePiece).join("")}</div><button class="btn primary" data-act="close" data-focus>Vamos lá!</button>`;openModal("introModal")}
function drawMap(){let h=`<button class="closex" data-act="close" aria-label="Fechar">${ic("x")}</button><div class="maphead"><h2>Mapa de fases</h2><span class="tot">${ic("star")}${totalStars()} de ${LEVELS.length*3}</span><span class="rank">${ic("bolt")}${rankOf(totalStars())[1]}</span></div><div class="worlds">`;
 WORLDS.forEach((W,wi)=>{const ws=W.lv.reduce((a,l)=>a+(save.stars[l.t]||0),0);
  h+=`<section class="world${unlocked(W.from)?"":" locked"}" style="--w:${W.ac}"><h3><span class="wbadge">${wi+1}</span>${W.n}<small>${ic("star")}${ws}/${W.lv.length*3}</small></h3><div class="chips">`;
  for(const l of W.lv){const st=save.stars[l.t]||0,lock=!unlocked(l.i),kind=l.type=="quiz"?"leitura":l.type=="fix"?"conserto":"";
   h+=`<button class="lv${l.i==lvl?" on":""}${st?" done":""}${save.skip[l.t]&&!st?" skip":""}" data-l="${l.i}" ${lock?"disabled":""} title="${esc(lock?"Complete a fase anterior":l.t)}" aria-label="Fase ${l.n}: ${esc(l.t)}${kind?" ("+kind+")":""}${lock?", bloqueada":", "+st+" de 3 estrelas"}">`+
    (lock?ic("lock"):`<b>${l.n}</b><span class="pips">${[1,2,3].map(k=>ic("star",k<=st?"on":"")).join("")}</span>`)+(kind&&!lock?`<span class="tg">${ic(l.type=="quiz"?"eye":"wrench")}</span>`:"")+`</button>`}
  h+=`</div></section>`});
 $("mapSheet").innerHTML=h+`</div><div class="legend"><span><span class="tg">${ic("eye")}</span>leitura: prever o que o programa faz</span><span><span class="tg">${ic("wrench")}</span>conserto: achar e arrumar o erro</span></div>`}
function drawCfg(ask){$("cfgSheet").innerHTML=`<button class="closex" data-act="close" aria-label="Fechar">${ic("x")}</button><h2>Opções</h2>
 <div class="row"><span><b>Som</b><small>Efeitos sonoros do jogo</small></span><button class="switch" role="switch" aria-checked="${!!save.snd}" data-act="snd" aria-label="Som"></button></div>
 <div><b>Cor do Bip</b><small class="sub">Ganhe estrelas para liberar novas cores</small><div class="skins">${Object.keys(SKINS).map(k=>{const open=skinOpen(k);
  return `<button class="skin${open?"":" lock"}" style="--sc:${SKINS[k]}" data-skin="${k}" ${open?"":"disabled"} aria-pressed="${save.skin==k}" aria-label="Cor ${SKIN_NAME[k]}${open?"":", liberada com "+SKIN_AT[k]+" estrelas"}" title="${SKIN_NAME[k]}${open?"":" · liberada com "+SKIN_AT[k]+" estrelas"}">${open?"":`<span>${ic("star")}${SKIN_AT[k]}</span>`}</button>`}).join("")}</div></div>
 <div class="row"><span><b>Liberar todas as fases</b><small>Para o professor escolher qualquer fase na aula</small></span><button class="switch" role="switch" aria-checked="${!!save.all}" data-act="all" aria-label="Liberar todas as fases"></button></div>
 <div class="row">`+(ask?`<span><b>Apagar todo o progresso?</b><small>As estrelas deste aparelho serão perdidas.</small></span><span style="flex-direction:row;gap:6px"><button class="btn danger" data-act="wipe">Sim, apagar</button><button class="btn" data-act="cfg">Cancelar</button></span>`
  :`<span><b>Progresso</b><small>${totalStars()} estrelas neste aparelho · nível ${rankOf(totalStars())[1]}${nextRank(totalStars())?` (faltam ${nextRank(totalStars())[0]-totalStars()} para o próximo)`:""}</small></span><button class="btn danger" data-act="wipeAsk">Apagar progresso</button>`)+`</div>`}
const ACTS={close:closeModals,mission:showMission,skip:skipLevel,next(){closeModals();loadLevel(lvl+1,{force:1})},map(){drawMap();openModal("mapModal")},cfg(){drawCfg();openModal("cfgModal")},
 snd(){save.snd=save.snd?0:1;Snd.on=!!save.snd;persist();drawSnd();if(!$("cfgModal").hidden)drawCfg();Snd.click()},all(){save.all=save.all?0:1;persist();drawCfg();drawTop()},
 wipeAsk(){drawCfg(true)},wipe(){save.stars={};save.skip={};save.seen={};save.all=0;save.draft=null;save.skin="amarelo";persist();document.documentElement.style.setProperty("--skin",SKINS.amarelo);$("brandFace").innerHTML=bip("happy");if(G)buildRobot();for(const k in drafts)delete drafts[k];for(const k in fails)delete fails[k];for(const k in quizMiss)delete quizMiss[k];closeModals();loadLevel(0,{force:1})}};
document.addEventListener("click",e=>{const t=e.target.closest("[data-act],[data-skin],[data-wear]");if(!t)return;
 if(t.dataset.skin){setSkin(t.dataset.skin);drawCfg()}
 else if(t.dataset.wear){setSkin(t.dataset.wear);t.outerHTML="<span class='worn'>"+ic("check")+"Bip trocou de cor!</span>";const f=$("winSheet").querySelector(".bip");if(f)f.outerHTML=bip("happy")}
 else ACTS[t.dataset.act]()});
document.addEventListener("keydown",e=>{if(e.key=="Escape")closeModals()});
document.querySelectorAll(".modal").forEach(m=>m.addEventListener("pointerdown",e=>{if(e.target===m)closeModals()}));

/* ---------- Botões ---------- */
$("lvToggle").onclick=$("starBtn").onclick=ACTS.map;$("cfgBtn").onclick=ACTS.cfg;$("sndBtn").onclick=ACTS.snd;
$("prevLv").onclick=()=>loadLevel(lvl-1);$("nextLv").onclick=()=>loadLevel(lvl+1);$("tipBtn").onclick=showTip;
$("run").onclick=()=>{if(!running){stepping=false;run()}else{stopReq=true;if(stepRes)stepRes()}};
$("step").onclick=()=>{if(!running){stepping=true;run()}else if(stepRes)stepRes();else{stepping=true;setCtl()}};
$("reset").onclick=()=>{if(!running){varSt=null;resetBoard();showMission()}};
$("undo").onclick=undo;
$("clear").onclick=()=>{if(!editable())return;const L=LEVELS[lvl];if(!countBlocks(P)&&L.type!="fix")return;snap();if(L.type=="fix")P=PGP(L.pre);else P={m:[],A:L.lockFn?P.A:[],B:[]};Snd.del();changed()};
$("spdBtn").onclick=()=>{save.spd=(save.spd+1)%SPEEDS.length;persist();drawSpd();Snd.click()};

/* ---------- Início ---------- */
let booted=false;
function start(hot){if(booted)return;booted=true;document.querySelectorAll("[data-ic]").forEach(el=>el.insertAdjacentHTML("afterbegin",ic(el.dataset.ic)));
 loadSave();if(!SKINS[save.skin]||!skinOpen(save.skin))save.skin="amarelo";
 if(hot&&hot.drafts)for(const t in hot.drafts){const p=reviveProg(hot.drafts[t]);if(p)drafts[t]=p}   // página atualizada com o jogo aberto: mantém os programas
 Snd.on=!!save.snd;document.documentElement.style.setProperty("--skin",SKINS[save.skin]);$("brandFace").innerHTML=bip("happy");drawSnd();drawSpd();
 init3D();let i=LEVELS.findIndex(l=>l.t==save.lvl);if(i<0||!unlocked(i))i=Math.max(0,LEVELS.findIndex((l,k)=>!isDone(k)&&unlocked(k)));loadLevel(i,{force:1})}
(()=>{let hot=null;try{hot=window.claude&&window.claude.hot||null;if(hot&&hot.snapshot)hot.snapshot(()=>({drafts}))}catch(e){hot=null}
 if(hot&&hot.ready){try{hot.ready(start)}catch(e){}setTimeout(()=>start({}),1500)}else start(hot&&hot.data||{})})();
