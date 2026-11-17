/* ===== Movimento, câmera e animações ===== */
/* Enquadramento: a menor distância em que o tabuleiro inteiro cabe na tela, em qualquer formato e giro,
   e o quanto a câmera se desloca (para os lados e na vertical) para a imagem ficar centralizada. */
function fitView(){const ce=Math.cos(G.el),se=Math.sin(G.el),sa=Math.sin(G.az),ca=Math.cos(G.az),tv=Math.tan(G.cam.fov*Math.PI/360),th=tv*G.aspect;
 const sw=(BW+2.2)/2,sd=(BH+2.2)/2,bw=BW/2,bd=BH/2,pts=[];
 const top=1-2*Math.min(.32,44/Math.max(120,G.h||400));      // as casas do jogo não ficam atrás das etiquetas do alto
 const add=(x,y,z,mx,mt,mb)=>pts.push({f:-x*sa*ce-y*se-z*ca*ce,x:x*ca-z*sa,y:-x*sa*se+y*ce-z*ca*se,ax:th*mx,at:tv*mt,ab:tv*mb});
 for(const sx of[-1,1])for(const sz of[-1,1]){add(sx*sw,-.12-TY,sz*sd,.97,.97,.9);add(sx*sw,-.72-TY,sz*sd,1.2,1.2,.99);add(sx*bw,1.25-TY,sz*bd,.95,top,.95)}
 let D=4;
 for(const i of pts)for(const j of pts)D=Math.max(D,(i.y-j.y-i.at*i.f-j.ab*j.f)/(i.at+j.ab),(i.x-j.x-i.ax*i.f-j.ax*j.f)/(i.ax+j.ax));
 let lo=-1e9,hi=1e9,l2=-1e9,h2=1e9;
 for(const p of pts){const w=D+p.f;lo=Math.max(lo,p.y-p.at*w);hi=Math.min(hi,p.y+p.ab*w);l2=Math.max(l2,p.x-p.ax*w);h2=Math.min(h2,p.x+p.ax*w)}
 return {D,px:(l2+h2)/2,py:(lo+hi)/2}}
function spring(o,k,target,K,C,h){const v=k+"v";o[v]=(o[v]||0)+((target-(o[k]||0))*K-(o[v]||0)*C)*h;o[k]=(o[k]||0)+o[v]*h}
/* Curva de Hermite: acelera, cruza e freia. v0 e v1 dizem se o robô já vem (ou continua) em movimento. */
const herm=(p,v0,v1)=>{const p2=p*p,p3=p2*p;return (p3-2*p2+p)*v0+(-2*p3+3*p2)+(p3-p2)*v1};
function animate(a){if(!G||!G.robot)return wait(a.dur*400);return new Promise(res=>{G.anim=Object.assign({t:0,res},a)})}
const fwd=y=>({x:-Math.sin(y),z:-Math.cos(y)});
function burst(x,y,z,col,n,spd,size=.05){if(!G)return;const geo=new T.OctahedronGeometry(size),c=new T.Color(col),m=new T.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:.4}),sh={geo,m,n};
 for(let i=0;i<n;i++){const o=new T.Mesh(geo,m);o.position.set(x,y,z);const a=Math.random()*Math.PI*2,u=.4+Math.random()*.8;
  G.scene.add(o);G.parts.push({m:o,sh,v:new T.Vector3(Math.cos(a)*spd*u,1.6+Math.random()*2.2,Math.sin(a)*spd*u),life:.9+Math.random()*.5,spin:Math.random()*10})}}
function dropPart(q){G.scene.remove(q.m);if(--q.sh.n<=0){q.sh.geo.dispose();q.sh.m.dispose()}}
function emote(k){if(G&&G.robot){G.emo={k,t:k=="ouch"?1.3:1};if(k=="cheer"){G.cheer=1.6;G.emo.k="happy"}
 if(k=="happy"&&G.ph){G.ph.sqv+=5;G.ph.hpv-=5;G.ph.av-=8;G.robot.userData.arms.forEach(a=>a.zv=(a.zv||0)+a.side*9)}}}
