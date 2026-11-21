"""Monta o site Mundo do Bip na pasta dist/ a partir da pasta fonte/.

uso:  python3 build.py

fonte/robo/          Robô Programador (módulos; o build.py dele junta tudo)
fonte/academia/      Academia do Bip (um arquivo só)
fonte/menu/          menu com perfis de aluno e código de progresso
fonte/robo-matematica/  versão do Robô com 4 mundos de matemática (ainda não está no site)
dist/                o site pronto (é isto que o Netlify publica)
"""
import os,re,json,shutil,subprocess,tempfile,zipfile
R=os.path.dirname(os.path.abspath(__file__))
F=os.path.join(R,'fonte');OUT=os.path.join(R,'dist')
os.makedirs(OUT,exist_ok=True)
def rd(p):return open(p,encoding='utf8').read()
def wr(p,s):open(p,'w',encoding='utf8').write(s)
def patch(s,a,b,fn):
    assert s.count(a)==1,(fn,s.count(a),a[:80]);return s.replace(a,b)

HEAD='<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
RESET='<style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style>\n'
# Marca: ícone da aba, ícones do celular e a prévia do link (WhatsApp, redes sociais)
SITE='https://mundodobip.com.br/'
DESC='Programe o robô Bip e aprenda matemática: lógica de programação e aulas em 3D do Fundamental 2.'
ICONS='<meta name="theme-color" content="#f2c230">\n<link rel="icon" href="favicon.svg" type="image/svg+xml">\n<link rel="apple-touch-icon" href="apple-touch-icon.png">\n<link rel="manifest" href="manifest.webmanifest">\n'
SHARE=f'<meta name="description" content="{DESC}">\n<meta property="og:type" content="website">\n<meta property="og:title" content="Mundo do Bip">\n<meta property="og:description" content="{DESC}">\n<meta property="og:image" content="{SITE}og.png">\n<meta property="og:url" content="{SITE}">\n<meta property="og:locale" content="pt_BR">\n<meta name="twitter:card" content="summary_large_image">\n'
MK=os.path.join(F,'marca')
for a,b in [('icone.svg','favicon.svg'),('apple-touch-icon.png',None),('icon-192.png',None),('icon-512.png',None),('og.png',None),('logo.svg',None),('logo-claro.svg',None)]:
    shutil.copy(os.path.join(MK,a),os.path.join(OUT,b or a))
wr(OUT+'/manifest.webmanifest',json.dumps({"name":"Mundo do Bip","short_name":"Mundo do Bip","description":DESC,"lang":"pt-BR","start_url":"./","display":"standalone","background_color":"#e8edf4","theme_color":"#f2c230",
 "icons":[{"src":"icon-192.png","sizes":"192x192","type":"image/png"},{"src":"icon-512.png","sizes":"512x512","type":"image/png"},{"src":"favicon.svg","sizes":"any","type":"image/svg+xml"}]},ensure_ascii=False,indent=1))

# Cada jogo descobre qual aluno está jogando e sabe voltar ao menu
PID_JS='''const PID=(()=>{const h=location.hash.match(/^#p-([a-z0-9]+)$/i);if(h)return h[1];try{return localStorage.getItem("bipsite-cur")||"visitante"}catch(e){return "visitante"}})();
function goMenu(){if(window.parent!==window)parent.postMessage({bip:"menu"},"*");else location.href="./"}'''

# ---------- Robô Programador: progresso por aluno, sem "liberar todas as fases", botão de menu ----------
tmp=tempfile.mkdtemp();src=os.path.join(tmp,'robo');shutil.copytree(os.path.join(F,'robo'),src)
fn=src+'/80-game.js';s=rd(fn)
s=patch(s,'function loadSave(){try{const s=JSON.parse(localStorage.getItem("robo4")||"null");if(s&&s.v==1){Object.assign(save,s);return}\n const d3=JSON.parse(localStorage.getItem("robo-done3")||"null");if(d3){for(const k in d3)if(d3[k]&&OLD47[k])save.stars[OLD47[k]]=2;persist()}}catch(e){}}',
 PID_JS+'\nconst SKEY="robo4:"+PID;\nfunction loadSave(){try{const s=JSON.parse(localStorage.getItem(SKEY)||"null");if(s&&s.v==1)Object.assign(save,s)}catch(e){}}',fn)
