"""Testa o protótipo Bip Defesa: colocar torres, dividir, Caça-Primos, base, ondas, vitória e derrota."""
import asyncio,sys
from playwright.async_api import async_playwright
B='http://localhost:8767';OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp/'
THREE=open('/tmp/claude-0/-home-claude/45cd848e-0f4f-57b8-918c-4bd4556fe55d/scratchpad/lib/three.min.js').read()
ok=[];bad=[]
def check(n,c,i=''):(ok if c else bad).append(n);print(('  ✓ ' if c else '  ✗ ')+n+(' — '+str(i) if i and not c else ''))
async def ctx(b,w=1366,h=800,mobile=False):
    c=await b.new_context(viewport={'width':w,'height':h},is_mobile=mobile,has_touch=mobile)
    async def rt(r):
        u=r.request.url
        if 'three.min.js' in u:await r.fulfill(body=THREE,content_type='application/javascript')
        elif u.startswith(B):await r.continue_()
        else:await r.abort()
    await c.route('**/*',rt);pg=await c.new_page();pg.set_default_timeout(10000);errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));return c,pg,errs
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--ignore-gpu-blocklist','--use-gl=angle','--use-angle=swiftshader'])
        c,P,errs=await ctx(b)
        await P.goto(B+'/defesa.html');await P.wait_for_timeout(1500);await P.screenshot(path=OUT+'d-menu.png')
        await P.click('#bGo');await P.wait_for_timeout(2200)
        check('começa planejando a onda 1, com ÷2 e Caça-Primos liberados',await P.evaluate("state=='plan'&&liberadas().has('d2')&&liberadas().has('cp')&&!liberadas().has('d3')"))
        check('prévia mostra os números da onda',('4' in await P.inner_text('#prev')) and await P.evaluate("prevSprites.length")>0)
        # coloca torres clicando no tabuleiro: ÷2 na coluna 4 e Caça-Primos na coluna 1 das pistas usadas
        lanes=await P.evaluate("[...new Set(fila.map(q=>q.lane))]")
        async def clicar(c,l):
            xy=await P.evaluate(f"(()=>{{const v=new THREE.Vector3(cx({c}),0,lz({l})).project(cam);return [(v.x+1)/2*innerWidth,(1-v.y)/2*innerHeight]}})()")
            await P.mouse.click(xy[0],xy[1])
        await P.evaluate("selTipo('d2')")
        for l in lanes[:2]:await clicar(5,l)
        await P.evaluate("selTipo('cp')");await clicar(2,lanes[0])
        n=await P.evaluate("towers.length");e=await P.evaluate("en")
        check('clicar no tabuleiro coloca torres e gasta energia',n==3 and e==120-20*2-40,(n,e))
        await P.evaluate("en+=200;drawHud()")
        for l in lanes[2:]:
            await P.evaluate("selTipo('d2')");await clicar(5,l);await P.evaluate("selTipo('cp')");await clicar(2,l)
        await P.evaluate("selTipo('cp')");await clicar(2,lanes[1])
        await P.screenshot(path=OUT+'d-plan.png')
        # torre em casa ocupada: abre "vender"
        await P.evaluate("selTipo(null)");await clicar(5,lanes[0]);await P.wait_for_timeout(200)
        check('tocar numa torre mostra o botão de vender',await P.is_visible('#pV'))
        await P.click('#pX')
        await P.click('#bOnda');await P.evaluate("vel=2")
        await P.wait_for_timeout(9000);await P.screenshot(path=OUT+'d-onda.png')
        await P.wait_for_function("state=='plan'&&wi==1||state=='end'",timeout=60000)
        check('onda 1 vencida: vem a onda 2 com ÷3',await P.evaluate("wi==1&&liberadas().has('d3')"),await P.evaluate("[state,wi,vidas]"))
        check('Bugs destruídos dão energia',await P.evaluate("kills")>=5)
        # lógica pura: ÷ só divide se der exato; Caça-Primos só em primo
        check('regras das torres',await P.evaluate("pode('d2',36)&&!pode('d2',35)&&pode('d5',35)&&pode('cp',7)&&!pode('cp',9)&&!pode('d3',1)"))
        # um Bug sem defesa chega na base e explica a fatoração
        await P.evaluate("towers.forEach(t=>dispose(t.G));towers=[];fila=[{n:35,lane:0,t:0}];tSpawn=0;state='wave'")
        await P.wait_for_function("vidas<5",timeout=40000)
        check('Bug que passa tira vida e a fatoração fica guardada para revisar',await P.evaluate("escaparam.some(b=>b.n0==35)&&fatTxt(35)=='35 = 5 × 7'"))
        # derrota e "tentar de novo"
        w0=await P.evaluate("wi");await P.evaluate("vidas=1;fila=[{n:9,lane:1,t:0}];tSpawn=0;state='wave'");await P.wait_for_selector('#sEnd:not([hidden])',timeout=40000)
        await P.screenshot(path=OUT+'d-fim.png')
        check('derrota mostra os Bugs que passaram e como vencê-los',('3 × 3' in await P.inner_text('#eFacts')),await P.inner_text('#eFacts'))
        await P.click('#bAgain');await P.wait_for_timeout(400)
        check('tentar de novo volta ao planejamento da mesma onda',await P.evaluate("state")=='plan' and await P.evaluate("wi")==w0)
        # vitória no fim
        await P.evaluate("wi=ONDAS.length-1;prepOnda();state='wave';fila=[];bugs=[]");await P.wait_for_selector('#sEnd:not([hidden])',timeout=5000)
        check('última onda vencida: tela de vitória com estrelas',('Vitória' in await P.inner_text('#eT')) and '★' in await P.inner_text('#eStars'))
        check('sem erros (computador)',not errs,errs[:3]);await c.close()
        c,P,errs=await ctx(b,844,390,True)
        await P.goto(B+'/defesa.html');await P.wait_for_timeout(1200);await P.click('#bGo');await P.wait_for_timeout(1200);await P.screenshot(path=OUT+'d-cel.png')
        check('celular deitado sem rolagem lateral',await P.evaluate("document.documentElement.scrollWidth")<=844)
        check('sem erros (celular)',not errs,errs[:3]);await c.close();await b.close()
    print(f'\n{len(ok)} ok, {len(bad)} com problema',bad)
asyncio.run(main())