function addTrail(r,c){if(!G)return;BUCKET=G.db;const tm=G.trailM||(G.trailM=M({color:new T.Color(SKINS[save.skin]||"#f2c230"),transparent:true,opacity:.6}));
 const d=mesh(cyl(.09,.09,.01,16),tm,X(c),.006,Z(r),{to:G.trail,cast:false});d.scale.setScalar(.01);d.userData.grow=1}
function paintCell(k,good){if(!G||G.paintMesh[k])return;const [r,c]=k.split(",").map(Number),col=good?0xff4f9a:0xd23030;BUCKET=G.db;
 const m=mesh(new T.PlaneGeometry(.94,.94),M({map:tex("splat"),color:col,transparent:true,depthWrite:false,roughness:.6}),X(c),.012,Z(r),{rx:-Math.PI/2,rz:Math.random()*6,to:G.trail,cast:false});
 m.scale.setScalar(.01);m.userData.grow=1;G.paintMesh[k]=m;burst(X(c),.15,Z(r),col,10,1.2,.04)}
function sceneStar(k){const s=G&&G.stars.get(k);if(s&&!s.userData.got){s.userData.got=true;burst(s.position.x,.45,s.position.z,0xffc928,14,1.6);emote("happy")}}
function sceneKey(k){const o=G&&G.keys.get(k);if(o&&!o.userData.got){o.userData.got=true;burst(o.position.x,.5,o.position.z,o.userData.col,12,1.4);emote("happy")}}
function sceneDoor(k){const d=G&&G.doors.get(k);if(d){d.target=1;burst(d.x,.5,d.g.position.z,d.col,10,1.2,.04)}}
function shakeDoor(k){const d=G&&G.doors.get(k);if(d)d.shake=1}
function placeRobot(instant){if(instant&&G&&G.robot){G.pose={x:X(state.c),z:Z(state.r),yaw:-state.rot*Math.PI/180,y:0,s:1};
  G.ph={v:0,acc:0,p:0,pv:0,r:0,rv:0,a:0,av:0,az:0,azv:0,sq:0,sqv:0,hp:0,hpv:0,hr:0,hrv:0,hy:0,hyv:0,dist:0};G.prevHop=0;G.prevHv=0;G.anim=null;
  G.robot.position.set(G.pose.x,0,G.pose.z);G.robot.rotation.y=G.pose.yaw;G.robot.scale.setScalar(RS);G.robot.visible=true}
 hud()}

/* Computador fraco? Se o jogo ficar lento, baixa a nitidez e depois desliga as sombras (nunca volta a subir). */
function tuneQuality(raw){if(G.q>=2||raw>.5)return;G.fpsT+=raw;if(++G.fpsN<50)return;const avg=G.fpsT/G.fpsN;G.fpsT=G.fpsN=0;if(avg<.042)return;
 G.q++;if(G.q==1&&G.r.getPixelRatio()>1){G.r.setPixelRatio(1);const el=$("board");G.r.setSize(el.clientWidth||300,el.clientHeight||300,false)}else{G.q=2;G.sun.castShadow=false}}
