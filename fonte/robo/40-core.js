/*CORE*/
/* ===== Interpretador: lê o mapa, avalia condições e executa as peças passo a passo =====
   Mapa: . chão | # caixa | S início | G bandeira | * estrela | x buraco | o casa para pintar | s início que também se pinta
         a/b chave dourada/azul | A/B porta dourada/azul | p/q portais (cada letra aparece 2 vezes) | 1-4 respostas das fases de leitura */
const DR=[-1,0,1,0],DC=[0,1,0,-1];
const mapsOf=L=>[L.m,...(L.vs||[])];
function parse(L,vi=0){const m=mapsOf(L)[vi]||L.m,pp={};
 const s={W:m[0].length,H:m.length,walls:new Set(),stars:new Set(),goal:null,paint:new Set(),painted:new Set(),holes:new Set(),
  keys:new Map(),doors:new Map(),has:new Set(),taken:new Set(),open:new Set(),portals:new Map(),pcol:new Map(),opts:new Map(),got:new Set()};
 m.forEach((row,r)=>[...row].forEach((ch,c)=>{const k=r+","+c;
  if(ch=="#")s.walls.add(k);else if(ch=="*")s.stars.add(k);else if(ch=="G")s.goal=k;else if(ch=="x")s.holes.add(k);
  else if(ch=="S"||ch=="s"){s.r=r;s.c=c;if(ch=="s")s.paint.add(k)}else if(ch=="o")s.paint.add(k);
  else if(ch=="a"||ch=="b")s.keys.set(k,ch);else if(ch=="A"||ch=="B")s.doors.set(k,ch.toLowerCase());
  else if(ch=="p"||ch=="q"){s.pcol.set(k,ch);if(pp[ch]){s.portals.set(k,pp[ch]);s.portals.set(pp[ch],k)}else pp[ch]=k}
  else if(ch>="1"&&ch<="4")s.opts.set(ch,k)}));
 if(L.g)s.goal=L.g.join(",");s.d=L.d;s.total=s.stars.size;s.stop=!!L.stop||L.type=="quiz";return s}
const inside=(s,r,c)=>r>=0&&r<s.H&&c>=0&&c<s.W;
const doorShut=(s,k)=>s.doors.has(k)&&!s.open.has(k);
function blocked(s,r,c){if(!inside(s,r,c))return true;const k=r+","+c;return s.walls.has(k)||(doorShut(s,k)&&!s.has.has(s.doors.get(k)))}
function won(s){if(s.got.size!=s.total)return false;if(s.goal&&s.goal!=s.r+","+s.c)return false;
 if(s.paint.size){if(s.painted.size!=s.paint.size)return false;for(const p of s.painted)if(!s.paint.has(p))return false}return true}
const SIDE={front:0,right:1,left:3};
function cond(s,c){if(c=="goal")return s.goal?s.goal==s.r+","+s.c:won(s);
 if(c=="hole")return s.holes.has((s.r+DR[s.d])+","+(s.c+DC[s.d]));
 const d=(s.d+SIDE[c])%4;return blocked(s,s.r+DR[d],s.c+DC[d])}
/* Gera, uma a uma, as ações do programa. "mark" = peça de controle (Repetir, Se, Peça A...) que só acende no editor. */
function* exec(list,s,env,depth=0){for(const b of list){
 if(b.t=="loop"){for(let k=0;k<b.n;k++){yield {hl:b.id,mark:1};yield* exec(b.body,s,env,depth);if(env.over)return}}
 else if(b.t=="until"){const seen=new Set();while(!cond(s,b.c)){const key=[s.r,s.c,s.d,s.got.size,s.painted.size,s.has.size,s.open.size].join();
  if(seen.has(key)||++env.n>500){env.over=1;yield {over:1};return}seen.add(key);yield {hl:b.id,mark:1};yield* exec(b.body,s,env,depth);if(env.over)return}}
 else if(b.t=="if"){const v=cond(s,b.c);yield {hl:b.id,mark:1,cv:v};yield* exec(v?b.body:b.els||[],s,env,depth);if(env.over)return}
 else if(b.t=="fa"||b.t=="fb"){if(depth>=30){env.over=2;yield {over:2};return}
  const cs=env.calls||(env.calls=[]);cs.push(b.id);yield {hl:b.id,mark:1};yield* exec(env.fns[b.t=="fa"?"A":"B"]||[],s,env,depth+1);cs.pop();if(env.over)return}
 else yield {hl:b.id,t:b.t,calls:env.calls&&env.calls.length?env.calls.slice():null}}}
/* O robô entra numa casa: buraco, porta, estrela, chave e portal acontecem aqui. */
function enter(s,r,c,ev){s.r=r;s.c=c;const k=r+","+c;ev.to=[r,c];
 if(s.holes.has(k)){ev.fall=1;return ev}
 if(doorShut(s,k)){s.open.add(k);ev.door=k}
 if(s.stars.has(k)&&!s.got.has(k)){s.got.add(k);ev.star=k}
 if(s.keys.has(k)&&!s.taken.has(k)){s.taken.add(k);s.has.add(s.keys.get(k));ev.key=k}
 if(s.portals.has(k)){const t=s.portals.get(k).split(",").map(Number);ev.tp=t;s.r=t[0];s.c=t[1]}
 return ev}
