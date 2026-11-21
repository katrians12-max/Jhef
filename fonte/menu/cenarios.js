/* =====================================================================
   CENÁRIOS DO SAGUÃO (itens da categoria "cenario" da Loja do Bip).
   Cada cenário monta um grupo 3D com céu, chão e enfeites, e diz como
   ficam as luzes, a névoa, o palco, os fachos e as partículas.
   Tudo leve: materiais simples, repetições num desenho só (InstancedMesh)
   e texturas pequenas desenhadas na hora, para rodar bem em Chromebook.
   Também desenha os "cartões-postais" que aparecem na loja.
   ===================================================================== */
const CENA=(()=>{
 const PI=Math.PI,rnd=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];
 function cv(w,h,draw){const c=document.createElement("canvas");c.width=w;c.height=h;draw(c.getContext("2d"),w,h);return c}
 const tex=(w,h,d,rep)=>{const t=new THREE.CanvasTexture(cv(w,h,d));if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep[0],rep[1])}return t};
 const vgrad=(c,w,h,stops,y0=0,y1=h)=>{const g=c.createLinearGradient(0,y0,0,y1);stops.forEach(([p,col])=>g.addColorStop(p,col));c.fillStyle=g;c.fillRect(0,y0,w,y1-y0)};
 const at=(E,m,x,y,z)=>{m.position.set(x,y,z);E.add(m);return m};
 const basic=(color,o)=>new THREE.MeshBasicMaterial(Object.assign({color},o||{}));
 const lam=(color,o)=>new THREE.MeshLambertMaterial(Object.assign({color},o||{}));
 const glow=(color,op,sx,sy)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:BIPV.glowTex(),color,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:op,fog:false}));s.scale.set(sx,sy||sx,1);return s};
 /* x de um dos lados, deixando o meio livre para ver o Bip */
 const lado=(a,b)=>(Math.random()<.5?-1:1)*rnd(a,b);
 function sky(E,stops){E.add(new THREE.Mesh(new THREE.SphereGeometry(95,32,20),basic(0xffffff,{map:tex(4,512,(c,w,h)=>vgrad(c,w,h,stops)),side:THREE.BackSide,fog:false,depthWrite:false})))}
 function stars(E,n,op,lo){const pos=new Float32Array(n*3);for(let i=0;i<n;i++){const a=rnd(0,2*PI),e=rnd(lo||.06,1.45),r=88;pos.set([Math.cos(a)*Math.cos(e)*r,Math.sin(e)*r,Math.sin(a)*Math.cos(e)*r],i*3)}
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(pos,3));
  const p=new THREE.Points(g,new THREE.PointsMaterial({color:0xdfe8ff,size:1.6,sizeAttenuation:false,transparent:true,opacity:op,fog:false,depthWrite:false}));E.add(p);return p}
 function floor(E,map,size,y){const m=new THREE.Mesh(new THREE.PlaneGeometry(size||240,size||240),basic(0xffffff,{map}));m.rotation.x=-PI/2;m.position.y=y||0;E.add(m);return m}
 function strip(E,w,d,z,y,mat){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),mat);m.rotation.x=-PI/2;m.position.set(0,y,z);E.add(m);return m}
 /* muitos objetos iguais num desenho só: lista de {p,s,r} ou matrizes prontas */
 function inst(E,geo,mat,list){const im=new THREE.InstancedMesh(geo,mat,Math.max(1,list.length)),o=new THREE.Object3D();
  list.forEach((it,i)=>{if(it.isMatrix4){im.setMatrixAt(i,it);return}o.position.set(...it.p);o.rotation.set(...(it.r||[0,0,0]));typeof it.s=="number"?o.scale.setScalar(it.s):o.scale.set(...(it.s||[1,1,1]));o.updateMatrix();im.setMatrixAt(i,o.matrix)});
  im.count=list.length;im.instanceMatrix.needsUpdate=true;E.add(im);return im}
 function ball(E,x,y,z,r,col,gc,gs,gop){at(E,new THREE.Mesh(new THREE.SphereGeometry(r,28,18),basic(col,{fog:false})),x,y,z);if(gc!=null)at(E,glow(gc,gop||.5,gs),x,y,z-1)}
 function spr(E,w,h,draw,sx,sy,x,y,z,o){const s=new THREE.Sprite(new THREE.SpriteMaterial(Object.assign({map:new THREE.CanvasTexture(cv(w,h,draw)),transparent:true,depthWrite:false},o||{})));s.scale.set(sx,sy,1);return at(E,s,x,y,z)}
 /* reflexo do sol na água: faixa brilhante que vai até o horizonte */
 function reflexo(E,col,w,z0,z1){const t=tex(8,256,(c,W,H)=>{const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,"rgba(255,255,255,.95)");g.addColorStop(.6,"rgba(255,255,255,.35)");g.addColorStop(1,"rgba(255,255,255,0)");c.fillStyle=g;c.fillRect(0,0,W,H);
   c.globalCompositeOperation="destination-out";for(let i=0;i<60;i++){c.fillStyle="rgba(0,0,0,.7)";c.fillRect(0,rnd(0,H),W,rnd(1,4))}});
  const m=strip(E,w,z0-z1,(z0+z1)/2,.03,basic(col,{map:t,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));return m}

 /* ---------- peças que vários cenários usam ---------- */
 function palmeiras(E,list,leafCol){const tr=[],fo=[],T=new THREE.Object3D(),C=new THREE.Object3D(),L=new THREE.Object3D(),Lc=new THREE.Object3D();T.add(C);L.add(Lc);
  list.forEach(([x,z,h,lean,ry])=>{T.position.set(x,0,z);T.rotation.set(0,ry,lean);C.position.set(0,h/2,0);C.scale.set(1,h,1);T.updateMatrixWorld(true);tr.push(C.matrixWorld.clone());
   const top=new THREE.Vector3(0,h,0).applyMatrix4(T.matrixWorld);
   for(let k=0;k<8;k++){L.position.copy(top);L.rotation.set(0,k/8*2*PI+rnd(-.2,.2),0);Lc.rotation.set(0,0,-(PI/2+rnd(.15,.55)));Lc.position.set(1.35,-.2,0);Lc.scale.set(1,1,.28);L.updateMatrixWorld(true);fo.push(Lc.matrixWorld.clone())}});
  const tg=new THREE.CylinderGeometry(.16,.27,1,7);tg.translate(0,0,0);
  inst(E,tg,lam(0x8a5a2b),tr);inst(E,new THREE.ConeGeometry(.42,2.9,4),lam(leafCol||0x2f9a4a,{side:THREE.DoubleSide}),fo)}
 function pinheiros(E,list,cols){const tiers=[],caps=[],tr=[];list.forEach(([x,z,s])=>{tr.push({p:[x,.6*s,z],s:[.25*s,1.2*s,.25*s]});
   [[1.5,1.6],[1.15,2.55],[.8,3.4]].forEach(([r,y],i)=>{tiers.push({p:[x,y*s,z],s:[r*s,1.5*s,r*s],r:[0,rnd(0,3),0]});if(cols.neve&&i==2)caps.push({p:[x,(y+.42)*s,z],s:[.42*s,.66*s,.42*s]})})});
  inst(E,new THREE.CylinderGeometry(1,1,1,6),lam(0x5a3a22),tr);inst(E,new THREE.ConeGeometry(1,1,7),lam(cols.folha,{flatShading:true}),tiers);
  if(caps.length)inst(E,new THREE.ConeGeometry(1,1,7),lam(0xffffff,{flatShading:true}),caps)}
 function arvores(E,list,cols){const tr=[],co=[[],[]];list.forEach(([x,z,h,r])=>{tr.push({p:[x,h/2,z],s:[r*.22,h,r*.22]});
   for(let k=0;k<3;k++)co[k%2].push({p:[x+rnd(-r,r)*.6,h+rnd(-.3,.7)*r,z+rnd(-r,r)*.6],s:[r*rnd(.8,1.15),r*rnd(.6,.85),r*rnd(.8,1.15)],r:[rnd(0,3),rnd(0,3),0]})});
  inst(E,new THREE.CylinderGeometry(.8,1,1,7),lam(cols.tronco||0x5a3a22),tr);co.forEach((L,i)=>inst(E,new THREE.IcosahedronGeometry(1,0),lam(cols.copa[i],{flatShading:true}),L))}
 function montes(E,col,R0,n,hk,wk,seg,arco){const L=[];for(let i=0;i<n;i++){const a=-PI*(arco||.98)+i/(n-1)*PI*(arco||.98)*.98+rnd(-.04,.04),h=rnd(6,17)*hk,w=rnd(7,13)*wk;L.push({p:[Math.cos(a)*R0,h/2-1,Math.sin(a)*R0],s:[w,h,w],r:[0,rnd(0,3),0]})}
  inst(E,new THREE.ConeGeometry(1,1,seg||5,1),basic(col,{fog:false}),L);return L}
 /* pássaro de longe (um "v" que bate as asas) */
 const passaroDraw=col=>(c,w,h)=>{c.strokeStyle=col;c.lineWidth=7;c.lineCap="round";c.beginPath();c.moveTo(6,h*.35);c.quadraticCurveTo(w*.27,h*.1,w/2,h*.62);c.quadraticCurveTo(w*.73,h*.1,w-6,h*.35);c.stroke()};
 function bando(E,n,col,area){const L=[];for(let i=0;i<n;i++){const s=spr(E,96,48,passaroDraw(col),1,.5,0,0,0,{fog:false});L.push({s,a:rnd(0,2*PI),r:rnd(area.r[0],area.r[1]),y:rnd(area.y[0],area.y[1]),z:area.z,v:rnd(.08,.16)*(Math.random()<.5?-1:1),k:rnd(.7,1.3),ph:rnd(0,6)})}
  return (t,dt)=>L.forEach(b=>{b.a+=b.v*dt;b.s.position.set(Math.cos(b.a)*b.r,b.y+Math.sin(t*.6+b.ph)*.4,b.z+Math.sin(b.a)*b.r*.35);b.s.scale.set(b.k,b.k*(.35+.25*Math.abs(Math.sin(t*6+b.ph))),1)})}

 /* =================================================================== */
 const DEF={
 /* ---------- Neon espacial (o mundo original do saguão) ---------- */
 "s-neon":{cfg:{clear:0x0a0d24,fog:[0x22144a,18,80],hemi:[0xb9c8ff,0x2a1840,.55],key:[0xffe9cc,1.35],rim:[0xff4fd8,0x3ce8ff,1.6],fill:[0xffb070,.35],
   palco:[0x141a36,0x1b2440,0x26335a,.6,0xff4fd8],pool:0x7a6cff,beams:[0xff4fd8,0xfff1dc,0x3ce8ff],beamOp:1,
   parts:{n:90,cols:[0x5ef0e0,0xff4fd8,0xffd24a],mode:"up",size:.22,add:true}},
  build(E,H){const spin=[],floats=[],syms=[];
   sky(E,[[0,"#040716"],[.28,"#0a1034"],[.40,"#191650"],[.465,"#3c1d6e"],[.49,"#8a2c86"],[.5,"#c24a7a"],[.51,"#2a1650"],[1,"#120a26"]]);
   const st=stars(E,900,.85);
   const pt=tex(256,256,(c,w,h)=>{vgrad(c,w,h,[[0,"#5ef0e0"],[.3,"#3a8ad8"],[.55,"#6b4fd8"],[.8,"#2b2a7a"],[1,"#141440"]]);c.globalAlpha=.18;for(let i=0;i<14;i++){c.fillStyle=i%2?"#ffffff":"#000000";c.fillRect(0,rnd(0,h),w,rnd(3,12))}});
   const planet=at(E,new THREE.Mesh(new THREE.SphereGeometry(7,40,28),basic(0xffffff,{map:pt,fog:false})),-40,17,-70);planet.rotation.z=.35;
   const rt=tex(256,4,(c,w)=>{const g=c.createLinearGradient(0,0,w,0);[[0,"rgba(255,255,255,0)"],[.2,"rgba(255,210,74,.55)"],[.45,"rgba(255,140,90,.25)"],[.6,"rgba(255,210,74,.6)"],[1,"rgba(255,255,255,0)"]].forEach(([p,col])=>g.addColorStop(p,col));c.fillStyle=g;c.fillRect(0,0,w,4)});
   const rg=new THREE.RingGeometry(9,14.5,96,1),uv=rg.attributes.uv,pp=rg.attributes.position;for(let i=0;i<uv.count;i++){const r=Math.hypot(pp.getX(i),pp.getY(i));uv.setXY(i,(r-9)/5.5,.5)}
   const pr=new THREE.Mesh(rg,basic(0xffffff,{map:rt,transparent:true,side:THREE.DoubleSide,fog:false,depthWrite:false}));pr.position.copy(planet.position);pr.rotation.set(-1.25,.25,.3);E.add(pr);
   at(E,glow(0x6b8cff,.3,40),-40,17,-71);ball(E,34,19,-78,2.2,0xfff1d0,0xffe0a0,14,.45);
   montes(E,0x2c1b5c,64,24,.9,1.2,5);montes(E,0x170d36,50,20,.75,1,4);
   floor(E,tex(128,128,(c,w,h)=>{c.fillStyle="#0e1132";c.fillRect(0,0,w,h);c.strokeStyle="#4b3fc4";c.lineWidth=3;c.strokeRect(0,0,w,h);c.globalAlpha=.4;c.lineWidth=1;c.beginPath();c.moveTo(w/2,0);c.lineTo(w/2,h);c.moveTo(0,h/2);c.lineTo(w,h/2);c.stroke()},[60,60]));
   /* portal-transferidor atrás do Bip */
   const G=new THREE.Group();G.position.set(0,2.85,-2.7);E.add(G);
   G.add(new THREE.Mesh(new THREE.TorusGeometry(2.05,.055,12,128),basic(0x5ef0e0)));
   const m2=new THREE.Mesh(new THREE.TorusGeometry(2.35,.022,8,128),basic(0xff4fd8,{transparent:true,opacity:.85}));G.add(m2);
   const v=[];for(let i=0;i<36;i++){const big=i%3==0,a=i/36*2*PI,r0=2.45,r1=big?2.68:2.58,hw=.018,c=Math.cos(a),s=Math.sin(a),px=-s*hw,py=c*hw;
    const A=[c*r0+px,s*r0+py,0],B=[c*r0-px,s*r0-py,0],C=[c*r1-px,s*r1-py,0],D=[c*r1+px,s*r1+py,0];v.push(...A,...B,...C,...A,...C,...D)}
   const tg=new THREE.BufferGeometry();tg.setAttribute("position",new THREE.Float32BufferAttribute(v,3));
   const T=new THREE.Mesh(tg,basic(0xbff8ff,{transparent:true,opacity:.8,side:THREE.DoubleSide}));G.add(T);spin.push([T,.06],[m2,-.1]);
   G.add(new THREE.Mesh(new THREE.CircleGeometry(2.05,64),basic(0xffffff,{map:tex(256,256,(c,w,h)=>{const r=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);r.addColorStop(0,"rgba(120,90,255,0)");r.addColorStop(.7,"rgba(120,90,255,.14)");r.addColorStop(.97,"rgba(94,240,224,.35)");r.addColorStop(1,"rgba(94,240,224,0)");c.fillStyle=r;c.fillRect(0,0,w,h)}),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})));
   const gl=glow(0x6b6cff,.3,8);gl.position.z=-.2;G.add(gl);
   [-1,1].forEach(s=>{const p=at(E,new THREE.Mesh(new THREE.BoxGeometry(.18,6.2,.18),basic(s<0?0xff4fd8:0x5ef0e0)),s*3.35,3.1,-3.2);const h=glow(s<0?0xff4fd8:0x5ef0e0,.22,1,7);h.position.copy(p.position);E.add(h)});
   /* ilhas com sólidos geométricos */
   const solid=(geo,color,x,y,z,s,rs)=>{const g=new THREE.Group();g.add(new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.35,transparent:true,opacity:.55,metalness:.3,roughness:.3,depthWrite:false})));
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.9})));g.scale.setScalar(s);g.position.set(x,y,z);E.add(g);floats.push({o:g,y,ph:rnd(0,6),rs})};
   const rock=new THREE.MeshStandardMaterial({color:0x2a2050,roughness:.9,flatShading:true});
   [[-8.2,1.4,-7,1.5],[8.6,2,-8.5,1.7],[-15,5.2,-17,1.6],[16,6.4,-19,1.8]].forEach(([x,y,z,s],i)=>{const g=new THREE.Group();const r=new THREE.Mesh(new THREE.DodecahedronGeometry(1.4,0),rock);r.scale.set(1.25,.55,1.25);g.add(r);
    const tp=new THREE.Mesh(new THREE.CylinderGeometry(1.45,1.45,.08,7),new THREE.MeshStandardMaterial({color:0x3a2c78,roughness:.6,flatShading:true}));tp.position.y=.48;g.add(tp);
    const e=new THREE.Mesh(new THREE.TorusGeometry(1.46,.03,6,7),basic(i%2?0x5ef0e0:0xff4fd8));e.rotation.x=PI/2;e.position.y=.52;g.add(e);g.scale.setScalar(s);g.position.set(x,y,z);E.add(g);floats.push({o:g,y,ph:i*1.7,rs:0,amp:.18})});
   solid(new THREE.ConeGeometry(1,1.5,4),0xffb84a,-8.2,3.6,-7,1.2,.25);solid(new THREE.BoxGeometry(1.4,1.4,1.4),0x5ef0e0,8.6,4.4,-8.5,1.1,.35);
   solid(new THREE.IcosahedronGeometry(1,0),0xff4fd8,-15,6.2,-17,1.5,.2);solid(new THREE.TorusGeometry(.9,.3,10,24),0x8a7bff,16,7.4,-19,1.5,.3);
   solid(new THREE.OctahedronGeometry(1,0),0x5ef07a,-25,8.5,-32,2.2,.15);solid(new THREE.DodecahedronGeometry(1,0),0xffd24a,25,9.5,-34,2.4,.12);
   ["π","√","∑","∞","+","×","÷","=","%","x²","½","∠","△","7","3","9"].forEach((ch,i)=>{const col=["#5ef0e0","#ff4fd8","#ffd24a","#a99bff"][i%4],x=(i%2?1:-1)*rnd(4.2,14),z=rnd(-4,-18),y=rnd(1.2,8.5),k=rnd(.7,1.3)*(1-z/30);
    const s=spr(E,128,128,c=>{c.font='800 78px "Baloo 2","Segoe UI Symbol",system-ui,sans-serif';c.textAlign="center";c.textBaseline="middle";c.shadowColor=col;c.shadowBlur=22;c.fillStyle="#fff";c.fillText(ch,64,68);c.shadowBlur=8;c.fillStyle=col;c.fillText(ch,64,68)},k,k,x,y,z,{opacity:.8});
    syms.push({s,x,y,z,ph:rnd(0,6),v:rnd(.3,.7)})});
   return (t,dt)=>{spin.forEach(([o,v])=>o.rotation.z+=v*dt);st.rotation.y+=dt*.004;
    floats.forEach(f=>{f.o.position.y=f.y+Math.sin(t*.8+f.ph)*(f.amp||.3);if(f.rs){f.o.rotation.y+=f.rs*dt;f.o.rotation.x+=f.rs*.4*dt}});
    syms.forEach(u=>{u.s.position.set(u.x+Math.sin(t*.3+u.ph)*.3,u.y+Math.sin(t*u.v+u.ph)*.35,u.z);u.s.material.opacity=.55+.3*Math.sin(t*.9+u.ph)})}}},

 /* ---------- Praia ao pôr do sol ---------- */
 "s-praia":{cfg:{clear:0xf4a37d,fog:[0xf3a985,30,115],hemi:[0xffd8b0,0xc28a62,.75],key:[0xffd2a0,1.3],rim:[0xff7a59,0xffd27a,1.3],fill:[0xffb070,.45],
   palco:[0x7a5236,0x9a6a44,0xbf8f5e,.1,0xffffff],pool:0xffc27a,beams:null,parts:{n:40,cols:[0xfff0b0,0xffc27a],mode:"float",size:.16,add:true}},
  build(E){sky(E,[[0,"#2b3d92"],[.25,"#6a4fa3"],[.4,"#e0708a"],[.46,"#ff9e6b"],[.495,"#ffd27f"],[.5,"#ffe6a8"],[.52,"#2a5f9e"],[1,"#2a5f9e"]]);
   ball(E,0,9,-88,6.5,0xffe39a,0xff9a4a,46,.65);
   at(E,new THREE.Mesh(new THREE.SphereGeometry(1,16,8),basic(0x7a3f6e)),-48,0,-82).scale.set(22,3.2,8);at(E,new THREE.Mesh(new THREE.SphereGeometry(1,16,8),basic(0x8a4a74)),40,0,-86).scale.set(16,2.2,6);
   floor(E,tex(128,128,(c,w,h)=>{c.fillStyle="#efcf98";c.fillRect(0,0,w,h);for(let i=0;i<260;i++){c.fillStyle=pick(["#e2bd82","#f7deb0","#d8b177"]);c.fillRect(rnd(0,w),rnd(0,h),2,2)}},[50,50]));
   const mar=tex(256,256,(c,w,h)=>{c.fillStyle="#2f6fb0";c.fillRect(0,0,w,h);for(let i=0;i<70;i++){c.fillStyle=pick(["rgba(140,200,255,.45)","rgba(255,190,140,.35)","rgba(20,60,120,.5)"]);c.fillRect(rnd(-20,w),rnd(0,h),rnd(20,70),rnd(1.5,3))}},[18,24]);
   const sea=strip(E,420,200,-112,.02,basic(0xffffff,{map:mar}));
   const esp=tex(256,8,(c,w,h)=>{c.fillStyle="#fff";for(let x=0;x<w;x+=4)c.fillRect(x,rnd(0,3),3,rnd(3,6))},[30,1]);
   const foam=strip(E,420,1.2,-12,.04,basic(0xffffff,{map:esp,transparent:true,opacity:.8}));
   reflexo(E,0xffc27a,7,-14,-88);
   palmeiras(E,[[-7.5,-5,6.5,.18,0],[-11,-9,7.5,-.12,1],[-15,-4,6,.22,2],[8.5,-6,7,-.2,3],[12.5,-10,8,.1,4],[16,-5,6.2,-.25,5]],0x2e8a48);
   const birds=bando(E,6,"#5a3050",{r:[10,26],y:[11,16],z:-45});
   return (t,dt)=>{mar.offset.x+=dt*.004;mar.offset.y+=dt*.01;esp.offset.x+=dt*.02;foam.material.opacity=.55+.3*Math.sin(t*1.6);foam.position.z=-12+Math.sin(t*1.6)*.35;birds(t,dt)}}},

 /* ---------- Montanhas nevadas ---------- */
 "s-neve":{cfg:{clear:0xcfe2f4,fog:[0xd8e7f5,26,100],hemi:[0xffffff,0xa8b8d0,.8],key:[0xf2f7ff,1.25],rim:[0x8fd0ff,0xffffff,1.1],fill:[0xcfe4ff,.4],
   palco:[0x9fbad6,0xc6daec,0xeaf3fb,.25,0x5ec8ff],pool:0x9fd8ff,beams:null,parts:{n:140,cols:[0xffffff],mode:"down",size:.14,add:false}},
  build(E){sky(E,[[0,"#3f7fc6"],[.3,"#79aee0"],[.45,"#bcd9f2"],[.5,"#eef6fd"],[1,"#eef6fd"]]);
   ball(E,-30,30,-80,3,0xfffbe6,0xffffff,20,.5);
   const corpo=[],topo=[];[[70,26,1.6,1.25],[54,22,1.15,1]].forEach(([R0,n,hk,wk])=>{for(let i=0;i<n;i++){const a=-PI*.97+i/(n-1)*PI*.94+rnd(-.04,.04),h=rnd(10,24)*hk,w=rnd(8,14)*wk,x=Math.cos(a)*R0,z=Math.sin(a)*R0,ry=rnd(0,3);
    corpo.push({p:[x,h/2-1,z],s:[w,h,w],r:[0,ry,0]});topo.push({p:[x,h*.825-1,z],s:[w*.36,h*.35,w*.36],r:[0,ry,0]})}});
   inst(E,new THREE.ConeGeometry(1,1,5,1),lam(0x6f84a8,{flatShading:true}),corpo);inst(E,new THREE.ConeGeometry(1,1,5,1),lam(0xffffff,{flatShading:true}),topo);
   floor(E,tex(128,128,(c,w,h)=>{c.fillStyle="#f1f6fc";c.fillRect(0,0,w,h);for(let i=0;i<120;i++){c.fillStyle=pick(["#e2ebf6","#ffffff","#dbe6f3"]);c.beginPath();c.arc(rnd(0,w),rnd(0,h),rnd(1,4),0,2*PI);c.fill()}},[40,40]));
   const L=[];for(let i=0;i<46;i++){const z=rnd(-36,-4),x=z>-12?lado(5,26):lado(1.5,30);L.push([x,z,rnd(.9,1.8)])}
   pinheiros(E,L,{folha:0x2f6b52,neve:true});
   /* lago congelado */
   const lago=at(E,new THREE.Mesh(new THREE.CircleGeometry(1,40),basic(0xbfe3f7)),9,.03,-20);lago.rotation.x=-PI/2;lago.scale.set(9,5,1);
   return ()=>{}}},

 /* ---------- Floresta amazônica ---------- */
 "s-floresta":{cfg:{clear:0x5f9a74,fog:[0x5e9670,12,62],hemi:[0xd8ffd0,0x2a4a20,.75],key:[0xfff1c0,1.3],rim:[0x9cff7a,0xffe06a,1.2],fill:[0xffe2a0,.35],
   palco:[0x4a3220,0x6b4a2e,0x8a6240,.1,0xffd24a],pool:0xc8ff7a,beams:[0xfff4b0,0xe8ff9a,0xfff4b0],beamOp:1.6,parts:{n:70,cols:[0xe8ff6a,0xfff09a],mode:"float",size:.18,add:true}},
  build(E){sky(E,[[0,"#123d2e"],[.3,"#2a6a4a"],[.45,"#7fbf8a"],[.5,"#c9ecb0"],[1,"#c9ecb0"]]);
   floor(E,tex(128,128,(c,w,h)=>{c.fillStyle="#2f5a2a";c.fillRect(0,0,w,h);for(let i=0;i<300;i++){c.fillStyle=pick(["#3c6e30","#26491f","#4a7a35","#5b4426"]);c.fillRect(rnd(0,w),rnd(0,h),rnd(2,5),rnd(2,5))}},[40,40]));
   const T=[];for(let i=0;i<34;i++){const z=rnd(-45,-5),x=z>-14?lado(6,26):lado(2,34);T.push([x,z,rnd(8,15),rnd(2.4,4)])}
   for(let i=0;i<14;i++)T.push([rnd(-40,40),rnd(-70,-50),rnd(12,18),rnd(4,6)]);
   arvores(E,T,{tronco:0x4a3320,copa:[0x2f7a3a,0x3f9a42]});
   const F=[];for(let i=0;i<60;i++){const z=rnd(-30,-3);F.push({p:[z>-10?lado(3.5,24):lado(0,30),.5,z],s:[rnd(.8,1.6),rnd(.8,1.4),rnd(.8,1.6)],r:[0,rnd(0,3),0]})}
   inst(E,new THREE.ConeGeometry(1,1.2,6),lam(0x4c9a3c,{flatShading:true}),F);
   /* rio passando atrás */
   const rio=tex(64,64,(c,w,h)=>{c.fillStyle="#4f8fa0";c.fillRect(0,0,w,h);for(let i=0;i<30;i++){c.fillStyle="rgba(200,240,255,.35)";c.fillRect(rnd(0,w),rnd(0,h),rnd(6,16),1.5)}},[30,2]);
   strip(E,240,7,-22,.03,basic(0xffffff,{map:rio}));
   /* araras voando */
   const araras=[];["#e8322f","#2f7be0","#f2c230"].forEach((col,i)=>{const s=spr(E,128,64,(c,w,h)=>{c.fillStyle=col;c.beginPath();c.ellipse(w/2,h/2,26,9,0,0,2*PI);c.fill();c.fillStyle=i==0?"#2f7be0":"#f2c230";c.beginPath();c.moveTo(w/2-8,h/2);c.lineTo(w/2-30,6);c.lineTo(w/2+10,h/2);c.fill();c.beginPath();c.moveTo(w/2-8,h/2);c.lineTo(w/2-30,h-6);c.lineTo(w/2+10,h/2);c.fill();
     c.fillStyle=col;c.beginPath();c.moveTo(w/2-24,h/2);c.lineTo(8,h/2-4);c.lineTo(8,h/2+4);c.fill();c.fillStyle="#fff";c.beginPath();c.arc(w/2+22,h/2-2,4,0,2*PI);c.fill()},1.6,.8,0,0,0);araras.push({s,a:i*2,r:rnd(9,16),y:rnd(9,13),v:rnd(.18,.28)})});
   return (t,dt)=>{rio.offset.x+=dt*.03;araras.forEach(b=>{b.a+=b.v*dt;const x=Math.cos(b.a)*b.r;b.s.position.set(x,b.y+Math.sin(t*2+b.a)*.5,-14+Math.sin(b.a)*5);b.s.scale.set(1.6*(Math.sin(b.a)>0?-1:1),.8*(.6+.4*Math.abs(Math.sin(t*7+b.a))),1)})}}},

 /* ---------- Pantanal ---------- */
 "s-pantanal":{cfg:{clear:0xf0a070,fog:[0xeda07c,26,105],hemi:[0xffd6a8,0x6a6a3a,.75],key:[0xffd49a,1.3],rim:[0xff8a5a,0xffd27a,1.3],fill:[0xffb070,.4],
   palco:[0x6b4a2e,0x8a5f38,0xa8774a,.1,0xffc23a],pool:0xffc27a,beams:null,parts:{n:30,cols:[0xfff0b0],mode:"float",size:.13,add:true}},
  build(E){sky(E,[[0,"#3b2a6b"],[.28,"#8a4f8a"],[.42,"#e9785a"],[.48,"#ffb86b"],[.5,"#ffd98f"],[1,"#ffd98f"]]);
   ball(E,6,4.5,-90,7,0xffc06a,0xff8a3a,50,.7);
   const ag=tex(256,256,(c,w,h)=>{vgrad(c,w,h,[[0,"#d98a6a"],[1,"#8a5a8a"]]);for(let i=0;i<80;i++){c.fillStyle=pick(["rgba(255,220,170,.35)","rgba(90,50,110,.35)"]);c.fillRect(rnd(-20,w),rnd(0,h),rnd(20,60),1.5)}},[6,1]);
   strip(E,420,96,-56,.02,basic(0xffffff,{map:ag}));reflexo(E,0xffb85a,8,-10,-90);
   floor(E,tex(128,128,(c,w,h)=>{c.fillStyle="#6e7f34";c.fillRect(0,0,w,h);for(let i=0;i<300;i++){c.fillStyle=pick(["#7f9040","#5c6c2a","#8c9a4a"]);c.fillRect(rnd(0,w),rnd(0,h),1.5,rnd(3,7))}},[40,40]));
   /* margem de árvores lá longe e capões */
   const cap=[];for(let i=0;i<40;i++)cap.push({p:[rnd(-90,90),rnd(1,4),rnd(-100,-86)],s:[rnd(5,10),rnd(3,6),rnd(3,5)],r:[0,rnd(0,3),0]});
   inst(E,new THREE.IcosahedronGeometry(1,0),basic(0x5a3a5a),cap);
   const vit=[];for(let i=0;i<22;i++)vit.push({p:[lado(2,18),.05,rnd(-34,-9)],s:[rnd(.5,1.1),1,rnd(.5,1.1)]});
   inst(E,new THREE.CylinderGeometry(1,1,.05,14),lam(0x3f8a3a),vit);
   arvores(E,[[-9,-6,6,2.4],[-14,-11,7,2.8],[10,-5,6.5,2.6]],{copa:[0xe86aa8,0xf07ab8]});arvores(E,[[15,-11,7,2.6],[-19,-8,6,2.4]],{copa:[0xf2c230,0xf7d24a]});
   /* tuiuiús na beira da água */
   const tuiu=(c,w,h)=>{c.fillStyle="#2a2a2a";c.fillRect(w*.44,h*.62,3,h*.36);c.fillRect(w*.54,h*.62,3,h*.36);c.fillStyle="#fafafa";c.beginPath();c.ellipse(w*.5,h*.55,w*.2,h*.12,-.2,0,2*PI);c.fill();
    c.fillStyle="#1a1a1a";c.beginPath();c.ellipse(w*.55,h*.6,w*.14,h*.06,-.2,0,2*PI);c.fill();c.fillStyle="#d8282a";c.fillRect(w*.38,h*.36,w*.08,h*.08);
    c.fillStyle="#1a1a1a";c.fillRect(w*.38,h*.16,w*.07,h*.22);c.beginPath();c.arc(w*.41,h*.15,w*.06,0,2*PI);c.fill();c.beginPath();c.moveTo(w*.38,h*.14);c.lineTo(w*.12,h*.25);c.lineTo(w*.37,h*.18);c.fill()};
   [[-6.5,-8.5,1.8],[7,-10,1.6],[-11,-14,1.4]].forEach(([x,z,s],i)=>{const o=spr(E,128,160,tuiu,s,s*1.25,x,s*.62,z);if(i==1)o.scale.x*=-1});
   const birds=bando(E,7,"#3a2040",{r:[12,28],y:[9,15],z:-48});
   return (t,dt)=>{ag.offset.x+=dt*.005;birds(t,dt)}}},

 /* ---------- Cidade à noite ---------- */
 "s-cidade":{cfg:{clear:0x0b0d26,fog:[0x1a1640,20,90],hemi:[0x8a9cff,0x201a40,.6],key:[0xffe9cc,1.3],rim:[0xff4fd8,0x3ce8ff,1.6],fill:[0xffb070,.35],
   palco:[0x1a1d30,0x262a42,0x343a5a,.6,0x3ce8ff],pool:0x6a7cff,beams:[0x9fdcff,0xffffff,0xffb0f0],beamOp:.9,parts:{n:0,cols:[0xffffff],mode:"float",size:.1,add:true}},
  build(E,H){sky(E,[[0,"#03051a"],[.3,"#0c1036"],[.44,"#231a56"],[.49,"#5a2f7a"],[.5,"#7a3f86"],[1,"#141030"]]);stars(E,350,.6,.25);
   ball(E,-28,26,-80,2.6,0xf4f0ff,0xc8c0ff,16,.5);
   const jan=(acesas)=>tex(64,128,(c,w,h)=>{c.fillStyle="#121733";c.fillRect(0,0,w,h);for(let y=6;y<h-4;y+=10)for(let x=5;x<w-4;x+=12){c.fillStyle=Math.random()<acesas?pick(["#ffd98a","#ffe7b0","#9fe8ff","#ffc06a"]):"#1d2346";c.fillRect(x,y,7,6)}});
   const tA=jan(.45),tB=jan(.3),tC=jan(.6);
   const near=[[],[],[]],far=[];
   for(let i=0;i<30;i++){const z=rnd(-42,-7),x=lado(z>-15?8:3,32),w=rnd(3,6),h=rnd(6,22),d=rnd(3,6);near[i%3].push({p:[x,h/2,z],s:[w,h,d]})}
   for(let i=0;i<50;i++){const w=rnd(4,9),h=rnd(10,34);far.push({p:[rnd(-75,75),h/2,rnd(-78,-52)],s:[w,h,rnd(4,8)]})}
   [tA,tB,tC].forEach((t,i)=>inst(E,new THREE.BoxGeometry(1,1,1),basic(0xffffff,{map:t}),near[i]));inst(E,new THREE.BoxGeometry(1,1,1),basic(0xffffff,{map:jan(.35)}),far);
   floor(E,tex(128,128,(c,w,h)=>{c.fillStyle="#16172a";c.fillRect(0,0,w,h);c.fillStyle="#22243c";c.fillRect(0,0,w,3);c.fillRect(0,0,3,h);c.fillStyle="#f2c230";for(let y=10;y<h;y+=32)c.fillRect(w/2-1,y,2,14)},[40,40]));
   /* letreiros de néon */
   const neon=[];[[0xff4fd8,-9,6,-10],[0x3ce8ff,10,7,-12],[0xffd24a,-14,9,-20],[0x7cff6b,16,10,-24]].forEach(([c,x,y,z])=>{const m=at(E,new THREE.Mesh(new THREE.PlaneGeometry(2.6,.8),basic(c)),x,y,z+3.1);const g=glow(c,.5,5,2.2);at(E,g,x,y,z+3.3);neon.push([m,g])});
   return (t)=>{neon.forEach(([m,g],i)=>{const on=Math.sin(t*2+i*1.7)>-.85?1:.25;m.material.opacity=on;m.material.transparent=true;g.material.opacity=.5*on})}}},

 /* ---------- Fundo do mar ---------- */
 "s-mar":{cfg:{clear:0x0a4f80,fog:[0x0b5a8a,9,58],hemi:[0x8fe8ff,0x0b3050,.85],key:[0xc8f4ff,1.25],rim:[0x3cf0ff,0x7a8cff,1.4],fill:[0x9fe8ff,.4],
   palco:[0x2a5f7a,0x34759a,0x3f8db8,.3,0x5ef0e0],pool:0x5ef0e0,beams:[0x9ff4ff,0xd8fbff,0x9ff4ff],beamOp:2,parts:{n:80,cols:[0xd8f6ff,0xa8e8ff],mode:"up",size:.17,add:true,fast:1.6}},
  build(E){sky(E,[[0,"#7fe0ff"],[.2,"#2ea6dc"],[.42,"#0e6aa0"],[.5,"#0a4f80"],[1,"#06304f"]]);
   floor(E,tex(128,128,(c,w,h)=>{c.fillStyle="#d1b98a";c.fillRect(0,0,w,h);c.strokeStyle="rgba(150,120,80,.35)";c.lineWidth=2;for(let y=4;y<h;y+=10){c.beginPath();c.moveTo(0,y);for(let x=0;x<=w;x+=8)c.lineTo(x,y+Math.sin(x*.2)*2.5);c.stroke()}},[40,40]));
   const L=k=>{const a=[];for(let i=0;i<k;i++){const z=rnd(-34,-4);a.push([z>-10?lado(4,22):lado(1,28),z])}return a};
   inst(E,new THREE.ConeGeometry(.35,1,6),lam(0xff6f91,{flatShading:true}),L(40).map(([x,z])=>{const h=rnd(1.2,3);return {p:[x,h/2,z],s:[1,h,1],r:[rnd(-.2,.2),0,rnd(-.2,.2)]}}));
   inst(E,new THREE.SphereGeometry(1,12,8),lam(0xb06bff,{flatShading:true}),L(18).map(([x,z])=>({p:[x,.4,z],s:rnd(.6,1.4)})));
   inst(E,new THREE.CylinderGeometry(.18,.22,1,7),lam(0xff9a3c),L(50).map(([x,z])=>{const h=rnd(.8,2.2);return {p:[x+rnd(-.5,.5),h/2,z+rnd(-.5,.5)],s:[1,h,1]}}));
   inst(E,new THREE.DodecahedronGeometry(1,0),lam(0x4a6a8a,{flatShading:true}),L(16).map(([x,z])=>({p:[x,.3,z],s:[rnd(1,2.4),rnd(.6,1.2),rnd(1,2)],r:[0,rnd(0,3),0]})));
   /* algas balançando (em grupinhos) */
   const algas=[];for(let g=0;g<7;g++){const G=new THREE.Group(),z=rnd(-22,-5),x=lado(z>-10?4:2,18);G.position.set(x,0,z);
    for(let k=0;k<6;k++){const h=rnd(3,6.5),m=new THREE.Mesh(new THREE.PlaneGeometry(.35,h,1,4),lam(pick([0x2fa86a,0x3fbf6a,0x268f5a]),{side:THREE.DoubleSide}));m.geometry.translate(0,h/2,0);m.position.set(rnd(-1,1),0,rnd(-1,1));m.rotation.y=rnd(0,3);G.add(m)}E.add(G);algas.push(G)}
   /* peixes e águas-vivas */
   const peixe=(a,b)=>(c,w,h)=>{c.fillStyle=a;c.beginPath();c.ellipse(w*.45,h/2,w*.32,h*.3,0,0,2*PI);c.fill();c.beginPath();c.moveTo(w*.72,h/2);c.lineTo(w*.97,h*.18);c.lineTo(w*.97,h*.82);c.fill();
    c.fillStyle=b;c.fillRect(w*.38,h*.22,w*.07,h*.56);c.fillStyle="#fff";c.beginPath();c.arc(w*.25,h*.42,h*.1,0,2*PI);c.fill();c.fillStyle="#102030";c.beginPath();c.arc(w*.24,h*.42,h*.05,0,2*PI);c.fill()};
   const peixes=[];[["#ff8a2a","#ffffff"],["#3cb4ff","#ffe14d"],["#ffd23a","#2a6aff"],["#ff5a8a","#fff"],["#7cff6b","#2a8a4a"]].forEach(([a,b],i)=>{for(let k=0;k<2;k++){const s=rnd(.8,1.5);peixes.push({o:spr(E,128,64,peixe(a,b),s,s/2,0,0,0),x:rnd(-25,25),y:rnd(1.5,8),z:rnd(-24,-6),v:rnd(1,2.2)*(Math.random()<.5?-1:1),ph:rnd(0,6),s})}});
   const agua=[];for(let i=0;i<3;i++){const o=spr(E,96,128,(c,w,h)=>{const g=c.createRadialGradient(w/2,h*.35,2,w/2,h*.35,w*.45);g.addColorStop(0,"rgba(255,190,240,.95)");g.addColorStop(1,"rgba(255,120,220,.25)");c.fillStyle=g;c.beginPath();c.arc(w/2,h*.38,w*.4,PI,2*PI);c.fill();
     c.strokeStyle="rgba(255,170,235,.8)";c.lineWidth=3;for(let k=0;k<5;k++){c.beginPath();c.moveTo(w*.2+k*w*.15,h*.38);c.quadraticCurveTo(w*.15+k*w*.15,h*.65,w*.22+k*w*.15,h*.95);c.stroke()}},1.4,1.9,lado(6,14),rnd(4,8),rnd(-18,-10),{blending:THREE.AdditiveBlending});agua.push({o,y:o.position.y,ph:rnd(0,6)})}
   return (t,dt)=>{algas.forEach((G,i)=>{G.rotation.z=Math.sin(t*.9+i)*.12;G.rotation.x=Math.cos(t*.7+i)*.08});
    peixes.forEach(f=>{f.x+=f.v*dt;if(f.x>30)f.x=-30;if(f.x<-30)f.x=30;f.o.position.set(f.x,f.y+Math.sin(t*1.3+f.ph)*.3,f.z);f.o.scale.set(f.s*(f.v>0?-1:1),f.s/2,1)});
    agua.forEach(a=>{a.o.position.y=a.y+Math.sin(t*.6+a.ph)*.8;a.o.scale.y=1.9*(1+.08*Math.sin(t*2.4+a.ph))})}}},

 /* ---------- Egito ---------- */
 "s-egito":{cfg:{clear:0xf2dcae,fog:[0xf1dbab,34,120],hemi:[0xfff1d6,0xc89a5a,.85],key:[0xfff0d0,1.35],rim:[0xffc46a,0x9fd8ff,1.1],fill:[0xffd9a0,.4],
   palco:[0xb8915a,0xcfa66b,0xe0bd84,.1,0xffc23a],pool:0xffd27a,beams:null,parts:{n:60,cols:[0xf4dcaa,0xe9c98a],mode:"side",size:.1,add:false}},
  build(E){sky(E,[[0,"#2f7fd8"],[.3,"#6fb2ec"],[.44,"#bfe0f4"],[.5,"#f6e4b8"],[1,"#f6e4b8"]]);
   ball(E,22,34,-80,3.2,0xfffbe8,0xfff0b0,26,.55);
   floor(E,tex(128,128,(c,w,h)=>{c.fillStyle="#e6c07a";c.fillRect(0,0,w,h);c.strokeStyle="rgba(190,140,70,.35)";c.lineWidth=2;for(let y=6;y<h;y+=14){c.beginPath();c.moveTo(0,y);for(let x=0;x<=w;x+=8)c.lineTo(x,y+Math.sin(x*.12+y)*3);c.stroke()}},[30,30]));
   const du=[];for(let i=0;i<22;i++)du.push({p:[rnd(-90,90),0,rnd(-95,-40)],s:[rnd(14,26),rnd(2.5,5),rnd(8,14)],r:[0,rnd(0,3),0]});
   inst(E,new THREE.SphereGeometry(1,16,8),lam(0xe2b56a),du);
   const pir=new THREE.ConeGeometry(1,1,4,1),pm=lam(0xd9a95a,{flatShading:true});
   [[-18,-46,26,17],[6,-62,22,14],[24,-40,13,8.5],[-36,-70,16,10]].forEach(([x,z,b,h])=>{const m=at(E,new THREE.Mesh(pir,pm),x,h/2,z);m.scale.set(b*.71,h,b*.71);m.rotation.y=PI/4+rnd(-.15,.15)});
   /* oásis com palmeiras e um obelisco */
   const oa=at(E,new THREE.Mesh(new THREE.CircleGeometry(1,32),basic(0x3a9fc0)),11,.03,-14);oa.rotation.x=-PI/2;oa.scale.set(5,3,1);
   palmeiras(E,[[8,-12,5.5,.15,0],[13.5,-15,6.5,-.1,1],[15,-11,5,-.2,2],[-10,-9,6,.12,3]],0x4a9a3a);
   const ob=at(E,new THREE.Mesh(new THREE.CylinderGeometry(.35,.6,7,4),lam(0xcfa060,{flatShading:true})),-8.5,3.5,-16);ob.rotation.y=PI/4;
   at(E,new THREE.Mesh(new THREE.ConeGeometry(.42,.9,4),lam(0xffd24a,{flatShading:true})),-8.5,7.45,-16).rotation.y=PI/4;
   return ()=>{}}},

 /* ---------- Paris ---------- */
 "s-paris":{cfg:{clear:0x3a2a6a,fog:[0x5a3a7a,24,100],hemi:[0xffc8e0,0x2a2050,.7],key:[0xffe0c0,1.3],rim:[0xffb05a,0xb48cff,1.4],fill:[0xffb070,.4],
   palco:[0x2a2440,0x3a3258,0x4a4070,.5,0xffc23a],pool:0xffb86a,beams:[0xffd9a0,0xffffff,0xffd9a0],beamOp:.8,parts:{n:50,cols:[0xffd98a,0xfff0c0],mode:"float",size:.15,add:true}},
  build(E){sky(E,[[0,"#151a4a"],[.28,"#3a2f7a"],[.42,"#8a4f96"],[.48,"#f08a6a"],[.5,"#ffc08a"],[1,"#2a2040"]]);stars(E,160,.5,.45);
   /* a torre (feita de 4 pernas, 2 andares e a ponta) */
   const T=new THREE.Group(),tm=lam(0x5a4632);const perna=(x0,z0,y0,x1,z1,y1,r)=>{const a=new THREE.Vector3(x0,y0,z0),b=new THREE.Vector3(x1,y1,z1),m=new THREE.Mesh(new THREE.CylinderGeometry(r*.7,r,a.distanceTo(b),4),tm);
    m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());T.add(m)};
   [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([sx,sz])=>{perna(sx*4.2,sz*4.2,0,sx*1.9,sz*1.9,8,.55);perna(sx*1.9,sz*1.9,8.4,sx*.95,sz*.95,15,.32)});
   const arco=new THREE.Mesh(new THREE.TorusGeometry(2.6,.25,6,16,PI),tm);arco.position.set(0,2.6,4.1);T.add(arco);const arco2=arco.clone();arco2.position.z=-4.1;T.add(arco2);
   const plat=(w,y,h)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,w),tm);m.position.y=y;T.add(m)};plat(5.2,8.2,.6);plat(2.6,15.2,.4);
   const pt=new THREE.Mesh(new THREE.CylinderGeometry(.22,1.05,10,4),tm);pt.position.y=20.4;pt.rotation.y=PI/4;T.add(pt);
   const sp=new THREE.Mesh(new THREE.CylinderGeometry(.05,.12,2.6,5),tm);sp.position.y=26.6;T.add(sp);
   /* luzinhas douradas piscando na torre */
   const n=260,pos=new Float32Array(n*3);for(let i=0;i<n;i++){const y=rnd(0,26),k=y<8?4.2-(2.3*y/8):y<15?1.9-(.95*(y-8)/7):Math.max(.15,1.05*(1-(y-15)/10)),s=Math.random()<.5;
    const a=pick([-1,1]);pos.set(s?[a*k,y,rnd(-k,k)]:[rnd(-k,k),y,a*k],i*3)}
   const gm=new THREE.BufferGeometry();gm.setAttribute("position",new THREE.BufferAttribute(pos,3));
   const luz=new THREE.Points(gm,new THREE.PointsMaterial({color:0xffd98a,size:.35,map:BIPV.glowTex(),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));T.add(luz);
   T.position.set(-15,0,-40);T.rotation.y=.35;E.add(T);at(E,glow(0xffc06a,.25,26,40),-15,13,-41);
   /* prédios clássicos com telhados */
   const jan=tex(64,64,(c,w,h)=>{c.fillStyle="#e6d3b0";c.fillRect(0,0,w,h);for(let y=8;y<h-4;y+=16)for(let x=6;x<w-4;x+=14){c.fillStyle=Math.random()<.5?"#ffcf7a":"#4a4060";c.fillRect(x,y,7,10)}});
   const P=[],Tt=[];for(let i=0;i<40;i++){const z=i<14?rnd(-32,-14):rnd(-80,-55),x=i<14?lado(10,34):rnd(-80,80),w=rnd(5,9),h=rnd(5,9),d=rnd(4,7),ry=rnd(-.2,.2);
    P.push({p:[x,h/2,z],s:[w,h,d],r:[0,ry,0]});Tt.push({p:[x,h+.9,z],s:[w/1.6,1.8,d*.62],r:[0,ry+PI/4,0]})}
   inst(E,new THREE.BoxGeometry(1,1,1),basic(0xffffff,{map:jan}),P);inst(E,new THREE.CylinderGeometry(.01,1,1,4),lam(0x4a5068),Tt);
   floor(E,tex(128,128,(c,w,h)=>{c.fillStyle="#6a6070";c.fillRect(0,0,w,h);c.strokeStyle="#5a5262";c.lineWidth=2;for(let y=0;y<h;y+=16)for(let x=(y/16)%2*8;x<w;x+=16)c.strokeRect(x,y,16,16)},[60,60]));
   /* postes de luz */
   [[-6,-6],[6,-6],[-10,-12],[10,-12]].forEach(([x,z])=>{at(E,new THREE.Mesh(new THREE.CylinderGeometry(.06,.09,3.4,6),lam(0x2a2a3a)),x,1.7,z);at(E,glow(0xffd98a,.8,1.4),x,3.5,z);at(E,new THREE.Mesh(new THREE.SphereGeometry(.18,10,8),basic(0xfff0c0)),x,3.5,z)});
   return (t)=>{luz.material.opacity=.65+.35*Math.sin(t*9)*Math.sin(t*3.3)}}},

 /* ---------- Base na Lua ---------- */
 "s-lua":{cfg:{clear:0x020308,fog:[0x05060c,40,130],hemi:[0xcfd8ff,0x101018,.45],key:[0xffffff,1.6],rim:[0x5ef0e0,0x8aa8ff,1.5],fill:[0xb0c8ff,.3],
   palco:[0x5d616c,0x7a7f8b,0x989eaa,.55,0x5ef0e0],pool:0x5ef0e0,beams:null,parts:{n:24,cols:[0xcfe8ff],mode:"float",size:.1,add:true}},
  build(E){sky(E,[[0,"#000000"],[.45,"#05060d"],[.5,"#0c1020"],[1,"#000000"]]);const st=stars(E,1600,.95,.02);
   const tt=tex(256,128,(c,w,h)=>{c.fillStyle="#1d5fc4";c.fillRect(0,0,w,h);for(let i=0;i<18;i++){c.fillStyle=pick(["#3f9a4a","#5aa84a","#b89a5a"]);c.beginPath();c.ellipse(rnd(0,w),rnd(h*.2,h*.8),rnd(10,30),rnd(6,18),rnd(0,3),0,2*PI);c.fill()}
    c.fillStyle="#f2f6ff";c.fillRect(0,0,w,8);c.fillRect(0,h-8,w,8);c.globalAlpha=.6;for(let i=0;i<26;i++){c.fillRect(rnd(0,w),rnd(10,h-10),rnd(20,50),rnd(2,4))}});
   const terra=at(E,new THREE.Mesh(new THREE.SphereGeometry(8,40,28),lam(0xffffff,{map:tt,fog:false})),24,22,-72);terra.rotation.z=.4;at(E,glow(0x6aa8ff,.5,26),24,22,-73);
   floor(E,tex(128,128,(c,w,h)=>{c.fillStyle="#8d9099";c.fillRect(0,0,w,h);for(let i=0;i<40;i++){const r=rnd(2,9);c.fillStyle="rgba(60,62,70,.35)";c.beginPath();c.arc(rnd(0,w),rnd(0,h),r,0,2*PI);c.fill();c.strokeStyle="rgba(210,212,220,.35)";c.lineWidth=1.5;c.stroke()}},[30,30]));
   const cr=[];for(let i=0;i<16;i++){const z=rnd(-40,-6);cr.push({p:[z>-12?lado(5,24):lado(0,30),.05,z],s:[rnd(1.2,3.5),1,rnd(1.2,3.5)].map((v,k)=>k==1?.5:v),r:[PI/2,0,0]})}
   inst(E,new THREE.TorusGeometry(1,.22,6,22),lam(0x9a9da6),cr);
   const rk=[];for(let i=0;i<40;i++){const z=rnd(-45,-4);rk.push({p:[z>-10?lado(4,30):lado(0,40),.15,z],s:[rnd(.3,1.2),rnd(.25,.8),rnd(.3,1.1)],r:[rnd(0,3),rnd(0,3),0]})}
   inst(E,new THREE.DodecahedronGeometry(1,0),lam(0x7a7d86,{flatShading:true}),rk);
   const mo=[];for(let i=0;i<20;i++)mo.push({p:[rnd(-90,90),0,rnd(-95,-70)],s:[rnd(10,22),rnd(3,8),rnd(8,14)],r:[0,rnd(0,3),0]});inst(E,new THREE.SphereGeometry(1,14,8),lam(0x6a6d76,{flatShading:true}),mo);
   /* a base: cúpulas, túnel, antena e luz piscando */
   const B=new THREE.Group(),wm=lam(0xf2f4f8);const dome=(x,z,r)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(r,24,12,0,2*PI,0,PI/2),wm);m.position.set(x,0,z);B.add(m);
    const f=new THREE.Mesh(new THREE.TorusGeometry(r*.98,.08,6,32),basic(0x5ef0e0));f.rotation.x=PI/2;f.position.set(x,r*.35,z);B.add(f)};
   dome(0,0,2.6);dome(6,-2,1.8);const tun=new THREE.Mesh(new THREE.CylinderGeometry(.6,.6,3.4,12),wm);tun.rotation.z=PI/2;tun.position.set(3.2,.6,-1);tun.rotation.y=.3;B.add(tun);
   const mast=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,4,6),lam(0xbfc4cf));mast.position.set(-2.6,2,1);B.add(mast);
   const dish=new THREE.Mesh(new THREE.ConeGeometry(1,.5,18,1,true),lam(0xe8eaf0,{side:THREE.DoubleSide}));dish.position.set(-2.6,4,1);dish.rotation.set(PI*.7,0,.4);B.add(dish);
   const pisca=glow(0xff4040,.9,1);pisca.position.set(-2.6,4.3,1);B.add(pisca);B.position.set(-14,0,-18);B.rotation.y=.5;E.add(B);
   return (t,dt)=>{terra.rotation.y+=dt*.05;st.rotation.y+=dt*.002;pisca.material.opacity=Math.sin(t*3)>0?.95:.1}}}
 };

 /* ---------- cartões-postais da loja ---------- */
 const POST={};
 const tri=(c,x,y,w,h,col)=>{c.fillStyle=col;c.beginPath();c.moveTo(x-w/2,y);c.lineTo(x,y-h);c.lineTo(x+w/2,y);c.fill()};
 const circ=(c,x,y,r,col)=>{c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,2*PI);c.fill()};
 const palm=(c,x,y,h,s)=>{c.strokeStyle="#3a2418";c.lineWidth=4*s;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+8*s,y-h/2,x+4*s,y-h);c.stroke();c.strokeStyle="#1f5a2e";c.lineWidth=3*s;
  for(let k=0;k<6;k++){const a=-PI+k*PI/5;c.beginPath();c.moveTo(x+4*s,y-h);c.quadraticCurveTo(x+4*s+Math.cos(a)*14*s,y-h-8*s,x+4*s+Math.cos(a)*22*s,y-h+Math.abs(Math.sin(a))*4*s+6*s);c.stroke()}};
 const P2={
  "s-neon":(c,w,h)=>{vgrad(c,w,h,[[0,"#040716"],[.55,"#3c1d6e"],[.68,"#c24a7a"],[.7,"#1a1040"],[1,"#0e1132"]]);for(let i=0;i<40;i++)circ(c,rnd(0,w),rnd(0,h*.6),.8,"#dfe8ff");
   circ(c,40,34,16,"#5a6cf0");c.strokeStyle="#ffd24a";c.lineWidth=2;c.beginPath();c.ellipse(40,34,28,6,-.3,0,2*PI);c.stroke();
   [[30,88,50,22],[90,88,60,28],[160,88,50,20]].forEach(([x,y,ww,hh])=>tri(c,x,y,ww,hh,"#2c1b5c"));c.strokeStyle="#4b3fc4";c.lineWidth=1;for(let i=-8;i<=8;i++){c.beginPath();c.moveTo(w/2,h*.7);c.lineTo(w/2+i*30,h);c.stroke()}
   for(let y=h*.74;y<h;y+=8){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke()}circ(c,w/2,h*.56,10,"rgba(94,240,224,.9)")},
  "s-praia":(c,w,h)=>{vgrad(c,w,h,[[0,"#2b3d92"],[.35,"#e0708a"],[.55,"#ffd27f"],[.58,"#2a5f9e"],[1,"#2a5f9e"]],0,h*.75);circ(c,w/2,h*.56,15,"#ffe39a");vgrad(c,w,h,[[0,"#2f6fb0"],[1,"#2a5590"]],h*.58,h*.78);
   c.fillStyle="rgba(255,200,120,.7)";for(let i=0;i<7;i++)c.fillRect(w/2-10+rnd(-4,4),h*.6+i*4,20-i*2,1.5);c.fillStyle="#efcf98";c.fillRect(0,h*.78,w,h);c.fillStyle="rgba(255,255,255,.8)";c.fillRect(0,h*.77,w,2);palm(c,30,h*.9,55,1);palm(c,165,h*.92,50,.9)},
  "s-neve":(c,w,h)=>{vgrad(c,w,h,[[0,"#3f7fc6"],[1,"#e8f2fb"]],0,h*.7);[[40,h*.72,90,60],[120,h*.72,110,72],[190,h*.72,80,50]].forEach(([x,y,ww,hh])=>{tri(c,x,y,ww,hh,"#6f84a8");tri(c,x,y-hh*.62,ww*.38,hh*.38,"#fff")});
   c.fillStyle="#f1f6fc";c.fillRect(0,h*.72,w,h);[[20,h*.95],[45,h*.9],[160,h*.92],[182,h*.97]].forEach(([x,y])=>{tri(c,x,y,22,34,"#2f6b52");tri(c,x,y-12,16,24,"#2f6b52")});for(let i=0;i<40;i++)circ(c,rnd(0,w),rnd(0,h),1.3,"#fff")},
  "s-floresta":(c,w,h)=>{vgrad(c,w,h,[[0,"#123d2e"],[.7,"#7fbf8a"],[1,"#c9ecb0"]]);c.fillStyle="rgba(255,250,180,.25)";c.beginPath();c.moveTo(80,0);c.lineTo(120,0);c.lineTo(140,h);c.lineTo(70,h);c.fill();
   [[15,8],[55,6],[150,9],[185,7]].forEach(([x,r])=>{c.fillStyle="#4a3320";c.fillRect(x-r/2,20,r,h)});[[15,22,26],[50,30,22],[150,18,28],[188,32,22],[100,10,20]].forEach(([x,y,r])=>circ(c,x,y,r,pick(["#2f7a3a","#3f9a42"])));
   c.fillStyle="#2f5a2a";c.fillRect(0,h*.85,w,h);circ(c,120,60,4,"#e8322f");circ(c,128,58,3,"#2f7be0")},
  "s-pantanal":(c,w,h)=>{vgrad(c,w,h,[[0,"#3b2a6b"],[.6,"#e9785a"],[1,"#ffd98f"]],0,h*.6);circ(c,w*.55,h*.6,17,"#ffc06a");c.fillStyle="#5a3a5a";for(let x=0;x<w;x+=12)circ(c,x,h*.6,rnd(5,9),"#5a3a5a");
   vgrad(c,w,h,[[0,"#d98a6a"],[1,"#8a5a8a"]],h*.62,h*.85);c.fillStyle="#6e7f34";c.fillRect(0,h*.85,w,h);c.fillStyle="#fafafa";c.beginPath();c.ellipse(40,h*.78,9,5,0,0,2*PI);c.fill();c.fillStyle="#1a1a1a";c.fillRect(34,h*.6,3,14);circ(c,35,h*.59,3,"#1a1a1a");c.fillStyle="#d8282a";c.fillRect(33,h*.68,5,3)},
  "s-cidade":(c,w,h)=>{vgrad(c,w,h,[[0,"#03051a"],[.8,"#5a2f7a"],[1,"#7a3f86"]]);for(let i=0;i<30;i++)circ(c,rnd(0,w),rnd(0,h*.5),.8,"#dfe8ff");circ(c,40,26,9,"#f4f0ff");
   for(let i=0;i<14;i++){const x=i*15-4,bh=rnd(35,90);c.fillStyle="#121733";c.fillRect(x,h-bh,13,bh);for(let y=h-bh+4;y<h-4;y+=7)for(let xx=x+2;xx<x+12;xx+=5)if(Math.random()<.45){c.fillStyle=pick(["#ffd98a","#9fe8ff"]);c.fillRect(xx,y,3,3)}}c.fillStyle="#ff4fd8";c.fillRect(60,h-50,18,5)},
  "s-mar":(c,w,h)=>{vgrad(c,w,h,[[0,"#7fe0ff"],[.4,"#1a8ac4"],[1,"#06304f"]]);c.fillStyle="rgba(200,250,255,.18)";for(let i=0;i<4;i++){c.beginPath();c.moveTo(30+i*45,0);c.lineTo(50+i*45,0);c.lineTo(40+i*45+30,h);c.lineTo(20+i*45+20,h);c.fill()}
   c.fillStyle="#d1b98a";c.fillRect(0,h*.86,w,h);[[25,"#ff6f91"],[60,"#ff9a3c"],[150,"#ff6f91"],[175,"#b06bff"]].forEach(([x,col])=>tri(c,x,h*.88,14,30,col));
   [[90,50,"#ff8a2a"],[130,70,"#ffd23a"]].forEach(([x,y,col])=>{c.fillStyle=col;c.beginPath();c.ellipse(x,y,10,6,0,0,2*PI);c.fill();tri(c,x+12,y+6,10,12,col)});for(let i=0;i<10;i++){c.strokeStyle="rgba(255,255,255,.7)";c.beginPath();c.arc(rnd(70,110),rnd(10,90),rnd(1.5,3),0,2*PI);c.stroke()}},
  "s-egito":(c,w,h)=>{vgrad(c,w,h,[[0,"#2f7fd8"],[.8,"#bfe0f4"],[1,"#f6e4b8"]],0,h*.72);circ(c,165,22,9,"#fffbe8");[[60,h*.78,90,60],[130,h*.78,70,46],[175,h*.78,40,26]].forEach(([x,y,ww,hh])=>{tri(c,x,y,ww,hh,"#d9a95a");c.fillStyle="#b88848";c.beginPath();c.moveTo(x,y-hh);c.lineTo(x+ww/2,y);c.lineTo(x,y);c.fill()});
   c.fillStyle="#e6c07a";c.fillRect(0,h*.77,w,h);palm(c,20,h*.95,40,.7)},
  "s-paris":(c,w,h)=>{vgrad(c,w,h,[[0,"#151a4a"],[.6,"#8a4f96"],[.85,"#f08a6a"],[1,"#ffc08a"]]);c.strokeStyle="#3a2c22";c.fillStyle="#3a2c22";c.lineWidth=3;c.beginPath();c.moveTo(70,h);c.quadraticCurveTo(92,h*.55,98,h*.15);c.lineTo(102,h*.15);c.quadraticCurveTo(108,h*.55,130,h);c.stroke();
   c.fillRect(84,h*.62,32,3);c.fillRect(92,h*.4,16,2);c.fillRect(99,h*.05,2,h*.12);c.fillStyle="#ffd98a";for(let i=0;i<30;i++)circ(c,100+rnd(-14,14)*(1-rnd(0,1)),rnd(h*.15,h),.9,"#ffd98a");
   for(let i=0;i<9;i++){const x=i*24-6,bh=rnd(22,34);c.fillStyle="#e6d3b0";c.fillRect(x,h-bh,20,bh);c.fillStyle="#4a5068";c.fillRect(x-1,h-bh-5,22,6)}},
  "s-lua":(c,w,h)=>{c.fillStyle="#000";c.fillRect(0,0,w,h);for(let i=0;i<70;i++)circ(c,rnd(0,w),rnd(0,h*.7),rnd(.5,1),"#fff");circ(c,150,40,22,"#1d5fc4");c.fillStyle="#3f9a4a";c.beginPath();c.ellipse(143,36,9,6,.5,0,2*PI);c.fill();
   c.fillStyle="#8d9099";c.beginPath();c.moveTo(0,h*.72);c.quadraticCurveTo(w/2,h*.62,w,h*.74);c.lineTo(w,h);c.lineTo(0,h);c.fill();[[40,h*.85,14],[120,h*.9,10],[170,h*.82,8]].forEach(([x,y,r])=>{c.fillStyle="#6a6d76";c.beginPath();c.ellipse(x,y,r,r*.35,0,0,2*PI);c.fill()});
   c.fillStyle="#f2f4f8";c.beginPath();c.arc(60,h*.76,12,PI,2*PI);c.fill();c.fillStyle="#5ef0e0";c.fillRect(48,h*.73,24,2)}};
 function postal(id){if(POST[id])return POST[id];const f=P2[id];if(!f)return "";return POST[id]=cv(192,128,f).toDataURL("image/png")}

 return {has:id=>!!DEF[id],build(id){const d=DEF[id]||DEF["s-neon"],E=new THREE.Group();const tick=d.build(E)||(()=>{});return {E,cfg:d.cfg,tick}},postal,ids:Object.keys(DEF)}})();
