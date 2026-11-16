/* ---------- festivals: bonus leaves that bloom for a few weeks each year ----------
   Three bonus levels per festival, fresh every year (seeded by festival + season year).
   Windows are set so no more than two festivals are ever open at once. */
Object.assign(MASKS,{
  diya:['xxx..xxx','xx....xx','x......x','........','........','........','x......x','xx....xx'],
  firtree:['xxx..xxx','xx....xx','x......x','xx....xx','x......x','........','........','xxx..xxx'],
  pumpkin:['xxx..xxx','x......x','........','........','........','........','x......x','xx....xx'],
  pie:['........','........','x......x','x......x','xx....xx','xx....xx','xxx..xxx','xxx..xxx'],
  pennant:['........','.......x','......xx','.....xxx','.....xxx','......xx','.......x','........'],
});
const FESTIVALS=[
  {id:'carnival',name:'Carnival',line:'Costume bands, steel pan and soca all down the road.',
  inst:'pan',motif:'mash',cover:'confetti',mask2:'full',her:[1,1],colors:5,sig:2,mask:'pennant',types2:['crystal','collect'],types3:['boulder','collect','score'],
   tip:'A bonus blossom: the bands are on the road.',
   pal:{bg:'#FFF6E0',bg2:'#FCE7B8',panel:'#FFFCF4',ink:'#2B2A1E',muted:'#5C5A44',line:'rgba(43,42,30,.14)',accent:'#1E8A4C',frame:'#F2D88A',cell:'#FFFAEC',cellAlt:'#FBEFD0',rock:'#8A6A3A',water:'#7FC4B4',motif:'#1E8A4C',motif2:'#E8553B',quilt:['#1E8A4C','#F2B705','#E8553B']},
   cheers:{combo:'Jump up!',goal:'Road march!',win:'Play mas!'}},
  {id:'easter',name:'Easter Kites',line:'Hot cross buns in the morning, kites singing over the seawall by noon.',
   inst:'glock',motif:'easter',cover:'sand',her:[1,1],colors:5,sig:2,mask:'kite',types2:['collect','score'],types3:['crystal','collect','score'],
   tip:'A bonus blossom: get the kites up.',
   pal:{bg:'#EAF4FB',bg2:'#D6EAF6',panel:'#FBFDFF',ink:'#1E2F45',muted:'#4A5E78',line:'rgba(30,47,69,.14)',accent:'#E0508E',frame:'#C9DDEF',cell:'#F4F9FD',cellAlt:'#E6F0F8',rock:'#8A7A6A',water:'#8CC9C0',motif:'#5F84E2',motif2:'#E0508E',quilt:['#E0508E','#5F84E2','#F2B705']},
   cheers:{combo:'Kite raise high high!',goal:'Pull it, pull it!',win:'Happy Easter!'}},
  {id:'halloween',name:'Pumpkin Night',line:'Costumes on, a pillowcase for candy, every porch light lit.',
  inst:'marimba',motif:'halloween',cover:'web',her:[.3,.3],colors:5,sig:1,mask:'pumpkin',types2:['crystal','collect'],types3:['boulder','collect','score'],dark:true,
   tip:'A bonus blossom: costumes on, porch lights lit.',
   pal:{bg:'#2A1F3D',bg2:'#3A2B52',panel:'#3B2D55',ink:'#FBEFE4',muted:'#CDBEDC',line:'rgba(251,239,228,.16)',accent:'#EE9F2E',frame:'#5A4478',cell:'#42345E',cellAlt:'#4A3B68',rock:'#7A6A8A',water:'#5F84E2',motif:'#EE9F2E',motif2:'#B7A0E0',quilt:['#EE9F2E','#9562D2','#5E7A2E']},
   cheers:{combo:'Monster mash!',goal:'Treats!',win:'Happy Halloween!'}},
  {id:'diwali',name:'Festival of Lights',line:'Diyas on every step, and the whole road lit up.',
  inst:'pluck',motif:'diwali',her:[1,1],colors:5,sig:1,mask:'diya',types2:['boulder','collect'],types3:['collect','score','boulder'],dark:true,
   tip:'A bonus blossom: light the diyas.',
   pal:{bg:'#24163F',bg2:'#33205A',panel:'#2F1F52',ink:'#FFF3E0',muted:'#E3CDEB',line:'rgba(255,243,224,.16)',accent:'#F2B705',frame:'#5B3A8C',cell:'#3A2862',cellAlt:'#43306E',rock:'#8A6A5A',water:'#5F84E2',motif:'#F2B705',motif2:'#F4A6C0',quilt:['#F2B705','#E0508E','#9562D2']},
   cheers:{combo:'Look at de lights!',goal:'Shubh Diwali!',win:'Shubh Deepavali!'}},
  {id:'thanks',name:'Harvest Table',line:'A long table, a full house, one more chair pulled up.',
  inst:'acoustic',motif:'thanks',cover:'flour',her:[.35,.35],colors:5,sig:1,mask:'pie',types2:['crystal','collect'],types3:['boulder','collect','score'],
   tip:'A bonus blossom: the table is set.',
   pal:{bg:'#FBF1E4',bg2:'#F3DEC4',panel:'#FFF9F1',ink:'#3A2418',muted:'#6E5444',line:'rgba(58,36,24,.14)',accent:'#B5532D',frame:'#E8C9A4',cell:'#FFF5E8',cellAlt:'#F7E6D0',rock:'#8A6A4A',water:'#8CC9C0',motif:'#B5532D',motif2:'#C9A227',quilt:['#B5532D','#C9A227','#7A9A4A']},
   cheers:{combo:'Pass the gravy!',goal:'Thankful!',win:'Happy Thanksgiving!'}},
  {id:'xmas',name:'Black Cake and Carols',line:'Black cake soaking, pepperpot on the stove, carols on the radio.',
  inst:'bells',motif:'xmas',cover:'ice',her:[.6,.6],colors:5,sig:2,mask:'firtree',types2:['crystal','collect'],types3:['crystal','collect','score'],
   tip:'A bonus blossom: black cake and carols.',
   pal:{bg:'#F4F0EA',bg2:'#E6DED2',panel:'#FFFCF7',ink:'#2A1A1A',muted:'#5E4A44',line:'rgba(42,26,26,.14)',accent:'#B3202F',frame:'#D9C8B0',cell:'#FBF6EF',cellAlt:'#F1E8DC',rock:'#7A5A3A',water:'#8CC9C0',motif:'#1E6B4C',motif2:'#B3202F',quilt:['#B3202F','#1E6B4C','#F2B705']},
   cheers:{combo:'Ho ho ho!',goal:'Merry merry!',win:'Merry Christmas!'}},
];
/* Life moments: bonus blossoms that aren't holidays. inst/key left out = the era's own. */
FESTIVALS.push(
  {id:'harvest',set:'rain',name:"Grandpa's Ponds",line:'Early morning at the ponds, nets out, everybody helping.',
   inst:'pan',motif:'garden',her:[1,1],colors:5,sig:2,
   recipe:()=>({types:['fish'],masks:['river1','lake'],forcePrimary:'fish',secondaryChance:0}),
   tip:'A bonus blossom: bring the fish home to the ponds.',
   pal:Object.assign({},CHAPTERS[0].pal,{accent:'#2F7F86'}),
   cheers:{combo:'Nuff nuff!',goal:'Full net!',win:'Gi Jack he jacket!'}},
  {id:'gotcha',name:'Gotcha Day',line:'The day she came home.',motif:'gotcha',her:[.3,.3],colors:5,sig:4,
   recipe:()=>({types:['collect'],masks:['full']}),
   tip:'A bonus blossom: her helper is unlimited today, and her face turns up on the board.',
   pal:{bg:'#FFF4EC',bg2:'#F8E2D2',panel:'#FFFBF7',ink:'#3A2A22',muted:'#6E5A4E',line:'rgba(58,42,34,.14)',accent:'#C27A3A',frame:'#EBD3BF',cell:'#FFF8F2',cellAlt:'#F6E9DD',rock:'#8A7A6A',water:'#8CC9C0',motif:'#C27A3A',motif2:'#E0508E',quilt:['#C27A3A','#E0508E','#5F84E2']},
   cheers:{combo:"Who's a good pup?",goal:'Treat time!',win:'Gotcha!'}},
  {id:'moving',name:'Moving Day',line:'Everything in boxes by the door.',motif:'moving',her:[.3,.3],colors:5,sig:1,
   recipe:()=>({types:['boulder','collect'],masks:['full'],forcePrimary:'boulder',secondaryChance:1}),
   tip:'A bonus blossom: pack the boxes, shift the heavy things.',
   pal:{bg:'#F3EDE4',bg2:'#E7DCCB',panel:'#FFFBF5',ink:'#3A2E24',muted:'#6B5D50',line:'rgba(58,46,36,.14)',accent:'#B5874A',frame:'#E2D3BC',cell:'#FAF5ED',cellAlt:'#EFE6D8',rock:'#8A7A6A',water:'#8CC9C0',motif:'#B5874A',motif2:'#E0508E',quilt:['#B5874A','#E0508E','#5F84E2']},
   cheers:{combo:'Heave ho!',goal:'All packed!',win:'Next stop!'}},
  {id:'quilt',name:'Quilt Show',line:'Quilts hung in rows, and one of them is hers.',motif:'quiltshow',her:[.35,.35],colors:5,sig:4,
   recipe:()=>({types:['patch','collect'],masks:['full'],forcePrimary:'patch',secondaryChance:1}),
   tip:'A bonus blossom: sew every patch.',
   pal:{bg:'#F7F0F8',bg2:'#ECDDEF',panel:'#FFFBFE',ink:'#3A2440',muted:'#6A5470',line:'rgba(58,36,64,.14)',accent:'#9562D2',frame:'#E3CFE8',cell:'#FCF7FD',cellAlt:'#F1E6F4',rock:'#8A7A8A',water:'#8CC9C0',motif:'#9562D2',motif2:'#E0508E',quilt:['#9562D2','#E0508E','#F2B705']},
   cheers:{combo:'Stitched up!',goal:'Blue ribbon!',win:'Best in show!'}},
);
const DOGPAL={gypsy:{accent:'#B8862F',motif:'#B8862F'},zoya:{accent:'#7D8A99',motif:'#7D8A99'},marshall:{accent:'#3A3A3A',motif:'#3A3A3A'},cash:{accent:'#7A4A2A',motif:'#7A4A2A'}};
FESTIVALS.forEach(f=>{f.gravity=false;f.count=1;f.fest=true;});
Object.assign(MASKS,{kite:['xx....xx','x......x','........','........','........','x......x','xx....xx','xxx..xxx']});
/* Where bonus blossoms open along her life. Finishing the leaf opens the blossom beside it.
   A festival that comes back later is a little harder each time (k = 1, 2, 3). */
