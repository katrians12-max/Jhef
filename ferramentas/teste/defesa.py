"""Testa o Bip Defesa infinito: torres, nível 3, ondas sorteadas, escudo e Poder do Bip, Bugs com poderes, recorde e Bipcoins."""
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
async def tocaBug(P,expr):
    await P.wait_for_function("cam.position.distanceTo(camGame)<.03",timeout=15000)
    xy=await P.evaluate(f"(()=>{{const b={expr};return screenOf(b.G.position.clone().setY(.6))}})()")
    await P.mouse.click(xy[0],xy[1]);await P.wait_for_timeout(150)
# coloca um Bug parado num ponto da trilha (para testar sem depender do tempo)
MK="""((tipo,n,esc,s)=>{spawn({tipo,n,esc,w:-1,vm:1});const b=bugs[bugs.length-1];b.s=s;const [x,z]=noCaminho(s);b.G.position.set(x,0,z);return b})"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--ignore-gpu-blocklist','--use-gl=angle','--use-angle=swiftshader'])
        c,P,errs=await ctx(b)
        await P.goto(B+'/');await P.evaluate("localStorage.setItem('bipsite-profiles',JSON.stringify([{id:'t1',name:'Ana',color:'#f00'}]));localStorage.setItem('bipsite-cur','t1');localStorage.setItem('bipsite-runner:t1',JSON.stringify({v:1,best:{tabuada:500,snakemisto:12},runs:3,coins:{'2026-01-01':40},scoins:{'2026-01-01':12},sruns:2}))")
        await P.goto(B+'/defesa.html#p-t1');await P.wait_for_timeout(1500);await P.screenshot(path=OUT+'d-menu.png')
        check('tela inicial: sem recorde ainda e Bipcoins de hoje',await P.inner_text('#rBest')=='—' and await P.inner_text('#rCoins')=='0/60')
        check('não existe escolha de modo: o jogo é só infinito',await P.locator('[data-m]').count()==0)
        await P.click('#bGo');await P.wait_for_timeout(1500)
        check('começa planejando a onda 1, com ÷2 e Obelisco',await P.evaluate("state=='plan'&&wi==0&&liberadas().has('d2')&&liberadas().has('cp')&&!liberadas().has('d3')"))
        check('prévia mostra os Bugs da onda',await P.locator('#prev .ch').count()>=6)
        # ondas sorteadas: regras que garantem que todas são vencíveis e ficam mais difíceis
        r=await P.evaluate("""(()=>{const W=[];for(let n=0;n<40;n++)W.push(gerarOnda(n));
          const ok=W.every((L,n)=>L.every(q=>{if(q.n>9999||q.n<2)return false;if(q.tipo=='g')return primo(q.n);let m=q.n;for(const p of [2,3,5,7,11,13])while(m%p==0)m/=p;return m==1}));
          return {ok,cresce:W[30].length>W[3].length,esc2:W[2].filter(q=>q.esc).length,esc0:W[0].concat(W[1]).filter(q=>q.esc).length,rei:W[4].some(q=>q.tipo=='r'&&q.esc>=1)&&W[9].some(q=>q.tipo=='r'),
           onze:W.slice(10,30).some(L=>L.some(q=>q.n%11==0)),treze:W.slice(14,40).some(L=>L.some(q=>q.n%13==0)),sem7cedo:W.slice(0,4).every(L=>L.every(q=>q.n%7!=0||q.n==7||[14,21,35].includes(q.n)||true)),
           vel:W[25][0].vm>W[3][0].vm}})()""")
        check('ondas sorteadas: só fatores 2, 3, 5, 7, 11, 13 (ou gigantes primos)',r['ok'],r)
        check('ondas crescem, ficam mais rápidas e têm chefe com escudo a cada 5',r['cresce'] and r['vel'] and r['rei'],r)
        check('escudo aparece na onda 3 (2 Bugs) e nunca nas duas primeiras',r['esc2']==2 and r['esc0']==0,r)
        check('fatores 11 e 13 aparecem nas ondas avançadas',r['onze'] and r['treze'],r)
        # construir, melhorar, especializar e vender pelo menu circular
        await pad(P,0)
        check('tocar no lugar abre o menu com as torres liberadas',await P.evaluate("!$('ring').hidden") and await P.locator('#ring [data-b]').count()==2)
        await P.click('#ring [data-b=d2]')
        check('construir gasta energia',await P.evaluate("towers.length==1&&en==EN0-TIPOS.d2.custo"))
        await P.evaluate("en+=600;drawHud()")
        await pad(P,0);await P.click('#ring [data-up]')
        check('melhorar: nível 2',await P.evaluate("towers[0].nv==2"))
        await pad(P,0)
        check('no nível 2 aparecem as duas especializações',await P.locator('#ring [data-ramo]').count()==2)
        await P.screenshot(path=OUT+'d-ramos.png')
        e0=await P.evaluate("en");await P.click('#ring [data-ramo="1"]')
        check('especialização Quádruplo: nível 3, divide por 4',await P.evaluate(f"towers[0].nv==3&&towers[0].ramo==1&&st(towers[0]).div4==1&&en=={e0}-TIPOS.d2.ramos[1].custo"))
        await pad(P,0)
        check('nível 3 só pode vender',await P.locator('#ring [data-up],#ring [data-ramo]').count()==0 and await P.locator('#ring [data-sell]').count()==1)
        g=await P.evaluate("towers[0].gasto");e0=await P.evaluate("en");await P.click('#ring [data-sell]')
        check('vender devolve 60% do que foi gasto',await P.evaluate(f"towers.length==0&&en=={e0}+Math.floor({g}*.6)"))
        # Poder do Bip e escudo
        await pad(P,2);await P.click('#ring [data-b=d2]');await P.evaluate("towers[0].x=PADS[2][0];towers[0].z=PADS[2][1]")
        s2=await P.evaluate("(()=>{let best=0,bd=99;for(let s=0;s<PLEN;s+=.2){const [x,z]=noCaminho(s);const d=Math.hypot(x-PADS[2][0],z-PADS[2][1]);if(d<bd){bd=d;best=s}}return best})()")
        await P.evaluate(f"chamarOnda();fila=[];window.D0={MK}('c',4,3,.5);D0.vm=0;window.B1={MK}('c',8,1,{s2});B1.vm=0")
        await P.evaluate("for(let i=0;i<60;i++)step(1/30)")
        check('torre não atinge Bug com escudo',await P.evaluate("B1.n==8&&B1.esc==1&&!B1.dead"))
        await tocaBug(P,"B1")
        check('tocar no Bug abre o teclado do Poder do Bip',await P.evaluate("alvoBip===B1&&!$('teclas').hidden") and '8' in await P.inner_text('#pq'))
        await P.screenshot(path=OUT+'d-poder.png')
        c0=await P.evaluate("carga");await P.click('#teclas [data-p="3"]')
        check("resposta errada: gasta 2 cargas, Bug acelera, escudo continua",await P.evaluate(f"carga<={c0}-2+.1&&B1.pressa>0&&B1.esc==1&&erros==1&&B1.n==8"),await P.evaluate("[carga,B1.pressa,B1.esc,erros,B1.n,state,B1.dead,alvoBip===B1]"))
        await P.evaluate("carga=5");await P.click('#teclas [data-p="2"]')
        check('resposta certa: quebra o escudo e divide (8 → 4)',await P.evaluate("B1.esc==0&&B1.n==4&&acertos==1"))
        await P.evaluate("for(let i=0;i<120;i++)step(1/30)")
        check('sem escudo, a torre volta a atacar',await P.evaluate("B1.dead||B1.n<4"))
        await P.evaluate(f"window.B2={MK}('g',97,1,{s2});B2.vm=0;selecionar(B2);carga=5")
        await P.click('#teclas [data-p="primo"]')
        check('“É primo!” num gigante primo com escudo: destrói',await P.evaluate("B2.dead&&acertos==2"))
        await P.evaluate(f"window.B3={MK}('c',143,0,{s2});B3.vm=0;selecionar(B3);carga=5;responder(7)");
        check('143 = 11 × 13: 7 não divide; 11 divide',await P.evaluate("B3.n==143")); await P.evaluate("responder(11)")
        check('…e 143 ÷ 11 = 13 (o Obelisco termina)',await P.evaluate("B3.n==13"))
        # poderes dos Bugs
        await P.evaluate("bugs.forEach(b=>dispose(b.G));bugs=[];towers.forEach(t=>dispose(t.G));towers=[];soltar()")
        await P.evaluate(f"window.M1={MK}('m',6,0,5);M1.vm=0;window.S1={MK}('s',9,0,10);S1.vm=0;window.V1={MK}('c',7,0,10.5);V1.vm=0;S1.somaT=0")
        await P.evaluate("for(let i=0;i<120;i++)step(1/30)")
        check('Multiplicador dobra quando fica sem levar dano',await P.evaluate("M1.n==12"),await P.evaluate("M1.n"))
        check('Somador soma +1 no vizinho (7 vira 8)',await P.evaluate("V1.n==8"),await P.evaluate("[V1.n,S1.n]"))
        # chamar a próxima onda mais cedo
        await P.evaluate("bugs.forEach(b=>dispose(b.G));bugs=[];fila=[];ondas={};state='plan';wi=0;cache={};planejar()")
        await P.evaluate("chamarOnda();for(let i=0;i<400&&fila.length;i++)step(1/30)")
        vis=await P.is_visible('#bOnda');t=await P.inner_text('#bOnda')
        check('quando todos saíram do portal, aparece “chamar a próxima agora”',vis and 'agora' in t,t)
        e0=await P.evaluate("en");w0=await P.evaluate("wi");await P.click('#bOnda')
        check('chamar cedo dá energia e já começa a próxima onda',await P.evaluate(f"en>{e0}&&wi=={w0}+1&&fila.length>0&&state=='wave'"))
        # onda vencida: Bipcoins e recorde
        await P.evaluate("bugs.forEach(b=>dispose(b.G));bugs=[];fila=[];ondas={0:{tot:1,fim:0}};vencidas=0;window.K=%s('c',3,0,2);K.w=0;matar(K,'primo')"%MK)
        rec=await P.evaluate("JSON.parse(localStorage.getItem('bipsite-runner:t1'))")
        check('onda vencida: 5 Bipcoins e recorde salvo (onda × 100000 + pontos)',sum(rec['dcoins'].values())==5 and rec['best']['definf']//100000==1 and rec['best']['definf']%100000==await P.evaluate("Math.floor(pts)"),rec)
        check('não apaga Runner nem Snake',rec['best'].get('tabuada')==500 and rec['best'].get('snakemisto')==12 and rec.get('sruns')==2 and rec.get('druns')==1)
        check('Bipcoins do Defesa entram no saldo',await P.evaluate("BIPV.ganhos(null,null,JSON.parse(localStorage.getItem('bipsite-runner:t1')))")==100+40+12+5)
        # pausa esconde o tabuleiro (não dá para parar e pensar com os Bugs à vista)
        await P.evaluate("state='wave'");await P.click('#bPause');await P.wait_for_timeout(200)
        bg=await P.evaluate("getComputedStyle($('sPause')).backgroundColor")
        check('pausa cobre o tabuleiro',('0.97' in bg) or bg.startswith('rgb('),bg)
        await P.click('#bResume')
        # Bug que passa e fim de jogo
        await P.evaluate("vidas=1;bugs.forEach(b=>dispose(b.G));bugs=[];window.L1=%s('c',35,0,PLEN-.1);L1.w=-1;state='wave'"%MK)
        try:await P.wait_for_selector('#sEnd:not([hidden])',timeout=10000)
        except Exception:print(await P.evaluate("[state,vidas,bugs.map(b=>[b.s,b.n,b.dead,b.vm]),PLEN,fila.length]"));raise
        await P.screenshot(path=OUT+'d-fim.png')
        check('fim: mostra ondas vencidas, pontos e como vencer os Bugs que passaram',('venceu 1 onda' in await P.inner_text('#eT')) and '35 = 5 × 7' in await P.inner_text('#eFacts'),await P.inner_text('#eT'))
        check('fim mostra contas certas e erradas',('contas certas' in await P.inner_text('#eContaL')) and int(await P.inner_text('#eConta'))>=3)
        await P.click('#bNovo');await P.wait_for_timeout(300)
        check('jogar de novo recomeça da onda 1',await P.evaluate("state=='plan'&&wi==0&&vidas==VIDAS&&towers.length==0&&pts==0"))
        check('recorde aparece na tela inicial',await P.evaluate("BIPV.defesaDec(REC.best.definf).onda")==1)
        # partida rápida de verdade (onda 1 com torres)
        await P.evaluate("en+=200;construir(0,'d2');construir(2,'d2');construir(5,'cp');construir(8,'cp');vel=2");await P.click('#bOnda')
        await P.wait_for_function("state=='plan'&&wi==1||state=='end'",timeout=90000)
        check('onda 1 completa com torres comuns',await P.evaluate("wi==1&&vencidas==1&&vidas>=8"),await P.evaluate("[wi,vencidas,vidas]"))
        check('sem erros (computador)',not errs,errs[:3]);await c.close()
        for nome,w,h in [('d-cel.png',844,390),('d-cel-alto.png',390,844)]:
            c,P,errs=await ctx(b,w,h,True)
            await P.goto(B+'/defesa.html');await P.wait_for_timeout(1200);await P.screenshot(path=OUT+'m-'+nome);await P.click('#bGo');await P.wait_for_timeout(800)
            await P.evaluate(f"chamarOnda();fila=[];window.B1={MK}('c',30,1,9);B1.vm=0")
            await tocaBug(P,"B1");await P.wait_for_timeout(300);await P.screenshot(path=OUT+nome)
            box=await P.evaluate("(()=>{const a=$('teclas').getBoundingClientRect();return [a.left,a.right,a.bottom,innerWidth,innerHeight]})()")
            check(f'celular {w}×{h}: teclado do Poder cabe na tela, sem rolagem lateral',await P.evaluate("!$('teclas').hidden") and box[0]>=0 and box[1]<=box[3] and box[2]<=box[4] and await P.evaluate("document.documentElement.scrollWidth")<=w,box)
            check(f'sem erros (celular {w}×{h})',not errs,errs[:3]);await c.close()
        await b.close()
    print(f'\n{len(ok)} ok, {len(bad)} com problema',bad)
asyncio.run(main())
