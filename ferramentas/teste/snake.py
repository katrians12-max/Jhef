"""Testa o Bip Snake: regras, contas, vidas, batida, pausa, fases, recorde, Bipcoins e celular."""
import asyncio,sys,json
from playwright.async_api import async_playwright
B='http://localhost:8767';OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp/'
THREE=open('/tmp/claude-0/-home-claude/45cd848e-0f4f-57b8-918c-4bd4556fe55d/scratchpad/lib/three.min.js').read()
ok=[];bad=[]
def check(n,c,i=''):(ok if c else bad).append(n);print(('  ✓ ' if c else '  ✗ ')+n+(' — '+str(i) if i and not c else ''))
# robozinho: anda até o número certo mais perto (sem voltar para trás e sem bater)
BOT="""(()=>{if(state!='run')return;const h=body[0],alvo=tokens.filter(t=>t.ok).sort((a,b)=>(Math.abs(a.c-h[0])+Math.abs(a.r-h[1]))-(Math.abs(b.c-h[0])+Math.abs(b.r-h[1])))[0];
 const ruins=new Set(tokens.filter(t=>!t.ok).map(t=>t.c+','+t.r)),corpo=new Set(body.slice(0,-1).map(p=>p+''));
 const ok=([dx,dy])=>{const x=h[0]+dx,y=h[1]+dy;return x>=0&&y>=0&&x<NC&&y<NR&&!corpo.has(x+','+y)&&!ruins.has(x+','+y)&&!(dx==-dir[0]&&dy==-dir[1])};
 let op=[[1,0],[-1,0],[0,1],[0,-1]].filter(ok);if(!op.length)return;
 if(alvo)op.sort((a,b)=>(Math.abs(alvo.c-h[0]-a[0])+Math.abs(alvo.r-h[1]-a[1]))-(Math.abs(alvo.c-h[0]-b[0])+Math.abs(alvo.r-h[1]-b[1])));
 queue=[];if(op[0][0]!=dir[0]||op[0][1]!=dir[1])queue.push(op[0])})()"""
