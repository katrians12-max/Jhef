/* =====================================================================
   BIPV · Bipcoins, catálogo da loja e o Bip 3D personalizado.
   Usado pelo menu (saguão e loja) e pela Academia. Precisa do THREE (r128).
   ===================================================================== */
const BIPV=(()=>{
/* ---------- Bipcoins ---------- */
const BONUS=100,POR_AULA=50,POR_FASE=10,POR_ESTRELA=5;
const ls=k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}};
/* quanto o aluno já ganhou: sempre calculado a partir do progresso (não dá para duplicar) */
function ganhos(robo,acad,run){let c=BONUS;const st=(robo&&robo.stars)||{};for(const k in st){const s=+st[k]||0;if(s>0)c+=POR_FASE+POR_ESTRELA*Math.min(3,s)}
 c+=((acad&&acad.done)||[]).length*POR_AULA;return c+ganhosRunner(run)+ganhosSnake(run)+ganhosDefesa(run)+ganhosBomber(run)+ganhosSpace(run)+ganhosVez(run&&run.tempo)}
/* Bip Runner: o jogo guarda quanto rendeu em cada dia; cada dia vale no máximo RUN_DIA */
const RUN_DIA=60,runKey=pid=>"bipsite-runner:"+pid;
function ganhosRunner(run){let c=0;const m=(run&&run.coins)||{};for(const k in m)c+=Math.max(0,Math.min(RUN_DIA,Math.floor(+m[k]||0)));return c}
/* Bip Snake: guarda junto com o Runner (mesma chave), em scoins; cada dia vale no máximo SNAKE_DIA */
const SNAKE_DIA=60;
function ganhosSnake(run){let c=0;const m=(run&&run.scoins)||{};for(const k in m)c+=Math.max(0,Math.min(SNAKE_DIA,Math.floor(+m[k]||0)));return c}
const snakeBest=run=>{const b=(run&&run.best)||{};return Math.max(+b.snakemisto||0,+b.snakeregras||0,+b.snakecontas||0)};
/* Bip Defesa (infinito): também na chave do Runner. Recorde em best.definf = ondas vencidas × 100000 + pontos;
   Bipcoins do dia em dcoins, no máximo DEF_DIA */
const DEF_DIA=60;
function ganhosDefesa(run){let c=0;const m=(run&&run.dcoins)||{};for(const k in m)c+=Math.max(0,Math.min(DEF_DIA,Math.floor(+m[k]||0)));return c}
const defesaBest=run=>+(((run&&run.best)||{}).definf)||0;
const defesaDec=v=>({onda:Math.floor((+v||0)/100000),pts:(+v||0)%100000});
/* Bip Bomber: também na chave do Runner. Recorde em best.bomber = arenas vencidas × 100000 + pontos;
   bruns = partidas, bcoins = Bipcoins do dia (no máximo BOMB_DIA), bmeta = estrelas, conquistas e totais */
const BOMB_DIA=60;
function ganhosBomber(run){let c=0;const m=(run&&run.bcoins)||{};for(const k in m)c+=Math.max(0,Math.min(BOMB_DIA,Math.floor(+m[k]||0)));return c}
const bomberBest=run=>+(((run&&run.best)||{}).bomber)||0;
const bomberDec=v=>({arena:Math.floor((+v||0)/100000),pts:(+v||0)%100000});
/* Bip Space: também na chave do Runner. best.space = altitude máxima na unidade do jogo (p); xruns = decolagens;
   xcoins = Bipcoins do dia (no máximo SPACE_DIA); tot.space = {ok,bad} contas certas e erradas.
   SPACE_ROTA converte p em km de verdade (camadas da atmosfera e distâncias dos planetas). */
const SPACE_DIA=60;
function ganhosSpace(run){let c=0;const m=(run&&run.xcoins)||{};for(const k in m)c+=Math.max(0,Math.min(SPACE_DIA,Math.floor(+m[k]||0)));return c}
const spaceBest=run=>+(((run&&run.best)||{}).space)||0;
const SPACE_ROTA=[[0,0],[40,12],[100,50],[160,85],[330,600],[520,1e4],[900,384400],[1600,55e6],[3000,588e6],[5000,1.2e9],[8000,2.6e9],[12000,4.3e9],[18000,2e10]];
const SPACE_ZONAS=[[0,"Troposfera"],[40,"Estratosfera"],[100,"Mesosfera"],[160,"Termosfera"],[330,"Exosfera"],[520,"Espaço sideral"],[900,"Lua",1],[1600,"Marte",1],[3000,"Júpiter",1],[5000,"Saturno",1],[8000,"Urano",1],[12000,"Netuno",1],[18000,"Espaço profundo"]];
function spaceKm(p){p=Math.max(0,+p||0);const R=SPACE_ROTA,U=R[R.length-1];if(p>U[0])return U[1]*p/U[0];for(let i=1;i<R.length;i++){const [p0,k0]=R[i-1],[p1,k1]=R[i];if(p<=p1||i==R.length-1){const t=(p-p0)/(p1-p0);return i<=4?k0+(k1-k0)*t:k0*Math.pow(k1/k0,t)}}}
function spaceFmt(p){const k=spaceKm(p),n=(x,d)=>x.toLocaleString("pt-BR",{maximumFractionDigits:d,minimumFractionDigits:0});
 if(k<1e3)return n(Math.round(k),0)+" km";if(k<1e6)return n(Math.round(k/1e3),0)+" mil km";if(k<1e9){const m=k/1e6;return n(m,m<10?1:0)+(m<2?" milhão":" milhões")+" de km"}
 const b=k/1e9;return n(b,b<10?1:0)+(b<2?" bilhão":" bilhões")+" de km"}
function spaceZona(p){let z=SPACE_ZONAS[0];for(const x of SPACE_ZONAS)if(p>=x[0]*(x[2]?.96:1))z=x;return z[1]}
/* ===== EQUILÍBRIO DO BIP (modo turma): minutos de jogo ativo por jogo, últimos 7 dias =====
   tempo = {d:{dia:{jogo:segundos}}, vez:{dia:segundos no "jogo da vez"}, eq:{bloq:{jogo:{falta}}, cred:{jogo:segundos}, t}}
   Um jogo com mais de EQ_LIM do tempo da semana "descansa" até o aluno jogar EQ_DESC nos jogos abaixo da média;
   depois ganha EQ_CRED de folga. Os 2 jogos menos jogados são os "jogos da vez": +1 Bipcoin por minuto (até VEZ_DIA). */
const JOGOS=["robo","academia","runner","snake","defesa","bomber","space"];
const NOME_JOGO={robo:"Robô Programador",academia:"Academia do Bip",runner:"Bip Runner",snake:"Bip Snake",defesa:"Bip Defesa",bomber:"Bip Bomber",space:"Bip Space"};
const EQ_MIN=20*60,EQ_LIM=.35,EQ_DESC=6*60,EQ_CRED=8*60,VEZ_DIA=20;
const tempoKey=pid=>"bipsite-tempo:"+pid;
const diaDe=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
function tempo7(tp,agora){const o={};JOGOS.forEach(g=>o[g]=0);const d=(tp&&tp.d)||{},hoje=agora||new Date();
 for(let i=0;i<7;i++){const x=new Date(hoje);x.setDate(x.getDate()-i);const k=diaDe(x);for(const g in d[k]||{})if(g in o)o[g]+=+d[k][g]||0}return o}
function ganhosVez(tp){let c=0;const v=(tp&&tp.vez)||{};for(const k in v)c+=Math.max(0,Math.min(VEZ_DIA,Math.floor((+v[k]||0)/60)));return c}
function mergeTempo(a,b){if(!a)return b;if(!b)return a;const d={};for(const s of [a.d||{},b.d||{}])for(const k in s){d[k]=d[k]||{};for(const g in s[k])d[k][g]=Math.max(+d[k][g]||0,+s[k][g]||0)}
 const vez={...(a.vez||{})};for(const k in b.vez||{})vez[k]=Math.max(+vez[k]||0,+b.vez[k]||0);
 const fa=a.foco,fb=b.foco;let foco=fa||fb;
 if(fa&&fb)foco=fa.id==fb.id?{id:fa.id,base:Math.min(+fa.base||0,+fb.base||0),gasto:Math.max(+fa.gasto||0,+fb.gasto||0),volta:Math.max(+fa.volta||0,+fb.volta||0),bonus:Math.max(+fa.bonus||0,+fb.bonus||0),rev:(()=>{const r=Object.assign({},fa.rev||{});for(const k in fb.rev||{})if(!r[k]||fb.rev[k]>r[k])r[k]=fb.rev[k];return r})(),
   vezAtual:Math.max(+fa.vezAtual||0,+fb.vezAtual||0),vezSeg:Math.max(+fa.vezSeg||0,+fb.vezSeg||0),vez:((fa.vez||{}).dia||"")>=((fb.vez||{}).dia||"")?fa.vez:fb.vez}:(String(fa.id)>String(fb.id)?fa:fb);
 const r={d,vez,eq:(((a.eq||{}).t||0)>=((b.eq||{}).t||0)?a.eq:b.eq)||{}};if(foco)r.foco=foco;return r}
/* ===== MODO FOCO (o professor liga por turma): cada aula da Academia ou fase NOVA do Robô dá ⚡2;
   cada partida de jogo rápido (Runner, Snake, Defesa, Bomber, Space) gasta ⚡1. Sem limite: quanto mais aulas, mais energia.
   A energia não fica guardada como número: é (aulas+fases concluídas desde que o Foco foi ligado) × 2 − partidas jogadas.
   tempo.foco = {id: quando o professor ligou, base: aulas+fases que o aluno já tinha, gasto: partidas} */
/* lista das fases do Robô e das aulas da Academia (o build preenche): para saber o que falta e quem terminou tudo */
const CONTEUDO=/*CONTEUDO*/{robo:[],academia:[]};
function progressoAulas(robo,acad){const st=(robo&&robo.stars)||{},dn=new Set((acad&&acad.done)||[]);
 const faltaRobo=CONTEUDO.robo.filter(t=>!(+st[t]>0)).length,faltaAcad=CONTEUDO.academia.filter(x=>!dn.has(x)).length;
 return {faltaRobo,faltaAcad,mestre:CONTEUDO.robo.length>0&&CONTEUDO.academia.length>0&&!faltaRobo&&!faltaAcad}}
/* para onde mandar o aluno ganhar energia: aula nova da Academia > fase nova do Robô > revisão */
function focoAlvo(pid){const p=progressoAulas(ls("robo4:"+pid),ls("academia-bip-3d-v1:"+pid));
 return p.faltaAcad?{jogo:"academia",txt:"Fazer uma aula"}:p.faltaRobo?{jogo:"robo",txt:"Fazer uma fase do Robô"}:{jogo:"academia",txt:"Revisar uma aula"}}
const FOCO_AULA=2,FOCO_REV=1,FOCO_REV_DIAS=7,JOGOS_RAPIDOS=["runner","snake","defesa","bomber","space"],FOCO_CANSADO=.4,FOCO_MIN=15*60,FOCO_VOLTA=180;
/* para o aluno aprender TODOS os jogos, o preço muda: o jogo rápido que ele menos jogou na semana é o "⭐ jogo da vez"
   (custa ⚡1, mas a cada 3 min jogando de verdade a energia volta: na prática é de graça para quem se esforça);
   o jogo que passou de 40% do tempo dele nos jogos rápidos da semana fica "cansado" e custa ⚡2. */
