// Liang–Barsky clipping also handles vertical, horizontal and zero-length segments.
export function segmentHitsRect(a,b,r,pad=8){
 let lo=0,hi=1;const dx=b.x-a.x,dy=b.y-a.y;
 for(const [p,q] of [[-dx,a.x-r.left+pad],[dx,r.right+pad-a.x],[-dy,a.y-r.top+pad],[dy,r.bottom+pad-a.y]]){
  if(p===0){if(q<0)return false;continue;}
  const t=q/p;if(p<0)lo=Math.max(lo,t);else hi=Math.min(hi,t);if(lo>hi)return false;
 }
 return true;
}
