const fs=require('fs');
const src=fs.readFileSync(__dirname+'/../src/engine.js','utf8')+fs.readFileSync(__dirname+'/../src/levels.js','utf8').replace('/*__FESTIVALS__*/',fs.readFileSync(__dirname+'/../src/festivals.js','utf8'));
eval(src+`
function allMoves(){const out=[];for(let i=0;i<G.cells.length;i++){if(!G.valid[i]||!movable(G.cells[i]))continue;const [x,y]=xy(i);
 for(const [dx,dy] of [[1,0],[0,1]]){const nx=x+dx,ny=y+dy;if(!inb(nx,ny))continue;const j=idx(nx,ny);if(!G.valid[j]||!movable(G.cells[j]))continue;
  const a=G.cells[i],b=G.cells[j];let sc=0;
  if(a.kind==='prism'||b.kind==='prism'||(isSpecial(a)&&isSpecial(b)))sc=12;
  else{G.cells[i]=b;G.cells[j]=a;const runs=findRuns();G.cells[i]=a;G.cells[j]=b;
   if(runs.length){sc=runs.reduce((s,r)=>s+r.cells.length,0);if(isSpecial(a)||isSpecial(b))sc+=3;
     if(G.boss&&!G.boss.released&&runs.some(r=>r.cells.some(nearBoss)))sc+=6;}}
  if(sc)out.push([i,j,sc]);}}return out;}
async function play(n,trial,bonus){
 const L=bonus?bonusLevel(n,n):getLevel(n);setupBoard(L,'journey',L.num*7919+trial);G.active=true;G.instant=true;
 let res=null;H.win=()=>{res=true};H.lose=()=>{res=false};let guard=0;
 while(res===null&&guard++<400){
  if(G.busy){return {err:'stuck busy'};}
  if(G.flux>=100&&G.level.gravityUnlocked){await tilt(['down','up','left','right'][Math.floor(Math.random()*4)]);continue;}
  const tl=Object.keys(G.tools).find(t=>G.tools[t]>0);
  if(tl&&G.moves<=6){const c=G.cells.findIndex(p=>p&&p.kind==='normal');const c2=G.cells.findIndex((p,i)=>i>c+3&&p&&p.kind==='normal');
    if(await useTool(tl,c,c2))continue; G.tools[tl]=0;}
  const ms=allMoves();if(!ms.length)return {err:'no moves'};
  ms.sort((a,b)=>b[2]-a[2]+(Math.random()-.5)*2);
  await attemptSwap(ms[0][0],ms[0][1]);
 }
 return {res,score:G.score,stars:res?1+(G.score>=L.s2)+(G.score>=L.s3):0,left:G.goals.map(g=>g.t+':'+(g.t==='score'?Math.max(0,g.n-G.score):g.left))};
}
module.exports={play,getLevel,STORY_TOTAL,chapterOf,BONUS,bonusLevel,bonusName};
`);