function focoVez(tp){const f=tp.foco,hoje=diaDe(new Date());if(f.vez&&f.vez.dia==hoje&&JOGOS_RAPIDOS.includes(f.vez.g))return f.vez.g;
 const t=tempo7(tp),g=JOGOS_RAPIDOS.slice().sort((x,y)=>t[x]-t[y])[0];f.vez={dia:hoje,g};return g}
function precos(tp){const t=tempo7(tp),T=JOGOS_RAPIDOS.reduce((s,x)=>s+t[x],0),vez=focoVez(tp),o={};
 for(const g of JOGOS_RAPIDOS)o[g]=g==vez?1:(T>=FOCO_MIN&&t[g]/T>FOCO_CANSADO?2:1);return {vez,preco:o}}
const concluidas=(robo,acad)=>{let n=0;const st=(robo&&robo.stars)||{};for(const k in st)if(+st[k]>0)n++;return n+((acad&&acad.done)||[]).length};
function focoDe(pid){const p=(ls("bipsite-profiles")||[]).find(q=>q.id==pid),t=p&&p.cloud&&p.cloud.turma;return t&&t.foco?String(t.foco_em||"ligado"):null}
function energia(pid){const id=focoDe(pid);if(!id)return null;const k=tempoKey(pid),tp=ls(k)||{},n=concluidas(ls("robo4:"+pid),ls("academia-bip-3d-v1:"+pid));
 if(!tp.foco||tp.foco.id!=id)tp.foco={id,base:n,gasto:0};
 const P=precos(tp);try{localStorage.setItem(k,JSON.stringify(tp))}catch(e){}
 const f=tp.foco,bonus=+f.bonus||0,ganhou=FOCO_AULA*Math.max(0,n-(+f.base||0))+bonus,gasto=+f.gasto||0,volta=+f.volta||0,
  mestre=progressoAulas(ls("robo4:"+pid),ls("academia-bip-3d-v1:"+pid)).mestre;
 return {id,ganhou,bonus,gasto,volta,energia:ganhou-gasto+volta,vez:P.vez,preco:P.preco,vezSeg:+f.vezSeg||0,mestre}}
/* Academia e Robô chamam quando o aluno termina uma aula/fase que JÁ tinha feito (antes = estrelas que tinha):
   melhorou as estrelas → ⚡1; revisão boa (2★ ou mais) → ⚡1, no máximo uma vez por semana em cada aula/fase */
function focoAula(pid,key,antes,depois){const e=energia(pid);if(!e||e.mestre||!antes)return 0;
 const k=tempoKey(pid),tp=ls(k)||{},f=tp.foco;if(!f)return 0;f.rev=f.rev||{};const hoje=diaDe(new Date()),ult=f.rev[key];
 const dias=ult?Math.round((Date.parse(hoje)-Date.parse(ult))/864e5):99;let n=0,msg;
 if(depois>antes){n=FOCO_REV;msg=`⚡+${FOCO_REV} de energia: você melhorou as estrelas!`}
 else if(depois>=2&&dias>=FOCO_REV_DIAS){n=FOCO_REV;msg=`⚡+${FOCO_REV} de energia pela revisão!`}
 else if(depois>=2)msg=`Boa revisão! Esta aula volta a dar energia em ${FOCO_REV_DIAS-dias} ${FOCO_REV_DIAS-dias==1?"dia":"dias"}.`;
 else msg=`Revise com no máximo 2 erros para ganhar ⚡${FOCO_REV}.`;
 if(n){f.bonus=(+f.bonus||0)+n;f.rev[key]=hoje;try{localStorage.setItem(k,JSON.stringify(tp))}catch(e){}}
 focoAviso(msg,!!n);return n}
function focoAviso(msg,bom){if(typeof document=="undefined")return;let t=document.getElementById("bipFocoAviso");
 if(!t){t=document.createElement("div");t.id="bipFocoAviso";t.setAttribute("role","status");document.body.appendChild(t)}
 t.style.cssText=`position:fixed;left:50%;bottom:max(22px,env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:9999;max-width:calc(100% - 32px);padding:10px 18px;border-radius:14px;font:700 15px/1.3 system-ui,sans-serif;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.35);background:${bom?"#f2c230":"#1d2a4a"};color:${bom?"#2a1a00":"#fff"};transition:opacity .3s;opacity:1`;
 t.textContent=msg;clearTimeout(t._h);t._h=setTimeout(()=>{t.style.opacity="0"},4200)}
/* chamado a cada 5 s de jogo de verdade (pelo saguão): no jogo da vez, a cada 3 min devolve ⚡1 (no máximo 1 por partida) */
function focoConta(pid,g,s){const e=energia(pid);if(!e||g!=e.vez)return false;const k=tempoKey(pid),tp=ls(k)||{},f=tp.foco;if(!f)return false;
 let volta=false;if(f.vezAtual){f.vezSeg=(+f.vezSeg||0)+s;if(f.vezSeg>=FOCO_VOLTA){f.vezSeg=0;f.vezAtual=0;f.volta=(+f.volta||0)+1;volta=true}}else f.vezSeg=0;
 try{localStorage.setItem(k,JSON.stringify(tp))}catch(e){}return volta}
/* chamado quando uma partida começa: gasta ⚡1. Sem energia, mostra o aviso e a partida não começa. */
function focoGasta(pid,g){const e=energia(pid);if(!e||e.mestre){focoMostra(pid,g);return true}const p=e.preco[g]||1;
 if(e.energia<p){focoSemEnergia(p,e,g);focoMostra(pid,g);return false}
 const k=tempoKey(pid),tp=ls(k)||{};tp.foco.gasto=(+tp.foco.gasto||0)+p;tp.foco.vezAtual=g==e.vez?1:0;tp.foco.vezSeg=0;/* só a partida que acabou de começar pode devolver ⚡1 */
 try{localStorage.setItem(k,JSON.stringify(tp))}catch(e){}focoMostra(pid,g);return true}
const precoTxt=(e,g)=>g==e.vez?`⭐ Este é o seu <b>jogo da vez</b>: a partida gasta ⚡1, mas jogando 3 minutos a energia volta.`
 :e.preco[g]>1?`😮‍💨 Você jogou muito este jogo: cada partida gasta <b>⚡${e.preco[g]}</b>. O jogo da vez (${NOME_JOGO[e.vez]}) sai de graça.`:`Cada partida gasta ⚡1.`;
function focoMostra(pid,g){if(typeof document=="undefined")return;const e=energia(pid);
 document.querySelectorAll("#bGo,#bAgain,#bNovo").forEach(b=>{const row=b.parentElement;let el=row.parentElement.querySelector(":scope > .bip-foco");
  if(!e){if(el)el.remove();return}
  if(!el){el=document.createElement("p");el.className="bip-foco";el.style.cssText="margin:0;padding:8px 12px;border-radius:12px;background:rgba(242,194,48,.14);border:1px solid rgba(242,194,48,.5);color:#ffe9a6;font-weight:700;font-size:.92rem;text-align:center";row.parentElement.insertBefore(el,row)}
  el.innerHTML=e.mestre?`🏆 Mestre do Bip! Você terminou todas as aulas e fases: os jogos rápidos estão liberados.`:e.energia>0?`⚡ Modo foco · você tem <b style="color:#fff">${e.energia}</b> ${e.energia==1?"energia":"energias"}. ${g?precoTxt(e,g):"Cada partida gasta 1."}`
   :`⚡ Modo foco · sem energia. Faça uma aula da Academia ou uma fase do Robô para ganhar ⚡${FOCO_AULA}.`})}
function focoSemEnergia(p,e,g){if(typeof document=="undefined")return;let d=document.getElementById("bipSemEnergia");if(d)d.remove();d=null;
 const tit=e&&e.energia>0?`Falta energia`:`Sem energia`,extra=e&&e.energia>0&&p>1?`<p style="margin:0;color:#ffe9a6">Este jogo está <b>cansado</b> (⚡${p} por partida) porque você jogou muito ele. O <b>⭐ jogo da vez</b> (${NOME_JOGO[e.vez]}) sai de graça!</p>`:"";
 if(!d){d=document.createElement("div");d.id="bipSemEnergia";d.setAttribute("role","alertdialog");d.setAttribute("aria-modal","true");
  d.style.cssText="position:fixed;inset:0;z-index:99;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(5,8,22,.78);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)";
  d.innerHTML=`<div style="max-width:400px;background:#121a36;border:1px solid rgba(255,255,255,.2);border-radius:22px;padding:24px;text-align:center;color:#fff;font-family:inherit;display:flex;flex-direction:column;gap:12px;align-items:center">
   <div style="font-size:3rem;line-height:1">⚡</div><b style="font-size:1.4rem">${tit}</b>${extra}
   <p style="margin:0;color:#c9d3f5">O professor ligou o <b>Modo foco</b>. Cada aula da Academia ou fase nova do Robô dá <b>⚡${FOCO_AULA}</b>, e cada partida gasta ⚡1.</p>
   <button id="bipSemVolta" style="font:inherit;font-weight:800;border:0;border-radius:14px;padding:10px 20px;background:#f2c230;color:#2a1a00;cursor:pointer">← Voltar e fazer uma aula</button>
   <button id="bipSemFica" style="font:inherit;border:0;background:none;color:#c9d3f5;text-decoration:underline;cursor:pointer">Ficar aqui</button></div>`;
  document.body.appendChild(d);
  d.querySelector("#bipSemVolta").onclick=()=>{d.remove();const a=document.querySelector("a.back");if(a)a.click();else location.href="./"};
  d.querySelector("#bipSemFica").onclick=()=>d.remove()}
 d.querySelector("#bipSemVolta").focus()}
function equilibrio(tp){const t=tempo7(tp),T=JOGOS.reduce((s,g)=>s+t[g],0),eq=(tp&&tp.eq)||{},bloq=eq.bloq||{},media=T/JOGOS.length;
 const vd=eq.vd&&eq.vd.dia==diaDe(new Date())?eq.vd.g:null,/* os jogos da vez ficam fixos o dia inteiro */
  vez=(vd||(T>=600?JOGOS.filter(g=>t[g]<media).sort((x,y)=>t[x]-t[y]).slice(0,2):[])).filter(g=>!bloq[g]);
 return {t,T,media,ativo:T>=EQ_MIN,vez,bloq,cred:eq.cred||{}}}
