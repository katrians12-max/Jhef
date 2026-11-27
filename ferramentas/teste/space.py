"""Testa o Bip Space: física (embalo e queda), combustível (acerto enche, erro vaza, turbo), recorde e Bipcoins
salvos junto com o Runner, teto do dia, saguão, junção da nuvem, professor e celular."""
import asyncio,sys
from playwright.async_api import async_playwright
B='http://localhost:8767';OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp/'
THREE=open('/tmp/claude-0/-home-claude/45cd848e-0f4f-57b8-918c-4bd4556fe55d/scratchpad/lib/three.min.js').read()
ok=[];bad=[]
def check(n,c,i=''):(ok if c else bad).append(n);print(('  ✓ ' if c else '  ✗ ')+n+(' — '+str(i) if i and not c else ''))
async def ctx(b,w=1366,h=768,mobile=False):
    c=await b.new_context(viewport={'width':w,'height':h},is_mobile=mobile,has_touch=mobile)
    async def rt(r):
        u=r.request.url
        if 'three.min.js' in u:await r.fulfill(body=THREE,content_type='application/javascript')
        elif u.startswith(B):await r.continue_()
        else:await r.abort()
    await c.route('**/*',rt);pg=await c.new_page();pg.set_default_timeout(10000);errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));return c,pg,errs
