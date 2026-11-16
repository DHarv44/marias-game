'use strict';
/* ====================== UI ====================== */
const $=s=>document.querySelector(s);
const TAU=Math.PI*2;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- storage ---------- */
const SAVE_KEY='mariasgame.save.v1';
const save={level:1,stars:{},best:{},dogs:[],chaptersSeen:[],daily:{},bonus:{},bonusSeen:[],treats:0,endlessBest:0,sound:true,haptics:true,crownSeen:false};
try{const raw=localStorage.getItem(SAVE_KEY);if(raw)Object.assign(save,JSON.parse(raw));}catch(e){}
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(save));}catch(e){}}
const todayStr=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};

/* ---------- audio: every sound is synthesized ---------- */
const Snd={ctx:null,master:null,noiseBuf:null,last:{},
  unlock(){
    if(!this.ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
      try{this.ctx=new AC();this.master=this.ctx.createGain();this.master.gain.value=.55;
        const comp=this.ctx.createDynamicsCompressor();this.master.connect(comp);comp.connect(this.ctx.destination);
        const len=Math.floor(this.ctx.sampleRate*.6);this.noiseBuf=this.ctx.createBuffer(1,len,this.ctx.sampleRate);
        const d=this.noiseBuf.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
      }catch(e){this.ctx=null;return;}}
    if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});
  },
  ok(){return save.sound&&this.ctx&&this.ctx.state==='running';},
  tone(f,d,{type='sine',vol=.2,when=0,slide=0}={}){
    if(vol<=.001)return;
    const c=this.ctx,t=c.currentTime+when,o=c.createOscillator(),g=c.createGain();
    o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,f*slide),t+d);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+d);
    o.connect(g);g.connect(this.master);o.start(t);o.stop(t+d+.03);
  },
  pluck(f,d,vol,when=0){
    if(vol<=.001)return;
    const c=this.ctx,t=c.currentTime+when,o=c.createOscillator(),fl=c.createBiquadFilter(),g=c.createGain();
    o.type='sawtooth';o.frequency.setValueAtTime(f,t);fl.type='lowpass';fl.frequency.setValueAtTime(3200,t);fl.frequency.exponentialRampToValueAtTime(380,t+d);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+d);
    o.connect(fl);fl.connect(g);g.connect(this.master);o.start(t);o.stop(t+d+.03);
  },
  noise(d,{vol=.2,from=2000,to=200,when=0,q=1}={}){
    const c=this.ctx,t=c.currentTime+when,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
    s.buffer=this.noiseBuf;f.type='bandpass';f.Q.value=q;f.frequency.setValueAtTime(from,t);f.frequency.exponentialRampToValueAtTime(to,t+d);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+d);
    s.connect(f);f.connect(g);g.connect(this.master);s.start(t);s.stop(t+d+.05);
  },
  // One note in a branch's instrument.
  voice(kind,f,vol,when=0){
    switch(kind){
      case 'pan':this.tone(f,.55,{vol,when,slide:.995});this.tone(f*2,.38,{vol:vol*.42,when});this.tone(f*3.02,.2,{vol:vol*.16,when});break;
      case 'bells':this.tone(f*2,.8,{vol:vol*.6,when});this.tone(f*5.4,.35,{vol:vol*.14,when});break;
      case 'marimba':this.tone(f,.3,{vol,when});this.tone(f*4,.07,{vol:vol*.28,when});break;
      case 'glock':this.tone(f*2,.65,{vol:vol*.55,when});this.tone(f*5.2,.3,{vol:vol*.18,when});break;
      case 'pluck':this.pluck(f,.38,vol*.75,when);break;
      case 'drone':this.pluck(f,.4,vol*.7,when);this.tone(f/2,1,{vol:vol*.22,when});break;
      case 'acoustic':this.tone(f,.5,{type:'triangle',vol,when});this.tone(f*2,.32,{vol:vol*.3,when});break;
      default:this.tone(f,.5,{type:'triangle',vol:vol*.7,when});this.tone(f*2,.4,{vol:vol*.25,when});
    }
  }
};
const SEMI=s=>261.63*Math.pow(2,s/12);
const PENTA=[0,2,4,7,9];
/* Each era has its own key and scale, so a cascade climbs a different tune in every place.
   root: semitones from C. sc: the steps a cascade walks up. arp: the chord for wins and specials. */
const MODES={
  rain:{root:0,sc:[0,2,4,7,9],arp:[0,4,7,12,16,19,24]},          // C major pentatonic: calypso, bright and round
  snow:{root:5,sc:[0,2,4,5,7,9,11],arp:[0,4,7,12,16,19,24]},     // F major: a music box in the snow
  sun:{root:7,sc:[0,2,4,5,7,9,10],arp:[0,4,7,10,12,16,19]},      // G mixolydian: the flat seventh of salsa and montuno
  lights:{root:-3,sc:[0,2,3,5,7,8,10],arp:[0,3,7,12,16,19,24]},  // A minor, resolving to major: winter, then lights
  rivers:{root:2,sc:[0,1,4,5,7,8,10],arp:[0,1,4,7,8,12,16]},     // D Hijaz: the step-and-a-half of the maqam
  dune:{root:4,sc:[0,1,3,5,7,8,10],arp:[0,3,7,8,12,15,19]},      // E Kurd (Phrygian): the Gulf
  home:{root:7,sc:[0,2,4,7,9],arp:[0,4,7,12,7,12,16]},           // G major pentatonic: front-porch country
  diwali:{root:0,sc:[0,2,4,6,7,9,11],arp:[0,4,7,11,12,16,19]},   // C Lydian, the sound of raag Yaman
  carnival:{root:5,sc:[0,2,4,7,9],arp:[0,4,7,12,16,19,24]},      // F major pentatonic: soca brass
  easter:{root:2,sc:[0,2,4,7,9],arp:[0,4,7,12,16,19,24]},        // D major pentatonic, high and windy
  halloween:{root:-3,sc:[0,2,3,5,7,8,11],arp:[0,3,7,11,12,15,18]},// A harmonic minor, a little spooky
  thanks:{root:0,sc:[0,2,4,5,7,9,11],arp:[0,4,7,12,16,19,24]},   // C major
  xmas:{root:7,sc:[0,2,4,5,7,9,11],arp:[0,4,7,12,16,19,24]},     // G major, bells
};
let KEY=MODES.rain;
const step=(c)=>KEY.root+KEY.sc[c%KEY.sc.length]+12*Math.floor(c/KEY.sc.length);
let INST='pan',HER=1;
// The steelpan's share of every note follows the heritage weight.
function note(f,vol,when=0){
  if(INST==='pan'){Snd.voice('pan',f,vol,when);return;}
  Snd.voice(INST,f,vol*(1-HER*.45),when);
  if(HER>0.02)Snd.voice('pan',f,vol*HER*.75,when);
}
function playSound(name,arg){
  if(!Snd.ok())return;
  const now=performance.now();if(name!=='star'&&Snd.last[name]&&now-Snd.last[name]<45)return;Snd.last[name]=now;
  switch(name){
    case 'swap':Snd.tone(520,.07,{type:'triangle',vol:.06,slide:1.4});break;
    case 'nope':Snd.tone(220,.09,{type:'square',vol:.035});Snd.tone(170,.13,{type:'square',vol:.035,when:.08});break;
    case 'match':{const c=Math.max(1,arg||1)-1;const s=step(c)+12;note(SEMI(s),.17);note(SEMI(s+7),.06,.03);break;}
    case 'forge':{const a=KEY.arp;note(SEMI(KEY.root+a[0]+24),.07);note(SEMI(KEY.root+a[1]+24),.07,.06);note(SEMI(KEY.root+a[2]+24),.08,.12);break;}
    case 'beam':Snd.noise(.3,{vol:.14,from:4200,to:500,q:2});break;
    case 'nova':Snd.tone(150,.45,{vol:.25,slide:.3});Snd.noise(.36,{vol:.16,from:900,to:120,q:.7});break;
    case 'prism':KEY.arp.slice(0,6).forEach((s,k)=>note(SEMI(KEY.root+s+24),.05,k*.045));break;
    case 'mega':Snd.tone(110,.8,{vol:.28,slide:.25});Snd.noise(.7,{vol:.2,from:3000,to:80,q:.6});break;
    case 'tilt':Snd.tone(320,.55,{vol:.18,slide:.25});Snd.noise(.55,{vol:.12,from:300,to:2600,q:.8});break;
    case 'crack':Snd.noise(.09,{vol:.11,from:3500,to:1600,q:3});break;
    case 'boulder':Snd.tone(95,.22,{type:'square',vol:.04,slide:.5});Snd.noise(.22,{vol:.14,from:700,to:100});break;
    case 'splash':Snd.noise(.35,{vol:.16,from:2600,to:500,q:.9});note(SEMI(19),.06,.05);break;
    case 'boss':Snd.tone(70,.6,{vol:.16,slide:.8});Snd.noise(.4,{vol:.08,from:400,to:150,q:.7});break;
    case 'thrash':Snd.noise(.5,{vol:.2,from:1800,to:200,q:.6});Snd.tone(60,.4,{vol:.18,slide:.6});break;
    case 'leap':Snd.tone(180,.9,{vol:.15,slide:3.5});Snd.noise(.8,{vol:.18,from:500,to:3200,q:.8,when:.15});KEY.arp.slice(0,5).forEach((s,k)=>note(SEMI(KEY.root+s+12),.08,.3+k*.08));break;
    case 'patch':Snd.tone(1200,.05,{type:'triangle',vol:.05});Snd.tone(1500,.05,{type:'triangle',vol:.04,when:.05});break;
    case 'tool':Snd.tone(600,.08,{type:'triangle',vol:.08,slide:1.5});Snd.tone(900,.1,{type:'triangle',vol:.07,when:.09,slide:1.3});break;
    case 'arrive':[0,1,2,3,4].forEach((c,k)=>note(SEMI(step(c)+12),.1,k*.12));break;
    case 'win':KEY.arp.forEach((s,k)=>note(SEMI(KEY.root+s+12),.11,k*.09));break;
    case 'lose':[KEY.arp[2],KEY.arp[1],0,KEY.arp[2]-12].forEach((s,k)=>note(SEMI(KEY.root+s),.09,k*.17));break;
    case 'click':Snd.tone(700,.04,{type:'triangle',vol:.05});break;
    case 'star':note(SEMI(arg),.14);break;
    case 'pip':{const a=KEY.arp,k=arg||0;note(SEMI(KEY.root+a[k%a.length]+12*(Math.floor(k/a.length)%2)+12),.09);break;}
  }
}
const buzz=ms=>{if(save.haptics&&navigator.vibrate)try{navigator.vibrate(ms);}catch(e){}};

/* ---------- shapes (unit paths) ---------- */
function rpoly(pts,rad){const P=new Path2D();const n=pts.length;const mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
  const s=mid(pts[n-1],pts[0]);P.moveTo(s[0],s[1]);
  for(let k=0;k<n;k++){const c=pts[k],m=mid(c,pts[(k+1)%n]);P.arcTo(c[0],c[1],m[0],m[1],rad);}P.closePath();return P;}
const regular=(n,R,rot,dy=0)=>Array.from({length:n},(_,k)=>[Math.cos(rot+k*TAU/n)*R,Math.sin(rot+k*TAU/n)*R+dy]);
const circlePath=(()=>{const p=new Path2D();p.arc(0,0,.8,0,TAU);return p;})();
const plusPts=(a=.29,L=.84)=>[[-a,-L],[a,-L],[a,-a],[L,-a],[L,a],[a,a],[a,L],[-a,L],[-a,a],[-L,a],[-L,-a],[-a,-a]];
// Six charms with distinct silhouettes: lotus, marigold, paisley, crescent moon, eight-point star, leaf.
const marigoldPts=Array.from({length:72},(_,k)=>{const a=k*TAU/72,r=.78+.1*Math.cos(12*a);return [Math.cos(a)*r,Math.sin(a)*r];});
const starPts=Array.from({length:16},(_,k)=>{const a=-Math.PI/2+k*Math.PI/8,r=k%2?.62:.92;return [Math.cos(a)*r,Math.sin(a)*r];});
const PATHS=[
  new Path2D('M0 -0.86 C0.3 -0.52 0.3 -0.04 0 0.36 C-0.3 -0.04 -0.3 -0.52 0 -0.86 Z M0 0.36 C0.14 -0.26 0.56 -0.58 0.86 -0.46 C0.8 -0.04 0.46 0.32 0 0.36 Z M0 0.36 C-0.14 -0.26 -0.56 -0.58 -0.86 -0.46 C-0.8 -0.04 -0.46 0.32 0 0.36 Z M-0.66 0.44 Q0 0.86 0.66 0.44 Q0 0.62 -0.66 0.44 Z'),
  rpoly(marigoldPts,.02),
  new Path2D('M0.04 0.84 C-0.62 0.82 -0.82 0.1 -0.44 -0.34 C-0.16 -0.66 0.26 -0.84 0.56 -0.9 C0.36 -0.62 0.64 -0.4 0.68 0.04 C0.72 0.5 0.46 0.84 0.04 0.84 Z'),
  new Path2D('M0.28 -0.78 A0.83 0.83 0 1 0 0.28 0.78 A0.82 0.82 0 0 1 0.28 -0.78 Z'),
  rpoly(starPts,.05),
  new Path2D('M0 -0.92 C0.62 -0.52 0.64 0.36 0 0.92 C-0.64 0.36 -0.62 -0.52 0 -0.92 Z'),
];
const OCT=rpoly(regular(8,.84,Math.PI/8),.1);
const STAR=rpoly(Array.from({length:10},(_,k)=>{const r=k%2?.4:.9,a=-Math.PI/2+k*Math.PI/5;return [Math.cos(a)*r,Math.sin(a)*r+.05];}),.06);
function shade(hex,f){const n=parseInt(hex.slice(1),16);const r=n>>16,g=n>>8&255,b=n&255;const m=v=>Math.round(v*(1-f));return `rgb(${m(r)},${m(g)},${m(b)})`;}
const SHADES=SHAPE_COLORS.map(c=>shade(c,.3));
/*__PIECES__*/
function rrPath(ctx,x,y,w,h,r){r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}

