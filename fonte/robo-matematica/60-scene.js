/* ===== Cena 3D (Three.js r128): texturas, temas, robô e montagem da fase ===== */
const T=window.THREE;let G=null;
let BW=6,BH=6;const X=c=>c-(BW-1)/2,Z=r=>r-(BH-1)/2;
const RS=1.14,TY=.1;                       // escala do robô e altura para onde a câmera olha
const KEYCOL={a:0xf2b000,b:0x3b8cf0},KEYCSS={a:"#e2a400",b:"#3b8cf0"},KEYNAME={a:"dourada",b:"azul"};
const PORTCOL={p:0xa855f7,q:0x12b8a6},OPTCOL={1:"#e4572e",2:"#12a394",3:"#7b5ae0",4:"#d99a00"};
/* Cores do Bip: cada uma é liberada com um total de estrelas (a primeira já vem liberada). */
const SKINS={amarelo:"#f2c230",laranja:"#f08a2c",verde:"#58b84c",azul:"#4a90e2",roxo:"#8e6ae0",rosa:"#ee6fae",vermelho:"#e2503f",branco:"#e6eaf0",dourado:"#ffc21a"};
const SKIN_AT={amarelo:0,laranja:9,verde:24,azul:45,roxo:72,rosa:105,vermelho:140,branco:180,dourado:225};

/* Materiais entram num "balde" para serem descartados quando a fase é remontada (sem vazar memória). */
let BUCKET=null;
const M=o=>{const m=new T.MeshStandardMaterial(Object.assign({roughness:.85,metalness:0},o));if(BUCKET)BUCKET.push(m);return m};
const MB=o=>{const m=new T.MeshBasicMaterial(o);if(BUCKET)BUCKET.push(m);return m};
function wipe(group,bucket){group.traverse(o=>{if(o.geometry)o.geometry.dispose()});while(group.children.length)group.remove(group.children[0]);bucket.forEach(m=>m.dispose());bucket.length=0}
const box=(w,h,d)=>new T.BoxGeometry(w,h,d),cyl=(a,b,h,n=14)=>new T.CylinderGeometry(a,b,h,n),sph=(r,a=14,b=10)=>new T.SphereGeometry(r,a,b);
function mesh(geo,m,x=0,y=0,z=0,o={}){const e=new T.Mesh(geo,m);e.position.set(x,y,z);if(o.ry)e.rotation.y=o.ry;if(o.rx)e.rotation.x=o.rx;if(o.rz)e.rotation.z=o.rz;
 e.castShadow=o.cast!==false;e.receiveShadow=!!o.recv;(o.to||G.stat).add(e);return e}

function init3D(){const el=$("board");
 try{if(!T)throw new Error("sem three");
  const r=new T.WebGLRenderer({antialias:true,powerPreference:"high-performance"});r.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));r.shadowMap.enabled=true;r.shadowMap.type=T.PCFSoftShadowMap;el.prepend(r.domElement);
  const scene=new T.Scene(),cam=new T.PerspectiveCamera(36,1,.1,170);
  const hemi=new T.HemisphereLight(0xffffff,0x556677,.85);scene.add(hemi);
  const sun=new T.DirectionalLight(0xffffff,.7);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.bias=-.0008;sun.shadow.normalBias=.03;scene.add(sun);scene.add(sun.target);
  G={r,scene,cam,hemi,sun,q:0,fpsT:0,fpsN:0,az:-.38,azV:0,el:.92,dist:14,panX:0,panY:0,aspect:1,h:400,fitNow:1,shake:0,stat:new T.Group(),dyn:new T.Group(),sb:[],db:[],rb:[],rtex:[],
   stars:new Map(),keys:new Map(),doors:new Map(),portals:[],scroll:[],blink:[],bob:[],conv:[],sway:[],flick:[],parts:[],paintMesh:{},
   robot:null,pose:null,ph:null,anim:null,clock:new T.Clock(),ECOL:{n:new T.Color(0x33ccff),h:new T.Color(0xffd23a),o:new T.Color(0xff3b3b)}};
  scene.add(G.stat);scene.add(G.dyn);
  new ResizeObserver(()=>{const w=el.clientWidth||300,h=el.clientHeight||300;r.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();G.aspect=w/h;G.h=h;G.fitNow=1}).observe(el);
  let drag=null,lt=0;
  el.addEventListener("pointerdown",e=>{if(e.target.closest("button"))return;drag=[e.clientX,e.clientY];lt=performance.now();G.azV=0;try{el.setPointerCapture(e.pointerId)}catch(_){}el.style.cursor="grabbing"});
  el.addEventListener("pointermove",e=>{if(!drag)return;const now=performance.now(),dA=-(e.clientX-drag[0])*.008;G.az+=dA;G.azV=dA/Math.max(.008,(now-lt)/1000);
   G.el=clamp(G.el+(e.clientY-drag[1])*.005,.55,1.35);lt=now;drag=[e.clientX,e.clientY]});
  const up=()=>{drag=null;el.style.cursor=""};el.addEventListener("pointerup",up);el.addEventListener("pointercancel",up);
  r.setAnimationLoop(frame);
 }catch(e){el.insertAdjacentHTML("afterbegin",'<div class="err3d">Este aparelho não conseguiu abrir o modo 3D (WebGL). Tente em outro navegador.</div>');G=null}}

/* ---------- Texturas desenhadas em canvas ---------- */
const TX={};let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646};
function canvasTex(key){if(TX[key])return TX[key];const [name,...args]=key.split(":"),s=256,cv=document.createElement("canvas");cv.width=cv.height=s;const g=cv.getContext("2d");
 seed=13;for(let i=0;i<key.length;i++)seed=(seed*31+key.charCodeAt(i))%2147483646+1;DRAW[name](g,s,...args);
 const t=new T.CanvasTexture(cv);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;TX[key]=t;return t}
