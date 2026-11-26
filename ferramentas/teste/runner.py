# Bip Runner (protótipo): menu, contagem, acertos, erro com revisão, nível, fim de jogo, recorde, celular.
import asyncio,sys,os
from playwright.async_api import async_playwright
B='http://localhost:8767';OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp/'
THREE=open(os.path.join(os.path.dirname(OUT.rstrip('/')),'lib','three.min.js')).read() if os.path.exists(os.path.join(os.path.dirname(OUT.rstrip('/')),'lib','three.min.js')) else open(OUT+'lib/three.min.js').read()
ok=[];bad=[]
def check(n,c,info=''):(ok if c else bad).append(n);print(('  ✓ ' if c else '  ✗ ')+n+('' if c else f' — {info}'))
async def ctx(b,w=1366,h=768,mob=False):
    c=await b.new_context(viewport={'width':w,'height':h},is_mobile=mob,has_touch=mob,device_scale_factor=1 if not mob else 2)
    async def rt(r):
        u=r.request.url
        if 'three.min.js' in u:await r.fulfill(body=THREE,content_type='application/javascript')
        elif u.startswith(B):await r.continue_()
        else:await r.abort()
    await c.route('**/*',rt);p=await c.new_page();e=[];p.on('pageerror',lambda x:e.append(str(x)));return c,p,e