function drawShape(ctx,c,r,set=SET){
  if(!set.henna)return drawEraShape(ctx,c,r,set);
  const P=PATHS[c];ctx.save();ctx.scale(r,r);
  ctx.save();ctx.translate(0,.09);ctx.fillStyle=SHADES[c];ctx.fill(P);ctx.restore();
  ctx.fillStyle=SHAPE_COLORS[c];ctx.fill(P);
  ctx.save();ctx.translate(-.06,-.1);ctx.scale(.42,.42);ctx.fillStyle='rgba(255,255,255,.3)';ctx.fill(P);ctx.restore();
  ctx.lineCap='round';ctx.strokeStyle='rgba(255,250,252,.95)';
  if(c===5){ctx.lineWidth=.07;ctx.beginPath();ctx.moveTo(0,-.7);ctx.quadraticCurveTo(.06,0,0,.75);ctx.stroke();
    ctx.setLineDash([.001,.16]);ctx.lineWidth=.11;ctx.beginPath();ctx.moveTo(-.28,-.2);ctx.lineTo(0,.05);ctx.lineTo(.28,-.2);ctx.moveTo(-.3,.22);ctx.lineTo(0,.45);ctx.lineTo(.3,.22);ctx.stroke();}
  else if(c===1){ctx.fillStyle='#C9661E';ctx.beginPath();ctx.arc(0,0,.26,0,TAU);ctx.fill();ctx.setLineDash([.001,.15]);ctx.lineWidth=.11;ctx.beginPath();ctx.arc(0,0,.5,0,TAU);ctx.stroke();}
  else if(c===0){ctx.fillStyle='#FFE08A';ctx.beginPath();ctx.arc(0,.3,.1,0,TAU);ctx.fill();ctx.setLineDash([.001,.15]);ctx.lineWidth=.1;ctx.beginPath();ctx.moveTo(0,-.55);ctx.lineTo(0,.1);ctx.stroke();}
  else if(c===2){ctx.setLineDash([.001,.15]);ctx.lineWidth=.11;ctx.beginPath();ctx.arc(.02,.3,.26,0,TAU);ctx.stroke();ctx.fillStyle='rgba(255,250,252,.95)';ctx.beginPath();ctx.arc(.02,.3,.08,0,TAU);ctx.fill();}
  else if(c===3){ctx.fillStyle='rgba(255,250,252,.95)';ctx.beginPath();ctx.arc(-.36,-.05,.07,0,TAU);ctx.arc(-.44,.22,.05,0,TAU);ctx.arc(-.34,-.32,.05,0,TAU);ctx.fill();}
  else{ctx.save();ctx.scale(.55,.55);ctx.setLineDash([.001,.2]);ctx.lineWidth=.16;ctx.stroke(P);ctx.restore();ctx.fillStyle='rgba(255,250,252,.95)';ctx.beginPath();ctx.arc(0,0,.1,0,TAU);ctx.fill();}
  ctx.setLineDash([]);
  ctx.restore();
}
// Specials wear their power on the outside: a lit track for a Beam, a sunburst for a Nova.
function drawSpecialAura(ctx,r,p,t){
  const col=SHAPE_COLORS[p.color]||'#fff';ctx.save();
  if(p.kind==='nova'){
    ctx.rotate(t*.9);ctx.fillStyle=col;ctx.globalAlpha=.75;
    for(let k=0;k<8;k++){ctx.rotate(Math.PI/4);ctx.beginPath();ctx.moveTo(-r*.2,-r*.55);ctx.lineTo(0,-r*(1.08+.06*Math.sin(t*5+k)));ctx.lineTo(r*.2,-r*.55);ctx.closePath();ctx.fill();}
    ctx.globalAlpha=1;ctx.fillStyle=col;ctx.beginPath();ctx.arc(0,0,r*.8,0,TAU);ctx.fill();
    ctx.fillStyle='#FFFDF8';ctx.beginPath();ctx.arc(0,0,r*.6,0,TAU);ctx.fill();
  }else{
    if(p.kind==='lineV')ctx.rotate(Math.PI/2);
    rrPath(ctx,-r*.98,-r*.6,r*1.96,r*1.2,r*.6);ctx.fillStyle=col;ctx.fill();
    ctx.save();rrPath(ctx,-r*.98,-r*.6,r*1.96,r*1.2,r*.6);ctx.clip();
    const sx=((t*1.4)%2-1)*r*1.4;const g=ctx.createLinearGradient(sx-r*.4,0,sx+r*.4,0);
    g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,'rgba(255,255,255,.9)');g.addColorStop(1,'rgba(255,255,255,0)');
    ctx.globalAlpha=.45;ctx.fillStyle=g;ctx.fillRect(-r,-r*.6,r*2,r*1.2);ctx.restore();
    ctx.fillStyle='#FFFDF8';ctx.beginPath();ctx.arc(0,0,r*.5,0,TAU);ctx.fill();
  }
  ctx.restore();
}
function drawBeamMark(ctx,r,vertical,t,col){
  ctx.save();if(vertical)ctx.rotate(Math.PI/2);
  const o=r*(.74+.08*Math.sin(t*7));
  for(const s of [1,-1]){ctx.beginPath();ctx.moveTo(s*(o+r*.3),0);ctx.lineTo(s*(o-r*.06),-r*.3);ctx.lineTo(s*(o-r*.06),r*.3);ctx.closePath();
    ctx.lineJoin='round';ctx.lineWidth=r*.08;ctx.strokeStyle=col||'#999';ctx.stroke();ctx.fillStyle='#FFFDF8';ctx.fill();}
  ctx.restore();
}
function drawNovaMark(ctx,r,t){
  ctx.fillStyle='#fff';ctx.strokeStyle='rgba(0,0,0,.15)';ctx.lineWidth=r*.03;
  for(let k=0;k<3;k++){const a=t*2.4+k*TAU/3;ctx.beginPath();ctx.arc(Math.cos(a)*r*.86,Math.sin(a)*r*.86,r*.12,0,TAU);ctx.fill();ctx.stroke();}
}
function drawPrism(ctx,r,t){
  ctx.save();ctx.scale(r,r);ctx.rotate(Math.sin(t*1.3)*.25);
  let g;
  if(ctx.createConicGradient){g=ctx.createConicGradient(t*1.6,0,.12);SHAPE_COLORS.forEach((c,k)=>g.addColorStop(k/6,c));g.addColorStop(1,SHAPE_COLORS[0]);}
  else{g=ctx.createLinearGradient(-1,-1,1,1);SHAPE_COLORS.forEach((c,k)=>g.addColorStop(k/5,c));}
  ctx.fillStyle=g;ctx.fill(PATHS[1]);
  ctx.lineWidth=.09;ctx.strokeStyle='rgba(255,255,255,.95)';ctx.stroke(PATHS[1]);
  ctx.restore();
}
// Blockers read as heavy and in the way: a dark slab under them, a thick outline, and pips for hits left.
function drawRock(ctx,r,p,col){
  ctx.save();ctx.scale(r*1.14,r*1.14);
  ctx.fillStyle='rgba(30,20,10,.22)';rrPath(ctx,-1.02,-1.02,2.04,2.04,.34);ctx.fill();
  ctx.save();ctx.translate(0,.12);ctx.fillStyle='rgba(0,0,0,.3)';ctx.fill(OCT);ctx.restore();
  ctx.fillStyle=p.hit>0?shade(col,-.45*p.hit):col;ctx.fill(OCT);
  ctx.save();ctx.clip(OCT);
  ctx.fillStyle='rgba(255,255,255,.22)';ctx.beginPath();ctx.moveTo(-1,-1);ctx.lineTo(1,-1);ctx.lineTo(-1,.15);ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.moveTo(1,1);ctx.lineTo(1,-.1);ctx.lineTo(-.2,1);ctx.closePath();ctx.fill();
  if(p.mud){ctx.fillStyle=shade(col,.35);for(const [x,w] of [[-.5,.16],[0,.2],[.45,.14]]){ctx.beginPath();ctx.ellipse(x,.78,w,.32,0,0,TAU);ctx.fill();}
    ctx.fillStyle='rgba(255,255,255,.35)';for(const [x,y,s] of [[-.3,-.3,.08],[.25,-.1,.06],[.1,.3,.05]]){ctx.beginPath();ctx.arc(x,y,s,0,TAU);ctx.fill();}}
  else{ctx.fillStyle='rgba(0,0,0,.22)';for(const [x,y,s] of [[-.4,.25,.06],[.3,.45,.05],[.42,-.3,.045],[-.1,-.5,.04]]){ctx.beginPath();ctx.arc(x,y,s,0,TAU);ctx.fill();}}
  ctx.restore();
  ctx.lineWidth=.1;ctx.lineJoin='round';ctx.strokeStyle=shade(col,.55);ctx.stroke(OCT);
  {const dmg=p.maxHp-p.hp;if(dmg>0){ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=.09;ctx.lineCap='round';ctx.beginPath(); // cracks grow with each hit
    ctx.moveTo(-.12,-.86);ctx.lineTo(.05,-.25);ctx.lineTo(-.18,.08);ctx.lineTo(.12,.7);ctx.moveTo(.05,-.25);ctx.lineTo(.5,-.1);
    if(dmg>1){ctx.moveTo(-.18,.08);ctx.lineTo(-.62,.3);ctx.lineTo(-.8,.12);ctx.moveTo(.5,-.1);ctx.lineTo(.78,.28);ctx.moveTo(.12,.7);ctx.lineTo(.4,.86);}
    if(dmg>2){ctx.moveTo(-.12,-.86);ctx.lineTo(-.5,-.55);ctx.moveTo(.05,-.25);ctx.lineTo(.3,-.75);ctx.moveTo(-.62,.3);ctx.lineTo(-.55,.7);}
    ctx.stroke();}}
  ctx.restore();
}
function drawFish(ctx,r,t){
  ctx.save();ctx.scale(r,r);ctx.rotate(Math.sin(t*5)*.08);
  ctx.fillStyle='#E8913A';ctx.beginPath();ctx.moveTo(-.48,0);ctx.lineTo(-.95,-.38);ctx.lineTo(-.85,0);ctx.lineTo(-.95,.38);ctx.closePath();ctx.fill();
  ctx.fillStyle='#F2A93B';ctx.beginPath();ctx.ellipse(.08,0,.62,.4,0,0,TAU);ctx.fill();
  ctx.fillStyle='#FFD58A';ctx.beginPath();ctx.ellipse(.12,.13,.42,.18,0,0,TAU);ctx.fill();
  ctx.fillStyle='#D9822B';ctx.beginPath();ctx.moveTo(-.1,-.38);ctx.quadraticCurveTo(.15,-.62,.32,-.36);ctx.closePath();ctx.fill();
  ctx.fillStyle='#2A1A10';ctx.beginPath();ctx.arc(.44,-.07,.08,0,TAU);ctx.fill();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(.46,-.09,.03,0,TAU);ctx.fill();
  ctx.restore();
}
// The arapaima: a long river giant, olive at the head blushing red toward the tail.
function drawArapaima(ctx,cs,t,dir,fedRatio){
  ctx.save();ctx.scale(dir*cs,cs);ctx.translate(0,Math.sin(t*2)*.04);
  const body=new Path2D('M1.38 0 C1.25 -0.42 0.3 -0.5 -0.62 -0.38 C-1.05 -0.32 -1.25 -0.14 -1.32 0 C-1.25 0.14 -1.05 0.32 -0.62 0.38 C0.3 0.5 1.25 0.42 1.38 0 Z');
  const g=ctx.createLinearGradient(1.3,0,-1.3,0);g.addColorStop(0,'#3E4A33');g.addColorStop(.45,'#5C6640');g.addColorStop(.8,'#A4503A');g.addColorStop(1,'#B8432F');
  ctx.fillStyle='#9E3426';ctx.beginPath();ctx.moveTo(-1.22,0);ctx.lineTo(-1.66+Math.sin(t*6)*.04,-.38);ctx.lineTo(-1.55,0);ctx.lineTo(-1.66+Math.sin(t*6)*.04,.38);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(-.55,-.36);ctx.quadraticCurveTo(-.95,-.62,-1.12,-.24);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(-.55,.36);ctx.quadraticCurveTo(-.95,.62,-1.12,.24);ctx.closePath();ctx.fill();
  ctx.fillStyle=g;ctx.fill(body);
  ctx.save();ctx.clip(body);ctx.strokeStyle='rgba(255,210,170,.35)';ctx.lineWidth=.035;
  for(let x=-1.1;x<1;x+=.2)for(let y=-.3;y<=.3;y+=.2){ctx.beginPath();ctx.arc(x+(Math.round(y*5)%2)*.1,y,.09,-.9,.9);ctx.stroke();}
  ctx.restore();
  ctx.fillStyle='#1E2418';ctx.beginPath();ctx.arc(1.05,-.1,.07,0,TAU);ctx.fill();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(1.07,-.12,.025,0,TAU);ctx.fill();
  ctx.strokeStyle='rgba(30,36,24,.6)';ctx.lineWidth=.03;ctx.beginPath();ctx.moveTo(1.36,.03);ctx.quadraticCurveTo(1.2,.1,1.05,.08);ctx.stroke();
  if(fedRatio>0){ctx.lineWidth=.05;ctx.strokeStyle=`rgba(242,183,5,${.35+.5*fedRatio})`;ctx.stroke(body);}
  ctx.restore();
}

function drawPieceAt(ctx,p,cx,cy,r,t,{scale=1,alpha=1,rot=0}={}){
  if(p.kind==='boss')return;
  ctx.save();ctx.translate(cx,cy);if(rot)ctx.rotate(rot);
  let sx=scale,sy=scale;
  if(p.land>0){const l=p.land*.14;if(G.gravity==='down'||G.gravity==='up'){sx*=1+l;sy*=1-l;}else{sx*=1-l;sy*=1+l;}}
  if(p.pop>0){const s=1+Math.sin(p.pop*Math.PI)*.35;sx*=s;sy*=s;}
  ctx.scale(sx,sy);ctx.globalAlpha=alpha;
  if(p.kind==='boulder')drawRock(ctx,r,p,p.mud?'#6B5A3E':(TH.rock||'#8A7A6A'));
  else if(p.kind==='prism')drawPrism(ctx,r,t);
  else if(p.kind==='pup')drawPup(ctx,r,p,t);
  else if(p.kind==='fish'){const a={down:Math.PI/2,up:-Math.PI/2,left:Math.PI,right:0}[G.gravity]||0;ctx.rotate(a);drawFish(ctx,r,t);}
  else if(p.kind==='lineH'||p.kind==='lineV'||p.kind==='nova'){
    drawSpecialAura(ctx,r,p,t);ctx.save();ctx.scale(p.kind==='nova'?.58:.48,p.kind==='nova'?.58:.48);drawShape(ctx,p.color,r);ctx.restore();
    if(p.kind==='nova')drawNovaMark(ctx,r,t);else drawBeamMark(ctx,r,p.kind==='lineV',t,SHAPE_COLORS[p.color]);}
  else drawShape(ctx,p.color,r);
  ctx.restore();
}

