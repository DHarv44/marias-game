'use strict';
/* ====================== ENGINE (no DOM) ======================
   Deterministic: every gameplay draw comes from G.rng, seeded per level.
   Visual effects and hints may use Math.random; nothing that changes the board does. */
const DIRS={down:[0,1],up:[0,-1],left:[-1,0],right:[1,0]};
const SHAPE_COLORS=['#E0508E','#EE9F2E','#3FA88B','#5F84E2','#9562D2','#7FAE3E'];
const SHAPE_NAMES=['lotuses','marigolds','paisleys','moons','stars','leaves'];
const ENGINE_VERSION=2;
let PID=0;

function hashStr(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function makeRng(seed){
  let a=0x9E3779B9,b=0x243F6A88,c=0xB7E15162,d=seed>>>0;
  const r=()=>{a>>>=0;b>>>=0;c>>>=0;d>>>=0;let t=(a+b)|0;a=b^(b>>>9);b=(c+(c<<3))|0;c=(c<<21)|(c>>>11);d=(d+1)|0;t=(t+d)|0;c=(c+t)|0;return (t>>>0)/4294967296;};
  for(let i=0;i<15;i++)r();
  return r;
}
function shuffleArr(a,r){for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

class Piece{
  constructor(color,kind='normal'){
    this.id=++PID;this.color=color;this.kind=kind;this.hp=1;this.maxHp=1;this.part=0;this.mud=false;
    this.x=0;this.y=0;this.tx=0;this.ty=0;this.speed=0;this.accel=0;
    this.falling=false;this.land=0;this.pop=0;this.hit=0;this.activated=false;
  }
}
const isSpecial=p=>!!p&&(p.kind==='lineH'||p.kind==='lineV'||p.kind==='nova'||p.kind==='prism');
const movable=p=>!!p&&p.kind!=='boulder'&&p.kind!=='boss';

// UI hooks (no-ops by default so the engine runs headless)
const H={};
['sound','destroyed','beam','ring','rays','text','combo','banner','hud','shake','buzz','crack','crystal','special','gravity',
 'goalBump','shuffleFx','clearHint','armHint','win','lose','fishHome','bossFed','bossMove','bossThrash','bossLeap','patch','cheer','zoomies','leap','shadow','pupGo','tidy','sweep','snuggle'].forEach(k=>H[k]=()=>{});

const G={session:0,active:false,mode:'journey',level:null,cols:8,rows:8,
  valid:new Uint8Array(64),crystal:new Uint8Array(64),patch:new Uint8Array(64),cells:new Array(64).fill(null),
  gravity:'down',pendingGravity:null,moves:0,score:0,flux:0,goals:[],busy:false,combo:0,sel:-1,hint:null,
  instant:false,speed:1,continued:false,ended:false,colors:5,rng:Math.random,seed:0,
  boss:null,tools:{},fishSpawnLeft:0,pupSpawnLeft:0,pupQueue:[],shadowUsed:false};

const idx=(x,y)=>y*G.cols+x;
const xy=i=>[i%G.cols,(i/G.cols)|0];
const inb=(x,y)=>x>=0&&y>=0&&x<G.cols&&y<G.rows;
const randColor=()=>Math.floor(G.rng()*G.colors);
function neigh(i){const [x,y]=xy(i);const o=[];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(inb(nx,ny)&&G.valid[idx(nx,ny)])o.push(idx(nx,ny));}return o;}
function adjacent(a,b){const [ax,ay]=xy(a),[bx,by]=xy(b);return Math.abs(ax-bx)+Math.abs(ay-by)===1;}
function colorAt(x,y){if(!inb(x,y))return -1;const i=idx(x,y);if(!G.valid[i])return -1;const p=G.cells[i];
  if(!p||p.kind==='boulder'||p.kind==='prism'||p.kind==='fish'||p.kind==='boss')return -1;return p.color;}
function centroid(cells){if(!cells.length)return [G.cols/2,G.rows/2];let sx=0,sy=0;for(const c of cells){const [x,y]=xy(c);sx+=x;sy+=y;}return [sx/cells.length,sy/cells.length];}

/* ---------- timing ---------- */
const settleWaiters=[];
function wait(ms){if(G.instant)return Promise.resolve();const s=G.session;return new Promise(r=>setTimeout(()=>{if(s===G.session)r();},ms/G.speed));}
function allSettled(){for(const p of G.cells)if(p&&(p.x!==p.tx||p.y!==p.ty))return false;return true;}
function waitSettled(){
  if(G.instant){for(const p of G.cells)if(p){p.x=p.tx;p.y=p.ty;p.falling=false;}return Promise.resolve();}
  return new Promise(r=>settleWaiters.push(r));
}
function stepMotion(dt){
  for(const p of G.cells){
    if(!p)continue;const dx=p.tx-p.x,dy=p.ty-p.y;if(dx===0&&dy===0)continue;
    const d=Math.hypot(dx,dy);p.speed=Math.min(22,p.speed+p.accel*dt);const s=p.speed*dt;
    if(s>=d){p.x=p.tx;p.y=p.ty;if(p.falling){p.falling=false;p.land=1;}p.speed=0;}
    else{p.x+=dx/d*s;p.y+=dy/d*s;}
  }
  if(settleWaiters.length&&allSettled()){const w=settleWaiters.splice(0);w.forEach(f=>f());}
}

/* ---------- board setup ----------
   Layout characters: x hole, . open, 1/2 ice, o/O rock (1 or 2 hits), f fish, p quilt patch */
function makesRun(x,y,c){return (colorAt(x-1,y)===c&&colorAt(x-2,y)===c)||(colorAt(x,y-1)===c&&colorAt(x,y-2)===c);}
function setupBoard(L,mode,seed){
  G.session++;settleWaiters.length=0;
  G.mode=mode;G.level=L;G.seed=seed>>>0;G.rng=makeRng(G.seed);
  G.cols=L.cols;G.rows=L.rows;const N=L.cols*L.rows;
  G.valid=new Uint8Array(N);G.crystal=new Uint8Array(N);G.patch=new Uint8Array(N);G.cells=new Array(N).fill(null);
  G.gravity=L.gravity;G.pendingGravity=null;G.moves=L.moves;G.score=0;G.flux=L.flux||0;G.busy=false;G.combo=0;G.sel=-1;G.hint=null;
  G.continued=false;G.ended=false;G.speed=1;G.colors=L.colors;G.tools=Object.assign({},L.tools||{});G.pupQueue=[];G.shadowUsed=false;
  G.boss=L.boss?{row:L.boss.row,x:L.boss.x,len:3,fed:0,need:L.boss.need,hunger:0,dir:1,turns:0,released:false,fedThisTurn:false}:null;
  const rocks=[],fish=[];
  for(let y=0;y<L.rows;y++)for(let x=0;x<L.cols;x++){
    const ch=L.layout[y][x],i=idx(x,y);if(ch==='x')continue;G.valid[i]=1;
    if(ch==='1')G.crystal[i]=1;if(ch==='2')G.crystal[i]=2;if(ch==='p')G.patch[i]=1;
    if(ch==='o'||ch==='O')rocks.push([i,ch==='O'?2:1]);
    if(ch==='f')fish.push(i);
  }
  let tries=0;
  do{
    G.cells.fill(null);
    for(const [i,hp] of rocks){const p=new Piece(-1,'boulder');p.hp=p.maxHp=hp;G.cells[i]=p;}
    if(G.boss)for(let k=0;k<3;k++){const p=new Piece(-1,'boss');p.part=k;G.cells[idx(G.boss.x+k,G.boss.row)]=p;}
    for(const i of fish)G.cells[i]=new Piece(-1,'fish');
    for(let y=0;y<G.rows;y++)for(let x=0;x<G.cols;x++){
      const i=idx(x,y);if(!G.valid[i]||G.cells[i])continue;
      let c,t=0;do{c=randColor();t++;}while(t<30&&makesRun(x,y,c));
      G.cells[i]=new Piece(c);
    }
    tries++;
  }while((findRuns().length||!findMove())&&tries<60);
  if(L.fish&&!fish.length){ // no hand-placed fish: start a few near the top
    const top=[];for(let y=0;y<2;y++)for(let x=0;x<G.cols;x++){const i=idx(x,y);const p=G.cells[i];if(p&&p.kind==='normal'&&colorAt(x,y)>=0)top.push(i);}
    for(const i of shuffleArr(top,G.rng).slice(0,Math.min(L.fish.max,L.fish.n))){const p=new Piece(-1,'fish');G.cells[i]=p;fish.push(i);}
  }
  G.fishSpawnLeft=L.fish?Math.max(0,L.fish.n-fish.length):0;
  G.pupSpawnLeft=L.pups?L.pups.n:0;
  if(L.pups&&L.pups.start){const spots=shuffleArr(G.cells.map((p,i)=>p&&p.kind==='normal'?i:-1).filter(i=>i>=0),G.rng).slice(0,L.pups.start);
    for(const i of spots){G.cells[i]=newPup();G.pupSpawnLeft--;}}
  G.goals=L.goals.map(g=>Object.assign({},g));
  for(const g of G.goals){
    if(g.t==='collect'||g.t==='score'||g.t==='fish')g.left=g.n;
    if(g.t==='crystal')g.left=G.crystal.reduce((a,v)=>a+(v>0?1:0),0);
    if(g.t==='boulder')g.left=G.cells.filter(p=>p&&p.kind==='boulder').length;
    if(g.t==='patch')g.left=G.patch.reduce((a,v)=>a+(v===1?1:0),0);
    if(g.t==='boss')g.left=G.boss?G.boss.need:0;
    g.total=g.left;
  }
  const [gx,gy]=DIRS[G.gravity];const span=(gx?G.cols:G.rows)+1;
  G.cells.forEach((p,i)=>{if(!p)return;const [x,y]=xy(i);p.tx=x;p.ty=y;const lane=gx?y:x;
    p.x=x-gx*(span+lane*0.35);p.y=y-gy*(span+lane*0.35);p.speed=0;p.accel=45;p.falling=true;});
}

/* ---------- matching ---------- */
function findRuns(){
  const runs=[];
  for(let y=0;y<G.rows;y++){let x=0;while(x<G.cols){const c=colorAt(x,y);if(c<0){x++;continue;}let e=x+1;while(e<G.cols&&colorAt(e,y)===c)e++;
    if(e-x>=3){const cells=[];for(let k=x;k<e;k++)cells.push(idx(k,y));runs.push({dir:'h',cells,color:c});}x=e;}}
  for(let x=0;x<G.cols;x++){let y=0;while(y<G.rows){const c=colorAt(x,y);if(c<0){y++;continue;}let e=y+1;while(e<G.rows&&colorAt(x,e)===c)e++;
    if(e-y>=3){const cells=[];for(let k=y;k<e;k++)cells.push(idx(x,k));runs.push({dir:'v',cells,color:c});}y=e;}}
  return runs;
}
function groupRuns(runs){
  const par=runs.map((_,i)=>i);const find=i=>par[i]===i?i:(par[i]=find(par[i]));
  const owner=new Map();
  runs.forEach((r,i)=>r.cells.forEach(c=>{if(owner.has(c))par[find(i)]=find(owner.get(c));else owner.set(c,i);}));
  const groups=new Map();
  runs.forEach((r,i)=>{const k=find(i);if(!groups.has(k))groups.set(k,{runs:[],cells:new Set(),color:r.color});const g=groups.get(k);g.runs.push(r);r.cells.forEach(c=>g.cells.add(c));});
  return [...groups.values()];
}
function decideSpecial(g,prefer){
  const maxLen=Math.max(...g.runs.map(r=>r.cells.length));
  const hasH=g.runs.some(r=>r.dir==='h'),hasV=g.runs.some(r=>r.dir==='v');
  let kind=null;
  if(maxLen>=5)kind='prism';else if(hasH&&hasV)kind='nova';else if(maxLen===4)kind=g.runs[0].dir==='h'?'lineV':'lineH';
  if(!kind)return null;
  let pos=prefer.find(c=>g.cells.has(c));
  if(pos===undefined&&hasH&&hasV){const hc=new Set(g.runs.filter(r=>r.dir==='h').flatMap(r=>r.cells));pos=g.runs.filter(r=>r.dir==='v').flatMap(r=>r.cells).find(c=>hc.has(c));}
  if(pos===undefined){const r=g.runs.reduce((a,b)=>b.cells.length>a.cells.length?b:a);pos=r.cells[Math.floor(r.cells.length/2)];}
  return {kind,pos,color:g.color};
}
function matchAt(i){
  const [x,y]=xy(i);const c=colorAt(x,y);if(c<0)return false;
  let n=1;for(let k=x-1;colorAt(k,y)===c;k--)n++;for(let k=x+1;colorAt(k,y)===c;k++)n++;if(n>=3)return true;
  n=1;for(let k=y-1;colorAt(x,k)===c;k--)n++;for(let k=y+1;colorAt(x,k)===c;k++)n++;return n>=3;
}
// Search start is random only to vary hints; whether a move exists never depends on it.
function findMove(){
  const N=G.cells.length;const start=Math.floor(Math.random()*N);
  for(let k=0;k<N;k++){
    const i=(start+k)%N;if(!G.valid[i]||!movable(G.cells[i]))continue;const [x,y]=xy(i);
    for(const [dx,dy] of [[1,0],[0,1]]){
      const nx=x+dx,ny=y+dy;if(!inb(nx,ny))continue;const j=idx(nx,ny);if(!G.valid[j]||!movable(G.cells[j]))continue;
      const a=G.cells[i],b=G.cells[j];
      if(a.kind==='prism'||b.kind==='prism'||(isSpecial(a)&&isSpecial(b)))return [i,j];
      G.cells[i]=b;G.cells[j]=a;const m=matchAt(i)||matchAt(j);G.cells[i]=a;G.cells[j]=b;
      if(m)return [i,j];
    }
  }
  return null;
}

/* ---------- gravity ---------- */
// Each line runs from the edge gravity points at (index 0) back to the far edge.
function lineList(){
  const g=G.gravity,out=[];
  if(g==='down'||g==='up'){for(let x=0;x<G.cols;x++){const L=[];
    if(g==='down'){for(let y=G.rows-1;y>=0;y--)if(G.valid[idx(x,y)])L.push(idx(x,y));}
    else{for(let y=0;y<G.rows;y++)if(G.valid[idx(x,y)])L.push(idx(x,y));}out.push(L);}}
  else{for(let y=0;y<G.rows;y++){const L=[];
    if(g==='right'){for(let x=G.cols-1;x>=0;x--)if(G.valid[idx(x,y)])L.push(idx(x,y));}
    else{for(let x=0;x<G.cols;x++)if(G.valid[idx(x,y)])L.push(idx(x,y));}out.push(L);}}
  return out;
}
const isFixed=i=>{const p=G.cells[i];return !!p&&p.kind==='boss';};
function fishOnBoard(){let n=0;for(const p of G.cells)if(p&&p.kind==='fish')n++;return n;}
function pupsOnBoard(){let n=0;for(const p of G.cells)if(p&&p.kind==='pup')n++;return n;}
function newPup(){const P=G.level.pups;const p=new Piece(-1,'pup');p.dog=P.dogs[Math.floor(G.rng()*P.dogs.length)];return p;}
function newPiece(){
  const U=G.level&&G.level.pups;
  if(U&&G.pupSpawnLeft>0&&pupsOnBoard()<U.max&&G.rng()<U.rate){G.pupSpawnLeft--;return newPup();}
  const F=G.level&&G.level.fish;
  if(F&&G.fishSpawnLeft>0&&fishOnBoard()<F.max&&G.rng()<F.rate){G.fishSpawnLeft--;return new Piece(-1,'fish');}
  return new Piece(randColor());
}
// The arapaima is fixed in place: pieces fall within the stretches above and below it.
function collapse(){
  const [gx,gy]=DIRS[G.gravity];
  for(const L of lineList()){
    const segs=[];let seg=[];
    for(const i of L){if(isFixed(i)){if(seg.length)segs.push(seg);seg=[];}else seg.push(i);}
    if(seg.length)segs.push(seg);
    for(const S of segs){
      const ps=S.map(i=>G.cells[i]).filter(Boolean);
      S.forEach(i=>G.cells[i]=null);
      ps.forEach((p,k)=>{const i=S[k];G.cells[i]=p;const [tx,ty]=xy(i);
        if(p.tx!==tx||p.ty!==ty){p.tx=tx;p.ty=ty;p.speed=Math.max(p.speed,2);p.accel=55;p.falling=true;}});
      const nNew=S.length-ps.length;
      for(let k=ps.length;k<S.length;k++){
        const i=S[k];const [tx,ty]=xy(i);const p=newPiece();
        p.tx=tx;p.ty=ty;p.x=tx-gx*nNew;p.y=ty-gy*nNew;p.speed=2;p.accel=55;p.falling=true;G.cells[i]=p;
      }
    }
  }
}

/* ---------- scoring / goals ---------- */
const mult=()=>Math.max(1,Math.min(G.combo,6));
function addFlux(n){if(!G.level||!G.level.gravityUnlocked)return;G.flux=Math.min(100,G.flux+n*(G.mode==='endless'?1.3:1));}
function goalTick(t,c){
  if(G.mode==='endless')return;
  G.goals.forEach((g,k)=>{if(g.t!==t)return;if(t==='collect'&&g.c!==c)return;if(g.left>0){g.left--;H.goalBump(k);if(g.left===0)H.cheer('goal',null);}});
}
function goalsMet(){return G.goals.every(g=>g.t==='score'?G.score>=g.n:g.t==='boss'?!!(G.boss&&G.boss.released):g.left<=0);}
function crackCrystal(i){G.crystal[i]--;G.score+=30;H.crystal(i,G.crystal[i]);if(G.crystal[i]===0)goalTick('crystal');}
function patchAt(i){if(G.patch[i]===1){G.patch[i]=2;G.score+=30;H.patch(i);goalTick('patch');}}
function fishScored(){goalTick('fish');G.score+=60;feedBoss(5);}
function collectFish(){
  let n=0;
  for(const L of lineList()){const i=L[0];if(i===undefined)continue;const p=G.cells[i];
    if(p&&p.kind==='fish'){G.cells[i]=null;H.fishHome(p,i);fishScored();n++;}}
  if(n)H.sound('splash');
  return n;
}
function destroyAt(i,opts){
  if(!G.valid[i])return;
  const p=G.cells[i];
  if(p&&p.kind==='boss'){feedBoss(2);return;}
  if(p&&p.kind==='pup'){G.cells[i]=null;G.pupQueue.push({dog:p.dog,i});H.pupGo(p,i);G.score+=50;if(G.crystal[i])crackCrystal(i);patchAt(i);return;}
  if(p&&p.kind==='fish'){
    if(opts&&(opts.spill||opts.fetch)){G.cells[i]=null;H.fishHome(p,i);fishScored();}
    return;
  }
  if(p&&p.kind==='boulder'){
    p.hp--;
    if(p.hp>0&&!(opts&&opts.spill)){p.hit=1;G.score+=20;H.crack(i,p,false);return;}
    G.cells[i]=null;H.crack(i,p,true);H.destroyed(p,i,opts);if(!p.mud)goalTick('boulder');G.score+=p.mud?20:80;
    if(G.crystal[i])crackCrystal(i);
    patchAt(i);
    return;
  }
  if(p){G.cells[i]=null;H.destroyed(p,i,opts);if(p.color>=0)goalTick('collect',p.color);G.score+=10*mult();}
  if(G.crystal[i])crackCrystal(i);
  patchAt(i);
}

// Fish swim: after each move every fish slips one cell toward the pond, trading places with the shape below.
function fishSwim(){
  let moved=false;
  for(const L of lineList())for(let k=1;k<L.length;k++){
    const i=L[k],j=L[k-1];const p=G.cells[i],q=G.cells[j];
    if(!p||p.kind!=='fish'||!q||q.kind!=='normal'||isFixed(j))continue;
    G.cells[i]=q;G.cells[j]=p;const [qx,qy]=xy(i),[px,py]=xy(j);
    q.tx=qx;q.ty=qy;q.speed=3;q.accel=10;p.tx=px;p.ty=py;p.speed=3;p.accel=10;moved=true;k++;
  }
  return moved;
}

/* ---------- the arapaima ---------- */
function bossCells(){const B=G.boss;if(!B||B.released)return [];const o=[];for(let k=0;k<B.len;k++)o.push(idx(B.x+k,B.row));return o;}
function nearBoss(i){const bc=bossCells();return bc.length>0&&neigh(i).some(n=>bc.includes(n));}
function feedBoss(n){
  const B=G.boss;if(!B||B.released||n<=0)return;
  B.fed=Math.min(B.need,B.fed+n);B.fedThisTurn=true;
  G.goals.forEach((g,k)=>{if(g.t==='boss'){const left=B.need-B.fed;if(left!==g.left){g.left=left;H.goalBump(k);}}});
  H.bossFed(n);
}
function moveBoss(){
  const B=G.boss;
  for(let attempt=0;attempt<2;attempt++){
    const lead=B.dir>0?B.x+B.len:B.x-1;
    const li=lead>=0&&lead<G.cols?idx(lead,B.row):-1;
    if(li>=0&&G.valid[li]&&movable(G.cells[li])){
      const tail=B.dir>0?idx(B.x,B.row):idx(B.x+B.len-1,B.row);
      const displaced=G.cells[li];const parts=bossCells().map(i=>G.cells[i]);
      B.x+=B.dir;
      bossCells().forEach((i,k)=>{G.cells[i]=parts[k];const [x,y]=xy(i);parts[k].tx=x;parts[k].ty=y;parts[k].speed=1.5;parts[k].accel=3;});
      G.cells[tail]=displaced;const [tx,ty]=xy(tail);displaced.tx=tx;displaced.ty=ty;displaced.speed=3;displaced.accel=6;
      H.bossMove();return true;
    }
    B.dir*=-1;
  }
  return false;
}
function thrash(){
  const cand=[];G.cells.forEach((p,i)=>{if(p&&p.kind==='normal')cand.push(i);});
  const picks=shuffleArr(cand,G.rng).slice(0,3);
  for(const i of picks){const p=new Piece(-1,'boulder');p.mud=true;p.pop=1;const [x,y]=xy(i);p.x=p.tx=x;p.y=p.ty=y;G.cells[i]=p;}
  H.bossThrash(picks);
}
async function releaseBoss(){
  const B=G.boss;const cells=bossCells();
  H.bossLeap(cells.map(i=>G.cells[i]));
  cells.forEach(i=>{G.cells[i]=null;});
  B.released=true;G.score+=500;H.cheer('boss',cells);
  G.goals.forEach((g,k)=>{if(g.t==='boss'){g.left=0;H.goalBump(k);}});
  await wait(700);collapse();await waitSettled();await cascade();
}
async function bossTurn(){
  const B=G.boss;if(!B||B.released)return;
  if(B.fed>=B.need){await releaseBoss();return;}
  B.turns++;
  B.hunger=B.fedThisTurn?0:B.hunger+1;B.fedThisTurn=false;
  if(B.hunger>=3){B.hunger=0;thrash();await wait(250);}
  if(B.turns%2===0&&moveBoss()){await waitSettled();if(findRuns().length)await cascade();}
}

/* ---------- specials ---------- */
function rowCells(y){const o=[];if(y<0||y>=G.rows)return o;for(let x=0;x<G.cols;x++)if(G.valid[idx(x,y)])o.push(idx(x,y));return o;}
function colCells(x){const o=[];if(x<0||x>=G.cols)return o;for(let y=0;y<G.rows;y++)if(G.valid[idx(x,y)])o.push(idx(x,y));return o;}
function diamond(cx,cy,r){const o=[];for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.abs(dx)+Math.abs(dy)>r)continue;const x=cx+dx,y=cy+dy;if(inb(x,y)&&G.valid[idx(x,y)])o.push(idx(x,y));}return o;}
function cellsOfColor(c,exclude){const o=[];G.cells.forEach((p,i)=>{if(p&&p!==exclude&&p.color>=0&&(p.kind==='normal'||isSpecial(p))&&p.kind!=='prism'&&!p.activated&&p.color===c)o.push(i);});return o;}
function mostCommonColor(){const cnt=new Array(6).fill(0);G.cells.forEach(p=>{if(p&&p.color>=0&&p.kind!=='prism'&&!p.activated)cnt[p.color]++;});let b=0;for(let c=1;c<6;c++)if(cnt[c]>cnt[b])b=c;return b;}
function effectCells(p,i){
  const [x,y]=xy(i);
  if(p.kind==='lineH'){H.beam(x,y,'h',p.color);H.sound('beam');return rowCells(y);}
  if(p.kind==='lineV'){H.beam(x,y,'v',p.color);H.sound('beam');return colCells(x);}
  if(p.kind==='nova'){H.ring(x,y,2.6,p.color);H.sound('nova');H.shake(6);return diamond(x,y,2);}
  if(p.kind==='prism'){const c=mostCommonColor();const t=cellsOfColor(c);H.rays(i,t,c);H.sound('prism');return t;}
  return [];
}
const SPECIAL_BONUS={lineH:60,lineV:60,nova:100,prism:200};
function placeSpecial(s){
  const p=new Piece(s.kind==='prism'?-1:s.color,s.kind);const [x,y]=xy(s.pos);
  p.x=p.tx=x;p.y=p.ty=y;p.pop=1;G.cells[s.pos]=p;G.score+=SPECIAL_BONUS[s.kind];addFlux(8);H.special(p,s.pos);H.cheer(s.kind==='prism'?'prism':s.kind==='nova'?'nova':'beam',[s.pos]);
}
async function blast(initial,spawns=[],opts=null){
  let wave=new Set(initial.filter(i=>G.valid[i]));
  if(!wave.size)return;
  const done=new Set();let first=true;const s0=G.score;const center=centroid([...wave]);
  while(wave.size){
    wave.forEach(i=>done.add(i));
    const next=new Set();
    for(const i of wave){const p=G.cells[i];if(isSpecial(p)&&!p.activated){p.activated=true;addFlux(4);
      for(const c of effectCells(p,i))if(!done.has(c))next.add(c);}}
    for(const i of wave)destroyAt(i,opts);
    if(first){first=false;for(const s of spawns)placeSpecial(s);}
    opts=null;wave=next;
    if(wave.size)await wait(140);
  }
  const gained=G.score-s0;if(gained>0)H.text('+'+gained,center);
  H.hud();
}
async function comboSwap(a,b){
  const P=G.cells[b],Q=G.cells[a];const [cx,cy]=xy(b);H.cheer('combo',[a,b]);
  if(P.kind==='prism'&&Q.kind==='prism'){
    P.activated=Q.activated=true;H.sound('mega');H.shake(16);H.ring(cx,cy,10,null);addFlux(30);
    const all=[];for(let i=0;i<G.cells.length;i++)if(G.valid[i])all.push(i);
    await wait(200);await blast(all);return;
  }
  if(P.kind==='prism'||Q.kind==='prism'){
    const pi=P.kind==='prism'?b:a,oi=pi===b?a:b;const prism=G.cells[pi],other=G.cells[oi];
    prism.activated=true;
    if(other.color<0){await wait(200);await blast([pi,oi]);return;}
    const c=other.color;const targets=cellsOfColor(c,other);
    H.rays(pi,targets.concat(oi),c);H.sound('prism');addFlux(15);
    if(other.kind==='normal'){await wait(300);await blast([pi,oi,...targets]);return;}
    for(const i of targets){const p=G.cells[i];if(p.kind==='normal'){p.kind=other.kind==='nova'?'nova':(G.rng()<.5?'lineH':'lineV');p.pop=1;}}
    H.sound('forge');await wait(550);await blast([pi,oi,...targets]);return;
  }
  P.activated=Q.activated=true;addFlux(12);
  const isLine=k=>k==='lineH'||k==='lineV';const set=new Set([a,b]);
  const addRow=y=>{const r=rowCells(y);if(r.length){r.forEach(i=>set.add(i));H.beam(cx,y,'h',P.color);}};
  const addCol=x=>{const c=colCells(x);if(c.length){c.forEach(i=>set.add(i));H.beam(x,cy,'v',Q.color);}};
  if(isLine(P.kind)&&isLine(Q.kind)){addRow(cy);addCol(cx);H.sound('beam');H.shake(8);}
  else if(P.kind==='nova'&&Q.kind==='nova'){diamond(cx,cy,4).forEach(i=>set.add(i));H.ring(cx,cy,4.6,P.color);H.sound('nova');H.shake(14);}
  else{for(let d=-1;d<=1;d++){addRow(cy+d);addCol(cx+d);}H.sound('beam');H.sound('nova');H.shake(12);}
  await blast([...set]);
}

