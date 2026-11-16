const {play,BONUS,bonusLevel,bonusName}=require('./sim.js');
(async()=>{const T=+process.argv[2]||10;
 for(const b of BONUS){const n=b.after;let w=0,lefts=[];
  for(let t=0;t<T;t++){const r=await play(n,t,true);if(r.err){lefts.push('ERR '+r.err);continue;}if(r.res)w++;else lefts.push(r.left.join(' '));}
  const L=bonusLevel(n,n);console.log(`B${n} ${bonusName(b)} k${L.festK} m=${L.moves} g=${L.goals.map(g=>g.t+(g.n?':'+g.n:'')).join(',')} | win=${(w/T*100)|0}%${lefts.length?' ex:'+lefts[0]:''}`);}})();
