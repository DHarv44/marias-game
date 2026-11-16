'use strict';
/* ====================== JOURNEY DATA ======================
   Maria's life as a Tree of Life: seven branches, eighty leaves, then open sky.
   Nothing is named on screen except branch titles; places live in palette, pattern and sound. */
const CHAPTERS=[
  {id:'rain',name:'Garden City',line:'Shutters open to the rain, Saturday at the market, the first school bell.',count:12,her:[1,1],inst:'pan',motif:'garden',colors:5,gravity:false,
    masks:['full','river1','river2','lake','stilts'],types:['collect','score','fish'],
    pal:{bg:'#EEF4F1',bg2:'#DCEAE5',panel:'#FBFDFC',ink:'#1F3A3A',muted:'#4C6663',line:'rgba(31,58,58,.14)',accent:'#2F7F86',frame:'#C8DDD9',
      cell:'#F6FAF8',cellAlt:'#E8F1EE',rock:'#8A7A6A',water:'#8CC9C0',motif:'#2F7F86',motif2:'#E8553B',quilt:['#2F7F86','#E8553B','#F2B705']}},
  {id:'snow',name:'First Snow',line:'The first cold, and the first snow.',count:6,her:[.85,.7],inst:'bells',motif:'snow',colors:5,gravity:false,
    cover:'ice',masks:['full','lake','octagon','plus'],types:['crystal','crystal','collect','score'],
    pal:{bg:'#ECF1F8',bg2:'#DCE5F1',panel:'#FAFCFF',ink:'#1E3350',muted:'#4F6480',line:'rgba(30,51,80,.14)',accent:'#3F7CAC',frame:'#C9D7E8',
      cell:'#F7FAFE',cellAlt:'#EAF0F8',rock:'#8794A6',water:'#9CC6E6',motif:'#3F7CAC',motif2:'#C2354A',quilt:['#3F7CAC','#C2354A','#E8B04B']}},
  {id:'sun',name:'Salt and Sun',line:'Salt air, long evenings, everything in color.',count:18,her:[.6,.3],inst:'marimba',motif:'sun',colors:5,gravity:false,
    cover:'sand',masks:['full','shore','diamond','hourglass'],types:['boulder','boulder','crystal','collect','score'],
    pal:{bg:'#FDEFF2',bg2:'#F8DCE4',panel:'#FFF9F6',ink:'#4A2338',muted:'#7E5266',line:'rgba(74,35,56,.13)',accent:'#1F9A96',frame:'#F4C9D6',
      cell:'#FFF7F4',cellAlt:'#FBEAEC',rock:'#F08A63',water:'#8FD8D2',motif:'#23A8A4',motif2:'#FF9466',quilt:['#23A8A4','#F59DBE','#FF9466']}},
  {id:'lights',name:'Winter Lights',line:'Far from home, under the lanterns.',count:15,her:[.2,.05],inst:'glock',motif:'lights',colors:5,gravity:true,dark:true,
    cover:'ice',masks:['full','pins','bridge','octagon','donut'],types:['crystal','boulder','collect','score'],
    pal:{bg:'#1E2A33',bg2:'#2A3843',panel:'#2C3B46',ink:'#F4EEE2',muted:'#B9C2C6',line:'rgba(244,238,226,.13)',accent:'#F3C065',frame:'#3A4C59',
      cell:'#283844',cellAlt:'#22303A',rock:'#7A5638',water:'#4F7C93',motif:'#F3C065',motif2:'#A8323E',quilt:['#2E4A3B','#F3C065','#A8323E']}},
  {id:'rivers',name:'Two Rivers',line:'Old land between two rivers.',count:5,her:[0,0],inst:'pluck',motif:'rivers',colors:5,gravity:true,
    cover:'silt',masks:['two','twoBend'],types:['collect','boulder','crystal'],
    pal:{bg:'#F1E7D6',bg2:'#E6D6BC',panel:'#FBF6EC',ink:'#20304A',muted:'#555C70',line:'rgba(32,48,74,.14)',accent:'#23558F',frame:'#DCC9A6',
      cell:'#FBF4E6',cellAlt:'#F2E6D0',rock:'#B08B5A',water:'#6E9BC9',motif:'#23558F',motif2:'#D8A84A',quilt:['#23558F','#D8A84A','#5F7F3B']}},
  {id:'dune',name:'Pearl and Dune',line:'Pearl, sea and sand under a deep sky.',count:5,her:[0,0],inst:'drone',motif:'lattice',colors:6,gravity:true,
    cover:'sand',masks:['dune','diamond','full'],types:['crystal','collect','boulder','score'],
    pal:{bg:'#F7EEDC',bg2:'#EEDDBC',panel:'#FFFAF0',ink:'#2C2B57',muted:'#5D5878',line:'rgba(44,43,87,.14)',accent:'#178F8A',frame:'#E7D2A6',
      cell:'#FFF9EE',cellAlt:'#F6EAD3',rock:'#C79E5C',water:'#7FD3CF',motif:'#2C2B57',motif2:'#E2B66A',quilt:['#1FB2AC','#E2B66A','#2C2B57']}},
  {id:'home',name:'Bluebonnet Home',line:'Big sky. Wildflowers. Home.',count:19,her:[.15,.35],inst:'acoustic',motif:'bonnet',colors:6,gravity:true,
    masks:['full','octagon','plus','donut'],types:['collect','boulder','score'],
    pal:{bg:'#F3EEF8',bg2:'#E4DCF0',panel:'#FCFAFF',ink:'#2E2A5A',muted:'#5A5484',line:'rgba(46,42,90,.14)',accent:'#4A5BC4',frame:'#D8CFEB',
      cell:'#FBF9FF',cellAlt:'#F0EBF9',rock:'#9C8A6E',water:'#9CC7EA',motif:'#4A5BC4',motif2:'#E77BA6',quilt:['#4A5BC4','#E77BA6','#E6B450']}},
];
const UNKNOWN_PALS=[
  {bg:'#F4EEFA',bg2:'#E8DDF4',panel:'#FDFAFF',ink:'#33264F',muted:'#62567E',line:'rgba(51,38,79,.14)',accent:'#8A5CCB',frame:'#DCCDEE',cell:'#FCF9FF',cellAlt:'#F2EAFA',rock:'#9A8AAE',water:'#B7A8E6',motif:'#9B6FD6',motif2:'#E0508E',quilt:['#9B6FD6','#E0508E','#F2B705']},
  {bg:'#FBEEF4',bg2:'#F4DCE8',panel:'#FFFAFC',ink:'#45213A',muted:'#7A5068',line:'rgba(69,33,58,.13)',accent:'#C23C7E',frame:'#F0CBDD',cell:'#FFF8FB',cellAlt:'#F9EAF1',rock:'#B08C9E',water:'#E5A8C8',motif:'#D9468A',motif2:'#9B6FD6',quilt:['#D9468A','#9B6FD6','#3FA88B']},
  {bg:'#EFEFFA',bg2:'#DEDDF2',panel:'#FCFCFF',ink:'#26285A',muted:'#575A86',line:'rgba(38,40,90,.14)',accent:'#5B5FC7',frame:'#D3D3EE',cell:'#FAFAFF',cellAlt:'#EEEEFA',rock:'#8E90AE',water:'#A9B1EA',motif:'#5B5FC7',motif2:'#E77BA6',quilt:['#5B5FC7','#E77BA6','#7FAE3E']},
  {bg:'#F7EDF6',bg2:'#ECDAEA',panel:'#FEFAFD',ink:'#3D2347',muted:'#6E5278',line:'rgba(61,35,71,.13)',accent:'#A2479E',frame:'#E6CDE4',cell:'#FDF8FC',cellAlt:'#F5EAF3',rock:'#A68AA2',water:'#D3A9DA',motif:'#A2479E',motif2:'#EE9F2E',quilt:['#A2479E','#EE9F2E','#5F84E2']},
];
const UNKNOWN={id:'unknown',cover:'ice',name:'Into the unknown',line:'The tree keeps growing.',her:[.25,.25],inst:'blend',motif:'sky',colors:6,gravity:true,pal:UNKNOWN_PALS[0]};
const STORY_TOTAL=CHAPTERS.reduce((a,c)=>a+c.count,0); // 80
const QUILT_FROM=73;                                     // Bluebonnet Home, leaf 12: she starts quilting

