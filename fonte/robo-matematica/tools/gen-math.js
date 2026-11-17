/* Gera 31-math-levels.js (dados literais) e testa cada fase com o motor do jogo.
   uso: node tools/gen-math.js */
const fs=require('fs'),path=require('path');const D=path.join(__dirname,'..');
const rd=f=>fs.readFileSync(path.join(D,f),'utf8');
/* ---------- moldes de mapa ---------- */
// dois caminhos (cima c,d / baixo e,f) do S à bandeira
const DOIS=["..c.d.",".####.","S####G",".####.","..e.f."];
const CIMA="L2[F]R5[F]R2[F]",BAIXO="R2[F]L5[F]L2[F]";
// dois caminhos que se juntam antes da porta D; f = casa depois da porta (opcional)
const PORTA=f=>[".c.##.",".#.##.","S..D"+(f||".")+"G",".#.##.",".e.##."];
const PCIMA="L2[F]R2[F]R2[F]L3[F]",PBAIXO="R2[F]L2[F]L2[F]R3[F]";
// bolsos: casas de conta acima do corredor; o aluno escolhe em quais entrar (na ordem, da esquerda para a direita)
const BOLSOS=n=>{let top="#",mid="S";for(let i=0;i<n;i++){top+="#"+"cdefgh"[i];mid+=".."}return [top+"##",mid+".G",("."+"..".repeat(n)+"..")]};
const VISITA="LF2[R]FL";   // entra no bolso que está à esquerda e volta virado para a frente
const bolsoSol=(n,quais)=>{let s="";for(let i=0;i<n;i++)s+="2[F]"+(quais.includes(i)?VISITA:"");return s+"2[F]"};
/* ---------- mundos ---------- */
const K=["F","L","R","loop"],KP=["F","L","R","P","loop"];
const W=[
{n:"6º ano · Números",th:"caderno",ac:"#2b7bd6",ic:"calc",k:K,show:[],
 txt:"Agora o Bip carrega um número! Cada casa com conta muda esse número quando ele passa por ela. Faça as contas antes de executar.",lv:[
 {t:"Conta no caminho",h:"Novidade: o Bip agora carrega um número (aparece no alto do tabuleiro). Cada casa com conta muda o número quando ele passa. Ele começa com 0 e precisa chegar à bandeira com 9.",d:1,ini:0,alvo:9,par:2,m:["......","Sc.d.G","......"],ops:{c:"+4",d:"+5"},sol:"5[F]"},
 {t:"Qual caminho?",h:"O Bip começa com 2 e precisa chegar à bandeira com 12. Faça as contas dos dois caminhos antes de executar.",d:1,ini:2,alvo:12,par:9,m:DOIS,ops:{c:"×5",d:"+2",e:"+5",f:"×2"},sol:CIMA,errado:BAIXO},
 {t:"Dividir em partes",h:"Começa com 36 e precisa chegar com 4. Qual caminho divide do jeito certo?",d:1,ini:36,alvo:4,par:9,m:DOIS,ops:{c:"÷2",d:"÷6",e:"÷3",f:"÷3"},sol:BAIXO,errado:CIMA},
 {t:"Porta dos múltiplos",h:"A porta só abre se o número do Bip for múltiplo de 3 (3, 6, 9, 12...). Ele começa com 1.",d:1,ini:1,porta:"m3",par:12,m:PORTA(),ops:{c:"+4",e:"+8"},sol:PBAIXO,errado:PCIMA},
 {t:"Porta dos primos",h:"Esta porta só abre para números primos: números maiores que 1 que só se dividem por 1 e por eles mesmos. O Bip começa com 4.",d:1,ini:4,porta:"primo",par:12,m:PORTA(),ops:{c:"+7",e:"+5"},sol:PCIMA,errado:PBAIXO},
 {t:"Divisores de 24",h:"A porta só abre para divisores de 24. Depois dela, a casa ×3 precisa deixar o Bip com exatamente 24. Ele começa com 5.",d:1,ini:5,alvo:24,porta:"d24",par:12,m:PORTA("f"),ops:{c:"+3",e:"+7",f:"×3"},sol:PCIMA,errado:PBAIXO},
 {t:"Metade",h:"Use a peça Pintar. Pinte metade da figura tracejada. Quantas casas ela tem? Quanto é a metade?",k:KP,d:1,fracao:"1/2",par:3,m:["......",".Rrrr.",".rrrr.","......"],sol:"4[PF]",errado:"3[PF]"},
 {t:"Três quartos",h:"Pinte 3/4 da figura. Divida as casas em 4 partes iguais e pinte 3 delas.",k:KP,d:1,fracao:"3/4",par:10,m:["......",".Rrrr.",".rrrr.","......"],sol:"4[PF]RFRFPFP",errado:"4[PF]"},
 {t:"25 por cento",h:"Pinte 25% da figura. 25% é o mesmo que 1/4. Quantas casas são 25% de 20?",k:KP,d:1,fracao:"25%",par:3,m:[".......",".Rrrrr.",".rrrrr.",".rrrrr.",".rrrrr.","......."],sol:"5[PF]",errado:"4[PF]"},
 {t:"Perímetro",type:"quiz",h:"Leia o programa: o Bip vai dar uma volta completa em torno das caixas.",ask:{q:"Quantas casas o Bip anda? Esse número é o perímetro do caminho.",calc:"passos",resp:["8","10","12","14"]},d:1,pre:{m:"4[F]R2[F]R4[F]R2[F]"},m:[".......",".S.....","..###..",".......","......."]},
 {t:"Área",type:"quiz",h:"Leia o programa: o Bip vai pintar um retângulo.",ask:{q:"Qual é a área do retângulo pintado (quantas casas)?",certo:"6",resp:["5","6","8","10"]},d:1,pre:{m:"3[PF]RFRF3[PF]"},m:["......",".Rrr..",".rrr..","......"]},
 {t:"O cofre",h:"Desafio! O Bip começa com 0 e precisa chegar à bandeira com 16. Os bolsos de cima têm contas: escolha em quais entrar. A ordem é sempre da esquerda para a direita.",tip:"Teste de cabeça: (0 + 3 + 5) × 2 = ?",d:1,ini:0,alvo:16,par:28,m:BOLSOS(4),ops:{c:"+3",d:"+5",e:"×2",f:"+4"},sol:bolsoSol(4,[0,1,2]),errado:bolsoSol(4,[0,1,2,3])},
]},
{n:"7º ano · Inteiros e plano",th:"quadro",ac:"#c2412e",ic:"axes",k:K,show:[],
 txt:"Números negativos, o plano cartesiano com quatro quadrantes, expressões, equações e ângulos. Atenção aos sinais!",lv:[
 {t:"Abaixo de zero",h:"O Bip começa com 3 e precisa chegar com −4. Os números podem ficar negativos!",d:1,ini:3,alvo:-4,par:9,m:DOIS,ops:{c:"-2",d:"-5",e:"-5",f:"+2"},sol:CIMA,errado:BAIXO},
 {t:"Positivos e negativos",h:"Começa com −6 e precisa chegar com 2. Some com cuidado.",d:1,ini:-6,alvo:2,par:9,m:DOIS,ops:{c:"+4",d:"×2",e:"+10",f:"-2"},sol:BAIXO,errado:CIMA},
 {t:"Sinal vezes sinal",h:"Começa com −3 e precisa chegar com 12. Lembre: negativo vezes negativo dá positivo.",d:1,ini:-3,alvo:12,par:9,m:DOIS,ops:{c:"×(-2)",d:"×(-2)",e:"×(-2)",f:"×2"},sol:BAIXO,errado:CIMA},
 {t:"O ponto (2, 3)",h:"Este tabuleiro é o plano cartesiano: o (0, 0) fica no meio. Leve o Bip até o ponto (2, 3): 2 para a direita e 3 para cima.",d:1,plano:[3,3],par:5,m:[".....G.",".......",".......","...S...",".......",".......","......."],sol:"2[F]L3[F]",errado:"3[F]L2[F]"},
 {t:"Quadrante negativo",h:"Leve o Bip até o ponto (−3, −2). x negativo é para a esquerda; y negativo é para baixo.",d:1,plano:[3,3],par:7,m:[".......",".......",".......","...S...",".......","G......","......."],sol:"2[L]3[F]L2[F]",errado:"3[F]R2[F]"},
 {t:"Visite os pontos",h:"Pegue as estrelas nos pontos (−2, 1) e (1, −2) e termine na bandeira, no ponto (3, 3).",d:1,plano:[3,3],par:17,m:["......G",".......",".*.....","...S...",".......","....*..","......."],sol:"LFL2[F]L3[F]L3[F]L5[F]R2[F]"},
 {t:"Onde o Bip para?",type:"quiz",h:"Leia o programa no plano cartesiano. O Bip começa no (0, 0), virado para a direita.",ask:{q:"Em qual ponto o Bip vai parar?",calc:"coord",resp:["(3, −3)","(−3, 3)","(−3, −3)","(3, 3)"]},d:1,plano:[3,3],pre:{m:"2[F]L3[F]L5[F]"},m:[".......",".......",".......","...S...",".......",".......","......."]},
 {t:"Repetir com conta",h:"Nesta fase o Repetir usa uma conta: toque na conta para trocar. Pare exatamente na bandeira, usando no máximo 2 peças.",d:1,stop:1,max:2,par:2,expr:["2 + 3","12 ÷ 2","3 × 3","10 − 7"],m:["........","S.....G.","........"],sol:"6[F]",ex:[1],errado:"5[F]"},
 {t:"Sinal no Repetir",h:"Pegue as 3 estrelas dando a volta. Escolha a conta certa para o tamanho de cada lado. Cuidado: Repetir um número negativo de vezes não existe!",d:1,max:4,par:4,expr:["2 − 5","(−2) × (−2)","−3 + 8","15 ÷ 5"],m:["*...*.","......","......","......","S...*.","......"],sol:"4[4[F]L]",ex:[1,1],errado:"4[5[F]L]"},
 {t:"Senha da equação",h:"A porta mostra uma equação. A senha é o valor de x: o Bip precisa chegar na porta com esse número. Ele começa com 0.",d:1,ini:0,porta:"=4",portaTxt:"2x + 1 = 9",par:12,m:PORTA(),ops:{c:"+4",e:"+5"},sol:PCIMA,errado:PBAIXO},
 {t:"Quantos graus?",type:"quiz",h:"Leia o programa. Cada Esquerda ou Direita é um giro de 90°.",ask:{q:"Quantos graus o Bip vai girar ao todo?",calc:"giro",resp:["90°","180°","270°","360°"]},d:1,ini:0,pre:{m:"2[F]R2[F]RFRF"},m:["......",".S....","......","......","......"]},
 {t:"Média das notas",type:"quiz",h:"O Bip vai passar pelas notas e anotar cada uma.",ask:{q:"Qual é a média das notas que o Bip anotou?",calc:"media",resp:["7","8","9","32"]},d:1,anota:{c:6,d:9,e:7,f:10},pre:{m:"5[F]"},m:["......","Scdef.","......"]},
 {t:"Temperatura",h:"Desafio! O termômetro do Bip marca −8 e precisa chegar a 0 na bandeira. Escolha os bolsos certos, da esquerda para a direita.",tip:"Experimente: −8 + 5 = −3. E depois?",d:1,ini:-8,alvo:0,par:22,m:BOLSOS(4),ops:{c:"+5",d:"×(-1)",e:"-3",f:"+3"},sol:bolsoSol(4,[0,3]),errado:bolsoSol(4,[0,1])},
]},
{n:"8º ano · Potências e álgebra",th:"lab",ac:"#7b4fd0",ic:"pow",k:K,show:[],
 txt:"Potências, raízes, expressões com x, porcentagem e proporção. Pense na ordem das contas!",lv:[
 {t:"Ao quadrado",h:"x² é o número vezes ele mesmo. O Bip começa com 3 e precisa chegar com 10.",d:1,ini:3,alvo:10,par:9,m:DOIS,ops:{c:"^2",d:"+1",e:"+1",f:"^2"},sol:CIMA,errado:BAIXO},
 {t:"Raiz quadrada",h:"√ é a raiz quadrada: o número que, vezes ele mesmo, dá o valor. O Bip começa com 50 e precisa chegar com 7.",d:1,ini:50,alvo:7,par:9,m:DOIS,ops:{c:"√",d:"+1",e:"-1",f:"√"},sol:BAIXO,errado:CIMA},
 {t:"Potências de 2",h:"O Bip pode passar várias vezes na mesma casa: a conta acontece toda vez. Ele começa com 1 e precisa chegar à bandeira com 32 (2⁵).",d:1,ini:1,alvo:32,par:10,m:[".....","Sc...",".G..."],ops:{c:"×2"},sol:"4[F2[R]F2[R]]FRF",errado:"3[F2[R]F2[R]]FRF"},
 {t:"Expressões com x",h:"A casa 2x+1 dobra o número e soma 1. O Bip começa com 4 e precisa chegar com 3. A ordem das contas muda o resultado!",d:1,ini:4,alvo:3,par:9,m:DOIS,ops:{c:"2x+1",d:"x-3",e:"x-3",f:"2x+1"},sol:BAIXO,errado:CIMA},
 {t:"Bateria",h:"Cada casa andada gasta 3 de bateria. A bateria começa em 30. Pare quando ela marcar exatamente 6. Use no máximo 2 peças.",d:1,ini:30,alvo:6,passo:"-3",stop:1,max:2,par:2,m:["............","S...........","............"],sol:"8[F]",errado:"7[F]"},
 {t:"Desconto",h:"Um produto custa 200. Qual caminho de descontos deixa o preço em 90?",d:1,ini:200,alvo:90,par:9,m:DOIS,ops:{c:"-20%",d:"-50%",e:"-10%",f:"-50%"},sol:BAIXO,errado:CIMA},
 {t:"Juros",h:"O Bip guardou 100. Qual caminho deixa o dinheiro em 121?",d:1,ini:100,alvo:121,par:9,m:DOIS,ops:{c:"+10%",d:"+10%",e:"+20%",f:"+2"},sol:CIMA,errado:BAIXO},
 {t:"x dos dois lados",h:"Resolva a equação da porta: a senha é o valor de x. O Bip começa com 1.",d:1,ini:1,porta:"=3",portaTxt:"5x − 4 = 2x + 5",par:12,m:PORTA(),ops:{c:"+2",e:"+4"},sol:PCIMA,errado:PBAIXO},
 {t:"Regra de três",type:"quiz",h:"Leia o programa: o Bip vai dar 2 voltas no quadrado.",ask:{q:"Em 2 voltas o Bip anda 16 casas. Quantas casas ele andaria em 5 voltas?",certo:"40",resp:["32","40","80","20"]},d:1,pre:{m:"2[4[2[F]L]]"},m:[".....",".....",".....","S....","....."]},
 {t:"Laboratório",h:"Desafio! O Bip começa com 2 e precisa chegar com 3. Escolha os bolsos certos, da esquerda para a direita.",tip:"Depois de 2², quanto falta para um quadrado perfeito?",d:1,ini:2,alvo:3,par:28,m:BOLSOS(4),ops:{c:"^2",d:"+5",e:"√",f:"×2"},sol:bolsoSol(4,[0,1,2]),errado:bolsoSol(4,[0,2])},
]},
{n:"9º ano · Funções e equações",th:"observatorio",ac:"#0f8f86",ic:"func",k:K,show:[],
 txt:"Funções, equações do 2º grau, Pitágoras, juros compostos e sequências. Os maiores desafios de matemática do Bip!",lv:[
 {t:"Máquina de função",type:"quiz",h:"A casa é uma máquina: f(x) = 2x + 3. O Bip entra com 4.",ask:{q:"Com que número o Bip sai da máquina?",calc:"val",resp:["8","10","11","14"]},d:1,ini:4,ops:{c:"2x+3"},pre:{m:"3[F]"},m:["......","S.c...","......"]},
 {t:"Ordem das contas",h:"O Bip começa com 2 e precisa chegar com 25. As duas rotas têm as mesmas contas, mas em ordens diferentes.",d:1,ini:2,alvo:25,par:9,m:DOIS,ops:{c:"x²",d:"+3",e:"+3",f:"x²"},sol:BAIXO,errado:CIMA},
 {t:"Função quadrática",h:"Começa com 3 e precisa chegar com 8. Calcule f(3) em cada máquina.",d:1,ini:3,alvo:8,par:9,m:DOIS,ops:{c:"x²-1",e:"2x+1"},sol:CIMA,errado:BAIXO},
 {t:"Pitágoras",type:"quiz",h:"Leia o programa: o Bip anda pelos dois catetos de um triângulo retângulo.",ask:{q:"Os catetos medem 3 e 4. Quanto mede a hipotenusa (o lado que liga a saída à chegada)?",certo:"5",resp:["5","6","7","12"]},d:1,pre:{m:"3[F]L4[F]"},m:[".....",".....",".....",".....","S....","....."]},
 {t:"Equação do 2º grau",h:"A senha é a solução positiva da equação. O Bip começa com 1.",d:1,ini:1,porta:"=3",portaTxt:"x² = 9 (x > 0)",par:12,m:PORTA(),ops:{c:"+2",e:"×(-3)"},sol:PCIMA,errado:PBAIXO},
 {t:"Raízes",h:"O Bip começa com 81 e precisa chegar com 3.",d:1,ini:81,alvo:3,par:9,m:DOIS,ops:{c:"√",d:"÷2",e:"√",f:"√"},sol:BAIXO,errado:CIMA},
 {t:"Juros compostos",h:"O Bip guardou 1000. Qual caminho deixa o dinheiro em 1210?",d:1,ini:1000,alvo:1210,par:9,m:DOIS,ops:{c:"+20%",d:"+1%",e:"+10%",f:"+10%"},sol:BAIXO,errado:CIMA},
 {t:"Sequência",h:"Cada vez que o Bip entra na casa +3, o número aumenta 3 (1, 4, 7, 10...). Ele começa com 1 e precisa terminar na bandeira com 22. Escolha a conta do Repetir.",d:1,ini:1,alvo:22,max:9,par:9,expr:["(22 − 1) ÷ 3","22 ÷ 3","3 × 7 + 1","22 − 3"],ops:{c:"+3"},m:["G....","Sc...","....."],sol:"7[FRRFRR]LF",ex:[0],errado:"6[FRRFRR]LF"},
 {t:"Função na porta",h:"A porta pede o valor de f(3). O Bip começa com 0.",d:1,ini:0,porta:"=7",portaTxt:"f(x) = 2x + 1; f(3) = ?",par:12,m:PORTA(),ops:{c:"+7",e:"+5"},sol:PCIMA,errado:PBAIXO},
 {t:"O grande cálculo",h:"Desafio final da matemática! O Bip começa com 1 e precisa chegar com 25. Escolha os bolsos, da esquerda para a direita.",tip:"Uma das máquinas eleva ao quadrado. Que número, ao quadrado, dá 25?",d:1,ini:1,alvo:25,par:22,m:BOLSOS(4),ops:{c:"2x+3",d:"x²",e:"x-4",f:"3x"},sol:bolsoSol(4,[0,1]),errado:bolsoSol(4,[0,1,2])},
]}];
/* ---------- saída: arquivo de dados literais ---------- */
const lit=v=>Array.isArray(v)?"["+v.map(lit).join(",")+"]":v&&typeof v=="object"?"{"+Object.entries(v).filter(([k])=>!["errado","ex"].includes(k)).map(([k,x])=>(/^[a-zA-Z_]\w*$/.test(k)?k:JSON.stringify(k))+":"+lit(x)).join(",")+"}":JSON.stringify(v);
function write(){const out=["/* ===== Mundos de matemática (6º ao 9º ano) — gerado por tools/gen-math.js =====",
 "   Os campos novos (ini, alvo, ops, porta, plano, expr, fracao, anota, ask, passo) estão explicados em 42-math.js. sol = uma solução (gabarito). */",
 "WORLDS.push("];W.forEach((w,i)=>{const {lv,...head}=w;out.push(lit(head).slice(0,-1)+",lv:[");lv.forEach(l=>out.push(" "+lit(l)+","));out.push("]}"+(i<W.length-1?",":""))});out.push(");");
 fs.writeFileSync(path.join(D,"31-math-levels.js"),out.join("\n")+"\n");console.log("31-math-levels.js gravado")}
if(require.main===module)write();
module.exports={W};