/* ---------- dogs ---------- */
const BONE='<svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true"><g fill="#E0B07A" stroke="#A8744A" stroke-width="1"><rect x="5" y="8" width="10" height="4" rx="2"/><circle cx="5" cy="7.5" r="2.6"/><circle cx="5" cy="12.5" r="2.6"/><circle cx="15" cy="7.5" r="2.6"/><circle cx="15" cy="12.5" r="2.6"/></g></svg>';
const PUPIMG={};
function pupImg(tool){
  if(!PUPIMG[tool]){const d=DOGS.find(x=>x.tool===tool);const img=new Image();
    img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(dogSVG(d,80).replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" '));PUPIMG[tool]=img;}
  return PUPIMG[tool];
}
function drawPup(ctx,r,p,t){
  const d=DOGS.find(x=>x.tool===p.dog);const bob=Math.sin(t*3+p.id)*.05;
  ctx.fillStyle='rgba(0,0,0,.12)';ctx.beginPath();ctx.ellipse(0,r*.82,r*.62,r*.14,0,0,TAU);ctx.fill();
  ctx.fillStyle='#FFFDF8';ctx.beginPath();ctx.arc(0,0,r*.9,0,TAU);ctx.fill();
  ctx.lineWidth=r*.12;ctx.strokeStyle=(typeof DOGPAL!=='undefined'&&DOGPAL[d.id]?DOGPAL[d.id].accent:'#C27A3A');ctx.setLineDash([r*.02,r*.16]);ctx.lineCap='round';ctx.stroke();ctx.setLineDash([]);
  const img=pupImg(p.dog);if(img.complete&&img.naturalWidth)ctx.drawImage(img,-r*.82,-r*.82+bob*r,r*1.64,r*1.64);
}
// A schnauzer's moustache, beard and big eyebrows.
const SCHNAUZER=`<g stroke="#A79E90" stroke-width=".55" stroke-linejoin="round">
  <path d="M13.5 27 Q14 36.5 20 38 Q26 36.5 26.5 27 Q23 30.5 20 30 Q17 30.5 13.5 27 Z" fill="#FBFAF7"/>
  <path d="M20 23.6 C17.5 22 13 22.2 10.6 25.6 C10 27.4 11 29.6 12.6 30.4 C13.4 28.6 15.2 27.6 17 27.8 C18.6 27.6 19.6 26.6 20 25.4 Z" fill="#FFFFFF"/>
  <path d="M20 23.6 C22.5 22 27 22.2 29.4 25.6 C30 27.4 29 29.6 27.4 30.4 C26.6 28.6 24.8 27.6 23 27.8 C21.4 27.6 20.4 26.6 20 25.4 Z" fill="#FFFFFF"/></g>
  <g stroke="#C9C1B4" stroke-width=".5" fill="none" stroke-linecap="round"><path d="M12.4 26.4 q2 -1.6 4.6 -1.4 M13.4 28.4 q2 -1.4 4.2 -1"/><path d="M27.6 26.4 q-2 -1.6 -4.6 -1.4 M26.6 28.4 q-2 -1.4 -4.2 -1"/><path d="M18 32 v3.4 M20 32.2 v4 M22 32 v3.4"/></g>`;
const SCHNAUZER_BROWS=`<g fill="#FFFFFF" stroke="#A79E90" stroke-width=".5" stroke-linejoin="round"><path d="M11.8 16.6 C12.6 13.4 16.6 12.6 18.8 14.6 C17.4 14.6 16.8 15.6 15.4 15.4 C14.2 16.2 13 16 11.8 16.6 Z"/><path d="M28.2 16.6 C27.4 13.4 23.4 12.6 21.2 14.6 C22.6 14.6 23.2 15.6 24.6 15.4 C25.8 16.2 27 16 28.2 16.6 Z"/></g>`;
function dogSVG(d,size,label){
  const f=d.face;
  return `<svg width="${size}" height="${size}" viewBox="0 0 40 40" role="img" aria-label="${esc(label||d.name)}">
    ${f.beard?`<path d="M10.5 15 L15 8.6 L18 12.6 Q13.6 13.6 12.6 18 Z" fill="${f.ear}" stroke="#A79E90" stroke-width=".5" stroke-linejoin="round"/><path d="M29.5 15 L25 8.6 L22 12.6 Q26.4 13.6 27.4 18 Z" fill="${f.ear}" stroke="#A79E90" stroke-width=".5" stroke-linejoin="round"/>`
      :`<ellipse cx="9" cy="21" rx="${f.earW}" ry="${f.earH}" fill="${f.ear}"/><ellipse cx="31" cy="21" rx="${f.earW}" ry="${f.earH}" fill="${f.ear}"/>`}
    <circle cx="20" cy="20" r="11" fill="${f.head}" stroke="rgba(0,0,0,.12)" stroke-width=".6"/>
    ${f.beard?`<path d="M10.5 15 L15 8.6 L18 12.6 Q13.6 13.6 12.6 18 Z" fill="${f.ear}" stroke="#A79E90" stroke-width=".5" stroke-linejoin="round"/><path d="M29.5 15 L25 8.6 L22 12.6 Q26.4 13.6 27.4 18 Z" fill="${f.ear}" stroke="#A79E90" stroke-width=".5" stroke-linejoin="round"/>`:''}
    ${f.mask?'<path d="M13 13 Q20 8 27 13 Q20 15 13 13 Z" fill="#2A2020"/>':''}
    ${f.spot?'<ellipse cx="15" cy="17" rx="5" ry="4.5" fill="#1E1A1A"/>':''}
    ${f.brindle?'<path d="M13 13 Q15 19 13 25 M17 11 Q18 16 16 21 M27 13 Q25 19 27 25 M23 11 Q22 16 24 21" stroke="#4A2E1F" stroke-width="1.3" fill="none"/>':''}
    ${f.beard?'':`<ellipse cx="20" cy="26" rx="6" ry="4.5" fill="${f.muzzle}"/>`}
    ${f.beard?SCHNAUZER:''}
    <circle cx="16" cy="18" r="1.5" fill="#1B1010"/><circle cx="24" cy="18" r="1.5" fill="#1B1010"/>
    ${f.beard?SCHNAUZER_BROWS:''}
    <ellipse cx="20" cy="${f.beard?23.4:24}" rx="2.2" ry="1.5" fill="#1B1010"/></svg>`;
}
const PAW='<svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true"><g fill="#C9A0B8"><ellipse cx="10" cy="13" rx="4" ry="3.4"/><circle cx="4.5" cy="8" r="2"/><circle cx="8" cy="5" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="15.5" cy="8" r="2"/></g></svg>';
const FLOWER=c=>`<svg width="30" height="30" viewBox="-13 -13 26 26" aria-hidden="true"><g fill="${c}"><circle cx="0" cy="-6.5" r="5"/><circle cx="6.2" cy="-2" r="5"/><circle cx="3.8" cy="5.3" r="5"/><circle cx="-3.8" cy="5.3" r="5"/><circle cx="-6.2" cy="-2" r="5"/></g><circle r="3" fill="#FFF3B8"/></svg>`;
const PAISLEY='<svg viewBox="0 0 34 34" aria-hidden="true"><path d="M17 31 C4 27 3 12 12 6 C20 1 30 8 26 16 C23 22 15 20 16 14" fill="var(--bg)" stroke="currentColor" stroke-width="1.6"/><circle cx="18" cy="13" r="2" fill="currentColor"/></svg>';

/* ---------- branch backgrounds (inline SVG, works offline) ---------- */
function motifURI(motif,pal,her,quilt,dark){
  const c=pal.motif,c2=pal.motif2,o=dark?.2:.13;
  let s='';
  switch(motif){
    case 'lily':s=`<g opacity="${o}"><ellipse cx="34" cy="38" rx="24" ry="14" fill="${c}"/><path d="M34 38 L58 31 L58 45 Z" fill="${pal.bg}"/>
      <ellipse cx="94" cy="96" rx="14" ry="8" fill="${c}"/><g fill="${c2}"><circle cx="96" cy="30" r="5"/><circle cx="103" cy="35" r="5"/><circle cx="89" cy="35" r="5"/><circle cx="96" cy="40" r="5"/></g></g>
      <path d="M8 70 v40 M14 66 v48" stroke="${c}" stroke-opacity="${o*.8}" stroke-width="2" stroke-dasharray="6 5"/>`;break;
    case 'garden':{ // wooden house up on stilts with fretwork and jalousies, the market clock, the seawall, flamboyant blossom
      const slats=(x,y,w,n)=>Array.from({length:n},(_,k)=>`<line x1="${x}" y1="${y+k*2.6}" x2="${x+w}" y2="${y+k*2.6}"/>`).join('');
      const fret=(x,y,w)=>Array.from({length:Math.round(w/4)},(_,k)=>`<path d="M${x+k*4} ${y} q2 3.2 4 0"/>`).join('');
      const bloom=(x,y)=>[[0,0],[3.4,-1.6],[-3.2,-1.8],[1.6,3],[-2,2.8]].map(([dx,dy])=>`<circle cx="${x+dx}" cy="${y+dy}" r="2.3"/>`).join('');
      s=`<g opacity="${o*1.5}" fill="none" stroke="${c}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">
        <path d="M10 34 L32 18 L54 34 Z" fill="${c}" fill-opacity=".25"/>${fret(12,34,40)}
        <rect x="14" y="36" width="36" height="22"/>${slats(17,40,9,6)}${slats(38,40,9,6)}<rect x="28" y="44" width="8" height="14"/>
        <path d="M18 58 v18 M27 58 v18 M37 58 v18 M46 58 v18 M54 76 L62 58 M10 76 h44"/>
        <path d="M86 44 v-14 l6 -8 l6 8 v14"/><circle cx="92" cy="36" r="3.4"/><path d="M92 34.4 v1.6 h1.4"/>
        <path d="M74 44 h36 M74 44 v12 M110 44 v12 M74 56 h36 M80 44 v12 M86 44 v12 M98 44 v12 M104 44 v12"/></g>
      <path d="M0 104 h120" stroke="${c}" stroke-opacity="${o*1.6}" stroke-width="2.2"/>
      <path d="M0 112 q7.5 -5 15 0 t15 0 t15 0 t15 0 t15 0 t15 0 t15 0 t15 0" fill="none" stroke="${c}" stroke-opacity="${o*1.2}" stroke-width="1.6"/>
      <g fill="${c2}" fill-opacity="${o*2}">${bloom(70,16)}${bloom(108,82)}${bloom(20,92)}</g>`;break;}
    case 'stilts':s=`<g opacity="${o*1.5}" fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round"><path d="M14 40 L34 26 L54 40 Z" fill="${c}" fill-opacity=".35"/><rect x="18" y="40" width="32" height="20"/><rect x="29" y="47" width="9" height="13"/>
      <path d="M20 60 v16 M30 60 v16 M40 60 v16 M48 60 v16 M14 76 h40"/></g>
      <g opacity="${o*1.4}"><path d="M70 92 h44 v8 h-44 Z" fill="${c2}"/><path d="M70 100 q5.5 6 11 0 q5.5 6 11 0 q5.5 6 11 0 q5.5 6 11 0" fill="none" stroke="${c2}" stroke-width="2"/>
      <circle cx="78" cy="112" r="4" fill="#F2B705"/><circle cx="88" cy="113" r="4" fill="${c}"/><circle cx="98" cy="112" r="4" fill="#E8913A"/></g>
      <g opacity="${o*1.2}"><rect x="78" y="18" width="28" height="20" rx="2" fill="#2F4A3F"/><path d="M83 26 h12 M83 31 h8" stroke="#fff" stroke-width="1.5"/></g>`;break;
    case 'gotcha':{const paw=(x,y,r)=>`<g transform="translate(${x} ${y}) rotate(${r})" fill="${c}"><ellipse cx="0" cy="3" rx="5" ry="4.2"/><circle cx="-5.6" cy="-2.4" r="2"/><circle cx="-2" cy="-6" r="2.1"/><circle cx="2" cy="-6" r="2.1"/><circle cx="5.6" cy="-2.4" r="2"/></g>`;
      s=`<g opacity="${o*2}">${paw(24,30,-20)}${paw(40,52,-10)}${paw(80,84,15)}${paw(96,106,25)}</g><g opacity="${o*1.8}" fill="${c2}"><rect x="76" y="22" width="20" height="5" rx="2.5"/><circle cx="76" cy="21" r="3.4"/><circle cx="76" cy="28" r="3.4"/><circle cx="96" cy="21" r="3.4"/><circle cx="96" cy="28" r="3.4"/></g>`;break;}
    case 'moving':s=`<g opacity="${o*1.7}" fill="none" stroke="${c}" stroke-width="1.6"><rect x="14" y="20" width="34" height="26" rx="2"/><path d="M14 20 l6 -7 h22 l6 7 M31 20 v26"/><rect x="70" y="72" width="30" height="24" rx="2"/><path d="M70 72 l5 -6 h20 l5 6 M85 72 v24"/></g>
      <g opacity="${o*1.4}" fill="none" stroke="${c2}" stroke-width="1.4" stroke-dasharray="3 3"><path d="M24 70 q20 -8 34 6 q14 14 30 -20"/></g><path d="M86 46 l6 4 l-6 4" fill="none" stroke="${c2}" stroke-opacity="${o*1.6}" stroke-width="1.6"/>`;break;
    case 'quiltshow':{let q='';for(let r=0;r<4;r++)for(let k=0;k<4;k++){const x=k*30,y=r*30,f=(r+k)%2?c:c2;q+=`<path d="M${x} ${y} h30 l-30 30z" fill="${f}"/>`;}
      s=`<g opacity="${o*1.1}">${q}</g><g opacity="${o*1.6}" fill="none" stroke="${pal.ink}" stroke-width=".8" stroke-dasharray="2 3">${[0,30,60,90].map(v=>`<path d="M${v} 0 v120 M0 ${v} h120"/>`).join('')}</g>`;break;}
    case 'easter':{const kite=(x,y,f,r)=>`<g transform="translate(${x} ${y}) rotate(${r})"><path d="M0 -12 L8 -2 L0 10 L-8 -2z" fill="${f}"/><path d="M0 10 q4 6 -1 10 q-5 4 1 9" fill="none" stroke="${pal.ink}" stroke-width=".8"/></g>`;
      s=`<g opacity="${o*2.4}">${kite(28,26,c2,-12)}${kite(92,74,c,10)}</g><g opacity="${o*1.5}" fill="#fff"><ellipse cx="86" cy="22" rx="16" ry="6"/><ellipse cx="78" cy="18" rx="9" ry="6"/><ellipse cx="26" cy="96" rx="14" ry="5"/></g>
      <path d="M0 114 h120" stroke="${c}" stroke-opacity="${o*1.4}" stroke-width="2"/>`;break;}
    case 'diwali':{const diya=(x,y)=>`<path d="M${x-12} ${y} h18 l6 -3 c-2 6 -5 10 -14 10 c-7 0 -10 -4 -10 -7z" fill="${c}"/><path d="M${x+7} ${y-12} c4 4 3 9 0 9 c-3 0 -4 -5 0 -9z" fill="${c2}"/>`;
      s=`<g opacity="${o*2.4}">${diya(26,30)}${diya(86,90)}</g><g fill="none" stroke="${c}" stroke-opacity="${o*1.5}" stroke-width="1.4">${[0,1,2,3,4,5,6,7].map(k=>`<ellipse cx="90" cy="28" rx="9" ry="4" transform="rotate(${k*22.5} 90 28)"/>`).join('')}<circle cx="30" cy="90" r="10" stroke-dasharray="2 3"/></g>`;break;}
    case 'mash':{const flags=['#1E8A4C','#F2B705','#E8553B','#1E8A4C','#F2B705'];
      s=`<g opacity="${o*2.2}"><path d="M0 14 Q60 30 120 14" fill="none" stroke="${pal.ink}" stroke-width="1"/>${flags.map((f,k)=>`<path d="M${8+k*24} ${18+Math.sin(k)*2} l8 14 l8 -14z" fill="${f}"/>`).join('')}</g>
      <g opacity="${o*1.6}" fill="none" stroke="${c}" stroke-width="2"><ellipse cx="34" cy="80" rx="18" ry="8"/><path d="M16 80 v12 a18 8 0 0 0 36 0 v-12"/></g>
      <g opacity="${o*1.8}" fill="${c2}"><path d="M92 100 c-4 -14 2 -30 12 -36 c-2 12 2 24 -4 36z"/><path d="M84 102 c-8 -10 -8 -24 -2 -32 c2 10 6 20 6 32z"/></g>`;break;}
    case 'halloween':s=`<g opacity="${o*1.6}"><circle cx="90" cy="26" r="14" fill="${c2}"/><circle cx="96" cy="22" r="12" fill="${pal.bg}"/></g>
      <g opacity="${o*2}" fill="${c}"><ellipse cx="22" cy="96" rx="9" ry="8"/><ellipse cx="32" cy="96" rx="9" ry="8"/><ellipse cx="27" cy="96" rx="9" ry="9"/></g>
      <g opacity="${o*1.6}" fill="${c2}"><path d="M30 34 c3 -4 7 -5 12 -3 c-2 2 -2 4 -1 6 c-2 -1 -4 0 -5 2 c-1 -2 -3 -2 -4 0 c-1 -2 -3 -3 -5 -2 c1 -2 1 -4 -1 -6 c5 -2 9 -1 12 3z"/></g>
      <g opacity="${o*1.2}" fill="none" stroke="${c2}" stroke-width="1"><path d="M70 120 l20 -20 l20 20 M90 100 v20 M76 114 h28"/></g>`;break;
    case 'thanks':s=`<g opacity="${o*1.6}" fill="${c}"><path d="M26 18 c6 6 6 14 0 22 c-6 -8 -6 -16 0 -22z"/><path d="M90 74 c8 4 10 12 6 20 c-8 -4 -10 -12 -6 -20z"/></g>
      <g opacity="${o*1.8}"><path d="M20 98 l30 0 l-15 -22z" fill="${c2}"/><rect x="18" y="96" width="34" height="5" rx="2" fill="${c}"/></g>
      <g opacity="${o*1.4}" fill="none" stroke="${c}" stroke-width="1.4" stroke-dasharray="3 4"><path d="M60 10 q20 20 0 40 q-20 20 0 40"/></g>`;break;
    case 'xmas':s=`<path d="M0 12 q30 14 60 0 t60 0" fill="none" stroke="${pal.ink}" stroke-opacity="${o*1.2}" stroke-width="1"/>
      <g opacity="${o*2.6}">${[[10,16,c2],[30,20,'#F2B705'],[50,14,c],[70,16,c2],[90,20,'#F2B705'],[110,14,c]].map(([x,y,f])=>`<ellipse cx="${x}" cy="${y+4}" rx="3" ry="4.5" fill="${f}"/>`).join('')}</g>
      <g opacity="${o*1.8}"><path d="M30 60 l12 22 h-24z M30 72 l14 22 h-28z" fill="${c}"/><rect x="27" y="94" width="6" height="6" fill="#7A5A3A"/></g>
      <g opacity="${o*1.8}"><rect x="78" y="80" width="26" height="18" rx="3" fill="#3A2418"/><path d="M78 84 q13 -8 26 0" fill="#FFF8EE"/><circle cx="91" cy="79" r="2.5" fill="${c2}"/></g>`;break;
    case 'snow':{const flake=(x,y,r)=>[0,60,120].map(a=>`<line x1="${x-r}" y1="${y}" x2="${x+r}" y2="${y}" transform="rotate(${a} ${x} ${y})"/>`).join('');
      s=`<g stroke="${c}" stroke-opacity="${o*1.4}" stroke-width="2" stroke-linecap="round">${flake(30,32,13)}${flake(92,90,8)}</g><circle cx="88" cy="28" r="3" fill="${c2}" fill-opacity="${o*1.4}"/>`;break;}
    case 'sun':s=`<g fill="none" stroke="${c}" stroke-opacity="${o*1.3}" stroke-width="2"><path d="M18 100 a14 14 0 0 1 28 0"/>${[200,230,260,290,320].map(a=>`<line x1="32" y1="100" x2="${32+22*Math.cos(a*Math.PI/180)}" y2="${100+22*Math.sin(a*Math.PI/180)}"/>`).join('')}
      <path d="M0 64 q15 -10 30 0 t30 0 t30 0 t30 0" stroke="${c2}"/><path d="M84 46 q8 -26 26 -30 M92 36 l-8 -6 M98 28 l-6 -8 M104 22 l-2 -9" stroke-linecap="round"/></g>`;break;
    case 'lights':s=`<g opacity="${o*1.1}" fill="none" stroke="${c}" stroke-width="1.5" stroke-linejoin="round"><path d="M10 52 L30 30 L50 52 M14 48 V76 H46 V48 M14 62 H46 M30 52 V76 M14 48 L30 62 L46 48"/><path d="M8 52 L30 28 L52 52" stroke-width="3" stroke-opacity=".5"/></g>
      <g opacity="${o*1.1}"><line x1="90" y1="58" x2="90" y2="72" stroke="${c}"/><circle cx="90" cy="84" r="10" fill="${c}" fill-opacity=".3"/><rect x="86" y="76" width="8" height="12" rx="2" fill="${c}"/></g>
      <g fill="${c2}" fill-opacity="${o*1.6}"><circle cx="70" cy="20" r="1.8"/><circle cx="104" cy="34" r="1.4"/><circle cx="62" cy="94" r="1.6"/><circle cx="20" cy="104" r="1.4"/><circle cx="112" cy="110" r="1.8"/></g>`;break;
    case 'rivers':{const reed=(x,y)=>`<path d="M${x} ${y} q-2 -12 -6 -18 M${x+3} ${y} q1 -14 4 -20 M${x+6} ${y} q3 -9 8 -13" fill="none" stroke="${c2}" stroke-opacity="${o*1.6}" stroke-width="1.4" stroke-linecap="round"/>`;
      s=`<g fill="none" stroke="${c}" stroke-opacity="${o*1.6}" stroke-width="2.2" stroke-linecap="round"><path d="M-6 30 C20 18 40 44 64 32 S110 18 126 28"/><path d="M-6 86 C24 98 46 72 70 84 S108 100 126 90"/></g>
      ${reed(14,74)}${reed(96,46)}
      <g opacity="${o*1.7}" fill="${c}"><path d="M86 120 q-2 -16 2 -30" stroke="${c}" stroke-width="2.4" fill="none"/><path d="M88 90 q-12 -4 -18 4 q10 -2 18 -4z M88 90 q12 -4 18 4 q-10 -2 -18 -4z M88 90 q-6 -10 -16 -10 q8 4 16 10z M88 90 q6 -10 16 -10 q-8 4 -16 10z"/></g>
      <g opacity="${o*1.8}"><ellipse cx="34" cy="56" rx="11" ry="4.2" fill="${c2}"/><path d="M23 56 q11 7 22 0" fill="none" stroke="${c}" stroke-width="1.2"/></g>`;break;}
    case 'star':s=`<g fill="none" stroke="${c}" stroke-opacity="${o*1.3}" stroke-width="1.6"><rect x="40" y="40" width="40" height="40"/><rect x="40" y="40" width="40" height="40" transform="rotate(45 60 60)"/>
      <circle cx="60" cy="60" r="6" fill="${c2}" fill-opacity=".5" stroke="none"/><path d="M0 0 L12 12 M120 0 L108 12 M0 120 L12 108 M120 120 L108 108"/></g>`;break;
    case 'lattice':s=`<g fill="none" stroke="${c}" stroke-opacity="${o*1.2}" stroke-width="1.4"><path d="M0 60 L60 0 L120 60 L60 120 Z M30 60 L60 30 L90 60 L60 90 Z"/>
      <circle cx="60" cy="60" r="4" fill="${c2}" fill-opacity=".6" stroke="none"/><path d="M0 100 q30 -14 60 0 t60 0" stroke="${c2}"/></g>`;break;
    case 'bonnet':{const sprig=(x,y)=>`<line x1="${x}" y1="${y}" x2="${x}" y2="${y-34}" stroke="#5F8F4E" stroke-width="2"/>${[0,1,2,3,4].map(k=>`<ellipse cx="${x+(k%2?4:-4)}" cy="${y-12-k*6}" rx="4" ry="3" fill="${c}"/>`).join('')}<ellipse cx="${x}" cy="${y-42}" rx="3" ry="3.5" fill="#FFFFFF"/>`;
      s=`<g opacity="${o*1.3}">${sprig(28,108)}${sprig(92,58)}</g>`;
      if(quilt)s+=`<g fill="none" stroke="${c2}" stroke-opacity="${o*1.6}" stroke-width="1.6" stroke-dasharray="4 4"><rect x="2" y="2" width="56" height="56"/><rect x="62" y="62" width="56" height="56"/></g><path d="M62 2 L118 58 L62 58 Z" fill="${c2}" fill-opacity="${o*.9}"/>`;break;}
    default:s=`<g fill="${c}" fill-opacity="${o*1.4}">${[[20,24,5],[86,40,3.5],[48,90,4],[104,100,2.5]].map(([x,y,r])=>`<path d="M${x} ${y-r*2} L${x+r*.5} ${y-r*.5} L${x+r*2} ${y} L${x+r*.5} ${y+r*.5} L${x} ${y+r*2} L${x-r*.5} ${y+r*.5} L${x-r*2} ${y} L${x-r*.5} ${y-r*.5} Z"/>`).join('')}</g>`;
  }
  if(her>0.02&&!['lily','garden','diwali','mash','halloween','thanks','xmas','easter','gotcha','moving','quiltshow','rivers'].includes(motif))s+=`<g opacity="${(o*her*1.2).toFixed(3)}"><ellipse cx="102" cy="14" rx="12" ry="7" fill="#2F7F86"/><path d="M102 14 L114 10 L114 18 Z" fill="${pal.bg}"/></g>`;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">${s}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/* ---------- theme ---------- */
let TH={},THEME_CH=null;
function applyTheme(L){
  const ch=L.chapter,pal=ch.pal,el=$('#game');
  const her=L.fest?Math.max(heritageAt(L.host),L.chapter.her[0]*.6):heritageAt(L.num);const quilt=!L.fest&&L.num>=QUILT_FROM;
  for(const [k,v] of Object.entries({bg:pal.bg,bg2:pal.bg2,panel:pal.panel,ink:pal.ink,muted:pal.muted,line:pal.line,accent:pal.accent,frame:pal.frame}))el.style.setProperty('--'+k,v);
  el.style.color=pal.ink;
  el.style.backgroundImage=motifURI(ch.motif,pal,her,quilt,ch.dark);
  document.querySelector('meta[name="theme-color"]').setAttribute('content',pal.bg);
  TH=Object.assign({},pal,{her,quilt});THEME_CH=ch;
  const era=L.fest?chapterOf(L.host).ch:ch;
  INST=ch.inst||era.inst||'blend';HER=her;SET=setFor(L);
  KEY=MODES[ch.id]||MODES[era.id]||MODES[Object.keys(MODES)[hashStr('key-'+(L.host||L.num))%7]];
}
function resetTheme(){SET=PIECE_SETS.henna;document.querySelector('meta[name="theme-color"]').setAttribute('content','#F8ECF2');INST='pan';HER=1;KEY=MODES.rain;}

/* ---------- icons for goals ---------- */
const iconCache={};
function makeIcon(spec,size=64){
  const key=JSON.stringify(spec)+size;if(iconCache[key])return iconCache[key];
  const prevSet=SET;if(spec.s)SET=PIECE_SETS[spec.s]||SET;
  const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d');const r=size*.42;
  const t0=0.6;
  if(spec.k==='crystal'){
    if((spec.cv||'ice')==='web'){x.fillStyle='rgba(60,45,80,.85)';rrPath(x,size*.1,size*.1,size*.8,size*.8,size*.16);x.fill();}
    drawCover(x,size*.1,size*.1,size*.8,size*.16,1,spec.cv||'ice',7);
  }else if(spec.k==='score'){
    x.save();x.translate(size/2,size/2);x.scale(r*1.05,r*1.05);x.fillStyle='#E59A3A';x.fill(STAR);x.restore();
  }else if(spec.k==='patch'){
    const q=spec.q||['#4A5BC4','#E77BA6'];x.save();x.translate(size*.14,size*.14);const w=size*.72;
    x.fillStyle=q[0];x.fillRect(0,0,w,w);x.fillStyle=q[1];x.beginPath();x.moveTo(0,0);x.lineTo(w,0);x.lineTo(w,w);x.closePath();x.fill();
    x.setLineDash([size*.05,size*.05]);x.strokeStyle='#fff';x.lineWidth=size*.04;x.strokeRect(size*.05,size*.05,w-size*.1,w-size*.1);x.restore();
  }else if(spec.k==='fish'){x.save();x.translate(size/2,size/2);drawFish(x,r*.95,0);x.restore();}
  else if(spec.k==='boss'){x.save();x.translate(size/2,size/2);drawArapaima(x,size*.29,0,1,0);x.restore();}
  else if(spec.k==='boulder'){const p=new Piece(-1,'boulder');x.save();x.translate(size/2,size/2);drawRock(x,r,p,spec.col||'#8A7A6A');x.restore();}
  else{const p=new Piece(spec.c??-1,spec.k);x.save();x.translate(size/2,size/2);drawPieceAt(x,p,0,0,r,t0);x.restore();}
  SET=prevSet;
  return iconCache[key]=c.toDataURL();
}
const ICONS={
  pause:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="2"/><rect x="14" y="5" width="4" height="14" rx="2"/></svg>',
  back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  arrow:d=>`<svg viewBox="0 0 24 24"><path d="M12 3.5l7.5 8.5h-4.5v8.5h-6v-8.5h-4.5z" fill="currentColor" transform="rotate(${{up:0,right:90,down:180,left:270}[d]} 12 12)"/></svg>`,
  star:'<svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.5L12.6 7L18.5 7.6L14 11.6L15.3 17.5L10 14.5L4.7 17.5L6 11.6L1.5 7.6L7.4 7Z" fill="#E59A3A"/></svg>',
};

/* ---------- canvas board ---------- */
const cv=$('#board'),ctx=cv.getContext('2d');
const bg=document.createElement('canvas');
let CS=48,PAD=8,DPR=1,BW=0,BH=0;
const pxX=x=>PAD+(x+.5)*CS,pxY=y=>PAD+(y+.5)*CS;
function resize(){
  if(!G.level)return;
  const wrap=$('#boardWrap');const w=wrap.clientWidth-30,h=wrap.clientHeight-30;
  const padK=G.level.fish?.5:.14;
  CS=Math.max(24,Math.floor(Math.min(w/(G.cols+2*padK),h/(G.rows+2*padK),74)));
  PAD=Math.round(CS*padK);BW=G.cols*CS+PAD*2;BH=G.rows*CS+PAD*2;
  DPR=Math.min(window.devicePixelRatio||1,2.5);
  cv.width=Math.round(BW*DPR);cv.height=Math.round(BH*DPR);cv.style.width=BW+'px';cv.style.height=BH+'px';
  buildBoardBg();
}
function buildBoardBg(){
  bg.width=cv.width;bg.height=cv.height;const b=bg.getContext('2d');b.setTransform(DPR,0,0,DPR,0,0);b.clearRect(0,0,BW,BH);
  for(let i=0;i<G.cells.length;i++){if(!G.valid[i])continue;const [x,y]=xy(i);
    b.fillStyle=(x+y)%2?TH.cellAlt:TH.cell;b.beginPath();b.arc(pxX(x),pxY(y),CS*.47,0,TAU);b.fill();}
}
function drawPonds(c,t){
  if(!G.level.fish)return;
  const [gx,gy]=DIRS[G.gravity];
  for(const L of lineList()){const i=L[0];if(i===undefined)continue;const [x,y]=xy(i);
    const cx=pxX(x)+gx*(CS*.5+PAD*.5),cy=pxY(y)+gy*(CS*.5+PAD*.5);
    const w=gx?PAD*.8:CS*.9,h=gy?PAD*.8:CS*.9;
    c.fillStyle=TH.water;c.globalAlpha=.75;rrPath(c,cx-w/2,cy-h/2,w,h,Math.min(w,h)/2);c.fill();c.globalAlpha=1;
    c.fillStyle='rgba(255,255,255,.55)';const s=Math.sin(t*2+x+y)*.15;
    c.beginPath();c.ellipse(cx+(gy?CS*.18:0),cy+(gx?CS*.18:0)+s,Math.min(w,h)*.22,Math.min(w,h)*.1,0,0,TAU);c.fill();
    if((x+y)%3===0&&TH.her>.3){c.fillStyle='#3E8E5A';c.beginPath();c.ellipse(cx-(gy?CS*.2:0),cy-(gx?CS*.2:0),Math.min(w,h)*.3,Math.min(w,h)*.2,0,0,TAU);c.fill();}
  }
}

/* ---------- effects ---------- */
const FX=[],PARTS=[],DYING=[],FISHGO=[];let shakeAmt=0,leap=null;
function shards(cx,cy,color,n,spread=1){
  if(PARTS.length>500)return;
  for(let k=0;k<n;k++){const a=Math.random()*TAU,s=(110+Math.random()*230)*spread;
    PARTS.push({x:pxX(cx),y:pxY(cy),vx:Math.cos(a)*s,vy:Math.sin(a)*s-140,life:0,max:.45+Math.random()*.35,
      size:CS*(.08+Math.random()*.08),rot:Math.random()*TAU,vr:(Math.random()-.5)*14,
      color:color||SHAPE_COLORS[Math.floor(Math.random()*6)]});}
}
function callout(text,color){const el=$('#callout');el.textContent=text;el.style.color=color||'var(--ink)';el.classList.remove('go');void el.offsetWidth;el.classList.add('go');}
function banner(text){const el=$('#banner');el.textContent=text;el.classList.remove('go');void el.offsetWidth;el.classList.add('go');}

H.sound=playSound;H.buzz=buzz;
H.shake=a=>{shakeAmt=Math.max(shakeAmt,a);};
H.destroyed=(p,i,o)=>{
  DYING.push({p,x:p.x,y:p.y,t:0,spill:o&&o.spill?o.spill:null});
  if(!(o&&o.spill)){const col=p.kind==='boulder'?(p.mud?'#6B5A3E':TH.rock):p.kind==='prism'?null:SHAPE_COLORS[p.color];shards(p.x,p.y,col,p.kind==='boulder'?8:5);}
};
H.crack=(i,p,broken)=>{shards(p.x,p.y,p.mud?'#6B5A3E':TH.rock,broken?6:4,.8);playSound(broken?'boulder':'crack');if(broken)H.shake(4);};
H.crystal=(i)=>{const [x,y]=xy(i);shards(x,y,'#BFE3FA',4,.7);playSound('crack');};
H.patch=(i)=>{const [x,y]=xy(i);FX.push({type:'stitch',x,y,t:0,life:.5});playSound('patch');};
H.beam=(x,y,dir,color)=>FX.push({type:'beam',x,y,dir,color:SHAPE_COLORS[color]||TH.accent||'#fff',t:0,life:.42});
H.ring=(x,y,R,color)=>FX.push({type:'ring',x,y,R,color:color==null?'#fff':SHAPE_COLORS[color],t:0,life:.5});
H.rays=(from,tos,color)=>{const [fx,fy]=xy(from);FX.push({type:'rays',fx,fy,tos:tos.map(xy),color:SHAPE_COLORS[color]||'#fff',t:0,life:.6});};
H.text=(txt,[x,y])=>FX.push({type:'text',txt,x,y,t:0,life:.9});
// Dog power sprites. Timings come from the engine (PUP_T) so the dog is where the pops are.
H.zoomies=(path,step,intro)=>{FX.push({type:'zoya',pts:path.map(xy),step:step/1000,intro:intro/1000,t:0,life:intro/1000+path.length*step/1000+.9});playSound('tool','dig');};
H.tidy=(cells,step,intro)=>{FX.push({type:'gypsy',pts:cells.map(xy),step:step/1000,intro:intro/1000,t:0,life:intro/1000+cells.length*step/1000+.7});};
H.leap=(x,y,ms)=>{FX.push({type:'flydog',x,y,t:0,life:ms/1000+.35,land:ms/1000});playSound('leap');};
H.sweep=(x,y,step,n)=>{FX.push({type:'sweep',x,y,step:step/1000,n,t:0,life:n*step/1000+.35});};
H.snuggle=(x,y,ms)=>{FX.push({type:'cash',x,y,t:0,life:ms/1000+.5,hold:ms/1000});};
H.pupGo=(p,i)=>{const [x,y]=xy(i);FX.push({type:'ring',x,y,R:1.2,color:null,t:0,life:.4});playSound('arrive');};
H.shadow=()=>{const m=DOGS.find(d=>d.id==='marshall');H.banner('+3 moves');floatCheer("Marshall's got you!",SHAPE_COLORS[3],[]);playSound('arrive');buzz([20,60,20]);};
H.special=(p,i)=>{playSound('forge');const [x,y]=xy(i);H.ring(x,y,1.3,p.color>=0?p.color:null);H.ring(x,y,.7,null);buzz(15);};
// Each success calls out its own cheer where it happened. A cheer already on screen
// isn't repeated: it pops again and counts up (x2, x3) instead.
const CHEER_COLOR={cascade:2,chain:4,beam:3,nova:1,prism:4,combo:0,fish:1,goal:2,boss:0,dog:3,win:0};
const LIVE_CHEERS=new Map();let cheerSide=1;
H.cheer=(action,cells)=>{
  if(!G.level||G.instant)return;
  if(action.startsWith('dog:')){const d=DOGS.find(x=>x.tool===action.slice(4));floatCheer(d.line,DOGPAL[d.id]?DOGPAL[d.id].accent:SHAPE_COLORS[3],cells||[]);return;}
  floatCheer(cheerForLevel(G.level,action),SHAPE_COLORS[CHEER_COLOR[action]??2],cells||[]);
};
function cheerHtml(text,count){return esc(text)+(count>1?`<span class="x">\u00d7${count}</span>`:'');}
function floatCheer(text,color,cells){
  const now=performance.now(),live=LIVE_CHEERS.get(text);
  if(live){live.count++;live.seen=now;live.el.innerHTML=cheerHtml(text,live.count);return;}
  const wrap=$('#boardWrap'),wr=wrap.getBoundingClientRect(),cr=cv.getBoundingClientRect();
  const k=(wr.width/wrap.offsetWidth)||1; // the screen may still be scaling in
  let cx=BW/2,cy=BH/2;
  if(cells.length){cx=0;cy=0;for(const i of cells){const [x,y]=xy(i);cx+=pxX(x);cy+=pxY(y);}cx/=cells.length;cy/=cells.length;}
  let X=(cr.left-wr.left)/k+cx,Y=(cr.top-wr.top)/k+cy;const Wd=wrap.offsetWidth;
  const el=document.createElement('div');el.className='cheer';el.innerHTML=cheerHtml(text,1);el.style.color=color||'var(--ink)';
  el.style.left=X+'px';el.style.top=Y+'px';wrap.appendChild(el);
  let w=el.offsetWidth;const maxW=Wd*.72;if(w>maxW){el.style.fontSize=Math.max(18,Math.floor(34*maxW/w))+'px';w=el.offsetWidth;}
  const h=el.offsetHeight;
  const left=Math.min(Math.max(X,w/2+14),Wd-w/2-14);el.style.left=left+'px';
  // don't stack on top of a cheer that is already showing
  for(let t=0;t<4;t++){let hit=false;for(const o of LIVE_CHEERS.values()){if(Math.abs(o.y-Y)<h&&Math.abs(o.x-left)<(o.w+w)/2){hit=true;break;}}if(!hit)break;Y+=h*1.05;}
  el.style.top=Y+'px';
  const dir=left<Wd*.34?1:left>Wd*.66?-1:(cheerSide=-cheerSide);
  const room=dir>0?Wd-14-(left+w/2):(left-w/2)-14;
  const dx=dir*Math.min(Math.max(room,0),30+Math.random()*60);
  const dy=-Math.min(Y-20,110+Math.random()*60),rot=dir*(2+Math.random()*5);
  const st={el,count:1,born:now,seen:now,x:left,y:Y,w};LIVE_CHEERS.set(text,st);
  const DRIFT=2600,HOLD=1500,FADE=1000;
  const step=t=>{
    const a=Math.min(1,(t-st.born)/DRIFT),e=1-Math.pow(1-a,2.2),since=t-st.seen;
    const pop=Math.min(1,(t-st.born)/150);
    const bump=since<260?Math.sin(since/260*Math.PI)*.16:0;
    const sc=(.45+.55*pop)*(1+bump)*(1-.05*a);
    const op=Math.min(pop*1.5,1)*(since<HOLD?1:Math.max(0,1-(since-HOLD)/FADE));
    st.x=left+dx*e;st.y=Y+dy*e;
    el.style.transform=`translate(-50%,-50%) translate(${(dx*e).toFixed(1)}px,${(dy*e).toFixed(1)}px) rotate(${(rot*e).toFixed(2)}deg) scale(${sc.toFixed(3)})`;
    el.style.opacity=op.toFixed(3);
    if(op>0||since<HOLD)requestAnimationFrame(step);else{el.remove();if(LIVE_CHEERS.get(text)===st)LIVE_CHEERS.delete(text);}
  };
  requestAnimationFrame(step);
}
H.banner=t=>banner(t);
H.shuffleFx=()=>playSound('prism');
H.gravity=()=>{playSound('tilt');};
H.goalBump=k=>{const el=document.querySelector(`.goal[data-k="${k}"]`);if(!el)return;el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump');};
H.fishHome=(p,i)=>{H.cheer('fish',[i]);const [gx,gy]=DIRS[G.gravity];FISHGO.push({p,x:p.x,y:p.y,gx,gy,t:0});buzz(12);};
H.bossFed=n=>{if(n>=4)FX.push({type:'glow',t:0,life:.5});};
H.bossMove=()=>playSound('boss');
H.bossThrash=picks=>{playSound('thrash');H.shake(12);buzz([30,30,30]);callout('Splash!','#7A5A3A');};
H.bossLeap=parts=>{const xs=parts.map(p=>p.x),y=parts[0].y;leap={x:(Math.min(...xs)+Math.max(...xs))/2,y,dir:G.boss.dir,t:0};playSound('leap');banner('Set free');buzz([20,40,60]);};

let hintTimer=0;
H.armHint=()=>{clearTimeout(hintTimer);hintTimer=setTimeout(()=>{if(!G.busy&&G.active&&!G.ended&&curScreen==='game'&&!toolSel){const m=findMove();if(m)G.hint=m;}},7000);};
H.clearHint=()=>{clearTimeout(hintTimer);G.hint=null;};

function updateFx(dt){
  for(let k=FX.length-1;k>=0;k--){FX[k].t+=dt;if(FX[k].t>=FX[k].life)FX.splice(k,1);}
  for(let k=PARTS.length-1;k>=0;k--){const p=PARTS[k];p.life+=dt;if(p.life>=p.max){PARTS.splice(k,1);continue;}
    p.vy+=900*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=p.vr*dt;}
  for(let k=DYING.length-1;k>=0;k--){const d=DYING[k];d.t+=dt;if(d.t>=(d.spill?.6:.22)){DYING.splice(k,1);continue;}
    if(d.spill){const v=3+d.t*30;d.x+=d.spill[0]*v*dt;d.y+=d.spill[1]*v*dt;}}
  for(let k=FISHGO.length-1;k>=0;k--){const f=FISHGO[k];f.t+=dt;if(f.t>.7){FISHGO.splice(k,1);continue;}f.x+=f.gx*dt*2.2;f.y+=f.gy*dt*2.2;}
  if(leap){leap.t+=dt;if(leap.t>1.6)leap=null;}
  for(const p of G.cells){if(!p)continue;
    if(p.pop>0)p.pop=Math.max(0,p.pop-dt/.35);if(p.land>0)p.land=Math.max(0,p.land-dt/.18);if(p.hit>0)p.hit=Math.max(0,p.hit-dt/.3);}
  shakeAmt*=Math.pow(.002,dt);if(shakeAmt<.2)shakeAmt=0;
}
function isCalm(){
  if(FX.length||PARTS.length||DYING.length||FISHGO.length||leap||shakeAmt||G.hint||G.sel>=0||toolSel)return false;
  for(const p of G.cells)if(p&&(p.kind==='pup'||isSpecial(p)))return false;
  if(G.boss&&!G.boss.released)return false;
  for(const p of G.cells)if(p&&(p.x!==p.tx||p.y!==p.ty||p.pop||p.land||p.hit||p.kind==='fish'))return false;
  return true;
}

function render(t){
  const c=ctx;c.setTransform(DPR,0,0,DPR,0,0);c.clearRect(0,0,BW,BH);
  if(shakeAmt)c.translate((Math.random()-.5)*shakeAmt,(Math.random()-.5)*shakeAmt);
  c.drawImage(bg,0,0,BW,BH);
  drawPonds(c,t);
  for(let i=0;i<G.patch.length;i++){const P=G.patch[i];if(!P)continue;const [x,y]=xy(i);
    const X=PAD+x*CS+3,Y=PAD+y*CS+3,S=CS-6;
    if(P===2){const q=TH.quilt||['#4A5BC4','#E77BA6','#E6B450'];const a=q[(x*2+y)%3],b2=q[(x+y*2+1)%3];
      c.fillStyle=a;rrPath(c,X,Y,S,S,CS*.12);c.fill();
      c.save();rrPath(c,X,Y,S,S,CS*.12);c.clip();c.fillStyle=b2;c.beginPath();
      if((x+y)%2){c.moveTo(X,Y);c.lineTo(X+S,Y);c.lineTo(X+S,Y+S);}else{c.moveTo(X,Y+S);c.lineTo(X,Y);c.lineTo(X+S,Y);}c.closePath();c.fill();c.restore();
      c.setLineDash([3,3]);c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=1.3;rrPath(c,X+3,Y+3,S-6,S-6,CS*.1);c.stroke();c.setLineDash([]);}
    else{c.fillStyle=TH.accent;c.globalAlpha=.14;rrPath(c,X+1,Y+1,S-2,S-2,CS*.14);c.fill();c.globalAlpha=1;c.setLineDash([5,3]);c.strokeStyle=TH.accent;c.lineWidth=2.2;rrPath(c,X+1,Y+1,S-2,S-2,CS*.14);c.stroke();c.setLineDash([]);}
  }
  // coverings sit under the piece, like a floor tile, so the piece on top always reads
  {const cv=coverOf(G.level);for(let i=0;i<G.crystal.length;i++){const L=G.crystal[i];if(!L)continue;const [x,y]=xy(i);
    drawCover(c,PAD+x*CS+2,PAD+y*CS+2,CS-4,CS*.16,L,cv,i);}}
  if(G.sel>=0&&G.cells[G.sel]){const [x,y]=xy(G.sel);c.strokeStyle=TH.ink;c.lineWidth=2.5;c.beginPath();c.arc(pxX(x),pxY(y),CS*.47,0,TAU);c.stroke();}
  if(toolSel&&toolSel.first>=0){const [x,y]=xy(toolSel.first);c.strokeStyle='#D9468A';c.lineWidth=3;c.beginPath();c.arc(pxX(x),pxY(y),CS*.47,0,TAU);c.stroke();}
  const hintIds=new Set();if(G.hint)for(const i of G.hint){const p=G.cells[i];if(p)hintIds.add(p.id);}
  const r=CS*.4;
  c.save();c.beginPath();c.rect(0,0,BW,BH);c.clip();
  for(const p of G.cells){if(!p)continue;
    const rot=hintIds.has(p.id)?Math.sin(t*14)*.16*(Math.sin(t*3)>0?1:.25):0;
    const sel=G.sel>=0&&G.cells[G.sel]===p?1.08:1;
    drawPieceAt(c,p,pxX(p.x),pxY(p.y),r,t,{rot,scale:sel});}
  if(G.boss&&!G.boss.released){const parts=bossCells().map(i=>G.cells[i]).filter(Boolean);
    if(parts.length===3){const x=(parts[0].x+parts[2].x)/2,y=parts[1].y;c.save();c.translate(pxX(x),pxY(y));
      drawArapaima(c,CS,t,G.boss.dir,G.boss.fed/G.boss.need);c.restore();
      const w=CS*2.2,bx=pxX(x)-w/2,by=pxY(y)-CS*.62;c.fillStyle='rgba(255,255,255,.75)';rrPath(c,bx,by,w,6,3);c.fill();
      c.fillStyle='#F2B705';rrPath(c,bx,by,Math.max(6,w*G.boss.fed/G.boss.need),6,3);c.fill();}}
  c.restore();
  for(const f of FISHGO){c.save();c.globalAlpha=1-f.t/.7;c.translate(pxX(f.x),pxY(f.y));const a={down:Math.PI/2,up:-Math.PI/2,left:Math.PI,right:0}[G.gravity]||0;c.rotate(a);drawFish(c,r,t);c.restore();}
  if(leap){const k=leap.t/1.6;c.save();c.globalAlpha=1-Math.max(0,k-.6)/.4;c.translate(pxX(leap.x),pxY(leap.y)-Math.sin(k*Math.PI)*CS*3);c.rotate((k-.5)*1.2*leap.dir);drawArapaima(c,CS,t,leap.dir,1);c.restore();}
  for(const d of DYING){
    if(d.spill){const k=d.t/.6;drawPieceAt(c,d.p,pxX(d.x),pxY(d.y),r,t,{alpha:1-k*k,scale:1-k*.3});}
    else{const k=d.t/.22;drawPieceAt(c,d.p,pxX(d.x),pxY(d.y),r,t,{alpha:1-k,scale:1+k*.4});}
  }
  for(const p of PARTS){const a=1-p.life/p.max;c.save();c.globalAlpha=a;c.translate(p.x,p.y);c.rotate(p.rot);c.fillStyle=p.color;
    c.beginPath();c.arc(0,-p.size*.5,p.size*.55,0,TAU);c.arc(0,p.size*.5,p.size*.55,0,TAU);c.fill();c.restore();}
  for(const f of FX){const k=f.t/f.life;c.save();
    if(f.type==='beam'){const a=1-k,th=CS*(.95*(1-k))+2;c.globalAlpha=a;
      if(f.dir==='h'){const y=pxY(f.y);c.fillStyle=f.color;c.fillRect(0,y-th/2,BW,th);c.fillStyle='#fff';c.fillRect(0,y-th/6,BW,th/3);}
      else{const x=pxX(f.x);c.fillStyle=f.color;c.fillRect(x-th/2,0,th,BH);c.fillStyle='#fff';c.fillRect(x-th/6,0,th/3,BH);}}
    else if(f.type==='ring'){const e=1-Math.pow(1-k,3);c.globalAlpha=1-k;c.strokeStyle=f.color;c.lineWidth=CS*.35*(1-k)+1;
      c.beginPath();c.arc(pxX(f.x),pxY(f.y),Math.max(1,f.R*CS*e),0,TAU);c.stroke();}
    else if(f.type==='rays'){c.globalAlpha=1-k;c.strokeStyle=f.color;c.lineWidth=3;c.lineCap='round';c.beginPath();
      for(const [tx,ty] of f.tos){c.moveTo(pxX(f.fx),pxY(f.fy));c.lineTo(pxX(f.fx)+(pxX(tx)-pxX(f.fx))*Math.min(1,k*3),pxY(f.fy)+(pxY(ty)-pxY(f.fy))*Math.min(1,k*3));}c.stroke();}
    else if(f.type==='paws'){const n=f.pts.length,shown=Math.min(n,Math.ceil(k*1.6*n));c.fillStyle=TH.ink;
      for(let j=0;j<shown;j++){const [px,py]=f.pts[j],[qx,qy]=f.pts[Math.min(n-1,j+1)];const age=k-j/(1.6*n);c.globalAlpha=Math.max(0,.55-age*.7);
        c.save();c.translate(pxX(px)+(j%2?CS*.12:-CS*.12),pxY(py));c.rotate(Math.atan2(qy-py,qx-px)+Math.PI/2);const s=CS*.11;
        c.beginPath();c.ellipse(0,s*.6,s,s*.8,0,0,TAU);c.fill();for(const [a,b] of [[-1.1,-.7],[-.4,-1.2],[.4,-1.2],[1.1,-.7]]){c.beginPath();c.arc(a*s,b*s,s*.38,0,TAU);c.fill();}c.restore();}}
    else if(f.type==='flydog'){ // Super Marshall: crouch at the edge, one big arc with a trail, squash on landing
      const img=pupImg('bound');const T=f.land,crouch=.28*T,tx=pxX(f.x),ty=pxY(f.y),sx=tx<BW/2?-CS*.2:BW+CS*.2,sy=BH-CS*.4,S=CS*1.5;
      const at=u=>{const e=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;return [sx+(tx-sx)*e,sy+(ty-sy)*e-Math.sin(u*Math.PI)*Math.max(CS*3,(sy-ty)*.5+CS*2)];};
      if(img.complete&&img.naturalWidth){
        if(f.t<crouch){const q=f.t/crouch;c.globalAlpha=Math.min(1,q*3);c.translate(sx+(tx>sx?CS*.4:-CS*.4)*q,sy);c.scale(1+.25*q,1-.3*q);c.drawImage(img,-S/2,-S,S,S);}
        else if(f.t<T){const u=(f.t-crouch)/(T-crouch);
          c.globalAlpha=.35*(1-u);c.fillStyle='#000';c.beginPath();c.ellipse(tx,ty+CS*.35,CS*.6*u,CS*.18*u,0,0,TAU);c.fill();
          for(let g=4;g>=1;g--){const v=Math.max(0,u-g*.05);const [gx,gy]=at(v);c.globalAlpha=.12*(5-g);c.drawImage(img,gx-S/2,gy-S/2,S,S);}
          const [X,Y]=at(u);c.globalAlpha=1;c.translate(X,Y);c.rotate((tx>sx?1:-1)*(u-.5)*.7);c.scale(1-.1*Math.sin(u*Math.PI),1+.12*Math.sin(u*Math.PI));c.drawImage(img,-S/2,-S/2,S,S);}
        else{const q=(f.t-T)/(f.life-T);c.globalAlpha=1-q;c.translate(tx,ty);c.scale(1+.3*(1-q),1-.3*(1-q));c.drawImage(img,-S/2,-S/2,S,S);}}}
    else if(f.type==='sweep'){ // the row rolls outward from where he landed
      const reach=Math.min(f.n,f.t/f.step)+.5,y=pxY(f.y),x=pxX(f.x),th=CS*.5,fade=f.t>f.n*f.step?1-(f.t-f.n*f.step)/(f.life-f.n*f.step):1;
      c.globalAlpha=.85*fade;c.fillStyle=TH.accent||'#E59A3A';c.fillRect(x-reach*CS,y-th/2,reach*CS*2,th);c.fillStyle='#fff';c.fillRect(x-reach*CS,y-th/8,reach*CS*2,th/4);}
    else if(f.type==='gypsy'){ // Gypsy walks to each piece in turn, neat and upright, and ticks it off
      const img=pupImg('fetch'),n=f.pts.length,S=CS*1.25,u=Math.max(0,f.t-f.intro)/f.step;
      let X,Y;if(f.t<f.intro){const q=f.t/f.intro,e=1-Math.pow(1-q,3);const [x0,y0]=f.pts[0];X=pxX(x0);Y=pxY(y0)-CS*(1.6*(1-e))-CS*.15;c.globalAlpha=Math.min(1,q*2);}
      else{const j=Math.min(n-1,Math.floor(u)),q=Math.min(1,(u-j)*1.6),e=q<.5?2*q*q:1-Math.pow(-2*q+2,2)/2,[x0,y0]=f.pts[j],[x1,y1]=f.pts[Math.min(n-1,j+1)];
        X=pxX(x0)+(pxX(x1)-pxX(x0))*(j<n-1?e:0);Y=pxY(y0)+(pxY(y1)-pxY(y0))*(j<n-1?e:0)-CS*.15-Math.abs(Math.sin(q*Math.PI))*CS*.12;
        c.globalAlpha=f.t>f.life-.4?(f.life-f.t)/.4:1;
        for(let m=0;m<=Math.min(n-1,Math.floor(u));m++){const age=u-m;if(age>3)continue;const [mx,my]=f.pts[m];c.save();c.globalAlpha=Math.max(0,1-age/3)*.9;
          c.strokeStyle='#E6B450';c.lineWidth=2.4;c.lineCap='round';c.beginPath();c.moveTo(pxX(mx)-CS*.14,pxY(my));c.lineTo(pxX(mx)-CS*.03,pxY(my)+CS*.11);c.lineTo(pxX(mx)+CS*.17,pxY(my)-CS*.13);c.stroke();c.restore();}}
      if(img.complete&&img.naturalWidth){c.translate(X,Y);c.drawImage(img,-S/2,-S/2,S,S);}}
    else if(f.type==='zoya'){ // Zoya: bursts in, tears along her path with the zoomies, skids off the board
      const img=pupImg('dig'),n=f.pts.length,S=CS*1.3;let X,Y,rot=0,sq=1;
      for(let j=0;j<n;j++){const born=f.intro+j*f.step,age=f.t-born;if(age<0||age>1.4)continue;const [px,py]=f.pts[j],[qx,qy]=f.pts[Math.min(n-1,j+1)];
        c.save();c.globalAlpha=Math.max(0,.6-age*.43);c.fillStyle=TH.ink;c.translate(pxX(px)+(j%2?CS*.13:-CS*.13),pxY(py));c.rotate(Math.atan2(qy-py,qx-px)+Math.PI/2);const s=CS*.1;
        c.beginPath();c.ellipse(0,s*.6,s,s*.8,0,0,TAU);c.fill();for(const [a,b] of [[-1.1,-.7],[-.4,-1.2],[.4,-1.2],[1.1,-.7]]){c.beginPath();c.arc(a*s,b*s,s*.38,0,TAU);c.fill();}c.restore();}
      const run=f.t-f.intro;
      if(run<0){const q=f.t/f.intro;const [x0,y0]=f.pts[0];X=pxX(x0)+Math.sin(q*40)*CS*.12*(1-q);Y=pxY(y0)-CS*(1-q)*2;rot=Math.sin(q*30)*.4;sq=1+.2*Math.sin(q*25);}
      else if(run<n*f.step){const u=run/f.step,j=Math.min(n-1,Math.floor(u)),q=u-j,[x0,y0]=f.pts[j],[x1,y1]=f.pts[Math.min(n-1,j+1)];
        X=pxX(x0)+(pxX(x1)-pxX(x0))*q;Y=pxY(y0)+(pxY(y1)-pxY(y0))*q-Math.abs(Math.sin(q*Math.PI))*CS*.35;rot=Math.sin(u*2.7)*.55+(x1<x0?-.2:.2);sq=1+.15*Math.sin(q*Math.PI*2);
        if(Math.random()<.5)PARTS.push({x:X+(Math.random()-.5)*CS*.4,y:Y+CS*.4,vx:(Math.random()-.5)*120,vy:-60-Math.random()*80,rot:0,vr:0,life:0,max:.35,color:'rgba(160,140,120,.6)',size:CS*.07});}
      else{const q=(run-n*f.step)/(f.life-f.intro-n*f.step),[x0,y0]=f.pts[n-1],dir=pxX(x0)<BW/2?-1:1;X=pxX(x0)+dir*q*BW*.7;Y=pxY(y0)-Math.abs(Math.sin(q*Math.PI*3))*CS*.4;rot=dir*.5;c.globalAlpha=1-q*.6;}
      if(img.complete&&img.naturalWidth){c.translate(X,Y);c.rotate(rot);c.scale(sq,2-sq);c.drawImage(img,-S/2,-S/2,S,S);}}
    else if(f.type==='cash'){ // Cash curls up on the spot; a warm glow spreads while the pieces come round
      const img=pupImg('charge'),X=pxX(f.x),Y=pxY(f.y),S=CS*1.4,q=Math.min(1,f.t/.45),out=f.t>f.hold?Math.min(1,(f.t-f.hold)/(f.life-f.hold)):0;
      const R=CS*(.6+1.1*Math.min(1,f.t/f.hold))*(1+.04*Math.sin(f.t*5));const g=c.createRadialGradient(X,Y,0,X,Y,R);g.addColorStop(0,'rgba(255,214,150,.55)');g.addColorStop(1,'rgba(255,214,150,0)');
      c.globalAlpha=1-out;c.fillStyle=g;c.beginPath();c.arc(X,Y,R,0,TAU);c.fill();
      c.fillStyle='rgba(255,236,200,.9)';for(let m=0;m<6;m++){const a=m*1.05+f.t*.8,rr=CS*(.5+.35*((f.t*.6+m*.17)%1));c.globalAlpha=(1-out)*(1-((f.t*.6+m*.17)%1));c.beginPath();c.arc(X+Math.cos(a)*rr,Y+Math.sin(a)*rr-CS*.3*((f.t*.6+m*.17)%1),CS*.04,0,TAU);c.fill();}
      if(img.complete&&img.naturalWidth){const e=1-Math.pow(1-q,3),br=1+.03*Math.sin(f.t*4);c.globalAlpha=1-out;c.translate(X,Y-CS*.1);c.scale(e*br,e*(2-br));c.drawImage(img,-S/2,-S/2,S,S);}}
    else if(f.type==='stitch'){c.globalAlpha=1-k;c.strokeStyle='#fff';c.lineWidth=2;c.setLineDash([4,4]);c.lineDashOffset=-k*20;
      c.beginPath();c.arc(pxX(f.x),pxY(f.y),CS*(.3+.3*k),0,TAU);c.stroke();}
    else if(f.type==='text'){c.globalAlpha=k<.7?1:1-(k-.7)/.3;c.font=`${Math.round(CS*.46)}px 'Rozha One',Georgia,serif`;
      c.textAlign='center';c.textBaseline='middle';const X=pxX(f.x),Y=pxY(f.y)-k*CS*.8;
      c.lineWidth=4;c.strokeStyle=TH.panel;c.strokeText(f.txt,X,Y);c.fillStyle=TH.ink;c.fillText(f.txt,X,Y);}
    c.restore();}
}

/* ---------- loop ---------- */
let curScreen='home',lastT=performance.now(),frameN=0,calmFor=0;
function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min(.05,(now-lastT)/1000);lastT=now;
  if(curScreen!=='game'||!G.level)return;
  stepMotion(dt*G.speed);updateFx(dt);
  calmFor=isCalm()?calmFor+dt:0;frameN++;
  if(calmFor>1&&frameN%3)return; // idle board: drop to about 20fps to save battery
  render(now/1000);
}
requestAnimationFrame(frame);

/* ---------- input ---------- */
let drag=null,toolSel=null;
function cellFromEvent(e){const r=cv.getBoundingClientRect();const x=Math.floor((e.clientX-r.left-PAD)/CS),y=Math.floor((e.clientY-r.top-PAD)/CS);
  return inb(x,y)&&G.valid[idx(x,y)]?idx(x,y):-1;}
const TOOL_HINT={fetch:'Fetch: tap any piece',dig:'Dig: tap a column',bound:'Bound: tap two pieces to swap',charge:'Charge: tap where to charge'};
function setTool(tool){
  toolSel=tool?{tool,first:-1}:null;G.sel=-1;H.clearHint();
  $('#toolHint').textContent=tool?TOOL_HINT[tool]:'';
  document.querySelectorAll('.dogbtn').forEach(b=>b.classList.toggle('sel',!!tool&&b.dataset.tool===tool));
}
cv.addEventListener('pointerdown',async e=>{
  Snd.unlock();
  if(G.ended&&G.busy){G.speed=3;return;}
  if(!G.active||G.busy)return;
  const i=cellFromEvent(e);
  if(toolSel){
    if(i<0)return;
    const t=toolSel.tool;
    setTool(null);if(!(await useTool(t,i)))callout('Not there',null);return;
  }
  if(i<0){G.sel=-1;return;}
  if(!movable(G.cells[i])){G.sel=-1;return;}
  H.clearHint();
  if(G.sel>=0&&G.sel!==i&&adjacent(G.sel,i)){const a=G.sel;G.sel=-1;attemptSwap(a,i);return;}
  G.sel=G.sel===i?-1:i;drag={i,x:e.clientX,y:e.clientY};
  try{cv.setPointerCapture(e.pointerId);}catch(_){}
});
cv.addEventListener('pointermove',e=>{
  if(!drag||toolSel)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(Math.max(Math.abs(dx),Math.abs(dy))<CS*.32)return;
  const [x,y]=xy(drag.i);let nx=x,ny=y;if(Math.abs(dx)>Math.abs(dy))nx+=Math.sign(dx);else ny+=Math.sign(dy);
  const a=drag.i;drag=null;G.sel=-1;
  if(inb(nx,ny)&&G.valid[idx(nx,ny)])attemptSwap(a,idx(nx,ny));
});
['pointerup','pointercancel'].forEach(ev=>cv.addEventListener(ev,()=>{drag=null;}));

document.querySelectorAll('#tilts button').forEach(b=>{
  b.innerHTML=ICONS.arrow(b.dataset.dir);
  b.addEventListener('click',async()=>{
    Snd.unlock();
    if(G.flux<100||G.busy||!G.active||G.ended){b.classList.remove('deny');void b.offsetWidth;b.classList.add('deny');
      if(G.flux<100)callout('Flux not full',null);return;}
    setTool(null);banner('Tilt');await tilt(b.dataset.dir);
  });
});

/* ---------- HUD ---------- */
/* What sits over a square depends on the place: ice only where it is cold. */
const COVERS={ice:{name:'ice',verb:'Break'},sand:{name:'sand',verb:'Sweep away'},silt:{name:'river silt',verb:'Wash away'},
  web:{name:'cobwebs',verb:'Sweep away'},flour:{name:'flour',verb:'Dust off'},confetti:{name:'confetti',verb:'Clear'}};
function coverOf(L){return (L&&L.chapter&&L.chapter.cover)||'ice';}
function drawCover(c,X,Y,S,R,L,cv,i){
  const rnd=k=>{const v=Math.sin(i*12.9898+k*78.233)*43758.5453;return v-Math.floor(v);};
  if(cv==='web'){c.strokeStyle='rgba(255,255,255,.78)';c.lineWidth=1;c.beginPath();
    const web=(ox,oy,sx,sy)=>{for(const [a,b] of [[1,0],[1,.45],[.7,.8],[.45,1],[0,1]]){c.moveTo(ox,oy);c.lineTo(ox+sx*a*S,oy+sy*b*S);}
      for(const k of [.3,.55,.8]){c.moveTo(ox+sx*k*S,oy);c.quadraticCurveTo(ox+sx*k*S*.62,oy+sy*k*S*.62,ox,oy+sy*k*S);}};
    web(X,Y,1,1);if(L>1)web(X+S,Y+S,-1,-1);c.stroke();return;}
  const P={sand:['rgba(226,196,140,','rgba(190,148,88,.95)','rgba(150,110,60,.55)'],silt:['rgba(130,108,66,','rgba(110,86,52,.9)','rgba(255,255,255,.5)'],
    flour:['rgba(255,255,255,','rgba(214,192,160,.95)','rgba(255,255,255,.85)'],confetti:['rgba(255,255,255,',TH.accent||'#C9A0B8',null],ice:['rgba(190,225,250,','rgba(110,170,225,.95)',null]}[cv]||null;
  if(!P)return;
  const base=cv==='ice'?(L>1?.75:.5):cv==='flour'?(L>1?.85:.6):cv==='confetti'?.22:(L>1?.85:.6);
  c.fillStyle=P[0]+base+')';rrPath(c,X,Y,S,S,R);c.fill();
  c.save();rrPath(c,X,Y,S,S,R);c.clip();
  if(cv==='ice'){c.fillStyle='rgba(255,255,255,.6)';c.beginPath();c.moveTo(X,Y+S*.22);c.lineTo(X+S*.22,Y);c.lineTo(X+S*.32,Y);c.lineTo(X,Y+S*.32);c.closePath();c.fill();
    c.beginPath();c.moveTo(X+S*.8,Y+S);c.lineTo(X+S,Y+S*.8);c.lineTo(X+S,Y+S*.86);c.lineTo(X+S*.86,Y+S);c.closePath();c.fill();}
  else if(cv==='sand'||cv==='flour'){c.fillStyle=P[2];const n=L>1?22:14;for(let k=0;k<n;k++){c.beginPath();c.arc(X+rnd(k)*S,Y+rnd(k+40)*S,S*(cv==='flour'?.035:.022),0,TAU);c.fill();}}
  else if(cv==='silt'){c.strokeStyle=P[2];c.lineWidth=1.2;c.beginPath();for(const yy of [.3,.55,.8]){c.moveTo(X,Y+S*yy);c.bezierCurveTo(X+S*.3,Y+S*(yy-.1),X+S*.6,Y+S*(yy+.1),X+S,Y+S*yy);}c.stroke();}
  else if(cv==='confetti'){const n=L>1?18:10;for(let k=0;k<n;k++){c.save();c.translate(X+rnd(k)*S,Y+rnd(k+20)*S);c.rotate(rnd(k+60)*TAU);c.fillStyle=SHAPE_COLORS[Math.floor(rnd(k+80)*6)];c.fillRect(-S*.05,-S*.025,S*.1,S*.05);c.restore();}}
  c.restore();
  if(cv==='confetti'){c.setLineDash([4,3]);c.lineWidth=2;c.strokeStyle=P[1];rrPath(c,X+1.5,Y+1.5,S-3,S-3,R);c.stroke();c.setLineDash([]);}
  else{c.lineWidth=L>1?3:2.2;c.strokeStyle=P[1];rrPath(c,X+1.5,Y+1.5,S-3,S-3,R);c.stroke();
    c.lineWidth=1;c.strokeStyle='rgba(255,255,255,.9)';rrPath(c,X+3.5,Y+3.5,S-7,S-7,R*.8);c.stroke();}
  if(L>1){c.lineWidth=1.8;c.strokeStyle=P[1];rrPath(c,X+6,Y+6,S-12,S-12,R*.6);c.stroke();}
}
function goalLabel(g,L){
  if(g.t==='score')return `Score ${g.n.toLocaleString()} points`;
  if(g.t==='collect')return `Collect ${g.n} ${pieceName(g.c,L)}`;
  if(g.t==='crystal'){const C=COVERS[coverOf(L)];return `${C.verb} ${L.crystalCount} ${C.name}`;}
  if(g.t==='fish')return `Bring ${g.n} fish home`;
  if(g.t==='boss')return 'Feed the river giant until it is full';
  if(g.t==='patch')return `Sew ${L.patchCount} patches`;
  return `Break ${L.boulderCount} ${L.chapter.id==='sun'?'coral rocks':'rocks'}`;
}
function goalIcon(g,L){
  const q=(L&&L.chapter.pal.quilt)||['#4A5BC4','#E77BA6'];
  return g.t==='score'?makeIcon({k:'score'}):g.t==='collect'?makeIcon({k:'normal',c:g.c,s:setKey(setFor(L))}):g.t==='crystal'?makeIcon({k:'crystal',cv:coverOf(L)}):
    g.t==='fish'?makeIcon({k:'fish'}):g.t==='boss'?makeIcon({k:'boss'}):g.t==='patch'?makeIcon({k:'patch',q}):makeIcon({k:'boulder',col:(L&&L.chapter.pal.rock)||'#8A7A6A'});
}
function buildGoals(){
  const el=$('#goals');
  if(G.mode==='endless'){el.innerHTML=`<div class="goal"><img src="${makeIcon({k:'score'})}" alt=""><span id="endBest">Best ${save.endlessBest.toLocaleString()}</span></div>`;return;}
  el.innerHTML=G.goals.map((g,k)=>`<div class="goal" data-k="${k}"><img src="${goalIcon(g,G.level)}" alt="${esc(goalLabel(g,G.level))}"><b></b></div>`).join('');
}
function buildDock(){
  const tools=Object.keys(G.tools);
  $('#dogDock').innerHTML=tools.map(t=>{const d=DOGS.find(x=>x.tool===t);
    return `<button class="dogbtn" data-tool="${t}" aria-label="${esc(d.name)}: ${esc(d.toolName)}">${dogSVG(d,40,d.name)}<i class="chg"></i><i class="treat">${BONE}</i></button>`;}).join('')+`<span class="treats" id="treatChip"></span>`;
  document.querySelectorAll('.dogbtn').forEach(b=>b.onclick=()=>{Snd.unlock();
    const t=b.dataset.tool;if(G.busy||!G.active||G.ended)return;
    if(!(G.tools[t]>0)){
      if(save.treats>0){const d=DOGS.find(x=>x.tool===t);save.treats--;persist();G.tools[t]=1;playSound('arrive');callout(d.name+' gets a treat',null);hud();setTool(t);}
      return;}
    playSound('click');setTool(toolSel&&toolSel.tool===t?null:t);});
  $('#fluxBox').classList.toggle('off',!G.level.gravityUnlocked);$('#fluxRow').classList.toggle('off',!G.level.gravityUnlocked);
}
function hud(){
  if(!G.level)return;
  const L=G.level,mode=G.mode;
  $('#hudK').textContent=mode==='endless'?'Endless':mode==='daily'?"Today's leaf":L.chapter.name;
  $('#hudLevel').textContent=mode==='endless'?'Endless':mode==='daily'?L.daily.slice(5).replace('-','/'):mode==='bonus'?'Bonus blossom':'Level '+L.num;
  $('#hudMoves').textContent=mode==='endless'?'∞':Math.max(0,G.moves);
  $('#movesBox').classList.toggle('low',mode!=='endless'&&G.moves<=5&&!G.ended);
  $('#hudScore').textContent=G.score.toLocaleString();
  const sb=$('#sbar');sb.style.visibility=mode==='endless'?'hidden':'visible';
  if(mode!=='endless'){const met=goalsMet();
    $('#sbarFill').style.width=Math.min(100,G.score/L.s3*100)+'%';
    const p2=L.s2/L.s3*100;$('#st1').style.left=Math.min(p2*.5,40)+'%';$('#st2').style.left=p2+'%';$('#st3').style.left='100%';
    $('#st1').classList.toggle('on',met);$('#st2').classList.toggle('on',met&&G.score>=L.s2);$('#st3').classList.toggle('on',met&&G.score>=L.s3);
    G.goals.forEach((g,k)=>{const el=document.querySelector(`.goal[data-k="${k}"]`);if(!el)return;
      const left=g.t==='score'?Math.max(0,g.n-G.score):g.left;const done=g.t==='boss'?!!(G.boss&&G.boss.released):left<=0;
      el.classList.toggle('done',done);el.querySelector('b').textContent=done?'✓':g.t==='boss'?Math.round(100*G.boss.fed/G.boss.need)+'%':left.toLocaleString();});
  }else if(G.score>save.endlessBest){save.endlessBest=G.score;const eb=$('#endBest');if(eb)eb.textContent='Best '+save.endlessBest.toLocaleString();}
  const full=G.flux>=100;
  $('#fluxFill').style.width=G.flux+'%';$('#tilts').classList.toggle('ready',full&&L.gravityUnlocked);
  $('#fluxHint').textContent=full?'Flux full: tap an arrow':'Flux';
  document.querySelectorAll('#tilts button').forEach(b=>b.classList.toggle('cur',b.dataset.dir===G.gravity));
  document.querySelectorAll('.dogbtn').forEach(b=>{const sp=!(G.tools[b.dataset.tool]>0);b.classList.toggle('spent',sp);b.classList.toggle('canTreat',sp&&save.treats>0);});
  const tc=$('#treatChip');if(tc)tc.innerHTML=save.treats>0?BONE+' '+save.treats:'';
}
H.hud=hud;

/* ---------- modal ---------- */
function modal({title,sub='',body='',buttons}){
  return new Promise(res=>{
    const m=$('#modal');
    m.innerHTML=`<div class="card"><h2>${title}</h2>${sub?`<div class="sub">${sub}</div>`:''}<div class="mbody">${body}</div>
      <div class="mbtns">${buttons.map((b,k)=>`<button class="btn ${b.style||''}" data-k="${k}">${b.label}</button>`).join('')}</div></div>`;
    m.classList.add('show');
    m.querySelectorAll('[data-k]').forEach(el=>el.onclick=()=>{Snd.unlock();playSound('click');m.classList.remove('show');res(buttons[+el.dataset.k].value);});
  });
}

/* ---------- home ---------- */
function emblemSVG(){
  const bloom=(x,y,c,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})"><g fill="${c}"><circle cx="0" cy="-5" r="4"/><circle cx="4.8" cy="-1.5" r="4"/><circle cx="3" cy="4" r="4"/><circle cx="-3" cy="4" r="4"/><circle cx="-4.8" cy="-1.5" r="4"/></g><circle r="2.2" fill="#FFF3B8"/></g>`;
  const cols=['#E0508E','#9562D2','#EE9F2E','#D9468A','#5F84E2'];
  const pts=[[100,40],[70,52],[130,52],[52,78],[148,78],[84,72],[116,72],[100,62],[64,98],[136,98],[100,88]];
  return `<svg viewBox="0 0 200 200" aria-hidden="true">
    <circle cx="100" cy="100" r="94" fill="none" stroke="#8C3F6A" stroke-width="2.5" stroke-dasharray=".1 7" stroke-linecap="round"/>
    <circle cx="100" cy="100" r="86" fill="#FFF8FB" stroke="#8C3F6A" stroke-width="1.2"/>
    <path d="M100 168 C96 140 104 118 100 92 M100 120 C88 108 74 104 62 98 M100 116 C112 104 126 100 138 98 M100 104 C92 90 80 84 70 76 M100 100 C110 88 122 82 132 76 M100 96 C100 80 100 70 100 56"
      fill="none" stroke="#8C3F6A" stroke-width="4" stroke-linecap="round"/>
    <path d="M100 168 C88 172 74 172 62 168 M100 168 C112 172 126 172 138 168 M100 168 C96 176 90 180 82 182 M100 168 C104 176 110 180 118 182" fill="none" stroke="#8C3F6A" stroke-width="2.4" stroke-linecap="round"/>
    ${pts.map((p,k)=>bloom(p[0],p[1],cols[k%5],k===0?1.3:1)).join('')}
  </svg>`;
}
function buildToran(){
  const pal=['#E0508E','#9562D2','#EE9F2E'];let h='';
  for(let i=0;i<9;i++)h+=`<svg width="28" height="${i%2?42:34}" viewBox="0 0 28 ${i%2?42:34}"><line x1="14" y1="0" x2="14" y2="${i%2?24:16}" stroke="#8C3F6A" stroke-width="1"/><g transform="translate(14 ${i%2?32:24})">${FLOWER(pal[i%3]).replace('width="30" height="30"','width="22" height="22" x="-11" y="-11"')}</g></svg>`;
  $('#toran').innerHTML=h;
}
function refreshHome(){
  resetTheme();
  const n=save.level;const {ch}=chapterOf(n);
  $('#contLabel').textContent=n>STORY_TOTAL?`Into the unknown, level ${n}`:`${ch.name}, level ${n}`;
  $('#btnContinue').firstChild.textContent=n===1&&!save.stars[1]?'Begin':'Continue';
  $('#tglSound b').textContent=save.sound?'On':'Off';
  $('#tglHaptic b').textContent=save.haptics?'On':'Off';
  $('#tglHaptic').style.display=navigator.vibrate?'':'none';
  const d=save.daily[todayStr()];$('#btnDaily').textContent=d?"Today's leaf ✓":"Today's leaf";
}

/* ---------- the tree map ---------- */
function totalStars(){return Object.values(save.stars).reduce((a,b)=>a+b,0);}
function buildTree(){
  const scroll=$('#treeScroll'),tree=$('#tree');
  const W=scroll.clientWidth||390,cx=W/2;
  const maxN=save.level>STORY_TOTAL?save.level+8:STORY_TOTAL+4;
  const GAP=60,HEAD=86,BOTTOM=150,TOP=120;
  const yb=[0];let y=BOTTOM;const heads=[];
  for(let n=1;n<=maxN;n++){
    const {ci,idx}=chapterOf(n);
    if(idx===1&&(n<=STORY_TOTAL||n===STORY_TOTAL+1)){y+=n===1?10:HEAD;heads.push({ci,y:y-HEAD*.52,n});}
    yb[n]=y;y+=GAP;
  }
  const Ht=y+TOP;const Y=n=>Ht-yb[n];
  const wave=v=>cx+Math.sin(v/150)*9;
  const off=Math.min(112,W*.29);
  const pos=n=>{const side=n%2?-1:1;return {x:cx+side*(off-(n%4<2?0:18)),y:Y(n),side};};
  // branch bands
  let bands='';
  for(let ci=0;ci<=CHAPTERS.length;ci++){
    const s=ci<CHAPTERS.length?chapterStart(ci)+1:STORY_TOTAL+1;const e=ci<CHAPTERS.length?chapterStart(ci)+CHAPTERS[ci].count:maxN;
    if(s>maxN)break;
    const half=(GAP+HEAD)/2;const top=ci<CHAPTERS.length?Y(Math.min(e,maxN))-half:0;const bot=ci===0?Ht:Y(s)+half;
    const pal=ci<CHAPTERS.length?CHAPTERS[ci].pal:UNKNOWN_PALS[0];
    bands+=`<rect x="0" y="${top}" width="${W}" height="${bot-top}" fill="${pal.bg}"/>`;
  }
  // trunk, twigs, roots, crown
  let trunk='M'+wave(Ht-BOTTOM+40)+' '+(Ht-BOTTOM+40);
  for(let v=Ht-BOTTOM+40;v>Y(Math.min(maxN,save.level>STORY_TOTAL?maxN:STORY_TOTAL))-30;v-=40)trunk+=' L'+wave(v).toFixed(1)+' '+v;
  let twigs='';
  for(let n=1;n<=maxN;n++){const p=pos(n);const tx=wave(p.y+16);twigs+=`M${tx.toFixed(1)} ${p.y+16} Q${((tx+p.x)/2).toFixed(1)} ${p.y+14} ${p.x.toFixed(1)} ${p.y}`;}
  const crownY=Y(STORY_TOTAL);
  const crown=`<g fill="#F3D9E6" opacity=".85"><circle cx="${cx}" cy="${crownY+30}" r="${off*1.15}"/><circle cx="${cx-off*.8}" cy="${crownY+70}" r="${off*.7}"/><circle cx="${cx+off*.8}" cy="${crownY+70}" r="${off*.7}"/></g>`;
  const rb=Ht-BOTTOM+40;
  const roots=`<path d="M${cx} ${rb} C${cx-30} ${rb+12} ${cx-70} ${rb+18} ${cx-110} ${rb+16} M${cx} ${rb} C${cx+30} ${rb+12} ${cx+70} ${rb+18} ${cx+110} ${rb+16} M${cx} ${rb} C${cx-8} ${rb+24} ${cx-24} ${rb+34} ${cx-44} ${rb+40} M${cx} ${rb} C${cx+8} ${rb+24} ${cx+24} ${rb+34} ${cx+44} ${rb+40}" fill="none" stroke="#8C3F6A" stroke-width="4" stroke-linecap="round"/>
    <path d="M0 ${rb+60} q${W/8} -10 ${W/4} 0 t${W/4} 0 t${W/4} 0 t${W/4} 0" fill="none" stroke="#7FC4B4" stroke-width="3" opacity=".7"/>`;
  let html=`<svg class="trunk" width="${W}" height="${Ht}" viewBox="0 0 ${W} ${Ht}" aria-hidden="true">${bands}${crown}
    <path d="${trunk}" fill="none" stroke="#8C3F6A" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${twigs}" fill="none" stroke="#8C3F6A" stroke-width="2.6" stroke-linecap="round"/>${roots}</svg>`;
  // branch labels
  for(const h of heads){const ch=h.ci<CHAPTERS.length?CHAPTERS[h.ci]:UNKNOWN;const pal=h.ci<CHAPTERS.length?ch.pal:UNKNOWN_PALS[0];
    const locked=h.n>save.level;
    html+=`<div class="bough" style="left:${cx}px;top:${Ht-h.y}px;color:${pal.accent};background:${pal.panel};opacity:${locked?.55:1}">${esc(ch.name)}</div>`;}
  // leaves
  for(let n=1;n<=maxN;n++){
    const p=pos(n);const done=!!save.stars[n];const cur=n===save.level;const {ch}=chapterOf(n);
    const q=(ch.pal&&ch.pal.quilt)||['#E0508E','#9562D2','#EE9F2E'];
    if(done)html+=`<button class="leaf" data-n="${n}" style="left:${p.x}px;top:${p.y}px" aria-label="Level ${n}, ${save.stars[n]} stars">${FLOWER(q[n%3])}</button>`;
    else if(cur)html+=`<button class="leaf current" data-n="${n}" style="left:${p.x}px;top:${p.y}px" aria-label="Level ${n}, next"><span class="num">${n}</span></button>`;
    else html+=`<div class="leaf locked" style="left:${p.x}px;top:${p.y}px"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><ellipse cx="8" cy="8" rx="4.5" ry="6.5" fill="${n>STORY_TOTAL?'#E8DDF4':'#F3D9E6'}" stroke="#C9A0B8" stroke-width="1.4"/></svg></div>`;
  }
  // bonus blossoms, beside the leaf that opens them (opposite the dogs)
  for(let n=1;n<=maxN;n++){const b=bonusAt(n);if(!b)continue;const f=FESTIVALS.find(x=>x.id===b.id),p=pos(n),bd=b.dog&&DOGS.find(d=>d.id===b.dog);
    const x=p.x+p.side*(DOGS.some(d=>d.after===n)?-44:44),y2=p.y-20,open=bonusOpen(n),got=save.bonus[n];
    const icon=bd?(save.dogs.includes(bd.id)||open?dogSVG(bd,30):PAW):`<img src="${makeIcon({k:'normal',c:f.sig,s:f.set||f.id},40)}" alt="">`;
    html+=open?`<button class="bonusb${got?' got':''}" data-b="${n}" style="left:${x}px;top:${y2}px;--fa:${(bd?DOGPAL[bd.id]:f.pal).accent};--fb:${f.pal.bg}" aria-label="${esc(bonusName(b))} bonus">${icon}${got?'<i>'+'★'.repeat(got.stars)+'</i>':''}</button>`
      :`<div class="bonusb shut" style="left:${x}px;top:${y2}px" aria-hidden="true">${icon}</div>`;}
  // companions where they joined
  for(const d of DOGS){if(d.after>maxN)continue;const p=pos(d.after);const met=save.dogs.includes(d.id);
    const x=p.x+p.side*46,y2=p.y+4;
    html+=met?`<div class="mapdog" style="left:${x}px;top:${y2}px">${dogSVG(d,28)}</div>`:`<div class="mapdog unmet" style="left:${x}px;top:${y2}px">${PAW}</div>`;}
  const cp=pos(Math.min(save.level,maxN));
  html+=`<svg class="pin" style="left:${cp.x}px;top:${cp.y}px" viewBox="0 0 36 46" role="img" aria-label="Maria is here"><path d="M18 45 C18 45 3 28 3 17 A15 15 0 0 1 33 17 C33 28 18 45 18 45 Z" fill="#9562D2" stroke="#FFF8FB" stroke-width="2"/><path d="M18 24 C12 19 11 15 14 13 C16 12 18 13 18 15 C18 13 20 12 22 13 C25 15 24 19 18 24 Z" fill="#FFF8FB"/></svg>`;
  tree.style.height=Ht+'px';tree.innerHTML=html;
  tree.querySelectorAll('.leaf[data-n]').forEach(b=>b.onclick=()=>{playSound('click');openLevel(+b.dataset.n);});
  tree.querySelectorAll('.bonusb[data-b]').forEach(b=>b.onclick=()=>{playSound('click');openBonus(+b.dataset.b);});
  $('#starTotal').innerHTML=ICONS.star+' '+totalStars()+(save.treats>0?' &nbsp;'+BONE+' '+save.treats:'');
  $('#mapDogs').innerHTML=DOGS.map(d=>save.dogs.includes(d.id)?`<span class="d">${dogSVG(d,28)}</span>`:`<span class="d unmet">${PAW}</span>`).join('');
  $('#mapPlay').textContent=`Play level ${save.level}`;
  requestAnimationFrame(()=>{scroll.scrollTop=Math.max(0,cp.y-scroll.clientHeight*.55);});
}

/* ---------- screens ---------- */
function show(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('show',s.id===id));curScreen=id;
  if(id==='home')refreshHome();
  if(id==='map'){resetTheme();buildTree();}
}
// A new branch opens with its pattern on the level card itself: one screen before play, never a stack of them.
// The rules are taught a step at a time by each leaf's tip; the full list stays under Help and in the pause menu.
function chapterIntro(n){
  const {ch,idx}=chapterOf(n);
  if(idx!==1||save.chaptersSeen.includes(ch.id))return null;
  save.chaptersSeen.push(ch.id);persist();
  return {ch,tile:`<div class="motif-tile" style="background-color:${ch.pal.bg};background-image:${motifURI(ch.motif,ch.pal,heritageAt(n),false,ch.dark).replace(/"/g,"'")}"></div>`};
}
async function openLevel(n){
  Snd.unlock();
  const intro=chapterIntro(n);
  const L=getLevel(n);
  const body=`${intro?intro.tile:''}<div class="glist">${L.goals.map(g=>`<div class="gl"><img src="${goalIcon(g,L)}" alt="">${esc(goalLabel(g,L))}</div>`).join('')}</div>
    ${L.tip?`<div class="tip${L.chapter.id==='rain'?' slate':''}">${esc(L.tip)}</div>`:''}`;
  const head=intro?{title:esc(intro.ch.name),sub:`${esc(intro.ch.line)}<br>Level ${n}, ${L.moves} moves`}:{title:'Level '+n,sub:`${esc(L.chapter.name)}, ${L.moves} moves`};
  const v=await modal({...head,body,buttons:[{label:'Start',style:'primary',value:'go'},{label:'The tree',style:'ghost',value:'back'}]});
  if(v==='go')startLevel(n);else show('map');
}
function startLevel(n){const L=getLevel(n);setupBoard(L,'journey',hashStr('maria-board-'+n+'-v'+ENGINE_VERSION));enterGame();}
function startDaily(){Snd.unlock();const d=todayStr();const L=dailyLevel(d,save.level);setupBoard(L,'daily',hashStr('maria-daily-board-'+d));enterGame();}
function startBonus(n){Snd.unlock();const L=bonusLevel(n,save.level);setupBoard(L,'bonus',hashStr('maria-bonus-board-'+n));enterGame();}
function bonusOpen(n){return !!save.stars[n];}
function festCard(f,her){const pal=f.pal;return `<div class="motif-tile" style="background-color:${pal.bg};background-image:${motifURI(f.motif,pal,her,false,f.dark).replace(/"/g,"'")}"></div>`;}
// A bonus blossom is never offered: it bursts open on its own, once, right after the leaf that opens it.
async function surpriseBonus(n){
  save.bonusSeen.push(n);persist();
  const L=bonusLevel(n,save.level),f=L.chapter,set=PIECE_SETS[f.set||f.id];
  applyTheme(L);if(Snd.ok()){Snd.noise(.18,{vol:.22,from:5200,to:900,q:1.2});Snd.tone(220,.25,{vol:.12,slide:3.2});}setTimeout(()=>playSound('win'),220);buzz([40,30,25,30,70]);
  const icons=[0,1,2,3,4,5].map(c=>makeIcon({k:'normal',c,s:f.set||f.id},64));
  const bits=Array.from({length:18},(_,k)=>{const a=k/18*TAU+Math.random()*.3,d=120+Math.random()*120;
    return `<img class="sp-bit" src="${icons[k%6]}" alt="" style="--dx:${(Math.cos(a)*d).toFixed(0)}px;--dy:${(Math.sin(a)*d).toFixed(0)}px;--r:${((Math.random()-.5)*540).toFixed(0)}deg;animation-delay:${(Math.random()*.15).toFixed(2)}s">`;}).join('');
  const el=document.createElement('div');el.className='surprise';
  el.style.cssText=`--sb:${f.pal.bg};--sa:${f.pal.accent};--si:${f.pal.ink}`;
  el.innerHTML=`<div class="sp-bg" style="background-image:${motifURI(f.motif,f.pal,0,false,f.dark).replace(/"/g,"'")}"></div>
    <div class="sp-in"><div class="sp-burst">${bits}<img class="sp-hero" src="${icons[f.sig]}" alt=""></div>
    <div class="sp-ring"></div><div class="sp-name">${esc(f.name)}</div><div class="sp-line">${esc(f.line)}</div></div><div class="sp-flash"></div>`;
  document.body.appendChild(el);
  await new Promise(r=>{let done=false;const go=()=>{if(done)return;done=true;r();};setTimeout(go,3200);setTimeout(()=>el.addEventListener('pointerdown',go),500);});
  el.classList.add('out');setTimeout(()=>el.remove(),450);
  startBonus(n);
}
async function openBonus(n){
  Snd.unlock();
  const L=bonusLevel(n,save.level),f=L.chapter;
  const goals=`<div class="glist">${L.goals.map(g=>`<div class="gl"><img src="${goalIcon(g,L)}" alt="">${esc(goalLabel(g,L))}</div>`).join('')}</div>`;
  const v=await modal({title:esc(f.name),sub:esc(f.line),body:festCard(f,0)+goals+`<div class="tip">A bonus blossom, ${L.moves} moves. It never blocks the way; play it whenever you like.</div>`,
    buttons:[{label:'Start',style:'primary',value:'go'},{label:'The tree',style:'ghost',value:'back'}]});
  if(v==='go')startBonus(n);else show('map');
}
function startEndless(){Snd.unlock();const L=endlessLevel(save.level);setupBoard(L,'endless',(Math.random()*4294967296)>>>0);enterGame();}
function enterGame(){
  FX.length=PARTS.length=DYING.length=FISHGO.length=0;shakeAmt=0;leap=null;setTool(null);
  applyTheme(G.level);show('game');buildGoals();buildDock();resize();hud();
  G.active=true;G.busy=true;const s=G.session;
  waitSettled().then(()=>{if(s===G.session){G.busy=false;H.armHint();}});
}
function leaveGame(){G.session++;G.active=false;G.level=null;settleWaiters.length=0;H.clearHint();setTool(null);persist();}

async function dogArrival(d){
  save.dogs.push(d.id);persist();playSound('arrive');buzz([20,60,20]);
  await modal({title:esc(d.name),body:`<div class="hero">${dogSVG(d,120)}</div><p style="margin:0">${esc(d.name)} walks with Maria from here.</p>
    <div class="tip"><b>${esc(d.toolName)}</b>: ${esc(d.desc)} Tap ${esc(d.name)} beside the board to use it.</div>`,
    buttons:[{label:'Walk on together',style:'primary',value:1}]});
}
async function crownMoment(){
  save.crownSeen=true;persist();playSound('arrive');
  await modal({title:'Today',body:`<div class="hero">${DOGS.map(d=>dogSVG(d,64)).join('')}</div>
    <p style="margin:0">Every leaf from the roots to the crown is in bloom, and the quilt is finished.</p>
    <div class="tip">The tree keeps growing. Every level from here is new.</div>`,
    buttons:[{label:'Keep growing',style:'primary',value:1}]});
}

H.win=async()=>{
  const s=G.session;await new Promise(r=>setTimeout(r,500));if(s!==G.session)return;
  const L=G.level;const stars=1+(G.score>=L.s2?1:0)+(G.score>=L.s3?1:0);
  playSound('win');buzz([20,40,20]);
  [0,1,2].forEach(k=>{if(k<stars)setTimeout(()=>playSound('star',KEY.root+KEY.arp[k]+24),450+k*260);});
  const starHtml=`<div class="stars">${[0,1,2].map(k=>`<span class="${k<stars?'on':''}" style="animation-delay:${.35+k*.26}s">★</span>`).join('')}</div>`;
  if(G.mode==='daily'){
    const d=L.daily;save.daily[d]=Math.max(save.daily[d]||0,G.score);persist();
    const v=await modal({title:"Today's leaf",sub:'In bloom',body:`${starHtml}<div class="big-score">${G.score.toLocaleString()}</div><div class="sub">Best today ${save.daily[d].toLocaleString()}</div><div class="tip">A new leaf grows tomorrow.</div>`,
      buttons:[{label:'Play again',value:'again'},{label:'Home',style:'primary',value:'home'}]});
    if(v==='again')startDaily();else{leaveGame();show('home');}return;
  }
  if(G.mode==='bonus'){
    const h=L.host,prev=save.bonus[h]||{stars:0,best:0},treats=Math.max(0,stars-prev.stars);
    save.bonus[h]={stars:Math.max(prev.stars,stars),best:Math.max(prev.best,G.score)};save.treats+=treats;persist();
    const v=await modal({title:esc(L.chapter.name),sub:esc(cheerForLevel(L,'win'))+' The bonus blossom opens.'+(treats?` <b>+${treats} treat${treats>1?'s':''} for the pups.</b>`:''),
      body:`${starHtml}<div class="big-score">${G.score.toLocaleString()}</div><div class="sub">Best ${save.bonus[h].best.toLocaleString()}</div>`,
      buttons:[{label:'Next leaf',style:'primary',value:'next'},{label:'Replay',value:'replay'},{label:'The tree',style:'ghost',value:'map'}]});
    if(v==='replay'){startBonus(h);return;}
    leaveGame();
    if(v==='next')openLevel(Math.min(save.level,h+1));else show('map');
    return;
  }
  const n=L.num;
  save.stars[n]=Math.max(save.stars[n]||0,stars);save.best[n]=Math.max(save.best[n]||0,G.score);
  const first=save.level===n;save.level=Math.max(save.level,n+1);persist();
  const bon=bonusAt(n),newBonus=bon&&!save.bonus[n]&&!save.bonusSeen.includes(n);
  const v=await modal({title:'Level '+n,sub:esc(cheerFor(n,'win'))+' The leaf blooms.',body:`${starHtml}<div class="big-score">${G.score.toLocaleString()}</div><div class="sub">Best ${save.best[n].toLocaleString()}</div>`,
    buttons:[{label:'Next leaf',style:'primary',value:'next'},{label:'Replay',value:'replay'},{label:'The tree',style:'ghost',value:'map'}]});
  if(v==='replay'){startLevel(n);return;}
  leaveGame();
  const dog=DOGS.find(d=>d.after===n&&!save.dogs.includes(d.id));if(dog)await dogArrival(dog);
  if(n===STORY_TOTAL&&!save.crownSeen)await crownMoment();
  if(newBonus){await surpriseBonus(n);return;}
  if(v==='next')openLevel(n+1);else show('map');
};
H.lose=async()=>{
  const s=G.session;await new Promise(r=>setTimeout(r,450));if(s!==G.session)return;
  playSound('lose');
  const L=G.level;
  const left=G.goals.filter(g=>g.t==='boss'?!G.boss.released:(g.t==='score'?g.n-G.score:g.left)>0).map(g=>{
    const v=g.t==='score'?(g.n-G.score).toLocaleString()+' points':g.t==='boss'?Math.round(100*(1-G.boss.fed/G.boss.need))+'% to go':
      g.left+(g.t==='collect'?' '+pieceName(g.c,L):g.t==='crystal'?' '+COVERS[coverOf(L)].name:g.t==='fish'?' fish':g.t==='patch'?' patches':' rocks');
    return `<div class="gl"><img src="${goalIcon(g,L)}" alt="">${esc(v)}${g.t==='boss'?'':' to go'}</div>`;}).join('');
  const btns=[];if(!G.continued)btns.push({label:'Keep going (+5 moves)',style:'primary',value:'more'});
  btns.push({label:'Try again',style:G.continued?'primary':'',value:'retry'},{label:G.mode==='journey'||G.mode==='bonus'?'The tree':'Home',style:'ghost',value:'map'});
  const v=await modal({title:'Out of moves',sub:G.mode==='daily'?"Today's leaf":G.mode==='bonus'?esc(L.chapter.name):'Level '+L.num,body:`<div class="glist">${left}</div>`,buttons:btns});
  if(v==='more'){G.continued=true;G.moves+=5;G.ended=false;hud();
    if(!findMove()){await shuffle();}G.busy=false;H.armHint();}
  else if(v==='retry'){if(G.mode==='daily')startDaily();else if(G.mode==='bonus')startBonus(L.host);else startLevel(L.num);}
  else{const j=G.mode==='journey'||G.mode==='bonus';leaveGame();show(j?'map':'home');}
};

async function showHelp(){
  const I=s=>`<img src="${makeIcon(s)}" alt="">`;
  const q=['#4A5BC4','#E77BA6'];
  const body=`<div class="help">
    <div class="row">${I({k:'normal',c:3})}<p>Drag a piece onto a neighbor to swap. Line up <b>3 or more</b> of the same piece to clear them.</p></div>
    <div class="row">${I({k:'lineH',c:0})}<p><b>4 in a row</b> makes a Beam, which sweeps its whole line.</p></div>
    <div class="row">${I({k:'nova',c:2})}<p>An <b>L or T</b> makes a Nova, which blasts a diamond around it.</p></div>
    <div class="row">${I({k:'prism'})}<p><b>5 in a row</b> makes a Prism. Swap it with any piece to clear every one of that kind.</p></div>
    <div class="row">${I({k:'fish'})}<p>Fish swim toward the pool. Clear the pieces in their way to bring them home.</p></div>
    <div class="row">${I({k:'crystal'})}<p>Clear pieces on ice to break it.</p></div>
    <div class="row">${I({k:'boulder',col:'#F08A63'})}<p>Rocks crack when you match beside them.</p></div>
    <div class="row">${I({k:'patch',q})}<p>Clear a piece on a stitched square to sew in a patch.</p></div>
    ${save.dogs.length?`<div class="row">${dogSVG(DOGS.find(d=>d.id===save.dogs[0]),34)}<p>The pups help once a level: tap one beside the board, then the spot. Match beside a pup's face on the board, or swap it, and that pup helps right there.</p></div>`:''}
    ${save.treats>0||Object.keys(save.bonus||{}).length?`<div class="row">${BONE.replace(/16/g,'34')}<p>Bonus blossoms earn <b>treats</b>. A treat lets a pup help one more time: tap a pup that has already helped.</p></div>`:''}
    <div class="row">${I({k:'score'})}<p>Finish with moves left and they turn into an <b>Overflow</b> of bonus Beams. Tap to fast-forward.</p></div>
  </div>`;
  await modal({title:'How to play',body,buttons:[{label:'Got it',style:'primary',value:1}]});
}
async function pauseMenu(){
  if(curScreen!=='game')return;
  const wasActive=G.active;G.active=false;H.clearHint();setTool(null);
  const sub=G.mode==='endless'?'Endless':G.mode==='daily'?"Today's leaf":G.mode==='bonus'?G.level.chapter.name:'Level '+G.level.num;
  const v=await modal({title:'Paused',sub,body:'',buttons:[
    {label:'Resume',style:'primary',value:'resume'},{label:'Restart',value:'restart'},
    {label:`Sound: ${save.sound?'On':'Off'}`,value:'sound'},{label:'How to play',value:'help'},
    {label:G.mode==='journey'||G.mode==='bonus'?'The tree':'Home',style:'ghost',value:'quit'}]});
  if(v==='resume'){G.active=wasActive;if(!G.busy)H.armHint();}
  else if(v==='restart'){if(G.mode==='endless')startEndless();else if(G.mode==='daily')startDaily();else if(G.mode==='bonus')startBonus(G.level.host);else startLevel(G.level.num);}
  else if(v==='sound'){save.sound=!save.sound;persist();G.active=wasActive;pauseMenu();}
  else if(v==='help'){await showHelp();G.active=wasActive;pauseMenu();}
  else{const j=G.mode==='journey'||G.mode==='bonus';leaveGame();show(j?'map':'home');}
}

/* ---------- wiring ---------- */
$('#btnPause').innerHTML=ICONS.pause;$('#mapBack').innerHTML=ICONS.back;
$('#btnPause').onclick=()=>{Snd.unlock();playSound('click');pauseMenu();};
$('#mapBack').onclick=()=>{playSound('click');show('home');};
$('#mapPlay').onclick=()=>{Snd.unlock();playSound('click');openLevel(save.level);};
$('#btnContinue').onclick=()=>{Snd.unlock();playSound('click');openLevel(save.level);};
$('#btnTree').onclick=()=>{Snd.unlock();playSound('click');show('map');};
$('#btnDaily').onclick=()=>{Snd.unlock();playSound('click');startDaily();};
$('#btnEndless').onclick=()=>{Snd.unlock();playSound('click');startEndless();};
$('#btnHelp').onclick=()=>{Snd.unlock();playSound('click');showHelp();};
$('#tglSound').onclick=()=>{Snd.unlock();save.sound=!save.sound;persist();refreshHome();playSound('click');};
$('#tglHaptic').onclick=()=>{save.haptics=!save.haptics;persist();refreshHome();buzz(20);};
window.addEventListener('resize',()=>{if(curScreen==='game')resize();if(curScreen==='map')buildTree();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)persist();});
document.addEventListener('gesturestart',e=>e.preventDefault());
document.querySelectorAll('.frame').forEach(f=>{['tl','tr','bl','br'].forEach(k=>{const s=document.createElement('span');s.className='paisley '+k;s.innerHTML=PAISLEY;f.appendChild(s);});});

$('#emblem').innerHTML=emblemSVG();buildToran();refreshHome();