const DOGS=[
  {id:'gypsy',name:'Gypsy',after:34,tool:'fetch',toolName:'Tidy',line:'Pardon me!',
    desc:'Proper and polite. Once a level, Gypsy tidies up: she lifts the piece you choose and every touching piece of the same kind. A fish she lifts goes straight home.',
    face:{head:'#D9A441',ear:'#2A2020',muzzle:'#F1D9A8',earW:5,earH:9,spot:0,brindle:0,mask:1,beard:0}},
  {id:'zoya',name:'Zoya',after:39,tool:'dig',toolName:'Zoomies',line:'Zoomies!',
    desc:'Pure chaos. Once a level, Zoya gets the zoomies: she tears around the board from where you tap, knocking pieces out, scrambling the rest and skidding a couple of Beams into place.',
    face:{head:'#F3EFE8',ear:'#D9D0C3',muzzle:'#E4DFD7',earW:4.5,earH:6.5,spot:0,brindle:0,mask:0,beard:1}},
  {id:'marshall',name:'Marshall',after:61,tool:'bound',toolName:'Super Marshall',line:'Super Marshall!',
    desc:'Her shadow. Once a level, Super Marshall leaps: he flies along the row you choose and lands with a bump. And he is always there: the first time you run out of moves, he gives you 3 more.',
    face:{head:'#F7F5F0',ear:'#1E1A1A',muzzle:'#FFFFFF',earW:4.5,earH:5,spot:1,brindle:0,mask:0,beard:0}},
  {id:'cash',name:'Cash',after:77,tool:'charge',toolName:'Snuggle',line:'Snuggles!',
    desc:'Just very sweet. Once a level, Cash snuggles up: every piece around the one you choose turns into its kind.',
    face:{head:'#8A5A3B',ear:'#5A3622',muzzle:'#B5845F',earW:4,earH:5,spot:0,brindle:1,mask:0,beard:0}},
];

