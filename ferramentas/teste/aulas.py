"""Joga todas as aulas da Academia do Bip no navegador, fazendo as atividades (erra uma vez nas de escolha)."""
import asyncio,sys,json
from playwright.async_api import async_playwright
OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp/'
ONLY=sys.argv[2] if len(sys.argv)>2 else None   # ex.: "1" só o Mundo 2
THREE=open('/tmp/claude-0/-home-claude/45cd848e-0f4f-57b8-918c-4bd4556fe55d/scratchpad/lib/three.min.js').read()
PICK={(0,0,4):[[-2,1],[1,3],[3,-1]],(0,1,3):[[-2,-1],[3,2]],(0,2,5):[[1,-2]],(0,3,2):[[-2,-2],[2,-2],[0,2]],(0,4,5):[[3,0]],(0,11,3):[[0,3]],
      (1,2,1):[[5,0]],(1,2,3):[[-1,0]],(1,6,1):[[-2,0],[2,0],[6,0]],(1,7,3):[[-4,2],[-3,2]]}
WRONG={(1,2,1):[[4,0]],(1,7,3):[[-2,2],[-3,2]]}
SHOT={(1,0,3),(1,1,2),(1,1,3),(1,2,0),(1,3,2),(1,3,3),(1,4,0),(1,4,2),(1,5,1),(1,6,3),(1,7,1),(1,7,3),(1,8,0),(1,8,4),(1,9,1),(1,9,4)}
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--ignore-gpu-blocklist']);c=await b.new_context(viewport={'width':1280,'height':800})
        async def rt(r):
            u=r.request.url
            if 'three.min.js' in u:await r.fulfill(body=THREE,content_type='application/javascript')
            elif u.startswith('file:'):await r.continue_()
            else:await r.abort()
        await c.route('**/*',rt);pg=await c.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto('file:///home/claude/mundo-do-bip/dist/academia.html');await pg.wait_for_timeout(500)
        W=await pg.evaluate("WORLDS.map(W=>W.L?W.L.length:0)");prob=[]
        for wi,n in enumerate(W):
            if ONLY is not None and str(wi)!=ONLY:continue
            for li in range(n):
                await pg.evaluate(f"openLesson({wi},{li})")
                ns=await pg.evaluate("LES().steps.length")
                for si in range(ns):
                    await pg.wait_for_timeout(200)
                    a=await pg.evaluate("(()=>{const a=LES().steps[step].a;return a?{k:a.k,ans:a.ans,n:a.o&&a.o.length,goal:a.goal,init:a.init,c:a.c&&a.c.map(x=>x[1])}:null})()")
                    if a:
                        k=a['k']
                        if k=='opt':
                            await pg.click(f".opt[data-i='{(a['ans']+1)%a['n']}']");await pg.click(f".opt[data-i='{a['ans']}']")
                        elif k=='pick':
                            if (wi,li,si) in WRONG:
                                for q in WRONG[(wi,li,si)]:await pg.evaluate(f"onPick({q})");await pg.wait_for_timeout(150)
                                await pg.wait_for_timeout(1800);print('   erro de propósito →',(await pg.inner_text('#txt'))[:90])
                            for q in PICK[(wi,li,si)]:await pg.evaluate(f"onPick({q})");await pg.wait_for_timeout(150)
                        elif k=='turn':
                            for _ in range(3):await pg.click('#tl');await pg.wait_for_timeout(900)
                        elif k=='slider':await pg.evaluate("$('sl').value=135;$('sl').dispatchEvent(new Event('input'))")
                        elif k=='prog':
                            tb=1 if li==8 else 2
                            await pg.click("[data-b='0']");await pg.click(f"[data-b='{tb}']")
                            for _ in range(3 if li==8 else 2):await pg.click('#prep')
                            await pg.click('#prun')
                        elif k=='step':
                            cur=a['init'] or a['c']
                            for i,(g,v) in enumerate(zip(a['goal'],cur)):
                                for _ in range(abs(g-v)):await pg.click(f"[data-d='{i}'][data-s='{1 if g>v else -1}']");await pg.wait_for_timeout(60)
                    okn=False
                    for _ in range(200):
                        if not await pg.is_disabled('#next'):okn=True;break
                        await pg.wait_for_timeout(100)
                    if (wi,li,si) in SHOT:await pg.wait_for_timeout(500);await pg.screenshot(path=OUT+f'm{wi}-{li}-{si}.png')
                    if not okn:prob.append((wi,li,si));print('TRAVOU',wi,li,si,(await pg.inner_text('#txt'))[:100]);break
                    await pg.click('#next')
                print(f'Mundo {wi+1} · aula {li+1} ok')
        await pg.wait_for_timeout(400);await pg.screenshot(path=OUT+'m-home.png',full_page=True)
        print('concluídas:',await pg.evaluate("save.done.length"),'· problemas:',prob,'· erros:',errs[:5]);await b.close()
asyncio.run(main())
