/* ---------- era piece sets ----------
   Colours stay hers (pink, orange, teal, blue, purple, green) so goals read the same everywhere;
   the silhouettes change with the place. Each piece: f = filled Path2Ds, d = detail painter. */
const PZ=(()=>{
const P=d=>new Path2D(d);
const E=(x,y,rx,ry,rot=0)=>{const p=new Path2D();p.ellipse(x,y,rx,ry,rot,0,TAU);return p;};
const C=(x,y,r)=>E(x,y,r,r);
const RR=(x,y,w,h,r)=>{const p=new Path2D();p.moveTo(x+r,y);p.arcTo(x+w,y,x+w,y+h,r);p.arcTo(x+w,y+h,x,y+h,r);p.arcTo(x,y+h,x,y,r);p.arcTo(x,y,x+w,y,r);p.closePath();return p;};
const poly=(pts,rad=.04)=>rpoly(pts,rad);
const merge=(...ps)=>{const p=new Path2D();ps.forEach(q=>p.addPath(q));return p;};
const band=(a,b,c,w,n=14)=>{const L=[],R=[];for(let k=0;k<=n;k++){const t=k/n,u=1-t;
  const x=u*u*a[0]+2*u*t*b[0]+t*t*c[0],y=u*u*a[1]+2*u*t*b[1]+t*t*c[1];
  const dx=2*u*(b[0]-a[0])+2*t*(c[0]-b[0]),dy=2*u*(b[1]-a[1])+2*t*(c[1]-b[1]),m=Math.hypot(dx,dy)||1;
  L.push([x-dy/m*w,y+dx/m*w]);R.push([x+dy/m*w,y-dx/m*w]);}
  const p=new Path2D();L.forEach(([x,y],k)=>k?p.lineTo(x,y):p.moveTo(x,y));R.reverse().forEach(([x,y])=>p.lineTo(x,y));p.closePath();return p;};
const star=(n,R,r,rot=-Math.PI/2)=>Array.from({length:n*2},(_,k)=>{const a=rot+k*Math.PI/n,q=k%2?r:R;return [Math.cos(a)*q,Math.sin(a)*q];});
const W='rgba(255,250,252,.95)';
const dots=(x,gap=.15,w=.1)=>{x.setLineDash([.001,gap]);x.lineCap='round';x.lineWidth=w;x.strokeStyle=W;};
const solid=(x,col,w)=>{x.setLineDash([]);x.lineCap='round';x.lineJoin='round';x.lineWidth=w;x.strokeStyle=col;};
const line=(x,pts)=>{x.beginPath();pts.forEach(([a,b],k)=>k?x.lineTo(a,b):x.moveTo(a,b));x.stroke();};
const dot=(x,a,b,r,col)=>{x.fillStyle=col;x.beginPath();x.arc(a,b,r,0,TAU);x.fill();};
const HEART=P('M0 0.84 C-0.28 0.6 -0.92 0.2 -0.88 -0.3 C-0.84 -0.8 -0.18 -0.86 0 -0.4 C0.18 -0.86 0.84 -0.8 0.88 -0.3 C0.92 0.2 0.28 0.6 0 0.84 Z');
const tree=(tiers)=>poly([[0,-0.92],[0.36,-0.42],[0.2,-0.42],[0.56,0.06],[0.34,0.06],[0.76,0.56],[-0.76,0.56],[-0.34,0.06],[-0.56,0.06],[-0.2,-0.42],[-0.36,-0.42]],.05);
const palm=(lean)=>{const t=[-0.04+lean*.1,-0.4];const fr=[];
  for(const sd of [-1,1]){fr.push(band(t,[t[0]+sd*.5,t[1]-.32],[t[0]+sd*.9,t[1]+.3],.1));fr.push(band(t,[t[0]+sd*.3,t[1]-.5],[t[0]+sd*.62,t[1]-.2],.09));}
  fr.push(band(t,[t[0]-.05,t[1]-.3],[t[0]+.06,t[1]-.52],.08));
  return [band([0.06,0.92],[0.22+lean*.2,0.25],t,.09),...fr];};

const SETS={ // era sets are illustrated (art.js); festival and life sets below are still path-drawn
  rain:{names:['crabs','mangoes','coconuts','crapos','sugar cane','genips']},
  snow:{names:['mittens','maple leaves','toques','skates','hot chocolates','pines']},
  sun:{names:['flamingos','suns','palms','manatees','shells','turtles']},
  lights:{names:['nutcrackers','pretzels','timber houses','steins','mulled wine mugs','oak leaves']},
  rivers:{names:['pomegranates','dates','tea glasses','water jugs','lanterns','date palms']},
  dune:{names:['falcons','camels','dhows','pearls','perfume bottles','sidra trees']},
  home:{names:['blanket flowers','longhorns','prickly pears','bluebonnets','cowboy boots','jalapeños']},
};
/* ---- festival sets ---- */
const ring=(y)=>merge(E(0,y,.84,.25),E(0,y,.6,.12));
const holly=(cx,cy,rot)=>{const pts=[];for(let k=0;k<14;k++){const t=k/14*TAU,r=k%2?.78:1,x=Math.cos(t)*.52*r,y=Math.sin(t)*.27*r;pts.push([cx+x*Math.cos(rot)-y*Math.sin(rot),cy+x*Math.sin(rot)+y*Math.cos(rot)]);}return poly(pts,.03);};
SETS.diwali={names:['lotuses','diyas','rangoli','sparklers','bangles','mango leaves'],p:[
  {f:[PATHS[0]],g:[-.2,-.3]},
  {f:[P('M-0.86 -0.02 L0.52 -0.02 L0.94 -0.22 C0.82 0.2 0.6 0.6 -0.1 0.6 C-0.6 0.6 -0.86 0.3 -0.86 -0.02 Z'),E(-0.12,0.66,.36,.1)],g:[-.4,.15]},
  {f:Array.from({length:8},(_,k)=>{const a=k*TAU/8;return E(Math.cos(a)*.46,Math.sin(a)*.46,.42,.2,a);}),g:[0,0]},
  {f:[poly(star(10,.96,.3),.02)],g:[-.08,-.12]},
  {f:[ring(-0.44),ring(0),ring(0.44)],rule:'evenodd',g:[-.45,-.5]},
  {f:[P('M0 -0.95 C0.46 -0.5 0.42 0.4 0 0.95 C-0.42 0.4 -0.46 -0.5 0 -0.95 Z')],g:[-.12,-.3]},
],d:[
  (x)=>{dot(x,0,.3,.1,'#FFE08A');dots(x,.15,.1);line(x,[[0,-.55],[0,.1]]);},
  (x)=>{x.fillStyle='#FFE08A';x.beginPath();x.moveTo(.62,-.84);x.bezierCurveTo(.86,-.5,.78,-.2,.6,-.18);x.bezierCurveTo(.42,-.2,.36,-.5,.62,-.84);x.fill();
    x.fillStyle='#E8553B';x.beginPath();x.ellipse(.6,-.34,.07,.12,0,0,TAU);x.fill();dots(x,.14,.09);line(x,[[-.7,.18],[.5,.18]]);},
  (x)=>{dot(x,0,0,.24,'#FFE08A');dots(x,.12,.08);x.beginPath();x.arc(0,0,.36,0,TAU);x.stroke();for(let k=0;k<8;k++){const a=k*TAU/8;dot(x,Math.cos(a)*.62,Math.sin(a)*.62,.06,W);}},
  (x)=>{dot(x,0,0,.22,'#FFF3B8');dot(x,0,0,.1,'#fff');},
  (x)=>{for(const y of [-.44,0,.44])for(let k=-2;k<=2;k++)dot(x,k*.3,y-.18,.035,'#FFE08A');},
  (x)=>{solid(x,'rgba(255,250,252,.85)',.05);line(x,[[0,-.8],[0,.85]]);for(const y of [-.4,-.05,.3])for(const s of [-1,1])line(x,[[0,y],[s*.28,y-.14]]);},
]};
SETS.carnival={names:['plumes','steel pans','masks','drums','shak-shaks','flags'],p:[
  {f:[P('M0.12 -0.95 C0.72 -0.6 0.62 0.3 0.06 0.74 L-0.02 0.95 L-0.12 0.74 C-0.58 0.25 -0.46 -0.6 0.12 -0.95 Z')],g:[-.1,-.4]},
  {f:[C(0,0,.86)],g:[-.4,-.42]},
  {f:[merge(P('M-0.92 -0.3 C-0.6 -0.52 -0.2 -0.36 0 -0.2 C0.2 -0.36 0.6 -0.52 0.92 -0.3 C0.92 0.16 0.62 0.42 0.3 0.36 C0.15 0.33 0.08 0.12 0 0.12 C-0.08 0.12 -0.15 0.33 -0.3 0.36 C-0.62 0.42 -0.92 0.16 -0.92 -0.3 Z'),E(-0.42,-0.06,.2,.12),E(0.42,-0.06,.2,.12))],rule:'evenodd',g:[-.6,-.3]},
  {f:[RR(-0.62,-0.5,1.24,1.2,.14),E(0,-0.5,.62,.2)],g:[-.35,-.1]},
  {f:[E(-0.34,-0.36,.34,.42,-.45),band([-0.18,-0.02],[0.02,0.42],[0.24,0.88],.07),E(0.36,-0.3,.32,.4,.45),band([0.2,0.04],[0.0,0.46],[-0.2,0.9],.07)],g:[-.45,-.5]},
  {f:[RR(-0.76,-0.94,.14,1.88,.06),poly([[-0.64,-0.84],[0.92,-0.24],[-0.64,0.36]],.05)],g:[-.35,-.45],gi:1},
],d:[
  (x)=>{solid(x,'rgba(255,250,252,.85)',.045);line(x,[[.08,-.8],[-.04,.85]]);for(let k=0;k<6;k++){const y=-.6+k*.24;line(x,[[.04-y*.04,y],[.42-k*.03,y-.2]]);line(x,[[.02-y*.04,y],[-.36+k*.02,y-.2]]);}},
  (x,dk)=>{x.strokeStyle=dk;x.setLineDash([]);x.lineWidth=.07;x.beginPath();x.arc(0,0,.74,0,TAU);x.stroke();x.lineWidth=.045;for(const [a,b,rx,ry,rt] of [[0,0,.2,.14,0],[0,-.44,.2,.12,0],[0,.44,.2,.12,0],[-.42,-.2,.17,.11,-1],[.42,-.2,.17,.11,1],[-.42,.24,.17,.11,1],[.42,.24,.17,.11,-1]]){x.beginPath();x.ellipse(a,b,rx,ry,rt,0,TAU);x.stroke();}dot(x,0,0,.05,'#FFF3B8');},
  (x)=>{dots(x,.12,.08);x.beginPath();x.moveTo(-.8,-.26);x.bezierCurveTo(-.4,-.44,-.1,-.3,0,-.16);x.bezierCurveTo(.1,-.3,.4,-.44,.8,-.26);x.stroke();
    x.fillStyle='#F2B705';for(const s of [-1,1]){x.beginPath();x.moveTo(s*.7,-.36);x.lineTo(s*.95,-.8);x.lineTo(s*.84,-.32);x.fill();}dot(x,0,-.06,.07,'#E0508E');},
  (x,dk)=>{solid(x,W,.06);line(x,[[-.56,-.3],[-.28,.6],[0,-.3],[.28,.6],[.56,-.3]]);x.fillStyle=dk;x.fillRect(-.62,.56,1.24,.1);},
  (x)=>{solid(x,'#F2B705',.06);x.beginPath();x.ellipse(-.34,-.36,.22,.3,-.45,0,TAU);x.stroke();solid(x,'#1E8A4C',.06);x.beginPath();x.ellipse(.36,-.3,.2,.28,.45,0,TAU);x.stroke();for(const [a,b] of [[-.42,-.5],[-.26,-.24],[.3,-.44],[.44,-.18]])dot(x,a,b,.05,W);},
  (x)=>{x.fillStyle='#F2B705';x.beginPath();x.moveTo(-.6,-.62);x.lineTo(.7,-.24);x.lineTo(-.6,.14);x.closePath();x.fill();x.fillStyle='#E8553B';x.beginPath();x.moveTo(-.6,-.42);x.lineTo(.1,-.24);x.lineTo(-.6,-.06);x.closePath();x.fill();},
]};
SETS.halloween={names:['candies','pumpkins','cauldrons','ghosts','bats','witch hats'],p:[
  {f:[E(0,0,.5,.38),poly([[-0.45,0],[-0.92,-0.38],[-0.86,0.4]],.05),poly([[0.45,0],[0.92,-0.38],[0.86,0.4]],.05)],g:[-.15,-.15]},
  {f:[E(-0.38,0.12,.42,.6),E(0.38,0.12,.42,.6),E(0,0.12,.46,.66)],outline:true,g:[-.18,-.2],gi:2},
  {f:[P('M-0.76 -0.28 L0.76 -0.28 C0.82 0.42 0.5 0.76 0 0.76 C-0.5 0.76 -0.82 0.42 -0.76 -0.28 Z'),RR(-0.88,-0.44,1.76,.22,.1)],g:[-.4,.05]},
  {f:[P('M-0.66 0.86 L-0.66 -0.2 C-0.66 -0.96 0.66 -0.96 0.66 -0.2 L0.66 0.86 L0.44 0.66 L0.22 0.86 L0 0.66 L-0.22 0.86 L-0.44 0.66 Z')],g:[-.3,-.45]},
  {f:[P('M0 -0.12 C0.2 -0.44 0.5 -0.5 0.96 -0.34 C0.8 -0.2 0.8 0.06 0.86 0.22 C0.66 0.12 0.5 0.16 0.42 0.34 C0.3 0.2 0.15 0.22 0 0.42 C-0.15 0.22 -0.3 0.2 -0.42 0.34 C-0.5 0.16 -0.66 0.12 -0.86 0.22 C-0.8 0.06 -0.8 -0.2 -0.96 -0.34 C-0.5 -0.5 -0.2 -0.44 0 -0.12 Z'),C(0,-0.2,.22),poly([[-0.18,-0.32],[-0.14,-0.56],[-0.04,-0.36]],.02),poly([[0.18,-0.32],[0.14,-0.56],[0.04,-0.36]],.02)],g:[-.4,-.25]},
  {f:[P('M-0.08 -0.94 C0.06 -0.6 0.3 -0.2 0.42 0.3 L-0.42 0.3 C-0.3 -0.1 -0.26 -0.6 -0.08 -0.94 Z'),E(0,0.4,.9,.2)],g:[-.12,-.2]},
],d:[
  (x)=>{solid(x,'rgba(255,250,252,.9)',.08);line(x,[[-.3,-.3],[-.1,.32]]);line(x,[[0,-.36],[.2,.32]]);},
  (x)=>{x.fillStyle='#5E7A2E';x.fillRect(-.07,-.74,.14,.26);x.fillStyle='#3A2418';
    for(const s of [-1,1]){x.beginPath();x.moveTo(s*.32,-.08);x.lineTo(s*.14,.12);x.lineTo(s*.42,.14);x.closePath();x.fill();}
    x.beginPath();x.moveTo(-.38,.32);x.quadraticCurveTo(0,.62,.38,.32);x.quadraticCurveTo(0,.46,-.38,.32);x.fill();},
  (x)=>{dot(x,-.26,-.44,.12,'#B7F0D0');dot(x,.08,-.52,.09,'#B7F0D0');dot(x,.3,-.4,.11,'#B7F0D0');x.fillStyle='#3A2418';x.fillRect(-.52,.7,.12,.18);x.fillRect(.4,.7,.12,.18);dots(x,.14,.09);line(x,[[-.6,.1],[.6,.1]]);},
  (x)=>{dot(x,-.22,-.3,.09,'#1E2340');dot(x,.22,-.3,.09,'#1E2340');x.fillStyle='#1E2340';x.beginPath();x.ellipse(0,0,.1,.13,0,0,TAU);x.fill();},
  (x)=>{dot(x,-.08,-.22,.05,'#FFE08A');dot(x,.08,-.22,.05,'#FFE08A');},
  (x,dk)=>{x.fillStyle='#9562D2';x.fillRect(-.36,.08,.72,.14);x.fillStyle='#F2B705';x.fillRect(-.08,.07,.16,.16);dot(x,.3,-.6,.06,W);},
]};
SETS.thanks={names:['cranberries','pie slices','squash','tea pitchers','corn','oak leaves'],p:[
  {f:[C(-0.32,0.18,.33),C(0.32,0.2,.33),C(0,-0.28,.33),C(0.02,0.56,.3)],outline:true,g:[-.1,-.38],gi:2},
  {f:[poly([[-0.86,0.46],[0.86,0.46],[0.06,-0.78]],.08),RR(-0.9,0.36,1.8,.3,.12)],g:[-.15,0]},
  {f:[P('M-0.12 -0.78 C0.16 -0.78 0.22 -0.48 0.22 -0.2 C0.62 0 0.66 0.76 0 0.86 C-0.66 0.76 -0.62 0 -0.22 -0.2 C-0.22 -0.48 -0.38 -0.78 -0.12 -0.78 Z')],g:[-.22,.25]},
  {f:[P('M-0.5 -0.66 L0.46 -0.66 L0.52 0.76 L-0.56 0.76 Z'),poly([[0.4,-0.66],[0.74,-0.86],[0.5,-0.42]],.03),band([-0.5,-0.4],[-0.95,-0.1],[-0.54,0.42],.08)],g:[-.15,-.2]},
  {f:[E(0,0.06,.36,.72)],g:[-.12,-.3]},
  {f:[P('M0 -0.92 C0.18 -0.9 0.2 -0.72 0.12 -0.62 C0.4 -0.7 0.5 -0.48 0.3 -0.32 C0.6 -0.38 0.66 -0.1 0.38 0.02 C0.66 0.04 0.6 0.36 0.3 0.34 C0.4 0.55 0.2 0.68 0.06 0.6 L0.05 0.92 L-0.05 0.92 L-0.06 0.6 C-0.2 0.68 -0.4 0.55 -0.3 0.34 C-0.6 0.36 -0.66 0.04 -0.38 0.02 C-0.66 -0.1 -0.6 -0.38 -0.3 -0.32 C-0.5 -0.48 -0.4 -0.7 -0.12 -0.62 C-0.2 -0.72 -0.18 -0.9 0 -0.92 Z')],g:[-.15,-.3]},
],d:[
  (x)=>{x.fillStyle='#5E9E3E';x.beginPath();x.ellipse(.3,-.6,.24,.1,-.5,0,TAU);x.fill();for(const [a,b] of [[-.32,.18],[.32,.2],[0,-.28],[.02,.56]])dot(x,a-.1,b-.1,.05,'rgba(255,255,255,.7)');},
  (x,dk)=>{x.fillStyle='#C98A4A';x.fillRect(-.88,.38,1.76,.24);dots(x,.12,.08);line(x,[[-.8,.5],[.8,.5]]);dot(x,.05,-.1,.16,'#FFF8EE');dot(x,.15,-.2,.1,'#FFF8EE');},
  (x)=>{x.fillStyle='#6B4A2E';x.fillRect(-.16,-.94,.1,.2);solid(x,'rgba(255,255,255,.4)',.04);line(x,[[-.3,.2],[-.32,.7]]);line(x,[[.3,.2],[.32,.7]]);},
  (x)=>{x.fillStyle='rgba(150,80,20,.5)';x.beginPath();x.moveTo(-.48,-.1);x.lineTo(.47,-.1);x.lineTo(.51,.74);x.lineTo(-.54,.74);x.closePath();x.fill();dot(x,.18,-.32,.16,'#FFE08A');dot(x,.18,-.32,.08,'#F7F0C0');solid(x,W,.06);line(x,[[-.44,-.58],[.4,-.58]]);},
  (x)=>{for(let r=0;r<6;r++)for(let c=-1;c<=1;c++)dot(x,c*.2,-.5+r*.2,.07,['#F2B705','#E8553B','#FFF3B8','#5F84E2'][(r+c+3)%4]);
    x.fillStyle='#D9C08A';x.beginPath();x.moveTo(0,.7);x.quadraticCurveTo(-.6,.5,-.6,-.2);x.quadraticCurveTo(-.3,.3,0,.5);x.fill();x.beginPath();x.moveTo(0,.7);x.quadraticCurveTo(.6,.5,.58,-.2);x.quadraticCurveTo(.3,.3,0,.5);x.fill();},
  (x)=>{solid(x,'rgba(255,250,252,.85)',.05);line(x,[[0,.6],[0,-.7]]);for(const y of [-.4,-.1,.2])for(const s of [-1,1])line(x,[[0,y+.1],[s*.24,y-.04]]);},
]};
SETS.xmas={names:['candy canes','gingerbread hearts','firs','baubles','presents','holly'],p:[
  {f:[band([0.24,0.92],[0.24,0.2],[0.24,-0.34],.14),band([0.24,-0.34],[0.22,-0.98],[-0.44,-0.6],.14)],g:[.3,.3]},
  {f:[HEART],g:[-.4,-.3]},
  {f:[tree(),RR(-0.12,0.52,.24,.38,.04)],g:[-.15,-.3]},
  {f:[C(0,0.12,.74),RR(-0.17,-0.8,.34,.22,.05)],g:[-.3,-.2]},
  {f:[RR(-0.72,-0.36,1.44,1.18,.08),RR(-0.84,-0.56,1.68,.3,.06),E(-0.24,-0.72,.26,.15,-.4),E(0.24,-0.72,.26,.15,.4)],g:[-.4,.1]},
  {f:[holly(-0.32,0.12,-0.6),holly(0.32,0.12,0.6)],outline:true,g:[-.4,0]},
],d:[
  (x)=>{solid(x,W,.09);for(const y of [.7,.4,.1,-.2])line(x,[[.12,y+.08],[.36,y-.08]]);line(x,[[.0,-.7],[.18,-.5]]);line(x,[[-.3,-.72],[-.2,-.5]]);},
  (x)=>{x.save();x.scale(.78,.78);x.translate(0,.04);dots(x,.13,.1);x.stroke(HEART);x.restore();dot(x,-.16,0,.07,W);dot(x,.16,0,.07,W);dot(x,0,.2,.07,W);},
  (x)=>{dot(x,0,-.94,.12,'#F2B705');for(const [a,b,c] of [[-.3,0,'#E0508E'],[.24,-.3,'#F2B705'],[.4,.36,'#5F84E2'],[-.44,.42,'#F2B705']])dot(x,a,b,.07,c);x.fillStyle='#7A5A3A';x.fillRect(-.12,.56,.24,.34);},
  (x)=>{dots(x,.14,.1);line(x,[[-.7,.14],[.7,.14]]);dot(x,0,-.2,.07,W);dot(x,-.36,.42,.06,W);dot(x,.36,.42,.06,W);},
  (x)=>{x.fillStyle=W;x.fillRect(-.09,-.56,.18,1.38);x.fillRect(-.72,.14,1.44,.16);dot(x,0,-.6,.1,W);},
  (x)=>{dot(x,0,-.12,.13,'#D7263D');dot(x,-.16,-.26,.12,'#D7263D');dot(x,.16,-.26,.12,'#D7263D');dot(x,-.04,-.16,.04,'#fff');},
]};
SETS.easter={names:['eggs','hot cross buns','kites','twine spools','lilies','palm crosses'],p:[
  {f:[P('M0 -0.9 C0.5 -0.9 0.72 -0.1 0.68 0.3 C0.64 0.72 0.36 0.9 0 0.9 C-0.36 0.9 -0.64 0.72 -0.68 0.3 C-0.72 -0.1 -0.5 -0.9 0 -0.9 Z')],g:[-.25,-.4]},
  {f:[P('M-0.88 0.36 C-0.88 -0.56 0.88 -0.56 0.88 0.36 C0.88 0.62 -0.88 0.62 -0.88 0.36 Z')],g:[-.35,-.2]},
  {f:[poly([[0,-0.92],[0.64,-0.18],[0,0.62],[-0.64,-0.18]],.05)],g:[-.2,-.4]},
  {f:[RR(-0.5,-0.66,1,1.32,.06),RR(-0.72,-0.86,1.44,.24,.08),RR(-0.72,0.62,1.44,.24,.08)],g:[-.3,-.1]},
  {f:[P('M-0.1 0.92 L0.1 0.92 L0.12 0.22 C0.5 0.12 0.9 -0.28 0.86 -0.82 C0.52 -0.5 0.3 -0.56 0 -0.88 C-0.3 -0.56 -0.52 -0.5 -0.86 -0.82 C-0.9 -0.28 -0.5 0.12 -0.12 0.22 Z')],g:[-.2,-.2]},
  {f:[RR(-0.15,-0.92,.3,1.84,.08),RR(-0.62,-0.48,1.24,.28,.08)],g:[-.04,.2]},
],d:[
  (x)=>{solid(x,W,.08);line(x,[[-.66,.05],[-.44,-.12],[-.22,.05],[0,-.12],[.22,.05],[.44,-.12],[.66,.05]]);for(const [a,b] of [[-.3,-.5],[.25,-.45],[0,.45],[-.35,.4],[.35,.4]])dot(x,a,b,.07,W);},
  (x)=>{solid(x,'rgba(255,248,236,.95)',.12);line(x,[[-.62,-.08],[.62,-.08]]);line(x,[[0,-.48],[0,.32]]);dot(x,-.5,.3,.04,'#6B4A2E');dot(x,.4,.25,.04,'#6B4A2E');dot(x,.5,-.25,.04,'#6B4A2E');},
  (x)=>{x.fillStyle='rgba(255,255,255,.2)';x.beginPath();x.moveTo(0,-.92);x.lineTo(.64,-.18);x.lineTo(0,.62);x.closePath();x.fill();
    dots(x,.14,.08);line(x,[[0,-.82],[0,.54]]);line(x,[[-.56,-.18],[.56,-.18]]);
    solid(x,'#E0508E',.05);x.beginPath();x.moveTo(0,.62);x.quadraticCurveTo(.2,.74,.02,.84);x.quadraticCurveTo(-.14,.92,.08,.98);x.stroke();dot(x,.12,.73,.05,'#F2B705');dot(x,-.06,.88,.05,'#E0508E');},
  (x)=>{solid(x,'rgba(255,250,252,.8)',.05);for(let k=0;k<6;k++){const y=-.5+k*.2;line(x,[[-.44,y],[.44,y+.08]]);}solid(x,'rgba(255,250,252,.9)',.04);x.beginPath();x.moveTo(.44,.3);x.quadraticCurveTo(.9,.2,.82,-.4);x.stroke();},
  (x,dk)=>{x.fillStyle='rgba(255,255,255,.35)';x.beginPath();x.moveTo(0,-.6);x.quadraticCurveTo(.2,-.1,.06,.22);x.lineTo(-.06,.22);x.quadraticCurveTo(-.2,-.1,0,-.6);x.fill();
    solid(x,'#F2B705',.05);line(x,[[0,.1],[0,-.42]]);line(x,[[0,.1],[-.16,-.36]]);line(x,[[0,.1],[.16,-.36]]);dot(x,0,-.44,.05,'#F2B705');dot(x,-.17,-.38,.05,'#F2B705');dot(x,.17,-.38,.05,'#F2B705');},
  (x,dk)=>{solid(x,dk,.04);for(const y of [-.7,-.5,-.12,.2,.5,.74])line(x,[[-.13,y],[.13,y+.06]]);line(x,[[-.4,-.46],[-.36,-.22]]);line(x,[[.36,-.46],[.4,-.22]]);},
]};
SETS.gotcha={names:['bones','biscuits','frisbees','bowls','paw prints','tennis balls'],p:[
  {f:[RR(-0.56,-0.15,1.12,.3,.1),C(-0.62,-0.2,.21),C(-0.62,0.2,.21),C(0.62,-0.2,.21),C(0.62,0.2,.21)],g:[-.62,-.26],gi:1},
  {f:[RR(-0.76,-0.52,1.52,1.04,.26)],g:[-.35,-.25]},
  {f:[E(0,0,.88,.52)],g:[-.35,-.22]},
  {f:[P('M-0.86 -0.1 L0.86 -0.1 C0.8 0.55 0.5 0.72 0 0.72 C-0.5 0.72 -0.8 0.55 -0.86 -0.1 Z'),E(0,-0.1,.86,.22)],g:[-.4,.15]},
  {f:[E(0,0.32,.42,.36),C(-0.52,-0.12,.17),C(-0.2,-0.46,.18),C(0.2,-0.46,.18),C(0.52,-0.12,.17)],g:[-.1,.2]},
  {f:[C(0,0,.8)],g:[-.3,-.35]},
],d:[
  (x)=>{dots(x,.13,.08);line(x,[[-.4,0],[.4,0]]);},
  (x)=>{for(const [a,b] of [[-.4,-.2],[0,-.25],[.4,-.2],[-.2,.2],[.2,.2]])dot(x,a,b,.06,'rgba(120,60,20,.55)');},
  (x,dk)=>{solid(x,dk,.06);x.beginPath();x.ellipse(0,0,.6,.34,0,0,TAU);x.stroke();dots(x,.12,.08);x.beginPath();x.ellipse(0,0,.3,.17,0,0,TAU);x.stroke();},
  (x)=>{x.fillStyle='rgba(120,70,30,.85)';x.beginPath();x.ellipse(0,-.1,.66,.14,0,0,TAU);x.fill();for(const [a,b] of [[-.3,-.14],[0,-.08],[.28,-.13],[.12,-.16]])dot(x,a,b,.06,'#C98A4A');
    for(const [a,b,r] of [[0,.42,.1],[-.14,.28,.05],[0,.24,.05],[.14,.28,.05]])dot(x,a,b,r,W);},
  (x)=>{dot(x,0,.36,.14,'rgba(255,255,255,.3)');},
  (x)=>{solid(x,W,.08);x.beginPath();x.moveTo(-.55,-.55);x.quadraticCurveTo(0,0,-.55,.55);x.stroke();x.beginPath();x.moveTo(.55,-.55);x.quadraticCurveTo(0,0,.55,.55);x.stroke();},
]};
SETS.moving={names:['photo frames','boxes','plants','suitcases','lamps','keys'],p:[
  {f:[RR(-0.7,-0.84,1.4,1.68,.08)],g:[-.4,-.5]},
  {f:[RR(-0.78,-0.46,1.56,1.26,.06),poly([[-0.78,-0.46],[-0.92,-0.82],[-0.1,-0.6],[0,-0.46]],.03),poly([[0.78,-0.46],[0.92,-0.82],[0.1,-0.6],[0,-0.46]],.03)],g:[-.4,0]},
  {f:[poly([[-0.42,0.18],[0.42,0.18],[0.32,0.9],[-0.32,0.9]],.05),E(-0.32,-0.24,.2,.42,-.5),E(0.32,-0.24,.2,.42,.5),E(0,-0.46,.2,.46,0)],g:[-.15,.4]},
  {f:[RR(-0.82,-0.42,1.64,1.18,.16),RR(-0.28,-0.7,.56,.32,.1)],g:[-.4,-.15]},
  {f:[poly([[-0.56,-0.08],[0.56,-0.08],[0.32,-0.84],[-0.32,-0.84]],.05),RR(-0.07,-0.1,.14,.82,.04),E(0,0.78,.42,.13)],g:[-.15,-.55]},
  {f:[merge(C(-0.42,-0.3,.4),C(-0.42,-0.3,.17)),RR(-0.08,-0.39,1.0,.18,.06),poly([[0.56,-0.24],[0.72,-0.24],[0.72,0.06],[0.56,0.06]],.02),poly([[0.76,-0.24],[0.9,-0.24],[0.9,0.0],[0.76,0.0]],.02)],rule:'evenodd',g:[-.55,-.45]},
],d:[
  (x)=>{x.fillStyle='#FFF8F2';x.fillRect(-.5,-.62,1,1.24);x.fillStyle='#8CC9C0';x.beginPath();x.moveTo(-.5,.62);x.lineTo(-.1,.05);x.lineTo(.15,.35);x.lineTo(.3,.2);x.lineTo(.5,.45);x.lineTo(.5,.62);x.closePath();x.fill();dot(x,.22,-.25,.12,'#F2B705');},
  (x,dk)=>{x.fillStyle='rgba(255,236,190,.75)';x.fillRect(-.14,-.46,.28,1.26);solid(x,dk,.05);line(x,[[-.5,.32],[-.5,.6]]);line(x,[[-.6,.42],[-.5,.32],[-.4,.42]]);},
  (x,dk)=>{solid(x,'rgba(255,255,255,.5)',.04);line(x,[[0,.1],[0,-.8]]);line(x,[[-.05,.1],[-.42,-.5]]);line(x,[[.05,.1],[.42,-.5]]);x.fillStyle=dk;x.fillRect(-.42,.18,.84,.12);},
  (x,dk)=>{solid(x,dk,.06);line(x,[[-.45,-.42],[-.45,.76]]);line(x,[[.45,-.42],[.45,.76]]);dot(x,-.15,.15,.12,'#F2B705');dot(x,.18,.42,.1,'#E0508E');},
  (x)=>{dot(x,0,-.1,.14,'rgba(255,224,138,.9)');dots(x,.13,.08);line(x,[[-.42,-.3],[.42,-.3]]);},
  (x)=>{dot(x,-.42,-.3,.06,'rgba(255,255,255,.5)');},
]};
SETS.quilt={names:['pincushions','thimbles','scissors','spools','quilt blocks','buttons'],p:[
  {f:[E(-0.3,0.12,.42,.58),E(0.3,0.12,.42,.58),E(0,0.12,.48,.64)],outline:true,g:[-.2,-.15],gi:2},
  {f:[P('M-0.5 0.78 L-0.42 -0.42 C-0.4 -0.86 0.4 -0.86 0.42 -0.42 L0.5 0.78 Z')],g:[-.2,-.4]},
  {f:[merge(C(-0.32,0.52,.26),C(-0.32,0.52,.12)),merge(C(0.32,0.52,.26),C(0.32,0.52,.12)),poly([[-0.22,0.32],[-0.06,0.3],[0.42,-0.92],[0.3,-0.94]],.03),poly([[0.22,0.32],[0.06,0.3],[-0.42,-0.92],[-0.3,-0.94]],.03)],rule:'evenodd',g:[-.32,.4]},
  {f:[RR(-0.5,-0.66,1,1.32,.06),RR(-0.72,-0.86,1.44,.24,.08),RR(-0.72,0.62,1.44,.24,.08)],g:[-.3,-.1]},
  {f:[RR(-0.8,-0.8,1.6,1.6,.08)],g:[-.4,-.4]},
  {f:[merge(C(0,0,.82),C(-0.2,-0.2,.09),C(0.2,-0.2,.09),C(-0.2,0.2,.09),C(0.2,0.2,.09))],rule:'evenodd',g:[-.4,-.4]},
],d:[
  (x)=>{x.fillStyle='#5E9E3E';x.beginPath();x.ellipse(0,-.52,.26,.1,0,0,TAU);x.fill();for(const [a,b,c] of [[-.3,-.2,'#F2B705'],[.25,-.05,'#5F84E2'],[0,.3,'#fff']]){solid(x,'#B9B2AA',.03);line(x,[[a,b],[a+.25,b-.35]]);dot(x,a+.25,b-.35,.07,c);}},
  (x)=>{for(let r=0;r<4;r++)for(let c=-2;c<=2;c++)dot(x,c*.16,-.5+r*.22,.04,'rgba(80,40,10,.45)');solid(x,'rgba(255,255,255,.6)',.06);line(x,[[-.48,.62],[.48,.62]]);},
  (x)=>{dot(x,0,.25,.06,'#B9B2AA');},
  (x)=>{solid(x,'rgba(255,250,252,.8)',.05);for(let k=0;k<6;k++){const y=-.5+k*.2;line(x,[[-.44,y],[.44,y+.08]]);}},
  (x)=>{x.fillStyle='rgba(255,255,255,.55)';x.beginPath();x.moveTo(-.8,-.8);x.lineTo(0,-.8);x.lineTo(-.8,0);x.closePath();x.fill();x.beginPath();x.moveTo(.8,.8);x.lineTo(0,.8);x.lineTo(.8,0);x.closePath();x.fill();
    x.fillStyle='#F4A6C0';x.beginPath();x.moveTo(0,-.8);x.lineTo(.8,-.8);x.lineTo(.8,0);x.closePath();x.fill();x.beginPath();x.moveTo(-.8,.8);x.lineTo(-.8,0);x.lineTo(0,.8);x.closePath();x.fill();
    x.setLineDash([.08,.06]);x.lineWidth=.05;x.strokeStyle=W;x.strokeRect(-.66,-.66,1.32,1.32);x.setLineDash([]);},
  (x,dk)=>{solid(x,dk,.06);x.beginPath();x.arc(0,0,.62,0,TAU);x.stroke();solid(x,'rgba(255,250,252,.85)',.05);line(x,[[-.2,-.2],[.2,.2]]);line(x,[[.2,-.2],[-.2,.2]]);},
]};
return SETS;})();
const PIECE_SETS=Object.assign({henna:{names:SHAPE_NAMES,henna:true}},PZ);
for(const k in PIECE_SETS)PIECE_SETS[k].key=k;
/* illustrated pieces: SVG art rasterised once per slot, then blitted */
/*__ART__*/
const ART_IMG={};
(function artLoadAll(){let pending=0;const done=()=>{if(--pending)return;for(const k in iconCache)delete iconCache[k];if(curScreen==='map')buildTree();};
  for(const k in ART)ART_IMG[k]=ART[k].map((body,c)=>{const cv=document.createElement('canvas');cv.width=cv.height=256;cv.ready=false;pending++;
    const im=new Image();im.onload=()=>{cv.getContext('2d').drawImage(im,0,0,256,256);cv.ready=true;done();};im.onerror=done;im.src=artURI(body,SHAPE_COLORS[c]);return cv;});})();