const lojaKey=pid=>"bipsite-loja:"+pid;
/* loja: itens comprados, visual escolhido e o desconto de cada conjunto comprado (kits) */
function loja(pid){const l=ls(lojaKey(pid))||{};return {owned:Array.isArray(l.owned)?l.owned:[],look:Object.assign({},DEFAULT,l.look||{}),kits:(l.kits&&typeof l.kits=="object")?l.kits:{},t:l.t||0}}
function salvarLoja(pid,l){l.t=Date.now();try{localStorage.setItem(lojaKey(pid),JSON.stringify({owned:l.owned,look:l.look,kits:l.kits||{},t:l.t}))}catch(e){}}
/* gasto = preço de tudo que foi comprado, menos o desconto dos conjuntos (cada desconto vale no máximo 25% do conjunto) */
function gasto(owned,kits){let g=owned.reduce((s,id)=>s+((BYID[id]&&BYID[id].p)||0),0);for(const k in kits||{}){const c=KIT[k];if(!c)continue;const cheio=c.itens.reduce((s,id)=>s+BYID[id].p,0);g-=Math.max(0,Math.min(Math.round(cheio*.25),Math.floor(+kits[k]||0)))}return g}
function saldo(pid){const l=loja(pid),tp=ls(tempoKey(pid)),run=ls(runKey(pid));return ganhos(ls("robo4:"+pid),ls("academia-bip-3d-v1:"+pid),tp?Object.assign({},run||{},{tempo:tp}):run)-gasto(l.owned,l.kits)}
const COIN='<svg class="coin" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#f2b20a"/><circle cx="12" cy="12" r="8.4" fill="#ffd24a" stroke="#c98a00" stroke-width="1.4"/><path d="M9.4 6.8h3.5c1.9 0 3 .9 3 2.4 0 1-.6 1.7-1.5 2 1.2.3 1.9 1.1 1.9 2.3 0 1.7-1.3 2.7-3.3 2.7H9.4zm2 1.6v2.5h1.3c.9 0 1.4-.4 1.4-1.3 0-.8-.5-1.2-1.4-1.2zm0 4v2.8h1.6c1 0 1.5-.5 1.5-1.4s-.6-1.4-1.6-1.4z" fill="#8a5a00"/></svg>';
const fmt=n=>Math.max(0,n).toLocaleString("pt-BR");

/* ---------- Catálogo ---------- */
const RAR={comum:{n:"Comum",c:"#7d8a9a"},raro:{n:"Raro",c:"#2f7be0"},epico:{n:"Épico",c:"#9b4de0"},lendario:{n:"Lendário",c:"#e89a00"}};
const CATS=[["pintura","Pintura"],["olhos","Olhos"],["tela","Cor dos olhos"],["antena","Antena"],["cabeca","Cabeça"],["rosto","Rosto"],["pescoco","Pescoço"],["costas","Costas"],["efeito","Efeitos"],["cenario","Cenários"]];
const I=(cat,id,n,r,p,o={})=>Object.assign({cat,id,n,r,p},o);
const ITEMS=[
 /* pinturas */
 I("pintura","p-amarelo","Amarelo Bip","comum",0,{c:"#f2c230"}),
 I("pintura","p-laranja","Laranja","comum",40,{c:"#f08a2c"}),I("pintura","p-verde","Verde","comum",40,{c:"#58b84c"}),I("pintura","p-azul","Azul","comum",40,{c:"#4a90e2"}),
 I("pintura","p-rosa","Rosa","comum",40,{c:"#ee6fae"}),I("pintura","p-roxo","Roxo","comum",40,{c:"#8e6ae0"}),I("pintura","p-vermelho","Vermelho","comum",50,{c:"#e2503f"}),
 I("pintura","p-branco","Branco","comum",50,{c:"#eef1f5"}),I("pintura","p-preto","Preto fosco","comum",60,{c:"#2d323c"}),I("pintura","p-menta","Menta","comum",60,{c:"#7fdcc4"}),
 I("pintura","p-listras","Listras","raro",140,{c:"#f2c230",pat:"listras",c2:"#ee5f2b"}),I("pintura","p-bolinhas","Bolinhas","raro",140,{c:"#4a90e2",pat:"bolinhas",c2:"#ffffff"}),
 I("pintura","p-xadrez","Xadrez","raro",160,{c:"#ffffff",pat:"xadrez",c2:"#2d323c"}),I("pintura","p-camuflagem","Camuflagem","raro",180,{c:"#6b8e4e",pat:"camuflagem"}),
 I("pintura","p-zebra","Zebra","raro",180,{c:"#f5f5f5",pat:"zebra",c2:"#1d1d1d"}),
 I("pintura","p-ouro","Ouro","epico",450,{c:"#ffc21a",metal:.85,rough:.25,emis:"#5a3c00"}),I("pintura","p-cromado","Cromado","epico",450,{c:"#d9dee6",metal:.95,rough:.15}),
 I("pintura","p-neon","Neon","epico",520,{c:"#18e0d0",emis:"#0c8f86",glow:1}),I("pintura","p-circuito","Circuito","epico",560,{c:"#16243a",pat:"circuito",c2:"#3cf2c8",emis:"#0a3a40"}),
 I("pintura","p-lava","Lava","epico",600,{c:"#2a1410",pat:"lava",c2:"#ff6a1a",emis:"#5a1a00"}),
 I("pintura","p-galaxia","Galáxia","lendario",1300,{c:"#1a1446",pat:"galaxia",emis:"#1a1050"}),I("pintura","p-arcoiris","Arco-íris","lendario",1500,{c:"#ff4d6d",rainbow:1}),
 I("pintura","p-diamante","Diamante","lendario",1800,{c:"#bfefff",metal:.6,rough:.05,emis:"#2a6a80",pat:"diamante"}),
 /* formato dos olhos */
 I("olhos","o-classico","Clássico","comum",0),I("olhos","o-redondos","Redondos","comum",50),I("olhos","o-quadrados","Pixel","comum",60),I("olhos","o-sono","Sonolentos","comum",60),
 I("olhos","o-coracao","Corações","raro",150),I("olhos","o-estrela","Estrelas","raro",150),I("olhos","o-visor","Visor","raro",200),
 I("olhos","o-anime","Anime","epico",420),I("olhos","o-raio","Raios","epico",480),I("olhos","o-ciclope","Ciclope","epico",450),
 I("olhos","o-espiral","Hipnose","lendario",1200),I("olhos","o-galaxia","Olhos de galáxia","lendario",1400),
 /* cor dos olhos */
 I("tela","t-ciano","Ciano","comum",0,{c:"#5ef0e0"}),I("tela","t-verde","Verde","comum",30,{c:"#7dff7a"}),I("tela","t-amarelo","Amarelo","comum",30,{c:"#ffe14d"}),
 I("tela","t-rosa","Rosa","comum",30,{c:"#ff8ad8"}),I("tela","t-branco","Branco","comum",30,{c:"#ffffff"}),I("tela","t-laranja","Laranja","comum",40,{c:"#ffa040"}),
 I("tela","t-vermelho","Vermelho","raro",120,{c:"#ff4d4d"}),I("tela","t-roxo","Violeta","raro",120,{c:"#b98cff"}),
 I("tela","t-ouro","Dourado","epico",400,{c:"#ffd24a",grad:["#fff3b0","#ffb000"]}),I("tela","t-arcoiris","Arco-íris","lendario",1000,{c:"#ff6b9a",grad:["#ff4d6d","#ffd24a","#5ef07a","#4ad8ff","#b98cff"]}),
 /* antena */
 I("antena","a-bola","Bolinha","comum",0,{c:"#ee5f2b"}),I("antena","a-azul","Bolinha azul","comum",30,{c:"#2f8cff"}),I("antena","a-lampada","Lâmpada","comum",60,{c:"#ffe14d"}),
 I("antena","a-coracao","Coração","raro",140,{c:"#ff4d8a"}),I("antena","a-estrela","Estrela","raro",140,{c:"#ffd24a"}),I("antena","a-flor","Flor","raro",160,{c:"#ff8ad8"}),
 I("antena","a-raio","Raio","raro",180,{c:"#ffe14d"}),I("antena","a-dupla","Antena dupla","raro",200,{c:"#7dff7a"}),
 I("antena","a-helice","Hélice","epico",450),I("antena","a-unicornio","Chifre de unicórnio","epico",600),I("antena","a-aureola","Auréola","lendario",1100),
 /* cabeça */
 I("cabeca","c-bone","Boné","comum",70,{c:"#2f6fd6",hide:1}),I("cabeca","c-gorro","Gorro","comum",70,{c:"#e2503f",hide:1}),I("cabeca","c-festa","Chapéu de festa","comum",80,{c:"#ff6fae",hide:1}),
 I("cabeca","c-gato","Orelhas de gato","raro",150,{c:"#2d323c"}),I("cabeca","c-fones","Fones de ouvido","raro",180,{c:"#2d323c"}),I("cabeca","c-ninja","Faixa ninja","raro",150,{c:"#e2503f"}),
 I("cabeca","c-chef","Chapéu de chef","raro",190,{c:"#ffffff",hide:1}),I("cabeca","c-cartola","Cartola","epico",420,{c:"#1d1f26",hide:1}),I("cabeca","c-mago","Chapéu de mago","epico",500,{c:"#5b3cc4",hide:1}),
 I("cabeca","c-viking","Capacete viking","epico",520,{c:"#9aa3ad",hide:1}),I("cabeca","c-coroa","Coroa","lendario",1200,{c:"#ffc21a",hide:1}),I("cabeca","c-astronauta","Capacete de astronauta","lendario",1500),
 /* rosto */
 I("rosto","r-palhaco","Nariz de palhaço","comum",40),I("rosto","r-bigode","Bigode","comum",60),I("rosto","r-redondos","Óculos redondos","comum",70),
 I("rosto","r-pirata","Tapa-olho pirata","raro",130),I("rosto","r-escuros","Óculos escuros","raro",160),I("rosto","r-heroi","Máscara de herói","raro",190),I("rosto","r-monoculo","Monóculo","epico",400),
 /* pescoço */
 I("pescoco","n-borboleta","Gravata borboleta","comum",50,{c:"#e2503f"}),I("pescoco","n-gravata","Gravata","comum",60,{c:"#2f6fd6"}),I("pescoco","n-cachecol","Cachecol","raro",140,{c:"#e2503f",c2:"#ffffff"}),
 I("pescoco","n-perolas","Colar de pérolas","raro",170),I("pescoco","n-medalha","Medalha de ouro","epico",450),I("pescoco","n-corrente","Corrente de ouro","lendario",1000),
 /* costas */
 I("costas","b-mochila","Mochila escolar","comum",80,{c:"#2f8cff"}),I("costas","b-casco","Casco de tartaruga","comum",90,{c:"#4f9a3c"}),I("costas","b-capa","Capa de herói","raro",200,{c:"#e2503f"}),
 I("costas","b-morcego","Asas de morcego","epico",480),I("costas","b-borboleta","Asas de borboleta","epico",520),I("costas","b-jetpack","Jetpack","epico",650),I("costas","b-anjo","Asas de anjo","lendario",1600),
 /* efeitos */
 I("efeito","e-brilhos","Brilhinhos","raro",220,{c:"#fff3b0"}),I("efeito","e-coracoes","Corações","epico",480,{c:"#ff6fae"}),I("efeito","e-aura","Aura dourada","epico",600,{c:"#ffc21a"}),
 I("efeito","e-estrelas","Chuva de estrelas","lendario",1300,{c:"#ffe14d"}),I("efeito","e-arcoiris","Anel arco-íris","lendario",1700),
 /* cenários do saguão (o mundo em volta do Bip) */
 I("cenario","s-neon","Neon espacial","comum",0),I("cenario","s-praia","Praia ao pôr do sol","comum",300),I("cenario","s-neve","Montanhas nevadas","comum",300),
 I("cenario","s-floresta","Floresta amazônica","raro",600),I("cenario","s-pantanal","Pantanal","raro",600),I("cenario","s-cidade","Cidade à noite","raro",700),
 I("cenario","s-mar","Fundo do mar","epico",1200),I("cenario","s-egito","Egito","epico",1200),I("cenario","s-paris","Paris","epico",1500),I("cenario","s-lua","Base na Lua","lendario",2500)];