function tex(key,rx=1,ry=rx){const id=key+"|"+rx+"|"+ry;if(TX[id])return TX[id];const b=canvasTex(key);if(rx==1&&ry==1)return TX[id]=b;const t=b.clone();t.needsUpdate=true;t.repeat.set(rx,ry);return TX[id]=t}
function speckle(g,s,n,cols,min=1,max=3){for(let i=0;i<n;i++){g.fillStyle=cols[(rnd()*cols.length)|0];const w=min+rnd()*(max-min);g.fillRect(rnd()*s,rnd()*s,w,w)}}
function bevel(g,s,lw,light,dark){g.fillStyle=light;g.fillRect(0,0,s,lw);g.fillRect(0,0,lw,s);g.fillStyle=dark;g.fillRect(0,s-lw,s,lw);g.fillRect(s-lw,0,lw,s)}
function rivet(g,x,y,r,c){g.fillStyle="rgba(0,0,0,.35)";g.beginPath();g.arc(x+1,y+1.5,r,0,7);g.fill();g.fillStyle=c;g.beginPath();g.arc(x,y,r,0,7);g.fill();g.fillStyle="rgba(255,255,255,.55)";g.beginPath();g.arc(x-r*.3,y-r*.3,r*.35,0,7);g.fill()}
function grain(g,s,n,col,horiz){for(let k=0;k<n;k++){g.strokeStyle=col(rnd());g.lineWidth=1+rnd()*1.8;g.beginPath();const o=rnd()*s;if(horiz){g.moveTo(0,o);for(let x=0;x<=s;x+=16)g.lineTo(x,o+Math.sin(x*.035+k)*3.5)}else{g.moveTo(o,0);for(let y=0;y<=s;y+=16)g.lineTo(o+Math.sin(y*.03+k)*3,y)}g.stroke()}}
function rrect(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
const DRAW={
 /* pisos em tons de cinza: a cor de cada tema multiplica a textura */
 tGrid:(g,s)=>{g.fillStyle="#c4c4c4";g.fillRect(0,0,s,s);g.strokeStyle="rgba(255,255,255,.3)";g.lineWidth=2;for(let i=1;i<4;i++){const p=i*s/4;g.beginPath();g.moveTo(p,0);g.lineTo(p,s);g.moveTo(0,p);g.lineTo(s,p);g.stroke()}
  g.strokeStyle="rgba(255,255,255,.9)";g.lineWidth=7;g.strokeRect(3.5,3.5,s-7,s-7)},
 tChalk:(g,s)=>{g.fillStyle="#c6c6c6";g.fillRect(0,0,s,s);for(let i=0;i<24;i++){g.strokeStyle=`rgba(255,255,255,${.03+rnd()*.05})`;g.lineWidth=10+rnd()*26;g.beginPath();const y=rnd()*s;g.moveTo(-10,y);g.bezierCurveTo(s*.3,y+rnd()*40-20,s*.6,y+rnd()*40-20,s+10,y+rnd()*30-15);g.stroke()}
  g.strokeStyle="rgba(255,255,255,.85)";g.lineWidth=5;g.setLineDash([4,2.5]);g.strokeRect(5,5,s-10,s-10);g.setLineDash([])},
 tStone:(g,s)=>{g.fillStyle="#cdcdcd";g.fillRect(0,0,s,s);speckle(g,s,1100,["#c1c1c1","#d9d9d9","#b6b6b6","#d2d2d2"],1,4);bevel(g,s,8,"rgba(255,255,255,.6)","rgba(0,0,0,.34)")},
 tPlank:(g,s)=>{const n=3,w=s/n;for(let i=0;i<n;i++){g.fillStyle=["#cfcfcf","#c2c2c2","#d6d6d6"][i];g.fillRect(0,i*w,s,w);g.save();g.beginPath();g.rect(0,i*w,s,w);g.clip();grain(g,s,14,a=>`rgba(0,0,0,${.05+a*.12})`,1);g.restore();
   g.fillStyle="rgba(0,0,0,.5)";g.fillRect(0,i*w,s,3);g.fillStyle="rgba(0,0,0,.55)";for(const x of[14,s-14]){g.beginPath();g.arc(x,i*w+w/2,3.5,0,7);g.fill()}}
  g.fillStyle="rgba(0,0,0,.4)";g.fillRect(0,0,3,s);g.fillRect(s-3,0,3,s)},
 tSoil:(g,s)=>{g.fillStyle="#c9c9c9";g.fillRect(0,0,s,s);speckle(g,s,1500,["#b9b9b9","#d6d6d6","#adadad","#dedede"],1,4);for(let i=0;i<5;i++){g.fillStyle="rgba(0,0,0,.09)";g.fillRect(0,20+i*48+rnd()*8,s,7)}
  for(let i=0;i<10;i++){g.fillStyle=["#e6e6e6","#a3a3a3"][i%2];g.beginPath();g.ellipse(rnd()*s,rnd()*s,3+rnd()*4,2+rnd()*3,rnd()*3,0,7);g.fill()}bevel(g,s,7,"rgba(255,255,255,.35)","rgba(0,0,0,.4)")},
 tEpoxy:(g,s)=>{g.fillStyle="#c8c8c8";g.fillRect(0,0,s,s);speckle(g,s,500,["#d4d4d4","#bcbcbc"],1,2);g.strokeStyle="rgba(255,255,255,.55)";g.lineWidth=5;g.strokeRect(9,9,s-18,s-18);bevel(g,s,4,"rgba(255,255,255,.4)","rgba(0,0,0,.35)")},
 tSlab:(g,s)=>{g.fillStyle="#c6c6c6";g.fillRect(0,0,s,s);speckle(g,s,900,["#b8b8b8","#d3d3d3","#adadad"],1,5);g.strokeStyle="rgba(0,0,0,.3)";g.lineWidth=1.5;for(let k=0;k<3;k++){g.beginPath();let x=rnd()*s,y=rnd()*s;g.moveTo(x,y);for(let i=0;i<5;i++){x+=rnd()*40-20;y+=rnd()*40-20;g.lineTo(x,y)}g.stroke()}
  bevel(g,s,10,"rgba(255,255,255,.5)","rgba(0,0,0,.45)")},
 tMetal:(g,s)=>{g.fillStyle="#c4c4c4";g.fillRect(0,0,s,s);speckle(g,s,500,["#b9b9b9","#cfcfcf"],1,3);g.strokeStyle="rgba(255,255,255,.4)";g.lineWidth=3;
  for(let y=16;y<s;y+=32)for(let x=16;x<s;x+=32){const o=((y/32)|0)%2?16:0;g.beginPath();g.moveTo(x+o-7,y+5);g.lineTo(x+o+7,y-5);g.stroke()}
  bevel(g,s,8,"rgba(255,255,255,.45)","rgba(0,0,0,.45)");[[18,18],[s-18,18],[18,s-18],[s-18,s-18]].forEach(([x,y])=>rivet(g,x,y,5,"#e6e6e6"))},
 /* chãos */
 wood:(g,s)=>{const cols=["#a98058","#a17850","#b0875e","#9a724c"],n=4,w=s/n;
  for(let i=0;i<n;i++){g.fillStyle=cols[i];g.fillRect(i*w,0,w,s);g.save();g.beginPath();g.rect(i*w,0,w,s);g.clip();grain(g,s,16,a=>`rgba(70,40,15,${.07+a*.13})`);g.restore();
   g.fillStyle="rgba(50,28,10,.5)";g.fillRect(i*w,0,2,s);const cut=rnd()*s;g.fillRect(i*w,cut,w,2);g.fillStyle="#5a3b1e";g.fillRect(i*w+8,cut+8,3,3);g.fillRect(i*w+w-11,cut+8,3,3)}},
 grass:(g,s)=>{g.fillStyle="#5d9a4b";g.fillRect(0,0,s,s);for(let i=0;i<2600;i++){g.strokeStyle=["#538c41","#6aa957","#497f38","#74b360"][(rnd()*4)|0];g.lineWidth=1+rnd();const x=rnd()*s,y=rnd()*s;g.beginPath();g.moveTo(x,y);g.lineTo(x+(rnd()-.5)*4,y-3-rnd()*5);g.stroke()}},
 water:(g,s)=>{g.fillStyle="#2f9fc6";g.fillRect(0,0,s,s);for(let i=0;i<9;i++){g.fillStyle=`rgba(20,110,150,${.1+rnd()*.12})`;g.beginPath();g.ellipse(rnd()*s,rnd()*s,30+rnd()*50,8+rnd()*12,0,0,7);g.fill()}
  for(let k=0;k<14;k++){g.strokeStyle=`rgba(190,240,255,${.25+rnd()*.35})`;g.lineWidth=2+rnd()*2.5;const y=(k+.5)*s/14,ph=rnd()*6,x0=rnd()*s,len=40+rnd()*90;g.beginPath();for(let x=0;x<=len;x+=6){const yy=y+Math.sin((x0+x)*Math.PI*4/s+ph)*4;x?g.lineTo((x0+x)%s,yy):g.moveTo(x0+x,yy);if((x0+x)%s<6&&x)g.moveTo((x0+x)%s,yy)}g.stroke()}},
 concrete:(g,s)=>{g.fillStyle="#586178";g.fillRect(0,0,s,s);speckle(g,s,1500,["#4f586e","#616a82","#687189","#495267"],1,3);g.strokeStyle="rgba(0,0,0,.4)";g.lineWidth=2;g.strokeRect(0,0,s,s);
  g.lineWidth=1;g.beginPath();let x=rnd()*s,y=0;g.moveTo(x,y);while(y<s){x+=(rnd()-.5)*30;y+=20;g.lineTo(x,y)}g.stroke()},
 floorLight:(g,s)=>{g.fillStyle="#bcc3cc";g.fillRect(0,0,s,s);speckle(g,s,1300,["#b2b9c2","#c6cdd6","#a9b0ba","#cdd3db"],1,3);g.strokeStyle="rgba(60,70,85,.45)";g.lineWidth=3;g.strokeRect(0,0,s,s)},
 /* laterais da base */
 woodSide:(g,s)=>{g.fillStyle="#7b4f2a";g.fillRect(0,0,s,s);grain(g,s,30,a=>`rgba(40,20,5,${.1+a*.2})`,1)},
 stoneSide:(g,s)=>{g.fillStyle="#7c766a";g.fillRect(0,0,s,s);const bh=s/4;for(let r=0;r<4;r++){const o=r%2?s/6:0;for(let x=-o;x<s;x+=s/3){g.fillStyle=["#a39b8c","#968e80","#aea697"][(rnd()*3)|0];g.fillRect(x+3,r*bh+3,s/3-6,bh-6)}}},
 dirtSide:(g,s)=>{g.fillStyle="#7a5232";g.fillRect(0,0,s,s);speckle(g,s,1200,["#6b462a","#8a5f3c","#5e3d24","#93684a"],1,5);g.fillStyle="#5f9445";g.fillRect(0,0,s,s*.14);for(let x=0;x<s;x+=6)g.fillRect(x,s*.14,4,4+rnd()*8)},
 metalSide:(g,s)=>{g.fillStyle="#353d4d";g.fillRect(0,0,s,s);g.strokeStyle="rgba(0,0,0,.55)";g.lineWidth=4;for(let x=0;x<s;x+=s/2)g.strokeRect(x,0,s/2,s);for(let x=0;x<s;x+=s/2){rivet(g,x+16,16,5,"#6c7686");rivet(g,x+s/2-16,s-16,5,"#6c7686")}},
 matSide:(g,s)=>{g.fillStyle="#24364f";g.fillRect(0,0,s,s);g.fillStyle="rgba(255,255,255,.14)";g.fillRect(0,0,s,10);g.fillStyle="rgba(0,0,0,.3)";g.fillRect(0,s-14,s,14)},
 pierSide:(g,s)=>{g.fillStyle="#5d4530";g.fillRect(0,0,s,s);for(let x=0;x<s;x+=s/5){g.fillStyle=["#644a33","#57402c","#6b5038"][(rnd()*3)|0];g.fillRect(x+2,0,s/5-4,s)}grain(g,s,20,a=>`rgba(20,10,0,${.1+a*.2})`)},
 /* obstáculos */
 cardboard:(g,s)=>{g.fillStyle="#c79a62";g.fillRect(0,0,s,s);for(let x=0;x<s;x+=6){g.fillStyle=`rgba(120,80,40,${.05+rnd()*.06})`;g.fillRect(x,0,2,s)}
  g.fillStyle="#dcbf92";g.fillRect(s*.4,0,s*.2,s);g.fillStyle="rgba(255,255,255,.3)";g.fillRect(s*.4,0,3,s);g.strokeStyle="rgba(80,50,20,.55)";g.lineWidth=5;g.strokeRect(2,2,s-4,s-4);
  g.fillStyle="rgba(60,40,20,.75)";g.beginPath();g.moveTo(22,s-28);g.lineTo(36,s-52);g.lineTo(50,s-28);g.fill();g.fillRect(31,s-30,10,14);g.beginPath();g.moveTo(58,s-28);g.lineTo(72,s-52);g.lineTo(86,s-28);g.fill();g.fillRect(67,s-30,10,14)},
 hedge:(g,s)=>{g.fillStyle="#3f7a35";g.fillRect(0,0,s,s);for(let i=0;i<750;i++){g.fillStyle=["#356c2c","#4b8c3f","#5a9e4a","#2e5e27","#68ad55"][(rnd()*5)|0];g.beginPath();g.ellipse(rnd()*s,rnd()*s,3+rnd()*6,2+rnd()*4,rnd()*3,0,7);g.fill()}},
 hay:(g,s)=>{g.fillStyle="#d8b04a";g.fillRect(0,0,s,s);for(let i=0;i<1800;i++){g.strokeStyle=["#c99d3a","#e8c463","#b8892c","#f0d27a"][(rnd()*4)|0];g.lineWidth=1+rnd()*1.5;const x=rnd()*s,y=rnd()*s,a=(rnd()-.5)*.6;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*14,y+Math.sin(a)*14);g.stroke()}
  g.fillStyle="#7a4f25";g.fillRect(s*.28,0,6,s);g.fillRect(s*.7,0,6,s)},
 crate:(g,s,base="#4b5563",lite="#545e6d",dark="#434b58")=>{g.fillStyle=base;g.fillRect(0,0,s,s);speckle(g,s,500,[dark,lite],1,3);const y0=s*.42,h=s*.16;
  g.save();g.beginPath();g.rect(0,y0,s,h);g.clip();g.fillStyle="#f2b400";g.fillRect(0,y0,s,h);g.fillStyle="#1d1d1d";for(let x=-s;x<s*2;x+=28){g.beginPath();g.moveTo(x,y0);g.lineTo(x+14,y0);g.lineTo(x+14+h,y0+h);g.lineTo(x+h,y0+h);g.fill()}g.restore();
  bevel(g,s,9,"rgba(255,255,255,.25)","rgba(0,0,0,.5)");[[20,20],[s-20,20],[20,s-20],[s-20,s-20]].forEach(([x,y])=>rivet(g,x,y,6,"#9aa3b0"))},
 crateB:(g,s)=>DRAW.crate(g,s,"#6d86a8","#7a93b5","#627a9b"),
 wcrate:(g,s)=>{g.fillStyle="#c69c68";g.fillRect(0,0,s,s);for(let i=0;i<5;i++){g.fillStyle=`rgba(90,60,25,${.08+rnd()*.1})`;g.fillRect(0,i*s/5,s,s/5-3);g.fillStyle="rgba(60,35,10,.5)";g.fillRect(0,(i+1)*s/5-3,s,3)}
  g.strokeStyle="#a47a45";g.lineWidth=20;g.beginPath();g.moveTo(14,14);g.lineTo(s-14,s-14);g.moveTo(s-14,14);g.lineTo(14,s-14);g.stroke();g.strokeStyle="#8a6238";g.lineWidth=24;g.strokeRect(12,12,s-24,s-24);
  [[12,12],[s-12,12],[12,s-12],[s-12,s-12]].forEach(([x,y])=>rivet(g,x,y,4,"#4a3a2a"))},
 brick:(g,s)=>{g.fillStyle="#827c92";g.fillRect(0,0,s,s);const bh=s/4;for(let r=0;r<4;r++){const o=r%2?s/6:0;for(let x=-o;x<s;x+=s/3){g.fillStyle=["#b6b0c8","#aaa4bd","#c0bad0","#a39db6"][(rnd()*4)|0];g.fillRect(x+3,r*bh+3,s/3-6,bh-6);g.fillStyle="rgba(255,255,255,.16)";g.fillRect(x+3,r*bh+3,s/3-6,4)}}},
 /* marcações e efeitos */
 frame:(g,s)=>{g.fillStyle="rgba(255,90,165,.2)";g.fillRect(14,14,s-28,s-28);g.strokeStyle="#ff5aa5";g.lineWidth=13;g.setLineDash([28,18]);g.lineCap="round";g.strokeRect(14,14,s-28,s-28)},
 splat:(g,s)=>{g.fillStyle="#fff";g.beginPath();const cx=s/2,cy=s/2;for(let i=0;i<=24;i++){const a=i/24*Math.PI*2,r=s*(.36+rnd()*.1);i?g.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r):g.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r)}g.fill();
  for(let i=0;i<9;i++){const a=rnd()*7,r=s*(.42+rnd()*.06);g.beginPath();g.arc(cx+Math.cos(a)*r,cy+Math.sin(a)*r,4+rnd()*9,0,7);g.fill()}
  g.globalCompositeOperation="source-atop";g.fillStyle="rgba(0,0,0,.12)";g.beginPath();g.arc(cx+s*.08,cy+s*.08,s*.3,0,7);g.fill();g.fillStyle="rgba(255,255,255,.35)";g.beginPath();g.arc(cx-s*.12,cy-s*.12,s*.08,0,7);g.fill()},
 pit:(g,s)=>{g.fillStyle="#2a3140";g.fillRect(0,0,s,s);const gr=g.createLinearGradient(0,0,0,s);gr.addColorStop(0,"#05070b");gr.addColorStop(1,"#141a26");g.fillStyle=gr;g.fillRect(26,10,s-52,s-44);
  g.fillStyle="rgba(0,0,0,.35)";g.fillRect(0,0,26,s);g.fillStyle="rgba(255,255,255,.07)";g.fillRect(s-26,0,26,s);g.fillStyle="rgba(255,255,255,.12)";g.fillRect(26,s-34,s-52,34)},
 pitShade:(g,s)=>{const sh=(x0,y0,x1,y1)=>{const gr=g.createLinearGradient(x0,y0,x1,y1);gr.addColorStop(0,"rgba(8,25,40,.75)");gr.addColorStop(1,"rgba(8,25,40,0)");g.fillStyle=gr;g.fillRect(0,0,s,s)};
  sh(0,0,0,70);sh(0,0,60,0);sh(s,0,s-34,0);sh(0,s,0,s-26)},
 swirl:(g,s)=>{g.translate(s/2,s/2);for(let arm=0;arm<3;arm++){g.rotate(Math.PI*2/3);for(let i=0;i<60;i++){const a=i*.12,r=6+i*1.9;g.fillStyle=`rgba(255,255,255,${.9-i*.013})`;g.beginPath();g.arc(Math.cos(a)*r,Math.sin(a)*r,7-i*.08,0,7);g.fill()}}},
 glow:(g,s)=>{const gr=g.createRadialGradient(s/2,s/2,4,s/2,s/2,s/2);gr.addColorStop(0,"rgba(255,255,255,.95)");gr.addColorStop(.5,"rgba(255,255,255,.35)");gr.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=gr;g.fillRect(0,0,s,s)},
 belt:(g,s)=>{g.fillStyle="#2b2f36";g.fillRect(0,0,s,s);g.strokeStyle="#474d57";g.lineWidth=10;for(let x=-20;x<s+40;x+=64){g.beginPath();g.moveTo(x,20);g.lineTo(x+30,s/2);g.lineTo(x,s-20);g.stroke()}},
 ruler:(g,s)=>{g.fillStyle="#f4e04d";g.fillRect(0,0,s,s);g.fillStyle="#222";for(let i=0;i<=40;i++){const x=i*s/40;g.fillRect(x,0,1.5,i%10==0?s*.5:i%5==0?s*.35:s*.2)}},
 door:(g,s,col)=>{g.fillStyle=col;g.fillRect(0,0,s,s);g.strokeStyle=shade(col,-.3);g.lineWidth=14;g.strokeRect(16,16,s-32,s-32);g.fillStyle=shade(col,.25);g.fillRect(28,28,s-56,10);
  g.fillStyle="#1b2230";g.beginPath();g.arc(s/2,s*.44,26,0,7);g.fill();g.beginPath();g.moveTo(s/2-13,s*.5);g.lineTo(s/2+13,s*.5);g.lineTo(s/2+20,s*.74);g.lineTo(s/2-20,s*.74);g.fill();
  [[30,30],[s-30,30],[30,s-30],[s-30,s-30]].forEach(([x,y])=>rivet(g,x,y,6,shade(col,.4)))},
 doorTop:(g,s,col)=>{g.fillStyle=shade(col,-.12);g.fillRect(0,0,s,s);g.strokeStyle=shade(col,.3);g.lineWidth=12;g.strokeRect(18,18,s-36,s-36);g.strokeStyle="#1b2230";g.lineWidth=14;g.lineCap="round";g.beginPath();g.arc(s/2,s*.42,30,Math.PI*1.05,Math.PI*1.95);g.stroke();g.fillStyle="#1b2230";rrect(g,s/2-50,s*.44,100,74,12);g.fill()},
 opt:(g,s,n,col)=>{g.fillStyle=col;rrect(g,14,14,s-28,s-28,34);g.fill();g.strokeStyle="#fff";g.lineWidth=12;rrect(g,20,20,s-40,s-40,30);g.stroke();
  g.fillStyle="#fff";g.font="800 170px Arial,Helvetica,sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText(n,s/2,s/2+10)},
 lbl:(g,s,txt,col)=>{g.font="800 150px Arial,Helvetica,sans-serif";g.textAlign="center";g.textBaseline="middle";g.lineJoin="round";g.lineWidth=22;g.strokeStyle=col.charAt(1)>"8"?"rgba(10,20,35,.55)":"rgba(255,255,255,.7)";g.strokeText(txt,s/2,s/2+8);g.fillStyle=col;g.fillText(txt,s/2,s/2+8)},
 robot:(g,s,col)=>{g.fillStyle=col;g.fillRect(0,0,s,s);speckle(g,s,700,[shade(col,-.05),shade(col,.08),shade(col,-.1)],1,3);
  for(let i=0;i<10;i++){g.strokeStyle="rgba(60,40,10,.25)";g.lineWidth=1;g.beginPath();const x=rnd()*s,y=rnd()*s;g.moveTo(x,y);g.lineTo(x+rnd()*14-7,y+rnd()*6);g.stroke()}
  g.strokeStyle=shade(col,-.38);g.lineWidth=4;g.strokeRect(12,12,s-24,s-24);[[26,26],[s-26,26],[26,s-26],[s-26,s-26]].forEach(([x,y])=>rivet(g,x,y,6,"#d5d9df"))},
 steel:(g,s)=>{g.fillStyle="#5b626c";g.fillRect(0,0,s,s);for(let y=0;y<s;y+=2){g.fillStyle=`rgba(255,255,255,${rnd()*.07})`;g.fillRect(0,y,s,1)}},
 tread:(g,s)=>{g.fillStyle="#26282c";g.fillRect(0,0,s,s);for(let y=0;y<s;y+=s/8){g.fillStyle="#3d4047";g.fillRect(0,y,s,s/16);g.fillStyle="rgba(0,0,0,.45)";g.fillRect(0,y+s/16,s,3)}}
};