/* ---------- turn flow ---------- */
function setTarget(p,i){const [x,y]=xy(i);p.tx=x;p.ty=y;p.speed=9;p.accel=0;}
function doSwap(a,b){const pa=G.cells[a],pb=G.cells[b];G.cells[a]=pb;G.cells[b]=pa;setTarget(pb,a);setTarget(pa,b);}
async function cascade(prefer=[]){
  G.combo=0;
  for(;;){
    if(G.pupQueue.length){const q=G.pupQueue.splice(0);for(const u of q){await pupPower(u.dog,u.i,true);await wait(60);collapse();await waitSettled();}continue;}
    const runs=findRuns();
    if(!runs.length){
      if(collectFish()){await wait(160);collapse();await waitSettled();continue;}
      break;
    }
    G.combo++;
    const groups=groupRuns(runs);const cells=new Set();const spawns=[];
    for(const g of groups){
      g.cells.forEach(c=>cells.add(c));const s=decideSpecial(g,prefer);if(s)spawns.push(s);
      if(G.boss&&!G.boss.released&&[...g.cells].some(nearBoss))feedBoss(g.cells.size);
    }
    for(const c of [...cells])for(const n of neigh(c)){const p=G.cells[n];if(p&&(p.kind==='boulder'||p.kind==='pup'))cells.add(n);}
    addFlux(groups.length*3+(G.combo-1)*6);
    H.sound('match',G.combo);H.buzz(8);if(G.combo>=2)H.cheer(G.combo>=4?'chain':'cascade',[...cells]);
    await blast([...cells],spawns);
    prefer=[];
    await wait(70);collapse();await waitSettled();
  }
  const c=G.combo;G.combo=0;return c;
}
async function attemptSwap(a,b){
  if(G.busy||!G.active||G.ended)return;
  const pa=G.cells[a],pb=G.cells[b];if(!movable(pa)||!movable(pb)||!adjacent(a,b))return;
  G.busy=true;G.sel=-1;H.clearHint();
  doSwap(a,b);H.sound('swap');await waitSettled();
  const pupAt=pa.kind==='pup'?b:pb.kind==='pup'?a:-1;
  if(pupAt>=0){if(G.mode!=='endless')G.moves--;H.hud();
    if(pa.kind==='pup')destroyAt(b);if(pb.kind==='pup')destroyAt(a);
    await cascade([b,a]);await endTurn(true);return;}
  const special=pa.kind==='prism'||pb.kind==='prism'||(isSpecial(pa)&&isSpecial(pb));
  if(!special&&!findRuns().length){
    doSwap(a,b);H.sound('nope');H.buzz(25);await waitSettled();
    G.busy=false;H.armHint();return;
  }
  if(G.mode!=='endless')G.moves--;H.hud();
  if(special){await comboSwap(a,b);await wait(60);collapse();await waitSettled();}
  await cascade([b,a]);
  await endTurn(true);
}
// Flux power (from Winter Lights on): the edge row on the chosen side spills off, gravity turns to face it.
async function tilt(dir){
  if(G.busy||!G.active||G.ended||G.flux<100||!DIRS[dir]||!G.level.gravityUnlocked)return false;
  G.busy=true;G.flux=0;G.sel=-1;H.clearHint();
  G.gravity=dir;H.sound('tilt');H.shake(10);H.buzz(30);H.hud();
  const edge=lineList().map(L=>L[0]).filter(i=>i!==undefined);
  await blast(edge,[],{spill:DIRS[dir]});
  await wait(80);collapse();await waitSettled();
  await cascade();await endTurn(false);
  return true;
}
/* ---------- the pups ----------
   Gypsy (fetch): proper and polite. She tidies the piece you choose and every touching piece of its kind.
   Zoya (dig): chaos. Zoomies from where you tap: a wild romp that knocks pieces out, scrambles the rest, skids in Beams.
   Marshall (bound): Super Marshall leaps along the row and lands with a bump. And he is her shadow: see endTurn.
   Cash (charge): sweet. Snuggles up, and every piece around the chosen one becomes its kind. */
