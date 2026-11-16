/* SVG piece art -> image. Colours derive from the slot colour so goals keep reading by colour. */
function artMix(hex,t,to){const n=parseInt(hex.slice(1),16),a=[n>>16,n>>8&255,n&255],b=to==='w'?[255,255,255]:[0,0,0];
  return '#'+a.map((v,i)=>Math.round(v+(b[i]-v)*t).toString(16).padStart(2,'0')).join('');}
function artURI(body,col){
  const C=col,D=artMix(col,.5,'k'),L=artMix(col,.45,'w'),M=artMix(col,.22,'k');
  const defs=`<defs><linearGradient id="g" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="${L}"/><stop offset=".45" stop-color="${C}"/><stop offset="1" stop-color="${M}"/></linearGradient>
<linearGradient id="h" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${M}"/><stop offset=".3" stop-color="${L}"/><stop offset=".6" stop-color="${C}"/><stop offset="1" stop-color="${M}"/></linearGradient>
<radialGradient id="r" cx=".36" cy=".3" r=".75"><stop offset="0" stop-color="${L}"/><stop offset=".5" stop-color="${C}"/><stop offset="1" stop-color="${M}"/></radialGradient>
<radialGradient id="p" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#F1EAF6"/><stop offset="1" stop-color="#C9C0D6"/></radialGradient>
<filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2.6" stdDeviation="1.4" flood-color="${D}" flood-opacity=".45"/></filter></defs>`;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-50 -50 100 100" width="256" height="256">${defs}<g filter="url(#s)">${body.replace(/\$C/g,C).replace(/\$D/g,D).replace(/\$L/g,L).replace(/\$M/g,M)}</g></svg>`;
  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);}
