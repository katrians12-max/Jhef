/* ===== Matemática do Bip (mundos do 6º ao 9º ano) =====
   Tudo neste bloco só entra em ação nas fases que têm um dos campos abaixo. As outras fases continuam iguais.
   ini / alvo  número do Bip no começo / número que ele precisa ter ao terminar na bandeira
   ops         casas de conta {letra:"conta"}: "+3" "-2" "×2" "÷3" "^2" "√" "2x+1" "x²-1" "50%" "+10%" "-20%"
               (a conta acontece toda vez que o Bip ENTRA na casa)
   passo       conta feita a cada casa andada (ex.: bateria "-3")
   porta       a porta D só deixa passar se o número do Bip cumprir a regra:
               "=4" ">10" "<0" "≥5" "par" "ímpar" "m3" (múltiplo de 3) "d12" (divisor de 12) "primo" "q" (quadrado perfeito)
   portaTxt    texto mostrado na porta no lugar da regra (ex.: a equação "2x + 1 = 9")
   plano       [linha, coluna] da origem (0, 0): o tabuleiro vira o plano cartesiano com números negativos
   expr        lista de contas para o Repetir: o aluno escolhe a conta e o Repetir vale o resultado
   fracao      "3/4" ou "25%": parte da região r (R = começo dentro da região) que deve ser pintada
   anota       casas com números que o Bip anota ao passar {letra:número} (média, soma)
   ask         leitura com resposta numérica {q:"pergunta", resp:[...], calc:"val"|"giro"|"passos"|"media"|"soma"|"coord" ou certo:"resposta"}
   Letras livres para casas de conta/anotação: c d e f g h i j k l m n t u v w y z */
const gcdQ=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b)[a,b]=[b,a%b];return a||1};
const Q=(n,d=1)=>{if(!isFinite(n)||!isFinite(d)||d==0)return null;if(d<0){n=-n;d=-d}const g=gcdQ(n,d);return [n/g,d/g]};
const Qop={"+":(a,b)=>Q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]),"-":(a,b)=>Q(a[0]*b[1]-b[0]*a[1],a[1]*b[1]),"×":(a,b)=>Q(a[0]*b[0],a[1]*b[1]),"÷":(a,b)=>b[0]==0?null:Q(a[0]*b[1],a[1]*b[0]),
 "^":(a,b)=>{if(b[1]!=1||Math.abs(b[0])>12)return null;let r=[1,1];for(let i=0;i<Math.abs(b[0]);i++)r=Qop["×"](r,a);return b[0]<0?Qop["÷"]([1,1],r):r}};
