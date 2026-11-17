"""Junta os módulos em um único arquivo HTML (o artefato publicado).
uso: python3 build.py [saida.html]"""
import sys,os,subprocess
D=os.path.dirname(os.path.abspath(__file__))
rd=lambda n:open(os.path.join(D,n),encoding='utf8').read().rstrip('\n')
JS=['30-levels.js','40-core.js','45-util.js','50-audio.js','60-scene.js','65-anim.js','70-editor.js','80-game.js']
out=sys.argv[1] if len(sys.argv)>1 else os.path.join(D,'saida.html')
js='\n'.join(rd(f) for f in JS)
html=rd('00-head.html')+'\n<style>\n'+rd('05-style.css')+'\n</style>\n\n'+rd('10-body.html')+'\n\n<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>\n<script>\n'+js+'\n</script>\n'
open(out,'w',encoding='utf8').write(html)
# checagem de sintaxe do script e de chaves do CSS
tmp=out+'.check.js';open(tmp,'w',encoding='utf8').write(js)
r=subprocess.run(['node','--check',tmp],capture_output=True,text=True);os.remove(tmp)
css=rd('05-style.css');bal=css.count('{')-css.count('}')
print(f"{out}: {len(html.encode('utf8'))//1024} KB · sintaxe JS: {'ok' if r.returncode==0 else 'ERRO'} · chaves CSS: {'ok' if bal==0 else 'DESBALANCEADAS '+str(bal)}")
if r.returncode: print(r.stderr[:1500]);sys.exit(1)