/* ---------- Temas ---------- */
const THEMES={
 oficina:{bg:0xd8c8ae,hemi:[0xfff4e0,0x8b7355,.8],sun:[0xfff1da,.62],ground:"wood",gRep:26,gy:-.72,side:"matSide",rim:0x2a4672,tile:"tGrid",tint:[0x5286cc,0x4576bb],obs:"cardboard",label:"#e6efff",dust:0xc79a62,decor:"oficina"},
 lousa:{bg:0xd8c8ae,hemi:[0xfff4e0,0x8b7355,.8],sun:[0xfff1da,.62],ground:"wood",gRep:26,gy:-.72,side:"woodSide",rim:0x8f6238,tile:"tChalk",tint:[0x3f806a,0x37735f],obs:"cardboard",label:"#fff6e2",dust:0xeeeeee,decor:"oficina",chalk:1},
 patio:{bg:0xbde3f8,hemi:[0xeef8ff,0x6a8548,.78],sun:[0xffffff,.62],ground:"grass",gRep:34,gy:-.72,side:"stoneSide",rim:0xc6c0b4,tile:"tStone",tint:[0x94a0b3,0x8490a4],obs:"hedge",label:"#27313f",dust:0x6aa84f,decor:"patio"},
 jardim:{bg:0xbde3f8,hemi:[0xeef8ff,0x6a8548,.78],sun:[0xffffff,.62],ground:"grass",gRep:34,gy:-.72,side:"stoneSide",rim:0xcfc4ae,tile:"tStone",tint:[0xa89c8e,0x9a8e80],obs:"hedge",label:"#33291c",dust:0x6aa84f,decor:"patio"},
 praia:{bg:0xb2e7f6,hemi:[0xf2fbff,0x4f8fa8,.82],sun:[0xfffbee,.66],ground:"water",gRep:26,gy:-1.5,water:1,side:"pierSide",rim:0x6b4e36,tile:"tPlank",tint:[0xb48d64,0xa67f58],obs:"wcrate",label:"#fff3da",dust:0xbfeaf7,decor:"praia"},
 fazenda:{bg:0xf4e2bd,hemi:[0xfff3dc,0x7d6238,.8],sun:[0xffdcaa,.7],ground:"grass",gRep:34,gcol:0xe6ecb8,gy:-.72,side:"dirtSide",rim:0x6f9c4a,tile:"tSoil",tint:[0xa5714a,0x966540],obs:"hay",label:"#22310f",dust:0xd8b04a,decor:"fazenda"},
 fabrica:{bg:0xc3cad3,hemi:[0xffffff,0x77808c,.8],sun:[0xffffff,.58],ground:"floorLight",gRep:22,gcol:0xaab2bd,gy:-.72,side:"metalSide",rim:0x48525f,tile:"tEpoxy",tint:[0x4fa27e,0x449672],obs:"crateB",label:"#eef3f8",dust:0x9aa3b0,decor:"fabrica"},
 castelo:{bg:0x8a7cc2,hemi:[0xdcd2ff,0x4a4066,.8],sun:[0xffdcb8,.66],ground:"grass",gRep:34,gcol:0x9fb8b4,gy:-.72,side:"stoneSide",scol:0xc4bcd8,rim:0x8e889d,tile:"tSlab",tint:[0x857da6,0x777097],obs:"brick",label:"#f3eeff",dust:0xb0a8c0,decor:"castelo"},
 torre:{bg:0x1d2a55,hemi:[0xc4ceff,0x2f3860,.86],sun:[0xd8deff,.52],ground:"concrete",gRep:24,gy:-.72,side:"metalSide",rim:0x46537a,tile:"tMetal",tint:[0xe9eefc,0xd3dcf4],obs:"crate",label:"#dbe3ff",dust:0x8892a0,decor:"torre"}
};
const themeOf=i=>THEMES[WORLDS[LEVELS[i].w].th];