/* conjuntos: vários itens de um tema, com 15% de desconto no que o aluno ainda não tem */
const KITS=[{id:"k-festa",n:"Festa",d:"Para comemorar cada fase!",itens:["p-bolinhas","c-festa","r-palhaco","n-borboleta","e-brilhos"]},
 {id:"k-pirata",n:"Pirata",d:"Rumo ao tesouro escondido.",itens:["p-listras","c-ninja","r-pirata","n-cachecol"]},
 {id:"k-heroi",n:"Super-herói",d:"Capa, máscara e um raio.",itens:["p-vermelho","a-raio","r-heroi","b-capa"]},
 {id:"k-mago",n:"Mago dos números",d:"Chapéu, estrela e brilhos.",itens:["p-roxo","c-mago","a-estrela","e-brilhos"]},
 {id:"k-astro",n:"Astronauta",d:"Pronto para a Base na Lua.",itens:["p-cromado","o-visor","c-astronauta","b-jetpack"]},
 {id:"k-realeza",n:"Realeza",d:"Ouro do capacete aos olhos.",itens:["p-ouro","t-ouro","c-coroa","n-perolas"]}];
const KIT={};KITS.forEach(k=>KIT[k.id]=k);
const KIT_DESC=.15;
/* preço do conjunto para este aluno: só o que falta, com desconto */
function kitPreco(k,owned){const falta=k.itens.filter(id=>!owned.includes(id)&&BYID[id].p>0),cheio=falta.reduce((s,id)=>s+BYID[id].p,0),desc=Math.round(cheio*KIT_DESC/10)*10;return {falta,cheio,desc,preco:cheio-desc}}
const BYID={};ITEMS.forEach(i=>BYID[i.id]=i);
const DEFAULT={pintura:"p-amarelo",olhos:"o-classico",tela:"t-ciano",antena:"a-bola",cabeca:null,rosto:null,pescoco:null,costas:null,efeito:null,cenario:"s-neon"};
const gratis=id=>BYID[id]&&BYID[id].p===0;
/* destaque do dia: um item lendário diferente a cada dia */
function destaque(){const L=ITEMS.filter(i=>i.r=="lendario"),d=Math.floor(Date.now()/864e5);return L[d%L.length]}

/* ---------- Texturas ---------- */
const TX={};
function canvas(w,h){const c=document.createElement("canvas");c.width=w;c.height=h;return [c,c.getContext("2d")]}
function patTex(it){const k="pat:"+it.id;if(TX[k])return TX[k];const [c,g]=canvas(256,256);g.fillStyle=it.c;g.fillRect(0,0,256,256);const c2=it.c2||"#fff";
 if(it.pat=="listras"){g.fillStyle=c2;for(let i=-256;i<512;i+=48){g.beginPath();g.moveTo(i,0);g.lineTo(i+24,0);g.lineTo(i+24+256,256);g.lineTo(i+256,256);g.fill()}}
 else if(it.pat=="bolinhas"){g.fillStyle=c2;for(let y=0;y<256;y+=42)for(let x=(y/42%2)*21;x<256;x+=42){g.beginPath();g.arc(x,y,9,0,7);g.fill()}}
 else if(it.pat=="xadrez"){g.fillStyle=c2;for(let y=0;y<8;y++)for(let x=0;x<8;x++)if((x+y)%2)g.fillRect(x*32,y*32,32,32)}
 else if(it.pat=="camuflagem"){const cs=["#4d6b38","#8a9a5b","#3a4a2a","#a68a5b"];for(let i=0;i<60;i++){g.fillStyle=cs[i%4];g.beginPath();g.ellipse(Math.random()*256,Math.random()*256,14+Math.random()*30,10+Math.random()*20,Math.random()*3,0,7);g.fill()}}
 else if(it.pat=="zebra"){g.fillStyle=c2;for(let i=0;i<14;i++){g.beginPath();const y=i*20;g.moveTo(0,y);for(let x=0;x<=256;x+=32)g.quadraticCurveTo(x+16,y+(i%2?14:-14),x+32,y+4);g.lineTo(256,y+9);g.lineTo(0,y+9);g.fill()}}
 else if(it.pat=="circuito"){g.strokeStyle=c2;g.lineWidth=3;g.fillStyle=c2;for(let i=0;i<26;i++){let x=Math.random()*256,y=Math.random()*256;g.beginPath();g.moveTo(x,y);for(let s=0;s<3;s++){Math.random()<.5?x+=30+Math.random()*30:y+=30+Math.random()*30;g.lineTo(x,y)}g.stroke();g.beginPath();g.arc(x,y,4,0,7);g.fill()}}
 else if(it.pat=="lava"){for(let i=0;i<40;i++){const x=Math.random()*256,y=Math.random()*256,r=g.createRadialGradient(x,y,0,x,y,26);r.addColorStop(0,"#ffd24a");r.addColorStop(.4,c2);r.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=r;g.fillRect(x-30,y-30,60,60)}}
 else if(it.pat=="galaxia"){const r=g.createRadialGradient(128,128,10,128,128,180);r.addColorStop(0,"#5b3cc4");r.addColorStop(.5,"#2a1a6a");r.addColorStop(1,"#0b0a24");g.fillStyle=r;g.fillRect(0,0,256,256);
  for(let i=0;i<160;i++){g.fillStyle=`rgba(255,255,255,${.3+Math.random()*.7})`;const s=Math.random()<.9?1.2:2.6;g.fillRect(Math.random()*256,Math.random()*256,s,s)}
  g.fillStyle="rgba(255,120,220,.25)";g.beginPath();g.ellipse(90,150,70,24,.5,0,7);g.fill()}
 else if(it.pat=="diamante"){g.strokeStyle="rgba(255,255,255,.75)";g.lineWidth=2;for(let i=0;i<256;i+=32){g.beginPath();g.moveTo(i,0);g.lineTo(i+128,256);g.moveTo(i,0);g.lineTo(i-128,256);g.stroke()}}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return TX[k]=t}
function glowTex(){if(TX.glow)return TX.glow;const [c,g]=canvas(128,128),r=g.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,"rgba(255,255,255,1)");r.addColorStop(.25,"rgba(255,255,255,.55)");r.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=r;g.fillRect(0,0,128,128);return TX.glow=new THREE.CanvasTexture(c)}
function iconTex(ch,color){const k="ic:"+ch+color;if(TX[k])return TX[k];const [c,g]=canvas(128,128);g.fillStyle=color;g.shadowColor=color;g.shadowBlur=18;g.font='88px "Segoe UI Symbol","Noto Sans Symbols 2",sans-serif';g.textAlign="center";g.textBaseline="middle";g.fillText(ch,64,70);return TX[k]=new THREE.CanvasTexture(c)}

/* ---------- Rosto (tela) ---------- */
function telaFill(g,look,w){const t=BYID[look.tela]||BYID["t-ciano"];if(!t.grad)return t.c;const gr=g.createLinearGradient(40,0,w-40,0);t.grad.forEach((c,i)=>gr.addColorStop(i/(t.grad.length-1),c));return gr}
function star(g,cx,cy,r,ri,n=5){g.beginPath();for(let i=0;i<n*2;i++){const a=-Math.PI/2+i*Math.PI/n,rr=i%2?ri:r;g.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr)}g.closePath()}
function heart(g,cx,cy,s){g.beginPath();g.moveTo(cx,cy+s*.9);g.bezierCurveTo(cx-s*1.6,cy-s*.1,cx-s*.8,cy-s*1.3,cx,cy-s*.45);g.bezierCurveTo(cx+s*.8,cy-s*1.3,cx+s*1.6,cy-s*.1,cx,cy+s*.9);g.closePath()}
function drawEye(g,shape,cx,cy,happy){
 switch(shape){
  case "o-redondos":g.beginPath();g.arc(cx,cy,21,0,7);g.fill();break;
  case "o-quadrados":g.fillRect(cx-17,cy-17,34,34);g.fillStyle="#172536";g.fillRect(cx-5,cy-13,8,8);break;
  case "o-sono":g.beginPath();g.arc(cx,cy-4,20,0,Math.PI);g.fill();break;
  case "o-coracao":heart(g,cx,cy,20);g.fill();break;
  case "o-estrela":star(g,cx,cy,26,11);g.fill();break;
  case "o-anime":g.beginPath();g.ellipse(cx,cy,19,27,0,0,7);g.fill();g.fillStyle="#fff";g.beginPath();g.arc(cx-6,cy-10,7,0,7);g.fill();g.beginPath();g.arc(cx+6,cy+8,3.5,0,7);g.fill();break;
  case "o-raio":g.beginPath();g.moveTo(cx+4,cy-28);g.lineTo(cx-14,cy+4);g.lineTo(cx-1,cy+4);g.lineTo(cx-6,cy+28);g.lineTo(cx+14,cy-6);g.lineTo(cx+1,cy-6);g.closePath();g.fill();break;
  case "o-espiral":{g.lineWidth=5;g.beginPath();for(let a=0;a<6*Math.PI;a+=.2){const r=1.3*a;g.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r)}g.stroke();break}
  case "o-galaxia":{g.beginPath();g.arc(cx,cy,22,0,7);g.fill();g.fillStyle="#fff";star(g,cx-5,cy-6,9,3.5,4);g.fill();g.beginPath();g.arc(cx+8,cy+8,2.5,0,7);g.fill();break}
  default:g.beginPath();g.roundRect(cx-15,cy-23,30,46,15);g.fill()}}
function faceTex(mood,look){look=look||DEFAULT;const key=mood+"|"+look.olhos+"|"+look.tela;if(TX[key])return TX[key];
 const [c,g]=canvas(256,160);g.fillStyle="#172536";g.fillRect(0,0,256,160);const col=telaFill(g,look,256);
 g.strokeStyle=g.fillStyle=mood=="ops"?"#ff8a8a":col;g.lineCap="round";g.lineJoin="round";g.lineWidth=14;g.shadowColor=(BYID[look.tela]||{}).c||"#5ef0e0";g.shadowBlur=14;
 const shape=look.olhos||"o-classico",happy=mood=="feliz"||mood=="festa";
 const mouth=(k)=>{g.lineWidth=k=="o"?9:10;g.beginPath();if(k=="o")g.arc(128,122,12,0,7);else if(k=="reto"){g.moveTo(108,122);g.lineTo(150,122)}else if(k=="grande"){g.moveTo(96,108);g.quadraticCurveTo(128,140,160,108)}else{g.moveTo(106,118);g.quadraticCurveTo(128,132,150,118)}g.stroke()};
 if(mood=="ops"){g.lineWidth=14;g.beginPath();[[70,52],[156,52]].forEach(([x,y])=>{g.moveTo(x,y);g.lineTo(x+30,y+34);g.moveTo(x+30,y);g.lineTo(x,y+34)});g.stroke();mouth("o")}
 else if(mood=="pisca"){g.lineWidth=12;g.beginPath();g.moveTo(70,70);g.lineTo(100,70);g.moveTo(156,70);g.lineTo(186,70);g.stroke();mouth()}
 else if(shape=="o-visor"){const y=happy?58:mood=="pensa"?48:62;g.beginPath();g.roundRect(56,y-14,144,28,14);g.fill();g.fillStyle="rgba(255,255,255,.6)";g.fillRect(64,y-8,40,5);g.fillStyle=col;mouth(happy?"grande":mood=="pensa"?"reto":"")}
 else if(shape=="o-ciclope"){const y=happy?60:mood=="pensa"?52:66;g.beginPath();g.arc(128,y,happy?30:34,0,7);g.fill();g.fillStyle="#172536";g.beginPath();g.arc(128+(mood=="pensa"?8:0),y-(mood=="pensa"?6:0),12,0,7);g.fill();g.fillStyle=col;mouth(happy?"grande":mood=="pensa"?"reto":"")}
 else if(happy&&shape=="o-classico"){g.beginPath();g.moveTo(66,82);g.quadraticCurveTo(85,50,104,82);g.moveTo(152,82);g.quadraticCurveTo(171,50,190,82);g.stroke();mouth("grande")}
 else{const y=happy?60:mood=="pensa"?54:67,s=mood=="pensa"?.85:1;[85,171].forEach(x=>{g.save();g.translate(x,y);g.scale(s,happy?.8:s);g.fillStyle=col;g.strokeStyle=col;drawEye(g,shape,0,0,happy);g.restore()});
  mouth(happy?"grande":mood=="pensa"?"reto":"")}
 const t=new THREE.CanvasTexture(c);t.anisotropy=4;return TX[key]=t}