const FULL=Array(8).fill('........');
const MASKS={
  full:null,
  river1:['xx......','x......x','......xx','.....xxx','x......x','xx......','x......x','........'],
  river2:['........','.x....x.','........','xx....xx','xx....xx','........','.x....x.','........'],
  lake:['xx....xx','x......x','........','........','........','........','x......x','xx....xx'],
  octagon:['xx....xx','x......x','........','........','........','........','x......x','xx....xx'],
  plus:['xx....xx','xx....xx','........','........','........','........','xx....xx','xx....xx'],
  shore:['........','........','x.......','xx......','xxx.....','xx......','x.......','........'],
  diamond:['xxx..xxx','xx....xx','x......x','........','........','x......x','xx....xx','xxx..xxx'],
  hourglass:['........','x......x','xx....xx','xxx..xxx','xxx..xxx','xx....xx','x......x','........'],
  pins:['..x..x..','........','........','x......x','x......x','........','........','..x..x..'],
  bridge:['........','........','........','.xx..xx.','.xx..xx.','........','........','........'],
  donut:['........','........','........','...xx...','...xx...','........','........','........'],
  two:['...xx...','...xx...','...xx...','........','........','...xx...','...xx...','...xx...'],
  twoBend:['x...xx..','x...xx..','....x...','........','........','...x....','..xx...x','..xx...x'],
  dune:['xxxx....','xx......','........','........','........','........','......xx','....xxxx'],
  stilts:['xxx..xxx','xx....xx','x......x','........','........','........','x.xxxx.x','x.xxxx.x'],
  market:['........','x.x..x.x','........','........','........','........','........','........'],
  rink:['xxxxxxxx','x......x','........','........','........','........','x......x','xxxxxxxx'],
  pier:['........','........','........','........','........','x.x..x.x','x.x..x.x','x.x..x.x'],
  bay:['........','........','........','........','x......x','xx....xx','xxx..xxx','xxx..xxx'],
  castle:['.x.xx.x.','........','........','........','........','........','...xx...','...xx...'],
  timber:['x......x','.x....x.','........','...xx...','...xx...','........','.x....x.','x......x'],
  ziggurat:['xxx..xxx','xx....xx','xx....xx','x......x','x......x','........','........','........'],
  confluence:['x..xx..x','x...x..x','....x...','........','........','x......x','xx....xx','xxx..xxx'],
  souq:['........','.x.xx.x.','........','........','........','........','.x.xx.x.','........'],
  barn:['xxx..xxx','xx....xx','x......x','........','........','........','........','........'],
  fence:['........','........','x..xx..x','........','........','x..xx..x','........','........'],
};
const ICE_PATTERNS=[
  (x,y)=>x>=2&&x<=5&&y>=2&&y<=5,(x,y)=>y>=5,(x,y)=>x===0||y===0||x===7||y===7,(x,y)=>(x+y)%2===0&&y>=2&&y<=5,
  (x,y)=>x===y||x===7-y,(x,y)=>y<=2,(x,y)=>x<=1||x>=6,(x,y)=>x===2||x===5||y===2||y===5,
  (x,y)=>x===2||x===5,(x,y)=>y>=4&&Math.abs(x-3.5)<=y-3,(x,y)=>(x+2*y)%5<2,(x,y)=>(x<3&&y<3)||(x>4&&y>4),
];
/* Each branch is scripted leaf by leaf so no two leaves in a row play alike: a board shape, what to clear,
   and a twist (which way pieces fall, fish, thick covers, banded rocks). The seed still picks the colours and the
   exact rock spots, so a beat is a recipe, not a fixed layout. ice/quilt = pattern index above. */