function label(txt,size,color){const sp=new T.Sprite(new T.SpriteMaterial({map:canvasTex("lbl:"+txt+":"+color),transparent:true,depthWrite:false}));BUCKET.push(sp.material);sp.scale.set(size,size,1);return sp}
function starGeo(){const s=new T.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,rr=i%2?.13:.3;const x=Math.cos(a)*rr,y=Math.sin(a)*rr;i?s.lineTo(x,y):s.moveTo(x,y)}
 const g=new T.ExtrudeGeometry(s,{depth:.08,bevelEnabled:true,bevelSize:.02,bevelThickness:.02,bevelSegments:1});g.center();return g}

/* ---------- Robô: corpo industrial, esteiras, braços e olhos de lente ---------- */
function buildRobot(){if(G.robot){G.scene.remove(G.robot);G.robot.traverse(o=>{if(o.geometry)o.geometry.dispose()});G.rb.forEach(m=>m.dispose());G.rb.length=0;G.rtex.forEach(t=>t.dispose());G.rtex.length=0}
 const col=SKINS[save.skin]||SKINS.amarelo;G.skin=save.skin;BUCKET=G.rb;
 const root=new T.Group(),chassis=new T.Group();
 const gold=save.skin=="dourado",Y=M({map:tex("robot:"+col),roughness:gold?.28:.5,metalness:gold?.45:.2,emissive:gold?0x6b4300:0,emissiveIntensity:gold?.55:0}),Yp=M({color:new T.Color(shade(col,-.07)),roughness:gold?.28:.45,metalness:gold?.45:.2,emissive:gold?0x6b4300:0,emissiveIntensity:gold?.5:0}),S=M({map:tex("steel"),roughness:.4,metalness:.6}),D=M({color:0x24282f,roughness:.6}),
  eyeM=M({color:0x8ff0ff,emissive:0x33ccff,emissiveIntensity:1.3,roughness:.15});
 const add=(par,geo,m,x,y,z,sh=true)=>{const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=sh;par.add(o);return o};
 const tracks=[],hubs=[];
 for(const sx of[-1,1]){const tt=canvasTex("tread").clone();tt.needsUpdate=true;tt.repeat.set(1,2);G.rtex.push(tt);const tm=M({map:tt,roughness:.95});add(root,box(.15,.2,.6),[S,S,tm,tm,tm,tm],sx*.29,.1,0);tracks.push({tex:tt,side:sx});
  for(const z of[-.2,.2]){const h=new T.Group();h.position.set(sx*.37,.1,z);root.add(h);add(h,cyl(.075,.075,.025,16).rotateZ(Math.PI/2),Y,0,0,0,false);add(h,box(.03,.11,.025),D,sx*.006,0,0,false);hubs.push({g:h,side:sx})}}
 const AX=.2,cy=v=>v-AX;chassis.position.y=AX;root.add(chassis);
 add(chassis,box(.4,.1,.42),S,0,cy(.22),0);
 add(chassis,box(.5,.34,.4),Y,0,cy(.44),0);
 add(chassis,box(.34,.2,.03),Yp,0,cy(.45),-.21);
 for(const yy of[.5,.44])add(chassis,box(.2,.035,.02),D,0,cy(yy),-.228,false);
 add(chassis,cyl(.035,.035,.02,14).rotateX(Math.PI/2),M({color:0x2bd46b,emissive:0x2bd46b,emissiveIntensity:.8}),.11,cy(.385),-.228,false);
 const arms=[];for(const sx of[-1,1]){add(chassis,sph(.065,12,10),S,sx*.27,cy(.55),0);
  const arm=new T.Group();arm.position.set(sx*.32,cy(.56),0);chassis.add(arm);
  add(arm,box(.14,.12,.17),Y,sx*.01,.02,0);add(arm,cyl(.028,.028,.14,8),S,0,-.1,0);
  add(arm,box(.1,.14,.11),Y,0,-.22,0);add(arm,box(.07,.05,.07),D,0,-.31,-.01);arms.push({g:arm,side:sx})}
 add(chassis,cyl(.05,.06,.07,10),S,0,cy(.645),0);
 const head=new T.Group();head.position.set(0,cy(.79),0);chassis.add(head);
 add(head,box(.36,.25,.3),Y,0,0,0);add(head,box(.31,.14,.02),D,0,.015,-.155);
 add(head,box(.13,.03,.015),S,0,-.085,-.155,false);
 for(const sx of[-1,1])add(head,cyl(.045,.045,.04,12).rotateZ(Math.PI/2),S,sx*.19,0,0);
 const eyes=[];for(const ex of[-.075,.075]){add(head,new T.TorusGeometry(.05,.014,8,20),S,ex,.015,-.168,false);const e=add(head,new T.CircleGeometry(.041,20),eyeM,ex,.015,-.169,false);e.rotation.y=Math.PI;eyes.push(e)}
 const ant=new T.Group();ant.position.y=.125;head.add(ant);
 add(ant,cyl(.013,.013,.16),S,0,.08,0);const ball=add(ant,sph(.04,12,8),M({color:0xff5a3d,emissive:0xff3b1f,emissiveIntensity:.6}),0,.17,0);
 root.userData={chassis,ant,ball,wheels:hubs,tracks,arms,eyes,eyeM,head};root.scale.setScalar(RS);G.robot=root;G.scene.add(root)}

