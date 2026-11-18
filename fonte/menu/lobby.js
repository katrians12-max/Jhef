/* =====================================================================
   SAGUÃO 3D: o Bip do aluno num palco, dentro de um mundo grande.
   Composição em três camadas (regras do estudo de design):
     frente  → palco, anéis, partículas
     meio    → portal-transferidor atrás do Bip, ilhas com sólidos geométricos, símbolos de matemática
     fundo   → montanhas em duas camadas, planeta com anéis, lua e céu estrelado
   O Bip é o ponto focal: luz quente de frente, contorno ciano e magenta atrás,
   e névoa deixando o fundo com menos contraste.
   Um único desenho 3D, que muda de lugar entre o saguão e a loja.
   ===================================================================== */
const LOBBY=(()=>{
 let R=null,scene,cam,P,ring,host=null,paused=false,ok=false,vis=true,stars,key,PTS;
 const beams=[],parts=[],floats=[],syms=[],spin=[];
 let theta=0,thetaGoal=0,drag=null,g=null,gT=0,nextAuto=3.5,blinkAt=2,last=performance.now();
 let F={fov:34,d:13,y:2.3,cy:3.4,shift:0},Q=1,qN=0,qT=0,qWait=1.2;
 const GESTOS={acenar:2.6,dancar:3.6,comemorar:2.4,pensar:2.6,girar:1.6,forca:2.4};
 const AUTO=["acenar","dancar","pensar","forca","girar","comemorar"];
 const rnd=(a,b)=>a+Math.random()*(b-a);
 function tex(w,h,draw){const c=document.createElement("canvas");c.width=w;c.height=h;draw(c.getContext("2d"),w,h);return new THREE.CanvasTexture(c)}
 const add=(m,x,y,z)=>{m.position.set(x,y,z);scene.add(m);return m};
 const glow=(color,op,sx,sy)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:BIPV.glowTex(),color,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:op,fog:false}));s.scale.set(sx,sy||sx,1);return s};

 /* ---------- fundo: céu, estrelas, planeta, lua, montanhas ---------- */
 function sky(){
  const t=tex(4,512,(c,w,h)=>{const gr=c.createLinearGradient(0,0,0,h);
   [[0,"#040716"],[.28,"#0a1034"],[.40,"#191650"],[.465,"#3c1d6e"],[.49,"#8a2c86"],[.5,"#c24a7a"],[.51,"#2a1650"],[1,"#120a26"]].forEach(([p,col])=>gr.addColorStop(p,col));
   c.fillStyle=gr;c.fillRect(0,0,w,h)});
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(95,32,24),new THREE.MeshBasicMaterial({map:t,side:THREE.BackSide,fog:false,depthWrite:false})));
  /* estrelas */
  const n=900,pos=new Float32Array(n*3);for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,e=rnd(.06,1.45),r=88;pos.set([Math.cos(a)*Math.cos(e)*r,Math.sin(e)*r,Math.sin(a)*Math.cos(e)*r],i*3)}
  const gm=new THREE.BufferGeometry();gm.setAttribute("position",new THREE.BufferAttribute(pos,3));
  stars=new THREE.Points(gm,new THREE.PointsMaterial({color:0xdfe8ff,size:1.6,sizeAttenuation:false,transparent:true,opacity:.85,fog:false,depthWrite:false}));scene.add(stars);
  /* planeta com anéis (lá longe, à esquerda) */
  const pt=tex(256,256,(c,w,h)=>{const gr=c.createLinearGradient(0,0,0,h);[[0,"#5ef0e0"],[.3,"#3a8ad8"],[.55,"#6b4fd8"],[.8,"#2b2a7a"],[1,"#141440"]].forEach(([p,col])=>gr.addColorStop(p,col));c.fillStyle=gr;c.fillRect(0,0,w,h);
   c.globalAlpha=.18;for(let i=0;i<14;i++){c.fillStyle=i%2?"#ffffff":"#000000";c.fillRect(0,rnd(0,h),w,rnd(3,12))}});
  const planet=add(new THREE.Mesh(new THREE.SphereGeometry(7,40,28),new THREE.MeshBasicMaterial({map:pt,fog:false})),-40,17,-70);planet.rotation.z=.35;
  const rt=tex(256,4,(c,w)=>{const gr=c.createLinearGradient(0,0,w,0);[[0,"rgba(255,255,255,0)"],[.2,"rgba(255,210,74,.55)"],[.45,"rgba(255,140,90,.25)"],[.6,"rgba(255,210,74,.6)"],[1,"rgba(255,255,255,0)"]].forEach(([p,col])=>gr.addColorStop(p,col));c.fillStyle=gr;c.fillRect(0,0,w,4)});
  const rg=new THREE.RingGeometry(9,14.5,96,1),uv=rg.attributes.uv,pp=rg.attributes.position;for(let i=0;i<uv.count;i++){const r=Math.hypot(pp.getX(i),pp.getY(i));uv.setXY(i,(r-9)/5.5,.5)}
  const pr=new THREE.Mesh(rg,new THREE.MeshBasicMaterial({map:rt,transparent:true,side:THREE.DoubleSide,fog:false,depthWrite:false}));pr.position.copy(planet.position);pr.rotation.set(-1.25,.25,.3);scene.add(pr);
  add(glow(0x6b8cff,.3,40),-40,17,-71);
  /* lua */
  add(new THREE.Mesh(new THREE.SphereGeometry(2.2,24,16),new THREE.MeshBasicMaterial({color:0xfff1d0,fog:false})),34,19,-78);add(glow(0xffe0a0,.45,14),34,19,-79);
  /* montanhas: camada de trás mais clara (perspectiva atmosférica), camada da frente mais escura */
  [[0x2c1b5c,64,24,.9,1.2,5],[0x170d36,50,20,.75,1,4]].forEach(([col,R0,n,hk,wk,seg])=>{const im=new THREE.InstancedMesh(new THREE.ConeGeometry(1,1,seg,1),new THREE.MeshBasicMaterial({color:col,fog:false}),n),o=new THREE.Object3D();
   for(let i=0;i<n;i++){const a=-Math.PI*.98+i/(n-1)*Math.PI*.96+rnd(-.04,.04),h=rnd(6,17)*hk,w=rnd(7,13)*wk;
    o.position.set(Math.cos(a)*R0,h/2-1,Math.sin(a)*R0);o.rotation.set(0,rnd(0,3),0);o.scale.set(w,h,w);o.updateMatrix();im.setMatrixAt(i,o.matrix)}scene.add(im)});
 }
 /* ---------- chão: grade em perspectiva (linhas que levam o olho ao Bip) ---------- */
 function ground(){
  /* chão sem iluminação calculada (barato para computador fraco): a cor e as linhas já vêm desenhadas */
  const gt=tex(128,128,(c,w,h)=>{c.fillStyle="#0e1132";c.fillRect(0,0,w,h);c.strokeStyle="#4b3fc4";c.lineWidth=3;c.strokeRect(0,0,w,h);c.globalAlpha=.4;c.lineWidth=1;c.beginPath();c.moveTo(w/2,0);c.lineTo(w/2,h);c.moveTo(0,h/2);c.lineTo(w,h/2);c.stroke()});
  gt.wrapS=gt.wrapT=THREE.RepeatWrapping;gt.repeat.set(60,60);gt.anisotropy=R.capabilities.getMaxAnisotropy();
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(240,240),new THREE.MeshBasicMaterial({map:gt}));
  fl.rotation.x=-Math.PI/2;scene.add(fl);
  /* poça de luz no chão em volta do palco */
  const pool=tex(256,256,(c,w,h)=>{const r=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);r.addColorStop(0,"rgba(94,240,224,.55)");r.addColorStop(.35,"rgba(140,90,255,.3)");r.addColorStop(1,"rgba(255,79,216,0)");c.fillStyle=r;c.fillRect(0,0,w,h)});
  const pm=new THREE.Mesh(new THREE.CircleGeometry(7,48),new THREE.MeshBasicMaterial({map:pool,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));pm.rotation.x=-Math.PI/2;pm.position.y=.02;scene.add(pm);
 }
 /* ---------- palco ---------- */
 function stage(){
  const base=add(new THREE.Mesh(new THREE.CylinderGeometry(1.95,2.12,.16,56),new THREE.MeshStandardMaterial({color:0x141a36,metalness:.6,roughness:.4})),0,.08,0);base.receiveShadow=true;
  add(new THREE.Mesh(new THREE.TorusGeometry(2.0,.025,8,96),new THREE.MeshBasicMaterial({color:0xff4fd8})),0,.16,0).rotation.x=Math.PI/2;
  const ped=add(new THREE.Mesh(new THREE.CylinderGeometry(1.35,1.5,.3,56),new THREE.MeshStandardMaterial({color:0x1b2440,metalness:.6,roughness:.35})),0,.31,0);ped.receiveShadow=true;ped.castShadow=true;
  const top=add(new THREE.Mesh(new THREE.CircleGeometry(1.3,56),new THREE.MeshStandardMaterial({color:0x26335a,metalness:.4,roughness:.45})),0,.461,0);top.rotation.x=-Math.PI/2;top.receiveShadow=true;
  ring=add(new THREE.Mesh(new THREE.TorusGeometry(1.38,.035,10,96),new THREE.MeshBasicMaterial({color:0x5ef0e0})),0,.46,0);ring.rotation.x=Math.PI/2;
  add(glow(0x5ef0e0,.35,4.6,1.1),0,.46,0);
 }
 /* ---------- portal-transferidor atrás do Bip (moldura do ponto focal) ---------- */
 function portal(){
  const G=new THREE.Group();G.position.set(0,2.85,-2.7);scene.add(G);
  const m1=new THREE.Mesh(new THREE.TorusGeometry(2.05,.055,12,128),new THREE.MeshBasicMaterial({color:0x5ef0e0}));G.add(m1);
  const m2=new THREE.Mesh(new THREE.TorusGeometry(2.35,.022,8,128),new THREE.MeshBasicMaterial({color:0xff4fd8,transparent:true,opacity:.85}));G.add(m2);
  /* marcas de grau, como num transferidor: curtas a cada 10°, longas a cada 30° */
  const v=[];for(let i=0;i<36;i++){const big=i%3==0,a=i/36*Math.PI*2,r0=2.45,r1=big?2.68:2.58,hw=.018,c=Math.cos(a),s=Math.sin(a),px=-s*hw,py=c*hw;
   const A=[c*r0+px,s*r0+py,0],B=[c*r0-px,s*r0-py,0],C=[c*r1-px,s*r1-py,0],D=[c*r1+px,s*r1+py,0];v.push(...A,...B,...C,...A,...C,...D)}
  const tg=new THREE.BufferGeometry();tg.setAttribute("position",new THREE.Float32BufferAttribute(v,3));
  const T=new THREE.Mesh(tg,new THREE.MeshBasicMaterial({color:0xbff8ff,transparent:true,opacity:.8,side:THREE.DoubleSide}));
  G.add(T);spin.push([T,.06],[m2,-.1]);
  const disk=tex(256,256,(c,w,h)=>{const r=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);r.addColorStop(0,"rgba(120,90,255,.0)");r.addColorStop(.7,"rgba(120,90,255,.14)");r.addColorStop(.97,"rgba(94,240,224,.35)");r.addColorStop(1,"rgba(94,240,224,0)");c.fillStyle=r;c.fillRect(0,0,w,h)});
  G.add(new THREE.Mesh(new THREE.CircleGeometry(2.05,64),new THREE.MeshBasicMaterial({map:disk,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})));
  const gl=glow(0x6b6cff,.3,8);gl.position.z=-.2;G.add(gl);
  /* pilares de luz dos lados */
  [-1,1].forEach(s=>{const p=add(new THREE.Mesh(new THREE.BoxGeometry(.18,6.2,.18),new THREE.MeshBasicMaterial({color:s<0?0xff4fd8:0x5ef0e0})),s*3.35,3.1,-3.2);
   const h=glow(s<0?0xff4fd8:0x5ef0e0,.22,1,7);h.position.copy(p.position);scene.add(h)});
 }
 /* ---------- meio: ilhas flutuantes com sólidos geométricos ---------- */
 function solid(geo,color,x,y,z,s,rs){const G=new THREE.Group();
  G.add(new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.35,transparent:true,opacity:.55,metalness:.3,roughness:.3,depthWrite:false})));
  G.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.9})));
  G.scale.setScalar(s);G.position.set(x,y,z);scene.add(G);floats.push({o:G,y,ph:rnd(0,6),rs:rs||.3});return G}
 function islands(){
  const rock=new THREE.MeshStandardMaterial({color:0x2a2050,roughness:.9,flatShading:true});
  [[-8.2,1.4,-7,1.5],[8.6,2,-8.5,1.7],[-15,5.2,-17,1.6],[16,6.4,-19,1.8]].forEach(([x,y,z,s],i)=>{const G=new THREE.Group();
   const r=new THREE.Mesh(new THREE.DodecahedronGeometry(1.4,0),rock);r.scale.set(1.25,.55,1.25);G.add(r);
   const tp=new THREE.Mesh(new THREE.CylinderGeometry(1.45,1.45,.08,7),new THREE.MeshStandardMaterial({color:0x3a2c78,roughness:.6,flatShading:true}));tp.position.y=.48;G.add(tp);
   const e=new THREE.Mesh(new THREE.TorusGeometry(1.46,.03,6,7),new THREE.MeshBasicMaterial({color:i%2?0x5ef0e0:0xff4fd8}));e.rotation.x=Math.PI/2;e.position.y=.52;G.add(e);
   G.scale.setScalar(s);G.position.set(x,y,z);scene.add(G);floats.push({o:G,y,ph:i*1.7,rs:0,amp:.18})});
  solid(new THREE.ConeGeometry(1,1.5,4),0xffb84a,-8.2,3.6,-7,1.2,.25);
  solid(new THREE.BoxGeometry(1.4,1.4,1.4),0x5ef0e0,8.6,4.4,-8.5,1.1,.35);
  solid(new THREE.IcosahedronGeometry(1,0),0xff4fd8,-15,6.2,-17,1.5,.2);
  solid(new THREE.TorusGeometry(.9,.3,10,24),0x8a7bff,16,7.4,-19,1.5,.3);
  solid(new THREE.OctahedronGeometry(1,0),0x5ef07a,-25,8.5,-32,2.2,.15);
  solid(new THREE.DodecahedronGeometry(1,0),0xffd24a,25,9.5,-34,2.4,.12);
 }
 /* ---------- símbolos de matemática flutuando ---------- */
 function symbols(){
  const L=["π","√","∑","∞","+","×","÷","=","%","x²","½","∠","△","7","3","9"],C=["#5ef0e0","#ff4fd8","#ffd24a","#a99bff"];
  L.forEach((ch,i)=>{const col=C[i%4],t=tex(128,128,(c,w,h)=>{c.font='800 78px "Baloo 2","Segoe UI Symbol",system-ui,sans-serif';c.textAlign="center";c.textBaseline="middle";c.shadowColor=col;c.shadowBlur=22;c.fillStyle="#ffffff";c.fillText(ch,64,68);c.shadowBlur=8;c.fillStyle=col;c.fillText(ch,64,68)});
   const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,opacity:.8}));const side=i%2?1:-1,x=side*rnd(4.2,14),z=rnd(-4,-18),y=rnd(1.2,8.5),k=rnd(.7,1.3)*(1+(-z)/30);
   s.scale.set(k,k,1);s.position.set(x,y,z);scene.add(s);syms.push({s,x,y,z,ph:rnd(0,6),v:rnd(.3,.7)})});
 }
 function init(){if(R)return ok;if(!window.THREE)return false;
  try{R=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"high-performance"});}catch(e){return false}
  R.setClearColor(0x0a0d24);R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.domElement.className="lobby-cv";
  scene=new THREE.Scene();scene.fog=new THREE.Fog(0x22144a,18,80);cam=new THREE.PerspectiveCamera(34,1,.1,200);
  scene.add(new THREE.HemisphereLight(0xb9c8ff,0x2a1840,.55));
  key=new THREE.SpotLight(0xffe9cc,1.35,40,.42,.6,1);key.position.set(3,9,8);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.near=4;key.shadow.camera.far=24;scene.add(key);scene.add(key.target);
  const rimA=new THREE.PointLight(0xff4fd8,1.6,10);rimA.position.set(-2.8,3.4,-2.2);scene.add(rimA);
  const rimB=new THREE.PointLight(0x3ce8ff,1.6,10);rimB.position.set(2.8,3.2,-2.2);scene.add(rimB);
  const fill=new THREE.PointLight(0xffb070,.35,14);fill.position.set(0,1.5,5);scene.add(fill);
  sky();ground();stage();portal();islands();symbols();
  /* fachos de luz vindos de cima, apontando para o palco */
  [[-1,0xff4fd8],[0,0xfff1dc],[1,0x3ce8ff]].forEach(([s,c])=>{const b=new THREE.Mesh(new THREE.CylinderGeometry(.2,1.7,13,24,1,true),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.05,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));
   b.position.set(s*3.2,6.6,-1.4+(s?0:-.6));b.rotation.z=-s*.28;scene.add(b);beams.push(b)});
  /* partículas subindo */
  {const n=90,pos=new Float32Array(n*3),col=new Float32Array(n*3),gm=new THREE.BufferGeometry(),C=[new THREE.Color(0x5ef0e0),new THREE.Color(0xff4fd8),new THREE.Color(0xffd24a)];
   for(let i=0;i<n;i++)parts.push({x:rnd(-14,14),z:rnd(-18,2),y:rnd(0,8),v:rnd(.15,.5),c:C[i%3]});
   gm.setAttribute("position",new THREE.BufferAttribute(pos,3));gm.setAttribute("color",new THREE.BufferAttribute(col,3));
   PTS=new THREE.Points(gm,new THREE.PointsMaterial({size:.22,map:BIPV.glowTex(),vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));PTS.frustumCulled=false;scene.add(PTS)}
  /* o Bip */
  P=BIPV.buildBody();P.g.position.y=.46;P.g.scale.setScalar(1.35);P.g.traverse(o=>{if(o.isMesh)o.castShadow=true});scene.add(P.g);
  /* girar o Bip arrastando; tocar NELE faz um gesto */
  const el=R.domElement,ray=new THREE.Raycaster(),v2=new THREE.Vector2();let moved=false,downX=0;
  el.addEventListener("pointerdown",e=>{drag={x:e.clientX,t:thetaGoal};downX=e.clientX;moved=false;try{el.setPointerCapture(e.pointerId)}catch(_){}});
  el.addEventListener("pointermove",e=>{if(!drag)return;const dx=e.clientX-drag.x;if(Math.abs(dx)>5)moved=true;thetaGoal=drag.t+dx*.012});
  el.addEventListener("pointerup",e=>{if(drag&&!moved){const r=el.getBoundingClientRect();v2.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(v2,cam);
   if(ray.intersectObject(P.g,true).length)gesture(AUTO[Math.floor(Math.random()*AUTO.length)])}drag=null});
  el.addEventListener("pointercancel",()=>drag=null);
  window.addEventListener("resize",size);
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)last=performance.now()});
  requestAnimationFrame(loop);ok=true;return true}
 /* enquadramento: "perto" na loja; "aberto" no saguão (mostra o mundo em volta) */
 function size(){if(!R||!host)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
  R.setPixelRatio(Math.max(.5,Math.min(devicePixelRatio||1,w*h>1.3e6?1.25:1.6)*Q));R.setSize(w,h,false);cam.aspect=w/h;const a=w/h;
  if(host.dataset.frame=="perto"){F=a<.9?{fov:40,d:7.6,y:1.6,cy:2.7}:{fov:32,d:7,y:1.55,cy:2.6}}
  else if(a<.9){F={fov:42,d:9.2,y:2.3,cy:3.0}}
  else if(a<1.35){F={fov:36,d:10.6,y:2.5,cy:3.2}}
  else{F={fov:34,d:10.2,y:2.3,cy:3.0}}
  cam.fov=F.fov;const sh=parseFloat(getComputedStyle(host).getPropertyValue("--bip-x"))||0;
  if(sh)cam.setViewOffset(w,h,-sh,0,w,h);else cam.clearViewOffset();cam.updateProjectionMatrix()}
 const RO=window.ResizeObserver?new ResizeObserver(size):null,IO=window.IntersectionObserver?new IntersectionObserver(es=>es.forEach(e=>{if(e.target==host)vis=e.isIntersecting})):null;
 function mount(el){if(!init())return false;if(host&&host!=el){RO&&RO.unobserve(host);IO&&IO.unobserve(host)}host=el;vis=true;el.appendChild(R.domElement);RO&&RO.observe(el);IO&&IO.observe(el);size();return true}
 function look(l){if(!P)return;BIPV.dress(P,l);P.g.traverse(o=>{if(o.isMesh)o.castShadow=true});const t=BIPV.BYID[(l||{}).tela];if(ring&&t)ring.material.color.set(t.c)}
 function gesture(name){if(!P||!GESTOS[name])return;g=name;gT=0;nextAuto=6+Math.random()*4;
  BIPV.setMood(P,{acenar:"feliz",dancar:"festa",comemorar:"festa",pensar:"pensa",girar:"feliz",forca:"feliz"}[name])}
 function pause(v){paused=v;if(!v)last=performance.now()}
 const ease=(a,b,dt,k=9)=>a+(b-a)*Math.min(1,dt*k);
 let arm=[0,.12,0,-.12],tl=0,nd=0,iy=0,iry=0,legL=0,legR=0;
 function loop(now){requestAnimationFrame(loop);if(paused||!vis||!host||document.hidden||!host.isConnected||!host.offsetParent)return;
  const raw=(now-last)/1000,dt=Math.min(.05,raw),t=now/1000;last=now;
  /* mede o ritmo dos quadros; se estiver lento, desenha com menos pontos (o computador fraco agradece) */
  if(Q>.5&&raw<.5){if(qWait>0)qWait-=raw;else{qN++;qT+=raw;if(qN>=40||qT>.9){if(qT/qN>1/28){Q=Math.max(.5,Q*.72);if(key.castShadow)key.castShadow=false;size()}qN=0;qT=0;qWait=.4}}}
  /* gesto automático de vez em quando */
  if(!g){nextAuto-=dt;if(nextAuto<=0)gesture(AUTO[Math.floor(Math.random()*AUTO.length)])}
  let la=Math.sin(t*1.8)*.06,lz=.14,ra=-Math.sin(t*1.8)*.06,rz=-.14,tilt=Math.sin(t*1.1)*.04,nod=0,jump=0,ry=Math.sin(t*.5)*.25,lL=0,lR=0;
  if(g){gT+=dt;const D=GESTOS[g],k=gT/D,env=Math.min(1,gT*4,(D-gT)*4);
   if(g=="acenar"){rz=-.14+(2.7+.14)*env;ra=Math.sin(gT*12)*.35*env;tilt=-.06*env;ry=.1}
   else if(g=="dancar"){const b=Math.sin(gT*8);tilt=b*.18;lz=.14-(1.4+b*.9)*env;rz=-.14+(1.4-b*.9)*env;ry=Math.sin(gT*4)*.6;jump=Math.abs(Math.sin(gT*8))*.12*env;lL=b*.4*env;lR=-b*.4*env}
   else if(g=="comemorar"){const j=Math.abs(Math.sin(gT*7));lz=.14-2.8*env+Math.sin(gT*14)*.2;rz=-.14+2.8*env-Math.sin(gT*14)*.2;jump=j*.5*env;nod=-.1*env;ry=0}
   else if(g=="pensar"){ra=-1.9*env;rz=-.14+.7*env;tilt=.16*env+Math.sin(gT*2)*.03;ry=-.3}
   else if(g=="girar"){ry=k*Math.PI*2;jump=Math.sin(k*Math.PI)*.35}
   else if(g=="forca"){lz=.14-1.5*env;rz=-.14+1.5*env;la=-1.4*env;ra=-1.4*env;tilt=Math.sin(gT*10)*.05*env;nod=-.05*env}
   if(gT>=D){g=null;BIPV.setMood(P,"normal")}}
  arm=[ease(arm[0],la,dt),ease(arm[1],lz,dt),ease(arm[2],ra,dt),ease(arm[3],rz,dt)];P.arms[0].rotation.set(arm[0],0,arm[1]);P.arms[1].rotation.set(arm[2],0,arm[3]);
  tl=ease(tl,tilt,dt);nd=ease(nd,nod,dt);P.body.rotation.z=tl;P.inner.rotation.x=nd;legL=ease(legL,lL,dt);legR=ease(legR,lR,dt);P.legs[0].rotation.x=legL;P.legs[1].rotation.x=legR;
  iy=ease(iy,jump,dt,14);P.inner.position.y=iy;P.body.position.y=Math.sin(t*2.4)*.03;
  iry=g=="girar"?ry:ease(iry,ry,dt,4);P.inner.rotation.y=iry;
  if(!drag)thetaGoal+=(0-thetaGoal)*Math.min(1,dt*.6);theta=ease(theta,thetaGoal,dt,8);P.g.rotation.y=theta;
  /* piscar */
  if(t>blinkAt){blinkAt=t+2.6+Math.random()*3;if(P.mood=="normal"||P.mood=="feliz"&&!g){const m=P.mood;BIPV.setMood(P,"pisca");setTimeout(()=>BIPV.setMood(P,g?P.mood:m),130)}}
  const pulse=.5+.5*Math.sin(t*4);P.glow.intensity=.35+.5*pulse;P.halo.material.opacity=.45+.4*pulse;BIPV.tick(P,t,dt);
  /* o mundo em volta */
  ring.scale.setScalar(1+.015*Math.sin(t*3));beams.forEach((b,i)=>b.material.opacity=.04+.025*Math.sin(t*1.3+i*2));
  spin.forEach(([o,v])=>o.rotation.z+=v*dt);stars.rotation.y+=dt*.004;
  floats.forEach(f=>{f.o.position.y=f.y+Math.sin(t*.8+f.ph)*(f.amp||.3);if(f.rs){f.o.rotation.y+=f.rs*dt;f.o.rotation.x+=f.rs*.4*dt}});
  syms.forEach(u=>{u.s.position.set(u.x+Math.sin(t*.3+u.ph)*.3,u.y+Math.sin(t*u.v+u.ph)*.35,u.z);u.s.material.opacity=.55+.3*Math.sin(t*.9+u.ph)});
  {const pa=PTS.geometry.attributes.position,ca=PTS.geometry.attributes.color;parts.forEach((u,i)=>{u.y+=u.v*dt;if(u.y>8)u.y=0;pa.setXYZ(i,u.x+Math.sin(t*.7+u.z)*.2,u.y,u.z);const k=Math.sin(u.y/8*Math.PI)*.9;ca.setXYZ(i,u.c.r*k,u.c.g*k,u.c.b*k)});pa.needsUpdate=ca.needsUpdate=true}
  cam.position.set(0,F.cy,F.d);cam.lookAt(0,F.y,0);R.render(scene,cam)}
 return {mount,look,gesture,pause,ready:()=>ok,_q:()=>Q}})();
