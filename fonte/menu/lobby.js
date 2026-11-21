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
 let R=null,scene,cam,P,ring,host=null,paused=false,ok=false,vis=true,key,PTS,hemi,rimA,rimB,fill,pool,palco,ring2,CUR=null,curId=null,PC={mode:"up"};
 const beams=[],parts=[],cache={};
 let theta=0,thetaGoal=0,drag=null,g=null,gT=0,nextAuto=3.5,blinkAt=2,last=performance.now();
 let F={fov:34,d:13,y:2.3,cy:3.4,shift:0},Q=1,qN=0,qT=0,qWait=1.2;
 const GESTOS={acenar:2.6,dancar:3.6,comemorar:2.4,pensar:2.6,girar:1.6,forca:2.4};
 const AUTO=["acenar","dancar","pensar","forca","girar","comemorar"];
 const rnd=(a,b)=>a+Math.random()*(b-a);
 function tex(w,h,draw){const c=document.createElement("canvas");c.width=w;c.height=h;draw(c.getContext("2d"),w,h);return new THREE.CanvasTexture(c)}
 const add=(m,x,y,z)=>{m.position.set(x,y,z);scene.add(m);return m};
 const glow=(color,op,sx,sy)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:BIPV.glowTex(),color,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:op,fog:false}));s.scale.set(sx,sy||sx,1);return s};

 /* ---------- palco ---------- */
 function stage(){
  const base=add(new THREE.Mesh(new THREE.CylinderGeometry(1.95,2.12,.16,56),new THREE.MeshStandardMaterial({color:0x141a36,metalness:.6,roughness:.4})),0,.08,0);base.receiveShadow=true;
  ring2=add(new THREE.Mesh(new THREE.TorusGeometry(2.0,.025,8,96),new THREE.MeshBasicMaterial({color:0xff4fd8})),0,.16,0);ring2.rotation.x=Math.PI/2;
  const ped=add(new THREE.Mesh(new THREE.CylinderGeometry(1.35,1.5,.3,56),new THREE.MeshStandardMaterial({color:0x1b2440,metalness:.6,roughness:.35})),0,.31,0);ped.receiveShadow=true;ped.castShadow=true;
  const top=add(new THREE.Mesh(new THREE.CircleGeometry(1.3,56),new THREE.MeshStandardMaterial({color:0x26335a,metalness:.4,roughness:.45})),0,.461,0);top.rotation.x=-Math.PI/2;top.receiveShadow=true;
  palco=[base,ped,top];
  /* poça de luz no chão em volta do palco (a cor vem do cenário) */
  pool=add(new THREE.Mesh(new THREE.CircleGeometry(7,48),new THREE.MeshBasicMaterial({map:tex(256,256,(c,w,h)=>{const r=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);r.addColorStop(0,"rgba(255,255,255,.55)");r.addColorStop(.4,"rgba(255,255,255,.22)");r.addColorStop(1,"rgba(255,255,255,0)");c.fillStyle=r;c.fillRect(0,0,w,h)}),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})),0,.03,0);pool.rotation.x=-Math.PI/2;
  ring=add(new THREE.Mesh(new THREE.TorusGeometry(1.38,.035,10,96),new THREE.MeshBasicMaterial({color:0x5ef0e0})),0,.46,0);ring.rotation.x=Math.PI/2;
  add(glow(0x5ef0e0,.35,4.6,1.1),0,.46,0);
 }
 function init(){if(R)return ok;if(!window.THREE)return false;
  try{R=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"high-performance"});}catch(e){return false}
  R.setClearColor(0x0a0d24);R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.domElement.className="lobby-cv";
  scene=new THREE.Scene();scene.fog=new THREE.Fog(0x22144a,18,80);cam=new THREE.PerspectiveCamera(34,1,.1,200);
  hemi=new THREE.HemisphereLight(0xb9c8ff,0x2a1840,.55);scene.add(hemi);
  key=new THREE.SpotLight(0xffe9cc,1.35,40,.42,.6,1);key.position.set(3,9,8);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.near=4;key.shadow.camera.far=24;scene.add(key);scene.add(key.target);
  rimA=new THREE.PointLight(0xff4fd8,1.6,10);rimA.position.set(-2.8,3.4,-2.2);scene.add(rimA);
  rimB=new THREE.PointLight(0x3ce8ff,1.6,10);rimB.position.set(2.8,3.2,-2.2);scene.add(rimB);
  fill=new THREE.PointLight(0xffb070,.35,14);fill.position.set(0,1.5,5);scene.add(fill);
  stage();
  /* fachos de luz vindos de cima, apontando para o palco */
  [[-1,0xff4fd8],[0,0xfff1dc],[1,0x3ce8ff]].forEach(([s,c])=>{const b=new THREE.Mesh(new THREE.CylinderGeometry(.2,1.7,13,24,1,true),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.05,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));
   b.position.set(s*3.2,6.6,-1.4+(s?0:-.6));b.rotation.z=-s*.28;scene.add(b);beams.push(b)});
  /* partículas (até 160): o cenário diz a cor e o jeito de mexer (subir, cair neve, vagar, areia de lado) */
  {const n=160,gm=new THREE.BufferGeometry();for(let i=0;i<n;i++)parts.push({x:0,y:0,z:0,v:0,c:new THREE.Color()});
   gm.setAttribute("position",new THREE.BufferAttribute(new Float32Array(n*3),3));gm.setAttribute("color",new THREE.BufferAttribute(new Float32Array(n*3),3));
   PTS=new THREE.Points(gm,new THREE.PointsMaterial({size:.22,map:BIPV.glowTex(),vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));PTS.frustumCulled=false;scene.add(PTS)}
  setCena("s-neon");
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
 /* ---------- troca de cenário: cada mundo é montado uma vez e guardado ---------- */
 function setCena(id){if(typeof CENA=="undefined")return;if(!CENA.has(id))id="s-neon";if(id==curId)return;
  if(CUR)CUR.E.visible=false;let C=cache[id];if(!C){C=CENA.build(id);scene.add(C.E);cache[id]=C}C.E.visible=true;CUR=C;curId=id;aplica(C.cfg)}
 function aplica(f){R.setClearColor(f.clear);scene.fog.color.set(f.fog[0]);scene.fog.near=f.fog[1];scene.fog.far=f.fog[2];
  hemi.color.set(f.hemi[0]);hemi.groundColor.set(f.hemi[1]);hemi.intensity=f.hemi[2];key.color.set(f.key[0]);key.intensity=f.key[1];
  rimA.color.set(f.rim[0]);rimB.color.set(f.rim[1]);rimA.intensity=rimB.intensity=f.rim[2];fill.color.set(f.fill[0]);fill.intensity=f.fill[1];
  const [b,pd,tp,met,r2]=f.palco;[b,pd,tp].forEach((c,i)=>{palco[i].material.color.set(c);palco[i].material.metalness=met});ring2.material.color.set(r2);
  pool.material.color.set(f.pool);
  beams.forEach((m,i)=>{m.visible=!!f.beams;if(f.beams)m.material.color.set(f.beams[i])});beamOp=f.beamOp||1;
  PC=f.parts;const C=PC.cols.map(c=>new THREE.Color(c));parts.forEach((u,i)=>{u.on=i<PC.n;u.x=rnd(-14,14);u.z=rnd(-18,2);u.y=rnd(0,8);u.v=rnd(.15,.5)*(PC.fast||1);u.c.copy(C[i%C.length]);u.ph=rnd(0,6)});
  PTS.material.size=PC.size;PTS.material.blending=PC.add?THREE.AdditiveBlending:THREE.NormalBlending;PTS.material.needsUpdate=true}
 let beamOp=1;
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
 function frame(f){if(!host)return;host.dataset.frame=f;size()}
 function mount(el){if(!init())return false;if(host&&host!=el){RO&&RO.unobserve(host);IO&&IO.unobserve(host)}host=el;vis=true;el.appendChild(R.domElement);RO&&RO.observe(el);IO&&IO.observe(el);size();return true}
 function look(l){if(!P)return;BIPV.dress(P,l);setCena((l||{}).cenario||"s-neon");P.g.traverse(o=>{if(o.isMesh)o.castShadow=true});const t=BIPV.BYID[(l||{}).tela];if(ring&&t)ring.material.color.set(t.c)}
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
  ring.scale.setScalar(1+.015*Math.sin(t*3));beams.forEach((b,i)=>b.material.opacity=(.04+.025*Math.sin(t*1.3+i*2))*beamOp);
  if(CUR)CUR.tick(t,dt);
  {const pa=PTS.geometry.attributes.position,ca=PTS.geometry.attributes.color,m=PC.mode;parts.forEach((u,i)=>{if(!u.on){pa.setXYZ(i,0,-50,0);return}let x=u.x,y,k;
    if(m=="down"){u.y-=u.v*dt*1.6;if(u.y<0)u.y=9;y=u.y;x=u.x+Math.sin(t*.8+u.ph)*.5;k=1}
    else if(m=="float"){y=1+((u.y+Math.sin(t*.5+u.ph)*1.2)%7+7)%7;x=u.x+Math.sin(t*.4+u.ph*2)*.8;k=.5+.5*Math.sin(t*2+u.ph*3)}
    else if(m=="side"){u.x+=u.v*dt*4;if(u.x>15)u.x=-15;x=u.x;y=.2+u.y*.25+Math.sin(t+u.ph)*.15;k=1}
    else{u.y+=u.v*dt;if(u.y>8)u.y=0;y=u.y;x=u.x+Math.sin(t*.7+u.z)*.2;k=Math.sin(u.y/8*Math.PI)*.9}
    pa.setXYZ(i,x,y,u.z);if(!PC.add)k=1;ca.setXYZ(i,u.c.r*k,u.c.g*k,u.c.b*k)});pa.needsUpdate=ca.needsUpdate=true}
  cam.position.set(0,F.cy,F.d);cam.lookAt(0,F.y,0);R.render(scene,cam)}
 return {mount,look,gesture,pause,frame,ready:()=>ok,_q:()=>Q,cena:()=>curId}})();