const BEATS={
  snow:[{mask:'octagon',types:['crystal'],ice:0,layer:'1'},{mask:'rink',types:['collect'],two:true},{mask:'plus',types:['crystal','score'],ice:5},
    {mask:'full',types:['fish','crystal'],ice:1,fish:5},{mask:'full',types:['crystal','collect'],ice:0,layer:'2'},{mask:'rink',types:['crystal','collect'],ice:7}],
  sun:[{mask:'shore',types:['boulder']},{mask:'full',types:['collect'],two:true},{mask:'hourglass',types:['crystal'],ice:0},
    {mask:'diamond',types:['boulder','collect']},{mask:'pier',types:['fish','collect'],fish:5},{mask:'shore',types:['crystal','collect'],ice:1},
    {mask:'bay',types:['boulder']},{mask:'full',types:['crystal','score'],ice:4},{mask:'hourglass',types:['fish'],fish:6},
    {mask:'diamond',types:['crystal'],ice:3},{mask:'pier',types:['boulder'],hard:true},{mask:'shore',types:['collect'],two:true},
    {mask:'bay',types:['crystal','collect'],ice:3,layer:'2',bonus:6},{mask:'full',types:['boulder','crystal'],ice:10},{mask:'diamond',types:['fish','crystal'],ice:5,fish:5},
    {mask:'hourglass',types:['boulder','collect'],hard:true,bonus:3},{mask:'shore',types:['crystal'],ice:0,layer:'2',bonus:5},{mask:'bay',types:['boulder','crystal'],ice:0,hard:true,bonus:4}],
  lights:[{mask:'full',types:['score']},{mask:'bridge',types:['crystal'],ice:0},{mask:'castle',types:['collect'],two:true},
    {mask:'timber',types:['boulder']},{mask:'donut',types:['crystal'],ice:2,gravity:'left'},{mask:'pins',types:['collect','score']},
    {mask:'market',types:['crystal','score'],ice:5},{mask:'octagon',types:['boulder','crystal'],ice:11,hard:true},{mask:'castle',types:['crystal'],ice:7,layer:'2'},
    {mask:'full',types:['collect'],two:true,gravity:'right'},{mask:'bridge',types:['boulder','collect']},{mask:'timber',types:['crystal'],ice:0},
    {mask:'donut',types:['score','boulder'],gravity:'up'},{mask:'pins',types:['crystal','boulder'],ice:3},{mask:'castle',types:['crystal','boulder'],ice:2,layer:'2',hard:true}],
  rivers:[{mask:'two',types:['boulder']},{mask:'twoBend',types:['collect'],two:true,gravity:'right'},{mask:'ziggurat',types:['crystal','collect'],ice:1},
    {mask:'two',types:['fish','crystal'],ice:8,fish:5},{mask:'confluence',types:['crystal','boulder'],ice:9,layer:'2',hard:true}],
  dune:[{mask:'dune',types:['collect'],two:true},{mask:'souq',types:['crystal','collect'],ice:11,bonus:4},{mask:'diamond',types:['boulder','collect'],gravity:'left'},
    {mask:'full',types:['fish','collect'],fish:6},{mask:'dune',types:['crystal','boulder'],ice:1,layer:'2',hard:true}],
  home:[{mask:'full',types:['collect'],two:true},{mask:'barn',types:['boulder']},{mask:'fence',types:['collect'],gravity:'right'},
    {mask:'plus',types:['boulder','score']},{mask:'donut',types:['collect'],two:true,gravity:'up'},{mask:'octagon',types:['boulder'],hard:true},
    {mask:'barn',types:['boulder','collect']},{mask:'fence',types:['score'],gravity:'left'},{mask:'full',types:['boulder','collect'],hard:true},
    {mask:'plus',types:['collect'],two:true},{mask:'donut',types:['boulder','score'],hard:true},
    {mask:'octagon',types:['patch'],quilt:0},{mask:'full',types:['patch','boulder'],quilt:3},{mask:'barn',types:['patch'],quilt:2},
    {mask:'fence',types:['patch','collect'],quilt:4,bonus:8},{mask:'plus',types:['patch'],quilt:1},{mask:'donut',types:['patch','boulder'],quilt:0,gravity:'right',bonus:4},
    {mask:'octagon',types:['patch','collect'],quilt:2},{mask:'full',types:['patch','boulder'],quilt:4,hard:true}],
};
// Quilt blocks: checkerboard, X, diamond, log-cabin border, nine-patch.
const QUILT_PATTERNS=[
  (x,y)=>(x+y)%2===0&&x>=1&&x<=6&&y>=1&&y<=6,
  (x,y)=>x===y||x===7-y,
  (x,y)=>Math.abs(x-3.5)+Math.abs(y-3.5)<=3,
  (x,y)=>x<2||x>5||y<2||y>5,
  (x,y)=>((x<3||x>4)&&(y<3||y>4))||(x>=3&&x<=4&&y>=3&&y<=4),
];