/* miniatura 2D dos olhos (para a loja) */
function eyePreview(id,telaId){const [c,g]=canvas(256,160);const look=Object.assign({},DEFAULT,{olhos:id||"o-classico",tela:telaId||"t-ciano"});const t=faceTex("normal",look);g.drawImage(t.image,0,0);return c.toDataURL()}

/* ---------- Corpo do Bip ---------- */
function mat(c,o={}){return new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.55,metalness:.05},o))}
function buildBody(){const g=new THREE.Group(),inner=new THREE.Group(),Y=mat(0xf2c230,{roughness:.4}),Dk=mat(0x3b4250,{roughness:.6}),Or=mat(0xee5f2b,{emissive:0xee5f2b,emissiveIntensity:.35});
 g.add(inner);const s=.68;inner.scale.set(s,s,s);
 const box=(w,h,d,m,x,y,z,p=inner)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.set(x,y,z);b.castShadow=true;p.add(b);return b};
 const legs=[-.25,.25].map(x=>{const p=new THREE.Group();p.position.set(x,.75,0);inner.add(p);box(.26,.6,.3,Dk,0,-.3,0,p);box(.34,.14,.46,Dk,0,-.66,.06,p);return p});
 const body=new THREE.Group();inner.add(body);
 box(1,.75,.7,Y,0,1.12,0,body);box(.36,.26,.04,Or,0,1.14,.36,body);
 const head=box(1.3,.9,.9,Y,0,1.98,0,body);
 const scr=new THREE.Mesh(new THREE.PlaneGeometry(1.04,.65),new THREE.MeshBasicMaterial({map:faceTex("feliz")}));scr.position.set(0,1.98,.452);body.add(scr);
 const ant=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.35),Dk);ant.position.set(0,2.6,0);body.add(ant);
 const bulb=new THREE.Mesh(new THREE.SphereGeometry(.12,16,12),Or);bulb.position.set(0,2.8,0);body.add(bulb);
 const glow=new THREE.PointLight(0xff8a4c,.6,3.2);glow.position.set(0,2.8,.2);body.add(glow);
 const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(),color:0xff9a5c,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));halo.scale.set(.9,.9,1);halo.position.set(0,2.8,0);body.add(halo);
 const arms=[-1,1].map(sd=>{const p=new THREE.Group();p.position.set(sd*.62,1.38,0);body.add(p);box(.2,.6,.2,Dk,0,-.3,0,p);const h=new THREE.Mesh(new THREE.SphereGeometry(.16,16,12),Y);h.position.set(0,-.65,0);h.castShadow=true;p.add(h);return p});
 const sh=new THREE.Mesh(new THREE.CircleGeometry(.5,24),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.12}));sh.rotation.x=-Math.PI/2;sh.position.y=.01;g.add(sh);
 const P={g,inner,body,legs,arms,head,scr,ant,bulb,glow,halo,Y,Or,s,look:DEFAULT,acc:null,fxs:[],mood:"feliz"};
 return P}

/* ---------- Peças da loja (montadas no corpo, em unidades do Bip) ---------- */
function M(c,o){return mat(c,o)}
function mk(geo,m,x=0,y=0,z=0,p){const e=new THREE.Mesh(geo,m);e.position.set(x,y,z);e.castShadow=true;if(p)p.add(e);return e}
function extr(shape,depth,m){const geo=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelThickness:.015,bevelSize:.015,bevelSegments:2});geo.center();return new THREE.Mesh(geo,m)}
function starShape(r,ri){const s=new THREE.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,rr=i%2?ri:r;i?s.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):s.moveTo(Math.cos(a)*rr,Math.sin(a)*rr)}s.closePath();return s}
function heartShape(k){const s=new THREE.Shape();s.moveTo(0,-.9*k);s.bezierCurveTo(-1.6*k,.1*k,-.8*k,1.3*k,0,.45*k);s.bezierCurveTo(.8*k,1.3*k,1.6*k,.1*k,0,-.9*k);return s}
function wingShape(kind){const s=new THREE.Shape();
 if(kind=="anjo"){s.moveTo(0,0);s.bezierCurveTo(.3,.5,.9,.9,1.5,.95);s.bezierCurveTo(1.3,.7,1.35,.5,1.25,.4);s.bezierCurveTo(1.15,.25,1.1,.1,1,0);s.bezierCurveTo(.9,-.15,.7,-.3,.5,-.35);s.bezierCurveTo(.3,-.3,.1,-.15,0,0)}
 else if(kind=="morcego"){s.moveTo(0,0);s.lineTo(.4,.55);s.lineTo(1.3,.75);s.quadraticCurveTo(1.15,.45,1.2,.25);s.quadraticCurveTo(1,.25,.95,.05);s.quadraticCurveTo(.75,.05,.65,-.2);s.quadraticCurveTo(.4,-.1,.0,0)}
 else{s.moveTo(0,0);s.bezierCurveTo(.2,.8,1.1,1.05,1.05,.5);s.bezierCurveTo(1.0,.2,.6,.1,.4,.05);s.bezierCurveTo(.8,-.05,1,-.5,.7,-.65);s.bezierCurveTo(.4,-.75,.1,-.3,0,0)}
 return s}
function wingTex(kind){const k="wing:"+kind;if(TX[k])return TX[k];const [c,g]=canvas(256,256);
 if(kind=="borboleta"){const gr=g.createLinearGradient(0,0,256,256);gr.addColorStop(0,"#ff6fae");gr.addColorStop(.5,"#ffb02e");gr.addColorStop(1,"#4ad8ff");g.fillStyle=gr;g.fillRect(0,0,256,256);g.fillStyle="rgba(23,37,54,.8)";[[70,90,24],[170,150,30],[120,60,14],[200,80,12]].forEach(([x,y,r])=>{g.beginPath();g.arc(x,y,r,0,7);g.fill()});g.fillStyle="#fff";[[70,90,8],[170,150,10]].forEach(([x,y,r])=>{g.beginPath();g.arc(x,y,r,0,7);g.fill()})}
 else{g.fillStyle=kind=="anjo"?"#ffffff":"#2a2233";g.fillRect(0,0,256,256);g.strokeStyle=kind=="anjo"?"rgba(150,170,200,.7)":"rgba(140,90,180,.6)";g.lineWidth=4;for(let i=0;i<9;i++){g.beginPath();g.moveTo(0,256);g.lineTo(256*(i/8),0);g.stroke()}}
 const t=new THREE.CanvasTexture(c);return TX[k]=t}
function wing(kind,side){const m=new THREE.MeshStandardMaterial({map:wingTex(kind),side:THREE.DoubleSide,roughness:.6,emissive:kind=="anjo"?0x9fb4d8:0,emissiveIntensity:kind=="anjo"?.35:0,transparent:true,opacity:kind=="borboleta"?.95:1});
 const geo=new THREE.ShapeGeometry(wingShape(kind),18),pos=geo.attributes.position,uv=geo.attributes.uv;for(let i=0;i<pos.count;i++){uv.setXY(i,(pos.getX(i)+.1)/1.6,(pos.getY(i)+.8)/1.8)}
 const w=new THREE.Mesh(geo,m),piv=new THREE.Group();w.scale.set(side,1,1);piv.add(w);return piv}

