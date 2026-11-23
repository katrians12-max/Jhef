"""Testa o Bip Defesa (modo clássico): trilha, lugares de construção, menu circular, torres, ondas, vitória e derrota."""
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
async def pad(P,i):
    await P.wait_for_function("cam.position.distanceTo(camGame)<.03",timeout=15000)
    xy=await P.evaluate(f"(()=>{{const v=new THREE.Vector3(PADS[{i}][0],.1,PADS[{i}][1]).project(cam);return [(v.x+1)/2*innerWidth,(1-v.y)/2*innerHeight]}})()")
    await P.mouse.click(xy[0],xy[1]);await P.wait_for_timeout(150)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--ignore-gpu-blocklist','--use-gl=angle','--use-angle=swiftshader'])
        c,P,errs=await ctx(b)
        await P.goto(B+'/defesa.html');await P.wait_for_timeout(1500);await P.screenshot(path=OUT+'d-menu.png')
        await P.click('#bGo');await P.wait_for_timeout(2000)
        check('começa planejando a onda 1, com ÷2 e Obelisco liberados',await P.evaluate("state=='plan'&&liberadas().has('d2')&&liberadas().has('cp')&&!liberadas().has('d3')"))
        check('prévia mostra os números da onda',('16' in await P.inner_text('#prev')))
        check('trilha tem lugares de construção marcados',await P.evaluate("PADS.length>=10&&padMeshes.length==PADS.length"))
        # toca num lugar: abre o menu circular com as torres liberadas
        await pad(P,0)
        check('tocar no lugar abre o menu circular',await P.evaluate("!$('ring').hidden") and await P.locator('#ring [data-b]').count()==2)
        await P.click('#ring [data-b=d2]')
        check('escolher no menu constrói a torre e gasta energia',await P.evaluate("towers.length==1&&towers[0].tipo=='d2'&&en==EN0-TIPOS.d2.custo"))
        await P.evaluate("en+=300;drawHud()")
        for i,t in [(2,'d2'),(5,'cp')]:
            await pad(P,i);await P.click(f'#ring [data-b={t}]')
        check('três torres de modelos diferentes',await P.evaluate("(()=>{const n=t=>{let k=0;t.G.traverse(o=>{if(o.isMesh)k++});return k};return towers.length==3&&n(towers[0])!=n(towers[2])})()"))
        await P.wait_for_timeout(500);await P.screenshot(path=OUT+'d-plan.png')
        # tocar numa torre: melhorar e vender
        await pad(P,0)
        check('tocar na torre mostra Melhorar e Vender, com o alcance',await P.is_visible('#mUp') and await P.is_visible('#mSell') and await P.evaluate("rangeRing.visible"))
        await P.screenshot(path=OUT+'d-menu-torre.png')
        e0=await P.evaluate("en");await P.click('#mUp')
        check('melhorar sobe para o nível 2',await P.evaluate(f"towers[0].nv==2&&en=={e0}-TIPOS.d2.up"))
        await pad(P,5);e0=await P.evaluate("en");await P.click('#mSell')
        check('vender devolve parte da energia',await P.evaluate(f"towers.length==2&&en=={e0}+Math.floor(TIPOS.cp.custo*.6)"))
        await pad(P,5);await P.click('#ring [data-b=cp]')
        await pad(P,8);await P.click('#ring [data-b=cp]')
        # onda 1
        await P.click('#bOnda');await P.evaluate("vel=2")
        await P.wait_for_timeout(7000);await P.screenshot(path=OUT+'d-onda.png')
        await P.wait_for_function("state=='plan'&&wi==1||state=='end'",timeout=90000)
        check('onda 1 vencida: vem a onda 2 com a Tesla (÷3)',await P.evaluate("wi==1&&liberadas().has('d3')"),await P.evaluate("[state,wi,vidas]"))
        check('Bugs destruídos dão energia',await P.evaluate("kills")>=5,await P.evaluate("kills"))
        check('regras das torres',await P.evaluate("pode('d2',36)&&!pode('d2',35)&&pode('d5',35)&&pode('cp',7)&&!pode('cp',9)&&!pode('d3',1)"))
        # Tesla pula em vários Bugs e o Morteiro acerta em área
        r=await P.evaluate("""(()=>{bugs.forEach(b=>dispose(b.G));bugs=[];const mk=(n,s)=>{spawn({tipo:'c',n});const b=bugs[bugs.length-1];b.s=s;const [x,z]=noCaminho(s);b.G.position.set(x,0,z);return b};
          const a=mk(9,20),b2=mk(6,20.3),c3=mk(4,20.6);towers.forEach(t=>dispose(t.G));towers=[];construir(3,'d3',true);const t=towers[0];t.x=a.G.position.x;t.z=a.G.position.z;disparar(t);
          const tes=[a.n,b2.n,c3.n];bugs.forEach(b=>dispose(b.G));bugs=[];const d=mk(25,20),e=mk(10,20.2),f=mk(7,20.4);
          shots=[{o:new THREE.Group(),tipo:'d5',alvo:d,de:d.G.position.clone(),t:0,dur:.01,area:1.3,arco:0}];voos(.05);return [tes,[d.n,e.n,f.n,e.dead]]})()""")
        check('Tesla divide até 3 Bugs de uma vez (e ignora o que não é múltiplo de 3)',r[0]==[3,2,4],r)
        check('estrela do Morteiro divide todos os múltiplos de 5 por perto',r[1][0]==5 and r[1][2]==7,r)
        # Bug sem defesa chega na base
        await P.evaluate("towers.forEach(t=>dispose(t.G));towers=[];bugs.forEach(b=>dispose(b.G));bugs=[];shots=[];fila=[{tipo:'v',n:35,t:0}];tSpawn=0;vel=4;state='wave'")
        v0=await P.evaluate("vidas")
        await P.wait_for_function(f"vidas<{v0}",timeout=40000)
        check('Bug que passa tira vida e a fatoração fica guardada',await P.evaluate("escaparam.some(b=>b.n0==35)&&fatTxt(35)=='35 = 5 × 7'"))
        # derrota e tentar de novo (restaura as torres da onda)
        await P.wait_for_function("state=='plan'",timeout=10000)
        await P.evaluate("snap.towers=[{pad:0,tipo:'d2',nv:2},{pad:4,tipo:'cp',nv:1}]");w0=await P.evaluate("wi")
        await P.evaluate("vidas=1;fila=[{tipo:'c',n:9,t:0}];tSpawn=0;state='wave'");
        try:await P.wait_for_selector('#sEnd:not([hidden])',timeout=60000)
        except Exception as ex:print(await P.evaluate("[state,vidas,wi,bugs.length,fila.length,bugs.map(b=>[b.s,b.n])]"));raise
        await P.screenshot(path=OUT+'d-fim.png')
        check('derrota mostra os Bugs que passaram e como vencê-los',('3 × 3' in await P.inner_text('#eFacts')),await P.inner_text('#eFacts'))
        await P.click('#bAgain');await P.wait_for_timeout(400)
        check('tentar de novo volta à mesma onda com as torres de antes',await P.evaluate(f"state=='plan'&&wi=={w0}&&towers.length==2&&towers.find(t=>t.pad==0).nv==2"))
        # vitória
        await P.evaluate("wi=ONDAS.length-1;prepOnda();vidas=10;state='wave';fila=[];bugs=[]");await P.wait_for_selector('#sEnd:not([hidden])',timeout=5000)
        check('última onda vencida: vitória com estrelas',('Vitória' in await P.inner_text('#eT')) and '★' in await P.inner_text('#eStars'))
        # o Bug Rei da última onda é vencível: 2520 só tem fatores 2,3,5,7
        check('todos os números das ondas são vencíveis com 2, 3, 5, 7 e primos',await P.evaluate("ONDAS.every(o=>o.bugs.every(([t,n])=>{let m=n;for(const d of [2,3,5,7])while(m%d==0&&m>d)m/=d;return m==1||primo(m)}))"))
        check('sem erros (computador)',not errs,errs[:3]);await c.close()
        for nome,w,h in [('d-cel.png',844,390),('d-cel-alto.png',390,844)]:
            c,P,errs=await ctx(b,w,h,True)
            await P.goto(B+'/defesa.html');await P.wait_for_timeout(1200);await P.screenshot(path=OUT+'m-'+nome);await P.click('#bGo');await P.wait_for_timeout(1500)
            await pad(P,2);await P.wait_for_timeout(300);await P.screenshot(path=OUT+nome)
            check(f'celular {w}×{h}: menu abre ao tocar e não há rolagem lateral',await P.evaluate("!$('ring').hidden") and await P.evaluate("document.documentElement.scrollWidth")<=w)
            check(f'sem erros (celular {w}×{h})',not errs,errs[:3]);await c.close()
        await b.close()
    print(f'\n{len(ok)} ok, {len(bad)} com problema',bad)
asyncio.run(main())