// Garden City is hand-built: it teaches the basics and ends with the arapaima.
const RIVER1=MASKS.river1,RIVER2=MASKS.river2,LAKE=MASKS.lake;
const FISHA=['...f....','......f.','........','........','........','........','........','........'];
const RAIN=[
  {moves:18,goals:[{t:'score',n:1200}],tip:'Drag a piece onto a neighbor to swap them. Line up 3 or more of the same piece to clear them.'},
  {moves:20,goals:[{t:'collect',c:0,n:14},{t:'collect',c:2,n:14}],tip:'Line up 4 to make a Beam. When it clears, it sweeps its whole line.'},
  {moves:20,layout:MASKS.stilts,goals:[{t:'score',n:1400}],tip:'The board takes the shape it likes. Pieces fall down through the gaps.'},
  {moves:20,layout:FISHA,fish:{n:3,max:2,rate:.12},goals:[{t:'fish',n:3}],
    tip:'Fish drift down as the board clears. Clear the pieces beneath them to bring them home to the pool.'},
  {moves:22,fish:{n:5,max:2,rate:.12},goals:[{t:'fish',n:5},{t:'collect',c:3,n:12}]},
  {moves:22,layout:RIVER2,fish:{n:5,max:2,rate:.13},goals:[{t:'fish',n:5}]},
  {moves:22,goals:[{t:'collect',c:1,n:18},{t:'collect',c:4,n:18}],tip:'Match in an L or T shape to make a Nova. It blasts a diamond around itself.'},
  {moves:24,fish:{n:6,max:3,rate:.14},goals:[{t:'fish',n:6},{t:'collect',c:2,n:14}]},
  {moves:22,layout:MASKS.market,goals:[{t:'score',n:1900}]},
  {moves:25,fish:{n:8,max:3,rate:.16},goals:[{t:'fish',n:8}]},
  {moves:25,layout:RIVER1,fish:{n:6,max:3,rate:.14},goals:[{t:'fish',n:6},{t:'collect',c:0,n:14},{t:'collect',c:3,n:14}]},
  {moves:30,boss:{row:3,x:2,need:70},fish:{n:6,max:2,rate:.1},goals:[{t:'boss'}],big:true,
    tip:'Something large is swimming in the pool. Make matches beside it, or bring it fish, until it is full.'},
];
const CROWN={moves:36,colors:6,
  layout:['........','.pp..pp.','pppppppp','pppppppp','.pppppp.','..pppp..','...pp...','........'],
  goals:[{t:'patch'}],big:true};