const BONUS=[
  {after:4,id:'easter'},{after:6,id:'harvest'},{after:8,id:'diwali'},{after:11,id:'carnival',cheers:{win:'Happy Mash!'}},
  {after:12,id:'moving',line:'One last look at the old house on stilts.'},
  {after:14,id:'halloween'},{after:17,id:'xmas',cheers:{combo:'Black cake fuh yuh!'}},
  {after:18,id:'moving',line:'Boxes by the door. South, to the sun.'},
  {after:21,id:'thanks'},{after:25,id:'halloween'},{after:29,id:'diwali'},{after:33,id:'carnival'},
  {after:35,id:'gotcha',dog:'gypsy'},
  {after:36,id:'moving',line:'Gypsy rides in the carrier, all the way across the sea.'},
  {after:40,id:'gotcha',dog:'zoya'},
  {after:44,id:'xmas',cheers:{win:'Frohe Weihnachten!',goal:'Wunderbar!'}},
  {after:51,id:'moving',line:'Packing for somewhere new, and far.'},
  {after:56,id:'moving',line:'A short hop across the water.'},
  {after:61,id:'moving',line:'This time, to stay.',cheers:{win:'Home!'}},
  {after:62,id:'gotcha',dog:'marshall'},
  {after:64,id:'thanks'},{after:67,id:'easter'},{after:70,id:'diwali'},{after:74,id:'halloween'},
  {after:76,id:'quilt'},
  {after:78,id:'gotcha',dog:'cash'},
  {after:79,id:'xmas',cheers:{combo:'Black cake fuh yuh!'}},
];
(()=>{const seen={};for(const b of BONUS){seen[b.id]=(seen[b.id]||0)+1;b.k=Math.min(3,seen[b.id]);}})();
// Into the unknown: now and then, a festival comes round again.
function bonusAt(n){
  if(n<=STORY_TOTAL)return BONUS.find(b=>b.after===n)||null;
  const h=hashStr('bonus-'+n);if(h%7!==3)return null;
  const pool=['carnival','easter','halloween','diwali','thanks','xmas','quilt'];return {after:n,id:pool[(h>>>4)%pool.length],k:2+((h>>>8)%2)};
}
function bonusLevel(n,metN){
  const b=bonusAt(n);if(!b)return null;
  const f=FESTIVALS.find(x=>x.id===b.id),k=b.k;
  const dn=Math.min(Math.max(n,12),70);
  const recipe=f.recipe?f.recipe(k,b):k===1?{types:['collect'],masks:['full']}:k===2?{types:f.types2,masks:[f.mask2||f.mask],forcePrimary:f.types2[0],secondaryChance:1}
    :{types:f.types3,masks:[f.mask],forcePrimary:f.types3[0],secondaryChance:1};
  const def=generate(dn,'bonus-'+b.id+'-'+n,Object.assign({colors:f.colors,gravity:false},recipe));
  def.moves+=f.recipe?(b.id==='quilt'?5:3):[0,3,6,7][k];def.gravity='down';
  const cg=def.goals.filter(g=>g.t==='collect');
  if(cg[0])cg[0].c=f.sig;if(cg[1]&&cg[1].c===f.sig)cg[1].c=(f.sig+1)%f.colors;
  const covered=def.goals.some(g=>g.t==='crystal');
  cg.forEach(g=>{g.n=Math.max(10,Math.round(g.n*(covered?.6:.8)));}); // bonus blossoms are a little kinder
  const tools=toolsFor(metN),dog=b.dog&&DOGS.find(d=>d.id===b.dog);
  if(dog)tools[dog.tool]=99;
  const pups=dog?{dogs:[dog.tool],n:8,rate:.09,max:2,start:1}:undefined;
  def.tip=dog?`A bonus blossom: ${dog.name}'s ${dog.toolName} is unlimited today. Match beside ${dog.name}'s face on the board for help right there.`:f.tip;
  const L=normalizeLevel(def,dn,Object.assign({tools,fest:b.id,bonus:n,festK:k,festCheers:b.cheers||null},pups?{pups}:{}));
  L.chapter=Object.assign({},f,{name:bonusName(b),line:b.line||(dog?`The day ${dog.name} came home.`:f.line),pal:dog?Object.assign({},f.pal,DOGPAL[dog.id]):f.pal});L.host=n;L.gravityUnlocked=false;L.idx=k;computeStars(L);
  return L;
}
function bonusName(b){const f=FESTIVALS.find(x=>x.id===b.id),d=b.dog&&DOGS.find(x=>x.id===b.dog);return d?`${d.name}'s Gotcha Day`:f.name;}
