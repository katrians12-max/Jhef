"""Testa o saguão 3D, a loja e as Bipcoins (menu, Academia e Robô)."""
import asyncio,sys,json,subprocess
from playwright.async_api import async_playwright
B='http://localhost:8767';OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp/'
THREE=open('/tmp/claude-0/-home-claude/45cd848e-0f4f-57b8-918c-4bd4556fe55d/scratchpad/lib/three.min.js').read()
ok=[];bad=[]
def check(n,c,i=''):(ok if c else bad).append(n);print(('  ✓ ' if c else '  ✗ ')+n+(' — '+str(i) if i and not c else ''))
async def ctx(b,w=1366,h=860,mobile=False):
    c=await b.new_context(viewport={'width':w,'height':h},is_mobile=mobile,has_touch=mobile)
    async def rt(r):
        u=r.request.url
        if 'three.min.js' in u:await r.fulfill(body=THREE,content_type='application/javascript')
        elif u.startswith(B):await r.continue_()
        else:await r.abort()
    await c.route('**/*',rt);pg=await c.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and 'Failed to load' not in m.text and errs.append(m.text));return c,pg,errs
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--ignore-gpu-blocklist','--use-gl=angle','--use-angle=swiftshader'])
        c,pg,errs=await ctx(b)
        await pg.goto(B+'/');await pg.click('#bNew');await pg.fill('#inName','Ana');await pg.click('#fNew button[type=submit]');await pg.wait_for_timeout(2500)
        check('saguão 3D montado',await pg.evaluate("LOBBY.ready()"))
        check('começa com 100 Bipcoins',await pg.inner_text('#coinN')=='100',await pg.inner_text('#coinN'))
        await pg.screenshot(path=OUT+'l-saguao.png')
        pid=await pg.evaluate("cur")
        await pg.evaluate("""(()=>{const st={};ROBO.slice(0,40).forEach(([t])=>st[t]=3);localStorage.setItem('robo4:'+cur,JSON.stringify({v:1,stars:st,skip:{},seen:{}}));
          localStorage.setItem('academia-bip-3d-v1:'+cur,JSON.stringify({done:ACAD.slice(0,12)}))})()""")
        await pg.reload();await pg.wait_for_timeout(1500)
        exp=100+40*25+12*50
        check(f'moedas = {exp} depois de 40 fases e 12 aulas',await pg.inner_text('#coinN')==f'{exp:,}'.replace(',','.'),await pg.inner_text('#coinN'))
        check('botão principal continua o Robô na fase 41','fase 41' in await pg.inner_text('#playSub') and 'CONTINUAR' in await pg.inner_text('#bPlay'),await pg.inner_text('#bPlay'))
        check('saguão ocupa a tela toda (sem rolagem lateral)',await pg.evaluate("document.body.classList.contains('full')&&document.documentElement.scrollWidth<=innerWidth"))
        await pg.click('[data-g="dancar"]');await pg.wait_for_timeout(900);await pg.screenshot(path=OUT+'l-danca.png')
        await pg.click('#bLoja');await pg.wait_for_timeout(1200);await pg.screenshot(path=OUT+'l-loja.png')
        n=await pg.evaluate("document.querySelectorAll('.item').length");check('loja lista pinturas',n>15,n)
        # lendário caro demais
        await pg.click('[data-cat="pintura"]');await pg.click('[data-id="p-diamante"]');await pg.wait_for_timeout(500)
        check('item caro avisa quanto falta','Faltam' in await pg.inner_text('#sel'),await pg.inner_text('#sel'))
        await pg.screenshot(path=OUT+'l-astronauta.png')
        # compra a coroa (1200) e confere saldo
        await pg.click('[data-cat="cabeca"]');await pg.click('[data-id="c-coroa"]');await pg.click('#sBuy');await pg.click('#sOk');await pg.wait_for_timeout(600)
        check('comprou a coroa',await pg.inner_text('#coinN2')==f'{exp-1200:,}'.replace(',','.'),await pg.inner_text('#coinN2'))
        for cat,item in [('pintura','p-galaxia'),('olhos','o-coracao'),('costas','b-anjo'),('efeito','e-aura'),('rosto','r-escuros'),('pescoco','n-cachecol'),('antena','a-helice')]:
            await pg.click(f'[data-cat="{cat}"]');await pg.click(f'[data-id="{item}"]');await pg.wait_for_timeout(700);await pg.screenshot(path=OUT+f'l-{item}.png')
        # compra mais itens baratos e usa
        for cat,item in [('pintura','p-azul'),('olhos','o-estrela'),('costas','b-capa'),('pescoco','n-borboleta')]:
            await pg.click(f'[data-cat="{cat}"]');await pg.click(f'[data-id="{item}"]')
            if await pg.query_selector('#sBuy'):await pg.click('#sBuy');await pg.click('#sOk');await pg.wait_for_timeout(300)
        look=await pg.evaluate("BIPV.loja(cur).look");check('visual salvo',look['pintura']=='p-azul' and look['cabeca']=='c-coroa' and look['olhos']=='o-estrela',look)
        await pg.click('[data-cat="cabeca"]');await pg.click('[data-id="c-coroa"]');await pg.click('#sTirar');await pg.wait_for_timeout(300)
        check('tirar o chapéu',await pg.evaluate("BIPV.loja(cur).look.cabeca")is None)
        await pg.click('[data-id="c-coroa"]');await pg.click('#sUsar');await pg.wait_for_timeout(300)
        await pg.click('#bLojaVoltar');await pg.wait_for_timeout(1200);await pg.screenshot(path=OUT+'l-saguao2.png')
        # tudo de uma vez (todos os itens) para ver se nenhum quebra
        await pg.evaluate("""(()=>{for(const it of BIPV.ITEMS){LOBBY.look(Object.assign({},BIPV.loja(cur).look,{[it.cat]:it.id}))}})()""");await pg.wait_for_timeout(300)
        check('todos os itens montam sem erro',not errs,errs[:3])
        # Academia
        await pg.click('#aGo');await pg.wait_for_timeout(2500);f=pg.frames[1]
        t=await f.inner_text('#coinRow');check('Academia mostra Bipcoins',t.strip()!='',t)
        await pg.screenshot(path=OUT+'l-acad-home.png')
        await f.evaluate("openLesson(1,0)");await pg.wait_for_timeout(3500);await pg.screenshot(path=OUT+'l-acad-aula.png')
        check('Bip da Academia veste a loja',await f.evaluate("bip&&bip.g&&true"))
        await f.evaluate("closeLesson()");await pg.frame_locator('#frame').locator('#toMenu').click();await pg.wait_for_timeout(800)
        # Robô
        await pg.click('#rGo');await pg.wait_for_timeout(3500);f=pg.frames[1]
        check('Robô usa a pintura da loja',await f.evaluate("save.skin")=='loja' and await f.evaluate("SKINS.loja")=='#4a90e2',await f.evaluate("[save.skin,SKINS.loja]"))
        await pg.screenshot(path=OUT+'l-robo.png')
        check('sem erros (computador)',not errs,errs[:4]);await c.close()
        # celular
        c,pg,errs=await ctx(b,390,844,True)
        await pg.goto(B+'/');await pg.click('#bNew');await pg.fill('#inName','Bia');await pg.click('#fNew button[type=submit]');await pg.wait_for_timeout(2000)
        await pg.screenshot(path=OUT+'l-cel.png');await pg.click('#bLoja');await pg.wait_for_timeout(1000);await pg.click('[data-cat="cabeca"]');await pg.click('[data-id="c-bone"]');await pg.wait_for_timeout(600)
        await pg.screenshot(path=OUT+'l-cel-loja.png');check('celular sem rolagem lateral',await pg.evaluate("document.documentElement.scrollWidth")<=390)
        check('sem erros (celular)',not errs,errs[:4]);await c.close()
        # nuvem: compra sincroniza
        c,pg,errs=await ctx(b)
        await pg.goto(B+'/professor.html');await pg.click('#toUp');await pg.fill('#upName','P');await pg.fill('#upEmail','p@x.br');await pg.fill('#upPass','segredo123');await pg.click('#bUp')
        await pg.wait_for_selector('#scrTurmas:not([hidden])');await pg.fill('#tNome','T');await pg.click('#bTurma');await pg.wait_for_selector('#scrTurma:not([hidden])');code=(await pg.inner_text('#tCode')).strip()
        await pg.goto(B+'/');await pg.click('#bTurma');await pg.click('#bTurmaNova');await pg.fill('#nCod',code);await pg.fill('#nApe','Caio');await pg.fill('#nPin','1234');await pg.fill('#nPin2','1234');await pg.click('#bNovaOk')
        await pg.wait_for_selector('#scrMenu:not([hidden])');await pg.wait_for_timeout(800)
        await pg.click('#bLoja');await pg.click('[data-cat="pintura"]');await pg.click('[data-id="p-verde"]');await pg.click('#sBuy');await pg.click('#sOk');await pg.wait_for_timeout(1500)
        r=subprocess.run(['psql','-h','/tmp','-p','5433','-U','postgres','-d','bip','-At','-c',"select dados->'look'->>'pintura' from progresso where jogo='loja'"],capture_output=True,text=True).stdout.strip()
        check('compra salva na nuvem',r=='p-verde',r)
        check('sem erros (nuvem)',not errs,errs[:4]);await c.close();await b.close()
    print(f'\n{len(ok)} ok, {len(bad)} com problema',bad)
asyncio.run(main())