s=patch(s,'function persist(){try{localStorage.setItem("robo4",JSON.stringify(save))}catch(e){}}','function persist(){try{localStorage.setItem(SKEY,JSON.stringify(save))}catch(e){}}',fn)
s,k=re.subn(r' <div class="row"><span><b>Liberar todas as fases</b>.*?</div>\n','',s,count=1);assert k==1
s=patch(s,'loadSave();if(!SKINS[save.skin]','loadSave();save.all=0;if(!SKINS[save.skin]',fn)
s=patch(s,'$("cfgBtn").onclick=ACTS.cfg;','$("cfgBtn").onclick=ACTS.cfg;$("menuBtn").onclick=goMenu;',fn)
# Bipcoins: aviso de quantas moedas a fase deu, e a pintura comprada na loja vira a cor do Bip
BV=rd(os.path.join(F,'comum','bipvisual.js'))
COINSVG=re.search(r"const COIN='(<svg.*?</svg>)'",BV).group(1).replace('class="coin"','style="width:30px;height:30px;flex:none"')
PAINT={m.group(1):m.group(2) for m in re.finditer(r'I\("pintura","([^"]+)","[^"]*","[^"]*",\d+,\{c:"(#[0-9a-fA-F]{6})"',BV)}
s=patch(s,'function finishLevel(nv){const L=LEVELS[lvl],n=countBlocks(P),quiz=L.type=="quiz",before=totalStars();','let COINGAIN=0;\nfunction finishLevel(nv){const L=LEVELS[lvl],n=countBlocks(P),quiz=L.type=="quiz",before=totalStars(),had=save.stars[L.t]||0;',fn)
s=patch(s,'rank=rankOf(after)[0]>before?rankOf(after)[1]:null;showWin(st,n,nv,skin,rank)}','rank=rankOf(after)[0]>before?rankOf(after)[1]:null;COINGAIN=(had?0:10)+5*(Math.max(had,st)-had);showWin(st,n,nv,skin,rank)}',fn)
s=patch(s,'  (rank?`<div class="prize">','  (COINGAIN?`<div class="prize">'+COINSVG+'<span><b>+${COINGAIN} Bipcoins</b> para gastar na Loja do Bip</span></div>`:"")+\n  (rank?`<div class="prize">',fn)
s=patch(s,'loadSave();save.all=0;if(!SKINS[save.skin]','loadSave();save.all=0;try{const LJ=JSON.parse(localStorage.getItem("bipsite-loja:"+PID)||"null"),pc='+json.dumps(PAINT)+'[LJ&&LJ.look&&LJ.look.pintura];if(pc&&LJ.look.pintura!="p-amarelo"){SKINS.loja=pc;SKIN_AT.loja=0;SKIN_NAME.loja="da Loja";save.skin="loja"}}catch(e){}if(!SKINS[save.skin]',fn)
wr(fn,s)
fn=src+'/10-body.html';s=rd(fn)
s=patch(s,'<div class="tools">\n','<div class="tools">\n      <button class="iconbtn" id="menuBtn" aria-label="Voltar ao menu" title="Menu" data-ic="home"></button>\n',fn)
wr(fn,s)
subprocess.run(['python3',src+'/build.py',tmp+'/robo.html'],check=True)
wr(OUT+'/robo.html',HEAD+ICONS+RESET+rd(tmp+'/robo.html')+'</html>\n')
lv=rd(os.path.join(F,'robo','30-levels.js'))
ROBO=json.loads(subprocess.run(['node','-e',lv.replace('const WORLDS=','globalThis.WORLDS=').replace('const LEVELS=','globalThis.LEVELS=')+';console.log(JSON.stringify([LEVELS.map(l=>[l.t,l.w]),WORLDS.map(w=>w.n)]))'],capture_output=True,text=True,check=True).stdout)
ROBO,ROBOW=ROBO
shutil.rmtree(tmp)