/* ---------- Enfeites de cada tema ---------- */
const DECOR={
 oficina(gy,sw,sd,R0,ring,th){
  const pen=new T.Group();pen.position.set(-sw/2-.3,gy+.18,sd/2+1.1);pen.rotation.y=.35;G.stat.add(pen);
  mesh(cyl(.18,.18,4,6).rotateZ(Math.PI/2),M({color:0xf5c518,roughness:.5}),0,0,0,{to:pen});
  mesh(new T.ConeGeometry(.18,.5,6).rotateZ(-Math.PI/2),M({color:0xe8c99a}),2.25,0,0,{to:pen});
  mesh(new T.ConeGeometry(.05,.14,6).rotateZ(-Math.PI/2),M({color:0x333333}),2.47,0,0,{to:pen});
  mesh(cyl(.18,.18,.3,12).rotateZ(Math.PI/2),M({color:0xf48aa0}),-2.15,0,0,{to:pen});
  mesh(box(5.5,.05,.8),M({map:tex("ruler"),roughness:.5}),sw/2+1.5,gy+.025,1.2,{ry:Math.PI/2+.12});
  const mx=sw/2+1.7,mz=-sd/2-1.1,white=M({color:0xf4f4f4,roughness:.3});
  mesh(cyl(.35,.3,.8,20),white,mx,gy+.4,mz);mesh(new T.TorusGeometry(.2,.06,8,16),white,mx+.38,gy+.45,mz,{ry:Math.PI/2});mesh(cyl(.29,.29,.02,20),M({color:0x5a3a22,roughness:.3}),mx,gy+.797,mz,{cast:false});
  if(th.chalk){[0xffffff,0xffd166,0x8ecae6].forEach((c,i)=>mesh(cyl(.07,.07,.7,8).rotateZ(Math.PI/2),M({color:c,roughness:.95}),-sw/2-1.5+i*.12,gy+.07,-sd/2-.5+i*.3,{ry:.3+i*.4}));
   mesh(box(1.1,.2,.5),M({color:0x9b6b43}),-sw/2-2,gy+.24,.8,{ry:.5});mesh(box(1.1,.14,.5),M({color:0x39424e}),-sw/2-2,gy+.07,.8,{ry:.5})}
  else{const tb=mesh(box(1.6,.8,.8),M({color:0xc8372d,roughness:.5,metalness:.3}),-sw/2-2.2,gy+.4,-sd/2-.6,{ry:.3});mesh(new T.TorusGeometry(.3,.05,8,16,Math.PI),M({color:0x222222}),tb.position.x,gy+.8,tb.position.z,{ry:.3});
   const sx=-sw/2-1.5;mesh(cyl(.45,.45,.5,18),M({color:0x2f80ed}),sx,gy+.25,1.8);mesh(cyl(.55,.55,.06,18),M({color:0x9aa3b0,metalness:.5}),sx,gy+.53,1.8)}
  const sm=M({color:0xb5bcc6,metalness:.7,roughness:.3});ring(14,(x,z)=>mesh(cyl(.04,.04,.25,6).rotateZ(Math.PI/2),sm,x,gy+.04,z,{ry:rnd()*6,cast:false}),R0+.3,R0+4)},
 patio(gy,sw,sd,R0,ring){
  const trunkM=M({color:0x7a5230}),leafs=[0x4f9a3f,0x5fae4a,0x3f8a35].map(c=>M({color:c,flatShading:true}));
  ring(9,(x,z)=>{const s=.8+rnd()*.7;mesh(cyl(.12*s,.16*s,1.4*s,8),trunkM,x,gy+.7*s,z);
   for(let k=0;k<3;k++)mesh(new T.IcosahedronGeometry((.75-k*.15)*s,0),leafs[k],x+(rnd()-.5)*.3,gy+(1.5+k*.55)*s,z+(rnd()-.5)*.3,{ry:rnd()*3})},R0+1.6,R0+9,true);
  ring(9,(x,z)=>mesh(new T.IcosahedronGeometry(.3+rnd()*.3,0),leafs[(rnd()*3)|0],x,gy+.22,z),R0+.2,R0+5);
  const bx=sw/2+1.5,bz=-1,wm=M({color:0xb07a45}),im=M({color:0x555c66});for(const k of[0,1,2])mesh(box(.25,.06,2),wm,bx+k*.28,gy+.5,bz);mesh(box(.9,.5,.08),im,bx+.28,gy+.25,bz-.9);mesh(box(.9,.5,.08),im,bx+.28,gy+.25,bz+.9);
  mesh(sph(.25,16,12),M({color:0xffffff,roughness:.5}),-sw/2-1.3,gy+.25,sd/2+.7);
  const fl=[0xff6b6b,0xffd166,0xf78fb3,0xffffff].map(c=>M({color:c}));ring(18,(x,z,i)=>mesh(sph(.07,8,6),fl[i%4],x,gy+.07,z,{cast:false}),R0+.1,R0+4.5)},
 praia(gy,sw,sd,R0,ring){
  const wood=M({color:0x5a432e}),hx=sw/2-.3,hz=sd/2-.3,nx=Math.max(1,Math.round(hx/1.5)),nz=Math.max(1,Math.round(hz/1.5));
  for(let i=0;i<=nx*2;i++)for(const sz of[-1,1])mesh(cyl(.14,.14,1.3,8),wood,-hx+i*hx/nx,-1.2,sz*hz);
  for(let i=1;i<nz*2;i++)for(const sx of[-1,1])mesh(cyl(.14,.14,1.3,8),wood,sx*hx,-1.2,-hz+i*hz/nz);
  const red=M({color:0xe2503f,roughness:.5}),white=M({color:0xf7f7f7,roughness:.5});
  ring(4,(x,z)=>{const b=new T.Group();b.position.set(x,gy,z);G.stat.add(b);mesh(sph(.3,14,10),red,0,.05,0,{to:b});mesh(cyl(.31,.31,.12,14),white,0,.08,0,{to:b});mesh(cyl(.03,.03,.5,6),white,0,.5,0,{to:b});G.bob.push({o:b,y0:gy,ph:rnd()*6,amp:.06})},R0+.8,R0+5);
  const boat=new T.Group();boat.position.set(sw/2+2.4,gy,1);boat.rotation.y=.5;G.stat.add(boat);const bm=M({color:0x2e7fb8}),bi=M({color:0xe8d7b5});
  mesh(box(1.9,.36,.8),bm,0,.12,0,{to:boat});mesh(box(1.6,.1,.56),bi,0,.28,0,{to:boat,cast:false});mesh(new T.ConeGeometry(.4,.6,4).rotateZ(-Math.PI/2).rotateX(Math.PI/4),bm,1.2,.12,0,{to:boat});mesh(box(.14,.06,.7),wood,-.2,.36,0,{to:boat});
  G.bob.push({o:boat,y0:gy,ph:1.3,amp:.05,roll:.05});
  const ix=-sw/2-7,iz=-sd/2-6,sand=M({color:0xf1ddb0});const isl=mesh(sph(4.2,24,12),sand,ix,gy-.35,iz,{cast:false,recv:true});isl.scale.y=.22;
  const trunk=M({color:0x8a6a45}),leaf=M({color:0x3f9a4a,flatShading:true});
  for(const [dx,dz,h,lean] of[[0,0,2.6,.18],[1.3,.6,2,-.2]]){const tr=mesh(cyl(.1,.15,h,7),trunk,ix+dx,gy+.4+h/2,iz+dz,{rz:lean});
   for(let k=0;k<6;k++){const a=k*Math.PI/3,lf=mesh(new T.ConeGeometry(.22,1.3,4),leaf,ix+dx-lean*h*.5+Math.cos(a)*.5,gy+.35+h,iz+dz+Math.sin(a)*.5);lf.rotation.set(Math.sin(a)*1.25,0,-Math.cos(a)*1.25)}}
  mesh(cyl(.03,.03,1.5,6),white,ix+2.4,gy+1,iz+1.6);const um=mesh(new T.ConeGeometry(.95,.45,10),red,ix+2.4,gy+1.85,iz+1.6);
  const lb=mesh(new T.TorusGeometry(.26,.09,8,18),M({color:0xff8a2a,roughness:.6}),sw/2-.05,.42,-sd/2+.05,{ry:Math.PI/4});mesh(cyl(.05,.05,1,8),wood,sw/2-.2,.2,-sd/2+.2)},
 fazenda(gy,sw,sd,R0,ring){
  const postM=M({color:0x8a6239}),m=.5,fx=sw/2+m,fz=sd/2+m;
  const post=(x,z)=>mesh(box(.12,.8,.12),postM,x,gy+.4,z);
  for(let x=-fx;x<=fx+.01;x+=fx/Math.ceil(fx)){post(x,-fz);post(x,fz)}for(let z=-fz;z<=fz+.01;z+=fz/Math.ceil(fz)){post(-fx,z);post(fx,z)}
  for(const h of[.3,.6]){mesh(box(fx*2,.06,.04),postM,0,gy+h,-fz);mesh(box(fx*2,.06,.04),postM,0,gy+h,fz);mesh(box(.04,.06,fz*2),postM,-fx,gy+h,0);mesh(box(.04,.06,fz*2),postM,fx,gy+h,0)}
  const rowM=M({color:0x4f8f37,flatShading:true}),soil=M({color:0x7a5232});
  for(let i=0;i<8;i++){const z=-fz-1.2-i*.9;mesh(box(26,.05,.55),soil,0,gy+.03,z,{cast:false});mesh(box(25.5,.3,.25),rowM,0,gy+.2,z,{cast:false})}
  const sx=fx+3.6,sz=-fz-3.5;mesh(cyl(1.2,1.2,4.2,20),M({color:0xc9ced6,metalness:.5,roughness:.4}),sx,gy+2.1,sz);mesh(new T.ConeGeometry(1.35,1,20),M({color:0xb03a2e}),sx,gy+4.7,sz);
  const bx=-fx-3.6,bz=-fz-2.6,barn=M({color:0xb5382c}),wt=M({color:0xf3ece0});
  mesh(box(3,2,2.4),barn,bx,gy+1,bz);const rf=mesh(cyl(1.85,1.85,2.7,3),M({color:0x6b4a3a,flatShading:true}),bx,gy+2.42,bz,{rx:-Math.PI/2});rf.scale.z=.45;
  mesh(box(.9,1.2,.06),wt,bx,gy+.6,bz+1.22,{cast:false});mesh(box(.7,1,.07),barn,bx,gy+.55,bz+1.23,{cast:false});
  const hayM=M({map:tex("hay",2,1)});ring(5,(x,z)=>mesh(cyl(.45,.45,.7,16).rotateZ(Math.PI/2),hayM,x,gy+.45,z,{ry:rnd()*3}),R0+1,R0+5)},
 fabrica(gy,sw,sd,R0,ring){
  const dark=M({color:0x39424e,metalness:.4,roughness:.6}),yel=M({color:0xf2b400,roughness:.5,metalness:.2}),cz=-sd/2-2.1,len=sw+6;
  mesh(box(len,.42,1.1),dark,0,gy+.45,cz);for(let x=-len/2+.5;x<=len/2;x+=2)mesh(box(.14,.3,.9),dark,x,gy+.15,cz);
  const bt=canvasTex("belt").clone();bt.needsUpdate=true;bt.repeat.set(len/1.2,1);G.ltex.push(bt);mesh(box(len,.04,.9),M({map:bt,roughness:.9}),0,gy+.68,cz,{cast:false,recv:true});G.scroll.push({t:bt,vx:-.33,vy:0});
  const cb=M({map:tex("cardboard")});for(let i=0;i<4;i++){const b=mesh(box(.5,.42,.5),cb,0,gy+.91,cz);G.conv.push({o:b,len,off:i*len/4,v:.4})}
  const arm=new T.Group();arm.position.set(sw/2+1.9,gy,-sd/2-.3);G.stat.add(arm);mesh(cyl(.45,.55,.3,16),dark,0,.15,0,{to:arm});
  const a1=new T.Group();a1.position.y=.3;arm.add(a1);mesh(box(.28,1.5,.28),yel,0,.75,0,{to:a1});const a2=new T.Group();a2.position.y=1.5;a2.rotation.z=1.1;a1.add(a2);
  mesh(sph(.19),dark,0,0,0,{to:a2});mesh(box(.22,1.2,.22),yel,0,.6,0,{to:a2});mesh(box(.34,.1,.14),dark,0,1.24,0,{to:a2});mesh(box(.06,.22,.12),dark,-.14,1.38,0,{to:a2});mesh(box(.06,.22,.12),dark,.14,1.38,0,{to:a2});
  G.sway.push({o:a1,ax:"y",base:-.6,amp:.5,sp:.5},{o:a2,ax:"z",base:1.1,amp:.22,sp:.9});
  const bl=M({color:0x2f7fd0,roughness:.5,metalness:.3}),orr=M({color:0xe8642c,roughness:.5,metalness:.3}),rg=M({color:0xdfe3e8,metalness:.5});
  [[-sw/2-1.5,1.2,bl],[-sw/2-2.2,.7,orr],[-sw/2-1.7,.3,bl]].forEach(([x,z,m])=>{mesh(cyl(.33,.33,.85,16),m,x,gy+.425,z);mesh(cyl(.345,.345,.05,16),rg,x,gy+.62,z,{cast:false});mesh(cyl(.345,.345,.05,16),rg,x,gy+.24,z,{cast:false})});
  const px=sw/2+2,pz=1.6;mesh(box(1.3,.14,1.3),M({color:0xb07a45}),px,gy+.07,pz);for(const [dx,dy,dz] of[[-.3,.35,-.3],[.3,.35,-.3],[-.3,.35,.3],[.3,.35,.3],[0,.85,0]])mesh(box(.56,.48,.56),cb,px+dx,gy+dy,pz+dz,{ry:rnd()*.2});
  const ln=MB({color:0xf2b400});for(const s of[-1,1]){mesh(box(sw+2.6,.012,.12),ln,0,gy+.008,s*(sd/2+.9),{cast:false});mesh(box(.12,.012,sd+2.6),ln,s*(sw/2+.9),gy+.008,0,{cast:false})}},
 castelo(gy,sw,sd,R0,ring){
  const br=M({map:tex("brick",5,1.5)}),brT=M({map:tex("brick",1.4,2.4)}),roof=M({color:0x8a3550,flatShading:true}),wz=-sd/2-2.2,wl=sw+5;
  mesh(box(wl,2.2,.6),br,0,gy+1.1,wz);const mm=M({map:tex("brick",.5,.3)});for(let x=-wl/2+.3;x<=wl/2;x+=.9)mesh(box(.5,.36,.62),mm,x,gy+2.38,wz);
  mesh(box(1.5,1.5,.1),M({color:0x2a2236}),0,gy+.75,wz+.31,{cast:false});mesh(new T.CircleGeometry(.75,18,0,Math.PI),M({color:0x2a2236}),0,gy+1.5,wz+.362,{cast:false});
  for(const s of[-1,1]){const tx=s*(wl/2+.4);mesh(cyl(1.1,1.15,3.7,16),brT,tx,gy+1.85,wz);mesh(new T.ConeGeometry(1.4,1.5,16),roof,tx,gy+4.45,wz);
   mesh(cyl(.03,.03,.9,6),M({color:0xdddddd}),tx,gy+5.6,wz);mesh(box(.5,.3,.02),M({color:0xf2b000}),tx+.27,gy+5.85,wz,{cast:false});
   const bn=mesh(box(.7,1.2,.04),M({color:0xb5324a}),s*wl/4,gy+1.35,wz+.33,{cast:false});mesh(box(.7,.14,.05),M({color:0xf2b000}),s*wl/4,gy+1.88,wz+.34,{cast:false});
   const fm=M({color:0xffc24a,emissive:0xff8a1a,emissiveIntensity:1.6});const f=mesh(sph(.13,10,8),fm,s*wl/8*3.3,gy+1.75,wz+.45,{cast:false});mesh(cyl(.035,.05,.4,6),M({color:0x3a2c22}),f.position.x,gy+1.5,wz+.42,{cast:false});
   const pl=new T.PointLight(0xffa64a,.9,8,2);pl.position.set(f.position.x,gy+1.8,wz+.9);G.stat.add(pl);G.flick.push({m:fm,l:pl,ph:rnd()*9})}
  const bush=M({color:0x4a7f5a,flatShading:true});ring(8,(x,z)=>mesh(new T.IcosahedronGeometry(.3+rnd()*.25,0),bush,x,gy+.2,z),R0+.3,R0+5);
  const st=M({color:0xa7a2b3});ring(6,(x,z)=>mesh(new T.DodecahedronGeometry(.18+rnd()*.2,0),st,x,gy+.1,z,{ry:rnd()*3}),R0+.2,R0+4)},
 torre(gy,sw,sd,R0,ring){
  const tw=new T.Group();tw.position.set(-1.5,gy,-Math.max(sw,sd)/2-6);G.stat.add(tw);const bm=M({color:0xd9453a,metalness:.4,roughness:.5}),wm=M({color:0xf0f0f0,metalness:.4});
  const H=11,b0=1.6,up=new T.Vector3(0,1,0);for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.PI/4,x=Math.cos(a)*b0,z=Math.sin(a)*b0,dir=new T.Vector3(-x,H,-z),len=dir.length();
   const leg=new T.Mesh(cyl(.05,.07,len,6),i%2?bm:wm);leg.quaternion.setFromUnitVectors(up,dir.clone().normalize());leg.position.set(x/2,H/2,z/2);tw.add(leg)}
  for(let k=1;k<9;k++){const y=k*H/9,w=b0*(1-y/H)*1.42,mm=k%2?bm:wm;for(const [dx,dz,ww,dd] of[[0,w/2,w,.05],[0,-w/2,w,.05],[w/2,0,.05,w],[-w/2,0,.05,w]]){const rg=new T.Mesh(box(ww,.05,dd),mm);rg.position.set(dx,y,dz);tw.add(rg)}}
  const lampTop=M({color:0xff2a2a,emissive:0xff2a2a,emissiveIntensity:2});mesh(sph(.18,12,8),lampTop,0,H+.2,0,{to:tw,cast:false});G.blink.push(lampTop);
  const lampM=M({color:0x30353f,metalness:.6}),bulbM=M({color:0xfff2c4,emissive:0xffe08a,emissiveIntensity:1.6});
  for(const [x,z] of[[-sw/2-1,-sd/2-1],[sw/2+1,-sd/2-1],[sw/2+1,sd/2+1],[-sw/2-1,sd/2+1]]){mesh(cyl(.06,.08,3,8),lampM,x,gy+1.5,z);mesh(sph(.16,10,8),bulbM,x,gy+3.05,z,{cast:false});
   const pl=new T.PointLight(0xffd88a,.8,10,2);pl.position.set(x,gy+2.9,z);G.stat.add(pl)}
  const cm=M({map:tex("crate")});ring(6,(x,z)=>{const s=.6+rnd()*.5;mesh(box(s,s,s),cm,x,gy+s/2,z,{ry:rnd()*2})},R0+.6,R0+5);
  const pts=[];for(let i=0;i<260;i++){const a=rnd()*Math.PI*2,r=20+rnd()*30;pts.push(Math.cos(a)*r,8+rnd()*25,Math.sin(a)*r)}
  const pg=new T.BufferGeometry();pg.setAttribute("position",new T.Float32BufferAttribute(pts,3));const pm=new T.PointsMaterial({color:0xffffff,size:.18,fog:false});G.sb.push(pm);G.stat.add(new T.Points(pg,pm))}
};
function obstacle(th,x,z){let geo,y,ry=(rnd()-.5)*.16,o=th.obs;
 if(o=="cardboard"){geo=box(.84,.62,.84);y=.31}else if(o=="hedge"){geo=box(.92,.74,.92);y=.37;ry=0}else if(o=="hay"){geo=box(.9,.6,.78);y=.3}
 else if(o=="wcrate"){geo=box(.8,.8,.8);y=.4}else if(o=="brick"){geo=box(.99,.88,.99);y=.44;ry=0}else{geo=box(.86,.74,.86);y=.37;ry=0}
 const metal=o=="crate"||o=="crateB";return mesh(geo,G.obsM||(G.obsM=M({map:tex(o),roughness:metal?.5:.9,metalness:metal?.4:0})),x,y,z,{ry,recv:true})}

