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
        await P.click('#bAgain');await P.wait_for_timeout(3600);await P.keyboard.press('p');await P.wait_for_timeout(200)
        z1=await P.evaluate('gates[0]&&gates[0].G.position.z');await P.wait_for_timeout(600);z2=await P.evaluate('gates[0]&&gates[0].G.position.z')
        check('pausa congela a corrida',await P.is_visible('#sPause') and z1==z2,(z1,z2))
        await P.keyboard.press('p');check('P de novo continua',await P.is_hidden('#sPause'))
        # contas: 300 geradas, todas com 3 opções diferentes, positivas e uma certa
        r=await P.evaluate("(()=>{let bad=0;for(let lv=0;lv<7;lv++)for(let i=0;i<300;i++){const q=pergunta(lv);const ok=new Set(q.opts).size==3&&q.opts.every(x=>Number.isInteger(x)&&x>0)&&q.opts[q.ok]==q.c&&q.opts.filter(x=>x==q.c).length==1;const [a,op,b]=q.txt.split(' ');if(!ok||(op=='×'?a*b:a/b)!=q.c)bad++}return bad})()")
        check('2.100 contas geradas: todas corretas e com 3 opções válidas',r==0,r)
        check('sem erros de script (computador)',not e,e[:2])
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