function buildAcc(id,P){const it=BYID[id];if(!it)return null;const G=new THREE.Group(),c=it.c?new THREE.Color(it.c).getHex():0xffffff;G.userData.id=id;let anim=null;
 const gold=M(0xffc21a,{metalness:.8,roughness:.25,emissive:0x5a3c00,emissiveIntensity:.4}),dark=M(0x1d1f26,{roughness:.35,metalness:.3});
 switch(id){
  /* antenas: ficam no lugar da bolinha */
  case "a-azul":case "a-bola":mk(new THREE.SphereGeometry(.13,18,14),M(c,{emissive:c,emissiveIntensity:.5}),0,2.82,0,G);break;
  case "a-lampada":{mk(new THREE.SphereGeometry(.16,18,14),M(0xfff6c0,{emissive:0xffe14d,emissiveIntensity:1,transparent:true,opacity:.9}),0,2.9,0,G);mk(new THREE.CylinderGeometry(.08,.08,.1,12),M(0x9aa3ad,{metalness:.7}),0,2.76,0,G);break}
  case "a-coracao":{const h=extr(heartShape(.12),.06,M(c,{emissive:c,emissiveIntensity:.45}));h.position.set(0,2.86,0);G.add(h);anim=(t)=>{h.rotation.y=t*1.5;h.scale.setScalar(1+.1*Math.sin(t*6))};break}
  case "a-estrela":{const h=extr(starShape(.17,.07),.06,M(c,{emissive:c,emissiveIntensity:.55,metalness:.3}));h.position.set(0,2.88,0);G.add(h);anim=t=>{h.rotation.y=t*1.8};break}
  case "a-flor":{const f=new THREE.Group();f.position.set(0,2.86,0);G.add(f);mk(new THREE.SphereGeometry(.07,12,10),M(0xffd24a),0,0,0,f);for(let i=0;i<6;i++){const a=i/6*Math.PI*2;mk(new THREE.SphereGeometry(.075,12,10),M(c),Math.cos(a)*.12,Math.sin(a)*.12,0,f)}anim=t=>{f.rotation.z=Math.sin(t*2)*.3};break}
  case "a-raio":{const s=new THREE.Shape();s.moveTo(.03,.22);s.lineTo(-.1,0);s.lineTo(0,0);s.lineTo(-.04,-.22);s.lineTo(.1,.04);s.lineTo(0,.04);s.closePath();const h=extr(s,.05,M(c,{emissive:c,emissiveIntensity:.7}));h.position.set(0,2.9,0);G.add(h);anim=t=>{h.material.emissiveIntensity=.5+.5*(Math.sin(t*14)>.6)};break}
  case "a-dupla":{[-1,1].forEach(sd=>{const st=mk(new THREE.CylinderGeometry(.03,.03,.45),M(0x3b4250),sd*.25,2.62,0,G);st.rotation.z=-sd*.35;mk(new THREE.SphereGeometry(.1,14,12),M(c,{emissive:c,emissiveIntensity:.6}),sd*.33,2.84,0,G)});G.userData.hideStem=1;break}
  case "a-helice":{mk(new THREE.CylinderGeometry(.06,.06,.08,12),M(0x9aa3ad,{metalness:.7}),0,2.8,0,G);const r=new THREE.Group();r.position.set(0,2.86,0);G.add(r);[0,1].forEach(i=>{const b=mk(new THREE.BoxGeometry(.9,.03,.14),M(i?0xe2503f:0x2f8cff),0,0,0,r);b.rotation.y=i*Math.PI/2});anim=t=>{r.rotation.y=t*14};break}
  case "a-unicornio":{const h=mk(new THREE.ConeGeometry(.1,.55,16),M(0xfff0fa,{emissive:0xff9ad8,emissiveIntensity:.35,metalness:.3,roughness:.3}),0,2.72,.05,G);const rib=mk(new THREE.TorusGeometry(.07,.012,6,20),gold,0,2.62,.05,G);rib.rotation.x=Math.PI/2;G.userData.hideStem=1;anim=t=>{h.material.emissiveIntensity=.3+.2*Math.sin(t*3)};break}
  case "a-aureola":{const r=mk(new THREE.TorusGeometry(.42,.045,10,40),M(0xffe58a,{emissive:0xffc21a,emissiveIntensity:1}),0,2.85,0,G);r.rotation.x=Math.PI/2;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(),color:0xffd24a,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.5}));s.scale.set(1.6,.7,1);s.position.set(0,2.85,0);G.add(s);G.userData.hideStem=1;anim=t=>{r.position.y=2.85+Math.sin(t*2)*.05;s.position.y=r.position.y};break}
  /* cabeça */
  case "c-bone":{const m=M(c);mk(new THREE.SphereGeometry(.62,24,12,0,Math.PI*2,0,Math.PI/2),m,0,2.38,0,G).scale.set(1.1,.6,.78);mk(new THREE.BoxGeometry(.75,.05,.45),m,0,2.43,.55,G);mk(new THREE.SphereGeometry(.06,10,8),M(0xffffff),0,2.76,0,G);break}
  case "c-gorro":{const m=M(c);mk(new THREE.SphereGeometry(.64,24,14,0,Math.PI*2,0,Math.PI/2),m,0,2.36,0,G).scale.set(1.08,.85,.78);const b=mk(new THREE.TorusGeometry(.6,.08,10,30),M(0xffffff),0,2.42,0,G);b.rotation.x=Math.PI/2;b.scale.set(1.12,.8,1);mk(new THREE.SphereGeometry(.14,14,12),M(0xffffff),0,2.95,0,G);break}
  case "c-festa":{const tx=patTex({id:"festa",c:"#ff6fae",pat:"bolinhas",c2:"#ffe14d"});mk(new THREE.ConeGeometry(.32,.75,24),new THREE.MeshStandardMaterial({map:tx,roughness:.5}),.12,2.8,0,G).rotation.z=-.15;mk(new THREE.SphereGeometry(.09,12,10),M(0xffe14d),.2,3.18,0,G);break}
  case "c-gato":{[-1,1].forEach(sd=>{const e=mk(new THREE.ConeGeometry(.2,.38,4),M(c),sd*.4,2.6,0,G);e.rotation.y=Math.PI/4;e.rotation.z=-sd*.15;const i=mk(new THREE.ConeGeometry(.11,.22,4),M(0xff9ad8),sd*.4,2.58,.06,G);i.rotation.y=Math.PI/4;i.rotation.z=-sd*.15});break}
  case "c-fones":{const a=mk(new THREE.TorusGeometry(.72,.06,8,30,Math.PI),M(c,{metalness:.4}),0,2.05,0,G);[-1,1].forEach(sd=>{const e=mk(new THREE.CylinderGeometry(.2,.2,.16,18),M(0xe2503f),sd*.72,2.0,0,G);e.rotation.z=Math.PI/2});break}
  case "c-ninja":{const b=mk(new THREE.BoxGeometry(1.36,.16,.96),M(c),0,2.2,0,G);mk(new THREE.BoxGeometry(.32,.12,.05),M(0xffffff),0,2.2,.485,G);const t=mk(new THREE.BoxGeometry(.08,.4,.04),M(c),-.25,2.0,-.5,G);const t2=mk(new THREE.BoxGeometry(.08,.36,.04),M(c),-.1,2.0,-.5,G);anim=tt=>{t.rotation.x=.3+Math.sin(tt*4)*.25;t2.rotation.x=.25+Math.sin(tt*4+1)*.25};break}
  case "c-chef":{mk(new THREE.CylinderGeometry(.42,.42,.35,24),M(0xffffff),0,2.6,0,G);[[-.22,0],[.22,0],[0,.18],[0,-.18],[0,0]].forEach(([x,z])=>mk(new THREE.SphereGeometry(.3,16,12),M(0xffffff),x,2.9,z,G));break}
  case "c-cartola":{const m=M(c,{roughness:.35});mk(new THREE.CylinderGeometry(.62,.62,.04,28),m,0,2.45,0,G);mk(new THREE.CylinderGeometry(.38,.4,.62,24),m,0,2.78,0,G);mk(new THREE.CylinderGeometry(.405,.405,.12,24),M(0xe2503f),0,2.53,0,G);break}
  case "c-mago":{const m=M(c);const cn=mk(new THREE.ConeGeometry(.5,1.15,24),m,0,3.0,0,G);cn.rotation.z=.12;mk(new THREE.CylinderGeometry(.75,.75,.04,28),m,0,2.45,0,G);
   const st=new THREE.Sprite(new THREE.SpriteMaterial({map:iconTex("★","#ffe14d"),transparent:true,depthWrite:false}));st.scale.set(.3,.3,1);st.position.set(.05,2.9,.42);G.add(st);
   const st2=st.clone();st2.position.set(-.18,2.65,.45);st2.scale.set(.2,.2,1);G.add(st2);break}
  case "c-viking":{const m=M(c,{metalness:.6,roughness:.35});mk(new THREE.SphereGeometry(.66,24,14,0,Math.PI*2,0,Math.PI/2),m,0,2.36,0,G).scale.set(1.05,.8,.75);
   const band=mk(new THREE.TorusGeometry(.64,.06,8,30),M(0x8a6a4a),0,2.4,0,G);band.rotation.x=Math.PI/2;band.scale.set(1.05,.75,1);
   [-1,1].forEach(sd=>{const h=mk(new THREE.ConeGeometry(.11,.6,14),M(0xfff4e0),sd*.75,2.75,0,G);h.rotation.z=-sd*.9});break}
  case "c-coroa":{const cr=new THREE.Group();cr.position.set(0,2.6,0);G.add(cr);const cyl=mk(new THREE.CylinderGeometry(.48,.48,.28,8,1,true),new THREE.MeshStandardMaterial({color:0xffc21a,metalness:.85,roughness:.22,emissive:0x5a3c00,emissiveIntensity:.4,side:THREE.DoubleSide}),0,0,0,cr);
   for(let i=0;i<8;i++){const a=i/8*Math.PI*2;mk(new THREE.ConeGeometry(.08,.22,6),gold,Math.cos(a)*.47,.24,Math.sin(a)*.47,cr);mk(new THREE.SphereGeometry(.05,10,8),M([0xe2503f,0x2f8cff,0x58b84c][i%3],{emissive:[0xe2503f,0x2f8cff,0x58b84c][i%3],emissiveIntensity:.5}),Math.cos(a)*.49,0,Math.sin(a)*.49,cr)}
   anim=t=>{cr.rotation.y=t*.4};break}
  case "c-astronauta":{const sp=mk(new THREE.SphereGeometry(1,32,24),new THREE.MeshStandardMaterial({color:0xdff4ff,transparent:true,opacity:.22,roughness:.05,metalness:.2,depthWrite:false}),0,2.05,0,G);sp.castShadow=false;
   const r=mk(new THREE.TorusGeometry(.62,.1,10,30),M(0xeef1f5,{metalness:.4}),0,1.5,0,G);r.rotation.x=Math.PI/2;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(),color:0xffffff,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.35}));s.scale.set(.6,.6,1);s.position.set(-.45,2.5,.75);G.add(s);break}
  /* rosto */
  case "r-palhaco":mk(new THREE.SphereGeometry(.12,16,12),M(0xff2a2a,{roughness:.25}),0,1.9,.55,G);break;
  case "r-bigode":{const s=new THREE.Shape();s.moveTo(0,0);s.bezierCurveTo(-.1,.1,-.3,.1,-.42,-.06);s.bezierCurveTo(-.3,0,-.15,-.05,0,-.05);s.bezierCurveTo(.15,-.05,.3,0,.42,-.06);s.bezierCurveTo(.3,.1,.1,.1,0,0);const b=extr(s,.04,M(0x3a2a1c));b.position.set(0,1.82,.5);G.add(b);break}
  case "r-redondos":{[-1,1].forEach(sd=>mk(new THREE.TorusGeometry(.16,.025,8,24),M(0x3b2a1c,{metalness:.5}),sd*.18,2.04,.5,G));mk(new THREE.BoxGeometry(.07,.025,.025),M(0x3b2a1c),0,2.06,.5,G);break}
  case "r-escuros":{const m=M(0x0b0d12,{roughness:.1,metalness:.6});[-1,1].forEach(sd=>mk(new THREE.BoxGeometry(.32,.2,.04),m,sd*.19,2.04,.48,G));mk(new THREE.BoxGeometry(.9,.04,.03),m,0,2.13,.48,G);break}
  case "r-pirata":{const p=mk(new THREE.CylinderGeometry(.15,.15,.04,20),M(0x111111),.18,2.04,.48,G);p.rotation.x=Math.PI/2;const s=mk(new THREE.BoxGeometry(1.42,.04,.05),M(0x111111),0,2.12,.47,G);s.rotation.z=-.35;break}
  case "r-heroi":{const s=new THREE.Shape();s.moveTo(-.55,.12);s.lineTo(.55,.12);s.lineTo(.6,-.05);s.lineTo(.3,-.14);s.lineTo(0,-.05);s.lineTo(-.3,-.14);s.lineTo(-.6,-.05);s.closePath();
   [-1,1].forEach(sd=>{const h=new THREE.Path();h.absellipse(sd*.18,0,.11,.07,0,Math.PI*2,true);s.holes.push(h)});const b=extr(s,.03,M(0x111a33,{roughness:.3}));b.position.set(0,2.04,.47);G.add(b);break}
  case "r-monoculo":{mk(new THREE.TorusGeometry(.16,.03,8,24),gold,.18,2.04,.5,G);const ch=mk(new THREE.CylinderGeometry(.01,.01,.5,6),gold,.32,1.8,.48,G);ch.rotation.z=.35;break}
  /* pescoço */
  case "n-borboleta":{[-1,1].forEach(sd=>{const c1=mk(new THREE.ConeGeometry(.12,.2,4),M(c),sd*.1,1.5,.37,G);c1.rotation.z=sd*Math.PI/2});mk(new THREE.SphereGeometry(.05,10,8),M(c),0,1.5,.38,G);break}
  case "n-gravata":{mk(new THREE.BoxGeometry(.12,.1,.04),M(c),0,1.47,.37,G);const s=new THREE.Shape();s.moveTo(-.06,0);s.lineTo(.06,0);s.lineTo(.1,-.4);s.lineTo(0,-.5);s.lineTo(-.1,-.4);s.closePath();const b=extr(s,.02,M(c));b.position.set(0,1.2,.37);G.add(b);break}
  case "n-cachecol":{const t=patTex({id:"cachecol",c:it.c,pat:"listras",c2:it.c2});const m=new THREE.MeshStandardMaterial({map:t,roughness:.8});const r=mk(new THREE.TorusGeometry(.42,.11,10,28),m,0,1.52,0,G);r.rotation.x=Math.PI/2;r.scale.set(1.25,1,1);const p=mk(new THREE.BoxGeometry(.18,.5,.08),m,.22,1.25,.42,G);anim=tt=>{p.rotation.x=Math.sin(tt*2.5)*.12};break}
  case "n-perolas":{for(let i=0;i<16;i++){const a=i/16*Math.PI;mk(new THREE.SphereGeometry(.045,10,8),M(0xfff8f0,{roughness:.15,metalness:.3}),Math.cos(a)*.4,1.46-Math.sin(a)*.12,.36+Math.sin(a)*.03,G)}break}
  case "n-medalha":{const r=mk(new THREE.BoxGeometry(.08,.3,.02),M(0x2f6fd6),-.08,1.36,.37,G);r.rotation.z=.4;const r2=mk(new THREE.BoxGeometry(.08,.3,.02),M(0xe2503f),.08,1.36,.37,G);r2.rotation.z=-.4;const d=mk(new THREE.CylinderGeometry(.14,.14,.04,24),gold,0,1.15,.39,G);d.rotation.x=Math.PI/2;
   const s=new THREE.Sprite(new THREE.SpriteMaterial({map:iconTex("★","#8a5a00"),transparent:true}));s.scale.set(.16,.16,1);s.position.set(0,1.15,.42);G.add(s);anim=t=>{d.rotation.z=Math.sin(t*2)*.2};break}
  case "n-corrente":{for(let i=0;i<14;i++){const a=i/14*Math.PI,l=mk(new THREE.TorusGeometry(.04,.015,6,12),gold,Math.cos(a)*.38,1.47-Math.sin(a)*.3,.37,G);l.rotation.y=i%2?Math.PI/2:0}
   const b=extr((()=>{const s=new THREE.Shape();s.absarc(0,0,.14,0,Math.PI*2);return s})(),.04,gold);b.position.set(0,1.12,.4);G.add(b);
   const s=new THREE.Sprite(new THREE.SpriteMaterial({map:iconTex("B","#8a5a00"),transparent:true}));s.scale.set(.2,.2,1);s.position.set(0,1.12,.44);G.add(s);anim=t=>{b.rotation.y=Math.sin(t*1.5)*.4};break}
  /* costas */
  case "b-mochila":{const m=M(c);mk(new THREE.BoxGeometry(.7,.62,.3),m,0,1.18,-.5,G);mk(new THREE.BoxGeometry(.5,.25,.08),M(new THREE.Color(it.c).offsetHSL(0,0,-.12).getHex()),0,1.05,-.67,G);[-1,1].forEach(sd=>mk(new THREE.BoxGeometry(.08,.6,.05),m,sd*.25,1.2,.37,G));break}
  case "b-casco":{const sh=mk(new THREE.SphereGeometry(.55,20,14,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({map:patTex({id:"casco",c:"#4f9a3c",pat:"bolinhas",c2:"#7cc45a"}),roughness:.5}),0,1.12,-.36,G);sh.rotation.x=-Math.PI/2;sh.scale.set(1,1,.7);break}
  case "b-capa":{const g=new THREE.PlaneGeometry(1.1,1.25,6,8);g.translate(0,-.62,0);const m=new THREE.MeshStandardMaterial({color:c,side:THREE.DoubleSide,roughness:.6});const cp=mk(g,m,0,1.5,-.4,G);const base=g.attributes.position.array.slice();
   anim=t=>{const p=g.attributes.position;for(let i=0;i<p.count;i++){const y=base[i*3+1];p.setZ(i,base[i*3+2]-Math.sin(t*3+y*3)*.06*(-y)-(-y)*.15)}p.needsUpdate=true};break}
  case "b-morcego":case "b-borboleta":case "b-anjo":{const kind=id.slice(2),wl=wing(kind,-1),wr=wing(kind,1);[wl,wr].forEach((w,i)=>{w.position.set(i?.15:-.15,1.35,-.42);G.add(w)});
   const sp=kind=="anjo"?2.2:kind=="borboleta"?5:3.4,amp=kind=="borboleta"?.6:.35,sc=kind=="anjo"?1.25:1;wl.scale.setScalar(sc);wr.scale.setScalar(sc);
   anim=t=>{const a=.35+Math.sin(t*sp)*amp;wl.rotation.y=a;wr.rotation.y=-a};break}
  case "b-jetpack":{const m=M(0x9aa3ad,{metalness:.75,roughness:.3});const fl=[];[-1,1].forEach(sd=>{mk(new THREE.CylinderGeometry(.16,.16,.7,18),m,sd*.2,1.2,-.5,G);mk(new THREE.ConeGeometry(.16,.2,18),M(0xe2503f),sd*.2,1.64,-.5,G);mk(new THREE.CylinderGeometry(.1,.14,.12,16),M(0x3b4250,{metalness:.5}),sd*.2,.8,-.5,G);
    const f=mk(new THREE.ConeGeometry(.1,.42,14),new THREE.MeshBasicMaterial({color:0xffa040,transparent:true,opacity:.85}),sd*.2,.56,-.5,G);f.rotation.x=Math.PI;f.castShadow=false;fl.push(f)});
   anim=t=>fl.forEach((f,i)=>{const k=.8+.35*Math.sin(t*30+i*2)+.15*Math.random();f.scale.set(1,k,1);f.position.y=.74-.21*k});break}
  /* efeitos (partículas em volta do Bip) */
  case "e-brilhos":case "e-coracoes":case "e-estrelas":{const ch={"e-brilhos":"✦","e-coracoes":"♥","e-estrelas":"★"}[id],N=id=="e-estrelas"?14:10,sp=[];
   for(let i=0;i<N;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:iconTex(ch,it.c),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));s.scale.setScalar(.22+Math.random()*.15);s.userData={a:Math.random()*7,r:.9+Math.random()*.5,y:Math.random()*3,v:.3+Math.random()*.5};G.add(s);sp.push(s)}
   anim=(t,dt)=>sp.forEach(s=>{const u=s.userData;u.a+=dt*(id=="e-coracoes"?.6:1.2);u.y+=dt*u.v*(id=="e-estrelas"?-1.6:1);if(u.y>3.2)u.y=0;if(u.y<0)u.y=3.2;s.position.set(Math.cos(u.a)*u.r,u.y,Math.sin(u.a)*u.r);s.material.opacity=Math.min(1,Math.sin(u.y/3.2*Math.PI)*1.6)});break}
  case "e-aura":{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(),color:0xffc21a,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.55}));s.scale.set(3.4,4.2,1);s.position.set(0,1.5,-.4);G.add(s);
   const r=mk(new THREE.RingGeometry(.8,1.0,40),new THREE.MeshBasicMaterial({color:0xffd24a,transparent:true,opacity:.5,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}),0,.05,0,G);r.rotation.x=-Math.PI/2;r.castShadow=false;
   anim=t=>{s.material.opacity=.4+.2*Math.sin(t*2.4);r.scale.setScalar(1+.15*Math.sin(t*3))};break}
  case "e-arcoiris":{const cols=[0xff4d6d,0xffa040,0xffe14d,0x5ef07a,0x4ad8ff,0x8a6bff];const rings=cols.map((cc,i)=>{const r=mk(new THREE.TorusGeometry(1.15+i*.06,.025,8,60),new THREE.MeshBasicMaterial({color:cc,transparent:true,opacity:.85}),0,1.4,0,G);r.castShadow=false;return r});
   anim=t=>rings.forEach((r,i)=>{r.rotation.x=Math.PI/2+Math.sin(t*1.2+i*.2)*.5;r.rotation.y=t*.8+i*.15});break}
  default:return null}
 G.userData.anim=anim;G.userData.hide=!!it.hide;return G}