/* ---------- Parte fixa da fase: chão, base, piso, obstáculos, bandeira, portais ---------- */
function buildStatic(){wipe(G.stat,G.sb);(G.ltex||(G.ltex=[])).forEach(t=>t.dispose());G.ltex=[];BUCKET=G.sb;G.obsM=null;G.portals=[];G.scroll=[];G.blink=[];G.bob=[];G.conv=[];G.sway=[];G.flick=[];G.flag=G.goalGlow=null;
 const th=themeOf(lvl),S=G.stat;G.th=th;const gy=th.gy;
 G.scene.background=new T.Color(th.bg);const D=Math.max(fitView().D,BW+BH+2);G.scene.fog=new T.Fog(th.bg,D*1.25+6,D*2.6+34);
 G.hemi.color.set(th.hemi[0]);G.hemi.groundColor.set(th.hemi[1]);G.hemi.intensity=th.hemi[2];G.sun.color.set(th.sun[0]);G.sun.intensity=th.sun[1];
 const sw=BW+2.2,sd=BH+2.2,sbd=Math.max(sw,sd)/2+2;G.sun.position.set(sbd*.55,sbd*1.5+4,sbd*.7);G.sun.target.position.set(0,0,0);
 Object.assign(G.sun.shadow.camera,{left:-sbd,right:sbd,top:sbd,bottom:-sbd,near:.5,far:sbd*4+10});G.sun.shadow.camera.updateProjectionMatrix();
 let gt=tex(th.ground,th.gRep);if(th.water){gt=canvasTex("water").clone();gt.needsUpdate=true;gt.repeat.set(th.gRep,th.gRep);G.ltex.push(gt);G.scroll.push({t:gt,vx:.012,vy:.02})}
 const gr=mesh(new T.PlaneGeometry(150,150),M({map:gt,color:th.gcol||0xffffff,roughness:th.water?.35:.9,metalness:th.water?.1:0}),0,gy,0,{rx:-Math.PI/2,cast:false,recv:true});
 const sA=M({map:tex(th.side,sw/1.6,.6),color:th.scol||0xffffff}),sB=M({map:tex(th.side,sd/1.6,.6),color:th.scol||0xffffff}),rim=M({color:th.rim,roughness:.75});
 mesh(box(sw,.6,sd),[sB,sB,rim,rim,sA,sA],0,-.42,0,{cast:true,recv:true});
 const tA=M({map:tex(th.tile),color:th.tint[0],roughness:.8}),tB=M({map:tex(th.tile),color:th.tint[1],roughness:.8}),tg=box(.98,.12,.98);seed=99+lvl;
 for(let r=0;r<BH;r++)for(let c=0;c<BW;c++){const k=r+","+c,x=X(c),z=Z(r);
  if(state.holes.has(k)){if(th.water){mesh(new T.PlaneGeometry(.99,.99),MB({color:0x35a6cb}),x,-.118,z,{rx:-Math.PI/2,cast:false});mesh(new T.PlaneGeometry(.99,.99),MB({map:tex("pitShade"),transparent:true,depthWrite:false}),x,-.112,z,{rx:-Math.PI/2,cast:false})}
   else mesh(new T.PlaneGeometry(.99,.99),MB({map:tex("pit")}),x,-.116,z,{rx:-Math.PI/2,cast:false});continue}
  mesh(tg,(r+c)%2?tB:tA,x,-.06,z,{cast:false,recv:true});
  if(state.walls.has(k))obstacle(th,x,z);
  if(state.paint.has(k))mesh(new T.PlaneGeometry(.96,.96),MB({map:tex("frame"),transparent:true,depthWrite:false}),x,.006,z,{rx:-Math.PI/2,cast:false});
  if(state.goal==k){mesh(cyl(.42,.46,.06,28),M({color:0x2b3340,metalness:.5,roughness:.4}),x,.03,z,{cast:false,recv:true});
   const gm=M({color:0x2bd46b,emissive:0x2bd46b,emissiveIntensity:1.2});mesh(new T.TorusGeometry(.36,.035,8,32),gm,x,.07,z,{rx:Math.PI/2,cast:false});G.goalGlow=gm;
   mesh(cyl(.028,.028,1.25),M({color:0xe6eaef,metalness:.6,roughness:.3}),x-.3,.62,z-.3);mesh(sph(.05,8,6),M({color:0xf2b000,metalness:.5}),x-.3,1.27,z-.3);
   const fg=new T.Group();fg.position.set(x-.3,1.04,z-.3);S.add(fg);mesh(box(.48,.3,.02),M({color:0x2bd46b}),.25,0,0,{to:fg});G.flag=fg}
  if(state.pcol.has(k)){const col=PORTCOL[state.pcol.get(k)],em=M({color:col,emissive:col,emissiveIntensity:1.4,roughness:.3});
   mesh(new T.TorusGeometry(.38,.05,10,36),em,x,.06,z,{rx:Math.PI/2,cast:false});
   const sw2=mesh(new T.PlaneGeometry(.74,.74),MB({map:tex("swirl"),color:col,transparent:true,depthWrite:false}),x,.03,z,{rx:-Math.PI/2,cast:false});
   const beam=mesh(new T.CylinderGeometry(.34,.34,1,24,1,true),MB({color:col,transparent:true,opacity:.16,side:T.DoubleSide,depthWrite:false}),x,.55,z,{cast:false});
   G.portals.push({sw:sw2,em,beam,ph:rnd()*6})}}
 state.opts.forEach((k,n)=>{const [r,c]=k.split(",").map(Number);mesh(new T.PlaneGeometry(.92,.92),MB({map:canvasTex("opt:"+n+":"+OPTCOL[n]),transparent:true,depthWrite:false}),X(c),.008,Z(r),{rx:-Math.PI/2,cast:false})});
 if(state.m)mathScene(S,th);   // [Matemática]
 const zl=Z(BH-1)+.9,xl0=X(0)-.9,ly=.16,pl=state.plano;
 for(let i=0;i<BW;i++){const l=label(minus(String(pl?i-pl[1]:i)),.46,th.label);l.position.set(X(i),ly,zl);S.add(l)}
 for(let i=0;i<BH;i++){const l=label(minus(String(pl?pl[0]-i:BH-1-i)),.46,th.label);l.position.set(xl0,ly,Z(i));S.add(l)}
 const ex=label("x",.44,th.label);ex.position.set(X(BW-1)+.9,ly,zl);S.add(ex);const ey=label("y",.44,th.label);ey.position.set(xl0,ly,Z(0)-.9);S.add(ey);
 seed=4242+lvl*7;const R0=Math.max(sw,sd)/2+.9;
 const ring=(n,fn,rmin,rmax,back)=>{for(let i=0;i<n;i++){const a=back?Math.PI*(1.05+rnd()*.9):rnd()*Math.PI*2,rr=rmin+rnd()*(rmax-rmin);fn(Math.cos(a)*rr,Math.sin(a)*rr,i)}};
 DECOR[th.decor](gy,sw,sd,R0,ring,th);G.fitNow=1}