const CHAPTER_TIPS={
  snow:{1:'Ice covers some cells. Clear the pieces on top to break it. Thick ice takes two.',
        5:'Line up 5 to make a Prism. Swap it with any piece to clear every one of that kind.'},
  sun:{1:'Coral rocks sit on the board. Make matches beside them to break them. Banded rocks take two.'},
  lights:{1:'Cascades now charge Flux. When it is full, tap an arrow: the edge row on that side spills off and gravity turns to face it.'},
  rivers:{1:'Two channels, one board.'},
  dune:{1:'A sixth charm joins the board.'},
  home:{12:'Stitched squares are waiting for patches. Clear a piece on one to sew a patch in. Fill them all to finish the block.'},
};

const round50=v=>Math.max(50,Math.round(v/50)*50);
function chapterStart(ci){let s=0;for(let c=0;c<ci;c++)s+=CHAPTERS[c].count;return s;}
function chapterOf(n){
  if(n>STORY_TOTAL){const ch=Object.assign({},UNKNOWN,{pal:UNKNOWN_PALS[Math.floor((n-STORY_TOTAL-1)/10)%UNKNOWN_PALS.length]});return {ch,ci:CHAPTERS.length,idx:n-STORY_TOTAL};}
  let s=0;for(let c=0;c<CHAPTERS.length;c++){if(n<=s+CHAPTERS[c].count)return {ch:CHAPTERS[c],ci:c,idx:n-s};s+=CHAPTERS[c].count;}
  return {ch:CHAPTERS[0],ci:0,idx:1};
}
function heritageAt(n){
  const {ch,idx}=chapterOf(n);if(!ch.count)return ch.her[0];
  const t=ch.count>1?(idx-1)/(ch.count-1):0;return ch.her[0]+(ch.her[1]-ch.her[0])*t;
}
function dogsMetBefore(n){return DOGS.filter(d=>n>d.after);}
// Pup tiles start turning up after each dog's Gotcha Day blossom (the leaf after it joins).
function pupsFor(n){const dogs=dogsMetBefore(n).filter(d=>n>d.after+1).map(d=>d.tool);return dogs.length?{dogs,n:1,rate:.05,max:1}:null;}
function toolsFor(n){const t={};for(const d of dogsMetBefore(n))t[d.tool]=1;return t;}
function computeStars(L){
  const sg=L.goals.find(g=>g.t==='score');
  if(sg){L.s2=round50(sg.n*1.5);L.s3=round50(sg.n*2.1);}
  else{L.s2=round50(L.moves*120);L.s3=round50(L.moves*175);}
}
function normalizeLevel(def,n,extra){
  const {ch,idx}=chapterOf(n);
  const L=Object.assign({cols:8,rows:8,colors:ch.colors,gravity:'down',flux:0,tip:''},def,extra||{});
  L.layout=(def.layout||FULL).slice();L.goals=def.goals.map(g=>Object.assign({},g));L.num=n;L.chapter=ch;L.idx=idx;
  L.gravityUnlocked=!!ch.gravity;L.tools=L.tools||toolsFor(n);
  if(L.pups===undefined)L.pups=L.endless||L.daily?null:pupsFor(n);L.shadow=!!L.tools.bound&&!L.endless;
  L.crystalCount=0;L.boulderCount=0;L.patchCount=0;
  for(const row of L.layout)for(const ch2 of row){if(ch2==='1'||ch2==='2')L.crystalCount++;if(ch2==='o'||ch2==='O')L.boulderCount++;if(ch2==='p')L.patchCount++;}
  computeStars(L);return L;
}
// One generator for every non-hand-built level. Seeded by key, so the same key always yields the same level.
function generate(n,key,opt){
  const r=makeRng(hashStr(key));
  const pick=a=>a[Math.floor(r()*a.length)];
  const {ch,idx}=chapterOf(n);
  const maskNames=opt.masks||Object.keys(MASKS);
  const B=opt.beat||null;
  const mask=MASKS[B?B.mask:pick(maskNames)];
  const grid=[];for(let y=0;y<8;y++){grid.push([]);for(let x=0;x<8;x++)grid[y].push(mask&&mask[y][x]==='x'?'x':'.');}
  const colors=opt.colors;
  const tier=Math.min(1,Math.max(0,(n-12)/100));
  let types;
  if(B)types=B.types.slice();
  else{const primary=opt.forcePrimary||pick(opt.types);let secondary=null;
    if(opt.secondaryChance&&r()<opt.secondaryChance)secondary=pick(opt.types.concat(opt.extra||[]).filter(t=>t!==primary&&t!=='score'));
    types=[primary,secondary].filter(Boolean);}
  let moves=22+Math.floor(r()*5);
  const goals=[];const def={};
  if(types.includes('crystal')){
    const pat=B&&B.ice!=null?ICE_PATTERNS[B.ice]:pick(ICE_PATTERNS);const layer=B&&B.layer?B.layer:(n>30&&r()<0.3+tier*0.3)?'2':'1';let cnt=0;
    for(let y=0;y<8;y++)for(let x=0;x<8;x++)if(grid[y][x]==='.'&&pat(x,y)){grid[y][x]=layer;cnt++;}
    if(!cnt){for(let y=3;y<5;y++)for(let x=3;x<5;x++)if(grid[y][x]==='.'){grid[y][x]='1';cnt++;}}
    if(cnt){moves+=Math.round(cnt*(layer==='2'?0.85:0.5))+2;goals.push({t:'crystal'});}
  }
  if(types.includes('patch')){
    const pat=B&&B.quilt!=null?QUILT_PATTERNS[B.quilt]:pick(QUILT_PATTERNS);let cnt=0;
    for(let y=0;y<8;y++)for(let x=0;x<8;x++)if(grid[y][x]==='.'&&pat(x,y)){grid[y][x]='p';cnt++;}
    if(cnt){moves+=Math.round(cnt*0.42);goals.push({t:'patch'});}
  }
  if(types.includes('boulder')){
    const pairs=2+Math.floor(r()*3);let placed=0;
    for(let k=0;k<60&&placed<pairs;k++){
      const x=Math.floor(r()*4),y=Math.floor(r()*6);
      if(grid[y][x]!=='.'||grid[y][7-x]!=='.')continue;
      const c2=B&&B.hard?(placed%2?'O':'o'):(n>28&&r()<0.35+tier*0.3)?'O':'o';grid[y][x]=c2;grid[y][7-x]=c2;placed++;
    }
    if(placed){moves+=placed*2;goals.push({t:'boulder'});}
  }
  if(types.includes('fish')){
    const fn=B&&B.fish?B.fish:4+Math.floor(r()*4);def.fish={n:fn,max:r()<.5?2:3,rate:.13};goals.push({t:'fish',n:fn});moves+=Math.round(fn*1.2);
  }
  if(types.length>1)moves+=3;
  if(colors===6&&(types.includes('crystal')||types.includes('patch')))moves+=2;
  moves=Math.max(16,moves-Math.round(tier*4));
  if(types.includes('collect')){
    const two=B?!!B.two:types.length===1&&r()<0.6;const c1=Math.floor(r()*colors);const c2=(c1+1+Math.floor(r()*(colors-1)))%colors;
    const per=(two?0.8:1.0)*(colors===6?0.85:1);
    goals.push({t:'collect',c:c1,n:Math.round(moves*per)});
    if(two)goals.push({t:'collect',c:c2,n:Math.round(moves*per)});
  }
  if(types.includes('score')||!goals.length)goals.unshift({t:'score',n:round50(moves*(colors===6?70:85))});
  if(B&&B.bonus)moves+=B.bonus; // spare moves for awkward boards; goals were already sized above
  const gravity=B?(B.gravity||'down'):(opt.gravity&&r()<0.2)?pick(['up','left','right']):'down';
  return Object.assign(def,{moves,colors,gravity,goals,layout:grid.map(row=>row.join(''))});
}
function getLevel(n){
  if(n<=RAIN.length)return normalizeLevel(RAIN[n-1],n);
  if(n===STORY_TOTAL)return normalizeLevel(CROWN,n);
  const {ch,idx}=chapterOf(n);
  if(n<STORY_TOTAL){
    const quilt=ch.id==='home'&&n>=QUILT_FROM;
    const opt={beat:BEATS[ch.id]&&BEATS[ch.id][idx-1],types:ch.types,masks:ch.masks,colors:ch.colors,gravity:ch.gravity,
      secondaryChance:CHAPTERS.indexOf(ch)>=2?0.45:0.2,extra:ch.id==='snow'||ch.id==='sun'?['fish']:[],
      forcePrimary:quilt?'patch':(idx===1&&ch.id==='snow'?'crystal':idx===1&&ch.id==='sun'?'boulder':null)};
    const def=generate(n,'maria-level-'+n,opt);
    const tip=CHAPTER_TIPS[ch.id]&&CHAPTER_TIPS[ch.id][idx];
    if(tip)def.tip=tip;
    if(ch.id==='lights'&&idx===1)def.flux=100;
    if(idx===1)def.gravity='down';
    return normalizeLevel(def,n);
  }
  return normalizeLevel(generate(n,'maria-level-'+n,{types:['collect','crystal','boulder','fish','patch','score'],colors:6,gravity:true,secondaryChance:0.5}),n);
}
function dailyLevel(dateStr,metN){
  const n=Math.max(metN,STORY_TOTAL+1);
  const def=generate(n,'maria-daily-'+dateStr,{types:['collect','crystal','boulder','fish','patch','score'],colors:6,gravity:true,secondaryChance:0.5});
  return normalizeLevel(def,n,{tools:toolsFor(metN),daily:dateStr});
}
function endlessLevel(metN){
  return normalizeLevel({moves:Infinity,colors:5,goals:[]},Math.max(metN,STORY_TOTAL+1),{tools:toolsFor(metN),endless:true});
}

