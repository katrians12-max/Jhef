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
wr(fn,s)
fn=src+'/10-body.html';s=rd(fn)
s=patch(s,'<div class="tools">\n','<div class="tools">\n      <button class="iconbtn" id="menuBtn" aria-label="Voltar ao menu" title="Menu" data-ic="home"></button>\n',fn)
wr(fn,s)
subprocess.run(['python3',src+'/build.py',tmp+'/robo.html'],check=True)
wr(OUT+'/robo.html',HEAD+RESET+rd(tmp+'/robo.html')+'</html>\n')
lv=rd(os.path.join(F,'robo','30-levels.js'))
ROBO=json.loads(subprocess.run(['node','-e',lv.replace('const WORLDS=','globalThis.WORLDS=').replace('const LEVELS=','globalThis.LEVELS=')+';console.log(JSON.stringify(LEVELS.map(l=>[l.t,l.w])))'],capture_output=True,text=True,check=True).stdout)
shutil.rmtree(tmp)

# ---------- Academia do Bip: progresso por aluno e botão de menu ----------
fn=os.path.join(F,'academia','academia.html');s=rd(fn)
s=patch(s,'const KEY="academia-bip-3d-v1";',PID_JS+'\nconst KEY="academia-bip-3d-v1:"+PID;',fn)
s=patch(s,'<main id="home">\n','<main id="home">\n <div style="margin-bottom:12px"><button class="btn sm" id="toMenu" onclick="goMenu()">← Menu do Bip</button></div>\n',fn)
s=patch(s,'<title>Academia do Bip</title>',RESET+'<title>Academia do Bip</title>',fn)
wr(OUT+'/academia.html',s)
ACAD=[]
# aulas de cada mundo, na ordem dos mundos (W1, W2, ...): conta os blocos "/* n */{t:" dentro de cada const Wn=[...]
for m in re.finditer(r'^const W(\d+)=\[(.*?)^\];',s,re.M|re.S):
    w=int(m.group(1))-1;n=len(re.findall(r'^/\* ?\d+ ?\*/\{t:',m.group(2),re.M));ACAD+= [f"{w}-{i}" for i in range(n)]

# ---------- Menu ----------
m=rd(os.path.join(F,'menu','index.src.html'))
m=m.replace('/*ROBO*/[]',json.dumps(ROBO,ensure_ascii=False)).replace('/*ACAD*/[]',json.dumps(ACAD))
cut=m.index('</style>\n')+len('</style>\n')
wr(OUT+'/index.html',HEAD+'<style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>\n'+m[:cut]+'</head>\n<body>\n'+m[cut:]+'\n</body>\n</html>\n')

# ---------- conferência ----------
for f in ['index.html','robo.html','academia.html']:
    h=rd(OUT+'/'+f)
    for js in re.findall(r'<script>(.*?)</script>',h,re.S):
        p=os.path.join(tempfile.gettempdir(),'chk.js');wr(p,js)
        r=subprocess.run(['node','--check',p],capture_output=True,text=True);assert r.returncode==0,(f,r.stderr[:400])
print(f"dist/ pronto · {len(ROBO)} fases do robô · {len(ACAD)} aulas da academia")
for f in ['index.html','robo.html','academia.html']:print(f"  {f}: {os.path.getsize(OUT+'/'+f)//1024} KB")