let SET=PIECE_SETS.henna;
function setFor(L){const c=L&&L.chapter;return (c&&PIECE_SETS[c.set||c.id])||PIECE_SETS.henna;}
function setKey(set){for(const k in PIECE_SETS)if(PIECE_SETS[k]===set)return k;return 'henna';}
function pieceName(c,L){return (L?setFor(L):SET).names[c];}
function drawEraShape(ctx,c,r,set){
  const art=ART_IMG[set.key];
  if(art){const im=art[c];if(im.ready)ctx.drawImage(im,-r*1.1,-r*1.1,r*2.2,r*2.2);
    else{ctx.fillStyle=SHAPE_COLORS[c];ctx.beginPath();ctx.arc(0,0,r*.7,0,TAU);ctx.fill();}return;}
  const def=set.p[c],dk=SHADES[c];ctx.save();ctx.scale(r,r);
  const fill=(col)=>{ctx.fillStyle=col;for(const p of def.f)def.rule?ctx.fill(p,def.rule):ctx.fill(p);};
  ctx.save();ctx.translate(0,.09);fill(dk);ctx.restore();
  fill(SHAPE_COLORS[c]);
  if(def.outline){ctx.lineWidth=.05;ctx.strokeStyle=dk;for(const p of def.f)ctx.stroke(p);}
  const g=def.g||[-.3,-.35];ctx.save();ctx.clip(def.f[def.gi||0],def.rule||'nonzero');ctx.fillStyle='rgba(255,255,255,.3)';ctx.beginPath();ctx.ellipse(g[0],g[1],.2,.11,-.6,0,TAU);ctx.fill();ctx.restore();
  set.d[c](ctx,dk);ctx.setLineDash([]);
  ctx.restore();
}