/*__FESTIVALS__*/
/* ---------- cheers: what the board calls out on each success, in the voice of each era ---------- */
const CHEER_ACTIONS=["cascade", "chain", "beam", "nova", "prism", "combo", "fish", "goal", "boss", "dog", "win"];
const CHEERS={
  rain:{"cascade": "Oooh-meh!", "chain": "One one dutty does mek dam!", "beam": "Yuh sharp!", "nova": "Watch she deh!", "prism": "Fu true?", "combo": "Watch she run speed speed!", "fish": "Nuff nuff!", "goal": "Col col swank fuh yuh!", "boss": "Gi Jack he jacket!", "dog": "Leh we go!", "win": "Kite raise high high!"},
  snow:{"cascade": "Oooh-meh!", "chain": "Totally tubular!", "beam": "Rad!", "nova": "Wicked!", "prism": "Totally rad!", "combo": "Wicked, eh!", "fish": "Awesome!", "goal": "Beauty!", "dog": "Give'r!", "win": "Beauty, eh!"},
  sun:{"cascade": "Word!", "chain": "That's da bomb!", "beam": "Fly!", "nova": "Phat!", "prism": "Watch she deh!", "combo": "Super fly, bro!", "fish": "Sweet, bro!", "goal": "Dale!", "dog": "Que cute!", "win": "Booyah!"},
  lights:{"cascade": "Super!", "chain": "Wahnsinn!", "beam": "Toll!", "nova": "Klasse!", "prism": "Spitze!", "combo": "Wunderbar!", "fish": "Sehr gut!", "goal": "Na also!", "dog": "Genau!", "win": "Wunderbar!"},
  rivers:{"cascade": "Zein!", "chain": "Kulish zein!", "beam": "Yalla!", "nova": "Wallah!", "prism": "Mashallah!", "combo": "Kulish zein!", "fish": "Zein!", "goal": "Yalla, khalas!", "dog": "Habibti!", "win": "Yalla, khalas!"},
  dune:{"cascade": "Zain!", "chain": "Mashallah!", "beam": "Yalla!", "nova": "Mafi mushkila!", "prism": "Mashallah!", "combo": "Wallah, habibti!", "fish": "Zain!", "goal": "Khalas!", "dog": "Habibti!", "win": "Mabrook!"},
  home:{"cascade": "Hot dang!", "chain": "All y'all see that?", "beam": "Boy howdy!", "nova": "Well, look at that!", "prism": "Well I'll be!", "combo": "Fine as cream gravy!", "fish": "Atta girl!", "goal": "Gi Jack he jacket!", "dog": "Atta girl!", "win": "Fine as cream gravy!"},
};
// One cheer per success action, per era. Into the unknown borrows a whole era per level.
function cheerForLevel(L,action){if(L&&L.fest){const o=L.festCheers||{};return o[action]||L.chapter.cheers[action]||cheerFor(L.host,action);}return cheerFor(L.num,action);}
function cheerFor(n,action){
  const {ch}=chapterOf(n);let set=CHEERS[ch.id];
  if(!set){const ids=Object.keys(CHEERS);set=CHEERS[ids[hashStr('era-'+n)%ids.length]];}
  return set[action]||set.win;
}
