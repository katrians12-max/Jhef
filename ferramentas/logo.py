"""Gera os arquivos da marca (logo A · Mascote) em fonte/marca/.
O texto vira desenho (contornos da fonte Inter Display Black, licença OFL), então a logo
fica igual em qualquer computador.  uso: python3 ferramentas/logo.py   (precisa de fontTools e Playwright)"""
import os,asyncio
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));OUT=os.path.join(R,'fonte','marca')
FONT=TTFont('/usr/share/fonts/opentype/inter/InterDisplay-Black.otf')
gs=FONT.getGlyphSet();cmap=FONT.getBestCmap();UPM=FONT['head'].unitsPerEm
def text_path(txt,x,y,size,track=0):
    pen=SVGPathPen(gs);s=size/UPM
    for ch in txt:
        g=cmap[ord(ch)];tp=TransformPen(pen,(s,0,0,-s,x,y));gs[g].draw(tp);x+=gs[g].width*s+track
    return pen.getCommands(),x
FACE='''<g transform="translate(4 6)"><line x1="42" y1="16" x2="42" y2="4" stroke="{ant}" stroke-width="5" stroke-linecap="round"/><circle cx="42" cy="5" r="6.5" fill="#ee5f2b"/>
<rect x="4" y="15" width="76" height="66" rx="20" fill="#f2c230" stroke="#b98d10" stroke-width="3.5"/><rect x="14" y="26" width="56" height="42" rx="12" fill="#172536"/>
<path d="M24 49q7-10 14 0M46 49q7-10 14 0" stroke="#5ef0e0" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M33 57q9 7 18 0" stroke="#5ef0e0" stroke-width="4" fill="none" stroke-linecap="round"/></g>'''
p1,w1=text_path('Mundo do',100,44,30);p2,w2=text_path('Bip',99,84,42,-1)
W=int(max(w1,w2))+6
def logo(ink,ant):return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} 96" role="img" aria-label="Mundo do Bip">{FACE.format(ant=ant)}<path d="{p1}" fill="{ink}"/><path d="{p2}" fill="#ee5f2b"/></svg>'
ICON='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 84"><rect x="2" y="8" width="80" height="72" rx="20" fill="#f2c230" stroke="#b98d10" stroke-width="3"/><rect x="12" y="19" width="60" height="48" rx="13" fill="#172536"/><path d="M22 46q8-11 16 0M46 46q8-11 16 0" stroke="#5ef0e0" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M33 55q9 7 18 0" stroke="#5ef0e0" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="42" cy="6" r="6" fill="#ee5f2b"/></svg>'
files={'logo.svg':logo('#172536','#3b4250'),'logo-claro.svg':logo('#ffffff','#9aa9bb'),'logo-cor.svg':logo('currentColor','currentColor'),'icone.svg':ICON}
for k,v in files.items():open(os.path.join(OUT,k),'w').write(v)
# imagens PNG: ícones do celular e a prévia do link (WhatsApp, redes sociais)
OG=f'''<html><body style="margin:0;width:1200px;height:630px;background:#e8edf4;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:30px;font-family:Inter Display">
<div style="position:absolute;inset:0;background:radial-gradient(circle at 80% 20%,#f2c23033,transparent 45%),radial-gradient(circle at 15% 85%,#ee5f2b22,transparent 40%)"></div>
<div style="width:760px;position:relative">{files['logo.svg']}</div>
<div style="position:relative;font:700 40px Inter Display;color:#586779">Programe o robô e aprenda matemática com ele.</div></body></html>'''
async def shots():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b=await p.chromium.launch()
        async def png(html,w,h,name):
            pg=await b.new_page(viewport={'width':w,'height':h});await pg.set_content(html);await pg.screenshot(path=os.path.join(OUT,name));await pg.close()
        for s,n in [(512,'icon-512.png'),(192,'icon-192.png'),(180,'apple-touch-icon.png')]:
            pad=int(s*.1);await png(f'<html><body style="margin:0;background:#172536;display:grid;place-items:center;width:{s}px;height:{s}px"><div style="width:{s-2*pad}px">{ICON}</div></body></html>',s,s,n)
        await png(OG,1200,630,'og.png');await b.close()
asyncio.run(shots());print('marca gerada:',sorted(os.listdir(OUT)))