function frame(){const raw=G.clock.getDelta(),dt=Math.min(.05,raw),t=G.clock.elapsedTime;tuneQuality(raw);
 /* câmera: gira com inércia e se afasta só o necessário para enquadrar o tabuleiro */
 G.az+=G.azV*dt;G.azV*=Math.exp(-dt*3.5);G.shake=Math.max(0,G.shake-dt*2.5);
 const fv=fitView(),kf=G.fitNow?1:Math.min(1,dt*7);G.dist+=(fv.D-G.dist)*kf;G.panX+=(fv.px-G.panX)*kf;G.panY+=(fv.py-G.panY)*kf;G.fitNow=0;
 const ce=Math.cos(G.el),se=Math.sin(G.el),sa=Math.sin(G.az),ca=Math.cos(G.az),D=G.dist,sh=G.shake*G.shake*.12;
 const tx=ca*G.panX-sa*se*G.panY,ty=TY+ce*G.panY,tz=-sa*G.panX-ca*se*G.panY;
 G.cam.position.set(tx+sa*ce*D+(Math.random()-.5)*sh,ty+se*D+(Math.random()-.5)*sh,tz+ca*ce*D);G.cam.lookAt(tx,ty,tz);
 const R=G.robot,P=G.pose,ph=G.ph;
 if(R&&P){const ox=P.x,oz=P.z,oy=P.yaw;let hop=0;const A=G.anim;
  if(A){A.t+=dt;const p=Math.min(1,A.t/A.dur);
   if(A.kind=="move"){const e=herm(p,A.v0,A.v1);P.x=A.fx+(A.tx-A.fx)*e;P.z=A.fz+(A.tz-A.fz)*e}
   else if(A.kind=="jump"){if(!A.sq){A.sq=1;ph.sqv+=7}const e=.5*p+.5*p*p*(3-2*p);P.x=A.fx+(A.tx-A.fx)*e;P.z=A.fz+(A.tz-A.fz)*e;hop=3.4*p*(1-p);if(p>=1&&G.th)burst(P.x,.06,P.z,G.th.dust,8,1.1,.035)}
   else if(A.kind=="turn"){P.yaw=A.fy+(A.ty-A.fy)*herm(p,0,0)}
   else if(A.kind=="bump"){const f=fwd(P.yaw);let o;
    if(p<.45)o=.32*Math.pow(p/.45,2);else{if(!A.hit){A.hit=1;ph.pv-=13;ph.av+=18;ph.sqv-=6;ph.hpv-=12;R.userData.arms.forEach(a=>a.xv=(a.xv||0)-12);G.shake=1;burst(P.x+f.x*.5,.15,P.z+f.z*.5,G.th?G.th.dust:0x888888,12,1.4,.04);emote("ouch")}
     const q=(p-.45)/.55;o=.32*Math.exp(-q*5)*Math.cos(q*9)}
    P.x=A.bx+f.x*o;P.z=A.bz+f.z*o}
   else if(A.kind=="stamp"){if(!A.sq){A.sq=1;ph.sqv-=8;ph.hpv+=7;ph.av+=8}}
   else if(A.kind=="hop"){if(!A.sq){A.sq=1;ph.sqv-=5}const q=p<.12?0:(p-.12)/.88;const j=q<.55?q/.55:(q-.55)/.45,hh=q<.55?.42:.26;hop=q>0?4*hh*j*(1-j):0}
   else if(A.kind=="fall"){if(p<.3){const e=p/.3;P.x=A.fx+(A.tx-A.fx)*e;P.z=A.fz+(A.tz-A.fz)*e}
    else{const q=(p-.3)/.7;if(!A.sp){A.sp=1;P.x=A.tx;P.z=A.tz;G.shake=.5;burst(A.tx,.05,A.tz,G.th&&G.th.water?0x9fe2f5:G.th?G.th.dust:0x888888,16,1.5,.045);emote("ouch")}P.y=-2.4*q*q;P.s=1-.82*q;P.yaw+=dt*9}}
   else if(A.kind=="warpOut"){P.s=1-p;P.yaw+=dt*16;P.y=.25*p}
   else if(A.kind=="warpIn"){if(!A.sp){A.sp=1;burst(P.x,.2,P.z,A.col,12,1.4,.04)}P.s=p;P.yaw=A.yaw-(1-p)*4;P.y=.25*(1-p)}
   if(p>=1){G.anim=null;A.res()}}
  /* velocidades viram giro das esteiras e forças nas molas */
  const f=fwd(oy),dF=(P.x-ox)*f.x+(P.z-oz)*f.z,dY=P.yaw-oy,idt=1/Math.max(dt,1e-4),v=dF*idt,acc=(v-ph.v)*idt,yr=clamp(dY*idt,-9,9);ph.v=v;
  ph.acc+=(acc-ph.acc)*Math.min(1,dt*20);
  const u=R.userData;for(const w of u.wheels){const dist=dF-w.side*dY*.31;w.g.rotation.x-=dist/.075}
  for(const tr of u.tracks){tr.tex.offset.y+=(dF-tr.side*dY*.29)*1.7}
  if(G.emo){G.emo.t-=dt;if(G.emo.t<=0)G.emo=null}const ek=G.emo&&G.emo.k,tc=ek=="ouch"?G.ECOL.o:ek=="happy"?G.ECOL.h:G.ECOL.n;u.eyeM.emissive.lerp(tc,Math.min(1,dt*10));
  G.blinkT=(G.blinkT||3)-dt;let sy=1;if(G.blinkT<0){sy=.1;if(G.blinkT<-.13)G.blinkT=2.5+Math.random()*3}if(ek=="happy")sy=.4;if(ek=="ouch")sy=.7;
  u.eyes.forEach(e=>{e.scale.y+=(sy-e.scale.y)*Math.min(1,dt*28)});
  G.cheer=Math.max(0,(G.cheer||0)-dt);
  /* pulo: estica subindo, amassa ao tocar o chão */
  const hv=(hop-(G.prevHop||0))*idt;if(hop<.015&&(G.prevHv||0)<-.6){ph.sqv-=5;ph.hpv+=5;ph.av-=6}G.prevHop=hop;G.prevHv=hv;
  const cl=(x,m)=>Math.max(-m,Math.min(m,x)),K=reduce?.15:1;
  const tP=cl(ph.acc*.03,.26)*K,tR=cl(-yr*.035,.14)*K,tSq=(cl(-Math.abs(ph.acc)*.005,.1)+cl(hv*.05,.14)+Math.sin(t*2.4)*.008)*K;
  const sw=reduce?0:Math.sin(ph.dist*9)*.5*Math.min(1,Math.abs(v)*1.2);
  const N=4,h=dt/N;
  for(let i=0;i<N;i++){
   spring(ph,"p",tP,160,6.5,h);            // corpo inclina (frente/trás) e balança
   spring(ph,"r",tR,150,6,h);              // corpo inclina nas curvas
   spring(ph,"sq",tSq,260,7,h);            // amassa e estica
   spring(ph,"hp",-ph.p*1.3+ph.sqv*.012,105,4.5,h);  // cabeça atrasada
   spring(ph,"hr",-ph.r*1.4,100,4.5,h);
   spring(ph,"hy",cl(-yr*.08,.5),85,5,h);  // cabeça demora para acompanhar o giro
   spring(ph,"a",-ph.p*2.6-ph.hp*1.2+ph.sqv*.03,42,2.8,h);  // antena mole
   spring(ph,"az",-ph.r*2.6-ph.hr,42,2.8,h);
   for(const a of u.arms){spring(a,"x",sw*a.side+cl(ph.acc*.045,.9)*K,55,3,h);spring(a,"z",(G.cheer>0?a.side*(2.4+Math.sin(t*14)*.25):0)-ph.r*1.5,48,3.4,h)}}
  ph.dist+=Math.abs(dF)+Math.abs(dY)*.3;
  const rumble=Math.min(1,Math.abs(v)*1.5)*Math.abs(Math.sin(ph.dist*28))*.012;
  R.position.set(P.x,hop+P.y,P.z);R.rotation.y=P.yaw;R.scale.setScalar(RS*Math.max(.001,P.s));R.visible=P.s>.03;
  const ch=u.chassis;ch.rotation.x=ph.p;ch.rotation.z=ph.r;ch.position.y=.2+rumble-Math.abs(ph.p)*.03;
  const sq=Math.max(-.22,Math.min(.25,ph.sq));ch.scale.set(1-sq*.55,1+sq,1-sq*.55);
  u.head.rotation.set(ph.hp,ph.hy,ph.hr+(ek=="ouch"?Math.sin(t*22)*.14*G.emo.t:0));
  u.arms.forEach(a=>{a.g.rotation.x=a.x;a.g.rotation.z=a.z});
  u.ant.rotation.x=ph.a;u.ant.rotation.z=ph.az;u.ball.material.emissiveIntensity=.5+Math.sin(t*4)*.3}
 /* estrelas e chaves flutuam; quando pegas, sobem e somem */
 G.stars.forEach(s=>{const u=s.userData;s.rotation.y+=dt*(u.got?9:1.8);
  if(u.got){u.k=(u.k||0)+dt*2.4;const q=Math.min(1,u.k);if(P){s.position.x+=(P.x-s.position.x)*q*.3;s.position.z+=(P.z-s.position.z)*q*.3}s.position.y+=dt*(1.6-q*2);s.scale.setScalar(Math.max(0,1-q))}
  else s.position.y=.45+Math.sin(t*2+s.position.x)*.05});
 G.keys.forEach(g=>{const u=g.userData;g.rotation.y+=dt*(u.got?10:1.6);
  if(u.got){u.k=(u.k||0)+dt*2.2;const q=Math.min(1,u.k);g.position.y+=dt*(2-q*1.5);g.scale.setScalar(Math.max(0,1-q));u.glow.material.opacity=.6*(1-q)}
  else{g.position.y=.52+Math.sin(t*2.2+g.position.x)*.05;u.glow.material.opacity=.45+Math.sin(t*3)*.15}});
 G.doors.forEach(d=>{d.v+=(d.target-d.v)*Math.min(1,dt*7);d.shake=Math.max(0,d.shake-dt*2.5);d.g.position.y=.42-d.v*.8;d.g.position.x=d.x+Math.sin(t*42)*.045*d.shake});
 for(const p of G.portals){p.sw.rotation.z+=dt*2.4;p.em.emissiveIntensity=1.15+Math.sin(t*3+p.ph)*.45;p.beam.material.opacity=.13+Math.sin(t*2+p.ph)*.05}
 for(const s of G.scroll){s.t.offset.x+=s.vx*dt;s.t.offset.y+=s.vy*dt}
 for(const b of G.blink)b.emissiveIntensity=Math.sin(t*3.5)>0?2.2:.15;
 for(const b of G.bob){b.o.position.y=b.y0+Math.sin(t*1.3+b.ph)*b.amp;if(b.roll)b.o.rotation.z=Math.sin(t*1.1+b.ph)*b.roll}
 for(const c of G.conv)c.o.position.x=((t*c.v+c.off)%c.len)-c.len/2;
 for(const s of G.sway)s.o.rotation[s.ax]=s.base+Math.sin(t*s.sp)*s.amp;
 for(const f of G.flick){const k=Math.sin(t*11+f.ph)*.22+Math.sin(t*23+f.ph)*.12;f.m.emissiveIntensity=1.5+k;f.l.intensity=.9+k*.5}
 /* partículas com gravidade e quique no chão */
 for(let i=G.parts.length-1;i>=0;i--){const q=G.parts[i];q.life-=dt;q.v.y-=9.8*dt;q.m.position.addScaledVector(q.v,dt);
  if(q.m.position.y<.03){q.m.position.y=.03;q.v.y*=-.45;q.v.x*=.7;q.v.z*=.7}q.m.rotation.x+=q.spin*dt;q.m.rotation.y+=q.spin*dt;
  q.m.scale.setScalar(Math.max(0,Math.min(1,q.life*2)));if(q.life<=0){dropPart(q);G.parts.splice(i,1)}}
 if(G.trail)for(const m of G.trail.children)if(m.userData.grow){const sc=Math.min(1,m.scale.x+dt*5);m.scale.setScalar(sc);if(sc>=1)m.userData.grow=0}
 if(G.flag)G.flag.rotation.y=Math.sin(t*3)*.2+Math.sin(t*7.3)*.06;
 if(G.goalGlow)G.goalGlow.emissiveIntensity=.8+Math.sin(t*3)*.5;
 G.r.render(G.scene,G.cam)}