/* ---------- Vestir o Bip ---------- */
function dress(P,look){look=Object.assign({},DEFAULT,look||{});P.look=look;
 const pt=BYID[look.pintura]||BYID["p-amarelo"],Y=P.Y;
 Y.map=pt.pat?patTex(pt):null;Y.color.set(pt.pat?"#ffffff":pt.c);
 Y.metalness=pt.metal??.05;Y.roughness=pt.rough??.4;Y.emissive.set(pt.emis||(pt.glow?pt.c:"#000000"));Y.emissiveIntensity=pt.glow?.55:pt.emis?.5:0;Y.needsUpdate=true;P.rainbow=!!pt.rainbow;
 P.scr.material.map=faceTex(P.mood||"feliz",look);P.scr.material.needsUpdate=true;
 if(P.acc){P.body.remove(P.acc);P.acc.traverse(o=>{if(o.geometry)o.geometry.dispose()})}
 const acc=new THREE.Group();P.acc=acc;P.body.add(acc);P.anims=[];
 let hideAnt=false,hideStem=false;
 for(const cat of ["antena","cabeca","rosto","pescoco","costas","efeito"]){const id=look[cat];if(!id)continue;const g=buildAcc(id,P);if(!g)continue;
  g.userData.cat=cat;
  if(cat=="efeito"){g.position.y=0;P.inner.add(g);acc.userData.fx=(acc.userData.fx||[]);acc.userData.fx.push(g)}else acc.add(g);
  if(g.userData.anim)P.anims.push(g.userData.anim);if(cat=="cabeca"&&g.userData.hide)hideAnt=true;if(g.userData.hideStem)hideStem=true}
 /* efeitos ficam no "inner" (fora do corpo); guarda para remover depois */
 (P.fxNodes||[]).forEach(n=>P.inner.remove(n));P.fxNodes=acc.userData.fx||[];
 P.bulb.visible=false;  /* a bolinha da antena agora vem da loja (a-bola) */P.ant.visible=!hideAnt&&!hideStem;P.glow.visible=!hideAnt;P.halo.visible=!hideAnt&&(look.antena=="a-bola"||look.antena=="a-azul"||look.antena=="a-lampada");
 const ac=BYID[look.antena];if(ac&&ac.c){P.halo.material.color.set(ac.c);P.glow.color.set(ac.c)}
 acc.children.forEach(ch=>{if(ch.userData.id&&BYID[ch.userData.id].cat=="antena")ch.visible=!hideAnt})}
function tick(P,t,dt){if(P.anims)P.anims.forEach(f=>f(t,dt));if(P.rainbow){P.Y.color.setHSL((t*.08)%1,.75,.58);P.Y.emissive.setHSL((t*.08)%1,.8,.25);P.Y.emissiveIntensity=.35}}
function setMood(P,m){P.mood=m;P.scr.material.map=faceTex(m,P.look);P.scr.material.needsUpdate=true}

/* rostinho 2D (ao lado das falas) com a cor da pintura */
function face2d(look,m="feliz"){look=Object.assign({},DEFAULT,look||{});const p=BYID[look.pintura]||{},c=p.c||"#f2c230",t=BYID[look.tela]||{},e=t.c||"#5ef0e0";
 const happy=m=="feliz"||m=="festa";return `<svg viewBox="0 0 200 170" style="width:100%;height:auto"><line x1="100" y1="34" x2="100" y2="12" stroke="#3b4250" stroke-width="6" stroke-linecap="round"/><circle cx="100" cy="10" r="9" fill="#ee5f2b"/><rect x="18" y="30" width="164" height="124" rx="32" fill="${c}" stroke="rgba(0,0,0,.25)" stroke-width="5"/><rect x="38" y="50" width="124" height="84" rx="20" fill="#172536"/>`+
  (happy?`<path d="M62 92q12-17 24 0M114 92q12-17 24 0" stroke="${e}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M80 108q20 17 40 0" stroke="${e}" stroke-width="6" fill="none" stroke-linecap="round"/>`
  :`<rect x="66" y="70" width="18" height="28" rx="9" fill="${e}"/><rect x="116" y="70" width="18" height="28" rx="9" fill="${e}"/><path d="M86 112q14 9 28 0" stroke="${e}" stroke-width="5" fill="none" stroke-linecap="round"/>`)+`</svg>`}