const isqrt=n=>{if(n<0)return null;const r=Math.round(Math.sqrt(n));return r*r==n?r:null};
const Qsqrt=a=>{const n=isqrt(a[0]),d=isqrt(a[1]);return n==null||d==null?null:[n,d]};
const Qeq=(a,b)=>!!a&&!!b&&a[0]==b[0]&&a[1]==b[1];
const Qint=a=>!!a&&a[1]==1;
const minus=s=>s.replace(/-/g,"−");
const Qtxt=a=>a?minus(a[1]==1?String(a[0]):a[0]+"/"+a[1]):"?";
/* Calculadora de expressões (com x). Devolve uma fração exata [numerador, denominador] ou null quando a conta não existe. */
function mathEval(src,x){const t=String(src).replace(/\s+/g,"").replace(/−/g,"-").replace(/[*·]/g,"×").replace(/[:/]/g,"÷").replace(/,/g,".");let i=0;
 const peek=()=>t[i],num=()=>{let j=i;while(i<t.length&&/[0-9.]/.test(t[i]))i++;const s=t.slice(j,i),p=s.split(".");return Q(Number(p.join("")),p[1]?10**p[1].length:1)};
 function prim(){const c=peek();if(c=="("){i++;const v=expr();if(t[i]!=")")throw 0;i++;return v}
  if(c=="x"){i++;if(!x)throw 0;return x}if(c=="√"){i++;const v=post(prim());return v&&Qsqrt(v)}if(/[0-9.]/.test(c||""))return num();throw 0}
 function post(v){for(;;){const c=peek();if(c=="²"){i++;v=v&&Qop["^"](v,[2,1])}else if(c=="³"){i++;v=v&&Qop["^"](v,[3,1])}else if(c=="%"){i++;v=v&&Qop["÷"](v,[100,1])}else return v}}
 function pow(){const b=post(prim());if(peek()=="^"){i++;const e=unary();return b&&e&&Qop["^"](b,e)}return b}
 function unary(){if(peek()=="-"){i++;const v=unary();return v&&Qop["-"]([0,1],v)}if(peek()=="+"){i++;return unary()}return pow()}
 function term(){let v=unary();for(;;){const c=peek();if(c=="×"||c=="÷"){i++;const w=unary();v=v&&w&&Qop[c](v,w)}else if(c&&/[0-9.x(√]/.test(c)){const w=unary();v=v&&w&&Qop["×"](v,w)}else return v}}
 function expr(){let v=term();for(;;){const c=peek();if(c=="+"||c=="-"){i++;const w=term();v=v&&w&&Qop[c](v,w)}else return v}}
 try{const v=expr();return i==t.length?v:null}catch(e){return null}}
/* Conta de uma casa → expressão em x ("+3" vira "x+3", "√" vira "√x", "-10%" vira "x×(1-10%)") */
function opExpr(op){op=String(op).trim().replace(/−/g,"-");
 if(/^[+-]\d+(\.\d+)?%$/.test(op))return "x×(1"+op+")";if(/^\d+(\.\d+)?%$/.test(op))return "x×"+op;
 if(op=="√")return "√x";if(/^[+\-×÷*/^²³]/.test(op))return "x"+op;return op}
const opLabel=op=>{op=minus(String(op).trim());return /^[+−×÷^²³√]|%$|x/.test(op)?op.replace(/\^2/g,"²").replace(/\^3/g,"³"):"= "+op};
/* Regras da porta */
const isPrime=n=>{if(n<2)return false;for(let k=2;k*k<=n;k++)if(n%k==0)return false;return true};
function doorOk(rule,v){if(!v)return false;const r=String(rule).trim().replace(/−/g,"-"),n=v[0]/v[1],I=Qint(v);
 let m;if((m=r.match(/^(=|>|<|≥|≤|≠)(.+)$/))){const k=mathEval(m[2]);if(!k)return false;const d=n-k[0]/k[1];return m[1]=="="?Qeq(v,k):m[1]==">"?d>0:m[1]=="<"?d<0:m[1]=="≥"?d>=0:m[1]=="≤"?d<=0:!Qeq(v,k)}
 if(r=="par")return I&&n%2==0;if(r=="ímpar"||r=="impar")return I&&Math.abs(n%2)==1;if(r=="primo")return I&&isPrime(n);if(r=="q")return I&&isqrt(n)!=null;
 if((m=r.match(/^m(\d+)$/)))return I&&n%+m[1]==0;if((m=r.match(/^d(\d+)$/)))return I&&n>0&&+m[1]%n==0;return false}
function doorTxt(rule){const r=String(rule).trim(),m=r.match(/^(=|>|<|≥|≤|≠)(.+)$/);
 if(m)return {"=":"igual a ",">":"maior que ","<":"menor que ","≥":"maior ou igual a ","≤":"menor ou igual a ","≠":"diferente de "}[m[1]]+minus(m[2]);
 if(r=="par")return "número par";if(r=="ímpar"||r=="impar")return "número ímpar";if(r=="primo")return "número primo";if(r=="q")return "quadrado perfeito";
 if(/^m\d+$/.test(r))return "múltiplo de "+r.slice(1);if(/^d\d+$/.test(r))return "divisor de "+r.slice(1);return r}
/* Prepara a fase (chamado no fim de parse) */
function mathParse(s,L,m){s.m=1;s.val=L.ini!=null?mathEval(String(L.ini)):null;s.alvo=L.alvo!=null?mathEval(String(L.alvo)):null;s.ops=new Map();s.anota=new Map();
 s.mlock=new Set();s.mreg=new Set();s.nums=[];s.noted=new Set();s.turned=0;s.steps=0;s.passo=L.passo||null;s.porta=L.porta||null;s.plano=L.plano||null;
 m.forEach((row,r)=>[...row].forEach((ch,c)=>{const k=r+","+c;if(L.ops&&L.ops[ch]!=null)s.ops.set(k,L.ops[ch]);else if(L.anota&&L.anota[ch]!=null)s.anota.set(k,L.anota[ch]);
  else if(ch=="D")s.mlock.add(k);else if(ch=="r")s.mreg.add(k);else if(ch=="R"){s.mreg.add(k);s.r=r;s.c=c}}));
 if(L.fracao){const f=String(L.fracao).trim(),q=f.endsWith("%")?mathEval(f):mathEval(f);s.fracTxt=f;s.frac=q;s.mneed=q?s.mreg.size*q[0]/q[1]:0}}
const mathLock=(s,k)=>!!s.mlock&&s.mlock.has(k)&&!doorOk(s.porta,s.val);
/* O Bip entra numa casa: conta do passo, conta da casa, anotação */
function mathEnter(s,k,ev){if(!s.m)return;s.steps++;
 const apply=(op,why)=>{const before=s.val,v=before&&mathEval(opExpr(op),before);
  if(!v){ev.mbad=before?`A conta <b>${Qtxt(before)} → ${opLabel(op)}</b> não dá um resultado exato${/√/.test(op)?": "+Qtxt(before)+" não é um quadrado perfeito":/÷/.test(op)?"":""}.`:"O Bip ainda não tem um número.";return false}
  s.val=v;(ev.mops||(ev.mops=[])).push({op,why,from:before,to:v});return true};
 if(s.passo&&!apply(s.passo,"passo"))return;
 if(s.ops.has(k)&&!apply(s.ops.get(k),"casa"))return;
 if(s.anota.has(k)&&!s.noted.has(k)){s.noted.add(k);s.nums.push(s.anota.get(k));ev.mnum=s.anota.get(k)}}
function mathWon(s){if(!s.m)return true;if(s.alvo&&!Qeq(s.val,s.alvo))return false;
 if(s.frac){let n=0;for(const p of s.painted){if(!s.mreg.has(p))return false;n++}return n==s.mneed}return true}
/* Resposta certa das leituras com número */
function mathAnswer(L,s){const a=L.ask;if(a.certo!=null)return String(a.certo);
 if(a.calc=="val")return Qtxt(s.val);if(a.calc=="giro")return s.turned*90+"°";if(a.calc=="passos")return String(s.steps);
 if(a.calc=="soma")return Qtxt(s.nums.reduce((t,n)=>Qop["+"](t,mathEval(String(n))),[0,1]));
 if(a.calc=="media"){const t=s.nums.reduce((t,n)=>Qop["+"](t,mathEval(String(n))),[0,1]);return Qtxt(Qop["÷"](t,[s.nums.length||1,1]))}
 if(a.calc=="coord")return coordTxt(s,s.r,s.c);return "?"}
const sameAns=(a,b)=>String(a).replace(/\s+/g,"").replace(/−/g,"-")==String(b).replace(/\s+/g,"").replace(/−/g,"-");
/* Coordenadas (com origem do plano cartesiano quando a fase tem "plano") */
const coordXY=(s,r,c)=>s.plano?[c-s.plano[1],s.plano[0]-r]:[c,s.H-1-r];
const coordTxt=(s,r,c)=>{const [x,y]=coordXY(s,r,c);return `(${minus(String(x))}, ${minus(String(y))})`};
/* Mensagens de erro da matemática */
function mathWhy(s){if(s.frac){const out=[...s.painted].filter(p=>!s.mreg.has(p)).length,inn=s.painted.size-out,f=s.fracTxt;
  if(out)return `O Bip pintou ${out} ${out==1?"casa":"casas"} fora da figura.`;
  return `A figura tem ${s.mreg.size} casas, e ${f} de ${s.mreg.size} são <b>${s.mneed}</b>. O Bip pintou ${inn}.`}
 if(s.alvo&&!Qeq(s.val,s.alvo))return `O Bip terminou com o número <b>${Qtxt(s.val)}</b>, mas precisava terminar com <b>${Qtxt(s.alvo)}</b>.`+(s.goal&&s.goal!=s.r+","+s.c?" E ele também precisa parar na bandeira.":"");
 return null}
