"""Painel do criador: só a conta da lista "criadores" vê; visitas anônimas; números batem com o banco."""
import asyncio,sys,subprocess
from playwright.async_api import async_playwright
B='http://localhost:8767';OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp/'
THREE=open('/tmp/claude-0/-home-claude/45cd848e-0f4f-57b8-918c-4bd4556fe55d/scratchpad/lib/three.min.js').read()
def db(q):return subprocess.run(['psql','-h','/tmp','-p','5433','-U','postgres','-d','bip','-At','-c',q],capture_output=True,text=True).stdout.strip()
ok=[];bad=[]
def check(name,cond,info=''):
    (ok if cond else bad).append(name);print(('  ✓ ' if cond else '  ✗ ')+name+(' — '+str(info) if info and not cond else ''))
async def ctx(b,w=1280,h=860,mobile=False,dark=False):
    c=await b.new_context(viewport={'width':w,'height':h},is_mobile=mobile,has_touch=mobile,color_scheme='dark' if dark else 'light')
    async def rt(r):
        u=r.request.url
        if 'three.min.js' in u:await r.fulfill(body=THREE,content_type='application/javascript')
        elif u.startswith(B):await r.continue_()
        else:await r.abort()
    await c.route('**/*',rt);pg=await c.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));return c,pg,errs