/* ---------- Ícones com a cara do jogo: o próprio Bip, fotografado em 3D ----------
   Um desenho 3D pequeno e escondido monta o Bip com a pintura do aluno, coloca o item
   (ou faz a pose do gesto), enquadra a parte certa e tira uma "foto" (imagem PNG).
   As fotos ficam guardadas na memória; uma por quadro, para não travar a tela. */
const ICON=(()=>{const SZ=160;let R=null,scene,cam,P,arc,props,ok=null;const cache={},fila=[];let rodando=false;
 function init(){if(ok!==null)return ok;ok=false;if(!window.THREE)return false;
  try{R=new THREE.WebGLRenderer({canvas:document.createElement("canvas"),antialias:true,alpha:true,preserveDrawingBuffer:true})}catch(e){return false}
  R.setPixelRatio(1);R.setSize(SZ,SZ,false);R.setClearColor(0,0);
  scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xe4ebff,0x3a2a5a,.95));
  const k=new THREE.DirectionalLight(0xfff1dc,1.05);k.position.set(2.5,4,5);scene.add(k);
  const a=new THREE.PointLight(0xff4fd8,1.1,9);a.position.set(-2.6,2.6,-1.6);scene.add(a);
  const b=new THREE.PointLight(0x3ce8ff,1.1,9);b.position.set(2.6,2.4,-1.6);scene.add(b);
  cam=new THREE.PerspectiveCamera(26,1,.05,60);
  P=buildBody();P.g.children.filter(o=>o.isMesh&&o.geometry.type=="CircleGeometry").forEach(o=>o.visible=false);P.glow.visible=false;scene.add(P.g);
  /* arco de movimento para o ícone de "girar" */
  arc=new THREE.Mesh(new THREE.TorusGeometry(1.05,.045,8,48,Math.PI*1.45),new THREE.MeshBasicMaterial({color:0x5ef0e0}));arc.rotation.set(Math.PI/2,0,.6);arc.position.y=.9;arc.visible=false;scene.add(arc);
  props=new THREE.Group();scene.add(props);
  return ok=true}
 /* enfeites que mostram o gesto (notas, confete, "?", raios) */
 function txt(ch,col,sz){const [c,g]=canvas(128,128);g.font='800 96px "Baloo 2",system-ui,sans-serif';g.textAlign="center";g.textBaseline="middle";g.shadowColor=col;g.shadowBlur=18;g.fillStyle="#fff";g.fillText(ch,64,70);g.shadowBlur=0;g.fillStyle=col;g.fillText(ch,64,70);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));sp.scale.set(sz,sz,1);return sp}
 function add(o,x,y,z){o.position.set(x,y,z);props.add(o);return o}
 function limpa(){while(props.children.length){const o=props.children.pop();if(o.material){if(o.material.map)o.material.map.dispose();o.material.dispose()}if(o.geometry)o.geometry.dispose()}}
 function pose(){P.arms[0].rotation.set(0,0,.12);P.arms[1].rotation.set(0,0,-.12);P.legs[0].rotation.x=P.legs[1].rotation.x=0;
  P.body.rotation.set(0,0,0);P.body.position.y=0;P.inner.rotation.set(0,0,0);P.inner.position.y=0;P.g.rotation.set(0,0,0);arc.visible=false;if(props)limpa()}
 const V=(x,y,z)=>new THREE.Vector3(x,y,z);
 function foto(objs,dir,zoom){const box=new THREE.Box3();P.g.updateMatrixWorld(true);objs.forEach(o=>o&&box.expandByObject(o));
  const c=box.getCenter(V()),r=box.getSize(V()).length()/2,d=r/Math.sin(cam.fov*Math.PI/360)*(zoom||1);
  cam.position.copy(c).add(dir.clone().normalize().multiplyScalar(d));cam.lookAt(c);cam.near=d/20;cam.far=d*4;cam.updateProjectionMatrix();
  R.render(scene,cam);return R.domElement.toDataURL("image/png")}
 const parte=cat=>P.acc&&P.acc.children.find(o=>o.userData.cat==cat);
 /* foto de um item da loja, no Bip do aluno */
 function fazItem(id,look){const it=BYID[id];if(!it)return null;
  const lk={pintura:look.pintura,olhos:look.olhos,tela:look.tela,antena:"a-bola",cabeca:null,rosto:null,pescoco:null,costas:null,efeito:null};lk[it.cat]=id;
  pose();dress(P,lk);setMood(P,"feliz");tick(P,1.3,.016);const c=it.cat,h=P.head,a=parte(c);
  if(c=="pintura"){P.g.rotation.y=-.3;return foto([P.body],V(.2,.18,1),.74)}
  if(c=="efeito"){P.g.rotation.y=-.2;tick(P,2.1,.016);/* no ícone o fundo é claro: brilhos "somados à luz" sumiriam, então viram brilhos normais e maiores */
   (P.fxNodes||[]).forEach(n=>n.traverse(o=>{if((o.isSprite&&o.scale.x<1)||o.isPoints)o.scale.multiplyScalar(1.9);if(o.isSprite&&o.scale.x>=1)o.material.opacity=.35;if(o.material&&o.material.blending==THREE.AdditiveBlending){o.material.blending=THREE.NormalBlending;o.material.opacity=Math.min(1,(o.material.opacity||1)*1.3)}}));
   return foto([P.body,P.legs[0],P.legs[1]],V(.15,.15,1),.86)}
  if(c=="antena")return foto([a,h],V(.35,.32,1),.78);
  if(c=="cabeca")return foto([a,h],V(.42,.28,1),.8);
  if(c=="rosto")return foto([h,a],V(.28,.08,1),.74);
  if(c=="pescoco")return foto([a,h],V(.3,.12,1),.8);
  if(c=="costas"){P.g.rotation.y=Math.PI*.9;return foto([a,P.body],V(.12,.3,1),.78)}
  return foto([P.body],V(.3,.2,1),.85)}
 /* foto de um gesto: o Bip parado no meio do movimento */
 function fazPose(n,look){pose();dress(P,Object.assign({},look,{efeito:null}));let m="feliz";const A=P.arms;
  const cor=["#ff4fd8","#5ef0e0","#ffd24a","#7cff6b","#ff8a3c"];
  if(n=="acenar"){A[1].rotation.set(.25,0,2.6);P.body.rotation.z=-.06;
   [0,1].forEach(i=>{const t=new THREE.Mesh(new THREE.TorusGeometry(.32+i*.16,.035,6,24,Math.PI*.6),new THREE.MeshBasicMaterial({color:0x5ef0e0}));t.rotation.z=-.2;add(t,.62,1.85,.1)})}
  else if(n=="dancar"){A[0].rotation.set(0,0,-2.1);A[1].rotation.set(0,0,.5);P.body.rotation.z=.2;P.legs[0].rotation.x=.45;P.legs[1].rotation.x=-.35;P.inner.rotation.y=.35;m="festa";
   add(txt("♪","#ff4fd8",.75),.85,1.75,.2);add(txt("♫","#5ef0e0",.6),-.85,1.95,.2)}
  else if(n=="comemorar"){A[0].rotation.set(0,0,-2.65);A[1].rotation.set(0,0,2.65);P.inner.position.y=.2;m="festa";
   for(let i=0;i<16;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(.11,.05,.02),new THREE.MeshBasicMaterial({color:cor[i%5]}));b.rotation.set(Math.random()*3,Math.random()*3,Math.random()*3);add(b,(Math.random()-.5)*1.9,1.6+Math.random()*1.1,.3+(Math.random()-.5)*.4)}}
  else if(n=="forca"){A[0].rotation.set(0,0,-1.55);A[1].rotation.set(0,0,1.55);P.inner.position.y=-.04;P.legs[0].rotation.z=-.15;P.legs[1].rotation.z=.15;
   add(txt("⚡","#ffd24a",.62),-.95,1.75,.2);add(txt("⚡","#ffd24a",.62),.95,1.75,.2)}
  else if(n=="pensar"){A[1].rotation.set(-1.95,0,.55);P.body.rotation.z=.16;P.inner.rotation.y=-.3;m="pensa";add(txt("?","#5ef0e0",.8),.75,2.05,.1)}
  else if(n=="girar"){P.inner.rotation.y=1.0;P.inner.position.y=.15;arc.visible=true}
  setMood(P,m);tick(P,1.3,.016);const img=foto([P.body].concat(arc.visible?[arc]:[],props.children),V(.12,.1,1),.62);
  arc.visible=false;P.legs[0].rotation.z=P.legs[1].rotation.z=0;limpa();return img}
 const chave=(k,l)=>k+"|"+l.pintura+"|"+l.olhos+"|"+l.tela+"|"+(l.antena||"");
 function pedir(k,look,faz,cb){look=Object.assign({},DEFAULT,look||{});const key=chave(k,look);if(cache[key]){cb(cache[key]);return true}
  if(!init())return false;fila.push({key,faz:()=>faz(look),cb});if(!rodando){rodando=true;setTimeout(()=>requestAnimationFrame(proximo),250)}return true}
 function proximo(){const t0=performance.now();while(fila.length&&performance.now()-t0<12){const j=fila.shift();if(!cache[j.key]){try{cache[j.key]=j.faz()}catch(e){cache[j.key]=null}}if(cache[j.key])j.cb(cache[j.key])}
  if(fila.length)requestAnimationFrame(proximo);else rodando=false}
 return {item:(id,look,cb)=>pedir("i:"+id,look,l=>fazItem(id,l),cb),pose:(n,look,cb)=>pedir("p:"+n,look,l=>fazPose(n,l),cb),ok:()=>init()}})();

return {BONUS,POR_AULA,POR_FASE,POR_ESTRELA,RUN_DIA,SNAKE_DIA,DEF_DIA,runKey,ganhosRunner,ganhosSnake,snakeBest,ganhosDefesa,defesaBest,defesaDec,BOMB_DIA,ganhosBomber,bomberBest,bomberDec,SPACE_DIA,ganhosSpace,spaceBest,SPACE_ROTA,SPACE_ZONAS,spaceKm,spaceFmt,spaceZona,CONTEUDO,progressoAulas,focoAlvo,focoAula,focoAviso,FOCO_REV,FOCO_REV_DIAS,FOCO_AULA,JOGOS_RAPIDOS,FOCO_CANSADO,FOCO_MIN,FOCO_VOLTA,precos,focoConta,concluidas,focoDe,energia,focoGasta,focoMostra,JOGOS,NOME_JOGO,EQ_MIN,EQ_LIM,EQ_DESC,EQ_CRED,VEZ_DIA,tempoKey,diaDe,tempo7,ganhosVez,mergeTempo,equilibrio,ganhos,loja,salvarLoja,gasto,saldo,KITS,KIT,kitPreco,lojaKey,COIN,fmt,RAR,CATS,ITEMS,BYID,DEFAULT,gratis,destaque,
 faceTex,eyePreview,buildBody,dress,tick,setMood,glowTex,face2d,patTex,ICON}})();
