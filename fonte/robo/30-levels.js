/* ===== Mundos e fases =====
   Cada fase: t título · h missão · d direção inicial (0 norte, 1 leste, 2 sul, 3 oeste) · m mapa · vs mapas extras
   par = peças para 3 estrelas · max = limite de peças · k = peças disponíveis · stop = precisa parar na bandeira
   type "quiz" = ler o programa pronto e prever · type "fix" = consertar o programa pronto · pre = programa que já vem montado
   need = peças que o programa precisa usar · lockFn = a Peça A já vem pronta e não pode ser mexida · tip = dica extra */
const KIT={base:["F","L","R"],loop:["F","L","R","loop"],jump:["F","L","R","J","loop"],paint:["F","L","R","P","loop"],paint0:["F","L","R","P"],
 sense:["F","L","R","loop","until","if"],until:["F","L","R","until"],hurdle:["F","J","until","if"],
 fn:["F","L","R","loop","fa"],fn2:["F","L","R","loop","fa","fb"],castle:["F","L","R","loop"],castleJ:["F","L","R","J","loop"]};
const WORLDS=[
{n:"Primeiros passos",th:"oficina",ac:"#e8642c",ic:"up",k:KIT.base,show:["F","L","R"],
 txt:"Programar é dar ordens em sequência. Monte as peças, aperte Executar e o Bip obedece: uma peça de cada vez, de cima para baixo.",lv:[
 {t:"Um passo",h:"Arraste a peça Frente e encaixe embaixo de Ao executar. Depois aperte Executar.",d:1,par:1,m:["....","....",".SG.","...."]},
 {t:"Dois passos",h:"Cada peça Frente anda uma casa. Encaixe duas, uma embaixo da outra.",d:1,par:2,m:["....","S.G.","....","...."]},
 {t:"Conte as casas",h:"Conte quantas casas faltam até a bandeira. Uma peça Frente para cada casa.",d:1,par:5,m:["......","......","S....G","......","......","......"]},
 {t:"Girar à esquerda",h:"A peça Esquerda gira o Bip no lugar, sem andar. Gire primeiro e depois ande.",d:1,par:2,m:["....",".G..",".S..","...."]},
 {t:"Girar à direita",h:"Agora use a peça Direita. Depois de girar, quantas casas faltam?",d:1,par:3,m:["....",".S..","....",".G.."]},
 {t:"Andar e virar",h:"Ande, vire e ande de novo. Observe para onde o Bip está olhando.",d:1,par:5,m:[".....",".....","..G..",".....","S...."]},
 {t:"Meia-volta",h:"O Bip está de costas para a bandeira. Quantas vezes ele precisa girar para ficar de frente?",d:1,par:3,m:["....","....","GS..","...."]},
 {t:"Leia o programa",type:"quiz",h:"Desta vez o programa já está pronto. Leia com atenção, peça por peça, e descubra em qual casa numerada o Bip vai parar.",d:1,pre:{m:"FFLF"},m:[".....",".....",".32..","S..1.","..4.."]},
 {t:"Pegue as estrelas",h:"Passe por cima das estrelas para pegá-las. Pegue todas e depois chegue à bandeira.",d:1,par:5,m:["......","......","S.*.*G","......","......","......"]},
 {t:"Estrela fora do caminho",h:"A estrela está longe do caminho. Qual é o trajeto mais curto que passa por ela e chega à bandeira?",d:1,par:11,m:[".....","..*..",".....","S...G","....."]},
 {t:"Desvie da caixa",h:"Caixas bloqueiam o caminho. Dê a volta por cima ou por baixo dela.",d:1,par:9,m:[".....",".....","S.#.G",".....","....."]},
 {t:"Caminho de estrelas",h:"Siga as estrelas, uma por uma, até chegar à bandeira.",d:1,par:9,m:["......","..*.G.","..*.#.","..*...","S*....","......"]},
 {t:"Carteiras espalhadas",h:"Encontre um caminho entre as caixas. Planeje antes de montar: existe mais de um trajeto, e o mais curto vale 3 estrelas.",d:1,par:10,m:["G.#...",".##.#.","..#.#.","#*#...","..#.#.","S..#.."]},
 {t:"Conserte o programa",type:"fix",h:"Este programa tem UM erro. Execute para ver o que acontece, descubra qual peça está errada e troque por outra.",d:1,pre:{m:"FFFLFF"},par:6,max:6,m:["S....",".....","...G.",".....","....."]}
]},
{n:"Repetir",th:"patio",ac:"#2f9a4c",ic:"repeat",k:KIT.loop,show:["loop"],
 txt:"A peça Repetir faz tudo o que está dentro dela várias vezes. Programas menores valem mais estrelas!",lv:[
 {t:"Conheça o Repetir",h:"Lembra da fase das 5 casas? Agora use a peça Repetir: coloque um Frente DENTRO dela e ajuste o número de vezes.",d:1,par:2,max:4,m:["......","......","S....G","......","......","......"]},
 {t:"Repetir, virar, repetir",h:"Use um Repetir para cada reta. Outras peças podem vir antes ou depois do Repetir.",d:1,par:5,max:6,m:["......","......","....G.","......","......",".S...."]},
 {t:"A escada",h:"Dentro do Repetir cabem várias peças. Descubra qual é o degrau que se repete.",tip:"Um degrau é: Frente, Esquerda, Frente, Direita. Quantos degraus tem a escada?",d:1,par:5,max:7,m:["......","....G.","...*.#","..*.#.",".*.#..","S.#..."]},
 {t:"A rampa",h:"Agora a escada desce. Qual é o movimento de um degrau?",d:1,par:5,max:7,m:["S.....",".*....","..*...","...*..","....*.",".....G"]},
 {t:"O que o Repetir faz?",type:"quiz",h:"Leia o programa: quantas vezes cada peça vai acontecer? Em qual casa numerada o Bip vai parar?",d:1,pre:{m:"3[F]R2[F]"},m:["......","S..1..","......","..23..","...4..","......"]},
 {t:"Volta no canteiro",h:"Pegue as 3 estrelas. Cada lado do canteiro tem o mesmo tamanho. Não tem bandeira nesta fase.",tip:"Cada lado é: 3 Frentes e uma Direita.",d:0,par:5,max:7,m:["......",".*..*.","..##..","..##..",".S..*.","......"]},
 {t:"O depósito escuro",h:"O caminho é longo. Planeje cada curva antes de executar. Onde dá para usar o Repetir?",d:0,par:16,m:["...#.G",".#*#.#",".#...#",".####.","*.....","S.#..."]},
 {t:"Antes e depois",h:"Às vezes é preciso virar antes de começar a repetir.",tip:"Comece com Direita. Depois são duas retas de 5 casas.",d:1,par:6,max:8,m:["S#....",".#....",".#.##.",".#....",".#....","*....G"]},
 {t:"Quantas vezes?",type:"fix",h:"O programa quase funciona! Execute, veja onde o Bip para e conserte UM número.",d:1,pre:{m:"4[F]L3[F]"},par:5,max:5,m:["......","......",".....G","......","......","S....."]}
]},
{n:"Pular e buracos",th:"praia",ac:"#1493bd",ic:"jump",k:KIT.jump,show:["J"],
 txt:"Buracos são perigosos: se o Bip andar para dentro de um, ele cai. A peça Pular salta por cima de UMA casa e cai duas casas à frente.",lv:[
 {t:"Cuidado com o buraco",h:"Nova peça: Pular! O Bip salta por cima de UMA casa e cai duas casas à frente. Se ele andar para dentro do buraco, cai.",d:1,par:3,m:[".....",".....","S.x.G",".....","....."]},
 {t:"Pule a caixa",h:"Pular também serve para caixas. Lembre: ele sempre cai DUAS casas à frente.",d:1,par:2,m:["....","S#.G","....","...."]},
 {t:"Não pule a estrela!",h:"Atenção: quando o Bip pula, ele NÃO pega o que está na casa do meio.",d:1,par:5,m:[".......","S*.x.*G","......."]},
 {t:"Buracos em fila",h:"Os buracos se repetem. Que tal repetir os pulos?",d:1,par:5,max:6,m:["......G","......x",".......","......x",".......","......x","Sx.x.x."]},
 {t:"Pula e anda",h:"Um passo, um pulo, um passo, um pulo... Qual é o pedaço que se repete?",d:1,par:3,max:5,m:["..........","S.x..x..xG",".........."]},
 {t:"Dois buracos juntos",h:"Dois buracos seguidos não dá para pular: ele cairia no segundo. Procure outro caminho.",d:1,par:8,m:[".x....","S.xx.G","...x.."]},
 {t:"Onde ele cai?",type:"quiz",h:"Cada Pular anda DUAS casas. Siga o programa com calma: em qual casa numerada o Bip vai parar?",d:1,pre:{m:"JFJLJ"},m:["......",".....3",".....1",".....x","Sx.4x2","......"]},
 {t:"Pista de saltos",h:"Uma pista com caixas e buracos. Pegue as estrelas no caminho até a bandeira.",d:1,par:8,max:10,m:[".......G",".......x",".......*",".......x","........","S.#*.#.."]},
 {t:"A ilha",h:"Dê a volta na ilha pegando todas as estrelas e volte para onde começou. Os 4 lados são iguais. Cuidado para não pular nenhuma estrela!",tip:"Um lado é: Frente, Frente, Pular, Frente, Frente e Direita. São 4 lados.",d:1,g:[0,0],par:7,max:9,m:["S*.x.*.","*#####*",".#####.","x#####x",".#####.","*#####*",".*.x.*."]}
]},
{n:"Repetir dentro do Repetir",th:"fazenda",ac:"#c27f10",ic:"repeat",k:KIT.loop,show:["loop"],
 txt:"Um Repetir pode morar dentro de outro Repetir. Procure padrões grandes feitos de padrões pequenos.",lv:[
 {t:"Ida e volta",h:"Novo truque: um Repetir pode ficar DENTRO de outro Repetir. Ir e voltar é o mesmo movimento duas vezes.",d:1,g:[2,0],par:5,max:6,m:["......","######","S....*","######","......","......"]},
 {t:"Ronda pela cerca",h:"Quantas casas tem cada lado? Quantos lados tem a cerca? Pegue as estrelas e volte ao ponto de partida.",tip:"Um lado é: Repetir 5 [Frente] e depois Direita. São 4 lados: coloque tudo dentro de outro Repetir.",d:0,g:[5,0],par:4,max:6,m:["*....*",".#..#.","..##..","..##..",".#..#.","S....*"]},
 {t:"Repetir dentro de Repetir",type:"quiz",h:"Um Repetir dentro do outro: o de dentro acontece inteiro a cada volta do de fora. Em qual casa o Bip vai parar?",d:1,pre:{m:"2[2[F]LFR]"},m:["......","......","......","...31.","..4.2.","S....."]},
 {t:"Degraus largos",h:"Cada degrau tem duas casas de largura e duas de altura.",d:1,par:7,max:9,m:["......","....G.","...#*#","..*...","##.#..","S..#.."]},
 {t:"A ordem importa",type:"fix",h:"Quase! As peças estão certas, mas a ORDEM dentro do Repetir está errada. Arraste para trocar de lugar.",d:1,g:[1,1],pre:{m:"4[R3[F]]"},par:4,max:4,m:["......",".S..*.","..##..","..##..",".*..*.","......"]},
 {t:"Arando a lavoura",h:"Ida, curva, volta, curva... como um trator na lavoura.",tip:"Ida (5 Frentes), sobe uma casa e vira; volta (5 Frentes), sobe uma casa e vira. Isso acontece 2 vezes.",d:1,par:11,max:13,m:["......","G#####","*.....",".....*","*.....","S....*"]},
 {t:"Rosa dos ventos",h:"Vá até a ponta, dê meia-volta, volte ao centro e vire para o próximo braço.",d:0,par:8,max:10,m:["..*...",".#.#..","*.S.*.",".#.#..","..*...","......"]},
 {t:"O diamante",h:"Cada lado do diamante é uma pequena escada. Depois de cada lado, vire.",tip:"Um lado é: Repetir 2 [Frente, Esquerda, Frente, Direita]. Depois vire à Esquerda. São 4 lados.",d:1,g:[5,2],par:7,max:9,m:["......","#.*.#.","..#...","*###*.","......","#.S.#."]},
 {t:"A antena",h:"Suba em cada haste até a estrela, desça e vá para a próxima.",tip:"Para cada haste: Frente, Esquerda, subir 3, meia-volta, descer 3, Esquerda, Frente.",d:1,par:11,max:13,m:["#*#*#*","#.#.#.","#.#.#.","S....."]},
 {t:"O caracol",h:"Siga a espiral até o centro pegando todas as estrelas. Repare: os lados vão diminuindo.",tip:"Os lados medem 4, 4, 4, 3, 3, 2, 2, 1, 1. Use um Repetir para cada grupo de lados iguais.",d:1,par:15,max:17,m:["*...*",".*.*.",".*G..","*..*.","S...*"]}
]},
{n:"Pintar",th:"lousa",ac:"#d93a7f",ic:"brush",k:KIT.paint,show:["P"],
 txt:"A peça Pintar colore a casa onde o Bip está. Pinte exatamente o desenho marcado: nem mais, nem menos.",lv:[
 {t:"Primeira pincelada",k:KIT.paint0,h:"Nova peça: Pintar! Ela pinta a casa onde o Bip está. Ande até a casa marcada e pinte.",d:1,par:2,m:["....","....",".So.","...."]},
 {t:"Três casas",k:KIT.paint0,h:"Pinte as 3 casas marcadas, uma de cada vez. Cuidado: não pinte casas fora do desenho.",d:1,par:6,m:[".....",".....","Sooo.",".....","....."]},
 {t:"Linha com Repetir",h:"A casa onde o Bip começa também faz parte do desenho.",d:1,par:3,max:5,m:["......","......","......","sooooo","......","......"]},
 {t:"A letra L",h:"Pinte a letra L. Em que casa o Bip precisa virar?",d:2,par:8,m:["......",".s....",".o....",".o....",".oooo.","......"]},
 {t:"Quadrado 2 × 2",h:"Quantas casas tem este quadrado? Essa é a área: 2 × 2 = 4.",d:1,par:5,max:7,m:[".....",".so..",".oo..",".....","....."]},
 {t:"Linha tracejada",type:"fix",h:"O Bip devia pintar uma casa sim, uma casa não. As peças estão certas, mas fora de ordem. Conserte!",d:1,pre:{m:"3[FPF]"},par:4,max:4,m:["......","......","......","s.o.o.","......","......"]},
 {t:"Contorno do quadrado",h:"Pinte só a borda: 4 lados iguais. Quantas casas tem o contorno?",d:1,par:5,max:7,m:["......",".sooo.",".o..o.",".o..o.",".oooo.","......"]},
 {t:"Retângulo cheio",h:"Pinte o retângulo inteiro. Área = 3 × 2 = 6 casas. Vá e volte, como um trator.",d:1,par:11,m:["......",".soo..",".ooo..","......","......","......"]},
 {t:"Diagonal",h:"Pinte só a diagonal. O Bip pode passar por outras casas sem pintar.",d:1,par:6,max:8,m:[".....o","....o.","...o..","..o...",".o....","s....."]},
 {t:"A cruz",h:"Pinte o centro e depois cada braço: vá, pinte e volte.",d:0,par:8,max:10,m:[".....","..o..",".oso.","..o..","....."]},
 {t:"A moldura",h:"Os lados têm tamanhos diferentes: 5 e 4. Quais lados se repetem?",d:1,par:9,max:11,m:[".......",".soooo.",".o...o.",".o...o.",".ooooo.","......."]},
 {t:"Quadrado cheio 3 × 3",h:"Pinte o quadrado inteiro: área = 3 × 3 = 9 casas. Pense num caminho esperto antes de montar.",tip:"Pinte primeiro a borda dando a volta (como no Contorno do quadrado) e deixe o centro por último.",d:1,par:9,max:12,m:[".....",".soo.",".ooo.",".ooo.","....."]}
]},
{n:"Se e Repetir até",th:"jardim",ac:"#2f6fd6",ic:"split",k:KIT.sense,show:["until","if"],
 txt:"Agora o Bip enxerga! Repetir até repete até alguma coisa acontecer. Se escolhe o que fazer. Nestas fases, o mesmo programa precisa funcionar em vários mapas.",lv:[
 {t:"Até a caixa",h:"Nova peça: Repetir até! Ela repete até a condição acontecer. O mesmo programa precisa funcionar nos 3 mapas: pare na casa antes da caixa, sem contar casas.",d:1,par:2,max:3,stop:1,k:KIT.until,
  m:["......","S..G#.","......"],vs:[["......","S....G","......"],["......","SG#...","......"]]},
 {t:"Ande e vire",h:"Ande até a caixa ou a borda, vire à esquerda e pare na bandeira. Cada mapa tem um tamanho diferente.",d:1,par:5,max:6,stop:1,k:KIT.until,
  m:["......","...G..","......","......","......","S...#."],vs:[["......","......","......",".G....","......","S.#..."],[".....G","......","......","......","......","S....."]]},
 {t:"Até onde ele vai?",type:"quiz",h:"Repetir até caixa na frente: o Bip anda até não dar mais. Em qual casa numerada ele vai parar?",d:1,pre:{m:"Uf[F]LUf[F]"},m:["...#..","...1..","...2..","......","S..3#4","......"]},
 {t:"Se tem caixa, vire",h:"Nova peça: Se! Se tiver caixa na frente, vire à esquerda; senão, ande. Funciona nos 3 mapas?",d:1,par:4,max:5,stop:1,
  m:["..G...","......","......","......","......","S....."],vs:[["......","......","..G...","......","......","S..#.."],["......","...#..","G.....","......","......","S...#."]]},
 {t:"Sim e não trocados",type:"fix",h:"O Bip fica girando sem sair do lugar! Olhe o Se com atenção: o que ele deve fazer quando TEM caixa na frente? E quando NÃO tem?",d:1,stop:1,pre:{m:"Ug[If[F|L]]"},par:4,max:4,
  m:["......","......",".....G","......","......","S....."],vs:[["......","......","..G...","......","......","S..#.."]]},
 {t:"Esquerda ou direita?",h:"Na curva, olhe para a esquerda: se tiver caixa, vire à direita; senão, vire à esquerda.",d:1,par:6,max:7,stop:1,
  m:["#######","#####G#","#####.#","###...#","###.###","S...###","#######"],vs:[["S..####","##.####","##...##","####.##","####..G","#######","#######"],["#######","S....##","####.##","####.##","####.##","####G##","#######"]]},
 {t:"Corrida com barreiras",h:"Use o Se para decidir: se tiver caixa na frente, pule; senão, ande. As caixas mudam de lugar em cada mapa!",d:1,par:4,max:5,stop:1,k:KIT.hurdle,
  m:["........","S.#..#.G","........"],vs:[["........","S#.#...G","........"],["........","S...#.#G","........"]]},
 {t:"Buracos no caminho",h:"Agora o perigo é outro. Toque na condição do Se para trocar para 'buraco na frente'.",d:1,par:4,max:5,stop:1,k:KIT.hurdle,
  m:["........","S.x..x.G","........"],vs:[["........","Sx.x...G","........"],["........","S..x.x.G","........"]]},
 {t:"Caixas e buracos",h:"Caixas E buracos! Dentro do 'senão' de um Se cabe outro Se.",tip:"Se caixa na frente: Pular. Senão: (Se buraco na frente: Pular; senão: Frente).",d:1,par:6,max:8,stop:1,k:KIT.hurdle,
  m:["........","S.#.x..G","........"],vs:[["........","Sx..#.xG","........"],["........","S#.x.#.G","........"]]},
 {t:"O labirinto",h:"Truque dos exploradores: siga sempre a parede da direita. Se não tiver caixa à direita, vire à direita e ande.",tip:"Dentro do Repetir até: Se caixa à direita, então (Se caixa na frente: Esquerda; senão: Frente); senão: Direita e Frente.",d:1,par:7,max:9,stop:1,
  m:["S.#....","#.#.##.","#...#..","###.#.#","#...#..","#.###.#","#.....G"],vs:[["S...#..","###.#.#","#...#.#","#.###.#","#.....#","####.##","G....##"],["S..#...","##.#.#.","#..#.#.","#.##.#.","#....#.","######.","G......"]]}
]},
{n:"Minhas peças",th:"fabrica",ac:"#2e9960",ic:"wrench",k:KIT.fn,show:["fa"],
 txt:"Você pode inventar peças novas! Monte a receita uma vez em 'Para fazer a Peça A' e use a Peça A quantas vezes quiser.",lv:[
 {t:"Use a Peça A",h:"Novidade: peças criadas por você! A Peça A já veio pronta: ela sobe um degrau (veja a receita dela no programa). Use a Peça A para subir a escada inteira.",tip:"São 5 degraus. Em vez de colocar a Peça A cinco vezes, coloque uma Peça A dentro de um Repetir 5.",d:1,lockFn:1,k:["loop","fa"],need:["fa"],pre:{A:"FLFR"},par:6,max:9,m:[".....G","....*.","...*..","..*...",".*....","S....."]},
 {t:"Monte a sua peça",need:["fa"],h:"Agora monte você a Peça A! Arraste peças para baixo de 'Para fazer a Peça A'. Entrar no cantinho, pegar a estrela e voltar é sempre igual.",tip:"Peça A: Esquerda, Frente, Direita, Direita, Frente, Esquerda.",d:1,par:15,max:17,m:["........","........","........","#*##*#*#","S......G"]},
 {t:"Peça dentro do Repetir",need:["fa"],h:"A sua peça também pode ir dentro do Repetir. Aqui a escada tem um trecho reto no meio.",d:1,par:10,max:11,m:[".......G","......*.","...*....","..*.....",".*......","S......."]},
 {t:"Siga as peças",type:"quiz",h:"O programa usa a Peça A três vezes. Siga com o dedo, sem pressa: em qual casa numerada o Bip vai parar?",d:1,pre:{m:"AARA",A:"FFLF"},m:["14....","......",".2....","......","..3...","S....."]},
 {t:"Duas peças",need:["fa","fb"],h:"Agora você tem duas peças: A e B. Subir e descer são movimentos diferentes: faça uma peça para cada um.",tip:"A = Frente, Esquerda, Frente, Direita (sobe). B = Frente, Direita, Frente, Esquerda (desce).",d:1,k:KIT.fn2,par:14,max:15,m:[".......","....*..",".*.....","S.*...G","......."]},
 {t:"Até bater",need:["fa"],h:"Corredores de tamanhos diferentes... Crie uma peça 'andar até bater' e use em todos eles.",tip:"Peça A = Repetir até caixa na frente [Frente].",d:1,k:["F","L","R","until","fa"],par:11,max:12,m:["##*...G","##.###.","##.####","##....*","######.","######.","S.....*"]},
 {t:"A peça com defeito",type:"fix",h:"O defeito está DENTRO da Peça A. Como ela é usada duas vezes, o erro aparece duas vezes! Conserte uma peça só.",d:1,pre:{m:"FA2[F]A2[F]",A:"LF2[R]FR"},par:13,max:13,m:["......","......","#*#*##","S....G","......"]},
 {t:"Três voltas",need:["fa"],h:"Três quarteirões iguais em lugares diferentes. Faça uma peça que dá a volta em um quarteirão e use três vezes.",tip:"Peça A = Repetir 4 [Repetir 2 [Frente], Direita].",d:1,par:16,max:18,m:["S.*...*",".#...#.","*.*.*.*",".......","......*",".....#.","....*.*","....G.."]}
]},
{n:"Chaves e portais",th:"castelo",ac:"#7b5ae0",ic:"key",k:KIT.castle,show:[],
 txt:"Chaves abrem portas da mesma cor: é só passar por cima da chave. Portais levam o Bip para o outro portal da mesma cor, olhando para o mesmo lado.",lv:[
 {t:"A chave e a porta",h:"Chaves abrem portas da mesma cor. Passe por cima da chave para pegá-la. Sem a chave, a porta é como uma parede.",d:1,par:10,m:[".....","..a##","S..AG","...##","....."]},
 {t:"Duas chaves",h:"A chave dourada está atrás da porta azul. Em que ordem o Bip precisa pegar as coisas?",d:1,par:17,m:["######","#b####","S.B.AG","###a##"]},
 {t:"O portal",h:"Portais teleportam o Bip para o outro portal da mesma cor. Ele continua olhando para o mesmo lado.",d:1,par:2,max:4,m:["########","S.p##p.G","########"]},
 {t:"Olhando para o mesmo lado",h:"Depois do portal, o Bip continua olhando para o mesmo lado de antes. Conte as casas dos dois lados do portal.",d:1,par:5,m:["p...##","###.##","###G##","######","######","S.p###"]},
 {t:"Pelo portal",type:"quiz",h:"Cuidado com o portal no meio do caminho! Em qual casa numerada o Bip vai parar?",d:1,pre:{m:"3[F]L2[F]"},m:["..2...","..3...",".p.1..","......","S.p...","......"]},
 {t:"Dois portais",h:"Dois portais, dois destinos. Um leva à estrela, o outro à bandeira. Em que ordem usar?",d:1,par:14,m:["##G#*.p","##.####","##q####","#######","q######",".######","S..p###"]},
 {t:"O fosso do castelo",h:"A chave está de um lado e a porta do outro, com buracos no caminho. Repare: o mesmo movimento aparece várias vezes.",d:1,k:KIT.castleJ,par:9,m:["#########","a.x.S.xAG","#########"]},
 {t:"Chave antes da porta",type:"fix",h:"O Bip está indo para o lado errado e nem pega a chave. Qual peça está errada?",d:1,pre:{m:"2[F]R2[F]2[R]2[F]L3[F]"},par:12,max:12,m:["..a#..","...#..","S..A.G","...#..","...#.."]},
 {t:"O castelo",h:"A grande missão do castelo: portal, duas chaves, duas portas e um fosso. Planeje a ordem com calma antes de montar.",tip:"Ordem: portal, chave azul, voltar pelo portal, porta azul, chave dourada, porta dourada e pular o fosso.",d:1,k:KIT.castleJ,par:19,m:["a####b.p",".#######","B#######",".#######",".A.x.G##",".#######",".#######","S.p#####"]}
]},
{n:"Desafios finais",th:"torre",ac:"#d39400",ic:"bolt",k:KIT.loop,show:[],
 txt:"Hora de usar tudo o que você aprendeu. Leia o mapa com calma, procure padrões e planeje antes de executar.",lv:[
 {t:"Corrida com obstáculos",h:"Aqui o Bip não pode pular. Pegue as 3 estrelas e chegue à bandeira. Olhe o mapa inteiro antes de montar: existe um caminho bem mais simples do que parece!",d:1,par:7,max:10,m:["........","........",".*.*.*..","S#.#.#.G"]},
 {t:"A pirâmide",h:"Suba de um lado e desça do outro. A subida e a descida são parecidas, mas não iguais.",d:1,par:10,max:12,m:[".......",".......",".......","...*...",".......",".*.##*.","S.####G"]},
 {t:"Montanha-russa",h:"Sobe, desce, sobe, desce... Encontre o padrão grande e os padrões pequenos dentro dele.",tip:"Subir 2 degraus e descer 2 degraus. Tudo isso acontece 2 vezes.",d:1,par:11,max:13,m:[".........",".........","..*...*..",".........","S.##*.##G"]},
 {t:"Programa misterioso",type:"quiz",h:"A Peça A é 'andar até bater'. Siga o programa com muita atenção: em qual casa numerada o Bip vai parar?",d:1,pre:{m:"2[AL]A",A:"Uf[F]"},m:[".......","...#...","#3.2..4",".......",".......","S..1#..","......."]},
 {t:"Três quarteirões",h:"Dê a volta em cada quarteirão e depois siga para o próximo.",d:1,par:7,max:9,m:[".......",".......",".......",".......",".*.*.*.",".#.#.#.","S.....G"]},
 {t:"A janela",h:"A janela tem 4 vidros iguais. Contorne um vidro, vire e contorne o próximo.",tip:"Um vidro é: Repetir 4 [Frente, Frente, Direita]. Depois vire à Direita e faça o próximo.",d:0,par:6,max:8,m:[".......",".*...*.","..#.#..","...S...","..#.#..",".*...*.","......."]},
 {t:"Três quadrados",need:["fa"],h:"Pinte os três quadrados. Eles são iguais, mas estão em lugares diferentes: é um trabalho para a Peça A.",tip:"Peça A = Repetir 4 [Pintar, Frente, Direita]: pinta um quadrado e volta ao começo dele.",d:1,k:["F","L","R","P","loop","fa"],par:13,max:15,m:["......","so.oo.","oo.oo.","......","...oo.","...oo."]},
 {t:"O explorador",h:"Lembra do truque da parede da direita? Ele também serve aqui: seguindo a parede, o Bip acha a chave e a porta sozinho.",tip:"É o mesmo programa de O labirinto: Se caixa à direita, então (Se caixa na frente: Esquerda; senão: Frente); senão: Direita e Frente.",d:1,k:["F","L","R","until","if"],par:7,max:9,stop:1,
  m:["S...#.G","###.#.#","#a..#A#","###.#.#","###...#","#######","#######"],vs:[["S....a#","##.####","##A####","##.####","##...##","####.##","####G##"]]},
 {t:"A torre de rádio",h:"As duas janelas são iguais. Contorne a primeira, viaje até o centro da segunda e repita. Termine na bandeira.",tip:"Cada vidro é: Repetir 4 [Frente, Frente, Direita]. Uma janela tem 4 vidros. Depois viaje até o centro da outra janela.",d:0,par:13,max:15,m:["*...*....",".#.#.....","..S......",".#.#.....","*...*...*",".....#.#.","......G..",".....#.#.","....*...*"]},
 {t:"A fuga da torre",h:"Desafio final! Três andares ligados por portais, com buracos, caixas, uma chave e uma porta. Observe: algum andar se repete?",tip:"O 1º e o 3º andar são iguais: faça uma Peça A para eles. Em cada um, 'Frente, Pular, Frente' acontece duas vezes.",d:1,k:["F","L","R","J","loop","fa","fb"],par:12,max:15,m:["########G","q.x.*.x.A","#########","#########","p#.a#.*#q","#########","#########","S.x.*.x.p","#########"]}
]}
];
const LEVELS=[];WORLDS.forEach((w,wi)=>{w.from=LEVELS.length;w.lv.forEach((l,j)=>{l.w=wi;l.n=j+1;l.i=LEVELS.length;LEVELS.push(l)});w.to=LEVELS.length});
const kitOf=L=>L.k||WORLDS[L.w].k;