# ---------- Academia do Bip: progresso por aluno e botão de menu ----------
BIPVJS=rd(os.path.join(F,'comum','bipvisual.js'))
fn=os.path.join(F,'academia','academia.html');s=rd(fn)
s=patch(s,'three.min.js"></script>\n','three.min.js"></script>\n<script>'+BIPVJS+'</script>\n',fn)
s=patch(s,'const KEY="academia-bip-3d-v1";',PID_JS+'\nconst KEY="academia-bip-3d-v1:"+PID;',fn)
s=patch(s,'<main id="home">\n','<main id="home">\n <div style="margin-bottom:12px"><button class="btn sm" id="toMenu" onclick="goMenu()">← Menu do Bip</button></div>\n',fn)
s=patch(s,'<title>Academia do Bip</title>',ICONS+RESET+'<title>Academia do Bip</title>',fn)
wr(OUT+'/academia.html',s)
ACAD=[];ACADT=[];ACADW=[]
# aulas de cada mundo, na ordem dos mundos (W1, W2, ...): conta os blocos "/* n */{t:" dentro de cada const Wn=[...]
for m in re.finditer(r'^const W(\d+)=\[(.*?)^\];',s,re.M|re.S):
    w=int(m.group(1))-1;ts=re.findall(r'^/\* ?\d+ ?\*/\{t:"([^"]*)"',m.group(2),re.M);ACAD+= [f"{w}-{i}" for i in range(len(ts))];ACADT+=ts
ACADW=re.findall(r'^ \{t:"([^"]*)",d:"[^"]*",c:"#[0-9a-fA-F]{6}",L:W\d+\}',s,re.M)

# ---------- Área do professor + conexão com o banco ----------
CFG=json.load(open(os.path.join(F,'config.json'),encoding='utf8'))
NUV='<script>window.BIP_CFG='+json.dumps({"url":CFG.get('supabase_url','').rstrip('/'),"key":CFG.get('supabase_key','')})+';</script>\n<script>'+rd(os.path.join(F,'menu','nuvem.js'))+'</script>\n'
def page(src,out,extra_head=''):
    m=rd(os.path.join(F,'menu',src))
    m=m.replace('/*ROBO*/[]',json.dumps(ROBO,ensure_ascii=False)).replace('/*ACAD*/[]',json.dumps(ACAD)).replace('/*ROBO_N*/0',str(len(ROBO))).replace('/*ROBOW*/[]',json.dumps(ROBOW,ensure_ascii=False)).replace('/*ACADT*/[]',json.dumps(ACADT,ensure_ascii=False)).replace('/*ACADW*/[]',json.dumps(ACADW,ensure_ascii=False))
    m=patch(m,'<!--LOGO-->','<span class="sr-only">Mundo do Bip</span>'+logo if 'sr-only' in m else logo,src)
    m=m.replace('<script>/*BIPV*/</script>','<script>'+BIPVJS+'</script>').replace('<script>/*LOBBY*/</script>','<script>'+rd(os.path.join(F,'menu','lobby.js'))+'</script>').replace('<script>/*CENA*/</script>','<script>'+rd(os.path.join(F,'menu','cenarios.js'))+'</script>')
    m=m.replace('<script>\n',NUV+'<script>\n',1)
    cut=m.index('</style>\n')+len('</style>\n')
    wr(OUT+'/'+out,HEAD+ICONS+extra_head+'<style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>\n'+m[:cut]+'</head>\n<body>\n'+m[cut:]+'\n</body>\n</html>\n')
logo=rd(os.path.join(MK,'logo-cor.svg')).replace('<svg xmlns="http://www.w3.org/2000/svg" ','<svg aria-hidden="true" focusable="false" ')
page('index.src.html','index.html',SHARE)
page('professor.src.html','professor.html','<meta name="robots" content="noindex">\n')
page('runner.src.html','runner.html','<meta name="robots" content="noindex">\n')

# ---------- conferência ----------
for f in ['index.html','professor.html','robo.html','academia.html','runner.html']:
    h=rd(OUT+'/'+f)
    for js in re.findall(r'<script>(.*?)</script>',h,re.S):
        p=os.path.join(tempfile.gettempdir(),'chk.js');wr(p,js)
        r=subprocess.run(['node','--check',p],capture_output=True,text=True);assert r.returncode==0,(f,r.stderr[:400])
assert len(ACADT)==len(ACAD) and len(ACADW)>=2 and len(ROBOW)>=5,(len(ACADT),ACADW,ROBOW)
print(f"dist/ pronto · {len(ROBO)} fases do robô · {len(ACAD)} aulas da academia")
for f in ['index.html','professor.html','robo.html','academia.html','runner.html']:print(f"  {f}: {os.path.getsize(OUT+'/'+f)//1024} KB")