async def prof(b,nome,email,turma=None):
    c,P,e=await ctx(b)
    await P.goto(B+'/professor.html');await P.wait_for_timeout(300)
    await P.click('#toUp');await P.fill('#upName',nome);await P.fill('#upEmail',email);await P.fill('#upPass','segredo123');await P.click('#bUp')
    await P.wait_for_selector('#scrTurmas:not([hidden])',timeout=12000);code=None
    if turma:
        await P.fill('#tNome',turma);await P.click('#bTurma');await P.wait_for_selector('#scrTurma:not([hidden])')
        code=(await P.inner_text('#tCode')).strip();await P.click('#bAula');await P.wait_for_timeout(500)
    return c,P,e,code
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--ignore-gpu-blocklist'])
        print('CONTAS')
        cJ,J,eJ,code=await prof(b,'Jhef','jhef@escola.br','7º ano A')
        cO,O,eO,_=await prof(b,'Outra Prof','outra@escola.br','6º ano B')
        db("insert into criadores(user_id) select id from auth.users where email='jhef@escola.br'")

        print('VISITANTES')
        c1,A,e1=await ctx(b)   # aluno de turma, joga Snake pelo saguão
        await A.goto(B+'/');await A.click('#bTurma');await A.click('#bTurmaNova')
        await A.fill('#nCod',code);await A.fill('#nApe','Bia');await A.fill('#nPin','1234');await A.fill('#nPin2','1234');await A.click('#bNovaOk')
        await A.wait_for_selector('#scrMenu:not([hidden])',timeout=12000)
        await A.click('#sGo');await A.wait_for_timeout(1200);f=A.frames[1]
        for i in range(4):
            await f.evaluate("document.dispatchEvent(new PointerEvent('pointerdown'))");await A.wait_for_timeout(2000)
        await A.evaluate("closeGame()");await A.wait_for_timeout(1200)
        c2,N,e2=await ctx(b,390,844,True)   # modo normal no celular, 2 perfis
        await N.goto(B+'/');await N.wait_for_timeout(300)
        await N.evaluate("localStorage.setItem('bipsite-profiles',JSON.stringify([{id:'p1',name:'Leo',color:'#e44'},{id:'p2',name:'Mia',color:'#4a4'}]))")
        await N.reload();await N.wait_for_timeout(3500)
        r=db("select count(*),sum(perfis),sum(turma),bool_or(celular) from visitas")
        check('cada aparelho registrou 1 visita anônima (2 aparelhos, 2 perfis normais, 1 de turma, 1 celular)',r=='2|2|1|t',r)
        r=db("select jogos->>'snake',aberturas->>'snake' from visitas where turma=1")
        sn=int((r.split('|')[0] or 0));check('tempo e aberturas do Snake chegaram',6<=sn<=12 and r.split('|')[1]=='1',r)
        cols=db("select column_name from information_schema.columns where table_name='visitas'")
        check('visitas não guardam nome, apelido, e-mail nem IP',not any(x in cols for x in ['nome','apelido','email','ip']),cols)
        ap=await N.evaluate("localStorage.getItem('bipsite-aparelho')");check('aparelho = número sorteado',len(ap.strip('"'))==36)

        print('QUEM NÃO PODE ENTRAR')
        check('professor comum não vê o botão do painel',await O.is_hidden('#bCriador'))
        await O.goto(B+'/criador.html');await O.wait_for_timeout(1500)
        t=await O.inner_text('body')
        check('professor comum abrindo o endereço: "só do criador" e nenhum número',('só do criador' in t) and await O.is_hidden('#painel') and await O.locator('#kpis .kpi').count()==0,t[:200])
        c3,V,e3=await ctx(b);await V.goto(B+'/criador.html');await V.wait_for_timeout(1200)
        check('visitante sem login: pede para entrar',('Entre primeiro' in await V.inner_text('body')) and await V.is_hidden('#painel'))
        r=await V.evaluate("fetch('/rest/v1/rpc/criador_painel',{method:'POST',headers:{'Content-Type':'application/json',apikey:'chave-teste'},body:'{}'}).then(r=>r.status)")
        check('chamar o banco direto sem login é recusado',r in (401,403),r)
        tokO=await O.evaluate("JSON.parse(localStorage.getItem('bipsite-prof')).access_token")
        r=await O.evaluate("t=>fetch('/rest/v1/rpc/criador_painel',{method:'POST',headers:{'Content-Type':'application/json',apikey:'chave-teste',Authorization:'Bearer '+t},body:'{}'}).then(r=>r.json())",tokO)
        check('outra conta chamando o banco direto é recusada',r.get('message')=='sem_acesso',r)
        r=await V.evaluate("fetch('/rest/v1/rpc/registrar_visita',{method:'POST',headers:{'Content-Type':'application/json',apikey:'chave-teste'},body:JSON.stringify({p_aparelho:'99999999-9999-4999-8999-999999999999',p_perfis:9999,p_turma:0,p_celular:false,p_jogos:{runner:9e9,hack:5},p_aberturas:{}})}).then(r=>r.json())")
        v=db("select perfis,jogos from visitas where aparelho='99999999-9999-4999-8999-999999999999'")
        check('visita forjada fica dentro dos limites (perfis ≤ 50, jogo desconhecido descartado)',v.startswith('50|') and 'hack' not in v,v)
        db("delete from visitas where aparelho='99999999-9999-4999-8999-999999999999'")

        print('O CRIADOR')
        await J.reload();await J.wait_for_timeout(800)
        check('na Área do professor aparece "🛠 Painel do criador"',await J.is_visible('#bCriador'))
        await J.click('#bCriador');await J.wait_for_selector('#painel:not([hidden])',timeout=8000)
        k=await J.inner_text('#kpis')
        def kv(nome):
            i=k.split('\n');return i[i.index(nome)+1] if nome in i else None
        check('aparelhos = 2',kv('APARELHOS')=='2' or kv('Aparelhos')=='2',k)
        check('perfis criados (modo normal) = 2',(kv('PERFIS CRIADOS') or kv('Perfis criados'))=='2',k)
        check('alunos em turmas = 1, professores = 2, turmas = 2',(kv('ALUNOS EM TURMAS') or kv('Alunos em turmas'))=='1' and (kv('PROFESSORES') or kv('Professores'))=='2' and (kv('TURMAS') or kv('Turmas'))=='2',k)
        check('turmas com aula aberta = 2','2 com aula aberta' in k,k)
        tp=await J.inner_text('#tProf');tt=await J.inner_text('#tTur');fd=await J.inner_text('#feed')
        check('tabela de professores com e-mail e alunos','outra@escola.br' in tp and 'Jhef' in tp,tp)
        check('tabela de turmas','7º ano A' in tt and '6º ano B' in tt and 'aula aberta' in tt,tt)
        check('cadastros recentes mostram a aluna','Bia' in fd and '7º ano A' in fd,fd)
        check('Snake aparece com tempo em "Jogos mais jogados"','Bip Snake' in (await J.inner_text('#jogos')).split('\n')[0],await J.inner_text('#jogos'))
        await J.click('.seg button[data-d="7"]');await J.wait_for_timeout(700)
        check('trocar o período recarrega (7 dias = 7 barras)',await J.locator('#chA path.b').count()==7 and await J.get_attribute('.seg button[data-d="7"]','aria-pressed')=='true')
        await J.hover('#chA rect.hit >> nth=6');await J.wait_for_timeout(200)
        check('dica ao passar o mouse na barra de hoje','aparelhos' in await J.inner_text('#chA .tip'),await J.inner_text('#chA .tip'))
        # dados de exemplo para ver o painel cheio
        db("""insert into visitas(dia,aparelho,perfis,turma,celular,jogos,aberturas)
              select current_date - (g%30), gen_random_uuid(), 1+(g%3), (g%4=0)::int, g%3<>0,
                jsonb_build_object('runner',(g*37)%900,'robo',(g*53)%1500,'snake',(g*11)%400,'bomber',(g*71)%1100,'academia',(g*29)%700,'defesa',(g*17)%500),'{}'::jsonb
              from generate_series(1,400) g""")
        await J.click('.seg button[data-d="30"]');await J.wait_for_timeout(900)
        await J.screenshot(path=OUT+'cr-desk.png',full_page=True)
        await J.set_viewport_size({'width':390,'height':844});await J.wait_for_timeout(300)
        w=await J.evaluate("document.documentElement.scrollWidth");check('celular sem rolagem lateral',w<=390,w)
        await J.screenshot(path=OUT+'cr-cel.png',full_page=True)
        cD,Dk,eD=await ctx(b,1280,860,False,True)
        s=await J.evaluate("localStorage.getItem('bipsite-prof')")
        await Dk.goto(B+'/criador.html');await Dk.evaluate("s=>localStorage.setItem('bipsite-prof',s)",s);await Dk.reload();await Dk.wait_for_selector('#painel:not([hidden])',timeout=8000);await Dk.wait_for_timeout(300)
        await Dk.screenshot(path=OUT+'cr-escuro.png')
        E=[x for x in eJ+eO+e1+e2+e3+eD if 'WebGL' not in x]
        check('sem erros de JavaScript',not E,E)
        await b.close()
    print(f'\n{len(ok)} ok, {len(bad)} falharam');sys.exit(1 if bad else 0)
asyncio.run(main())
