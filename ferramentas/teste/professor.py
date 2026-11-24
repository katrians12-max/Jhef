# Área do professor: ranking, Bipcoins, por atividade, atenção, telão e planilha.
# Cria a conta e a turma pela tela; os 14 alunos (com progressos variados) entram direto no banco local.
import asyncio,sys,json,random,subprocess,os
from playwright.async_api import async_playwright
B='http://localhost:8767';OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp/'
THREE=os.path.join(os.path.dirname(OUT.rstrip('/')),'lib','three.min.js')
def db(q):return subprocess.run(['psql','-h','/tmp','-p','5433','-U','postgres','-d','bip','-At','-c',q],capture_output=True,text=True).stdout.strip()
ok=[];bad=[]
def check(n,c,info=''):(ok if c else bad).append(n);print(('  ✓ ' if c else '  ✗ ')+n+('' if c else f' — {info}'))
LV=json.loads(subprocess.run(['node','-e',open('fonte/robo/30-levels.js').read().replace('const WORLDS=','globalThis.WORLDS=').replace('const LEVELS=','globalThis.LEVELS=')+';console.log(JSON.stringify(LEVELS.map(l=>l.t)))'],capture_output=True,text=True).stdout)
AC=[f'0-{i}' for i in range(12)]+[f'1-{i}' for i in range(10)]
random.seed(7)
# apelido, fases, aulas, dias sem entrar (None = nunca), itens comprados, cor da pintura
ALUNOS=[('Ana7',40,14,0,['p-ouro','o-coracao'],'p-ouro'),('Davi',35,12,0,['p-azul'],'p-azul'),('Lia',28,15,1,['p-rosa','o-coracao'],'p-rosa'),
 ('Theo',20,9,0,[],None),('Bia',18,10,2,['p-verde'],'p-verde'),('Enzo',15,6,3,['p-vermelho'],'p-vermelho'),('Malu',12,8,0,['p-roxo'],'p-roxo'),
 ('Gui',9,5,1,[],None),('Nina',8,4,9,['p-laranja'],'p-laranja'),('Caio',5,2,12,[],None),('Sofi',4,3,0,[],None),('Pedro',2,1,15,[],None),('Rafa',0,0,None,[],None),('Lucas',0,0,20,[],None)]
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        c=await b.new_context(viewport={'width':1280,'height':900},device_scale_factor=2,accept_downloads=True)
        async def rt(r):
            u=r.request.url
            if u.startswith(B):await r.continue_()
            else:await r.abort()
        await c.route('**/*',rt);P=await c.new_page();errs=[];P.on('pageerror',lambda e:errs.append(str(e)))
        await P.goto(B+'/professor.html')
        await P.click('#toUp');await P.fill('#upName','Prof. Jhef');await P.fill('#upEmail','prof2@escola.br');await P.fill('#upPass','segredo123');await P.click('#bUp')
        await P.wait_for_selector('#scrTurmas:not([hidden])');await P.fill('#tNome','7º ano B');await P.click('#bTurma');await P.wait_for_selector('#scrTurma:not([hidden])');await P.click('#bAula');await P.wait_for_timeout(400)
        tid=db("select id from turmas where nome='7º ano B'")
        for ap,nf,na,dias,itens,pint in ALUNOS:
            stars={LV[i]:random.choice([1,2,3,3]) for i in range(nf)}
            robo={'v':1,'stars':stars,'skip':{}};acad={'done':AC[:na]}
            loja={'owned':itens,'look':({'pintura':pint} if pint else {}),'t':1}
            if 'o-coracao' in itens:loja['look']['olhos']='o-coracao'
            ua='null' if dias is None else f"now()-interval '{dias} days'"
            aid=db(f"insert into alunos(turma_id,apelido,pin_hash,ultimo_acesso) values('{tid}','{ap}','x',{ua}) returning id").split('\n')[0]
            run=None
            if nf>=8:
                ee={'7 × 8':{'n':2,'r':{'54':1,'63':1}},'6 × 9':{'n':1,'r':{'56':1}}} if ap in ('Theo','Bia','Enzo','Malu') else {'8 × 7':{'n':1,'r':{'54':1}}}
                run={'v':1,'best':{'tabuada':nf*11+na},'runs':nf//4,'coins':{'2026-11-17':60,'2026-11-18':25},'err':ee,'tot':{'tabuada':{'ok':nf*3,'bad':4}},'t':1}
                if ap!='Ana7':run['best']['definf']=nf*100000+nf*37;run['druns']=2
                if ap!='Ana7':run['best']['bomber']=nf*100000+nf*11;run['bruns']=3;run['bmeta']={'est':nf}
            for jogo,d in [('robo',robo),('academia',acad),('loja',loja),('runner',run)]:
                if d is None:continue
                if jogo=='loja' and not itens:continue
                db(f"insert into progresso(aluno_id,jogo,dados) values('{aid}','{jogo}','{json.dumps(d)}'::jsonb)")
        await P.click('#bReload');await P.wait_for_timeout(800)
        t=await P.inner_text('#rankBox')
        check('pódio com Ana7 em 1º (mais atividades)','Ana7' in t and '1º' in t and t.index('Ana7')<t.index('Lia') if 'Lia' in t else False,t[:200])
        check('quem não jogou aparece como "sem pontos"','Ainda sem pontos aqui: Lucas, Rafa' in await P.inner_text('#tabRank'),await P.inner_text('#tabRank'))
        await P.screenshot(path=OUT+'p-ranking.png',full_page=True)
        await P.click('[data-crit="coins"]');t=await P.inner_text('#rankBox');check('ranking por Bipcoins ganhos','Ana7' in t)
        await P.click('[data-crit="run"]');t=await P.inner_text('#rankBox')
        check('ranking do Bip Runner (Ana7 tem o maior recorde)','Ana7' in t and '454 pontos' in t,t[:200])
        await P.click('[data-crit="bomber"]');t=await P.inner_text('#rankBox')
        check('ranking do Bip Bomber por arena','arena ' in t and ' pts' in t,t[:200])
        await P.click('[data-crit="defesa"]');t=await P.inner_text('#rankBox')
        check('ranking do Bip Defesa por onda','onda ' in t and ' pts' in t and 'Ana7' not in t.split('Ainda')[0],t[:200])
        await P.click('[data-crit="est"]');await P.click('[data-crit="ativ"]')
        await P.click('[data-tab="alunos"]');rows=await P.inner_text('#rows')
        check('tabela mostra saldo e itens','gastou' in rows and '2 itens' in rows,rows[:300])
        check('tabela mostra o Bip Defesa','2 partidas' in rows and 'BIP DEFESA' in (await P.inner_text('#thead')).upper(),[rows[:900],await P.inner_text('#thead')])
        check('tabela mostra recorde do Runner e quem ainda não correu','454 pts' in rows and 'ainda não correu' in rows,rows[:300])
        check('Bipcoins do Runner entram no ganho (Ana7: 1.570 + 85)','ganhou 1.655' in rows,rows[:400])
        await P.click('[data-sort="saldo"]');first=(await P.inner_text('#rows tr:first-child'));check('ordena por Bipcoins (maior primeiro)','Davi' in first or 'Ana7' in first or 'Lia' in first,first)
        await P.screenshot(path=OUT+'p-alunos.png',full_page=True)
        await P.click('[data-tab="ativ"]');t=await P.inner_text('#tabAtiv')
        check('por atividade mostra aulas e mundos do Robô','O ponto' in t and 'Primeiros passos' in t and '👣' in t,t[:200])
        check('Runner: conta que a turma mais erra e a resposta mais marcada','7 × 8 = 56' in t and '4 alunos' in t and 'mais marcado: 54' in t,t[-600:])
        await P.screenshot(path=OUT+'p-ativ.png',full_page=True)
        await P.click('[data-tab="aten"]');t=await P.inner_text('#tabAten');n=await P.inner_text('#nAten')
        check('atenção lista Rafa, Lucas, Pedro e Caio','Rafa' in t and 'Lucas' in t and 'Pedro' in t and 'Caio' in t and 'Nunca entrou' in t and n.strip()!='',t[:300])
        check('atenção não lista quem está bem','Ana7' not in t and 'Davi' not in t)
        await P.screenshot(path=OUT+'p-aten.png',full_page=True)
        async with P.expect_download() as d:await P.click('#bCsv')
        f=await (await d.value).path();txt=open(f,encoding='utf-8-sig').read()
        check('planilha baixada com 14 alunos e colunas',txt.count('\n')==14 and txt.startswith('Posição;Apelido') and 'Ana7' in txt.split('\n')[1],txt[:200])
        check('planilha tem colunas do Runner','Recorde no Bip Runner' in txt.split('\n')[0])
        check('planilha tem colunas do Bip Defesa','Bip Defesa: onda alcançada' in txt.split('\n')[0])
        check('planilha tem colunas do Bip Bomber','Bip Bomber: arenas vencidas' in txt.split('\n')[0])
        tok=db(f"insert into sessoes(aluno_id) select id from alunos where apelido='Lia' and turma_id='{tid}' returning token").split('\n')[0]
        rec=await P.evaluate(f"fetch('/rest/v1/rpc/aluno_recordes',{{method:'POST',headers:{{apikey:'chave-teste','Content-Type':'application/json'}},body:JSON.stringify({{p_token:'{tok}',p_trilha:'tabuada'}})}}).then(r=>r.json())")
        rd=await P.evaluate(f"fetch('/rest/v1/rpc/aluno_recordes',{{method:'POST',headers:{{apikey:'chave-teste','Content-Type':'application/json'}},body:JSON.stringify({{p_token:'{tok}',p_trilha:'definf'}})}}).then(r=>r.json())")
        check('recordes da turma no Bip Defesa (sem SQL novo)',isinstance(rd,list) and len(rd)==5 and rd[0]['pontos']>=rd[-1]['pontos'],rd)
        check('aluno vê os 5 recordes da turma, com ele marcado',isinstance(rec,list) and len(rec)==5 and rec[0]['apelido']=='Ana7' and any(r['eu'] and r['apelido']=='Lia' for r in rec) and set(rec[0].keys())=={'apelido','pontos','eu'},rec)
        sv=await P.evaluate(f"fetch('/rest/v1/rpc/aluno_salvar',{{method:'POST',headers:{{apikey:'chave-teste','Content-Type':'application/json'}},body:JSON.stringify({{p_token:'{tok}',p_jogo:'runner',p_dados:{{v:1,best:{{tabuada:999}}}}}})}}).then(r=>r.json())")
        check('banco aceita salvar o jogo runner',sv.get('ok') is True,sv)
        stx=await P.evaluate(f"fetch('/rest/v1/rpc/aluno_recordes',{{method:'POST',headers:{{apikey:'chave-teste','Content-Type':'application/json'}},body:JSON.stringify({{p_token:'{tok}',p_trilha:\"x'; drop table alunos;--\"}})}}).then(r=>r.status)")
        check('trilha estranha é recusada',stx>=400,stx)
        await P.click('#bTelao');await P.wait_for_timeout(400);tl=await P.inner_text('#telao')
        check('telão mostra só os 10 primeiros','Ana7' in tl and '10º' in tl and '11º' not in tl and 'Pedro' not in tl,tl[-300:])
        await P.screenshot(path=OUT+'p-telao.png')
        await P.keyboard.press('Escape');await P.wait_for_timeout(200);check('Esc fecha o telão',await P.is_hidden('#telao'))
        await P.click('[data-tab="rank"]')
        m=await b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
        await m.route('**/*',rt);M=await m.new_page();await M.goto(B+'/professor.html')
        await M.fill('#inEmail','prof2@escola.br');await M.fill('#inPass','segredo123');await M.click('#bIn');await M.wait_for_selector('#turmas .tcard')
        await M.click('#turmas .tcard');await M.wait_for_timeout(800)
        check('celular sem rolagem lateral',await M.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        await M.screenshot(path=OUT+'p-cel.png',full_page=True)
        check('sem erros de script',not errs,errs[:2])
        await b.close()
    print(f'\n{len(ok)} ok, {len(bad)} com problema',bad)
asyncio.run(main())