function square(cx,cy,r){const o=[];for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const x=cx+dx,y=cy+dy;if(inb(x,y)&&G.valid[idx(x,y)])o.push(idx(x,y));}return o;}
function tidyCells(a){
  const p=G.cells[a];if(!p||p.kind!=='normal')return [a];
  const out=[a],seen=new Set([a]);
  for(let k=0;k<out.length;k++)for(const n of neigh(out[k])){if(seen.has(n))continue;seen.add(n);const q=G.cells[n];if(q&&q.kind==='normal'&&q.color===p.color)out.push(n);}
  return out;
}
// From a face tile she tidies every same-kind group touching her spot.
function tidyAround(a){const s=new Set();const [ax,ay]=xy(a);for(const n of square(ax,ay,1)){if(n===a)continue;const q=G.cells[n];if(q&&q.kind==='normal')tidyCells(n).forEach(i=>s.add(i));}return [...s];}
function zoomiesPath(a){
  const path=[a];let cur=a;
  for(let s=0;s<13;s++){const [x,y]=xy(cur);const opts=[];
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(!inb(nx,ny))continue;const j=idx(nx,ny);if(G.valid[j]&&!isFixed(j))opts.push(j);}
    if(!opts.length)break;const fresh=opts.filter(j=>!path.includes(j));const pool=fresh.length&&G.rng()<.8?fresh:opts;
    cur=pool[Math.floor(G.rng()*pool.length)];path.push(cur);}
  return path;
}
/* Dog powers play out slowly enough to enjoy. Times in ms; the UI hooks get the same numbers so sprites and pops stay in step. */
const PUP_T={tidyIn:420,zoomIn:320,zoomStep:110,jumble:190,leap:1150,land:220,sweep:75,snugIn:560,snugStep:130,snugOut:320};
// Pops groups one after another (a group pops together); specials met on the way go off at the end, as a normal blast.
async function popSeq(groups,step,onStep){
  const s0=G.score,chain=[],all=[];let k=0;
  for(const g of groups){let any=false;
    for(const i of g){all.push(i);if(!G.valid[i])continue;const p=G.cells[i];if(!p)continue;
      if(isSpecial(p)&&!p.activated){chain.push(i);continue;}destroyAt(i,onStep?onStep(i,k):null);any=true;}
    if(any){H.sound('pip',k);k++;}await wait(step);}
  const g=G.score-s0;if(g>0)H.text('+'+g,centroid(all));H.hud();
  if(chain.length)await blast(chain);
}
async function zoomies(a){
  const path=zoomiesPath(a),hit=[...new Set(path)];
  const near=new Set();for(const i of hit)for(const n of neigh(i))if(!hit.includes(n)){const q=G.cells[n];if(q&&q.kind==='normal')near.add(n);}
  const nn=[...near],cols=shuffleArr(nn.map(i=>G.cells[i].color),G.rng),beams=shuffleArr(nn.slice(),G.rng).slice(0,2).map(i=>[i,G.rng()<.5?'lineH':'lineV']);
  H.zoomies(path,PUP_T.zoomStep,PUP_T.zoomIn);H.shake(6);await wait(PUP_T.zoomIn);
  // she tears along her path, sending pieces flying the way she is running
  await popSeq(path.map(i=>[i]),PUP_T.zoomStep,(i,k)=>{if(k%3===0)H.shake(5);const pk=G.cells[i]&&G.cells[i].kind;if(pk==='boulder'||pk==='fish'||pk==='pup')return null;const j=path.indexOf(i),n=path[Math.min(path.length-1,j+1)],[x0,y0]=xy(i),[x1,y1]=xy(n);
    const dx=(x1-x0)||(G.rng()-.5),dy=(y1-y0)||(G.rng()-.5)-.6;return {spill:[dx*.9+(G.rng()-.5)*.6,dy*.9-.4]};});
  // then everything she brushed past gets jumbled, in three shoves
  const third=Math.ceil(nn.length/3);
  for(let s=0;s<3;s++){const part=nn.slice(s*third,(s+1)*third);if(!part.length)continue;
    part.forEach(i=>{const q=G.cells[i];if(q&&q.kind==='normal'){q.color=cols[nn.indexOf(i)];q.pop=1;}});H.shake(7);H.sound('swap');await wait(PUP_T.jumble);}
  for(const [i,k] of beams){const q=G.cells[i];if(q&&q.kind==='normal'){q.kind=k;q.pop=1;const [x,y]=xy(i);H.ring(x,y,.8,q.color);H.sound('forge');await wait(PUP_T.jumble);}}
}
function snuggleRing(a){const [x,y]=xy(a);return square(x,y,1).filter(i=>i!==a&&G.cells[i]&&G.cells[i].kind==='normal')
  .sort((i,j)=>{const [ix,iy]=xy(i),[jx,jy]=xy(j);return Math.atan2(iy-y,ix-x)-Math.atan2(jy-y,jx-x);});}