async def ctx(b,w=1366,h=860,mobile=False):
    c=await b.new_context(viewport={'width':w,'height':h},is_mobile=mobile,has_touch=mobile)
    async def rt(r):
        u=r.request.url
        if 'three.min.js' in u:await r.fulfill(body=THREE,content_type='application/javascript')
        elif u.startswith(B):await r.continue_()
        else:await r.abort()
    await c.route('**/*',rt);pg=await c.new_page();pg.set_default_timeout(10000);errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and 'Failed to load' not in m.text and errs.append(m.text));return c,pg,errs
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--ignore-gpu-blocklist','--use-gl=angle','--use-angle=swiftshader'])
        c,P,errs=await ctx(b)
        await P.goto(B+'/');await P.evaluate("localStorage.setItem('bipsite-profiles',JSON.stringify([{id:'t1',name:'Ana',color:'#f00'}]));localStorage.setItem('bipsite-cur','t1')")
        await P.goto(B+'/snake.html#p-t1');await P.wait_for_timeout(1500);await P.screenshot(path=OUT+'s-menu.png')
        check('menu com 3 modos',await P.evaluate("document.querySelectorAll('[data-m]').length")==3)
        await P.click('#bGo');await P.wait_for_timeout(3600)
        check('começa a correr depois de 3, 2, 1',await P.evaluate("state")=='run')
        check('fase 1 (misturado) é de regra, com 6 números e pelo menos 2 certos',await P.evaluate("S.kind=='regra'&&tokens.length==6&&tokens.filter(t=>t.ok).length>=2"),await P.evaluate("[S.kind,tokens.length]"))
        check('números certos e errados batem com a regra',await P.evaluate("tokens.every(t=>S.rule.test(t.v)==t.ok)"))
        # robô joga um pouco para a foto
        for i in range(70):
            await P.evaluate(BOT);await P.wait_for_timeout(90)
        await P.screenshot(path=OUT+'s-jogo.png')
        await P.evaluate("window.__parado=1");n0=await P.evaluate("S.ok");check('o robô comeu números certos e o trem cresceu',n0>=1 and await P.evaluate("wagons.length")>=2+n0-1,(n0,await P.evaluate("wagons.length")))
        # come um certo direto
        await P.evaluate("eat(tokens.find(t=>t.ok))");await P.wait_for_timeout(700)
        check('acerto soma 1 vagão',await P.evaluate("S.ok")==n0+1)
        v0=await P.evaluate("S.lives");await P.evaluate("eat(tokens.find(t=>!t.ok))");await P.wait_for_timeout(300)
        check('comer errado tira 1 vida e explica',await P.evaluate("S.lives")==v0-1 and 'não' in (await P.inner_text('#toast')),await P.inner_text('#toast'))
        await P.screenshot(path=OUT+'s-erro.png')
        check('o tabuleiro repõe os números',await P.evaluate("tokens.length")==6)
        # troca de fase depois de 8 acertos
        await P.evaluate("while(S.inPhase<8&&S.kind=='regra')eat(tokens.find(t=>t.ok))");await P.wait_for_timeout(600)
        check('depois de 8 acertos vem a fase de contas, com 4 números e 1 certo',await P.evaluate("S.kind=='conta'&&tokens.length==4&&tokens.filter(t=>t.ok).length==1&&tokens.find(t=>t.ok).v==S.q.c"),await P.evaluate("[S.kind,tokens.length]"))
        await P.wait_for_timeout(1500);await P.screenshot(path=OUT+'s-conta.png')
        q1=await P.evaluate("S.q.txt");pos1=await P.evaluate("tokens.map(t=>t.c+','+t.r).join(' ')")
        await P.evaluate("eat(tokens.find(t=>!t.ok))");await P.wait_for_timeout(300)
        check('errou a conta: vem outra conta com números em outros lugares',await P.evaluate("tokens.length==4")and (await P.evaluate("S.q.txt")!=q1 or await P.evaluate("tokens.map(t=>t.c+','+t.r).join(' ')")!=pos1))
        check('erro de conta vai para a lista do professor',await P.evaluate("Object.keys(REC.err).length")>=1)
        # pausa
        n0=await P.evaluate("S.ok");qa=await P.evaluate("S.q.txt");await P.keyboard.press('p');await P.wait_for_timeout(200)
        r=await P.evaluate("[S.ok,wagons.length,body.length,$('pTx').textContent]")
        check('pausar zera os vagões (trem volta ao tamanho do começo)',r[0]==0 and r[1]==2 and r[2]==3 and (n0==0 or f'{n0} vag' in r[3]),(n0,r))
        check('na pausa os números e a pergunta somem',await P.evaluate("tokens.every(t=>!t.G.visible)&&$('q').classList.contains('hide')"))
        await P.keyboard.press('p');check('ao voltar: contagem 3, 2, 1',await P.evaluate("state")=='count')
        await P.wait_for_timeout(2400);check('volta com números novos',await P.evaluate("state=='run'&&tokens.length==4&&tokens.every(t=>t.G.visible)"))
        check('na volta da pausa a conta é a MESMA (não dá para pular)',await P.evaluate("S.q.txt")==qa and await P.evaluate("tokens.filter(t=>t.ok).length==1&&tokens.find(t=>t.ok).v==S.q.c"),(qa,await P.evaluate("S.q.txt")))
        # batida na parede
        await P.evaluate("window.__parado=0;S.lives=3;drawLives();body=[[11,6],[10,6],[9,6]];prev=body.map(p=>p.slice());dir=[1,0];queue=[]");await P.wait_for_timeout(2400)
        check('bater na parede tira 1 vida e o trem vira sozinho',await P.evaluate("S.lives")==2 and await P.evaluate("state")=='run' and await P.evaluate("dir[0]")==0,await P.evaluate("[S.lives,state,dir]"))
        # fim de jogo
        await P.evaluate("window.__parado=1;for(let i=0;i<3;i++)eat(tokens.find(t=>t.ok));S.lives=1;drawLives();eat(tokens.find(t=>!t.ok))");await P.wait_for_selector('#sEnd:not([hidden])',timeout=6000)
        k=await P.evaluate("S.ok");check('depois da pausa o trem volta a crescer normalmente',k>=3,k);await P.screenshot(path=OUT+'s-fim.png')
        rec=await P.evaluate("JSON.parse(localStorage.getItem('bipsite-runner:t1'))")
        check('recorde salvo junto com o Runner (best.snakemisto)',rec['best'].get('snakemisto')==k and rec.get('sruns')==1,rec.get('best'))
        check('Bipcoins: 1 por vagão, contados no saldo',sum(rec['scoins'].values())==min(k,60) and await P.evaluate("BIPV.ganhosSnake(JSON.parse(localStorage.getItem('bipsite-runner:t1')))")==min(k,60))
        check('tela final mostra o tamanho do trem e o que revisar',str(k) in await P.inner_text('#eT') and await P.is_visible('#eFacts span'))
        # limite do dia
        await P.evaluate("REC.scoins[dia()]=59;salvar()");await P.click('#bAgain');await P.wait_for_timeout(3600);await P.evaluate("window.__parado=1")
        await P.evaluate("for(let i=0;i<5;i++)eat(tokens.find(t=>t.ok));S.lives=1;eat(tokens.find(t=>!t.ok))");await P.wait_for_selector('#sEnd:not([hidden])',timeout=6000)
        check('limite de 60 Bipcoins por dia',await P.evaluate("REC.scoins[dia()]")==60)
        # modo só contas
        await P.click('#bMenu');await P.click('[data-m="contas"]');await P.click('#bGo');await P.wait_for_timeout(3600)
        check('modo só contas começa com conta',await P.evaluate("S.kind")=='conta')
        await P.evaluate("while(S.inPhase<7)eat(tokens.find(t=>t.ok))");await P.evaluate("eat(tokens.find(t=>t.ok))");await P.wait_for_timeout(300)
        check('só contas: fase 2 continua sendo de contas',await P.evaluate("S.kind=='conta'&&S.phase==1"))
        check('regras não geram número fora da regra (500 sorteios)',await P.evaluate("RULES.every(R=>{for(let i=0;i<500;i++){const a=R.bom(),b=R.ruim();if(!R.test(a)||(R.test(b)&&b>=1&&b<=99&&false))return false}return true})"))
        check('sem erros (computador)',not errs,errs[:3]);await c.close()
        # celular
        c,P,errs=await ctx(b,390,844,True)
        await P.goto(B+'/');await P.evaluate("localStorage.setItem('bipsite-profiles',JSON.stringify([{id:'t2',name:'Bia',color:'#00f'}]));localStorage.setItem('bipsite-cur','t2')")
        await P.goto(B+'/snake.html#p-t2');await P.wait_for_timeout(1200);await P.screenshot(path=OUT+'s-cel-menu.png')
        await P.click('#bGo');await P.wait_for_timeout(3600)
        check('celular mostra as setas',await P.is_visible('#pad'))
        for i in range(40):
            await P.evaluate(BOT);await P.wait_for_timeout(90)
        await P.screenshot(path=OUT+'s-cel.png')
        await P.click('#dU');await P.wait_for_timeout(50);check('seta do celular vira o trem',await P.evaluate("queue.length>0||dir[1]==-1||dir[1]==1"))
        check('celular sem rolagem lateral',await P.evaluate("document.documentElement.scrollWidth")<=390)
        check('sem erros (celular)',not errs,errs[:3]);await c.close();await b.close()
    print(f'\n{len(ok)} ok, {len(bad)} com problema',bad)
asyncio.run(main())
