const {play,getLevel,chapterOf}=require('./sim.js');
(async()=>{const T=+process.argv[2]||8,from=+process.argv[3]||1,to=+process.argv[4]||80;
 for(let n=from;n<=to;n++){let w=0,st=0,errs=[],lefts=[];
  for(let t=0;t<T;t++){const r=await play(n,t);if(r.err){errs.push(r.err);continue;}if(r.res)w++;st+=r.stars;if(!r.res)lefts.push(r.left.join(' '));}
  const L=getLevel(n);const {ch,idx}=chapterOf(n);
  console.log(`L${n} ${ch.id}#${idx} m=${L.moves} c=${L.colors} g=${L.goals.map(g=>g.t+(g.n?':'+g.n:'')).join(',')} tools=${Object.keys(L.tools).join('')} | win=${(w/T*100)|0}% avgStars=${(st/T).toFixed(1)}${errs.length?' ERR '+errs[0]:''}${lefts.length?' ex:'+lefts[0]:''}`);}})();