function act(s,t){
 if(t=="L"){s.d=(s.d+3)%4;return {turn:-1}}
 if(t=="R"){s.d=(s.d+1)%4;return {turn:1}}
 if(t=="P"){const k=s.r+","+s.c;s.painted.add(k);return {paint:k,good:s.paint.has(k)}}
 const fr=s.r,fc=s.c,dr=DR[s.d],dc=DC[s.d];
 if(t=="J"){const mr=fr+dr,mc=fc+dc,nr=mr+dr,nc=mc+dc;
  if(!inside(s,mr,mc))return {bump:1,why:"edge",at:[mr,mc]};
  if(doorShut(s,mr+","+mc))return {bump:1,why:"jdoor",at:[mr,mc]};
  if(blocked(s,nr,nc))return {bump:1,why:!inside(s,nr,nc)?"jedge":s.walls.has(nr+","+nc)?"jwall":"door",at:[nr,nc]};
  return enter(s,nr,nc,{move:1,jump:1,fr,fc})}
 const nr=fr+dr,nc=fc+dc;
 if(blocked(s,nr,nc))return {bump:1,why:!inside(s,nr,nc)?"edge":s.walls.has(nr+","+nc)?"wall":"door",at:[nr,nc]};
 return enter(s,nr,nc,{move:1,fr,fc})}
/* Peças usadas no programa (direta ou indiretamente). */
function usedTypes(P){const u=new Set(),walk=l=>{for(const b of l||[]){u.add(b.t);walk(b.body);walk(b.els)}};walk(P.m);walk(P.A);walk(P.B);return u}
function missingNeed(L,P){if(!L.need)return null;const inMain=new Set(),walk=l=>{for(const b of l||[]){inMain.add(b.t);walk(b.body);walk(b.els)}};walk(P.m);
 if(inMain.has("fa"))walk(P.A);if(inMain.has("fb"))walk(P.B);if(inMain.has("fa"))walk(P.A);
 for(const t of L.need){if(!inMain.has(t))return t;if(!(t=="fa"?P.A:P.B).length)return t}return null}
const countList=l=>l.reduce((n,b)=>n+1+(b.body?countList(b.body):0)+(b.els?countList(b.els):0),0);
const countBlocks=P=>countList(P.m)+countList(P.A||[])+countList(P.B||[]);
/* Simulação completa sem animação (testes e fases de leitura). */
function simulate(L,P,vi=0){const s=parse(L,vi),env={n:0,fns:{A:P.A||[],B:P.B||[]}};let n=0;
 for(const v of exec(P.m,s,env)){if(v.over)return {res:v.over==2?"recursão":"repetiu demais",s};if(v.mark)continue;if(++n>3000)return {res:"repetiu demais",s};
  const e=act(s,v.t);if(e.bump)return {res:"bateu",s,e};if(e.fall)return {res:"caiu",s};if(!s.stop&&won(s))return {res:"VENCEU",s,n}}
 return {res:won(s)?"VENCEU":"terminou sem vencer",s,n}}
/* Mini-linguagem para escrever programas prontos: F L R P J A B · 3[...] repete · Uf[...] repetir até · If[sim|não] se
   Condições: g bandeira, f caixa na frente, l à esquerda, r à direita, h buraco na frente. */
let uid=0;
const PG_T={F:"F",L:"L",R:"R",P:"P",J:"J",A:"fa",B:"fb"},PG_C={g:"goal",f:"front",l:"left",r:"right",h:"hole"};
function PG(src){const s=(src||"").replace(/\s+/g,"");let i=0;
 function seq(stop){const out=[];while(i<s.length&&!stop.includes(s[i])){const ch=s[i];
   if(ch>="0"&&ch<="9"){let n="";while(s[i]>="0"&&s[i]<="9")n+=s[i++];i++;const body=seq("]");i++;out.push({id:++uid,t:"loop",n:+n,body})}
   else if(ch=="U"){const c=PG_C[s[i+1]];i+=3;const body=seq("]");i++;out.push({id:++uid,t:"until",c,body})}
   else if(ch=="I"){const c=PG_C[s[i+1]];i+=3;const body=seq("|]");let els=[];if(s[i]=="|"){i++;els=seq("]")}i++;out.push({id:++uid,t:"if",c,body,els})}
   else{i++;if(!PG_T[ch])throw new Error("PG: peça desconhecida "+ch);out.push({id:++uid,t:PG_T[ch]})}}
  return out}
 return seq("")}
const PGP=o=>({m:PG(o&&o.m),A:PG(o&&o.A),B:PG(o&&o.B)});
/*/CORE*/