# o "robô jogador": vai para a faixa certa quando o portal está perto (ou erra de propósito)
BOT="""(errar)=>new Promise(res=>{const iv=setInterval(()=>{if(state!='run'){if(state=='end'||state=='over'){clearInterval(iv);res(true)}return}
 const g=gates.find(x=>!x.done);if(!g)return;let alvo=g.q.ok;if(errar(S))alvo=(alvo+1)%3;
 if(Bip.lane<alvo)move(1);else if(Bip.lane>alvo)move(-1)},60)})"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--ignore-gpu-blocklist','--use-gl=angle','--use-angle=swiftshader'])
        c,P,e=await ctx(b)
        await P.goto(B+'/');await P.click('#bNew');await P.fill('#inName','Jhef');await P.click('#fNew button[type=submit]');await P.wait_for_timeout(600)
        await P.goto(B+'/runner.html');await P.wait_for_timeout(1500)
        check('menu com trilha tabuada e as outras "em breve"',await P.is_visible('#sStart') and 'em breve' in await P.inner_text('#trilhas'))
        await P.screenshot(path=OUT+'r-menu.png')
        await P.click('#bGo');await P.wait_for_timeout(1200);check('contagem 3-2-1',await P.inner_text('#cd')!='' )
        await P.wait_for_timeout(2600);check('primeira conta aparece',' = ?' in await P.inner_text('#qt'),await P.inner_text('#qt'))
        q=await P.evaluate('S.q');check('3 respostas diferentes, uma certa',len(set(q['opts']))==3 and q['opts'][q['ok']]==q['c'],q)
        await P.screenshot(path=OUT+'r-jogo.png')
        # acerta 7 seguidas (passa de nível), depois erra até acabar
        await P.evaluate("window._bot="+BOT+";window._bot(S=>S.ok>=7)")
        await P.wait_for_function('S.ok>=5',timeout=60000);await P.wait_for_timeout(500)
        check('acertos somam pontos e sobem o nível',await P.evaluate('S.score>0&&S.lv>=1'),await P.evaluate('[S.score,S.lv]'))
        await P.screenshot(path=OUT+'r-nivel.png')
        await P.wait_for_function('S.bad>=1',timeout=60000);await P.wait_for_timeout(300)
        await P.screenshot(path=OUT+'r-erro.png')
        check('erro tira vida e mostra a conta certa',await P.evaluate('S.lives')<3 and '=' in await P.inner_text('#toast'),await P.inner_text('#toast'))
        await P.wait_for_selector('#sEnd:not([hidden])',timeout=60000)
        check('fim de jogo com pontos e revisão',await P.is_visible('#eFacts span') and await P.inner_text('#eT')!='0')
        check('primeiro recorde salvo',await P.is_visible('#eNew') and await P.evaluate("JSON.parse(localStorage.getItem('bipsite-runner:'+localStorage.getItem('bipsite-cur'))).best.tabuada>0"))
        await P.screenshot(path=OUT+'r-fim.png')
        # pausa
        await P.click('#bAgain');await P.wait_for_timeout(3600);await P.evaluate("S.score=150;$('sc').textContent='150'");await P.keyboard.press('p');await P.wait_for_timeout(200)
        check('pausar zera os pontos da corrida',await P.evaluate("S.score")==0 and await P.inner_text('#sc')=='0' and '150 pontos' in await P.inner_text('#pTx'),await P.inner_text('#pTx'))
        z1=await P.evaluate('gates[0]&&gates[0].G.position.z');await P.wait_for_timeout(600);z2=await P.evaluate('gates[0]&&gates[0].G.position.z')
        check('pausa congela a corrida',await P.is_visible('#sPause') and z1==z2,(z1,z2))
        check('na pausa a conta e os portais somem',await P.evaluate("getComputedStyle($('q')).visibility=='hidden'&&gates.filter(g=>!g.done).every(g=>!g.G.visible)"))
        q1=await P.evaluate("S.q.txt+'|'+S.q.opts.join(',')")
        await P.keyboard.press('p');check('P de novo continua',await P.is_hidden('#sPause'))
        check('na volta tem contagem 3, 2, 1',await P.evaluate("state")=='count')
        await P.wait_for_timeout(2600)
        q2=await P.evaluate("S.q.txt+'|'+S.q.opts.slice().sort((a,b)=>a-b).join(',')")
        q1o=q1.split('|')[0]+'|'+','.join(str(x) for x in sorted(int(v) for v in q1.split('|')[1].split(',')))
        check('na volta vem a MESMA conta (não dá para pular conta difícil)',await P.evaluate("state")=='run' and await P.evaluate("gates.filter(g=>!g.done).length")==1 and await P.evaluate("getComputedStyle($('q')).visibility")=='visible' and q2==q1o,(q1,q2))
        check('a conta que volta é a certa e não ganha tempo extra',await P.evaluate("(()=>{const g=gates.find(x=>!x.done);return g.q.opts[g.q.ok]==g.q.c&&g.G.position.z>=S.qz-.01})()"))
        # pausar várias vezes seguidas não troca a conta
        for i in range(3):
            await P.keyboard.press('p');await P.wait_for_timeout(150);await P.keyboard.press('p');await P.wait_for_timeout(2600)
        q3=await P.evaluate("S.q.txt");check('pausar 3 vezes seguidas: ainda a mesma conta',q3==q1.split('|')[0],(q1,q3))
        # contas: 300 geradas, todas com 3 opções diferentes, positivas e uma certa
        r=await P.evaluate("(()=>{let bad=0;for(let lv=0;lv<7;lv++)for(let i=0;i<300;i++){const q=pergunta(lv);const ok=new Set(q.opts).size==3&&q.opts.every(x=>Number.isInteger(x)&&x>0)&&q.opts[q.ok]==q.c&&q.opts.filter(x=>x==q.c).length==1;const [a,op,b]=q.txt.split(' ');if(!ok||(op=='×'?a*b:a/b)!=q.c)bad++}return bad})()")
        check('2.100 contas geradas: todas corretas e com 3 opções válidas',r==0,r)
        # ---- trilha nova: adição e subtração ----
        r=await P.evaluate("""(()=>{const t0=trilha;trilha='somasub';let bad=[],sub=0,neg=0,erroVaiUm=0,n=0,dig=[];
          for(let lv=0;lv<8;lv++){let mx=0;for(let i=0;i<300;i++){const q=pergunta(lv);n++;const [a,op,b]=q.txt.split(' ');
            const conta=op=='+'?+a + +b:op=='−'?a-b:NaN;if(op=='−')sub++;if(q.c<0)neg++;mx=Math.max(mx,+a,+b);
            const ok=new Set(q.opts).size==3&&q.opts.every(x=>Number.isInteger(x)&&x>0)&&q.opts[q.ok]==q.c&&conta==q.c;if(!ok)bad.push(q);
            if(op=='+'){const e=porCasa(+a,+b,(x,y)=>(x+y)%10);if(e!=q.c&&q.opts.includes(e))erroVaiUm++}}dig.push(mx)}
          trilha=t0;return {bad:bad.length,ex:bad.slice(0,2),sub,n,neg,erroVaiUm,dig}})()""")
        check('2.400 contas de + e −: todas certas, 3 opções positivas e diferentes',r['bad']==0,r)
        check('metade é subtração, e nenhuma dá negativo',0.4<r['sub']/r['n']<0.6 and r['neg']==0,r)
        check('portais errados trazem o erro de esquecer o "vai um"',r['erroVaiUm']>100,r['erroVaiUm'])
        check('dificuldade sobe: nível 1 até 20, níveis altos com centenas',r['dig'][0]<=19 and r['dig'][1]<100 and r['dig'][5]>=100,r['dig'])
        await P.goto(B+'/runner.html');await P.wait_for_timeout(1000)
        check('menu mostra a trilha Adição e subtração liberada',await P.is_enabled('[data-tr="somasub"]'))
        await P.click('[data-tr="somasub"]');await P.click('#bGo');await P.wait_for_timeout(4000)
        qt=await P.inner_text('#qt');ql=await P.inner_text('#qlab')
        check('corrida de + e −: conta com + ou − e rótulo da trilha',('+' in qt or '−' in qt) and 'ADIÇÃO E SUBTRAÇÃO' in ql.upper(),(qt,ql))
        te=await P.evaluate("(()=>{const a=tempoExtra(4);trilha='tabuada';const b=tempoExtra(4);trilha='somasub';return [a,b]})()")
        check('conta de + e − com mais algarismos ganha mais tempo',te[0]>1 and te[1]==1,te)
        await P.evaluate("trilha='somasub'");await P.evaluate("S.score=777;state='over';end()");await P.wait_for_timeout(1200)
        bs=await P.evaluate("JSON.parse(localStorage.getItem(BIPV.runKey(PID))).best")
        check('recorde separado por trilha (somasub = 777, tabuada intacto)',bs.get('somasub')==777 and bs.get('tabuada',0)!=777,bs)
        await P.evaluate("(()=>{const k=BIPV.runKey(PID),r=JSON.parse(localStorage.getItem(k));r.coins={};localStorage.setItem(k,JSON.stringify(r))})()")
        await P.goto(B+'/runner.html');await P.wait_for_timeout(800)
        check('o jogo lembra a última trilha escolhida',await P.get_attribute('[data-tr="somasub"]','aria-pressed')=='true')
        await P.click('[data-tr="tabuada"]')
        check('sem erros de script (computador)',not e,e[:2])
        # ---- pelo menu (oficial): abre em tela cheia, ganha Bipcoins, volta ao saguão ----
        await P.goto(B+'/');await P.wait_for_timeout(1500)
        antes=int((await P.inner_text('#coinN')).replace('.',''))
        check('cartão do Bip Runner no saguão','Bip Runner' in await P.inner_text('.side') and await P.is_visible('#uGo'))
        await P.screenshot(path=OUT+'r-saguao.png')
        await P.click('#uGo');await P.wait_for_timeout(1800);f=P.frames[1]
        check('abre o jogo por cima do menu com o mesmo perfil',f.url.endswith('runner.html#p-'+await P.evaluate("localStorage.getItem('bipsite-cur')")),f.url)
        await f.click('#bGo');await f.wait_for_timeout(3600)
        await f.evaluate("window._bot="+BOT+";window._bot(S=>S.ok>=6)")
        await f.wait_for_selector('#sEnd:not([hidden])',timeout=90000)
        cl=await f.inner_text('#eCoin');ganho=await f.evaluate("REC.coins[dia()]||0")
        check('fim da corrida mostra os Bipcoins ganhos','Bipcoins' in cl and ganho>0,cl)
        await f.click('#bBack2');await P.wait_for_timeout(900)
        depois=int((await P.inner_text('#coinN')).replace('.',''))
        check('voltar fecha o jogo e o saldo sobe',await P.is_hidden('#play') and depois>antes,(antes,depois,ganho))
        check('botão principal vira "Correr"','CORRER' in await P.inner_text('#bPlay'),await P.inner_text('#bPlay'))
        check('cartão mostra Bipcoins de hoje',f'hoje {min(60,ganho)}/60' in await P.inner_text('#uLv'),await P.inner_text('#uLv'))
        # limite de 60 por dia
        lim=await P.evaluate("(()=>{const k=BIPV.runKey(localStorage.getItem('bipsite-cur'));const r=JSON.parse(localStorage.getItem(k));r.coins['2020-01-01']=500;return BIPV.ganhosRunner(r)-BIPV.ganhosRunner(JSON.parse(localStorage.getItem(k)))})()")
        check('cada dia vale no máximo 60 Bipcoins',lim==60,lim)
        await c.close()
        c,M,e2=await ctx(b,390,844,True)
        await M.goto(B+'/runner.html');await M.wait_for_timeout(1200);await M.screenshot(path=OUT+'r-cel-menu.png')
        await M.click('#bGo');await M.wait_for_timeout(4200)
        check('celular mostra botões ◀ ▶',await M.is_visible('#tL') and await M.is_visible('#tR'))
        l0=await M.evaluate('Bip.lane');await M.click('#tR');l1=await M.evaluate('Bip.lane');check('botão ▶ troca de faixa',l1==min(2,l0+1),(l0,l1))
        await M.screenshot(path=OUT+'r-cel-jogo.png')
        check('celular sem rolagem lateral',await M.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        check('sem erros de script (celular)',not e2,e2[:2])
        await b.close()
    print(f'\n{len(ok)} ok, {len(bad)} com problema',bad)
asyncio.run(main())
