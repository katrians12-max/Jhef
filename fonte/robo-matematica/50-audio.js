/* ===== Sons sintetizados (WebAudio), sem arquivos ===== */
const Snd=(()=>{let ctx=null,master=null,on=true;
 function ac(){try{if(!ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;ctx=new AC();master=ctx.createGain();master.gain.value=.5;master.connect(ctx.destination)}
   if(ctx.state=="suspended")ctx.resume();return ctx}catch(e){return null}}
 function tone(f,dur,type="sine",vol=.15,when=0,f2=0){if(!on)return;const c=ac();if(!c)return;try{const t=c.currentTime+when,o=c.createOscillator(),g=c.createGain();
   o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);
   g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
   o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+.03)}catch(e){}}
 let nbuf=null;
 function noise(dur,vol=.15,when=0,fc=800){if(!on)return;const c=ac();if(!c)return;try{if(!nbuf){nbuf=c.createBuffer(1,c.sampleRate*.4,c.sampleRate);const d=nbuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
   const t=c.currentTime+when,s=c.createBufferSource(),g=c.createGain(),f=c.createBiquadFilter();s.buffer=nbuf;f.type="lowpass";f.frequency.value=fc;
   g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(f);f.connect(g);g.connect(master);s.start(t);s.stop(t+dur+.02)}catch(e){}}
 return {get on(){return on},set on(v){on=!!v},unlock(){if(on)ac()},
  step(){tone(190,.07,"triangle",.1,0,150)},turn(){tone(430,.05,"square",.035);tone(540,.05,"square",.03,.05)},
  jump(){tone(250,.24,"sine",.14,0,640)},land(){noise(.09,.12,0,420)},
  paint(){tone(540,.13,"sine",.12,0,200);noise(.07,.05,0,1800)},star(){tone(988,.09,"triangle",.14);tone(1319,.18,"triangle",.14,.08)},
  key(){[1175,1397,1760].forEach((f,i)=>tone(f,.09,"square",.05,i*.06))},door(){tone(150,.22,"sawtooth",.08,0,70);noise(.14,.1,.02,300)},
  portal(){tone(300,.36,"sine",.1,0,1250);tone(1250,.3,"sine",.06,.14,420)},bump(){noise(.16,.3,0,240);tone(95,.16,"square",.1,0,52)},
  fall(){tone(720,.55,"sine",.13,0,85)},win(){[523,659,784,1047].forEach((f,i)=>tone(f,.16,"triangle",.15,i*.11));tone(1319,.4,"triangle",.13,.47)},
  fail(){tone(330,.16,"triangle",.12);tone(247,.3,"triangle",.12,.15)},snap(){tone(720,.035,"square",.04)},del(){tone(280,.09,"sawtooth",.04,0,120)},
  click(){tone(620,.03,"square",.03)},yes(){tone(880,.07,"sine",.07)},no(){tone(300,.07,"sine",.07)},pop(i){tone([784,988,1319][i]||784,.2,"triangle",.16)}}})();
