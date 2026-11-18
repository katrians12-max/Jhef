/* =====================================================================
   SAGUÃO 3D: o Bip do aluno num palco iluminado, fazendo gestos.
   Um único desenho 3D, que muda de lugar entre o saguão e a loja.
   ===================================================================== */
const LOBBY=(()=>{
 let R=null,scene,cam,P,ring,beams=[],parts=[],host=null,paused=false,ok=false;
 let theta=0,thetaGoal=0,drag=null,g=null,gT=0,nextAuto=3.5,blinkAt=2,last=performance.now(),camY=1.1,camD=5.6;
 const GESTOS={acenar:2.6,dancar:3.6,comemorar:2.4,pensar:2.6,girar:1.6,forca:2.4};
 const AUTO=["acenar","dancar","pensar","forca","girar","comemorar"];
 function init(){if(R)return ok;if(!window.THREE)return false;
  try{R=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch(e){return false}
  R.setPixelRatio(Math.min(1.75,devicePixelRatio||1));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.domElement.className="lobby-cv";
  scene=new THREE.Scene();cam=new THREE.PerspectiveCamera(32,1,.1,100);
  scene.add(new THREE.HemisphereLight(0xc9d8ff,0x2a1840,.55));
  const key=new THREE.SpotLight(0xfff1dc,1.25,30,.5,.6,1);key.position.set(2.5,7,6);key.castShadow=true;key.shadow.mapSize.set(1024,1024);scene.add(key);scene.add(key.target);
  const rimA=new THREE.PointLight(0xff4fd8,1.1,12);rimA.position.set(-3.5,2.6,-2.5);scene.add(rimA);
  const rimB=new THREE.PointLight(0x3ce8ff,1.1,12);rimB.position.set(3.5,2.4,-2.5);scene.add(rimB);
  /* palco */
  const ped=new THREE.Mesh(new THREE.CylinderGeometry(1.55,1.75,.3,48),new THREE.MeshStandardMaterial({color:0x1b2440,metalness:.6,roughness:.35}));ped.position.y=.15;ped.receiveShadow=true;scene.add(ped);
  const top=new THREE.Mesh(new THREE.CircleGeometry(1.5,48),new THREE.MeshStandardMaterial({color:0x26335a,metalness:.4,roughness:.45}));top.rotation.x=-Math.PI/2;top.position.y=.301;top.receiveShadow=true;scene.add(top);
  ring=new THREE.Mesh(new THREE.TorusGeometry(1.6,.035,10,80),new THREE.MeshBasicMaterial({color:0x5ef0e0}));ring.rotation.x=Math.PI/2;ring.position.y=.3;scene.add(ring);
  const ring2=new THREE.Mesh(new THREE.TorusGeometry(1.78,.02,8,80),new THREE.MeshBasicMaterial({color:0xff4fd8,transparent:true,opacity:.7}));ring2.rotation.x=Math.PI/2;ring2.position.y=.04;scene.add(ring2);
  const gl=new THREE.Sprite(new THREE.SpriteMaterial({map:BIPV.glowTex(),color:0x5ef0e0,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.35}));gl.scale.set(5,1.2,1);gl.position.set(0,.3,0);scene.add(gl);
  /* fachos de luz vindos de cima */
  [[-1.4,0xff4fd8],[0,0xfff1dc],[1.4,0x3ce8ff]].forEach(([x,c],i)=>{const b=new THREE.Mesh(new THREE.CylinderGeometry(.15,1.3,7,24,1,true),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.06,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));b.position.set(x*1.6,3.6,-1.6);b.rotation.z=-x*.12;scene.add(b);beams.push(b)});
  /* partículas subindo */
  for(let i=0;i<46;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:BIPV.glowTex(),color:[0x5ef0e0,0xff4fd8,0xffd24a][i%3],transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.7}));
   const sc=.05+Math.random()*.09;s.scale.set(sc,sc,1);s.userData={x:(Math.random()-.5)*8,z:-1-Math.random()*4,y:Math.random()*5,v:.15+Math.random()*.35};scene.add(s);parts.push(s)}
  /* o Bip */
  P=BIPV.buildBody();P.g.position.y=.3;P.g.scale.setScalar(1.35);scene.add(P.g);
  /* girar o Bip arrastando; tocar nele faz um gesto */
  const el=R.domElement;let moved=false;
  el.addEventListener("pointerdown",e=>{drag={x:e.clientX,t:thetaGoal};moved=false;el.setPointerCapture(e.pointerId)});
  el.addEventListener("pointermove",e=>{if(!drag)return;const dx=e.clientX-drag.x;if(Math.abs(dx)>5)moved=true;thetaGoal=drag.t+dx*.012});
  el.addEventListener("pointerup",()=>{if(drag&&!moved)gesture(AUTO[Math.floor(Math.random()*AUTO.length)]);drag=null});
  new ResizeObserver(size).observe(document.body);
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)last=performance.now()});
  requestAnimationFrame(loop);ok=true;return true}
 function size(){if(!R||!host)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;R.setSize(w,h,false);cam.aspect=w/h;
  const narrow=w/h<.9;cam.fov=narrow?40:32;camD=narrow?7.2:6.6;camY=narrow?1.45:1.4;cam.updateProjectionMatrix()}
 function mount(el){if(!init())return false;host=el;el.appendChild(R.domElement);size();return true}
 function look(l){if(!P)return;BIPV.dress(P,l);const t=BIPV.BYID[(l||{}).tela];if(ring&&t)ring.material.color.set(t.c)}
 function gesture(name){if(!P||!GESTOS[name])return;g=name;gT=0;nextAuto=6+Math.random()*4;
  BIPV.setMood(P,{acenar:"feliz",dancar:"festa",comemorar:"festa",pensar:"pensa",girar:"feliz",forca:"feliz"}[name])}
 function pause(v){paused=v;if(!v)last=performance.now()}
 const ease=(a,b,dt,k=9)=>a+(b-a)*Math.min(1,dt*k);
 let arm=[0,.12,0,-.12],tl=0,nd=0,iy=0,iry=0,legL=0,legR=0;
 function loop(now){requestAnimationFrame(loop);if(paused||!host||document.hidden||!host.isConnected||!host.offsetParent)return;
  const dt=Math.min(.05,(now-last)/1000),t=now/1000;last=now;
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
  ring.material.opacity=1;ring.scale.setScalar(1+.015*Math.sin(t*3));beams.forEach((b,i)=>b.material.opacity=.045+.03*Math.sin(t*1.3+i*2));
  parts.forEach(s=>{const u=s.userData;u.y+=u.v*dt;if(u.y>5.2)u.y=0;s.position.set(u.x+Math.sin(t*.7+u.z)*.2,u.y,u.z);s.material.opacity=Math.sin(u.y/5.2*Math.PI)*.8});
  cam.position.set(0,camY+1.1,camD);cam.lookAt(0,camY,0);R.render(scene,cam)}
 return {mount,look,gesture,pause,ready:()=>ok}})();