function snuggleColor(a,ring){const p=G.cells[a];let c=p&&p.kind==='normal'?p.color:-1;
  if(c<0){const cnt=new Array(6).fill(0);ring.forEach(i=>cnt[G.cells[i].color]++);c=cnt.indexOf(Math.max(...cnt));}return c;}
async function pupPower(tool,a,fromTile){
  const [x,y]=xy(a);H.cheer('dog:'+tool,[a]);
  if(tool==='fetch'){const p=G.cells[a];
    if(p&&p.kind==='fish'){H.tidy([a],300,PUP_T.tidyIn);await wait(PUP_T.tidyIn+300);await blast([a],[],{fetch:true});}
    else{// Gypsy is proper about it: she visits each piece in reading order and puts it away
      const cells=(fromTile?tidyAround(a):tidyCells(a)).filter(i=>G.cells[i]).sort((i,j)=>i-j);
      const step=Math.max(60,Math.min(140,1500/Math.max(1,cells.length)));
      H.tidy(cells,step,PUP_T.tidyIn);await wait(PUP_T.tidyIn);await popSeq(cells.map(i=>[i]),step);}}
  else if(tool==='dig')await zoomies(a);
  else if(tool==='bound'){// Super Marshall: wind up, one big leap, a bump where he lands, then the row rolls out from him
    H.leap(x,y,PUP_T.leap);await wait(PUP_T.leap);
    const sq=square(x,y,1);H.shake(12);H.ring(x,y,1.8,null);H.sound('boulder');await blast(sq);await wait(PUP_T.land);
    const row=rowCells(y).filter(i=>!sq.includes(i)),groups=[];
    for(const i of row){const d=Math.abs(xy(i)[0]-x);(groups[d]=groups[d]||[]).push(i);}
    const gs=groups.filter(Boolean);H.sweep(x,y,PUP_T.sweep,gs.length);H.sound('beam');await popSeq(gs,PUP_T.sweep);}
  else if(tool==='charge'){// Cash settles in, then the pieces around him come round to his side one by one
    const ring=snuggleRing(a),c=snuggleColor(a,ring);
    H.snuggle(x,y,PUP_T.snugIn+ring.length*PUP_T.snugStep+PUP_T.snugOut);await wait(PUP_T.snugIn);
    let k=0;for(const i of ring){const q=G.cells[i];if(q&&q.kind==='normal'){q.color=c;q.pop=1;const [qx,qy]=xy(i);H.ring(qx,qy,.55,c);H.sound('pip',k++);}await wait(PUP_T.snugStep);}
    H.sound('forge');await wait(PUP_T.snugOut);}
}
// The helper buttons. Free: they never cost a move and the arapaima does not take a turn.
async function useTool(tool,a){
  if(G.busy||!G.active||G.ended||!(G.tools[tool]>0)||a<0||!G.valid[a])return false;
  const pa=G.cells[a];
  if((tool==='fetch'||tool==='charge')&&(!pa||pa.kind==='boss'))return false;
  G.busy=true;G.tools[tool]--;G.sel=-1;H.clearHint();H.hud();H.sound('tool',tool);
  await pupPower(tool,a,false);
  await wait(60);collapse();await waitSettled();
  await cascade();await endTurn(false);
  return true;
}
async function overflow(){
  if(G.moves<=0||!isFinite(G.moves))return;
  H.banner('Overflow');H.sound('forge');await wait(900);
  while(G.moves>0){
    const n=Math.min(G.moves,5);G.moves-=n;H.hud();
    const picks=shuffleArr(G.cells.map((p,i)=>p&&p.kind==='normal'?i:-1).filter(i=>i>=0),G.rng).slice(0,n);
    for(const i of picks){const p=G.cells[i];p.kind=G.rng()<.5?'lineH':'lineV';p.pop=1;H.sound('forge');await wait(90);}
    await wait(250);await blast(picks);await wait(60);collapse();await waitSettled();await cascade();
  }
  for(let guard=0;guard<12;guard++){
    const sp=G.cells.map((p,i)=>isSpecial(p)?i:-1).filter(i=>i>=0);if(!sp.length)break;
    await blast(sp);await wait(60);collapse();await waitSettled();await cascade();
  }
}
async function shuffle(){
  H.banner('Reshuffle');await wait(700);
  const idxs=G.cells.map((p,i)=>p&&p.kind==='normal'?i:-1).filter(i=>i>=0);
  const cols=idxs.map(i=>G.cells[i].color);let ok=false;
  for(let t=0;t<300&&!ok;t++){shuffleArr(cols,G.rng);idxs.forEach((i,k)=>G.cells[i].color=cols[k]);ok=!findRuns().length&&!!findMove();}
  for(let t=0;t<300&&!ok;t++){idxs.forEach(i=>G.cells[i].color=randColor());ok=!findRuns().length&&!!findMove();}
  idxs.forEach(i=>G.cells[i].pop=1);H.shuffleFx();await wait(400);
  if(findRuns().length)await cascade();
  if(!findMove()&&G.level.gravityUnlocked)G.flux=100;
}
async function endTurn(consumed){
  G.combo=0;H.hud();
  if(consumed&&fishOnBoard()&&fishSwim()){await waitSettled();if(collectFish()){await wait(160);collapse();await waitSettled();}if(findRuns().length)await cascade();}
  if(G.boss&&!G.boss.released){
    if(consumed)await bossTurn();
    else if(G.boss.fed>=G.boss.need)await releaseBoss();
  }
  if(G.pendingGravity){G.gravity=G.pendingGravity;G.pendingGravity=null;H.gravity();}
  if(G.mode!=='endless'){
    if(goalsMet()){G.ended=true;await overflow();H.hud();H.win();return;}
    if(G.moves<=0){
      if(G.level.shadow&&!G.shadowUsed){G.shadowUsed=true;G.moves+=3;H.shadow();H.hud();}
      else{G.ended=true;H.lose();return;}
    }
  }
  if(!findMove())await shuffle();
  G.busy=false;H.hud();H.armHint();
}