/* ---------- Parte que muda a cada execução: estrelas, chaves, portas, tinta, rastro ---------- */
function buildDyn(){wipe(G.dyn,G.db);BUCKET=G.db;G.stars.clear();G.keys.clear();G.doors.clear();G.paintMesh={};G.trailM=null;G.parts.forEach(dropPart);G.parts=[];G.anim=null;G.emo=null;
 const sg=starGeo(),sm=M({color:0xffc928,emissive:0xffb800,emissiveIntensity:.5,metalness:.4,roughness:.3});
 state.stars.forEach(k=>{const [r,c]=k.split(",").map(Number);const s=mesh(sg,sm,X(c),.45,Z(r),{to:G.dyn});s.userData={got:false};G.stars.set(k,s)});
 state.keys.forEach((kc,k)=>{const [r,c]=k.split(",").map(Number),col=KEYCOL[kc],km=M({color:col,emissive:col,emissiveIntensity:.35,metalness:.6,roughness:.3});
  const g=new T.Group();g.position.set(X(c),.5,Z(r));G.dyn.add(g);mesh(new T.TorusGeometry(.13,.045,8,18),km,0,.16,0,{to:g});mesh(box(.07,.34,.07),km,0,-.13,0,{to:g});mesh(box(.14,.06,.07),km,.08,-.2,0,{to:g});mesh(box(.11,.06,.07),km,.065,-.09,0,{to:g});
  g.rotation.z=.5;G.keys.set(k,g);
  g.userData={got:false,col,glow:mesh(new T.PlaneGeometry(.9,.9),MB({map:tex("glow"),color:col,transparent:true,opacity:.6,depthWrite:false}),X(c),.012,Z(r),{rx:-Math.PI/2,cast:false,to:G.dyn})}});
 state.doors.forEach((kc,k)=>{const [r,c]=k.split(",").map(Number),hex=KEYCSS[kc],side=M({map:canvasTex("door:"+hex),roughness:.5,metalness:.3}),top=M({map:canvasTex("doorTop:"+hex),roughness:.5,metalness:.3});
  const g=mesh(box(.94,.84,.94),[side,side,top,top,side,side],X(c),.42,Z(r),{to:G.dyn,recv:true});G.doors.set(k,{g,v:0,target:0,col:KEYCOL[kc],shake:0,x:X(c)})});
 G.trail=new T.Group();G.dyn.add(G.trail)}
function buildLevel(){if(!G)return;const key=lvl+"|"+curVar;if(G.key!==key){G.key=key;buildStatic()}buildDyn();if(!G.robot||G.skin!==save.skin)buildRobot()}
