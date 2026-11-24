"""Equilíbrio do Bip: conta o tempo de jogo, faz descansar o jogo que passou de 35%, libera, jogos da vez e relatório do professor."""
import asyncio,sys,subprocess,json
from playwright.async_api import async_playwright
B='http://localhost:8767';OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp/'
THREE=open('/tmp/claude-0/-home-claude/45cd848e-0f4f-57b8-918c-4bd4556fe55d/scratchpad/lib/three.min.js').read()
def db(q):return subprocess.run(['psql','-h','/tmp','-p','5433','-U','postgres','-d','bip','-At','-c',q],capture_output=True,text=True).stdout.strip()
ok=[];bad=[]
def check(name,cond,info=''):
    (ok if cond else bad).append(name);print(('  ✓ ' if cond else '  ✗ ')+name+(' — '+str(info) if info and not cond else ''))
async def ctx(b,w=1280,h=860,mobile=False):
    c=await b.new_context(viewport={'width':w,'height':h},is_mobile=mobile,has_touch=mobile)
    async def rt(r):
        u=r.request.url
        if 'three.min.js' in u:await r.fulfill(body=THREE,content_type='application/javascript')
        elif u.startswith(B):await r.continue_()
        else:await r.abort()
    await c.route('**/*',rt);pg=await c.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));return c,pg,errs
