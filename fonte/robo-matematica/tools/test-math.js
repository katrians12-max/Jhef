/* Testa as fases de matemática com o motor do jogo. uso: node tools/test-math.js */
const fs=require('fs'),path=require('path');const D=path.join(__dirname,'..');const rd=f=>fs.readFileSync(path.join(D,f),'utf8');
const {W}=require('./gen-math.js');
const lib=new Function(rd('30-levels.js')+"\n"+rd('42-math.js')+"\n"+rd('40-core.js')+";return {parse,simulate,PGP,countBlocks,usedTypes,mathEval,mathAnswer,sameAns,Qtxt,KIT,WORLDS}")();
const {simulate,PGP,countBlocks,usedTypes,mathEval,mathAnswer,sameAns,Qtxt}=lib;
let bad=0,total=0;const err=(...a)=>{bad++;console.log("   ✗",...a)};
const bits=n=>[...Array(1<<n).keys()].map(m=>[...Array(n).keys()].filter(i=>m>>i&1));
W.forEach((w,wi)=>{console.log(`\n${w.n}`);w.lv.forEach((L,i)=>{total++;const tag=`${String(i+1).padStart(2)} ${L.t}`;
 L.m.forEach(r=>{if(r.length!=L.m[0].length)err("linha com tamanho diferente",r)});
 if(L.type=="quiz"){const r=simulate(L,PGP(L.pre),0),ans=mathAnswer(L,r.s),hits=L.ask.resp.filter(x=>sameAns(x,ans));
  console.log(tag.padEnd(28),"leitura → resposta",ans,"| simulação:",r.res);if(hits.length!=1)err("resposta certa aparece",hits.length,"vezes nas opções");if(r.res!="VENCEU")err("programa pronto não termina bem",r.res);return}
 const P=PGP({m:L.sol});
 if(L.expr){const loops=[];const walk=l=>l.forEach(b=>{if(b.t=="loop")loops.push(b);if(b.body)walk(b.body)});walk(P.m);
  (L.ex||[]).forEach((e,j)=>{if(e==null)return;const v=mathEval(L.expr[e]);if(!v||v[1]!=1||v[0]!=loops[j].n)err(`conta "${L.expr[e]}" vale ${Qtxt(v)}, mas o Repetir ${j+1} precisa de ${loops[j].n}`)});
  const vals=L.expr.map(e=>Qtxt(mathEval(e)));console.log("   contas do Repetir:",L.expr.map((e,j)=>e+" = "+vals[j]).join(" | "))}
 const r=simulate(L,P,0),n=countBlocks(P),kit=L.k||w.k,used=[...usedTypes(P)].filter(t=>!kit.includes(t));
 console.log(tag.padEnd(28),r.res.padEnd(8),`peças ${n}`,L.max?`(máx ${L.max})`:"",`3★ até ${L.par}`,r.s&&r.s.val?"número final "+Qtxt(r.s.val):"");
 if(r.res!="VENCEU")err("solução não vence");if(L.max&&n>L.max)err("solução passa do limite");if(L.par!=n)err("par diferente da solução:",L.par,"≠",n);if(used.length)err("usa peça fora do kit",used);
 if(L.errado){const e=simulate(L,PGP({m:L.errado}),0);console.log("   caminho errado →",e.res,e.s&&e.s.val?Qtxt(e.s.val):"",e.res=="conta"?"(conta impossível)":"");if(e.res=="VENCEU")err("o caminho errado também vence!")}
 if(L.m==undefined)return;
 // bolsos: todas as escolhas possíveis
 if(/^#/.test(L.m[0])&&L.ops&&Object.keys(L.ops).length==4&&L.m[0].length==11){const ok=bits(4).filter(q=>{let s="";for(let k=0;k<4;k++)s+="2[F]"+(q.includes(k)?"LF2[R]FL":"");return simulate(L,PGP({m:s+"2[F]"}),0).res=="VENCEU"});
  console.log("   escolhas de bolsos que vencem:",ok.map(q=>"{"+q.map(k=>k+1).join(",")+"}").join(" "));if(!ok.length)err("nenhuma escolha de bolsos vence")}
 // dois caminhos: os dois finais devem ser diferentes
})});
console.log(`\n${total} fases de matemática — ${bad?bad+" PROBLEMAS":"TODAS OK"}`);