# voa sem esperar o relógio: responde a cada `cada` segundos (acerta se ac=1, erra se ac=0, não responde se cada=0)
def voo(ac,cada,seg=120):
    return f"""(()=>{{st.cd=0;state='voo';$('cd').hidden=true;qNext=0;let pass=0,vmin=0,apQ=0;const dt=1/60;
     for(let i=0;i<{int(seg*60)};i++){{if(state!='voo')break;if(!Q&&st.E>0&&st.t>=qNext)abreQ();
      if(Q&&!Q.trava&&{cada}>0&&(i%Math.round({cada}*60))==0){{responde({ac}?Q.c:-999,null);Q=null;$('q').hidden=true;qNext=st.t}}
      passo(dt);vmin=Math.min(vmin,st.v);if(st.fase=='queda'&&!apQ)apQ=st.ap}}
     return {{ap:st.ap,p:st.p,vmin,apQ,state,ok:st.ok,err:st.err,res:!$('res').hidden||state=='fim'}}}})()"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--ignore-gpu-blocklist','--use-gl=angle','--use-angle=swiftshader'])
        c,P,errs=await ctx(b)
        await P.goto(B+'/');await P.evaluate("localStorage.setItem('bipsite-profiles',JSON.stringify([{id:'t1',name:'Ana',color:'#f00'}]));localStorage.setItem('bipsite-cur','t1');localStorage.setItem('bipsite-runner:t1',JSON.stringify({v:1,best:{tabuada:500,bomber:200123},runs:3,bruns:2}));localStorage.setItem('bipsite-loja:t1',JSON.stringify({owned:['c-astronauta'],look:{cabeca:'c-astronauta'},t:1}))")
        await P.goto(B+'/space.html#p-t1');await P.wait_for_timeout(2000);await P.screenshot(path=OUT+'x-inicio.png')
        r=await P.evaluate("[!!BIP,LOOK.cabeca,$('pCoins').textContent,!$('prep').hidden,!!document.querySelector('.brandrow svg'),$('hB').textContent]")
        check('abre com o Bip vestido com o visual da loja, logo e Bipcoins do dia',r[0] and r[1]=='c-astronauta' and r[2]=='0/60' and r[3] and r[4],r)
        print('FÍSICA')
        await P.click('#bGo');await P.wait_for_timeout(300)
        check('DECOLAR faz a contagem regressiva',await P.evaluate("state")=='cd' and await P.is_visible('#cd'))
        r=await P.evaluate(voo(0,0))
        check(f'sem responder: chega à estratosfera ({r["ap"]:.0f})',40<=r['ap']<100 and await P.evaluate(f"BIPV.spaceZona({r['ap']})")=='Estratosfera',r)
        check('sem combustível sobe no embalo, para e CAI antes do fim',r['vmin']<-3 and r['p']<r['ap'] and r['apQ']>0,r)
        await P.wait_for_timeout(900);await P.screenshot(path=OUT+'x-fim.png')
        t=await P.inner_text('#res')
        check('tela final: altitude máxima, camada e curiosidade',await P.evaluate(f"BIPV.spaceFmt({r['ap']})") in t and 'Estratosfera' in t and 'ozônio' in t,t[:200])
        o=await P.evaluate("JSON.parse(localStorage.getItem('bipsite-runner:t1'))")
        check('recorde, decolagem e Bipcoins salvos junto com o Runner (sem apagar o resto)',o['best']['space']==round(r['ap']) and o['xruns']==1 and list(o['xcoins'].values())==[4] and o['best']['tabuada']==500 and o['best']['bomber']==200123 and o['bruns']==2,o)
        check('mostra as Bipcoins ganhas','+4 Bipcoins' in t,t)
        # acertando tudo, rápido
        await P.evaluate("prepara();decolar()");r=await P.evaluate(voo(1,1.6))
        check(f'acertando tudo a cada 1,6 s passa da Lua ({r["ap"]:.0f} = {await P.evaluate("BIPV.spaceFmt("+str(r["ap"])+")")})',r['ap']>900 and r['err']==0,r)
        await P.wait_for_timeout(700);o=await P.evaluate("JSON.parse(localStorage.getItem('bipsite-runner:t1'))")
        check('recorde sobe e contas certas/erradas ficam guardadas',o['best']['space']==round(r['ap']) and o['tot']['space']['ok']==r['ok'] and o['xruns']==2,o.get('tot'))
        # erro vaza, acerto enche, turbo
        await P.evaluate("prepara();decolar();st.cd=0;state='voo';$('cd').hidden=true")
        r=await P.evaluate("(()=>{for(let i=0;i<60;i++)passo(1/60);const e0=st.E;for(let i=0;i<60;i++)passo(1/60);const normal=e0-st.E;abreQ();responde(-999,null);Q=null;const e1=st.E;for(let i=0;i<60;i++)passo(1/60);const vaz=e1-st.E;return {normal,vaz}})()")
        check(f'errar faz o tanque vazar o dobro ({r["normal"]:.1f} → {r["vaz"]:.1f} por segundo)',r['vaz']>r['normal']*1.8,r)
        r=await P.evaluate("(()=>{seq=0;const e0=st.E;abreQ();responde(Q.c,null);Q=null;const e1=st.E;abreQ();responde(Q.c,null);Q=null;const v0=st.v;abreQ();responde(Q.c,null);Q=null;return {enche:e1-e0,turbo:st.v-v0,seq}})()")
        check('acertar enche +25% e 3 seguidos dão TURBO',abs(r['enche']-25)<.5 and r['turbo']>3 and r['seq']==0,r)
        await P.evaluate("state='prep';st=null;Q=null;$('q').hidden=true;prepara()")
        # teto do dia
        await P.evaluate("(()=>{const k='bipsite-runner:t1',o=JSON.parse(localStorage.getItem(k));const d=Object.keys(o.xcoins)[0];o.xcoins[d]=58;localStorage.setItem(k,JSON.stringify(o))})();prepara();decolar()")
        await P.evaluate(voo(0,0));await P.wait_for_timeout(700)
        o=await P.evaluate("JSON.parse(localStorage.getItem('bipsite-runner:t1'))")
        check('Bipcoins do dia param em 60',list(o['xcoins'].values())==[60] and '+2 Bipcoins' in await P.inner_text('#rG'),(o['xcoins'],await P.inner_text('#rG')))
        await P.evaluate("prepara()");E=[x for x in errs if 'WebGL' not in x];check('sem erros de JavaScript no jogo',not E,E[:3])
        print('SAGUÃO, NUVEM E PROFESSOR')
        await P.goto(B+'/');await P.wait_for_timeout(1800);await P.screenshot(path=OUT+'x-saguao.png')
        t=await P.inner_text('#xGo >> xpath=ancestor::article')
        check('cartão do Bip Space no saguão com recorde e Bipcoins do dia','Bip Space' in t and 'Recorde:' in t and 'km' in t and 'hoje 60/60' in t,t)
        r=await P.evaluate("(()=>{const m=mergeRunner({v:1,best:{space:300},xruns:2,xcoins:{a:5}},{v:1,best:{space:900},xruns:3,xcoins:{a:4,b:7}});return [m.best.space,m.xruns,m.xcoins,BIPV.ganhos(null,null,{xcoins:{a:70,b:3}})-BIPV.BONUS]})()")
        check('nuvem junta recorde, decolagens e Bipcoins; ganhos contam o Space (teto 60/dia)',r[0]==900 and r[1]==3 and r[2]=={'a':5,'b':7} and r[3]==63,r)
        await P.click('#xGo');await P.wait_for_timeout(1500)
        check('botão Decolar abre o jogo na moldura',(await P.evaluate("$('frame').src")).endswith('space.html#p-t1'))
        await P.evaluate("closeGame()");await P.wait_for_timeout(500)
        check('“continuar” lembra do último jogo (▶ DECOLAR)','DECOLAR' in await P.inner_text('#bPlay'),await P.inner_text('#bPlay'))
        for w,h in [(1366,768),(1280,680),(1920,1080)]:
            await P.set_viewport_size({'width':w,'height':h});await P.wait_for_timeout(500)
            r=await P.evaluate("(()=>{const a=document.querySelector('#xGo').closest('article').getBoundingClientRect(),g=$('xGo').getBoundingClientRect();return [Math.round(a.bottom),innerHeight,Math.round(g.bottom),document.documentElement.scrollWidth<=innerWidth]})()")
            await P.screenshot(path=OUT+f'x-saguao-{w}x{h}.png')
            check(f'saguão {w}×{h}: cartão do Space inteiro na tela',r[2]<=r[1] and r[3],r)
        await c.close()
        # celular
        c,M,errs=await ctx(b,390,844,True)
        await M.goto(B+'/');await M.evaluate("localStorage.setItem('bipsite-profiles',JSON.stringify([{id:'t2',name:'Bia',color:'#0f0'}]));localStorage.setItem('bipsite-cur','t2')")
        await M.goto(B+'/space.html#p-t2');await M.wait_for_timeout(2000);await M.screenshot(path=OUT+'x-cel-inicio.png')
        await M.tap('#bGo');await M.wait_for_timeout(4300)
        await M.wait_for_selector('#q:not([hidden])',timeout=6000);await M.screenshot(path=OUT+'x-cel-voo.png')
        c0=await M.evaluate("Q.c");bt=M.locator('#qO button',has_text=str(c0)).first;e0=await M.evaluate("st.E");await bt.tap();await M.wait_for_timeout(150)
        check('celular: tocar na resposta certa enche o tanque',await M.evaluate("st.ok")==1,await M.evaluate("[st.ok,st.err,st.E]"))
        r=await M.evaluate("[document.documentElement.scrollWidth,innerWidth,$('q').getBoundingClientRect().bottom<=innerHeight]")
        check('celular: nada vaza da tela',r[0]<=r[1] and r[2],r)
        E=[x for x in errs if 'WebGL' not in x];check('celular: sem erros de JavaScript',not E,E[:3])
        await b.close()
    print(f'{len(ok)} ok, {len(bad)} com problema',bad)
asyncio.run(main())