TP="JSON.parse(localStorage.getItem(BIPV.tempoKey(cur))||'null')"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--ignore-gpu-blocklist'])
        cP,P,eP=await ctx(b)
        await P.goto(B+'/professor.html');await P.wait_for_timeout(300)
        await P.click('#toUp');await P.fill('#upName','Prof. Jhef');await P.fill('#upEmail','jhef@escola.br');await P.fill('#upPass','segredo123');await P.click('#bUp')
        await P.wait_for_selector('#scrTurmas:not([hidden])',timeout=12000)
        await P.fill('#tNome','7º ano A');await P.click('#bTurma');await P.wait_for_selector('#scrTurma:not([hidden])')
        code=(await P.inner_text('#tCode')).strip();await P.click('#bAula');await P.wait_for_timeout(500)
        await P.click('[data-tab="tempo"]');await P.wait_for_timeout(200)
        check('aba Tempo de jogo existe e explica (sem alunos)','O tempo aparece aqui' in await P.inner_text('#tabTempo') and await P.locator('#tabTempo button').count()==0,await P.inner_text('#tabTempo'))

        print('ALUNO')
        c1,A,e1=await ctx(b)
        await A.goto(B+'/');await A.click('#bTurma');await A.click('#bTurmaNova')
        await A.fill('#nCod',code);await A.fill('#nApe','Bia');await A.fill('#nPin','1234');await A.fill('#nPin2','1234');await A.click('#bNovaOk')
        await A.wait_for_selector('#scrMenu:not([hidden])',timeout=12000)
        check('começo: nenhum jogo descansando nem da vez',await A.locator('.game .desc').count()==0 and await A.locator('.game .vez').count()==0)

        # contagem de tempo de verdade
        await A.click('#sGo');await A.wait_for_timeout(1500);f=A.frames[1]
        for i in range(6):
            await f.evaluate("document.dispatchEvent(new PointerEvent('pointerdown'))");await A.wait_for_timeout(2000)
        tp=await A.evaluate(TP);d=list((tp or {}).get('d',{}).values())
        sn=d[0].get('snake',0) if d else 0
        check('conta o tempo enquanto o aluno mexe (≈10 s de Snake)',10<=sn<=15,tp)
        await A.evaluate("ultimoToque=Date.now()-61000");await A.wait_for_timeout(5600)
        tp2=await A.evaluate(TP);sn2=list(tp2['d'].values())[0].get('snake',0)
        check('parado há mais de 1 min: não conta',sn2==sn,(sn,sn2))
        await A.evaluate("closeGame()");await A.wait_for_timeout(1200)
        check('ao fechar o jogo, para de contar',await A.evaluate("jogoAberto")==None)
        r=db("select dados->'tempo'->'d' from progresso where jogo='runner'")
        check('tempo vai para a nuvem junto do runner','snake' in r,r)

        # simula uma semana viciada no Runner: 25 min de Runner, pouco nos outros
        saldo0=await A.evaluate("BIPV.saldo(cur)")
        await A.evaluate("""(()=>{const k=BIPV.tempoKey(cur),d=diaHoje();localStorage.setItem(k,JSON.stringify({d:{[d]:{runner:1500,robo:120,academia:60,snake:30,defesa:0,bomber:90}},vez:{},eq:{}}));
          localStorage.setItem('bipsite-ultimo:'+cur,'runner');drawMenu()})()""")
        await A.wait_for_timeout(300)
        check('Runner (antes 83% do tempo) vai descansar',await A.locator('#uGo').is_disabled() and await A.locator('#uGo >> xpath=ancestor::article//div[contains(@class,"desc")]').count()==1)
        t=await A.locator('.game .desc').first.inner_text();check('aviso diz quantos minutos faltam','6 min' in t and 'Runner descansando' in t,t)
        vez=await A.evaluate("EQ.vez");check('jogos da vez = os 2 menos jogados (Defesa e Snake)',sorted(vez)==['defesa','snake'],vez)
        check('selos ⭐ nos jogos da vez',await A.locator('.game .vez').count()==2 and await A.locator('#dGo >> xpath=ancestor::article//span[contains(@class,"vez")]').count()==1)
        check('botão Continuar não leva ao jogo descansando',await A.get_attribute('#bPlay','data-open')=='defesa',await A.get_attribute('#bPlay','data-open'))
        await A.evaluate("document.querySelector('#uGo').onclick()");await A.wait_for_timeout(300)
        check('clicar no jogo descansando não abre',await A.is_hidden('#play'))
        await A.screenshot(path=OUT+'eq-lobby.png')

        # joga 5 min de Defesa (jogo da vez): ganha 5 Bipcoins e desconta 5 min do descanso
        await A.evaluate("for(let i=0;i<60;i++)contaTempo(curP(),'defesa',5)");await A.evaluate("drawMenu()")
        tp=await A.evaluate(TP)
        check('jogar o jogo da vez rende +1 Bipcoin por minuto',await A.evaluate("BIPV.saldo(cur)")-saldo0==5,await A.evaluate("BIPV.saldo(cur)")-saldo0)
        check('falta 1 min de descanso',tp['eq']['bloq']['runner']['falta']==60 and '1 min' in await A.locator('.game .desc').first.inner_text(),tp['eq'])
        await A.evaluate("for(let i=0;i<12;i++)contaTempo(curP(),'robo',5)");await A.evaluate("drawMenu()")
        tp=await A.evaluate(TP)
        check('jogar outro jogo pouco jogado também conta (Robô abaixo da média)',not tp['eq']['bloq'] and tp['eq']['cred'].get('runner')==480,tp['eq'])
        check('Runner volta a ficar livre (com 8 min de folga)',not await A.locator('#uGo').is_disabled() and await A.locator('.game .desc').count()==0)
        await A.evaluate("for(let i=0;i<96;i++)contaTempo(curP(),'runner',5)");await A.evaluate("drawMenu()")
        check('acabou a folga e o Runner ainda passa de 35%: descansa de novo',await A.locator('#uGo').is_disabled())
        # teto do bônus
        await A.evaluate("(()=>{const k=BIPV.tempoKey(cur),t=JSON.parse(localStorage.getItem(k));t.vez[diaHoje()]=99999;localStorage.setItem(k,JSON.stringify(t))})()")
        check('bônus da vez tem teto de 20 por dia',await A.evaluate("BIPV.saldo(cur)")-saldo0==20,await A.evaluate("BIPV.saldo(cur)")-saldo0)
        await A.evaluate("(()=>{const k=BIPV.tempoKey(cur),t=JSON.parse(localStorage.getItem(k));t.vez[diaHoje()]=300;localStorage.setItem(k,JSON.stringify(t))})()")
        await A.evaluate("push(curP())");await A.wait_for_timeout(800)
        r=json.loads(db("select dados->'tempo' from progresso where jogo='runner'") or 'null')
        check('descanso e bônus salvos na nuvem',r and 'runner' in r['eq']['bloq'] and list(r['vez'].values())==[300],r)

        print('OUTRO APARELHO (celular)')
        c2,M,e2=await ctx(b,390,844,True)
        await M.goto(B+'/');await M.click('#bTurma');await M.fill('#tCod',code);await M.fill('#tApe','Bia');await M.fill('#tPin','1234');await M.click('#bTurmaOk')
        await M.wait_for_selector('#scrMenu:not([hidden])',timeout=12000);await M.wait_for_timeout(500)
        check('no celular o Runner também está descansando',await M.locator('#uGo').is_disabled())
        check('no celular os Bipcoins do bônus aparecem iguais',await M.evaluate("BIPV.saldo(cur)")==await A.evaluate("BIPV.saldo(cur)"),(await M.evaluate("BIPV.saldo(cur)"),await A.evaluate("BIPV.saldo(cur)")))
        await M.locator('#uGo').scroll_into_view_if_needed();await M.screenshot(path=OUT+'eq-cel.png')
        w=await M.evaluate("document.documentElement.scrollWidth");check('celular sem rolagem lateral',w<=390,w)

        print('MODO NORMAL (sem turma)')
        c3,N,e3=await ctx(b)
        await N.goto(B+'/');await N.wait_for_timeout(300)
        await N.evaluate("""(()=>{const id='loc1';localStorage.setItem('bipsite-profiles',JSON.stringify([{id,name:'Leo',color:'#e44'}]));
          localStorage.setItem(BIPV.tempoKey(id),JSON.stringify({d:{[diaHoje()]:{runner:5000}},vez:{},eq:{}}));localStorage.setItem('bipsite-cur',id)})()""")
        await N.reload();await N.wait_for_timeout(800)
        check('perfil fora da turma não tem equilíbrio',await N.locator('.game .desc').count()==0 and await N.evaluate("EQ")==None,await N.evaluate("cur"))

        print('PROFESSOR vê o relatório')
        await P.click('#bReload');await P.wait_for_timeout(800);await P.click('[data-tab="tempo"]');await P.wait_for_timeout(200)
        t=await P.inner_text('#tabTempo')
        check('relatório mostra a aluna, os minutos e o jogo descansando','Bia' in t and '💤 Bip Runner' in t and 'min' in t,t[:400])
        check('relatório aponta o jogo menos jogado',('menos jogado' in t) and ('Bip Snake' in t),t[:400])
        check('relatório sem botões',await P.locator('#tabTempo button').count()==0)
        await P.screenshot(path=OUT+'eq-prof.png',full_page=True)
        await P.set_viewport_size({'width':390,'height':844});await P.wait_for_timeout(200)
        w=await P.evaluate("document.documentElement.scrollWidth");check('relatório no celular sem rolagem lateral da página',w<=390,w)
        await P.screenshot(path=OUT+'eq-prof-cel.png',full_page=True)

        E=[x for x in eP+e1+e2+e3 if 'WebGL' not in x]
        check('sem erros de JavaScript',not E,E)
        await b.close()
    print(f'\n{len(ok)} ok, {len(bad)} falharam');sys.exit(1 if bad else 0)
asyncio.run(main())
